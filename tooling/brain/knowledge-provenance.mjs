/**
 * 출처 구분 검사기.
 *
 * `.claude/skills/knowledge-provenance/SKILL.md`가 정한 것을 확인한다. 본문은
 * 원본에서 온 사용자의 말이고, 웹에서 온 것은 `## 참고`에만 있어야 하며, 검증
 * 통과 여부는 프론트매터가 들고 있어야 한다.
 *
 *   node tooling/brain/knowledge-provenance.mjs
 */
import { readdir, readFile, access } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const knowledgeRoot = path.join(repoRoot, "content/brain/knowledge")
const contentRoot = path.join(repoRoot, "content")

const ORIGIN_KEYS = ["mined", "verified", "scouted"]
const DATE = /^\d{4}-\d{2}-\d{2}$/

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full)))
    else if (entry.name.endsWith(".md") && entry.name !== "index.md") out.push(full)
  }
  return out
}

const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  )

/** `## <제목>` 부터 다음 `##` 앞까지. 없으면 null. */
export function section(body, name) {
  const start = new RegExp(`^##[ \\t]+${name}[ \\t]*$`, "m").exec(body)
  if (!start) return null
  const rest = body.slice(start.index + start[0].length)
  const next = /^##[ \t]+/m.exec(rest)
  return next ? rest.slice(0, next.index) : rest
}

export async function auditProvenance() {
  const files = (await walk(knowledgeRoot)).sort()
  const problems = []
  const stats = { entries: files.length, verified: 0, scouted: 0, withReference: 0 }
  const report = (file, rule, detail) =>
    problems.push({ file: path.relative(repoRoot, file), rule, detail })

  for (const file of files) {
    const text = await readFile(file, "utf8")
    const fmMatch = /^---\n([\s\S]*?)\n---\n?/.exec(text)
    const frontmatter = fmMatch ? fmMatch[1] : ""
    const body = fmMatch ? text.slice(fmMatch[0].length) : text

    const origin = /^origin:\n((?:[ \t]+\w+:.*\n?)+)/m.exec(frontmatter)
    const fields = {}
    if (origin) {
      for (const line of origin[1].split("\n").filter((l) => l.trim())) {
        const [key, ...rest] = line.trim().split(":")
        fields[key] = rest.join(":").split("#")[0].trim()
      }
      for (const [key, value] of Object.entries(fields)) {
        if (!ORIGIN_KEYS.includes(key)) report(file, "origin 에 모르는 키", key)
        else if (!DATE.test(value)) report(file, "origin 날짜 형식", `${key}: ${value}`)
      }
    }
    if (fields.verified) stats.verified += 1
    if (fields.scouted) stats.scouted += 1

    // ## 참고 는 웹에서 온 것만 담는다. 링크 없는 문단은 출처를 못 대는 문단이다.
    const reference = section(body, "참고")
    if (reference !== null) {
      stats.withReference += 1
      const paragraphs = reference
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
      if (paragraphs.length === 0) report(file, "## 참고 가 비어 있음", "")
      for (const paragraph of paragraphs) {
        // prettier 는 괄호가 든 URL 을 `](<https://...>)` 로 감싼다. 그 꼴도 링크다.
        if (!/\[[^\]]+\]\(<?https?:\/\//.test(paragraph)) {
          report(file, "## 참고 문단에 링크 없음", paragraph.split("\n")[0].slice(0, 46))
        }
      }
      if (!fields.scouted) report(file, "## 참고 가 있는데 origin.scouted 없음", "")
    } else if (fields.scouted) {
      report(file, "origin.scouted 가 있는데 ## 참고 없음", "")
    }

    // ## 출처 는 원본 위키링크만. 바깥 링크가 섞이면 어디까지 읽은 것인지 흐려진다.
    const source = section(body, "출처")
    if (source === null) report(file, "## 출처 없음", "")
    else {
      if (/https?:\/\//.test(source)) report(file, "## 출처 에 웹 링크", "## 참고 로 옮긴다")
      const links = [...source.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)].map((m) =>
        m[1].trim(),
      )
      if (links.length === 0) report(file, "## 출처 에 원본 링크 없음", "")
      for (const link of links) {
        if (!(await exists(path.join(contentRoot, `${link}.md`)))) {
          report(file, "## 출처 경로가 실재하지 않음", link)
        }
      }
    }

    // 본문에 웹 링크가 있으면 원본에서 온 글에 바깥 내용이 섞인 것이다.
    const main = body.split(/^##[ \t]+/m)[0]
    if (/https?:\/\//.test(main)) report(file, "본문에 웹 링크", "## 참고 로 옮긴다")
  }

  return { problems, stats }
}

// argv[1] 은 `node -e` 로 불러 쓸 때 없다. 그때는 CLI 가 아니다.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { problems, stats } = await auditProvenance()
  const byRule = new Map()
  for (const p of problems) byRule.set(p.rule, (byRule.get(p.rule) ?? 0) + 1)
  for (const p of problems) console.log(`${p.file}\n  ${p.rule}${p.detail ? `: ${p.detail}` : ""}`)

  console.log(`\n항목 ${stats.entries}개, 위반 ${problems.length}건`)
  for (const [rule, count] of [...byRule].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(5)}  ${rule}`)
  }
  console.log(
    `\n검증 통과 ${stats.verified}/${stats.entries}, ` +
      `웹 보탬 ${stats.scouted}, ## 참고 있는 항목 ${stats.withReference}`,
  )
  process.exit(problems.length ? 1 : 0)
}
