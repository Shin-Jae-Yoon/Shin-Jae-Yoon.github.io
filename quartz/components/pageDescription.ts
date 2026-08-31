import { i18n } from "../i18n"
import { unescapeHTML } from "../util/escape"
import { QuartzComponentProps } from "./types"

export const HOME_DESCRIPTION =
  "Dev Uni에서 Java와 백엔드 개발, 컴퓨터 과학 학습 기록과 프로젝트 경험을 공유합니다."

export function resolvePageDescription(
  cfg: QuartzComponentProps["cfg"],
  fileData: QuartzComponentProps["fileData"],
): string {
  const description =
    fileData.frontmatter?.socialDescription ??
    fileData.frontmatter?.description ??
    unescapeHTML(fileData.description?.trim() ?? "")

  if (description.trim().length > 0) return description
  if (fileData.slug === "index") return HOME_DESCRIPTION

  const fallbackTitle =
    fileData.frontmatter?.title ??
    fileData.slug?.split("/").filter(Boolean).at(-1)?.replaceAll("-", " ") ??
    i18n(cfg.locale).propertyDefaults.title

  return `${fallbackTitle} 페이지에서 Dev Uni의 관련 글과 지식 연결을 탐색합니다.`
}
