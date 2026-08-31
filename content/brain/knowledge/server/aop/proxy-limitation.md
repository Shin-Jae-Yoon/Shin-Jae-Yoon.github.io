---
title: 프록시의 한계
aliases:
  - 프록시의 한계
  - 자기 호출
  - self-invocation
  - AOP 적용 안 되는 경우
tags:
  - server
  - spring
origin:
  verified: 2026-08-31
  scouted: 2026-08-30
---

같은 객체 안에서 자기 메서드를 부르면 [[aop-basics|AOP]]가 걸리지 않는다. 스프링 AOP가 프록시로 동작하기 때문에 생기는 제약이고, 모르면 한참을 헤맨다.

## 프록시를 건너뛰는 자기 호출

스프링은 `AuthService`를 프록시로 감싸서 빈으로 등록한다. 컨트롤러가 손에 쥐는 것은 실제 객체가 아니라 그 프록시다.

```
Controller → [AuthService 프록시] → AuthService (실제 객체)
```

```java
public void join(AuthService authService) {
    inner();                                    // AOP가 걸리지 않는다
    memberRepository.save(authService.toMember());
}

@PerformanceCheck
public void inner() {
    System.out.println("여기인가");
}
```

컨트롤러가 `join()`을 부르면 프록시를 거치므로 프록시가 부가 기능을 끼워 넣을 수 있다. 그런데 `join()` 안에서 `inner()`를 부르는 것은 실제 객체가 자기 자신을 부르는 일이라 프록시를 거치지 않는다. `inner()`에 붙여둔 `@PerformanceCheck`는 불리지 않는다.

## 오버라이딩할 수 없는 메서드

프록시는 메서드 오버라이딩 개념으로 동작한다. `private` 메서드에 애초에 AOP를 적용할 수 없는 것도, `static`이나 `final`이 붙은 메서드에 적용되지 않는 것도 같은 이유다. 오버라이딩할 수 없는 자리에는 프록시가 끼어들 방법이 없다.

## @Transactional이 안 걸리는 자리

`@Transactional`이 대표적인 피해자다. 트랜잭션도 AOP로 걸리므로 같은 클래스 안에서 부르면 트랜잭션이 시작되지 않는다.

```java
@Service
public class MemberService {
    // 트랜잭션이 걸리지 않는다
    public void memberInserts(List<Member> members) {
        members.forEach(it -> this.memberInsert(it));
    }

    @Transactional
    public void memberInsert(Member member) { ... }
}
```

스프링은 `@Transactional`이 붙은 메서드 앞에 트랜잭션을 여는 코드를, 뒤에 커밋하는 코드를 끼워 넣는다. 그 코드는 프록시가 제공하는 메서드를 써야만 동작한다. 변경 감지도 커밋 시점에 일어나므로 함께 안 먹는다. 코드는 멀쩡한데 롤백이 안 되는 상황이 여기서 나온다.

## 빈을 나누는 해법

피하는 방법은 프록시를 거치게 만드는 것으로 모인다. 메서드를 다른 빈으로 분리하는 편이 가장 깔끔하고, 위의 예에서라면 컨트롤러가 `memberInsert()`를 직접 부르도록 구조를 바꿔도 된다.

대개는 빈을 나눈다. 이 제약이 있다는 것 자체가 그 메서드가 다른 책임 아닌지를 묻게 해준다.

## 참고

자기 자신을 주입받아 그 참조로 호출하면 프록시를 거치므로 동작은 한다. 다만 이것은 빈이 자기를 참조하는 순환 참조이고, 스프링 레퍼런스는 순환 참조를 두고 "권장하지는 않지만 세터 주입으로는 순환 의존을 구성할 수 있다"고 적는다. 생성자 주입으로 순환이 생기면 컨테이너가 런타임에 `BeanCurrentlyInCreationException`을 던진다. [Spring Framework Reference - Circular Dependencies](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html)

원본의 예제는 `inner()`를 `private`으로 두었다. 그런데 `private` 메서드에는 애초에 AOP가 적용되지 않으므로, 그 예제로는 자기 호출 때문에 AOP가 안 걸린다는 것을 보일 수 없다. 두 원인이 겹쳐 있어 무엇 때문인지 갈라내지 못한다. 자기 호출만 남기려면 `inner()`가 `public`이어야 한다. [Spring Framework Reference - Understanding AOP Proxies](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)

## 관련

- [[aop-basics|AOP]]
- [[spring-aop-vs-aspectj|Spring AOP와 AspectJ]]
- [[declarative-transaction|선언적 트랜잭션]]
- [[transactional-attributes|@Transactional 속성]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week04|면접 스터디 4주차 - AOP 적용 안되는 경우]]
- [[brain/notes/Interview/dog-study/dog-week07|면접 스터디 7주차 - 선언적 트랜잭션 문제점]]
