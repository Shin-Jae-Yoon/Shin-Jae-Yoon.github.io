---
title: Spring MVC
aliases:
  - Spring MVC
  - 정적 컨텐츠
  - 템플릿 엔진
  - "@RestController"
tags:
  - server
  - spring
origin:
  verified: 2026-08-30
---

[[MVC 패턴]]을 스프링에서 구현한 것. 웹을 개발한다는 것은 스프링에서 세 가지 응답 방식 가운데 하나를 고르는 일이고, 이 셋의 차이를 아는 것이 시작이다.

## 컨트롤러, 모델, 뷰

사용자 요청은 전부 컨트롤러로 간다. 컨트롤러가 모델을 쓰고, 모델이 비즈니스 로직을 수행하고, 컨트롤러가 보여줄 뷰를 고른다. 뷰가 화면을 그릴 때 필요한 데이터는 컨트롤러를 거쳐 전달받는다.

## 경로를 찾는 우선순위

경로를 찾는 순서에는 우선순위가 있다. 내장 톰캣이 요청을 받아 스프링에 넘기면 스프링은 먼저 그 경로와 매핑된 컨트롤러가 있는지 본다. 없을 때에야 `resources/static`에서 정적 파일을 찾는다. 같은 경로에 정적 파일과 컨트롤러가 함께 있으면 컨트롤러가 이긴다.

```
요청 → DispatcherServlet → Handler Mapping → Controller
     → (Model, View 이름) → View Resolver → 템플릿 → 응답
     또는 (@ResponseBody) → HttpMessageConverter → JSON → 응답
```

앞단의 [[DispatcherServlet]]이 이 흐름을 통제한다.

## 정적 컨텐츠

파일을 그대로 내려준다. `resources/static`에 `hello-static.html`을 만들어두고 `localhost:8080/hello-static.html`로 들어가면 그 파일이 그대로 나온다. 서버가 하는 일이 없고 컨트롤러도 거치지 않는다.

## MVC와 템플릿 엔진

컨트롤러가 모델에 데이터를 담고 뷰 이름을 반환하면, 뷰 리졸버가 그 이름에 맞는 템플릿을 찾아 템플릿 엔진에 넘긴다. 엔진이 데이터를 채워 HTML로 렌더링한 결과가 브라우저로 간다. 서버에서 HTML을 완성해 보내는 방식이다.

```java
@GetMapping("hello-mvc")
public String helloMvc(@RequestParam("name") String name, Model model) {
    model.addAttribute("name", name);
    return "hello-template";     // templates/hello-template.html 을 찾는다
}
```

```html
<p th:text="'hello ' + ${name}">hello! empty</p>
```

타임리프에서 `$` 안에 들어가는 것은 모델에서 뽑아온 키의 값이다. `@RequestParam`은 `required`가 기본으로 `true`라서 `localhost:8080/hello-mvc`처럼 파라미터를 빼먹으면 요청이 거절된다. 템플릿 파일을 서버 없이 브라우저로 열어 껍데기를 확인할 수 있다는 것이 타임리프의 장점이다.

## API

`@ResponseBody`를 붙이면 뷰를 찾지 않고 반환값을 HTTP 응답 바디에 그대로 넣는다. 여기서 body는 HTML의 `<body>`가 아니라 HTTP 메시지의 바디부다.

```java
@GetMapping("hello-api")
@ResponseBody
public Hello helloApi(@RequestParam("name") String name) {
    Hello hello = new Hello();
    hello.setName(name);
    return hello;
}
```

문자열을 반환하면 그 문자가 그대로 나가고, 객체를 반환하면 `HttpMessageConverter`가 JSON으로 바꿔 내보낸다. `@RestController`는 `@Controller`와 `@ResponseBody`를 합친 것이라 REST API를 만들 때 쓴다.

## 관련

- [[MVC 패턴]]
- [[DispatcherServlet]]
- [[레이어드 아키텍처]]
- [[DAO, DTO, VO]]

## 출처

- [[brain/lectures/backend/kim-spring/spring-intro/spring-basic-01|김영한 스프링 입문 - 스프링 웹 개발 기초]]
- [[brain/notes/Interview/dog-study/dog-week05|면접 스터디 5주차 - Spring MVC]]
