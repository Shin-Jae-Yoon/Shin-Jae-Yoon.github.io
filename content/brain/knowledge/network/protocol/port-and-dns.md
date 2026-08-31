---
title: 포트와 DNS
aliases:
  - 포트와 DNS
  - 포트
  - PORT
  - DNS
  - 도메인 이름
tags:
  - network
origin:
  verified: 2026-08-30
---

[[ip|IP]]가 못 하는 두 가지를 각각 맡는 장치. 포트는 같은 IP 안에서 프로세스를 구분하고, DNS는 외우기 힘든 주소를 사람이 읽을 수 있는 이름으로 바꾼다. 포트가 소켓 주소의 한쪽이라 설명은 [[brain/knowledge/network/protocol/socket|소켓 프로그래밍]]에 몰아두었고, 여기서는 DNS를 다룬다.

## 이름을 하나 끼워 넣기

IP 주소는 두 가지가 불편하다. 기억하기 어렵고, 바뀔 수 있다.

DNS는 전화번호부 같은 서버를 중간에 두고 도메인 이름을 IP 주소로 바꿔준다. `https://www.naver.com`에서 `www.naver.com`이 그 도메인 주소다. 서버를 옮겨 IP가 바뀌어도 도메인은 그대로이므로 쓰는 쪽은 아무것도 몰라도 된다.

바뀌는 것과 바뀌지 않는 것 사이에 이름을 하나 끼워 넣은 구조이고, [[psa|PSA]]나 [[brain/knowledge/os/architecture/isa|ISA]]도 층위만 다를 뿐 같은 모양이다.

## nslookup과 nameserver

도메인에 해당하는 IP는 `nslookup`으로 직접 확인할 수 있다.

```
nslookup www.google.com
```

어느 서버에 물어볼지는 맥과 리눅스에서 `/etc/resolv.conf`에 적어둔다.

```
nameserver 8.8.8.8
nameserver 8.8.4.4
```

보통 nameserver를 두 개 쓰는데, 하나가 죽었을 때 다른 것으로 넘어가기 위해서다.

## 도메인 하나에 IP 여럿

하나의 도메인이 여러 IP에 매핑되어 있을 수도 있다. 자바의 `InetAddress.getAllByName`이 배열을 돌려주는 것도 그래서다.

## 관련

- [[ip|IP]]
- [[brain/knowledge/network/protocol/socket|소켓 프로그래밍]]
- [[uri|URI]]

## 출처

- [[brain/lectures/backend/kim-spring/http/section01|김영한 HTTP 1강 - PORT, DNS]]
- [[brain/lectures/pl/fun-java/fun-java11|재미있는 자바 11강 - DNS 설정]]
