---
title: URI
aliases:
  - URL
  - URN
  - Uniform Resource Identifier
tags:
  - network
origin:
  verified: 2026-08-30
---

리소스를 식별하는 통합된 방법. 사람을 주민등록번호로 식별하듯, 자원이 어디에 있는지 또는 자원 자체를 무엇이라 부르는지를 정하는 방식이다.

단어 그대로 풀면 Uniform은 리소스를 식별하는 통일된 방식, Resource는 URI로 식별할 수 있는 모든 것, Identifier는 다른 것과 구분하는 데 필요한 정보다. 자원 쪽에는 아무 제한이 없다.

## 스킴부터 프래그먼트까지

URL은 이런 모양이다.

```
scheme://[userinfo@]host[:port][/path][?query][#fragment]
https://www.google.com:443/search?q=hello&hl=ko
```

scheme에는 주로 프로토콜이 온다. 프로토콜은 어떤 방식으로 자원에 접근할지에 관한 약속이고 http, https, ftp 같은 것들이다. https는 http에 보안을 더한 것이다.

host는 호스트명이라 도메인을 쓰거나 IP를 직접 적는다. port는 접속 포트인데 대개 생략한다. 스킴마다 기본값이 정해져 있어서 http는 80, https는 443으로 붙기 때문이다.

path는 리소스가 있는 경로이고 `/members/100`이나 `/items/iphone12`처럼 계층적으로 쓴다. query는 `?`로 시작해 `key=value`를 `&`로 이어 붙인 것이고 쿼리 파라미터나 쿼리 스트링이라고 부른다. 서버에 넘기는 문자 형태의 파라미터다.

나머지 둘은 자리만 알아두면 된다. userinfo는 URL에 사용자 정보를 담아 인증하는 자리인데 거의 쓰지 않는다. fragment는 `#getting-started` 같은 문서 내부 북마크에 쓰이고 서버로 전송되지 않는다.

## URL과 URN

URI가 가장 넓은 개념이고 그 아래에 로케이터와 이름이 있다. URL은 리소스가 있는 위치를 지정하고, URN은 리소스에 이름을 부여한다. 어떤 책의 ISBN을 가리키는 `urn:isbn:8960777331`이 URN이다.

위치는 변할 수 있지만 이름은 변하지 않는다. 그런데 URN 이름만으로 실제 리소스를 찾는 방법이 보편화되지 않아서, 실무에서는 URI를 URL과 같은 뜻으로 쓴다.

## 리소스만 남기는 설계

URI가 할 일은 리소스를 식별하는 것뿐이다. 회원 관리 API를 만들 때 이렇게 설계하기 쉬운데 좋지 않다.

```
/read-member-list
/read-member-by-id
/create-member
/update-member
/delete-member
```

리소스가 무엇인지를 정확히 짚어야 한다. 회원을 등록하고 조회하는 것이 리소스가 아니라 "회원"이라는 개념 자체가 리소스다. 미네랄을 캐라고 하면 미네랄이 리소스인 것과 같다. 그래서 조회, 등록, 수정, 삭제를 전부 빼고 회원만 남긴다.

```
/members        회원 목록
/members/{id}   특정 회원
```

계층 구조상 상위는 컬렉션으로 보므로 복수형을 쓴다. `member`가 아니라 `members`다. 그러면 조회와 등록을 무엇으로 구분하느냐는 물음이 남는데, 그 자리를 [[http-method|HTTP 메서드]]가 맡는다. 리소스는 명사, 행위는 동사다.

## 관련

- [[http-method|HTTP 메서드]]
- [[http|HTTP]]
- [[port-and-dns|포트와 DNS]]

## 출처

- [[brain/lectures/backend/kim-spring/http/section02|김영한 HTTP 2강 - URI]]
- [[brain/lectures/backend/kim-spring/http/section04|김영한 HTTP 4강 - API URI 설계]]
