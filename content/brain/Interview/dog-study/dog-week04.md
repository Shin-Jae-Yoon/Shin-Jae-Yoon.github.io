---
title: "4주차 - Spring 웹"
date: "2023-03-11 02:50"
enableToc: true
tags: [""]
weight: 5
---

<hr>

>[!note] 4주차 스터디
><br>
> **TOPIC** <br>
> - Web Server, WAS
> - Servlet, Servlet Container
> - Filter, Interceptor
> - AOP

<br>

## Web Server, WAS

<br>

**Web Server**
-   인터넷을 기반으로 클라이언트에게 웹 서비스를 제공하는 컴퓨터

<br>

**흐름 과정**

-   클라이언트 : 웹서버에게 주소(url)를 가지고 통신 규칙(http)에 맞게 요청하면 알맞은 내용(html)을 응답받음
-   서버 : 클라이언트의 요청을 기다리고, 웹 요청(http)에 대한 데이터를 만들어서 응답한다. 이때, 데이터는 웹에서 처리할 수 있는 html, css, 이미지 등 ==**정적인 데이터**==로 한정
-   DB에서 데이터를 가져와서 전달해주는, 동적인 데이터를 줄 수 없을까? html은 프로그래밍 언어가 아니라서 이런게 불가능하다.

<br>

**Web Application Server**

-   웹 애플리케이션과 서버 환경을 만들어 동작시키는 기능을 제공하는 소프트웨어 프레임워크
-   웹 애플리케이션을 실행시켜 필요한 기능을 수행하고 그 결과를 웹 서버에게 전달
-   php, jsp, asp와 같은 언어들을 사용해서 ==**동적인 페이지**==를 생성할 수 있는 서버
-   프로그램 실행 환경과 데이터베이스 접속 기능 제공
-   비즈니스 로직 수행 가능
-   ==**웹 서버 + 웹 컨테이너**==
    -   컨테이너 : jsp, servlet을 실행시킬 수 있는 소프트웨어
    -   자바 계열에서는 웹 애플리케이션 컨테이너라고 부름
    -   웹 애플리케이션 컨테이너 : 웹 애플리케이션이 배포되는 공간

<br>

**예시**

-   Web Server : Apache, nginx, Microsoft IIS
-   Web Application Server : Tomcat, Jetty, JBoss, IBM WebSphere, 티맥스 JEUS(제우스)

**결론 : “상황에 따라 변하는 정보를 제공할 수 있는가”**

-   Web Server : No. 정적인 페이지만!
-   Web Application Server : Yes. 동적인 페이지 가능!

<br>

### WAS 앞 단에 Web Server

Q. **그러면 드는 생각이, WAS가 어차피 다 해주는 Web Server가 굳이 왜 필요할까?**

( = Web Server를 같이 사용했을 때의 장점 )

<br>

1.  **책임 분할을 통한 서버 부하 방지**
    -   정적 컨텐츠는 Web Server, 동적 컨텐츠는 WAS가 담당
    -   WAS는 DB 조회 등 페이지를 만들기 위한 다양한 로직을 처리하는데, 단순한 정적 컨텐츠를 WAS에서 제공한다면 다른 작업에 사용하는 리소스들로 인해 지연이 생겨날 수 있다. (그런데, tomcat 5.5 이상부터는 성능이 크게 떨어지지 않는다고 한다.)

2.  **여러 대의 WAS 로드밸런싱**
    -  WAS가 처리해야 하는 요청을 여러 WAS가 나누어서 처리할 수 있도록 설정
    - 앞 단에 Web Server를 두고 뒷단에 여러대의 WAS를 둔다면, WAS가 처리해야하는 요청을 Web Server에서 여러 WAS에 뿌려주는 것

3. 여러 대의 WAS Health check
	- <details><summary><strong>Health check란?</strong></summary> 
	    Web Server가 로드밸런싱 해주다보면, 특정 WAS에서 동작이 제대로 안 될 수 있는 경우가 있는데, 웹 서버에서 WAS가 정상적으로 동작하고 있는지 http 요청을 보내서 서버의 상태를 확인하는 기능</details>
	 -   서버에 주기적으로 HTTP 요청을 보내 서버의 상태를 확인
	    (ex. 특정 url 요청에 200 응답이 오는지? 200이 오면 정상, 안오면 비정상이니까 비정상 서버로 인지를 하고 서버로 요청 전달하지 않게 설정 가능)
	-   Interval : health check를 통해 서버 상태를 확인하는 요청을 날리는 주기 (default : 5초)
	-   Fails : 아래의 경우 3회 연속 실패하면 서버가 비정상이라고 인지 (default : 1회)
	-   Passes : 서버가 다시 복구되어 요청이 2번 연속 성공하면 서버가 정상으로 인지 (default : 1회)

