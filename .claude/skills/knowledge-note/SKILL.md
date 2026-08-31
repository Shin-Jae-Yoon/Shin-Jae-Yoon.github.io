---
name: knowledge-note
description: content/brain/knowledge 아래 지식 노트를 쓰거나 고칠 때 쓴다. 한 키워드 한 항목으로 원본을 압축하는 규칙, 닫힌 섹션 틀, 금지 문체, 분류 규칙, 검증 절차를 담고 있다. 새 항목 작성, 기존 항목 개편, 원본 커버리지 확장, 문체 정리에 모두 해당한다.
---

# 지식 노트

`content/brain/knowledge/`는 손으로 쓴 키워드 백과다. 강의, 도서, 메모에 흩어져 있는 내용을 한 키워드로 모아 **본인 말로 다시 쓴 글**이다. 원본을 인용해 옮기는 곳이 아니다.

## 무엇을 쓰는가

한 키워드에 한 항목. 여러 원본에 흩어진 같은 주제를 하나로 모은다. 원본에 없는 내용을 지어내지 않고, 원본에 있는 내용을 그대로 베끼지도 않는다.

원본은 절대 수정하지 않는다. `content/brain/{lectures,books,notes}`는 읽기 전용이다.

## 배치

```
content/brain/knowledge/<도메인>/<하위>/<슬러그>.md
```

- 폴더와 파일 이름은 영문 소문자, 하이픈. `title`은 한글
- **파일 이름이 부모 폴더 이름과 같으면 안 된다.** Quartz가 그 파일을 폴더 인덱스로 흡수해서 항목이 탐색기에서 사라진다
- 폴더마다 `index.md`가 있어야 한다. `title` 한 줄이면 된다. 이것이 탐색기에 뜨는 한글 폴더 이름이다
- 지식 트리에는 `weight`를 넣지 않는다. 가나다순이 의도다

## 이름은 논증으로 정하지 않는다

**폴더 이름과 항목 이름은 저장소 주인의 어휘다.** 기준으로 도출되는 결론이 아니다. 후보가 둘 이상이면 근거를 쌓지 말고 한 줄로 물어라.

> `database/persistence`를 `jpa`로 바꿀까요, 그대로 둘까요?

이 한 줄을 아껴서 세 판을 뒤집은 적이 있다. `persistence` → `jpa` → 중재자 둘을 돌려 `data-access` → 사용자가 "jpa는 jpa라고 하라고" → `jpa`. 중재자가 낸 논증은 훌륭했지만 답할 자격이 없는 질문에 답한 것이었다.

**사용자 말이 두 가지로 읽히면 확인하고 움직여라.** "orm도 아니고 persistence?"를 "두 이름 다 싫다"로 읽었는데 실제로는 "JPA라고 불러라"였다. 해석을 골라놓고 그 위에 작업을 쌓으면 그 작업이 통째로 버려진다.

파일 이동은 위키링크가 alias로 걸려 있어 되돌리기가 거의 공짜다. **그 싸구려 되돌리기가 확정 없이 실행하는 습관을 만든다.** 실행이 싸도 사용자가 판을 다시 보는 값은 싸지 않다.

## 세어보고 말한다

이 저장소에서 세어보지 않고 내린 판단이 네 번 틀렸다.

| 말한 것                                  | 실제                                       |
| ---------------------------------------- | ------------------------------------------ |
| "`persistence` 안이 전부 JPA다"          | 10개 중 2개가 JPA가 아니었다               |
| "메시징 개념 쪽에 서너 개밖에 안 남는다" | 10개였다                                   |
| 제목과 리드만 보고 개념 9개를 갈랐다     | 9개 전부 `kafka` 태그에 카프카 책 출처였다 |
| "태그 없는 항목이 여럿이다"              | 정규식 버그였다. 누락 0개                  |

폴더 내용을 두고 무엇을 주장하려면 **그 폴더의 파일을 전부 열어보고 숫자를 함께 대라.** 제목만 보면 `jpa` 폴더에 JDBC가 들어간다.

## 도메인

최상위는 **그 분야를 부르는 표준 명사 하나**만 쓴다. 지어낸 말을 쓰지 않는다. 이 규칙이 없어서 `workflow`가 "개발 흐름"이라는 애매한 이름으로 남아 있었다.

