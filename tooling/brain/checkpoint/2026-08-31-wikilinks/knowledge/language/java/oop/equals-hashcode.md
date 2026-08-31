---
title: equals와 hashCode
aliases:
  - equals와 hashCode
  - Object 메서드
  - toString
  - 동일성과 동등성
tags:
  - language
  - java
origin:
  verified: 2026-08-31
---

`Object`가 재정의하라고 내려주는 메서드들. 물려받은 그대로 쓰면 쓸모가 없다.

## 모든 것이 Object인 까닭

`System.out.println(car)`가 컴파일되는 데는 이유가 있다. `println`이 `Object`를 받기 때문이다.

```java
public void println(Object x)
```

부모 타입 변수로 자식 인스턴스를 참조할 수 있고, 아무것도 상속받지 않은 클래스는 `Object`를 상속받는다. 세상의 모든 객체가 `Object`로 참조되니 `println`은 무엇이든 받는다.

그렇게 받은 것을 그대로 출력하면 `Car@7c75222b`가 나온다. 클래스 이름과 해시값뿐이라 사람에게 주는 정보가 없다. `System.out.println(obj)`는 사실 `obj.toString()`을 출력하는 것이고, `Object`가 준 기본 구현이 딱 그 수준이다.

## 동일성과 동등성

`equals`도 사정이 비슷하다. `==`는 동일성을 묻는다. 같은 객체를 가리키는가다. `equals`는 동등성을 묻는다. 같은 정보를 가지는가다. 그런데 `Object`의 기본 `equals`는 `==`와 똑같이 동작해서, 동등성을 물은 자리에 동일성을 답한다. 무엇을 같다고 볼지는 개발자가 기준을 정해 재정의해야 한다.

## toString 재정의

`toString()`을 재정의하면 원하는 문자열이 나온다. `Car` 클래스에서 `return "자동차";`로 돌려주면 `System.out.println(c1)`이 `자동차`를 찍는다.

## 둘을 함께 재정의해야 하는 이유

`equals`와 `hashCode`는 둘 중 하나만 고치면 안 된다. 해시를 쓰는 컬렉션이 두 메서드를 이어서 보기 때문이다. `hashCode()`가 다르면 그 자리에서 다른 객체로 끝내고, 같을 때만 `equals()`로 확인한다.

| hashCode | equals      | 결론        |
| -------- | ----------- | ----------- |
| 같다     | false       | 다른 객체   |
| 같다     | true        | 동등한 객체 |
| 다르다   | 보지 않는다 | 다른 객체   |

`equals`만 재정의하면 내용이 같아도 `hashCode`가 달라서 `HashMap`이나 `HashSet`이 다른 것으로 본다. 분명히 넣었는데 못 찾는 상황이 여기서 생긴다. Set에 넣을 객체는 둘 다 재정의한다. [[컬렉션 프레임워크]]

`String`은 [[문자열과 String Pool|불변]]이라 `hashCode()`를 처음 한 번만 계산하고 저장해둔다. 값이 변하지 않으니 가능한 최적화이고, Map의 키로 쓰기에 좋은 이유이기도 하다.

## 관련

- [[컬렉션 프레임워크]]
- [[해시 테이블]]
- [[문자열과 String Pool]]
- [[DAO, DTO, VO]]

## 출처

- [[brain/lectures/pl/fun-java/fun-java04|재미있는 자바 4강 - Object 메서드]]
- [[brain/notes/DevCourse/001|데브코스 회고 1편 - 동일성과 동등성]]
- [[brain/lectures/pl/fun-java/fun-java07|재미있는 자바 7강 - HashSet 클래스]]
- [[brain/notes/Interview/dog-study/dog-week01|면접 스터디 1주차 - 해시코드 캐싱]]
