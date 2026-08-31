---
title: "섹션4 - 섹션8"
date: "2023-03-25 16:15"
enableToc: true
tags: ["🖥️ 김영한 스프링 입문"]
---

> 해당 게시글은 김영한님 <a href='https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%EC%9E%85%EB%AC%B8-%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8' target='_blank'>스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술</a>강좌의 섹션4부터 섹션8까지 정리한 내용입니다.

<hr>

## 스프링 빈과 의존관계

스프링 빈을 등록하는 방법은 2가지가 있다.
- 컴포넌트 스캔과 자동 의존관계 설정
- 자바 코드로 직접 스프링 빈 등록하기

### 컴포넌트 스캔, 자동 의존관계

- 지금까지 회원 서비스, 회원 리포지토리, 회원 객체를 만들었다.
- 이제 회원 컨트롤러가 회원 서비스를 통해 회원가입하고 회원 서비스를 통해 데이터를 조회할 수 있도록 ==**의존관계를 만들어야한다.**==

```java
@Controller  
public class MemberController {  
    
}
```

- 이렇게 `@Controller` 애노테이션 붙여놓으면, 기능은 없지만 스프링 컨테이너라는 스프링 통에 `@Controller` 애노테이션이 있는 MemberController를 객체로 만들어서 스프링이 통에 넣어둔다. 그리고 스프링이 관리를 한다. 

<br>

![](brain/image/spring-basic-01-5.png)

- 이를 ==**스프링 컨테이너에서 스프링 빈이 관리된다고 한다.**==
- 녹색이 생성된 객체, Bean 이다.

<br>

```java
@Controller  
public class MemberController {  
    private final MemberService memberService = new MemberService();  
}
```

- 이렇게 새로 만들어 쓸 수도 있지만, 사실 memberService의 기능들은 한 번만 인스턴스를 만들어놓고 기능을 돌려쓰면 된다.
- 그래서 이를 스프링 빈에 등록 해놓으면 싱글턴으로 딱 하나만 생성하니까 빈에 등록하도록 해보자.

<br>

```java
@Controller  
public class MemberController {  
  
    private final MemberService memberService;  
  
    @Autowired  
    public MemberController(MemberService memberService) {  
        this.memberService = memberService;  
    }  
}
```

- 생성자에 `@Autowired `가 있으면 ==**스프링이 연관된 객체를 스프링 컨테이너에서 찾아서 넣어준다.**== 이렇게 ==**객체 의존관계를 외부에서 넣어주는 것을 DI (Dependency Injection), 의존성 주입**==이라 한다.
- 이전 테스트에서는 개발자가 직접 주입했고, 여기서는 `@Autowired`에 의해 스프링이 주입해준다.

<br>

> **`@Autowired` 생략** : 생성자에 @Autowired를 사용하면 객체 생성 시점에 스프링 컨테이너에서 해당 스프링 빈을 찾아서 주입한다. 생성자가 1개만 있으면 @Autowired 생략 가능하다. <br><br>
> 의존성 주입 위치는 <a href='/brain/notes/interview/dog-study/dog-week03' target='_blank'>3주차 스터디</a>에서 **Spring DI** 참고

<br><br>

![](brain/image/spring-basic-02-1.png)

- 그러나, MemberService를 찾을 수 없다는 오류가 발생!

<br>

![](brain/image/spring-basic-02-2.png)

- MemberService는 순수한 자바 코드라서 스프링 빈에 등록되어있지 않음!
- `@Controller`는 애노테이션을 붙여놔서 스프링 빈으로 자동 등록됨

<br>

**한 번 컴포넌트 스캔 방식으로 등록해보자.**

<br>

```java {title="controller/MemberController.java"}
@Controller  
public class MemberController {  
  
    private final MemberService memberService;  
  
    @Autowired  
    public MemberController(MemberService memberService) {  
        this.memberService = memberService;  
    }  
}
```

<br>

