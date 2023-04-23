---
title: "11. stored procedure"
date: "2023-04-23 21:50"
enableToc: true
tags: [""]
weight: 12
---

유튜버 쉬운코드 님의 <a href='https://www.youtube.com/@ez./playlists' target='_blank'>데이터베이스</a> 강의를 정리한 내용

<hr>

## Stored procedure

==**Stored procedure : 사용자가 정의한 프로시저**==
- RDBMS에 저장되고 사용되는 프로시저
- 구체적인 하나의 태스크(task)를 수행한다.
- [stored function](brain/Lecture/easycode/db/lecture10)과는 다르다.

```sql
> DELIMITER $$

> CREATE PROCEDURE 이름(IN 파라미터 타입, OUT 파라미터 타입, INOUT 파라미터 타입) 
> BEGIN
> 	수행할 것
> END
> $$

> DELIMITER ;
```

- ==**IN**== : 값을 파라미터로 전달받을 수 있지만, 값을 바꿀 수 없음
- ==**OUT**== : 호출 당시 값을 전달받을 필요는 없고, 최종적으로 값을 반환할 때 사용
- ==**INOUT**== : 값을 전달받을 수 있으면서도, 동시에 값을 반환하는 역할도 가능
	- 파라미터는 default로 IN으로 동작함
	- 따라서, **IN** 키워드는 생략해도 되지만, **OUT** 키워드는 반드시 작성해야함

<br>

**stored procedure 특징**
- 이외에도 조건문을 통해 분기처리 가능
- 반복문 수행 가능
- 에러를 핸들링하거나 예외를 일으키는 등의 다양한 로직 정의 가능

<br>

### 예제

**ex) 두 정수의 곱셈 결과를 가져오는 프로시저를 작성해보자**

![](brain/image/lecture11-1.png)

<br><br>

**ex) 두 정수를 맞바꾸는 프로시저를 작성해보자**

![](brain/image/lecture11-2.png)

![](brain/image/lecture11-3.png)

<br><br>

**ex) 각 부서별 평균 연봉을 가져오는 프로시저를 작성해보자**

![](brain/image/lecture11-4.png)

![](brain/image/lecture11-5.png)

<br><br>

**ex) 사용자가 프로필 닉네임을 바꾸면 이전 닉네임을 로그에 저장하고 새 닉네임으로 업데이트하는 프로시저를 작성해보자**

![](brain/image/lecture11-6.png)

![](brain/image/lecture11-8.png)

- `now()`는 현재시간, 업데이트 되는 시간을 위해서 가져왔음

![](brain/image/lecture11-9.png)

<br>

<hr>

### function과의 차이

==**stored procedure**== vs ==**stored function**==

![](brain/image/lecture11-10.png)

- 이외에도 ...
	- 내부적으로 다른 function/procedure를 호출할 수 있는지
	- resultset( = table)을 반환할 수 있는지
	- precompiled execution plan을 만드는지
		- 조금더 효율적으로 실행될 수 있도록 미리 컴파일할 수 있는지를 말하는거
	- try-catch를 사용할 수 있는지
	- 등등 ...

<br><br>

**와닿지 않느다면 예시를 봐보자.**

**stored procedure**

 ![](brain/image/lecture11-11.png)
- 반드시 OUTPUT 파라미터를 통해서 결과값 반환해야함

**stored function**

![](brain/image/lecture11-12.png)
- 반드시 RETURN 키워드를 통해서 반환해야함

 ![](brain/image/lecture11-13.png)
- function이면 이렇게 SQL문에 사용 가능

<br><br>

<hr>

## 실무에서는?

### 3-tier architecture

==**최근 실무**==에서는 client-server architecture의 한 종류인 ==**3-tier architecture 모델로 서비스를 개발함**==

![](brain/image/lecture11-14.png)

<br>

**Logic tier**
- ==**비즈니스 로직이란?**==
	- ex) 당근마켓의 비즈니스 로직
	- 회원 가입 / 탈퇴
	- 상품 리스트업 알고리즘
	- 상품 정보 업로드 기능
	- 상품 검색 기능
	- 메시지 기능
	- etc ...

<br>

**Data tier**
- ==**데이터?**==
	- ex) 당근마켓의 데이터
	- 회원 정보
	- 상품 정보
	- 판매 / 구매 내역
	- 지역 정보
	- etc ...

<br>

![](brain/image/lecture11-15.png)

- 즉, stored procedure를 사용한다는 것은 data tier에 비즈니스 로직이 생기게 된다는 의미이다.
- data tier에 비즈니스 로직이 생기게 된다는 것은 어떤 장/단점이 있을까 ??

<br><hr>

### stored procedure 장점

