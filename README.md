# IronFlip: Autonomous NEAR Marketplace Agent

An autonomous AI agent that operates on [market.near.ai](https://market.near.ai) — discovering jobs, placing bids, completing work, and earning NEAR. Built with a self-hosted agent framework, hybrid LLM routing, and an x402 blockchain data gateway.

**Live gateway:** https://ironflip.duckdns.org
**MCP Registry:** `io.github.trevorflipper/near-solana-blockchain-api`
**Marketplace handle:** `ironflip`

## What It Does

IronFlip handles the full job lifecycle on market.near.ai autonomously:

1. **Discovery** — Scans the marketplace every 30 minutes for jobs matching its capabilities
2. **Evaluation** — Assesses job requirements against its skill set (MCP tools, blockchain development, data analysis)
3. **Bidding** — Crafts tailored proposals and places bids with appropriate pricing and ETAs
4. **Execution** — Completes work using 38+ integrated tools across multiple MCP servers
5. **Delivery** — Submits deliverables with SHA-256 verification hashes

## Architecture

```
                  Telegram
                     |
              IronClaw v0.13.0
              (Agent Framework)
                /    |    \
         Claude    Kimi     Memory
         Opus 4   2.5      (libSQL)
         (plan)   (exec)
                |
        MCP Servers (Streamable HTTP)
        /         |         \
  market-api  code-exec  x402-gateway
  (8 tools)   (5 tools)  (17 endpoints)
                            |
                     NEAR RPC + Solana RPC
```

### Components

| Component | Purpose | Tech |
|-----------|---------|------|
| **IronClaw v0.13.0** | Agent framework — orchestration, memory, tool dispatch | Rust + Python |
| **Claude Opus 4** | Planning, architecture, complex reasoning | via claude-max-proxy |
| **Kimi 2.5** | Execution, data processing, routine tasks | via NVIDIA NIM API |
| **market-api MCP** | 8 tools for marketplace interaction (jobs, bids, wallet) | Python, port 8081 |
| **code-exec MCP** | 5 tools for sandboxed code execution | Python, port 8082 |
| **x402 Gateway** | 17 blockchain data endpoints behind USDC paywalls | TypeScript/Express, port 8084 |
| **Caddy** | HTTPS reverse proxy with auto-renewing Let's Encrypt certs | DuckDNS DNS-01 |
| **SQLite Analytics** | Request logging, payment tracking, dashboard | better-sqlite3 |

### Hybrid Model Routing

The agent uses different LLMs for different tasks:
- **Claude Opus 4** (primary) — Complex planning, architecture decisions, code review
- **Kimi 2.5** (fallback/execution) — Routine tasks, data processing, quick responses
- **Gemini 2.5 Flash** — Scheduled cron jobs (daily briefs, market scans)

This optimizes for cost while maintaining quality where it matters.

## x402 Gateway — 17 Pay-Per-Call Endpoints

The gateway serves real blockchain data from NEAR Protocol and Solana behind x402 USDC micropayments. No API keys, no signup — agents just attach a payment header.

### NEAR Protocol (8 endpoints)
| Endpoint | Price | Description |
|----------|-------|-------------|
| `GET /api/near/account/{id}/balance` | $0.001 | Account balance (total, staked, available) |
| `GET /api/near/account/{id}/keys` | $0.001 | Access keys (full and function-call) |
| `GET /api/near/tx/{hash}` | $0.001 | Transaction with receipts and actions |
| `GET /api/near/validators` | $0.002 | Active validator set with stake |
| `GET /api/near/validators/{id}` | $0.001 | Single validator details |
| `GET /api/near/account/{id}/staking` | $0.002 | Staking delegations across pools |
| `GET /api/near/nft/{contract}/tokens` | $0.002 | NFT tokens with metadata |
| `GET /api/near/defi/pools` | $0.005 | Ref Finance liquidity pools |

### Solana (9 endpoints)
| Endpoint | Price | Description |
|----------|-------|-------------|
| `GET /api/solana/account/{id}/balance` | $0.001 | SOL balance |
| `GET /api/solana/account/{id}/info` | $0.001 | Account metadata |
| `GET /api/solana/account/{id}/tokens` | $0.002 | SPL token holdings (USDC first) |
| `GET /api/solana/account/{id}/stakes` | $0.002 | Stake accounts |
| `GET /api/solana/account/{id}/transactions` | $0.002 | Recent transactions |
| `GET /api/solana/tx/{signature}` | $0.001 | Parsed transaction details |
| `GET /api/solana/validators` | $0.002 | Top 30 validators by stake |
| `GET /api/solana/tokens/prices` | $0.002 | Token prices + 24h change |
| `GET /api/solana/network/stats` | $0.002 | Epoch, TPS, supply |

### Payment Flow
```
Agent sends GET request
    → Gateway returns 402 + payment requirements
Agent sends payment via x402 header (Solana USDC)
    → Facilitator verifies payment on-chain
    → Gateway returns blockchain data
```

## Agent Discovery

The gateway is discoverable by other AI agents through multiple standards:

| Standard | URL | Purpose |
|----------|-----|---------|
| OpenAPI 3.1 | [/openapi.json](https://ironflip.duckdns.org/openapi.json) | Machine-readable API spec |
| A2A Agent Card | [/.well-known/agent-card.json](https://ironflip.duckdns.org/.well-known/agent-card.json) | Google A2A protocol |
| llms.txt | [/llms.txt](https://ironflip.duckdns.org/llms.txt) | LLM-readable site description |
| ai-plugin.json | [/.well-known/ai-plugin.json](https://ironflip.duckdns.org/.well-known/ai-plugin.json) | Legacy ChatGPT plugin |
| x402 Bazaar | [catalog](https://x402-discovery-api.onrender.com/catalog) | x402 discovery layer |
| MCP Registry | `io.github.trevorflipper/near-solana-blockchain-api` | Official MCP server registry |

## Directory Listings

- **Official MCP Registry** — Published as `io.github.trevorflipper/near-solana-blockchain-api` v2.0.0
- **x402 Bazaar** — Registered with HTTPS endpoint and bazaar discovery metadata on all routes
- **PulseMCP** — Auto-ingests from MCP Registry weekly

## Analytics & Observability

- **Live dashboard:** https://ironflip.duckdns.org/dashboard
- **JSON API:** `/api/analytics/{summary,payments,payers,endpoints,timeseries}`
- **Daily Telegram digest** at 9 AM ET with request/payment/revenue stats
- SQLite-backed request logging on every API call
- Payment tracking via x402 `onAfterSettle` hook

## Infrastructure

All self-hosted on a single DigitalOcean droplet (2 vCPU, 4 GB RAM, Ubuntu 24.04):

- **HTTPS** via Caddy + DuckDNS + Let's Encrypt (DNS-01 challenge, auto-renewing)
- **Systemd services**: ironclaw, x402-gateway, claude-max-proxy, market-api, code-exec
- **Health monitoring**: 5-minute checks with auto-restart and Telegram alerts
- **Security**: All services bound to localhost, HTTPS-only public access, UFW firewall

## Demo

### Gateway Health
```bash
$ curl https://ironflip.duckdns.org/health
{"status":"ok","service":"near-x402-gateway","mode":"paid","network":"solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp","near_network":"mainnet"}
```

### x402 Payment Required
```bash
$ curl -s -o /dev/null -w "%{http_code}" https://ironflip.duckdns.org/api/near/account/example.near/balance
402
```

### Marketplace Wallet
```bash
$ curl -s -H "Authorization: Bearer $KEY" https://market.near.ai/v1/wallet/balance
{"account_id":"b5ff8a53...fedf","balance":"6.000000","token":"NEAR"}
```

See [demo-logs/](./demo-logs/) for full interaction traces.

## Source Code

| Directory | Contents |
|-----------|----------|
| [gateway/](./gateway/) | x402 gateway source (TypeScript) |
| [config/](./config/) | IronClaw agent configuration |
| [demo-logs/](./demo-logs/) | Agent interaction traces and marketplace activity |

## License

MIT
