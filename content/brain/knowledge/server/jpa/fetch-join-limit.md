---
title: fetch join의 한계
aliases:
  - fetch join의 한계
  - fetch join
  - MultipleBagFetchException
  - OneToOne 양방향 Lazy
tags:
  - server
  - jpa
  - database
  - spring
origin:
  verified: 2026-08-30
---

fetch join은 [[n-plus-one|N+1 문제]]의 가장 직접적인 해법이지만 쓸 수 없는 자리가 셋 있다. 셋 다 실무에서 반드시 만나므로 대안까지 함께 알아둬야 한다.

## 페이징이 막히는 이유

**일대다에서 페이징이 안 된다.** 일대다를 조인하면 행의 개수가 바뀐다. 리뷰 2개에 이미지가 3개씩 달려 있으면 조인 결과는 6행이다. 리뷰 기준으로 2개인지 조인 결과 기준으로 6개인지, JPA는 무엇을 기준으로 페이징할지 알 수 없게 된다. `limit`을 걸면 더 나쁘다. 데이터를 전부 가져온 뒤 메모리에서 페이징하기 때문에 `OutOfMemoryError`가 난다.

중복 행 자체는 JPQL의 `distinct`로 없앨 수 있다. 같은 식별자를 가진 엔티티를 하나로 합쳐준다. 페이징이 필요하면 fetch join을 포기하고 지연 로딩에 `@BatchSize`를 얹거나, 다(N) 쪽을 기준으로 fetch join해서 조회한 뒤 애플리케이션에서 합친다.

## 컬렉션 둘을 함께 fetch join할 때

**MultipleBagFetchException**은 일대다 자식 컬렉션 두 개 이상에 fetch join을 걸면 터진다. 컬렉션 하나만으로도 행이 곱해지는데 둘이면 곱하기가 두 번이라 데이터가 폭발한다.

## 일대일 양방향에서 무시되는 지연 로딩

**일대일 양방향에서 지연 로딩이 안 먹는다.** 외래키를 가진 주인 쪽을 조회할 때는 지연 로딩이 동작하는데, `mappedBy`로 연결된 반대쪽을 조회하면 지연 로딩이 무시되고 N+1이 난다. 외래키를 가지지 않은 쪽은 상대가 null인지 아닌지를 조회해보기 전에는 알 수 없기 때문이다. 지연 로딩은 프록시로 감싸서 동작하는데 프록시는 null을 감쌀 수 없어서 즉시 조회가 수행된다.

같은 상황에서 `@OneToMany`가 멀쩡한 이유는 컬렉션이기 때문이다. 상대가 없을 때 null 대신 크기가 0인 빈 컬렉션을 돌려주면 연관 관계 없음을 표현할 수 있으니 프록시로 감쌀 수 있다.

일대일 양방향은 구조를 바꿔 푸는 편이 낫다. 양방향 매핑이 정말 필요한지 다시 보고 일대다나 다대일로 바꿀 수 있는지 검토한다. 구조를 유지한다면 CART를 조회할 때 USER도 함께 fetch join하거나 batch fetch size를 쓴다. 외래키를 주 테이블에 두면 주 테이블만 봐도 연관관계를 확인할 수 있고, 대상 테이블에 두면 일대다로 확장하기 좋은 대신 양방향 매핑을 강제하게 된다.

## 실무에서 쓰는 조합

셋을 한꺼번에 다루려고 실무에서 쓰는 조합이 있다.

1. `hibernate.default_batch_fetch_size`를 전역으로 설정한다. N+1이 나더라도 `in` 쿼리로 묶여 기본 성능이 보장된다. 한계값은 [[n-plus-one|Batch Size와 같다]]
2. `@OneToOne`, `@ManyToOne` 처럼 1 관계의 자식은 전부 fetch join한다. 행이 늘지 않으므로 한 방 쿼리가 된다
3. `@OneToMany`, `@ManyToMany` 는 데이터가 가장 많은 자식 하나에만 fetch join한다
4. 나머지 컬렉션은 1번의 batch fetch size가 `in` 쿼리로 처리한다

## 관련

- [[n-plus-one|N+1 문제]]
- [[persistence-context|영속성 컨텍스트]]
- [[orm-jpa|ORM과 JPA]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week08|면접 스터디 8주차 - fetch join 한계]]