4.  **보안**
	-   리버스 프록시를 통해 실제 서버를 외부에 노출하지 않을 수 있다.
	 -   WAS 같은 경우, DB 관련 로직이나 DB 접근 권한을 가질 수 있기에 외부에 노출하면 위험할 수 있지만, 앞단에 웹 서버를 둬서 외부에 노출시키지 않는 것이다.
	-   물리적으로 분리하여 보안 강화
	    -   SSL에 대한 암복호화 처리에 Web Server를 사용
	    -   공격에 대해 Web Server를 앞 단에 두어 중요한 정보가 당긴 DB나 로직까지 (WAS까지) 전파되지 못하게 한다.

<br>

> [!note] Reverse Proxy <br>
> 클라이언트 - 웹 - Reverse Proxy Server - 서버의 구조로 서버의 정보를 클라이언트에게 감춰주는 녀석
> 1.  캐싱 (Forward Proxy와 동일)
> 2.  보안 : 서버 정보를 클라이언트로부터 숨김 <br>
> 	- 클라이언트는 요청할 때 서버 정보를 직접 알지 못함 <br>
> 	- 리버스 프록시가 자신이 알고있는 서버들에게 요청을 전달 <br>
> 	- Client는 Reverse Proxy를 실제 서버라고 생각하여 요청을 보낸다. 실제 서버의 IP가 노출되지 않는다.
> 3. Load Balancing

<br>

### 여러 대의 WAS 장점

1.  위에서 말한 것처럼 Load Balancing을 통한 서버 부하 분산
2.  fail over (장애극복), fail back
3.  뭐 이것도 보안이 있을 수 있겠네
4.  대용량 웹 애플리케이션의 경우 (여러 개의 서버 사용) Web Server와 WAS를 분리하여 무중단 운영을 위한 장애 극복에 쉽게 대응할 수 있다.
5.  다른 종류의 WAS로 서비스 가능

- fail over는 위에서 처럼 하나의 WAS가 작동을 중지한 경우 다른 WAS들로 돌릴 수도 있다는 개념
- fail back은 작동이 중지된 서버를 다시 재작동 시킨다는 의미
- 다른 종류의 WAS로 서비스 가능하다는건 하나의 서버에서 PHP application, Java application을 함께 사용할 수 있다는 말이다. 서버는 가운데에다가 두고 하나의 WAS에는 php application~ 다른 WAS에는 java application~ 이런 방식으로!

<br>

## Servlet, Servlet Container

- Servlet : WAS 안의 웹 컨테이너에 위치하며, **동적인 페이지**를 만드는데 사용되는 서버 프로그램
	- 서블릿이 존재하기 전에는 요청이 들어오면 HTTP 요청 메시지를 파싱하는 것부터 여러 부가 작업을 개발자가 수행해야 했다. 하지만 서블릿이 나오면서 부가적인 작업을 대신해주게 되었고, 개발자는 실직적인 비즈니스 로직에만 집중 할 수 있게 되었다.

- Servlet Container : WAS가 Web Server + Web Container라고 했었는데, Java 애플리케이션 진영에서는 이 웹 컨테이너를 Servlet Container라고도 한다.
	- 서블릿 컨테이너는 **서블릿의 생명주기**를 관리
	-   `init()` : 서블릿 초기화
	-   `service()` : HTTP 요청 유형을 확인하고 맞게 doGet, doPost, doPut 등 메서드를 호출하여 요청 처리
	-   `destroy()` : 서블릿 제거
	- ==서블릿 객체도 **싱글톤** 으로 관리되기 때문에 최초 요청 시점에 서블릿 객체를 초기화해서 서블릿 컨테이너에 보관하고 이후에는 같은 서블릿을 공유해서 사용한다.==

<br>

**대략적인 동작 과정**

1.  사용자가 URL을 클릭하면 HTTP Request를 Servlet Container로 보낸다.
    
2.  **Servlet Container는 쓰레드 풀에서 쓰레드를 꺼내 할당**해주고 HttpServletRequest, HttpServletResponse 두 객체를 생성한다.
    
