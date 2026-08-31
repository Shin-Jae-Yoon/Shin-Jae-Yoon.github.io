---
title: Filter와 Interceptor
aliases:
  - Filter와 Interceptor
  - Filter
  - Interceptor
  - doFilter
  - preHandle
tags:
  - server
  - spring
origin:
  verified: 2026-08-30
---

요청 앞뒤로 공통 작업을 끼워 넣는 두 가지 수단. 도는 위치가 다르고, 그 차이에서 나머지가 전부 따라 나온다.

## 도는 위치

필터는 [[dispatcher-servlet|DispatcherServlet]] 전후를, 인터셉터는 컨트롤러 전후를 감싼다. 필터가 바깥이고 인터셉터가 안쪽이다.

```
서버 시작
  → Filter.init()
    → Filter.doFilter()  (전)
      → DispatcherServlet
        → Interceptor.preHandle()
          → Controller
        → Interceptor.postHandle()
        → 뷰 렌더링
        → Interceptor.afterCompletion()
    → Filter.doFilter()  (후)
서버 종료 → Filter.destroy()
```

## 필터의 세 메서드

필터의 `init()`은 웹 컨테이너가 한 번 불러 필터 객체를 초기화하고, 이후 요청은 전부 `doFilter()`가 전후로 처리한다. `doFilter()`는 파라미터로 받은 `FilterChain`의 `doFilter()`를 불러 다음 대상으로 요청을 넘긴다. `destroy()`도 한 번만 불려 쓰던 자원을 반환한다.

## 인터셉터의 세 메서드

인터셉터의 세 메서드는 역할이 갈린다. `preHandle()`은 컨트롤러 전에 실행되어 전처리를 하거나 요청 정보를 가공하고, 반환 타입이 `boolean`이라 `false`를 돌려주면 컨트롤러와 남은 인터셉터가 실행되지 않는다. `postHandle()`은 핸들러 실행이 끝났지만 뷰가 만들어지기 전에 불리고, 보통 `ModelAndView`를 받아 컨트롤러가 뷰에 넘기려고 담아둔 값을 참조하거나 조작한다. `afterCompletion()`은 뷰까지 최종 결과를 다 만든 뒤에 불려서 요청 처리에 쓴 리소스를 반환하기 좋다. 다만 React나 Vue 같은 SPA가 늘고 뷰 대신 JSON을 내려주는 REST 컨트롤러를 쓰면서 요즘은 잘 쓰지 않는다.

## 관리 주체의 차이

필터는 톰캣 같은 웹 컨테이너가 관리하고 스프링 컨텍스트 바깥에서 돈다. 그래서 스프링과 무관한 자원에도 동작하는 대신 스프링이 제공하는 장치를 쓰기 어렵다. 인터셉터는 스프링 컨테이너가 관리하므로 반대다.

## 요청과 응답을 바꿀 수 있는 범위

요청과 응답을 조작할 수 있는 범위도 다르다. 필터는 `ServletRequest` 자체를 커스터마이징할 수 있고, 인터셉터는 `HttpServletRequest`와 `HttpServletResponse`를 제공받기만 하므로 객체 자체를 바꿔치기하지 못한다. 내부 값을 바꾸는 것은 인터셉터도 된다.

## 예외 처리가 닿는 곳

예외 처리에서 갈리는 것도 위치 때문이다. 인터셉터는 스프링 컨텍스트 안이라 `@ControllerAdvice`와 `@ExceptionHandler`로 예외를 처리할 수 있고, 필터는 그 장치가 닿지 않아 `doFilter()` 주변을 `try-catch`로 직접 감싼다. 자세한 내용은 [[spring-exception-handling|스프링 예외 처리]]에 있다.

## 각자 맡는 자리

쓰는 자리도 그대로 따라온다. 보안 관련 공통 작업, 이미지나 데이터 압축과 문자열 인코딩, 모든 요청에 대한 로깅, `ServletRequest` 커스터마이징은 필터의 몫이다. 인증과 인가, 컨트롤러로 넘겨줄 정보의 가공, API 호출 로깅은 인터셉터의 몫이다. 요청 자체를 바꿔야 하면 필터, 스프링의 것을 써야 하면 인터셉터로 보면 대체로 맞다.

## 필터, 인터셉터, AOP의 층

[[aop-basics|AOP]]까지 셋을 나란히 놓으면 층이 다르다. 필터는 서블릿 층, 인터셉터는 스프링 MVC 층, AOP는 메서드 층이다. 인터셉터와 AOP를 가르는 실질적인 기준은 [[spring-aop-vs-aspectj|파라미터]]다.

## 관련

- [[dispatcher-servlet|DispatcherServlet]]
- [[aop-basics|AOP]]
- [[spring-exception-handling|스프링 예외 처리]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week04|면접 스터디 4주차 - Filter, Interceptor]]
