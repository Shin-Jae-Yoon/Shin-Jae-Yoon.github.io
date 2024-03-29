---
title: "05 - Tuple"
date: "2023-02-14 01:42"
enableToc: true
tags: ["🖥️ 잔재미코딩 파이썬"]
---

> 해당 게시글은 <a href='https://www.inflearn.com/course/python-crawling-basic' target='_blank'>파이썬 입문과 크롤링기초 부트캠프</a> 강의를 정리한 내용입니다.

<hr>

## 01. 튜플 자료형이란?

<br>

튜플 자료형은 리스트 자료형과 매우 유사하다. 하나의 다른 점이 있는데 그것이 리스트 자료형과 튜플 자료형을 구분한다. `튜플 자료형은 값의 변경이 불가능하다는 점이다.` 리스트는 여러 가지 함수를 이용하여 리스트의 길이를 늘렸다가 줄였다가 하면서 값을 추가, 삭제, 수정을 하였는데 튜플은 그런 것이 불가능하고, 처음 선언한 그대로 사용해야 한다.  

<br>

그러면, 상황에 맞춰서 가변적으로 변하는 리스트를 사용하는 것이 편하고 좋지 않냐고 물을 수 있다. 물론, 리스트를 훨씬 많이 사용하지만, 튜플이 필요한 경우가 있다. 간단하게 말하면 리스트는 동적배열이고 가변 객체이기 때문에 튜플보다 무겁고 오버헤드가 크다. 상황에 따라 정적배열이며 불변객체인 튜플을 사용하는 것이 퍼포먼스를 높이는 데 도움을 줄 수 있다. 자세한 내용은 <a href='https://jae-yoon.tistory.com/4' target='_blank'>개발자 유니</a>에 추가로 포스팅하였다.

<br>

- 튜플
	- 리스트와 유사하게, 여러 가지 관계가 있는 데이터를 하나의 변수로 다루는 방법
	- `( )`안에 `,`를 사용해서 데이터를 넣으면 된다.
	- 예시) `mydata = (1, 2, 3)`

<br>

- **데이터 구조 : 튜플**
	- 선언 + 입력 : `변수명 = (1, 2, 3, 4)`
	- 읽기 : `변수명[인덱스번호]`
	- 추가 : 불가
	- 삭제 : 불가
	- 수정 : 불가

<br>

- 튜플 선언 방법

- 빈 배열을 만들 때는 `()`를 사용하겠지만, 사실상 튜플은 사용할 일 없다.

```python
a = tuple()
b = ()
c = (1,) # tuple에 값이 하나일 경우 (값,) 이렇게 콤마를 넣어야한다.
d = (1, 2, 3)
e = 1, 2, 3 # 괄호를 생략해도 무방, 즉, 괄호가 없는 값의 나열은 튜플로 취급한다.
f = ('a', 'b', ('ab', 'cd'))
```

<hr>

## 02. 튜플 다루기

<br>

튜플도 데이터 구조이기 때문에 슬라이싱, 인덱싱 모두 가능하다.

```python
a = (1, 2, 3, 'a', 'b')
print(a[:2])
  
출력결과 : (1, 2)
```

<br>

튜플끼리 더하기, 반복하는 표현인 `*`도 가능하다.

```python
a = (1, 2, 3)
b = (4, 5, 6)
  
print(a + b)
print(a * 3)
print(len(a))
  
출력결과 : (1, 2, 3, 4, 5, 6)
출력결과 : (1, 2, 3, 1, 2, 3, 1, 2, 3)
출력결과 : 3
```

<br>

튜플은 리스트와 굉장히 유사하다고 했는데, 서로 간단하게 type을 변경할 수 있다.

```python
data_tuple = (1, 2, 3)
print(type(data_tuple))
출력결과 : tuple
  
data_list = list(data_tuple)
print(type(data_list))
출력결과 : list

data_tuple = tuple(data_list)
print(type(data_tuple))
출력결과 : tuple
```

<hr>

## 03. 튜플 응용

- 튜플을 이용한 값 변경

우리가 흔히 변수에 대입되어 있는 값을 변경할 때는 `temp`라는 임시 변수를 두고 변경하는 경우가 많았다.

```python
a = 1
b = 2
  
temp = a
a = b
b = temp
  
print("a의 값은 %d 입니다." % a)
print("b의 값은 %d 입니다." % b)
  
출력결과 : a의 값은 2 입니다.
출력결과 : b의 값은 1 입니다.
```

<br>

하지만, 튜플 자료형을 이용하는 python에서는 이렇게도 가능하다.

```python
a = 1
b = 2
a, b = b, a

print("a의 값은 %d 입니다." % a)
print("b의 값은 %d 입니다." % b)
  
출력결과 : a의 값은 2 입니다.
출력결과 : b의 값은 1 입니다.
```

그 이유는 `a, b = b, a`라고 하면 괄호가 생략된 형태의 튜플로 이해할 수 있기 때문이다. 실제로는 `(a, b) = (b, a)`인데, 튜플 하나가 하나의 변수로 취급되면서 내부의 값이 일대일로 대응하여 b는 a로, a는 b로 대입되기 때문이다.

<br>  

- 이를 응용하면 함수의 return 값도 튜플을 이용해 하나 이상의 값을 반환할 수 있다.

```python
def mul_return(a):
	b = a + 1
	return a, b

mul_return(1)
출력결과 : (1, 2)
```
  
`return a, b`는 사실상 `return (a, b)`와 동일한 것이다. `(a, b)`라는 튜플 하나를 반환하는 것이다.

<br>  

- 추가적으로, 튜플을 가장 흔히 볼 수 있는 형태는 리스트 내부에 있는 형태이다.

```python
data = [(1, 2), (3, 4), (5, 6)]
```