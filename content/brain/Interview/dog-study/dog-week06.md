---
title: "6주차 - Spring Data"
date: "2023-03-21 15:25"
enableToc: true
tags: [""]
weight: 7
---

<hr>

>[!note] 6주차 스터디
><br>
> **TOPIC** <br>
> - POJO
> - DAO
> - DTO
> - ORM
> - 영속성 컨텍스트


<br>

## POJO

==**POJO(Plain Old Java Object)는 직역하자면 오래된 방식의 간단한 자바 객체라는 의미이다. 이는 특정 기술에 종속되지 않는 순수한 자바 객체를 의미한다.**==

**객체 지향적인 원리에 충실**하면서 **환경과 기술에 종속되지 않고** 필요에 따라 **재활용될 수 있는 방식으로 설계된 오브젝트**를 말하고 POJO에 애플리케이션의 핵심로직과 기능을 담아 설계하고 개발하는 방법을 POJO 프로그래밍이라고 할 수 있다.

예를 들어, ORM(Object Relationship Mapping) 기술을 사용하려면 ORM을 지원하는 프레임워크를 사용해야한다. 만약에 Java 객체가 ORM 기술을 사용하기 위해 Hibernate 프레임워크를 직접 의존하는 순간 POJO라고 할 수 없다. "특정 기술에 종속되었기 때문"이다.

<details>
<summary><strong>POJO 코드 예시보기</strong></summary>

아래는 기본적인 자바 기능인 getter, setter를 사용하여, 특정 기술에 종속되어 있지 않은 순수 자바 객체의 예시이다. 아래 객체는 POJO라고 할 수 있다.

```java
public class Student {
	private String name;
	private String age;

	public String getName() {
		return name;
	}

	public String getAge() {
		return age;
	}

	public void setName(String name) {
		this.name = name;
	}

	public void setAge(int age) {
		this.age = age;
	}

}
```

<hr>

</details>

<br>

> 오해하면 안되는게, 클래스를 상속한다던가 인터페이스를 구현한다고 <br>
> POJO가 아니라는 의미는 아니다. <br>
> 프레임워크나 특정한 기술에 의해 종속적이지 않기만 하면 상관없다. <br>
> 자바에서 기본적으로 클래스 상속, 인터페이스 구현을 하는데 질문이 좀 이상하네 ㅋㅋ

<br>

> [!note] POJO 단어의 등장 배경 <br>
> 마틴 파울러가  2000년 가을에 열렸던 어느 컨퍼런스의 발표를 준비하면서 처음 만들어낸 말이다. <br><br>
> 마틴 파울러는 EJB(Enterprise JavaBean)보다는 단순한 자바 오브젝트에 도메인 로직을 넣어 사용하는 것이 여러가지 장점이 있는데도 왜 사람들이 그 EJB가 아닌 '평범한 자바 오브젝트'를 사용하기를 꺼려 하는지에 대해 의문을 가졌다. <br><br>
> 그리고 그는 단순한 오브젝트에는 EJB와 같은 그럴듯한 이름이 없어어서 그 사용을 주저하는 것이라고 결론 내렸다. 그래서 만든 단어가 POJO이다.

<br>

<details>
<summary><strong>EJB가 뭔데? + 왜 POJO를 지향해야하는가?</strong></summary>

EJB(Enterprise Java Bean)는 기업 환경의 시스템을 구현하기 위한 서버 측 컴포넌트 모델이다. Java 개발에 있어서 로우레벨 개발을 신경쓰지 않고 애플리케이션을 쉽게 만들어준 기술이다.

하지만, EJB의 사용과 프로그램의 규모가 커지면서 특정 기술과 환경에 종속되어 의존성이 높아진 Java 코드는 가독성이 떨어져 유지보수에 어려움이 생겼고, 특정 기술의 클래스를 상속받도록 강제된다는 점이나, 기술에 직접 의존한다는 특징 때문에 확장성이 매우 떨어져 점점 객체지향성을 감소시켰다는 치명적인 단점이 있었다.

