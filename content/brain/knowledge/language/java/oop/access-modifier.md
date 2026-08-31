---
title: 접근 제어자
aliases:
  - 접근 제어자
  - private
  - protected
  - public
  - default
  - getter setter
tags:
  - language
  - java
origin:
  verified: 2026-08-30
---

클래스 밖에서 어디까지 접근할 수 있는지를 정하는 키워드. [[encapsulation|캡슐화와 정보 은닉]]을 문법으로 실현하는 수단이다.

## 네 제어자의 범위

| 제어자      | 같은 클래스 | 같은 패키지 | 자식 클래스 | 전체 |
| ----------- | ----------- | ----------- | ----------- | ---- |
| `private`   | O           |             |             |      |
| (default)   | O           | O           |             |      |
| `protected` | O           | O           | O           |      |
| `public`    | O           | O           | O           | O    |

아무것도 쓰지 않으면 default이고 같은 패키지 안에서만 접근된다.

`protected`는 패키지가 달라도 자식이면 접근할 수 있다. [[template-method|템플릿 메서드 패턴]]에서 부모가 실행 순서를 정한 `execute()`만 `public`으로 두고, 자식이 이어받을 `init()`과 `close()`는 `protected`로 내려 바깥에서 따로 부르지 못하게 막는 것이 이 성질을 쓰는 자리다.

## getter와 setter

`private` 필드에 접근할 통로가 getter와 setter다.

```java
public String getName() { return name; }
public void setName(String name) { this.name = name; }
```

필드를 그냥 열어두면 값이 검증 없이 들어온다. `day`, `month`, `year`를 전부 `public`으로 둔 `MyDate`에는 2월 31일도 들어간다. 메서드를 거치게 하면 `setDay()` 안에서 2월인지 보고 1보다 작거나 28보다 크면 오류를 알릴 수 있다.

스프링에서는 이 한 쌍을 프로퍼티라고 부른다. `price` 필드는 클래스가 가진 속성이고, `price` 프로퍼티는 그 필드의 getter와 setter다.

## 가장 좁은 것부터

가장 좁은 것부터 시작한다. 필요해질 때 넓히는 것이지 일단 `public`으로 열고 나중에 좁히는 것이 아니다. 멤버 변수를 전부 `private`으로 할 이유는 없고 외부에 노출하고 싶지 않은 것만 막으면 되지만, 실무에서는 필드를 전부 `private`으로 두는 쪽이 관례에 가깝다.

## 기계적으로 만든 getter와 setter

getter와 setter를 기계적으로 전부 만들어두면 캡슐화가 아니다. `public` 필드와 다를 것이 없어진다. getter는 비교적 안전한 편이지만 참조형을 그대로 돌려주면 밖에서 내부를 바꿀 수 있으므로 [[immutable-object|방어적 복사]]가 필요하다. setter는 신중히 열고, 열더라도 `setPassword()` 대신 `updatePassword()`처럼 의미가 드러나는 이름을 쓴다.

이 판단의 근거가 [[ddd|데이터 주도 설계]]의 문제다. 무엇을 가질지부터 정하면 그 값을 어디서 어떻게 쓸지 모르는 채로 전부 열게 된다.

## 관련

- [[encapsulation|캡슐화와 정보 은닉]]
- [[immutable-object|불변 객체]]
- [[entity|Entity]]

## 출처

- [[brain/books/do-it-java/chap05|Do it 자바 5장 - 정보 은닉, 접근 제어자]]
- [[brain/lectures/pl/fun-java/fun-java05|재미있는 자바 5강 - 접근제한자]]
