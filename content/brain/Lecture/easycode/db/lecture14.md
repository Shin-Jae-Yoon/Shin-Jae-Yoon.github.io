---
title: "14. transaction"
date: "2023-05-02 15:13"
enableToc: true
tags: [""]
weight: 15
---

유튜버 쉬운코드 님의 <a href='https://www.youtube.com/@ez./playlists' target='_blank'>데이터베이스</a> 강의를 정리한 내용

<hr>

## 트랜잭션

==**트랜잭션(Transaction)**==
- **단일한 논리적인 작업 단위 (a single logical unit of work)**
- 논리적인 이유로 여러 SQL문 들을 단일 작업으로 묶어서 나눠질 수 없게 만든 것
- 트랜잭션의 SQL문 들 중에 일부만 성공해서 DB에 반영되는 일은 일어나지 ❌

==**커밋(Commit)**==
- 지금까지 작업한 내용을 DB에 ==**영구적으로(permanently) 저장**==하라
- transaction을 종료한다

==**롤백(Rollback)**==
- 지금까지 ==**작업들을 모두 취소**==하고 트랜잭션 이전 상태로 되돌려라
- transaction을 종료한다

<br>

```sql
-- 트랜잭션 시작을 알림
START TRANSACTION;
-- 작업 수행 후 COMMIT으로 DB에 반영 + 트랜잭션 종료
COMMIT;
-- 작업 수행하다가 작업 모두 취소하고 되돌리기 + 트랜잭션 종료
ROLLBACK;
```

<br>

### 트랜잭션 예제

**예제 상황**

![](brain/image/lecture14-1.png)

![](brain/image/lecture14-2.png)

![](brain/image/lecture14-3.png)

- 두 sql문이 모두 성공해야 **이체**라는 작업이 성공하는 것
- 이체라는 작업은 ==둘 다 정상 처리되어야만 성공하는 **단일 작업**==

<br>

**MySQL로 표현**

![](brain/image/lecture14-4.png)

![](brain/image/lecture14-6.png)

![](brain/image/lecture14-7.png)

![](brain/image/lecture14-8.png)

<br><hr>

### AUTOCOMMIT

==**AUTOCOMMIT**==
- 각각의 SQL문을 자동으로 transaction 처리 해주는 개념
- **SQL문이 성공적으로 실행**하면 자동으로 **COMMIT**
- **실행 중 문제**가 있었다면 알아서 **ROLLBACK**
- MySQL에서는 default로 autocommit이 enabled 되어있음
- 다른 DBMS에서도 대부분 같은 기능 제공

```sql
-- 현재 AUTOCOMMIT의 활성화 여부 확인 쿼리
select @@autocommit;

-- AUTOCOMMIT 끄려면
SET autocommit=0;
```

<br>

==**MySQL에서 트랜잭션 시작 시 autocommit**==
- `START TRANSACTION` 실행과 동시에 autocommit은 off 됨
- `COMMIT` / `ROLLBACK`과 함께 transaction이 종료되면 원래 autocommit 상태로 되돌아감

<br>

**ex) autocommit 활성화 상태에 insert문 해보기**

![](brain/image/lecture14-9.png)

![](brain/image/lecture14-10.png)

<br>

**ex) autocommit 비활성화 상태에 delete문 해보기**

![](brain/image/lecture14-12.png)

![](brain/image/lecture14-13.png)

<br><hr>

### 트랜잭션 사용패턴

==**일반적인 transaction 사용 패턴**==
1. transaction을 시작(==**begin**==)한다.
2. 데이터를 읽거나 쓰는 등의 SQL문들을 포함해서 로직 수행
3. 일련의 과정들이 문제없이 동작했다면 transaction을 ==**commit**==
4. 중간에 문제가 발생했다면 transaction을 ==**rollback**==

<br>

==**자바 코드에서의 예시**==

![](brain/image/lecture14-14.png)

- `connection.setAutoCommit(false);`
	- 이것이 autocommit을 끄면서, 동시에 **트랜잭션을 시작하겠다는 의미를 포함**
- `connection.setAutoCommit(true);`
	- 보통 DB connection은 한 번 쓰고 버리는 것이 아니기 때문에 autocommit 설정을 원래로 바꿔야 함 
- 이체와 관련된 비즈니스 로직 코드와, 트랜잭션 코드가 같이 있으면 보기 불편하니까 이를 숨기고 싶음