- Application에 투명(transparent)하게 동작할 수 있다.
- Network traffic을 줄여서 응답 속도를 향상시킬 수 있다.
- 여러 서비스에서 재사용 가능하다.
- 민감항 정보에 대한 접근을 제한할 수 있다.

<br><hr>

**ex) stored procedure를 사용하지 않고 Logic tier에서만 비즈니스 로직을 관리한다고 생각해보자.**

![](brain/image/lecture11-16.png)

- 비즈니스 로직을 수정할 일이 생겼고, 현재 서버는 트래픽을 받고 있는 상황이다.
- 이제 배포해야하니까 컴파일시키고 배포파일 만든 이후에 기존의 인스턴스는 내리고 새로운 인스턴스를 띄워야 한다.
	- 하지만, 동시에 모두 서버 애플리케이션을 껐다 키면 안된다. 트래픽을 받고 있는 상황이라 바꿔주는 동안 트래픽을 처리할 수 없다.
	- 따라서, 나눠서 처리해야한다.
- 하나 바꾸고 재가동, 하나 바꾸고 재가동... **비즈니스 로직을 수정할 일이 있을 때마다, 컴파일 새로하고, 빌드해서 배포 파일 만들고, 한대 한대씩 재가동 하는 것은 귀찮아 보인다.**

<br>

**ex) 하지만, 이 비즈니스 로직이 stored procedure를 이용하여 관리된다면 어떻게 될까?**

![](brain/image/lecture11-17.png)

- Logic tier에서는 프로시저를 호출만 하고 있으니까, 서버 애플리케이션 쪽은 바꿀 필요 없음
- Data tier에 프로시저만 쏙 바꾸면 되는거다.

<br>

transparent 하다는 의미는, 뭔가를 바꿔도 바뀌기 전에 사용하고 있던 부분들은 바꾸지 않고도 내용을 바꿀 수 있다는 의미이다. ==**따라서, stored procedure는 application에 대해서 transparent 할 수 있다는 장점이 있는 것이다.**==

<br><hr>

**ex) stored procedure를 사용하지 않고 Logic tier에서만 비즈니스 로직을 관리한다고 생각해보자.**

![](brain/image/lecture11-18.png)

- 스프링 서버와 DB 서버는 다른 서버이기 때문에 쿼리문마다 호출해야 한다.
- 요청을 보내는 순간 **네트워크 트래픽이 발생**

<br>

**ex) 하지만, 이 비즈니스 로직이 stored procedure를 이용하여 관리된다면 어떻게 될까?**

![](brain/image/lecture11-19.png)

- 어차피 비즈니스 로직이 DB 서버에서 처리되기 때문에 프로시저를 호출만 하면 된다.
- 네트워크 트래픽이 한 번만 왔다갔다 하면 된다.
- ==**따라서, Network traffic을 줄여서 응답 속도를 향상시킬 수 있다는 장점이 있다.**==

<br><hr>

**ex) DB에 저장되어있는 data를 이용하는 서비스가 3개 있다고 하자.**

![](brain/image/lecture11-21.png)

- 각 서비스는 Java, Python, Javascript 각각으로 비즈니스 로직을 구현해야함

![](brain/image/lecture11-22.png)

- ==**stored procedure를 쓰면 여러 서비스에서 재사용 가능하다는 장점이 있다.**==

<br><hr>

**ex) 회사 내의 개발자나 임직원이 DB에 접근하는 것을 막는 경우**
- 예를 들어, 사용자의 주민등록번호, 신용카드 정보 등등 민감한 정보에 접근을 막는 경우
- 하지만, 개발자가 개발은 해야하는 상황

![](brain/image/lecture11-23.png)
- 개발자가 프로시저에 접근하는 것은 허용함으로써, ==**직접적인 접근은 막고 비즈니스 로직은 구현할 수 있도록 해주는 것이 stored procedure의 장점!!**==

<br>

<hr>

### stored procedure 단점

- 유지 관리 보수 비용이 커진다.

<br><hr>

**ex) Logic tier에도 비즈니스 로직, Data tier에도 비즈니스 로직이 있는 경우**

![](brain/image/lecture11-24.png)

- **Logic tier 봤다가~ Data tier 봤다가~** 왔다갔다 힘듦
- **소스 코드의 버전 관리도 해야하고, 프로시저의 버전 관리**도 해야함
- 원래는 소스코드만 관리하면 되니까, 여기에서는 Java만 알면 되는데, **프로시저의 문법도 알아야함**
- 만약, 신규 기능 개발시 이에 대한 비즈니스 로직을 프로시저로 개발한다고 하자.
	- 프로시저쪽 코드도 수정
	- 애플리케이션쪽에 호출하는 소스코드도 수정
	- 컴파일, 배포 등 다시 다해야함

