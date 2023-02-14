---
title: "[잔재미] Set"
date: "2023-02-14 01:43"
enableToc: true
tags: ["잔재미코딩 파이썬"]
---

> 해당 게시글은 <a href='https://www.inflearn.com/course/python-crawling-basic' target='_blank'>파이썬 입문과 크롤링기초 부트캠프</a> 강의를 정리한 내용입니다.

## 01. 집합 자료형이란?

<br>

집합에 관련된 것을 쉽게 처리하기 위해 만든 자료형이다. 집합 자료형은 대표적인 특징이 두 가지가 있다.

- 중복을 허용하지 않는다.
- 순서가 없다.

이 특징을 이용하여 `자료형의 중복을 제거하기 위한 필터 역할`로 사용할 수 있다. 또, 순서가 없다는 특징에서 리스트와 튜플처럼 인덱싱으로 접근할 수 없다. 딕셔너리와 비슷하다는 의미이다. 굳이 인덱싱으로 접근하고 싶다면 집합을 리스트나 튜플로 변환해서 사용하면 된다.

<br>

- **데이터 구조 : 집합**
	- 선언 + 입력 : `변수명 = set()`, `변수명 = {데이터1, 데이터2, ... }`, `변수명 = set(데이터1)`, `변수명 = set({데이터1, 데이터2, ... })`
	- 읽기 : 그냥 읽어도 되고 반복문이나 조건문 이용
	- 추가 : 값 1개 추가 `add()`, 값 여러 개 추가 `update()`
	- 삭제 : `remove()`

<br><br>

## 02. 집합 다루기

<br>

집합을 다루기에 앞서 리스트, 튜플, 딕셔너리, 집합 빈 배열을 만드는 방법을 정리해보자면 아래와 같다.

```python
data_list = list() # []
data_tuple = tuple() # ()
data_dict = dict() # {}
data_set = set() # {}
```

`{}`는 딕셔너리와 동일하기 때문에 보통 빈 집합을 만들때는 `set()`을 주로 사용한다.  

<br>

집합을 선언하는 것에는 여러 방법이 있다. 그 중 `{}`를 사용하는 방법을 딕셔너리와 헷갈리지 말자. 딕셔너리는 `{ 키 : 값 }`의 대응관계를 나타내줘야 하지만, 집합은 그냥 `{데이터1, 데이터2}` 이렇게 콤마로 나열해주면 된다.

```python
data_set = set()
data_set1 = set({'data1', 'data2', 'data3'})
data_set2 = set(['data1', 'data2', 'data3'])
data_set3 = {'data1', 'data2', 'data3'}
  
print(data_set)
print(data_set1)
print(data_set2)
print(data_set3)
  
출력결과 : set()
출력결과 : {'data2', 'data3', 'data1'}
출력결과 : {'data2', 'data3', 'data1'}
출력결과 : {'data2', 'data3', 'data1'}
```
  
<br>

집합을 읽을 때 그냥 읽어도 되지만 반복문을 이용해서 하나씩 읽을 수도 있다.

```python
# 반복문 이용
smartphone = {'삼성', '애플', 'LG', '화웨이'}
  
for data in smartphone:
	print(data)

출력결과 :
애플
화웨이
LG
삼성
  
# 조건문 이용
if '삼성' in smartphone:
	print(smartphone)

출력결과 : {'애플', '화웨이', 'LG', '삼성'}
```

<br> <br>

1. 교집합

`&` 혹은 `s1.intersection(s2)` 사용

```python
smartphone = {'삼성', '애플', 'LG', '화웨이'}
television = {'샤오미', '삼성', 'LG', '소니'}

# 스마트폰, TV 둘 다 생산하는 업체
print(smartphone & television)
print(smartphone.intersection(television))
  
출력결과 : {'LG', '삼성'}
출력결과 : {'LG', '삼성'}
```
  
<br><br>

2. 합집합

`|` 혹은 `s1.union(s2)` 사용

```python
smartphone = {'삼성', '애플', 'LG', '화웨이'}
television = {'샤오미', '삼성', 'LG', '소니'}
  
# 스마트폰 또는 TV를 생산하는 업체
print(smartphone | television)
print(smartphone.union(television))
  
출력결과 : {'샤오미', '삼성', '화웨이', 'LG', '애플', '소니'}
출력결과 : {'샤오미', '삼성', '화웨이', 'LG', '애플', '소니'}
```
  
<br><br>

3. 차집합

`-` 혹은 `s1.difference(s2)` 사용

```python
smartphone = {'삼성', '애플', 'LG', '화웨이'}
television = {'샤오미', '삼성', 'LG', '소니'}
  
# 스마트폰만 생산하는 업체
print(smartphone - television)
print(smartphone.difference(television))
  
출력결과 : {'애플', '화웨이'}
출력결과 : {'애플', '화웨이'}
```

<br><br>

4. 대칭차집합

`^` 사용, 전체에서 교집합을 뺀 것

```python
smartphone = {'삼성', '애플', 'LG', '화웨이'}
television = {'샤오미', '삼성', 'LG', '소니'}

# 스마트폰, TV 둘 다 생산하는 업체를 제외한 나머지
print(smartphone ^ television)
  
출력결과 : {'샤오미', '화웨이', '애플', '소니'}
```

<br><br>
  
## 03. 집합 다양한 함수들

<br>

- add()
	- 값 1개 추가
- update()
	- 값 여러 개 추가
- remove()
	- 특정 값 제거
- in()
	- 집합 내 특정 값 있는지 조사

<br>

**add(), update(), remove()**

```python
s1 = set([1, 2, 3])
s1.add(4)
print(s1)

출력결과 : {1, 2, 3, 4}

s2 = set([1, 2, 3])
s2.update([4, 5, 6])
print(s2)

출력결과 : {1, 2, 3, 4, 5, 6}

s2.remove(5)
print(s2)

출력결과 : {1, 2, 3, 4, 6}
```

<br><br>

**in()**

```python
smartphone = {'삼성', '애플', 'LG', '화웨이'}
print('모토로라' in smartphone)
print('삼성' in smartphone)
  
출력결과 : False
출력결과 : True
```

<br><br>

## 04. 집합 응용
  
<br>

집합은 보통 "`중복을 허용하지 않는다`" 이 특성을 이용한다. 어떠한 리스트 자료형에 수백만 수천만의 데이터를 추가하다보면 중복이 발생할 수 있는데, 이 리스트를 집합으로 바꿨다가 다시 리스트로 바꾸면 중복된 데이터가 사라진다.

```python
smartphone_list = ['애플', '삼성', '화웨이', '샤오미', '소니', 'LG', '애플', '삼성', '화웨이', '샤오미', '소니', 'LG', '애플', '삼성', '화웨이', '샤오미', '소니', 'LG', '애플', '삼성', '화웨이', '샤오미', '소니', 'LG', ]

data = set(smartphone_list)
print(data)

출력결과 : {'샤오미', '삼성', '화웨이', 'LG', '애플', '소니'}
# data를 다시 리스트로 바꿔서 사용하면 된다. list(data)
```