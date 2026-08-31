---
title: 3-tier 아키텍처
aliases:
  - 3-tier 아키텍처
  - Presentation tier
  - Logic tier
  - Data tier
tags:
  - design
  - database
origin:
  verified: 2026-08-30
---

클라이언트-서버 구조의 한 종류로, 시스템을 물리적으로 분리된 세 계층으로 나눈다.

## 세 계층의 배치

Presentation tier는 사용자가 보는 화면이다. 그 아래 Logic tier에 비즈니스 로직을 처리하는 애플리케이션 서버가, 다시 그 아래 Data tier에 데이터를 저장하는 DB 서버가 있다. 계층 사이의 통신은 네트워크를 타고 각 계층은 따로 늘릴 수 있다.

## 레이어드 아키텍처와 나누는 단위

[[layered-architecture|레이어드 아키텍처]]와 이름이 비슷해 헷갈리는데 나누는 단위가 다르다. 레이어드 아키텍처는 한 애플리케이션 안의 코드를 논리적 층으로 나누고, 3-tier는 물리적으로 다른 기계로 나눈다.

## 저장 프로시저와 Data tier

이 구분이 실제로 문제가 되는 자리가 있다. [[stored-routine|저장 프로시저]]를 쓴다는 것은 Data tier에 비즈니스 로직을 두는 것이다.

당근마켓을 예로 들면 회원 가입과 탈퇴, 상품 리스트업 알고리즘, 상품 검색, 메시지 기능이 비즈니스 로직이고, 회원 정보와 상품 정보, 판매와 구매 내역, 지역 정보가 데이터다.

로직을 Data tier에 두면 응답이 빨라지고 여러 서비스가 재사용할 수 있다. 대신 DB 서버는 늘리기가 어렵다. Logic tier 서버는 복제해 붙이면 되지만 DB 서버는 데이터까지 복제해야 하기 때문이다. 그래서 로직은 Logic tier에 둔다는 것이 실무의 결론이고, 자세한 것은 [[procedure-tradeoff|프로시저의 장단점]]에 있다.

## 관련

- [[layered-architecture|레이어드 아키텍처]]
- [[procedure-tradeoff|프로시저의 장단점]]
- [[monolithic-vs-msa|모놀리식과 MSA]]

## 출처

- [[brain/lectures/db/easy-db/lecture12|쉬운코드 데이터베이스 12강 - 3-tier architecture]]
- [[brain/lectures/db/easy-db/lecture10|쉬운코드 데이터베이스 10강 - three-tier architecture]]
