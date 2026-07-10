import http from "node:http";
import { readFileSync } from "node:fs";

const HOST = "127.0.0.1";
const DEFAULT_PORT = 8787;
const MAX_HITS_PER_PAGE = 200;

const fixturePath = new URL("../fixtures/algolia/stories.json", import.meta.url);
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const baseStories = Array.isArray(fixture.stories) ? fixture.stories : [];

// Mirror the real index's numericAttributesForFiltering: the live API returns
// 400 for any other attribute, so the mock must too — a mock more permissive
// than production hides exactly the outage class it exists to prevent.
const filterableFixturePath = new URL(
  "../fixtures/algolia/filterable-attributes.json",
  import.meta.url
);
const FILTERABLE_NUMERIC_ATTRIBUTES = new Set(
  JSON.parse(readFileSync(filterableFixturePath, "utf8")).numericAttributesForFiltering
);
const RESPONSE_MODES = new Set(["normal", "empty", "error500"]);
let responseMode = "normal";

function getPort() {
  const index = process.argv.indexOf("--port");
  if (index === -1) return DEFAULT_PORT;

  const next = process.argv[index + 1];
  const parsed = Number.parseInt(next, 10);
  return Number.isFinite(parsed) ? parsed : DEFAULT_PORT;
}

function parseNumericFilters(searchParams) {
  const rawFilters = searchParams
    .getAll("numericFilters")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return rawFilters
    .map((filter) => {
      const match = filter.match(/^([a-zA-Z0-9_]+)\s*(<=|>=|=|<|>)\s*(-?\d+(?:\.\d+)?)$/);
      if (!match) return null;

      return {
        field: match[1],
        operator: match[2],
        value: Number.parseFloat(match[3]),
      };
    })
    .filter((filter) => filter !== null);
}

function compareNumericValue(left, operator, right) {
  if (operator === ">") return left > right;
  if (operator === ">=") return left >= right;
  if (operator === "<") return left < right;
  if (operator === "<=") return left <= right;
  return left === right;
}

function applyNumericFilters(stories, numericFilters) {
  if (numericFilters.length === 0) return stories;

  return stories.filter((story) =>
    numericFilters.every((filter) => {
      const storyValue = Number(story[filter.field]);
      if (!Number.isFinite(storyValue)) return false;
      return compareNumericValue(storyValue, filter.operator, filter.value);
    })
  );
}

function materializeStories() {
  const now = Math.floor(Date.now() / 1000);

  return baseStories.map((story) => ({
    objectID: String(story.objectID),
    title: String(story.title),
    url: typeof story.url === "string" ? story.url : undefined,
    points: Number(story.points),
    author: String(story.author),
    created_at_i: now - Math.floor(Number(story.ageHours) * 3600),
    num_comments: Number(story.num_comments),
  }));
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function setResponseMode(nextMode) {
  if (RESPONSE_MODES.has(nextMode)) {
    responseMode = nextMode;
    return true;
  }

  return false;
}

function handleSearch(requestUrl, response, { sortByDate = false } = {}) {
  if (responseMode === "error500") {
    sendJson(response, 500, {
      error: "Injected server failure",
    });
    return;
  }

  // Real Algolia rejects filters on non-whitelisted attributes before doing
  // anything else. Same message shape as the live API.
  const numericFilters = parseNumericFilters(requestUrl.searchParams);
  const invalidFilter = numericFilters.find(
    (filter) => !FILTERABLE_NUMERIC_ATTRIBUTES.has(filter.field)
  );
  if (invalidFilter) {
    sendJson(response, 400, {
      code: 400,
      message: `invalid numeric attribute(${invalidFilter.field}), attribute not specified in numericAttributesForFiltering setting`,
    });
    return;
  }

  const page = Math.max(0, Number.parseInt(requestUrl.searchParams.get("page") ?? "0", 10) || 0);
  const rawHitsPerPage = Number.parseInt(requestUrl.searchParams.get("hitsPerPage") ?? "20", 10) || 20;
  const hitsPerPage = Math.max(1, Math.min(MAX_HITS_PER_PAGE, rawHitsPerPage));

  const tags = requestUrl.searchParams.get("tags") ?? "";
  if (tags && !tags.split(",").map((tag) => tag.trim()).includes("story")) {
    sendJson(response, 200, {
      hits: [],
      page,
      nbPages: 0,
    });
    return;
  }

  const stories =
    responseMode === "empty"
      ? []
      : applyNumericFilters(materializeStories(), numericFilters);

  if (sortByDate) {
    stories.sort((a, b) => b.created_at_i - a.created_at_i);
  }

  const start = page * hitsPerPage;
  const end = start + hitsPerPage;
  const hits = stories.slice(start, end);
  const nbPages = Math.ceil(stories.length / hitsPerPage);

  sendJson(response, 200, {
    hits,
    page,
    nbPages,
  });
}

const server = http.createServer((request, response) => {
  const method = request.method ?? "GET";
  const requestUrl = new URL(request.url ?? "/", `http://${HOST}:${getPort()}`);

  if (method === "GET" && requestUrl.pathname === "/__mode") {
    const mode = requestUrl.searchParams.get("value");
    const ok = setResponseMode(mode ?? "");
    sendJson(response, ok ? 200 : 400, {
      mode: responseMode,
      allowedModes: Array.from(RESPONSE_MODES),
    });
    return;
  }

  if (method === "GET" && requestUrl.pathname === "/api/v1/search") {
    handleSearch(requestUrl, response);
    return;
  }

  if (method === "GET" && requestUrl.pathname === "/api/v1/search_by_date") {
    handleSearch(requestUrl, response, { sortByDate: true });
    return;
  }

  sendJson(response, 404, {
    error: "Not found",
  });
});

const port = getPort();
server.listen(port, HOST, () => {
  console.log(`[Mock Algolia] Listening on http://${HOST}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => {
      process.exit(0);
    });
  });
}
