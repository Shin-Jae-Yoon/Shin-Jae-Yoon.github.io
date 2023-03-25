---
title: "02. Java 기본 문법"
date: "2023-03-24 13:00"
enableToc: true
tags: [""]
---

인프런의 <a href='https://www.inflearn.com/course/%EC%A6%90%EA%B1%B0%EC%9A%B4-%EC%9E%90%EB%B0%94' target='_blank'>부부 개발단 토토님의 즐거운 자바 강의</a>를 정리한 내용

<hr>

## 변수와 리터럴

### int 1 = 1;

- int : 정수 타입(type)을 나타내는 키워드
	- 키워드란, Java 언어에서 정한 예약어
	- public, class, static, while과 같은 단어들이 키워드
- i : "변수 i"라고 말함. 변수는 **하나의 값을 가질 수 있는 공간**을 의미한다. 여기서 공간이란 **메모리의 어떤 영역**을 의미한다. i는 변수의 이름, 즉 변수명
	- 컴퓨터는 정수 하나를 저장하기 위해 메모리에 4 byte 크기의 저장공간을 필요로 한다.
	-  변수를 선언한다 = 선언한 변수 이름으로 어떤 위치에 있는 메모리를 얼마만큼의 크기로 사용하겠다.
- 1 : "**정수 리터럴(literal) 1**"이라고 말함. 리터럴이란, 변수에 입력되는 값을 의미
- `int i = 1;`은 정수 타입의 변수 i를 선언함과 동시에 1로 초기화한다는 의미

정수 타입은 4byte의 메모리를 사용한다고 했다. 4byte 메모리에 숫자 1이 2진수로 저장된다.

| 1byte    | 2byte    | 3byte    | 4byte    |
| -------- | -------- | -------- | -------- |
| 00000000 | 00000000 | 00000000 | 00000001 | 

<br>

### 기본형 타입
 
==**기본형(primitive) 타입 : 첫 번째 글자가 모두 소문자이면서 정해진 크기의 메모리 영역을 확보하고 값을 가진다.**== 

- 1byte = 8bits
- boolean 타입은 1byte를 사용하는데, 사실 1bit로도 참(1)과 거짓(0)을 표현할 수 있지만 컴퓨터에서 자료를 표현하는 최소 단위가 1byte라서 메모리 1byte를 사용하는 것이다.

| |정수형|문자형|실수형|논리형|
|:---:|:-----:|:-----:|:-----:|:-----:|
|1바이트|byte|-|-|boolean|
|2바이트|short|char|-|-|
|4바이트|int|-|float|-|
|8바이트|long|-|double|-|

<br>

### 참조형 타입

==**참조형(reference) 타입 : 첫 번째 글자가 대문자이면서, 기본형 타입이 아닌 모든 타입이다. class, interface 등이 있으며 참조형 타입은 값을 가지지 않고 값을 참조하게 된다.**==

<br>

### 변수명 규칙

변수명은 아무 이름이 될 수 없다.

- 하나 이상의 글자로 이루어져야 함
- 첫 번째 글자는 문자, $, _ 만 가능
- 두 번째 이후의 글자는 숫자, 문자, $, _ 만 가능
- $, _ 이외의 특수문자 사용 불가능
- 길이 제한 없음
- 키워드는 변수명으로 사용 불가
- 상수 값을 표현하는 단어인 true, false, null은 변수명으로 사용 불가

<br>

### 초기화

- 메서드 안에서 사용된 변수 ( = 지역변수 ) : 반드시 초기화해서 사용, 그렇지 않으면 `java: variable 변수명 might not have been initialized` 오류 발생
- 클래스 안에 선언된 변수 ( = 필드 ) : 초기화하지 않아도 사용 가능

<br>

### 논리형 연산자

![](brain/image/fun-java02-1.png)

<br>

- `&&` : and
- `||` : or
- 비트연산자
	- `^` : XOR, 둘다 같으면 false, 달라야 true
	- `&`, `|` : 논리 연산자 `&&`, `||`는 결과가 확정되면 뒤에껀 실행 안하는데, 비트 연산자 `&`, `|`는 뒤에꺼도 실행한다
	- 예를 들어, `&&`의 경우 앞에 것이 false 면 결과가 false로 확정이니까 뒤에 것을 실행 안하지만, `&`는 뒤에 있는 식도 실행한다.

<br>

### 정수, 실수, 산술연산자

