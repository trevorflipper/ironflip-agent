import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { registerExactSvmScheme } from "@x402/svm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { declareDiscoveryExtension, bazaarResourceServerExtension } from "@x402/extensions/bazaar";
import { NearClient } from "./near-client.js";
import { NearService } from "./near-service.js";
import { SolanaClient } from "./solana-client.js";
import { SolanaService } from "./solana-service.js";
import * as analytics from "./analytics.js";
import { DASHBOARD_HTML } from "./dashboard.js";
import { OPENAPI_SPEC, AGENT_CARD, AI_PLUGIN, LLMS_TXT } from "./discovery.js";
import path from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.X402_PORT || "8084", 10);
const HOST = process.env.X402_HOST || "127.0.0.1";

// Solana wallet address to receive USDC payments.
// Set via X402_PAY_TO env var. If not set, gateway runs in free/demo mode.
const PAY_TO = process.env.X402_PAY_TO || "";

// Solana mainnet CAIP-2 identifier
const NETWORK = (process.env.X402_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") as `${string}:${string}`;

// AutoIncentive facilitator — free, supports Solana mainnet + Base
const FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL || "https://facilitator.x402endpoints.online";

const FREE_MODE = !PAY_TO;

// ─── Analytics DB ─────────────────────────────────────────────────────────────

const DB_PATH = process.env.ANALYTICS_DB_PATH || path.resolve(process.cwd(), "analytics.db");
analytics.initDb(DB_PATH);

// ─── NEAR Client ─────────────────────────────────────────────────────────────

const nearClient = new NearClient();
const nearService = new NearService(nearClient);

// ─── Solana Client ────────────────────────────────────────────────────────────

const solanaClient = new SolanaClient();
const solanaService = new SolanaService(solanaClient);

// ─── Express App ─────────────────────────────────────────────────────────────

const app = express();
app.set("trust proxy", true);
app.use(express.json());

// ─── Request Logging Middleware ───────────────────────────────────────────────

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    // Skip logging analytics/dashboard requests to avoid noise
    if (req.path.startsWith("/api/analytics") || req.path === "/dashboard") return;
    try {
      analytics.logRequest({
        method: req.method,
        path: req.path,
        status_code: res.statusCode,
        ip: req.ip || req.socket.remoteAddress || "",
        user_agent: (req.headers["user-agent"] || "").slice(0, 512),
        response_time_ms: Date.now() - start,
      });
    } catch (_) {
      // Don't let analytics errors break requests
    }
  });
  next();
});

// ─── Dashboard & Analytics API (free, before x402 middleware) ─────────────────

app.get("/dashboard", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(DASHBOARD_HTML);
});

app.get("/api/analytics/summary", (_req, res) => {
  res.json(analytics.getStats());
});

app.get("/api/analytics/payments", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
  res.json(analytics.getRecentPayments(limit));
});

app.get("/api/analytics/payers", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
  res.json(analytics.getTopPayers(limit));
});

app.get("/api/analytics/endpoints", (_req, res) => {
  res.json(analytics.getEndpointStats());
});

app.get("/api/analytics/timeseries", (req, res) => {
  const period = req.query.period === "hour" ? "hour" : "day";
  res.json(analytics.getTimeSeries(period));
});

// ─── Agent Discovery (free, no x402) ──────────────────────────────────────────

app.get("/openapi.json", (_req, res) => { res.json(OPENAPI_SPEC); });
app.get("/openapi.yaml", (_req, res) => {
  res.setHeader("Content-Type", "text/yaml");
  // Serve JSON with yaml content-type — most consumers parse both
  res.send(JSON.stringify(OPENAPI_SPEC, null, 2));
});
app.get("/.well-known/agent-card.json", (_req, res) => { res.json(AGENT_CARD); });
app.get("/.well-known/ai-plugin.json", (_req, res) => { res.json(AI_PLUGIN); });
app.get("/llms.txt", (_req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(LLMS_TXT);
});

