---
title: 제자리 정렬
aliases:
  - 제자리 정렬
  - 내부 정렬
  - 외부 정렬
tags:
  - algorithm
origin:
  verified: 2026-08-30
---

정렬을 메모리 관점에서 나눈 분류. 제자리 정렬은 원본 배열 말고 쓰는 공간이 원소 개수에 비해 무시할 만한 정렬이다. 약간의 임시 변수 정도는 허용한다.

## 제자리인 것과 아닌 것

[[insertion-sort|삽입 정렬]], [[selection-sort|선택 정렬]], [[bubble-sort|버블 정렬]], [[heap-sort|힙 정렬]], [[quick-sort|퀵 정렬]]이 제자리 정렬이고 [[merge-sort|합병 정렬]]만 아니다. 합병 정렬이 예외인 이유는 두 조각을 합칠 때 결과를 담을 임시 배열이 필요하기 때문이다. 그 크기가 원소 개수에 비례하니 O(n)이라 무시할 수 없다.

[[quick-sort|퀵 정렬]]은 교환만 하므로 배열 자체는 제자리인데, 재귀 호출 때문에 [[memory-and-gc|콜 스택]]을 O(log n)만큼 쓴다. 보통은 이 정도를 제자리로 친다.

## 내부 정렬과 외부 정렬

데이터가 메모리에 다 들어가느냐로 나눈 분류도 있다. 내부 정렬은 정렬할 데이터 전부를 메모리에 올려놓고 정렬한다. 빠르지만 데이터가 크면 쓸 수 없다. 외부 정렬은 데이터가 너무 커서 다 못 올릴 때 들어가는 만큼씩 쪼개 각각 내부 정렬한 뒤 정렬된 조각들을 합친다. 느리지만 그 크기에서 동작하는 유일한 방법이다.

외부 정렬의 쪼개서 처리하고 합친다는 발상은 [[merge-sort|합병 정렬]]의 합치는 단계와 같고, 데이터를 감당 가능한 덩어리로 잘라 처리한다는 점에서 [[spring-batch|스프링 배치]]의 청크와도 닿아 있다.

## 합병과 퀵을 고르는 기준

두 고급 정렬을 고르는 기준이 여기서 나온다. 합병 정렬은 최악에도 O(n log n)을 보장하지만 메모리를 더 쓰고, 퀵 정렬은 메모리를 덜 쓰지만 최악이 O(n²)이다. 메모리가 아쉬우면 퀵, 최악이 무서우면 합병이다.

## 관련

- [[stable-sort|안정 정렬]]
- [[comparison-sort|정렬 분류]]
- [[space-complexity|공간복잡도]]

## 출처

- [[brain/notes/CS/Algo/sort/comparison/quickSort|CS 노트 - 퀵 정렬의 공간복잡도]]
- [[brain/notes/CS/Algo/sort/etcsort/inplaceSort|CS 노트 - 제자리 정렬]]
- [[brain/notes/CS/Algo/sort/etcsort/internalSort|CS 노트 - 내부정렬]]
- [[brain/notes/CS/Algo/sort/etcsort/externalSort|CS 노트 - 외부정렬]]
