---
title: 테스트
aliases:
  - 테스트
  - 단위 테스트
  - 통합 테스트
  - JUnit
  - "@SpringBootTest"
tags:
  - server
  - spring
  - java
origin:
  verified: 2026-08-30
---

개발한 기능이 제대로 도는지 코드로 확인하는 일. 자바에서는 JUnit 프레임워크로 한다.

## main으로 확인할 때의 불편

기능을 확인하려면 자바의 `main` 메서드로 실행하거나 웹 애플리케이션의 컨트롤러를 통해 호출해야 한다. 이 방법은 준비하고 실행하는 데 오래 걸리고, 반복 실행하기 어렵고, 여러 테스트를 한 번에 실행하기도 어렵다. JUnit이 그 문제를 해결한다.

## given, when, then

테스트 코드는 given, when, then 순서로 짠다. 무엇이 주어졌고 무엇을 실행했고 무엇을 기대하는지가 그대로 드러난다.

```java
@Test
void 회원가입() {
    // given
    Member member = new Member();
    member.setName("hello");

    // when
    Long saveId = memberService.join(member);

    // then
    Member findMember = memberService.findOne(saveId).get();
    assertThat(member.getName()).isEqualTo(findMember.getName());
}
```

테스트 메서드 이름은 한글로 적어도 된다. 실제로 도는 코드는 한글로 쓰기 애매하지만 테스트 코드는 보기 편하자고 쓰는 것이다.

## 테스트마다 새로 만드는 객체

`@BeforeEach`로 테스트 전에 의존성을 주입하고 `@AfterEach`로 뒷정리를 한다. 각 테스트 실행 전에 새 객체를 만들고 의존관계도 새로 맺어야 테스트끼리 영향을 주지 않는다.

## 의존성 주입이 드러나는 자리

여기서 [[dependency-injection|의존성 주입]]이 왜 필요한지가 드러난다. 서비스가 메모리 리포지토리를 직접 생성하면 테스트 코드가 만든 리포지토리와 서비스 안의 리포지토리가 서로 다른 객체가 된다. 생성자로 리포지토리를 받게 바꾸면 같은 것을 쓰게 된다. 리포지토리를 인터페이스로 두는 것도 구현체를 갈아끼우기 위해서다.

## 통합 테스트와 단위 테스트

통합 테스트는 스프링 컨테이너와 DB까지 연결해서 여러 계층을 함께 확인한다.

```java
@SpringBootTest
@Transactional
class MemberServiceIntegrationTest { }
```

`@SpringBootTest`가 스프링 컨테이너를 띄우고, `@Transactional`이 테스트마다 트랜잭션을 시작했다가 끝나면 항상 롤백한다. DB는 기본적으로 커밋해야 반영되므로, 커밋하기 전에 롤백해버리면 데이터가 남지 않아 다음 테스트에 영향을 주지 않는다. 테스트 코드니까 간단하고 빠른 게 낫다고 보고 `@Autowired` 필드 주입을 쓰기도 한다.

그래도 최소한의 단위로 하는 순수한 단위 테스트가 훨씬 좋은 테스트일 확률이 크다. 클래스 하나, 메서드 하나만 놓고 컨테이너 없이 도니 빠르고, 실패했을 때 어느 계층이 문제인지 찾을 일도 없다. 컨테이너 없이 테스트하려면 의존성이 밖에서 들어와야 하고 [[pojo|POJO]]여야 하니 설계도 함께 좋아진다. 스프링 컨테이너 없이 테스트할 수 있도록 훈련하는 편이 낫다.

메모리 저장소와 DB 저장소를 같은 인터페이스로 두는 이유가 여기에도 있다. 계층을 나누는 이야기는 [[service-and-repository|Service와 Repository]]에 있다.

## 관련

- [[dependency-injection|의존성 주입]]
- [[pojo|POJO]]
- [[service-and-repository|Service와 Repository]]
- [[dip|DIP]]

## 출처

- [[brain/lectures/backend/kim-spring/spring-intro/spring-basic-01|김영한 스프링 입문 - 테스트 케이스]]
- [[brain/lectures/backend/kim-spring/spring-intro/spring-basic-02|김영한 스프링 입문 - 스프링 통합테스트]]
