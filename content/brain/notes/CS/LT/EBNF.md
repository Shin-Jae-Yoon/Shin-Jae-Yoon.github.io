---
title: "EBNF"
date: "2023-02-24 20:03"
enableToc: true
tags: ["프로그래밍 언어론"]
---

<br>

==**EBNF(Extended Backus-Naur Form) 표기법은 BNF에 메타 기호를 추가하여 규칙을 더 간결하게 표현할 수 있도록 확장된 BNF이다.**== 총 4가지 메타기호가 추가되었다.

<br>

| **구분** | **메타 기호** |               **의미**               |
|:--------:|:-------------:|:------------------------------------:|
|   BNF    |    `::==`     |                 정의                 |
|   BNF    |     `\|`      |               택일(OR)               |
|   BNF    |     `< >`     |         비단말(nonterminal)          |
|   EBNF   |     `[]`      |              생략 가능               |
|   EBNF   |     `{}`      |            0번 이상 반복             |
|   EBNF   |     `()`      | 한정된 범위의 택일, `\|`와 함께 사용 |
|   EBNF   |     `''`      |  메타 기호 자체를 단말 기호로 사용   | 

<br>

- 메타 기호 `[]`의 예시
	- 의미 : 생략 가능

```
BNF
<if문> ::= if <논리식> then <문장> else <문장> | if <논리식> then <문장>  
EBNF
<if문> ::= if <논리식> then <문장> [ else <문장> ]
```

<br>

- 메타 기호 `{}`의 예시
	- 의미 : 0번 이상 반복
	- `<unsigned integer> ::= <digit>`
	- `<unsigned integer> ::= <digit><digit>`
	- `<unsigned integer> ::= <digit><digit><digit> ...`
	- 이런식으로 재귀적인 표현 방법 사용했음

```
BNF
<unsigned integer> ::= <digit> | <unsigned integer><digit>  
EBNF
<unsigned integer> ::= <digit> { <digit> }
```

<br>

- 메타 기호 `()`의 예시
	- 의미 : 범위 중 택일

```
BNF
<수식> ::= <수식> + <수식> | <수식> - <수식> | <수식> * <수식> | <수식> / <수식>
EBNF
<수식> ::= <수식> ( + | - | * | / ) <수식>]
```

<br>

- 메타 기호 `''`의 예시
	- 의미 : 메타 기호 자체를 단말 기호로 사용

```
<BNF 규칙> ::= <왼쪽 부분> '::=' <오른쪽 부분>
```