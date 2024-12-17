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
- 소숫점 출력할 때 printf 말고 `String.format("%.2f", ㅁ);` 형태도 가능

```java
import java.util.Scanner;

public class Main {
	public static void main(String[] args) {
		Scanner sc = new Scanner(System.in);

		int a = sc.nextInt();
		int b = sc.nextInt();
		double c = sc.nextDouble();

		System.out.printf("%d %d %.2f", a, b, c);
		System.out.print(String.format("%d %d %.2f", a, b, c));
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

- `sc.next()` : space나 new line으로 문자열 구분
- `sc.nextLine()` : new line으로만 문자열 구분 (공백 포함하여 길이 계산됨)
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

		System.out.println("현재 시각은 " + hour + "시 " + minutes + "분");
	}
}

// 입력
// 15:47

// 출력
// 현재 시각은 15시 47분
```

<br>

- useDelimiter 안의 값은 ==**정규 표현식**==을 이용
- 따라서, `.`, `$` 등과 같은 특수 기호는 의도했던 바와 다르게 작용
- 예를 들어, 정규표현식에서 `.`은 모든 문자를 의미하기에, 점을 나타내고 싶으면 `\.`이라고 써야한다.
	- 자바에서는 역슬래쉬를 나타내기 위해 `\`를 써야하므로, 최종적으로 `\\.` 라고 작성해야함

```java
import java.util.Scanner;

public class Main {
	public static void main(String[] args) {
		Scanner sc = new Scanner(System.in);
		sc.useDelimiter(".");
	}
}

// 런타임 에러

public class Main {
	public static void main(String[] args) {
		Scanner sc = new Scanner(System.in);
		sc.useDelimiter("\\.");
	}
}

// 정상 작동
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

## StringBuilder

<br>

```java
import java.lang.StringBuilder;

public class Main {
	public static void main(String[] args) {
		StringBuilder sb = new StringBuilder();

		sb.append("hi")
			.append("\n");

		System.out.print(sb.toString());
	}
}
```

- append로 붙여 나가기
- 새로운 StringBuilder 객체 생성 안하고 초기화 하고 싶으면 `sb.setLength(0)`로 문자열 비워주기