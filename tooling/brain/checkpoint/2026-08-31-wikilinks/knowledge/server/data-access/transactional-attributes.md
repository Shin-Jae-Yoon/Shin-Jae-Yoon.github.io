---
title: "@Transactional 속성"
aliases:
  - "@Transactional 속성"
  - 트랜잭션 전파
  - Propagation
  - REQUIRES_NEW
  - NESTED
  - rollbackFor
  - readOnly
tags:
  - server
  - spring
  - database
origin:
  verified: 2026-08-30
  scouted: 2026-08-30
---

`@Transactional`에 지정할 수 있는 여섯 가지 속성. 전파와 롤백 규칙이 실무에서 자주 문제가 된다.

## 전파 옵션

전파(propagation)는 트랜잭션 경계에서 이미 진행 중인 트랜잭션이 있는지에 따라 어떻게 동작할지를 정한다. 여러 트랜잭션 적용 범위를 묶어 하나의 커다란 경계로 만들 수도 있다.

| 옵션          | 진행 중인 트랜잭션 O | 진행 중인 트랜잭션 X |
| ------------- | -------------------- | -------------------- |
| REQUIRED      | 그 트랜잭션 사용     | 새로 생성            |
| MANDATORY     | 그 트랜잭션 사용     | 예외 발생            |
| REQUIRES_NEW  | 보류하고 새로 생성   | 새로 생성            |
| SUPPORTS      | 그 트랜잭션 사용     | 트랜잭션 없이 진행   |
| NOT_SUPPORTED | 보류                 | 트랜잭션 없이 진행   |
| NEVER         | 예외 발생            | 트랜잭션 없이 진행   |
| NESTED        | 중첩 트랜잭션 생성   | 새로 생성            |

REQUIRED가 기본값이고 모든 트랜잭션 매니저가 지원한다. 트랜잭션이 시작된 뒤 다른 트랜잭션 메서드를 부르면 자연스럽게 같은 트랜잭션으로 묶인다. 혼자 독립적으로 진행하면 안 되는 자리에는 MANDATORY를, 항상 새 트랜잭션이 필요한 자리에는 REQUIRES_NEW를 쓴다. SUPPORTS는 진행 중인 트랜잭션이 없어도 그 경계 안에서 `Connection`이나 Hibernate `Session`을 공유하게 해준다.

## 격리 수준

격리 수준(isolation)의 기본값 `DEFAULT`는 드라이버를 거쳐 DB 설정을 따른다. 오라클은 READ_COMMITTED, MySQL은 REPEATABLE_READ다. 수준마다 무엇이 달라지는지는 [[격리 수준]]에 있다.

## readOnly

`readOnly`는 두 가지 목적을 갖는다. 트랜잭션 안에서 데이터를 조작하려는 시도를 막고, 성능을 최적화한다. JPA에서는 플러시가 일어나지 않고 스냅샷 저장과 비교 같은 무거운 작업을 건너뛴다. DB가 master와 slave로 나뉘어 있으면 읽기 전용인 slave를 호출하므로 서버 부하도 줄어든다.

## timeout

`timeout`은 트랜잭션에 제한 시간을 준다. 기본 옵션에는 제한 시간이 없고, 새 트랜잭션을 시작하는 REQUIRED나 REQUIRES_NEW와 함께 쓸 수 있다.

## rollbackFor와 noRollbackFor

`rollbackFor`와 `noRollbackFor`가 가장 자주 걸리는 함정이다. 스프링은 기본적으로 **언체크 예외와 `Error`에 대해 롤백**하고, 예외가 없었거나 체크 예외가 발생했으면 커밋한다. 체크 예외를 커밋 대상으로 삼은 것은 그것이 예외적인 상황보다 반환값을 대신하는 비즈니스적 결과로 많이 쓰이기 때문이고, 언체크 예외를 롤백 대상으로 삼은 것은 데이터 액세스 기술의 예외가 런타임 예외로 전환되어 던져지기 때문이다. `IOException`이 터져도 커밋되니, 롤백하려면 `rollbackFor = Exception.class`를 명시해야 한다.

## REQUIRES_NEW와 NESTED

REQUIRES_NEW와 NESTED는 이름이 비슷해 헷갈리는데 부모와의 관계가 다르다. REQUIRES_NEW는 독립적인 트랜잭션이라 부모와 아무 상관이 없다. NESTED는 트랜잭션 안에 다시 만드는 중첩 트랜잭션이라 부모의 커밋과 롤백에 영향을 받고, 자식의 커밋과 롤백은 부모에 영향을 주지 않는다.

이 비대칭이 어울리는 자리가 있다. 중요한 작업을 하면서 로그를 DB에 남기는 경우다. 로그 저장이 실패해도 힘들게 처리한 메인 작업까지 롤백해서는 안 되고, 반대로 메인 작업이 실패하면 남긴 로그도 지워야 한다.

## NESTED를 지원하는 매니저

NESTED는 아무 데서나 되지 않는다. JDBC 세이브포인트로 구현되어 있어 세이브포인트를 지원하는 매니저에서만 동작하고, 매니저마다 그 스위치가 켜져 있는지가 다르다. `DataSourceTransactionManager`는 `nestedTransactionAllowed`를 처음부터 켜두지만 `JpaTransactionManager`는 꺼둔 채로 오므로, JPA에서 그냥 NESTED를 걸면 `NestedTransactionNotSupportedException`이 난다.

플래그를 켜면 `JpaTransactionManager`에서도 동작하기는 한다. 다만 세이브포인트가 되돌리는 것은 JDBC 커넥션뿐이라 [[영속성 컨텍스트]]에 캐시된 엔티티는 그대로 남는다. JPA 자체가 중첩 트랜잭션을 지원하지 않으므로 JPA 접근 코드가 의미적으로 중첩 트랜잭션에 참여한다고 기대하면 안 된다.

## 프록시가 만드는 제약

선언적 트랜잭션은 프록시로 동작하므로 같은 객체 안에서 부르면 트랜잭션이 걸리지 않는다. 그 구조와 회피 방법은 [[프록시의 한계]]에 있다.

## 참고

원본은 NESTED를 전파 옵션의 하나로만 적고 어디서 되는지는 적지 않았다. NESTED는 JDBC 세이브포인트를 써서 구현되므로 `DataSourceTransactionManager`처럼 세이브포인트를 지원하는 매니저에서만 동작한다. [DataSourceTransactionManager javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/datasource/DataSourceTransactionManager.html)

JPA를 쓸 때 붙는 `JpaTransactionManager`가 중첩 트랜잭션을 지원하지 못하는 것은 아니다. javadoc은 "This transaction manager supports nested transactions via JDBC Savepoints"라고 적고, 다만 `nestedTransactionAllowed`가 기본값 false라서 그대로 쓰면 예외가 난다고 밝힌다. 세이브포인트가 JDBC 커넥션에만 걸리고 EntityManager가 캐시한 엔티티에는 걸리지 않는 것이 기본값을 꺼둔 이유다. [JpaTransactionManager javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/orm/jpa/JpaTransactionManager.html)

## 관련

- [[선언적 트랜잭션]]
- [[격리 수준]]
- [[프록시의 한계]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week07|면접 스터디 7주차 - Transactional 속성]]
