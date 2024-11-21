---
title: "07. 트리, 이진트리"
date: "2023-05-03 15:02"
enableToc: true
tags: [""]
weight: 8
---

유튜버 쉬운코드 님의 <a href='https://www.youtube.com/@ez./playlists' target='_blank'>데이터 구조</a> 강의를 정리한 내용

<hr>

## 트리

==**트리(tree)**==

- 노드(node)들의 집합
- 각 노드는 값(value)과 다른 노드들을 가리키는 레퍼런스들로 구성

> 노드는 엄밀히 말하면 값 뿐만이 아니라 레퍼런스를 포함해서 생각하자

<br>

### 주요 용어

<br>

![](brain/image/lecture07-12.png)

<br>

==**간선(edge)**==
- 노드와 노드를 연결하는 선
- 구현 관점에서는 **레퍼런스**를 의미
	- link, branch 라고도 불림
- ex) 흰색 선들

==**루트(root) 노드**==
- 트리의 최상단에 있는 노드
- 트리의 시작점
- ex) 2번 노드

==**자녀(child) 노드**==
- 모든 노드는 0개 이상의 자녀 노드를 가짐
- ex) 9의 자식 노드는 11, 11의 자식 노드는 8, 1, 4 등등

==**부모(parent) 노드**==
- 자녀 노드를 가지는 노드
- ex) 2, 5, 9, 6, 11번 노드

==**형제(sibling) 노드**==
- 같은 부모를 가지는 노드들
- ex) {8, 1, 4}, {6, 7}, {5, 9}

==**조상(ancestor) 노드**==
- 부모 노드를 따라 루트 노드까지 올라가며 만나는 모든 노드
- ex) 8의 조상 노드 : 11, 9, 2

==**자손(descendant) 노드**==
- 자녀 노드를 따라 내려가며 만날 수 있는 모든 노드
- ex) 9의 자손 노드 : 11, 8, 1, 4

==**내부(internal) 노드**==
- 자녀 노드를 가지는 노드, 리프 노드가 아닌 노드
	- branch node, inner node 라고도 불림
- ex) 2, 5, 9, 6, 11번 노드

==**외부(external) 노드**==
- 자녀 노드가 없는 노드
	- leaf node, outer node, terminal node 라고도 불림
	- 리프 노드, 외부 노드, 단말 노드
- ex) 3, 7, 8, 1, 4번 노드

==**경로(path)**==
- 한 노드에서 다른 노드 사이의 노드들의 시퀀스(sequence)
- ex) 2에서 7로의 경로 : 2 - 5 - 7
- ex) 2에서 4로의 경로 : 2 - 9 - 11 - 4

==**경로 길이(length of path)**==
- 경로에 있는 노드들의 수
- ex) 2에서 7로의 경로 길이 : 3
- ex) 2에서 3으로의 경로 길이 : 4

==**노드의 높이(height)**==
- 노드에서 자기 자손의 리프(leaf) 노드까지의 가장 긴 경로의 간선(edge) 수
	- 간선 수가 아니라 노드의 수로 카운트하는 경우도 있어서, 그때는 + 1 해주기
- ex) 5의 높이 : 2
	- 5번 노드에서 갈 수 있는 리프 노드는 3, 7
	- 이 중에서 3으로 가는게 가장 김. 따라서 2
- ex) 리프 노드의 높이 : 0

==**트리의 높이(height)**==
- 루트 노드의 높이
- ex) 트리의 높이 : 3

==**노드의 깊이(depth)**==
- 루트 노드에서 해당 노드까지 경로의 간선(edge) 수
- ex) 11의 깊이 : 2
	- 2에서 9, 9에서 11 총 2
- ex) 3의 깊이 : 3
- ex) 루트 노드의 깊이 : 0

==**트리의 깊이(depth)**==
- 트리에 있는 노드들의 깊이 중 가장 긴 깊이
- **트리 높이 = 트리 깊이**
- ex) 트리 깊이 : 3

==**노드의 차수(degree)**==
- 노드의 자녀 노드 수
- ex) 11의 차수 : 3
- ex) 3의 차수 : 0

