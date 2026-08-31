---
title: 직렬화
aliases:
  - 직렬화
  - Serializable
  - 역직렬화
  - 마커 인터페이스
tags:
  - language
  - java
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

객체를 바이트의 흐름으로 바꾸는 것. 바이트가 되면 파일이나 메모리, 네트워크로 보낼 수 있고 받은 쪽은 역직렬화해서 다시 객체로 되돌린다.

## 쓰고 읽기

`ObjectOutputStream`으로 쓰고 `ObjectInputStream`으로 읽는다. 읽어올 때는 원래 타입으로 형변환한다.

```java
ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream("user.dat"));
out.writeObject(user);

ObjectInputStream in = new ObjectInputStream(new FileInputStream("user.dat"));
User user = (User) in.readObject();
```

아무 객체나 흘려보낼 수 있는 것은 아니다. 기본형 타입이거나 `java.io.Serializable`을 구현한 객체여야 한다. `User` 셋을 담은 `ArrayList`를 `writeObject()` 한 번으로 통째로 쓰고, 읽을 때도 `ArrayList`로 받아 그대로 꺼내 쓴다.

## 마커 인터페이스

`Serializable`에는 메서드가 하나도 없다. 구현한다고 해서 무언가를 만들어 넣을 일이 없고, "이 클래스는 직렬화해도 된다"고 표시해두는 것이 전부다. 이런 인터페이스를 마커 인터페이스라고 부른다.

## 직렬화로 얻는 깊은 복사

목록을 새로 만든다고 해서 안에 든 객체까지 새로 생기지는 않는다. `ArrayList<User> list2 = list;`는 복사가 아니라 같은 배열을 함께 참조하는 것이라 `list.remove(2)`를 하면 `list2`의 크기도 2가 된다. 새 `ArrayList`를 만들어 원소를 하나씩 옮기면 목록은 따로 생기지만 안에 든 `User`는 그대로 공유되므로 [[shallow-and-deep-copy|얕은 복사]]다.

같은 목록을 `ByteArrayOutputStream`에 직렬화했다가 다시 읽어 들이면 안에 든 `User` 인스턴스까지 새로 만들어진다. 원본에서 원소를 지워도 복사본은 셋을 그대로 들고 있다. 진짜 인스턴스가 두 벌이 되는 깊은 복사다.

## 참고

`Serializable` javadoc은 이 인터페이스에 "메서드도 필드도 없고 직렬화 가능하다는 의미를 식별하는 역할만 한다"고 적는다. 마커 인터페이스라는 말이 가리키는 것이 이 성질이다. 표시를 보고 동작을 달리하는 쪽은 직렬화 런타임이어서, javadoc은 "이 인터페이스를 구현하지 않은 클래스는 어떤 상태도 직렬화되거나 역직렬화되지 않는다"고 못박는다. [Serializable javadoc](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Serializable.html)

`serialVersionUID`를 명시하지 않으면 직렬화 런타임이 클래스의 여러 요소로 기본값을 계산한다. javadoc은 이 계산이 "컴파일러 구현에 따라 달라질 수 있는 클래스 세부에 매우 민감해서 역직렬화 때 예상치 못한 `InvalidClassException`을 낼 수 있다"며 명시 선언을 강력히 권한다. 받는 쪽이 들고 있는 클래스의 값이 보낸 쪽과 다르면 역직렬화는 `InvalidClassException`으로 실패한다. [Serializable javadoc](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Serializable.html)

파일에 남으면 안 되는 필드는 직렬화에서 뺀다. 자바 언어 명세는 "변수에 `transient`를 붙여 그것이 객체의 영속 상태에 속하지 않음을 나타낼 수 있다"고 정의한다. [JLS SE 21 §8.3.1.3](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.3.1.3)

자바 직렬화를 피하라는 흐름의 근거는 언어 설계자가 직접 적어두었다. 브라이언 괴츠는 자바 직렬화가 "상상할 수 있는 거의 모든 실수를 저질렀"고 유지보수 비용과 보안 위험이라는 세금을 물린다고 썼다. 직렬화를 노린 보안 공격은 "다양하고 미묘해서 보안 전문가조차 직렬화 코드를 검토하며 취약점을 놓친다"고도 했다. 스트림 형식은 "compact하지도 효율적이지도 사람이 읽을 수도 없"고 인코딩에 단단히 묶여 있어서 JSON이나 XML 같은 다른 인코딩으로 직렬화 로직을 재사용하기 어렵다. 직렬화로 얻은 깊은 복사가 복사 생성자보다 느린 까닭도 이 형식에 있다. 이 문제의식이 [[kafka-architecture|카프카]]에서 스키마와 직렬화 형식을 따로 고민하는 이유로 이어진다. [Towards Better Serialization](https://openjdk.org/projects/amber/design-notes/towards-better-serialization)

## 관련

- [[io-stream|I/O 스트림]]
- [[shallow-and-deep-copy|얕은 복사와 깊은 복사]]
- [[annotation|어노테이션]]
- [[kafka-architecture|카프카 구조]]

## 출처

- [[brain/lectures/pl/fun-java/fun-java09|재미있는 자바 9강 - ObjectStream, 직렬화]]