// Health check (always free)
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "near-x402-gateway",
    mode: FREE_MODE ? "free" : "paid",
    network: NETWORK,
    near_network: process.env.NEAR_NETWORK_ID || "mainnet",
  });
});

// API info (always free)
app.get("/", (_req, res) => {
  res.json({
    name: "x402 Blockchain Data API",
    version: "2.0.0",
    description: "Pay-per-call multi-chain blockchain data API powered by x402 (NEAR + Solana)",
    mode: FREE_MODE ? "free (no wallet configured)" : "paid",
    chains: {
      near: {
        endpoints: {
          "GET /api/near/account/[id]/balance": { price: "$0.001", description: "Account balance" },
          "GET /api/near/account/[id]/keys": { price: "$0.001", description: "Access keys" },
          "GET /api/near/tx/[hash]": { price: "$0.001", description: "Transaction details" },
          "GET /api/near/validators": { price: "$0.002", description: "Active validators" },
          "GET /api/near/validators/[id]": { price: "$0.001", description: "Validator details" },
          "GET /api/near/account/[id]/staking": { price: "$0.002", description: "Staking delegations" },
          "GET /api/near/nft/[contract]/tokens": { price: "$0.002", description: "NFT tokens" },
          "GET /api/near/defi/pools": { price: "$0.005", description: "Ref Finance pools" },
        },
      },
      solana: {
        endpoints: {
          "GET /api/solana/account/[id]/balance": { price: "$0.001", description: "SOL balance" },
          "GET /api/solana/account/[id]/info": { price: "$0.001", description: "Account info" },
          "GET /api/solana/account/[id]/tokens": { price: "$0.002", description: "SPL token holdings" },
          "GET /api/solana/account/[id]/stakes": { price: "$0.002", description: "Stake accounts" },
          "GET /api/solana/account/[id]/transactions": { price: "$0.002", description: "Recent transactions" },
          "GET /api/solana/tx/[signature]": { price: "$0.001", description: "Transaction details" },
          "GET /api/solana/validators": { price: "$0.002", description: "Vote accounts / validators" },
          "GET /api/solana/tokens/prices": { price: "$0.002", description: "Top token prices (Jupiter)" },
          "GET /api/solana/network/stats": { price: "$0.002", description: "Network stats (epoch, TPS, supply)" },
        },
      },
    },
    analytics: {
      dashboard: "/dashboard",
      api: "/api/analytics/summary",
    },
    payment: FREE_MODE
      ? "Gateway running in free mode. Set X402_PAY_TO to enable payments."
      : { chain: "Solana", token: "USDC", network: NETWORK, payTo: PAY_TO },
  });
});

// ─── x402 Payment Middleware ─────────────────────────────────────────────────

// Price map used by both payment middleware and the onAfterSettle hook
const PRICE_MAP: Record<string, string> = {
  // NEAR endpoints
  "GET /api/near/account/[id]/balance": "$0.001",
  "GET /api/near/account/[id]/keys": "$0.001",
  "GET /api/near/tx/[hash]": "$0.001",
  "GET /api/near/validators": "$0.002",
  "GET /api/near/validators/[id]": "$0.001",
  "GET /api/near/account/[id]/staking": "$0.002",
  "GET /api/near/nft/[contract]/tokens": "$0.002",
  "GET /api/near/defi/pools": "$0.005",
  // Solana endpoints
  "GET /api/solana/account/[id]/balance": "$0.001",
  "GET /api/solana/account/[id]/info": "$0.001",
  "GET /api/solana/account/[id]/tokens": "$0.002",
  "GET /api/solana/account/[id]/stakes": "$0.002",
  "GET /api/solana/account/[id]/transactions": "$0.002",
  "GET /api/solana/tx/[signature]": "$0.001",
  "GET /api/solana/validators": "$0.002",
  "GET /api/solana/tokens/prices": "$0.002",
  "GET /api/solana/network/stats": "$0.002",
};

// ─── Bazaar Discovery Metadata ────────────────────────────────────────────────

