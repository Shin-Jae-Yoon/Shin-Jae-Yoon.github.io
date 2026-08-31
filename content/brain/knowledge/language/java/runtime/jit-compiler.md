---
title: JIT 컴파일러
aliases:
  - JIT 컴파일러
  - Just In Time
  - 동적 로딩
tags:
  - language
  - java
origin:
  verified: 2026-08-31
  scouted: 2026-08-30
---

실행 시점에 바이트코드를 기계어로 바꾸는 컴파일러. [[brain/knowledge/language/java/runtime/jvm|자바가 바이트코드를 인터프리터로 실행하기 때문에]] 느리다는 문제를 보완한다.

## 한 줄씩 해석하던 방식

이전의 자바 해석기는 바이트코드를 한 줄씩 읽어 그때그때 실행했다. 같은 코드가 반복되면 그 줄들을 매번 다시 해석한다.

JIT은 바이트코드를 운영체제에 맞는 실행 코드로 한 번에 변환해 실행하고, 같은 코드가 다시 나오면 이전에 만들어둔 기계어를 재사용한다. 해석기 방식보다 성능이 10~20배 좋다.

## 동적 로딩

자바 애플리케이션은 여러 클래스로 이루어지는데, 실행할 때 그 클래스를 전부 올리지는 않는다. 필요한 시점에 필요한 클래스만 올린다. 동적 로딩이라고 부르는 성질이다.

동적 로딩 덕분에 일부 클래스가 바뀌어도 애플리케이션 전체를 다시 컴파일하지 않아도 된다. 변경이 생겨도 비교적 적은 작업으로 유연하게 대응한다.

컴파일을 실행 중에 하는 것과 클래스를 필요할 때 올리는 것은 성격이 같다. 미리 다 해두는 대신 필요해진 순간에 한다.

## 참고

HotSpot이 프로그램 전체를 미리 컴파일하지 않는 까닭은 거의 모든 프로그램이 시간의 대부분을 코드의 일부에서 쓰기 때문이다. VM은 일단 인터프리터로 프로그램을 돌리면서 뜨거운 지점을 찾아내고 거기에만 네이티브 코드 최적화를 집중한다. 드물게 실행되는 코드는 컴파일하지 않으므로 전체 컴파일 시간을 늘리지 않고도 성능이 중요한 부분에 더 공을 들인다. [OpenJDK HotSpot Runtime Overview](https://openjdk.org/groups/hotspot/docs/RuntimeOverview.html)

## 관련

- [[brain/knowledge/language/java/runtime/jvm|JVM과 바이트코드]]
- [[brain/knowledge/language/theory/compile|컴파일 과정]]
- [[memory-and-gc|메모리 구조]]

## 출처

- [[brain/books/do-it-java/chap01|Do it 자바 1장 - JIT 컴파일러]]
- [[brain/notes/Java/java-features|Java의 특징 - 동적 로딩]]