<br>

![](brain/image/lecture14-15.png)

- `@Transactional` 애노테이션을 통해 트랜잭션 관련 코드는 숨기고 이체에 관련된 비즈니스 로직만 남겨서 보기 수월하게 만들었음

<br><hr>

## ACID

### Atomicity

==**원자성(Atomicity)**==
- 모두 성공하거나, 모두 실패하거나를 보장하기 위한 특징
- ALL or Nothing
- transaction은 논리적으로 쪼개질 수 없는 작업 단위이기 때문에 내부의 SQL문들은 모두 성공해야함
- 중간에 SQL 문이 실패하면 지금까지의 작업을 모두 취소하여 아무 일도 없었던 것처럼 rollback 함

<br>

![](brain/image/lecture14-16.png)

- ==**commit**== 실행 시 DB에 ==**영구적으로 저장하는 것**==은 DBMS가 담당하는 부분
- ==**rollback**== 실행 시 ==**이전 상태로 되돌리는 것**==도 DBMS가 담당하는 부분
- 개발자는 언제 commit 하거나 rollback 할 지를 챙겨야 함
	- 트랜잭션 단위를 어떻게 결정할 지
	- 어떤 문제가 발생했을 때 롤백할 지

<br><hr>

### Consistency

==**일관성(Consistency)**==
- transaction은 DB 상태를 consistent(일관된) 상태에서 또 다른 consistent 상태로 바꿔줘야 함
- constraints, trigger 등을 통해 DB에 정의된 rules을 transaction이 위반했다면 rollback 해야 함
- transaction이 DB에 정의된 rule을 위반했는지는 DBMS가 commit 전에 확인하고 알려줌
- 그 외 application 관점에서 transaction이 consistent하게 동작하는지는 개발자가 챙겨야 함
	- 왜냐하면, DBMS는 DB에 정의된 룰만 확인하니까

<br>

![](brain/image/lecture14-17.png)
- 테이블을 생성할 때 정한 제약조건에서 이미 위배
- 더이상 트랜잭션을 진행할 필요가 없음. rollback
- 이렇게 DB의 일관성을 유지시켜주는 것이 consistency

<br><hr>

### Isolation

==**격리성(Isolation)**==
- 여러 transaction들이 동시에 실행될 때도 혼자 실행되는 것처럼 동작하게 만듦
- DBMS는 여러 종류의 isolation level을 제공
- 개발자는 isolation level 중 어떤 level로 transaction을 동작시킬지 설정할 수 있음
- [concurrency control(동시성 제어)](brain/Lecture/easycode/db/lecture15) 의 주된 목표가 **isolation**

<br>

==**여러 종류의 isolation level을 제공하는 이유?**==
- 엄격하게 구현하면 DB 서버의 performance(성능)가 떨어지기 때문에
- ==Isolation level이 높으면 높을수록== 보다 엄격하게 격리시켜 다른 트랜잭션으로부터 영향을 받을 경우가 줄어듦
	- 대신, 그만큼 동시에 실행될 수 있는 동시성이 떨어지게 되어 DB 서버의 퍼포먼스가 떨어지게 됨
- ==Isolation level이 낮으면 낮을수록== 여러 트랜잭션이 실행될 수 있는 동시성이 높아져서 DB 서버의 퍼포먼스가 좋아짐
	- 대신, 다른 트랜잭션으로부터 영향받을 가능성이 커지기 때문에 잘못된 결과를 초래할 확률이 커짐

<br>

**ex) J가 H에게 20만원을 이체할 때, 하필 그 타이밍에, H도 ATM에서 본인 계좌에 30만원을 입금한다면?**

![](brain/image/lecture14-18.png)

- 이런 문제 발생 시 중요한 특성이 Isolation

<br><hr>

### Durability

==**지속성, 영존성 (Durability)**==
- commit된 transaction은 DB에 **영구적으로** 저장
- DB system에 문제(power fail / DB crash)가 생겨도 commit된 transaction은 DB에 남아있어야 함
- 영구적으로 저장한다라고 할 때는 일반적으로 ==**비휘발성 메모리(HDD, SDD, ...)**에 저장한다는 것을 의미==
- 기본적으로 transaction의 durability는 DBMS가 보장

<br>

![](brain/image/lecture14-19.png)

- commit 이후에 트랜잭션이 DB에 영구적으로 저장되는 것을 Durability라고 함