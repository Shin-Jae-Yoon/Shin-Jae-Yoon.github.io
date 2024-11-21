---
title: "04. 객체지향 2/3"
date: "2023-03-24 19:20"
enableToc: true
tags: [""]
---

인프런의 <a href='https://www.inflearn.com/course/%EC%A6%90%EA%B1%B0%EC%9A%B4-%EC%9E%90%EB%B0%94' target='_blank'>부부 개발단 토토님의 즐거운 자바 강의</a>를 정리한 내용

<hr>

## instance 필드

### 클래스 메서드 vs 인스턴스 메서드

- **클래스 메서드 : static이 붙은 메서드**
- **인스턴스 메서드 : static이 붙지 않은 메서드**
- 인스턴스 별로 다르게 동작해야 한다면 인스턴스 메서드
- static 메서드는 객체 생성이나 유틸리티 관련에서 사용될 때가 있음
- 되도록 인스턴스 메서드를 사용하도록 하자.

<br>

### 필드(field)

- 필드 : 클래스가 가지는 정보 (=속성)
	- 다른 언어에서는 멤버변수라고 말하는 경우도 있음
- 필드는 어떤 키워드와 함께 사용되느냐에 따라 사용방법이 달라짐
- **클래스 필드 : static 키워드와 함께 사용**
- **인스턴스 필드 : static 키워드를 사용하지 않음**

<br>

**필드 선언 방법**

<br>

```java
// 대괄호는 생략 가능
[접근제한자] [static] [final] 타입 필드명 [=초기값];
```

- 접근제한자 public, protected, 아무것도 없는 경우(=default), private 가능
- 필드명은 식별자 규칙 따름
	- 다만, 필드는 첫 번째 글자 소문자로 시작하는 것이 관례
- 타입(type)은 기본형과 참조형 가능
	- 기본형 : boolean, byte, char, short, int, long, float, double
	- 참조형 : class, interface, 배열 등
- 초기값이 없을 경우 아래와 같이 초기화 됨
	- ==**기본형 : 0으로 초기화**==
	- ==**boolean형 : false로 초기화**==
	- ==**참조형 : null로 초기화**==

<br>

**필드 선언 예제**

<br>

```java
String name;
String address = "경기도 고양시";
public int age = 50;
protected boolean flag;
```

1. String은 참조타입인데 초기화 안했으니까 name 변수는 null로 초기화 됨
2. address는 `"경기도 고양시"`라는 문자열 인스턴스를 참조
3. int age는 기본형이니까 메모리 4byte의 저장 공간이 잡히고 그 안에 50을 저장
4. boolean은 기본형이니까 메모리 1byte의 저장 공간이 잡히지만 초기화 안했으니까 false로 초기화 됨

<br>

```java {title="Person.java"}
public class Person {
	String name;
	String address;
	boolean isVip;
}

// 딱히 초기화 안했으니까
// 참조형은 null, boolean은 false겠네
```

<br>

```java {title="PersonTest.java"}
public class PersonTest {  
    public static void main(String[] args) {  
        Person p1 = new Person();
        Person p2 = new Person();
  
        System.out.println(p1.name);  
        System.out.println(p1.address);  
        System.out.println(p1.isVip);

		System.out.println(p2.name);  
        System.out.println(p2.address);  
        System.out.println(p2.isVip);  
    }  
}

// null
// null
// false
// null
// null
// false
```

<br>

![](brain/image/fun-java04-2.png)

<br>

특이하게, 문자열(String)은 new를 사용하지 않고도 인스턴스를 생성할 수 있다.
- 되도록 new를 사용하지 않고 큰따옴표로 묶어서 인스턴스를 참조하는 것이 좋다.
- String은 너무 자주 사용하기 때문에 자바를 만든 개발자들이 따로 String constant pool이라는걸 만들어놔서 그럼

<br>

### String Class

<a href='https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/lang/String.html' target='_blank'>Oracle docs String Class API</a>를 확인해보자.

<br>

![](brain/image/fun-java04-3.png)

- java.lang.Object를 상속받음
- Serializable, CharSequence, Comparable\<String> 3개의 인터페이스를 구현

