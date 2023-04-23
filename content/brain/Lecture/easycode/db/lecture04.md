---
title: "04. Data 추가/수정/삭제"
date: "2023-04-21 16:39"
enableToc: true
tags: [""]
weight: 5
---

유튜버 쉬운코드 님의 <a href='https://www.youtube.com/@ez./playlists' target='_blank'>데이터베이스</a> 강의를 정리한 내용

<hr>

## 데이터 다루기

[이전 강의](brain/Lecture/easycode/db/lecture03)에서 DB를 만들었으니 이제 다뤄보자.

<br>

### 데이터 추가

<br>

![](brain/image/lecture04-6.png)

<br>

```sql
INSERT INTO 테이블명 VALUES (값1, 값2, 값3, ...);
```

- 테이블을 정의할 때 attribute의 순서대로 데이터를 넣어줘야 함
- 테이블에 정의된 모든 attribute에 값을 넣어야 함
	- null이 허용되어있으면 임시로 null이라도 넣어야 함

<br>

```sql
INSERT INTO 테이블명 VALUES (속성이름1, 속성이름2, ...) INTO ('값1', '값2', ... );
```

- 테이블에 값을 넣는 attribute의 순서에 자유도가 생겼음
- 넣고 싶은 attribute에만 값을 넣을 수 있음
	- 빈 곳에는 DEFAULT값이 있으면 DEFAULT, 없으면 NULL이 들어감

<br>

```sql
INSERT INTO 테이블명 VALUES (값1, 값2, 값3, ...), (값1, 값2, 값3, ...), ...;
```

- 위 두개는 한 번에 하나의 데이터(튜플)을 넣는 것인데 이거는 한 번에 여러 데이터를 넣는것

![](brain/image/lecture04-7.png)

<br>

**데이터 조회 맛보기**

```sql
SELECT 속성 FROM 테이블명;
SELECT * FROM 테이블명;
테이블명에 있는거 전부 가져오기
```

<br>

<hr>

### 데이터 수정

<br>

```sql
UPDATE 테이블명 
SET 속성1 = 값1 
[WHERE 조건];
```

<br><br>

**ex) 개발팀 (dept_id가 1003)의 연봉을 2배 인상하려고 한다면?**

```sql
UPDATE employee
SET salary = salary * 2
WHERE dept_id = 1003;
```

<br><br>

**ex) 프로젝트 ID 2003에 참여한 임직원의 연봉을 2배 인상하려고 한다면?**

![](brain/image/lecture04-8.png)

```sql
UPDATE employee, works_on
SET salary = salary * 2;
WHERE id = empl_id and proj_id = 2003;
```

- `id = empl_id` 부분이 두 `employee`와 `works_on` 테이블을 연결시키는 부분

<br>

```sql
UPDATE employee, works_on
SET salary = salary * 2;
WHERE employee.id = works_on.empl_id and works_on.proj_id = 2003;
```

- 근데 직관적이지 않아서 `테이블명.속성`의 형태로 바꿔줬음

<br>

<hr>

### 데이터 삭제

<br>

```sql
DELETE FROM 테이블명
[WHERE 조건];
```

- WHERE 절이 없으면 테이블의 모~든 튜플이 사라지는거라서 주의하자.

<br><br>

**ex) John이 퇴사해서 employee 테이블에서 John 정보 삭제해야함**
- John의 employee ID = 8, 현재 John은 project 2001에 참여 중

<br>

![](brain/image/lecture04-9.png)

```sql
DELETE FROM employee WHERE id = 8;
```

- 그렇다면 `WORKS_ON` 테이블에서도 따로 지워야할까?

<br>

![](brain/image/lecture04-10.png)

- `WORKS_ON` 테이블의 설정이 CASCADE로 되어있어서 `employee` 테이블만 지워도 반영됨

<br><br>

**ex) Dingyo가 두 개의 프로젝트 참여 중인데 하나에서 빠지기로 했으면?**

```sql
DELETE FROM works_on WHERE impl_id = 5 and proj_id = 2002;
```

<br><br>

**ex) Dingyo가 2001 프로젝트만 집중하고 나머지는 다 빠지려면?**

```sql
DELETE FROM works_on WHERE impl_id = 5 and proj_id <> 2001;
```

- `<>` 이것은 제외한다는 의미!! , `!=` 이거랑 동일한 표현

<hr>

## 예제

### 데이터 추가 오류

![](brain/image/lecture04-2.png)

- PK 중복되니까 에러발생

![](brain/image/lecture04-3.png)

- CHECK 조건에서 연봉이 5천만원 이상이라고 했었으니까 에러 발생

![](brain/image/lecture04-4.png)

- `SHOW CREATE TABLE 테이블명;`으로 테이블 만들어진거 확인 가능

![](brain/image/lecture04-5.png)

- 아직 FOREIGN KEY가 없는데 `111`로 추가해버렸으니까
- `a foreign key constraint falis`는 참조 무결성 제약조건 위배를 의미
	- 참조하는 값이 **실제로 그 테이블에 있을 때에만 값을 지정**할 수 있음

