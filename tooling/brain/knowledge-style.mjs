/**
 * 지식 노트 검사기.
 *
 * `.claude/skills/knowledge-note/SKILL.md`가 정한 규칙을 기계로 확인한다. 규칙을
 * 문서로만 적어두면 다음 판에서 또 흐트러지므로, 어길 수 있는 것은 전부 여기서 센다.
 *
 *   node tooling/brain/knowledge-style.mjs            어긴 곳만
 *   node tooling/brain/knowledge-style.mjs --summary  집계까지
 */
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const knowledgeRoot = path.join(repoRoot, "content/brain/knowledge")

/**
 * 자리가 정해진 `##` 제목. 이 셋만 고정이고 나머지는 문서가 정한다.
 * `참고` 는 웹에서 온 내용만 담는다. knowledge-provenance 스킬이 그 규칙을 맡는다.
 *
 * 한때 여덟 개 어휘로 닫아두었더니 236개가 전부 같은 목차를 달았다. 그것도 AI 티다.
 * 위키들의 지침은 반대다. Wikipedia 는 "Normally use nouns or noun phrases",
 * "Languages, not What languages are spoken?" 라고 적고 고정 목차를 두지 않는다.
 * 그래서 지금은 어휘를 닫는 대신 제목의 **꼴**을 검사한다.
 */
export const FIXED_SECTIONS = ["참고", "관련", "출처"]
export const REQUIRED_SECTIONS = ["관련", "출처"]

/** 한 단어 틀. 아무것도 가리키지 못한다. */
export const TEMPLATE_HEADINGS = ["왜", "어떻게", "종류", "비교", "한계", "정의", "개요", "설명"]

/** 의문형 어미와 의문사. Wikipedia 가 명시적으로 금지한 꼴이다. */
const QUESTION_TAIL = /(는가|은가|ㄴ가|인가|일까|을까|ㄹ까|나요|가요|는지)$/
const QUESTION_HEAD = /^(왜|어디|언제|무엇|어느|얼마)\b/

/** 문장형. 종결어미로 끝나면서 띄어쓰기가 있으면 절이지 이름이 아니다. */
const SENTENCE_TAIL = /(다|다\.|요|음)$/

export function headingProblem(heading, title) {
  const h = heading.trim()
  if (FIXED_SECTIONS.includes(h)) return null
  if (TEMPLATE_HEADINGS.includes(h))
    return ["한 단어 틀 제목", `${h} — 그 절에 든 것을 가리키게 쓴다`]
  if (QUESTION_TAIL.test(h) || QUESTION_HEAD.test(h)) return ["의문형 제목", h]
  if (SENTENCE_TAIL.test(h) && h.includes(" ")) return ["문장형 제목", h]
  if (title && (h === title || h === `${title}란` || h === `${title}이란`))
    return ["문서 제목을 되풀이", h]
  return null
}
export const BOLD_BUDGET = 5

export const BANNED_PHRASES = [
  "즉,",
  "결국",
  "정리하면",
  "핵심은",
  "라는 점이다",
  "라고 보면 된다",
  "주목할 것은",
]
export const BANNED_CHARS = [
  ["·", "가운뎃점"],
  ["—", "em dash"],
]

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full)))
    else if (entry.name.endsWith(".md")) out.push(full)
  }
  return out
}

function splitDocument(text) {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text)
  return match
    ? { frontmatter: match[1], body: text.slice(match[0].length) }
    : { frontmatter: "", body: text }
}

function readScalar(frontmatter, key) {
  const match = new RegExp(`^${key}:[ \\t]*(.+)$`, "m").exec(frontmatter)
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : undefined
}

