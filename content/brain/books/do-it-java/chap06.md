---
title: "06.클래스와 객체 (2)"
date: "2023-02-16 03:05"
enableToc: true
tags: ["📚 Do it! 자바"]
---
<br>

> 해당 게시글은 **Do it! 자바 프로그래밍 입문** 교재를 정리한 내용입니다.

<hr>

# Chapter 06 - 클래스와 객체 (2)

<br>

## this 예약어

### 자신의 메모리를 가리키는 this

this : 생성된 인스턴스 자기 자신을 가리키는 예약어

```java
package chapter06;
  
class BirthDay {
	int year;
	int month;
	int day;

public void setYear(int year) {
	this.year = year;
}
  
public void printThis() {
	System.out.println(this);
}
}
  
public class ThisExample {
	public static void main(String[] args) {
	BirthDay bDay = new BirthDay();
		bDay.setYear(2022);
		System.out.println(bDay);
		bDay.printThis();
	}
}

// chapter06.BirthDay@1b6d3586
// chapter06.BirthDay@1b6d3586
```

![](brain/image/chap06-1.png)

- 참조 변수 (bDay)를 출력한 결과 `클래스 이름@메모리 주소`

- printThis() 메서드를 실행하여 this 출력한 결과 `클래스 이름@메모리 주소`

- 힙 메모리에 생성된 인스턴스를 가리키는 것을 확인 가능

<br>

보통, 하나의 자바 파일에 하나의 클래스가 있는 것이 대부분이지만, 하나의 파일에 여러 클래스가 존재할 수 있다. 하지만 그때 public 클래스는 "1개" 뿐이라는 것을 명심! 간단한 클래스를 활용하는 경우 하나의 파일에 여러 클래스가 있을 수 있다.

<br>

### 생성자에서 다른 생성자를 호출하는 this

```java
package chapter06;
  
class Person {
	String name;
	int age;
  
	Person() {
		this("이름 없음", 1);
	}
  
	Person(String name, int age) {
		this.name = name;
		this.age = age;
	}
}
  
public class CallAnohterConst {
	public static void main(String[] args) {
		Person noName = new Person();
		System.out.println(noName.name);
		System.out.println(noName.age);
	}
}

// 이름 없음
// 1
```

- 현재, `Person()` 디폴트 생성자, `Person(String, int)` 생성자 2개 존재

- 클래스 생성 시 `Person()` 디폴트 생성자 이용 : 디폴트 생성자가 호출되는 경우에는 초깃값으로 "이름 없음"과 1을 대입하려고 this로 다른 생성자 호출한 것

- `Person(String, int)` 생성자는 매개변수 넣고 똑같이 사용하면 됨
  
<br>

**주의 !!** this로 다른 생성자 호출 시 this 코드 이전에 다른 코드 넣으면 오류 발생. 디폴트 생성자에서 생성이 완료되는 것이 아니라, this를 사용해 다른 생성자를 호출하기 때문에 this를 활용한 문장이 가장 먼저 와야함.

<br>

### 자신의 주소를 반환하는 this

인스턴스 주소 값을 반환할 때 this를 사용하고 반환형은 클래스 자료형을 사용하면 된다.

```java
package chapter06;

class Person {
	Person returnItSelf() {
		return this;
	}
}
  
public class CallAnohterConst {
	public static void main(String[] args) {
		Person noName = new Person();
		Person p = noName.returnItSelf();
		System.out.println(p);
		System.out.println(noName);
	}
}
  
// chapter06.Person@1b6d3586
// chapter06.Person@1b6d3586
```

<hr>

## 객체 간 협력

결국, 객체지향 프로그래밍은 객체를 정의하고 객체 간 협력을 기반으로 만든다.

- 학생 class (이름, 학년, 가진 돈)

- 버스 class (버스 번호, 승객 수, 수입)

- 지하철 class (노선 번호, 승객 수, 수입)

- 학생 -> 버스 : 버스를 탄다.

