---
title: "정렬"
date: "2024-12-17 23:40"
enableToc: true
tags: [""]
weight: 5
---

<hr>

## 정렬 관련

- `import java.util.Arrays;`
	- `Arrays.sort(arr)` : 배열 오름차순정렬
	- `Arrays.sort(arr, 시작 index, 끝 index + 1)` : 배열 구간 오름차순 정렬
	- 문자열 정렬할 때는 `char[]`로 바꿔서 해야함
		- `char[] arr = str.toCharArray()`
		- `Arrays.sort(arr)`
		- `String str = new String(arr)`

<br>

- `import java.util.Collections;`
	- **Java에서는 int (primitive tytpe)으로 구성된 배열을 한번에 내림차순 정렬할 수 있는 방법이 없음** → Integer로 선언되어 있어있으면 Collections 활용해서 가능
	- `Arrays.sort(arr, Collections.reverseOrder());` : 내림차순 정렬

<br>

- Stream 써서 int (기본형) → Integer (참조형) 타입 변환
	- `Arrays.stream(arr).boxed().toArray(Integer[]::new);`

- `Arrays.sort()` vs `Collections.sort()`
	- `Arrays.sort()`는 배열을 정렬
		- Dual-Pivot Quick Sort
		- 시간 복잡도 
			- 평균 : $O(N log N)$ 
			- 최악 : **$O(N^2)$**
	- `Collections.sort()`는 객체를 정렬
		- Tim Sort (insert & merge, 삽입 & 합병)
		- 시간 복잡도
			- 평균, 최악 : **$O(N log N)$** 
		- `Collections.reverse() : List 내림차순`
		- `Collections.reverseOrder() : String, Integer, Double 같은 내림차순`
		- `Arrays.sort(arr, Collections.reverseOrder()) : 내림차순`
	- <a href='https://stonage.tistory.com/230' target='_blank'>Collections.sort vs Arrays.sort 차이</a>
	- <a href='https://velog.io/@minizero0/Arrays.sort%EC%99%80-Collections.sort' target='_blank'>Arrays.sort()와 Collections.sort()</a>

<br>

## 객체 정렬

<br>

- Comparable과 Comparator의 차이 (<a href='https://st-lab.tistory.com/243' target='_blank'>링크 참고</a>)
	- 둘 다 인터페이스
	- 인터페이스니까 구현해줘야 함

<br>

- Comparable 인터페이스
	- `compareTo(T o1)`
	- ==자기 자신과 매개변수 객체를 비교==
	- java.lang에 있어서 import 할 필요 X

<br>

- Comparator 인터페이스
	- `compare(T o1, T o2)`
	- ==두 매개변수 객체를 비교==
	- java.util.Comparator로 import 필요 O

<br>

1. `Comparable<class> + @Override compareTo() 조합`

```java
class Student implements Comparable<Student> {
	int test;

	// 오름차순
	@Override
	public int compareTo(Student student) {
		return this.test - studnet.test;
	}
	
	// 내림차순
	@Override
	public int compareTo(Student student) {
		return studnet.test - this.test;
	}
}
```

<br>

2. 람다
	- 결국 메서드 하나인 인터페이스니까 람다로 가능

```java
// 오름차순
Arrays.sort(students, (a, b) -> a.test - b.test);

// 내림차순
Arrays.sort(students, (a, b) -> b.test - a.test);
```

<br>

3. 2번에 걸쳐 다른 기준으로 정렬
	- `Arrays.sort`로 정렬하는 순간에 `Comparator` 이용하여 `compare()`
	- `compare()`는 `compareTo()`와는 다르게 인자를 2개 받아서 기준을 설정해줘야 함

```java
Arrays.sort(students, new Comparator<Student>() {
	@Override
	public int compare(Student a, Student b) {
		return a.height - b.height;
	}
})
```

