# 알려진 원본 결함

`content/brain/{lectures,books,notes}`는 읽기 전용이다. 출처가 증거인 체계에서 증거를 고치면 무엇을 근거로 무엇을 썼는지 추적이 끊긴다.

그래서 원본이 틀린 자리는 **지식 노트를 고치고 `## 참고`에 1차 출처와 함께 근거를 남긴다.** 원본은 그대로 둔다.

이 파일은 그렇게 처리한 것들의 목록이다. 같은 자리를 매번 다시 발견하지 않으려고 적어둔다. 새로 찾으면 여기에 더한다.

## 파일 자체가 깨진 것

| 파일                                                          | 무엇                                                                                                                          |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `notes/CS/OS/SystemCall.md`                                   | 100행 "시스템 콜을"에서 문장 중간에 끝난다. `os/kernel/system-call.md`의 모드 전환 절이 뒷받침을 잃었다                       |
| `lectures/backend/kim-spring/spring-intro/spring-basic-02.md` | 541~553행의 `### JPA`, `### 스프링 데이터 JPA`, `## AOP`, `### AOP가 필요한 상황`, `### AOP 적용`이 제목만 있고 내용이 없다   |
| `lectures/backend/kim-spring/http/section06.md`               | 프론트매터만 있다                                                                                                             |
| `lectures/dataStructure/easy-ds/lecture09.md`                 | 파일 전체가 17행이고 실질 세 줄이다. `algorithm/data-structure/balanced-tree.md`가 이 파일로 감당하지 못하는 분량을 담고 있다 |

## 사실이 틀린 것

지식 노트는 고쳤고 `## 참고`에 근거가 있다.

| 원본                                                | 틀린 것                                                        | 맞는 것                                                                        | 지식 노트                                           |
| --------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------- |
| `books/do-it-java/chap09.md:37`                     | 추상 클래스는 항상 추상 메서드를 포함한다                      | 없어도 된다 (JLS 8.1.1.1)                                                      | `language/java/abstraction/abstract-class.md`       |
| `notes/Interview/dog-study/dog-week01.md:269`       | `s1 + s2`가 String Pool에 들어간다                             | 런타임 연결은 힙에 놓인다                                                      | `language/java/type/string-pool.md`                 |
| `notes/CS/OS/SystemCall.md`                         | `malloc`, `free`가 프로세스 제어 시스템 콜                     | C 표준 라이브러리 함수                                                         | `os/kernel/system-call.md`                          |
| `lectures/pl/fun-java/fun-java11.md`                | 포트 관리 주체가 ICANN                                         | IANA                                                                           | `network/protocol/socket.md`                        |
| `notes/Interview/dog-study/dog-week05.md:505`       | Bill Pugh는 `loadClass()` 동기화 덕분                          | 클래스 초기화 락 (JLS 12.4.2)                                                  | `design/pattern/singleton.md`                       |
| `notes/Interview/dog-study/dog-week06.md:326`       | 엔티티는 상속도 인터페이스 구현도 안 한다                      | Jakarta Persistence 3.1 §2.1이 허용한다. 같은 파일 65행이 스스로 반대로 적었다 | `server/jpa/entity.md`                              |
| `notes/Interview/dog-study/dog-week09.md:293`       | CommandLineRunner는 CLI 실행, ApplicationRunner는 코드 안 실행 | 둘 다 부트 콜백이고 차이는 인자 타입뿐                                         | `server/batch/batch-and-scheduler.md`               |
| `notes/Interview/dog-study/dog-week09.md:256`       | Step은 여러 Tasklet을 갖는다                                   | 정확히 하나                                                                    | `server/batch/spring-batch.md`                      |
| `notes/Interview/dog-study/dog-week09.md:258`       | 예외를 던질 때까지 `execute`가 반복                            | `RepeatStatus.FINISHED`까지                                                    | `server/batch/spring-batch.md`                      |
| `notes/Interview/dog-study/dog-week04.md:335`       | AspectJ는 런타임에 못 끼운다                                   | 로드 타임 위빙을 제공한다                                                      | `server/aop/spring-aop-vs-aspectj.md`               |
| `books/kafka/chap01.md:322`                         | 컨슈머는 리더든 팔로워든 읽어도 된다                           | 팔로워 페치는 2.4.0 KIP-392 옵트인                                             | `messaging/kafka/structure/replica.md`              |
| `books/kafka/chap07.md:70`                          | ISR 판정 6초와 10초                                            | KIP-537 이후 18초와 30초                                                       | `messaging/kafka/structure/replica.md`              |
| `books/kafka/chap08.md:431`                         | `transaction.timeout.ms` 기본 15분                             | 60초. 15분은 브로커의 `transaction.max.timeout.ms`                             | `messaging/kafka/reliability/kafka-transaction.md`  |
| `books/kafka/chap14.md:869`                         | `compaction.lag.ms`                                            | `min.compaction.lag.ms`                                                        | `messaging/stream/stream-state.md`                  |
| `books/kafka/chap02.md:474`                         | `fetch.message.max.bytes`                                      | 구 Scala 컨슈머 설정. 지금은 `fetch.max.bytes`                                 | `messaging/kafka/retention/message-and-batch.md`    |
| `books/kafka/chap01.md:278`                         | 오프셋은 단조증가할 필요가 없다                                | 단조증가는 보장되고 연속성이 보장되지 않는다                                   | `messaging/kafka/structure/topic-and-partition.md`  |
| `books/kafka/chap14.md:247`                         | 호핑과 텀블링을 같은 정의로 적었다                             | 텀블링은 `advance == size`인 호핑의 특수 경우                                  | `messaging/stream/window.md`                        |
| `lectures/frontend/apple-js/apple-js-02.md:446`     | bias는 `2^(k-1)`                                               | `2^(k-1) - 1`                                                                  | `algorithm/math/floating-point.md`                  |
| `books/do-it-java/chap03.md:150`                    | `~10`의 비트열을 5짜리로 적었다                                | `1111 0101`                                                                    | `algorithm/math/bitwise-operation.md`               |
| `notes/CodeTree/dataStructure.md:747`               | k번째 최댓값을 알 수 없다                                      | 두 번째는 루트의 두 자식 중 하나라 O(1)                                        | `algorithm/data-structure/heap.md`                  |
| `notes/CodeTree/array.md:31`                        | 정렬 알고리즘이 배열이냐 컬렉션이냐로 갈린다                   | 기본형이냐 객체냐로 갈린다                                                     | `language/java/collection/comparable-comparator.md` |
| `lectures/etc/apple-git/git-and-github.md:269`      | `git merge --no --ff`                                          | `--no-ff` 하나가 옵션 이름                                                     | `vcs/merge-strategy.md`                             |
| `lectures/frontend/apple-html/all-in-one-mid.md:98` | `justify-content: flex-center`                                 | `center`                                                                       | `client/layout/box-model.md`                        |
| `lectures/db/easy-db/lecture13.md:148`              | 트리거 `WHEN` 절을 쓸 수 있다                                  | 원본이 "단, MySQL은 불가능"을 적어두었는데 지식 노트가 그 단서를 빠뜨렸었다    | `database/programming/trigger.md`                   |

