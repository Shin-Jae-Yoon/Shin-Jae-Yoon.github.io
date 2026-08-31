---
title: 큐와 덱
aliases:
  - 큐와 덱
  - Queue
  - Deque
  - FIFO
tags:
  - algorithm
  - java
origin:
  verified: 2026-08-30
---

큐는 먼저 넣은 것이 먼저 나오는 구조(FIFO)다. 넣는 쪽을 rear, 빼는 쪽을 front라고 하고, 양쪽이 다르다는 점이 [[brain/knowledge/algorithm/data-structure/stack|스택]]과의 유일한 차이다. 덱은 그 제한을 풀어 앞뒤 어디서나 넣고 뺄 수 있게 한 것이다.

## 큐와 덱의 연산

큐의 연산은 넷이다.

```java
add(e)      // 맨 뒤(rear)에 추가
poll()      // 맨 앞(front)에서 꺼내면서 제거
peek()      // 맨 앞 값 확인
isEmpty()
```

전부 O(1)이다. 줄 서기를 그대로 옮긴 구조라 순서를 지켜야 하는 곳에 쓰인다. 버퍼, 작업 대기열, 그리고 [[bfs|BFS]]가 대표적이다. 자바에서 `Queue`는 인터페이스이고 `LinkedList`가 그 구현체라 `Queue<T> q = new LinkedList<>()`처럼 쓴다.

덱은 앞뒤 모두 열려 있으니 스택으로도 큐로도 쓸 수 있다.

```java
addFirst(e)  addLast(e)
pollFirst()  pollLast()
peekFirst()  peekLast()
```

자바에서 스택이나 큐가 필요하면 대개 `ArrayDeque`를 쓴다. 그 이유는 [[brain/knowledge/algorithm/data-structure/stack|스택]]에 적어두었다.

## 큐 두 개로 스택 만들기

큐 두 개로 스택을 만드는 문제도 있다. [[brain/knowledge/algorithm/data-structure/stack|스택]] 두 개로 큐를 만드는 것의 반대 방향이다. 15, 35, 20을 넣으면 큐에는 15가 앞에 있는데 스택이라면 20이 먼저 나와야 한다. 그래서 pop을 흉내낼 때 마지막 하나만 남기고 나머지를 두 번째 큐로 옮긴 뒤 남은 하나를 꺼낸다.

```
function Stack.pop(q)
  set new_q = empty queue
  while q.size() != 1
    new_q.push(q.pop())
  set top = q.pop()
  q = new_q
  return top
```

## 배열로 만들면 안 되는 이유

배열로 큐를 만들면 안 된다. 배열의 맨 앞에서 원소를 빼면 뒤의 원소를 전부 한 칸씩 당겨야 해서 O(N)이다.

양 끝에서의 삽입과 삭제가 O(1)인 구조, 곧 [[linked-list|연결 리스트]]가 답이다. 자바의 `LinkedList`가 `Queue`를 구현하는 이유가 이것이다. 원형 배열로 만들면 배열로도 O(1)이 되지만, 그건 앞뒤 인덱스를 따로 관리해서 사실상 덱을 구현한 것이다.

## 관련

- [[brain/knowledge/algorithm/data-structure/stack|스택]]
- [[bfs|BFS]]
- [[linked-list|연결 리스트]]

## 출처

- [[brain/notes/CodeTree/dataStructure|코드트리 자료구조 - Queue, Deque]]
- [[brain/notes/CS/DS/queue|CS 노트 - 큐]]
- [[brain/notes/CS/DS/stack|CS 노트 - 스택 2개로 큐 구현]]
