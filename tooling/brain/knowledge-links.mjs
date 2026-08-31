/**
 * 빌드 산출물에서 깨진 내부 링크를 찾는다.
 *
 * 소스의 `[[...]]`를 title 목록과 대조하는 검사로는 못 잡는다. Quartz는 title이
 * 아니라 슬러그로 라우트를 만들고, 링크가 어디에도 닿지 않아도 빌드는 경고 없이
 * 성공하기 때문이다. 그래서 실제로 나온 HTML의 href를 실제 파일과 맞춰본다.
 *
 * 파일이 있는지만 봐서도 못 잡는 것이 하나 더 있다. alias는 최상위에 meta refresh
 * 스텁을 만드는데, SPA 라우터는 body만 갈아끼우므로 그 refresh가 걸리지 않는다.
 * 파일은 멀쩡히 있고 클릭하면 빈 페이지에서 멈춘다. 그래서 스텁으로 가는 링크도
 * 깨진 것으로 센다.
 *
 * macOS는 파일 이름을 NFD로 들고 있고 HTML 안의 한글은 NFC라, 정규화하지 않으면
 * 멀쩡한 링크가 전부 깨진 것으로 나온다.
 *
 *   node tooling/brain/knowledge-links.mjs          brain/ 전체
 *   node tooling/brain/knowledge-links.mjs knowledge  지식만
 */
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const publicRoot = path.join(repoRoot, "public")
const nfc = (value) => value.normalize("NFC")

async function walk(dir) {
  const out = []
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full)))
    else if (entry.name.endsWith(".html")) out.push(full)
  }
  return out
}

export async function findBrokenLinks(scope = "") {
  const all = await walk(publicRoot)
  if (all.length === 0) throw new Error("public/ 이 비어 있다. 먼저 npx quartz build 를 돌린다")

  const known = new Set(all.map((f) => nfc(path.relative(publicRoot, f).split(path.sep).join("/"))))

  // 리다이렉트 스텁. 여기로 가는 링크는 SPA에서 빈 페이지에 멈춘다.
  //
  // 최상위만 보면 안 된다. alias 에 슬래시가 들어 있으면 스텁이 하위 경로에 생긴다.
  // `I/O 스트림` 은 `i/o-스트림` 이 되어 한 칸 아래에 놓였고, 그래서 오래 숨어 있었다.
  const stubs = new Set()
  for (const file of all) {
    const rel = nfc(path.relative(publicRoot, file).split(path.sep).join("/"))
    const head = (await readFile(file, "utf8")).slice(0, 900)
    if (head.includes('http-equiv="refresh"')) stubs.add(rel.replace(/\.html$/, ""))
  }
  const pages = all.filter((f) =>
    nfc(path.relative(publicRoot, f)).startsWith(path.join("brain", scope)),
  )

  const broken = []
  for (const page of pages) {
    const html = await readFile(page, "utf8")
    // `class="internal"`만 보면 원본에 직접 쓴 <a href>를 놓치고, 조각(#)을 걸러내면
    // 앵커가 붙은 링크를 통째로 놓친다. 둘 다 실제로 깨져 있던 적이 있다.
    for (const match of html.matchAll(/<a\b[^>]*\shref=(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/g)) {
      const raw = match[1] ?? match[2] ?? match[3] ?? ""
      const href = raw.split("#")[0].split("?")[0]
      if (!href) continue
      if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(href)) continue
      const target = path.resolve(path.dirname(page), href)
      if (!target.startsWith(publicRoot)) continue
      // macOS 파일시스템은 대소문자를 구분하지 않아 로컬에서는 200이 뜨지만,
      // GitHub Pages는 구분한다. 그래서 이름을 그대로 대조한다.
      const rel = nfc(path.relative(publicRoot, target).split(path.sep).join("/"))
      if (rel === "") continue // 사이트 루트
      if (stubs.has(rel)) {
        broken.push({ page: path.relative(publicRoot, page), href, reason: "alias 스텁 경유" })
        continue
      }
      if (known.has(rel) || known.has(`${rel}.html`) || known.has(`${rel}/index.html`)) continue
      broken.push({ page: path.relative(publicRoot, page), href, reason: "대상 없음" })
    }
  }
  return broken
}

// argv[1] 은 `node -e` 로 불러 쓸 때 없다. 그때는 CLI 가 아니다.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const scope = process.argv[2] ?? ""
  const broken = await findBrokenLinks(scope)
  for (const { page, href, reason } of broken) console.log(`${page}\n  ${href}  (${reason})`)
  console.log(`\n깨진 내부 링크 ${broken.length}건 (brain/${scope})`)
  process.exit(broken.length ? 1 : 0)
}
