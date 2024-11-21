---
title: "03 - String"
date: "2023-02-14 01:37"
enableToc: true
tags: ["🖥️ 잔재미코딩 파이썬"]
---

> 해당 게시글은 <a href='https://www.inflearn.com/course/python-crawling-basic' target='_blank'>파이썬 입문과 크롤링기초 부트캠프</a> 강의를 정리한 내용입니다.

<hr>

## 01. 문자열 다루기 기본

<br>  

python은 문자열을 다루는데 특화된 프로그래밍 언어이다. 간결하면서 사용성은 매우 뛰어나다. 따라서, 크롤링을 공부하기에 매우 좋은 언어이다. 변수에 문자열을 지정할 때, `"내용"` 따옴표를 한 개씩만 넣었을 경우, 다음 줄로 넘어가면 EOF, End Of Line으로 한 줄을 넘어갔다고 오류가 발생할 수 있다. 그럴 경우, 당황하지 말고 `"""내용"""`와 같이 따옴표를 세 개씩 넣어주자. 이스케이프 문자 `\n`을 넣어서 표현할 수도 있으나, 따옴표를 연속적으로 쓰는 것이 깔끔하니 그렇게 사용하도록 하자.

<br>

```python
context = "South Korean director Bong Joon-ho has won the Cannes film festival's most prestigious award. The Palme d'Or was awarded for his film Parasite, a dark comedy thriller exploring social class dynamics. The festival came to a close this evening after 11 days of previews of new films and documentaries."  

print(context)

출력결과 : SyntaxError: EOL while scanning string literal
```

<br>

```python
context = """South Korean director Bong Joon-ho has won the Cannes film festival's most prestigious award.
The Palme d'Or was awarded for his film Parasite, a dark comedy thriller exploring social class dynamics.
The festival came to a close this evening after 11 days of previews of new films and documentaries."""

print(context)
출력결과 : context 안의 문자열
```

<br>  

문자열을 더하거나 곱할 수 있다. 더하는 것은 말 그대로 더하는 것이지만 곱하는 것은 문자열끼리 곱하는 것이 아닌, 반복을 의미한다.

```python
string1 = "Hello"
string2 = "World"
print(string1 + string2)
print(string1 * string2)
print(string1 * 2)
  
출력결과 : HelloWorld
출력결과 : TypeError: can't multiply sequence by non-int of type 'str'
출력결과 : HelloHello
```
  
<br>

문자열을 곱하는 것을 응용하면 아래와 같이 사용할 수 있다.

```python
print("=" * 20)
print("안녕하세요. 깔끔하죠?")
print("=" * 20)
  
출력결과 :
====================
안녕하세요. 깔끔하죠?
====================
```

<br>

문자열 길이를 구하는 대표적인 함수는 `len()` 함수가 있다.
  
```python
string = "나는 뛰어난 주니어 개발자입니다."
print(len(string))
  
출력결과 : 18
```
  
<br>
  
- **인덱스 (index)**

- 인덱스는 특정 데이터를 가리키는 번호를 나타냄

|p|y|t|h|o|n|
|:--:|:--:|:--:|:--:|:--:|:--:|
|0|1|2|3|4|5|
|-6|-5|-4|-3|-2|-1|
  
<br>

```python
some_string = "python"
print(some_string[0])
print(some_string[1])
print(some_string[-1])
print(some_string[-6])
  
출력결과 : p
출력결과 : y
출력결과 : n
출력결과 : p
```
  
- **슬라이싱 (slicing)**

- 시작 인덱스 ~ 해당 인덱스 직전의 인덱스까지 출력

```python
some_string = "python"
print(some_string[3:5]
print(some_string[1:5])
print(some_string[1:2])
  
출력결과 : ho
출력결과 : ytho
출력결과 : y
```
  
- 슬라이싱 응용

