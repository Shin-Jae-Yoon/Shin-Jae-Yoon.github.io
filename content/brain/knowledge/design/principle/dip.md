---
title: DIP
aliases:
  - 의존관계 역전 원칙
  - Dependency Inversion Principle
tags:
  - design
  - spring
origin:
  verified: 2026-08-30
---

상위 모듈은 하위 모듈에 의존하지 않고 둘 다 추상화에 의존해야 한다는 원칙. [[solid|SOLID]]의 마지막이고 실무에서 가장 자주 이야기된다. 클래스 사이의 결합을 느슨하게 해서, 한 클래스가 바뀔 때 다른 클래스가 받는 영향을 줄이는 것이 목적이다.

## 화살표의 방향이 바뀌는 곳

`UserService`가 `KakaoLogin`을 직접 쓴다고 하자. 화살표가 위에서 아래로 향한다.

```
UserService ──> KakaoLogin
```

구글 로그인이 추가되면 `GoogleLogin` 클래스를 만들고 `UserService`도 고쳐야 한다. 상위 모듈이 하위 모듈에 묶여 있기 때문이다.

`Login` 인터페이스를 두면 그림이 바뀐다.

```
UserService ──> Login <── KakaoLogin
                      <── GoogleLogin
```

하위 모듈 쪽 화살표 방향이 뒤집힌다. 이것이 역전이다. 이제 상위도 하위도 모두 추상에 의존하고, 구현을 추가해도 `UserService`는 그대로다.

## 주입만으로 모자란 것

[[dependency-injection|의존성 주입]]으로 밖에서 받는 것만으로는 여기까지 오지 못한다. 받는 타입이 구체 클래스면 여전히 묶여 있기 때문이다.

```java
A(KakaoLogin login)   // 주입은 받았지만 카카오뿐
A(Login login)        // 이제야 갈아끼울 수 있다
```

DI는 수단이고 DIP는 목적이다. 추상에 의존하지 않은 채 주입만 하는 것은 절반만 한 셈이다.

스프링에서는 `@Autowired`로 인터페이스 타입을 받고 컨테이너가 구현체를 넣어준다. 어떤 구현체를 넣을지가 코드 밖의 설정으로 빠지는 것이 DIP를 실현하는 방식이다.

## 관련

- [[dependency-injection|의존성 주입]]
- [[ioc|제어의 역전]]
- [[solid|SOLID]]
- [[polymorphism|다형성]]

## 출처

- [[brain/notes/DevCourse/003|데브코스 회고 3편 - DIP]]
- [[brain/notes/Interview/dog-study/dog-week03|면접 스터디 3주차 - DIP]]
