---
title: 구문 표기법
aliases:
  - 구문 표기법
  - EBNF
  - 파스 트리
  - 구문 도표
  - 프로그래밍 언어론
tags:
  - language
origin:
  verified: 2026-08-30
---

프로그래밍 언어의 문법을 형식적으로 적는 방법. [[compiler-structure|구문 분석기]]가 판단의 근거로 삼는 것이 이 문법이다.

## BNF와 메타 기호

프로그래밍 언어론은 컴퓨터 프로그래밍 언어를 이론적인 측면에서 탐구하는 학문이다. 언어의 구문(Syntax), 의미(Semantics), 구조(Structure)를 분석하고 구성 요소들이 언어의 특징과 동작을 어떻게 결정하는지 연구한다. 대표적인 구문 표기법으로 BNF, EBNF, 구문 도표가 있다.

가장 보편적인 것은 BNF(Backus-Naur Form)다. 프로그래밍 언어 알골의 구문을 정의하려고 배커스와 나우어가 사용한 표현법이며, 메타 기호 `::=`가 정의를, `|`가 택일을, 꺽쇠 `< >`가 비단말(nonterminal)을 나타낸다. 규칙의 왼쪽에는 정의될 대상인 비단말 기호 하나가 오고, 오른쪽에는 그 대상에 대한 정의가 온다. 꺽쇠가 없는 것은 단말(terminal)이다.

```
<if문> ::= if <논리식> then <문장> else <문장> | if <논리식> then <문장>

<identifier> ::= <letter> | <identifier><letter> | <identifier><digit>
<letter> ::= A | B | C | ... | X | Y | Z | a | b | ... | z
<digit> ::= 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
```

## 파스 트리

한 표현이 이 문법으로 작성될 수 있는지를 보여주는 것이 파스 트리다. BNF 문법을 이해하기 쉬운 구조로 나타낸 것으로, 원시 프로그램의 문법을 검사하는 과정에서 내부적으로 생성되는 트리 형태의 자료구조다. `B33`이라는 letter, digit, digit을 유도한다면 길이 하나로 정해지지 않는다.

```
<identifier> → <identifier><digit> → <identifier> 3 → <identifier><digit> 3
             → <identifier> 3 3 → <letter> 3 3 → B33

<identifier> → <identifier><digit> → <identifier><digit><digit>
             → <letter><digit><digit> → B <digit><digit> → B 3 <digit> → B33
```

문법은 순서도 제약한다. `<identifier><digit>`은 가능하지만 `<digit><identifier>`는 안 된다. 변수명에 `sum5`는 되고 `5sum`은 안 되는 규칙이 이것이다.

## EBNF

EBNF(Extended Backus-Naur Form)는 BNF에 메타 기호를 추가해 규칙을 더 간결하게 표현하도록 확장한 것이다. 생략 가능을 뜻하는 `[ ]`, 0번 이상 반복인 `{ }`, `|`와 함께 써서 한정된 범위의 택일을 나타내는 `( )`, 메타 기호 자체를 단말 기호로 쓰게 해주는 `' '`가 더해졌다.

무엇이 짧아지는지는 나란히 놓으면 바로 보인다. else가 있는 경우와 없는 경우를 두 줄로 나열하던 것이 `[ ]` 하나로 한 줄이 된다.

```
BNF   <if문> ::= if <논리식> then <문장> else <문장> | if <논리식> then <문장>
EBNF  <if문> ::= if <논리식> then <문장> [ else <문장> ]
```

BNF에는 반복을 표현할 방법이 재귀밖에 없다. `<unsigned integer> ::= <digit><digit>`, `<digit><digit><digit>` 하는 식으로 늘어나는 것을 자기 자신을 다시 부르는 규칙으로 적어야 한다. EBNF는 그냥 반복이라고 쓴다.

```
BNF   <unsigned integer> ::= <digit> | <unsigned integer><digit>
EBNF  <unsigned integer> ::= <digit> { <digit> }
```

사칙연산처럼 택일할 것이 여럿인 경우에는 `( )`로 범위를 묶는다.

```
BNF   <수식> ::= <수식> + <수식> | <수식> - <수식> | <수식> * <수식> | <수식> / <수식>
EBNF  <수식> ::= <수식> ( + | - | * | / ) <수식>
```

`::=`를 정의한다는 뜻이 아니라 글자 그대로 쓰고 싶을 때는 따옴표로 감싼다. 문법을 기술하는 언어로 문법 기술 언어 자체를 설명할 때 필요하다.

```
<BNF 규칙> ::= <왼쪽 부분> '::=' <오른쪽 부분>
```

## 구문 도표

구문 도표(Syntax diagram)는 형태가 순서도와 유사하다. 그림으로 구문을 표현하는 것이고, EBNF와 일대일 대응되며 초기 프로그래밍 언어인 파스칼의 사용자 설명서에 쓰였다. 다시 정의될 대상인 비단말 기호는 네모칸으로, 단말 기호는 원이나 타원형으로 표시하고 이들 사이를 지시선으로 연결한다.

같은 if문을 BNF로도 EBNF로도 도표로도 쓸 수 있다. 어느 하나가 옳은 것이 아니라 사람이 읽기 좋은 형태가 다를 뿐이다.

## 모호한 문법

파스 트리는 모호성과 결합성의 우선순위에 따라 서로 다른 유도 과정을 거쳐 트리를 만들어낸다. 유도 순서가 달라도 결과 트리가 같으면 문제가 없다. 트리 자체가 달라질 때가 문제다.

뺄셈과 곱셈이 섞인 식에서 곱셈이 먼저 되어야 하는데 뺄셈이 먼저 되는 트리도 만들어질 수 있다면 그 문법은 모호하다. 같은 문자열에서 뜻이 다른 트리가 둘 나온다. 우선순위를 명확하게 해서 모호성을 제거하고 파스 트리를 만들어야 한다.

## 관련

- [[compiler-structure|컴파일러의 구조]]
- [[brain/knowledge/language/theory/compile|컴파일 과정]]
- [[regex|정규식]]

## 출처

- [[brain/notes/CS/LT/LanguageTheory|CS 노트 - 프로그래밍 언어론]]
- [[brain/notes/CS/LT/EBNF|CS 노트 - EBNF]]
- [[brain/notes/CS/LT/ParseTree|CS 노트 - 파스 트리]]
- [[brain/notes/CS/LT/SyntaxTable|CS 노트 - 구문 도표]]
