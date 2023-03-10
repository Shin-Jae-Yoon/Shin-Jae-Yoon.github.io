---
title: "Java"
date: "2023-02-23 20:50"
enableToc: false
tags: ["Java"]
weight: 1
---

1996년 01월에 공식적으로 발표한 객체지향 프로그래밍 언어
- [Java의 실행 원리](brain/Java/JavaExecute)는 너무나 중요하다.
- 대표적인 [Java 버전](brain/Java/JavaVersion)은 Java 8, Java 11, Java 17이다.
- 다양한 [환경설정](brain/Java/java-settings)을 통해 편리하게 사용하자

<br>

## Java의 특징

1. ==**운영체제에 독립적**==
	- Java Application은 운영체제나 하드웨어가 아닌 [JVM](brain/Java/JVM)하고만 통신
	- JVM이 Java Applcation으로부터 전달받은 명령을 해당 운영체제가 이해할 수 있도록 변환하여 전달
	- Java로 작성된 프로그램은 운영체제에 독립적, JVM은 운영체제에 종속적
	- **한번 작성하면, 어디서나 실행된다(Write once, run anywhere)**

2. 객체지향언어
	- 상속, 캡슐화, 다형성이 잘 적용된 순수 객체지향언어

3. ==**자동 메모리 관리(Garbage Collection)**==

	- [Garbage Collector](brain/Java/GC)가 자동적으로 메모리 관리
	- 프로그래머가 보다 프로그래밍에 집중할 수 있게

4. 네트워크, 분산처리 지원
	- 다양한 네트워크 프로그래밍 라이브러리(Java API) 지원

5. ==**멀티스레드 지원**==
	- Java에서 개발된 멀티스레드 프로그램은 시스템과 관계없이 구현가능
	- 여러 스레드에 대한 [스케쥴링(scheduling)](brain/CS/OS/Scheduling)을 자바 인터프리터가 담당

6. ==**동적 로딩(Dynamic Loading)을 지원**==
	- Java Application은 여러 개의 클래스로 구성
	- 동적 로딩 덕분에 실행 시 모든 클래스 로딩 X
	- 필요 시점에 클래스를 로딩 O
	- 일부 클래스가 변경되어도 전체 Application을 다시 컴파일하지 않아도 됨
	- 변경사항이 발생해도 비교적 적은 작업으로 유연한 Application 작성 가능