```java {title="service/MemberService.java"}
@Service  
public class MemberService {  
  
    private final MemberRepository memberRepository;  
  
    @Autowired  
    public MemberService(MemberRepository memberRepository) {  
        this.memberRepository = memberRepository;  
    }
}
```

<br>

```java {title="repository/MemoryMemberRepository.java"}
@Repository  
public class MemoryMemberRepository implements MemberRepository { 
}
```

- `@Component` 애노테이션이 있으면 스프링 빈으로 자동 등록
- `@Component`를 포함하는 애노테이션을 스프링 빈으로 자동 등록 (들어가서 확인해보면 `@Componet`가 포함되어있음)
	- `@Controller`
	- `@Service`
	- `@Repository`
- `@SpringBootApplication`을 확인해보면 `@ComponentScan`이 있어서 컴포넌트 스캔되는 이유를 확인할 수 있음. 이때, 상위 패키지는 스캔하지 않음

<br>

실행 순서를 보면
1. Controller의 생성자에 `@Autowired`를 붙여서 연관된 객체인 MemberService를 스프링 컨테이너에서 자동으로 넣어줘야함
2. MemberService는 기본 자바코드라서 빈에 등록되어있지 않는 상태. `@Service`를 붙여서 컴포넌트 달아줌
3. MemberService의 생성자에 `@Autowired`를 붙여서 연관된 객체인 MemberRepository를 스프링 컨테이너에서 자동으로 넣어줘야함
4. 그런데 현재 MemberRespository는 인터페이스이고 실제로 구현체인 MemoryMemberRepository로 가서 `@Repository` 달아줌

![](brain/image/spring-basic-02-3.png)

- 최종적으로 이러한 의존관계가 형성되면서 스프링 빈 등록 완료!

> **참고** : 스프링은 스프링 컨테이너에 스프링 빈을 등록할 때, 기본으로 싱글톤으로 등록한다(유일하게 하나만 등록해서 공유한다) 따라서 같은 스프링 빈이면 모두 같은 인스턴스다. 설정으로 싱글톤이 아니게 설정할 수 있지만, 특별한 경우를 제외하면 대부분 싱글톤을 사용한다. <br><br>
> 관련 내용은 <a href='/brain/notes/interview/dog-study/dog-week05' target='_blank'>5주차 스터디</a>에서 **Bean 스코프** 참고

<br>

### 자바 코드로 직접 스프링 빈 등록

- Controller 클래스는 그대로 놔두고 나머지 클래스에서 작성된 `@Component`, `@Autowired` 모두 지우고 실습 진행

```java {title="SpringConfig.java"}
@Configuration  
public class SpringConfig {  
  
    @Bean  
    public MemberService memberService() {  
        return new MemberService(memberRepository());  
    }  
  
    @Bean  
    public MemberRepository memberRepository() {  
        return new MemoryMemberRepository();  
    }  
}
```

- 향후 메모리 리포지토리를 다른 리포지토리로 변경할 예정이므로, 컴포넌트 스캔 방식 대신에 자바 코드로 스프링 빈을 설정하겠다.
	- 다형성 때문에 코드 하~나도 안바꾸고 return만 바꾸면 된다.

>  **참고** : XML로 설정하는 방식도 있지만 최근에는 잘 사용하지 않으므로 생략한다.
    
>  **참고** : DI에는 필드 주입, setter 주입, 생성자 주입 이렇게 3가지 방법이 있다. 의존관계가 실행중에 동적으로 변하는 경우는 거의 없으므로 생성자 주입을 권장한다.
    
>  **참고** : 실무에서는 주로 정형화된 컨트롤러, 서비스, 리포지토리 같은 코드는 컴포넌트 스캔을 사용한다. 그리고 정형화 되지 않거나, 상황에 따라 구현 클래스를 변경해야 하면 설정을 통해 스프링 빈으로 등록한다.
    
>  **주의** : @Autowired 를 통한 DI는 helloController , memberService 등과 같이 스프링이 관리하는 객체에서만 동작한다. 스프링 빈으로 등록하지 않고 내가 직접 생성한 객체에서는 동작하지 않는다.