즉, POJO를 지원하는 Spring 이전에는 원하는 엔터프라이즈 기술이 있으면 그 기술을 **직접적으로 사용하는 객체를 설계**했다는 의미이다. 객체지향 설계의 장점을 잃어버렸기 때문에 POJO라는 개념이 나오게 되었다. POJO를 지향하는 것은 진정한 객체지향 개발을 위해서이다.

<hr>

</details>

<br><br>

### POJO 프레임워크

하지만, 단순히 EJB 이전으로 돌아간다는건 아무 의미가 없다. 로우레벨 개발을 다시 신경써야 한다는 의미이기 때문이다. 그래서 POJO의 장점과 EJB에서 제공하는 엔터프라이즈 서비스와 기술을 사용할 수 있도록 도와주는 것이 **POJO 프레임워크**이다. 대표적인 POJO 프레임워크에는 Spring과 Hibernate가 있다.

> 엔터프라이즈 시스템(Enterprise System)은 단어 그대로 기업 시스템을 의미한다. 기업의 업무 프로세스를 자동화하고 관리하기 위한 소프트웨어 시스템이다.

<br>

==**Spring은 POJO를 지원하는 대표적인 프레임워크이다.**==
- Spring은 엔터프라이즈 서비스들을 POJO 기반으로 만든 비즈니스 오브젝트에서 사용할 수 있게 해준다.
- POJO를 지원하기에 스프링 컨테이너에 저장되는 자바 객체는 특정한 인터페이스를 구현하거나 클래스를 상속받지 않아도 된다.
- POJO 기반의 구성으로 기존에 작성한 자바 코드를 수정할 필요 없고, 객체를 구성하는 방식 그대로 스프링에서 사용할 수 있다. 이때문에 높은 생산성을 가진다.
- Java에서 제공하는 API 이외에는 종속되지 않기에 간편하고 유연한 테스트가 가능하다.
- 도메인과 비즈니스 로직을 수행하는 **대상**이 **POJO 대상**이 될 수 있다.

> 도메인(domain)은 화면, UI, 기술, 인프라 등의 영역을 제외한 **시스템이 구현해야하는 핵심 비즈니스 업무 영역**을 의미한다. 컨트롤러는 도메인이 아니고, 엔티티와 리포지토리 등을 도메인으로 볼 수 있다.

![](brain/image/dog-week06-1.png)

이렇게, Spring에서 POJO는 핵심이라고 볼 수 있다. 스프링의 주요기술인 IoC/DI, AOP, PSA는 애플리케이션을 POJO로 개발 가능하게 해준다.

<br>

==**Hibernate는 대표적인 POJO 프레임워크이다.**==
- 영속성(Persistence) 기술과 오브젝트-관계형 DB 매핑을 순수한 POJO를 이용해서 사용할 수 있게 해주는 POJO기반의 Persistence Framework이다.
- JDBC API를 직접 사용해 개발하는 것 못지 않은 퍼포먼스를 보여주고 복잡한 퍼시스턴스 로직을 개발 가능하게 해준다.
- 하이버네이트가 사용하는 POJO 엔티티들은 객체지향적인 설계와 구현이 가능하다.

<br>

### POJO의 조건

특정 기술규약과 환경에 종속되지 않으면 모두 POJO라고 말할 수 있을까? 그렇지 않다. ==**진정한 POJO는**== 위에서 말한것처럼 ==**객체 지향적인 원리에 충실하면서 환경과 기술에 종속되지 않고 필요에 따라 재활용될 수 있는 방식으로 설계된 오브젝트**==를 의미한다.

1. 특정 규약에 종속되지 않는다.
	- Java와 꼭 필요한 API 이외에는 종속되면 안된다.
	- 예를 들어, EJB와 같이 특정 규약을 따라 만들게 하는 경우에 대부분 규약에서 제시하는 **특정한 클래스를 상속하도록 요구한다.**
	- 자바는 다중 상속이 불가능해서 객체지향 설계 기법에 문제가 생기게 된다.