|             |              |                                                                                    |
| ----------- | ------------ | ---------------------------------------------------------------------------------- |
| `algorithm` | 알고리즘     | complexity, data-structure, sort, search, graph, technique, string, math, practice |
| `language`  | 언어         | theory, java, python, javascript                                                   |
| `os`        | 운영체제     | architecture, kernel, process, concurrency                                         |
| `network`   | 네트워크     | protocol, web                                                                      |
| `database`  | 데이터베이스 | model, sql, transaction, programming                                               |
| `design`    | 설계         | oop, principle, pattern, architecture, quality                                     |
| `server`    | 서버         | spring, request, aop, data-access, jpa, structure, batch                           |
| `client`    | 클라이언트   | browser, layout                                                                    |
| `messaging` | 메시징       | concept, stream, kafka                                                             |
| `infra`     | 인프라       | (하위 없음)                                                                        |
| `vcs`       | 버전 관리    | (하위 없음)                                                                        |

언어는 안에서 나눈다. 자바를 최상위로 올리지 않는다.

```
language/theory/        컴파일 과정, 컴파일러의 구조, 구문 표기법
language/java/          oop, type, collection, exception, abstraction,
                        functional, runtime, io, meta, control
language/python/
language/javascript/
```

**개념과 특정 구현을 한 서랍에 넣지 않는다.** 다른 언어나 다른 제품으로 옮겨도 말이 되면 개념, 그 제품에만 있으면 구현이다. 다형성과 격리 수준은 개념이므로 `design/oop`과 `database/transaction`에, 오버라이딩과 영속성 컨텍스트는 구현이므로 `language/java/oop`과 `server/jpa`에 둔다.

메시징도 같은 이유로 갈라져 있다.

```
messaging/concept/      발행 구독 패턴, 스키마와 직렬화 형식, 데이터 파이프라인
messaging/stream/       스트림 처리, 스트림과 테이블, 스트림 처리의 시간, 시간 윈도우,
                        스트림 처리 패턴, 상태를 가진 스트림 처리
messaging/kafka/        structure, reliability, operation, retention, streams
```

**한 문서 안에 개념과 제품이 섞여 있으면 폴더를 옮기는 것으로 해결되지 않는다.** `kafka/reliability/exactly-once.md`가 그렇다. 전달 보장 세 수준은 어느 메시징 시스템에나 있는 개념인데 본문 절반이 카프카가 그것을 어떻게 달성하는지다. 이런 문서는 고쳐 쓸 때 개념 부분을 `concept/`으로 떼어낸다. 폴더 이동은 대략을 맞추는 것이고, 나머지는 다시 쓰면서 정리한다.

`server`는 30개로 가장 큰 도메인이고 대부분 스프링이지만 아직 가르지 않았다. 스프링이 아닌 것은 서블릿, Web Server와 WAS, 다중 WAS, JDBC, ORM과 JPA, SQL Mapper다. 다른 프레임워크가 들어올 때 가른다.

데이터 접근은 `database`가 아니라 `server`에 있다. 경계는 **데이터베이스가 스스로 보장하는 것은 `database`, 자바 애플리케이션이 그 데이터베이스에 접근하려고 하는 일은 `server`**다. `database/transaction`의 ACID와 격리 수준은 DBMS의 트랜잭션 엔진이고, `server/data-access`의 `@Transactional` 전파 속성은 DBMS에 없는 스프링의 규칙이다.

기술 이름(Java, Spring, Kafka, MySQL)은 태그다. `language/java`와 `messaging/kafka`는 도메인 안의 갈래이지 최상위 도메인이 아니다.

## 프론트매터

```yaml
---
title: 한글 제목
aliases:
  - 한글 제목 # 자기 title이 첫 alias여야 한다
  - 영문 이름
  - 함께 부르는 말
tags:
  - <도메인>
  - <기술>
---
```

**`title`은 라우트를 만들지 않는다.** `aliases`만 만든다. 그래서 자기 `title`을 alias로 들고 있어야 검색과 옵시디언에서 제목으로 찾힌다.

**단, 그 슬러그가 파일명과 같아지면 적지 않는다.** alias는 사이트 최상위에 리다이렉트 스텁을 만드는데, `markdownLinkResolution: shortest`는 더 짧은 최상위 쪽을 고른다. `api.md`에 `API` alias를 달면 `/api`가 `/brain/knowledge/design/architecture/api`를 가려서, 링크를 눌렀을 때 빈 페이지에서 멈춘다. 파일명이 이미 그 이름의 라우트라 alias가 필요 없다.

`title`과 모든 `aliases`는 지식 트리 전체에서 유일해야 한다. alias는 공백을 하이픈으로 바꾸고 소문자로 만들어 라우트가 되므로 `Map`과 `map`은 충돌한다.

