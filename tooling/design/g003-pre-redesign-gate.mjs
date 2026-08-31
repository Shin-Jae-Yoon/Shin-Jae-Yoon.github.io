import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const quartzRoot = path.resolve(import.meta.dirname, "../..")
const publicRoot = path.join(quartzRoot, "public")

const representativeRoutes = [
  "index.html",
  "about.html",
  "portfolio/index.html",
  "portfolio/quartz-migration.html",
  "brain/index.html",
  "garden/progressive-discovery.html",
  "articles/index.html",
  "articles/reading-first-design.html",
]

async function walk(root) {
  const files = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(absolute)))
    else if (entry.isFile()) files.push(absolute)
  }
  return files
}

export async function auditPreRedesign() {
  const pages = new Map(
    await Promise.all(
      representativeRoutes.map(async (file) => [
        file,
        await readFile(path.join(publicRoot, file), "utf8"),
      ]),
    ),
  )
  const findings = []
  const duplicateH1Routes = [...pages]
    .filter(([, html]) => (html.match(/<h1\b/g)?.length ?? 0) !== 1)
    .map(([file]) => file)
  if (duplicateH1Routes.length > 0) {
    findings.push({
      id: "shell.single-h1",
      affectedRoutes: duplicateH1Routes,
      current: "Representative pages do not yet expose exactly one H1.",
      futurePassCondition:
        "Every representative route renders exactly one H1 after the branded shell lands.",
      ownerStage: "G004-G006",
    })
  }

  const quartzFooterRoutes = [...pages]
    .filter(([, html]) => /Created with[\s\S]*Quartz v/i.test(html))
    .map(([file]) => file)
  if (quartzFooterRoutes.length > 0) {
    findings.push({
      id: "shell.owned-footer",
      affectedRoutes: quartzFooterRoutes,
      current: "The current footer still presents the Quartz default identity.",
      futurePassCondition:
        "The branded Dev Uni footer replaces default Quartz copy on every primary surface.",
      ownerStage: "G004",
    })
  }

  const home = pages.get("index.html")
  if (!/class="[^"\n]*site-menu-toggle[^"\n]*"[^>]*aria-expanded=/i.test(home)) {
    findings.push({
      id: "shell.mobile-menu-state",
      affectedRoutes: ["index.html"],
      current: "The branded mobile navigation toggle and expanded state do not exist yet.",
      futurePassCondition:
        "The mobile menu has a 44px keyboard-operable toggle with truthful aria-expanded state.",
      ownerStage: "G004",
    })
  }
  const currentHomeLinks = home.match(/<a\b[^>]*aria-current="page"[^>]*>/gi) ?? []
  const homeIdentityIsCurrent = currentHomeLinks.some((link) =>
    /class="[^"]*site-identity[^"]*"/i.test(link),
  )
  if (currentHomeLinks.length !== 1 || !homeIdentityIsCurrent) {
    findings.push({
      id: "shell.home-active-navigation",
      affectedRoutes: ["index.html"],
      current: "Home identity is not represented as the current route.",
      futurePassCondition:
        "Exactly one Home/identity navigation target exposes aria-current=page on Home.",
      ownerStage: "G004",
    })
  }

  const headerInsideMainRoutes = [...pages]
    .filter(([, html]) => html.indexOf("<main") < html.indexOf("<header"))
    .map(([file]) => file)
  if (headerInsideMainRoutes.length > 0) {
    findings.push({
      id: "shell.landmark-order",
      affectedRoutes: headerInsideMainRoutes,
      current: "The architecture spike still nests the site header inside main.",
      futurePassCondition:
        "Skip link, branded header, main, and footer appear in semantic document order.",
      ownerStage: "G004",
    })
  }

  const outputFiles = await walk(publicRoot)
  return {
    schemaVersion: 1,
    status: findings.length === 0 ? "pass" : "expected-failure",
    purpose:
      "Explicit pre-redesign baseline. Preservation locks pass now; these shell expectations must pass before final visual acceptance.",
    representativeRoutes,
    derivedOutputFileCount: outputFiles.length,
    expectedFailureIds: findings.map(({ id }) => id),
    findings,
  }
}

async function main() {
  const report = await auditPreRedesign()
  const outputIndex = process.argv.indexOf("--output")
  if (outputIndex >= 0) {
    const outputPath = path.resolve(process.cwd(), process.argv[outputIndex + 1])
    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`)
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  if (process.argv.includes("--require-complete") && report.findings.length > 0) {
    process.exitCode = 1
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
