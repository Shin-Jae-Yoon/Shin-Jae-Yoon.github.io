---
title: "08 - Bool"
date: "2023-02-14 01:44"
enableToc: true
tags: ["🖥️ 잔재미코딩 파이썬"]
---

> 해당 게시글은 <a href='https://www.inflearn.com/course/python-crawling-basic' target='_blank'>파이썬 입문과 크롤링기초 부트캠프</a> 강의를 정리한 내용입니다.

<hr>

## 01. 불 자료형이란?

<br>

불 자료형은 참(True)과 거짓(False)를 다루는 자료형이다.

- True : 참

- False : 거짓

<br>  

단순히 참과 거짓을 판별하는 것 이외에도 `자료형을 참과 거짓으로 판단할 수 있다.`

- 문자열, 리스트, 튜플, 딕셔너리, 집합 등의 `값이 비어있으면 거짓, 있으면 참`

- `0`은 False, `1`은 True

- `None`은 False

파이썬은 모든 것을 `객체`로 다룬다. 그 중 `NoneType` 클래스의 유일한 객체인 None은 값 자체가 없거나 존재하지 않거나 등의 경우를 의미한다. None에 대한 자세한 내용은 <a href='https://jae-yoon.tistory.com/5' target='_blank'>개발자 유니</a>에 추가로 포스팅했다.
  
```python
print(type(None))
print(bool(None))
print(bool('None'))
  
출력결과 : <class 'NoneType'>
출력결과 : False # None은 False
출력결과 : True # 이 None은 문자열 None이니까, True
```

<hr>

## 02. 불 자료형 다루기  

<br>

- 리스트 내부에 값이 있으면 참이라는 것을 이용하여 반복문에 활용한 경우

```python
a = [1, 2, 3, 4]
while a :
	print(a.pop())

출력결과 :
4
3
2
1
```
  
- 리스트 내부에 값이 있으면 True, 없으면 False를 이용하여 조건문에 활용한 경우

```python
if []:
	print("참")
else:
	print("거짓")

출력결과 : 거짓
  
if [1, 2, 3, 4]:
	print("참")
else:
	print("거짓")

출력결과 : 참
```
  
- bool 값이 True 인지 False 인지 잘 모르겠으면 `bool()`을 사용하자

```python
print(bool([1,2,3]))
print(bool([]))
print(bool(0))
print(bool(3))
  
출력결과 : True
출력결과 : False
출력결과 : False
출력결과 : True
```