---
title: "03. DB/table 생성"
date: "2023-04-18 03:50"
enableToc: true
tags: [""]
weight: 4
---

유튜버 쉬운코드 님의 <a href='https://www.youtube.com/@ez./playlists' target='_blank'>데이터베이스</a> 강의를 정리한 내용

<hr>

## SQL

==**SQL (Structured Query Language)** ==
- 현업에서 쓰이는 relational DBMS의 표준 언어
- 종합적인 database 언어 : DDL + DML + VDL

<br>

==**Database 구조를 정의할 때 중요한 점**==

- 만드려는 서비스의 스펙과 데이터 일관성, 편의성, 확장성 등등을 종합적으로 고려하여 DB 스키마를 적절하게 정의하는 것이 중요

<br>

### 기본 용어

<br>

==**주요 용어**==

| relational data model |  SQL   |
|:---------------------:|:------:|
|       relation        | table  |
|       attribute       | column |
|         tuble         |  row   |
|        domain         | domain |

<br>

==**SQL에서 relation이란?**==

- **multiset** (= bag) of tuples @ SQL
	- 중복된 tuple을 허용한다는 의미
	- SQL에서는 각 tuple이 중복될 수 있다

<br>

==**SQL & RDBMS**==

- SQL은 RDBMS의 표준 언어이지만 실제 구현에 강제가 없음
- 따라서, RDBMS마다 제공하는 SQL의 스펙이 조금씩 다름

<br>


<br>

### 기본 명령어

- 데이터베이스 목록 확인

```sql
SHOW DATABASES;

+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
```

<br>

- 데이터베이스 생성

```sql
CREATE DATABASE db이름;

+--------------------+
| Database           |
+--------------------+
| company            |
| information_schema |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
```

<br>

- 지금 선택된 데이터베이스가 무엇인지

```sql
SELECT database();

+------------+
| database() |
+------------+
| NULL       |
+------------+
```

<br>

- 사용할 데이터베이스 지정

```sql
USE db이름;

Database changed

다시 선택된 데이터베이스 확인해보면

SELECT database();
+------------+
| database() |
+------------+
| company    |
+------------+
```

<br>

- 데이터베이스 삭제

```sql
DROP DATABASE db이름;
```

<br>

### DB vs 스키마

- MySQL 에서는 `DATABASE`와 `SCHEMA`가 같은 뜻을 의미
	- `CREATE DATABASE company = CREATE SCHEMA company`
- 그러나, 다른 RDBMS에서는 의미가 다르게 쓰임
	- ex) PostgreSQL에서는 `SCHEMA`가 `DATABASE의 namespace`를 의미
	- 그래서 PostgreSQL에서는 하나의 DATABASE가 여러 개의 SCHEMA를 가질 수 있음
	- 데이터베이스 안에서 스키마가 정의, 스키마 안에서 테이블이 정의

<br>

### 속성 데이터 타입 (정수)

![](brain/image/lecture03-2.png)

- **PostgreSQL에서는 SMALLINT, INT or INTEGER, BIGINT 3종류만 있음**
	- TINYINT, MEDIUMINT가 없음
- 고정 소수점 방식
	- `DECIMAL(precision, scale)`
	- precision : 자릿수, scale : 소숫점 이하 몇 째 자리까지
	- `DECIMAL(5, 2) => [-999.99 ~ 999.99]`

<br>

> SQL 표준 스펙에서는 DECIMAL은 유연한 처리, NUMERIC은 엄격한 처리 <br>
> 하지만 MySQL에서는 DECIMAL, NUMERIC 둘 다 엄격하게 처리함 <br>
> 엄격한 처리는 (5, 2)에서 5자리를 넘어가도 5자리까지만 딱 저장한다는거 <br>
> 유연한 처리는 넘어가도 저장해주는거임

<br>

### 속성 데이터 타입 (문자열)

![](brain/image/lecture03-3.png)

