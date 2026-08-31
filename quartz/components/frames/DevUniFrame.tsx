import { classifyDevUniSurface } from "../devUniSurface"
import { renderDevUniLanding } from "../DevUniLanding"
import { PageFrame, PageFrameProps } from "./types"

/**
 * Branded Dev Uni frame. Surface classification remains server-owned while
 * Quartz components keep ownership of search, theme, reader, and garden tools.
 */
export const DevUniFrame: PageFrame = {
  name: "dev-uni",
  render({
    componentData,
    header,
    beforeBody,
    pageBody: Content,
    afterBody,
    left,
    right,
    footer: Footer,
  }: PageFrameProps) {
    const surface = classifyDevUniSurface(componentData.fileData)
    const isLandingSurface =
      surface === "home" ||
      surface === "about" ||
      surface === "portfolio-index" ||
      surface === "articles-index" ||
      surface === "articles-category"

    return (
      <div class={`dev-uni-frame dev-uni-surface-${surface}`} data-surface={surface}>
        <a class="skip-link" href="#site-content">
          본문으로 건너뛰기
        </a>
        <header class="dev-uni-header">
          <div class="dev-uni-header-shell">
            {header.map((HeaderComponent) => (
              <HeaderComponent {...componentData} />
            ))}
          </div>
        </header>
        <button
          class="dev-uni-mobile-drawer-backdrop"
          type="button"
          aria-label="모바일 탐색 메뉴 닫기"
          tabindex={-1}
        />
        <button
          class="dev-uni-mobile-toc-backdrop"
          type="button"
          aria-label="목차 닫기"
          aria-hidden="true"
          tabindex={-1}
        />
        <aside class="right sidebar dev-uni-context" aria-label="관련 정보">
          <div class="dev-uni-context-inner">
            {right.map((RightComponent) => (
              <RightComponent {...componentData} />
            ))}
          </div>
        </aside>
        <aside class="left sidebar dev-uni-context" aria-label="보조 탐색">
          <div class="dev-uni-context-inner">
            {left.map((LeftComponent) => (
              <LeftComponent {...componentData} />
            ))}
          </div>
        </aside>
        <main class="center" id="site-content" tabindex={-1}>
          {isLandingSurface ? (
            renderDevUniLanding(surface, componentData)
          ) : (
            <>
              <div class="page-header">
                <div class="popover-hint">
                  {beforeBody.map((BeforeBodyComponent) => (
                    <BeforeBodyComponent {...componentData} />
                  ))}
                </div>
              </div>
              <Content {...componentData} />
              <hr />
              <div class="page-footer">
                {afterBody.map((AfterBodyComponent) => (
                  <AfterBodyComponent {...componentData} />
                ))}
              </div>
            </>
          )}
        </main>
        <button
          class="dev-uni-mobile-toc-toggle"
          type="button"
          aria-label="목차 열기"
          aria-expanded="false"
          data-visible="false"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="5" cy="7" r="1" />
            <circle cx="5" cy="12" r="1" />
            <circle cx="5" cy="17" r="1" />
            <path d="M9 7h10M9 12h10M9 17h10" />
          </svg>
        </button>
        <button
          class="dev-uni-scroll-top"
          type="button"
          aria-label="페이지 최상단으로 이동"
          data-visible="false"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M6 14l6-6 6 6" />
          </svg>
        </button>
        <Footer {...componentData} />
      </div>
    )
  },
}
