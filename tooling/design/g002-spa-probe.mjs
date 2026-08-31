import { spawn } from "node:child_process"
import { createServer } from "node:http"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import handler from "serve-handler"
import WebSocket from "ws"

const quartzRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)))
const publicDir = join(quartzRoot, "public")
const chromePath =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

const sleep = (milliseconds) =>
  new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds))

class CdpSession {
  constructor(url) {
    this.nextId = 0
    this.pending = new Map()
    this.listeners = new Map()
    this.socket = new WebSocket(url)
  }

  async open() {
    await new Promise((resolveOpen, reject) => {
      this.socket.once("open", resolveOpen)
      this.socket.once("error", reject)
    })
    this.socket.on("message", (payload) => {
      const message = JSON.parse(payload.toString())
      if (message.id) {
        const pending = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) pending?.reject(new Error(message.error.message))
        else pending?.resolve(message.result)
        return
      }
      for (const listener of this.listeners.get(message.method) ?? []) {
        listener(message.params)
      }
    })
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? []
    listeners.push(listener)
    this.listeners.set(method, listeners)
  }

  once(method) {
    return new Promise((resolveEvent) => {
      const listener = (params) => {
        const listeners = this.listeners.get(method) ?? []
        this.listeners.set(
          method,
          listeners.filter((candidate) => candidate !== listener),
        )
        resolveEvent(params)
      }
      this.on(method, listener)
    })
  }

  send(method, params = {}) {
    const id = ++this.nextId
    return new Promise((resolveSend, reject) => {
      this.pending.set(id, { resolve: resolveSend, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  close() {
    this.socket.close()
  }
}

async function getFreePort() {
  const server = createServer()
  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen))
  const { port } = server.address()
  await new Promise((resolveClose) => server.close(resolveClose))
  return port
}

async function waitForChrome(port) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (response.ok) return
    } catch {}
    await sleep(100)
  }
  throw new Error("Chrome DevTools endpoint did not become ready")
}

async function evaluate(session, expression) {
  const result = await session.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
  }
  return result.result.value
}

const sequence = [
  {
    path: "/",
    surface: "home",
    required: [],
    forbidden: ["explorer", "graph", "toc", "backlinks"],
  },
  {
    path: "/brain/",
    surface: "garden-index",
    required: ["explorer", "graph"],
    forbidden: ["toc", "backlinks"],
  },
  {
    path: "/garden/progressive-discovery.html",
    surface: "garden-detail",
    required: ["explorer", "graph", "toc", "backlinks"],
    forbidden: [],
  },
  {
    path: "/articles/reading-first-design.html",
    surface: "article-detail",
    required: ["toc", "backlinks"],
    forbidden: ["explorer", "graph"],
  },
  {
    path: "/portfolio/quartz-migration.html",
    surface: "portfolio-detail",
    required: [],
    forbidden: ["explorer", "graph", "toc", "backlinks"],
  },
  {
    path: "/",
    surface: "home",
    required: [],
    forbidden: ["explorer", "graph", "toc", "backlinks"],
  },
]

const probeExpression = `(() => {
  const count = selector => document.querySelectorAll(selector).length
  return {
    path: location.pathname,
    slug: document.body.dataset.slug ?? null,
    frame: document.querySelector("#quartz-root")?.dataset.frame ?? null,
    surfaces: Array.from(document.querySelectorAll(".dev-uni-frame[data-surface]"), element => element.dataset.surface),
    counts: {
      header: count(".dev-uni-frame > main header"),
      footer: count(".dev-uni-frame > footer"),
      main: count(".dev-uni-frame > main#site-content"),
      search: count(".dev-uni-frame div.search"),
      darkmode: count(".dev-uni-frame button.darkmode"),
      explorer: count(".dev-uni-frame div.explorer.nav-files-container"),
      graph: count(".dev-uni-frame div.graph"),
      toc: count(".dev-uni-frame div.toc"),
      backlinks: count(".dev-uni-frame div.backlinks"),
    },
    unhandledRejections: window.__g002UnhandledRejections ?? [],
  }
})()`

