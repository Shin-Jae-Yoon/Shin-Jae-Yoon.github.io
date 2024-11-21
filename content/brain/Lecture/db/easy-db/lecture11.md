---
title: "11. stored procedure"
date: "2023-04-23 21:50"
enableToc: true
tags: [""]
weight: 12
---

유튜버 인코드 님의 <a href='https://www.youtube.com/@ez./playlists' target='_blank'>데이터베이스</a> 강의를 정리한 내용

<hr>

## Stored procedure

==**Stored procedure : 사용자가 정의한 프로시저**==
- RDBMS에 저장되고 사용되는 프로시저
- 구체적인 하나의 태스크(task)를 수행한다.
- [stored function](brain/Lecture/db/easy-db/lecture10.md)과는 다르다.

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

<br>

그러나, 실무에서 stored procedure를 사용하는 일은 잘 없다. 이는 [다음](brain/Lecture/db/easy-db/lecture12.md)에서 확인하자.