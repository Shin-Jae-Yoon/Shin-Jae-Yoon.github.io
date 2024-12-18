---
title: "01. 프로세스/스레드"
date: "2023-05-02 16:43"
enableToc: true
tags: [""]
weight: 2
---

유튜버 쉬운코드 님의 <a href='https://www.youtube.com/@ez./playlists' target='_blank'>운영체제</a> 강의를 정리한 내용

<hr>

## 프로세스/스레드

### 기초용어

<br>

==**프로그램 (program)**==
- 컴퓨터가 실행할 수 있는 명령어들의 집합

<br>

==**프로세스 (process)**==
- 컴퓨터에서 ==실행 중인 프로그램==
- 각각의 프로세스는 ==독립된 메모리 공간==을 할당 받음
- 명령어들과 데이터를 가짐

<br>

==**CPU (Central Processing Unit)**==
- 명령어를 실행하는 연산 장치
- 프로세스의 명령어를 해석하고 실행하는 장치

<br>

==**메인 메모리 (Main Memory)**==
- 프로세스가 CPU에서 실행되기 위해 대기하는 곳

<br>

==**IO (Input / Output)**==
- 파일을 읽고 쓰거나 네트워크의 어딘가와 데이터를 주고 받는 것
- 입출력 장치와 데이터를 주거나 받는 것

<br><hr>

### 단일 프로세스

<br>

**단일 프로세스 시스템**
- 한 번에 하나의 프로그램만 실행되는 시스템
	- 다른 프로그램을 실행하려면 먼저 실행 중인 프로그램을 종료시키고 그 다음 프로그램을 실행해야함
	- 아주 초창기의 시스템 모델

![](brain/image/lecture01-7.png)

- 단점 : CPU 사용률이 좋지 ❌
	- 어떤 프로그램 P1은 CPU을 사용하기도 하고 IO 작업을 하기도 함
	- P1이 IO 작업을 하는 동안 CPU는 그냥 놀고있음
- 이게 단일 프로세스 시스템의 단점
	- **실행 중에 있는 프로세스가 IO 작업을 하는 동안 CPU가 아무것도 안하고 노는 것**

![](brain/image/lecture01-8.png)
- **해결책 : 여러 개의 프로그램을 메모리에 올려놓고 동시에 실행시키자!**
	- IO 작업이 발생하면 다른 프로세스가 CPU에서 실행됨

<br>

**멀티 프로그래밍 (Multi Programming)**
- 여러 개의 프로그램이 동시에 실행되는 것
	- ==**CPU 사용률을 극대화 시키는데 목적**==
- 단점 : CPU 사용 시간이 길어지면 다른 프로세스는 계속 대기

![](brain/image/lecture01-9.png)

- **해결책 : 프로세스는 한 번 CPU를 사용할 때 아주 짧은 시간(=quantum)만 CPU에서 실행되도록 하자 !!**

<br><hr>

### 멀티태스킹

**멀티태스킹 (multitasking)**

![](brain/image/lecture01-10.png)

![](brain/image/lecture01-11.png)

- 멀티 프로그래밍과 유사하지만, **CPU 타임을 아주 짧게 쪼개서, 그 CPU 타임 안에서 프로세스들이 번갈아 CPU를 사용할 수 있게 만들었다는 점에서 차이가 있음**
	- 아주 짧은 시간(=quantum)은 ms 단위까지 time slot이 아주아주 짧게 구분됨
	- time slot 시간 안에서만 각 프로세스들이 CPU를 최대한 사용할 수 있게 됨
- 멀티태스킹은 ==**프로세스의 응답 시간을 최소화 시키는데 목적**==
	- 일반 사용자가 느끼기에는 마치 여러 프로그램이 **동시에 실행되는 것처럼 느끼게 함**

<br>

**멀티태스킹의 아쉬움**
- ==하나의 프로세스가 동시에 여러 작업을 수행하지는 ❌==
	- 여러 프로세스를 만들어서 실행시킬 수 있겠지만, 프로세스를 여러 개 만들어서 실행시키기에는 [컨택스트 스위칭](brain/Lecture/os/easy-os/lecture02.md) 같은 단점이 있음
- ==프로세스의 컨택스트 스위칭은 무거운 작업==
	- 컨택스트 스위칭은 CPU에서 실행되기 위해서 어느 한 프로세스에서 다른 프로세스로 교체되는 것을 의미
- ==프로세스끼리 데이터 공유가 까다로움==
	- 프로세스는 독립적인 메모리 공간을 가지기 때문
	- ![](brain/image/lecture01-13.png)
