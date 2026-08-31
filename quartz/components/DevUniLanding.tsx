import { FullSlug, resolveRelative } from "../util/path"
import { QuartzComponentProps } from "./types"

type LandingSurface = "home" | "about" | "portfolio-index" | "articles-index" | "articles-category"

type PortfolioMetric = {
  value: string
  label: string
}

type PortfolioProject = {
  number?: string
  title: string
  period: string
  stack: string
  team?: string
  context: string
  groups: Array<{
    label: string
    items: string[]
  }>
  metrics: PortfolioMetric[]
  link?: {
    label: string
    href: string
  }
}

type PortfolioActivity = {
  title: string
  meta: string
  highlights: string[]
}

type PortfolioProfile = {
  name: string
  role: string
  email: string
  phone: string
  github: string
  blog: string
  overview: Array<{ label: string; value: string }>
  company: {
    name: string
    period: string
    role: string
    domain: string
    projects: PortfolioProject[]
  }
  project: PortfolioProject
  activities: PortfolioActivity[]
  education: PortfolioActivity
  writing: Array<{ label: string; href?: string }>
  skills: Array<{
    label: string
    value: string
  }>
}

type ArticleSection = "technical" | "retrospective" | "project" | "uncategorized"

const articleSections: Array<{
  key: Exclude<ArticleSection, "uncategorized">
  label: string
  description: string
}> = [
  { key: "technical", label: "기술", description: "Java, CS, Python과 웹 기술을 정리한 글" },
  { key: "retrospective", label: "회고", description: "배움과 일의 과정을 돌아본 기록" },
  { key: "project", label: "프로젝트", description: "만들고 운영하며 얻은 판단과 결과" },
]

function publishedTime(file: QuartzComponentProps["fileData"]): number {
  const date = file.dates?.published ?? file.dates?.created
  return date instanceof Date ? date.getTime() : 0
}

function displayDate(file: QuartzComponentProps["fileData"]): string {
  const date = file.dates?.published ?? file.dates?.created
  return date instanceof Date
    ? new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date)
    : ""
}

function isTistoryArticle(file: QuartzComponentProps["fileData"]): boolean {
  const slug = file.slug
  return (
    typeof slug === "string" &&
    slug.startsWith("articles/tistory/") &&
    !slug.endsWith("/index") &&
    file.frontmatter?.contentType === "article" &&
    typeof file.frontmatter.title === "string"
  )
}

function articleSection(file: QuartzComponentProps["fileData"]): ArticleSection {
  const section = file.frontmatter?.articleSection
  return section === "technical" ||
    section === "retrospective" ||
    section === "project" ||
    section === "uncategorized"
    ? section
    : "uncategorized"
}

function articleTopic(file: QuartzComponentProps["fileData"]): string {
  const topic = file.frontmatter?.articleTopic
  return typeof topic === "string" && topic.length > 0 ? topic : "기타"
}

