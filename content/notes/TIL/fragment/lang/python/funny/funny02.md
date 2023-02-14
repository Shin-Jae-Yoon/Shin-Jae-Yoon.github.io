---
title: "[잔재미]변수,출력"
date: "2023-02-14 01:37"
enableToc: true
tags: ["잔재미코딩 파이썬"]
---

> 해당 게시글은 <a href='https://www.inflearn.com/course/python-crawling-basic' target='_blank'>파이썬 입문과 크롤링기초 부트캠프</a> 강의를 정리한 내용입니다.

## 파이썬의 데이터구조

<br>

2장부터 파이썬의 기초와 자료형에 관하여 다룰 것이다. 파이썬의 자료형에는 `숫자형, 문자열 자료형, 리스트 자료형, 튜플 자료형, 딕셔너리 자료형, 집합 자료형, 불 자료형`이 있다. 이러한 자료형, 데이터를 효율적으로 나타내기 위한 특정 데이터 타입이 있는데 이를 데이터 구조라고 한다. 대표적으로 리스트, 튜플, 딕셔너리 등이 있다.

- **데이터 구조**
- 선언 + 입력
- 읽기
- 추가
- 삭제
- 수정

<br>  

## 01. 출력과 입력  

언어의 기본은 "Hello World!"를 출력함에 있다. Python은 대표적인 인터프리터 언어이므로, 소스 코드를 작성하면 줄마다 번역하고 실행할 수 있다. 인터프리터와 컴파일러에 관한 내용은 <a href='https://jae-yoon.tistory.com/3' target='_blank'>개발자 유니</a>에 추가로 포스팅하였다. 

<br>

```python
print("Hello World!")
print('Hello World!')
print(1)
  
출력 결과 : Hello World!
출력 결과 : Hello World!
출력 결과 : 1
```

<br>

C언어와 같이 문장의 끝에 `;`를 찍을 필요도 없고, 문자열은 `""`든 `''`든 상관없었다. 다음은 숫자 출력에서 나누기에 관한 몇 가지 예시이다.

<br>  

```python
print (15 / 7)
print (15 // 7)
print (15 % 7)
print (2 * 4)
print (2 ** 4 )
  
출력 결과 : 2.142857142857143
출력 결과 : 2
출력 결과 : 1
출력 결과 : 8
출력 결과 : 16
```

<br>

파이썬 에서는 `/`는 나누기, `//`는 몫, `%`는 나머지를 뜻하고 `*`는 곱하기, `**`는 제곱 수를 뜻한다. 위의 경에우는 2의 4승을 뜻하는 것이다.  

**소수점 아래의 몇 번째 자리까지 표시**하는 예시를 출력하는 경우 여러가지 방법이 있는데, 그 중 세 가지 방법을 소개하겠다.

<br>  

```python
float_data_pi = 3.1415
round (float_data_pi, 1)
  
float_data2_pi = 3.1415
print("%.1f" % float_data2_pi)
  
float_data3_pi = 3.1415
print ( format(float_data3_pi, ".1f") )
  
출력 결과 : 3.1
출력 결과 : 3.1
출력 결과 : 3.1
```

<br>

1. round() 함수 사용

`round(값, 자릿수)` 함수는 반올림 함수이다. 그러나, 주의해야할 것은 **파이썬에서 반올림은 반올림 하려는 수가 올림, 내림 했을 때 동일하게 차이가 나는 경우에는 짝수 값으로 반올림한다는 것이다.** 이 말은, 예를 들어 `round(0.5)`를 한다면 1이 출력되어야 하지만, 실제로는 0이 출력된다. 0.5는 0에도 0.5만큼 차이, 1에도 0.5만큼 차이가 나기 때문에 짝수인 0의 값에 맞춰지게 되는 것이다. 이를 유의하자. 그리고 40.000과 같이 표현해주고 싶은 경우에는 round 함수를 사용하면 안된다. 알아서 잘라먹고 40.0으로 표현할 것이다.

<br>

2. %.f 사용

`print("%.원하는자릿수f" % 값)`

<br>

3. format() 함수 사용

`format(값, ".원하는자릿수f")` 혹은 `print("{:.원하는자릿수f}".format(값))`

추가적인 내용은 [[잔재미] String](notes/TIL/fragment/lang/python/funny/funny03)를 참조하라.