3.  사용자가 요청한 URL을 분석하여 어느 서블릿에 대한 요청인지 찾는다.
    
4.  서블릿 컨테이너에 존재하지 않으면 초기화하고 있다면 가져와서 service() 메서드를 호출한다.
    
	-   Spring MVC의 경우 DispatcherServlet이 초기화되고 호출된다.

5.  service 메서드가 수행이 끝나면 HttpServletResponse 객체에 응답을 보낸다.

<br>

### Dispatcher Servlet

 **Spring Web MVC에서는 이 Servlet을 어떻게 사용할까? 없던 시절에는 어떻게 하였을까?**

-   Spring Web MVC가 없던 시절에서는 URL마다 서블릿이 한 개 필요했었고, get만 쓰고 싶다고 해도 서블릿 전체를 만들어야 했다. 또, servlet을 만들 때마다 Web.xml에 servlet 마다 mapping을 시켜줬어야 했었다.
-   Spring Web MVC 등장으로 Servlet이 Dispatcher Servlet 하나만 있어도 된다. 또, 디스패처 서블릿을 도입하면서 view를 강제로 분리시켜주는 효과가 생김

<br>

**Dispatcher Servlet의 동작**

1.  클라이언트의 요청을 디스패처 서블릿이 받음 (Dispatcher Servlet)
2.  요청 정보를 통해 요청을 위임할 컨트롤러를 찾음 (Handler Mapping)
3.  요청을 컨트롤러로 위임할 핸들러 어댑터를 찾아서 전달함 (Handler Adapter)
4.  핸들러 어댑터가 컨트롤러로 요청을 위임함 (RestController)
5.  비지니스 로직을 처리함 (Service - Business Logic, Repository - Data access, Database)
6.  컨트롤러가 반환값을 반환함 (Response Entity)
7.  핸들러 어댑터가 반환값을 처리함
8.  서버의 응답을 클라이언트로 반환함

<br>

## Filter, Interceptor

<br>

Filter
-   Dispatcher Servlet에 요청이 전달되기 전/후에 url 패턴에 맞는 모든 요청에 대해 부가작업을 처리하는 기능을 제공하는 것
-   톰캣과 같은 웹 컨테이너(웹 애플리케이션 WAS 단)에서 동작 하기 때문에 Spring과 무관한 자원에 대해 동작
-   Spring Context 외부에서 동작하는 것

<br>

Filter 메서드
-   `init()`
	-   필터 객체를 초기화하고 서비스에 추가하기위한 메서드
	-   웹 컨테이너(WAS 단)에서 1회 init 메서드를 호출하여 필터 객체를 초기화하면 이후 요청들은 doFilter를 통해 전/후 처리가 된다.
-   `doFilter()`
	-   url-pattern에 맞는 모든 HTTP 요청이 디스패처 서블릿으로 전달되기 전/후에 웹 컨테이너에 의해 실행되는 메서드
	-   doFilter의 파라미터로 FilterChain이 있는데, FilterChain의 doFilter 를 통해 다음 대상으로 요청을 전달한다.
-   `destroy()`
	-   필터 객체를 서비스에서 제거하고 사용하는 자원을 반환하는 메서드
	-   웹 컨테이너에 의해 1번 호출된다.

<br>

Interceptor
-   Spring이 제공하는 기술로, Dispatcher Servlet이 컨트롤러를 호출하기 전과 후에 요청과 응답을 참조하거나 가공할 수 있는 기능을 제공하는 것
-   스프링 컨텍스트에서 동작
-   Spring Context 내부에서 동작하므로 @ControllerAdvice 을 사용하여 예외 처리

<br>

Interceptor 메서드
-   `preHandle()`
	- 컨트롤러가 호출되기 전에 실행되어 컨트롤러 이전에 처리해야 하는 전처리 작업이나 요청 정보를 가공하거나 추가하는 경우에 사용할 수 있다.
	- 리턴값이 boolean이다. 리턴이 true 일경우 preHandle() 실행후 핸들러에 접근한다. false일경우 작업을 중단하기 때문에 컨트롤러와 남은 인터셉터가 실행되지 않는다.
-   `postHandle()`
	- 컨트롤러 호출된 후에 실행되어 컨트롤러 이후에 처리해야하는 후처리 작업이 있을 때 사용할 수 있다. 핸들러가 실행은 완료 되었지만 아직 View가 생성되기 이전에 호출된다.
	- 보통 컨트롤러가 반환하는 ModelAndView 타입의 정보가 제공되는데, Controller에서 View 정보를 전달하기 위해 작업한 Model 객체의 정보를 참조하거나 조작할수 있다.