const HomeLanding = ({ fileData }: QuartzComponentProps) => {
  const currentSlug = fileData.slug ?? ("index" as FullSlug)
  const linkTo = (slug: string) => resolveRelative(currentSlug, slug as FullSlug)

  return (
    <article class="dev-uni-home home-page" aria-labelledby="home-title">
      <section class="home-introduction">
        <div class="dev-uni-shell home-introduction-inner">
          <div class="home-introduction-copy">
            <p class="home-kicker">DEV UNI&apos;S</p>
            <h1 class="home-title" id="home-title">
              <span>SECOND</span>
              <span>BRAIN</span>
            </h1>
            <p class="home-statement">
              제텔카스텐 기법으로 구성된 저의 두 번째 뇌에 오신 것을 환영합니다.
            </p>
            <p class="home-original-copy">
              흩어진 개발 지식과 경험을 기록하고 연결해, 다시 꺼내 쓸 수 있는 생각으로 만듭니다.
              하나의 메모가 다른 메모와 만나며 더 큰 맥락이 되는 과정을 천천히 둘러보세요.
            </p>
            <div class="home-actions">
              <a class="internal home-primary-action" href={linkTo("brain/index")}>
                Brain 둘러보기 <span aria-hidden="true">→</span>
              </a>
              <a class="internal home-secondary-action" href={linkTo("articles/index")}>
                Articles 읽기
              </a>
            </div>
          </div>
          <figure
            class="home-neural-visual"
            role="img"
            aria-label="생각의 조각이 가지처럼 연결되는 두 번째 뇌"
          >
            <svg viewBox="0 0 460 560" aria-hidden="true">
              <rect class="home-neural-frame" x="1" y="1" width="458" height="558" />
              <path class="home-neural-orbit" d="M66 146C148 48 331 48 398 158" />
              <path class="home-neural-orbit" d="M52 412C151 520 327 513 414 405" />
              <g class="home-neural-branches">
                <path class="home-neural-line line-1" pathLength="1" d="M230 294L163 233L105 183" />
                <path class="home-neural-line line-2" pathLength="1" d="M163 233L190 153L151 101" />
                <path class="home-neural-line line-3" pathLength="1" d="M163 233L85 272L43 241" />
                <path class="home-neural-line line-4" pathLength="1" d="M230 294L305 232L370 179" />
                <path class="home-neural-line line-5" pathLength="1" d="M305 232L282 141L325 82" />
                <path class="home-neural-line line-6" pathLength="1" d="M305 232L386 271L425 237" />
                <path class="home-neural-line line-7" pathLength="1" d="M230 294L169 367L110 427" />
                <path class="home-neural-line line-8" pathLength="1" d="M169 367L194 450L154 500" />
                <path class="home-neural-line line-9" pathLength="1" d="M230 294L300 368L364 430" />
                <path
                  class="home-neural-line line-10"
                  pathLength="1"
                  d="M300 368L277 454L319 507"
                />
              </g>
              <g class="home-neural-signals">
                <path
                  class="home-neural-signal signal-1"
                  pathLength="1"
                  d="M151 101L190 153L163 233L230 294L305 232L370 179"
                />
                <path
                  class="home-neural-signal signal-2"
                  pathLength="1"
                  d="M43 241L85 272L163 233L230 294L169 367L110 427"
                />
                <path
                  class="home-neural-signal signal-3"
                  pathLength="1"
                  d="M325 82L282 141L305 232L230 294L300 368L319 507"
                />
              </g>
              <g class="home-neural-nodes">
                <circle class="home-neural-node node-core" cx="230" cy="294" r="18" />
                <circle class="home-neural-node node-related" cx="163" cy="233" r="10" />
                <circle class="home-neural-node node-related" cx="305" cy="232" r="10" />
                <circle class="home-neural-node node-related" cx="169" cy="367" r="10" />
                <circle class="home-neural-node node-related" cx="300" cy="368" r="10" />
                <circle class="home-neural-node node-small" cx="105" cy="183" r="6" />
                <circle class="home-neural-node node-small" cx="190" cy="153" r="6" />
                <circle class="home-neural-node node-small" cx="151" cy="101" r="5" />
                <circle class="home-neural-node node-small" cx="85" cy="272" r="6" />
                <circle class="home-neural-node node-small" cx="43" cy="241" r="5" />
                <circle class="home-neural-node node-small" cx="370" cy="179" r="6" />
                <circle class="home-neural-node node-small" cx="282" cy="141" r="6" />
                <circle class="home-neural-node node-small" cx="325" cy="82" r="5" />
                <circle class="home-neural-node node-small" cx="386" cy="271" r="6" />
                <circle class="home-neural-node node-small" cx="425" cy="237" r="5" />
                <circle class="home-neural-node node-small" cx="110" cy="427" r="6" />
                <circle class="home-neural-node node-small" cx="194" cy="450" r="6" />
                <circle class="home-neural-node node-small" cx="154" cy="500" r="5" />
                <circle class="home-neural-node node-small" cx="364" cy="430" r="6" />
                <circle class="home-neural-node node-small" cx="277" cy="454" r="6" />
                <circle class="home-neural-node node-small" cx="319" cy="507" r="5" />
              </g>
              <text x="32" y="42">
                RECORD
              </text>
              <text x="327" y="534">
                CONNECT
              </text>
            </svg>
            <figcaption>기록하고, 연결하고, 다시 생각합니다.</figcaption>
          </figure>
        </div>
      </section>

      <section
        class="dev-uni-shell home-content-row home-method"
        aria-labelledby="home-method-title"
      >
        <div>
          <p class="home-section-label">HOW IT GROWS</p>
          <h2 id="home-method-title">
            <span>두 번째 뇌는 작은</span>
            <span>메모에서 시작합니다.</span>
          </h2>
        </div>
        <div class="home-method-copy">
          <p class="home-method-introduction">
            제텔카스텐은 자료를 많이 저장하는 방법이 아니라, 하나의 생각을 자신의 말로 적고 기존
            생각과 관계를 만드는 작업 방식입니다. 이곳에서는 짧은 메모가 서로를 설명하고 반박하고
            확장하며, 이후 글과 판단의 재료로 자랍니다.
          </p>
          <dl class="home-method-list">
            <div>
              <dt>ATOMIC NOTE</dt>
              <dd>
                배운 내용을 그대로 옮기지 않고, 나중에 홀로 읽어도 이해되는 하나의 생각으로 다시
                씁니다.
              </dd>
            </div>
            <div>
              <dt>ADDRESS &amp; LINK</dt>
              <dd>
                각 메모에 다시 찾을 수 있는 주소를 주고, 새 메모가 기존 생각을 설명하거나 확장하는
                지점을 연결합니다.
              </dd>
            </div>
            <div>
              <dt>STRUCTURE NOTE</dt>
              <dd>
                메모가 쌓이면 연결의 맥락을 따라 주제의 진입점을 만들고, 흩어진 생각을 하나의 글과
                판단으로 꺼냅니다.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section class="home-route-guide" aria-labelledby="home-route-guide-title">
        <div class="dev-uni-shell home-route-guide-inner">
          <div class="home-route-geometry" aria-hidden="true">
            <svg viewBox="0 0 440 440">
              <rect x="34" y="34" width="372" height="372" />
              <circle cx="220" cy="220" r="126" />
              <circle cx="220" cy="220" r="58" />
              <path d="M94 220H346M220 94V346" />
              <path d="M126 126L314 314M314 126L126 314" />
              <path class="home-route-geometry-accent" d="M220 34C280 82 332 116 406 126" />
              <circle class="home-route-geometry-node" cx="220" cy="220" r="11" />
              <circle class="home-route-geometry-node" cx="346" cy="220" r="7" />
              <circle class="home-route-geometry-node" cx="126" cy="126" r="7" />
            </svg>
            <p>ONE PERSON · FOUR WAYS TO READ</p>
          </div>
          <div class="home-route-directory">
            <div class="home-route-directory-heading">
              <p class="home-section-label">EXPLORE DEV UNI</p>
              <h2 id="home-route-guide-title">
                <span>저를 알아가는</span>
                <span>네 가지 경로</span>
              </h2>
            </div>
            <ol>
              <li>
                <a class="internal" href={linkTo("about")}>
                  <span>01</span>
                  <strong>About</strong>
                  <p>개발자라는 역할 앞에 있는 사람, 취향과 선택의 이야기를 담았습니다.</p>
                  <i aria-hidden="true">↗</i>
                </a>
              </li>
              <li>
                <a class="internal" href={linkTo("portfolio/index")}>
                  <span>02</span>
                  <strong>Portfolio</strong>
                  <p>실제 업무에서 마주한 문제와 판단, 해결 과정과 결과를 정리했습니다.</p>
                  <i aria-hidden="true">↗</i>
                </a>
              </li>
              <li>
                <a class="internal" href={linkTo("brain/index")}>
                  <span>03</span>
                  <strong>Brain</strong>
                  <p>작은 메모가 서로 연결되며 이해로 자라나는 두 번째 뇌입니다.</p>
                  <i aria-hidden="true">↗</i>
                </a>
              </li>
              <li>
                <a class="internal" href={linkTo("articles/index")}>
                  <span>04</span>
                  <strong>Articles</strong>
                  <p>기술과 경험을 한 편의 글로 다듬어 오래 남기는 공간입니다.</p>
                  <i aria-hidden="true">↗</i>
                </a>
              </li>
            </ol>
          </div>
        </div>
      </section>
    </article>
  )
}