- VARCHAR가 CHAR보다 좋은 것 아니냐? 할 수 있지만, **VARCHAR와 CHAR를 어떻게 구현했는지에 따라 조금씩 다르다.** -> RDBMS마다 다르다.
	- PostgreSQL
		- VARCHAR 권장
	- MySQL : VARCHAR가 storage 상 이점은 있겠지만, 시간적 성능이 CHAR에 비해 안좋을 수 있음
		- Form Number같이 문자열 크기가 고정적 -> CHAR 권장
		- 문자열 크기가 고정적이지 않은 속성인 경우 -> VARCHAR 권장
- PostgreSQL 에서는 TEXT만 있음
- MySQL 에서는 TINYTEXT, TEXT, MEDIUMTEXT, LONGTEXT 있음
	- VARCHAR보다 긴건 MEDIUMTEXT, LONGTEXT
	- TINYTEXT, TEXT는 VARCHAR와 동일하거나 그보다 작은 길이를 저장

<br>

### 속성 데이터 타입 (날짜와 시간)

![](brain/image/lecture03-4.png)

- 시간을 3자리 까지 표시할 수 있다는 것은(hhh) 일이 경과된 시간을 표시하기 위함임
- DATETIME과 TIMESTAMP의 차이
	- 범위의 차이
	- time-zone 반영 차이
- TIMESTAMP는 표준시간대 UTC를 반영하는데, MySQL이 설치되어있는 서버의 timezone이나  MySQL 내부적으로 설정된 timezone의 시간 대비 표준 시간대로 변환해서 표준 시간대로 저장하고 읽어 올때도 변환해서 읽어옴
	- ==**즉, MySQL의 TIMESTAMP는 time-zone에 영향을 받는다!!**==

<br>

### 속성 데이터 타입 (etc)

![](brain/image/lecture03-5.png)

- byte-string은 보안 관련해서 암호화하고 싶을 때 암호화 키를 byte-string으로 저장함
- boolean
	- PostgreSQL은 있음
	- MySQL은 따로 없음
		- TINYINT로 대체해서 사용 (0과 1)

<br>

### 속성 DEFAULT

==**attribute DEFAULT**==
- attribute의 default 값을 정의할 때 사용
- 새로운 tuple을 저장할 때 해당 attribute에 대한 값이 없다면 default 값으로 저장

![](brain/image/lecture03-14.png)

**DEFAULT 선언방법**

![](brain/image/lecture03-15.png)

<br>

### 테이블 스키마 변경

==**ALTER TABLE**==
- table의 schema를 변경하고 싶을 때 사용

![](brain/image/lecture03-28.png)

> 이미 서비스 중인 table의 schema를 변경하는 것이라면 <br>
> 변경 작업 때문에 서비스의 백엔드에 영향이 없을 지 검토한 후에 변경하는 것이 중요!!!

<br>

==**DROP TABLE**==
- table을 삭제할 때 사용
- `DROP TABLE 테이블명;`

<br>

### 제약조건

==**Key Constraints : PRIMARY KEY**==
- primary key : table의 tuple을 식별하기 위해 사용, 하나 이상의 attribute(s)로 구성
- primary key는 중복된 값을 가질 수 없으며, NULL도 값으로 가질 수 없음

![](brain/image/lecture03-6.png)

<br>

**Primary key 선언방법**

![](brain/image/lecture03-7.png)

- attribute가 여러 개라면 반드시 오른쪽처럼 적어야함
- 그러나, attribute가 한개라면 `PRIMARY KEY(id)`처럼 해도 됨

<br>

==**Key Constraints : UNIQUE**==
- UNIQUE로 지정된 attribute(s)는 중복된 값을 가질 수 없음
- 단, NULL은 중복을 허용할 수도 있음 (RDBMS 마다 다름)
	- MySQL, PostgreSQL에서는 NULL 중복 허용해줌

![](brain/image/lecture03-8.png)

<br>

**UNIQUE 선언방법**

![](brain/image/lecture03-9.png)

<br>

