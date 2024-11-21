---
title: "인터넷 네트워크"
date: "2023-04-27 20:50"
enableToc: true
tags: [""]
weight: 2
---

인프런 김영한님의 <a href='https://www.inflearn.com/course/http-%EC%9B%B9-%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC' target='_blank'>모든 개발자를 위한 HTTP 웹 기본 지식</a> 강의를 정리한 내용

<hr>

### 인터넷 통신

**인터넷 상에서 컴퓨터 둘은 어떻게 통신할까?**

![](brain/image/section01-1.png)

- 수많은 노드들을 지나며 통신하는데, 너무 복잡하다.
- 이에 대한 이해를 위해 IP를 알아야한다.

<br><hr>

### IP(인터넷 프로토콜)

**IP 주소를 통해 통신이 가능해진다. 따라서, 먼저 IP를 부여받아야 함**
- IP (Internet Protocol) 역할
	- 지정한 IP 주소(IP Address)에 데이터 전달
	- 패킷(Packet)이라는 통신 단위로 데이터 전달

<br><br>

**메시지를 그냥 보내는 것이 아니라, IP 패킷에 정보를 담아서 보내야 한다.**
- 출발지 IP, 목적지 IP, 등등

![](brain/image/section01-2.png)

<br><br>

==**그러나, IP 프로토콜은 한계가 있다**==
- 비연결성
	- 패킷을 받을 대상이 없거나 서비스 불능 상태여도 패킷이 전송됨
- 비신뢰성
	- 중간에 패킷이 사라지면?
	- 패킷이 순서대로 안오면?
- 프로그램 구분
	- 같은 IP를 사용하는 서버에서 통신하는 애플리케이션이 둘 이상이면?
- 예시
	1. **대상이 서비스 불능, 패킷 전송** ![](brain/image/section01-3.png)

	2. **비신뢰성 - 패킷손실** ![](brain/image/section01-4.png)

	3. **비신뢰성 - 패킷 전달 순서 문제 발생** ![](brain/image/section01-5.png)

<br>

이렇게 IP만으로 해결이 되지 않는 이유로, 아래에서 설명할 <a href='/brain/Lecture/kim-spring/http/section01/#tcp-udp'>TCP</a>라던가 <a href='/brain/Lecture/kim-spring/http/section01/#port'>PORT</a>라던가 혹은 <a href='/brain/Lecture/kim-spring/http/section01/#dns'>DNS</a> 등의 개념이 나오게 되었다.

<br><hr>

### TCP, UDP

**IP (인터넷 프로토콜) 스택의 4계층**

- 애플리케이션 계층 - HTTP, FTP
- 전송계층 - TCP, UDP
- 인터넷 계층 - IP
- 네트워크 인터페이스 계층 - 랜카드, 랜드라이버 등등

<br><br>

**프로토콜 계층**

![](brain/image/section01-6.png)

1. 소켓 라이브러리를 통해 OS 계층에다가 데이터를 넘김
2. TCP 정보 생성해서 씌우기
3. IP 패킷 생성해서 씌우기
4. Ethernet Frame (실제 물리적인 주소 등) 씌워서 보내기

<br><br>

**TCP/IP 패킷 정보**

![](brain/image/section01-7.png)

- 순서 제어와 같이 IP 만으로 해결안됐던 부분이 TCP 정보를 통해 해결됨

<br><br>

==**TCP (Transmission Control Protocol, 전송 제어 프로토콜) 특징**==
- 연결지향, 신뢰할 수 있는 프로토콜, 현재는 대부분 TCP 사용
	- **TCP 3 way handshake** ==**(가상연결)**==
	- 개념적인 연결이지, 실제 물리적인 연결이 아님 논리적 연결
	- SYN : 접속 요청, ACK : 요청 수락, 3번에 ACK와 함께 데이터 전송 가능 
		![](brain/image/section01-11.png)
- 데이터 전달 보증
		![](brain/image/section01-9.png)
- 순서 보장
		![](brain/image/section01-10.png)

<br><br>

==**UDP (User Datagram Protocol, 사용자 데이터그램 프로토콜) 특징**==
- 하얀 도화지에 비유 (기능이 거의 ❌)
- 연결지향 - TCP 3 way handshake ❌
- 데이터 전달 보증 ❌
- 순서 보장 ❌
- **UDP**는 IP와 거의 같음
	- **IP에 PORT, 체크섬 정도가 추가**된 것
	- 애플리케이션에서 추가 작업 필요
- 이렇게 보면 UDP 왜쓰지? 싶을거다
	- TCP는 3 way handshake에 걸리는 시간, 데이터의 양이 커지고, 전송속도를 더 빠르게 만들기 힘들다. 이미 인터넷이라는게 다 TCP 기반이라 튜닝하기 힘들다.
	- 이때, UDP는 하얀 도화지 상태라서 튜닝이 가능하다.
	- **TCP가 거의 90 몇프로 점유한 상태였는데, 이 SYN - SYN/ACK - ACK 과정도 다 줄여서 최적화해보자고 하여 HTTP 3의 경우에 UDP 프로토콜을 사용하면서 굉장히 뜨는 추세**

<br><hr>

### PORT

**한 번에 둘 이상 연결해야 하면?**
- 내 IP로 패킷들이 날라올텐데, 이게 게임 패킷인지 웹 브라우저 응답 패킷인지 어떻게 구분해?
- 그래서 PORT가 필요함

<br>

==**PORT : 같은 IP 내에서 프로세스 구분**==

![](brain/image/section01-12.png)

- 어떻게 서버가 클라이언트의 포트를 알고 저기로 쏴?
- <a href='/brain/Lecture/kim-spring/http/section01/#tcp-udp'>위에서</a> 그림 보면 TCP/IP 패킷에 출발지 PORT도 있잖아~
- ex) **아파트가 IP주소 ! 몇 동 몇 호가 포트번호!**

<br><br>

**PORT 번호**

- 0 ~ 65535 할당 가능
- 0 ~ 1023 : 잘 알려진 포트, 사용하지 않는 것이 좋음
	- FTP - 20, 21
	- TELNET - 23
	- HTTP - 80
	- HTTPS - 443

<br><hr>

### DNS

**DNS가 나오게 된 배경**

1. IP 주소는 기억하기 어렵다.
2. IP 주소는 변경될 수 있다.

<br>

==**DNS (Domain Name System, 도메인 네임 시스템)**==
- 중간에 전화번호부 같은 서버를 제공해줌
- 도메인 명은 IP 주소로 변환 가능

![](brain/image/section01-13.png)
