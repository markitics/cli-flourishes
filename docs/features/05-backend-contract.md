# Feature: Backend Contract

## Goal

The UI should not need to change when the fake data is replaced with a backend.
The CLI should treat the backend as a provider of typed search results and
pagination metadata.

## Current implementation

Search now goes through a provider boundary. The only executable provider is
`demo`, which reads the hard-coded dataset:

```sh
flourisher search "analytics" --backend demo --json --page-size 2
```

Unsupported providers fail explicitly:

```sh
flourisher search "analytics" --backend live --json
```

That command currently returns an error because there is no live backend
configured. The live backend request/response shape is exposed through
`flourisher describe search` as a planned contract.

## Proposed request

```json
{
  "backend": "live",
  "query": "analytics",
  "fields": [
    "businessName",
    "website",
    "username",
    "profileUrl",
    "stripeIntegration",
    "acceptsLink",
    "projects",
    "verified",
    "products",
    "users"
  ],
  "pageSize": 20,
  "cursor": null
}
```

## Proposed response

```json
{
  "query": "analytics",
  "backend": {
    "mode": "live",
    "provider": "flourisher-api",
    "endpoint": "https://api.flourisher.net/search",
    "indexVersion": "future",
    "rankingVersion": "demo-v1"
  },
  "count": 20,
  "page": {
    "cursor": null,
    "offset": 0,
    "pageSize": 20,
    "returned": 20,
    "total": null,
    "nextCursor": "opaque-live-cursor"
  },
  "results": []
}
```

## Important fields

- `businessName`: human-facing name.
- `website`: canonical business URL.
- `username`: Flourisher username without `@`.
- `profileUrl`: canonical Flourisher profile URL.
- `stripeIntegration`: short display summary.
- `stripe`: future nested machine field with exact product surfaces.
- `acceptsLink`: boolean.
- `projects`: boolean or future project count.
- `projectUrl`: URL when a project surface exists.
- `verified`: level string for the table.
- `verification`: future nested source and timestamp.
- `products`: short text summary for humans.
- `users`: short buyer/user summary.

## Alternative

Return raw backend objects and let the CLI adapt them. That is quick but brittle.
The CLI should own a display contract so future providers can change without
breaking terminal demos, tests, or agent scripts.
