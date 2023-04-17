---
title: "01. DB 개론"
date: "2023-04-17 19:57"
enableToc: true
tags: [""]
weight: 2
---

유튜버 쉬운코드 님의 <a href='https://www.youtube.com/@ez./playlists' target='_blank'>데이터베이스</a> 강의를 정리한 내용

<hr>

## DB 기본

<br>

### DB

==**DB(Database) : 전자적으로 (electronically) 저장되고 사용되는 관련있는 (related) 데이터들의 조직화된 집합 (organized collection)**==

- **관련있는 데이터들을** : 같은 출처, 같은 목적, 같은 서비스 안에서 생성되는 데이터들을 관련있는 데이터라고 함
- **조직화된 집합으로** : 잘 조직화된 데이터들을 내가 찾으려는 데이터를 조금더 빨리 찾을 수 있게 해주고, 불필요한 데이터를 중복되서 생성되지 않게 해주고, 데이터의 불일치 문제도 해결해줌
- **전자적으로 저장하고 사용** : 데이터가 컴퓨터에 저장되고 사용되는 것

<br>

### DBMS

==**DBMS(Database Management System) : 사용자에게 DB를 정의하고 만들고 관리하는 기능을 제공하는 소프트웨어 시스템**==

- 대표적인 DBMS로는 PostgreSQL, MySQL, Oracle DB, MS-SQL 등등
- DB를 정의하다 보면 부가적인 데이터가 발생할 수 있다. -> **metadata**

<br>

==**metadata : DB를 정의하거나 기술하는(descriptive) data**==

- 즉, 데이터를 설명하기 위한 데이터를 metadata라고 함
- catalog라고도 부른다.
	- DB의 metadata가 저장되는 곳을 catalog라고도 함
- ex) 데이터 유형, 구조, 제약 조건, 보안, 저장, 인덱스, 사용자 그룹 등등
- metadata 또한 DBMS를 통해 저장/관리 됨

<br>

### DB System

==**Database System : DB + DBMS + 연관된 applications**==

- 줄여서 DB라고도 부름
- 즉, DB라고 하면 순수하게 data 자체를 의미하는 DB일 수도 있지만, DB system을 의미하는 DB일 수도 있다.

<br>

![](brain/image/lecture01-1.png)

- query : 쿼리는 DB에 접근해서 원하는 데이터를 가져오거나 수정하는 요청을 의미
- 이것이 전체적인 Database System이 동작하는 방식
	1. 애플리케이션 프로그램이 쿼리를 이용해 DBMS에게 요청
	2. 받은 쿼리를 분석하고 완료되면 요청에 대한 처리
	3. 요청된 데이터가 어떤 형태인지 부가적인 정보인 metadata를 먼저 파악
	4. metadata를 바탕으로 요청받은 data를 찾아서 애플리케이션에 반환

<br>

<hr>

## Data models

==**Data Models : DB의 구조를 원하는 형태로, 원하는 추상화 수준으로 모델링 하기 위해 필요한 것이 데이터 모델**==

- **DB의 구조(structure)를 기술하는데 사용될 수 있는 개념들이 모인 집합**
	- DB 구조를 **추상화**해서 표현할 수 있는 수단 제공
- data model은 여러 종류가 있으며, 추상화 수준과 DB 구조화 방식이 조금씩 다름
- DB에서 읽고 쓰기 위한 기본적인 동작들(operations)도 포함

> DB 구조 : 데이터 유형, 데이터 관계(relationship), 제약 사항(constraints) 등등

<br>

==**Data models 분류**==
- 개념적 데이터 모델, conceptual (or high-level) data models
- 논리적 데이터 모델, logical (or representational) data models
- 물리적 데이터 모델, physical (or low-level) data models

<br>

### Conceptual

- 데이터베이스의 추상화 수준을 높게 하여, 누가봐도 쉽게 이해할 수 있는 개념들로 이뤄진 모델
- ==**추상화 수준이 가장 높음**==
- 비즈니스 요구사항을 추상화하여 기술할 때 사용
- 대표적인 Conceptual Data models은 ==**entity-relationship model**==
	- **ER diagram**
	- DB 구조를 **entity**와 **entity들의 관계**로 나타내는 것

<br>

![](brain/image/lecture01-2.png)

예를 들어, 대학교의 도서관 시스템을 구현하는 상황에 학생들 정보와 책의 정보를 나타내는 경우
- Entity : Student, Book
	- 각각의 Entity마다 Attribute(속성)이 있음
- Relation : reads

<br>

### Logical

- 이해하기 어렵지 않으면서도 ==**디테일하게 DB를 구조화**== 할 수 있는 개념들을 제공하는 모델
- 데이터가 컴퓨터에 저장될 때의 구조와 크게 다르지 않게 DB 구조화를 가능하게 함
- 특정 DBMS나 특정 storage에 종속되지 않는 수준에서 DB를 구조화 할 수 있는 모델
- 대표적인 Logical Data models은 ==**관계형 데이터 모델 (relational data model)**==
	- **객체 데이터 모델 (object-data model)**도 있음
	- **객체-관계형 데이터 모델 (object-relational data model)**도 있음 (relational + object)
	- MySQL, Oracle, MS-SQL은 relational data model
	- PostgreSQL은 object-relational data model

<br>

![](brain/image/lecture01-3.png)

