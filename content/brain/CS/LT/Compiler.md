---
title: "컴파일러"
date: "2023-02-24 20:48"
enableToc: false
tags: ["프로그래밍 언어론"]
---
<br>

==**컴파일러(Compiler)는 컴파일 과정을 수행하는 프로그램이다.**==
- 소스 코드 전체를 목적 코드로 번역하고 그 결과를 한 번에 실행
- 번역과 실행 작업이 따로 진행된다. 번역의 과정은 오래 걸리지만, 실행의 과정은 빠르다.
- 실행 프로그램이 따로 생성된다.

<br>

|           | **컴파일러(Compiler)** | **인터프리터(Interpreter)**          |
| :---------: | :----------------------: | :------------------------------------: |
| 번역 단위 | 전체                   | 한 줄 마다                           |
| 실행 속도 | 빠름                   | 느림                                 |
| 번역 속도 | 느림                   | 빠름                                 |
| 목적 코드 | 생성 O                 | 생성 X                               |
| 예시      | C, C++, Java Compiler  | Python, JavaScript, Java Interpreter | 

<br>

자바에서의 컴파일러에 관한 이야기는 [여기](brain/Java/JavaExecute)를 참고하자.

<br><br>

## Compiler Structure

![](brain/image/Compiler-1.png)

- Front-End : 언어에 의존하고 기계에 독립적인 부분
- Back-End : 언어에 독립적이고 기계에 의존하는 부분

<br>

![](brain/image/Compiler-2.png)

1. ==**Lexical Analyzer (Scanner)**==
	- 컴파일러 내부에서 효율적이며 다루기 쉬운 정수로 바꿔 줌
	- source programs -> **Lexical Analyzer** -> A sequence of tokens
	- 대표적인 토큰 분석기로 [Lex](brain/CS/LT/Lex)가 있음
	- 예를 들어, `if (a > 10)`이 있다고 하면, `if`, `(`, `a`, `>`, `10`, `)` 6개의 토큰이 생성되는 것

2. ==**Syntax Analyzer (Parser)**==
	- 구문(Syntax) 체크, 트리 생성
	- A sequence of tokens -> **Syntax Analyzer** -> Error message of syntactic structure
	- 대표적인 구문 분석기로[Yacc](brain/CS/LT/Yacc)가 있음
	- 출력
		- incorrect : error message 출력
		- correct : program structure (tree 형태) 출력

![](brain/image/Compiler-3.png)

3. ==**Intermidate Code Generator**==
	- 의미(Semantic) 체킹
	- ex) `if (a > 10) a = 1.0` => a가 정수일 때 semantic error
	- ex) `a = b + 1;`

![](brain/image/Compiler-4.png)

4. ==**Code Optimizer**==
	- optional phase (선택적 단계)
	- 비효율적인 code를 구분해내서 더 효율적인 code로 바꿔준다.
	- Meaning of optimization (최적화)
		- major part : improve running time
		- minor part : reduce code size
		- ex) `LDC R1, 1`,  `LDC R1, 1` load가 중복되니까 하나 없애기
	- Criteria for optimization (최적화의 기준)
		- 프로그램 의미 보존
		- 평균 속도 상승
		- 노력할 가치가 있는 경우
	- Local optimization : local inspection을 통하여 비효율적인 code들을 구분해 내서 더 효율적인 code로 바꾸는 방법
		1. Constant folding (컴파일 시간 상수 연산)
		2. Eliminating redundant load, store instructions
		3. Algebraic simplification
		4. Strength reduction
	- Global optimization : flow analysis technique 이용
		1. Common subexpression (공통 부분식)
		2. Moving loop invariants
		3. Removing unreachable codes

5. ==**Target Code Generator**==
	- 중간 코드로부터 machine instruction을 생성
	- Intermediate Code -> **Target Code Generator** -> Target Code
	- Code generator tasks
		1. instruction selection & generation
		2. register management
		3. storage allocation
		4. code optimization (Machine-dependent optimization)

6. ==**Error Recovery**==
	- Error recovery : error가 다른 문장에 영향을 미치지 않도록 수정하는 것
	- Error repair : error가 발생하며 복구해 주는 것
	- Error Handling
		- Error detection
		- Error recovery
		- Error reporting
		- Error repair
	- Error
		- Syntax Error
		- Semantic Error
		- Run-time Error

<br>

**추가사항**

- Single Pass Compiler
	- 초창기의 컴파일러
	- 컴파일 속도 빠름
- Multi-pass Compiler
	- 부분적인 기능개선 가능
	- 다른 기종으로 이전 편리
	- 작은 기억 공간 요구
	- 컴파일 속도 느림