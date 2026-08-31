import { FullSlug, resolveRelative } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor } from "./types"
// @ts-expect-error inline script is bundled as a string by Quartz
import shellScript from "./scripts/devUniShell.inline"

const primaryRoutes = [
  { href: "about", label: "About" },
  { href: "portfolio", label: "Portfolio" },
  { href: "brain", label: "Brain" },
  { href: "articles", label: "Articles" },
] as const

const PrimaryNavigation: QuartzComponent = ({ fileData }) => {
  const currentSlug = fileData.slug ?? ("index" as FullSlug)
  const aboutIsCurrent = currentSlug === "about"
  const linkTo = (slug: string) => resolveRelative(currentSlug, slug as FullSlug)

  return (
    <div class="site-header-surface">
      <a
        class="site-identity internal"
        href={linkTo("index")}
        data-no-popover="true"
        aria-label="Dev Uni 홈"
        aria-current={currentSlug === "index" ? "page" : undefined}
      >
        <span class="site-identity-name">Dev Uni</span>
      </a>
      <nav class="primary-navigation" aria-label="주요 탐색">
        <ul id="primary-navigation">
          {primaryRoutes.map(({ href, label }) => {
            const isCurrent =
              href === "about"
                ? aboutIsCurrent
                : currentSlug === href || currentSlug.startsWith(`${href}/`)
            return (
              <li>
                <a
                  class="internal"
                  href={linkTo(href)}
                  data-no-popover="true"
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {label}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
      <button
        class="site-menu-toggle"
        type="button"
        aria-label="메뉴 닫기"
        aria-expanded="true"
        aria-controls="primary-navigation"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
    </div>
  )
}

PrimaryNavigation.afterDOMLoaded = shellScript

export default (() => PrimaryNavigation) satisfies QuartzComponentConstructor
