---
title: "05. Data 조회"
date: "2023-04-21 17:29"
enableToc: true
tags: [""]
weight: 6
---

유튜버 쉬운코드 님의 <a href='https://www.youtube.com/@ez./playlists' target='_blank'>데이터베이스</a> 강의를 정리한 내용

<hr>

## 데이터 조회

### SELECT

<br>

```sql
SELECT 속성 FROM 테이블명 [WHERE 조건];
```

<br>

```sql
SELECT name, position FROM employee WHERE id = 9;
```

- **selection condition : 조건을 명시해주는 것**
	- `WHERE id = 9;`
- **projection condition : 관심있어 하는 속성 리스트**
	- `SELECT name, position`

<br><br>

**ex) project 2002를 리딩(leading)하고 있는 임직원의 ID와 이름과 직군 조회**

![](brain/image/lecture05-1.png)

```sql
SELECT employee.id, employee.name, position
FROM project, employee
WHERE project.id = 2002 and project.leader_id = employee.id;
```

- **selection condition : 조건을 명시해주는 것**
	- `WHERE project.id = 2002 and project.leader_id = employee.id;`
- **join condition : 테이블을 연결시켜주는 조건**
	- `project.leader_id = employee.id;`
- **projection condition : 관심있어 하는 속성 리스트**
	- `SELECT employee.id, employee.name, position`

<br>

![](brain/image/lecture05-2.png)

- 테이블 이름을 같이 명시해두지 않은 id와 name은 어떤 테이블의 것인지 알 수 없음
- 그래서 테이블 이름을 반드시 명시해줘야함.

![](brain/image/lecture05-3.png)

- 모호하다는 오류 뜨는거 보이지!?

<br>

### AS 별칭짓기

==**AS는 테이블이나 attribute에 별칭(alias)을 붙일 때 사용**==
- AS는 생략 가능

![](brain/image/lecture05-4.png)

![](brain/image/lecture05-5.png)

- 근데, 이렇게 불러오면 SELECT 결과가 `id, name, position` 이렇게 뜰거임
- 리더의 아이디, 리더의 이름으로 명시해주고 싶다면? AS 사용!

![](brain/image/lecture05-7.png)

![](brain/image/lecture05-8.png)

- AS는 생략 가능!!

<br>

### DISTINCT

==**DISTINCT는 SELECT 결과에서 중복되는 tuples은 제외하고 싶을 때 사용**==

```sql
SELECT DISTINCT 속성명 FROM 테이블
```

<br><br>

**ex) 디자이너들이 참여하고 있는 프로젝트들의 ID와 이름을 알고싶음**

![](brain/image/lecture05-9.png)

- `WORKS_ON` 테이블이 나머지 두 테이블을 연결해주는 연결고리 역할

![](brain/image/lecture05-11.png)

- 근데 결과를 보면 중복이 발생. 이때 DISTINCT 사용!

![](brain/image/lecture05-12.png)

<br>

<hr>

### LIKE

<br>

![](brain/image/lecture05-16.png)

==**LIKE는 문자열에 맞는 pattern matching 할 때 사용**==
- `%`는 0개 이상의 임의의 개수를 가지는 문자를 의미

```sql
// 속성이 N 문자로 시작
SELECT 속성명 FROM 테이블명
WHERE 속성 LIKE 'N%';

// 속성이 N 문자로 끝나는
SELECT 속성명 FROM 테이블명
WHERE 속성 LIKE '%N';

// 속성에 N이 들어가는
SELECT 속성명 FROM 테이블명
WHERE 속성 LIKE '%N%';

// 속성에 N이 들어가면서 4글자
SELECT 속성명 FROM 테이블명
WHERE 속성 LIKE 'N _ _ _';
```

<br>

==**escape 문자와 함께 LIKE 쓰고싶으면?**==

- `%`로 시작하거나 `_`로 끝나는 프로젝트 이름을 찾고싶다면?
- `SELECT name FROM project WHERE name LIKE '\%%' or name LIKE '%\_';`

<br><br>

**ex) 이름이 N으로 시작하거나 N으로 끝나는 임직원들의 이름 알고싶음**

![](brain/image/lecture05-13.png)

<br><br>

**ex) 이름에 NG가 들어가는 임직원들의 이름을 알고싶음**

![](brain/image/lecture05-14.png)

<br><br>

**ex) 이름이 J로 시작하는, 총 네 글자의 이름을 가지는 임직원들의 이름 알고싶음**

![](brain/image/lecture05-15.png)

<br>

<hr>

### asterisk

==**Asterisk(`*`, 애스터리스크)는 선택된 tuples의 모든 attributes를 의미**==

![](brain/image/lecture05-18.png)

<br>

### 주의사항

1. SELECT로 조회할 때 조건들을 포함해서 조회한다면 ==**이 조건들과 관련된 attributes에 index가 걸려있어야 함**==
	- 그렇지 않다면 데이터가 많아질수록 조회 속도가 느려짐
	- ex) `SELECT * FROM employee WHERE position = 'dev_back';`
		- positon에 대해 index가 걸려 있어야 employee 테이블에 데이터가 아무리 많이 있다고 해도 쿼리문의 실행 속도가 느려지지 않고 여전히 빠르게 유지될 것
2. MySQL 기준으로 작성된거라 다른 RDBMS와 SQL 문법이 조금씩 다를 수 있음