2. 특정 환경에 종속되지 않는다.
	- 특정 기업의 프레임워크나 서버에서만 동작 가능한 코드는 POJO라고 할 수 없다. POJO는 환경에 독립적이어야 한다.
	- 비즈니스 로직을 담고 있는 POJO 클래스는 웹이라는 환경 정보, 웹 기술을 담고 있는 클래스나 인터페이스를 사용해서는 안된다.
	- 예를 들어, 비즈니스 로직을 담은 코드에 HTTPServletRequest, HttpSession, 캐시와 관련된 API가 등장한다면 진정한 POJO라고 할 수 없다.

3. 객체지향적 원리에 충실한다.
	- 책임과 역할이 다른 코드를 몰아넣어 덩치가 큰 만능 클래스를 만들고 상속과 다형성을 적용하지 않고 if문, switch문이 가득한 설계 오브젝트라면 POJO라고 하기 어렵다.

<br>

### POJO의 장점

- 깔끔한 코드 작성 가능
- Java에서 제공하는 API 이외에는 종속되지 않기에 간편하고 유연한 테스트 가능
- 객체지향적 설계를 자유롭게 이용
	- 객체지향 프로그램은 엔터프라이즈 시스템에서와 같이 복잡한 도메인을 가진 곳에서 가장 효과적으로 사용될 수 있다.

<br>

### PSA와 JPA

그런데 위에서 Java 객체가 ORM 기술을 사용하기 위해 Hibernate 프레임워크를 직접 의존하는 순간 POJO가 아니라고 했으면서, Spring은 어떻게 POJO를 유지하면서 Hibernate를 사용할까? 이는 Spring에서 정한 표준 인터페이스가 있기 때문이다.

ORM을 사용하기 위해 JPA(Java Persistence API)라는 표준 인터페이스를 정의해뒀고, ORM 프레임워크들은 JPA의 구현체가 되어 실행된다. 이것이 새로운 엔터프라이즈 기술을 도입하면서도 POJO를 유지하는 방법이고 이런 방법을 PSA라고 한다.

==**PSA(Portable Service Abstraction)란 환경과 세부 기술의 변화에 관계없이 일관된 방식으로 기술에 접근할 수 있게 해주는 것을 의미한다.**== PSA가 적용된 대표적인 예시는 JDBC, JPA, Transaction Manager가 있다.

좀 어렵게 표현하면, ==**추상화 계층을 사용하여 어떤 기술을 내부에 숨기고 개발자에게 편의성을 제공하는 것을 서비스 추상화(Service Abstraction)**==이라고 하는데 DB에 접근하는 여러가지 방법 중, 기본적으로 JDBC를 통해 접근할 수도 있고 ORM을 이용하려고 JPA를 통해서 접근할 수도 있고 어떠한 경우에도 `@Transactional` 애노테이션을 이용하여 트랜잭션을 유지하는 기능을 추가할 수도 있다. 이렇게 ==**하나의 추상화로 여러 서비스를 묶어둔 것을 Spring에서 PSA**==라고 한다.

<hr>

## DAO

==**DAO(Data Access Object)는 실제로 DB에 접근하는 객체를 의미한다. DAO는 데이터에 접근하도록 DB 접근 관련 로직을 모아둔 객체이다.**==  DAO 사용 목적으로는, 데이터베이스에 접근하기 위한 로직과 비즈니스 로직을 분리하기 위하여 사용된다.

- 실제로 DB에 접근하여 데이터를 조회, 삽입, 삭제, 수정 등 CRUD 기능을 수행
- Service 모델과 DB를 연결

<br>

### DAO vs Repository

사실 DAO와 Repository는 거의 같다고 생각해도 무방하지만, 엄밀히 말하면 조금은 다르다. 

- ==**Dao : 데이터에 접근하도록 DB 접근 관련 로직을 모아둔 객체**==
- ==**Repository : 도메인(Entity) 객체를 보관하고 관리하는 저장소**==
	- 구현보다는 도메인 객체를 관리하는 역할에 초점이 맞춰짐

> 도메인(Entity) 객체는 비즈니스 로직을 캡슐화한 객체이다.

