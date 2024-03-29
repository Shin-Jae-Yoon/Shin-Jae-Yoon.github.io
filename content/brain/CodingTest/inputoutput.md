---
title: "입출력"
date: "2024-02-18 17:35"
enableToc: true
tags: [""]
weight: 2
---

<hr>

## Scanner

Scanner가 느리기는 하지만, 시간 절약상 좋긴 함

- 공백, 줄바꿈 (`\n`)을 단위로 끊어짐
- `import java.util.Scanner;`
- `Scanner sc = new Scanner(System.in);`
- `sc.메서드` 방식으로 사용


```java
import java.util.Scanner;

public class Main {
	public static void main(String[] args) {
		Scanner sc = new Scanner(System.in);
	}
}
```

<br>

### 정수, 실수

- `sc.nextInt()` : 정수
- `sc.nextDouble()` : 실수

```java
import java.util.Scanner;

public class Main {
	public static void main(String[] args) {
		Scanner sc = new Scanner(System.in);

		int a = sc.nextInt();
		int b = sc.nextInt();
		double c = sc.nextDouble();

		System.out.printf("%d %d %.2f", a, b, c);
	}
}

// 입력
// 1 2
// 3.4772

// 출력
// 1 2 3.48
```

<br>

### 문자열, 문자

- `sc.next()` : 한 줄 전체 문자열
- `sc.next().charAt(0)` : 한 줄 전체 문자열에서 첫 번째 문자

```java
import java.util.Scanner;

public class Main {
	public static void main(String[] args) {
		Scanner sc = new Scanner(System.in);

		String s = sc.next();
		char c = sc.next().charAt(0);

		System.out.println(s);
		System.out.println(c);
	}
}

// 입력
// hello
// jaeyoon

// 출력
// hello
// j
```

<br>

### 구분자

- `sc.useDelimiter(특정문자)` : 구분자로 잘라서 받기

```java
import java.util.Scanner;

public class Main {
	public static void main(String[] args) {
		Scanner sc = new Scanner(System.in);
		sc.useDelimiter(":");

		int hour = sc.nextInt();
		int minutes = sc.nextInt();

		System.out.println("현재 시각은 " + hour + "시 " + m + "분");
	}
}

// 입력
// 15:47

// 출력
// 현재 시각은 15시 47분
```

<br><hr>

## BufferedReader

백준은 입출력 관련해서 웬만하면 기본으로 깔고 할 것

1. `import java.util.*;`
	- 컬렉션, StringTokenizer 등
2. `import java.io.*;`, main 메서드 뒤에 `throws IOException`
	- 버퍼리더 입출력 때문에
3. `Scanner`느리니까 쓰지말고 `BufferedReader` 사용

```java {title="BaekJoon - 1000"}
import java.io.*;  
import java.util.*;  
  
public class Main {  
    public static void main(String[] args) throws IOException {  
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));  
        StringTokenizer st = new StringTokenizer(br.readLine());  
        System.out.println(Integer.parseInt(st.nextToken()) + Integer.parseInt(st.nextToken()));  
    }  
}
```

<hr>