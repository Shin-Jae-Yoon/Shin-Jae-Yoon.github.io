---
title: "Lex"
date: "2023-02-24 21:28"
enableToc: true
tags: ["프로그래밍 언어론"]
---

<br>

==**Lex(A Lexical Analyzer Generator)는 입력 스트립에서 정규 표현식(regular expression)으로 기술된 토큰들을 찾아내는 프로그램을 작성하는데 유용한 도구이다.**== Lex 소스는 정규 표현식 및 해당하는 프로그램의 조각의 테이블이다. 그 테이블은 입력 스트림을 읽어서 출력 스트림으로 복사하고, 입력을 주어진 표현식에 매칭되는 문자열로 분할하는 프로그램으로 변환된다.

![](brain/image/Lex-1.png)

보통 Lex scanner와 Yacc parse는 같이 구현하는 경우가 대부분이다. [Yacc](brain/CS/LT/Yacc)가 Lex의 상위에서 구현된다. Lex는 입력문자열에 대한 일차적인 검색을 하고 실제적인 분석은 Yacc가 하는 것이다. 