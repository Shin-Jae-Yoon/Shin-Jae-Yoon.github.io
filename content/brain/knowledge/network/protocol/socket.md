---
title: 소켓 프로그래밍
aliases:
  - 소켓 프로그래밍
  - 소켓
  - ServerSocket
  - localhost
tags:
  - network
  - java
origin:
  verified: 2026-08-30
  scouted: 2026-08-30
---

소켓은 TCP/IP를 추상화한 인터페이스다. 네트워크 통신을 파일 읽고 쓰듯 다룰 수 있게 해준다. [[http|HTTP]] 같은 상위 프로토콜도 그 아래에서는 소켓을 쓴다.

## 커널의 TCP/IP에 닿는 파일

NIC(랜카드) 같은 하드웨어를 제어하는 소프트웨어를 드라이버라고 한다. TCP/IP는 그보다 위, 운영체제의 커널 수준에 프로토콜로 구현되어 있다.

여기서 문제가 생긴다. User 수준에서 Kernel 수준으로 말을 전달하려면 무언가를 거쳐야 하는데, 리눅스에서 그 인터페이스의 형태가 파일이다. 소켓은 TCP/IP를 추상화한 그 인터페이스 파일에 붙은 특별한 이름이다.

## 파일처럼 읽고 쓰기

파일이라 부르지 않고 소켓이라 부를 뿐 다루는 방법은 파일과 같다. `read`와 `write`로 읽고 쓰고, 다 쓰면 `close`한다. [[system-call|시스템 콜]]과 같은 자리에 있는 것이고 [[brain/knowledge/design/architecture/api|API]]의 한 형태다.

## 주소와 포트 한 쌍

소켓 하나가 가리키는 것은 IP 주소와 포트 번호 한 쌍이다. IP는 기계까지만 데려다주므로, 내 컴퓨터로 패킷이 날아왔을 때 그것이 게임 패킷인지 브라우저 응답인지 가르는 일은 포트가 맡는다. IP가 아파트라면 포트는 몇 동 몇 호에 해당한다. TCP/IP 패킷에 출발지 포트와 목적지 포트가 함께 들어 있어서 서버는 응답을 어디로 돌려보낼지 알 수 있다.

컴퓨터 자신을 가리키는 이름도 있다. IP로는 `127.0.0.1`이고 도메인으로는 `localhost`다.

## InetAddress로 알아내는 주소

자바에서는 `InetAddress`로 IP를 알아낸다.

```java
InetAddress ia = InetAddress.getLocalHost();
System.out.println(ia.getHostAddress());
```

`InetAddress.getAllByName("www.google.com")`으로 도메인의 IP도 알 수 있다. 하나의 도메인이 여러 IP에 매핑될 수 있어서 배열로 돌려주며, 안에서는 [[port-and-dns|DNS]]에 물어본다.

## 연결을 맺고 스트림 꺼내기

서버는 포트를 열고 기다리고, 클라이언트는 주소를 들고 연결한다.

```java
ServerSocket server = new ServerSocket(port);   // 서버: 포트를 열고
Socket socket = server.accept();                // 연결을 기다린다

Socket socket = new Socket(host, port);         // 클라이언트: 연결한다
```

연결이 맺어지면 양쪽 모두 `Socket`에서 [[io-stream|I/O 스트림]]을 꺼내 읽고 쓴다. 네트워크 통신이 파일 입출력과 같은 모양이 되는 것이 소켓 추상화가 주는 이득이다.

`accept()`는 연결이 올 때까지 블로킹된다. 여러 클라이언트를 받으려면 연결마다 [[thread|스레드]]를 만들어야 한다. 채팅 서버가 그 구조다.

## 포트 번호의 세 구간

포트 번호는 0부터 65535까지 쓸 수 있고 세 구간으로 나뉜다.

| 구간       | 범위          | 무엇                             |
| ---------- | ------------- | -------------------------------- |
| Well Known | 0 ~ 1023      | IANA가 예약해둔 포트             |
| Registered | 1024 ~ 49151  | 개인이나 회사가 등록해 쓰는 포트 |
| Dynamic    | 49152 ~ 65535 | OS가 그때그때 부여하는 동적 포트 |

Well Known 구간에는 FTP의 20과 21, TELNET의 23, HTTP의 80, HTTPS의 443이 들어 있다. 예약된 자리라 애플리케이션이 가져다 쓰지 않는 것이 좋다. 내 애플리케이션에 포트를 정할 때는 Registered 구간에서 고른다. 8080이 그중 하나다.

## 참고

포트 번호를 예약하고 관리하는 주체는 IANA다. 원본 노트는 ICANN이라고 적었는데, ICANN은 IANA 기능을 산하 PTI를 통해 운영하는 상위 조직이고 포트 레지스트리의 이름은 IANA다. [IANA Service Name and Transport Protocol Port Number Registry](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml)

## 관련

- [[tcp-udp|TCP와 UDP]]
- [[port-and-dns|포트와 DNS]]
- [[io-stream|I/O 스트림]]
- [[web-server-and-was|Web Server와 WAS]]

## 출처

- [[brain/lectures/pl/fun-java/fun-java11|재미있는 자바 11강 - 네트워크 프로그래밍]]
- [[brain/lectures/backend/kim-spring/http/section01|김영한 HTTP 1강 - PORT]]
- [[brain/lectures/network/free-dev/network-basic/section0|널널한 개발자 네트워크 기초 0강 - User mode와 Kernel mode]]
