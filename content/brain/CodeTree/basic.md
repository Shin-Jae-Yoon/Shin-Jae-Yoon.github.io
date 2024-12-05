---
title: "개요"
date: "2024-02-18 17:20"
enableToc: true
tags: [""]
weight: 1
---

코딩테스트를 진행함에 있어서, 잊어버리기 쉬운 기본 내용 정리

- [입출력](brain/CodeTree/inputoutput.md)
- [수학](brain/CodeTree/math.md)
- [문자열](brain/CodeTree/string.md)
- [자료구조](brain/CodeTree/dataStructure.md)
- [DP](brain/CodeTree/dp.md)
- [그래프 탐색](brain/CodeTree/graph.md)

<hr>

<br>

## 시간복잡도

<br>

![](brain/image/p1-ch02-1.png)

<p align="center"><strong>O(1) < O(log<sub>2</sub>n) < O(n) < O(n log<sub>2</sub>n) < O(n<sup>2</sup>) < O(2<sup>n</sup>)</strong></p>

<br>

참고로 $log N$은 상용로그가 아닌 밑이 2

$N <= 10$
- 시간 복잡도 $O(N!)$, $O(2^N)$, $O(3^N)$

$N <= 20$
- 시간 복잡도 $O(2^N)$

$N <= 100$
- 시간 복잡도 $O(N^4)$

$N <= 500$
- 시간 복잡도 $O(N^3)$

$N <= 1,000$
- 시간 복잡도 $O(N^2)$, $O(N^2 logN)$

==$N <= 100,000$==
- ==시간 복잡도 $O(N)$, $O(N log N)$, $O(log N)$, $O(1)$==

<hr>

<br>

## 공간복잡도

![](brain/image/basic-1.png)

```
int a[2천만] : 80MB
int a[2백만] : 80 / 10 = 8MB
char a[2천만] : 80 / 4 = 20MB
double a[2천만] : 80 * 2 = 160MB
```