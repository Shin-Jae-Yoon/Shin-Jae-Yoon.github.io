---
title: "9주차 - Spring 심화"
date: "2023-04-19 00:47"
enableToc: true
tags: [""]
---

>[!note] 9주차 스터디
><br>
> **TOPIC** <br>
> - Querydsl
> - Spring Batch
> - Monolithic vs MSA
> - DDD

<br>

## Querydsl

==**Querydsl은 정적 타입을 이용하여 SQL, JPQL 같은 쿼리를 코드로 작성할 수 있도록 도와주는 빌더 오픈소스 프레임워크이다.**==

<br>

### 사용 이유

1. 문자가 아닌 **코드**로 작성
2. ==컴파일 시점에 문법 오류 발견==
3. IDE의 도움을 받아 코드 자동완성 가능
	- 수십개의 칼럼명을 외우고 다닐거 아니잖아. 
4. 단순하고 쉽고 코드 모양이 JPQL과 거의 비슷함
5. ==복잡한 쿼리나 동적 쿼리 작성 수월==
6. 자바 "코드"이기 때문에 메서드 추출과 같은 기능을 이용해 재사용 가능
7. ==원하는 필드만 뽑아서 DTO로 만드는 기능도 지원==

<br>

JPA의 특징 중 메서드 이름만으로 JPQL 쿼리를 생성하는 것이 있다.

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
	List<Member> findByName(String username);
}
```

<br>

```java
List<Member> member = memberRepository.findByName("hello");

// 실행된 SQL
// SELECT * FROM MEMBER M WHERE M.NAME = 'hello'
```

<br>

혹은, `@Query`를 사용해서 직접 JPQL을 지정할 수 있다.

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
	@Query ("select m from Member m where m.username = ?1")
	Member findByName(String username, Pageable pageable);
}
```

<br>

여기서 문제가 발생하는데, ==**SQL, JPQL은 문자열로 작성하기 때문에 컴파일 시점에서 오류가 발생했는 지 알 수 없다.**== 예를 들어, `select m from Memberrr` 이렇게 오타가 났다고 하자. 문자열로 쿼리를 작성했으니 컴파일 시점에 오류를 알 수 없고 런타임 시점이 되어서야 JPQL에 문제가 있음을 파악할 수 있다.

<br>

특히, Querydsl의 강점은 동적 쿼리를 다룰 때 나타난다. Spring Data JPA를 다룰 때 동적쿼리를 다루는 것을 보면, 코드가 사람이 직관적으로 이해하기 너무 힘들고 수많은 버그의 향연이 펼쳐질 수 있다. JPA Criteria를 쓴다고 해도 이 문제는 해결하기 힘들다.
- 이런 이유로, where, and 같은 것을 다룰 때나 동적쿼리를 다룰 때 Mybatis가 아주 편하기 때문에 많이 사용되는 것이다.
- 하지만, 우리는 JPA를 포기할 수 없다... 그래서 Querydsl 등장!

<br>

### 사용 방법

1. gradle에서 세팅을 마치고 `compileQuerydsl`  실행
2. `@Entity`로 등록된 자바 파일을 기반으로 `QClass` 라는 Querydsl 전용 객체가 생성됨
	- 컴파일 단계에서 엔티티를 기반으로 생성된 것이 QClass
3. `JpaQueryFactory 생성자`에 `EntityManager`를 주입해주고 `Q 파일` 인스턴스를 생성해서 사용하면 됨 (물론, JpaQueryFactory는 빈으로 등록해놔야 함)

```java
// JpaQueryFactory 빈으로 등록

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

<br>

```java
JpaQueryFactory query = new JpaQueryFactory();
QMember m = QMember.member;

List<Member> hello = query
				.selectFrom(m)
				.where(m.age.gt(18).and(m.name.contains("hello")))
				.fetch();
```

<br>

동적 쿼리도 코드로써 아주 쉽게 다룰 수 있음.
- 예제에서는 `Boolean Builder`를 설명했지만, 실제로 if문이 많아지면 어떤 동적쿼리인지 파악하기 힘드니까 `BoolenExpression`을 사용하도록 하자.

```java
String name = "member";
int age = 12;

QMember m = QMember.member;

BooleanBuilder builder = new BooleanBuilder();
if (name != null) {
	builder.and(m.name.contains(name));
}
if (age != 0) {
	builder.and(m.age.gt(age));
}

