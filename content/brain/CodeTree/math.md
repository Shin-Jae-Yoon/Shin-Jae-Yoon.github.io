---
title: "수학"
date: "2024-03-03 04:49"
enableToc: true
tags: [""]
weight: 3
---

<hr>

## 유클리드 호제법

- 최대공약수 (GCD, Greateast Common Division)
- 최소공배수 (LCM, Least Common Multiple)
	- ![](brain/image/PS-22.png)
	- 두 수 A, B와 최대공약수 G, 최소공배수 L이라고 하면 **`AB = LG`** 식이 성립

- ==유클리드 호제법== : 최대공약수 GCD 찾는 방법
	- A를 B로 나눈 몫을 Q라 하고, 나머지를 R이라고 하면 `GCD(A, B) = GCD(B, R)`
	- 자연수 A, B가 있을 때 A를 B로 나눈 나머지를 N이라고 하면 (`a % b == n`) N이 0일 때 B가 바로 최대공약수 GCD 임을 이용하는 원리
		- N이 0이 아니라면, a에 b값을 넣고 다시 n을 b에 대입하여 재귀
		- 기본적으로 a가 b보다 크다는 전제 !!!

<br>

- 프로그래머스에서 풀었던 재귀
- <a href='https://ko.wikipedia.org/wiki/%EC%9C%A0%ED%81%B4%EB%A6%AC%EB%93%9C_%ED%98%B8%EC%A0%9C%EB%B2%95' target='_blank'>유클리드 호제법 위키피디아</a>에서도 이와 같이 품

```java
    int GCD(int a, int b) {
         if (b == 0)
             return a;
         else
             return GCD(b, a % b);
```

- 코드트리 단순 반복

```java
    int GCD(int a, int b) {
        while (b != 0) {
            int temp = a % b;
            a = b;
            b = temp;
        }
        
        return a;
    }
```

- 완전 쉬운 반복
	- 최소공배수는 `LCM = (n * m) / GCD`

```java
private static int gcd(int n, int m) {
	int max = 1;

	for (int i = 2; i <= Math.min(n, m); i++) {
		if (n % i == 0 && m % i == 0) {
			max = i;
		}
	}

	return max;
}
```



<br>

<hr>

## 콜라스 추측

모든 자연수에 대하여, 짝수는 나누기 2, 홀수는 곱하기 3 + 1을 유한번 재귀하면 결국 최종적으로 1로 간다는 것. 아직까지 반례를 찾지 못했음

![](brain/image/math-1.png)

- <a href='https://namu.wiki/w/%EC%BD%9C%EB%9D%BC%EC%B8%A0%20%EC%B6%94%EC%B8%A1' target='_blank'>위키피디아 - 콜라스 추측</a>
- 3n + 1 수열이라는 키워드도 봤음

<br>

<hr>

## 피보나치 수열

첫 번째 원소 1, 두 번째 원소 1, 세 번째 원소 부터는 바로 직전 두 원소의 합인 수열

![](brain/image/math-2.png)

<br>

<hr>

## 순열 조합

![](brain/image/math-3.png)


```java
// Permutation / r!

// i개 중에서 순서 있게 2개 뽑기 (순열)
// i * (i - 1)

// i개 중에서 순서 있게 3개 뽑기
// i * (i - 1) * (i - 2)

// 배열하는 경우의 수 r!

// i개 중에서 순서 없이 2개 뽑기 (조합)
// i * (i - 1) / 2
```