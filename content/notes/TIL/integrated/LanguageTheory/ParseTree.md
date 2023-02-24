---
title: "파스 트리"
date: "2023-02-24 20:17"
enableToc: true
tags: ["프로그래밍 언어론"]
---

==**파스트리(Parse Tree)란 BNF 문법을 이해하기 쉬운 구조로 나타낸 것으로, 원시 프로그램의 문법을 검사하는 과정에서 내부적으로 생성되는 트리 형태의 자료구조이다.**== 

<p align="center"><img src="https://i.imgur.com/xQl5ShQ.png" width="80%"></p>

<br>

파스트리는 **모호성, 결합성의 우선순위**에 따라 서로 다른 유도과정을 거쳐 트리를 생성해낸다. 예를 들어, `B33`이라는 letter, digit, digit을 유도한다면

1. `<identifier>` → `<identifier> <digit>` → `<identifier> 3` → `<identifier> <digit> 3` → `<identifier> 3 3` → `<letter> 3 3` → B33

2. `<identifier>` → `<identifier> <digit>` → `<identifier> <digit> <digit>` → `<letter> <digit> <digit>` → `B <digit> <digit>` → `B 3 <digit>` → B33

<p align="center"><img src="https://i.imgur.com/rFRMOEH.png" width="80%"></p>

<br>

그런데, 만약 뺼셈과 곱셈이 있는데 모호성이 발생한다면 어떻게 될까? 곱셈이 먼저 되어야 하는데 뺄셈이 먼저 될 수도 있으므로, 우선순위를 명확하게 하여 모호성을 제거하고 파스 트리를 만들어야 한다.

<br>

추가적으로, `<identifier> <digit>`는 가능하지만 `<digit> <identifier>`는 안된다. 이는 변수명에 `sum5`는 되지만, `5sum`은 안되는 것을 의미한다.