<br>

SQL을 직접 다룰 때는 쿼리 중심이고 도메인 객체라는 것이 명확하게 없지만, JPA를 사용하면 아무래도 도메인 객체를 정하고(보통 엔티티로) 해당 도메인 객체들을 관리하기 때문에 Repository라는 단어가 더 맞다고 생각한다고 김영한 강사님은 설명하셨다.

다만 MyBatis 같은 프레임워크를 사용하면 풀을 제공하기 때문에 DAO를 별도로 만드는 경우는 드물다. (JPA에서의 Repository의 기능과 동일한 역할을 수행한다고 볼 수 있겠다.)

<details>
<summary><strong>커넥션 풀이란?</strong></summary>

애플리케이션이 데이터베이스를 사용하기 위해서는 커넥션을 맺어야 한다. 커넥션을 생성하고 소멸시키는 비용이 크기 때문에 커넥션 풀을 세팅해두고(기본 10) 애플리케이션이 시작하는 시점에 커넥션을 미리 다 만들어 놓고 이를 재활용하면서 사용한다. 스프링 부트 2.0부터는 hikariCP를 기본 커넥션 풀로 사용한다.

<hr>

</details>

<br>

Spring에서 Repository와 DAO의 차이점에 대해서 <a href='https://www.baeldung.com/java-dao-vs-repository' target='_blank'>baeldung 사이트</a>에서는 이렇게 소개한다.

- DAO
	- 데이터 영속성(persistence)의 추상화
	- 데이터베이스(스토리지 시스템)와 더 가까운 저수준 개념, 주로 테이블 중심적인 구조를 가짐
	- 데이터 매핑/액세스 레이어로 작동하며 못생긴 쿼리를 숨기면서 데이터 소스와의 연결 관리와 데이터 저장소에서 데이터를 가져오고 저장하는 데 필요한 액세스 메커니즘을 구현
	- DAO는 Repository를 사용하여 구현할 수 없음
- Repository
	- 개체 컬렉션의 추상화 (컬렉션은 개별 객체들을 단일 단위로 표현하는 그룹을 의미함. 자바 컬렉션은 검색, 정렬, 삽입, 조작 및 삭제와 같은 모든 데이터 작업을 수행할 수 있음)
	- 도메인(비즈니스 로직)에 더 가까운 상위수준 개념
	- 도메인과 데이터 액세스 사이의 레이어로 데이터를 수집하고 도메인 개체를 준비하는 복잡성을 숨김
	- Repository는 스토리지에 접근하기 위해 DAO를 사용할 수 있음

따라서, Repository와 DAO는 데이터 액세스를 추상화하는 패턴으로 사용되지만, 다른 추상화 계층을 가지며, Repository는 비즈니스 객체를 처리, DAO는 데이터 액세스(접근) 메커니즘을 처리하는 역할의 차이가 있다. 

<hr>

## DTO

==**DTO(Data Transfer Object)는 계층 간(Controller, View, Business Layer(Model)) 데이터 교환을 위한 객체이다.**==
- 로직을 가지지 않고 Getter, Setter메서드만 가진 클래스이다. 단지 계층간 데이터 교환이 이루어질 수 있도록 하는 객체라서 특별한 로직을 가지지않고 순수한 데이터 객체여야 한다.
	- 보내는 쪽에서 setter를 사용해 데이터를 DTO에 담아보내고 받는 쪽에서 getter를 사용해 전달받은 DTO로부터 데이터를 꺼내는 방식
- DB에서 꺼낸 데이터를 저장하는 Entity를 이용하여 만드는 일종의 Wrapper Class
- Entity를 계층에 직접 전달하지 않고 DTO를 이용해 데이터를 교환하는 것

<br>

### VO

==**VO(Value Object)는 DTO와 달리 Read-Only 속성을 지닌 값 오브젝트이다. 값 그 자체를 의미한다.**==
- VO는 값 자체를 표현하기 때문에 불변객체여야 한다.
- 따라서, setter 메서드를 포함하면 안되고 생성자를 통해서만 값을 초기화해야한다.
- DTO와는 달리 로직이 있는 메서드 사용 가능
- 완전한 VO를 위해 객체를 속성값들로만 비교하도록 `hashCode()`, `equals()`를 모두 오버라이딩 해줘야한다.