- ==듀얼 코어가 등장했는데, 잘 쓰기 어려움==

→ 이런 멀티태스킹 아쉬움 문제의 해결책이 바로 ==**스레드(Thread)**==

<br><hr>

### 스레드

==**스레드(Thread)**==
- 프로세스는 한 개 이상의 스레드를 가질 수 있음
- 스레드는 **CPU에서 실행되는 단위**이다. (unit of execution)
- 같은 프로세스의 스레드들끼리 컨택스트 스위칭은 가볍다.
- 스레드들은 자신들이 속한 프로세스의 메모리 영역을 공유함

> 지금 이야기 하는 것은 OS Level에서의 스레드 <br>
> User Level에서의 스레드도 있음

<br>

> 오늘날의 프로세스는 기본적으로 최소 1개의 스레드를 가짐 <br>
> 스레드가 CPU/코어에서의 실행되는 **기본 단위**이기 때문 <br>

<br>

==**메모리 구조 비교 (싱글 스레드 vs 멀티 스레드)**==

![](brain/image/lecture01-14.png)
- 지금 보이는 메모리 구조가 1개의 프로세스가 할당받은 메모리 영역
- 같은 프로세스에 속한 스레드들은 그 프로세스의 메모리 영역을 공유
	- Heap 영역은 공유 🟢
	- 자신만의 고유한 영역인 Stack은 공유 ❌
	- 각각의 스택을 가리키는 stack pointer, PC는 공유 ❌
	- PC (Program Counter)는 다음번에 실행되어야 할 명령어가 있는 메모리 주소를 가리킴

<br>

**ex) CPU 코어 1개의 경우**

![](brain/image/lecture01-15.png)
- 기존의 멀티태스킹 시스템처럼 쪼갠 시간만큼 조금씩 실행

<br>

**ex) CPU 멀티 코어의 경우**

![](brain/image/lecture01-16.png)
- 병렬적으로 스레드가 실행되는 진정한 의미의 **동시성**


<br><hr>

### 멀티스레딩

==**멀티스레딩 (Multi Threading)**==
- 하나의 프로세스가 동시에 여러 작업을 실행하는데 목적
	- 여러 작업은 스레드들을 통해서 동작되는 것을 의미
- 확장된 멀티태스킹의 개념
	- 여러 프로세스와 여러 스레드가 아주 짧게 쪼개진 cpu time을 나눠갖는 것

<br>

==**멀티프로세싱 (Multi Processing)**==
- 두 개 이상의 프로세스나 코어를 활용하는 시스템

<br><hr>

### 종합 예제

<br>

**ex) 싱글코어 CPU에 싱글-스레드 프로세스가 2개**

![](brain/image/lecture01-17.png)

<br>

**ex) 싱글코어 CPU에 듀얼-스레드 프로세스 1개**

![](brain/image/lecture01-18.png)

- CPU 코어 1개를 가지고 경합하기 때문에 멀티태스킹 🟢
- 듀얼-스레드니까 멀티스레딩 🟢 
- CPU 1개니까 멀티프로세싱 ❌

<br>

**ex) 듀얼코어 CPU에 싱글-스레드 프로세스 2개**

![](brain/image/lecture01-19.png)

- 코어 2개라서 헷갈리면 안됨. CPU 코어 1개를 가지고 경합하는 것이 없기 때문에 멀티태스킹 ❌
- 싱글-스레드니까 멀티스레딩 ❌
- 코어가 2개니까 멀티프로세싱 🟢

<br>

**ex) 듀얼코어 CPU에 듀얼-스레드 프로세스 1개**

![](brain/image/lecture01-20.png)

- 각 코어별로 경합하는 것이 아니니까 역시 멀티태스킹 ❌
- 하나의 프로세스에 스레드가 2개니까 멀티스레딩 🟢
- 코어가 2개니까 멀티프로세싱 🟢

<br>

**ex) 듀얼코어 CPU에 듀얼-스레드 프로세스 2개**

![](brain/image/lecture01-21.png)

- 각 코어마다 경합하는 것이 있으니까 멀티태스킹 🟢
- 듀얼-스레드니까 멀티스레딩 🟢
- 코어가 2개 + 프로세스 2개니까 멀티프로세싱 🟢

![](brain/image/lecture01-22.png)

- 각 코어마다 경합하는 것이 있으니까 멀티태스킹 🟢
- 듀얼-스레드니까 멀티스레딩 🟢
- 코어가 2개 + 프로세스 2개니까 멀티프로세싱 🟢
