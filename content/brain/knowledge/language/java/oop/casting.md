---
title: 업캐스팅과 다운캐스팅
aliases:
  - 업캐스팅과 다운캐스팅
  - 업캐스팅
  - 다운캐스팅
  - instanceof
tags:
  - language
  - java
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

[[inheritance|상속]] 관계에 놓인 타입끼리 형을 바꾸는 것. 어느 방향으로 바꾸느냐에 따라 안전성이 갈린다.

## 업캐스팅

자식 인스턴스를 부모 타입 변수가 받는 것이다.

```java
Customer c = new VIPCustomer();   // 자동, 안전하다
```

VIP 고객은 언제나 고객이므로 이 방향은 늘 안전하고, 그래서 묵시적으로 일어난다. 대신 자식만 가진 기능은 쓸 수 없다. `Car c1 = new Bus();`로 받으면 `Bus`의 `안내방송()`은 보이지 않고 `Car`가 선언한 `달리다()`만 보인다. 보이는 것을 걸러주는 이 성질이 [[polymorphism|다형성]]이고, [[interface|인터페이스]] 타입으로 받는 이유이기도 하다. 참조 변수의 타입만 봐도 이 코드가 무엇을 쓸지 짐작이 되니 읽기도 편해진다.

## 다운캐스팅

부모 타입으로 받아둔 것을 원래 자식 타입으로 되돌리는 것이다.

```java
VIPCustomer v = (VIPCustomer) c;   // 명시적으로 써야 한다
```

그 객체가 실제로 자식이 아닐 수 있어서 위험하다. `Animal ani = new Tiger();`를 `Human`으로 바꾸는 코드는 컴파일을 통과하고 실행할 때 `ClassCastException`으로 터진다. 컴파일러는 변수에 붙은 타입만 보고, 안에 무엇이 들어 있는지는 실행해봐야 알기 때문이다.

그래서 다운캐스팅 전에 `instanceof`로 원래 자료형을 확인한다.

```java
if (c instanceof VIPCustomer) {
    VIPCustomer v = (VIPCustomer) c;
}
```

## instanceof 분기가 늘어날 때

타입을 확인해 분기하는 코드가 늘어난다면 [[polymorphism|다형성]]으로 풀 일을 조건문으로 풀고 있다는 신호다.

```java
// 이렇게 하는 대신
if (animal instanceof Dog) { ((Dog) animal).bark(); }
else if (animal instanceof Cat) { ((Cat) animal).meow(); }

// 이렇게
animal.speak();
```

`Human`, `Tiger`, `Eagle`을 `ArrayList<Animal>`에 담아놓고 꺼낼 때마다 `instanceof`로 갈라 `readBook()`, `hunting()`, `flying()`을 부르는 코드가 그 예다. 동물이 하나 늘 때마다 분기도 한 칸 늘어난다. 반면 세 클래스가 모두 재정의한 `move()`는 같은 반복문에서 분기 없이 불린다. [[solid|OCP]]가 말하는 차이가 여기 그대로 드러난다.

## 참고

원본은 `instanceof`로 확인한 뒤 따로 캐스팅하는 데까지만 적었다. `instanceof` 패턴 매칭이 JDK 16에서 정식 기능이 되면서 확인과 변환을 `if (c instanceof VIPCustomer v)` 한 줄에 쓴다. JEP 394는 옛 관용구를 두고 "검사와 변환, 새 지역 변수 선언 세 가지가 벌어지는데 타입 검사와 캐스트를 둘 다 하는 것은 불필요하다"고 적는다. [JEP 394](https://openjdk.org/jeps/394)

## 관련

- [[inheritance|상속]]
- [[polymorphism|다형성]]
- [[overriding|오버라이딩]]

## 출처

- [[brain/books/do-it-java/chap08|Do it 자바 8장 - 다운 캐스팅과 instanceof]]
- [[brain/lectures/pl/fun-java/fun-java04|재미있는 자바 4강 - 객체 형변환]]