<hr>

## 회원 관리 예제 - MVC

### 웹 기능 - 홈 화면 추가

<br>

```java {title="controller/HomeController.java"}
@Controller  
public class HomeController {  
  
    @GetMapping("/")  
    public String home() {  
        return "home";  
    }  
}
```

- HomeController를 만들고 `templates/home.html`을 만들어서 매핑되게 한다.

![](brain/image/spring-basic-01-2.png)

- 저번에 `static/index.html`에 만들었던 것이 실행되지 않고 `templates/home.html`이 실행되는 이유는 바로 이것 때문이다. 
- 먼저 관련 컨트롤러와 매핑된 html 파일을 찾고 없으면 정적 컨텐츠를 찾는 것!

<br>

### 웹 기능 - 등록

<br>

```java {title="controller/MemberForm.java"}
public class MemberForm {  
    private String name;  
  
    public String getName() {  
        return name;  
    }  
  
    public void setName(String name) {  
        this.name = name;  
    }  
}
```

- 웹 등록 화면에서 데이터를 전달받을 폼 객체

<br>

```java {title="controller/MemberController.java"}
@Controller  
public class MemberController {  
  
    private final MemberService memberService;  
  
    @Autowired  
    public MemberController(MemberService memberService) {  
        this.memberService = memberService;  
    }  
  
    @GetMapping("/members/new")  
    public String createForm() {  
        return "members/createMemberForm";  
    }  
  
    @PostMapping("/members/new")  
    public String create(MemberForm form) {  
        Member member = new Member();  
        member.setName(form.getName());  
  
        memberService.join(member);  
  
        return "redirect:/";  
    }  
}
```

- 회원 컨트롤러에서 회원을 실제로 등록하는 것은 `@PostMapping` 부분

<br>

### 웹 기능 - 조회

- 대충 타임리프 써서 조회는 했지만, 메모리에 저장되는거라 서버 내렸다가 다시 올리면 데이터 다날라감
- 이건 본격적으로 DB 연결해야겠지 ~


<hr>

## 스프링 DB 접근 기술

### H2 DB 설치

- 개발이나 테스토 용도로 가볍고 편리한 DB이다. 웹 화면 제공해준다.

**H2 설치, 사용법**

1. <a href='https://www.h2database.com/html/download-archive.html' target='_blank'>h2 archive</a>에서 1.4.200 버전을 다운받고 압축 풀자.
2. 최초에 권한을 `chmod 755 h2.sh`로 줘야한다. 
	- `h2.sh`는 `h2폴더/bin/`에 위치한다.
3. 실행은 해당 폴더로 이동한 다음 `./h2.sh`로 실행하자
4. 데이터베이스 파일 생성 방법
	- 최초 한번만 `jdbc:he:~/test`
	- `~/test.mv.db` 파일 생성 확인
	- 확인했으면 `jdbc:h2:tcp://localhost/~/test`로 바꾸고 여기로 접속 (이는 소켓으로 연결한다는 의미)
	- 만약 원활하지 않으면 `~/test.mv.db` 지우고 재설치
	- 원활하게 접속 안되면 주소창 확인해보자. `ip:8082/login~` 이렇게 ip가 나와있으면 ip를 지우고 `localhost` 붙이면 됨
1. `build.gradle`에 아래 코드 추가

```java
implementation 'org.springframework.boot:spring-boot-starter-jdbc'
runtimeOnly 'com.h2database:h2'
```

<br>

**더 편하게 쓰기 위한 alias**

1. `code ~/.zshrc`에서 `alias h2start="/Users/jaeyun/Desktop/Coding/h2/bin/h2.sh"` 추가
2. `source ~/.zshrc`로 적용
3. 이제 터미널에 `h2start`만 치면 됨!

<br>

**SQL문 관리**

