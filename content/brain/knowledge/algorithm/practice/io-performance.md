---
title: 입출력 성능
aliases:
  - 입출력 성능
  - Scanner
tags:
  - algorithm
  - java
origin:
  verified: 2026-08-30
---

코딩테스트에서 알고리즘이 맞아도 입출력 때문에 시간 초과가 나는 경우가 있다. 자바의 `Scanner`와 `System.out.println`이 느리기 때문이다. 데이터가 100만 개를 넘어가기 시작하면 이 차이가 당락을 가른다.

## Scanner와 println이 느린 이유

`System.out.println`은 호출할 때마다 실제로 출력 장치에 내보낸다. 백만 번 부르면 백만 번 나간다. 버퍼를 쓰는 쪽은 메모리에 모아뒀다가 한꺼번에 내보내므로 실제 출력 횟수가 확 줄어든다.

`Scanner`가 느린 것도 비슷한 이유에 더해 정규식으로 입력을 파싱하기 때문이다. `BufferedReader`는 한 줄을 통째로 읽어오고 자르는 건 직접 한다.

백준에서 100만 줄을 처리한 기록을 보면 차이가 분명하다. 입력은 `BufferedReader`에 `Integer.parseInt`를 붙였을 때 0.66초, `Scanner`가 4.84초다. 출력은 더 벌어진다.

```
BufferedWriter + write(i + "\n")             0.96초
StringBuilder로 모아서 한 번에 출력           1.19초
BufferedWriter + write + newLine()           1.26초
PrintWriter                                  1.95초
System.out.println                          30.01초
```

30배 차이다. 알고리즘을 아무리 잘 짜도 이걸로 날아간다.

## 외워두는 입출력 골격

기본 골격을 외워두고 시작한다.

```java
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder sb = new StringBuilder();

        int n = Integer.parseInt(br.readLine());
        StringTokenizer st = new StringTokenizer(br.readLine());

        sb.append(결과).append('\n');
        System.out.print(sb);
    }
}
```

주의할 점이 두 가지다. `BufferedReader`는 검사 예외를 던지므로 `throws IOException`을 붙여야 한다. 그리고 `BufferedWriter`는 스트림에 쓰기만 할 뿐이라 `flush()`나 `close()`를 해야 실제로 나간다. 개행도 `"\n"`을 직접 넣거나 `newLine()`을 불러야 한다.

`StringBuilder`에 모아뒀다가 마지막에 한 번 출력하는 방식이 코드도 간단하고 충분히 빠르다. 새 객체를 만들지 않고 비우고 싶으면 `sb.setLength(0)`을 쓴다.

## 관련

- [[time-complexity|시간복잡도]]
- [[problem-solving-process|문제 해결 과정]]

## 출처

- [[brain/lectures/algo/fastcampus-algo/part1-4/p1-ch03|패스트캠퍼스 알고리즘 Ch03 - 15552번]]
- [[brain/notes/CodeTree/inputoutput|코드트리 입출력]]
