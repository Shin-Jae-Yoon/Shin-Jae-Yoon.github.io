---
title: "08. Join"
date: "2023-04-21 23:25"
enableToc: true
tags: [""]
weight: 9
---

유튜버 쉬운코드 님의 <a href='https://www.youtube.com/@ez./playlists' target='_blank'>데이터베이스</a> 강의를 정리한 내용

<hr>

## Join

<br>

==**SQL에게 JOIN이란?**==
- 두 개 이상의 table들에 있는 데이터를 한 번에 [조회](brain/Lecture/easycode/db/lecture05)하는 것
- 여러 종류의 JOIN 존재

<br><br>

**ex) ID가 1인 임직원이 속한 부서 이름은?**

![](brain/image/lecture08-1.png)

- `employee` 테이블 만으로는 알 수 없어서 `department` 테이블와 연결해야함
- 이걸 join이라고 함

<br>

<hr>

### Implict vs Explicit

<br>

==**Implicit join (암시적 조인)**==

```sql
SELECT D.name
FROM employee AS E, department AS D
WHERE E.id = 1 and E.dept_id = D.id;
```

- **from 절에는 table 들만 나열하고 where 절에 join condition을 명시하는 방식**
- old-style join syntax
- where 절에 select condition과 join condition이 같이 있기 때문에 가독성 떨어짐
- 복잡한 join 쿼리를 작성하다 보면 실수로 잘못된 쿼리를 작성할 가능성이 큼

<br><br>

==**Explicit join (명시적 조인)**==

```sql
SELECT D.name
FROM employee AS E JOIN department AS D ON E.dept_id = D.id;
WHERE E.id = 1;
```

- from 절에 ==**JOIN**== 키워드와 함께 joined table 들을 명시하는 방식
- from 절에 ==**ON**== 뒤에 join condition이 명시
	- `employee` 테이블이 `department` 테이블에 조인한다.
	- 어떤 조건으로? `E.dept_id = D.id`인 조건으로!
- 가독성이 좋음
- 복잡한 join 쿼리 작성 중에도 실수할 가능성이 적음

<br>

<hr>

### Inner join

<br>

==**Inner join (내부 조인)**== : **두 table에서 join condition을 만족하는 tuple 들로 result table을 만드는 join**

![](brain/image/lecture08-4.png)

```sql
// INNER 생략 가능, 그냥 join이라고 하면 inner join임
// ON 없으면 cross join이다. 주의하자

FROM table1 [INNER] JOIN table2 ON join_condition
```

- join condition에 사용 가능한 연산자(operator) : `=, <, >, !=` 등등 여러 비교 연산자 가능
- join condition에서 **null 값을 가지는 tuple은 result table에 포함되지 못함**

<br>

**ex) INNER JOIN**

![](brain/image/lecture08-2.png)

![](brain/image/lecture08-3.png)

- 매칭이 안된 `employee` 테이블의 SIMON과 `department` 테이블의 1002는 매칭이 안돼서 `join 된 테이블`의 결과에 없음

<br>

<hr>

### Outer join

==**Outer join (외부 조인)**== : **두 table에서 join condition을 만족하지 않는 tuple 들도 result table에 포함하는 join**

![](brain/image/lecture08-5.png)

```sql
// OUTER 생략 가능
FROM table1 LEFT [OUTER] JOIN table2 ON join_condition
FROM table1 RIGHT [OUTER] JOIN table2 ON join_condition
FROM table1 FULL [OUTER] JOIN table2 ON join_condition
```

- join condition에 사용 가능한 연산자(operator) : `=, <, >, !=` 등등 여러 비교 연산자 가능
- MySQL은 FULL OUTER JOIN 지원 x
	- LEFT JOIN과 RIGHT JOIN을 UNION해서 사용해야함

<br><br>

**ex) LEFT OUTER JOIN**

![](brain/image/lecture08-6.png)

![](brain/image/lecture08-7.png)

- LEFT인 `employee` 테이블에서 join condition을 만족하지 않는 튜플들도 함께 포함시킴
	- 그래서 `joined table`에 SIMON이 포함되어있음

<br><br>

**ex) RIGHT OUTER JOIN**

![](brain/image/lecture08-8.png)

![](brain/image/lecture08-9.png)

- RIGHT인 `department` 테이블에서 join condition을 만족시키지 않는 튜플들도 함께 포함시킴
	- 그래서 `joined table`에 HR이 포함되어있음

<br><br>

**ex) FULL OUTER JOIN**
- MySQL이 FULL OUTER JOIN 지원 안해서 PostgreSQL로 했음

![](brain/image/lecture08-10.png)

![](brain/image/lecture08-11.png)

- `joined table`에 SIMON, HR 다 있음

<br>

<hr>

### equi join

- join condition에서 `=` (equality comparator)를 사용하는 join

![](brain/image/lecture08-12.png)

- 1번째는 INNER JOIN 이면서도 equi join
- 2~4번째는 OUTER JOIN 이면서도 equi join

<br>

==**equi join에 대한 두 가지 시각**==
- inner join, outer join 상관없이 `=`를 사용한 join이라면 equi join으로 보는 경우
- inner join으로 한정해서 `=`를 사용한 경우에 equi join으로 보는 경우

<br>

<hr>

### using

<br>

==**USING**== : **두 table이 equi join 할 때 join 하는 attribute의 이름이 같다면, USING으로 간단하게 작성 가능** 

```sql
FROM table1 [INNER] JOIN table2 USING (attributes)
FROM table1 LEFT [OUTER] JOIN table2 USING (attributes)
FROM table1 RIGHT [OUTER] JOIN table2 USING (attributes)
FROM table1 FULL [OUTER] JOIN table2 USING (attributes)
```