- SQL문을 프로젝트 루트 경로에 `sql` 폴더 하나 만들고 `ddl.sql` 파일 하나 만들자
- 내부에 SQL문 적어놓으면 나중에 github 관리할 때도 편하고 좋다.

<br>

### 순수 JDBC

- 옛날 개발자들이 어떻게 Java와 DB를 연결했는지 봐보자.
- 지금은 전혀 쓰지않으니 가볍게 보도록하자!

<br>

**`build.gradle` 파일에 jdbc, h2 데이터베이스 관련 라이브러리 추가**

```java
implementation 'org.springframework.boot:spring-boot-starter-jdbc'
runtimeOnly 'com.h2database:h2'
```

<br>

**`resources/application.properties`에 스프링부트 DB 연결 설정 추가**

<br>

```java
spring.datasource.url=jdbc:h2:tcp://localhost/~/test  
spring.datasource.driver-class-name=org.h2.Driver  
spring.datasource.username=sa
```

- Spring Boot 2.4부터는 `spring.datasource.username=sa`를 꼭 추가해야함
	- 추가안하면 `Wrong user name or password` 오류 발생
	- 마지막에 공백 붙어도 오류 발생

<br>

순수 JDBC 코드는 적어놓진 않겠음.

<br>

```java
@Configuration  
public class SpringConfig {  
  
    private DataSource dataSource;  
  
    @Autowired  
    public SpringConfig(DataSource dataSource) {  
        this.dataSource = dataSource;  
    }  
  
    @Bean  
    public MemberService memberService() {  
        return new MemberService(memberRepository());  
    }  
  
    @Bean  
    public MemberRepository memberRepository() {  
        return new JdbcMemberRepository(dataSource);  
    }  
}
```

- ==**DataSource는 데이터베이스 커넥션을 획득할 때 사용하는 객체이다.**==
- ==**스프링 부트는 데이터베이스 커넥션 정보를 바탕으로 DataSource를 생성하고 스프링 빈으로 만들어둔다. 그래서 DI를 받을 수 있다.**==

<br>

![](brain/image/spring-basic-02-4.png)

![](brain/image/spring-basic-02-5.png)

- ==**개방-폐쇄 원칙 (OCP, Open-Closed Principle)**==
	- 확장에는 열려있고, 수정, 변경에는 닫혀있다.
	- 자바 객체지향원리의 다형성을 잘 활용한 예시
- 스프링의 DI(Dependency Injection)을 사용하면 **기존 코드를 전혀 손대지 않고, 설정만으로 구현 클래스를 변경**할 수 있다.

<br>

### 스프링 통합테스트

- 스프링 컨테이너와 DB까지 연결한 통합 테스트를 진행해보자.
- ==**근데 사실 최소한의 단위로 하는 순수한 단위 테스트가 훨씬 좋은 테스트일 확률이 크다. 스프링 컨테이너 없이 테스트 할 수 있도록 훈련하자.**==

```java {title="MemberServiceIntegrationTest.java"}
@SpringBootTest  
@Transactional  
class MemberServiceIntegrationTest {  
  
    @Autowired MemberService memberService;  
    @Autowired MemberRepository memberRepository;  
  
    @Test  
    void 회원가입() {  
        // given  
        Member member = new Member();  
        member.setName("spring");  
  
        // when  
        Long saveId = memberService.join(member);  
  
        // then  
        Member findMember = memberService.findOne(saveId).get();  
        assertThat(member.getName()).isEqualTo(findMember.getName());  
    }
}
```

