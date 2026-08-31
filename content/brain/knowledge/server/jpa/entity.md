---
title: Entity
aliases:
  - 엔티티
  - "@Entity"
tags:
  - server
  - jpa
  - database
  - java
  - spring
origin:
  verified: 2026-08-30
  scouted: 2026-08-30
---

테이블과 1대1로 대응되는 객체. 객체와 관계형 DB를 이어주는 자리에 있어서 [[orm-jpa|ORM]]의 기반 개념이 된다. DB 테이블에 존재하는 컬럼들을 필드로 갖는다.

## 매핑 애노테이션

```java
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    public User updatePassword(String password) {
        this.password = password;
        return this;
    }
}
```

`@Entity`로 엔티티임을 명시하고 필드에는 `@Id`와 `@Column`을 붙인다. 테이블과 1대1로 매핑되므로 테이블에 없는 컬럼을 필드로 가지면 안 된다.

## 클래스가 지키는 제약

프레임워크가 강제하는 상속에 묶이지 않는다. 상속이나 인터페이스 구현 자체가 금지된 것은 아니고, 문제가 되는 것은 특정 기술이 하나뿐인 상속 자리를 차지해 [[pojo|POJO]]가 아니게 되는 경우다.

도메인 로직만 갖고 서비스 로직은 갖지 않는다. 도메인 로직이란 위의 `updatePassword()`처럼 자기 데이터를 조작하는 로직이다. 여러 객체를 조율하거나 외부를 부르는 일은 서비스의 몫이다.

## Setter와 생성자 대신 빌더

`@Setter`를 전부 열어두면 인스턴스 값들이 언제 어디서 바뀌는지 알 수 없어 일관성이 깨진다. 생성자로 값을 채우는 것도 좋은 답이 아니다. 지금 넣는 값이 어떤 필드인지 알 수 없고, 파라미터 순서가 바뀌어도 코드가 다 실행되기 전까지는 문제를 모른다.

```java
// 28, 1, 5000이 어떤 인자인지 알기 힘들다
Member member = new Member("신재윤", 28, 1, 5000);

Member member = Member.builder()
        .name("신재윤")
        .age(28)
        .experience(1)
        .salary(5000)
        .build();
```

그래서 [[builder|빌더 패턴]]을 쓴다. 멤버 변수가 많아져도 어떤 값이 어떤 필드로 가는지 코드에 드러나고 필요한 값만 넣을 수 있다. 값을 바꾸는 메서드에는 `setPassword()` 대신 `updatePassword()`처럼 무엇을 하는 변경인지 이름으로 말하게 한다.

## 계층 밖으로 내보낼 때

Entity를 그대로 컨트롤러까지 내보내는 것도 문제가 된다. 뷰는 비즈니스 요구사항에서 자주 바뀌는 부분이라, Entity를 요청과 응답 전달에 쓰면 화면이 바뀔 때마다 Entity를 고치게 된다. 엔티티 클래스를 기준으로 테이블이 생성되고 스키마가 바뀌므로 그 여파가 얽혀 있는 수많은 클래스로 번진다. Getter만으로 원하는 데이터를 표시하기 어려울 때 표현 계층용 필드나 애노테이션이 Entity 안으로 들어오면 도메인 모델링도 함께 무너진다.

계층 사이를 오갈 때는 [[dao-dto-vo|DTO]]로 바꿔서 보낸다. 응답으로 여러 테이블을 조인한 결과를 줘야 하는 경우도 잦아서 Entity만으로는 표현하기 어렵다. 갈래는 [[dao-dto-vo|DAO, DTO, VO]]에 정리되어 있다.

## 참고

원본은 엔티티 클래스가 다른 클래스를 상속받거나 인터페이스의 구현체여서는 안 된다고 적었다. JPA 명세는 반대로 엔티티가 엔티티와 비엔티티 양쪽을 상속할 수 있다고 정하고, `@Inheritance`와 `@MappedSuperclass`로 상속 매핑 전략을 따로 규정한다. 같은 원본이 [[pojo|POJO]] 절에서는 상속이나 구현 자체가 POJO를 깨는 것이 아니라고 적고 있어 서로 어긋나기도 한다. 명세는 "Entities may extend non-entity classes as well as entity classes, and non-entity classes may extend entity classes"라고 적는다. [Jakarta Persistence 3.1, 2.1 The Entity Class](https://jakarta.ee/specifications/persistence/3.1/jakarta-persistence-spec-3.1#a18)

## 관련

- [[orm-jpa|ORM과 JPA]]
- [[persistence-context|영속성 컨텍스트]]
- [[dao-dto-vo|DAO, DTO, VO]]
- [[builder|빌더 패턴]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week06|면접 스터디 6주차 - Entity]]
