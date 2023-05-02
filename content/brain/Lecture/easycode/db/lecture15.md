---
title: "15. 동시성 제어"
date: "2023-05-02 16:07"
enableToc: true
tags: [""]
weight: 16
---

유튜버 쉬운코드 님의 <a href='https://www.youtube.com/@ez./playlists' target='_blank'>데이터베이스</a> 강의를 정리한 내용

<hr>

## Concurrency Control

### 예제

**ex) J가 H에게 20만원을 이체할 때, 하필 그 타이밍에, H도 ATM에서 본인 계좌에 30만원을 입금한다면?**

**case 1**

![](brain/image/lecture15-1.png)

<br>

**case 2**

![](brain/image/lecture15-2.png)

<br>

**case 3**

![](brain/image/lecture15-3.png)

<br>

**case 4**

![](brain/image/lecture15-4.png)

- 이렇게 update 된 데이터가 사라지는 현상을 ==**Lost update**==라고 함

<br>

**용어정리**

![](brain/image/lecture15-5.png)

![](brain/image/lecture15-6.png)

- 위와 같이 간소화 시켜보겠다.
- 이렇게 하나 하나의 과정을 ==**operation**==이라고 부름
- `r1(K)`를 보면 r은 읽기, 1은 트랜잭션 숫자, K는 읽으려는 데이터이다.

<br>

**최종 간소화**

![](brain/image/lecture15-7.png)

<br><hr>

### schedule

==**Schedule (스케쥴)**==
- 여러 transaction들이 동시에 실행될 때 각 transaction에 속한 operation 들의 실행 순서를 의미
- 각 transaction 내의 operations들의 순서는 바뀌지 ❌

<br>

==**Serial schedule (순차적 스케쥴)**==
- transaction들이 **겹치지 않고 한 번에 하나씩 실행**되는 schedule

![](brain/image/lecture15-8.png)

<br>

==**nonserial schedule (비순차적 스케쥴)**==
- transaction들이 **겹쳐서(interleaving) 실행**되는 schedule

![](brain/image/lecture15-9.png)

<br>

==**Serial schedule 성능**==


<br>

==**nonserial schedule 성능**==


<br><hr>

### serializability
