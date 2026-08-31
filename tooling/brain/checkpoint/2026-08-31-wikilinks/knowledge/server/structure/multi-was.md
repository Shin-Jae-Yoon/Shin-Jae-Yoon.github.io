---
title: 다중 WAS
aliases:
  - 다중 WAS
  - fail over
  - fail back
  - 무중단 운영
tags:
  - server
origin:
  verified: 2026-08-31
---

[[Web Server와 WAS|WAS]]를 여러 대 두는 구성. 앞에 웹 서버를 하나 세우고 뒤에 WAS를 늘어놓는 형태이고, 웹 서버를 앞단에 두는 이유와 그대로 이어진다.

## 여러 대로 얻는 것

로드밸런싱으로 서버 부하를 나눌 수 있다. WAS 한 대가 다 받아내던 요청을 앞단의 웹 서버가 여러 대에 뿌린다.

장애에도 대응할 수 있다. 하나의 WAS가 작동을 중지하면 다른 WAS들로 요청을 돌리는 것이 fail over이고, 중지된 서버를 다시 작동시키는 것이 fail back이다.

대용량 웹 애플리케이션처럼 서버를 여러 개 쓰는 환경에서는 Web Server와 WAS를 분리해두는 것만으로 무중단 운영을 위한 장애 극복에 쉽게 대응하게 된다. 이어지는 이야기는 [[무중단 배포]]에 있다.

서로 다른 종류의 WAS를 함께 쓸 수도 있다. 서버를 가운데 두고 한쪽 WAS에는 PHP 애플리케이션을, 다른 WAS에는 자바 애플리케이션을 붙이는 식이다.

원본은 보안도 장점으로 꼽는데, 앞단에 웹 서버를 두어 WAS를 외부에 노출하지 않는다는 [[Web Server와 WAS|같은 이야기]]다.

## 무상태라는 전제

이 구성은 서버가 [[HTTP|무상태]]라는 것을 전제한다. 서버가 클라이언트 상태를 들고 있으면 어느 서버로 가느냐에 따라 결과가 달라지므로 요청을 나눌 수 없다. [[모놀리식과 MSA|MSA]]도 [[HTTP|scale-out]]도 같은 전제 위에 선다.

## 관련

- [[Web Server와 WAS]]
- [[무중단 배포]]
- [[HTTP]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week04|면접 스터디 4주차 - 여러 대의 WAS 장점]]
- [[brain/lectures/backend/kim-spring/http/section03|김영한 HTTP 3강 - 무상태와 scale-out]]
