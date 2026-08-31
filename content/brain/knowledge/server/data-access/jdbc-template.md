---
title: JdbcTemplate과 스프링 데이터 JPA
aliases:
  - JdbcTemplate과 스프링 데이터 JPA
  - JdbcTemplate
  - Spring Data JPA
  - RowMapper
tags:
  - server
  - spring
  - database
origin:
  verified: 2026-08-30
---

같은 기능을 만드는 코드가 데이터 접근 기술을 바꿀 때마다 얼마나 짧아지는지 보여주는 두 지점. JdbcTemplate은 [[jdbc|JDBC]]의 반복 코드를 걷어내고, 스프링 데이터 JPA는 구현 클래스 자체를 없앤다.

## JdbcTemplate이 걷어내는 반복

JdbcTemplate은 [[sql-mapper|SQL Mapper]] 계열이다. JDBC에서 반복되던 작업을 대신해주므로 넘겨야 할 것은 실행할 SQL, 바인딩할 파라미터, 결과를 어떤 객체로 받을지뿐이다.

```java
public class JdbcTemplateMemberRepository implements MemberRepository {

    private final JdbcTemplate jdbcTemplate;

    public JdbcTemplateMemberRepository(DataSource dataSource) {
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    @Override
    public Optional<Member> findById(Long id) {
        List<Member> result = jdbcTemplate.query(
                "select * from member where id = ?", memberRowMapper(), id);
        return result.stream().findAny();
    }

    private RowMapper<Member> memberRowMapper() {
        return (rs, rowNum) -> {
            Member member = new Member();
            member.setId(rs.getLong("id"));
            member.setName(rs.getString("name"));
            return member;
        };
    }
}
```

결과를 객체로 바꾸는 `RowMapper`를 따로 빼두면 조회 메서드마다 재사용할 수 있다. 생성할 때 `DataSource`를 주입받는데, 스프링 부트가 DB 커넥션 정보를 바탕으로 만들어 빈으로 등록해두므로 그대로 받아 쓰면 된다. SQL은 여전히 내가 쓴다.

## 인터페이스만 남기는 스프링 데이터 JPA

스프링 데이터 JPA는 한 칸 더 간다. `JpaRepository`를 상속한 인터페이스만 선언하면 구현 클래스를 쓰지 않아도 된다.

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByName(String username);
}
```

`findByName`이라고 이름만 지어두면 `SELECT * FROM MEMBER M WHERE M.NAME = 'hello'`에 해당하는 JPQL이 만들어진다. 이름으로 표현하기 어려운 쿼리는 `@Query`로 JPQL을 직접 적는다.

```java
@Query("select m from Member m where m.username = ?1")
Member findByName(String username, Pageable pageable);
```

## 조회 성격에 따른 배분

하나만 고르는 것이 아니다. 기본 CRUD와 이름으로 표현되는 조회는 스프링 데이터 JPA로 두고, 조건이 붙었다 떨어지는 동적 조회는 [[querydsl|Querydsl]]로 넘긴다. ORM으로 표현하기 어렵거나 성능이 필요한 통계 쿼리는 [[sql-mapper|SQL Mapper]] 쪽에 맡긴다.

## 관련

- [[jdbc|JDBC]]
- [[orm-jpa|ORM과 JPA]]
- [[querydsl|Querydsl]]
- [[sql-mapper|SQL Mapper]]

## 출처

- [[brain/lectures/backend/kim-spring/spring-intro/spring-basic-02|김영한 스프링 입문 - 스프링 JdbcTemplate]]
- [[brain/notes/Interview/dog-study/dog-week06|면접 스터디 6주차 - SQL Mapper]]
- [[brain/notes/Interview/dog-study/dog-week09|면접 스터디 9주차 - Querydsl 사용 이유]]