function readList(frontmatter, key) {
  const match = new RegExp(`^${key}:\\n((?:[ \\t]+-[ \\t]+.*\\n?)+)`, "m").exec(frontmatter)
  if (!match) return []
  return match[1]
    .split("\n")
    .filter((line) => line.trim())
    .map((line) =>
      line
        .replace(/^[ \t]*-[ \t]*/, "")
        .trim()
        .replace(/^["']|["']$/g, ""),
    )
}

/** alias가 라우트가 될 때의 모양. 이 값이 겹치면 한쪽이 조용히 진다. */
export const toSlug = (value) => value.normalize("NFC").trim().toLowerCase().replace(/\s+/g, "-")

export async function auditKnowledge() {
  const files = (await walk(knowledgeRoot)).sort()
  const entries = files.filter((f) => path.basename(f) !== "index.md")
  const indexes = new Set(files.filter((f) => path.basename(f) === "index.md").map(path.dirname))

  const problems = []
  const names = new Map()
  const slugs = new Map()
  const stats = { entries: entries.length, bold: 0, tables: 0, sections: new Map() }
  const report = (file, rule, detail) =>
    problems.push({ file: path.relative(repoRoot, file), rule, detail })

  for (const dir of new Set(files.map(path.dirname))) {
    if (!indexes.has(dir))
      report(path.join(dir, "index.md"), "폴더 인덱스 없음", path.basename(dir))
  }

  // 폴더 인덱스의 title 도 탐색기에 뜨는 표시명이다. 항목 title/alias 와 같으면
  // 링크와 화면 양쪽에서 어느 쪽을 가리키는지 흐려진다.
  const indexTitles = new Map()
  for (const dir of indexes) {
    const file = path.join(dir, "index.md")
    const { frontmatter } = splitDocument(await readFile(file, "utf8"))
    const title = readScalar(frontmatter, "title")
    if (title) indexTitles.set(title.normalize("NFC"), file)
  }

  for (const file of entries) {
    const dir = path.basename(path.dirname(file))
    if (path.basename(file, ".md") === dir) {
      report(file, "파일명이 폴더명과 같음", `Quartz가 ${dir}/ 의 폴더 인덱스로 흡수한다`)
    }

    const text = await readFile(file, "utf8")
    const { frontmatter, body } = splitDocument(text)
    const title = readScalar(frontmatter, "title")
    const aliases = readList(frontmatter, "aliases")

    if (!title) report(file, "title 없음", "")
    if (readList(frontmatter, "tags").length === 0) report(file, "tags 없음", "")
    // 별칭은 사이트 최상위에 리다이렉트 스텁을 만든다. 그 슬러그가 문서의 파일명과
    // 같으면 스텁이 문서 자신을 가린다. `markdownLinkResolution: shortest`가 더 짧은
    // 최상위 쪽을 고르기 때문이다. 그래서 파일명과 같아지는 title은 별칭으로 적지
    // 않는다. 적지 않아도 파일명이 이미 그 이름의 라우트다.
    const stem = path.basename(file, ".md")
    if (title && !aliases.includes(title) && toSlug(title) !== toSlug(stem)) {
      report(file, "title이 alias에 없음", `[[${title}]] 링크가 404가 된다`)
    }
    for (const name of aliases) {
      if (toSlug(name) === toSlug(stem)) {
        report(file, "파일명을 가리는 alias", `${name} — 최상위 /${toSlug(name)} 이 문서를 가린다`)
      }
    }
    for (const name of new Set([title, ...aliases].filter(Boolean))) {
      const key = name.normalize("NFC")
      // 같은 이름이라도 겹쳐 보이는 것은 그 폴더 안에 있을 때뿐이다. 메시징의
      // `스트림` 폴더와 자바의 `스트림` 노트는 나란히 뜨지 않으므로 문제가 아니다.
      const owner = indexTitles.get(key)
      if (owner && name === title && file.startsWith(path.dirname(owner) + path.sep)) {
        report(file, "폴더 이름과 겹침", `${key} — ${path.relative(repoRoot, owner)}`)
      }
      if (names.has(key) && names.get(key) !== file) {
        report(file, "title/alias 중복", `${key} — ${path.relative(repoRoot, names.get(key))}`)
      } else names.set(key, file)
      const slug = toSlug(name)
      if (slugs.has(slug) && slugs.get(slug) !== file) {
        report(file, "슬러그 충돌", `${slug} — ${path.relative(repoRoot, slugs.get(slug))}`)
      } else slugs.set(slug, file)
    }

    const headings = [...body.matchAll(/^##[ \t]+(.+)$/gm)].map((m) => m[1].trim())
    for (const heading of headings)
      stats.sections.set(heading, (stats.sections.get(heading) ?? 0) + 1)
    for (const heading of headings) {
      const problem = headingProblem(heading, title)
      if (problem) report(file, problem[0], problem[1])
    }
    for (const required of REQUIRED_SECTIONS) {
      if (!headings.includes(required)) report(file, "필수 섹션 없음", `## ${required}`)
    }
    // 고정 셋은 언제나 끝에, 참고 → 관련 → 출처 순으로 온다.
    const tail = headings.filter((h) => FIXED_SECTIONS.includes(h))
    const firstFixed = headings.findIndex((h) => FIXED_SECTIONS.includes(h))
    if (firstFixed !== -1 && headings.slice(firstFixed).some((h) => !FIXED_SECTIONS.includes(h))) {
      report(file, "참고/관련/출처 뒤에 다른 절", headings.slice(firstFixed).join(" → "))
    }
    const order = tail.map((h) => FIXED_SECTIONS.indexOf(h))
    if (order.some((v, i) => i > 0 && v < order[i - 1])) {
      report(file, "고정 절 순서 어긋남", tail.join(" → "))
    }
    // 하위 절은 둘 이상이거나 없거나. MDN 지침이다.
    for (const section of body.split(/^##[ \t]+/m).slice(1)) {
      const subs = [...section.matchAll(/^###[ \t]+(.+)$/gm)]
      if (subs.length === 1) {
        report(file, "하위 절이 하나뿐", `### ${subs[0][1].trim()}`)
      }
    }

    const lead = body.split(/^##[ \t]/m)[0]
    const bold = [...body.matchAll(/\*\*[^*\n]+\*\*/g)].length
    stats.bold += bold
    if (bold > BOLD_BUDGET) report(file, "볼드 과다", `${bold}개 (예산 ${BOLD_BUDGET})`)
    if (/\*\*/.test(lead)) report(file, "리드 문단에 볼드", "")
    if (/^\|.*\|$/m.test(body)) stats.tables += 1

    for (const [char, label] of BANNED_CHARS) {
      const count = body.split(char).length - 1
      if (count) report(file, `${label} 사용`, `${count}회`)
    }
    for (const phrase of BANNED_PHRASES) {
      const count = body.split(phrase).length - 1
      if (count) report(file, "금지 표현", `${phrase} (${count}회)`)
    }
  }

  return { problems, stats }
}

// argv[1] 은 `node -e` 로 불러 쓸 때 없다. 그때는 CLI 가 아니다.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { problems, stats } = await auditKnowledge()
  const byRule = new Map()
  for (const p of problems) byRule.set(p.rule, (byRule.get(p.rule) ?? 0) + 1)

  for (const p of problems) console.log(`${p.file}\n  ${p.rule}${p.detail ? `: ${p.detail}` : ""}`)

  console.log(`\n항목 ${stats.entries}개, 위반 ${problems.length}건`)
  for (const [rule, count] of [...byRule].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(5)}  ${rule}`)
  }
  if (process.argv.includes("--summary")) {
    const once = [...stats.sections.values()].filter((c) => c === 1).length
    console.log(`\n섹션 제목 ${stats.sections.size}종 (1회성 ${once}종)`)
    console.log(`볼드 ${stats.bold}개, 표 있는 항목 ${stats.tables}개`)
  }
  process.exit(problems.length ? 1 : 0)
}