- 학생 -> 지하철 : 지하철을 탄다.

즉, 객체가 필요한 멤버 변수를 선언하고, 생성자를 정의하고 객체 사이의 협력 기능을 구현한다. "학생이 지하철을 탄다"는 **학생 객체의 입장에서 사용한 문장**이다. **지하철 객체의 입장에서 생각해보면, 지하철에 학생이 탄다**이다.

**두 객체에서 서로 다른 일이 발생하는 것이므로 이를 각각의 클래스에 메서드로 구현한다.** 각 객체의 입장을 잘 생각해서 코드를 짜자. 코드는 <a href='https://github.com/Shin-Jae-Yoon/do-it-java/blob/master/src/chapter06/Student.java' target='_blank'>Student 클래스</a>, <a href='https://github.com/Shin-Jae-Yoon/do-it-java/blob/master/src/chapter06/Bus.java' target='_blank'>Bus 클래스</a>, <a href='https://github.com/Shin-Jae-Yoon/do-it-java/blob/master/src/chapter06/Subway.java' target='_blank'>Subway 클래스</a>, <a href='https://github.com/Shin-Jae-Yoon/do-it-java/blob/master/src/chapter06/Taxi.java' target='_blank'>Taxi 클래스</a>, 테스트 클래스인 <a href='https://github.com/Shin-Jae-Yoon/do-it-java/blob/master/src/chapter06/TakeTrans.java' target='_blank'>TakeTrans 클래스</a>를 참조한다.

<hr>

## static 변수

### 변수를 여러 클래스에서 공통으로 사용하려면?

<br>

```java
public class Student {
	public int studentID;
	public String studentName;
	public int grade;
	public String address;
}
```

위와 같은 학생 클래스가 예시로 있다. 만약 학생이 입학할 때 (=클래스가 생성되면) 학번이 자동으로 부여되도록 만들고 싶다. 생성된 인스턴스는 학번을 순서대로 가져야 한다.

이러한 경우, 각 인스턴스마다 따로 생성되는 변수가 아닌, **클래스 전반에서 공통으로 사용할 수 있는 기준 변수**가 있어야 한다.

> 클래스에서 공통으로 사용하는 변수를 **static 변수**로 선언한다.

<br>

### static 변수의 정의와 사용 방법

static 변수는 정적 변수이다. 클래스 내부에 선언하고 자료형 앞에 static 예약어 사용

```java
static int serialNum;
```

static 변수 (= 정적 변수)는 클래스 내부에 선언하지만, 다른 멤버 변수처럼 인스턴스가 생성될 때마다 새로 생성되는 변수가 아니다. static 변수는 프로그램이 실행되어 메모리에 올라갔을 때 딱 한 번 메모리 공간이 할당된다. 이 값은 **모든 인스턴스가 공유한다.**

static으로 선언한 변수는 인스턴스 생성과 상관없이 **먼저 생성**되고 그 값을 모든 인스턴스가 공유하게 된다. 이러한 이유로 클래스스에 기반한 변수라고 하며 **클래스 변수**라고도 한다.

- static 변수 = 정적 변수 = 클래스 변수

- 딱 한 번 메모리 공간 메서드 영역에 할당

- 모든 인스턴스가 이 값을 공유

<br><br>

**메모리 영역 정리** 

- JVM은 메모리를 할당받고 용도에 따라 여러 영역으로 나누어 관리

- 대표적으로 3가지 (메서드 영역, 호출 스택, 힙)

- 메서드 영역 : 클래스파일(`.class`) 읽어서 분석하고 클래스에 대한 정보, 클래스 데이터, 클래스 변수 등

- 호출 스택 : 메서드의 작업에 필요한 메모리 공간 제공, 지역 변수, 매개변수 등

- 힙 : 인스턴스가 생성되는 공간, 인스턴스 변수

<br>