const ROUTE_DISCOVERY: Record<string, ReturnType<typeof declareDiscoveryExtension>> = {
  // NEAR endpoints
  "GET /api/near/account/[id]/balance": declareDiscoveryExtension({
    input: { id: "example.near" },
    inputSchema: { properties: { id: { type: "string", description: "NEAR account ID" } }, required: ["id"] },
    output: { example: { account_id: "example.near", balance: "1000000000000000000000000", balance_near: "1.0" } },
  }),
  "GET /api/near/account/[id]/keys": declareDiscoveryExtension({
    input: { id: "example.near" },
    inputSchema: { properties: { id: { type: "string", description: "NEAR account ID" } }, required: ["id"] },
    output: { example: { account_id: "example.near", keys: [{ public_key: "ed25519:...", access_key: { permission: "FullAccess" } }] } },
  }),
  "GET /api/near/tx/[hash]": declareDiscoveryExtension({
    input: { hash: "abc123", sender_id: "example.near" },
    inputSchema: { properties: { hash: { type: "string", description: "Transaction hash" }, sender_id: { type: "string", description: "Sender account ID (query param)" } }, required: ["hash", "sender_id"] },
    output: { example: { hash: "abc123", signer_id: "example.near", receiver_id: "target.near", status: "success" } },
  }),
  "GET /api/near/validators": declareDiscoveryExtension({
    output: { example: { validators: [{ account_id: "validator.poolv1.near", stake: "1000000" }] } },
  }),
  "GET /api/near/validators/[id]": declareDiscoveryExtension({
    input: { id: "validator.poolv1.near" },
    inputSchema: { properties: { id: { type: "string", description: "Validator account ID" } }, required: ["id"] },
    output: { example: { account_id: "validator.poolv1.near", stake: "1000000", is_active: true } },
  }),
  "GET /api/near/account/[id]/staking": declareDiscoveryExtension({
    input: { id: "example.near" },
    inputSchema: { properties: { id: { type: "string", description: "NEAR account ID" } }, required: ["id"] },
    output: { example: { account_id: "example.near", staking: [{ pool: "validator.poolv1.near", amount: "500" }] } },
  }),
  "GET /api/near/nft/[contract]/tokens": declareDiscoveryExtension({
    input: { contract: "nft.example.near" },
    inputSchema: { properties: { contract: { type: "string", description: "NFT contract account ID" } }, required: ["contract"] },
    output: { example: { contract: "nft.example.near", tokens: [{ token_id: "1", owner_id: "owner.near" }] } },
  }),
  "GET /api/near/defi/pools": declareDiscoveryExtension({
    output: { example: { pools: [{ id: 1, token_account_ids: ["wrap.near", "usdt.tether-token.near"], amounts: ["100", "200"] }] } },
  }),
  // Solana endpoints
  "GET /api/solana/account/[id]/balance": declareDiscoveryExtension({
    input: { id: "So11111111111111111111111111111111111111112" },
    inputSchema: { properties: { id: { type: "string", description: "Solana public key (base58)" } }, required: ["id"] },
    output: { example: { address: "So1...", lamports: 1000000000, sol: 1.0, network: "mainnet-beta" } },
  }),
  "GET /api/solana/account/[id]/info": declareDiscoveryExtension({
    input: { id: "So11111111111111111111111111111111111111112" },
    inputSchema: { properties: { id: { type: "string", description: "Solana public key (base58)" } }, required: ["id"] },
    output: { example: { address: "So1...", exists: true, lamports: 1000000000, sol: 1.0, owner: "11111111111111111111111111111111" } },
  }),
  "GET /api/solana/account/[id]/tokens": declareDiscoveryExtension({
    input: { id: "So11111111111111111111111111111111111111112" },
    inputSchema: { properties: { id: { type: "string", description: "Solana wallet public key" } }, required: ["id"] },
    output: { example: { owner: "So1...", token_count: 5, tokens: [{ mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", amount: "100.0", is_usdc: true }] } },
  }),
  "GET /api/solana/account/[id]/stakes": declareDiscoveryExtension({
    input: { id: "So11111111111111111111111111111111111111112" },
    inputSchema: { properties: { id: { type: "string", description: "Solana wallet public key" } }, required: ["id"] },
    output: { example: { owner: "So1...", stake_accounts: 2, total_staked_sol: 100.5 } },
  }),
  "GET /api/solana/account/[id]/transactions": declareDiscoveryExtension({
    input: { id: "So11111111111111111111111111111111111111112" },
    inputSchema: { properties: { id: { type: "string", description: "Solana public key" } }, required: ["id"] },
    output: { example: { address: "So1...", count: 10, transactions: [{ signature: "abc...", success: true }] } },
  }),
  "GET /api/solana/tx/[signature]": declareDiscoveryExtension({
    input: { signature: "abc123def456" },
    inputSchema: { properties: { signature: { type: "string", description: "Transaction signature (base58)" } }, required: ["signature"] },
    output: { example: { signature: "abc123...", found: true, slot: 123456, success: true, fee_sol: 0.000005 } },
  }),
  "GET /api/solana/validators": declareDiscoveryExtension({
    output: { example: { current_count: 1500, delinquent_count: 50, top_validators: [{ vote_pubkey: "...", activated_stake_sol: 1000000 }] } },
  }),
  "GET /api/solana/tokens/prices": declareDiscoveryExtension({
    output: { example: { tokens: [{ symbol: "SOL", price_usd: 150.0, change_24h_pct: 2.5 }], source: "coingecko" } },
  }),
  "GET /api/solana/network/stats": declareDiscoveryExtension({
    output: { example: { epoch: 500, avg_tps: 3000, total_supply_sol: 570000000, circulating_supply_sol: 420000000 } },
  }),
};

if (!FREE_MODE) {
  const facilitatorClient = new HTTPFacilitatorClient({
    url: FACILITATOR_URL,
  });
  const resourceServer = new x402ResourceServer(facilitatorClient);
  registerExactSvmScheme(resourceServer);
  resourceServer.registerExtension(bazaarResourceServerExtension);

  // Register payment settlement hook for analytics
  resourceServer.onAfterSettle(async (context) => {
    try {
      const payer = context.result.payer || "unknown";
      const txHash = context.result.transaction || "";
      const network = typeof context.result.network === "string"
        ? context.result.network
        : NETWORK;
      const amount = context.requirements?.amount || "0";
      // Parse dollar amount from requirements (amount is in smallest unit for USDC = 6 decimals)
      const amountUsd = parseInt(amount, 10) / 1_000_000;
      // Extract endpoint from payment payload resource URL
      const resourceUrl = context.paymentPayload?.resource?.url || "";
      let endpoint = "";
      try {
        endpoint = new URL(resourceUrl).pathname;
      } catch {
        endpoint = resourceUrl;
      }

      analytics.logPayment({
        payer,
        tx_hash: txHash,
        amount,
        amount_usd: amountUsd,
        endpoint,
        network,
        ip: "",
        user_agent: "",
      });
      console.log(`[analytics] Payment settled: ${payer} → ${endpoint} (${amountUsd} USDC) tx:${txHash.slice(0, 16)}...`);
    } catch (err) {
      console.error("[analytics] Failed to log payment:", err);
    }
  });

  const routeConfig: Record<string, any> = {};
  for (const [route, price] of Object.entries(PRICE_MAP)) {
    routeConfig[route] = {
      accepts: [{ scheme: "exact" as const, price, network: NETWORK, payTo: PAY_TO }],
      description: "Blockchain data endpoint",
      mimeType: "application/json",
      ...(ROUTE_DISCOVERY[route] ? { extensions: { ...ROUTE_DISCOVERY[route] } } : {}),
    };
  }

  app.use(paymentMiddleware(routeConfig, resourceServer));
}

// ─── Route Handlers ──────────────────────────────────────────────────────────

// Account balance
app.get("/api/near/account/:id/balance", async (req, res) => {
  try {
    const data = await nearService.getBalance(req.params.id);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

// Access keys
app.get("/api/near/account/:id/keys", async (req, res) => {
  try {
    const data = await nearService.getAccessKeys(req.params.id);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

// Transaction details
app.get("/api/near/tx/:hash", async (req, res) => {
  try {
    const senderId = req.query.sender_id as string;
    if (!senderId) {
      res.status(400).json({ error: "sender_id query parameter is required" });
      return;
    }
    const data = await nearService.getTransaction(req.params.hash, senderId);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

// All validators
app.get("/api/near/validators", async (_req, res) => {
  try {
    const data = await nearService.getValidators();
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// Single validator
app.get("/api/near/validators/:id", async (req, res) => {
  try {
    const data = await nearService.getValidatorById(req.params.id);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

// Staking delegations for account
app.get("/api/near/account/:id/staking", async (req, res) => {
  try {
    const data = await nearService.getStakingForAccount(req.params.id);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

// NFT tokens on a contract
app.get("/api/near/nft/:contract/tokens", async (req, res) => {
  try {
    const fromIndex = req.query.from_index as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const data = await nearService.getNftTokens(req.params.contract, fromIndex, limit);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

// DeFi pools (Ref Finance)
app.get("/api/near/defi/pools", async (req, res) => {
  try {
    const fromIndex = req.query.from_index ? parseInt(req.query.from_index as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const data = await nearService.getDefiPools(fromIndex, limit);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// ─── Solana Route Handlers ────────────────────────────────────────────────────

// SOL balance
app.get("/api/solana/account/:id/balance", async (req, res) => {
  try {
    const data = await solanaService.getBalance(req.params.id);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

// Account info
app.get("/api/solana/account/:id/info", async (req, res) => {
  try {
    const data = await solanaService.getAccountInfo(req.params.id);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

// SPL token holdings
app.get("/api/solana/account/:id/tokens", async (req, res) => {
  try {
    const data = await solanaService.getTokenAccounts(req.params.id);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

// Stake accounts
app.get("/api/solana/account/:id/stakes", async (req, res) => {
  try {
    const data = await solanaService.getStakeAccounts(req.params.id);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

// Recent transactions
app.get("/api/solana/account/:id/transactions", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const data = await solanaService.getRecentTransactions(req.params.id, limit);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

// Transaction details
app.get("/api/solana/tx/:signature", async (req, res) => {
  try {
    const data = await solanaService.getTransaction(req.params.signature);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
});

// Validators / vote accounts
app.get("/api/solana/validators", async (_req, res) => {
  try {
    const data = await solanaService.getVoteAccounts();
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// Top token prices
app.get("/api/solana/tokens/prices", async (_req, res) => {
  try {
    const data = await solanaService.getTopTokens();
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// Network stats
app.get("/api/solana/network/stats", async (_req, res) => {
  try {
    const data = await solanaService.getNetworkStats();
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────

async function main() {
  // Pre-connect to NEAR RPC
  await nearClient.connect();
  console.log(`NEAR connected to ${nearClient.getNodeUrl()} (${nearClient.getNetworkId()})`);

  app.listen(PORT, HOST, () => {
    console.log(`x402 gateway listening on http://${HOST}:${PORT}`);
    console.log(`Chains: NEAR (${nearClient.getNetworkId()}) + Solana (${solanaClient.getNetwork()})`);
    console.log(`Mode: ${FREE_MODE ? "FREE (set X402_PAY_TO to enable payments)" : "PAID"}`);
    console.log(`Analytics: http://${HOST}:${PORT}/dashboard`);
    if (!FREE_MODE) {
      console.log(`Payment: USDC on ${NETWORK} → ${PAY_TO}`);
    }
  });
}

main().catch((err) => {
  console.error("Failed to start gateway:", err);
  process.exit(1);
});
