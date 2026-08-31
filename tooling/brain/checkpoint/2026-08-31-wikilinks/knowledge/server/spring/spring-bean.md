---
title: 스프링 컨테이너와 빈
aliases:
  - 스프링 컨테이너와 빈
  - Spring Bean
  - IoC 컨테이너
  - 빈 생명주기
tags:
  - server
  - spring
origin:
  verified: 2026-08-30
---

스프링 빈은 스프링 IoC 컨테이너가 관리하는 객체이고, 스프링 IoC 컨테이너는 스프링 빈을 관리하는 객체다. 어떤 객체를 빈으로 등록한다는 것은 그 객체의 생명주기를 컨테이너가 맡는다는 표시다.

## 생성하는 쪽에 남는 책임

빈으로 등록하지 않고 직접 의존성을 주입하면 어떻게 되는지 보면 분명해진다.

```java
Service service = new Service(new JdbcDao());
```

어디에선가 `new`로 객체를 만들어야 하는데, 여기서 DAO 구현체가 바뀌면 이렇게 된다.

```java
Service service = new Service(new TestDao());
```

어떤 구현체를 고를지에 대한 책임이 생성하는 쪽에 있으니 Service를 생성하는 곳까지 함께 고쳐야 한다. [[의존성 주입]]을 했는데도 결합이 남아 있는 것이다.

```java
Service service = new Service(new Test1Dao(), new Test2Dao(), new Test3Dao());
```

의존성이 여러 개면 주입의 순서와 관계를 전부 파악해야 해서 더 번거롭다. 빈으로 등록하면 컨테이너가 생성과 주입을 대신 맡고, 개발자는 주입받은 의존성을 쓰는 로직에만 집중하면 된다. 주입에 쓰이는 객체가 항상 같다는 것도 컨테이너가 보장한다. 빈은 기본이 [[빈 스코프|싱글톤]]이기 때문이다.

## 생명주기와 초기화 시점

```
컨테이너 생성 → 빈 객체 생성 → 의존관계 주입
  → 초기화 콜백 → 사용 → 소멸 전 콜백 → 스프링 종료
```

초기화는 생성 직후가 아니라 의존관계 주입 이후에 일어난다. 빈은 의존관계 주입이 끝나야 쓸 수 있으니 그때가 되어서야 초기화 콜백이 불린다. 생성자에서 초기화라는 무거운 작업을 하는 것보다 둘을 나눠두는 편이 유지보수에 낫다.

콜백이 필요한 까닭은 DB 커넥션이나 네트워크 소켓처럼 시작 지점에 미리 연결해두고 종료 시점에 끊어야 하는 자원 때문이다. [[커넥션 풀]]의 연결과 해제가 그렇다.

## 콜백을 등록하는 세 가지 방법

관리하는 방법은 셋이다. `InitializingBean`과 `DisposableBean` 같은 스프링 인터페이스를 구현하는 방법은 코드가 스프링에 의존하게 된다. JSR-250 표준인 `@PostConstruct`와 `@PreDestroy`가 스프링이 권장하는 방식인데, 외부 라이브러리에는 애노테이션을 붙일 수 없다는 한계가 있다. 그럴 때 설정 정보에 `@Bean(initMethod = "onInitialize", destroyMethod = "onDestroy")`처럼 초기화 메서드와 종료 메서드를 지정한다.

## 관련

- [[빈 스코프]]
- [[컴포넌트 스캔]]
- [[제어의 역전]]
- [[의존성 주입]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week05|면접 스터디 5주차 - Spring Bean]]
- [[brain/lectures/backend/kim-spring/spring-intro/spring-basic-02|김영한 스프링 입문 - 스프링 빈과 의존관계]]
