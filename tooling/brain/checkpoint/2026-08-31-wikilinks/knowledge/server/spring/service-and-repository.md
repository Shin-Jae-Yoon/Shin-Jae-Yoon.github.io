---
title: Service와 Repository
aliases:
  - Service와 Repository
  - Service
  - Repository
  - 도메인 계층
tags:
  - server
  - spring
origin:
  verified: 2026-08-30
  scouted: 2026-08-30
---

[[레이어드 아키텍처]]의 두 계층을 스프링에서 나누는 방식. 이름을 어떻게 붙이느냐가 아니라 무엇을 넣느냐의 문제다.

## 컨트롤러에 쌓이는 중복

서비스 규모가 커지면 MVC를 지키기가 점점 어려워진다. 쇼핑몰이라면 게시판에서도 회원 정보를 보여주고 상품 목록에서도 회원 정보를 보여줘야 하는데, 회원 정보를 읽어오는 코드를 컨트롤러마다 두면 중복이 생긴다. 그 코드를 별도의 객체와 메서드로 분리한 것이 Service다.

컨트롤러 1, 2, 3이 있고 회원 Service, 상품 Service, 게시판 Service가 있으면 컨트롤러들이 필요한 서비스를 골라 쓴다. 데이터 액세스 메서드도 같은 이유로 Repository로 빠지고, Service가 그것을 쓴다.

## 비즈니스 로직이 놓이는 자리

Service는 비즈니스 로직을 수행하는 메서드를 가진 객체이고 `@Service`를 붙인다. 회원은 중복 가입이 안 된다 같은 핵심 규칙이 여기 있고, 여러 리포지토리를 조율하는 자리이기도 하다. 서비스 하나가 [[트랜잭션]] 하나를 가진다.

메서드 이름에는 업무 용어를 그대로 쓴다. 회원 가입을 하는 메서드가 `join()`인 것이 그런 예다. 도메인과 구현이 같은 말을 쓰게 하는 이야기는 [[DDD|유비쿼터스 언어]]에 있다.

## 저장과 조회만 남기는 곳

Repository는 도메인 객체를 저장하고 불러오는 곳이고 `@Repository`를 붙인다. 비즈니스 로직이 들어가면 안 된다. DAO와 무엇이 다른지는 [[DAO, DTO, VO]]에 정리되어 있다.

## 도메인의 경계

도메인은 화면과 UI와 기술 인프라를 제외한 핵심 업무 영역이다. 회원, 주문, 쿠폰처럼 주로 DB에 저장되고 관리되는 객체가 도메인이고, [[Entity]]와 Repository가 여기 든다. 컨트롤러는 도메인이 아니다. 그래서 컨트롤러에 비즈니스 판단이 들어가기 시작하면 계층이 무너진 것이다.

## 저장소를 갈아끼우는 인터페이스

리포지토리를 인터페이스로 두는 것은 저장소를 갈아끼우기 위해서다.

```java
public interface MemberRepository { ... }

public class MemoryMemberRepository implements MemberRepository { ... }
public class JdbcMemberRepository implements MemberRepository { ... }
```

데이터 저장소를 아직 정하지 못한 상태에서 RDB든 NoSQL이든 나중에 붙일 수 있게 해두고, 개발 초기에는 가벼운 메모리 저장소로 간다. DB가 준비되면 구현체만 바꿔 끼우고 서비스 코드는 한 줄도 손대지 않는다. [[컴포넌트 스캔|자바 코드로 빈을 등록]]해두면 설정 파일에서 `return`만 바꾸면 된다. [[DIP]]가 실제로 값어치를 하는 자리다.

## 참고

`@Repository`에는 DB마다 다른 예외를 스프링의 일관된 예외 계층으로 바꿔주는 효과도 있는데, 원본은 이 이야기를 다루지 않는다. [Spring Framework Reference - Exception Translation](https://docs.spring.io/spring-framework/reference/data-access/orm/general.html#orm-exception-translation)

## 관련

- [[레이어드 아키텍처]]
- [[DAO, DTO, VO]]
- [[선언적 트랜잭션]]
- [[DIP]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week05|면접 스터디 5주차 - Service, Repository]]
- [[brain/lectures/backend/kim-spring/spring-intro/spring-basic-01|김영한 스프링 입문 - 회원 관리 예제]]
