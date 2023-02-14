---
title: "[잔재미] List"
date: "2023-02-14 01:38"
enableToc: true
tags: ["잔재미코딩 파이썬"]
---

> 해당 게시글은 <a href='https://www.inflearn.com/course/python-crawling-basic' target='_blank'>파이썬 입문과 크롤링기초 부트캠프</a> 강의를 정리한 내용입니다.

<hr>

## 01. 리스트 자료형이란?

데이터 구조 - 리스트(list)라고 하는데, 여기서 데이터 구조란, 연관있는 데이터를 어떻게 컴퓨터로 효율적으로 다룰 수 있을 지에 관한 것이다.

- 리스트

- 여러 가지 관계가 있는 데이터를 하나의 변수로 다루는 방법

- `[ ]`안에 `,`를 사용해서 데이터를 넣으면 된다.

- 예시) `mydata = [1, 2, 'hello', 1.2]`

- 각 데이터는 인덱스를 사용해서 다룰 수 있다.

<br>  

- 리스트 선언 방법
	- 빈 배열을 만들 때는 `[]` 보다는 `list()`를 써주도록 하자.

```python
a = list()
b = []
c = [1, 2, 3]
d = ['Python', 'is', 'good']
e = [1, 2, ['Python', 'is', 'good']]
```
  
<br>

- 리스트 다루기 쉬운 방법 (간략한 버전)  

1. 리스트 선언

```
- 리스트변수 = [ ]
- 리스트변수 = list()
- 리스트변수 = [데이터1, 데이터2, ...]
```
  
2. 리스트 추가

```
- 리스트변수.append(데이터)
- 리스트변수.insert(인덱스번호, 데이터)
```

3. 리스트 삭제

```
- 리스트변수.remove(데이터)
- del 리스트변수[인덱스번호]
```
  
4. 리스트 데이터 수정

```
- 리스트변수[인덱스번호] = 수정할 데이터
```

<hr>

## 02. 인덱싱과 슬라이싱

리스트 역시 문자열과 동일하게 인덱싱과 슬라이싱을 할 수 있는데, 이를 잘 활용하여야 한다.  

<br>

### 리스트의 인덱싱

<br>  

```python
a = [1, 2, 3]
print(a[0] + a[2])
  
출력결과 : 4
```

<br>

```python
a = [1, 2, 3, ['a', 'b', 'c']]
print(a[0])
print(a[3])
print(a[-1])
  
출력결과 : 1
출력결과 : ['a', 'b', 'c']
출력결과 : ['a', 'b', 'c']
```

<br>  

- 이중 리스트

**C언어의 2차원 배열 느낌도 생각하자. `list[][]`**

```python
a = [1, 2, 3, ['a', 'b', 'c']]
print(a[3][0])
print(a[-1][0])
  
출력결과 : a
출력결과 : a
```
  
<br>

- 삼중 리스트

```python
a = [1, 2, ['a', 'b', ['Python', 'is', 'good']]]
print(a[2][2][0])
  
출력결과 : Python
```

<br>
  
### 리스트의 슬라이싱

<br>

```python
a = [1, 2, 3, 4, 5]
b = a[:2]
c = a[2:]

print(b)
print(c)
  
출력결과 : [1, 2]
출력결과 : [3, 4, 5]
```

- 중첩된 리스트 슬라이싱

```python
a = [1, 2, 3, ['a', 'b', 'c'], 4, 5]
print(a[2:5])
print(a[3][:2])
  
출력결과 : [3, ['a', 'b', 'c'], 4]
출력결과 : ['a', 'b']
```

<br>

### split()으로 리스트 다루기  

<br>

> 사용자로부터 주민등록번호를 입력 받고, 사용자가 남성인지 여성인지 출력하시오. (주민등록번호 뒷자리의 시작이 1이거나 3이면 남성, 2이거나 4이면 여성이다.)  

```python
data = input("주민등록번호를 '-' 포함해서 입력하세요. ")
  
if (int(data.split('-')[1][0]) == 1) or (int(data.split('-')[1][0]) == 3):
	print("남성입니다.")

elif (int(data.split('-')[1][0]) == 2) or (int(data.split('-')[1][0]) == 4):
	print("여성입니다.")

else:
	print("잘못된 주민등록번호 입니다.")
```

<hr>

## 03. 리스트 연산하기

<br>  

```python
a = [1, 2, 3]
b = [4, 5, 6]

# 리스트 더하기
print(a + b)
출력결과 : [1, 2, 3, 4, 5, 6]
  
# 리스트 곱하기 (반복)
print(a * 3)
출력결과 : [1, 2, 3, 1, 2, 3, 1, 2, 3]
  
# 리스트 길이 구하기
print(len(a))
출력결과 : 3
```
  
- 리스트 연산 오류

```python
a = [1, 2, 3]
print(a[2] + "hi")
print(str(a[2]) + "hi")
  
출력결과 : TypeError: unsupported operand type(s) for +: 'int' and 'str'
출력결과 : 3hi
```
  
<hr>

## 04. 수정, 삭제, 추가

<br>

### 리스트 수정
  
<br>

```python
language = ["python", "java", "c++"]
language[2] = "c"
print(language)
  
출력결과 : ['python', 'java', 'c']
```

