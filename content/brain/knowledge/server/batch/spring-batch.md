---
title: Spring Batch
aliases:
  - 배치 애플리케이션
  - 스프링 배치
  - 청크
  - Chunk
  - Job Step
tags:
  - server
  - spring
origin:
  verified: 2026-08-30
  scouted: 2026-08-30
---

사람과 상호작용 없이 이어지는 작업의 실행. 개발자가 정의한 작업을 한 번에 일괄 처리하고, 단발성으로 대용량 데이터를 다룬다.

## 배치가 필요한 자리

일 매출 집계, 큰 데이터로 결정하는 보험 급여, 외부 시스템에서 받은 정보의 검증과 통합, 사용자가 적은 시간대에 도는 주기적 크롤링이 배치의 자리다. 일정 주기로 실행해야 하거나 실시간으로 처리하기 어려운 양일 때 배치가 필요하다.

전날 데이터를 집계하는 일을 웹 애플리케이션으로 하면 어떻게 되는지 보면 분명해진다. 아주 큰 데이터를 읽고 가공하고 저장하는 동안 서버가 CPU와 I/O를 다 써버려 다른 요청을 처리하지 못한다. 하루에 한 번 도는 기능을 위해 API를 만드는 것도 낭비다. 무엇보다 처리 중 실패하면 처음부터 다시 해야 하고 이어서 할 방법이 없다.

## 배치 애플리케이션의 다섯 조건

배치 애플리케이션이 갖춰야 할 조건은 다섯이다. 많은 양을 가져오고 전달하고 계산하는 대용량 데이터 처리, 심각한 문제가 아니면 사용자 개입 없이 도는 자동화, 잘못된 데이터에도 충돌하거나 멈추지 않는 견고성, 무엇이 잘못됐는지 추적하게 해주는 로깅과 알림, 정해진 시간 안에 끝나면서 동시에 도는 다른 작업을 방해하지 않는 성능이다.

## Job과 실행 이력

Job은 배치 처리 과정을 하나의 단위로 묶어놓은 객체다. JobInstance는 JobParameters로 구분되는 논리적 실행 단위라서 1월 1일 실행과 1월 2일 실행이 서로 다른 인스턴스가 되고, JobExecution은 그 인스턴스에 대한 한 번의 실행 시도로 상태와 시작 시간, 종료 시간을 갖는다. Job을 실행하는 것은 JobLauncher이고, 이 정보들을 보관하는 곳이 JobRepository다.

## Step과 Tasklet

Job은 여러 Step으로 구성되고, Step 하나는 Tasklet 하나를 갖는다.

```
Job ─ 여러 개의 Step ─ Step 하나에 Tasklet 하나
```

Tasklet은 `execute` 메서드 하나로 된 간단한 인터페이스다. `RepeatStatus.FINISHED`나 `null`을 반환할 때까지 반복 호출되고, 예외를 던지면 그 Step이 실패한다. Step마다 StepExecution이 하나씩 생기고 그 안의 ExecutionContext가 통계와 상태 정보를 들고 있어서 재시작이 가능하다. Step이 실패하면 이후 Step은 실행되지 않는다.

## 청크 지향 처리

Tasklet 구현은 크게 둘로 갈린다. 로직을 그 자리에서 적어 넣는 익명 Tasklet이 있고, 청크 지향 처리를 맡는 `ChunkOrientedTasklet`이 있다.

청크는 커밋되는 행 수다. 읽고, 가공하고, 저장하는 세 단계로 돈다.

```
읽기(Read) → 처리(Processing) → 쓰기(Write)
```

DB에서 처리할 데이터를 읽어오는 것이 읽기, 그것을 가공하는 것이 처리, 결과를 저장하는 것이 쓰기다. 처리는 필수가 아니다.

청크 단위로 트랜잭션을 수행하므로 실패하면 그 청크만큼만 롤백된다. 100만 건을 처리하다 90만 번째에서 실패해도 앞의 것은 남는다. 긴 작업을 처음부터가 아니라 이어서 할 수 있는 이유가 이것이다. 감당 가능한 덩어리로 잘라 처리한다는 발상은 [[in-place-sort|외부 정렬]]에도 있다.

## Cursor와 Paging

Item을 읽어오는 방식으로는 Cursor와 Paging이 있다. Cursor는 한 건씩 처리하면서 모든 결과를 메모리에 올리고 데이터를 다 처리할 때까지 커넥션을 유지하며, 멀티스레드 환경에서는 동기화 처리가 따로 필요하다. Paging은 페이지 크기만큼 한 번에 처리하고 그만큼만 커넥션을 맺었다 끊으며 페이징 결과만 메모리에 올린다. 대용량 배치에서는 Paging이 효과적이다. Paging Size와 Chunk Size를 같게 맞추는 것이 권장되는데, 다르면 한 번의 트랜잭션을 위해 read 쿼리가 여러 번 나가기 때문이다.

## 웹 애플리케이션과의 차이

|      | Web                  | Batch                |
| ---- | -------------------- | -------------------- |
| 처리 | 실시간               | 후속                 |
| 속도 | 상대적인 체감 응답성 | 절대적인 전체 처리량 |
| QA   | 용이하다             | 복잡하다             |

QA가 어려운 것은 화면이 없기 때문이다. QA 담당자가 DB를 열어보고 자바 코드를 뜯어볼 수는 없다.

## 청크 크기 결정

청크 크기에는 구체적인 가이드가 없다. 설계한 비즈니스 로직에 가장 잘 맞는 값을 직접 찾아야 한다.

제약은 하나다. 청크 크기만큼 메모리에 적재하므로, 크게 잡으면 함께 도는 다른 배치가 쓸 메모리를 뺏는다.

## 참고

원본은 Job이 여러 Step으로, Step이 여러 Tasklet으로 구성된다고 적었다. Step은 Tasklet을 정확히 하나 갖는다. 청크 지향 처리도 Tasklet의 대안이 아니라 `ChunkOrientedTasklet`이라는 단일 구현이다. [Spring Batch Reference - Chunk-oriented Processing](https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing.html)

원본은 `execute`가 예외를 던질 때까지 반복 호출된다고 적었다. 반복이 끝나는 정상 조건은 `RepeatStatus.FINISHED` 또는 `null`의 반환이고, 예외는 Step을 실패시키는 별개의 경로다. [Spring Batch Reference - TaskletStep](https://docs.spring.io/spring-batch/reference/step/tasklet.html)

## 관련

- [[batch-and-scheduler|배치와 스케줄러]]
- [[acid|트랜잭션]]
- [[in-place-sort|제자리 정렬]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week09|면접 스터디 9주차 - Spring Batch]]
