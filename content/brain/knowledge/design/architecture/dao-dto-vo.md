---
title: DAO, DTO, VO
aliases:
  - DAO, DTO, VO
  - DAO
  - DTO
  - VO
tags:
  - design
  - database
origin:
  verified: 2026-08-30
---

이름이 비슷해 뒤섞이는 셋인데 역할은 전혀 다르다. DAO는 DB에 접근해 CRUD를 수행하는 객체, DTO는 계층 사이에 데이터를 나르는 객체, VO는 값 그 자체를 표현하는 불변 객체다.

## DAO

DB 접근 관련 로직을 모아둔 객체다. 실제로 DB에 접근해 조회, 삽입, 삭제, 수정을 수행하고 Service와 DB를 잇는다. 목적은 DB 접근 로직과 비즈니스 로직을 떼어놓는 것이고, [[layered-architecture|레이어드 아키텍처]]의 Persistence 층이 이 자리다.

## DTO

계층 간 데이터 교환을 위한 객체다. Controller와 View와 Business Layer 사이를 오간다. 로직을 갖지 않고 getter와 setter만 있는 순수한 데이터 객체이며, 보내는 쪽이 setter로 담고 받는 쪽이 getter로 꺼낸다. DB에서 꺼낸 데이터를 담은 [[entity|Entity]]를 감싸는 일종의 래퍼다.

Entity를 계층에 직접 전달하지 않고 DTO로 바꿔 보내는 것이 요점이고, 그 이유는 [[entity|Entity]]에 정리되어 있다.

## VO

읽기 전용 값 객체로, DTO와 달리 값 그 자체를 뜻한다. 불변이어야 하므로 setter를 두지 않고 생성자로만 초기화한다. 대신 DTO와 달리 로직이 있는 메서드를 가질 수 있다.

`equals()`와 `hashCode()`를 모두 재정의해야 완전한 VO가 된다. HashSet, HashMap, HashTable은 두 객체가 같은지 볼 때 `hashCode()` 반환값을 먼저 비교하고 그것이 같으면 `equals()` 반환값을 비교하므로, 둘을 다 거쳐야 비로소 동등한 객체다. 돈이나 좌표나 기간처럼 식별자 없이 값만으로 정의되는 것이 VO이고, [[immutable-object|불변 객체]]로 이어진다.

## DAO와 Repository

DAO와 Repository는 거의 같지만 엄밀히는 추상화 수준이 다르다. DAO는 데이터 영속성의 추상화이고 DB에 가까운 저수준 개념이라 대개 테이블 중심이다. 지저분한 쿼리를 감추고 데이터 소스 연결과 접근 방식을 구현한다. Repository는 객체 컬렉션의 추상화이고 도메인에 가까운 상위 개념이다. 도메인과 데이터 접근 사이에 서서 도메인 객체를 준비하는 복잡함을 감춘다. 그래서 Repository는 내부에서 DAO를 쓸 수 있지만 반대는 안 된다.

SQL을 직접 다룰 때는 쿼리 중심이라 도메인 객체가 뚜렷하지 않지만, [[orm-jpa|JPA]]를 쓰면 [[entity|Entity]]를 정하고 그것을 관리하므로 Repository라는 이름이 더 맞다. MyBatis 같은 프레임워크를 쓰면 DAO를 따로 만드는 경우가 드물고 Mapper가 그 역할을 대신한다.

## 값을 나르는 것과 값 자체

DTO와 VO의 차이는 가장 자주 묻는 것이다.

|           | DTO                                  | VO                            |
| --------- | ------------------------------------ | ----------------------------- |
| 용도      | 레이어 간 데이터 전달                | 값 자체 표현                  |
| 동등 판단 | 속성 값이 다 같아도 같은 객체가 아님 | 속성 값이 다 같으면 같은 객체 |
| 가변성    | setter가 있으면 가변, 없으면 불변    | 불변                          |
| 로직      | getter와 setter 외의 로직이 없음     | 로직을 가질 수 있음           |

## 관련

- [[entity|Entity]]
- [[layered-architecture|레이어드 아키텍처]]
- [[immutable-object|불변 객체]]
- [[equals-hashcode|equals와 hashCode]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week06|면접 스터디 6주차 - DAO, DTO, VO]]