function assertSnapshot(snapshot, expected) {
  const errors = []
  if (snapshot.frame !== "dev-uni") errors.push(`frame=${snapshot.frame}`)
  if (snapshot.surfaces.length !== 1 || snapshot.surfaces[0] !== expected.surface) {
    errors.push(`surfaces=${JSON.stringify(snapshot.surfaces)}`)
  }
  for (const name of ["header", "footer", "main", "search", "darkmode"]) {
    if (snapshot.counts[name] !== 1) errors.push(`${name}=${snapshot.counts[name]}`)
  }
  for (const name of expected.required) {
    if (snapshot.counts[name] !== 1) errors.push(`${name}=${snapshot.counts[name]}`)
  }
  for (const name of expected.forbidden) {
    if (snapshot.counts[name] !== 0) errors.push(`${name}=${snapshot.counts[name]}`)
  }
  if (snapshot.unhandledRejections.length > 0) {
    errors.push(`unhandled=${JSON.stringify(snapshot.unhandledRejections)}`)
  }
  if (errors.length > 0) throw new Error(`${expected.path}: ${errors.join(", ")}`)
}

async function main() {
  const serverPort = await getFreePort()
  const chromePort = await getFreePort()
  const userDataDir = await mkdtemp(join(tmpdir(), "dev-uni-g002-chrome-"))
  const server = createServer((request, response) =>
    handler(request, response, { public: publicDir, cleanUrls: true }),
  )
  let chrome
  let session

  try {
    await new Promise((resolveListen) => server.listen(serverPort, "127.0.0.1", resolveListen))
    chrome = spawn(
      chromePath,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        `--remote-debugging-port=${chromePort}`,
        `--user-data-dir=${userDataDir}`,
        "about:blank",
      ],
      { stdio: "ignore" },
    )
    await waitForChrome(chromePort)

    const targetResponse = await fetch(
      `http://127.0.0.1:${chromePort}/json/new?${encodeURIComponent("about:blank")}`,
      { method: "PUT" },
    )
    if (!targetResponse.ok)
      throw new Error(`Could not create Chrome target: ${targetResponse.status}`)
    const target = await targetResponse.json()
    session = new CdpSession(target.webSocketDebuggerUrl)
    await session.open()
    await Promise.all([
      session.send("Page.enable"),
      session.send("Runtime.enable"),
      session.send("Log.enable"),
    ])

    const consoleErrors = []
    const exceptions = []
    const logErrors = []
    session.on("Runtime.consoleAPICalled", (event) => {
      if (event.type === "error")
        consoleErrors.push(event.args.map((arg) => arg.value ?? arg.description))
    })
    session.on("Runtime.exceptionThrown", (event) => {
      exceptions.push(event.exceptionDetails.exception?.description ?? event.exceptionDetails.text)
    })
    session.on("Log.entryAdded", ({ entry }) => {
      if (entry.level === "error" && entry.source !== "network") logErrors.push(entry.text)
    })
    await session.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `
        window.__g002UnhandledRejections = []
        addEventListener("unhandledrejection", event => {
          window.__g002UnhandledRejections.push(String(event.reason?.stack ?? event.reason))
        })
      `,
    })

    const origin = `http://127.0.0.1:${serverPort}`
    const loaded = session.once("Page.loadEventFired")
    await session.send("Page.navigate", { url: origin })
    await loaded
    await sleep(250)

    const snapshots = []
    for (const [index, expected] of sequence.entries()) {
      if (index > 0) {
        await evaluate(
          session,
          `window.spaNavigate(new URL(${JSON.stringify(expected.path)}, location.origin))`,
        )
        await sleep(100)
      }
      const snapshot = await evaluate(session, probeExpression)
      assertSnapshot(snapshot, expected)
      snapshots.push(snapshot)
    }

    if (consoleErrors.length || exceptions.length || logErrors.length) {
      throw new Error(`browser errors: ${JSON.stringify({ consoleErrors, exceptions, logErrors })}`)
    }

    console.log(
      JSON.stringify(
        {
          status: "PASS",
          sequence: snapshots,
          consoleErrors,
          exceptions,
          logErrors,
          externalMutationPerformed: false,
        },
        null,
        2,
      ),
    )
  } finally {
    session?.close()
    chrome?.kill("SIGTERM")
    await new Promise((resolveClose) => server.close(resolveClose))
    await rm(userDataDir, { recursive: true, force: true })
  }
}

await main()