## 링크는 파일명으로 건다

`[[유니온 파인드]]`처럼 한글 제목으로 걸지 않는다. 그 이름은 alias 라우트이고, alias는 meta refresh 스텁일 뿐이다. SPA 라우터는 body만 갈아끼우므로 그 refresh가 걸리지 않아 `/유니온-파인드`라는 빈 페이지에서 멈춘다.

```
[[union-find|유니온 파인드]]     대상은 파일명, 보이는 글자는 한글
[[brain/knowledge/algorithm/data-structure/graph|그래프]]
```

파일명이 트리 안에서 유일하면 파일명만 쓴다. `array`, `graph`, `stack`, `schema`처럼 겹치면 전체 경로를 쓴다. `## 출처`의 원본 링크는 원래부터 전체 경로다.

## 섹션

**제목은 그 절에 실제로 든 것을 가리키는 명사구로 쓴다.** 고정된 목차는 없다. 문서마다 다른 것이 정상이다.

한때 왜/어떻게/종류/비교/한계 다섯 개로 닫아둔 적이 있다. 236개가 전부 같은 목차를 달았고, 네 가지 배열이 98개를 덮었다. 양식을 채운 글처럼 읽혔다. 어휘를 닫는 것으로는 해결되지 않는다.

| 쓰지 않는 꼴     | 왜                               | 대신                                        |
| ---------------- | -------------------------------- | ------------------------------------------- |
| 한 단어 틀       | 아무것도 가리키지 못한다         | `어떻게` → `메모리 영역과 생명주기`         |
| 의문형           | Wikipedia 가 명시적으로 금지한다 | `왜 필요한가` → `클래스가 공유하는 변수`    |
| 문장형           | 제목이 아니라 문장이다           | `이름이 여럿이다` → `정적 변수의 다른 이름` |
| 문서 제목 되풀이 | 이미 위에 있다                   | `트랜잭션이란` → `시작과 끝`                |

근거는 이 셋이다.