## 지식 노트가 이미 바로잡은 것

원본이 틀렸고 지식 노트가 옳게 적은 자리다. 다시 뒤집히지 않게 적어둔다.

| 원본                                                 | 틀린 것                                                   |
| ---------------------------------------------------- | --------------------------------------------------------- |
| `notes/Interview/dog-study/dog-week05.md:664`        | `@FunctionalInterface`가 "1개 이상"이면 오류. 둘 이상이다 |
| `lectures/pl/fun-java/fun-java04.md:403`             | 오버로딩을 JVM이 실행하며 결정한다. 컴파일 시점이다       |
| `lectures/pl/fun-java/fun-java04.md:278`             | "Java 8까지는 Metaspace". 자바 8부터다                    |
| `notes/CS/LT/BNF.md`, `EBNF.md`                      | `::==`. `::=`다                                           |
| `lectures/db/easy-db/lecture06.md:70`                | set은 중복 허용, multiset은 불허. 뒤집혔다                |
| `lectures/db/easy-db/lecture02.md:287`               | primary key를 "개인키"로 적었다                           |
| `lectures/db/easy-db/lecture04.md:153`               | `impl_id` 오타. `empl_id`다                               |
| `lectures/algo/fastcampus-algo/part6/p6-ch01.md:423` | `DATEDIFF` 결과 748. 실제 18이다                          |
| `notes/CodeTree/dataStructure.md:659`                | BST 삽입 의사코드의 좌우가 뒤집혔다                       |
| `lectures/algo/fastcampus-algo/part1-4/p1-ch01.md`   | `%3.f`. `%.3f`다                                          |

## 깨진 위키링크 8건

**전부 아직 안 쓴 강의를 가리킨다.** 결함이 아니라 앞으로 채울 자리 표시이므로 고치지 않는다.

