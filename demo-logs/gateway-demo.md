=== Demo Log: IronFlip Agent — 2026-03-02T23:45:42Z ===

# x402 Gateway Demo Logs

## Health Check
```
{
    "status": "ok",
    "service": "near-x402-gateway",
    "mode": "paid",
    "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    "near_network": "mainnet"
}
```

## Landing Page (API Info)
```json
{
    "name": "x402 Blockchain Data API",
    "version": "2.0.0",
    "description": "Pay-per-call multi-chain blockchain data API powered by x402 (NEAR + Solana)",
    "mode": "paid",
    "chains": {
        "near": {
            "endpoints": {
                "GET /api/near/account/[id]/balance": {
                    "price": "$0.001",
                    "description": "Account balance"
                },
                "GET /api/near/account/[id]/keys": {
                    "price": "$0.001",
                    "description": "Access keys"
                },
                "GET /api/near/tx/[hash]": {
                    "price": "$0.001",
                    "description": "Transaction details"
                },
                "GET /api/near/validators": {
                    "price": "$0.002",
                    "description": "Active validators"
                },
                "GET /api/near/validators/[id]": {
                    "price": "$0.001",
                    "description": "Validator details"
                },
                "GET /api/near/account/[id]/staking": {
                    "price": "$0.002",
                    "description": "Staking delegations"
                },
                "GET /api/near/nft/[contract]/tokens": {
                    "price": "$0.002",
                    "description": "NFT tokens"
                },
                "GET /api/near/defi/pools": {
                    "price": "$0.005",
                    "description": "Ref Finance pools"
                }
            }
        },
        "solana": {
            "endpoints": {
                "GET /api/solana/account/[id]/balance": {
                    "price": "$0.001",
                    "description": "SOL balance"
                },
                "GET /api/solana/account/[id]/info": {
                    "price": "$0.001",
                    "description": "Account info"
                },
                "GET /api/solana/account/[id]/tokens": {
                    "price": "$0.002",
                    "description": "SPL token holdings"
                },
                "GET /api/solana/account/[id]/stakes": {
                    "price": "$0.002",
                    "description": "Stake accounts"
                },
                "GET /api/solana/account/[id]/transactions": {
                    "price": "$0.002",
                    "description": "Recent transactions"
                },
                "GET /api/solana/tx/[signature]": {
                    "price": "$0.001",
                    "description": "Transaction details"
                },
                "GET /api/solana/validators": {
                    "price": "$0.002",
                    "description": "Vote accounts / validators"
                },
                "GET /api/solana/tokens/prices": {
                    "price": "$0.002",
                    "description": "Top token prices (Jupiter)"
                },
                "GET /api/solana/network/stats": {
                    "price": "$0.002",
                    "description": "Network stats (epoch, TPS, supply)"
                }
            }
        }
    },
    "analytics": {
        "dashboard": "/dashboard",
        "api": "/api/analytics/summary"
    },
    "payment": {
        "chain": "Solana",
        "token": "USDC",
        "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
        "payTo": "91xx1zU7hV59fiYq9jzJtThzgHkzm1JRjtgeKK1TGwA7"
    }
}
```

## x402 Payment Required (402 Response)
```
{}
HTTP Status: 402
```

## Analytics Summary
```json
{
    "total_requests": 152,
    "total_payments": 0,
    "total_revenue_usd": 0,
    "unique_payers": 0,
    "unique_callers": 21,
    "requests_today": 152,
    "payments_today": 0,
    "revenue_today_usd": 0
}
```

## Agent Card (Discovery)
```json
```
