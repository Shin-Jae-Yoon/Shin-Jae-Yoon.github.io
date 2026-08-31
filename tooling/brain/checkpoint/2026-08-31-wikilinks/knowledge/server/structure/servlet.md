---
title: 서블릿
aliases:
  - 서블릿
  - Servlet
  - 서블릿 컨테이너
  - HttpServletRequest
tags:
  - server
  - spring
origin:
  verified: 2026-08-30
---

[[Web Server와 WAS|WAS]] 안의 웹 컨테이너에 자리 잡고 동적인 페이지를 만드는 데 쓰이는 서버 프로그램.

## 개발자가 직접 하던 부가 작업

서블릿이 없던 시절에는 요청이 들어오면 HTTP 요청 메시지를 파싱하는 것부터 여러 부가 작업을 개발자가 직접 했다. 서블릿이 그 부가 작업을 대신 맡으면서 개발자는 실질적인 비즈니스 로직에만 집중하게 되었다. `HttpServletRequest`에서 파라미터를 꺼내 쓰면 그만인 것이 그 결과다.

## 서블릿 컨테이너의 생명주기 관리

자바 진영에서는 웹 컨테이너를 서블릿 컨테이너라고도 부르고, 이것이 서블릿의 생명주기를 관리한다. `init()`으로 서블릿을 초기화하고, `service()`로 HTTP 요청 유형을 확인해 `doGet`이나 `doPost` 같은 메서드를 호출하며, `destroy()`로 서블릿을 제거한다.

## 싱글톤과 상태

서블릿 객체는 싱글톤으로 관리된다. 최초 요청 시점에 초기화해 컨테이너에 보관하고 이후에는 같은 서블릿을 공유해서 쓴다. 그래서 서블릿에 상태를 두면 안 된다. 여러 스레드가 같은 객체를 동시에 쓰기 때문이고, [[스프링 컨테이너와 빈|스프링 빈]]에 상태를 두면 안 되는 이유와 정확히 같다.

## 요청 하나가 처리되는 과정

요청 하나가 처리되는 과정은 이렇다.

```
1. 사용자가 URL을 클릭하면 HTTP 요청이 서블릿 컨테이너로 간다
2. 컨테이너가 스레드 풀에서 스레드를 꺼내 할당하고
   HttpServletRequest 와 HttpServletResponse 를 만든다
3. 요청한 URL을 분석해 어느 서블릿에 대한 요청인지 찾는다
4. 컨테이너에 없으면 초기화하고, 있으면 가져와 service() 를 호출한다
5. service() 가 끝나면 HttpServletResponse 에 응답을 담아 보낸다
```

2번에서 요청마다 스레드를 꺼내 쓴다. 스레드 풀 크기가 곧 동시에 처리할 수 있는 요청 수이고, [[CPU bound와 IO bound]]에서 다룬 판단이 그대로 적용된다.

스프링 MVC에서는 4번의 서블릿이 언제나 [[DispatcherServlet]] 하나다.

## 관련

- [[Web Server와 WAS]]
- [[DispatcherServlet]]
- [[스프링 컨테이너와 빈]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week04|면접 스터디 4주차 - Servlet, Servlet Container]]
