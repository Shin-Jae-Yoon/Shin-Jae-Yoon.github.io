---
title: DispatcherServlet
aliases:
  - DispatcherServlet
  - 디스패처 서블릿
  - 프론트 컨트롤러
  - Handler Mapping
tags:
  - server
  - spring
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

모든 요청을 가장 먼저 받는 단 하나의 [[서블릿]]. 스프링 MVC의 입구이고, 요청을 받아 알맞은 컨트롤러에 나눠준다.

## URL마다 서블릿을 만들던 시절

스프링 웹 MVC가 없던 시절에는 URL마다 서블릿이 하나씩 필요했다. GET 하나만 쓰고 싶어도 서블릿 전체를 만들었고, 만들 때마다 `web.xml`에 매핑을 등록했다.

DispatcherServlet이 나오면서 서블릿은 이것 하나로 족해졌다. 뷰가 강제로 분리되는 효과도 함께 따라왔다.

## 요청이 지나는 순서

```
1. 클라이언트 요청을 DispatcherServlet이 받는다
2. Handler Mapping    요청 정보로 위임할 컨트롤러를 찾는다
3. Handler Adapter    컨트롤러에 요청을 위임할 어댑터를 찾아 전달한다
4. 어댑터가 컨트롤러로 요청을 위임한다
5. Service와 Repository를 거쳐 비즈니스 로직이 처리된다
6. 컨트롤러가 반환값을 돌려준다
7. 어댑터가 반환값을 처리한다
8. 응답이 클라이언트로 나간다
```

## 참고

이 구조에는 프론트 컨트롤러 패턴이라는 이름이 있다. 스프링 레퍼런스는 "스프링 MVC는 다른 여러 웹 프레임워크가 그렇듯 프론트 컨트롤러 패턴을 중심으로 설계되어, 가운데의 서블릿 하나인 `DispatcherServlet`이 요청 처리의 공통 알고리즘을 제공하고 실제 일은 갈아끼울 수 있는 위임 구성 요소가 맡는다"고 적는다. 요청 매핑과 뷰 결정, 예외 처리를 컨트롤러마다 쓰지 않고 한 자리에 모을 수 있는 것이 그 공통 알고리즘이다. [Spring Framework Reference - DispatcherServlet](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet.html)

3번의 Handler Adapter가 따로 있는 까닭은 컨트롤러의 형태가 여럿이기 때문이다. 원본은 순서에 이름만 적어두었는데, 스프링 레퍼런스는 이 자리를 "핸들러가 실제로 어떻게 호출되는지와 무관하게 `DispatcherServlet`이 요청에 매핑된 핸들러를 호출하도록 돕는다. 애노테이션이 붙은 컨트롤러를 호출하려면 애노테이션을 해석해야 하는데, `HandlerAdapter`의 주된 목적은 그런 세부를 `DispatcherServlet`으로부터 가리는 것"이라고 설명한다. 새로운 방식이 추가되어도 DispatcherServlet은 그대로 둔다. [Spring Framework Reference - Special Bean Types](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/special-bean-types.html)

## 관련

- [[서블릿]]
- [[Filter와 Interceptor]]
- [[Spring MVC]]
- [[MVC 패턴]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week04|면접 스터디 4주차 - Dispatcher Servlet]]
