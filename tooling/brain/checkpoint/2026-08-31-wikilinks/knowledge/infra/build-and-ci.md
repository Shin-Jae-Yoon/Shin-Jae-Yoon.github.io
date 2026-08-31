---
title: 빌드와 배포
aliases:
  - 빌드와 배포
  - Gradle
  - 빌드 도구
  - CI 도구
  - Jenkins
tags:
  - infra
  - java
  - spring
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

소스를 실행 가능한 형태로 묶는 일을 자바에서 자동화하는 도구가 Gradle이고, 그 빌드를 자동으로 돌리고 결과를 알려주는 것이 젠킨스 같은 CI 도구다.

## Gradle과 task

Gradle이 수행하는 명령 단위를 task라고 하고 `build.gradle`에 기록되어 있는데, `run`이나 `build`처럼 자주 쓰는 것은 애플리케이션 플러그인이 미리 만들어둔다.

```shell
gradle init     # 프로젝트 생성
gradle build    # 빌드
gradle run      # 실행
gradle tasks    # task 확인
```

빌드 스크립트는 Groovy로 쓰는 것이 여전히 익숙하고, 코틀린으로 쓰는 추세도 늘고 있다. 스프링과 스프링 부트에서 배포 산출물의 형태가 달라진 이야기는 [[프레임워크와 라이브러리]]에 있다.

## 젠킨스가 갖춘 것

젠킨스 같은 CI 도구는 배포와 배치 운영에 잘 맞는다. 성공하거나 실패하면 슬랙이나 이메일로 알려주고, 실행 이력과 로그와 대시보드를 갖췄으며, REST API와 스케줄링과 수동 실행을 모두 지원한다. 계정별 권한 관리와 파이프라인이 있고 Ansible이나 GitHub 같은 플러그인도 붙는다. [[Spring Batch]]를 운영할 때 이 특성이 그대로 값어치를 하고, 그 이야기는 [[배치와 스케줄러]]에 있다.

## 잘게 나눈 파이프라인

파이프라인은 잘게 나눈다. 작업 하나에 단계를 여러 개 넣는 것보다 파이프라인 안에 작업을 여러 개 넣는 편이 낫다. 단독으로 실행할 수 있게 설계해야 유지보수에 좋기 때문이다. 중간만 다시 돌리고 싶을 때 한 덩어리로 묶여 있으면 곤란하다.

## 참고

빌드가 어디까지를 가리키는지는 원본에 없다. Maven의 기본 빌드 생명주기가 그 범위를 보여준다. `compile`(프로젝트 소스를 컴파일한다), `test`(적절한 단위 테스트 프레임워크로 테스트를 실행한다), `package`(컴파일된 코드를 JAR 같은 배포 형태로 묶는다), `verify`(패키지가 유효하고 품질 기준을 만족하는지 검사한다)가 차례로 놓인다. 빌드는 [[컴파일 과정|컴파일]]과 링킹만 가리키는 것보다 넓어서 의존성 해결과 테스트 실행, 패키징까지 포함하고, 자바에서 이 일을 맡는 도구는 Gradle과 Maven 둘이다. [Apache Maven, Introduction to the Build Lifecycle](https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html)

## 관련

- [[배치와 스케줄러]]
- [[무중단 배포]]
- [[브랜치 전략]]
- [[프레임워크와 라이브러리]]

## 출처

- [[brain/notes/DevCourse/001|데브코스 회고 1편 - Build Tool]]
- [[brain/notes/Interview/dog-study/dog-week09|면접 스터디 9주차 - Batch 실행]]
- [[brain/notes/Interview/dog-study/dog-week03|면접 스터디 3주차 - Spring Boot]]
