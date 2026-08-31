---
title: 이분 탐색
aliases:
  - 이분 탐색
  - 이진 탐색
tags:
  - algorithm
  - java
origin:
  verified: 2026-08-30
  scouted: 2026-08-30
---

정렬된 데이터에서 가운데 값과 비교해, 찾는 값이 있을 수 없는 절반을 통째로 버리는 것을 반복한다. 매번 후보가 반으로 줄어드니 O(log N)이다. [[divide-and-conquer|분할 정복]]을 쓰는 가장 간단한 예이기도 하다.

## 절반씩 버리는 반복

크기 N이 매번 절반이 되어 1이 될 때까지 k번 걸린다고 하면 `N × (1/2)ᵏ = 1`, 곧 `2ᵏ = N`이고 `k = log₂N`이다. N이 1000만이어도 24번이면 끝난다. [[time-complexity|시간복잡도]]에서 로그가 사실상 상수 취급을 받는 이유다.

```java
while (left <= right) {
    int mid = left + (right - left) / 2;
    if (arr[mid] == target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
}
```

경계를 옮길 때 mid를 포함하지 않는다. 왼쪽은 `mid + 1`로, 오른쪽은 `mid - 1`로 옮긴다. 이미 mid는 확인해서 답이 아니라는 걸 알았으니 남은 범위에서 명확히 빼야 한다. 그냥 `mid`로 두면 범위가 줄지 않아 무한 루프에 빠진다.

## 답을 이분 탐색하기

값이 아니라 답을 이분 탐색하는 쓰임도 있다. "조건을 만족하는 최솟값을 구하라" 같은 문제에서 답의 범위를 놓고 탐색하는 것이다. 어떤 값 x가 조건을 만족하면 x보다 큰 값도 전부 만족하는 단조성이 있을 때 쓸 수 있고, [[choosing-by-input-size|N이 개수가 아니라 값의 범위로 주어질 때]] 떠올려야 하는 접근이다.

자바에는 `Arrays.binarySearch()`와 `Collections.binarySearch()`가 있다. 찾으면 인덱스를, 없으면 음수를 돌려준다.

## 정렬 비용과 전제

정렬이 안 되어 있으면 정렬부터 해야 하니 O(N log N + log N), 지배하는 항만 남기면 O(N log N)이다. 한 번만 찾을 거라면 그냥 처음부터 훑는 O(N)이 낫고, 여러 번 찾을 때 비로소 정렬 비용을 회수한다.

정렬되어 있어야 한다는 전제를 지키지 않으면 자바의 `binarySearch`도 예외를 던지지 않고 조용히 틀린 답을 준다.

## 참고

원본 코드는 가운데를 `(left + right) / 2`로 구한다. `left`와 `right`가 둘 다 클 때 합이 `int` 범위를 넘어 음수가 되고, 그러면 `arr[mid]`에서 예외가 난다. `left + (right - left) / 2`로 쓰면 합을 만들지 않는다. 같은 함정을 자바 표준 라이브러리도 9년 동안 갖고 있었다. [Google Research - Extra, Extra, Read All About It: Nearly All Binary Searches and Mergesorts are Broken](https://research.google/blog/extra-extra-read-all-about-it-nearly-all-binary-searches-and-mergesorts-are-broken/)

## 관련

- [[binary-search-tree|이진 탐색 트리]]
- [[divide-and-conquer|분할 정복]]
- [[overflow|오버플로우]]
- [[time-complexity|시간복잡도]]

## 출처

- [[brain/notes/CS/Algo/principle/binarySearch|CS 노트 - 이진탐색]]
- [[brain/notes/CodeTree/binarySearch|코드트리 이분 탐색]]
