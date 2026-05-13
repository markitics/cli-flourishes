# Feature: Saved Workflows

## Why it matters

The table helps a human scan. The next layer should help a human make a buying
or partnership decision without opening a browser for every row.

## Potential commands

```sh
flourisher save atlasmetrics
flourisher compare atlasmetrics vectorgrove summitschema
flourisher note atlasmetrics "Looks strongest for analytics engineers."
flourisher open atlasmetrics
flourisher copy atlasmetrics --field profileUrl
```

## Interactive equivalents

- `space`: add row to compare set.
- `s`: save row.
- `n`: add note.
- `c`: copy profile URL.
- `o`: open profile or website.

## Data questions

- Is saved state local, cloud-backed, or both?
- Should notes sync to a team workspace?
- Do saved rows preserve the exact snapshot, or rehydrate from current backend
  data every time?

## Alternative

Keep Flourisher stateless and make it only a search renderer. That is easier for
agents and simpler to test, but it leaves human decision workflow to a browser
or spreadsheet.
