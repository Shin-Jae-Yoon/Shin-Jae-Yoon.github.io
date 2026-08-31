---
title: Querydsl
aliases:
  - Querydsl
  - QClass
  - JPAQueryFactory
  - BooleanExpression
tags:
  - server
  - jpa
  - database
  - spring
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

정적 타입을 이용해 SQL이나 JPQL 같은 쿼리를 코드로 쓰게 해주는 빌더 프레임워크. 문자열로 쿼리를 짤 때 런타임까지 미뤄지던 문제가 컴파일 시점으로 당겨진다.

## 문자열 쿼리의 런타임 오류

스프링 데이터 JPA는 메서드 이름만으로 JPQL을 만들어준다. 이름으로 표현하기 어려우면 `@Query`에 JPQL을 직접 적는다.

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
    @Query("select m from Member m where m.username = ?1")
    Member findByName(String username, Pageable pageable);
}
```

두 방법 모두 쿼리가 문자열이다. `select m from Memberrr`라고 오타를 내도 빌드는 통과하고, 그 코드가 실제로 도는 런타임이 되어서야 JPQL에 문제가 있다는 것을 안다.

## 동적 쿼리

동적 쿼리에서 더 크게 걸린다. 조건에 따라 `where`와 `and`를 붙였다 뗐다 하는 코드는 사람이 읽어서 무슨 쿼리인지 알아보기 힘들고 버그가 몰린다. JPA Criteria를 써도 이 문제는 풀리지 않는다. 이 대목에서 [[SQL Mapper|MyBatis]]가 편해 그쪽으로 돌아선 사람이 많았고, 그래도 JPA를 포기할 수는 없어서 Querydsl이 나왔다.

## QClass 생성

gradle 세팅을 마치고 `compileQuerydsl`을 실행하면 `@Entity`로 등록된 자바 파일을 기반으로 QClass가 생성된다. [[Entity|`User` 엔티티]]가 있으면 `QUser`가 생긴다. 이 클래스로 컬럼에 접근하니 타입이 보장되고 IDE 자동 완성도 붙는다. 컬럼 이름 수십 개를 외우고 다닐 일이 없어진다.

## JPAQueryFactory

쿼리는 `JPAQueryFactory`에서 시작한다. 생성자에 `EntityManager`를 주입해 빈으로 등록해두고 쓴다.

```java
@Configuration
public class QuerydslConfiguration {
    @Autowired
    EntityManager em;

    @Bean
    public JPAQueryFactory jpaQueryFactory() {
        return new JPAQueryFactory(em);
    }
}
```

```java
QMember m = QMember.member;

List<Member> hello = query
        .selectFrom(m)
        .where(m.age.gt(18).and(m.name.contains("hello")))
        .fetch();
```

## BooleanExpression으로 짜는 동적 조건

동적 조건은 `BooleanBuilder`로도 짤 수 있다. 다만 `if` 문이 늘어나면 어떤 동적 쿼리인지 파악하기 어려워지므로 `BooleanExpression`을 쓴다. 조건을 메서드로 빼서 `BooleanExpression`을 반환하게 하면 조건 하나하나가 재사용 단위가 된다.

## 자바 코드라서 따라오는 것

자바 코드라서 따라오는 것이 더 있다. 메서드 추출 같은 IDE 기능으로 쿼리 조각을 재사용하고, 원하는 필드만 뽑아 [[DAO, DTO, VO|DTO]]로 바로 받는다. 코드 모양이 JPQL과 거의 같아 옮겨 적기도 어렵지 않다.

## 참고

조건 메서드가 `null`을 반환하면 그 조건이 통째로 무시된다. 조건을 쭉 나열해두고 필요한 것만 살아나게 하는 방식이 성립하는 근거인데, 원본에는 `BooleanBuilder` 예제만 있고 이 대목이 없다. Querydsl 소스의 `DefaultQueryMetadata.addWhere`는 첫 줄에서 인자가 `null`이면 그대로 반환한다. [querydsl, DefaultQueryMetadata.java](https://github.com/querydsl/querydsl/blob/master/querydsl-core/src/main/java/com/querydsl/core/DefaultQueryMetadata.java)

## 관련

- [[ORM과 JPA]]
- [[SQL Mapper]]
- [[Entity]]
- [[JdbcTemplate과 스프링 데이터 JPA]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week09|면접 스터디 9주차 - Querydsl]]
