---
title: 영속성 컨텍스트
aliases:
  - 영속성 컨텍스트
  - EntityManager
  - 준영속
  - 프록시
tags:
  - server
  - jpa
  - database
  - spring
origin:
  verified: 2026-08-30
---

엔티티를 영구 저장하는 환경. [[orm-jpa|JPA]]가 엔티티를 관리하는 공간이고 `EntityManager`를 통해 접근한다. JPA의 동작이 예상과 다르게 느껴지는 것은 대부분 이 컨텍스트의 생명주기 때문이다.

## 생성과 소멸 시점

컨텍스트가 언제 생기고 언제 사라지는지는 [[osiv|OSIV]] 설정에 달려 있다. OSIV를 끄면 트랜잭션이 시작될 때 만들어지고 커밋된 뒤에 사라진다. 스프링의 기본값인 `spring.jpa.open-in-view: true`에서는 요청이 들어올 때 서블릿 필터나 스프링 인터셉터가 미리 만들고, 서비스에서 트랜잭션이 커밋된 뒤에도 닫지 않은 채 컨트롤러와 뷰까지 끌고 가다가 요청이 돌아올 때 종료한다.

## 영속, 준영속, 비영속

엔티티는 그 안에서 세 상태를 오간다. 컨텍스트가 관리하고 있으면 영속, 관리되다가 떨어져 나왔으면 준영속, 아직 한 번도 관리된 적이 없으면 비영속이다. 서비스에서 트랜잭션이 시작되면 조회한 엔티티가 영속 상태가 되고, 트랜잭션이 닫히면서 밖으로 나오면 준영속 상태가 된다.

## 컨텍스트가 닫힌 뒤의 지연 로딩

지연 로딩은 연관된 객체 자리에 프록시를 넣어두었다가 실제로 그 객체를 건드릴 때 진짜 데이터를 가져온다. 이 초기화는 영속성 컨텍스트가 살아 있어야만 가능하다.

그래서 컨텍스트가 닫힌 뒤에 연관 객체를 건드리면 오류가 난다.

```
Service 종료 → 트랜잭션 종료 → 영속성 컨텍스트 소멸
Controller에서 Lazy Loading 시도 → could not initialize proxy
```

컨트롤러까지 엔티티를 끌고 가서 DTO로 바꾸려 할 때 만나는 벽이고, [[osiv|OSIV]]가 여기에 답한 기능이다.

## 관련

- [[orm-jpa|ORM과 JPA]]
- [[osiv|OSIV]]
- [[n-plus-one|N+1 문제]]
- [[entity|Entity]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week08|면접 스터디 8주차 - OSIV, JPA]]
- [[brain/notes/Interview/dog-study/dog-week06|면접 스터디 6주차 - EntityManager]]
