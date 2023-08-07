---
title: "section 3 - L3"
date: "2023-08-01 02:16"
enableToc: true
tags: [""]
weight: 5
---

인프런 널널한 개발자님의 <a href='https://www.inflearn.com/course/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC-%ED%95%B5%EC%8B%AC%EC%9D%B4%EB%A1%A0-%EA%B8%B0%EC%B4%88' target='_blank'>네트워크 핵심이론 - 기초</a>를 정리한 노트

<hr>

### IPv4 주소의 기본구조

<br>

![](brain/image/section3-1.png)

**L3 IP 주소는 8비트가 4개인 32 bit로 이루어져 있음**
- 예를 들어, **`192.168.0.10`**이라고 하자. 8비트씩 4개로 쪼개보자.
	- `1111 0000` / `1010 1000` / `0000 0000` / `0000 1010`
- IP 주소는 Host를 식별하기 위한 식별자라고 했었다 !
- IP 주소는 ==**Network ID + Host ID**== 두 부분으로 나눈다

쉽게 예를 들어서, 택배를 생각해보자. 가까운 택배 물류센터까지 일단 와야하는데, 그것을 **Network ID**라고 생각하고, 그 물류센터에서부터 구체적으로 우리집 주소까지 오는 것을 **Host ID**라고 생각하면 된다.

==**네트워크에 일단 진입하고 난 이후, 구체적인 호스트를 찾는다고 생각!**==

<br><hr>

### L3 Packet

![](brain/image/section3-2.png)

- L3의 데이터 유통단위인 Packet은 ==**L3 IP Packet**==으로 외우자.
- Packet = Header + Payload (상대적인 분류)
	- ==**Header에 가장 중요한 출발지(Source) 목적지(Destination) 정보 있음**==
- 최대 크기는 ==**MTU (Maximum Transmission Unit, 최대 전송 단위)**==
	- 특별한 이유가 없다면, 보통 **1500 bytes ( = 1.4kB)** 으로, 굉장히 작다.
	- **패킷이나 프레임의 최대 크기** 로 데이터의 크기가 크다면 단편화해야 한다.

<br><hr>

### Encapsulation

![](brain/image/section3-3.png)

**Encapsulation (캡슐화)**
- 택배 박스 포장하는 것으로 생각
- ==**포장하는 과정에서 단위화**== 해서 집어넣는다.
	- 포장한 박스는 까기 전까지 내용물을 모르겠지 ?
- L2 Frame의 Payload가 L3 IP Packet 전체가 되는 것

<br><hr>

### 패킷의 생성, 전달, 소멸

<br>

**철수가 영희에게 책을 택배로 보내는 과정이라고 하자.**
1. 철수가 책을 택배박스에 포장한다.
2. 현관을 통해 택배박스가 나간다.
3. 택배기사님에게 전달한다.
4. 택배 물류 체계에 의해서 택배를 모으고 분류하는 과정을 한다.
5. 택배가 목적지까지 간다.
6. 누구의 택배인지 선택해서 택배박스를 준다. 받는 사람 이름이 영희라고 표시되어있을 것

<br>

**A 프로세스가 B 프로세스에게 인터넷을 통해 Data를 보내는 과정이라고 하자.**
1. A 프로세스에서 보내는 Data를 Packet으로 만든다.
2. Interface를 통해 Packet이 나간다.
3. Gateway에게 전달한다.
4. Gateway가 packet을 Routing 한다.
5. IPv4의 Destination까지 간다.
6. B 프로세스의 어떤 포트인지 선택해서 packet을 준다. Port 번호가 적혀있을 것

<br>

![](brain/image/section3-4.png)

> [!note] 💡 복습 <br>
> Socket 은 TCP/IP 를 추상화한 인터페이스 <br>
> User mode Process가 접근할 수 있도록 추상화 시켜준 인터페이스 <br>
> <br>
> 일종의 File 이라고 했지? File에 write 쓰는 행위 <br>
> 그러나, tcp니까 send라고 이해하자

<br><hr>

### 계층별 데이터 단위

![](brain/image/section3-7.png)

- Socket Stream은 열리고 닫히기 전까지니까 데이터 크기가 클 것
	- 따라서, Stream을 데이터의 단위라고 하기에는 애매하다 ~
- 예를 들어서, 4MB라고 해보자. Segment 최대 단위인 MSS (Maximum Segment Size) 보다 크니까, ==**Stream이 Segment화 되는 과정에서 데이터를 잘라낸다.**==
- 이 과정을 ==**Segmentation (세그멘테이션), 즉, 분할**==이라고 한다.
- TCP 말고 **UDP 에서는 Datagram이라는 데이터 단위를 사용**한다.

<br><hr>

### TCP/IP 송수신 구조

