---
title: "강의소개"
date: "2023-04-17 19:58"
enableToc: true
tags: [""]
weight: 1
---

유튜버 쉬운코드님의 강의 플레이리스트 중  <a href='https://www.youtube.com/@ez./playlists' target='_blank'>데이터베이스</a>를 정리한 노트

1. [01. 데이터베이스 개론](brain/Lecture/easycode/db/lecture01)
2. [02. RDBMS 기초](brain/Lecture/easycode/db/lecture02)
3. [03. SQL DB생성, 테이블 생성](brain/Lecture/easycode/db/lecture03)
4. [04. 데이터 추가/수정/삭제](brain/Lecture/easycode/db/lecture04)
5. [05. 데이터 조회](brain/Lecture/easycode/db/lecture05)
6. [06. 서브쿼리](brain/Lecture/easycode/db/lecture06)

<br>

==**DB 생성, 테이블 생성 SQL 한 눈에 보기**==

<br>

```sql
// DB 목록 확인
SHOW DATABASES;

// DB 생성
CREATE DATABASE db명;

// 선택된 DB 확인
SELECT database();

// 사용할 DB 지정
USE db명;

// DB 삭제
DROP DATABASE db명;

// 테이블 생성
CREATE TABLE (속성명 속성타입 등등);

// 테이블 스키마 변경 - 속성 추가
ALTER TABLE 테이블명 ADD 속성명 타입;

// 테이블 스키마 변경 - 속성 이름 변경
ALTER TABLE 테이블명 RENAME COLUMN 지금속성명 TO 바뀔속성명;

// 테이블 스키마 변경 - 속성 타입 변경
ALTER TABLE 테이블명 MODIFY COLUMN 속성명 타입;

// 테이블 스키마 변경 - 테이블 이름 변경
ALTER TABLE 테이블명 RENAME TO 바뀔테이블명;

// 테이블 스키마 변경 - 기본키 추가
ALTER TABLE 테이블명 ADD PRIMARY KEY(id);

// 테이블 삭제
DROP TABLE 테이블명;
```

<br>

==**데이터 추가/수정/삭제**==

<br>

```sql
// 데이터 추가 - 1개
INSERT INTO 테이블명 VALUES (값1, 값2, 값3, ...);

INSERT INTO 테이블명 
VALUES (속성이름1, 속성이름2, ...) 
INTO ('값1', '값2', ... );

// 데이터 추가 - 여러개
INSERT INTO 테이블명 VALUES (값1, 값2, 값3, ...), (값1, 값2, 값3, ...), ...;

// 데이터 수정
UPDATE 테이블명 
SET 속성1 = 값1 
[WHERE 조건];

// 데이터 삭제
DELETE FROM 테이블명
[WHERE 조건];
```

<br>

==**데이터 조회**==

```sql
// 데이터 조회
SELECT 속성 FROM 테이블명 [WHERE 조건];

// AS 별칭 짓기
SELECT 속성 AS 별명 FROM 테이블명 AS 별명;

// DISTINCT 중복제거
SELECT DISTINCT 속성명 FROM 테이블;

// LIKE 문자열 맞는 조건 - A 시작
SELECT 속성명 FROM 테이블명
WHERE 속성 LIKE 'A%';

// LIKE 문자열 맞는 조건 - A로 끝
SELECT 속성명 FROM 테이블명
WHERE 속성 LIKE '%A';

// LIKE 문자열 맞는 조건 - A 포함
SELECT 속성명 FROM 테이블명
WHERE 속성 LIKE '%A%';

// LIKE 문자열 맞는 조건 - A 포함 2글자
// _ 하나당 한칸
SELECT 속성명 FROM 테이블명
WHERE 속성 LIKE 'A_';
```