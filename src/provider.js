import { DEMO_RESULTS } from "./data.js";

export const SUPPORTED_BACKENDS = ["demo"];

export function searchProvider(request) {
  if (request.backend !== "demo") {
    return new Error(`Unsupported backend "${request.backend}". Available backend: demo`);
  }

  const page = buildPage(request, DEMO_RESULTS.length);
  if (page instanceof Error) return page;

  const limit = page ? page.pageSize : request.limit;
  const offset = page ? page.offset : 0;
  const results = DEMO_RESULTS.slice(offset, offset + (limit ?? DEMO_RESULTS.length));

  return {
    request: {
      backend: "demo",
      query: request.query,
      fields: request.fields,
      limit: request.limit ?? null,
      pageSize: request.pageSize ?? null,
      cursor: request.cursor ?? null,
      explain: request.explain,
    },
    backend: {
      mode: "stub",
      provider: "demo",
      endpoint: null,
      note: "All queries return the same hard-coded demo results.",
    },
    page,
    results,
  };
}

export function liveBackendContract() {
  return {
    status: "planned",
    request: {
      backend: "live",
      query: "analytics",
      fields: ["businessName", "username", "profileUrl"],
      pageSize: 20,
      cursor: null,
    },
    response: {
      backend: {
        mode: "live",
        provider: "flourisher-api",
        endpoint: "https://api.flourisher.net/search",
        indexVersion: "future",
        rankingVersion: "future",
      },
      page: {
        cursor: null,
        offset: 0,
        pageSize: 20,
        returned: 20,
        total: null,
        nextCursor: "opaque-live-cursor",
      },
      results: [],
    },
  };
}

function buildPage(request, total) {
  if (!request.pageSize && !request.cursor) return null;
  const pageSize = Number(request.pageSize ?? request.limit ?? 10);
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    return new Error("--page-size must be a positive integer");
  }
  const offset = parseDemoCursor(request.cursor);
  if (offset instanceof Error) return offset;
  const nextOffset = offset + pageSize;

  return {
    cursor: request.cursor ?? null,
    offset,
    pageSize,
    returned: Math.max(0, Math.min(pageSize, total - offset)),
    total,
    nextCursor: nextOffset < total ? `demo:${nextOffset}` : null,
  };
}

function parseDemoCursor(cursor) {
  if (!cursor) return 0;
  const match = /^demo:(\d+)$/.exec(cursor);
  if (!match) return new Error("--cursor must be an opaque demo cursor such as demo:2");
  return Number(match[1]);
}