- [Wikipedia:Manual of Style](https://en.wikipedia.org/wiki/Wikipedia:Manual_of_Style#Section_headings). "Normally use nouns or noun phrases", "Languages, not What languages are spoken?", 제목 되풀이 금지, 고정 목차 없음
- [MDN Writing style guide](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Writing_style_guide). "It's either two subheadings or more or none at all", 상위 제목 낱말 되풀이 금지, 제목 다음에 반드시 본문
- [Google developer documentation style guide](https://developers.google.com/style/headings). 개념 절은 명사구, 작업 절은 동사 원형, 빈 제목 금지

자리가 정해진 것은 셋뿐이고 언제나 문서 끝에 이 순서로 온다.

```
## 참고    웹에서 가져온 것만. knowledge-provenance 스킬이 맡는다
## 관련    위키링크만, 한 줄에 하나
## 출처    원본 파일 위키링크
```

리드는 제목 없이 정의 한 문단으로 시작한다. 짧은 항목은 리드와 `## 관련`, `## 출처`만으로 끝나도 된다.

`###`는 갈래가 둘 이상일 때만 쓴다. 하나뿐이면 절을 나눌 이유가 없다.

**절을 나누기 전에 그 절에 이름을 붙일 수 있는지 본다.** 이름이 안 나오면 그것은 앞 절의 문단이다. `static.md`를 고칠 때 `## 어떻게` 안에 메모리 영역, 클래스 메서드, static 블록 셋이 들어 있던 것이 목차를 내용에 맞추자 드러났다.

## 문체

이 저장소의 이전 판은 AI가 쓴 티가 났다. 236개 항목에 볼드 3,698개, 62%가 표를 달고 있었고, `##` 제목 936종 가운데 902종이 딱 한 번씩만 쓰였다. 아래는 그 재발을 막는 규칙이다.

**쓰지 않는 문자**

- **가운뎃점 `·`.** `A · B · C` 나열은 절대 금지. 쉼표로 쓴다. 문장 안에서 단어를 묶을 때도 `삽입·삭제·검색`이 아니라 `삽입, 삭제, 검색`이다. 사용자가 직접 지목한 첫 번째 AI 티다
- **em dash `—`.** 쉼표나 마침표로 끊는다
- 화살표 `→`는 코드나 표 안에서만

**쓰지 않는 표현**

`즉,` `결국` `정리하면` `핵심은` `~라는 점이다` `~라고 보면 된다` `여기서 ~가 나온다` `주목할 것은`

`그래서`는 문단 첫머리에 반복해서 쓰지 않는다.

**볼드**

문서당 다섯 번을 넘기지 않는다. 리드 문단은 볼드 없이 시작한다. 강조가 필요하면 문장 순서로 해결한다. 모든 문단마다 한 구절씩 굵게 만드는 습관이 가장 큰 AI 티다.

**표**

두 열짜리 용어 설명은 표가 아니라 문장으로 쓴다. 표는 세 열 이상이고 행이 셋 이상이며, 축이 진짜로 둘일 때만 쓴다.

**문장**

- 같은 구조의 문장을 세 번 이상 잇지 않는다
- `셋이다` `두 가지다` 처럼 개수를 세어 맞추지 않는다. 억지로 세 개를 만들지 않는다
- 한 문단은 한 가지만 말한다
- 원본에 있는 사례와 숫자를 살린다. 일반론으로 뭉개면 원본을 읽은 의미가 없다

## humanize-korean

문체 규칙은 아래 목록으로 다 잡히지 않는다. 번역투, 기계적 대구, 피동태 남용, 접속사 남발, 리듬 균일성 같은 것은 세어서 잡을 수 없다.

**다시 쓴 뒤 `humanize-korean` 스킬을 한 번 통과시킨다.** 기본값이다. 사용자가 생략하라고 하기 전까지는 거른다고 보면 안 된다.

```
/humanize
```

`~/.claude/plugins/cache/im-not-ai/humanize-korean/` 에 설치되어 있다. 10개 범주 70가지 한국어 AI 티 패턴을 잡는다. 내용은 건드리지 않고 문체와 리듬만 고치는 스킬이라, 이 저장소의 "원본에 있는 사례와 숫자를 살린다"는 규칙과 부딪히지 않는다.

아래 금지 목록은 그중 기계로 셀 수 있는 것만 추린 것이다. 목록을 통과했다고 문체가 끝난 것이 아니다.

## 출처

```markdown
## 출처

- [[brain/books/kafka/chap07|카프카 핵심가이드 7장 - 신뢰성 있는 데이터 전달]]
```

경로는 실제 원본 파일이어야 한다. 여러 원본을 모았으면 전부 적는다. 원본을 읽지 않고 쓴 항목은 만들지 않는다.

## 기존 항목 고쳐쓰기

한 번에 다 못 고친다. 폴더 하나를 끝까지 끝내고 다음으로 넘어간다. 절반쯤 고친 폴더를 여럿 만들면 어디까지 했는지 잃어버린다.

한 항목의 순서는 이렇다.

1. `## 출처`에 적힌 원본을 먼저 읽는다. 원본 없이 문체만 고치면 압축이 아니라 윤문이 된다
2. 지금 섹션을 일곱 개 어휘로 다시 묶는다. 여섯 개였던 것이 셋으로 줄어드는 일이 흔하다. 제목을 붙일 만큼 독립적이지 않은 절은 앞 섹션의 문단으로 넣는다
3. 볼드를 전부 지우고 시작한다. 지우고 나서도 정말 필요한 자리에만 다시 넣는다
4. 두 열짜리 표를 문장으로 편다
5. 원본의 사례, 숫자, 코드는 살린다. 문체를 고치는 것이지 내용을 덜어내는 것이 아니다
6. 그 항목만 검사한다

실제로 고친 기록은 [example.md](example.md)에 있다. `static.md`가 위반 3건에서 0건이 되는 동안 무엇을 어떻게 옮겼는지 전후로 적어두었다.

폴더를 끝내면 전체 위반 수를 확인해 줄었는지 본다.

```bash
node tooling/brain/knowledge-style.mjs 2>&1 | tail -12
```

## 검증

고친 뒤에 반드시 돌린다.

```bash
node tooling/brain/knowledge-style.mjs
npx prettier "content/brain/knowledge/**/*.md" --write
npx quartz build
```

`knowledge-style.mjs`가 섹션 어휘, 볼드 예산, 금지 표현, 중복 title/alias, 슬러그 충돌, 폴더 인덱스 유무, 파일명과 폴더명 충돌을 검사한다.

빌드한 뒤 깨진 링크는 산출물로 확인한다. 소스의 `[[...]]`를 title 목록과 대조하는 검사는 통과해도 실제로는 깨져 있을 수 있다.

```bash
node tooling/brain/knowledge-links.mjs
```

## 커밋

말하기 전까지 커밋하지 않는다.
