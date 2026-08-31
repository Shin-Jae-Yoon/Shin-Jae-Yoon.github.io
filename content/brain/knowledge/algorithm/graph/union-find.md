---
title: 유니온 파인드
aliases:
  - 유니온 파인드
  - 분리 집합
  - Disjoint Set
  - 경로 압축
tags:
  - algorithm
  - java
origin:
  verified: 2026-08-30
---

두 원소가 같은 그룹에 속하는지 확인하고, 두 그룹을 합치는 자료구조. 배열 하나로 구현되고, 그래프에서 사이클이 생기는지 판단하는 표준적인 방법이라 [[minimum-spanning-tree|크루스칼]]과 짝을 이룬다.

## find와 union

`uf[x]`에 x의 부모를 적는다. 처음에는 모두가 자기 자신을 가리키게 초기화한다. `uf[x] == x`라는 것은 x가 그 그룹의 루트라는 뜻이다.

```java
for (int i = 1; i <= n; i++) uf[i] = i;   // 처음엔 전부 따로
```

find는 x가 속한 그룹의 대표를 찾는다. 자기 자신이 부모일 때까지 부모를 따라 올라간다.

```java
int find(int x) {
    if (uf[x] == x) return x;
    return find(uf[x]);
}
```

union은 두 원소를 같은 그룹으로 합친다. 원소끼리 이어붙이는 게 아니라 각자의 루트를 찾아 한쪽을 다른 쪽에 붙인다. 루트가 아닌 노드에 붙이면 그룹이 갈라지므로 순서가 중요하다.

```java
void union(int a, int b) {
    a = find(a);
    b = find(b);
    uf[a] = b;
}
```

## 쓰이는 곳

쓸 곳은 셋이다. 사이클 판정은 간선을 넣기 전에 양 끝의 `find`가 같은지 본다. 같으면 이미 연결되어 있으니 넣으면 사이클이다. [[minimum-spanning-tree|크루스칼]]이 이 판정을 그대로 쓴다. 연결 요소의 개수는 전부 union한 뒤 루트가 몇 종류인지 세면 나온다.

## 한 줄로 길어지는 트리와 경로 압축

그냥 두면 트리가 한 줄로 길어져서 find가 O(N)이 된다. 모든 원소가 한 그룹이 되면 사실상 [[linked-list|연결 리스트]]다.

해결은 간단하다. find로 루트를 찾아 올라간 김에, 지나온 노드들의 부모를 루트로 바꿔버린다.

```java
int find(int x) {
    if (uf[x] == x) return x;
    return uf[x] = find(uf[x]);   // 돌아 나오면서 부모를 루트로 갱신
}
```

한 줄 추가로 지나온 노드들의 깊이가 전부 1이 되고, 다음에 같은 노드를 찾으면 거의 즉시 끝난다. 이걸 경로 압축이라고 하고, 복잡도가 O(log N) 수준으로 내려간다.

## 관련

- [[minimum-spanning-tree|최소 신장 트리]]
- [[brain/knowledge/algorithm/data-structure/graph|그래프]]
- [[tree|트리]]

## 출처

- [[brain/notes/CodeTree/graph|코드트리 그래프 탐색 - Union-Find]]
