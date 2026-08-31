import { normalizeCanonicalPath } from "./canonical"

export const COUNTER_CACHE_TTL_MS = 60_000
export const COUNTER_TIMEOUT_MS = 4_000
export const ENABLE_TODAY_COUNTER = false
export const PUBLIC_COUNTER_KEYS = ["article", "total"] as const

export type CounterState =
  | { status: "loading" }
  | { status: "ready"; value: number }
  | { status: "unavailable"; reason: "http" | "malformed" | "network" | "timeout" }

export function canonicalCounterKey(path: string): string {
  return path === "TOTAL" ? "TOTAL" : normalizeCanonicalPath(path)
}

export function goatCounterUrl(endpoint: string, path: string): string {
  const base = endpoint.replace(/\/$/, "")
  return `${base}/${encodeURIComponent(canonicalCounterKey(path))}.json`
}

class CounterTimeoutError extends Error {}

export async function readGoatCounter(
  endpoint: string,
  path: string,
  fetcher: typeof fetch = fetch,
  timeoutMs = COUNTER_TIMEOUT_MS,
): Promise<CounterState> {
  const controller = new AbortController()
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    const response = await Promise.race([
      fetcher(goatCounterUrl(endpoint, path), { mode: "cors", signal: controller.signal }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort()
          reject(new CounterTimeoutError("GoatCounter request timed out"))
        }, timeoutMs)
      }),
    ])
    if (!response.ok) return { status: "unavailable", reason: "http" }

    let payload: { count?: unknown; count_unique?: unknown }
    try {
      payload = (await response.json()) as { count?: unknown; count_unique?: unknown }
    } catch {
      return { status: "unavailable", reason: "malformed" }
    }
    const raw = payload.count ?? payload.count_unique
    const value = typeof raw === "string" ? Number(raw.replaceAll(",", "")) : Number(raw)
    return Number.isFinite(value) && value >= 0
      ? { status: "ready", value }
      : { status: "unavailable", reason: "malformed" }
  } catch (error) {
    return {
      status: "unavailable",
      reason: error instanceof CounterTimeoutError ? "timeout" : "network",
    }
  } finally {
    if (timeout !== undefined) clearTimeout(timeout)
  }
}

export function renderCounterState(state: CounterState): string {
  if (state.status === "loading") return "불러오는 중"
  if (state.status === "unavailable") return "집계 불가"
  return `${state.value.toLocaleString("ko-KR")}회`
}

type CacheEntry = { state: Extract<CounterState, { status: "ready" }>; expiresAt: number }

export class GoatCounterCache {
  private readonly entries = new Map<string, CacheEntry>()

  get(path: string, now = Date.now()): CacheEntry["state"] | undefined {
    const key = canonicalCounterKey(path)
    const entry = this.entries.get(key)
    if (!entry) return undefined
    if (entry.expiresAt <= now) {
      this.entries.delete(key)
      return undefined
    }
    return entry.state
  }

  set(
    path: string,
    state: CacheEntry["state"],
    now = Date.now(),
    ttlMs = COUNTER_CACHE_TTL_MS,
  ): void {
    const boundedTtl = Math.max(0, Math.min(ttlMs, COUNTER_CACHE_TTL_MS))
    this.entries.set(canonicalCounterKey(path), { state, expiresAt: now + boundedTtl })
  }

  keys(): string[] {
    return [...this.entries.keys()]
  }
}
