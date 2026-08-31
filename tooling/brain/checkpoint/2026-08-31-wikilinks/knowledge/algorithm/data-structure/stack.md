---
title: 스택
aliases:
  - 스택
  - Stack
  - LIFO
tags:
  - algorithm
  - java
origin:
  verified: 2026-08-30
---

한쪽 끝에서만 넣고 뺄 수 있는 자료구조. 나중에 넣은 것이 먼저 나온다(LIFO). 스택과 [[큐와 덱]]처럼 넣고 빼는 위치가 제한된 구조를 묶어 Restricted Structure라고 부른다.

## 네 가지 연산과 배열 구현

기능은 네 개뿐이다.

```java
push(e)     // 맨 위에 쌓기
pop()       // 맨 위 값을 꺼내면서 제거
peek()      // 맨 위 값 확인만
isEmpty()   // 비었는지
```

전부 O(1)이다. 배열로 구현하면 중간 원소도 들여다볼 수 있지만 그건 스택이 제공하는 기능이 아니다. 스택을 쓰는 문제들을 보면 넣기, 빼기, 맨 위 확인 세 가지만 필요하다.

구현은 배열이 쉽다. 배열 하나와 현재 위치를 가리키는 인덱스 하나면 끝이다. `{13, 21, 30}`이 들어 있다면 `dat[0..2]`에 값이 있고 `pos`는 3이다. 여기서 `pos`가 곧 스택의 길이라, pop은 값을 지우는 게 아니라 `pos`만 하나 줄이면 된다. 다음에 push가 들어오면 어차피 덮어쓴다. 연결 리스트로도 만들 수 있지만 배열 쪽이 간단하고 빠르다.

## 쓰이는 곳

쓸 곳은 괄호쌍 검사, 후위 표기법 계산, [[DFS]], 되돌리기, Flood Fill이다. 괄호는 여는 것을 쌓고 닫는 것이 나오면 꺼내서 짝을 맞춘다. 깊이 우선 탐색이 곧 스택이고, 재귀로 짜면 [[콜 스택]]이 그 역할을 대신한다.

면접 단골인 스택 두 개로 큐 만들기도 같은 성질을 쓴다. 넣을 때는 첫 번째 스택에 쌓고, 뺄 때 두 번째 스택이 비어 있으면 첫 번째를 전부 꺼내 두 번째에 옮겨 담는다. 옮기는 과정에서 순서가 뒤집히므로 두 번째 스택에서 꺼내면 먼저 들어온 것이 먼저 나온다.

## Stack 클래스 대신 ArrayDeque

자바에 `Stack` 클래스가 있지만 권장되지 않는다. `Vector`를 상속해 모든 메서드가 동기화되어 있어서, 스레드가 하나뿐일 때도 그 비용을 낸다.

`Vector`와 `ArrayList`의 관계가 그대로 `Stack`과 `ArrayDeque`에 겹친다. `Vector`는 동기화한 메서드로 구성되어 멀티스레드에서 안전하지만 단일스레드에서는 오버헤드로 느려지고, 용량이 모자라면 2배로 늘린다. `ArrayList`는 동기화하지 않아 빠르고 1.5배씩 늘린다. 멀티스레드가 필요하면 `Collections.synchronizedList`로 감싼다.

그래서 자바에서 스택이나 큐가 필요하면 대개 `ArrayDeque`가 정답이다. 다만 `Collections.synchronizedDeque` 같은 것은 없어서, 동기화가 필요하면 감싸는 클래스를 직접 만들어야 한다.

```java
class SyncStack<E> {
    private final Deque<E> stack = new ArrayDeque<>();

    public synchronized void push(E e) {
        stack.push(e);
    }
}
```

## 관련

- [[큐와 덱]]
- [[DFS]]
- [[콜 스택]]

## 출처

- [[brain/lectures/algo/barkingdog/0x05|바킹독 실전 알고리즘 0x05강 - 스택]]
- [[brain/notes/CodeTree/dataStructure|코드트리 자료구조 - Stack, Vector와 Stack 권장하지 않는 이유]]
- [[brain/notes/CS/DS/stack|CS 노트 - 스택]]
