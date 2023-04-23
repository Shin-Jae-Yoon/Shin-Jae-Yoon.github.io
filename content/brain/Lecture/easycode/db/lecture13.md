---
title: "13. trigger"
date: "2023-04-24 02:09"
enableToc: true
tags: [""]
weight: 14
---

유튜버 쉬운코드 님의 <a href='https://www.youtube.com/@ez./playlists' target='_blank'>데이터베이스</a> 강의를 정리한 내용

<hr>

## Trigger

Trigger의 사전적 의미
- (총의) 방아쇠
- (반응사건을 유발한) 계기, 도화선
- 촉발시키다 ( = set off)
- 작동시키다 ( = set off)

==**SQL에서 Trigger**==
- 데이터베이스에서 어떤 이벤트가 발생했을 때 자동적으로 실행되는 [프로시저(procedure)](brain/Lecture/easycode/db/lecture11)
- ==**데이터에 변경이 생겼을 때, 즉 DB에 insert, update, delete가 발생했을 때 이것이 계기가 되어 자동적으로 실행되는 프로시저(procedure)를 의미**==
	- 트리거는 데이터의 변경 이력, 히스토리 같은 곳에 사용되면 좋을듯!
	- 트리거는 테이블에서 변화가 일어날 때마다 통계를 계산하고 싶을 때 쓰면 좋을 듯!
	- 근데 개인적으로.. 트리거는 유지보수가 너무 힘드니 최후의 보루로 남겨두도록...

```sql
> DELIMITER $$

> CREATE TRIGGER 트리거이름
> 언제 업데이트
> 어떤 테이블
> BEGIN
> 	수행할 것
> END
> $$

> DELIMITER ;
```

<br>

### 예시 - OLD 키워드

**ex) 사용자의 닉네임 변경 이력을 저장하는 트리거를 작성해보자**

![](brain/image/lecture13-1.png)

- 업데이트라는 이벤트가 발생하게 되면, 무언가를 트리거 시킨다.
- 뭘 트리거 시키냐? 뭘 촉발시키냐?
	- 기존의 닉네임을 `USERS_LOG` 테이블에 저장하는 그 액션을 촉발시킴

![](brain/image/lecture13-2.png)

<br>

![](brain/image/lecture13-3.png)

- 어떤 이벤트에 대해서 트리거 발생? -> 사용자의 닉네임에 `UPDATE`가 발생할 때마다
- 업데이트 이전에 액션을 취하게 할거라서 `BEFORE`
- `ON users` : 어떤 테이블? users 테이블~
- `FOR EACH ROW` : 업데이트가 되는 각 ROW 마다 이 트리거를 실행
- `BEGIN ~ END` 사이의 BODY 부분이 **트리거가 취하는 액션**
- ==**OLD 키워드**==
	- 시점이 `BEFORE UPDATE`라면
		- update 되기 이전의 tuple을 가리킴
	- 시점이 `BEFORE DELETE`라면
		- delete 된 tuple을 가리킴

![](brain/image/lecture13-5.png)

- 과연 트리거가 잘 동작했을까 ?

![](brain/image/lecture13-6.png)

- 잘 됐네~
- 트리거는 ==**데이터의 변경 이력, 히스토리 같은 곳에 사용되면 좋을듯!**==

<br><hr>

### 예시 - NEW 키워드

**ex) 사용자가 마트에서 상품을 구매할 때마다 지금까지 누적된 구매 비용을 구하는 트리거를 작성해보자**

![](brain/image/lecture13-7.png)

- 2000원 + 5000원의 결과가 최종적으로 업데이트되는 트리거를 만들어보자는 의미

<br>

![](brain/image/lecture13-8.png)

- 어떤 이벤트에 대해서 트리거 발생? -> `INSERT` 이벤트 할 때마다
- insert 이후에 액션을 취하게 할거라서 `AFTER`
- `ON buy` : 어떤 테이블? buy 테이블~
- `FOR EACH ROW` : INSERT 되는 각 ROW 마다 이 트리거를 실행
- ==**NEW 키워드**==
	- 시점이 `AFTER INSERT`라면
		- insert된 tuple을 가리킴
	- 시점이 `AFTER INSERT`라면
		- update된 후의 tuple을 가리킴