```java
package chapter06;
  
public class StudentStatic {
	public static int serialNum = 1000;
	public int studentID;
	public String studentName;
	public int grade;
	public String address;

	public StudentStatic() {
		serialNum++;
		studentID = serialNum;
	}
  
	public String getStudentName() {
		return studentName;
	}
  
	public void setStudentName(String studentName) {
		this.studentName = studentName;
	}
}
```

<br>

```java
package chapter06;
  
public class StudentStaticTest {
	public static void main(String[] args) {
		StudentStatic studentLee = new StudentStatic();
		studentLee.setStudentName("이지원");
		System.out.println(studentLee.serialNum);
		System.out.println(studentLee.studentName + " 학번 : " + studentLee.studentID);
		  
		StudentStatic studentSon = new StudentStatic();
		studentSon.setStudentName("손수경");
		System.out.println(studentSon.serialNum);
		System.out.println(studentSon.studentName + " 학번 : " + studentSon.studentID);
	}
}
  
// 1001
// 이지원 학번 : 1001
// 1002
// 손수경 학번 : 1002
```

<br>

### 클래스 변수

static 변수 = 정적 변수 = 클래스 변수는 인스턴스를 생성할 때마다 만들어지는 것이 아니다. 인스턴스 생성과는 별개이고 **인스턴스보다 먼저 생성되어 메서드 영역에 저장**된다. 그래서 위에 코드를 인스턴스말고 **클래스 이름으로 직접 참조**하도록 하여 serialNum을 가져올 수 있다.

```java
package chapter06;
  
public class StudentStaticTest {
	public static void main(String[] args) {
		StudentStatic studentLee = new StudentStatic();
		studentLee.setStudentName("이지원");
		// 인스턴스 생성 안하고 그냥 가져올 수 있음
		System.out.println(StudentStatic.serialNum);
		System.out.println(studentLee.studentName + " 학번 : " + studentLee.studentID);
		
		StudentStatic studentSon = new StudentStatic();
		studentSon.setStudentName("손수경");
		// 인스턴스 생성 안하고 그냥 가져올 수 있음
		System.out.println(StudentStatic.serialNum);
		System.out.println(studentSon.studentName + " 학번 : " + studentSon.studentID);
	}
}
```

<br>

### 클래스 메서드

static 변수를 위한 메서드도 있다. 이것을 **static 메서드** 혹은 **클래스 메서드**라고 한다.

- 외부 클래스에서 serialNum 직접 참조 못하게 private으로 선언

- private으로 바꿨으니 StudentStaticTest 클래스에서 접근 못하니까 직접 참조 불가

- serialNum에 대한 get(), set() 생성

- get()으로 참조하기

```java
package chapter06;

public class StudentStaticMethod {
	private static int serialNum = 1000;
	int studentID;
	String studentName;
	int grade;
	String address;
	  
	public StudentStaticMethod() {
		serialNum++;
		studentID = serialNum;
	}
	  
	public String getStudentName() {
		return studentName;
	}
	  
	public void setStudentName(String studentName) {
		this.studentName = studentName;
	}
	  
	public static int getSerialNum() {
		return serialNum;
	}
	
	public static void setSerialNum(int serialNum) {
		StudentStaticMethod.serialNum = serialNum;
	}
}
```

<br>

```java
package chapter06;
  
public class StudentStaticMethodTest {
	public static void main(String[] args) {
		StudentStaticMethod studentLee = new StudentStaticMethod();
		studentLee.setStudentName("이지원");
		System.out.println(StudentStaticMethod.getSerialNum());
		System.out.println(studentLee.studentName + " 학번 : " + studentLee.studentID);
		  
		StudentStaticMethod studentSon = new StudentStaticMethod();
		studentSon.setStudentName("손수경");
		System.out.println(StudentStaticMethod.getSerialNum());
		System.out.println(studentSon.studentName + " 학번 : " + studentSon.studentID);
	}
}
```

static 메서드 또한 static 변수처럼 **인스턴스 참조 변수가 아닌 클래스 이름으로 직접 호출할 수 있음**. 다음으로, `getSerialNum()` 메서드를 더 살펴보겠다.

