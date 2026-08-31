import { PageFrame, PageFrameProps } from "./types"

/**
 * Minimal page frame — no sidebars, no header/footer chrome. Only the
 * page body is rendered with a thin wrapper, plus the footer for legal/link
 * obligations.
 *
 * Useful for immersive page types like full-screen canvases, kiosks,
 * or custom landing pages that want complete control of the viewport.
 */
export const MinimalFrame: PageFrame = {
  name: "minimal",
  render({ componentData, pageBody: Content, footer: Footer }: PageFrameProps) {
    return (
      <>
        <a class="skip-link" href="#site-content">
          본문으로 건너뛰기
        </a>
        <main class="center minimal" id="site-content" tabindex={-1}>
          <Content {...componentData} />
        </main>
        <Footer {...componentData} />
      </>
    )
  },
}
