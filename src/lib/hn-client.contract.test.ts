import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getStoriesInTimeRange } from "./hn-client";

/**
 * Live contract tests against the real HN Algolia API.
 *
 * Skipped by default so normal `pnpm test:unit` runs stay hermetic/offline.
 * Run with: RUN_CONTRACT_TESTS=1 pnpm vitest run src/lib/hn-client.contract.test.ts
 *
 * Exists because of the 2026-07 outage: Algolia removed `points` from
 * numericAttributesForFiltering, every request 400'd, and all mocked tests
 * stayed green. These tests catch upstream drift the mock cannot see, and
 * keep the mock's whitelist honest against reality.
 */

const runContractTests = process.env.RUN_CONTRACT_TESTS === "1";

const filterableFixture = JSON.parse(
  readFileSync(
    new URL("../../e2e/fixtures/algolia/filterable-attributes.json", import.meta.url),
    "utf8"
  )
) as { numericAttributesForFiltering: string[] };

const LIVE_API_BASE = "https://hn.algolia.com/api/v1";
const LIVE_TIMEOUT_MS = 30_000;

describe.skipIf(!runContractTests)("hn-client live API contract", () => {
  it(
    "top-mode query (search endpoint) is accepted and returns stories",
    { timeout: LIVE_TIMEOUT_MS },
    async () => {
      const stories = await getStoriesInTimeRange("24h", 5);

      expect(stories.length).toBeGreaterThan(0);
      for (const story of stories) {
        expect(typeof story.objectID).toBe("string");
        expect(typeof story.title).toBe("string");
        expect(typeof story.points).toBe("number");
        expect(typeof story.author).toBe("string");
        expect(typeof story.created_at_i).toBe("number");
        expect(typeof story.num_comments).toBe("number");
      }
    }
  );

  it(
    "hot-mode query (search_by_date endpoint, minPoints 1) is accepted",
    { timeout: LIVE_TIMEOUT_MS },
    async () => {
      const stories = await getStoriesInTimeRange("24h", 5, {
        endpoint: "search_by_date",
        minPoints: 1,
      });

      expect(stories.length).toBeGreaterThan(0);
    }
  );

  // One direction only: every attribute the mock treats as filterable must be
  // accepted live. (The live API being MORE permissive than the mock is
  // harmless — we just can't rely on the extra attributes until the fixture
  // is updated.)
  it(
    "every attribute in the mock whitelist is filterable on the live API",
    { timeout: LIVE_TIMEOUT_MS },
    async () => {
      for (const attribute of filterableFixture.numericAttributesForFiltering) {
        const url = new URL(`${LIVE_API_BASE}/search`);
        url.searchParams.set("tags", "story");
        url.searchParams.set("numericFilters", `${attribute}>0`);
        url.searchParams.set("hitsPerPage", "1");

        const response = await fetch(url);
        expect(
          response.status,
          `live API rejected numericFilters on "${attribute}" — remove it from e2e/fixtures/algolia/filterable-attributes.json and stop filtering on it`
        ).toBe(200);
      }
    }
  );
});