```python
some_string = "python"
print(some_string[:6]) # 문자열 시작 ~ 지정 인덱스 전까지
print(some_string[0:]) # 지정 인덱스 ~ 문자열 끝까지
print(some_string[:]) # 문자열 전체
  
출력결과 : python
출력결과 : python
출력결과 : python
```
  
- 슬라이싱 이용해서 문자열 나누기

```python
today = "20220219Sunny"
year = today[:4]
day = today[4:8]
weather = today[8:]
  
print(year, day, weather)
출력결과 : 2022 0219 Sunny
```

- 슬라이싱 이용해서 문자열 바꾸기

기본적으로 문자열 자료형은 그 요솟값을 바꿀 수 없는 immutable한 자료형이다. 이것이 의미하는 바는, python이라는 문자열이 있을 때, 아래와 같이 변경할 수 없다는 의미이다. 하지만, 슬라이싱 방법을 이용하면 가능하다.

  

```python
string = "python"
python[1] = "i"
  
print(string)
출력결과 : NameError: name 'python' is not defined
```

<br>
  
```python
string = "python"
new_string = string[:1] + "i" + string[2:]

print(new_string)
출력결과 : pithon
```

<hr>

## 02. 코드 이용 포매팅

<br>

|코드|설명|
|:--:|:--:|
|%s|문자열(string)|
|%c|문자 1개(character)|
|%d|정수(integer)|
|%f|부동소수(floating-point)|
|%o|8진수|
|%x|16진수|
|%%|Literal % (문자 % 자체)|

<br>
  
1. 숫자나 문자열 직접 대입

```python
string1 = "I eat %d bananas." % 3
string2 = "I eat %s bananas." % "sweet"

print(string1)
print(string2)
  
출력결과 : I eat 3 bananas.
출력결과 : I eat sweet bananas.
```

2. 변수 대입  

```python
number = 3
three = "3"
string1 = "I eat %d bananas." % number
string2 = "I eat %d bananas." % three
string3 = "I eat %c bananas." % three
string4 = "I eat %s bananas." % three

print(string1)
print(string2)
print(string3)
print(string4)

출력결과 : I eat 3 bananas.
출력결과 : TypeError: %d format: a number is required, not str
출력결과 : I eat 3 bananas.
출력결과 : I eat 3 bananas.
```

3. 두 개 이상의 값 대입  

```python
number1 = 5
number2 = 2
fruit = "bananas"
string = "I bought %d %s. But, %d %s were rotten." % (number1, fruit, number2, fruit)

print(string)
출력결과 : I bought 5 bananas. But, 2 bananas were rotten.
```
  
4. 포맷팅 연산자와 함께 % 문자 삽입하는 방법

```python
string1 = "Error is %d%." % 98
string2 = "Error is %d%%." % 98
print(string1)
print(string2)

출력결과 : ValueError: incomplete format
출력결과 : Error is 98%.
```

<br>

**포맷 코드와 숫자 함께 사용하기**

- 정렬과 공백

```python
string1 = "%10s" % "hi"
string2 = "%-10s" % "hi"

print(string1)
print(string2)

출력결과 : hi (10개의 공간에서 대입되는 값을 우측 정렬)
출력결과 : hi (10개의 공간에서 대입되는 값을 좌측 정렬)
```

- 소숫점 표현

```python
string1 = "%0.4f" % 3.42134234
string2 = "%10.4f" % 3.42134234

print(string1)
print(string2)

출력결과 : 3.4213
출력결과 : 3.4213 (숫자를 소숫점 네 번째 자리까지만 표시하고 전체 10개의 문자열 공간에서 오른쪽 정렬)
```

<hr>

## 03. format 이용 포매팅

<br>

1. 숫자나 문자열 직접 대입
  
```python
string1 = "I eat {0} bananas.".format(3)
string2 = "I eat {0} bananas.".format("sweet")

print(string1)
print(string2)
  
출력결과 : I eat 3 bananas.
출력결과 : I eat sweet bananas.
```

2. 변수 대입  