-   `afterCompletion()`
	-   모든 뷰에서 최종 결과를 생성하는 일을 포함해 모든 작업이 완료된 후에 실행된다.
	-   요청 처리 중에 사용한 리소스를 반환할 때 사용하기 적합하다.
	- 뷰가 렌더링 된 이후에 사용되는데, ==**최근에는 React와 Vue 같이 SPA를 사용하면서 뷰를 따로 사용하는 것이 아닌 Json 형태로 데이터를 제공하는 REST API 기반의 컨트롤러가 사용되면서 잘 사용하지 않는다.**==

<br>

### 실행과정

![](brain/image/dog-week04-1.png)

1.  서버 실행 시 Servlet이 올라오는 동안 init 후 doFilter 실행
2.  Dispatcher Servlet을 지나쳐 Interceptor의 PreHandler 실행
3.  컨트롤러를 거쳐 내부 로직 수행 후, Interceptor의 PostHandler 실행
4.  doFilter 실행
5.  Servlet 종료 시 destory

<br>

### 둘의 차이

-   필터는 웹 컨테이너(서블릿 컨테이너)에서 실행, 인터셉터는 스프링 컨택스트에서 실행 ⇒ 실행시점 다름
-   필터는 디스패처 서블릿 전후, 인터셉터는 컨트롤러의 전후 다룸
-   필터는 스프링과 무관하게 전역적으로 처리하는 작업, 입력으로 들어온 파라미터 자체 검증
-   인터셉터는 스프링으로 들어온 요청과 관련되어 전역적으로 처리하는 작업
-   인터셉터는 @ControllerAdvice, @ExceptionHandler를 사용하여 예외처리 가능, 필터는 이것이 불가능하여 doFilter() 메서드 주변을 try-catch로 감싸서 예외 핸들링

<br>

| 대상 | 필터(Filter) |인터셉터(Interceptor) |
|-----|-------------|--------------------|
| 관리 컨테이너 | 웹 컨테이너 | 스프링 컨테이너 |
| Request/Response 조작 여부 | 가능 | 불가능 |
| 용도 | 보안 관련 공통 작업+ 이미지/데이터 압축 및 문자열 인코딩+ 모든 요청에 대한 로깅 또는 감사+ ServletRequest 커스터마이징 | 인증/인가 등과 같은 공통 작업+ Controller로 넘겨주는 정보의 가공+ API 호출에 대한 로깅 |

<br>

==**인터셉터가 조작 여부가 불가능하다는 것은 HttpServletRequest, HttpServletResponse 객체를 제공받으므로 객체 자체는 조작할 수 없다는 의미이고, 내부 값들은 조작할 수 있다.**==

<br>

## AOP

**AOP(Aspect Oriented Programming)**

관점 지향 프로그래밍으로 **공통 관심 사항과 핵심 관심 사항을 분리** 하는 것을 의미한다.소스 코드에서 여러 번 반복해서 사용하는 코드(흩어진 관심사)를 Aspect로 모듈화하여 핵심 로직에서 분리해 재사용하는 것이라고 볼 수 있다.여러 객체에 공통으로 적용할 수 있는 기능을 구분함으로써 재사용성을 높여주는 프로그래밍 기법이다.특정 로직(로그, 성능테스트, 권한)을 모든 메서드에 적용하고 싶을 때, 일일이 추가하는 것이 아니라 로직을 만들어서 적용할 수 있다.따라서, 비즈니스 로직 앞/뒤에 공통 관심 사항을 수행해 중복 코드를 줄인다.

-   관점지향 프로그래밍으로, 횡단 관심사에 따라 프로그래밍 하는 것. OOP를 보완하기 위해 나온 개념
-   예를 들어, 로깅/트랜잭션/권한검사/성능측정 등 부가 기능인 인프라 로직의 중복이 횡단으로 나타나는 경우 이를 모듈화하여 생각하는 것을 말함
-   AOP는 일종의 패러다임이라, 각 언어마다 AOP의 구현체가 있음. 대표적으로 자바는 AspectJ

<br>

### AOP 용어

-   Aspect
	-   흩어진 관심사를 모듈화 한 것
	-   모듈 : 외부에서 재사용할 수 있는 패키지들을 묶은 것
	-   advice + pointcut을 모듈화 한 것