<br>

![](brain/image/fun-java04-5.png)
- 자주 사용하는 메서드인 `length()`를 보자.
	- 메서드의 정의 부분에 나열된 파라미터가 없네.
	- return 타입은 int형이네 (근데 이게 문자열의 길이라는 말이네)

<br>

### NullPointerException

그렇다면, 위에서 작성한 코드를 예시로 `p1.address.length()`를 출력해보면 어떨까?

![](brain/image/fun-java04-6.png)

<br>

NullPointerException 에러가 발생하면서 프로그램이 종료된다. 지긋지긋하게도 많이 보던 널포인터이다. 차근차근 생각해보자.
- Person 인스턴스를 생성했고 이를 p1 참조변수가 참조하고 있음
- Person 인스턴스의 address 필드는 초기화하지 않았음
- 참조형 타입인 address는 초기화하지 않았기 때문에 null 값을 가짐
- p1 참조변수가 Person 인스턴스의 address를 참조해보면 null이 나옴
- null을 참조하여 길이를 계산하려고 하니 NullPointerException 발생

![](brain/image/fun-java04-7.png)

이렇게 디버깅하는 습관도 반드시 가지자 !

<br>

![](brain/image/fun-java04-8.png)

1. Evaluate Expression (option키 + F8) 
2. Expression에 원하는 형식으로 넣으면 더 편하게 찾을 수도 있음

<hr>

## Class 필드 (static 필드)

==**클래스로더에 의해 클래스가 로드될 때, 클래스 내부에 static 필드가 있다면,  Static Pool이라는 영역에 저장한다. 인스턴스 별로 가지는 것이 아니라 정적 영역에서 따로 관리한다.**==
- static 필드는 `클래스명.필드명` 형식으로 사용하자.
- 인스턴스 만들어서 사용하지 말자. 

<br>

```java {title="Person.java"}
public class Person {
	String name;
	String address;
	boolean isVip;
	// 새로 추가
	static int count = 0;
}
```

<br>

```java {title="PersonTest2.java"}
public class PersonTest2 {  
    public static void main(String[] args) {  
        Person p1 = new Person();  
        Person p2 = new Person();  

        System.out.println(p1.count);  
        System.out.println(p2.count);  
        p1.count++;  
        System.out.println(p1.count);  
        System.out.println(p2.count);  
        p2.count++;  
        System.out.println(p1.count);  
        System.out.println(p2.count);  
    }  
}

// 0
// 0
// 1
// 1
// 2
// 2
```

- Person 인스턴스를 만들기 전에, JVM이 CLASSPATH에 Person 클래스가 존재하는지 먼저 찾아봄
- 이후, 클래스가 없다면 ClassNotFoundException 던지고 있으면 클래스 정보를 메모리에 올림
- 클래스 정보 자체는 실행되는 것이 아니라 정적이다.
- 그래서 메모리에 올릴 때 ==**static 필드가 있는지 확인**==해본다.
- Person이 가지고 있는 static 필드인 count를 별도의 Static Pool이라는 영역에 저장한다. 인스턴스 별로 가지는 것이 아니라 정적 영역에 따로 관리한다.

<br>

### non-static (중요)

클래스 메서드에서 인스턴스 필드를 사용할 수 있을까?

<br>

![](brain/image/fun-java04-9.png)

여기에서 클래스 메서드인 `printCount()`는 인스턴스 필드인 `String name, String address, boolean isVip`를 사용할 수 있을까? 아니 사용할 수 없다.
- ==**메모리에 생성되는 시점이 다르기 때문**==
	- 클레스 메서드는 인스턴스가 없어도 사용 가능
	- 인스턴스 메서드는 힙 영역에 인스턴스가 생성되어야 사용할 수 있음

![](brain/image/fun-java04-10.png)

<br>

그냥 `Person.printName()`과 같이 인스턴스 메서드를 사용하면?