- ==**Java는 기본적으로 정수를 int형(4byte)으로 인식**==
- `int x = 5;`에서 변수에 대입되는 숫자 **5는 리터럴**이다.
- `long y = 5L;`이라고 하면 숫자 **5L은 long 타입 리터럴**이다.
- 타입 별 값의 범위는 표와 같다.
	- 맨 앞에꺼는 부호비트라서 0이면 양수, 1이면 음수이다.

![](brain/image/fun-java02-2.png)

<br>

- ==**Java는 기본적으로 실수를 double형(8byte)으로 인식**==
- `double x = 5.2;`에서 변수에 대입되는 실수 **5.2는 리터럴**이다.
- `float y = 5.2F;`에서 변수에 대입되는 실수 **5.2F는 float 타입 리터럴**이다.

![](brain/image/fun-java02-3.png)

<br>

float와 double의 유효 자릿수 차이

![](brain/image/fun-java02-4.png)

<br>

**산술 연산자**

```
a = 5 + 4;
b = 4 - 3;
c = 3 * 2;
d = 5 / 2;
e = 4 % 3;
```

- a는 9, b = 1, c = 6, d = 2, e = 1
- 정수를 정수로 나누면 잘림 현상 발생, 2.5가 아닌 2가 d에 저장
- **나머지 연산자(=모듈러 연산자)는 앞의 숫자를 나누고 나눈 나머지 값을 구함**

<br>

**정수와 실수의 최솟값과 최댓값**

<br>

```java
public class NumberExam01 {  
    public static void main(String[] args) {  
        int maxInt = Integer.MAX_VALUE;  
        int minInt = Integer.MIN_VALUE;  
  
        double maxDouble = Double.MAX_VALUE;  
        double minDouble = Double.MIN_VALUE;  
  
        System.out.println(maxInt);  
        System.out.println(minInt);  
        System.out.println(maxDouble);  
        System.out.println(minDouble);  
    }  
}
```

- <a href='https://docs.oracle.com/javase/7/docs/api/java/lang/Integer.html' target='_blank'>Oracle docs Integer Class API</a>를 보면 Integer 클래스는 필드에 static 하면서 int 타입인 MAX_VALUE, MIN_VALUE를 확인할 수 있다.

<br>

### 오버플로우

==**오버플로우(Overflow)는 계산 결과가 최댓값을 넘거나, 최솟값보다 작을 경우에 음수는 양수로, 양수는 음수로 바뀌는 문제가 발생하는 것을 의미한다.**==
- 발생 원인을 살펴보면, 1byte가 가지는 가장 큰 값을 살펴보자
- 01111111인데, 여기에서 1을 더하면? 10000000이 된다. 가장 좌측 비트는 부호비트라고 했었다.

```java
public class NumberExam02 {  
    public static void main(String[] args) {  
        int value = 10;  
        int maxInt = Integer.MAX_VALUE;  
  
        System.out.println(value + 1);  
        System.out.println(maxInt + 1);  
    }  
}

// 11
// -2147483648
```

<br>

### 문자형

- 문자는 작은 따옴표로 묶인 **문자 하나**를 말한다.
- 문자는 2byte 크기를 가지며 **유니코드 값**을 가진다.
- 유니코드 값은 <a href='https://ko.wikipedia.org/wiki/%EC%9C%A0%EB%8B%88%EC%BD%94%EB%93%9C_0000~0FFF' target='_blank'>위키피디아</a> 참고
- 0000 ~ 0FFF는 16진수 의미하는 것이다. 1byte를 반으로 쪼갠 4bit로 16진수 1개를 표현할 수 있다.
	- 유니코드표를 참조하면 A는 0041, a는 0061이라고 나온다. 이를 10진수로 바꿔보자.
	- A는 `4 * 16 + 1 = 65`,  a = `6 * 16 + 1 = 97`이다. A와 a의 10진수는 많이 나오니 외워두자.
- 2byte 정수 타입은 short도 있었고 char도 있다. 이때, short는 음수, 0, 양수를 표현하고 char는 0, 양수를 표현한다.
	- short형은 -32,768 ~ 32,767를 저장할 수 있는 정수 타입
	- char형은 0 ~ 65,535를 저장할 수 있는 정수 타입

<br>

## 타입의 변환

형 변환 기본 원칙 (작고 덜 정밀 -> 크고 더 정밀은 자동)

1. **바이트 크기가 작은 자료형 -> 큰 자료형** : 자동으로 형 변환

2. **덜 정밀한 자료형 -> 더 정밀한 자료형** : 자동으로 형 변환