<br>

예를 들어, Hash 이름을 가지는 컬렉션 프레임워크들인 HashSet, HashMap, HashTable은 두 객체가 동등한지 비교할 때 `hashCode() 리턴값`을 먼저 비교하고 같으면 `equals() 리턴값`을 비교한다. 즉, `hashCode()`, `equals()` 과정을 모두 거쳐야 비로소 동등한 객체인 것이다.

<br>

|             | DTO                                         | VO                                      |
| ----------- | ------------------------------------------- | --------------------------------------- |
| 용도        | 레이어 간 데이터 전달                       | 값 자체 표현                            |
| 동등 결정   | 속성 값이 모두 같다고 하여 같은 객체가 아님 | 속성 값이 모두 같으면 같은 객체         |
| 가변/불변 | setter 존재 시 가변, setter 없으면 불변     | 불변                                    |
| 로직        | getter, setter 이외의 로직 없음             | getter, setter 이외의 로직 가질 수 있음 | 

<br>

### DTO setter 지양?

많은 블로그에서 "DB에서 꺼낸 값을 DTO에서 임의로 조작할 필요가 없기 때문에 DTO에는 Setter를 만들 필요가 없고 생성자에서 값을 할당한다. 개인적으로는 생성자 또한 사용하지 않고 Entity처럼 Builder 패턴을 통해 값을 할당하는 것이 가장 좋은 것 같다."와 같이 설명하는데, 이 부분에서 의문점이 들었다.

어차피 Entity에 빌더 패턴을 적용하고 이를 Wrapper한 것이 DTO라면 굳이 DTO에 또 빌더패턴을 적용해야하나? 싶었다.

<a href='https://www.inflearn.com/questions/161417/dto-%EC%82%AC%EC%9A%A9%EC%97%90%EB%8C%80%ED%95%B4-%EA%B6%81%EA%B8%88%ED%95%A9%EB%8B%88%EB%8B%A4' target='_blank'>김영한님의 답변</a>에서도 설명하지만 ==**Entity는 비즈니스 로직이 있고, 실제 데이터도 변경되기 때문에 Setter를 최대한 사용하지 않는 편이 좋다고 하시지만 DTO는 목적 자체가 어떤 로직이 있다기 보다는 단순히 데이터를 전달하는 것이기 때문에 getter, setter를 자유롭게 사용해도 된다고 하셨다.**==

<br> 

그런데 또, 테코톡 영상을 보면 DTO에서 setter 메서드를 삭제하고 생성자를 통해 속성 값들을 초기화하게 만들어 불변객체로 만들면 DTO가 전달하는 데이터가 전달 과정 중에 변조되지 않음을 보장할 수 있어서 좋다. 데이터 불변성을 보장할 수 있다는 의미이다.

<hr>

## Persistence

==**Persistence는 영속성이라는 뜻으로, 데이터를 생성한 프로그램이 종료되더라도 사라지지 않는 데이터의 특성을 의미한다.**== 프로그램이 종료되더라도 같은 상태를 가지는 객체로 만들어내기 위하여 객체의 상태를 데이터베이스에 저장하는데, 이를 객체에게 영속성을 부여했다고 한다.

그렇다면 영속성을 부여하는 방법은 어떤 방법이 있을까? Persistence Layer를 어떻게 구현하느냐에 따라 JDBC, SQL Mapper, ORM 3가지 관점으로 비교할 수 있다. JDBC만을 이용하는 방법과 Persistence Framework를 이용하는 방법 2가지로 나눌 수도 있다.

<br>

### JDBC

==**JDBC(Java Database Connectivity)는 Java에서 DB에 접속할 수 있도록 해주는 자바 API이다.**==
- 자바 애플리케이션에서 DBMS에 종속적이지 않고 하나의 JDBC API를 이용해서 DB작업 처리
- JDBC 인터페이스를 구현한 각각의 DBMS 드라이버만 갈아끼우면 어느 DB에서든 접근 가능

