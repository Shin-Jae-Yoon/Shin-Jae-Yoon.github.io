---
title: "구문도표"
date: "2023-02-24 20:04"
enableToc: true
tags: ["프로그래밍 언어론"]
---

<br>

==**구문 도표(Syntax diagram)는 형태가 순서도와 유사하다. 그림(도표)으로 구문을 표현하는 것이다.**== 구문 도표는 EBNF와 일대일 대응되며, 초기 프로그래밍 언어 Pascal(파스칼)의 사용자 설명서에 사용되었다.

- 다시 정의될 대상은 네모칸, 단말 기호는 원이나 타원형으로 표시, 이들 사이는 지시선으로 연결

<br>

|  **도형**  |  **의미**   |
|:----------:|:-----------:|
| □ (사각형) | 비단말 기호 |
|   ○ (원)   |  단말 기호  |
| → (화살표) |  기호 연결  | 

<br>

<p align="center"><img src="https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FplDhM%2Fbtqy5ClM092%2FMGeDuHsoZkZGpQobtgMvZ1%2Fimg.png" width="80%"></p>

-   **BNF** : **<if문> ::=** **if <논리식> then <문장> | if <논리식> then <문장> else <문장>**
-   **EBNF** : **<if문> ::= if <논리식> then <문장> [ else <문장> ]**