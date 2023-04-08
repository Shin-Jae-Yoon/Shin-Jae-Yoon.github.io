---
title: "09. Java I/O"
date: "2023-04-07 21:23"
enableToc: true
tags: [""]
---

인프런의 <a href='https://www.inflearn.com/course/%EC%A6%90%EA%B1%B0%EC%9A%B4-%EC%9E%90%EB%B0%94' target='_blank'>부부 개발단 토토님의 즐거운 자바 강의</a>를 정리한 내용

<hr>

## Java I/O

**I/O는 Input, Output이다.**
- Input & Output, 입출력
- 입력은 **키보드, 네트워크, 파일** 등으로부터 받을 수 있음
- 출력은 **화면, 네트워크 파일** 등에 할 수 있음

<br>

**Java IO도 객체다.**
- Java IO에서 제공하는 객체는 자바 세상에서 사용되는 객체이다.
- Java IO가 제공하는 객체는 어떤 대상으로부터 읽어들여, 어떤 대상에게 쓰는 일을 한다.

<br>

### Decorator 패턴

![](brain/image/fun-java09-1.png)

- Java IO는 **조립되어 사용**되도록 만들어졌다.
	- Decorator 패턴으로 만들어졌다.
	- 연관관계 UML에 대한 참조는 [여기](/brain/Lecture/fun-java/fun-java07)
	- 그냥 화살표는 일반화, 마름모는 집합관계
	- ==**Decorator는 Component를 가질 수 있다.**==
		- ==**이 말은 Decorator의 생성자는 Component를 받아들일 수 있게 되어있다는 것**==
		- 이 말은 컴포넌트를 상속받고 있는 것들도 가질 수 있다. (ConcreteComponent)
- 강사님 표현에 따르면 ConcreteComponent가 주인공, Decorator가 장식

<br>

**주인공과 장식을 구분할 수 있어야 한다.**
- 장식은 ==**InputStream, OutputStream, Reader, Writer**==를 생성자에서 받아들인다.
	- 이 네 가지가 ==**Component 역할을 수행**==
	- **추상 클래스라 new로 인스턴스 생성 불가**
- 주인공은 어떤 대상에게서 읽어들일지, 쓸지를 결정
- 주인공은 1byte or `byte[]` 단위로 읽고 쓰는 메서드를 가짐
- 주인공은 1char or `char[]` 단위로 읽고 쓰는 메서드를 가짐
- 장식은 다양한 방식으로 읽고 쓰는 메서드를 가짐

<br>

### Java IO의 특수한 객체

- `System.in` : 표준 입력 (InputStream)
- `System.out` : 표준 출력 (PrintStream)
- `System.err` : 표준 에러 출력 (PrintStream)

<br>

### Java IO의 클래스 상속도

![](brain/image/fun-java09-2.png)

**4가지 추상 클래스 InputStream, OutputStream, Reader, Writer**가 가장 중요

==**Java IO 클래스 이름이 굉장히 중요하다.**==

<br>

| 클래스 이름                                | 기능                                                                                                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stream으로 끝나는 클래스                   | byte 단위 입출력 클래스                                                                                                                                           |
| InputStream으로 끝나는 클래스              | byte 단위로 입력을 받는 클래스                                                                                                                                    |
| OutputStream으로 끝나는 클래스             | byte 단위로 출력을 하는 클래스                                                                                                                                    |
| Reader로 끝나는 클래스                     | 문자 단위로 입력을 받는 클래스                                                                                                                                    |
| Writer로 끝나는 클래스                     | 문자 단위로 출력을 하는 클래스                                                                                                                                    |
| File로 시작할 경우 <br> (File 클래스 제외) | File로부터 입력이나 출력을 하는 클래스                                                                                                                            |
| ByteArrary로 시작할 경우                   | 입력 클래스의 경우 byte 배열로부터 읽어 들이고, <br> 출력 클래스의 경우 클래스 내부의 자료구조에 출력을 <br> 한 후 출력된 결과를 byte 배열로 반환하는 기능을 가짐 |
| CharArray로 시작할 경우                    | 입력 클래스의 경우 char 배열로부터 읽어 들이고, <br> 출력 클래스의 경우 클래스 내부의 자료구조에 출력을 <br> 한 후 출력된 결과를 char 배열로 반환하는 기능을 가짐 |
| Filter로 시작할 경우                       | Filter로 시작하는 입출력 클래스는 직접 사용하는 것 <br> 보다는 상속받아 사용하며, 사용자가 원하는 내용만 <br> 필터링할 목적으로 사용됨                            |
| Data로 시작할 경우                         | 다양한 데이터 형을 입출력 할 목적으로 사용한다. <br> 특히 기본형 값 (int, float, double 등)을 출력하는데 <br> 유리하다.                                           |
| Buffrered로 시작할 경우                    | 프로그램에서 Buffer라는 말은 메모리를 의미한다. <br> 입출력 시에 병목현상을 줄이고 싶을 경우 사용한다.                                                            |
| RandomAccessFile                           | 입력이나 출력을 모두 할 수 있는 클래스로써, 파일에서 <br> 임의의 위치의 내용을 읽거나 쓸 수 있는 기능을 제공                                                                                                                                                                  |

<br>


### Java IO의 생성자

- ==**Java IO 클래스는 생성자가 중요하다.**==
- 장식(Decorator)은 InputStream, OutputStream, Reader, Writer를 생성자에서 받아들인다.