- relation은 테이블을 의미하는 것
	- row : 데이터 각각
	- column : 데이터의 속성, attribute

<br>

### Physical

- 컴퓨터에 데이터가 어떻게 파일 형태로 저장되는지를 기술할 수 있는 수단 제공
- data format, data orderings, access path 등등
- access path : 데이터 검색을 빠르게 하기 위한 구조체
	- ex) index

<br>

<hr>

## Schema & State

<br>

### DB Schema

- ==**Data model을 바탕으로 DB의 구조를 기술(description)한 것**==
- schema는 DB를 설계할 때 정해지며, 한 번 정해진 후에 자주 바뀌지 않음

![](brain/image/lecture01-4.png)

- 이렇게 데이터베이스의 스키마를 보면 구조가 어떤식으로 되어있는 지 큰그림 이해하기 쉬움

<br>

### DB state(snapshot)

![](brain/image/lecture01-5.png)

- DB에 있는 실제 데이터는 꽤 자주 바뀔 수 있음
- ==**특정 시점에 DB에 있는 데이터**==를 ==**Database State**== 혹은 ==**Database snapshot**==이라고 함
- 혹은 DB에 있는 현재 instances의 집합이라고도 함

<br>

### three-schema

- three-schema architecure는 ==**Database system을 구축하는 architecure 중의 하나**==
- user application으로부터 물리적인(physical) 데이터베이스를 분리시키는 목적
	- 물리적인 DB의 구조가 조금씩 바뀔 수 있는데, 이 DB를 사용하는 user application에 영향을 끼치지 않도록 하려고 three-schema 구조를 사용하는 것
- 세가지 Level이 존재하며, 각각의 Level 마다 schema가 정의되어 있음

<br>

==**three-schema architecture 3가지 Level**==
- 외부 스키마, external schemas (or user view) at external (or view) level
- 개념적 스키마, conceptual schemas at conceptual level
- 내부 스키마, internal schemas at internal level

<br>

![](brain/image/lecture01-6.png)

<br>

==**내부 스키마 (Internal Schema)**== : 물리적인 저장 장치에 가장 가깝게 위치
- 물리적으로 데이터가 어떻게 저장되는지 **physical data model**을 통해 표현
- data storage, data structure, access path (index) 등등 실체가 있는 내용 기술

<br>

==**외부 스키마 (External Schema)**== : 실제 사용자가 바라보는 곳
- external views, user views 라고도 불림
- **특정 유저들이 필요로 하는 데이터만 표현**
- 그 외 알려줄 필요가 없는 데이터는 숨김
- **logical data model**을 통해 표현

<br>

Database System의 초창기 아키텍처는 Internal schema, External schema 2개 밖에 없었다. 이렇게 하다보니 **각각의 유저마다 필요로 하는 데이터들이 달라지다 보니까 Internal Level에서 점점 더 중복되는 데이터가 생겼다. 점점 관리하기가 힘들어지고 데이터 불일치가 발생!** 이래서 나온게 Conceptual Schema!

<br>

==**개념적 스키마 (Conceptual Schema)**== : 내부 스키마를 한 번 추상화해서 표현한 것
- 전체 DB에 대한 구조 기술
- 물리적인 저장 구조에 관한 내용은 숨김
- entities, data types, relationships, user operations, constraints에 집중
- **logical data model**을 통해 표현

<br>

==**three-schema architecture**==
- 각 레벨을 독립시켜서 어느 레벨에서의 변화가 상위 레벨에 영향을 주지 않기 위함
	- 예를 들어, 내부 스키마에 문제가 생겼다고 해도 개념적 스키마는 바꿀 필요 없이 매핑만 바꿔주면 된다는 의미. 따라서, 안정적인 운영 가능
	- 근데, 개념적 스키마에 문제가 생겼을 때 외부 스키마에 문제가 없게 하는 것은 상대적으로 까다로운 편
- 대부분의 DBMS가 세가지 수준을 완벽하게 혹은 명시적으로 나누지는 않음
- 각각의 스키마는 DB 구조를 표현하는 것이지, 실제로 데이터가 존재하는 곳은 **internal level**

<br>

<hr>

## DB Language

<br>

### DDL

- DDL (Data Definition Language)
- ==**Conceptual Schema를 정의하기 위해 사용되는 언어**==
- Internal schema까지 정의할 수 있는 경우도 있음

<br>

### SDL

- SDL (Storage Definition Language)
- Internal schema를 정의하는 용도로 사용되는 언어
- 요즘은 특히 Relational DBMS에서는 SDL이 거의 없고 파라미터 등의 설정으로 대체됨

<br>

### VDL

- VDL (View Definition Language)
- External schemas를 정의하기 위해 사용되는 언어
- 대부분의 DBMS에서는 DDL이 VDL 역할까지 수행

<br>

### DML

- DML (Data Manipulation Language)
- ==**DB에 있는 실제 data를 활용하기 위한 언어**==
- data 추가, 삭제, 수정, 검색 등등의 기능을 제공하는 언어

<br>

### 통합된 언어

- 오늘날의 DBMS는 DML, VDL, DDL이 따로 존재하기 보다 통합된 언어로 존재
- 대표적인 예가 ==**Relational Database Language : SQL**==
	- SQL이 DML, VDL, DDL 역할 모두 수행