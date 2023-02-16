---
title: "Condition"
date: "2023-02-14 01:45"
enableToc: true
tags: ["🖥️ 잔재미코딩 파이썬"]
---

> 해당 게시글은 <a href='https://www.inflearn.com/course/python-crawling-basic' target='_blank'>파이썬 입문과 크롤링기초 부트캠프</a> 강의를 정리한 내용입니다.

<hr>

## 01. 조건문 (if문)

<br>

조건문은 어떠한 조건이 주어졌을 때, 그 조건에 해당한다면 명령어를 실행, 해당하지 않는다면 다른 명령어를 실행하는 구조이다. 즉, `참과 거짓을 판단하는 문장`으로 이해해도 무방하다. 다른 언어에서 많이 배웠으니 특별한 건 없다.

<br>

```python
if 조건문:
	수행할 문장1
elif 조건문:
	수행할 문장2
		수행할 문장2-2
		수행할 문장2-3
else:
	수행할 문장3
```

<br>  

파이썬의 조건문에서 주의할 점은 조건 끝에 `:` 세미 콜론을 반드시 붙이는 것과 수행할 문장을 `들여쓰기` 하는 것이다. 내가 배웠던 C나 Java처럼 `{ }`로 묶는 것이 아니라 익숙하지 않을 것이다.

<br>

들여쓰기에 관해서는 `탭(Tab)`으로 할 지 `공백(Space bar)`로 할 지는 의견이 갈린다. 나는 보통 탭을 사용하지만, 최근 파이썬 커뮤니티의 트렌드는 `공백(Space bar) 4번`을 쓰는 것을 권장한다고 한다. 그래서 나는 VScode 들여쓰기를 스페이스바 4번으로 설정해놨다.  

<hr>
## 02. value와 data type 비교

<br>

다른 언어에서도 값(value)과 자료형(data type)을 비교하는 방법이 존재한다. 자바 스크립트의 경우 `===` 연산자를 통해 간단하게 확인할 수도 있고, 자바의 경우 `equals()`를 통해 객체의 값이 같은지 확인할 수도 있다.  

파이썬에서는 **값(Value)을 비교하는 경우는 `==`를 사용**하고, **객체(Object)를 비교하는 경우는 `is`를 사용**한다. 예시를 통해 자세히 살펴보겠다.  

<br>

- 값이 다르고, 객체도 다른 경우

```python
a = 1
b = 2

if a == b:
	print("a와 b의 값이 동일")
else:
	print("a와 b의 값이 다름")

if a is b:
	print("a와 b의 객체 같음")
else:
	print("a와 b의 객체 다름")

출력결과 : a와 b의 값이 다름
출력결과 : a와 b의 객체 다름
```

<br><br>

- 값이 똑같고, 객체도 같은 경우 (1)

```python
a = 1
b = 1

if a == b:
	print("a와 b의 값이 같음")
else:
	print("a와 b의 값이 다름")

if a is b:
	print("a와 b의 객체 같음")
else:
	print("a와 b의 객체 다름")

출력결과 : a와 b의 값이 같음
출력결과 : a와 b의 객체 같음
```

<br><br>

- 값이 똑같고, 객체도 같은 경우 (2)

```python
a = [1, 2, 3]
b = a

if a == b:
	print("a와 b의 값이 같음")
else:
	print("a와 b의 값이 다름")

if a is b:
	print("a와 b의 객체 같음")
else:
	print("a와 b의 객체 다름")

출력결과 : a와 b의 값이 같음
출력결과 : a와 b의 객체 같음
```

<br>

- **값은 같은데, 객체가 다른 경우**

```python
a = [1, 2, 3]
b = [1, 2, 3]
  
if a == b:
	print("a와 b의 값이 같음")
else:
	print("a와 b의 값이 다름")

if a is b:
	print("a와 b의 객체 같음")
else:
	print("a와 b의 객체 다름")

출력결과 : a와 b의 값이 같음
출력결과 : a와 b의 객체 다름
```

<hr>

## 02. 조건부 표현식 (삼항연산자)

<br>
  
삼항연산자는 조건문이 길어지는 것을 한 문장으로 줄여서 가독성이 좋고 편의상 사용하는 것을 뜻한다. 보통 다른 언어에서는 아래와 같은 형식을 지원한다.

- `[condition] ? [true_value] : [false_value]`

- 조건(condition)이 참이면 `:`의 왼쪽을 실행, 거짓이면 우측을 실행한다.  

<br>


```c++
#include <stdio.h>
  
int main()
{
	int num1 = 5;
	int num2;
	
	num2 = num1 ? 100 : 200;
	// num1이 참이면 num2에 100을 할당, 거짓이면 num2에 200을 할당

	printf("%d\n", num2);
	// 100: num1이 5이므로 참. num2에는 100이 할당됨
	
	return 0;
}
```

<br>  

하지만, 파이썬에서는 위와 같은 형태를 지원하지 않는다.  

- `[true_value] if [condition] else [false_value]`

- 영어식 표현으로 조금 더 직관적으로 이해 가능하다.

<br>

  

```python
a = 10
print("짝수") if a % 2 == 0 else print("홀수")

출력결과 : 짝수
```

<br>

```python
arr = [1, 30, 20, -10, 10, 0, 24, 60, 3, -29]
min_value = arr[0]
max_value = arr[0]
  
for val in arr:
	min_value = val if val < min_value else min_value
	max_value = val if val >= max_value else max_value
  
	print(f"min_value : {min_value}")
	print(f"max_value : {max_value}")

출력결과 : min_value : -29
출력결과 : max_value : 60
```

<br>

참고로, 삼항 연산자도 중첩하여 elif를 표현하는 것이 가능하기는 한데, 그냥 사용 안하는 것이 더 직관적이므로 조건이 늘어나면 그냥 if문을 사용하자.

<hr>

## 03. 특이한 조건문  

<br>

파이썬은 문자, 리스트를 다루는 것에 강점을 가진 언어이다 보니 특이한 조건문을 지원한다. 해당하는 값이 안에 존재하면 True 없다면 False를 반환해준다.

<br>

| in | not in |
| -- | -------|
| x in 문자열 | x not in 문자열 |
| x in 리스트 | x not in 리스트 |
| x in 튜플 | x not in 튜플 |
  
<br>

```python
print(1 in [1, 2, 3])
출력결과 : True
  
print(1 not in [1, 2, 3])
출력결과 : False
```

<br>  

```python
pocket = ['paper', 'cellphone', 'money']

if 'money' in pocket:
	print("택시를 타고 가라")
else:
	print("걸어가라")  

출력결과 : 택시를 타고 가라
```

<br>

- 조건문의 참과 거짓에 따라 아무것도 안하게 하려면 `pass`를 사용한다.

```python
pocket = ['paper', 'cellphone', 'money']
if 'money' in pocket:
	pass
else:
	print("돈이 없으면 카드를 내야지")

출력결과 :
```