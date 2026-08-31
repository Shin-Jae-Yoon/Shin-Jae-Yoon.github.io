import assert from "node:assert/strict"
import test from "node:test"
import {
  COUNTER_CACHE_TTL_MS,
  ENABLE_TODAY_COUNTER,
  GoatCounterCache,
  PUBLIC_COUNTER_KEYS,
  canonicalCounterKey,
  goatCounterUrl,
  readGoatCounter,
  renderCounterState,
} from "./goatcounter"

const endpoint = "https://jae-yoon.goatcounter.com/counter"

test("GoatCounter requests canonical article and TOTAL keys", async () => {
  const calls: string[] = []
  const fetchMock = (async (input: string | URL | Request) => {
    calls.push(String(input))
    return new Response(JSON.stringify({ count: "1,234" }), { status: 200 })
  }) as typeof fetch

  assert.equal(canonicalCounterKey("/brain/test/?utm_source=x#fragment"), "/brain/test")
  assert.equal(
    goatCounterUrl(`${endpoint}/`, "/brain/test/?utm_source=x"),
    `${endpoint}/%2Fbrain%2Ftest.json`,
  )
  assert.equal(goatCounterUrl(endpoint, "TOTAL"), `${endpoint}/TOTAL.json`)
  assert.deepEqual(await readGoatCounter(endpoint, "/brain/test", fetchMock), {
    status: "ready",
    value: 1234,
  })
  assert.deepEqual(calls, [`${endpoint}/%2Fbrain%2Ftest.json`])
})

test("success preserves zero and rendering covers loading, ready, and unavailable", async () => {
  const fetchMock = (async () =>
    new Response(JSON.stringify({ count: "0" }), { status: 200 })) as typeof fetch
  const state = await readGoatCounter(endpoint, "TOTAL", fetchMock)
  assert.deepEqual(state, { status: "ready", value: 0 })
  assert.equal(renderCounterState({ status: "loading" }), "불러오는 중")
  assert.equal(renderCounterState(state), "0회")
  assert.equal(renderCounterState({ status: "unavailable", reason: "network" }), "집계 불가")
})

test("404 and malformed payloads become stable unavailable states", async () => {
  const notFound = (async () => new Response("missing", { status: 404 })) as typeof fetch
  const malformedJson = (async () =>
    new Response("not json", {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as typeof fetch
  const invalidCount = (async () =>
    new Response(JSON.stringify({ count: "not-a-number" }), { status: 200 })) as typeof fetch

  assert.deepEqual(await readGoatCounter(endpoint, "TOTAL", notFound), {
    status: "unavailable",
    reason: "http",
  })
  assert.deepEqual(await readGoatCounter(endpoint, "TOTAL", malformedJson), {
    status: "unavailable",
    reason: "malformed",
  })
  assert.deepEqual(await readGoatCounter(endpoint, "TOTAL", invalidCount), {
    status: "unavailable",
    reason: "malformed",
  })
})

test("network and timeout failures are non-throwing and distinguishable", async () => {
  const networkFailure = (async () => {
    throw new Error("offline")
  }) as typeof fetch
  const neverResolves = (() => new Promise<Response>(() => {})) as typeof fetch

  assert.deepEqual(await readGoatCounter(endpoint, "TOTAL", networkFailure), {
    status: "unavailable",
    reason: "network",
  })
  assert.deepEqual(await readGoatCounter(endpoint, "TOTAL", neverResolves, 5), {
    status: "unavailable",
    reason: "timeout",
  })
})

test("article and total cache entries expire no later than sixty seconds", () => {
  const cache = new GoatCounterCache()
  cache.set("/article", { status: "ready", value: 1 }, 1_000, 120_000)
  cache.set("TOTAL", { status: "ready", value: 2 }, 1_000)

  assert.deepEqual(cache.get("/article", 1_000 + COUNTER_CACHE_TTL_MS - 1), {
    status: "ready",
    value: 1,
  })
  assert.equal(cache.get("/article", 1_000 + COUNTER_CACHE_TTL_MS), undefined)
  assert.deepEqual(cache.keys(), ["TOTAL"])
})

test("today remains disabled with no query or cache key path", () => {
  const cache = new GoatCounterCache()
  cache.set("/article", { status: "ready", value: 1 }, 0)
  cache.set("TOTAL", { status: "ready", value: 2 }, 0)

  assert.equal(ENABLE_TODAY_COUNTER, false)
  assert.deepEqual(PUBLIC_COUNTER_KEYS, ["article", "total"])
  assert.deepEqual(cache.keys(), ["/article", "TOTAL"])
  assert.ok(cache.keys().every((key) => !/[?&](?:start|end)=|\bD\b|today/i.test(key)))
})