- `java: non-static method printName() cannot be referenced from a static ontext` 오류가 발생
- 인스턴스 필드와 인스턴스 메서드는 `클래스명.필드명`, `클래스명.메서드명()`과 같은 형태로 사용할 수 없다.
- ==**인스턴스 필드, 인스턴스 메서드를 사용하려면 반드시 인스턴스를 생성한 이후, 인스턴스를 참조하는 참조 변수를 이용해서 사용해야 한다. 인스턴스가 만들어지지 않으면 사용할 수 없다.**==

<br>

### static-block

![](brain/image/fun-java04-11.png)

- 이렇게 static 블록에서 static 필드를 초기화 가능

<br>

![](brain/image/fun-java04-12.png)

이 경우, 실행 순서를 보자.
1. javac Hello2.java  
2. java Hello2  
3. CLASSPATH에서 Hello2 클래스를 찾고 그 클래스 정보를 메모리에 올림  
4. 클래스 필드(class field)나 클래스 메서드(class method)는 실행 가능한 상태가 되게 한다  
5. 클래스 필드는 static 블록에서 초기화 할 수 있다.  
6. 이후 JVM이 클래스 메서드 중 `String[]`을 받아들이는 main 메서드를 찾고 실행  
7. 그래서 main 메서드가 실행되기 전에 static 블록 안의 코드가 실행되는 것을 볼 수 있다.

![](brain/image/fun-java04-13.png)

static 블록은 main 메서드보다 먼저 실행된다.

<br>

### JVM 메모리, 인스턴스 생성

![](brain/image/fun-java04-14.png)

- Java 7까지는 JVM이 관리하는 메모리 영역인 PermGen에 클래스 정보가 올라갔음
- Java 8까지는 Native Memory가 관리하는 영역인 Metaspace 영역에 클래스 정보가 올라감

<br>

**소스 코드, 클래스 파일 자체는 정적이다.**
- 동적인 것들은 실행되면서 생성되는 것들을 의미
- 클래스 정보 자체는 정적
	- ==**클래스가 저장된 HDD나 SSD는 RAM보다 속도가 느리기 때문에 클래스가 필요할 때마다 매번 보조 기억장치에서 읽어들이는건 성능 저하가 클 것**==이다.
	- 그래서 클래스 정보는 처음 사용될 때 메모리에 그 정보를 올리고 필요할 때마다 사용하는 것

<br>

**클래스는 로딩될 때 메타스페이스 영역에 클래스가 로딩된다.**

![](brain/image/fun-java04-15.png)

<br>

**static 정보는 어디에 저장되는가?**

![](brain/image/fun-java04-16.png)

- Java 7 전까지는 non-heap 영역에 저장
- Java 8 이상부터는 heap에 저장

<br>

### 총정리

- new 연산자를 사용할 때마다 메모리에 인스턴스가 생성됨
- 인스턴스는 더이상 참조되는 것이 없을 때, 나중에(언제인지는 모르고 보통 메모리가 부족할 때) 가비지 컬렉션(Garbage Collection)된다.
- static한 필드는 클래스가 로딩될 때 딱 한 번 메모리에 올라가고 초기화 된다.
- 인스턴스 메서드(static이 붙지 않은 메서드)는 인스턴스를 생성하고 나서 참조변수를 이용하여 사용할 수 있다.
- 클래스 메서드는 `클래스명.메서드명()`으로 사용가능하다.
- 메서드 안에 선언된 변수들은 메서드가 실행될 때 메모리에 생성되었다가, 메서드가 종료될 때 사라진다.

<hr>

객체지향적 특성

### 추상화

- ==**중요한 것은 남기고, 불필요한 것은 제거한다.**==

예를 들어서, 책상을 누가 바라보느냐에 따라 중요한 부분이 달라진다.
- 책상을 만드는 사람이 바라보는 책상
- 책상을 이용하는 학생이 바라보는 책상
- 책상을 옮기는 용도로 쓰는 이삿짐 센터 아저씨가 바라보는 책상

자동차도 마찬가지이다.
- 자동차를 타는 사람이 바라보는 자동차
- 자동차를 만드는 제작자가 바라보는 자동차
- 자동차를 정비하는 정비공이 바라보는 자동차

<br>

