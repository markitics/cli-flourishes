# Feature: Backend Contract

## Goal

The UI should not need to change when the fake data is replaced with a backend.
The CLI should treat the backend as a provider of typed search results and
pagination metadata.

## Proposed request

```json
{
  "query": "analytics",
  "limit": 20,
  "cursor": null,
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
  ]
}
```

## Proposed response

```json
{
  "query": "analytics",
  "backend": {
    "mode": "live",
    "indexVersion": "2026-05-13",
    "rankingVersion": "demo-v1"
  },
  "count": 20,
  "nextCursor": "opaque-cursor",
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