const PortfolioLanding = ({ fileData }: QuartzComponentProps) => {
  const portfolio = fileData.frontmatter?.portfolio as PortfolioProfile | undefined
  if (!portfolio) return null

  const renderMetrics = (metrics: PortfolioMetric[]) =>
    metrics.length > 0 && (
      <dl class="portfolio-project-metrics">
        {metrics.map((metric) => (
          <div>
            <dt>{metric.value}</dt>
            <dd>{metric.label}</dd>
          </div>
        ))}
      </dl>
    )

  const renderProject = (project: PortfolioProject, className: string) => (
    <article class={className}>
      <header class="portfolio-project-index">
        {project.number && <span>{project.number}</span>}
        <time>{project.period}</time>
      </header>
      <div class="portfolio-project-body">
        <div class="portfolio-project-heading">
          <div>
            <p>{project.stack}</p>
            <h3>{project.title}</h3>
          </div>
          {project.link && (
            <a href={project.link.href} target="_blank" rel="noreferrer">
              {project.link.label} <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
        {project.team && <p class="portfolio-project-team">{project.team}</p>}
        <p class="portfolio-project-context">{project.context}</p>
        <div class="portfolio-project-groups">
          {project.groups.map((group) => (
            <section>
              <h4>{group.label}</h4>
              <ul>
                {group.items.map((item) => (
                  <li>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        {renderMetrics(project.metrics)}
      </div>
    </article>
  )

  return (
    <article class="dev-uni-portfolio portfolio-page" aria-labelledby="portfolio-title">
      <section class="dev-uni-shell portfolio-hero">
        <div class="portfolio-identity">
          <p class="home-section-label">PORTFOLIO</p>
          <h1 id="portfolio-title">{portfolio.name}</h1>
          <p class="portfolio-role">{portfolio.role}</p>
        </div>
        <div class="portfolio-introduction">
          <address class="portfolio-contact" aria-label="연락처와 외부 프로필">
            <dl>
              <div class="portfolio-contact-email">
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${portfolio.email}`}>{portfolio.email}</a>
                </dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>
                  <a href={`tel:${portfolio.phone.replaceAll("-", "")}`}>{portfolio.phone}</a>
                </dd>
              </div>
              <div>
                <dt>GitHub</dt>
                <dd>
                  <a href={portfolio.github} target="_blank" rel="noreferrer">
                    Shin-Jae-Yoon ↗
                  </a>
                </dd>
              </div>
              <div>
                <dt>Blog</dt>
                <dd>
                  <a href={portfolio.blog} target="_blank" rel="noreferrer">
                    Dev Uni ↗
                  </a>
                </dd>
              </div>
            </dl>
          </address>
        </div>
      </section>

      <section
        class="portfolio-section portfolio-engineering-profile"
        aria-labelledby="portfolio-profile-title"
      >
        <div class="dev-uni-shell portfolio-section-inner">
          <header class="portfolio-section-heading">
            <p class="home-section-label">ENGINEERING PROFILE</p>
            <h2 id="portfolio-profile-title">개발자로서의 태도</h2>
          </header>
          <div class="portfolio-engineering-copy">
            <p>
              안녕하세요. 백엔드 개발자 신재윤입니다. 빠르게 변화하는 시대에 유연하게 적응하기 위해
              단순히 구현하는 것에서 그치지 않고, 유지보수가 수월하고 확장 가능한 코드를 작성하려고
              노력해왔습니다. 이러한 과정에서 객체지향 프로그래밍, 추상화에 큰 매력을 느꼈습니다.
            </p>
            <p>
              소프트웨어 제품을 개발할 때, 방대한 지식을 가진 것은 중요합니다. 이를 위해 끊임없이
              노력하고 특히, 기본적인 원리를 깊게 공부하는 것이 중요하다고 여깁니다. 하지만 그럼에도
              모든 지식을 알 수 없기에 팀원들과의 소통으로 문제를 해결하는 것이 제가 보는
              핵심입니다. 저와 팀원이 가진 지식이 통합하여 하나의 거대한 집합체가 되었을 때 커다란
              희열을 느낍니다.
            </p>
            <p>
              인사이트 공유와 코드리뷰로 동료와 함께 성장하며, 열린 마음으로 피드백을 수용하는
              자세로 사람들의 불편함을 해결하고 더 나은 삶을 살게 해주는 소프트웨어 제품을 개발하기
              위해 나아가는 중입니다.
            </p>
          </div>
          <ol class="portfolio-engineering-principles">
            <li>
              <span>01</span>
              <p>기본적인 원리를 깊게 공부하는 것이 중요하다고 여깁니다.</p>
            </li>
            <li>
              <span>02</span>
              <p>팀원들과의 소통으로 문제를 해결하는 것이 제가 보는 핵심입니다.</p>
            </li>
            <li>
              <span>03</span>
              <p>
                인사이트 공유와 코드리뷰로 동료와 함께 성장하며, 열린 마음으로 피드백을 수용합니다.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section class="portfolio-section portfolio-overview" aria-labelledby="overview-title">
        <div class="dev-uni-shell portfolio-section-inner">
          <header class="portfolio-section-heading">
            <p class="home-section-label">OVERVIEW</p>
            <h2 id="overview-title">경력 개요</h2>
          </header>
          <dl class="portfolio-overview-table">
            {portfolio.overview.map((row) => (
              <div>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section class="portfolio-section portfolio-work" aria-labelledby="experience-title">
        <div class="dev-uni-shell portfolio-section-inner">
          <header class="portfolio-section-heading">
            <p class="home-section-label">WORK EXPERIENCE</p>
            <h2 id="experience-title">업무 경험</h2>
          </header>
          <div class="portfolio-company">
            <header>
              <p>{portfolio.company.period}</p>
              <h3>{portfolio.company.name}</h3>
              <strong>{portfolio.company.role}</strong>
              <span>{portfolio.company.domain}</span>
            </header>
            <div class="portfolio-company-history">
              {portfolio.company.projects.map((project) =>
                renderProject(project, "portfolio-work-project"),
              )}
            </div>
          </div>
        </div>
      </section>

      <section class="portfolio-section portfolio-selected" aria-labelledby="project-title">
        <div class="dev-uni-shell portfolio-section-inner">
          <header class="portfolio-section-heading">
            <p class="home-section-label">SELECTED PROJECT</p>
            <h2 id="project-title">프로젝트</h2>
          </header>
          {renderProject(portfolio.project, "portfolio-selected-project")}
        </div>
      </section>

      <section class="portfolio-section portfolio-background" aria-labelledby="background-title">
        <div class="dev-uni-shell portfolio-section-inner">
          <header class="portfolio-section-heading">
            <p class="home-section-label">BACKGROUND</p>
            <h2 id="background-title">경험과 학력</h2>
          </header>
          <div class="portfolio-background-list">
            {[...portfolio.activities, portfolio.education].map((activity) => (
              <article>
                <header>
                  <h3>{activity.title}</h3>
                  <p>{activity.meta}</p>
                </header>
                <ul>
                  {activity.highlights.map((highlight) => (
                    <li>{highlight}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section class="portfolio-section portfolio-writing" aria-labelledby="writing-title">
        <div class="dev-uni-shell portfolio-section-inner">
          <header class="portfolio-section-heading">
            <p class="home-section-label">PRESENTATION &amp; ARTICLE</p>
            <h2 id="writing-title">발표와 글</h2>
          </header>
          <ul>
            {portfolio.writing.map((item) => (
              <li>
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noreferrer">
                    {item.label} <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  item.label
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section class="portfolio-section portfolio-skills" aria-labelledby="skills-title">
        <div class="dev-uni-shell portfolio-section-inner">
          <header class="portfolio-section-heading">
            <p class="home-section-label">SKILLS</p>
            <h2 id="skills-title">기술</h2>
          </header>
          <dl>
            {portfolio.skills.map((skill) => (
              <div>
                <dt>{skill.label}</dt>
                <dd>{skill.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </article>
  )
}

const AboutLanding = ({ fileData }: QuartzComponentProps) => {
  const currentSlug = fileData.slug ?? ("about" as FullSlug)
  const linkTo = (slug: string) => resolveRelative(currentSlug, slug as FullSlug)

  return (
    <article class="dev-uni-about about-page" aria-labelledby="about-title">
      <section class="dev-uni-shell about-introduction">
        <div class="about-heading">
          <p class="home-section-label">ABOUT</p>
          <h1 id="about-title">
            <span>안녕하세요</span>
            <span>신재윤입니다.</span>
          </h1>
          <p class="about-tagline">
            사람들과 편하게 이야기를 나누고, 궁금한 건 직접 부딪혀 알아가는 것을 좋아합니다.
          </p>
        </div>
        <figure class="about-portrait">
          <img
            src={linkTo("static/dev-uni/about-jaeyoon-2026.jpeg")}
            alt="카페 테라스에 앉아 있는 신재윤"
            loading="eager"
          />
        </figure>
      </section>

      <section class="dev-uni-shell about-personal-section" aria-labelledby="about-personal-title">
        <div>
          <p class="home-section-label">A LITTLE MORE</p>
          <h2 id="about-personal-title">저를 설명하는 세 가지</h2>
        </div>
        <ol class="about-personal-list">
          <li>
            <span>01</span>
            <div>
              <strong>COFFEE</strong>
              <p>
                새로운 카페를 찾아다니는 것도, 익숙한 자리에서 커피 한 잔을 천천히 마시는 것도
                좋아합니다. 커피를 앞에 두면 바쁘게 지나가던 생각을 잠시 멈추고 하루를 돌아보게
                됩니다.
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>ESTP</strong>
              <p>
                오래 고민만 하기보다 직접 부딪혀 확인하고, 경험한 것을 바탕으로 다음 선택을 찾는
                편입니다. 계획이 달라져도 상황을 빠르게 읽고 다시 움직이는 과정에서 오히려 에너지를
                얻습니다.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>PEOPLE</strong>
              <p>
                혼자 정답을 완성하기보다 사람들과 생각을 주고받을 때 더 좋은 답에 가까워진다고
                믿습니다. 서로 다른 경험이 한 대화 안에서 연결되는 순간을 좋아하고, 편하게 의견을
                나눌 수 있는 관계를 중요하게 생각합니다.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section class="dev-uni-shell about-present-section" aria-labelledby="about-present-title">
        <div>
          <p class="home-section-label">HOW I LIVE &amp; THINK</p>
          <h2 id="about-present-title">사람과 기록 사이에서</h2>
        </div>
        <div class="about-present-copy">
          <p>
            저는 사람을 통해 생각이 더 선명해지는 편입니다. 혼자 조용히 정리하는 시간도 필요하지만,
            누군가와 이야기를 나누며 미처 보지 못했던 관점을 발견할 때 가장 즐겁습니다. 그래서 좋은
            질문을 건네고, 상대의 이야기를 끝까지 듣는 사람이 되고 싶습니다.
          </p>
          <p>
            빠르게 움직이는 성격이지만 경험을 그냥 흘려보내고 싶지는 않습니다. 배운 것과 고민한 것을
            짧게라도 남기고, 시간이 지난 뒤 다시 꺼내 연결합니다. 이 블로그의 Brain은 그렇게 쌓인
            기록이 다음 생각의 출발점이 되는 저만의 방식입니다.
          </p>
          <p>
            완벽한 답을 오래 준비하기보다 지금 할 수 있는 작은 시도를 시작하고, 결과를 돌아보며 다음
            방향을 찾습니다. 일에서도 일상에서도 솔직하게 부딪히고 꾸준히 나아가는 태도를 지키려고
            합니다.
          </p>
        </div>
      </section>

      <section class="about-story" aria-labelledby="about-story-title">
        <div class="dev-uni-shell about-story-inner">
          <div>
            <p class="home-section-label">FROM ELECTRICAL TO SOFTWARE</p>
            <h2 id="about-story-title">개발자를 꿈꾸게 된 시작</h2>
          </div>
          <div class="about-story-copy">
            <p>처음에는 전기공학과에서 제어계측을 공부했습니다.</p>
            <p>
              전기공학과에서 공부를 시작했지만, 더 직접적으로 문제를 정의하고 결과를 만들어내는
              소프트웨어에 매력을 느껴 컴퓨터공학과로 전과했습니다. 전과는 전공을 바꾸는 선택이자
              개발자라는 길을 본격적으로 꿈꾸기 시작한 계기였습니다.
            </p>
            <p>
              지금도 새로운 기술 자체보다 그것으로 어떤 불편을 줄이고, 사람에게 어떤 경험을 줄 수
              있는지를 먼저 생각하려고 합니다.
            </p>
          </div>
        </div>
      </section>

      <section class="dev-uni-shell about-route-links" aria-label="Dev Uni 기록 둘러보기">
        <a class="internal" href={linkTo("portfolio/index")}>
          Portfolio <span aria-hidden="true">→</span>
        </a>
        <a class="internal" href={linkTo("brain/index")}>
          Brain <span aria-hidden="true">→</span>
        </a>
        <a class="internal" href={linkTo("articles/index")}>
          Articles <span aria-hidden="true">→</span>
        </a>
      </section>
    </article>
  )
}

const ArticlesLanding = ({ fileData, allFiles }: QuartzComponentProps) => {
  const currentSlug = fileData.slug ?? ("articles/index" as FullSlug)
  const linkTo = (slug: string) => resolveRelative(currentSlug, slug as FullSlug)
  const articles = allFiles
    .filter(isTistoryArticle)
    .sort((a, b) => publishedTime(b) - publishedTime(a))

  const categoryKey = currentSlug.startsWith("articles/category/")
    ? (currentSlug.split("/").at(-1) as ArticleSection)
    : undefined
  const selectedSection = articleSections.find((section) => section.key === categoryKey)

  const renderArchive = (items: typeof articles) => (
    <ol>
      {items.map((article) => (
        <li>
          <a class="internal" data-no-popover="true" href={linkTo(article.slug!)}>
            <time>{displayDate(article)}</time>
            <strong>{article.frontmatter?.title}</strong>
            <small>{articleTopic(article)}</small>
            <span aria-hidden="true">↗</span>
          </a>
        </li>
      ))}
    </ol>
  )

  const categoryNavigation = (
    <nav class="articles-category-nav" aria-label="글 카테고리">
      <a
        class="internal"
        data-no-popover="true"
        href={linkTo("articles/index")}
        aria-current={selectedSection ? undefined : "page"}
      >
        <span>전체</span>
        <strong>{articles.length}</strong>
      </a>
      {articleSections.map((section) => {
        const count = articles.filter((article) => articleSection(article) === section.key).length
        return (
          <a
            class="internal"
            data-no-popover="true"
            href={linkTo(`articles/category/${section.key}`)}
            aria-current={section.key === categoryKey ? "page" : undefined}
          >
            <span>{section.label}</span>
            <strong>{count}</strong>
          </a>
        )
      })}
    </nav>
  )

  if (selectedSection) {
    const categoryArticles = articles.filter(
      (article) => articleSection(article) === selectedSection.key,
    )
    return (
      <article class="dev-uni-articles articles-index" aria-labelledby="articles-title">
        <section class="dev-uni-shell articles-heading">
          <p class="home-section-label">ARTICLES / {selectedSection.key.toUpperCase()}</p>
          <h1 id="articles-title">{selectedSection.label}</h1>
          <p>{selectedSection.description}</p>
          {categoryNavigation}
        </section>
        <section
          class="dev-uni-shell articles-archive"
          aria-label={`${selectedSection.label} 글 목록`}
        >
          {categoryArticles.length > 0 ? (
            renderArchive(categoryArticles)
          ) : (
            <div class="articles-empty">
              <p>아직 공개한 프로젝트 글이 없습니다.</p>
              <a class="internal" data-no-popover="true" href={linkTo("portfolio/index")}>
                Portfolio에서 프로젝트 보기 <span aria-hidden="true">→</span>
              </a>
            </div>
          )}
        </section>
      </article>
    )
  }

  return (
    <article class="dev-uni-articles articles-index" aria-labelledby="articles-title">
      <section class="dev-uni-shell articles-heading">
        <p class="home-section-label">ARTICLES</p>
        <h1 id="articles-title">글</h1>
        <p>기술, 회고, 프로젝트 기록을 분류해 모았습니다. 최근에 올린 글부터 가볍게 둘러보세요.</p>
        {categoryNavigation}
      </section>
      <section
        class="dev-uni-shell articles-archive articles-latest"
        aria-labelledby="latest-articles-title"
      >
        <header>
          <p class="home-section-label">LATEST FIVE</p>
          <h2 id="latest-articles-title">최근 업로드</h2>
        </header>
        <ol>
          {articles.slice(0, 5).map((article) => (
            <li>
              <a class="internal" data-no-popover="true" href={linkTo(article.slug!)}>
                <time>{displayDate(article)}</time>
                <strong>{article.frontmatter?.title}</strong>
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ol>
      </section>
    </article>
  )
}

export function renderDevUniLanding(surface: LandingSurface, props: QuartzComponentProps) {
  if (surface === "home") return <HomeLanding {...props} />
  if (surface === "about") return <AboutLanding {...props} />
  if (surface === "portfolio-index") return <PortfolioLanding {...props} />
  return <ArticlesLanding {...props} />
}