List<Member> list =
	query.selectFrom(m)
		.where(builder)
		.fetch();
```

<br>

### 많이하는 질문

1. ORM 프레임워크를 사용하면 SQL과 DB는 잘 몰라도 되나?
	- 오히려 더 잘 알아야함. ORM은 객체와 SQL 사이를 매핑해주는거라 더 잘 알아야함
2. 성능이 느리진 않은가?
	- 오히려 잘 쓰면 최적화 포인트가 더 많음
3. 통계 쿼리처럼 매우 복잡한 SQL은 어떻게?
	- 거의 다 Querydsl로 DTO로 바로 뽑아버린다.
	- 진짜 필요한 상황이라면 MyBatis를 붙여서 네이티브 쿼리를 쓴다

<hr>

## Spring Batch

<br>

### 배치 애플리케이션

**batch** : (명사) 집단, (동사) 일괄 처리를 위해 함께 묶다

**배치 처리** : 컴퓨터에서 사람과 ==상호 작용 없이== 이어지는 프로그램(작업)들의 실행
- 사람과의 상호작용이 주력인 웹 애플리케이션과는 지향점이 다르다.

**Web** - 실시간 처리 / 상대적인 속도 / QA 용이성
- 개발자가 인지하지 못했던 부분을 QA가 잘 찾아줄 수 있음

**Batch** - 후속 처리 / 절대적인 속도 / QA 복잡성
- QA가 DB 까보고 자바 코드 까보지는 않으니까 힘들다

<br>

==**배치 애플리케이션 : 개발자가 정의한 작업을 한 번에 일괄처리하는 애플리케이션, 단발성으로 대용량의 데이터를 처리하는 애플리케이션**==
- ex) 매출 데이터를 이용한 일매출 집계
- ex) 매우 큰 데이터를 활용한 보험급여 결정
- ex) 트랜잭션 방식으로 포맷, 유효성 확인 및 처리가 필요한 내부 및 외부 시스템에서 수신한 정보를 기록 시스템으로 통합
- ex) 대용량 데이터를 활용한 크롤링을 해야한다. 사용자의 접속이 거의 없는 시간대에 주기적으로 시도하기 위해 배치를 적용할 수도 있음

<br>

==**배치 애플리케이션이 필요한 상황**==
- **일정 주기**로 실행해야 할 때
- 실시간 처리가 어려운 **대량의 데이터**를 처리해야 할 때
- 어떤 작업을 하나의 애플리케이션에서 수행하면 성능 저하를 유발할 수 있으니 배치 애플리케이션을 구현해보자.

<br>

==**웹 애플리케이션이 아닌 배치 애플리케이션으로 하는 이유**==

- 전 날의 데이터를 집계하는 상황에, 웹 애플리케이션(톰캣 + Spring MVC)를 이용한다면, 아주 큰 데이터를 읽고, 가공하고, 저장하는 동안에 해당 서버는 순식간에 CPU, I/O 등의 자원을 다 써서 다른 요청을 처리하지 못하게 될 것
- 집계 기능이 하루에 1번만 수행된다고 하면, 이 기능을 위해 API를 구성하는 것은 낭비
- 데이터가 너무 많아서 처리 중 실패하면, 다시 처음부터 해야하는데, 이어서 할 수 없을까

<br>

==**배치 애플리케이션의 조건**==

-   대용량 데이터 : 배치 어플리케이션은 대량의 데이터를 가져오거나, 전달하거나, 계산하는 등의 처리를 할 수 ​​있어야 함
-   자동화 : 배치 어플리케이션은 심각한 문제 해결을 제외하고는 **사용자 개입 없이 실행**되어야 함
-   견고성 : 배치 어플리케이션은 잘못된 데이터를 충돌/중단 없이 처리할 수 있어야 함
-   신뢰성 : 배치 어플리케이션은 무엇이 잘못되었는지를 추적할 수 있어야 함 (로깅, 알림)
-   성능 : 배치 어플리케이션은 **지정한 시간 안에 처리를 완료**하거나 동시에 실행되는 **다른 어플리케이션을 방해하지 않도록 수행**되어야 함

<br>

### 배치 vs 스케쥴러

**스케쥴링이란?** : 매 시간, 지정한 시간에 지정한 동작을 수행하는 행위
- 일괄처리를 뜻하는 배치와는 다른 의미이다.

Spring Batch와 스케쥴러인 Spring Quartz를 비교하는 경우가 있는데 이는 잘못된 비교이다.
- 둘의 역할은 완전 다름
- Quartz는 스케쥴러의 역할이다. **Batch처럼 대용량 데이터 배치 처리에 대한 기능 지원 X**
- Batch는 배치 처리의 역할이다. **Quartz처럼 다양한 스케쥴 기능 지원 X**
- 따라서, 보통 Batch와 Quartz를 조합해서 함께 사용

==**정해진 스케쥴마다 Quartz가 Spring Batch를 실행하는 구조**==

<br>

### 배치 도메인 용어

![](brain/image/dog-week09-1.png)

- **Job** : 배치처리 과정을 하나의 단위로 만들어 놓은 객체
	- JobInstance : 논리적인 Job의 실행 단위, JobParameters를 이용하여 구분
		- ex) 1월 1일 실행, 1월 2일 실행 ...
	- JobParameters : String, Double, Long, Date 4가지 형식만 지원
	- JobExecution : JobInstance에 대한 실행 시도 관련 객체
		- 상태/시작시간/종료시간/생성시간 등의 정보 가짐
- **JobLauncher** : Job을 실행하기 위한 런처
- **Step** : 하나의 Job은 여러 Step으로 구성될 수 있음
	- Item : 작업에 사용하는 데이터를 의미
	- ItemReader : Step에서 Item을 읽어오는 인터페이스
	- ItemWriter : 처리된 Data를 Writer 할 때 사용, **기본적으로 Item을 Chunk로 묶어 처리**
	- ItemProcessor : Reader에서 읽어온 item 데이터를 처리하는 역할
- **JobRepository** : Job, JobLauncher, Step에 대한 정보 관리

<br>

![](brain/image/dog-week09-2.png)

- **Step** : Batch Job의 독립적이고 순차적인 단계를 함축한 Domain 객체
	- 고유한 JobExecution과 관련된 개별 **StepExecution 존재**
- **StepExecution** : Step의 단일 실행을 시도하는 기술적인 개념, 각각의 Step 마다 StepExcecution이 생성되며, Step이 실패하면 이후 Step을 실행하지 않음
	- 각 Step에는 ExecutionContext를 포함
- **ExecutionContext** : 통계, 상태 정보와 같이 일괄 실행에서 유지해야하는 모든 데이터를 의미. 재시작에 용이한 것이 이것 때문

<br>

### Spring Batch 활용

![](brain/image/dog-week09-3.png)

- 프레임워크를 이용하기 때문에 JobLanucher, JobRepository는 고려 X

<br>

![](brain/image/dog-week09-4.png)

- Job은 여러 개의 Step, Step은 여러 개의 Tasklet으로 구성
	- Tasklet은 하나의 메서드로 구성되어 있는 간단한 인터페이스
	- 이 메서드는 실패를 알리기 위해 예외를 반환하거나 throw 할 때까지 execute 반복호출
- Tasklet은 **익명 Tasklet** / **Chunk Oriented Tasklet**으로 나뉨

<br>

![](brain/image/dog-week09-5.png)

==**Chunk 지향 처리**== 
- Spring Batch에서 Chunk는 **커밋 row 수**를 의미
- 배치 처리에서 commit되는 row 수라는 의미는 chunk 단위로 트랜잭션을 수행하니까 실패시 chunk 단위 만큼 rollback 된다는 의미
- 읽기(Read) : Database에서 배치처리를 할 Data를 읽어옴
- 처리(Processing) : 읽어온 Data를 가공, 처리 (필수사항X)
- 쓰기(Write) : 가공, 처리한 데이터를 Database에 저장

<br>

==**Spring Batch에는 다양한 ItemReader, ItemWriter가 존재**==
- 대용량 배치 처리 시, Item을 읽어올 때 Cursor 기반 처리보다 Paging 처리하는 것이 효과적
	- Cursor 기반 처리는 데이터를 한 건씩 처리 + 모든 결과를 메모리에 할당해서 메모리 사용량 증가 + 모든 데이터 처리까지 커넥션 유지 + 멀티스레드 환경에서 동시성 이슈 발생으로 동기화 처리 필요
	- Paging 기반 처리는 페이지 사이즈만큼 데이터를 한 번에 처리 + 페이지 사이즈 만큼 커넥션을 맺고 끊음 + 페이징 결과만 메모리에 할당 + 멀티스레드 환경에서 thread-safety를 보장하여 별도 동기화 처리 불필요
- Spring Batch Reader에서 이러한 Paging 처리 지원
- 적절한 Paging 처리 + Chunk Size(한 번에 처리될 트랜잭션)를 설정하여 효과적인 배치 처리 가능

<br>

==**Paging Size와 Chunk Size를 동일하게 설정하는 것을 권장**==
- 예를 들어, Paging size가 5, Chunk size가 10인 경우 2번의 read 이후 1번의 트랜잭션 수행됨
- 즉, 한 번의 트랜잭션을 위해 2번의 쿼리 수행이 발생하는 것
- 1번의 read 쿼리 수행 시 1번의 트랜잭션을 위해 두 설정의 값을 일치시키는게 좋은 성능 향상방법

<br>

### Batch 실행

==**스프링 배치 실행 방법**==은 크게 두가지로 나뉨
1. **커맨드 라인 러너(CommaindLineRunner)** : jar로 만들어놓고 CLI로 실행
2. **애플리케이션 러너(ApplicationRunner)** : 자바 코드 내에서 실행

<br>

==**스프링 배치 관리 도구**==
- Cron
	- 리눅스 작업 스케쥴러대로 jar 실행
- Spring MVC + API Call
	- 코드 내에 rest api 같이 만들어놓고 호출해서 실행하는 방법
	- 권장하지 않음
- Spring Batch Admin
	- Deprecated 되었음
- ==**Quartz + Admin**==
	- 스케쥴러 프레임워크 + 관리자 페이지 구현
- ==**CI Tool (Jenkins, Teamcity 등등)**==

<br>

CI Tool과 Spring Batch가 너무 잘어울린다. Jenkins의 장점을 살펴보면

- **Integration** (Slack, Email 등)
	- 실패하면 성공하면 슬랙이나 이메일로 알림 보내! 메일 보내!
- **실행 이력 / 로그 관리 / Dashboard** 등 UI가 잘되어있음
- **다양한 실행 방법**
	- Rest API / 스케쥴링 / 수동 실행
- **계정 별 권한 관리**
- **파이프라인**
	- ![](brain/image/dog-week09-6.png)
	- Job 내부에 Step을 여러 개 설계하는 것보다 젠킨스 파이프라인 내부에 여러 Job을 넣는 것을 권장함
	- Job을 단독으로 실행할 수 있도록 설계하는 것이 유지보수에 더 좋아서
- **Web UI + Script** 둘 다 사용 가능
- **Plugin** (Ansible, Github, Logentries 등)

<br>

### Chunk 최적화

- 구체적인 가이드 존재 X
- 설계한 비즈니스 로직에 대해 가장 효율적인 단위 설정해야 함
- 여러 개의 배치 작업을 구성하는 경우, 다른 배치 작업에 영향 주면 안됨
	- 스프링 배치에서는 chunk 사이즈만큼 메모리에 데이터를 적재해야 하기 때문에 다른 배치에서 사용할 수 있는 메모리가 줄어들 수 있음

<hr>

## 아키텍처

### 모놀리식 아키텍처

==**모놀리식 아키텍처 (Monolithic Architecture)**==
- 전통의 아키텍처를 지칭
- 소프트웨어의 모든 구성요소가 한 프로젝트에 통합되어 있는 형태
- 애플리케이션의 한 프로세스에 대한 수요가 급증하면 아키텍처 전체를 확장해야함
- 일반적으로 성능 향상을 위해 서버 스펙을 향상시키는 scale up을 고려

<br>

==**모놀리식 아키텍처에서 프로젝트 규모가 너무 커지면 어떻게 분리할까?**==
- **멀티 모듈**을 이용하여 분리
- 응집도는 커지되, 결합도는 낮아짐

<br>

==**모놀리식 아키텍처에서 배포속도가 느린 단점을 완화하는 방식은?**==
- 무중단 배포 이용
	- 블루-그린 배포
	- 카나리 배포
	- 롤링 배포
	- 위에서부터 주로 사용하는 것 순서
	- <a href='https://hudi.blog/zero-downtime-deployment/' target='_blank'>링크 참조</a>

<br>

### MSA

==**마이크로 서비스 아키텍처 (MSA, Micro Service Architecture)**==
- 하나의 큰 애플리케이션을 여러 개의 작은 서비스 유닛으로 쪼개어 변경과 조합이 가능하도록 만든 아키텍처
- 각 마이크로 서비스는 상호 통신 가능 -> 이를 통해 전체 서비스 구성
- 애플리케이션이 독립적인 구성 요소로 구축, 각 애플리케이션 프로세스가 서비스로 실행
	- 이러한 서비스는 경량 API를 사용하여 잘 정의된 인터페이스를 통해 통신
	- 서비스는 비즈니스 기능을 위해 구축, 서비스마다 한 가지 기능을 수행

<br>

==**MSA의 장애추적, 모니터링, 매니징의 어려움과 같은 단점을 해결할 수 있는 방안?**==
- ELK (ElasticSearch 분석엔진 , Logstash 데이터 수집 및 로그 파싱 엔진, Kibana 분석 및 시각화 플랫폼)
- EFK (데이터 콜렉터를 Logstash가 아닌 Fluentd를 사용)

<br>

==**MSA의 테스트/트랜잭션을 다루기 어려움과 같은 단점을 해결할 수 있는 방안?**==
-   보상 트랜잭션 : 한 트랜잭션 처리에서 오류 발생 시, 에러 처리 로직을 구현해줌으로써 트랜잭션 일관성 유지
-   복합 서비스 : 트랜잭션을 묶어야 하는 두 개의 시스템을 트랜잭션을 지원하는 네이티브 프로토콜을 이용해서 구현 후 API로 노출시키는 방법
-   유즈케이스를 하나 두는거! 이 데이터가 맞아!? 아냐!? 검증해주는 역할

### 모놀리식 vs MSA

-   ==**Monolithic(모놀리식)**==
    -   장점
        -  개발 환경이 같아서 복잡하지 않다. 소규모 테스트에서 합리적
        -  개발, 빌드, 배포, 테스트가 용이
	        - End-To-End 테스트가 용이 (MSA의 경우 필요한 서비스들을 모두 동작시켜야함)
	    - 서비스 간 통신을 위해 네트워크를 타지 않아도 돼서 빠르다
    -   단점
        -   프로젝트가 커지면 **빌드, 배포 시간이 오래걸린다.**
        -   작은 수정사항이 있어도 전체를 다시 빌드하고 배포해야 함
        -   많은 양의 코드가 몰려있어 개발자가 모두를 이해하는데 어렵고 유지보수하기도 어렵다.
        -   **일부분의 오류가 전체에 영향을 미친다.**
-   ==**MSA**==
    -   장점
        -   서비스 단위로 개발을 진행하기에 해당 부분을 온전히 이해하기 쉽다.
        -   독립적인 서비스로 배포가 빠르고 모놀리식보다 가벼움
        -   각 서비스에 따라 개별적으로 서버를 나눌 수 있어 메모리 및 cpu 관리에 효율적
        -   **새로 추가되는 부분은 빠르게 수정 및 배포가 가능하다.**
        -   해당 기능에 맞는 기술, 언어 등을 선택하여 사용할 수 있다.
        -   **문제가 생기면 해당 기능에만 문제가 생긴다.**
	        - 서버 및 프로세스 장애 시, 격리 및 복구가 쉬워 장애가 전체 서비스로 확장될 가능성이 적음
    -   단점
        -   **서비스가 분산되어 있어 관리하기 어렵다.**
	        - 트랜잭션 관리, 장애 추적 및 테스트 등이 쉽지 않음
	        - 서비스마다 DB가 분리되어 데이터의 조회가 어렵고 데이터의 중복 발생
        -   **테스트가 불편하다.**
        -   서비스 간 호출 시 REST API 사용으로 인한 통신비용, Latency(지연시간) 증가
        - 전체 서비스가 커짐에 따라 복잡도가 기하급수적으로 높아질 수 있음


<hr>

## DDD

**도메인(domain)**
- 사용자가 사용하는 것, 소프트웨어로 해결하고자 하는 문제 영역
- 비즈니스 영역

==**DDD(Domain-Driven-Design, 도메인 주도 설계) : 도메인에 관련된 문제를 해결하도록 도메인 패턴을 중심에 놓고 설계하는 방식**==
- 일반적으로 사용하는 데이터 중심의 접근법을 탈피하여 순수한 도메인의 모델과 로직에 집중
- 복잡한 도메인을 해결하는 것을 높은 우선순위로 생각해 서비스를 만들어 나가는 방법
- 도메인의 복잡성을 조금 더 쉽게 다룰 수 있게 도와주는 도구

<br>

예를 들어, 개발 프로세스를 생각해보자

![](brain/image/dog-week09-7.png)

1. 요구사항 분석
2. 설계
3. 구현

<br>

![](brain/image/dog-week09-8.png)

- 개발자가 모델링 과정에서 참여하지 않았다면 이렇게 불일치가 발생할 수 있음
- 이로 인해 DDD는 **보편적인(ubiquitous) 언어**의 사용이라고 함
	- 도메인 전문가와 소프트웨어 개발자 간의 커뮤니케이션 문제를 없앰
	- 상호가 이해할 수 있고 모든 문서와 코드에 이르기까지 동일한 표현과 단어로 구성된 단일화된 언어체계를 구축해나가는 과정임

<br>

==**데이터 주도 설계?**==
- 객체가 가져야 할 데이터에 초점을 두고 설계하는 방식
- 객체 자신이 포함하고 있는 데이터를 조작하는 데 필요한 행동을 정의

```java
public class Movie {
    private String title;
    private Duration runningTime;
    private Money fee;
    private List<DiscountCondition> discountConditions;