-   Target
	-   advice의 대상이 되는 객체
	-   Target object는 비즈니스 클래스 같은 핵심 모듈이라고 할 수 있음
	-   Pointcut으로 결정
-   Advice
	-   실질적인 부가 기능 로직을 정의하는 곳
	-   특정 조인 포인트에서 Aspect에 의해 취해지는 조치
-   Join point
	-   **추상적인 개념** 으로 advice가 적용될 수 있는 모든 위치
	-   ex) 메서드 실행 시점, 생성자 호출 시점, 필드 값 접근 시점 등등..
	-   **스프링 AOP는 프록시 방식을 사용하므로 조인 포인트는 항상 메서드 실행 지점**
-   Point cut
	-   Join point의 상세한 스펙을 정의한 것, 구체적으로 실제 advice가 적용될 지점
	-  스프링 AOP는 프록시 기반이기 때문에 조인 포인트가 메서드 실행 시점 뿐이 없고 포인트 컷도 메서드 실행 시점만 가능 ( = 실제 advice가 적용될 메서드 )
-   Advisor
    -   스프링 AOP에서만 사용되는 용어로 advice + pointcut 한 쌍
-   Weaving
    -   pointcut으로 결장한 타겟의 join point에 advice를 적용하는 것
-   AOP 프록시
    -   AOP 기능을 구현하기 위해 만든 프록시 객체
    -   스프링에서 AOP 프록시는 JDK 동적 프록시 또는 CGLIB 프록시

<br>

### AOP 적용 방식

-   컴파일 시점
	-   .java 파일을 컴파일러를 통해 .class를 만드는 시점에 부가 기능 로직을 추가
	-   모든 지점에 적용 가능
	-   AspectJ가 제공하는 특별한 컴파일러를 사용해야 하기 때문에 특별할 컴파일러가 필요한 점과 복잡하다는 단점이 있다.
-   클래스 로딩 시점
	-   .class 파일을 JVM 내부의 클래스 로더에 보관하기 전에 조작하여 부가 기능 로직 추가
	-   모든 지점에 적용 가능
	-   특별한 옵션과 클래스 로더 조작기를 지정해야하므로 운영하기 어렵다.
-   **런타임 시점**
	-   **Spring AOP가 사용하는 방식**
	-   컴파일이 끝나고 클래스 로더에 이미 다 올라가 자바가 실행된 다음에 동작하는 런타임 방식
	-   실제 대상 코드는 그대로 유지되고 프록시를 통해 부가 기능이 적용
	-   **프록시는 메서드 오버라이딩 개념으로 동작하기 때문에 메서드에만 적용 가능** -> **스프링 빈에만 AOP를 적용 가능**
	-   특별한 컴파일러나, 복잡한 옵션, 클래스 로더 조작기를 사용하지 않아도 스프링만 있으면 AOP를 적용할 수 있기 때문에 스프링 AOP는 런타임 방식을 사용

<br>

### Spring에서 AOP 구현

-   XML 기반의 POJO(Java 하드코딩?) 클래스를 이용한 AOP 구현
	-   부가 기능을 제공하는 Advice 클래스를 작성하고 XML 설정파일에 Aspect 설정 (Advice, Pointcut)
-   @Aspect 어노테이션을 이용한 AOP 구현
	-   @Aspect 애노테이션을 이용해서 부가기능을 제공하는 Aspect 클래스 작성
	-   Aspect 클래스 생성 → Advice 구현 → Pointcut 구현

기본적인 작동 원리
- Spring AOP에서는 프록시 패턴을 채택
- 어떤 target 클래스를 부가 기능을 제공하는 프록시로 감싸서 실행하는 방법

<br>

### Spring AOP vs AspectJ

<br>

| | Spring AOP | AspectJ |
| -- | ------- | ------- |
| 목표 | 간단한 AOP 기능 제공 | 완벽한 AOP 기능 제공 |
| join point | 메서드 레벨만 지원 | 생성자, 필드, 메서드 등 다양하게 지원 |
| weaving | 런타임 시에만 가능 | 런타임은 제공 X |
| 대상 | Spring Container가 관리하는 Bean에만 가능 | 모든 Java Object에 가능 |

- weaving은 AOP를 끼워주는, 바느질하는 시기
	- AspectJ는 Spring에서 제공하는 IoC와 DI가 없어서 런타임 제공하지 않음