```java
public static int getSerialNum() {
	int i = 10;
	studentName = "이지원";
	return serialNum;
}
```

- `int i = 10`은 메서드 내부에서 선언한 **지역 변수**이다. `getSerialNum()` 메서드 내부에서만 사용 가능하다.

- `return serialNum;`은 serialNum이 static 변수라서 static 메서드에서 사용 가능하다.

- 그러나, `studentName`은 인스턴스 변수라서 인스턴스가 생성될 때 만들어지는 변수라서 아직 인스턴스를 생성하고 이런 상태가 아니라서 사용할 수 없다. 오류발생

> 클래스 메서드, 클래스 변수는 인스턴스가 생성되지 않아도 클래스를 직접 참조하여 사용 가능하다.

<br>

정리하자면, **클래스 메서드 내부에서 지역 변수와 클래스 변수는 사용할 수 있지만, 인스턴스 변수는 사용할 수 없다.** 반대로, 일반 메서드에서 클래스 변수를 사용하는 것은 문제 없다.

- 일반 메서드 : 인스턴스 생성될 때 호출되는 메서드, 클래스 변수는 이미 만들어져있어서 호출 가능

- 클래스 메서드 : 이미 만들어져있는 클래스 변수는 사용 가능, 하지만 인스턴스 변수는 아직 생성 안되었으니까 사용 불가능 !

<hr>

## 변수 유효 범위

변수는 어디에 어떻게 선언되느냐에 따라 **유효범위(scope)** 가 달라진다.

<br>

### 지역 변수 유효범위

- 지역 변수(로컬 변수, local variable)는 함수나 메서드 내부에 선언, 함수 밖에서 사용 못함

- 지역 변수가 생성되는 메모리는 **스택(stack)**

- 함수가 호출될 때 스택에 생성되었다가 함수가 반환되면 할당되었던 메모리 공간 해제하면서 없어짐

<br>

### 멤버 변수 유효범위

- 멤버 변수(인스턴스 변수)는 클래스의 어느 메서드에서나 사용 가능

- 멤버 변수가 생성되는 메모리는 **힙(heap)**

- 힙에 생성된 인스턴스가 가비지 컬렉터(garbage collector)에 의해 수거되면 메모리에서 사라진다. 따라서 클래스 **내부**의 여러 메서드에서 사용할 변수는 멤버 변수로 선언하는 것이 좋음

<br>

### 정적 변수 유효범위

- 정적 변수(static 변수, 클래스 변수)는 private이 아니라면 클래스 외부에서도 객체 생성(인스턴스 생성)과 무관하게 사용 가능

- 정적 변수가 생성되는 메모리는 **메서드 영역**

- 메서드 영역 (책에서는 데이터 영역이라고 표현)에는 상수, 문자열, static 변수가 생성된다. 따라서 클래스 생성과 상관 없이 처음부터 메모리에 올라가는 것

- 프로그램 실행이 끝난 뒤 메모리에서 내려가면 그때 static 변수가 소멸된다. 즉, 프로그램의 시작부터 끝까지 메모리에 상주하므로, 너무 큰 변수를 static으로 선언하는 것은 좋지 않다.

<br>

### 변수 유형에 따른 용도

![](brain/image/chap06-2.png)

- 클래스의 여러 메서드에서 사용할 변수

이러한 상황에 지역 변수로 선언하면, 다른 메서드에서 사용할 일이 있을 때 지역 변수를 메서드의 매개변수로 전달해야해서 매우 번거로움

<br>

모든 변수를 멤버 변수나 static 변수로 선언하면 메모리가 낭비되고 코드의 가독성 떨어짐. 따라서, 정답은 없으니까 상황에 맞게 효율적으로 프로그래밍 해야함.

<br>

- [x] 함수에서 기능 구현을 위해 잠시 사용 -> 지역 변수

