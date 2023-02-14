---
title: "[잔재미] for문"
date: "2023-02-14 01:46"
enableToc: true
tags: ["잔재미코딩 파이썬"]
---

> 해당 게시글은 <a href='https://www.inflearn.com/course/python-crawling-basic' target='_blank'>파이썬 입문과 크롤링기초 부트캠프</a> 강의를 정리한 내용입니다.

## 01. for문 기본 구조

- 리스트, 튜플, 문자열 이용

```python
for 변수 in (리스트, 튜플, 문자열):
	실행문1
	실행문2

	...
```

<br>

- range() 이용

```python
for 변수 in range(정수):
	print(변수)
```

가장 기본적인 두 가지 구조이다. range()이용은 아래에서 다루도록 하고 다양한 예시를 통하는 것이 이해가 빨라서 여러 가지 예시를 들겠다.

<br>
  
- 리스트  

```python
test_list = ['one', 'two', 'three']
  
for i in test_list:
	print(i)
  
[출력]
one
two
three
```

<br>

- 튜플 응용  

```python
a = [(1,2), (3,4), (5,6)]

for (first, last) in a:
	print(first + last)

[출력]
3
7
11
```

<br>  

```python
score = [90, 25, 67, 45, 80]
student_number = 0
  
for i in score:
	student_number = student_number + 1

	if i >= 60:
		print("%d번 학생은 합격입니다." % student_number)
	else:
		print("%d번 학생은 불합격입니다." % student_number)

[출력]
1번 학생은 합격입니다.
2번 학생은 불합격입니다.
3번 학생은 합격입니다.
4번 학생은 불합격입니다.
5번 학생은 합격입니다.
```

<br>

- continue 이용

반복문 수행 도중 continue 만나면 그 즉시 다음 반복으로 진행한다. 아래의 예시에서 점수 변수 i가 60보다 작으면 조건이 참이니까 continue를 만나서 print()를 실행하지 않고 다음으로 넘어간다. 만약 60보다 크다면 조건문 입장에서는 거짓이니까 continue를 실행하지 않고 아래의 print()문을 실행하는 것이다.  

```python
score = [90, 25, 67, 45, 80]
student_number = 0
  
for i in score:
	student_number = student_number + 1
	if i < 60:
		continue
	print("%d번 학생 축하합니다. 합격입니다. " % student_number)
```

<br><br>  

## 02. for문과 range 함수  

for문을 쓸 때 리스트, 튜플, 문자열 외에도 간단히 숫자를 이용한 반복을 원할 때가 있다. 그때 사용하는 것이 `range()` 함수이다.

- `range(10)`의 형태는 0 이상 10 미만의 숫자를 포함하는 range 객체 생성

- `range(1,10)`의 형태는 1이상 10 미만의 숫자를 포함하는 range 객체 생성  

```python
sum = 0

for i in range(1, 11):
	sum = sum + i
	print(sum)

[출력]
55
```

<br>

- 배열의 길이를 range()에 적용시킨 예제

```python
score = [90, 25, 67, 45, 80]
for student_number in range(len(score)):
	if score[student_number] < 60:
		continue
	print("%d번 학생 축하합니다. 합격입니다." % (student_number + 1))
```
<br>

- range() 이용 구구단, 이중 for문

`print('')` 공백 print()문 넣음으로 인해 줄바꿈 효과 넣은 것

```python
for i in range(2,10): # ①번 for문
	for j in range(1, 10): # ②번 for문
		print(i * j, end=" ")
	print('')

[출력]
2 4 6 8 10 12 14 16 18
3 6 9 12 15 18 21 24 27
4 8 12 16 20 24 28 32 36
5 10 15 20 25 30 35 40 45
6 12 18 24 30 36 42 48 54
7 14 21 28 35 42 49 56 63
8 16 24 32 40 48 56 64 72
9 18 27 36 45 54 63 72 81
```

<br><br>

## 03. 리스트 안에 for문 넣기 (리스트 내포)
  
리스트 내포하는 방법은 `[표현식 for 항목 in 반복가능객체 if 조건문]` 이다. 조건이 필요하지 않다면 `if 조건문` 부분은 빼도 된다.

<br>  

- 리스트 내포 전

```python
a = [1, 2, 3, 4]
result = []

for num in a:
	result.append(num * 3)
	print(result)

[출력]
[3, 6, 9, 12]
```

<br>  

- 리스트 내포 후

```python
a = [1, 2, 3, 4]
result = [num * 3 for num in a]
print(result)
  
[출력]
[3, 6, 9, 12]
```

<br>

- 조건문 포함 리스트 내포

```python
a = [1, 2, 3, 4]
result = [num * 3 for num in a if num % 2 == 0]
print(result)

[출력]
[6, 12]
```

<br>

- 리스트 내포 구구단 (이중 for문)

```python
result = [x * y for x in range(2, 10)
				for y in range(1, 10)]
print(result)

[출력]

[2, 4, 6, 8, 10, 12, 14, 16, 18, 3, 6, 9, 12, 15, 18, 21, 24, 27, 4, 8, 12, 16, 20, 24, 28, 32, 36, 5, 10, 15, 20, 25, 30, 35, 40, 45, 6, 12, 18, 24, 30, 36, 42, 48, 54, 7, 14, 21, 28, 35, 42, 49, 56, 63, 8, 16, 24, 32, 40, 48, 56, 64, 72, 9, 18, 27, 36, 45, 54, 63, 72, 81]
```