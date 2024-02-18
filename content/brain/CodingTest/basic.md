---
title: "기초개념"
date: "2024-02-18 17:20"
enableToc: true
tags: [""]
---

코딩테스트를 진행함에 있어서, 잊어버리기 쉬운 기본 내용 정리

<hr>

## 입출력

### Scanner

Scanner가 느리기는 하지만, 시간 절약상 좋긴 함


```java
import java.util.Scanner

public class Main {
	public static void main(String[] args) {
		Scanner sc = new Scanner(System.in);
		
		int n = sc.nextInt();
		double d = sc.nextDouble();
		String s = sc.next();
		char c = sc.next().charAt(0);
	}
}
```

- 공백, 줄바꿈 (`\n`)을 단위로 끊어짐
- `sc.nextInt()` : 정수
- `sc.nextDouble()` : 실수
- `sc.next()` : 한 줄 전체 문자열
- `sc.next().charAt(0)` : 한 줄 전체 문자열에서 첫 번째 문자
- `sc.useDelimiter(특정문자)` : 구분자로 잘라서 받기

<br>

### BufferedReader

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