```python
number = 3
three = "3"
string1 = "I eat {0} bananas.".format(number)
string2 = "I eat {0} bananas.".format(three)
string3 = "I eat {0} bananas.".format("three") # 이건 변수 대입이 아니겠지.

print(string1)
print(string2)
  
출력결과 : I eat 3 bananas.
출력결과 : I eat 3 bananas.
출력결과 : I eat three bananas.
```

3. 두 개 이상의 값 대입  

```python
number1 = 5
number2 = 2
fruit = "bananas"
string1 = "I bought {0} {1}. But, {2} {3} were rotten.".format(number1, fruit, number2, fruit)
string2 = "I bought {2} {1}. But, {0} {3} were rotten.".format(number1, fruit, number2, fruit)

print(string1)
print(string2)

출력결과 : I bought 5 bananas. But, 2 bananas were rotten.
출력결과 : I bought 2 bananas. But, 5 bananas were rotten.
```

4. 이름으로 대입

```python
string = "I bought {number} {fruit}.".format(number=5, fruit="bananas")
print(string)
  
출력결과 : I bought 5 bananas.
```

5. 인덱스와 이름 혼용

```python
string = "I bought {0} {fruit}.".format(5, fruit="bananas")
print(string)
  
출력결과 : I bought 5 bananas.
```

6. 왼쪽 정렬, 오른쪽 정렬, 가운데 정렬  

```python
# 문자열의 자릿수는 10으로 한 것
left = "{0:<10}".format("hi")
right = "{0:>10}".format("hi")
center = "{0:^10}".format("hi")

print(left)
print(right)
print(center)
  
출력결과 : hi
출력결과 : hi
출력결과 : hi
```

7. 공백 채우기, "{0: '공백내용' '정렬방법' '자릿수'}".format("문자열")

```python
string1 = "{0:=^10}".format("hi")
string2 = "{0:!<10}".format("hi")
print(string1)
print(string2)

출력결과 : ====hi====
출력결과 : hi!!!!!!!!
```
  
8. 소숫점 표현하기

```python
pi = 3.141592
string1 = "{0:0.4f}".format(pi)
string2 = "{0:10.4f}".format(pi)

print(string1)
print(string2)
print(format(3.141592, "0.4f"))

출력결과 : 3.1416
출력결과 : 3.1416
출력결과 : 3.1416
```

9. `{` `}` 문자 사용하기

```python
string = "I bought {fruit} and {{apple}}. {apple} is delicious.".format(fruit="banana", apple="Apple")

print(string)

출력결과 : I bought banana and {apple}. Apple is delicious.
```

<hr>

## 04. f 문자열 이용 포매팅

- 참고 : f 문자열 포맷팅

python version 3.6부터 사용 가능한 기능

```python
name = "신재윤"
age = 27
string = f'나의 이름은 {name}입니다. 나이는 {age}입니다.'
  
print(string)
print(f'나의 이름은 {name}입니다. 나이는 {age}입니다.')
print(f'나의 이름은 {name}입니다. 나이는 {age+3}입니다.')
  
출력결과 : 나의 이름은 신재윤입니다. 나이는 27입니다.
출력결과 : 나의 이름은 신재윤입니다. 나이는 27입니다.
출력결과 : 나의 이름은 신재윤입니다. 나이는 30입니다.
```

- 딕셔너리 이용 f 문자열 포맷팅

```python
d = {"name" : "신재윤", "age" : 27}

print(f"나의 이름은 {d['name']}입니다. 나이는 {d['age']}입니다.")
출력결과 : 나의 이름은 신재윤입니다. 나이는 27입니다.
```

- f 문자열 포맷팅 이용 정렬

```python
# format 함수
print("{0:<10}".format("hi"))
print("{0:>10}".format("hi"))
print("{0:^10}".format("hi"))
  
# f 문자열 포맷팅
print(f'{"hi":<10}')
print(f'{"hi":>10}')
print(f'{"hi":^10}')
  
출력결과 : hi
출력결과 : hi
출력결과 : hi
```

- f 문자열 포맷팅 공백 채우기

