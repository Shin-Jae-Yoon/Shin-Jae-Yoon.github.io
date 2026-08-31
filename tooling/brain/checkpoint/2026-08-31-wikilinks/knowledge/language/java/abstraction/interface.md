---
title: 인터페이스
aliases:
  - 인터페이스
  - interface
  - implements
  - 인터페이스 상수
tags:
  - language
  - java
origin:
  verified: 2026-08-31
  scouted: 2026-08-30
---

클래스나 프로그램이 제공하는 기능을 명시적으로 선언해두는 것. 선언만 있고 구현은 없다시피 하며, 구현하는 쪽이 그 선언대로 만들도록 강제한다. 매뉴얼이나 설계도에 가깝다.

## 구현 강제와 낮은 결합도

인터페이스는 구현을 강제하고, [[다형성]]을 제공하고, 쓰는 쪽과 만드는 쪽의 결합도를 낮춘다. 제작자가 자기 의도를 사용자에게 알려주는 수단이기도 하다.

```java
public interface Login { void login(); }

public class KakaoLogin implements Login {
    @Override
    public void login() { System.out.println("카카오 로그인"); }
}
```

`Login login = new KakaoLogin();`처럼 구현체 타입을 직접 적으면 그 구현체 하나에 묶인다. 인터페이스 타입으로 받고 무엇을 넣을지는 밖에서 정하게 하면 카카오가 오든 네이버가 오든 상관없이 로그인을 요청할 수 있다. 이것이 [[DIP]]이고 [[의존성 주입]]이 값어치를 하는 지점이다. 로그인 종류가 하나 늘어도 쓰는 쪽 코드는 그대로 둔다.

## 선언부만 보고 갈아 끼우기

읽는 쪽도 덕을 본다. 구현 클래스의 코드를 다 뒤지지 않고 선언부만 봐도 그 클래스를 어떻게 쓸지 알 수 있다. 매개변수 자료형과 반환 값만 맞으면 그 인터페이스를 구현한 어떤 클래스든 갈아 끼운다. SI 회사가 고객사마다 다른 데이터베이스를 상대할 때 접근 기능을 인터페이스로 정의해두고 MySQL용, 오라클용 모듈을 따로 만드는 것이 이 방식이고, JDBC의 `Connection`도 같은 자리에 있다.

접근하는 쪽에 따라 필요한 기능만 보이도록 인터페이스를 갈라두는 [[SOLID|ISP]]도 여기서 나온 이야기다.

## 상수와 추상 메서드로의 변환

```java
public interface Calc {
    double PI = 3.14;                    // public static final 로 변환
    int add(int num1, int num2);         // public abstract 로 변환
}
```

인터페이스에 선언한 변수는 컴파일 과정에서 전부 상수가 된다. `public static final`을 직접 쓰지 않아도 붙는다. 메서드도 아무 예약어를 붙이지 않으면 `public abstract`로 변환된다.

여기까지가 자바 7의 이야기다. 자바 8부터는 `default`와 `static`을, 자바 9부터는 `private`을 붙여 구현을 가진 메서드도 선언한다. 그래도 인터페이스 자체를 인스턴스로 만들 수 없다는 것은 변하지 않았다. 자세한 것은 [[디폴트 메서드]]에 있다.

## 여럿을 함께 구현하기

클래스는 하나만 상속할 수 있지만 인터페이스는 여럿 구현할 수 있다. `Buy`와 `Sell`을 함께 구현한 `Customer`는 `Buy`형이면서 `Sell`형이다. 어느 쪽 변수에 담느냐에 따라 보이는 메서드가 달라지고, 원래 자료형으로 되돌리려면 `instanceof`로 확인한 뒤 다운 캐스팅한다. 이름이 같은 추상 메서드가 양쪽에 있어도 구현은 클래스에서 한 번 이루어지므로 [[다이아몬드 문제]]가 생기지 않는다.

클래스 다이어그램에서는 인터페이스 구현을 점선으로, 포함 관계를 마름모로 그린다.

## 참고

원본은 인터페이스를 모든 메서드가 추상 메서드로만 이루어진 것이라고 적었다. 자바 8이 `default`와 `static` 메서드를, 자바 9가 `private` 메서드를 들이면서 더는 그렇지 않다. 명세는 `private`, `default`, `static` 중 어느 것도 붙지 않은 인터페이스 메서드만 암묵적으로 `abstract`가 되고 몸체 자리에 세미콜론이 온다고 적는다. [JLS 9.4](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.4)

인터페이스의 `private` 메서드는 자바 9의 Project Coin 후속 작업으로 들어왔다. [JEP 213](https://openjdk.org/jeps/213)

## 관련

- [[추상 클래스]]
- [[디폴트 메서드]]
- [[다형성]]
- [[DIP]]

## 출처

- [[brain/books/do-it-java/chap10|Do it 자바 10장 - 인터페이스]]
- [[brain/notes/DevCourse/003|데브코스 회고 3편 - Interface]]
