---
title: 힙
aliases:
  - 힙
  - 우선순위 큐
  - heapify
tags:
  - algorithm
origin:
  verified: 2026-08-31
---

완전 이진 트리 모양을 유지하면서, 부모가 자녀보다 항상 크거나(최대 힙) 항상 작도록(최소 힙) 정렬해둔 자료구조. 이 규칙 덕분에 최댓값이나 최솟값이 항상 루트에 있어서 확인하는 데 O(1)이다. 트리의 높이가 log N이니 꺼내고 넣는 것은 O(log N)이다.

우선순위 큐를 구현하는 표준적인 방법이다. [[dijkstra|다익스트라]]와 [[minimum-spanning-tree|프림 알고리즘]]이 힙 위에서 돈다.

## heapify와 힙 만들기

힙 규칙이 깨진 노드를 제자리로 돌려놓는 연산을 heapify라고 한다. 현재 노드 `i`와 왼쪽 자녀 `2i`, 오른쪽 자녀 `2i + 1` 셋 중 가장 큰 것을 largest라 하고, largest가 자녀라면 현재 노드와 값을 바꾼 뒤 내려간 자리에서 다시 같은 일을 한다. largest가 자기 자신이면 멈춘다.

```
function heapify(arr[], n, i)
  set largest = i
  set l = i * 2
  set r = i * 2 + 1
  if l <= n && arr[l] > arr[largest]
    largest = l
  if r <= n && arr[r] > arr[largest]
    largest = r
  if largest != i
    swap(arr[i], arr[largest])
    heapify(arr, n, largest)
```

한 번 부를 때 최대 트리 높이만큼 내려가니 O(log N)이다.

배열 하나를 통째로 힙으로 만드는 데는 O(N)이 든다. heapify가 O(log N)인데 N개 노드에 대해 부르면 O(N log N) 아닌가 싶지만 그렇지 않다. 자녀가 있는 마지막 노드, 곧 `N/2`번째부터 1번까지 거꾸로만 부르면 되고, 리프는 이미 힙이라 건드릴 필요가 없다. 게다가 노드의 대부분은 바닥 근처에 있고 바닥 근처 노드는 내려갈 거리가 짧다. 높이별로 노드 수와 이동 거리를 곱해서 더하면 O(N)으로 수렴한다.

## 삽입과 삭제

삽입은 트리 맨 끝에 붙이고 부모보다 크면 자리를 바꾸며 올라간다. 삭제는 루트만 뺄 수 있는데, 루트를 꺼내면 빈자리가 생기니 맨 끝 값을 루트로 올리고 그 자리에서 heapify를 내린다. 둘 다 높이만큼 움직이니 O(log N)이다.

## 보장하지 않는 것

부모와 자녀 사이의 크기 관계만 보장한다. 형제끼리는 아무 관계가 없다.

그래서 최댓값은 바로 알 수 있지만 그 아래로는 어느 원소가 어느 위치에 있는지 알 수 없다. k번째 최댓값을 구하는 문제에 힙을 그대로 쓸 수 없는 이유다. 정렬된 구조가 아니라 제일 위만 정확한 구조다.

## 관련

- [[binary-tree|이진 트리]]
- [[heap-sort|힙 정렬]]
- [[dijkstra|다익스트라]]

## 출처

- [[brain/notes/CodeTree/dataStructure|코드트리 자료구조 - Heap]]
- [[brain/notes/CodeTree/graph|코드트리 그래프 탐색 - 다익스트라와 프림의 우선순위 큐]]
