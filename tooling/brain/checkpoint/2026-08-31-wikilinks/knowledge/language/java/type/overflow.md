---
title: 오버플로우
aliases:
  - 오버플로우
  - Overflow
  - Integer.MAX_VALUE
tags:
  - language
  - java
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

계산 결과가 그 타입의 최댓값을 넘거나 최솟값보다 작아질 때 양수가 음수로, 음수가 양수로 뒤집히는 것.

```java
int value = 10;
int maxInt = Integer.MAX_VALUE;

System.out.println(value + 1);    // 11
System.out.println(maxInt + 1);   // -2147483648
```

오류는 나지 않는다. 조용히 틀린 값이 되어버리는 쪽이 더 성가시다.

## 부호 비트가 뒤집히는 자리

정수를 비트로 늘어놓으면 맨 왼쪽 자리가 부호 비트다. 0이면 양수, 1이면 음수로 읽는다.

1바이트로 좁혀 보면 최댓값이 `01111111`, 10진수로 127이다. 여기에 1을 더하면 `10000000`이 되면서 부호 비트가 1로 바뀌고 값은 -128이 된다. 숫자가 한 바퀴 돌아 반대편 끝으로 넘어간 셈이다.

## 타입을 키우는 대응

타입을 키우는 것이 가장 단순한 대응이다. `int` 대신 `long`을 쓰면 대개 해결된다. 값이 끝까지 정확해야 하는 자리라면 `BigDecimal`로 간다. 계산기 과제에서 `Integer`로는 계산 결과가 21억까지밖에 나오지 않으니 예외 처리를 할지 더 큰 수를 다룰지 고민하다 `BigDecimal`을 고른 것이 그런 자리였다. [[부동소수점]]

## 참고

원본은 오버플로우가 무엇인지까지만 적었다. 큰 수를 곱할 때 가장 흔히 걸리는데, 받는 변수를 `long`으로 잡아도 소용이 없다. 연산의 타입은 대입되는 변수와 무관하게 정해지기 때문이다. 명세는 곱셈 연산자에 대해 "피연산자에 이항 수치 승격이 수행된다", "곱셈 식의 타입은 피연산자의 승격된 타입"이라고 적는다. `int` 둘이면 승격 결과도 `int`다. 그리고 "정수 곱셈이 넘치면 결과는 충분히 큰 2의 보수 형식으로 표현한 수학적 곱의 하위 비트"가 되어 부호까지 뒤집힐 수 있다. 한쪽을 `(long)`으로 캐스팅해야 연산 자체가 8바이트에서 일어난다([[형 변환]]). [JLS SE 21 §15.17](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.17)

연산 순서를 바꿔 중간값을 작게 만드는 요령도 원본에 없다. 이분 탐색의 `(left + right) / 2`가 대표적이다. 조슈아 블로크는 2006년에 이 줄이 "`low`와 `high`의 합이 `int` 최댓값보다 크면 실패한다. 합이 음수로 넘치고, 2로 나눠도 음수인 채로 남는다"고 적고 `int mid = low + ((high - low) / 2);`를 고침으로 내놓았다. [[유클리드 호제법|최소공배수]]를 `a * b / gcd` 대신 `a / gcd * b`로 구하는 것도 같은 요령이다. [Nearly All Binary Searches and Mergesorts are Broken](https://research.google/blog/extra-extra-read-all-about-it-nearly-all-binary-searches-and-mergesorts-are-broken/)

원본이 고른 것은 `BigDecimal`이다. 정수 쪽에는 `BigInteger`가 있고 javadoc은 이를 "불변의 임의 정밀도 정수"라고 소개한다. 다만 크기 제한이 아예 없지는 않다. "-2^Integer.MAX_VALUE(미포함)부터 +2^Integer.MAX_VALUE(미포함)까지의 값을 지원해야 하며 그 밖의 값을 지원할 수도 있다"고 적혀 있고, 참조 구현은 그 범위를 벗어나면 `ArithmeticException`을 던진다. [BigInteger javadoc](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigInteger.html)

## 관련

- [[기본형과 참조형]]
- [[부동소수점]]
- [[형 변환]]

## 출처

- [[brain/lectures/pl/fun-java/fun-java02|재미있는 자바 2강 - 오버플로우]]
- [[brain/notes/DevCourse/005|데브코스 회고 5편 - BigDecimal]]
