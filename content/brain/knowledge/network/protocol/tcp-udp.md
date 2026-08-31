---
title: TCP와 UDP
aliases:
  - TCP와 UDP
  - TCP
  - UDP
  - 3 way handshake
tags:
  - network
origin:
  verified: 2026-08-30
---

[[ip|IP]]의 한계를 메우는 전송 계층 프로토콜 둘. 하나는 웬만한 것을 다 해주고 다른 하나는 거의 아무것도 해주지 않는다.

## TCP

연결 지향적이고 신뢰할 수 있다. 현재 대부분의 통신이 이것을 쓴다. 통신을 시작하기 전에 3-way handshake로 가상 연결을 맺는다.

```
클라이언트 → SYN     (접속 요청)
서버       → SYN/ACK (요청 수락)
클라이언트 → ACK     (확인, 이때 데이터도 함께 보낼 수 있다)
```

물리적으로 선을 잇는 것이 아니라 서로 이제 통신하자고 합의하는 논리적, 개념적 연결이다.

그 위에서 두 가지를 보장한다. 데이터를 받았는지 확인하고 안 왔으면 다시 보내는 전달 보증, 그리고 순서가 어긋나면 바로잡는 순서 보장이다. [[ip|IP]]의 비연결성과 비신뢰성이 여기서 해결된다.

## UDP

하얀 도화지에 가깝다. 3-way handshake가 없고, 데이터 전달을 보증하지 않으며, 순서도 보장하지 않는다. IP에 [[brain/knowledge/network/protocol/socket|포트]]와 체크섬 정도를 더한 것이고 나머지는 애플리케이션이 알아서 해야 한다.

## 비어 있어서 얻는 것

기능이 없는 것이 오히려 장점이 되는 자리가 있다. TCP는 튜닝하기 어렵다. 3-way handshake에 시간이 걸리고, 헤더 때문에 데이터 양이 늘고, 이미 인터넷 전체가 TCP 기반으로 깔려 있어 근본적으로 손대기 어렵다. UDP는 비어 있으니 필요한 기능만 애플리케이션 레벨에서 만들어 넣을 수 있다.

[[http|HTTP]]/3가 UDP를 쓰는 이유가 여기 있다. SYN, SYN/ACK, ACK 과정까지 줄여 최적화하려고 TCP 대신 UDP 위에 새로 쌓았다. 실시간 스트리밍이나 게임처럼 약간의 손실보다 지연이 더 아픈 경우에도 UDP가 맞다.

## 관련

- [[ip|IP]]
- [[http|HTTP]]
- [[brain/knowledge/network/protocol/socket|소켓 프로그래밍]]

## 출처

- [[brain/lectures/backend/kim-spring/http/section01|김영한 HTTP 1강 - TCP, UDP]]