![](brain/image/chap02-2.png)

<br>

 ### 묵시적 형변환 ( = 자동 형변환, implict conversion) 

**바이트 크기가 작은 자료형 -> 큰 자료형으로 대입하는 경우**

```java
byte bNum = 10;
int iNum = bNum;
```

1바이트 -> 4바이트이므로 자료 손실 없이 다 저장됨. 남은 3바이트는 0으로 채워짐

<br>

**덜 정밀한 자료형 -> 더 정밀한 자료형으로 대입하는 경우**

```java
int iNum2 = 20;
float fNum = iNum2;
```

4바이트 -> 4바이트이지만, float 자료형이 더 정밀하게 표현가능해서 변환됨

<br>

**연산 중 자동 형 변환**

```java
int iNum = 20;
float fNum = iNum;
dobule dNum;
dNum = fNum + iNum;
```

대입 전 float + int 해서 float형으로 먼저 되고, float -> double로 형 변환 됨.

<br>

### 명시적 형변환 ( = 강제 형변환, explict conversion)

**바이트 크기가 큰 자료형 -> 작은 자료형**

```java
int iNum = 10;
byte bNum = (byte)iNum;
System.out.println(bNum);
// 10
  
int iNum2 = 1000;
byte bNum2 = (byte)iNum2;
System.out.println(bNum2);
// -24
```

4바이트 -> 1바이트이므로 자료 손실 발생 가능하다. <br>

예를 들어, 10은 1바이트에 표현 가능하니까 자료손실 X <br>

하지만, 1000의 경우 byte 범위 (-128~127) 벗어나니까 자료손실 O


<br>

**더 정밀한 자료형 -> 덜 정밀한 자료형**

```java
double dNum = 3.14;
int iNum = (int)dNum;
  
System.out.println(dNum);
System.out.println(iNum);
// 3.14
// 3
```

더 정밀 -> 덜 정밀이니까 자료 손실 발생 가능. 실수의 소수점 이하 부분이 생략되고 정수 부분만 대입되는 것을 확인 가능

<br>

**연산 중 형 변환**

```java
package chapter2;
  
public class ExplicitConversion {
	public static void main(String[] args) {
		double dNum1 = 1.2;
		float fNum2 = 0.9F;
		  
		int iNum3 = (int)dNum1 + (int)fNum2;
		int iNum4 = (int)(dNum1 + fNum2);
		System.out.println(iNum3);
		System.out.println(iNum4);
	}
}

// 1
// 2
```

형 변환이 언제 이루어지는 지도 key point. 위에는 형 변환을 하고 더하기 때문에 소수점 아래를 버려버리면 `1 + 0 = 1`의 결과가 나오고, 아래에는 더한 이후 형 변환을 하기 때문에 `1.2 + 0.9 = 2.1을 소수점 아래 버리면 2`이다.

<br>

## 비트연산자

**비트(bit)와 바이트(byte)**
- 비트는 컴퓨터가 처리하는 정보의 최소 단위
	- 한 개만으로는 많은 양의 데이터를 나타내기에 턱없이 부족함
	- 따라서, 정보를 표현하는 기본단위로는 8개의 비트를 묶은 바이트(byte) 사용
- 1byte는 `00000000`부터 `11111111`까지 값을 표현할 수 있음
- 1byte는 정수로 표현하면 0~254까지 표현 가능
- 1byte를 16진수로 표현하면 00~FF까지 표현 가능
	- 4비트는 0부터 15까지 표현가능하니까

<br>

**비트 연산자는 논리 연산자와 비슷하지만, 비트(bit)단위로 논리연산 할 때 사용하는 연산자**

![](brain/image/fun-java02-5.png)

- `<<`는 명시된 수만큼 비트들을 전부 왼쪽으로 이동
- `>>`는 부호를 유지하면서 지정한 수만큼 비트를 전부 오른쪽으로 이동
	- 정수형 타입을 비트로 표현했을 때, 맨 좌측의 비트를 부호화 비트라고 한다. 맨 좌측의 비트가 1이면 음수, 0이면 양수를 나타낸다.

<br>

**쉬프트 연산자 논리**
- 컴퓨터는 내부적으로 쉬프트 연산을 수행해서 계산이 굉장히 빠름
- 우측으로 n만큼 쉬프트 (`>>`) : 2<sup>n</sup> 으로 나눈 결과
- 좌측으로 n만큼 쉬프트 (`<<`) : 2<sup>n</sup> 으로 곱한 결과

<br>