==**앞으로, 프로그램을 만들 때 비즈니스 영역(도메인 영역)에 맞도록 추상화 해야한다.**==
- 너무 먼 미래까지 대비해서 클래스를 만들 필요 없다는 의미
- 나의 고객으로부터 필요한 정보가 이름, 성별, 나이라면 해당하는 필드만 가지도록 한다.
- 메서드도 필요한 기능만 가지도록 한다.
- 이것을 ==**추상화, 중요한 것만 남기고 불필요한 것은 제거하는 것**==이다.

<br>

### 캡슐화

- ==**관련된 것을 잘 모아서 가지고 있는 것을 캡슐화**==라고 함
- ==**관련된 것을 잘 모아서 가지고 있을수록 응집도(Cohesion)가 높다**==고 표현
	- 캡슐화가 잘되면 응집도가 높다는 말이네
- 캡슐화는 <a href='/brain/Lecture/fun-java/fun-java04/#정보-은닉'>정보 은닉</a>과도 관련있다.

<br>

### 좋은 객체 vs 나쁜 객체

좋은 객체는 응집도는 높고 결합도는 낮아야한다.

- 응집도가 높다
	- 객체는 책임이 있다. 기능이 호출되었을 때 그에 맞는 기능을 잘 하는가에 대한 책임
	- 예를 들어, 세탁기라면 세탁에 관련된 기능을 잘 모아서 가지고 있어야 한다. 이를 응집도가 높다고 한다.
- 결합도가 낮다.
	- 결합도가 낮을 수록 사용이 편리하다.
	- 예를 들어, 컴퓨터를 샀는데 부가적인 장비가 있어야만 컴퓨터가 동작한다면 컴퓨터의 사용성은 떨어질 것이다.

==**따라서, 객체를 만들 땐 관련된 기능을 잘 모아서 가지고 있어야 하니까 응집도가 높게, 객체와 객체간 결합도는 낮춰서 사용성이 편리하게!**==

<br>

**객체의 역할, 책임, 협력**

- 좋은 객체란 역할과 책임에 충실하면서 다른 객체와 잘 협력하여 동작하는 객체
- 반대로 나쁜 객체란 여러가지 역할을 한 가지 객체에게 부여하거나, 이름과는 맞지 않는 속성과 기능을 가지도록 하거나, 제대로 동작하지 않는 객체. 또한 다른 객체와 동작이 매끄럽지 않는 것도 나쁜 객체

<br>

### 다형성

프로그래밍 언어의 자료형 체계의 성질을 나타내는 것으로, ==**각 요소들(상수, 변수, 식, 오브젝트, 함수, 메서드 등)이 다양한 자료형(type)에 속하는 것이 허가되는 성질**==을 의미한다.
- 반대는 단형성으로 프로그램 언어의 각 요소가 한 가지 형태만 가지는 성질을 가리킴

<br>

**`System.out.println()`**
- println은 "인자를 출력하고 줄바꿈을 한다"는 기능
- 여기에서 인자는 int, float, double, String 등이 될 수 있음
- 중요한 건 **메서드 이름이 같다는 것**이다. 메서드 이름이 같은 것이 왜 중요할까?

<br>

![](brain/image/fun-java04-17.png)

![](brain/image/fun-java04-19.png)

out은 표준 출력 장치를 의미하며, PrintStream 클래스라는 타입이다. PrintStrem 클래스를 보면 `println()` 메서드만 10개가 있다. int를 출력하든 double을 출력하든 메서드 이름이 `println()`으로 같다는 것이다. 메서드 이름은 같지만 다양한 타입을 받아들이도록 여러 개가 선언되어 있는 것이다.

프로그램을 설계한다는 것은 **이름을 잘 짓는다는 것**이다. 숫자를 출력하고 줄 바꿈을 하든, 문자를 줄 바꿈을 하든 **메서드 이름을 다르게 지을 필요가 없다.**

이렇게 ==**같은 이름의 메서드가 여러 개 있는데 매개변수(parameter)의 타입이 다르거나 매개변수의 개수가 다른 경우를 오버로딩(Overloading) 했다**==고 말한다.

<br>

