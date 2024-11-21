---
title: "07. three-valued logic"
date: "2023-04-21 22:57"
enableToc: true
tags: [""]
weight: 8
---

유튜버 쉬운코드 님의 <a href='https://www.youtube.com/@ez./playlists' target='_blank'>데이터베이스</a> 강의를 정리한 내용

<hr>

## three-valued logic

### NULL의 의미

==**SQL에서 NULL의 의미**== : SQL [조회](brain/Lecture/db/easy-db/lecture05.md)에서는 다양한 의미를 하나의 NULL로 표시

- unknown
	- 알려지지 않음
	- ex) 누군가의 생일이 NULL이라고 하면 생일은 무조건 있을테니 아직 알려지지 않음을 의미
- unavailable or withheld
	- 공개하지 않음, 이용 불가능함
	- ex) 민감한 개인 정보라서 공개하지 않아서 이용 못함
- not applicable
	- 해당사항 없음
	- ex) 집전화가 없는 경우

![](brain/image/lecture07-1.png)

![](brain/image/lecture07-2.png)

- id가 14와 15인 아이의 생일이 같다고 할 수 있을까?
	- NULL은 여러 의미가 있어서 같은지 다른지 단정할 수 없다.
	- 그래서 아무것도 가지고 오지 않는다.
	- 생일이 NULL인게 아무것도 없다는 말이 아니다!!
- 따라서, NULL과 비교하기를 원할 때는 동등 연산자를 사용하면 안된다.

<br>

### IS

==**IS**==
- NULL인지 비교할 때 사용하는 비교 연산자
- NULL이 아닌 녀석을 찾으려면 ==**IS NOT**== 사용

![](brain/image/lecture07-3.png)

<br>

### NULL과 three-valued

- NULL과 비교했을 때 결과가 어떻게 될까?
- 어느 한쪽에 NULL이 있다면 결과는 무조건 UNKNOWN
	- 이건 <a href=/brain/Lecture/easycode/db/lecture07/#unknown-연산결과>아래</a>에서 확인

<br>

==**NULL과 SQL three-valued logic**==

![](brain/image/lecture07-5.png)

- SQL에서 NULL과 비교 연산을 하게 되면 그 결과는 ==**UNKNOWN**==이다.
- ==**UNKNOWN**==은 "TRUE 일 수도 있고 FALSE 일 수도 있다"는 의미
- ==**three-valued logic**== : 비교/논리 연산의 결과로 ==**TRUE, FALSE, UNKNOWN**==을 가짐

<br>

![](brain/image/lecture07-4.png)

- NULL이 1990년 3월 9일과 같은지 아닌지는 모르는 상태이다.
- 그래서 id가 14, 15인 녀석의 결과는 UNKNOWN이다.

<br>

### UNKNOWN 연산결과

==**AND, OR, NOT은 어떻게 되나?**==

![](brain/image/lecture07-6.png)

- AND
	- TRUE + UNKNOWN = UNKNOWN (TRUE 일 수도, FALSE 일 수도 있으니까)
	- FALSE + UNKNOWN = FALSE (무조건 FALSE 이니까)
	- UNKNOWN + UNKNOWN = UNKNOWN (UNKNOWN 일 수도, FALSE 일 수도 있으니까)
- OR
	- TRUE + UNKNOWN = TRUE
	- FALSE + UNKNOWN = UNKNOWN
	- UNKNOWN + UNKNOWN = UNKNOWN
- NOT
	- UNKNOWN의 NOT은 TRUE 일 수도 FALSE 일 수도 = UNKNOWN

<br>

==**왜 이 결과가 중요할까?**==
- **WHERE 절에 있는 condition(s)의 결과가 TRUE인 tuple(s)만 선택**된다.
- 즉, **결과가 FALSE거나 UNKNOWN이면 tuple은 선택되지 않는다.**

<br>

### NOT IN 주의사항

==**NOT IN 사용 시 주의사항**==
- ==**v NOT IN (v1, v2, v3)**==는 아래와 같은 의미이다.
	- `v != v1 AND v != v2 AND v != v3`
- 그렇다면, 만약 v1, v2, v3 중 하나가 NULL이라면?

<br>

![](brain/image/lecture07-7.png)
- 마지막을 살펴보자.
- `3 != 1 AND 3 != 2 AND 3 != NULL`
- `TRUE and TRUE and UNKNOWN = UNKNOWN`

<br><br>

**ex) 2000년대 생이 없는 부서의 ID와 이름**

![](brain/image/lecture07-9.png)

- 공교롭게도 아직 부서를 배치받지 않아 부서의 id에 NULL이 있다면?
- `D.id`가 어떤 값이라고 할지라도 무조건 FALSE 아니면 UNKNOWN이다.
- WHERE 절은 TRUE인 경우에만 tuple을 선택한다고 했는데 어떤 경우에도 TRUE가 절대로 나올 수 없으니까 SELECT 문이 반환하는 결과는 아무것도 없음.

<br>

==**이 문제를 해결하는 방법**==

1. 애초에 `employee` 테이블에서 `dept_id`가 NULL을 가지지 못하게 NOT NULL 처리

2. 서브쿼리에서 `dept_id`가 NOT NULL인 경우 체크

![](brain/image/lecture07-10.png)

3. `NOT IN`을 `NOT EXISTS`로 바꿔서 처리

![](brain/image/lecture07-11.png)

