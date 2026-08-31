---
title: 스레드 생성
aliases:
  - 스레드 생성
  - Thread 클래스
  - Runnable
  - start()
tags:
  - language
  - java
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

자바에서 [[스레드]]를 만드는 길은 `Thread` 클래스를 상속하는 쪽과 `Runnable` 인터페이스를 구현하는 쪽으로 갈린다. 어느 쪽이든 `run()`을 오버라이딩하고 `start()`로 실행한다.

## Thread 클래스 상속

`Thread`를 상속하면 `run()`을 반드시 오버라이딩해야 한다. 인스턴스를 만든 뒤 `start()`를 부르면 그 안의 코드가 새 흐름에서 돈다.

```java
public class MyThread extends Thread {
    private String str;

    public MyThread(String str) { this.str = str; }

    @Override
    public void run() {
        for (int i = 0; i < 10; i++) {
            System.out.print(str);
            try {
                Thread.sleep(1000);   // 1초간 쉰다
            } catch (InterruptedException ie) {
                ie.printStackTrace();
            }
        }
    }
}

MyThread t1 = new MyThread("*");
MyThread t2 = new MyThread("+");
t1.start();
t2.start();

// *---Thread-1---
// +*++*+*+*+**+*++*+*
```

`main`을 실행하는 흐름이 메인 스레드다. 메인 스레드가 마지막 줄까지 다 찍고 내려와도 프로그램은 아직 끝나지 않는다. 모든 스레드가 종료되어야 끝난다.

## Runnable 인터페이스 구현

`Runnable`을 구현할 때도 `run()`을 오버라이딩한다. 다만 `Runnable`에는 스레드를 실행할 준비를 해주는 `start()`가 없다. 그래서 만든 인스턴스를 `Thread` 생성자에 넘겨 `Thread`가 그것을 들고 있게 한다.

```java
MyRunnable r = new MyRunnable("*");
Thread t = new Thread(r);
t.start();
```

대개 이쪽을 쓴다. 자바는 다중 상속이 안 되니 `Thread`를 상속해버리면 다른 클래스를 상속할 길이 막힌다. `Runnable`은 인터페이스라 그 제약이 없고, 할 일과 실행 수단을 나눈다는 점에서도 낫다. [[상속과 합성]]

추상 메서드가 하나뿐이라 `Runnable`은 [[함수형 인터페이스]]이기도 하다. 람다로 줄여 쓸 수 있다.

```java
new Thread(() -> { ... }).start();
```

## run()을 직접 부르는 실수

`run()`을 직접 부르는 실수가 잦다. `start()`가 스레드가 실행될 준비를 해준 다음 `run()`을 실행시키고, 그때 비로소 흐름이 하나 더 생긴다.

## 참고

원본은 `start()`가 스레드를 준비시킨다는 데까지만 적었다. `Thread.run()` javadoc은 이 메서드가 "직접 호출하도록 의도된 것이 아니다"라고 못박고, 클래스 설명은 "새로 시작된 스레드는 그것을 시작시킨 스레드와 동시에 실행된다"고 적는다. `run()`을 직접 부르면 그냥 메서드 호출이라 새 흐름이 생기지 않는다. [Thread javadoc](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html)

## 관련

- [[스레드]]
- [[동기화]]
- [[함수형 인터페이스]]

## 출처

- [[brain/lectures/pl/fun-java/fun-java10|재미있는 자바 10강 - Java Thread 생성]]
- [[brain/notes/DevCourse/003|데브코스 회고 3편 - 다중상속과 함수형 인터페이스]]