### 다형성, 오버로딩
- 간단하게, ==**메서드 이름은 같은데, 다양한 타입으로 사용하는 것을 오버로딩(Overloading)**==이라고 생각하자
- 메서드의 이름은 같고 매개변수의 개수나 타입이 다른 메서드를 정의하는 것을 의미
- 리턴값만을 다르게 갖는 오버로딩은 작성할 수 없음
- 어떤 메서드가 실행될 지는 JVM이 실행하면서 동적으로 결정함

<br>

![](brain/image/fun-java04-20.png)

- 객체를 만들 때 나는 어렵게 만들어도, 사용하는 사람은 쉽게 쓸 수 있도록 만들자.

<br>

### 패키지

- 클래스는 패키지를 이용하여 관련된 클래스들을 관리한다. 자바에서 패키지는 폴더와 같은 기능을 제공한다고 생각하면 된다.
- 클래스가 관련된 것을 잘 모아서 가지고 있으면 응집도가 높다고 하였는데, 그것을 패키지가 도와주는 것이다.


**패키지 이름 규칙**
- 아키텍처에 맞게 패키지를 작성하는 방법도 정의된다.
- ==**보통 도메인 이름을 거꾸로 적은 후에 프로젝트 이름 등을 붙여서 만듦**==
	- 예를 들어, `com.example.util`
		- `com.example`은 도메인 이름을 거꾸로 적은 것
		- `util`은 프로젝트나 모듈의 이름
	- **왜 도메인 이름을 거꾸로 적을까?**
		- 앞으로 오픈 소스를 많이 사용할 것
		- 다른 사람이 만든 클래스 중에 내가 만든 클래스와 이름이 같은 경우 발생
			- 폴더에는 같은 이름의 파일이 여러 개 있을 수 없음. 그래서 충돌남

<br>

```java
package 패키지명;
```
- 주석문이나 빈 줄을 제외하고 가장 윗 줄에 위와 같은 형식으로 선언

<br>

```bash
javac -d . 클래스이름.java
```
- 이렇게 `-d` 옵션을 붙이고 `.` 현재위치로 지정해야한다.
- 이러면 현재위치에 com, example, util폴더가 생성되고 거기에 `클래스이름.class`가 생성됨

<br>

```java
import com.example.util.Calculator;
```
- `import`는 JVM에게 어떤 패키지의 Calculator 클래스를 사용하게 할 것 인지 알려주는 역할이다.
- 메모리에 올리거나 그런 일을 하는 것이 아니다.

<br>

```java
import com.example.util.Calculator;

public class CalculatorTest {
	Calculator cal = new Calculator();
	int value = cal.plus(50, 100);
	System.out.println(value);

	com.example.util2.Calculator cal2 = new com.example.util2.Calculator();
	int value2 = cal2.divide(100, 50);
	System.out.println(value2);
}
```

- 이렇게 다른 패키지에 동일한 이름의 클래스가 있을 경우, 하나는 import 해서 사용 가능하지만 다른 클래스는 import 하지 못하고 저렇게 패키지명까지 같이 적어줘야한다.

<hr>

## 상속

- ==**OO는 OO다. OO는 OO의 종류 중 하나다. 라고 표현할 수 있다면 이것은 상속관계**==
- 상속 관계는 ==**IS-A 관계 혹은 kind of 관계**==라고 말하기도 한다. 일반화시킨다.
- 일반화란, 자식클래스들을 부모클래스로 부를 수 있는 것을 말함.
- 상속 = 일반화 + 확장
- 예를 들면
	- 노트북은 컴퓨터다(O)
	- 세탁기는 가전제품이다(O)
	- 선풍기는 가전제품이다(O)

<br>

![](brain/image/fun-java04-21.png)

- 위에 있는 것이 부모 클래스, 아래에 있는 것이 자식 클래스
- 자식 -> 부모로 실선, 화살표
- 전자제품을 상속 받은 클래스는 모두 끄다(), 켜다() 메서드 가짐

<br>

==**상속은 일반화 + 확장**==

- 상속이란 일반화와 확장이라는 개념을 합한 것이다.
- 부모 클래스를 상속받는다는 것은 부모가 가지고 있는 것을 자식이 물려받아 사용할 수 있다는 것을 의미한다.
- 포크레인 = 자동차 + 삽, 자동차를 확장시켜서 만듦

