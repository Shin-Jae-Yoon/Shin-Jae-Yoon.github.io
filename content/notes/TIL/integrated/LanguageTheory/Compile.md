---
title: "컴파일"
date: "2023-02-23 21:14"
enableToc: false
tags: ["프로그래밍 언어론", "컴파일", "컴파일러"]
---

<br>

==**컴파일(Compile)**==은 인간이 이해할 수 있는 언어로 작성된 소스코드를 컴퓨터가 이해할 수 있는 기계어로 번역(변환)하는 작업을 의미한다. C, Java 등으로 작성된 소스코드를 전기 신호인 0, 1로 바꿔주는 과정이라고 이해하자. [컴파일러(Compiler)](notes/TIL/integrated/LanguageTheory/Compiler)는 컴파일 과정을 수행하는 프로그램이다. 

<p align="center"><img src="https://blog.kakaocdn.net/dn/L6HS2/btrtHDwcvXs/X8BlXqT3V8gwfOi9XSJDc0/img.png" width="100%"></p>

컴파일 과정은 왜 반드시 필요할까?

간단히 말하면, 인간이 작성한 언어를 컴퓨터가 이해하도록 변환해주는 것이지만, 상세하게 보면 컴퓨터를 이용하는 사용자들의 컴퓨터는 동일하지 않다. 프로그래밍 언어의 고급 언어는 약속된 문법을 사용하기 때문에 맥북인 내 컴퓨터로 C언어를 작성하든, 윈도우인 다른 사람의 컴퓨터로 C언어를 작성하든 C언어의 문법을 사용해서 application을 작성할 것이다.

**그러나, 운영체제가 다르면[ ISA(Instruction Set Architecture)](notes/TIL/integrated/ComputerArchitecture/ISA)도 다르고 컴퓨터가 작동하는 원리에 차이가 있을 수 밖에 없다.** 같은 윈도우라도 window 7, window 10과 같이 사용자의 컴퓨터들은 차이점이 반드시 존재한다. 컴퓨터 내부의 CPU, RAM 등 모든 부품에도 차이가 있기 때문에 **사용자의 환경에 맞는 적절한 전기 신호를 보내야 하는데 인간이 작성한 고급 언어만 보고는 그런 작업을 할 수 없다.** 컴파일 과정을 통해 각자의 환경에 맞는 어셈블리어로 변환하고 기계어로 변환해야 하는 것이다.

<br>

대략적인 컴파일 과정은 아래와 같다.

1. High Level Language로 프로그램을 만듦
	- source code (소스코드) 생성
2. High Level Language -> Assembly Language로 컴파일
	- 어셈블리 언어는 하드웨어가 어떤 ISA를 사용하느냐에 따라 다름
3. Assembler를 이용하여 Assembly Language -> Machine language
	- object code (목적코드) 생성
4. Linker object 관계 연결
	- out (리눅스), exe (윈도우) 같은 실행파일 생성
5. Loader에 올라가고 메모리에 들어간 이후 코드를 읽어 실행

<br>

> [!note] 그렇다면, 인터프리터는? <br>
> Python 같은 [인터프리터](notes/TIL/integrated/LanguageTheory/Interpreter)는 2, 3, 4, 5의 과정을 **프로그램을 실행시키면서 진행하기 때문에, 느리지만 호환성 걱정이 없다.**


<br>

아래의 그림은 C언어에서의 컴파일 과정이다.

<p align="center"><img src="https://i.imgur.com/HxBLHsR.png" width="100%"></p>

C에서의 컴파일 과정은 **4가지 단계(전처리 과정 - 컴파일 과정 - 어셈블리 과정 - 링킹 과정)** 로 나누어 진다. 이 4가지 단계를 묶어서 컴파일 과정, 빌드 과정이라고 부르기도 하고 컴파일 과정과 링킹 과정을 따로 나눠서 부르기도 한다. 보통 빌드 과정은 컴파일 과정보다 넓은 의미(`빌드=컴파일+링킹`)로 사용되는데 상황에 맞게 이해하면 될 거 같다.

- 전처리기(preprocessor) : 원시 프로그램을 번역하기 전에 프로그램 내에 포함되어 있는 특별한 지시어를 먼저 해독해주는 번역 프로그램, 전처리기로 처리된 **소스 프로그램**은 컴파일러에 의해 **목적 프로그램**으로 변환됨

- 링커 : 목적 프로그램에 라이브러리로부터 꺼낸 표준함수와 사용자 함수를 연결해서 실행 가능한 프로그램을 생성한다.

- test라는 소스 코드를 C언어로 작성했다고 하면, `test.c`, `test.obj`, `test.exe` 총 3개의 파일이 만들어진다.

C언어에서 컴파일에 관한 자세한 내용은 <a href='https://bradbury.tistory.com/226' target='_blank'>링크</a>를 참고하자.