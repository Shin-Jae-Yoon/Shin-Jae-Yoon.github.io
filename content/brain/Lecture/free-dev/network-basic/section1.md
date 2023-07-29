---
title: "section 1 - network"
date: "2023-07-29 18:24"
enableToc: true
tags: [""]
weight: 3
---

인프런 널널한 개발자님의 <a href='https://www.inflearn.com/course/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC-%ED%95%B5%EC%8B%AC%EC%9D%B4%EB%A1%A0-%EA%B8%B0%EC%B4%88' target='_blank'>네트워크 핵심이론 - 기초</a>를 정리한 노트

<hr>

## OSI 7 Layer, 식별자

![](brain/image/section0-1.png)

![](brain/image/section1-2.png)
<br>

**OSI 7계층에서의 식별자**
- 식별자란, 어떤 것을 식별하기 위한 것. 사람을 예시로 들면 주민등록번호

<br>

**대표적인 식별자 3가지를 알아보자**
- MAC 주소
	- L2에서 NIC (랜카드)를 식별하기 위한 식별자
	- NIC는 전기 신호가 들어오면 L2에서 데이터 형태(패킷)로 변환하여 내용을 구분하고 물리적인 도착지 MAC 주소를 확인함
- IP 주소
	- L3에서 host를 식별하기 위한 식별자
- Port 번호
	- 포트 번호는 어디서 보느냐에 따라 다양한 의미를 가짐
	- L2의 하드웨어 관점에서 보면 인터페이스(유선 케이블 꽂는 단자)를 식별하기 위한 식별자
	- L3, L4의 네트워크 관점에서 보면 (Web)Service를 식별하기 위한 식별자
	- 엔드포인트 관점에서 보면 Process를 식별하기 위한 식별자

<br>  

정리하자면, OSI 7계층에서의 식별자는 아래와 같이 이해하자
- ==**L2 Frame**==에서는 ==**MAC 주소**==
	- 48bit, 보통 16진수로 표기
- ==**L3 Packet**==에서는 ==**IP 주소**==
	- IPv4 기준 32bit, 10진수(8bit)씩 끊어서 점으로 구분하여 표기
- ==**L4 Segment**==에서는 ==**Port 번호**==
	- 16bit 양의 정수

<br>

<hr>

## Host

<br>

**Host : Computer + Network**
- **호스트**는 인터넷에 연결된 컴퓨터이구나 ~

<br>

![](brain/image/section1-3.png)

**Host는 크게 Switch / End-point로 나뉜다.**
- Switch : ==**Network 그 자체를 이루는 host. Infrastructure**==
	- 다 그렇지는 않다. L2 switch는 호스트라고 하지는 않음
	- Router, IPS (Security Switch), Tab Switch, Aggregation Switch 
- End-point : ==**Network 인프라를 이용하는 주체**==
	- 단말
	- Client, Server, Peer (P2P 통신) 등등

<br> 

<hr>

## Switch

<br>

![](brain/image/section1-4.png)

1. ==**도로 망**==이 존재하고, ==**사람**==이 출발지에서 목적지까지 가는 상황
2. ==**교차로**==에서 ==**경로를 선택**==하여 정해서 가야함
3. 경로를 선택할 때 그에 대한 근거는 ==**이정표**==를 보고 선택
4. 최종적으로 목적지까지 도착

<br>

L3 네트워크 계층이라고 생각해보자.

1. ==**Network 망**==을 통해 ==**Packet**==이 출발지에서 목적지까지 가는 상황
2. ==**Switch**==에서 ==**Interface를 선택**==하여 정해서 가야함
	- 경로를 선택했다 = switching 했다
3. 경로를 선택할 때 그에 대한 근거는 ==**IP주소**==를 보고 선택
4. 최종적으로 목적지까지 도착

<br>

- MAC 주소를 보고 스위칭 한다면? **L2 Switch**
- IP 주소를 보고 스위칭 한다면? **L3 Switch**
- Port 번호를 보고 스위칭 한다면? **L4 Switch**
- HTTP의 정보를 보고 스위칭 한다면? **L7 Switch**

<br>

**L3 Switch와 Router는 거의 동일한 기능을 수행함**
- Rotuer는 Routing table에 근거하여 경로를 선택함

<br>

**경로를 찾을 때 항상 "비용"을 고민해야 함**
- 어떤 경로로 갈 때에 대한 비용을 ==**Metric 값**==이라고 함
- 출발지에서 목적지까지 가는 임의의 단위로, 값의 단위는 프로토콜에 따라 다름
- 라우팅 경로 순서는 Metric 값에 의해 결정

<br>

<hr>

## L3 switch / Router

원래, 보통 알고 있는 스위치는 L2 switch로 MAC address를 기준으로 가는 것으로 많이 이해한다. L2의 스위치 기능과 L3의 라우터 기능을 모두 갖춘 장비가 바로 L3 switch 이다.

- **L3 switching = L2 <a href='http://www.ktword.co.kr/test/view/view.php?m_temp1=640&id=459' target='_blank'>switching</a> + L3 <a href='http://www.ktword.co.kr/test/view/view.php?m_temp1=539&id=345' target='_blank'>routing</a>**
- **L3 switch = L2 switch + 라우터 기능**

<br>

==**L2 Switching vs L3 Switching**==

![](brain/image/section1-5.png)

<br>

==**L3 switch 기본 동작방식**==
- 기본적으로 서로 다른 <a href='http://www.ktword.co.kr/test/view/view.php?m_temp1=3477&id=844' target='_blank'>VLAN ID</a> 간에는 <a href='http://www.ktword.co.kr/test/view/view.php?m_temp1=448&id=859' target='_blank'>라우터</a>를 통하여 <a href='http://www.ktword.co.kr/test/view/view.php?m_temp1=421&id=484' target='_blank'>패킷</a>을 전송
- L3 switch는 수신된 **패킷**에서 L3에 해당하는 **IP 정보 부분**을 살펴보고 있다가, 자신이 이미 알고 있는 (캐시되어있는) 주소이면 굳이 라우터를 통하지 않고, 자신이 직접 **하드웨어적으로 곧바로 전송**함
- 패킷 플로우에서 첫번째 패킷에 대한 목적지 경로는 라우터로부터 파악하고, 이후 수신되는 패킷들은 자신의 스위칭 기능에 의해 **고속 포워딩** 수행

<br>

==**그렇다면 L3 switch와 Router의 차이는?**==

- 사실상, 큰 차이가 없어서 둘을 동일시해서 부르기도 함
- L3 switch : 하드웨어 기반의 라우팅
	- CPU에 의한 소프트웨어적인 라우팅이 아닌, <a href='http://www.ktword.co.kr/test/view/view.php?m_temp1=612&id=204' target='_blank'>ASIC</a> 기반의 고속 라우팅
- Router : 소프트웨어 기반의 라우팅
- 그나마 차이를 꼽자면, ==**L3 switch는 ASIC chip 하드웨어 기반의 고속 라우팅으로 Router와 비교하여 성능적인 측면에서 차이가 난다.**==

|                      | Router                 | L3 Switch            |
| -------------------- | ---------------------- | -------------------- |
| Routing 수행방법            | **소프트웨어 처리가 메인** | **하드웨어 처리가 메인** |
| 포트 수              | 적음                   | 많음                 |
| 처리 속도            | 느림                   | 빠름                 |
| 지원 기능 수         | 많음                   | 적음                 |
| 지원 인터페이스 종류 | 많음                   | 적음                 |
| 확장성               | 많음                   | 적음                     |

<br>