<br>

==**상속은 굉장히 강한 결합이라서 반드시 써야 할 때만 쓰고 되도록 사용 안하는 것이 좋다.**==
- 좋은 객체란, 응집도는 높고 결합도는 낮아야하니까.
- 상속은 가장 강한 결합이라 잘못 상속받으면 타격이 너무 크다.

<br>

**상속 선언 방법**

```java
[접근제한자] [abstract | final] class 클래스명 extends 부모클래스명 {

}
```

<br>

**아무것도 상속받지 않으면 자동으로 java.lang.Object를 상속받는다.**
- ==**모든 클래스는 Object의 자손**==이다.

<br>

### 상속 - 부모 타입으로 자식 참조

부모 타입으로 자식 타입을 참조할 수 있다.

```java
Car car = new Bus();
```

- 버스는 자동차다.
- ==**참조타입(`Car`)과 인스턴스 타입(`Bus`)이 다르다.**==
- `Bus bus = new Bus();`로 생성해도 되는데 왜 참조타입을 부모타입으로 했을까?

<br>

![](brain/image/fun-java04-22.png)

- 실제 메모리에 올라간 인스턴스는 Bus
- 참조변수 c1을 이용해 사용할 수 있는 메서드는 `달리다()` 뿐!
- ==**즉, 참조 변수(`c1`)의 타입(`Car`)만 보더라도 아, 이런 메서드만 사용하겠다는걸 알게 되니 코드 분석이 쉬워진다.**==

<br>

### 상속 - 객체 형변환

만약, 다시 참조타입을 인스턴스 타입으로 바꾼 다음 인스턴스 타입의 메서드를 쓰고 싶으면 어떻게 할까? 형변환하면 된다.
- 이게 가능한 이유는, 참조변수 `c1`의 참조타입이 `Car`이기는 하지만, 결국 참조하는 것은 인스턴스 타입 `Bus`이기 때문이다.
- 그래서 참조변수 c1이 가리키던 것을 b1 보고 가리키라고 해도 어차피 인스턴스 타입 `Bus`를 참조하기 때문에 괜찮은 것이다.

```java
public class CarExam01 {
	public static void main(String[] args) {
		Car c1 = new Bus();
		Bus b1 = (Bus)c1;
		b1.안내방송();
	}
}
```

<br>

### 상속 - 다형성, 오버라이딩

- ==**메서드 오버라이딩(Overriding) : 상위 클래스의 메서드를 하위 클래스가 재정의하는 것이다.**==
- 다형성에서 오버라이딩은 상속과 관련된 성질 !
- 메서드의 이름은 물론 매개변수(parameter)의 개수나 타입도 모두 동일해야함
	- 주로 상위 클래스의 동작을 상속받은 하위 클래스에서 변경하기 위해 사용됨

<br>

==**메서드가 오버라이딩 되면 무조건 자식의 메서드가 실행된다.**==

```java
class Car {  
    public void run() {  
        System.out.println("전륜구동으로 달린다.");  
    }  
}  
  
class Bus extends Car {  
    public void run() {  
        System.out.println("후륜구동으로 달린다.");  
    }  
  
    public void 안내방송() {  
        System.out.println("버스 안내방송 입니다.");  
    }  
}  
  
public class CarExam1 {  
    public static void main(String[] args) {  
        Bus b1 = new Bus();  
        b1.run();  
  
        Car c1 = new Bus();
        c1.run();  
    }  
}

// 후륜구동으로 달린다.
// 후륜구동으로 달린다.
```

- Car도 `public void run()` 메서드를 가지고 있고 Bus도 `public void run()` 메서드를 가지고 있으면? => Bus의 `run()` 메서드가 실행
- 왜냐하면, b1도 c1도 참조하는 것은 Bus 인스턴스이다.
	- Bus는 `run()` 메서드를 오버라이딩 한 상태
- `Car c1 = new Bus();` = **버스는 자동차다**
- `c1.run();` = **그(c1) 자동차는 달린다.**
	- 후륜으로 달리도록 바꿔놨는데 갑자기 전륜으로 달리지는 않겠지

