---
title: JVM과 바이트코드
aliases:
  - JVM과 바이트코드
  - 바이트코드
  - 플랫폼 독립성
  - Write once run anywhere
tags:
  - language
  - java
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

자바의 컴파일은 기계어를 만들지 않고 바이트코드를 만든다. `javac`가 `Hello.java`를 읽어 내놓는 `Hello.class`가 바이트코드이고, 사람이 쓰는 말과 기계어의 중간에 놓인 JVM용 코드다.

```
Hello.java  --javac-->  Hello.class  --JVM-->  실행
소스                    바이트코드
```

만들어진 바이트코드는 CPU와 OS에 맞게 설치된 JVM이 한 줄씩 읽어가며 인터프리터 방식으로 실행한다.

## 플랫폼 독립성의 대가

자바 프로그램은 운영체제나 하드웨어와 직접 말을 섞지 않고 JVM하고만 통신한다. JVM이 그 명령을 해당 운영체제가 알아듣는 형태로 바꿔 전달한다. 자바 프로그램은 OS에 독립적이고 JVM은 OS에 종속적이다.

한 번 작성하면 어디서나 실행된다(Write once, run anywhere)는 말이 그래서 성립한다. 대가는 JVM을 한 겹 거치는 비용이다.

## 클래스 로딩

소스 코드와 클래스 파일 자체는 정적이다. 동적인 것은 실행되면서 생기는 쪽이고, 그 사이를 잇는 일이 클래스 정보를 메모리에 올리는 클래스 로딩이다.

인스턴스를 만들기 전에 JVM은 CLASSPATH에 그 클래스가 있는지 먼저 찾는다. 없으면 `ClassNotFoundException`을 던지고 있으면 클래스 정보를 메모리에 올린다. 클래스가 저장된 디스크는 RAM보다 훨씬 느려서 필요할 때마다 읽어오면 성능 저하가 크다. 처음 쓰일 때 한 번 올려두고 그 뒤로는 올려둔 것을 쓰는 이유다.

## PermGen에서 Metaspace로

클래스 정보가 앉는 자리는 버전에 따라 바뀌었다. 자바 7까지는 JVM이 관리하는 PermGen에 올라갔고, 자바 8부터는 네이티브 메모리가 관리하는 Metaspace에 올라간다.

[[static]] 정보도 자리를 옮겼다. 자바 7 전까지는 non-heap 영역에 저장했고 자바 8부터는 힙에 저장한다. 힙에 있으면 [[memory-and-gc|가비지 컬렉션]] 대상이 된다.

## 참고

원본은 클래스 정보가 PermGen에서 Metaspace로 옮겨갔다는 사실만 적었다. 옮긴 까닭은 JEP 122에 있다. 목표부터가 "핫스팟 JVM에서 PermGen을 제거하여 그 크기를 튜닝할 필요를 없앤다"이고, 클래스 메타데이터를 네이티브 메모리에 할당하면 "새 클래스 메타데이터 할당이 `-XX:MaxPermSize` 값에 고정되지 않고 쓸 수 있는 네이티브 메모리 양으로 제한"된다고 적는다. [JEP 122](https://openjdk.org/jeps/122)

크기가 고정되어 있던 시절에는 그 한계에 부딪히면 오류가 났다. 자바 7 문제 해결 안내서는 `java.lang.OutOfMemoryError: PermGen space`를 두고 "PermGen space라는 상세 메시지는 퍼머넌트 제너레이션이 가득 찼음을 뜻한다. 애플리케이션이 아주 많은 클래스를 로드하면 `-XX:MaxPermSize` 옵션으로 퍼머넌트 제너레이션 크기를 늘려야 할 수 있다"고 적는다. [Java SE 7 Troubleshooting Guide](https://docs.oracle.com/javase/7/docs/webnotes/tsg/TSG-VM/html/memleaks.html)

## 관련

- [[memory-and-gc|메모리 구조]]
- [[jit-compiler|JIT 컴파일러]]
- [[brain/knowledge/language/theory/compile|컴파일 과정]]
- [[static]]

## 출처

- [[brain/lectures/pl/fun-java/fun-java01|재미있는 자바 1강 - 컴파일 과정]]
- [[brain/lectures/pl/fun-java/fun-java04|재미있는 자바 4강 - JVM 메모리]]
- [[brain/notes/Java/java-features|Java의 특징]]
