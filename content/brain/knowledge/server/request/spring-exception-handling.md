---
title: 스프링 예외 처리
aliases:
  - 스프링 예외 처리
  - "@ExceptionHandler"
  - "@ControllerAdvice"
  - HandlerExceptionResolver
tags:
  - server
  - spring
origin:
  verified: 2026-08-30
---

`try-catch`를 흩뿌리지 않고 예외를 한 자리에 모아 처리하도록 스프링이 마련해둔 장치들. 처리 범위를 메서드에서 컨트롤러로, 컨트롤러에서 전역으로 넓혀가는 순서로 되어 있다.

## 흩어진 try-catch가 남기는 것

자바 파일 몇 개를 다룰 때는 `try-catch`로 충분한데 서버 규모로 넘어가면 예외를 처리해야 하는 자리가 아주 많아진다. 일반 코드가 예외 처리 코드에 파묻혀 본래 목적이 흐려지고, 예외가 조용히 무시되어 개발자가 모르는 부작용이 남으면서 디버깅도 어려워진다.

## 예외가 나는 두 자리

예외가 나는 자리는 크게 둘이다. [[dispatcher-servlet|DispatcherServlet]] 안, 곧 컨트롤러와 서비스와 리포지토리에서 나는 것과 그 앞의 [[filter-and-interceptor|필터]]에서 나는 것이다. 앞쪽은 스프링 영역이라 `HandlerExceptionResolver`가 맡고, 뒤쪽은 스프링 바깥이라 장치가 닿지 않아 `doFilter()`를 `try-catch`로 감싸야 한다. 필터에서 잡는 것은 대개 모든 요청에 대한 로깅, JWT 같은 보안 작업, `ServletRequest` 커스터마이징, 데이터 압축과 문자열 인코딩이다.

## @ExceptionHandler와 @ControllerAdvice

스프링 영역 안에서는 처리 범위를 세 단계로 넓힌다. 메서드 단위의 `try-catch`가 기본이고, 규모가 커지면 위의 문제가 나온다.

컨트롤러 단위로 올리면 `@ExceptionHandler`가 컨트롤러 메서드에서 던져진 예외를 공통으로 받는다. 하위 서비스에서 체크 예외가 나도 컨트롤러 위로 던지면 여기서 잡히고, 언체크 예외는 저절로 올라오므로 서비스를 호출한 최상위 컨트롤러가 처리한다.

여러 컨트롤러에서 같은 예외가 나면 전역으로 올린다. `@ControllerAdvice`가 모든 컨트롤러의 예외를 받아 에러 페이지로 넘기고, `@RestControllerAdvice`는 여기에 `@ResponseBody`를 더한 것이라 REST API에 쓴다. 컨트롤러 안의 `@ExceptionHandler`가 먼저 잡으면 거기서 끝난다. 더 위로 예외를 던져도 `@ControllerAdvice`의 `@ExceptionHandler`까지 가지 않는다.

## HandlerExceptionResolver 셋

컨트롤러 밖으로 예외가 던져지면 `HandlerExceptionResolver`가 발동한다. DispatcherServlet 안에 등록된 셋이 순서대로 실행된다.

`ExceptionHandlerExceptionResolver`가 첫 번째이고 `@ExceptionHandler`를 담당한다. 예외가 난 컨트롤러 안에 적합한 핸들러가 있는지 보고, 없으면 `@ControllerAdvice`로 넘어가고, 거기에도 없으면 다음 Resolver로 넘긴다. 스프링 3.2의 `AnnotationMethodExceptionResolver`가 deprecated 되고 4.0부터 이것을 쓴다.

`ResponseStatusExceptionResolver`는 `@ResponseStatus`가 붙었는지 혹은 `ResponseStatusException`인지 보고, 맞으면 `ServletResponse`의 `sendError()`로 예외를 서블릿까지 전달해 `BasicErrorController`가 받게 한다. 500 하나로 뭉개지 않고 구체적인 상태값을 내려줄 수 있다. 외부 라이브러리라서 `@ResponseStatus`를 직접 붙일 수 없을 때는 `ResponseStatusException`을 쓴다.

`DefaultHandlerExceptionResolver`가 마지막이다. 스프링 내부 예외를 상황에 맞는 응답 코드로 바꿔준다. 컨트롤러를 찾지 못하면 404, 컨트롤러 메서드 실행 중 예외가 나면 500, 파라미터 형식이 잘못되었으면 400이다. 셋 중 어느 것도 처리하지 못하면 예외가 서블릿까지 전달되고 스프링 부트의 자동 설정에 따라 `BasicErrorController`로 다시 넘어간다.

## 관련

- [[exception-strategy|예외 처리 전략]]
- [[filter-and-interceptor|Filter와 Interceptor]]
- [[dispatcher-servlet|DispatcherServlet]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week02|면접 스터디 2주차 - Spring에서는?]]