<br>

![](brain/image/fun-java04-23.png)


<br>

### 오버로딩 vs 오버라이딩

- 오버로딩(Overloading) : 매개변수(parameter)의 타입이 다르거나, 매개변수의 개수가 다른 같은 이름의 메서드를 여러 개 만드는 것이다. 주의할 점은 리턴값만 다른 것은 오버로딩 할 수 없다.
- 오버라이딩(Overriding) : 매개변수의(parameter)의 타입, 개수, 이름, 리턴값 모두 동일하면서 상위 클래스의 동작을 상속받은 하위 클래스에서 동작을 변경하기 위해 사용하는 것

<br>

### 오버라이딩 주의점

==**필드는 Type을 따라가고, 메서드는 오버라이딩 된 자식의 메서드가 실행된다.**==
- 필드가 오버라이딩 돼서 자식의 값이 사용된다면, 부모 클래스를 만든 사람이 예상하지 못한 결과가 출력될 것이기 때문
- 그래서 필드는 부모의 타입을 따라간다.
	- 만약, 필드도 오버라이딩 된다면 `printII()` 메서드의 호출 값이 30이 되어야할 것
- 따라서, 필드가 아닌 ==**메서드 오버라이딩만 기억하자.**==

```java
class Parents {  
    public int i = 5;  
    public void printI() {  
        System.out.println("parent - printI() : " + i);  
    }  
  
    public void printII() {  
        System.out.println("parent - printII() : " + i * 2);  
    }  
}  
  
class Child extends Parents {  
    public int i = 15; // 필드에 대한 오버라이딩  
    public void printI() { // 메서드에 대한 오버라이딩  
        System.out.println("child - printI() : " + i);  
    }  
}  
  
public class Exam01 {  
    public static void main(String[] args) {  
        Parents p1 = new Parents();  
        System.out.println(p1.i);  
        p1.printI();  
        System.out.println("------------------------");  
        Child c1 = new Child();  
        System.out.println(c1.i);  
        c1.printI();  
        System.out.println("------------------------");  
        Parents p2 = new Child();   // Child는 Parent의 후손이다.  
        System.out.println(p2.i);  
        p2.printII();  
        p2.printI();  
    }  
}

// 5
// parent - printI() : 5
// ------------------------
// 15
// child - printI() : 15
// ------------------------
// 5
// parent - printII() : 10
// child - printI() : 15
```

<br>

### 정보 은닉

- 정보 은닉(information hiding)은 객체지향의 중요한 기법이다.
- ==**중요한 필드는 은닉하고, 필드는 메서드를 통해서만 접근해서 사용하도록 하자.**==

<br>

**Getter, Setter**
- ==**Spring에서는 Getter, Setter를 프로퍼티(property)라고도 한다.**==
- 아래의 예시는 price 프로퍼티이다.
	- price 필드와 price 프로퍼티의 차이
		- price 필드 : 클래스가 가지는 속성
		- price 프로퍼티 : price에 대한 getter, setter 메서드
- 아래처럼 필드를 직접 접근하는 것은 정보은닉 관점에서 안좋다.

```java
class Book {  
    public int price;  
}  
  
public class BookExam01 {  
    public static void main(String[] args) {  
        Book b1 = new Book();  
        b1.price = 100;  
        System.out.println(b1.price);  
    }  
}
```

<br>

- 접근제한자를 private으로 바꿔서 외부에서 직접 접근하지 못하게 만든다.
- 필드에 접근할 수 있는 메서드를 만들자.
- ==**`this`는 내 자신 인스턴스를 말하는 예약어**==
	- this는 static 메서드(클래스 메서드)에서 사용 불가능
	- 클래스 메서드는 인스턴스가 생성되지 않아도 사용 가능하다. 메모리에 생성되는 시점이 다르기 때문에 클래스 메서드에서는 this를 사용할 수 없다.