`lectures/dataStructure/easy-ds/lecture00.md`가 쉬운코드 자료구조 11강의 목차인데 7, 8, 9강만 정리되어 있다. 나머지 여덟 개 링크가 아직 없는 파일을 가리킨다.

```
lecture01 ~ lecture06, lecture10, lecture11
```

10강이 레드블랙트리 기본개념, 11강이 삭제다. `algorithm/data-structure/balanced-tree.md`가 원본 세 줄로 감당하지 못한 이유가 여기에 있다. 그 두 강의를 들으면 채워진다.

## 고친 경로 17건 (2026-08-31)

폴더를 옮긴 뒤 원본 안에 남아 있던 옛 경로다. 내용이 아니라 링크 대상만 어긋난 것이라 고쳤다. 사실 오류와 성격이 다르다.

```
easycode/ds/          → datastructure/easy-ds/       목차 8건. 앞 슬래시도 빠져 있어 함께 붙였다
apple/apple-html/     → frontend/apple-html/         2건
apple/apple-js/       → frontend/apple-js/           2건
apple-js/apple-js-    → frontend/apple-js/apple-js-  2건
fun-java/fun-java     → pl/fun-java/fun-java         3건
```

`node tooling/brain/knowledge-links.mjs`로 전체를 확인한다. 지식 트리만 보려면 인자에 `knowledge`를 준다.

## 도서 소개 콜아웃의 별표 노출 3건 (2026-08-31, 수정함)

`content/brain/books/{do-it-java,dinosaur,headfirst}/index.md`에서 학습 기간과 학습 목표가 `**학습 기간**` 그대로 화면에 떴다. 굵게가 먹지 않았다.

원인은 콜아웃 안의 `> <br>`와 `><br><br>` 두 줄이다. 줄 첫머리에 홀로 선 `<br>`은 HTML 블록을 열고, 그 블록은 빈 줄을 만날 때까지 이어진다. 인용문 안이라 빈 줄이 없으니 뒤따르는 줄이 통째로 원시 HTML로 넘어가고 마크다운 문법이 해석되지 않는다. Hugo에서는 넘어갔지만 Quartz는 규격대로 처리한다.

`kafka/index.md`는 같은 자리에 `>` 빈 줄을 써서 처음부터 정상이었다. 나머지 세 개도 거기에 맞춰 두 줄을 `>`로 바꿨다. 줄 끝에 붙은 인라인 `<br>`은 문단을 끊지 않으므로 그대로 뒀다.

글자는 한 자도 건드리지 않았다. 작업 전 원본은 `tooling/brain/checkpoint/2026-08-31-book-callout/`에 있다.

## 원본의 옛 경로와 대소문자 15건 (2026-08-31, 수정함)

폴더를 옮기기 전 경로가 원본 안에 남아 있던 것 8건과, Quartz가 슬러그를 소문자로 만드는데 링크는 대문자를 그대로 쓴 것 7건이다. 링크 대상만 어긋난 것이라 글자는 건드리지 않았다.

```
/brain/lectures/kim-spring/http/        → /brain/lectures/backend/kim-spring/http/     5건
/brain/lectures/easycode/db/lecture12/  → /brain/lectures/db/easy-db/lecture12/        3건
/brain/lectures/easycode/db/lecture07/  → /brain/lectures/db/easy-db/lecture07/        1건
/brain/notes/CodeTree/dataStructure/    → /brain/notes/codetree/datastructure/         2건
/brain/notes/Interview/dog-study/       → /brain/notes/interview/dog-study/            6건
                                          그중 #DI 는 #di 로 함께 고쳤다
```

대소문자 쪽은 로컬에서 200이 떠서 눈에 안 띄었다. macOS 파일시스템이 대소문자를 구분하지 않기 때문이고, GitHub Pages는 구분한다. 배포하면 404가 났을 것이다.

원본은 `tooling/brain/checkpoint/2026-08-31-stale-anchors/`에 있다.

## topics.md가 없는 문서 둘을 가리킨다 (2026-08-31, 미수정)

`content/topics.md`가 `portfolio/quartz-migration.md`와 `articles/reading-first-design.md`를 건다. 두 파일 다 없고 git 이력에도 없다. 처음부터 쓰지 않은 글이다.

쓸 계획이면 그대로 두고, 아니면 그 두 줄을 지우거나 실제 문서로 바꾼다. 있는 것은 `portfolio/iot-platform`, `portfolio/moabam`, `articles/index`다. 어느 쪽인지는 사람이 정할 일이라 두었다.