- 같은 이름의 attribute는 result table에서 한 번만 표시됨

<br><br>

**ex) JOIN 하는 테이블끼리 속성명이 동일한 경우 - USING 사용 X**

![](brain/image/lecture08-13.png)

- 속성명도 동일, 결과값도 동일한데 이렇게 적을 필요가 있나? -> USING 써보자

<br><br>

**ex) JOIN 하는 테이블끼리 속성명이 동일한 경우 - USING 사용 O**

![](brain/image/lecture08-14.png)

- USING으로 묶은건 맨 앞으로 빠진다.
	- 아마 둘 중 어느 테이블에도 속해있지 않은 속성이라고 구분하는 느낌같음

<br>

<hr>

### natural join

<br>

==**NATURAL JOIN (자연 조인)**== : **두 table에서 같은 이름을 가지는 모든 attribute pair에 대해서 equi join을 수행**

```sql
FROM table1 NATURAL [INNER] JOIN table2
FROM table1 NATURAL LEFT [OUTER] JOIN table2
FROM table1 NATURAL RIGHT [OUTER] JOIN table2
FROM table1 NATURAL FULL [OUTER] JOIN table2
```

- join condition을 따로 명시하지 않음

<br><br>

**ex) NATURAL INNER JOIN - 같은 속성 1개**

![](brain/image/lecture08-15.png)

![](brain/image/lecture08-16.png)

- 두 테이블에서 같은 attribute인 `dept_id`가 equi join 되었음
- INNER JOIN이니까 SIMON이나 HR이 보이지 않음

<br><br>

**ex) NATURAL INNER JOIN - 같은 속성 여러개**

![](brain/image/lecture08-17.png)

![](brain/image/lecture08-18.png)

- NATURAL INNER JOIN -> USING -> ON 이렇게 바꿔도 모두 동일한 표현
- 근데, 결과가 Empty set이다. 왜 그런지 한번 보도록 하자.

```sql
// 자연 내부 조인
SELECT * FROM employee E
NATURAL INNER JOIN department D;

// 내부조인 + USING 사용
SELECT * FROM employee E
INNER JOIN department D
USING (dept_id, name);

// 내부조인 + ON 사용 (기본)
SELECT * FROM employee E
INNER JOIN department D
ON E.dept_id = D.dept_id
AND E.name = D.name;
```

- `E.dept_id = D.dept_id` 부서 이름은 같을 수 있음
- `E.name = D.name` 사람 이름과 부서 이름이 같을 일은 거~의 없겠네
	- 그래서 아무런 결과를 반환하지 못할 것

<br>

<hr>

### cross join

==**CROSS JOIN (상호 조인)**== : **두 table의 tuple pair로 만들 수 있는 모든 조합( = 카테시안 곱, Cartesian product)을 result table로 반환**

![](brain/image/lecture08-19.png)

```sql
// implicit cross join
FROM table1, table2

// explicit cross join
FROM table1 CROSS JOIN table2
```

- join condition이 따로 없음

<br><br>

**ex) explicit CROSS JOIN**

![](brain/image/lecture08-20.png)

![](brain/image/lecture08-21.png)

<br><br>

**ex) implicit CROSS JOIN**

![](brain/image/lecture08-22.png)

- explicit와 동일한 결과 나옴

<br>

<hr>

### MySQL Join

1. MySQL에서는 ==**FULL OUTER JOIN**==을 지원하지 않는다.
	- LEFT JOIN과 RIGHT JOIN을 UNION해서 사용해야함

2. MySQL에서는 **`cross join = inner join = join`** 이다.
	- 원래는 **cross join**에 join condition이 따로 없으니까 `ON or USING`을 쓰면 안되는데 MySQL에서는 된다.
	- **cross join**에 `ON or USING`을 같이 쓰면 **inner join**으로 동작함
	- **inner join (or join)** 이 `ON or USING` 없이 사용된다면 **cross join**으로 동작함

<br>

> 정리하자면, <br>
> ON (or USING) 같이 쓰면 -> **INNER JOIN ( = JOIN)** <br>
> ON (or USING) 안쓰면 -> **CROSS JOIN**


<br>

<hr>

### self join

==**SELF JOIN (자체 조인)**== : **table이 자기 자신에게 join 하는 경우**

![](brain/image/lecture08-23.png)

```sql
FROM table1 INNER JOIN table1
```

- 별도의 문법이 있는 것은 아니고 1개로 조인하면 자체 조인이 됨

<br>

<hr>

## 예제

**ex) ID가 1003인 부서에 속하는 임직원 중 리더를 제외한 부서원의 ID, 이름, 연봉**

![](brain/image/lecture08-24.png)

<br><br>

**ex) ID가 2001인 프로젝트에 참여한 임직원들의 이름과 직군과 소속 부서 이름**

![](brain/image/lecture08-25.png)

- FROM 절
	- `works_on` 테이블을 `employee` 테이블에 **내부 조인** 걸었음
		- 어떤 프로젝트에 어떤 임직원이 참여했는지 정보 + 임직원의 정보
	- `result` 테이블에서 `department` 테이블로 **왼쪽 외부 조인** 걸었음
		- 소속부서의 이름을 알아내야 하기 때문에 !
		- left join인 이유는 `E.dept_id = D.id` join condition 때문에 그럼
			- 혹시나 임직원이 부서 배정 전이라 null 일 경우를 대비
- WHERE 절
	- id가 2001인 프로젝트니까 !