<br>  

파이썬에서 입력은 `input()`함수를 사용하면 된다.

```python
data = input()
print(data)
  
출력 : 사용자가 입력한 값
```

<br>

그런데, 여기서 주의해야할 점은 숫자 1을 입력했다고 해도 input의 타입이 문자열이기 때문에 정수로 인식하지 않는다. 따라서, 정수형 타입을 원한다면 형변환을 해줘야 한다.

```python
data1 = input()
data2 = input()
  
print( data1 + data2 )
print( data1 * data2 )
print( int(data1) + int(data2))
  
입력 값 : 1, 2
출력 결과 : 12 ( 문자열이 붙혀진 형태 )
출력 결과 : Type Error ( 문자열 곱하기 문자열의 형태니까 오류)
출력 결과 : 3 ( 정수형으로 형변환 되어 더해진 형태)
```

<br><br>

## 02. 변수, 데이터 타입

<br>

Python에서 변수는 C, Java와 같이 먼저 변수형을 지정 안해줘도 된다. (int 같은 것을 안적어도 된다는 의미이다.) 변수에 값을 넣으면 변수형이 지정된다. 그리고 불리안 타입은 대문자를 사용해서 True, False와 같이 사용한다.

```python
age = 27
name = "신재윤"
height = 177
weight = 64
foot_size = 270
glass = False
marriage = False
```

데이터 타입이 어떤 것인지를 확인해보려면 `print(type())`으로 확인할 수 있다.

```python
age = 27
name = "신재윤"
glass = False
  
print(type(age))
print(type(name))
print(type(glass))

출력 결과 : <class 'int'>
출력 결과 : <class 'str'>
출력 결과 : <class 'bool'>
```

정리하자면, 파이썬에서의 데이터 타입은 아래와 같다. <br><br>

**Type**

- 정수 : int

- 부동소숫점 : float

- 문자열 : str

- Boolean : bool

<br>  

타입 검사를 하기 위한 Tip

```python
a = 1
if (str(type(a)) == "<class 'int'>"):
print("정수 타입이 맞습니다.")
```

<br><br>  

## 03. print() 문의 옵션

<br>

출력문에서 사용하는 print() 함수에는 옵션을 여러 가지 설정할 수 있다.

1. sep(separation)

단어 뜻 그대로 분리하여, 출력한다는 의미이다. 갈라놓을 문자를 지정할 수 있는데 이것을 `구분자`라고 한다.

- `sep=' '` 형식으로 사용

- 클론 기호`' '`를 사이에 두고 값을 출력

```python
print('S','E','P', sep='@')
출력 : S@E@P
```

<br>

```python
a, b = input().split(':')
print(a, b, sep=':')
  
입력 : 3:16
출력 : 3:16
```

- 아무것도 없는 빈(empty) 문자는 그냥 `''`

- join() 함수, 반복문 섞어서도 가능

```python
(a, b) = input().split("-")
print(a, b, sep="")
  
a = input().split("-")
result = ''.join(s for s in a)
print(result)
  
입력 : 000907-1121112
출력 : 0009071121112
```

<br>

2. end

단어 뜻 그대로 마지막이라는 의미이다. 줄바꿈을 하지 않고 이어서 출력하겠다는 뜻이다.

```python
print("I like", end=" ")
print("money")
  
출력 : I like money
```
  
- end=' ' 사이에 무언가를 입력하면, sep와 비슷한 기능을 한다.(구분자를 사용할 수 있다) 첫번째 출력문과, 두번째 출력문 사이에 end에 넣어준 문자열이 출력된다.  

```python
print("I like", end=" gold and ")
print("money")
  
출력 : I like gold and money
```

<br>

3. format

format 함수를 이용한 print() 다루기는 [[잔재미] String](notes/TIL/fragment/lang/python/funny/funny03)에서 상세히 설명한다.

- `.format() 이용`

```python
print("{0}월{1}일 입니다.".format(3,9))
출력 : 3월 9일 입니다.
```

- `%` 이용 포맷팅 (가장 많이 사용할 듯)  

```python
print("%s을 %d개 주세요." % ("초콜렛", 10))
출력 : 초콜렛을 10개 주세요.
```

<br>

```python
print("%d + %d = %d" % (1, 2, 3))
출력 : 1 + 2 = 3
```