---
title: 배치와 스케줄러
aliases:
  - 배치와 스케줄러
  - Quartz
  - 배치 실행
tags:
  - server
  - spring
origin:
  verified: 2026-08-30
  scouted: 2026-08-30
---

배치는 일괄 처리를 뜻하고 무엇을 어떻게 처리할지를 다룬다. 스케줄링은 매 시간이나 지정한 시각에 지정한 동작을 수행하는 행위이고 언제 실행할지를 다룬다. 이름이 나란히 놓이는 일이 많아서 자주 뒤섞인다.

## Quartz와 Spring Batch의 역할 분담

Spring Batch와 Quartz를 비교하는 글이 있는데 잘못된 비교다. Quartz는 스케줄러라서 대용량 데이터 배치 처리 기능이 없고, Spring Batch는 배치 처리라서 Quartz만큼 다양한 스케줄 기능이 없다. 겨루는 사이가 아니라 짝을 이루는 사이다.

그래서 보통 둘을 조합한다. 정해진 스케줄마다 Quartz가 Spring Batch를 실행하는 구조다.

## CommandLineRunner와 ApplicationRunner

스프링 배치를 실행하는 진입점으로는 `CommandLineRunner`와 `ApplicationRunner`를 쓴다. 둘 다 스프링 부트 콜백이고, 애플리케이션 컨텍스트가 뜬 뒤 한 번 실행된다. 차이는 실행 인자를 받는 타입뿐이다. `CommandLineRunner`는 `String...`으로 날것 그대로 받고, `ApplicationRunner`는 `ApplicationArguments`로 옵션과 값을 갈라 받는다.

## 배치를 돌리는 도구들

운영에서 배치를 언제 어떻게 돌릴지 관리하는 도구는 여럿이다. 리눅스 스케줄러인 Cron으로 jar를 실행할 수 있고, 코드 안에 REST API를 만들어 호출하는 Spring MVC 방식도 있지만 배치를 API로 노출하는 셈이라 권장되지 않는다. Spring Batch Admin은 deprecated 되었고, Quartz에 관리자 페이지를 붙여 쓰는 방법이 남아 있다. 실무에서 가장 잘 맞는 것은 젠킨스 같은 CI 도구다.

## 젠킨스가 채워주는 것

젠킨스를 예로 들면 배치 운영에 필요한 것이 이미 다 있다. 실패하거나 성공했을 때 슬랙이나 이메일로 보내는 알림, 실행 이력과 로그와 대시보드, REST API와 스케줄링과 수동 실행이라는 세 갈래 실행 방법, 계정별 권한 관리, 파이프라인, 웹 UI와 스크립트 양쪽 지원, 플러그인 생태계까지 갖췄다. [[Spring Batch|배치 애플리케이션의 조건]]이었던 자동화와 신뢰성을 도구가 그대로 채워준다.

파이프라인을 쓸 때는 Job 하나에 Step을 여러 개 설계하는 것보다 젠킨스 파이프라인 안에 여러 Job을 넣는 편이 권장된다. Job을 단독으로 실행할 수 있게 설계해두는 것이 유지보수에 낫기 때문이다.

## 참고

원본은 `CommandLineRunner`를 jar로 만들어 CLI로 실행하는 것, `ApplicationRunner`를 자바 코드 안에서 실행하는 것으로 갈랐다. 둘 다 스프링 부트가 컨텍스트 기동 직후 호출하는 콜백이고 실행 위치가 다르지 않다. 갈리는 것은 콜백이 받는 인자 타입이다. [Spring Boot Reference - Using the ApplicationRunner or CommandLineRunner](https://docs.spring.io/spring-boot/reference/features/spring-application.html#features.spring-application.command-line-runner)

## 관련

- [[Spring Batch]]
- [[빌드와 배포]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week09|면접 스터디 9주차 - 배치 vs 스케쥴러, Batch 실행]]
