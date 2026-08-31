---
title: "04.제어문"
date: "2023-02-16 03:04"
enableToc: true
tags: ["📚 Do it! 자바"]
---
<br>

> 해당 게시글은 **Do it! 자바 프로그래밍 입문** 교재를 정리한 내용입니다.

<hr>

# Chapter 04 - 자바의 제어문

<br>

## Java 조건문

### Java if문

<br>

```java
if (조건식1) {
	수행문1;
}

else if (조건식2) {
	수행문2;
}

else {
	수행문3;
}
```

<br>

- if문 내부 수행하는 문장이 1개면 중괄호`{}` 없어도 됨. 하지만, 코드 가독성이 좋게 하려면 쓰는 것을 추천

```java
if (조건식1) 수행문1;
```

<br>

### Java switch-case문

- break의 역할은 switch문 밖으로

- break 안쓰면 해당하는 case부터 아래로 쭈욱 실행


```java
switch(조건) {
	case 값1 : 수행문1;
		break;
	  
	case 값2 : 수행문2;
		break;
	  
	case 값3 : 수행문3;
		break;
	  
	default : 수행문4;
	// 주어진 값이 case에 해당하지 않을 시 default 실행
}
```

<br>

- case문 동시 사용

- 1, 3, 5, 7, 8, 10, 12월은 31일 까지

- 4, 6, 9, 11월은 30일 까지

- 2월은 28일 까지

```java
case 1 : case 3 : case 5 : case 7 : case 8 : case 10 : case 12 : day = 31;
	break;

case 4 : case 6 : case 9 : case 11 : day = 30;
	break;
	
case 2 : day = 28;
	break;
```

<br>

- 자바7부터 case 값에 정수 말고 문자열도 사용 가능

- 이전에는 원래 `equals()` 메서드를 이용해서 비교했어야함

```java
if (medal.equals("Gold")) {
	...
}
```

<br>

```java
package chapter04;
  
public class pr04_SwitchCase2 {
	public static void main(String[] args) {
		String medal = "Gold";
		  
		switch(medal) {
			case "Gold":
				System.out.println("금메달입니다.");
				break;
			case "Silver":
				System.out.println("은메달입니다.");
				break;
			case "Bronze":
				System.out.println("동메달입니다.");
				break;
			default:
				System.out.println("메달이 없습니다.");
				break;
		}
	}
}
```

<hr>

## Java 반복문

### while문

<br>

```java
while(조건식) {
	수행문1;
	// 조건식 참이면 수행
}
  
// 무한루프
while(true) {
	수행문2;
}
```

<br>

```java
package chapter04;
  
public class pr05_WhileExample1 {
	public static void main(String[] args) {
		int num = 1;
		int sum = 0;
		  
		while (num <= 10) {
			sum += num;
			num++;
		}
		System.out.println("1부터 10까지의 합 = " + sum);
	}
}
```

<br>

### do-while문

<br>

```java
// 수행문1을 일단 1번 실행, 그 이후 while 조건식 참이면 실행

do {
	수행문1;
	...
} while (조건식);
```

<br>

```java
package chapter04;

public class pr06_DoWhileExample {
	public static void main(String[] args) {
		int num = 1;
		int sum = 0;
  
		do {
			sum += num;
			num++;
		} while(num <= 10);
		System.out.println("1부터 10까지의 합 = " + sum);
	}
}
```

<br>

### for문

<br>

```java
for (int i = 0; i <= 10; i++) {
	수행문~
}
```
  
<br>

### for문 요소 생략하기

<br>

**초기화식 생략**

- 이미 변수 초기화 해서 중복으로 초기화할 필요 없을 때

```java
int i = 0;  

for ( ; i < 5; i++) {
	...
}
```

<br>

**조건식 생략**

- 어떤 연산 결과 값이 나왔을 때 바로 for문 수행 멈추고 싶을 때

- 조건식 생략하고 if문과 break 활용


```java
for (i = 0; ; i++) {
	sum += i;
	if (sum > 200) break;
}
```

<br>

**증감식 생략**

- 증감식 연산이 복잡하거나 다른 변수의 연산 결과 값에 좌우될 때

```java
for ( i = 0; i < 5; ) {
	...
	i = (++i) % 10;
}
```

<br>

**요소 모두 생략**

- 무한 루프

```java
for ( ; ; ) {
	// 무한루프
}
```

**구현 예시**

```java
package chapter04;
  
public class pr07_forExample {
	public static void main(String[] args) {
		// 초기화식 생략
		int i = 0;
		for ( ; i < 5; i++) {
			System.out.println("초기화식 생략 예제 " + "반복횟수 = " + i);
		}
	  
		// 조건식 생략
		int j;
		int sum = 0;
		for ( j = 0; ; j++ ) {
			sum += j;
			System.out.println("조건식 생략 예제 더하는 중, 반복횟수 = " + j);
			if (sum > 200) break;
		}
		System.out.println("조건식 생략 예제 끝난 후 합 = " + sum);
	  
		// 증감식 생략
		for (int k = 0; k < 5; ) {
			k = (++k) % 10;
			System.out.println(k);
		}
	  
		// 요소 모두 생략
		// for ( ; ; ) {
		// 무한루프 입니다.
		// }
	}
}
```

