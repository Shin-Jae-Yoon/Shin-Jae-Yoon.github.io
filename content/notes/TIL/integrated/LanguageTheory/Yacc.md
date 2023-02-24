---
title: "Yacc"
date: "2023-02-24 21:28"
enableToc: true
tags: ["프로그래밍 언어론"]
---

<br>

==**Yacc(Yet Another Compiler-Compiler)는 컴퓨터 소프트웨어로 유닉스 시스템의 표준 Parser Generator이다.**== Yacc에서 Parse Tree를 생성할 때 Bottom-up (LR)을 채택하고, 그중에서도 LALR(Look-Ahead LR) parser 방식을 채택한다. 단순 LR 방식에서 선행예측을 하는 것이다.

<p align="center"><img src="https://i.imgur.com/NPGvojN.png" width="60%"></p>

<p align="center"><img src="https://i.imgur.com/q62Qx6g.png" width="60%"></p>

<p align="center"><img src="https://i.imgur.com/57A04rL.png" width="60%"></p>

<br>

Yacc는 입력에 대한 토큰(token)이 필요하면, [Lex](notes/TIL/integrated/LanguageTheory/Lex)에서 제공하는 `yylex()`함수를 호출하여, 입력된 토큰들의 배열이 주어진 문법에 맞는지를 체크하면서 그 조건에 맞는 실행을 하게 된다. 다르게 표현하면, Lex와 Yacc을 사용 동시에 사용할 시에는 yacc 기술파일의 main()함수에서 yyparse()함수라는 yacc에 의해 만들어지는 구문분석기를 부르고, yyparse()함수는 yylex()라는 lex가 만들어 주는 해석기(lexer)를 이용해서 입력열에서 처리단위의 토큰을 뽑아오게 된다.