- Spring Container가 어떤 객체 생성을 관리해주기 때문에 런타임 시에만 가능한 것이다.
	- target object도 Spring 컨테이너가 관리하는 Bean에만 가능하게 되는 것
	- 그래서, Spring에서 코드를 작성할 때, @Aspect **애노테이션을 붙여 이 클래스가 Aspect를 나타내는 클래스라는 것을 명시하고 @Component를 붙여 스프링 빈으로 등록한다.**

<br>

### AOP vs Interceptor

<a href='/brain/Interview/dog-study/dog-week04/#실행과정'>Filter, Interceptor, AOP의 실행과정</a>에서 보다시피, 스프링 컨택스트 내부의 Interceptor와 AOP는 역할이 비슷하게 보인다. 이 둘의 차이는 뭘까?

-  Interceptor나 Filter와는 달리 AOP는 ==**메소드 전후**==의 지점에 자유롭게 설정이 가능하다.
-  Interceptor와 Filter는 주소로 대상을 구분해서 걸러내야하는 반면, AOP는 주소, 파라미터, 애노테이션 등 다양한 방법으로 대상을 지정할 수 있다.
-  AOP의 Advice와 HandlerInterceptor의 가장 큰 차이는 파라미터의 차이다.
	-  Advice의 경우 JoinPoint나 ProceedingJoinPoint 등을 활용해서 호출한다.
	-  반면 HandlerInterceptor는 Filter와 유사하게 HttpServletRequest, HttpServletResponse를 파라미터로 사용한다.

<br>

### (심화) AOP 적용 안되는 경우

AutoController -> AuthServce&&프록시 -> AuthService와 같은 경우를 생각해보자.
- AuthService&&프록시가 AuthService를 감싸고 있으니, AuthService 타입을 가지겠지?
- 그러면, AuthService 안에 있는 private 메서드에다가 AOP를 적용하면 어떻게 될까?

<br>

```java {title="AuthService.java"}
public void join(AuthService authService) {
	inner();
	memberRepository.save(authService.toMember());
}
```

<br>

```java
@PerformanceCheck
private void inner() {
	System.out.println("여기인가");
}
```

<br>

1.  AuthService에 join이라는 메서드에는 AOP를 적용하지 않았음
2.  그 안에 private 메서드로 inner 메서드를 만들었음
3.  여기에 `@PerformanceCheck` 이라는 AOP를 적용했음
4.  join 메서드에서 inner 메서드를 호출

<br>

결과는, ==**PerformanceCheck이 불려지지 않는다.**==

- proxy로 감싼 객체가 실제로 target object의 join 메서드를 실행할 때
- ==**inner 메서드가 aop로 감싼 proxy 객체가 아니기 때문에** ==
- 자기 자신을 호출할 때는 AOP로 감싸지지 않는 메서드가 호출되는 것

<br>

**정리하자면,**
1.  자기가 자신의 메서드를 호출할 때, target object가 target object에 있는 메서드를 실행할 때는 AOP가 적용이 안된다.
2. 자기가 자신의 메서드를 실행할 때에는 target object에서 실행한 메서드 내부에 있는 메서드이기 때문에 AOP가 적용이 안된 그냥 target object의 메서드를 그대로 실행하기 때문이다.
3. 동일 클래스 메서드를 실행할 때, 자기가 자신의 메서드를 실행할 때 AOP가 적용이 되지 않은채로 실행이 된다.

<br>

### @Transactional 문제도 여기!?

- 우리가 service에서 private 메서드에다가 @Transactional을 붙였을 때 그 Transaction이 작동하지 않는 이유가 바로 이것 때문이다.
- 갑자기 @Transactional? → 이것도 AOP 중 하나라서.
	- 서비스 로직을 하나의 트랜잭션으로 만들 때, 원래는 로직의 시작점에 Transaction을 열어주고 로직이 끝나는 시점에 Transaction을 커밋하는 코드가 항상 들어가야한다.
	- 하지만, `@Transactional` 을 통해서 개발자는 비즈니스 로직에만 집중할 수 있고, Transaction이라는 인프라 로직은 AOP로 분리를 하게 된다.

<br>

## 참고

- https://velog.io/@backtony/%EB%A9%B4%EC%A0%91-%EC%8B%9C%EB%A6%AC%EC%A6%882-Spring-JPA#filter-interceptor
- https://popo015.tistory.com/115
- https://www.youtube.com/watch?v=NyhbNtOq0Bc
- https://www.youtube.com/watch?v=2pBsXI01J6M
- https://www.youtube.com/watch?v=Hm0w_9ngDpM