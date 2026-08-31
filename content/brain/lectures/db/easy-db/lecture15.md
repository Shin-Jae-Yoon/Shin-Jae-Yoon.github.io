---
title: "15. 동시성 제어 1부"
date: "2023-05-02 16:07"
enableToc: true
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

### Schedule

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
- Serial schedule은 순차적으로 트랜잭션이 실행되니까 이상한 결과를 만들지는 않음
- 하지만, IO 작업을 하는 동안 CPU는 가만히 놀고 있음
- **한 번에 하나의 transaction만 실행되기 때문에 좋은 성능을 낼 수 없고 현실적으로 사용할 수 없는 방식**


<br>

==**nonserial schedule 성능**==

![](brain/image/lecture15-10.png)

- transaction들이 겹쳐서 실행되기 때문에 동시성이 높아져서 같은 시간동안 더 많은 transaction 들을 처리할 수 있음
- 하지만, transaction 들이 어떤 형태로 겹쳐서 실행되는지에 따라 이상한 결과가 나올 수 있음

<br>

**고민거리**
- 성능 때문에 여러 transaction 들을 겹쳐서 실행할 수 있으면 좋다. (nonserial schedule)
- 하지만, 이상한 결과가 나오는 것은 원하지 않는다.

<br>

**아이디어**
- nonserial schedule로 실행해도 이상한 결과가 나오지 않는 방법이 뭘까?
	- **serial schedul과 동일한(equivalent) nonserial schedule을 실행해보자!**
	- schedule이 동일하다의 의미를 정의해야겠네

<br><hr>

### Conflict

<br>

==**Conflict**==
- 두 개의 operations에 대하여 사용하는 개념
- conflict가 중요한 이유는, **conflict operation의 순서가 바뀌면 결과도 바뀌기 때문**
- 아래의 세 가지 조건을 모두 만족하면 conflict
	1. ==**서로 다른 transaction 소속**==
	2. ==**같은 데이터에 접근**==
	3. ==**최소 하나는 write operation**==

<br>

**ex) conflict 예시**

![](brain/image/lecture15-11.png)

![](brain/image/lecture15-13.png)

<br>

==**Conflict equivalent, 충돌되는 연산 순서가 동일하다**==
- conflict 개념을 사용하여 **schedule이 동일하다는 의미**를 정의하기 위함
- 아래의 두 조건을 모두 만족하면 conflict equivalent
	1. ==**두 schedule은 같은 transaction들을 가짐**==
	2. ==**어떤(any) conflicting operations의 순서도 양쪽 schedule 모두 동일**==

![](brain/image/lecture15-14.png)
- 3개의 conflicting operations들의 순서가 양쪽 모두 동일
	- sched.3 : `r2(H) -> w1(H)`, sched.4 : `r2(H) -> w1(H)`
	- sched.3 : `w2(H) -> r1(H)`, sched.4 : `w2(H) -> r1(H)`
	- sched.3 : `w2(H) -> w1(H)`, sched.4 : `w2(H) -> w1(H)`
- 이 두 개의 스케쥴은 최종적으로 conflict equivalent 하다고 할 수 있음
- 그런데, schedule2를 보면 순차적인 스케쥴(serial schedule)이다.

<br><hr>

### Serializable

==**Conflict Serializable**==

![](brain/image/lecture15-14.png)

- 위의 예시처럼 serial schedule과 conflict equivalent 할 때 conflict serializable이라고 한다.
- nonserial schedule 이었던 schedule3은 **conflict serializable**이다.

<br>

**ex) 다른 예제, sched.4는 conflict serializable일까?**

![](brain/image/lecture15-15.png)
- 두 스케쥴은 같은 트랜잭션에 대하여 실행하는 것이기에 Conflict equivalent 첫 번째 조건 🟢
- conflicting operations 확인
	- sched.4 : `r1(H) -> w2(H)`, sched.2 : `w2(H) <- r1(H)`
	- 엥! 순서가 역전되어있네. conflict equivalent 하지 않네 !!
- sched.4는 serial schedule인 sched.2와는 conflict equivalent 하지 않은 것 확인

<br>

![](brain/image/lecture15-16.png)
- 두 스케쥴은 같은 트랜잭션에 대하여 실행하는 것이기에 Conflict equivalent 첫 번째 조건 🟢
- conflicting operations 확인
	- sched.4 : `r1(H) -> w2(H)`, sched.1 : `r1(H) -> w2(H)`
	- sched.4 : `r2(H) -> w1(H)`, sched.1 : `w1(H) <- r2(H)`
	- 엥! 순서가 역전되어있네. conflict equivalent 하지 않네 !!
- sched.4는 serial schedule인 sched.1와는 conflict equivalent 하지 않은 것 확인

<br>

결과적으로, sched.4는 serial schedule인 sched.1과 sched.2 둘 중 그 **어떤 serial schedule과도 conflict equivalent 하지 않는다.** ==**그래서 sched.4가 이상한 결과가 나온 것이다. 그 어떤 serial schedule과도 conflict equivalent 하지 않았으니까.**==

![](brain/image/lecture15-17.png)

<br><hr>

### Serializable 구현

==**Conflict Serializable 구현**==
- 여러 transaction을 동시에 실행해도 schedule이 conflict serializable 하도록 보장하는 **프로토콜**을 적용
	- 일단 실행하고나서 conflict serializable 한 지 확인하는 것이 아니라, **아예 conflict serializable한 schedule만 실행될 수 있도록 보장하는 프로토콜을 적용한다는 의미**

<br>

**ex) 여러 트랜잭션이 실행될 때마다 해당 schedule이 conflict serializable인지 확인하면 안됨?**
- 요청이 많이 몰려오면, 동시에 실행될 수 있는 트랜잭션 수가 너무 많음
- 이 많은 트랜잭션이 실행될 때 그 스케쥴이 conflict serializable 한 지 확인하려면 비용이 굉장히 많이 들 것이니까
- 따라서, 이러한 방법은 사용하지 않음

<br>

### 최종정리

어떤 ==schedule==이 어떤 임의의 ==serial schedule==과 ==동일(equivalent)== 하다면 이 schedule은 ==serializable하다 혹은 serializability 속성을 가진다==라고 말함

어떤 ==schedule==이 어떤 임의의 ==serial schedule==과 ==충돌되는 연산 순서가 동일(conflict equivalent)== 하다면 이 schedule은 ==conflict serializable하다 혹은 conflict serializability 속성을 가진다==라고 말함

어떤 ==schedule==이 어떤 임의의 ==serial schedule==과 ==view equivalent== 하다면 이 schedule은 ==view serializable하다 혹은 view serializability 속성을 가진다==라고 말함

<br>

==**concurrency control**== makes any schedule serializable
- 어떤 스케쥴도 serializable 하게 만드는 역할을 수행하는 것이 바로 **동시성 제어**이다.
- 이것과 밀접하게 연관된 트랜잭션의 속성이 바로 **Isolation** 이다.
	- isolation을 너무 엄격하게 지켜서 serializability를 완벽하게 추구하면, 그만큼 동시성이 줄어들어서 성능은 떨어지게 된다.
	- 그래서 이 isolation을 좀 완화시켜서 개발자의 필요에 따라 유연하게 선택할 수 있도록 한 개념이 바로 **isolation level**이다.