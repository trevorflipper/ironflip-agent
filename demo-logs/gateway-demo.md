=== Demo Log: IronFlip Agent — 2026-03-03T00:05:00Z ===

# x402 Gateway Demo Logs

## Health Check
```json
{
    "status": "ok",
    "service": "x402-multi-chain-gateway",
    "mode": "paid",
    "chains": ["near", "solana", "base"],
    "networks": {
        "solana": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
        "base": "eip155:8453",
        "near": "mainnet"
    }
}
```

## Landing Page (API Info)
```json
{
    "name": "x402 Blockchain Data API",
    "version": "3.0.0",
    "description": "Pay-per-call multi-chain blockchain data API powered by x402 (NEAR, Solana & Base)",
    "mode": "paid",
    "total_endpoints": 24,
    "chains": {
        "near": { "endpoints": "8 endpoints — balance, keys, tx, validators, staking, NFTs, DeFi" },
        "solana": { "endpoints": "9 endpoints — balance, info, tokens, stakes, tx, validators, prices, network" },
        "base": { "endpoints": "7 endpoints — ETH balance, account info, ERC-20 tokens, tx, block, gas, network" }
    },
    "payment": [
        { "chain": "Solana", "token": "USDC" },
        { "chain": "Base", "token": "USDC" }
    ]
}
```

## x402 Payment Required (402 Response)
```
$ curl -s -o /dev/null -w "%{http_code}" https://ironflip.duckdns.org/api/base/account/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045/balance
402
```

## Analytics Summary
```json
{
    "total_requests": 152,
    "total_payments": 0,
    "total_revenue_usd": 0,
    "unique_payers": 0,
    "unique_callers": 21
}
```

## Agent Discovery Endpoints
```
/.well-known/agent-card.json  — A2A agent card (14 skills across 3 chains)
/openapi.json                 — OpenAPI 3.1 spec (24 paths)
/llms.txt                     — LLM-readable API description
/.well-known/ai-plugin.json   — Legacy ChatGPT plugin manifest
```