==**트리의 차수(degree)**==
- 트리에 있는 노드들의 차수 중 가장 큰 차수
- 트리 차수 : 3

==**두 노드 사이의 거리(distance)**==
- 두 노드의 최단 경로의 간선 수
- ex) distance(9, 8) : 2
- ex) distance(3, 8) : 6

==**노드의 레벨(level)**==

![](brain/image/lecture07-13.png)

- 노드와 루트 노드 사이의 경로에서 간선(edge)의 수
- ex) 루트 노드의 레벨 : 0
	- 이것 또한 어떤 문서에서는 노드의 수라고 할 수도 있음. 그때는 + 1

==**width**==
- 임의의 레벨에서 노드의 수
- ex) level 2의 width : 3
- ex) level 3의 width : 4

==**노드의 크기(size)**==
- 자신을 포함한 자손 노드의 수
- ex) 9의 크기 : 5
- ex) 5의 크기 : 4

==**트리의 크기(size)**==
- 트리의 모든 노드의 수
- ex) 트리의 크기 : 10

==**서브 트리(subtree)**==

![](brain/image/lecture07-14.png)

- 각 노드의 자녀 노드들을 재귀적으로 서브 트리를 구성
- 모든 노드들은 자신의 자녀 노드들이 재귀적으로 서브트리를 가진다고 이해하자

<br><hr>

### 주요 특징

- 루트 노드는 하나만 존재
- 사이클(cycle)은 존재 ❌
- 자녀 노드는 하나의 부모 노드만 존재
- 데이터를 순차적으로 저장하지 않는 비선형(nonlinear) 구조
- 트리에 서브 트리가 있는 재귀적 구조
- 계층적 구조

<br>

**트리 자료구조에서 루트 노드는 하나만 존재**

![](brain/image/lecture07-15.png)

<br>

**트리 자료구조에서 사이클(cycle)은 존재하지 않음**

![](brain/image/lecture07-16.png)

<br>

**트리 자료구조에서 자녀 노드는 하나의 부모 노드만 존재**

![](brain/image/lecture07-17.png)

<br><hr>

### 이진 트리

==**이진 트리 (binary tree)**==

![](brain/image/lecture07-18.png)

- 각 노드의 자녀 노드 수가 **최대 2개**인 트리
- ==left child | right child==
- ==왼쪽 자녀 노드 | 오른쪽 자녀 노드==

<br><br>

==**정 이진 트리 (full binary tree)**==

![](brain/image/lecture07-19.png)

- 모든 노드는 자녀 노드가 없거나 2개인 트리
	- 즉, 자녀 노드가 1개인 노드는 없음

<br><br>

==**완전 이진 트리 (complete binary tree)**==

![](brain/image/lecture07-21.png)

- 마지막 레벨을 제외한 모든 레벨에서 노드가 빠짐 없이 채워져 있음
- 마지막 레벨은 왼쪽부터 빠짐없이 노드가 채워져 있는 트리

<br><br>

==**포화 이진 트리 (perfect binary tree)**==

![](brain/image/lecture07-22.png)

- 모든 레벨에서 노드가 빠짐없이 채워져 있는 트리

<br><br>

==**변질 이진 트리 (degenerate binary tree)**==

![](brain/image/lecture07-23.png)

- 모든 부모 노드는 하나의 자녀 노드만 가지는 트리
- pathological binary tree 라고도 불림

<br><br>

==**Left skewed binary tree**==

![](brain/image/lecture07-24.png)

- 모든 부모 노드는 왼쪽 자녀 노드만 가지는 트리

<br><br>

==**Right skewed binary tree**==

![](brain/image/lecture07-25.png)

- 모든 부모 노드는 오른쪽 자녀 노드만 가지는 트리

<br><br>

==**균형 이진 트리 (balanced binary tree)**==
- 모든 노드에서 왼쪽 서브 트리와 오른쪽 서브 트리의 높이 차이가 최대 1인 트리

![](brain/image/lecture07-27.png)

![](brain/image/lecture07-28.png)

![](brain/image/lecture07-29.png)

![](brain/image/lecture07-30.png)
