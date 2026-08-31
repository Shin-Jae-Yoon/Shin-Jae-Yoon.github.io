---
title: 생성자
aliases:
  - 생성자
  - 디폴트 생성자
  - this()
  - super()
tags:
  - language
  - java
origin:
  verified: 2026-08-31
  scouted: 2026-08-30
---

클래스를 처음 생성할 때 멤버 변수나 상수를 초기화하는 것. 반환형이 없고 이름이 클래스 이름과 같다.

## 만들어지는 순간 정해져야 하는 값

멤버 변수는 나중에 메서드로 바꿀 수도 있다. 하지만 학생에게 학번이 없으면 학생이 아닌 것처럼, 만들어지는 순간에 값이 정해져야 하는 것도 있다. 학번을 매개변수로 받는 생성자만 열어두면 학번 없는 학생은 아예 만들어지지 않는다.

```java
public Student(int studentID) {
    this.studentID = studentID;
}
```

## 디폴트 생성자와 오버로딩

생성자를 하나도 쓰지 않으면 컴파일러가 매개변수 없는 생성자를 만들어준다. 이것이 디폴트 생성자다. 대신 생성자를 하나라도 직접 쓰면 그 자동 생성이 사라진다. 매개변수 있는 생성자만 만들어두고 `new Person()`을 부르면 컴파일 오류가 난다.

이름이 같고 매개변수가 다른 생성자는 여럿 둘 수 있다.

```java
Person() { }
Person(String name) { }
Person(String name, int age) { }
```

## this()와 super()

`this(...)`는 생성자 안에서 자기 클래스의 다른 생성자를 부른다. 필드에 값을 대입하는 코드가 생성자마다 반복되는 것을 막는 데 쓰고, 매개변수를 적게 받는 쪽이 많이 받는 쪽을 부르게 짠다.

```java
Person(String name) {
    this(name, 0);      // 반드시 첫 줄이어야 한다
}
```

`super(...)`는 부모 클래스의 생성자를 부른다. 객체는 부모부터 만들어져서 `VIPCustomer` 하나를 생성하면 `Customer()` 생성자가 먼저 실행되고 그다음에 `VIPCustomer()`가 실행된다. 자식 생성자가 `this(...)`도 `super(...)`도 쓰지 않았다면 컴파일러가 첫 줄에 `super()`를 넣는다.

## this 예약어

`this`는 인스턴스 자기 자신을 가리키는 예약어다. 매개변수와 필드 이름이 겹칠 때 `this.studentID = studentID`로 필드 쪽을 지목하고, `this(...)` 꼴로 다른 생성자를 부르고, `return this;`로 자기 주소를 돌려준다. 마지막 쓰임이 메서드 체이닝을 만들고 [[builder|빌더 패턴]]이 그 성질에 기댄다.

## 부모에 기본 생성자가 없을 때

부모에 기본 생성자가 없으면 자식이 컴파일되지 않는다. 자동으로 삽입되는 `super()`가 호출할 대상을 찾지 못하기 때문이다. 부모가 `Customer(int customerID, String customerName)`만 갖고 있다면 자식 쪽에서 `super(customerID, customerName)`처럼 직접 불러야 한다.

## 클래스 메서드 안의 this

`this`는 클래스 메서드 안에서 쓸 수 없다. 클래스 메서드는 인스턴스 없이도 호출되므로 가리킬 자기 자신이 없다.

## 참고

원본에는 자식 생성자의 첫 줄에 언제나 `super()`가 있다고 적혀 있다. 첫 줄이 `this(...)`인 생성자에는 컴파일러가 `super()`를 넣지 않는다. 명시적인 생성자 호출이 이미 있으면 그것으로 끝이고, 부모 생성자는 `this(...)`가 넘긴 쪽 생성자를 타고 한 번만 실행된다. [JLS 8.8.7](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.8.7)

## 관련

- [[class-and-object|클래스와 객체]]
- [[inheritance|상속]]
- [[builder|빌더 패턴]]

## 출처

- [[brain/books/do-it-java/chap05|Do it 자바 5장 - 생성자]]
- [[brain/books/do-it-java/chap06|Do it 자바 6장 - this 예약어]]
- [[brain/lectures/pl/fun-java/fun-java05|재미있는 자바 5강 - 생성자, super()]]
