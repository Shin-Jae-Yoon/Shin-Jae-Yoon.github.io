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
