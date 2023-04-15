---
title: "10. Java Thread"
date: "2023-04-14 00:08"
enableToc: true
tags: [""]
---

인프런의 <a href='https://www.inflearn.com/course/%EC%A6%90%EA%B1%B0%EC%9A%B4-%EC%9E%90%EB%B0%94' target='_blank'>부부 개발단 토토님의 즐거운 자바 강의</a>를 정리한 내용

<hr>

## 성능 향상시키기

![](brain/image/fun-java10-3.png)

성능이 좋은 프로그램을 만들고 싶다고 하자. 
- 예를 들어, 하나의 프로그램에서 위와 같은 작업이 있다.
- **B** : 병렬화가 가능하지 않은 부분
- **1 - B** : 병렬화가 가능한 부분

<br>

![](brain/image/fun-java10-2.png)

- 병렬화가 가능한 부분을 두 부분에서 동시에 실행되도록 하면 시간을 아낄 수 있다.

<br>

![](brain/image/fun-java10-4.png)

- 병렬화가 가능한 부분을 더 쪼개서 동시에 실행되도록 하면 더 시간을 아낄 수 있다.
- 그러나, ==**병렬화가 가능하지 않은 부분인 B 때문에 성능을 무한으로 향상시킬 수는 없다.**==

<br>

### 병렬화 시 고려

병렬화 할 때 고려해야할 것들은 아래와 같다.

- 메모리의 속도
- CPU 캐시 메모리
- 디스크
- 네트워크
- 커넥션
- **순차적 실행이 병렬 실행보다 빠른 경우도 있다.** 동시 실행에 따르는 오버헤드가 없고, 단일 CPU 알고리즘은 하드웨어 작업에 더 친화적일 수 있기 때문
- 등등 ...

<br>

