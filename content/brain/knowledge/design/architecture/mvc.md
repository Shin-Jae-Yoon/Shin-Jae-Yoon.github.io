---
title: MVC 패턴
aliases:
  - MVC 패턴
  - 모델1
  - 모델2
tags:
  - design
  - java
origin:
  verified: 2026-08-30
---

웹 애플리케이션을 Model, View, Controller 세 역할로 나누는 개발 방법론. 목적은 [[cohesion-and-coupling|모듈 간 결합도를 낮추고 응집도를 높이는 것]]이다.

## 모델1과 모델2

모델1은 JSP 하나에 화면과 로직이 함께 있는 구조다. 단순하다는 것이 유일한 장점이고, 출력 코드와 로직이 섞여 JSP가 복잡해진다. 프론트와 백엔드가 뒤엉켜 분업이 안 되고 유지보수도 어렵다.

모델2가 곧 MVC 패턴이다. 서블릿이 Controller, JSP가 View, JavaBean이 Model을 맡는다. 뷰와 로직이 분리되어 덜 복잡하고 분업과 유지보수가 쉬워지는 대신, 배우기 어렵고 작업량이 는다.

## 세 역할과 도메인

Controller는 요청을 받아 Model과 View를 오가며 적절한 응답을 만드는 중계자다. Model은 시스템이 다루는 도메인으로 값과 기능을 가진 객체이고, View는 사용자에게 보여줄 화면이다.

Model이 곧 도메인인데, 도메인은 화면과 UI와 기술 인프라를 뺀 나머지, 시스템이 구현해야 할 핵심 업무 영역이다. 그래서 컨트롤러는 도메인이 아니다. 엔티티와 리포지토리가 도메인이다. 이 구분이 나중에 [[layered-architecture|레이어드 아키텍처]]와 [[ddd|DDD]]로 이어진다.

## 요청이 도는 순서

흐름은 이렇게 돈다.

1. 사용자의 모든 요청이 Controller로 간다
2. Controller가 Model을 부르고, Model이 비즈니스 로직을 수행한다
3. Controller가 보여줄 View를 고른다
4. View가 결과 화면을 만든다. 보여줄 데이터는 Controller를 통해 전달받는다

View가 Model을 직접 부르지 않는다는 것이 중요하다. 데이터는 언제나 Controller를 거친다.

## Model을 다시 나누는 이유

서비스가 커지면 컨트롤러와 모델만으로는 부족해진다. 요청을 받는 일과 비즈니스 규칙을 수행하는 일과 데이터를 꺼내는 일이 뒤섞이기 시작한다. Model 쪽을 다시 나눈 것이 [[layered-architecture|레이어드 아키텍처]]다.

## 관련

- [[layered-architecture|레이어드 아키텍처]]
- [[design-pattern|디자인 패턴]]
- [[spring-mvc|Spring MVC]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week05|면접 스터디 5주차 - Spring MVC]]
- [[brain/lectures/backend/kim-spring/spring-intro/spring-basic-01|김영한 스프링 입문 - MVC와 템플릿 엔진]]
