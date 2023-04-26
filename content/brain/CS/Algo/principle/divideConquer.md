---
title: "분할 정복"
date: "2023-04-25 23:16"
enableToc: true
tags: [""]
---

<hr>

### 분할정복 개념

![](brain/image/divideConquer-1.png)

==**분할정복 (divide and conquer) : 여러 알고리즘의 기본이 되는 해결방법으로, 크고 방대한 문제를 조금씩 나눠가면서 풀기 쉬운 문제 단위로 만들어서 해결하고, 이후 다시 합쳐서 해결하는 개념**==
- 문제 해결 전략 중 하나
	- 어떤 문제를 유사한 형태를 가지는 더 작은 크기의 서브 문제들로 나눈 후 이들을 **재귀적**으로 같은 방식으로 해결한 뒤, 각 서브 문제들을 해결한 결과를 활용하여 원래 문제를 해결하는 방식
- 대표적인 예시 [합병정렬](brain/CS/Algo/sort/comparison/mergeSort), [퀵정렬](brain/CS/Algo/sort/comparison/quickSort), [이진탐색](brain/CS/Algo/principle/binarySearch)
	- 분할정복을 이해하기 좋은 예시는 합병정렬이다.

<br>

| 개념               | divide and conquer                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------- |
| **divide (분할)**  | 문제를 작은 크기의 서브 문제들로 나눔                                                    |
| **conquer (정복)** | 서브 문제들을 동일하게 재귀적인 방식으로 해결 <br> 만약 더 이상 나눌 수 없으면 직접 해결 |
| **combine (조합)** | 서브 문제들의 솔루션을 합쳐서 원래(original) 문제의 답을 만듬                                                                                         |

<br>



### 참고

- <a href='https://www.youtube.com/watch?v=aj3vw_KDmxc&t=2s' target='_blank'>쉬운코드님의 divide and conquer 강의</a>