<br>
  
### 리스트 삭제

- del 함수 이용

- 리스트의 인덱스를 가르켜서 내용 삭제

```python
a = [1, 2, 3]
b = [1, 2, 3, 4, 5]
del a[1]
del b[:2]
  
print(a)
print(b)
  
출력결과 : [1, 3]
출력결과 : [3, 4, 5]
```
  
<br>

- remove 함수 이용

- 리스트의 내용을 가르켜서 삭제

- 첫 번째로 나오는 내용이 삭제된다.

```python
location = ['서울시', '경기도', '서울시', '부산시']
location.remove('서울시')
print(location)
  
출력결과 : ['경기도', '서울시', '부산시']
```
  
<br>
  
- pop 함수 이용

- 리스트의 맨 마지막 요소를 뽑아오고 그 요소는 리스트에서 삭제

```python
location = ['서울시', '경기도', '서울시', '부산시']
print(location.pop())
print(location)
  
출력결과 : 부산시
출력결과 : ['서울시', '경기도', '서울시']
```

<br>  

### 리스트 추가

- append 함수 이용

- append 함수는 하나의 요소만 추가 가능

- 리스트의 맨 마지막에 추가

```python
a = [1, 2, 3]

a.append(4)
print(a)
  
a.append([5, 6])
print(a)

출력결과 : [1, 2, 3, 4]
출력결과 : [1, 2, 3, 4, [5, 6]]
```

<br>  

- insert 함수 이용

- 지정한 인덱스에 요소 추가

```python
a = [1, 2, 3]

a.insert(3, 4)
print(a)

a.insert(0, 5)
print(a)

출력결과 : [1, 2, 3, 4]
출력결과 : [5, 1, 2, 3, 4]
```

<hr>

## 05. 리스트 다양한 함수들
  
- sort()
	- 리스트 요소 순서대로 정렬
- reverse()
	- 리스트 요소 역순으로 뒤집기 (순서대로 정렬하고 뒤집기 X)
- index()
	- 리스트에 해당 값이 있으면 그 위치를 반환
- find()
	- 리스트에 해당 값이 있으면 그 위치를 반환
- count()
	- 리스트에 포함된 요소의 개수 세기
- extend()
	- 리스트 확장
  
<br>

**sort(), reverse()**

```python
a = [2, 1, 4, 3]
a.sort()
print(a)
  
b = [2, 1, 4, 3]
b.reverse()
print(b)
  
출력결과 : [1, 2, 3, 4]
출력결과 : [3, 4, 1, 2]
```

<br>

```python
# 만약, 역순으로 순서대로 배치하고 싶으면, sort -> reverse
a = [1, 8, 0, 9, 14]
a.sort()
a.reverse()
print(a)
  
출력결과 : [14, 9, 8, 1, 0]
```
  
<br><br>

**index()**

```python
a = [1, 2, 3, 4]
print(a.index(1))
print(a.index(3))
print(a.index(5))
  
출력결과 : 0
출력결과 : 2
출력결과 : ValueError: 5 is not in list
```
  
<br><br>

**index()와 find() 비교**

- 이 둘은 비슷한 역할을 하는 것 같지만, 조금 다르다.

```python
# index()의 경우
letters = input()
var = letters.index('n')

if var >= 0:
	print("입력한 문자에 n이 있습니다.")
else:
	print("입력한 문자에 n이 없습니다.")

출력결과 : n이 있으면 -> 입력한 문자에 n이 있습니다.
출력결과 : n이 없으면 -> Value Error

# find()의 경우
letters = input()
var = letters.find('n')

if var >= 0:
	print("입력한 문자에 n이 있습니다.")
else:
	print("입력한 문자에 n이 없습니다.")

출력결과 : n이 있으면 -> 입력한 문자에 n이 있습니다.
출력결과 : n이 없으면 -> 입력한 문자에 n이 없습니다.
```

<br>

사용자가 입력한 것에 n이 있다면 정상적으로 "입력한 문자에 n이 있습니다."라고 출력 되지만, n이 없는 경우, `index()`는 Value Error가 출력되고 `find()`는 정상적으로 값이 출력된다.
  

<br>

이는, [[잔재미] String](notes/TIL/fragment/lang/python/funny/funny03)에 기록되어있는 내용인데, `find()`는 없는 값을 찾으면 -1을 반환하지만, `index()`는 없는 값을 찾으면 오류를 반환하기 때문이다.

<br><br>

**count()**

```python
a = [1, 2, 3, 1, 1, 5]
print(a.count(1))
  
출력결과 : 3
```
  
<br><br>
  
**extend()**

- 함수 안에는 리스트만 올 수 있다.

- 원래의 리스트에 `()`안의 리스트를 더하는 것이다.

```python
a = [1, 2, 3]
a.extend([4, 5])
print(a)
  
출력결과 : [1, 2, 3, 4, 5]
```

<br>

```python
a = [1, 2, 3]
b = [4, 5]
a.extend(b)
print(a)
  
출력결과 : [1, 2, 3, 4, 5]
```
  
<br>

- 리스트 연산 더하기와 유사함을 알 수 있다.

```python
a = [1, 2, 3]
a += [4, 5]
print(a)
  
출력결과 : [1, 2, 3, 4, 5]
```