보통 JDBC를 사용할 때 방법은 아래와 같다.
1. DriveManager : 이용하여 드라이버를 로드
2. Connection : DB와 연결하는 통로 역할을 할 Connection 객체 생성
3. Statement : Statement 객체를 생성하고 이를 통해 쿼리문 생성 및 실행
4. ResultSet : SQL문 결과물을 ResultSet 객체로 얻음
5. 열었던 순서 반대로 자원을 해제

단순히 JDBC만을 이용하여 영속성을 부여하면 아래와 같은 단점들이 있다.
- 간단한 SQL을 실행하는데도 중복된 코드 반복적 사용
- DB에 따라 일관성 없는 정보를 가진 채로 Checked Exception(SQLException) 처리
- Connection과 같은 공유 자원을 제대로 릴리즈(반환)하지 않으면 시스템의 자원이 바닥나는 버그 발생

<br>

### Persistence Framework

JDBC 프로그래밍의 복잡함이나 번거로움 없이 간단한 작업만으로 데이터베이스와 연동되는 시스템을 빠르게 개발하게 해주는 것이 Persistence Framework이다. 모든 Persistence Framework는 내부적으로 JDBC API를 이용하며, 이를 SQL Mapper와 ORM으로 나눌 수 있다.

<br>

### SQL Mapper

==**SQL Mapper : Java Persistence Frame 중 하나이며, 객체(Object)와 SQL 문을 매핑하여 데이터를 객체화하는 것**==
- 주의! 객체와 관계를 매핑하는 것이 아니라 직접 작성한 SQL문의 쿼리 결과와 객체의 필드를 매핑하여 데이터를 객체화하는 것이다.

Spring JDBC Template이 SQL Mapper 기능을 제공하는데, 이를 사용함으로써 쿼리 수행 결과와 객체의 필드를 매핑하여 반환 받을 수 있고 RowMapper를 재활용 할 수도 있었다. 또, JDBC에서 반복되는 많은 작업들을 대신해줘서 실행할 SQL과 바인딩 할 파라미터를 넘겨주거나 쿼리 실행 결과를 어떤 객체에 넘겨받을 지만 지정하면 된다.

<br>

SQL Mapper에 속하는 대표적인 프레임워크로 MyBatis가 있다.

==**MyBatis : 반복적인 JDBC 프로그래밍을 단순화하며 SQL 쿼리들을 XML 파일에 작성하여 코드와 SQL을 분리하여 관리하는 프레임워크이다.**==
- JDBC만 사용하면 결과를 가져와서 객체의 인스턴스에 매핑하기 위한 많은 코드가 필요하겠지만 마이바티스는 그 코드들을 작성하지 않아도 되게 해준다.
- DB에 접근하기 위해 특별한 작업없이 Mapper 인터페이스와 Mapping FIle만 구현하면 자연스럽게 객체의 필드와 SQL문이 매핑된다.



<hr>

## Entity

위에서 JPA를 사용하는 경우 도메인 객체를 Entity로 설정한다고 했는데 ==**Entity가 뭘까? 간단하게 설명하면 테이블과 매칭되는 개념으로 ORM을 이루는 기반 개념 중 하나이다. 객체와 RDB 간 연결시켜주는 존재이다.**==

<br>

==**Entity 클래스는 DB의 테이블에 존재하는 Column들을 필드로 가지는 객체를 말한다.**==
- Entity는 DB의 테이블과 1:1로 매핑된다. 
	- 따라서 테이블이 가지지 않는 컬럼을 필드로 가져서는 안된다. 
- Entity 클래스는 다른 클래스를 상속받거나 인터페이스의 구현체여서는 안된다.
- Entity 클래스에서는 도메인 로직만을 가지고 있어야하고 서비스 로직은 가지고 있으면 안된다. 여기서, 도메인 로직이란 도메인 데이터를 조작하는 `update()`와 같은 로직을 의미한다.
- JPA를 사용할 때 Entity 클래스에는 `@Entity` 애노테이션을 붙여 Entity임을 명시해줘야 하며, 내부의 필드에는 `@Column`, `@Id` 애노테이션 등을 사용한다.

