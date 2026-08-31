import { QuartzComponentProps } from "../../components/types"
import {
  classifyDevUniSurface,
  isDevUniAbout,
  isDevUniArticle,
  isDevUniGarden,
  isDevUniHome,
  isDevUniPortfolio,
  isDevUniUtility,
} from "../../components/devUniSurface"

export type ConditionPredicate = (props: QuartzComponentProps) => boolean

const builtinConditions: Record<string, ConditionPredicate> = {
  "not-index": (props) => props.fileData.slug !== "index",
  "has-tags": (props) => {
    const tags = props.fileData.frontmatter?.tags
    return Array.isArray(tags) && tags.length > 0
  },
  "has-backlinks": (props) => {
    const backlinks = (props.fileData as Record<string, unknown>).backlinks
    return Array.isArray(backlinks) && backlinks.length > 0
  },
  "has-toc": (props) => {
    const toc = (props.fileData as Record<string, unknown>).toc
    return Array.isArray(toc) && toc.length > 0
  },
}

const customConditions = new Map<string, ConditionPredicate>()

const devUniConditions = {
  "dev-uni-home": (props) => isDevUniHome(props.fileData),
  "dev-uni-about": (props) => isDevUniAbout(props.fileData),
  "dev-uni-portfolio": (props) => isDevUniPortfolio(props.fileData),
  "dev-uni-garden": (props) => isDevUniGarden(props.fileData),
  "dev-uni-article": (props) => isDevUniArticle(props.fileData),
  "dev-uni-utility": (props) => isDevUniUtility(props.fileData),
  "dev-uni-explorer": (props) => isDevUniGarden(props.fileData),
  "dev-uni-graph": (props) => isDevUniGarden(props.fileData),
  "dev-uni-toc": (props) => {
    const surface = classifyDevUniSurface(props.fileData)
    return surface === "garden-detail" || surface === "article-detail"
  },
  "dev-uni-backlinks": (props) => {
    const surface = classifyDevUniSurface(props.fileData)
    return surface === "garden-detail" || surface === "article-detail"
  },
  "dev-uni-reader-mode": (props) => {
    const surface = classifyDevUniSurface(props.fileData)
    return surface === "garden-detail" || surface === "article-detail"
  },
  // 댓글은 Brain 의 개별 문서에만 붙인다. 지식, 강의, 도서, 메모가 여기 들어간다.
  //
  // `garden-detail` 만으로는 부족하다. classifyDevUniSurface 는 brain 아래 슬러그를
  // 전부 garden-detail 로 보기 때문에 폴더 인덱스도 걸린다. 폴더 페이지는 자식 목록일
  // 뿐이라 댓글을 달 자리가 아니고, 글 하나에 붙어야 할 글타래가 목록에도 생긴다.
  "dev-uni-comments": (props) => {
    const slug = props.fileData.slug ?? ""
    if (slug === "index" || slug.endsWith("/index")) return false
    return classifyDevUniSurface(props.fileData) === "garden-detail"
  },
} satisfies Record<string, ConditionPredicate>

export function registerCondition(name: string, predicate: ConditionPredicate): void {
  customConditions.set(name, predicate)
}

/** Register repository-owned route predicates before either YAML loader runs. */
export function registerDevUniConditions(): void {
  for (const [name, predicate] of Object.entries(devUniConditions)) {
    registerCondition(name, predicate)
  }
}

export function getCondition(name: string): ConditionPredicate | undefined {
  return customConditions.get(name) ?? builtinConditions[name]
}

export function getAllConditionNames(): string[] {
  return [...Object.keys(builtinConditions), ...customConditions.keys()]
}
