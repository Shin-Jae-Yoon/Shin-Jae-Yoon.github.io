---
title: 동기화
aliases:
  - 동기화
  - synchronized
  - volatile
  - Thread-safe
  - 스레드 안전
tags:
  - language
  - java
origin:
  verified: 2026-08-30
---

여러 [[스레드]]가 같은 데이터를 동시에 건드릴 때 생기는 문제를 막는 것. 스레드는 프로세스의 메모리를 공유하므로 이 문제가 늘 따라다닌다.

## 확인과 행동 사이의 틈

```java
public class Settings {
	private static Settings instance;

	public static Settings getInstance() {
		if (instance == null) {
			instance = new Settings();
		}
		return instance;
	}
}
```

스레드 A가 `if`를 통과하고 아직 객체를 만들기 전에 스레드 B도 통과하면 서로 다른 인스턴스가 생긴다. 한 줄씩 따로 보면 어디도 틀리지 않았는데 결과가 틀린다. 확인하고 행동하는 사이에 다른 스레드가 끼어들 수 있기 때문이고, DB의 [[동시성 제어|Lost Update]]와 구조가 같다.

이런 문제가 생기지 않는 상태를 스레드 안전(thread-safe)하다고 한다.

## synchronized와 그 대가

`synchronized`는 한 스레드가 쓰는 동안 나머지가 그 메서드에 못 들어오게 막는다.

```java
public synchronized static Settings getInstance() { ... }
```

대가는 성능이다. 위 예에서 인스턴스가 한 번 만들어진 뒤로는 동기화할 이유가 없는데도 호출할 때마다 락이 걸려 자원을 낭비한다.

## volatile과 가시성

`volatile`은 동시 접근이 아니라 가시성을 맡는다. 스레드는 성능을 위해 값을 CPU 캐시에 들고 있어서, 첫 번째 스레드가 메인 메모리에 값을 넣기 전에 두 번째 스레드가 읽으면 옛날 값을 본다. `volatile`을 붙이면 대입과 읽기를 모두 메인 메모리에서 하므로 그 시간차가 사라진다. 상호배제는 제공하지 않고 가시성만 보장한다.

[[싱글톤 패턴|DCL]]이 `volatile`을 요구하는 이유도 가시성이다. 아직 초기화가 끝나지 않은 객체를 다른 스레드가 먼저 보는 일을 막아준다.

## 동기화된 컬렉션과 아닌 것

`Vector`와 `Stack`은 메서드마다 동기화가 걸려 있어 멀티스레드 환경에서 안전하다. 대신 스레드가 하나뿐일 때도 그 오버헤드를 그대로 낸다. 같은 자리를 대신하는 `ArrayList`와 `ArrayDeque`는 동기화하지 않아 단일 스레드에서 빠르다. 용량이 모자랄 때 늘리는 폭도 달라서 `Vector`는 두 배, `ArrayList`는 1.5배로 잡는다. `Vector`와 `Stack`을 권장하지 않는 이유가 여기 다 들어 있다.

여러 스레드가 함께 써야 하면 `Collections.synchronizedList()`로 감싼다. `ArrayDeque`에는 그런 메서드가 없어서 직접 감싼다.

```java
class SyncStack<E> {
    private final Deque<E> stack = new ArrayDeque<>();

    public synchronized void push(E e) {
        stack.push(e);
    }
}
```

## 아예 공유하지 않는 쪽

락은 경합을 정리해주는 대신 값을 받아간다. 가장 안전하고 싼 방법은 애초에 공유하지 않는 것이다. [[불변 객체]]는 값이 바뀌지 않으니 동기화할 거리가 없고, 스레드마다 자기 데이터를 갖게 하면 경합 자체가 생기지 않는다.

## 관련

- [[스레드]]
- [[싱글톤 패턴]]
- [[불변 객체]]
- [[동시성 제어]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week05|면접 스터디 5주차 - 동기화, DCL]]
- [[brain/notes/CodeTree/dataStructure|코드트리 자료구조 - Vector, Stack 권장하지 않는 이유]]