<details>
<summary><strong>Entity 클래스 사용 예시 코드</strong></summary>

<a href='https://velog.io/@maketheworldwise/DAO-DTO-VO-ENTITY' target='_blank'>코드 출처</a>

```java
@Entity
@Getter
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode
@ToString
public class User implements Serializable {
    private static final long serialVersionUID = 7342736640368461848L;
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty
    private Long id;
    
    @Column(nullable = false)
    @JsonProperty
    private String email;
    
    @Column(nullable = false)
    @JsonProperty
    private String password;
    
    public User updatePassword(String password) {
    	this.password = password;
    	return this;
    }
}
```

</details>

<br>

### Setter 지양, Builder 패턴

**Entity에서 Setter를 지양하는 이유**
- Setter의 사용이 Entity의 일관성을 해칠 수 있기 때문
- Setter를 무분별하게 사용하면 Entity의 인스턴스 값들이 언제 어디서 변하는지 명확히 알 수 없음
- Setter 대신 다른 방법으로 필드에 값을 넣어주는 것이 좋다.
	- 이때, 일반적으로 생각할 수 있는 인스턴스의 생성 시점에 생성자로 필드에 값을 넣어주는 방법 또한 좋지 않다. 생성자에 현재 넣는 값이 어떤 필드인지 명확히 알 수 없고, 파라미터끼리 순서가 바뀌더라도 코드가 모두 실행되기 전까지 문제를 알 수 없다는 단점이 있기 때문
	- ==**Builder 패턴을 사용하는 것이 가장 좋음**==

<br>

**Entity에서 Setter를 안쓰고 필드에 값을 넣는 방법으로 Builder를 추천하는 이유**
- 멤버 변수가 많아지더라도 어떤 값을 어떤 필드에 넣는지 코드를 통해 확인 가능
- 필요한 값만 집어넣는 것이 가능

<br>

### Builder 패턴이란?

==**Builder 패턴은 GoF(Gang of Four)의 23개 디자인패턴 중 생성 패턴에 해당하는 것으로, 복잡한 객체들을 단계별로 생성할 수 있도록 도와주는 패턴이다.**==
- 복잡한 객체를 생성하는 클래스와 표현하는 클래스를 분리하여, 동일한 프로세스를 통해서도 서로 다른 표현을 생성하는 방법을 제공
- 생성해야하는 객체가 Optional한 속성을 많이 가질 때 더 좋음
- 인자들이 최소 4개 이상으로 많은 경우에 더 좋음
- 앞으로 추가될 인자들이 많은 경우에 더 좋음

빌더 패턴은 객체를 생성할 때 **생성자(Constructor)만 사용할 때 발생할 수 있는 문제를 개선하기 위해서 고안**되었다.
- 가독성이 좋아진다.
- 휴먼에러를 줄일 수 있다.
- 확장에 용이해진다. (원래라면 null값을 일일이 넣어줘야 했음)

<br>

```java
// 생성자 패턴으로 생성했을 때
// 28, 1, 5000이 어떤 인자인지 알기 힘듦
Member member = new Member("신재윤", 28, 1, 5000);

// 빌더 패턴으로 생성했을 때
Member member = Member.builder()
							.name("신재윤")
							.age(28)
							.experience(1)
							.salary(5000)
							.build();
```

<br>

<details>
<summary><strong>Builder 패턴 사용 예시 코드</strong></summary>

<a href='https://velog.io/@ohzzi/Entity-DAO-DTO%EA%B0%80-%EB%AC%B4%EC%97%87%EC%9D%B4%EB%A9%B0-%EC%99%9C-%EC%82%AC%EC%9A%A9%ED%95%A0%EA%B9%8C' target='_blank'>코드 출처</a>