> **암달의 법칙 (Amdahl's Law)** <br>
> 암달의 법칙(Amdahl's law)은 암달의 저주로도 불리며, 컴퓨터 시스템의 일부를 개선할 때 <br>
> 전체적으로 얼마만큼의 최대 성능 향상이 있는지 계산하는데 사용된다. <br>
> 이론(theory)만 많은 컴퓨터과학 분야에서 몇 안되는 법칙(Law)이다.

<br>

![](brain/image/fun-java10-5.png)

- 병렬 컴퓨팅을 할 경우, 일부 병렬화 가능한 작업들은 사실상 계산에 참여하는 컴퓨터의 개수에 비례해서 속도가 늘어남
- 이러한 경우 암달의 법칙에 의해 전체 수행시간의 개선 효과는, **병렬화가 불가능한 작업들의 비중에 크게 영향을 받게 됨**
- ==**즉, 아무리 컴퓨터의 개수가 늘어나더라도 속도의 한계는 정해져있다는 것**==

<br>

### 병행 vs 병렬

![](brain/image/fun-java10-6.png)

- ==**병행(Concurrent)**==은 ==**멀티스레드 프로그래밍**==을 의미
- 병렬(Parallel)은 멀티코어 프로그래밍을 의미
- 우리가 살펴볼 것은 병행 프로그래밍== **(동시성 프로그래밍, 멀티스레드 프로그래밍)**==

<br>

![](brain/image/fun-java10-7.png)

- 활성 상태 보기를 보면 이렇게 프로세스, 스레드 등을 확인할 수 있다.
- ==**각각의 프로세스들은 자신만의 메모리 영역을 확보한 채로 실행되고 있다.**==

<br>

### Context Switching

![](brain/image/fun-java10-8.png)

- 적절한 시간만큼 쪼개서 프로세스가 실행된다.
- 컴퓨터는 굉장히 빠르기 때문에 P1~P4가 마치 "동시에 실행되는 것처럼" 보인다.
	- 실제로 동시에 실행되는 것은 아니다.
	- 예를 들어, 프로세스 1 실행동안 다른 프로세스는 멈춰있다.
- 만약, P1이 실행되다가 잠시 멈췄다가 P2가 실행되는 상황이라고 하자. 그렇다면 나==**중에 다시 P1을 실행하려면, 어디까지 실행이 되었었는지, 메모리는 어디 부분을 사용하고 있었는지를 기억**==하고 있어야 할 것이다. 그래야 나중에 이어서 실행할 수 있으니까.
	- 이런 부분을 ==**Context Switching이 발생한다**==고 한다.
	- 이 과정에서 시간이 많이 걸린다. 오버헤드가 발생한다.

<br>

### Process

![](brain/image/fun-java10-9.png)

- 각각의 프로세스는 메모리 공간에서 독립적으로 존재
- 각각의 프로세스는 자신만의 메모리 구조를 가짐 (스택, 힙, BSS, Text)
- 프로세스 A, B, C가 있을 경우 각각 프로세스는 모두 같은 구조의 메모리 공간을 가짐
- 독립적인만큼 다른 프로세스의 메모리 공간에 접근할 수 없음
	- 그렇다면, **프로세스끼리 어떻게 통신할까?** -> ==**IPC**==

<br>

### IPC

![](brain/image/fun-java10-10.png)

**IPC (Inter-Process Communication) : 프로세스간 통신**

- 프로세스 A에서 프로세스 B를 직접 접근할 수 없기 때문에, ==**프로세스 간의 통신을 하는 특별한 방식**==이 필요하다. 메일슬록(mailslot), 파이프(pipe) 등이 바로 프로세스 간의 통신, 즉, ==**IPC**==의 예시이다.
- 프로세스는 독립적인 메모리 공간을 지니기 때문에 IPC를 통하지 않고 통신할 수 없다.
- ==**프로세스가 여럿이 병렬적으로 실행되기 위해서는 필연적으로 Context Switching이 발생할 수 밖에 없다. 이것을 해결할 수 있는 것이 Thread이다.**==
	- 스레드도 컨택스트 스위칭이 없는 것은 아니다.
	- 하지만, 프로세스의 컨택스트 스위칭 비용보다 스레드의 컨택스트 스위칭 비용이 더 작아서 스레드가 더 유리하다.

<br>

### Thread

![](brain/image/fun-java10-11.png)

- 스레드는 ==**하나의 프로그램 내에 존재하는 여러 개의 실행 흐름을 위한 모델**==
- 우리가 생각하는 프로그램이 실행되기 위해서 하나의 실행흐름으로 처리할 수도 있지만, 다수의 실행흐름으로 처리할 수도 있음
- 스레드는 프로세스와 별개가 아닌 프로세스를 구성하고 실행하는 흐름
- 스레드도 Context Switching이 발생

<br>

**메모리 공간에서의 스레드**

![](brain/image/fun-java10-12.png)

- ==**하나의 프로세스가 가지고 있는 메모리를 여러 개의 스레드가 공유한다.**==
- 프로세스와 프로세스 간 전환보다 스레드와 스레드 간 전환의 비용이 당연히 적다.

<br>

### Thread vs Process

- 스레드는 프로세스 안에 존재하는 실행 흐름
- 스레드는 프로세스의 heap, static, code 영역 등을 공유
- 스레드는 stack 영역을 제외한 메모리 영역은 공유
- 스레드가 code 영역을 공유하기 때문에, 프로세스 내부의 스레드들은 프로세스가 가지고 있는 함수를 자연스럽게 모두 호출할 수 있음
- 스레드는 IPC 없이도 스레드 간 통신 가능
	- A, B 스레드는 통신하기 위해 heap 영역에 메모리 공간 할당, 두 스레드가 자유롭게 접근 가능
- 스레드는 프로세스처럼 스케쥴링의 대상이다. 이 과정에서 컨택스트 스위칭이 발생
	- 하지만, 스레드는 공유하고 있는 메모리 영역 덕분에 컨택스트 스위칭 때문에 발생하는 오버헤드가 프로세스에 비해 적음
		- 동작 중인 프로세스가 바뀔 때 프로세스는 자신의 상태(context 정보)를 일단 보존한 후, 새롭게 동작 개시하는 프로세스는 이전에 보존해 두었던 자신의 context 정보를 다시 복구한다. 이와 같은 현상을 Context Switching이라 한다.
		- 스레드의 컨택스트 정보는 프로세스보다 적기에 스레드의 컨택스트 스위칭은 가볍게 행해지는 것이 보통
		- 하지만, 실제로 스레드와 프로세스의 관계는 JVM 구현에 크게 의존
- 참고로, 플랫폼이 같아도 JVM의 구현방법에 따라 프로세스와 스레드의 관계는 달라질 수 있음

<br>

무조건적으로 멀티 스레드 프로그래밍이 더 낫다는 의미는 아니다. 여러 스레드가 하나의 메모리를 공유해서 사용하는 경우에, 자원을 획득하기 위한 스레드 간 경쟁이 발생한다.
- 메모리가 많고, 컴퓨터의 속도가 빠른 경우에는 여러 개의 프로세스를 이용하여 실행하는 것이 여러 개의 스레드보다 유리할 수 있다.

<br>

**멀티스레드(Multi Thread) 실행 방식**

![](brain/image/fun-java10-13.png)

- ==**main 메서드부터 시작되어 흘러가는 하나의 흐름을 Main Thread**==라고 한다.
- Main 흐름 안에서 새로운 스레드를 발생시켜서 동시에 여러 흐름이 흐르게 할 수 있다.

<br>

<hr>

## Java Thread 생성

Java에서 스레드를 생성하는 방법은 2가지가 있다.
1. Thread 클래스 상속받기
2. Runnable 인터페이스 구현하기

<br>

### Thread 클래스 상속

1. Thread 클래스를 상속받는다.
2. `run()` 메서드를 오버라이딩 한다.
3. `start()` 메서드로 시작한다.

![](brain/image/fun-java10-14.png)

- Thread 클래스를 상속받아 스레드를 작성할 수 있음
- Thread의 `run()` 메서드를 상속받는 클래스에서 반드시 오버라이딩 해야한다.
- ==**`start()` 메서드가 굉장히 중요**==하다.
	- **Thread가 실행될 준비를 해주고**, `run()` 메서드를 실행시키면서 스레드 흐름이 하나 더 생기게 되는 것이다.

<br>

```java
class Xxx extends Thread {
	public void run() {
		// 동시에 실행될 드 작성
	}
}
```

<br>

```java
Xxx x = new Xxx();
x.start();
```

<br>

**예시**

```java {title="MyThreadMain"}
public class MyThreadExam {  
    public static void main(String[] args) {  
        String name = Thread.currentThread().getName();  
        System.out.println("thread name : " + name);  
        System.out.println("thread start!");  
  
        MyThread myThread1 = new MyThread("*");  
        MyThread myThread2 = new MyThread("+");  

		// 3. start() 메서드로 실행
        myThread1.start();  
        myThread2.start();  
  
        System.out.println("thread end!");  
    }  
}
```

<br>

```java {title="MyThread.java"}
// 1. Thread 클래스 상속받음
public class MyThread extends Thread {  
  
    private String str;  
  
    public MyThread(String str) {  
        this.str = str;  
    }  

	// 2. run() 메서드 오버라이딩
    @Override  
    public void run() {  
        String name = Thread.currentThread().getName();  
        System.out.println("---" + name + "---");  
        for (int i = 0; i < 10; i++) {  
            System.out.print(str);  
            try {  
                Thread.sleep(1000); // 1초간 쉰다  
            } catch (InterruptedException ie) {  
                ie.printStackTrace();  
            }  
        }  
    }  
}
// thread name : main
// thread start!
// thread end!
// ---Thread-0---
// *---Thread-1---
// +*++*+*+*+**+*++*+*
```

- ==**모든 스레드가 종료될 때 프로그램이 종료된다.**==

<br>

### Runnable 인터페이스 구현

1. Runnable 인터페이스 구현
2. `run()` 메서드 오버라이딩
3. Thread 인스턴스를 생성할 때, 생성자에 Runnable 인스턴스 넣기
4. Thread가 가지고 있는 `start()` 메서드 호출

![](brain/image/fun-java10-15.png)

- Runnable 인터페이스를 구현하면 `run()` 메서드를 반드시 오버라이딩
- 근데, Runnable 인터페이스에는 스레드가 실행될 준비를 해주는 `start()` 메서드가 없다.
	- 그래서 만든 클래스를 스레드가 **가지도록 해야 한다.**

<br>

```java
class Xxx implements Runnable {
	public void run() {
		// 동시에 실행될 코드 작성
	}
}
```

<br>

```java
Xxx x = new Xxx();
Thread t = new Thread(x);
t.start();
```

<br>

```java {title="MyRunnable.java"}

// 1. Runnable 인터페이스 구현  
public class MyRunnable implements Runnable {  
    private String str;  
    
    public MyRunnable(String str) {  
        this.str = str;  
    }  
  
    // 2. run() 메서드 오버라이딩  
    @Override  
    public void run() {  
        String name = Thread.currentThread().getName();  
        System.out.println("---" + name + "---");  
        for (int i = 0; i < 10; i++) {  
            System.out.print(str);  
            try {  
                Thread.sleep(1000); // 1초간 쉰다  
            } catch (InterruptedException ie) {  
                ie.printStackTrace();  
            }  
        }  
    }  
}
```

<br>

```java {title="MyThreadExam2.java"}
public class MyThreadExam2 {  
    public static void main(String[] args) {  
        String name = Thread.currentThread().getName();  
        System.out.println("thread name : " + name);  
        System.out.println("thread start!");  
  
        MyRunnable myRunnable1 = new MyRunnable("*");  
        MyRunnable myRunnable2 = new MyRunnable("+");  
  
        // 3. Thread 인스턴스를 생성할 때, 생성자에 Runnable 인스턴스 넣기  
        Thread thread1 = new Thread(myRunnable1);  
        Thread thread2 = new Thread(myRunnable2);  
  
        // 4. Thread가 가지고 있는 start() 메서드를 호출  
        thread1.start();  
        thread2.start();  
  
        System.out.println("thread end!");  
    }  
}
```

<br>