- 어차피 테스트 코드니까 간단하고 빠른게 짱이라서 그냥 `@Autowired` 필드 주입 했음
- `@SpringBootTest` : 스프링 컨테이너와 테스트를 함께 살펴본다.
- ==**데이터베이스는 기본적으로 트랜잭션이란 개념이 있는데, insert 쿼리로 데이터를 넣은 이후 commit을 해야 반영이 된다. 보통 기본적으로 auto-commit한다. 그래서 insert 쿼리는 커밋하기 이전에는 DB에 반영이 안된다는 의미**==이다.
- ==**`@Transactional` : DB에 쿼리를 다 날리고 커밋하기 이전에 롤백(Rollback)해서 DB에 반영되지 않게 하는 것이다.**== 테스트 케이스에 이 애노테이션이 있으면, 테스트 시작 전에 트랜잭션을 시작하고, 테스트 완료 후에 항상 롤백한다. 이렇게하면 DB에 데이터가 남지 않으므로 다음 테스트에 영향을 주지 않는다.
	- 테스트 케이스의 테스트 메서드 각각 하나 하나마다 적용된다.
	- 트랜잭션 시작 - 테스트하고 - 끝나면 롤백, 다시 트랜잭션 시작 - 테스트하고 - 끝나면 롤백

<br>

### 스프링 JdbcTemplate

- 순수 Jdbc와 동일한 환경설정
- 스프링 JdbcTemplate과 MyBatis 같은 라이브러리는 JDBC API에서 본 반복 코드를 대부분 제거해준다. 하지만, SQL은 직접 작성해야한다.

```java {title="JdbcTemplateMemberRepository.java"}
public class JdbcTemplateMemberRepository implements MemberRepository {  
  
    private final JdbcTemplate jdbcTemplate;  
  
    // @Autowired, 생성자가 딱 1개라 생략 가능  
    public JdbcTemplateMemberRepository(DataSource dataSource) {  
        this.jdbcTemplate = new JdbcTemplate(dataSource);  
    }
}
```

- JdbcTemplate은 **DataSource를 의존성 주입**해줘야 한다.

<br>

<details>
<summary><strong>JdbcTemplateMemberRepository 코드보기</strong></summary>

```java
public class JdbcTemplateMemberRepository implements MemberRepository {  
  
    private final JdbcTemplate jdbcTemplate;  
  
    // @Autowired, 생성자가 딱 1개라 생략 가능  
    public JdbcTemplateMemberRepository(DataSource dataSource) {  
        this.jdbcTemplate = new JdbcTemplate(dataSource);  
    }  
  
    @Override  
    public Member save(Member member) {  
        SimpleJdbcInsert jdbcInsert = new SimpleJdbcInsert(jdbcTemplate);  
        jdbcInsert.withTableName("member").usingGeneratedKeyColumns("id");  
  
        Map<String, Object> parameters = new HashMap<>();  
        parameters.put("name", member.getName());  
  
        Number key = jdbcInsert.executeAndReturnKey(new MapSqlParameterSource(parameters));  
        member.setId(key.longValue());  
        return member;  
    }  
  
    @Override  
    public Optional<Member> findById(Long id) {  
        List<Member> result = jdbcTemplate.query("select * from member where id = ?", memberRowMapper(), id);  
        return result.stream().findAny();  
    }  
  
    @Override  
    public Optional<Member> findByName(String name) {  
        List<Member> result = jdbcTemplate.query("select * from member where name = ?", memberRowMapper(), name);  
        return result.stream().findAny();  
    }  
  
    @Override  
    public List<Member> findAll() {  
        return jdbcTemplate.query("select * from member where id = ?", memberRowMapper());  
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

</details>

<br>

<details>
<summary><strong>SpringConfig 코드보기</strong></summary>

```java
@Configuration  
public class SpringConfig {  
  
    private DataSource dataSource;  
  
    @Autowired  
    public SpringConfig(DataSource dataSource) {  
        this.dataSource = dataSource;  
    }  
  
    @Bean  
    public MemberService memberService() {  
        return new MemberService(memberRepository());  
    }  
  
    @Bean  
    public MemberRepository memberRepository() {  
//        return new MemoryMemberRepository();  
//        return new JdbcMemberRepository(dataSource);  
        return new JdbcTemplateMemberRepository(dataSource);  
    }  
}
```

</details>

<br>

### JPA

<br>

### 스프링 데이터 JPA

<hr>

## AOP

### AOP가 필요한 상황

### AOP 적용