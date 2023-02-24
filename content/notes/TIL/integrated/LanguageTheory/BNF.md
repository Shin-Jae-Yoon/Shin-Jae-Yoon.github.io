---
title: "BNF"
date: "2023-02-24 20:03"
enableToc: true
tags: ["프로그래밍 언어론"]
---

<br>

==**BNF(Backus-Naur Form)는 프로그래밍 언어 Algol(알골)의 구문을 정의하기 위해 배커스와 나우어가 사용한 표현법이다.**== 구문(syntax) 형식을 정의하는 가장 보편적인 표기법이다.

<br>

| **메타기호** |      **의미**       |
|:------------:|:-------------------:|
|    `::==`    |        정의         |
|     `\|`      |      택일(OR)       |
|    `< >`     | 비단말(nonterminal) | 

<br>

BNF에서 규칙은 메타 기호(`::==`)를 이용하여 표현한다.

- 생성 규칙
	- 생성 규칙의 왼쪽 : 정의될 대상
	- 생성 규칙의 오른쪽 : 그 대상에 대한 정의

메타 기호의 왼쪽에는 하나의 비단말 기호가, 오른쪽에는 기호들을 활용하여 정의하는 내용이 나오는 것이다. 참고로, 꺽쇠가 없는 것은 단말(terminal)이다.

<br>

|  **기호**   |              **의미**               |                  **예시**                   |
|:-----------:|:-----------------------------------:|:-------------------------------------------:|
|  단말 기호  | 비단말 기호 및 메타기호가 아닌 기호 |   A, B, a, b, 0, 1, if, then, +, -, 등등    |
| 비단말 기호 |     메타 기호 `< >`로 묶인 기호     | `<identifier>`, `<letter>`, `<digit>`, 등등 | 

<br>

- 사용 예시
```
<if문> ::= if <논리식> then <문장> else <문장> | if <논리식> then <문장>
```
<br>

```
<identifier> ::= <letter> | <identifier><letter> | <identifier><digit>  
<letter> ::= A | B | C | ... | X | Y | Z | a | b | ... | z |  
<digit> ::= 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
```

<br>

한 표현이 BNF에 의해 작성될 수 있는지 여부를 나타내는 것이 [파스 트리 (parse tree)](notes/TIL/integrated/LanguageTheory/ParseTree)이다. 참고로 BNF를 확장한 것은 [EBNF](notes/TIL/integrated/LanguageTheory/EBNF)이다.