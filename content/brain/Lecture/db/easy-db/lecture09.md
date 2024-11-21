---
title: "09. 통계함수"
date: "2023-04-23 18:10"
enableToc: true
tags: [""]
weight: 10
---

유튜버 쉬운코드 님의 <a href='https://www.youtube.com/@ez./playlists' target='_blank'>데이터베이스</a> 강의를 정리한 내용

<hr>

## 정렬

### ORDER BY

==**ORDER BY : 조회 결과를 특정 attribute(s) 기준으로 정렬하여 가져올 때 사용**==
- default 정렬 방식은 오름차순
- 오름차순 정렬은 **ASC**
- 내림차순 정렬은 **DESC**

<br>

**ex) 임직원들의 정보를 연봉 순서대로 정렬해서 알고싶음 - 오름차순**

![](brain/image/lecture09-1.png)

<br>

**ex) 임직원들의 정보를 연봉 순서대로 정렬해서 알고싶음 - 내림차순**

![](brain/image/lecture09-2.png)

<br><br>

**ex) 임직원들의 정보를 같은 부서 안에서 연봉 순서대로 정렬해서 알고싶음**

![](brain/image/lecture09-4.png)

- 앞에 적힌 `dept_id`로 먼저 정렬
	- MySQL에서는 NULL을 가장 작게 인식해서 먼저 나옴
- 부서 내에서 연봉 순서대로 정렬됨

<br>

<hr>

## 집계

==**집계 함수 (Aggregate function) : 여러 tuple 들의 정보를 요약해서 하나의 값으로 추출하는 함수**==

- 대표적으로 **COUNT, SUM, MAX, MIN, AVG** 함수
- (주로) 관심있는 attribute에 사용
	- ex) `AVG(salary)` , `MAX(birth_date)`
- **NULL 값들을 제외하고 요약 값 추출**

<br><br>

### COUNT

==**COUNT로 수를 셀 때는 애스터리스크(`*`)를 사용하는 것을 추천**==

<br>

**ex) 임직원의 수를 알고싶음**

![](brain/image/lecture09-5.png)

- 애스터리스크(`*`)는 튜플의 수를 의미

<br><br>

**ex) 포지션을 가지는 임직원의 수를 알고싶음**

![](brain/image/lecture09-6.png)

- 결과가 위와 동일한 것을 볼 수 있음
- attribute의 값에 중복이 있다고 하더라도 **중복을 포함해서 COUNT함**

<br><br>

**ex) 부서를 가지는 임직원의 수를 알고싶음**

![](brain/image/lecture09-7.png)

- NULL을 제외하고 중복을 포함하여 나머지 COUNT

<br><br>

**ex) 프로젝트 2002에 참여한 임직원의 수와 최대 연봉과 최소 연봉과 평균 연봉을 알고싶음**

![](brain/image/lecture09-8.png)

- `works_on` 테이블은 누가 어떤 프로젝트에 참여했는지에 대한 정보가 있으니까 참조해야함
- `employee` 테이블은 연봉 정보가 있으니까 참조해야함

<br>

<hr>

## 그룹

### GROUP BY

==**GROUP BY : 관심있는 attribute(s) 기준으로 그룹을 나눠서 그룹별로 aggregate function을 적용하고 싶을 때 사용**==
- grouping attribute(s) : 그룹을 나누는 기준이 되는 attribute(s)
- grouping attribute(s)에 **NULL 값이 있을 때는 NULL 값을 가지는 tuple끼리 묶임**
- 그룹을 기준으로 했으면 SELECT에 그 그룹 가져와야지 !

<br><br>

**ex) 각 프로젝트에 참여한 임직원의 수와 최대 연봉과 최소 연봉과 평균 연봉을 알고싶음**

![](brain/image/lecture09-9.png)

<br><br>

### HAVING

==**HAVING : aggregate function의 결과값을 바탕으로 그룹을 필터링하고 싶을 때 사용**==
- GROUP BY와 함께 사용
- HAVING 절에 명시된 조건을 만족하는 그룹만 결과에 포함됨

<br><br>

**ex) 프로젝트 참여 인원이 7명 이상인 프로젝트들에 대하여 각 프로젝트에 참여한 임직원의 수와 최대 연봉과 최소 연봉과 평균 연봉을 알고싶음**

![](brain/image/lecture09-10.png)

<br>

<hr>

## 예제

**ex) 각 부서별 인원 수를 인원 수가 많은 순서대로 정렬해서 알고싶음**

![](brain/image/lecture09-11.png)

<br><br>

**ex) 각 부서별 - 성별 인원 수를 인원 수가 많은 순서대로 정렬해서 알고싶음**

![](brain/image/lecture09-12.png)

<br><br>

**ex) 회사 전체 평균 연봉보다 평균 연봉이 적은 부서들의 평균 연봉을 알고싶음**

![](brain/image/lecture09-13.png)

<br><br>

**ex) 각 프로젝트 별로 프로젝트에 참여한 90년대생들의 수와 이들의 평균 연봉을 알고싶음**

![](brain/image/lecture09-14.png)
- `ROUND()`는 소숫점 이하 반올림

![](brain/image/lecture09-15.png)
- 이 결과를 `proj_id` 기준으로 정렬한 것

<br><br>

**ex) 프로젝트 참여 인원이 7명 이상인 프로젝트에 한정해서 각 프로젝트 별로 프로젝트에 참여한 90년대생들의 수와 이들의 평균을 알고싶음**

- 내가 걸어주려는 조건이 어떤 조건인지에 따라 WHERE 절에 명시할건지, HAVING절에 조건을 명시할 건지 파악해야함

![](brain/image/lecture09-16.png)

![](brain/image/lecture09-17.png)

<br>

**만약 위 예제에서 HAVING절에 조건을 걸었다면?**

![](brain/image/lecture09-19.png)

- HAVING절에 사용된 COUNT는 그룹핑을 한 뒤에 그 그룹에 대해 카운트를 한 값이다.
	- 이 COUNT의 의미는 각 부서별로 90년대생에 대한 카운트이다.
	- 각 부서별 90년대 생에 대한 참여를 카운트 한 것

<br><br>

### SELECT 최종 정리

==**SELECT 조회 요약**==

```sql
SELECT 속성(들) 혹은 집계함수(들)
FROM 테이블(들)
[WHERE 조건(들)]
[GROUP BY 그룹속성(들)]
[HAVING 그룹속성(들)]
[ORDER BY 속성(들)];
```

<br>

==**SELECT 개념적인 실행 순서**==
- [select](brain/Lecture/db/easy-db/lecture05.md) 쿼리에서 각 절(phase)의 실행 순서는 **개념적인 순서**이다.
- select 쿼리의 실제 실행 순서는 각 RDBMS에서 어떻게 구현했는지에 따라 다름

1. **FROM** : 어떤 테이블로부터 조회할 것인지 혹은 join이 된 테이블들
2. **WHERE** : 가지고 오는 튜플들에 대해서 조건을 통해 필터링 해야한다면
3. **GROUP BY** : 그룹핑을 하고싶다면
4. **HAVING** : 그룹핑 이후 특정 그룹만 필터링 해서 가지고 오고싶다면
5. **ORDER BY** : 최종적인 select로 가져오기 직전에 정렬해서 가져오고싶다면
6. **SELECT** : 관심있는 속성이나 통계에 관하여 최종적인 조회