![](brain/image/lecture13-9.png)

![](brain/image/lecture13-10.png)

오키 하나 더 사보자

![](brain/image/lecture13-11.png)

![](brain/image/lecture13-12.png)

- 트리거는 ==**테이블에서 변화가 일어날 때마다 통계를 계산하고 싶을 때 쓰면 좋을 듯!**==

<br><hr>

### 예제 - 한 번에 감지

- update, insert, delete 등을 한 번에 감지하도록 설정 가능
- MySQL은 불가능, 실습은 PostgreSQL로 진행

**ex) 임직원의 평균 연봉을 구하는 트리거 만들어보자.**
- 임직원이 새로 들어오든, 나가든, 연봉이 업데이트되든 등등

<br>

![](brain/image/lecture13-13.png)

- 그런데 여기서 `FOR EACH ROW`는 문제가 있다.

![](brain/image/lecture13-14.png)

- 이는 employee 테이블에서 부서 id가 1003인 임직원들의 연봉을 모두 1.5배 올려주는 것
- 만약, 임직원이 5명이라면 `FOR EACH ROW`로 트리거를 작성했기 때문에 **트리거가 총 다섯 번 실행하게 된다.**
- 이렇게 트리거가 tuple마다 발생하는 것은 굉장히 비효율적 동작
- update문이 실행됐을 때 트리거가 한 번만 실행되게 하려면 어떻게 바꾸지?

![](brain/image/lecture13-15.png)

- ==**FOR EACH STATEMENT**==
- ==**row 단위가 아니라 statement 단위로 trigger가 실행될 수 있도록 한다.**==
	- 단, MySQL은 `FOR EACH STATEMENT` 사용 불가능

<br><hr>

### 예제 - 조건 WHEN

- trigger를 발생시킬 디테일한 조건을 지정할 수 있다.
	- 단, MySQL은 불가능

<br>

**ex) 사용자가 닉네임을 변경할 때마다 닉네임의 히스토리를 저장하는 트리거**

![](brain/image/lecture13-16.png)

- `WHEN` 키워드를 이용하여 디테일한 조건을 걸어서 트리거가 실행되도록 할 수 있음

<br><hr>

## Trigger 주의사항

- 트리거는 가시적이지 않아서, 개발도, 관리도, 문제 파악도 힘들어짐
- 지나치게 많이 사용하면 파악하기 힘들어짐
- 과도한 트리거 사용은 DB에 부담을 주고 응답을 느리게 만듦
- 디버깅이 어려움
- 문서 정리가 특히나 중요함


<br><hr>

### 가시적이지 않음

==**트리거는 소스 코드로는 발견할 수 없는 로직이기 때문에, 어떤 동작이 일어나는지 파악하기 어렵고 문제가 생겼을 때 대응하기 어렵다.**==

![](brain/image/lecture13-19.png)

- 웹 애플리케이션 서버에서는 트리거의 존재를 파악하기 힘들다.
- 웹 애플리케이션 서버는 소스 코드를 기반으로 동작하는 것인데 트리거는 RDBMS에서 바로 등록되어서 사용되는 것이고, DB에 어떤 이벤트가 발생했을 때 그 이벤트가 트리거가 되어 실행되는 로직이기 때문이다.
	- 소스 코드 상에서 직접 호출하는 로직이 아니다.
- 프로시저는 소스 코드 상에 호출하는 부분이라도 있지... 트리거는 아니다.

<br><hr>

### 지나친 사용

![](brain/image/lecture13-20.png)

==**지나치게 많은 트리거를 사용하게 되면, 트리거가 또 다른 트리거를 발생하고 또 다른 트리거를 발생시켜 연속적인 트리거가 발생하여 파악하기 힘들게 된다.**==