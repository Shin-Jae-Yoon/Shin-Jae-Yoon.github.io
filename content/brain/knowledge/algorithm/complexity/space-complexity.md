---
title: 공간복잡도
aliases:
  - 공간복잡도
  - 메모리 제한
tags:
  - algorithm
origin:
  verified: 2026-08-30
  scouted: 2026-08-30
---

입력 크기와 필요한 메모리의 관계. 코딩테스트에서 시간 제한과 나란히 붙는 메모리 제한이 이것을 본다. 시간복잡도만큼 자주 문제가 되지는 않지만, 걸리면 시간과 달리 최적화로 빠져나갈 여지가 거의 없다. 배열을 잡을지 말지가 곧 결론이라서 그렇다.

## 메모리 제한을 원소 개수로 환산하기

`int` 하나가 4바이트다. 제한이 512MB라면 512MB를 4바이트로 나눠 약 1억 2천만 개의 int를 담을 수 있다. 이 숫자 하나만 기억해두면 나머지는 나눗셈이다.

`int[2천만]`이 80MB이고 열 배 줄인 `int[2백만]`은 8MB다. `char`는 2바이트라 `char[2천만]`이 40MB, `double`은 8바이트라 `double[2천만]`이 160MB다.

## 시간과 맞바꾸는 관계

공간복잡도는 대개 시간복잡도와 맞바꾸는 관계다. 메모리를 더 써서 시간을 줄이는 것이 [[counting-array|카운트 배열]]이나 [[dynamic-programming|동적 계획법]]이고, 반대로 [[in-place-sort|제자리 정렬]]은 추가 메모리를 안 쓰는 대신 원본을 훼손한다.

둘 중 무엇이 급한지는 문제가 정해준다. 제한을 먼저 읽고 시작하는 습관이 중요한 이유다.

## 2차원 배열과 재귀 깊이

2차원 배열에서 가장 자주 막힌다. N이 1만이면 `int[10000][10000]`은 1억 개, 400MB다. N² 크기 배열은 N이 조금만 커져도 못 잡는다. [[floyd-warshall|플로이드-워셜]]이 정점 수가 적을 때만 쓰이는 이유이기도 하다.

값을 인덱스로 쓰는 [[counting-array|카운트 배열]]도 같은 이유로 값의 범위가 작을 때만 성립한다.

재귀 호출이 깊어질 때는 배열이 아니라 [[memory-and-gc|콜 스택]]이 쌓여서 터진다. 이건 메모리 제한이 아니라 스택 오버플로로 나타난다.

## 참고

`char[2천만]`이 40MB인 것은 자바 기준이다. 자바의 `char`는 UTF-16 코드 단위라 2바이트다. 원본은 20MB로 적었는데 그건 `char`가 1바이트인 C 계열 기준이다. [The Java Language Specification, 4.2.1 Integral Types and Values](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.2.1)

## 관련

- [[time-complexity|시간복잡도]]
- [[choosing-by-input-size|N 범위로 알고리즘 고르기]]
- [[in-place-sort|제자리 정렬]]

## 출처

- [[brain/lectures/algo/barkingdog/0x01|바킹독 실전 알고리즘 0x01강]]
- [[brain/notes/CodeTree/basic|코드트리 개요]]
