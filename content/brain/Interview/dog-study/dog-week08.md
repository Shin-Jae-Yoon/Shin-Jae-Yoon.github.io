---
title: "8주차 - Spring JPA"
date: "2023-04-05 23:07"
enableToc: true
tags: [""]
---

>[!note] 8주차 스터디
><br>
> **TOPIC** <br>
> - OSIV
> - JPA
> - N+1 문제
> - fetch join 한계
> 	- OneToMany fetch join 페이징 쿼리 성능 이슈
> 	- MultipleBagFetchException
> - OneToOne 양방향 관계 Lazy 로딩 주의
> - 상속관계 매핑

<br>

## OSIV

==**OSIV(Open Session In View)는 영속성 컨택스트를 View 단까지 열어준다는 의미이다.**== 
- Spring에서 Presentation Layer(View, Controller)에는 트랜잭션이 없기 때문에 엔티티를 수정할 수는 없다.
- **Spring에서는 OSIV 기능이 default로 켜져있다.** 따라서, View 단을 렌더링 하면서 쿼리가 나갈 수 있다고 WARN을 띄워주는데 이를 없애려면 명시적으로 OSIV 기능을 설정하면 된다.
	- 영속성 컨택스트를 요청이 들어올 때 미리 만들고, 응답할 때까지 유지시켜준다.
	- 서블릿의 필터 혹은 스프링의 인터셉터에서 미리 영속성 컨택스트를 만들어서 사용한다.
- OSIV 덕분에 영속성 컨택스트가 살아있어서 **Lazy Loading이 가능**하다.
	- 이로 인해 Service에 초기화를 위한 코드를 작성하지 않아도 된다.

> 영속성 컨택스트는 엔티티를 영구 저장하는 환경이다. <br>
> 영속성 컨택스트는 트랜잭션이 시작될 때 만들어지고 트랜잭션이 커밋된 이후 없어진다. <br>

<br>

> 즉시 로딩이란 객체 A를 조회할 때 A와 연관된 객체들을 한 번에 가져오는 것이고 <br>
> **지연 로딩**이란 객체 A를 조회할 때는 A만 가져오고 연관된 애들은 프록시 초기화 방법으로 가져오는 것이다.

<br>

### OSIV의 필요성, 단점

OSIV는 왜 나오게 되었을까? 아래를 한 번 살펴보자.

![](brain/image/dog-week07-2.png)

<br>

- 서비스에서 트랜잭션이 시작되면서 영속성 컨택스트가 만들어져 엔티티는 영속 상태가 되고, 서비스가 끝나면 트랜잭션도 끝나고 밖으로 나오면서 준영속 상태가 된다.
- 그런데, 만약 Post와 User가 다대일 연관관계로 매핑이 되어있는 경우에 Post entity를 Controller까지 가져와서 PostDto로 변환하려고 하면 어떻게 될까?
	- Service가 끝났으니까 트랜잭션 종료되면서 영속성 컨택스트도 사라짐
	- Controller까지 끌고온 Post는 다대일 연관관계라서 Lazy Loading을 시도했을 것
	- 그런데 컨트롤러에 트랜잭션이 있을까? 없다. 따라서 영속성 컨택스트도 없다. 그래서 `could not initialize proxy` 오류를 뱉을 것이다.

<br>

이런 이유로 ==**트랜잭션 외부에서도 영속성 컨택스트가 존재하여 DB 커넥션을 유지하고, 영속성 컨택스트를 사용할 수 있는 기능의 필요성을 느끼게 된 것이다.**==
 
<br>

그러나, ==**이러한 특성으로 인해 OSIV에는 단점이 있다.**==
- 같은 영속성 컨택스트를 여러 트랜잭션이 공유할 수 있다.
- Presentation Layer에서 엔티티를 수정하고 Service Layer의 트랜잭션으로 들어오면 엔티티가 수정된다.
- Presentation Layer에서 Lazy Loading에 의한 SQL이 실행되기 때문에 성능 튜닝 시 확인해야할 부분이 Presentation Layer까지 넓어진다.
- DB 커넥션 시작 시점부터 응답이 나갈 때까지 DB 커넥션을 유지하는거라서 커넥션이 부족할 수 있다.

<hr>

## JPA

==**JPA(Java Persistence API)는 RDBMS와 OOP 객체 사이의 불일치에서 오는 패러다임을 해결하기 위해 자바에서 만들어낸 ORM(Object-Relational Mapping) 기술의 표준 명세이다.**==

- Java에서 제공하는 API이다. Spring에서 제공하는 것이 아니다.
- [6주차 스터디](/brain/Interview/dog-study/dog-week06)에서 언급한 것처럼, Spring Framework의 PSA(Portable Service Abstraction)에 의해 POJO를 사용하면서 특정 기술인 ORM을 사용하기 위해 정해둔 표준 인터페이스이다.
- SQL을 매핑하지 않고 ==**자바 클래스와 DB 테이블을 매핑**==
	- 객체가 테이블이 되도록 매핑시켜주는 것

![](brain/image/dog-week08-1.png)

<br>



<hr>

## 참고

- <a href='https://velog.io/@modsiw/JPAJava-Persistence-API%EC%9D%98-%EA%B0%9C%EB%85%90' target='_blank'>modsiw님의 JPA 정리 게시글</a>