---
title: HTTP 메시지
aliases:
  - HTTP 메시지
  - request-line
  - status-line
  - HTTP 헤더
  - 상태 코드
tags:
  - network
origin:
  verified: 2026-08-30
  scouted: 2026-08-30
---

[[HTTP]]가 주고받는 데이터의 형식. 요청이든 응답이든 구조가 같다. 시작 라인, 헤더, 공백 라인, 메시지 바디 순으로 놓인다. 공백 라인인 CRLF는 반드시 있어야 한다. 헤더가 끝났다는 표시이기 때문이다.

## 요청 라인과 상태 라인

시작 라인은 요청이냐 응답이냐에 따라 다르다. 요청 쪽은 요청 라인이라 부르고 [[HTTP 메서드]]와 요청 대상과 HTTP 버전을 공백으로 이어 쓴다.

```
method SP request-target SP HTTP-version CRLF
```

```http
GET /search?q=hello&hl=ko HTTP/1.1
Host: www.google.com
```

요청 대상은 `/`로 시작하는 절대경로에 쿼리가 붙은 모양이다.

응답 쪽은 상태 라인이고 HTTP 버전과 상태 코드와 사유 문구가 온다. 사유 문구는 사람이 읽으라고 붙인 짧은 설명이다.

```
HTTP-version SP status-code SP reason-phrase CRLF
```

```http
HTTP/1.1 200 OK
Content-Type: text/html;charset=UTF-8
```

상태 코드가 요청의 성공과 실패를 나타낸다. 200이 성공, 400이 클라이언트 요청 오류, 500이 서버 내부 오류다.

## 헤더

헤더는 `field-name: field-value` 형식이다. 콜론 앞에는 공백을 두지 않고 뒤에는 두어도 되고 안 두어도 된다. 필드 이름은 대소문자를 구분하지 않지만 값은 값이므로 구분한다.

HTTP 전송에 필요한 모든 부가 정보가 헤더에 들어간다. 메시지 바디의 내용과 크기, 압축, 인증, 요청한 브라우저 정보, 서버 애플리케이션 정보, 캐시 관리 정보 같은 것들이다. 표준 헤더가 이미 아주 많지만 `helloworld: hihi`처럼 임의의 헤더를 추가할 수도 있다.

## 바디에 담기는 것

메시지 바디에는 실제로 전송할 데이터가 담긴다. HTML 문서, 이미지, 영상, JSON까지 바이트로 표현할 수 있는 모든 것이 들어간다.

## 참고

상태 코드는 첫 자리로 성격이 갈린다. 2xx가 성공, 3xx가 리다이렉션, 4xx가 클라이언트 오류, 5xx가 서버 오류다. 4xx와 5xx의 구분이 실무에서 중요하다. 4xx는 요청 자체가 잘못된 것이라 같은 요청을 다시 보내도 실패하지만, 5xx는 서버 쪽 사정이라 서버가 고쳐지면 성공할 수 있다. 원본 강의는 200, 400, 500 셋만 언급하고 분류까지 다루지 않았다. [RFC 9110, Status Codes](https://www.rfc-editor.org/rfc/rfc9110.html#name-status-codes)

## 관련

- [[HTTP]]
- [[HTTP 메서드]]
- [[URI]]

## 출처

- [[brain/lectures/backend/kim-spring/http/section03|김영한 HTTP 3강 - HTTP 메시지]]