- [x] 클래스의 속성을 나타내고 각 인스턴스 마다 다른 값 가짐 -> 멤버 변수

- [x] 여러 인스턴스에서 공유해서 사용하도록 한 번만 생성 -> 정적 변수

<hr>

## static 응용 - 싱글톤 패턴

### 디자인 패턴이란?

- 객체지향 프로그램을 구현할 때 더 유연하고 재활용성이 높은 프로그램을 만들 수 있도록 정리한 내용

- 프로그램 특성에 따른 설계 유형을 이론화 한 것

- 자바에만 한정 짓는 것이 아닌 다른 객체 지향 언어에도 적용 가능

<br>

### 싱글톤 패턴이란?

프로그램 구현 시, 여러 개의 인스턴스가 필요한 경우, 단 하나의 인스턴스만 필요한 경우가 있는데, **인스턴스를 단 하나만 생성하는 디자인 패턴을 싱클톤 패턴(singleton pattern)** 이라고 함.

여기서 살펴볼 싱글톤 패턴은 **static을 응용하여 프로그램 전반에서 사용하는 인스턴스를 하나만 구현하는 방식**

<br>

예시

- 어떤 회사의 직원들을 객체 지향 프로그램으로 구현

- 회사는 하나, 직원은 여러명

- 회사 객체는 **단 하나만 생성**

- 직원 인스턴스는 여러 개 생성

<br>

### 싱글톤 패턴으로 회사 클래스 구현

1. 생성자를 private으로 만들기

	- 컴파일러가 만들어주는 디폴트 생성자는 항상 public

	- 생성자가 public이면 외부 클래스에서 인스턴스 여러 개 생성 가능

	- 싱글톤 패턴에서는 생성자를 **반드시** 명시적으로 만들고 접근 제어자 private으로

```java
package chapter06.singleton;
  
public class Company {
	private Company() {}
}
```

<br>

2. 클래스 내부에 static으로 유일한 인스턴스 생성
  
	- 1단계에서 private으로 바꿔서 외부 인스턴스를 생성 못하게 바꿨음

	- 하지만, 프로그램에서 사용할 인스턴스 **단 하나**는 필요

	- 싱글톤 패턴으로 만든 클래스 내부에서 **하나의 인스턴스 생성**

	- 이 인스턴스가 프로그램 전체에서 사용할 유일한 인스턴스

```java
package chapter06.singleton;
  
public class Company {
	private static Company instance = new Company();
	private Company() {}
}
```

<br>

3. 외부에서 참조할 수 있는 public 메서드 생성

	- private으로 선언한 유일한 인스턴스를 외부에서 사용할 수 있도록 설정

	- 위 작업을 위해 public 메서드 생성하고 유일하게 생성한 인스턴스 반환

	- 인스턴스를 반환하는 메서드는 반드시 **static**으로 선언

	- static 선언 이유 : 인스턴스 생성과 상관없이 호출해야해서

```java
package chapter06.singleton;
  
public class Company {
	private static Company instance = new Company();
	private Company() {}
	  
	public static Company getInstance() {
		if (instance == null) {
			instance = new Company();
		}
		
		return instance;
	}
}
```

이는 마치 private 변수 선언했을 때, 외부에서 사용하려고 public get() 메서드 구현한 것과 동일한 모습이다.

<br>

4. 실제로 사용하는 코드 생성

	- 외부 클래스에서 Company 생성 불가능한 상태

	- 따라서, static으로 제공되는 getInstance() 메서드를 호출

	- `Company.getInstance();`로 호출하면 반환값으로 유일한 인스턴스 받음

	- 아래 코드는 같은 주소인지 확인하여 유일한 인스턴스가 맞는지 증명하는 코드

```java
package chapter06.singleton;
  
public class CompanyTest {
	public static void main(String[] args) {
		Company myComapny1 = Company.getInstance();
		Company myCompany2 = Company.getInstance();
		System.out.println(myComapny1 == myCompany2);
	}
}
  
// true
```