    private MovieType movieType;
    private Money discountAmount;
    private double discountPercent;

    // getter, setter..
}
```

- 설계 시 협력에 대한 고민을 하지 않아서 **과도한 접근자와 수정자가 탄생**
	- 객체가 어디서 사용될 지 모르니까 최대한 많이 만들어서 그럼
- 대부분의 구현이 노출되기 때문에 **캡슐화의 원칙을 위배함**
- 내부 구현이 public interface에 노출되며, 이때문에 다른 객체들과 **강하게 결합**함

<br>

### DDD 사용 이유

- 도메인 모델의 적용 범위를 구현까지 확장하여 도메인 지식을 구현 코드에 반영
- 공통의 언어(유비쿼터스 언어)를 사용하여 도메인과 구현을 충분히 만족하는 모델 생성
- 실제 코드로 구현 가능한 현실성 있는 도메인 모델 분석과 그것을 추상화하는 설계
- 쉽게 말해서, ==**모듈간의 의존성 최소화 (결합도 낮추기), 응집성 최대화 하는 것이 목표**==


<hr>

## 참고

- <a href='https://ittrue.tistory.com/292' target='_blank'>Querydsl이란</a>
- <a href='https://www.youtube.com/watch?v=zMAX7g6rO_Y' target='_blank'>이동욱님의 우아콘2020, 수십억건에서 Querydsl 사용하기</a>
- <a href='https://velog.io/@youngerjesus/%EC%9A%B0%EC%95%84%ED%95%9C-%ED%98%95%EC%A0%9C%EB%93%A4%EC%9D%98-Querydsl-%ED%99%9C%EC%9A%A9%EB%B2%95' target='_blank'>우아한 형제들의 Querydsl 활용법</a>
- <a href='https://www.youtube.com/watch?v=BnS6343GTkY' target='_blank'>김영한님의 우아콘2020, 배달의민족 마이크로서비스 여행기</a>
- <a href='https://jojoldu.tistory.com/324?category=902551' target='_blank'>이동욱 님의 Spring Batch 가이드</a>
- <a href='https://khj93.tistory.com/entry/Spring-Batch%EB%9E%80-%EC%9D%B4%ED%95%B4%ED%95%98%EA%B3%A0-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0' target='_blank'>히진쓰의 서버사이드 기술 블로그 Spring Batch란? 이해하고 사용하기</a>
- <a href='https://heowc.dev/programming-study/repo/spring/spring-batch/domain-launage-of-batch.html' target='_blank'>허원철의 개발 블로그 - spring batch</a>
- <a href='https://www.youtube.com/watch?v=_nkJkWVH-mo' target='_blank'>이동욱님의 우아한테크세미나2019, 우아한 스프링배치</a>
- <a href='https://www.youtube.com/watch?v=1xJU8HfBREY&t=49s' target='_blank'>테코톡 - 라빈의 Spring Batch</a>
- <a href='https://www.youtube.com/watch?v=VIfNipL5KkU' target='_blank'>테코톡 - 라테의 도메인 주도 설계</a>
- <a href='https://incheol-jung.gitbook.io/docs/q-and-a/architecture/ddd' target='_blank'>Incheol's TECH BLOG - DDD</a>