```java
class Book {  
    private int price; // field price  
  
    // 필드의 값을 수정하고 얻기 위한 메서드 getter, setter    
    public int getPrice() {  
        return price;   // this는 내 자신 인스턴스를 참조하는 예약어  
    }  
  
    public void setPrice(int price) {   // 지역변수 price        
	    // 매개변수로 받은 지역변수 price로  
	    // 내 자신 인스턴스를 참조하는 this.price를 초기화  
        this.price = price;  
    }  
}  
  
public class BookExam01 {  
    public static void main(String[] args) {  
        Book b1 = new Book();  
        b1.setPrice(500);  
        System.out.println(b1.getPrice());  
    }  
}
```

<hr>

## Object 메서드

==**Object가 오버라이딩하라고 제공하는 메서드**==

- `toString()`
- `equals()`, `hashCode()`
- 오버라이딩 하면 자식의 메서드로 실행된다는 의미였지?? 이거 그냥 쓰면 아무 의미없다. ==**무조건 오버라이딩 해서 써야한다.**==

<br>

### toString()

<br>

```java
public class CarExam02 {  
    public static void main(String[] args) {  
        Car c1 = new Car();  
        System.out.println(c1);  
    }  
}
// Car@7c75222b
```

Car 클래스는 내가 작성한 클래스이지만, System 클래스는 Java를 만든 사람이 작성한 클래스이다. 그런데 어떻게 컴파일 오류가 안날까? 어떻게 자바 개발자는 오버로딩해서 내가 작성할 코드를 알았을까?

![](brain/image/fun-java04-24.png)

- `println(Object x)`에서 println 메서드가 파라미터로 Object를 받고 있다.

<br>

우리가 <a href='/brain/Lecture/fun-java/fun-java04/#상속---부모-타입으로-자식-참조' >위에서</a> 이런 말을 했다.
- 부모타입의 변수로 자식 인스턴스를 참조할 수 있다.
- 조상타입의 변수로 후손 인스턴스를 참조할 수 있다.
	- `Car c1 = new Bus();` 오류가 안난다면, Bus는 Car의 자식이다.
	- `Car c2 = new 이층버스();` 오류가 안난다면, 이층버스는 Car의 자식이다.
- 근데 아무것도 상속받지 않으면 Object를 상속받는다고 했으니 아래도 가능할 것
	- `Object o1 = new Car();`
	- `Object o2 = new Bus();`
	- `Object o3 = new 이층버스();`

==**따라서, `println(Object x)`의 의미는 Object로 참조할 수 있는 것은 무엇이든 받을 수 있다는 의미이다.**==

<br>

![](brain/image/fun-java04-25.png)

![](brain/image/fun-java04-26.png)

- `println()` 메서드는 Object가 가지고 있는 `toString()` 메서드를 출력해주는 것
- `System.out.println(o1.toString()); == System.out.println(o1);`

<br>

```java
public class CarExam02 {  
    public static void main(String[] args) {  
        Car c1 = new Car();  
        System.out.println(c1);  
        System.out.println(c1.toString());  
    }  
}

// Car@7c75222b
// Car@7c75222b
```

- 하지만 이 결과는 아무 쓸모가 없음.
- 오버라이딩하여 내가 원하는 문자열이 출력되게 해보자.
- `ctrl + enter` 해서 generator 메뉴에서 Override - toString() 생성하기

```java
class Car {  
    public void run() {  
        System.out.println("전륜구동으로 달린다.");  
    }  
  
    @Override  
    public String toString() {  
        return "자동차";  
    }  
}

public class CarExam02 {  
    public static void main(String[] args) {  
        Car c1 = new Car();  
        System.out.println(c1);  
    }  
}

// 자동차
```

<br>

### equals(), hashCode()

`equals()` 메서드
- 참조가 아니라, 같은 **값**이냐? 를 비교하는 것
- 따라서, 개발자가 **기준**을 정해줘야함. 반드시 메서드 오버라이딩 해야함.

<br>

Hash(해쉬)라고 불리는 알고리즘이 있다.
- 이걸 쓰려면 `hashCode()`를 만드는 기능과 `equals()`로 값이 같은지를 비교하는 것이 매우 중요하다. 이때문에 같이 적어놨음
- Hash, HashSet, HashMap 쓰려면 `hashCode()`, `equals()`를 반드시 오버라이딩 해서 사용해야함.