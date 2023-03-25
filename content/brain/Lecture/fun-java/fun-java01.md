---
title: "01. Java 시작"
date: "2023-03-24 11:47"
enableToc: true
tags: [""]
---

인프런의 <a href='https://www.inflearn.com/course/%EC%A6%90%EA%B1%B0%EC%9A%B4-%EC%9E%90%EB%B0%94' target='_blank'>부부 개발단 토토님의 즐거운 자바 강의</a>를 정리한 내용

<hr>

## Java의 특징

- 객체지향 언어
- Java는 느리지만, 버전 업 되면서 다른 언어들의 장점들을 흡수
	- Java 8 이후부터를 모던 자바라고 함
	- 람다(Lambda) : 함수형 프로그래밍
	- Stream API : 람다 표현식, 메서드 참조 등의 기능과 결합하여 매우 복잡하고 어려운 데이터 처리 작업을 쉽게 조회하고 필터링하고 변환하고 처리할 수 있게 함
	- 병렬 프로그래밍 : 여러 개의 CPU 코어에서 작업을 배분하여 동시에 작업을 수행

<br>

### 작성과 실행

- JDK(Java Development Kit) 프로그램을 다운하고 설치
- 여러 종류의 JDK 존재
	- OpenJDK, Oracle JDK, Azul Julu JDK, Amazon Corretto OpenJDK, Adoptium Termurin 등
	- 이클립스 재단의 어댑티움 프로젝트가 '이클립스 테무린(Eclipse Temurin) 자바 SE 바이너리'의 첫 번째 릴리즈 출시함. 이는 Intel 64-bit 프로세서 기반 윈도우, 리눅스, 맥 OS용 자바 SE8, 자바 SE11, 자바 SE 16의 최신 버전을 다루는 오픈JDK(OpenJDK)의 '프로덕션 레디(production-ready)' 빌드이다.
- LTS 버전은 유지보수를 길게 지원하겠다고 선언한 버전

<br>

### Hello 파일 분석

1. 클래스 선언

```java {title="Hello.java"}
public class Hello {
	...
}
```

- public class로 정의된 Hello 클래스
- public class의 클래스 이름과 파일 이름은 같아야 한다. (중요! 대소문자 구분함)
- ==**클래스(Class)와 객체(Object)는 구분되어야 한다. 즉, 설계도와 설계도로 만들어진 것은 구분해야한다는 의미**==

<br>

2. 메서드 선언

```java
	public static void main(String[] args) {
		...
	}
```

- 클래스 안에는 필드(Field)와 메서드(Method)를 가질 수 있음
- 프로그램이 실행하려면 반드시 가져야 하는 **main 메서드**
- Java로 만든 프로그램이 실행되려면 위의 코드(code)를 가지고 있어야 한다. **프로그램 시작점**이라고도 말한다.

<br>

3. 출력

```java
	System.out.println("Hello");
```

- 앞으로 Java에서 단어의 첫 번째 글자가 대문자로 시작하면 클래스로 이해하자.
- `System.out`은 **System 클래스가 가지고 있는 out 필드라는 의미**
- `out.println`은 **out 필드가 가지고 있는 println 메서드라는 의미**
- println 뒤에 괄호 있으니까 println 메서드
- out은 괄호가 붙지 않았는데 이건 out 필드
- out이 가지고 있는 println 메서드의 역할은 괄호 안의 내용을 화면에 출력한다.
- **in 필드는 InputStream 클래스, out 필드는 PrintStream 클래스**

<br>

<a href='https://docs.oracle.com/javase/8/docs/api/java/lang/System.html' target='_blank'>Oracle System API docs</a>에 들어가서 System 클래스에 관한 설명을 보면 된다. 앞으로 구글에다가 Java api docs와 같이 검색하거나 Java System api 같이 검색해서 찾아보도록 하자.

<br>

### 컴파일 과정

- 컴파일하려면 반드시 javac 프로그램이 필요. javac는 자바 컴파일러
- 터미널에서 `javac Hello.java` 입력하면 Hello.java 파일을 읽어들여서 컴파일
- 컴파일 성공 시 `Hello.class` 파일 생성, 컴파일 실패 시 오류 메시지 보여짐
- Hello.class 파일을 `바이트(byte) 파일`이라고 함. 사람이 이해하는 언어와 기계가 이해하는 언어인 기계어의 중간에 위치하는 녀석이다. JVM이 이해하는 코드가 바이트 코드
- 정리하자면, ==**Java에서 컴파일은 기계어로 바로 바꿔주는 것이 아니라 바이트 코드로 만들어준다. 컴파일되서 만들어진 바이트코드는 CPU/OS에 맞게 설치된 JDK 안에 있는 JVM이 한 줄 한 줄 읽어가며 인터프리터 방식으로 실행한다.**==

<br>

### IntelliJ 프로젝트 구조

![](brain/image/fun-java01-1.png)

- `.idea` 폴더는 인텔리제이에서 프로젝트를 관리하기 위한 파일로 직접 수정하거나 삭제하면 안됨
- `Fun-Java.iml` 파일은 인텔리제이의 설정 파일로 직접 수정하거나 삭제하면 안됨
- 사용자는 src 폴더에 Java 소스 코드 작성