```java
@Getter
@Entity
@NoArgsConstructor
public class Membmer member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String name;
    private String email;
    @Column(length = 13, nullable = false)
    private String phoneNumber;
 
    @Builder
    public Member(long id, String name, String email, String phoneNumber) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phoneNumber = phoneNumber;
    }
}

// 사용 방법
Member member = new member.builder()
        .name("신재윤")
        .email("wlwhsvkdlxh@gmail.com")
        .phoneNumber("010-1234-5678")
        .build();
```

</details>

<br>

### Entity와 DTO를 분리하는 이유

Entity의 값이 변하면 Repository 클래스의 Entity Manager의 flush가 호출될 때 DB에 값이 반영되고, 이는 다른 로직들에도 영향을 미친다. 때문에 View와 통신하면서 필연적으로 데이터의 변경이 많은 DTO 클래스를 분리해주어야 한다. 

또한 도메인 설계가 아무리 잘 되었다 해도 Getter만을 이용해서 원하는 데이터를 표시하기 어려운 경우가 발생할 수 있는데, 이 경우에 Entity와 DTO가 분리되어 있지 않다면 Entity 안에 Presentation을 위한 필드나 로직이 추가되게 되어 객체 설계를 망가뜨리게 된다. 때문에 이런 경우에는 분리한 DTO에 Presentation 로직 정도를 추가해서 사용하고, Entity에는 추가하지 않아서 도메인 모델링을 깨뜨리지 않는다.

<br>

**Entity 클래스**
- 절대로 요청이나 응답 값을 전달하는 클래스로 사용하면 안됨
- 데이터베이스와 매핑되어 있는 핵심 클래스이기 때문
- 엔티티 클래스를 기준으로 테이블이 생성되고 스키마가 변경됨

예를 들어, View는 비즈니스 요구사항에서 자주변경되는 부분인데, 만약에 Entity 클래스를 요청이나 응답 값을 전달하는 클래스로 사용한다면 뷰가 변경될 때마다 Entity 클래스를 그에 맞춰서 매번 변경해야할 것이다.

수많은 Service 클래스나 비즈니스 로직들이 Entity 클래스를 기준으로 동작하는데 Entity 클래스를 변경하면 관련되어 얽혀있는 무수히 많은 클래스들에 영향을 끼친다.

따라서, View 변경에 따라 다른 클래스들에게 영향을 끼치지 않고 자유롭게 변경할 수 있는 DTO를 사용해야한다. 또한, 응답 값으로 여러 테이블을 조인한 결과값을 줘야할 경우가 빈번해서 Entity 클래스만으로는 응답값을 표현하기 어려운 경우가 많다.

<br>

### EntityManager

EntityManager는 엔티티를 관리하는 역할을 한다.
- 엔티티 매니저

<br>

## 참고

- <a href='https://doing7.tistory.com/81' target='_blank'>Spring POJO란?</a>
- <a href='https://blog.naver.com/sillllver/220593543939' target='_blank'>Spring & EJB 비교</a>
- <a href='https://dev-coco.tistory.com/82' target='_blank'>dev-coco POJO 정리</a>
- <a href='https://sabarada.tistory.com/127' target='_blank'>sabarada님의 PSA</a>
- <a href='https://velog.io/@ohzzi/Entity-DAO-DTO%EA%B0%80-%EB%AC%B4%EC%97%87%EC%9D%B4%EB%A9%B0-%EC%99%9C-%EC%82%AC%EC%9A%A9%ED%95%A0%EA%B9%8C' target='_blank'>ohzzi님의 Entity, Dao, DTO가 무엇이며 왜 사용할까</a>
- <a href='https://www.youtube.com/watch?v=z5fUkck_RZM' target='_blank'>테코톡 인비의 DTO vs VO</a>
- <a href='https://dev-youngjun.tistory.com/197' target='_blank'>dev-youngjun님의 빌더 패턴 포스팅</a>
- <a href='https://www.inflearn.com/questions/111159/domain%EA%B3%BC-repository-%EC%A7%88%EB%AC%B8' target='_blank'>김영한님 질의응답</a>