==**NOT NULL constraint**==
- attribute가 NOT NULL로 지정되면 해당 attribute는 NULL을 값으로 가질 수 없음
- 보통 `NOT NULL`과 `UNIQUE`는 같이 많이 선언함
	- 왜냐하면, UNIQUE가 NULL의 경우에는 중복을 허용할 수 있기 때문에, attribute가 NULL을 허용하지 않아도 되는 조건이라면 이렇게 많이 씀

![](brain/image/lecture03-10.png)

<br>

**NOT NULL 선언방법**

![](brain/image/lecture03-11.png)

<br>

==**CHECK constraint**==
- attribute의 값을 제한하고 싶을 때 사용

![](brain/image/lecture03-16.png)

<br>

**CHECK 선언방법**

![](brain/image/lecture03-17.png)

<br>

==**Referential integrity constraint : FOREIGN KEY**==
- 참조 무결성 제약조건
- attribute(s)가 다른 table의 primary key나 unique key를 참조할 때 사용

![](brain/image/lecture03-18.png)

<br>

**FOREIGN KEY 선언방법**

![](brain/image/lecture03-19.png)

1. FOREIGN KEY로 설정할 attribute 이름
2. 어떤 테이블을 참조하는지, 테이블의 어떤 attribute 참조하는지
3. 참조하고 있는 값이 삭제되거나 업데이트 될 때 FOREIGN KEY value를 어떻게 할 지 옵션
	- MySQL에서는 **CASCADE, SET NULL, RESTRICT** 3개가 있다고 이해하자
	- PostgreSQL에서는 5가지 전부 제대로 지원함

<br>

- **CASCADE**

![](brain/image/lecture03-20.png)

- **SET NULL**

![](brain/image/lecture03-21.png)

- **RESTRICT** : 참조하고 있는애 있느면 수정 불가

![](brain/image/lecture03-22.png)

- **NO ACTION**
	- MySQL에서는 RESTRICT와 NO ACTION이 동일
	- SQL 표준 스펙에서는 거의 유사
		- SQL에서 NO ACTION은 한 트랜잭션 내의 여러 SQL이 실행되는 동안에는 참조값이 변경/삭제 되는 것은 허용하지만, 트랜잭션이 끝났을 때도 여전히 참조 무결성 제약을 위반하고 있다면 이것은 금지한다는 의미

- **SET DEFAULT**
	- MySQL은 SET DEFAULT를 잘 지원하지 않음

![](brain/image/lecture03-23.png)

<br>

### 제약조건 이름 명시

==**constraint 이름 명시하기**==
- 이름을 붙이면 어떤 constraint를 위반했는지 쉽게 파악할 수 있음
- constraint를 삭제하고 싶을 때 해당 이름으로 삭제 가능

![](brain/image/lecture03-24.png)

- `test_chk_1`이 무엇을 의미하는지 알고싶으면 MySQL에서는 `show create table 테이블명;`라고 하면 결과로 나오는 화면에서 알 수 있다.

<br>

<hr>

## 예제

IT 회사 관련 RDB를 만들어보자.
- 부서, 사원, 프로젝트 관련 정보들을 저장할 수 있는 관계형 데이터베이스를 만들자
- 사용할 RDBMS는 MySQL (InnoDB)
	- MySQL은 여러 DB 엔진을 제공하는데, 가장 많이 사용하는 InnoDB를 기준으로 설명

### 실습

![](brain/image/lecture03-1.png)

- Data model을 바탕으로 DB의 구조를 기술했음 -> 스키마 만들었다는 거

<br>

![](brain/image/lecture03-12.png)

![](brain/image/lecture03-13.png)

![](brain/image/lecture03-25.png)

![](brain/image/lecture03-26.png)

DEPARTMENT 테이블 만들 당시에는 `leader_id`에 대한 FOREIGN KEY 지정을 못했었는데, 이제 생겼으니 한번 수정해보자.

![](brain/image/lecture03-27.png)