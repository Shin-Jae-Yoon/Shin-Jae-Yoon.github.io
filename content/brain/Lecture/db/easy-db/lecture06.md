---
title: "06. 서브쿼리"
date: "2023-04-21 18:41"
enableToc: true
tags: [""]
weight: 7
---

유튜버 쉬운코드 님의 <a href='https://www.youtube.com/@ez./playlists' target='_blank'>데이터베이스</a> 강의를 정리한 내용

<hr>

## Subquery

### Subquery 기본

- ==**subquery**==(nested query / inner query) : [SELECT](brain/Lecture/db/easy-db/lecture05.md), INSERT, UPDATE, DELETE에 포함된 쿼리
	- subquery는 `()`안에 기술됨
- ==**outer query**==(main query) : subquery를 포함하는 쿼리
- 서브쿼리는 WHERE 절에 있을 수도, FROM 절에 있을 수도 있다

<br><br>

**ex) ID가 14인 임직원보다 생일이 빠른 임직원의 ID, 이름, 생일 알고싶음**

![](brain/image/lecture06-1.png)

- 이렇게 쿼리 두번 써서 나타내지말고 한 번에 나타낼 수 없나?

![](brain/image/lecture06-2.png)

- 이렇게 쏙 넣어버렸음
- subquery
	- `()` 안에 있는 `(SELECT birth_date FROM employee WHERE id = 14)`
- outer query
	- `SELECT id, name, birth_date FROM employee WHERE birth_date`

<br><br>

**ex) ID가 1인 임직원과 같은 부서 성별인 임직원들의 ID와 이름과 직군**

![](brain/image/lecture06-3.png)

<br><br>

**ex) ID가 5인 임직원과 같은 프로젝트에 참여한 임직원들의 ID**

- 서브쿼리가 안떠오르면 일단 두 파트로 나눠서 생각!
	- ID가 5인 임직원과 같은 프로젝트
	- 참여한 임직원 ID

![](brain/image/lecture06-4.png)
- ID가 5인 임직원 본인 자체는 제외한 것
- DISTINCT는 두 프로젝트에 모두 참가했을 수도 있으니까 제거해준 것
- 근데 OR라고 이렇게 써주면 귀찮잖아?

![](brain/image/lecture06-5.png)
- `IN` 이라는 키워드를 사용했음

![](brain/image/lecture06-6.png)

<br>

<hr>

### IN - OR 같은 녀석

- ==**v IN (v1, v2, v3, ...)**== : v가 (v1, v2, v3, ...) 중에 하나와 같이 같다면 TRUE를 return
	- (v1, v2, v3, ...)는 명시적인 값들의 집합일 수 있음
	- (v1, v2, v3, ...)는 subquery의 결과(set or multiset)일 수 있음
		- set은 중복 허용 O, multiset은 중복 허용 X
- ==**v NOT IN (v1, v2, v3, ...)**== : v가 (v1, v2, v3, ..)의 모든 값과 값이 다르다믄 TRUE를 return
- IN은 EXISTS와 서로 바꿔가며 사용 가능

<br>

==**unqualified attribute가 참조하는 table**==
- 해당 attribute가 사용된 query를 포함하여 그 query의 바깥 쪽으로 존재하는 모든 queries 중에 해당 attribute 이름을 가지는 **가장 가까이에 있는 table을 참조**

![](brain/image/lecture06-7.png)

![](brain/image/lecture06-8.png)

<br><br>

**ex) ID가 5인 임직원과 같은 프로젝트에 참여한 임직원들의 ID와 이름**

![](brain/image/lecture06-10.png)

- `works_on` 테이블에는 이름이 없으니까 이것만으로는 불가능
- `employee` 테이블을 참조해야함
- `WHERE` 절에 서브쿼리를 넣은 것

![](brain/image/lecture06-11.png)

- `FROM` 절에 서브쿼리를 넣은 것
- 그래서 `employee` 실제 테이블 , `DSTNCT_E` 가상 테이블 2개의 테이블이 있는 것
- WHERE 절은 `employee 테이블의 id`와 `DSTNCT_E 가상 테이블의 empl_id`를 join condition으로 엮어준 것

<br>

<hr>

### EXISTS 존재여부

- ==**correlated query**== : subquery가 바깥쪽 query의 attribute를 참조할 때, correlated subquery라 부름
- ==**EXISTS**== : subquery의 결과가 최소 하나의 row라도 있다면 TRUE 반환
- ==**NOT EXISTS**== : subquery의 결과가 단 하나의 row도 없다면 TRUE 반환
- EXISTS는 IN과 서로 바꿔가며 사용 가능

<br><br>

**ex) ID가 7 혹은 12인 임직원이 참여한 프로젝트 ID와 이름**

![](brain/image/lecture06-12.png)

- `SELECT P.id, P.name FROM project P`
	- project 테이블의 row에 대해서 하나하나씩 확인

![](brain/image/lecture06-13.png)

```sql
WHERE EXISTS (
	SELECT * 
	FROM works_on W
	WHERE W.proj_id = P.id AND W.empl_id IN (7, 12)
	);
```

- `works_on` 테이블의 id와 바깥에 있는 `project` 테이블의 id인 `P.id`와 같은지 확인
	- 바깥쪽 쿼리의 속성을 참조하니까 이것이 **correlated subquery**
- 동시에 그 `works_on` 테이블의 `empl_id`가 7 혹은 12인 것을 찾는 것

<br><br>

**ex) EXISTS를 IN으로 바꿔보면?**

![](brain/image/lecture06-14.png)

<br><br>

**ex) 2000년대생이 없는 부서의 ID와 이름**

![](brain/image/lecture06-15.png)

<br><br>

**ex) NOT EXISTS를 NOT IN으로 바꿔보면?**

![](brain/image/lecture06-16.png)

<br><br>

==**성능 비교 : IN vs EXISTS**==
- RDBMS의 종류와 버전에 따라 다르며, 최근 버전은 많은 개선이 이루어져서 IN과 EXISTS의 성능 차이가 거의 없는 것으로 알려짐

<br>

<hr>

### ANY 서브쿼리 단 하나라도

- ==**v comparison_operator ANY (subquery)**== : subquery가 반환한 결과들 중에 단 하나라도 v와의 비교 연산이 TRUE라면 TRUE를 반환
- ==**SOME**==도 ==**ANY**==와 같은 역할

<br><br>

**ex) 리더보다 높은 연봉을 받는 부서원을 가진 리더의 ID와 이름과 연봉**

![](brain/image/lecture06-18.png)

- 부서의 리더인지 아닌지 여부는 `department` 테이블을 참조해야만 알 수 있음
- 서브쿼리
	- 리더와 같은 부서에 있는 임직원 찾아야함 `dept_id = E.dept_id`
		- 바깥쪽 쿼리의 조건에 의해 `E.dept_id`가 리더의 id임
	- `id <> D.leader_id`
		- 리더 외의 부서원이라는 뜻, `!=`로 해도 무방

<br><br>

**ex) 리더보다 높은 연봉을 받는 부서원을 가진 리더의 ID와 이름과 연봉과 해당 부서 최고 연봉**

![](brain/image/lecture06-19.png)

![](brain/image/lecture06-20.png)

<br>

<hr>

### ALL 모두

- ==**v comparison_operator ALL (subquery)**== : subquery가 반환한 결과들과 v와의 비교 연산이 모두 TRUE라면 TRUE 반환

<br>

**ex) ID가 13인 임직원과 한 번도 같은 프로젝트에 참여하지 못한 임직원들의 ID, 이름, 직군**

![](brain/image/lecture06-21.png)

<br>