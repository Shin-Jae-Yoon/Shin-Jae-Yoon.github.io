---
title: 컴포넌트 스캔
aliases:
  - 컴포넌트 스캔
  - Component Scan
  - "@Component"
  - "@Autowired"
  - 자바 코드로 빈 등록
tags:
  - server
  - spring
origin:
  verified: 2026-08-30
---

빈을 등록하는 두 가지 방법 중 하나. 애노테이션이 붙은 클래스를 스프링이 찾아 컨테이너에 넣고 의존관계까지 맞춰준다.

## 직접 new로 만들 때

컨트롤러가 서비스를 직접 만들어 쓸 수도 있다.

```java
private final MemberService memberService = new MemberService();
```

이래도 동작은 한다. 그런데 `MemberService`의 기능은 인스턴스 하나를 만들어두고 돌려 쓰면 되는 것이라, 컨트롤러마다 새로 만들면 메모리만 낭비된다. 빈으로 등록해두면 싱글톤으로 딱 하나만 생긴다. 구현체를 바꿀 때 생성하는 쪽까지 함께 고쳐야 하는 문제도 [[스프링 컨테이너와 빈|앞서 본 대로]] 남아 있다.

## 애노테이션과 생성자 주입

```java
@Controller
public class MemberController {
    private final MemberService memberService;

    @Autowired
    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }
}
```

`@Controller`가 붙어 있으면 기능이 없는 빈 클래스라도 스프링이 객체로 만들어 컨테이너에 넣고 관리한다. 이것을 스프링 컨테이너에서 스프링 빈이 관리된다고 한다. `@Autowired`가 붙은 생성자에는 컨테이너에 있는 빈을 찾아 넣어준다. 이 주입은 스프링이 관리하는 객체에서만 동작하고, 내가 직접 `new`로 만든 객체에서는 동작하지 않는다.

## 계층별 애노테이션

계층별 애노테이션은 전부 `@Component`를 품고 있다. 프레젠테이션에는 `@Controller`, 비즈니스에는 `@Service`, 영속성에는 `@Repository`를 쓰고 그 밖에는 `@Component`를 쓴다. 하는 일은 같고 역할을 드러내려고 이름만 다르게 둔 것이다.

## @Configuration과 @Bean

`@Configuration` 클래스에서 `@Bean`으로 직접 등록하는 방법도 있다.

```java
@Configuration
public class SpringConfig {
    @Bean
    public MemberService memberService() {
        return new MemberService(memberRepository());
    }

    @Bean
    public MemberRepository memberRepository() {
        return new MemoryMemberRepository();
    }
}
```

메모리 저장소를 나중에 다른 리포지토리로 바꿀 생각이라면 이쪽이 낫다. 다형성 덕분에 코드는 하나도 안 바꾸고 `return`만 바꾸면 된다. 외부 라이브러리 클래스를 빈으로 올릴 때도 마찬가지인데, 남의 코드에 애노테이션을 붙일 수는 없기 때문이다. XML로 설정하는 방식도 있지만 요즘은 잘 쓰지 않는다.

## 둘을 나누는 기준

정형적인 컨트롤러, 서비스, 리포지토리는 컴포넌트 스캔으로 두고, 정형화되지 않았거나 상황에 따라 구현 클래스를 바꿔야 하면 설정으로 등록하는 것이 실무의 갈래다.

## 관련

- [[스프링 컨테이너와 빈]]
- [[의존성 주입]]
- [[빈 스코프]]

## 출처

- [[brain/lectures/backend/kim-spring/spring-intro/spring-basic-02|김영한 스프링 입문 - 컴포넌트 스캔, 자바 코드로 빈 등록]]
