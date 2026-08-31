import { QuartzComponent, QuartzComponentConstructor } from "./types"

const DevUniFooter: QuartzComponent = ({ cfg }) => {
  const generatedYear = new Date(cfg.generatedPageDate ?? "2026-01-01T00:00:00Z").getFullYear()

  return (
    <footer class="dev-uni-footer">
      <div class="dev-uni-footer-shell">
        <div class="dev-uni-footer-identity">
          <strong>Dev Uni</strong>
          <p>배우고 연결하고 기록합니다.</p>
        </div>
        <nav aria-label="외부 링크">
          <a href="https://github.com/Shin-Jae-Yoon">GitHub</a>
          <a href="https://jae-yoon.tistory.com">Tistory</a>
        </nav>
        <p class="dev-uni-copyright">© {generatedYear} Shin Jae-yoon</p>
      </div>
    </footer>
  )
}

export default (() => DevUniFooter) satisfies QuartzComponentConstructor