<br>

### continue문

- continue문은 반복문과 함께 씀

- 반복문 안에서 continue문 만나면 **이후 문장 수행 X**

- 그 이후 for문 처음으로 돌아가서 **증감식 수행**

- 사용 용도 : 반복문 수행 중 특정 조건에서는 수행하지 않고 건너뛰고 싶을 때

```java
package chapter04;
  
public class pr09_ContinueExample {
	public static void main(String[] args) {
		int sum = 0;
		for (int i = 1; i <= 100; i++) {
			if ( i % 2 == 0 ) continue;
			sum += i;
		}
		System.out.println("1부터 100까지 홀수의 합은 = " + sum);
	}
}
```

<br>

### break문

실제로 어디에 사용하냐를 보이겠음. 0부터 시작해서 숫자를 1씩 늘리면서 합을 계산할 때 숫자를 몇까지 더하면 100이 넘는지 알고 싶다고 하자.

```java
package chapter04;
  
public class pr10_BreakExample1 {
	public static void main(String[] args) {
		int sum = 0;
		int num = 0;
		  
		for (num = 0; sum < 100; num++) {
			sum += num;
		}
		
		System.out.println("num : " + num);
		System.out.println("sum : " + sum);
	}
}
  
// num : 15
// sum : 105
```

num이 아닌 sum의 조건에 따라 코드가 진행되다 보니, num이 증감된 상태에서 sum의 조건을 만나 올바르지 않은 답이 나오는 것을 볼 수 있음.

```java
package chapter04;

public class pr11_BreakExample2 {
	public static void main(String[] args) {
		int sum = 0;
		int num = 0;
		
		for (num = 0; ; num++) {
			sum += num;
			if (sum >= 100)
				break;
		}
		System.out.println("num : " + num);
		System.out.println("sum : " + sum);
	}
}

// num : 14
// sum : 105
``` 

<a href='/brain/books/do-it-java/chap04/#for문-요소-생략하기'>조건식 생략</a>의 스킬을 이용하였고 for문 내부에 조건을 걸어줌으로써 break 시켜서 반복문을 아예 빠져나가게 했음

<br>

- break 문의 위치

```java
while(조건식1) {
	while(조건식2) {
		if (조건식) // 조건에 해당하는 경우
			break; // 내부 반복문만 빠져나옴
	}
}
```

중첩 반복문을 사용하는 경우 break를 사용하면 해당 반복문만 빠져나온다. 즉, 내부 반복문만 빠져나오고 외부 반복문은 계속 수행한다.

<br>

### break, continue 차이

- break문은 break; 를 적어준 곳에서 해당 조건문 블록과 그 밖의 반복문 자체를 탈출한다.

- continue문은 해당 조건문 블록을 탈출하여 아래 명령문은 실행하지 않고, 다음 반복문 실행절차를 수행한다.

<br>

### 연습문제 2번


```java
package chapter04;

public class ex02_Q2 {
	public static void main(String[] args) {
		int dan, times;
		
		// 내가 짠 코드
//		for (dan = 1; dan <= 9; dan++) {
//			for (times = 1; times <= 9; times++) {
//				if (dan % 2 == 0) {
//					System.out.println(dan + " X " + times + " = " + (dan * times));
//				}
//			}
//			System.out.println();
//		}
		  
		// 정답 코드
		for (dan = 1; dan <= 9; dan++) {
			if (dan % 2 != 0) continue;
			for (times = 1; times <= 9; times++) {
				System.out.println(dan + " X " + times + " = " + (dan * times));
			}
			System.out.println();
		}
	}
}
```

내가 짠 코드는 결국 두번째 for문까지 와서 일단 다 돌려야 한다. <br><br>

하지만 정답 코드는 continue문을 이용해서 홀수면 밑에 for문을 수행하지 않고 바로 다음 반복문으로 넘어가도록 설계했기 때문에 더 좋은 코드이다.

<br>

### 연습문제 3번

<br>

```java
package chapter04;

public class ex03_Q3 {
	public static void main(String[] args) {
		int dan, times;

        // 내가 짠 코드
//		for (dan = 1; dan <= 9; dan++) {
//			for (times = 1; times <= dan; times++) {
//				System.out.println(dan + " X " + times + " = " + (dan * times));
//			}
//			System.out.println();
//		}
		
		// 정답 코드
		for (dan = 1; dan <= 9; dan++) {
			for (times = 1; times <= 9; times++) {
				if (dan < times) break;
					System.out.println(dan + " X " + times + " = " + (dan * times));
			}
		System.out.println();
		}
	}
}
```

이건 내가 짠 코드대로 짤 것 같은데 정답코드처럼 break 문을 이용할 수도 있다. 이건 내가 적은 방법이 더 좋은듯 <br><br>


연습문제 4번, 5번은 백준 별찍기 5번, 7번이니까 그거 참조