**`>>>`는 지정한 수만큼 비트를 전부 오른쪽으로 이동시키며, 새로운 비트는 모두 0이 됨**
- `>>>`는 결과가 무조건 양수
- 그래서 양수화 쉬프트라고도 함

<br>

## 제어문

### if문

- if는 제어문(control flow statements) 중 하나이다. 순차적인 흐름 안에서 조건에 따라 제어를 할 필요가 있을 경우 if를 사용

```java
if (조건문1) {

} else if (조건문2) {

} else {

}
```

<br>

**삼항연산자**
- `조건식 ? 반환값1 : 반환값2`
- 조건식이 참일 경우 반환값1, 거짓일 경우 반환값2

<br>

### switch문

- switch는 제어문(control flow statements) 중 하나이다. switch문은 경우에 따라 if문보다 가독성이 좋을 수 있다.
- 이론적으로는 switch가 if보다 빠르다고 하지만 의미 없는 수준이다.
- break문이 있으면 switch문 탈출, 없으면 아래로 쭉 실행
- JDK 7 이상부터 변수 자리에 String 타입 가능
- <a href='https://catch-me-java.tistory.com/31' target='_blank'>JDK 13 이후부터 생긴 switch문에 람다식 쓰거나 yield 산출하기</a>


```java
switch (변수) {
	case 값1:
		변수가 값1일때 실행
		break;
	case 값2:
		변수가 값2일때 실행
		break;
	default:
		변수의 값이 어떤 case에도 해당되지 않을 경우 실행
}
```

<br>

## 반복문

### while문

- while은 반복문(iteration statements) 중 하나
- 컴퓨터가 잘하는 일이 반복하면서 일을 처리하는 것
- break 사용 시 반복문 자체를 종료해버림
- continue 사용 시 해당 루프만 끝내고 다음 루프 실행

```java
변수의 초기화
while (탈출 조건식) {
	탈출 조건식이 참일 경우 실행되는 코드;
	변수의 증감식;
}
```

<br>

**인텔리제이에서 디버거 활용하기**

![](brain/image/fun-java02-6.png)

- while 옆에 빨간색으로 브레이킹 포인트 설정
- Run 버튼 옆에 벌레 모양 디버깅 버튼 클릭

![](brain/image/fun-java02-7.png)

- `F8` , Step Over 버튼 누르면서 하나하나 확인 가능

<br>

### do-while문

- do-while문은 반복문(iteration statements) 중 하나
- while문과 비슷하지만, 무조건 한 번은 실행된다는 특징

```java
변수의 초기화
do {
	탈출 조건식이 참일 경우 실행되는 코드;
	변수의 증감식;
} while (탈출 조건식);
```

<br>

### for문

- for문은 반복문(iteration statements) 중 하나
- while 문은 변수 선언, 탈출 조건식, 증감식 3줄로 구성해야하지만, for문은 1줄에 모두 표현
- 중첩반복문도 가능~

```java
for (변수의 초기화; 탈출조건식; 증감식) {
	탈출 조건식이 참인 경우 실행되는 부분
}
```

<br>

### break, continue

- break : 현재 반복문 빠져나갈 때 사용
- continue : continue문 아래 부분을 실행하지 않고 다시 반복
- 그렇다면 중첩 반복문을 한 번에 빠져나가려면? continue 이하를 실행하지 않고 한 번에 중첩 반복문을 반복하려면 어떻게 해야할까?
- 이럴 때 **label** 사용

```java
public class LabelExam01 {  
    public static void main(String[] args) {  
        outter:  
        for (int i = 0; i < 3; i++) {  
            for (int k = 0; k < 3; k++) {  
                if (i == 0 && k == 2)  
                    break outter;  
                System.out.println(i + ", " + k);  
            }  
        }  
    }  
}

// 0, 0
// 0, 1
```

이렇게, outter라는 라벨을 지정해두고 조건이 맞으면 저 위치로 바로 뛰어나가게!

```java
public class LabelExam02 {  
    public static void main(String[] args) {  
        outter:  
        for (int i = 0; i < 3; i++) {  
            for (int k = 0; k < 3; k++) {  
                if (i == 0 && k == 2)  
                    continue outter;  
                System.out.println(i + ", " + k);  
            }  
        }  
    }  
}

// 0, 0
// 0, 1
// 1, 0
// 1, 1
// 1, 2
// 2, 0
// 2, 1
// 2, 2
```

이렇게, outter 라벨로 가서 다시 반복문 실행!