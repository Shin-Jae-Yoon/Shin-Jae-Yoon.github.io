---
title: "section 2 - L2"
date: "2023-07-31 20:03"
enableToc: true
tags: [""]
weight: 4
---

인프런 널널한 개발자님의 <a href='https://www.inflearn.com/course/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC-%ED%95%B5%EC%8B%AC%EC%9D%B4%EB%A1%A0-%EA%B8%B0%EC%B4%88' target='_blank'>네트워크 핵심이론 - 기초</a>를 정리한 노트

<hr>

### NIC, Frame, MAC 주소

![](brain/image/section2-1.png)

<br>

**NIC**
- **NIC**(Network Interface Card)는 **LAN**(Local Area Ntwork) 카드
- NIC도 유선, 무선이 있지만 굳이 구별하지 않고 NIC라고 많이 함
- ==**NIC는 하드웨어이며, MAC 주소를 가짐**==
- 여러 Host (Computer + Network) 들이 모여서 근거리 통신망 LAN을 이룸

<br>

**LAN Card**
- 속도가 1Gbps는 초당 1기가 **비트**
- 속도가 1GBps는 초당 1기가 **바이트** (이건 말도 안됨. 잘못 쓴거임!)

<br>

**Frame**
- L3에서의 데이터 유통단위는 Packet 이었다.
- L2에서의 데이터 유통단위는 Frame !!
- 크기가 보통 1514 bytes 정도밖에 안됨
	- Jumbo Frame (점보 프레임)으로 가면 10KB 정도

<br><hr>

### L2 Switch

<br>

![](brain/image/section2-2.png)

<br>

**L2 Access switch**
- PC 혹은 랜 케이블과 같은 **End-point와 직접 연결되는 스위치**
- L2 스위치니까 ==**MAC 주소를 근거로 스위칭**==

![](brain/image/section2-3.png)

- 구멍 하나가 인터페이스 1개 → 이걸 Port 라고도 함
- 연결 가능한 것이 24개다? → 24 Port Hub
- 물리적으로 케이블이 연결되었다면 → **Link-up**
- 물리적으로 케이블이 끊어졌다면 → **Link-down**
- L2 스위치에서 L3 계층의 라우터로 간다면 → **uplink**

<br>

**L2 Distribution switch**
- L2 Access switch를 위한 스위치
- ==**VLAN (Virtual LAN) 기능을 제공하는 것이 일반적**==
- 평균적으로 Access switch보다 Distribution switch가 더 비쌈
- 대~략) L2 Access switch 10만원, L2 Distribution switch 수십~수백만원, L3 switch(Router) 100만원 이상, L4 switch 1000만원 이상, L7 switch 1억 이상

![](brain/image/section2-6.png)

![](brain/image/section2-5.png)

<br><hr>

### LAN, WAN, Broadcast

<br>

**Broadcast**
- 방송 주소, 네트워크 효율이 떨어짐
- 이와 정반대의 개념이 **unicast**
	- 유니캐스트는 단 둘이 대화하는 것
- 브로드캐스트는 시끄러운 것, 유니캐스트는 조용한 것

<br>

**Broadcasting**
- 송신 호스트가 전송한 데이터가 ==**네트워크에 연결된 모든 호스트에 전송되는 방식**==
- 하나의 호스트가 브로드캐스팅 하는 순간 끝날때까지 나머지 호스트는 통신하지 못함
- 따라서, **브로드캐스팅은 무조건 최소화 되는 것이 좋음**

<br>

**Broadcast 주소**
- Broadcast라는 매우 특별한 주소가 존재
- MAC Address, IP Address 모두 존재
- 특정 네트워크의 ==**맨 마지막 주소를 브로드캐스트 주소로 사용**==
	- MAC Address 
		- 48자리 비트가 모두 1로 되어있는 MAC 주소를 브로드캐스트 MAC 주소라 함
		- `FF-FF-FF-FF-FF-FF`
	- IP Address
		- 예를 들어, C클래스 하나로 특정 IP를 할당했고 ip의 네트워크 주소가 `192.168.2.0`이라고 하자.
		- 서브넷 마스크의 `0` 부분을 모두 1로 바꾸면 된다.
		- IP 주소는 32비트 = 8비트 x 4이니까 `0`에 해당하는 부분이 8비트이다. 2 <sup>8</sup>은 256이니까, 0~255겠네
		- 따라서, 바꾸면 255니까 `192.168.2.255`

<br>

**LAN, WAN**

이전의 그림을 다시 봐보자.

![](brain/image/section1-6.png)

- 완벽한 정답은 아니고, 이해하기 편한 팁 정도로 이해하자.
- physical network에 해당하는 부분이 **LAN**
- logical network에 해당하는 부분이 **WAN**
- 인터넷을 설명할 때, L3 부터는 소프트웨어적으로 존재하는 **논리적인 네트워크**
- 물리적으로 네트워크가 존재한다는 것은 랜 케이블이 꽂혔냐? 무선 신호가 실제로 도달하냐?
- 이 ==**물리적인 네트워크를 기반으로 논리적인 네트워크가 존재하는 것**==