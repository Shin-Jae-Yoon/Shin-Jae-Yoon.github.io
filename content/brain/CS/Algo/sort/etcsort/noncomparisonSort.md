---
title: "비교하지 않는 정렬"
date: "2023-04-24 20:06"
enableToc: true
tags: [""]
weight: 2
---

<hr>

### 비교하지 않는 정렬 개념

==**비교하지 않는 정렬 (Non-Comparison sort) : 비교 정렬 알고리즘을 개선하는 것으로 말 그대로 비교를 하지 않는 알고리즘**==
- 정렬한 데이터에 대한 **특수한 성질**을 이용하며 적용에 제한이 있음
- 대표적으로 [기수정렬](brain/CS/Algo/sort/noncomparison/radixSort), [계수정렬](brain/CS/Algo/sort/noncomparison/countingSort)
- 메모리를 어떻게 쓰냐에 따라 **내부 정렬**, **외부 정렬**, [제자리 정렬](brain/CS/Algo/sort/etcsort/inplaceSort)로 나뉨
- 중복된 값이 같을 때, 값이 어떤 순서로 정렬되는지에 따라 [안정 정렬](brain/CS/Algo/sort/etcsort/stableSort), [불안정 정렬](brain/CS/Algo/sort/etcsort/unstableSort)로 나뉨

<br>

기본적으로 비교하지 않는 정렬을 구현하는 방법에 있어서, 특수 정렬 알고리즘을 사용한 방법이 있다.

- ==**특수 정렬 알고리즘**==
	- 시간 복잡도가 ==$O(n)$==인 정렬 알고리즘
	- 기수 정렬, 계수 정렬