```python
# format 함수
print("{0:=<10}".format("hi"))
print("{0:!>10}".format("hi"))
  
# f 문자열 포맷팅
print(f'{"hi":=<10}')
print(f'{"hi":!>10}')
  
출력결과 : hi========
출력결과 : !!!!!!!!hi
```

- f 문자열 포맷팅 소숫점 표현하기  

```python
pi = 3.141592
  
# format 함수
print("{0:0.4f}".format(pi))
print("{0:10.4f}".format(pi))
print(format(pi, "0.4f"))
  
# f 문자열 포맷팅
print(f'{pi:0.4f}')
print(f'{pi:10.4f}')

출력결과 : 3.1416
출력결과 : 3.1416
```

<hr>

## 05. 문자열 다양한 함수들

<br>
  
- count()
	- 문자 개수 세기
- find()
	- 문자 위치 찾기
- index()
	- 문자 위치 찾기
- join()
	- 문자열 삽입
- upper()
	- 소문자를 대문자로
- lower()
	- 대문자를 소문자로
- lstrip()
	- 왼쪽 공백 제거
- rstrip()
	- 오른쪽 공백 제거
- strip()
	- 양쪽 공백 제거
- replace()
	- 문자열 변경
- split()
	- 문자열 나누기
  
<br>

> [!warning] 주의 !
>
> 주의할 것은, 함수를 사용한다 해도 문자열 자체의 내용이 바뀌는 것은 아니다. 예를 들어 replace()를 이용해서 문자열을 변경한다는 것은 `print(string).replace("a", "b"))` 일 경우 출력하는 과정에서 `a`를 `b`로 치환해주는 개념인 것이지 string의 문자열 내용 자체가 바뀌는 것은 아니다.

<br>
  
**count()**

```python
string = "python"
print(string.count('p'))
  
출력결과 : 1
```

<br><br>

**find(), index()** <br>

`find()`는 없는 값을 찾으면 -1을 반환하지만, `index()`는 없는 값을 찾으면 오류 값을 반환한다.

```python
string = "Python is the best programming language."
print(string.find('t'))
print(string.find('k'))
print(string.index('t'))
print(string.index('k'))
  
출력결과 : 2
출력결과 : -1
출력결과 : 2
출력결과 : ValueError: substring not found
```

<br><br>

**join()** <br>

`join()`는 문자열 뿐만이 아니라 리스트나 튜플에도 사용 가능하다.

```python
# 문자열 사용 예시
print(",".join('abcd'))

# 리스트 사용 예시
print(",".join(['a', 'b', 'c', 'd']))
  
출력결과 : a,b,c,d
출력결과 : a,b,c,d
```

<br><br>

**upper(), lower()**

```python
string1 = "hi"
string2 = "HI"

print(string1.upper())
print(string2.lower())
  
출력결과 : HI
출력결과 : hi
```

<br><br>

**lstrip(), rstrip(), strip()**

```python
string = " hi "
print(string.lstrip())
print(string.rstrip())
print(string.strip())

출력결과 : hi
출력결과 : hi
출력결과 : hi
  
#-------------------------------#

string = ",,,hi,,,"
print(string.strip())
print(string.strip(","))
  
출력결과 : ,,,hi,,,
출력결과 : hi
```

<br><br>

**replace()** <br>

```python
string = "Python is good programming language"
string.replace("Python", "Java")
  
print(string.replace("Python", "Java"))
print(string)
  
출력결과 : Java is good programming language
출력결과 : Python is good programming language
```
  
<br><br>

**split()** <br>

괄호 안이 공백일 경우 "탭", "스페이스", "엔터" 기준으로 쪼갠다.

```python
string = "Python is good programming language"
print(string.split())
  
출력결과 : ['Python', 'is', 'good', 'programming', 'language']
  
#-------------------------------#

string = "a:b:c:d:e"
print(string.split(":"))
  
출력결과 : ['a', 'b', 'c', 'd', 'e']
```