---
title: try-with-resources
aliases:
  - AutoCloseable
  - 자원 반납
tags:
  - language
  - java
origin:
  verified: 2026-08-30
---

자원을 자동으로 반납해주는 문법이다. `try` 옆 괄호 안에서 자원을 만들면 블록이 끝날 때 알아서 닫힌다.

```java
try (FileInputStream is = new FileInputStream("file.txt");
     BufferedInputStream bis = new BufferedInputStream(is)) {
    int data;
    while ((data = bis.read()) != -1) {
        System.out.print((char) data);
    }
}   // 자동으로 close()
```

## finally로 닫을 때의 문제

`try-catch-finally`로 자원을 반납하면 여러 문제가 따라온다. `finally`에서 `null` 검사까지 해야 해서 코드가 복잡해지고, 실수로 반납을 빠뜨리기도 한다. `finally`에서 닫는 코드 자체가 예외를 던져 반납하지 못하는 경우도 있다.

```java
} finally {
    if (is != null) is.close();
    if (bis != null) bis.close();
}
```

디버깅이 어려워지는 것도 문제다. `try`에서 난 예외가 `finally`에서 난 예외에 덮여 사라지면 진짜 원인을 잃는다. `try-with-resources`를 쓰면 이런 상황이 생기지 않고 모든 에러의 스택 트레이스가 남는다.

## AutoCloseable

`AutoCloseable` 인터페이스를 구현한 자원에서만 동작한다.

```java
public interface Closeable extends AutoCloseable {
    public void close() throws IOException;
}

public interface AutoCloseable {
    void close() throws Exception;
}
```

## 나중에 끼워 넣은 부모 인터페이스

재미있는 점이 있다. 이 인터페이스는 자바 7 이전부터 있던 `Closeable`의 부모로 뒤늦게 추가되었다. 기존 `Closeable` 구현체들이 그대로 `AutoCloseable`이 되어 하위 호환을 100% 달성했다. 굳어 있던 타입 체계에 인터페이스를 나중에 끼워 넣은 사례다.

## 관련

- [[exception-strategy|예외 처리 전략]]
- [[I/O 스트림]]
- [[interface|인터페이스]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week02|면접 스터디 2주차 - try-with-resources]]
