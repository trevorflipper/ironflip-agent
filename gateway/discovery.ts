/**
 * Agent discovery layer — serves standard manifests so AI agents can find,
 * understand, and consume our API automatically.
 *
 * Standards implemented:
 * - OpenAPI 3.1 spec (/openapi.yaml)
 * - A2A Agent Card (/.well-known/agent-card.json)
 * - llms.txt (/llms.txt)
 * - Legacy AI Plugin (/.well-known/ai-plugin.json)
 */

const BASE_URL = process.env.X402_PUBLIC_URL || "https://ironflip.duckdns.org";

// ─── OpenAPI 3.1 Spec ─────────────────────────────────────────────────────────

export const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "x402 Multi-Chain Blockchain API",
    version: "2.0.0",
    description: "Pay-per-call blockchain data API for NEAR Protocol and Solana. All data endpoints require x402 USDC micropayment on Solana mainnet. No API keys, no signup — just attach a payment header.",
    contact: { email: "openclaw@proton.me" },
  },
  servers: [{ url: BASE_URL, description: "Production" }],
  paths: {
    // NEAR endpoints
    "/api/near/account/{id}/balance": {
      get: {
        operationId: "getNearBalance",
        summary: "NEAR account balance",
        description: "Returns native NEAR balance breakdown (total, staked, available). Price: $0.001 USDC.",
        tags: ["NEAR"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, example: "relay.near" }],
        responses: {
          "200": { description: "Balance data", content: { "application/json": { schema: { type: "object", properties: { account_id: { type: "string" }, total: { type: "string" }, available: { type: "string" }, staked: { type: "string" } } } } } },
          "402": { description: "Payment required — x402 USDC on Solana" },
        },
      },
    },
    "/api/near/account/{id}/keys": {
      get: {
        operationId: "getNearAccessKeys",
        summary: "NEAR access keys",
        description: "Returns all access keys (full + function-call) for an account. Price: $0.001 USDC.",
        tags: ["NEAR"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Access key list" }, "402": { description: "Payment required" } },
      },
    },
    "/api/near/tx/{hash}": {
      get: {
        operationId: "getNearTransaction",
        summary: "NEAR transaction details",
        description: "Returns full transaction with receipts, actions, and status. Requires sender_id query param. Price: $0.001 USDC.",
        tags: ["NEAR"],
        parameters: [
          { name: "hash", in: "path", required: true, schema: { type: "string" } },
          { name: "sender_id", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "Transaction data" }, "402": { description: "Payment required" } },
      },
    },
    "/api/near/validators": {
      get: {
        operationId: "getNearValidators",
        summary: "NEAR validators",
        description: "Returns current validator set with stake amounts, block production, and slashing status. Price: $0.002 USDC.",
        tags: ["NEAR"],
        responses: { "200": { description: "Validator list" }, "402": { description: "Payment required" } },
      },
    },
    "/api/near/validators/{id}": {
      get: {
        operationId: "getNearValidatorById",
        summary: "NEAR validator details",
        description: "Returns detailed info for a specific validator including uptime percentage. Price: $0.001 USDC.",
        tags: ["NEAR"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Validator detail" }, "402": { description: "Payment required" } },
      },
    },
    "/api/near/account/{id}/staking": {
      get: {
        operationId: "getNearStaking",
        summary: "NEAR staking delegations",
        description: "Returns staking positions across top 50 validators for an account. Price: $0.002 USDC.",
        tags: ["NEAR"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Staking positions" }, "402": { description: "Payment required" } },
      },
    },
    "/api/near/nft/{contract}/tokens": {
      get: {
        operationId: "getNearNftTokens",
        summary: "NEAR NFT tokens",
        description: "Returns NFT tokens on a contract with metadata. Price: $0.002 USDC.",
        tags: ["NEAR"],
        parameters: [
          { name: "contract", in: "path", required: true, schema: { type: "string" } },
          { name: "from_index", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", maximum: 100 } },
        ],
        responses: { "200": { description: "NFT token list" }, "402": { description: "Payment required" } },
      },
    },
    "/api/near/defi/pools": {
      get: {
        operationId: "getNearDefiPools",
        summary: "NEAR DeFi pools (Ref Finance)",
        description: "Returns liquidity pool data from Ref Finance. Price: $0.005 USDC.",
        tags: ["NEAR"],
        parameters: [
          { name: "from_index", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer", maximum: 100 } },
        ],
        responses: { "200": { description: "Pool list" }, "402": { description: "Payment required" } },
      },
    },
    // Solana endpoints
    "/api/solana/account/{id}/balance": {
      get: {
        operationId: "getSolanaBalance",
        summary: "SOL balance",
        description: "Returns SOL balance in lamports and SOL. Price: $0.001 USDC.",
        tags: ["Solana"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, example: "vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg" }],
        responses: { "200": { description: "Balance data" }, "402": { description: "Payment required" } },
      },
    },
    "/api/solana/account/{id}/info": {
      get: {
        operationId: "getSolanaAccountInfo",
        summary: "Solana account info",
        description: "Returns account metadata (owner, executable, rent epoch, data size). Price: $0.001 USDC.",
        tags: ["Solana"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Account info" }, "402": { description: "Payment required" } },
      },
    },
    "/api/solana/account/{id}/tokens": {
      get: {
        operationId: "getSolanaTokenAccounts",
        summary: "SPL token holdings",
        description: "Returns all SPL token accounts for a wallet, USDC sorted first. Price: $0.002 USDC.",
        tags: ["Solana"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Token account list" }, "402": { description: "Payment required" } },
      },
    },
    "/api/solana/account/{id}/stakes": {
      get: {
        operationId: "getSolanaStakeAccounts",
        summary: "Solana stake accounts",
        description: "Returns staking positions with validator, amount, and activation epoch. Price: $0.002 USDC.",
        tags: ["Solana"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Stake account list" }, "402": { description: "Payment required" } },
      },
    },
    "/api/solana/account/{id}/transactions": {
      get: {
        operationId: "getSolanaRecentTransactions",
        summary: "Recent Solana transactions",
        description: "Returns recent transaction signatures for an address. Price: $0.002 USDC.",
        tags: ["Solana"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", maximum: 50, default: 10 } },
        ],
        responses: { "200": { description: "Transaction list" }, "402": { description: "Payment required" } },
      },
    },
    "/api/solana/tx/{signature}": {
      get: {
        operationId: "getSolanaTransaction",
        summary: "Solana transaction details",
        description: "Returns parsed transaction with instructions, logs, and fee. Price: $0.001 USDC.",
        tags: ["Solana"],
        parameters: [{ name: "signature", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Transaction data" }, "402": { description: "Payment required" } },
      },
    },
    "/api/solana/validators": {
      get: {
        operationId: "getSolanaValidators",
        summary: "Solana validators",
        description: "Returns top 30 vote accounts by activated stake with commission rates. Price: $0.002 USDC.",
        tags: ["Solana"],
        responses: { "200": { description: "Validator list" }, "402": { description: "Payment required" } },
      },
    },
    "/api/solana/tokens/prices": {
      get: {
        operationId: "getSolanaTokenPrices",
        summary: "Top Solana token prices",
        description: "Returns prices and 24h change for top Solana tokens (SOL, USDC, JUP, JTO, etc.). Price: $0.002 USDC.",
        tags: ["Solana"],
        responses: { "200": { description: "Token price list" }, "402": { description: "Payment required" } },
      },
    },
    "/api/solana/network/stats": {
      get: {
        operationId: "getSolanaNetworkStats",
        summary: "Solana network statistics",
        description: "Returns epoch info, TPS, total/circulating supply. Price: $0.002 USDC.",
        tags: ["Solana"],
        responses: { "200": { description: "Network stats" }, "402": { description: "Payment required" } },
      },
    },
  },
  "x-x402-payment": {
    chain: "Solana",
    token: "USDC",
    network: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    payTo: "91xx1zU7hV59fiYq9jzJtThzgHkzm1JRjtgeKK1TGwA7",
    facilitator: "https://facilitator.x402endpoints.online",
    protocol: "https://x402.org",
  },
};

// ─── A2A Agent Card ───────────────────────────────────────────────────────────

export const AGENT_CARD = {
  name: "x402 Multi-Chain Blockchain API",
  description: "Pay-per-call blockchain data for NEAR Protocol and Solana. Returns account balances, token holdings, validators, staking positions, transactions, DeFi pools, and token prices. All endpoints accept x402 USDC micropayments on Solana — no API keys, no signup.",
  url: BASE_URL,
  provider: {
    organization: "OpenClaw",
    url: BASE_URL,
  },
  version: "2.0.0",
  documentationUrl: `${BASE_URL}/openapi.json`,
  capabilities: {
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: false,
  },
  authentication: {
    schemes: ["x402"],
    credentials: null,
  },
  defaultInputModes: ["application/json"],
  defaultOutputModes: ["application/json"],
  skills: [
    {
      id: "near-balance",
      name: "NEAR Account Balance",
      description: "Get NEAR token balance for any account (total, staked, available)",
      tags: ["near", "blockchain", "balance", "wallet"],
      examples: ["What is the balance of relay.near?", "Check NEAR account aurora.near"],
    },
    {
      id: "near-validators",
      name: "NEAR Validators",
      description: "List current NEAR validators with stake, uptime, and slashing status",
      tags: ["near", "validators", "staking", "proof-of-stake"],
      examples: ["Show NEAR validators", "Which NEAR validator has highest uptime?"],
    },
    {
      id: "near-staking",
      name: "NEAR Staking Positions",
      description: "Get staking delegations for any NEAR account across validator pools",
      tags: ["near", "staking", "delegation", "yield"],
      examples: ["Show staking for relay.near", "Where is this account staking?"],
    },
    {
      id: "near-defi",
      name: "NEAR DeFi Pools",
      description: "Get Ref Finance liquidity pool data on NEAR",
      tags: ["near", "defi", "liquidity", "ref-finance", "yield"],
      examples: ["Show top DeFi pools on NEAR", "What are the best NEAR liquidity pools?"],
    },
    {
      id: "solana-balance",
      name: "Solana Balance",
      description: "Get SOL balance for any Solana address",
      tags: ["solana", "blockchain", "balance", "wallet"],
      examples: ["What is this Solana wallet balance?", "Check SOL balance"],
    },
    {
      id: "solana-tokens",
      name: "Solana Token Holdings",
      description: "Get all SPL token holdings for a Solana wallet (USDC, JUP, etc.)",
      tags: ["solana", "tokens", "spl", "portfolio", "usdc"],
      examples: ["Show tokens in this Solana wallet", "What USDC does this address hold?"],
    },
    {
      id: "solana-prices",
      name: "Solana Token Prices",
      description: "Get current prices and 24h changes for top Solana tokens",
      tags: ["solana", "prices", "market", "sol", "usdc", "jup", "bonk"],
      examples: ["What is SOL price?", "Show Solana token prices", "How much is JUP worth?"],
    },
    {
      id: "solana-network",
      name: "Solana Network Stats",
      description: "Get Solana network statistics: epoch, TPS, total and circulating supply",
      tags: ["solana", "network", "tps", "epoch", "supply"],
      examples: ["What is Solana TPS?", "Show Solana network stats", "Current Solana epoch?"],
    },
    {
      id: "solana-staking",
      name: "Solana Staking",
      description: "Get stake accounts and validator delegations for a Solana wallet",
      tags: ["solana", "staking", "validators", "delegation"],
      examples: ["Show staking for this Solana address", "Where is this wallet staking SOL?"],
    },
    {
      id: "solana-tx",
      name: "Solana Transaction Details",
      description: "Get parsed transaction data with instructions, logs, and fees",
      tags: ["solana", "transaction", "explorer"],
      examples: ["Show details for this Solana transaction"],
    },
  ],
};

// ─── AI Plugin Manifest (Legacy) ──────────────────────────────────────────────

export const AI_PLUGIN = {
  schema_version: "v1",
  name_for_human: "Blockchain Data API",
  name_for_model: "blockchain_data_x402",
  description_for_human: "NEAR + Solana blockchain data via x402 micropayments.",
  description_for_model: "API for querying NEAR Protocol and Solana blockchain data. Use this to look up account balances (NEAR or SOL), SPL token holdings, transaction details, validator information, staking positions, NFT tokens, DeFi liquidity pools, token prices, and network statistics. All endpoints require x402 USDC payment on Solana mainnet — send a payment header with each request. Prices range from $0.001 to $0.005 per call.",
  auth: { type: "none" },
  api: {
    type: "openapi",
    url: `${BASE_URL}/openapi.json`,
    is_user_authenticated: false,
  },
  logo_url: `${BASE_URL}/logo.png`,
  contact_email: "openclaw@proton.me",
  legal_info_url: `${BASE_URL}/`,
};

// ─── llms.txt ─────────────────────────────────────────────────────────────────

export const LLMS_TXT = `# x402 Multi-Chain Blockchain API

> Pay-per-call NEAR Protocol and Solana blockchain data. All endpoints accept x402 USDC micropayments on Solana mainnet. No API keys, no signup — just attach a payment header.

This API serves real-time blockchain data across two chains (NEAR + Solana) with 17 endpoints. Each call costs $0.001-$0.005 USDC via the x402 payment protocol. Agents pay by including an X-PAYMENT header with a Solana USDC transaction proof.

## NEAR Protocol Endpoints

- [Account Balance](${BASE_URL}/api/near/account/{id}/balance): GET — Returns NEAR balance (total, staked, available). $0.001
- [Access Keys](${BASE_URL}/api/near/account/{id}/keys): GET — Returns full and function-call access keys. $0.001
- [Transaction](${BASE_URL}/api/near/tx/{hash}?sender_id={sender}): GET — Full transaction with receipts and actions. $0.001
- [Validators](${BASE_URL}/api/near/validators): GET — Current validator set with stake and uptime. $0.002
- [Validator Detail](${BASE_URL}/api/near/validators/{id}): GET — Single validator with uptime percentage. $0.001
- [Staking](${BASE_URL}/api/near/account/{id}/staking): GET — Staking delegations across pools. $0.002
- [NFT Tokens](${BASE_URL}/api/near/nft/{contract}/tokens): GET — NFTs with metadata on a contract. $0.002
- [DeFi Pools](${BASE_URL}/api/near/defi/pools): GET — Ref Finance liquidity pools. $0.005

## Solana Endpoints

- [SOL Balance](${BASE_URL}/api/solana/account/{id}/balance): GET — SOL balance in lamports and SOL. $0.001
- [Account Info](${BASE_URL}/api/solana/account/{id}/info): GET — Account metadata (owner, executable). $0.001
- [Token Holdings](${BASE_URL}/api/solana/account/{id}/tokens): GET — All SPL tokens, USDC first. $0.002
- [Stake Accounts](${BASE_URL}/api/solana/account/{id}/stakes): GET — Staking positions with validators. $0.002
- [Recent Transactions](${BASE_URL}/api/solana/account/{id}/transactions): GET — Recent tx signatures. $0.002
- [Transaction Detail](${BASE_URL}/api/solana/tx/{signature}): GET — Parsed tx with instructions and logs. $0.001
- [Validators](${BASE_URL}/api/solana/validators): GET — Top 30 vote accounts by stake. $0.002
- [Token Prices](${BASE_URL}/api/solana/tokens/prices): GET — SOL, USDC, JUP, JTO, BONK prices + 24h change. $0.002
- [Network Stats](${BASE_URL}/api/solana/network/stats): GET — Epoch, TPS, supply. $0.002

## Payment

- Protocol: [x402](https://x402.org) — HTTP 402 payment flow
- Chain: Solana mainnet
- Token: USDC (EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
- Pay to: 91xx1zU7hV59fiYq9jzJtThzgHkzm1JRjtgeKK1TGwA7
- Facilitator: https://facilitator.x402endpoints.online

## Documentation

- [OpenAPI Spec](${BASE_URL}/openapi.json): Full OpenAPI 3.1 specification
- [Agent Card](${BASE_URL}/.well-known/agent-card.json): A2A agent discovery manifest
- [Analytics Dashboard](${BASE_URL}/dashboard): Live usage stats

## Optional

- [Health Check](${BASE_URL}/health): Service status
- [Analytics API](${BASE_URL}/api/analytics/summary): JSON usage stats
`;
