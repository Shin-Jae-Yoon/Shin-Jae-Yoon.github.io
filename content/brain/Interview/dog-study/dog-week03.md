---
title: "3주차 - Spring Basic"
date: "2023-02-26 15:20"
enableToc: true
tags: [""]
weight: 4
---

<a href='https://github.com/DevInterviewStudy/Backend-6/issues' target='_blank'>3주차 스터디 Issue 바로가기</a> 

<hr>

>[!note] 3주차 스터디
><br>
> **TOPIC** <br>
> - 프레임워크란?
> - Spring 프레임워크의 정의 및 장점
> - DI (Dependency Injection)
> 	- 주입 방식
> - IoC
> - 스프링 컨테이너

<br>

## 프레임워크란?

Frame(틀, 뼈대) + work(일하다)로, 의미 그대로 해석하면 ==응용 프로그램이나 소프트웨어의 솔루션 개발을 수월하게 하기 위해 제공된 소프트웨어 환경==이다. 개발할 때, 자주 사용되는 범용적인 기능을 한꺼번에 제공하여 개발 효율의 향상을 목표하는 소프트웨어 환경이다.

<br>

### Framework 특징

-   공통적인 개발 환경을 제공한다. (개발 편의성)
-   개발할 수 있는 범위가 정해져있다.
-   상호협력하는 클래스와 인터페이스의 집합
-   응용 프로그램이 **수동적**으로 프레임워크에 의해 사용된다. ( = 제어의 역전이 발생한다)

<br>

### Library

Libray는 ==응용 프로그램 개발을 위해 필요한 기능(함수)을 모아 놓은 소프트웨어==이다. 

- 개발하는데 필요한 것들을 모아둔 일종의 저장소
- 필요할 때, 호출해서 사용한다.
- 독립성을 가진다.
- 응용 프로그램이 **능동적**으로 라이브러리를 사용한다. ( = 흐름을 제어한다. )

<br>

### Framework vs Library

둘을 바라봤을 때, 개발할 때 중복된 코드가 발생하지 않도록 필요한 것들을 모아놓았다는 측면에서 비슷해보인다. 그렇다면 둘의 차이는 어떠한가?

- ==흐름을 제어하는 쪽이 어떤 쪽인지가 가장 큰 차이==
- Framework : 내가 작성한 응용 프로그램이 프레임워크에 의해 **수동적**으로 사용된다. 제어의 흐름이 역전된 형태
- Library : 내가 작성한 응용프로그램이 **능동적**으로 라이브러리를 사용한다. 제어의 흐름이 개발자에게 있는 형태

<br>

## Spring 정의 및 장점

Spring은 ==자바 플랫폼을 위한 오픈소스 애플리케이션 프레임워크==이다.

- 경량 컨테이너로서 자바 객체를 직접 관리
	- 각각의 객체 생성, 소멸과 같은 Life cycle을 관리하며 Spring으로부터 필요한 객체를 얻어올 수 있다.
- IoC(제어의 역전) 기술을 통한 애플리케이션의 **느슨한 결합** 추구
- DI(의존성 주입)을 통한 객체 관계 구성을 지원
- AOP(횡단 관심사 분리)를 이용하여 OOP를 보완
- MVC 패턴로 계층을 분리하여 유지보수에 수월

<br>

### Spring Boot

이미, Spring의 장점으로도 충분해보이는데 Spring Boot 기술은 왜 나왔을까?

1.  dependency

	-   Spring은 모든 dependency를 버전까지 한땀한땀 구성해야해서 매~우 길다. 하지만 Spring Boot는 매우 짧아졌고 버전 관리도 권장 버전으로 자동 설정해준다.

2.  configuration

	-   Spring은 config가 매~우 길도 bean도 등록해주고 해야하는데 Spring Boot는 따로 config 파일을 작성해주지 않아도 되고 application.properties만 적용하면 된다. 최근에는 application.yml을 많이 사용한다고 한다. depth로 표현하기 때문에 훨씬 인간이 읽기 좋게 만들 수 있는 파일 형식이라고 한다.

3.  embedded server

	-  서버 구동 시간이 절반 가까이 단축.
	-  대표적인 예시로 tomcat이 있는데, tomcat이 싫으면 jetty 써도 된다.
	-   `java -jar $REPOSITORY/$JAR_NAME &` - 내장 서블릿 컨테이너 덕분에 jar 파일로 간단하게 배포!
	- 즉, Spring은 WAS가 내장되어있지 않아서, 외장 WAS를 따로 `.war`를 이용하여 함께 빌드하여야 했지만, Spring Boot에는 WAS가 내장되어 있기에 `.jar`를 이용하여 보다 빠른 빌드가 가능

<br>

정리하자면, ==Spring Boot의 장점은 개발자들이 개발에만 더욱 집중==할 수 있도록!

1.  간편한 설정 (configuration)
2.  편리한 의존성 관리 & 자동 권장 버전 관리 (dependency)
3.  내장 서버로 인한 간단한 배포 서버 구축 (embedded server)
4.  스프링 Security, Data JPA 등의 다른 스프링 프레임워크 요소를 쉽게 사용

<br>

## IoC

IoC(Inversion of Control)은 제어의 역전이라는 의미로 ==프로그램의 제어 흐름을 직접 제어하는 것이 아니라 프레임워크 같이 외부에서 관리하는 것==을 의미한다.

IoC는 제어의 역전이라는 **원칙 그 자체**이므로, 이를 구현해줄 구현체가 필요하다. 이 중 대표적인 디자인 패턴이 아래에서 설명할 <a href='/brain/Interview/dog-study/dog-week03/#DI'>DI</a>이다.

-   IoC : 치즈떡볶이가 스스로의 재료를 결정하지 못한다는 ==**추상적인 개념**==
-   DI : 치즈떡볶이의 재료를 외부에서 정해준다는 ==**구체적인 행위**==

<br>

-  기존에 생성자로 생성하여 객체 생명주기나 메서드의 호출을 직접 **제어(관리)** 하는 방식

```java
public class A { 
	private B b; 
	public A() { 
		this.b = new B(); 
	} 
}
```

<br>

- 프로그램의 제어 흐름을 직접 제어하는 것이 아니라 **외부에서 관리**하는 방식

```java
public class A { 
	private B b; 
	public A(B b) { 
		this.b = b;
	} 
}
```

<br>

### IoC의 필요성

- 객체 내부에서 제어했을 때, 변경에 자유롭지 못하던 코드가 외부의 제어를 받으면서 ==변경에 자유로운 장점==이 있다.
- 객체지향 원칙을 잘 지키기 위해서!
	- 역할과 관심을 분리하여 ==객체 간 응집도를 높이고 결합도는 낮춘다.==
	- 이에 따라 변경에 유연한 코드를 작성할 수 있는 구조가 된다.

<br>

예를 들어, 떡볶이를 만드는 클래스가 있다고 하자.  하지만, 아래와 같이 **객채 내에서 재료를 제어하는 경우**, 쌀떡을 밀떡으로 바꾸려고 한다면? 큰 변화가 생기는 것이다. **변경에 자유롭지 못하여 유지보수가 어려운 것**이다.

- 즉, 현재는 치즈떡볶이가 스스로 자신의 상태를 결정짓는 상태!

```java
public class Cheesetteokbokki {
	RiceTTok riceTTok;
	BigPa bigPa;
	SliceOnion sliceOnion;
	MozzarallaCheese mozzarellaCheese;

	public Cheesetteokbokki() {
		this.riceTTok = new RiceTTok();
		this.bigPa = new BigPa();
		this.sliceOnion = new SliceOnion();
		this.mozzarellaCheese = new MozzarellaCheese();
	}
}
```

<br>

그럼 아래와 같이 **재료에 대한 제어를 외부로 바꾸면** 어떠한가? 쌀떡이든 밀떡이든 무엇이 들어와도 괜찮도록 변경에 자유롭게 되는 것이다.

- 외부의 존재가 치즈떡볶이의 상태를 결정짓는 상태!

```java
public class Cheesetteokbokki {
	TTok ttok;
	Pa pa;
	Onion onion;
	Cheese cheese;

	public Cheesetteokbokki(TTok ttok, Pa pa, Onion onion, Cheese cheese) {
		this.ttok = ttok;
		this.pa = pa;
		this.onion = onion;
		this.cheese = cheese;
	}
}
```

<br>

### DIP

IoC를 검색했을 때, 자주 나오는 DIP란 무엇인가? 

**DIP(Dependency Inversion Principle) - 의존 역전 원칙**
- SOLID 원칙 중 D에 해당하는 부분
- 상위 레벨의 모듈은 절대 하위 레벨 모듈에 의존하지 않는다. ( **= 둘 다 추상화에 의존해야 한다** )

<br>

떡볶이의 예시로, 치즈 떡볶이와 일반 떡볶이가 있다고 하면, 조금 더 구체적이고 상세한 치즈 떡볶이가 고수준 모듈이고 일반 떡볶이가 저수준 모델이다.

- 치즈 떡볶이(고수준 모듈) -> 일반 떡볶이(저수준 모듈)
	- 필드가 이미 구체 클래스로 작성되어 있으면, 변경에 자유롭지 못하다.
	- 즉, 상위 레벨의 모듈이 하위 레벨의 모듈에 의존하면, 변경에 자유롭지 못하다는 의미이다.
- 치즈 떡볶이 -> 떡(Interface) <- 일반 떡볶이
	- 이렇게 어떤 떡볶이든 떡이라는 추상화에 의존한다면, 쌀떡이든 밀떡이든 변경이 일어나도 자유롭게 수정할 수 있다.

<br>

### IoC와 DIP

IoC와 DIP의 목적
- 클래스 간 결합을 느슨히 하기 위함
	- 한 클래스의 변경에 따른 클래스들의 영향을 최소화
- 이로 인하여, 애플리케이션을 지속가능하고 확장성 있게 만듬.

IoC와 DIP는 모두 **principle(원칙)**이다.
- IoC는 ==제어의 역전==
- DIP는 ==의존 방향의 역전==

<br>

1. 객채 내에서 제어권을 가진 경우 (개발자가 제어권 가짐)

```java
public class Cheesetteokbokki {
	RiceTTok riceTTok;
	BigPa bigPa;
	SliceOnion sliceOnion;
	MozzarallaCheese mozzarellaCheese;

	public Cheesetteokbokki() {
		this.riceTTok = new RiceTTok();
		this.bigPa = new BigPa();
		this.sliceOnion = new SliceOnion();
		this.mozzarellaCheese = new MozzarellaCheese();
	}
}
```

2. 제어권이 외부로 넘어감 (제어의 역전, IoC 적용)

```java
public class Cheeseeokbokki {
	RiceTTok riceTTok;
	BigPa bigPa;
	SliceOnion sliceOnion;
	MozzarallaCheese mozzarellaCheese;

	public void inject(RiceTTok riceTTok, BigPa bigPa, SliceOnion sliceOnion, MozzarallaCheese mozzarellaCheese) {
		this.riceTTok = riceTTok;
		this.bigPa = bigPa;
		this.sliceOnion = sliceOnion;
		this.mozzarellaCheese = mozzarellaCheese;
	}
}
```

3. 단, 외부에서 주입한다고 해도 쌀떡, 밀떡 종류마다 넣어야하는 고수준 모듈이 저수준 모듈에 의존하는 상태이기 때문에, 이를 추상화에 의존하도록 바꾼다. (의존 방향의 역전, DIP 적용)

```java
public class Cheesetteokbokki {
	TTok ttok;
	Pa pa;
	Onion onion;
	Cheese cheese;

	public Cheesetteokbokki(TTok ttok, Pa pa, Onion onion, Cheese cheese) {
		this.ttok = ttok;
		this.pa = pa;
		this.onion = onion;
		this.cheese = cheese;
	}
}
```

<br>

## DI

DI(Dependency Injection)
- 원칙일 뿐인 IoC를 구현하기 위한 구현체 중 대표적인 디자인 패턴이 DI
- 클래스 간에 의존 관계가 있다는 것
- 한 클래스가 바뀔 때 다른 클래스가 영향을 받는다는 것

==변경에 의해 영향을 받는 "의존성"을 외부에서 주입해주는 것==이 바로 DI이다.

<br>

### 생성자 주입

- 생성자 호출 시 외부로부터 의존성을 주입받는 방법
- 필요한 의존성을 모두 포함하는 생성자를 만들고, 그 생성자를 통해서 의존성을 주입한다.

```java
public class Cheeseeokbokki {
	RiceTTok riceTTok;
	BigPa bigPa;
	SliceOnion sliceOnion;
	MozzarallaCheese mozzarellaCheese;

	public void inject(RiceTTok riceTTok, BigPa bigPa, SliceOnion sliceOnion, MozzarallaCheese mozzarellaCheese) {
		this.riceTTok = riceTTok;
		this.bigPa = bigPa;
		this.sliceOnion = sliceOnion;
		this.mozzarellaCheese = mozzarellaCheese;
	}
}
```

<br>

### Setter 주입

- 의존성을 주입받는 setter 메서드를 만들고 이 메서드들을 호출해서 의존성을 주입한다.

```java
public class Cheeseeokbokki {
	RiceTTok riceTTok;
	BigPa bigPa;
	SliceOnion sliceOnion;
	MozzarallaCheese mozzarellaCheese;

	public void setRiceTTok(RiceTTok riceTTok) {
		this.riceTTok = riceTTok;
	}
	
	public void setBigPa(BigPa bigPa) {
		this.bigPa = bigPa;
	}
	
	public void setSliceOnion(SliceOnion sliceOnion) {
		this.sliceOnion = sliceOnion;
	}
	
	public void setMozzarallaChees(MozzarallaCheese mozzarellaCheese) {
		this.mozzarellaCheese= mozzarellaCheese;
	}

}
```

<br>

### Interface 주입

-   의존성을 주입하는 메서드를 포함한 인터페이스를 작성하고, 이 인터페이스를 구현하도록 함으로써 실행 시 이를 통해서 의존성을 주입
-   Setter 주입처럼 메서드를 외부에서 호출해줘야 하는 것은 비슷하지만, 의존성 주입을 빠뜨릴 수 있는 Setter 주입과는 다르게 Override를 통해 메서드 구현을 강제할 수 있다는 차이가 있다.

```java
public class Cheeseeokbokki {
	RiceTTok riceTTok;
	BigPa bigPa;
	SliceOnion sliceOnion;
	MozzarallaCheese mozzarellaCheese;

	public void inject(RiceTTok riceTTok, BigPa bigPa, SliceOnion sliceOnion, MozzarallaCheese mozzarellaCheese) {
		this.riceTTok = riceTTok;
		this.bigPa = bigPa;
		this.sliceOnion = sliceOnion;
		this.mozzarellaCheese = mozzarellaCheese;
	}

	interface RecipeInjection {
		void inject(RiceTTok riceTTok, BigPa bigPa, SliceOnion sliceOnion, MozzarallaCheese mozzarellaCheese);
	}
}
```

<br>

여기까지 하면 의존성이 주입되기는 한 상태이다. 하지만 여전히 구체적인 Cheeseeokbokki 클래스를 구현하고 있는 것으로 보아 변경에 자유롭지 못해보인다. 지금까지는 “의존성을 주입”하는 방법만 생각했다면, 이제 **의존성 분리**를 생각해보자.

의존성 분리 : DIP를 이용해 의존 관계를 분리시킨다.
-   상위 계층이 하위 계층에 의존하는 상황을 Interface를 이용해 반전시켜 하위계층의 구현으로부터 독립시킨다.

```java
public class Cheesetteokbokki {
	TTok ttok;
	Pa pa;
	Onion onion;
	Cheese cheese;

	public Cheesetteokbokki(TTok ttok, Pa pa, Onion onion, Cheese cheese) {
		this.ttok = ttok;
		this.pa = pa;
		this.onion = onion;
		this.cheese = cheese;
	}
}
```

<br>

## Spring DI

-   MemberService라는 의존성을 주입받는 MemberController
    -   생성자를 통해 의존성 주입받는 중
    -   특정한 MemberService를 받는 생성자가 어딘가에서 호출되어야 하겠네

<br>

```java
@Controller
public class MemberController {
	private final MemberService memberService;

	public MemberController(MemberService memberService) {
		this.memberService = memberService;
	}
}
```

<br>

하지만, MemberController보다 상위의 어떤 코드를 살펴봐도 MemberController 생성시 MemberService 인스턴스를 주입하는 코드가 없는 것을 확인할 수 있다. 그러면 우리가 어떻게 사용할까?

<br>

```java
@SpringBootApplication
public class DiApplication {
	public static void main(String[] args) {
		SpringApplication.run(DiApplication.class, args);
	}
}
```

<br>

스프링이 자동으로 의존성을 주입해주기 때문이다. ==**스프링 Bean으로 등록되면 스프링이 자동으로 생성해주는데 이때 필요한 의존성도 주입해준다.**== 그렇다면, 어떻게 해야 스프링이 자동으로 의존성을 주입할 수 있게 해줄까?

<br>

> **@Autowired 애노테이션**
> -   여기에 의존성을 주입해달라는 뜻
> -   스프링이 자동으로 적절한 의존성을 주입해줌

<br>

### (Spring) 필드 주입

-   스프링을 적용하지 않은 DI의 방법에는 없던 방법
-   원래는 불가능한 주입을 프레임워크의 힘을 빌려 주입하는 방법
-   하지만, 필드 주입은 추천되는 방법이 아님 (인텔리제이도 경고함)
    -   필드주입을 사용하면 테스트 등의 이유로 자동이 아닌 수동 의존성 주입하고 싶어도 ==**생성자도, setter도 없으므로 개발자가 직접 의존성을 넣어줄 수 없다.**==
    -   이는 ==**의존성이 프레임워크에 강하게 종속된다는 문제점**==이 있다는 것

<br>

```java
@Controller
public class MemberController {
	@Autowired
	private MemberService memberService;
}
```

<br>

### (Spring) Setter 주입

-   setter 메서드에 @Autowired를 붙이면 스프링이 setter를 사용해서 자동으로 의존성을 주입해줌
-   이때, Bean 객체를 만들고 setter로 의존성을 주입해주기 때문에 Bean 생성자 혹은 Bean 정적 팩토리 메서드가 필요하다.
    -   ==이때문에 final 필드를 만들 수 없고 의존성의 불변을 보장할 수 없다는 특징이 있다.==

<br>

```java
@Controller
public class MemberController {
	private MemberService memberService;

	@Autowired
	public void setMemberService(MemberService memberService) {
		this.memberService = memberService;
	}
}
```

<br>

setter 주입은 왜 존재할까?
- 런타임에 setter를 다시 호출하면 주입해줬던 의존성을 다시 변경할 수 있을 것이다. 
- 그래서, 주로 런타임에 의존성을 수정해야 하거나 의존성을 선택적으로 주입할 때 사용한다.

<br>

### (Spring) 생성자 주입

-   생성자 주입을 사용하면 객체의 최초 생성 시점에 스프링이 의존성을 주입해준다.
-   스프링에서 공식적으로 추천하는 방법. Spring 4.3 버전 이후 ==**생성자가 1개밖에 없을 경우 해당 생성자에 스프링이 자동으로 @Autowired를 붙여주기 때문에 애노테이션 생략이 가능**==하다.
-   스프링 공식문서에서는 생성자 주입 + Setter 주입을 혼용할 수 있지만 생성자 주입을 추천한다고 한다.
-   setter 주입은 선택적 의존성에 사용하라고 한다.
    -   생성자 주입된 컴포넌트들이 완전히 초기화된 상태로 클라이언트에 반환되기 때문이라고 함.

<br>

```java
@Controller
public class MemberController {
	private final MemberService memberService;

	public MemberController(MemberService memberService) {
		this.memberService = memberService;
	}
}
```

<br>

### 생성자 주입 장점

1.  **생성자 주입을 사용하면 필드를 final로 만들어줄 수 있고 의존성 주입이 생성자 호출 시 최초 1회만 이루어지기 때문에 의존 관계를 불변으로 만들어줄 수 있는 장점이 있다.**
    
2.  final이 가능하기 때문에 `NullPointerException` 을 방지할 수 있다.
    -   필드 주입, setter 주입의 경우 스프링의 빈 관리 기능을 빌리지 않고 new 키워드로 직접 객체를 생성할 경우 NullPointerException이 발생할 수 있다.
        -   왜냐하면, 이들은 빈 생성자를 사용해서 기본적으로 의존성이 없는 상태니까
    -   하지만, 생성자 주입은 객체 생성 시점에 모든 의존성을 주입해주므로 Null을 의도적으로 넣지 않는 한 NullPointerException을 방지할 수 있다.

3.  순환참조 문제 방지 가능
    -   필드 주입, setter 주입의 경우 A객체 → B 객체 의존하는데 B객체 또한 A객체를 의존하는 순환참조 문제가 발생할 수 있다.
    -   생성자 주입을 사용하는 객체들끼리 의존성이 순환되면, 스프링은 에러메세지와 함께 프로그램을 종료한다.

<br>

```java
@Component
public class A {
	@Autowired
	private B b;

	public void doSomething() {
		b.doSomething();
	}
}
```

<br>

```java
@Component
public class B {
	@Autowired
	private A a;

	public void doSomething() {
		a.doSomething();
	}
}
```

- 순환호출이 반복되다가 스택오버플로우 에러가 발생해서 프로그램이 멈출 것
	- 생성자 주입을 이용하면 애플리케이션 시작 타이밍에 에러를 통해 방지!
	- 근데, 스프링부트 2.6 버전부터는 필드 주입이나 setter 주입도 기본 설정으로 순환참조 방지됨

<br>

### 생성자가 여러 개

**생성자가 여러 개인 경우 어떻게 해야할까?**
-   의존성을 자동으로 주입하는데 사용할 생성자에 @Autowired 붙이기
-   @Autowired가 여러 개 있을 경우, 스프링은 가장 많은 의존성을 주입할 수 있는 생성자를 사용해서 의존성을 주입한다.
-   @Autowired가 붙은 모든 생성자가 사용 불가능하거나 어떤 생성자에도 @Autowired가 없을 경우에는 기본 생성자를 호출한다.
-   기본 생성자조차 없으면 컴파일 에러 발생

**의존성 주입 순서**

생성자 → 필드 → setter

<br>

### 주입하고자 하는 의존성이 여러 개

<br>

```java
@Controller
public class PayController {
	private final PayService payService;

	public PayController(PayService naverPayService) {
		this.payService = naverPayService;
	}
}
```

-   결제를 담당하는 payService 인터페이스가 있다고 하자.
    -   구현체인 네이버 페이 서비스와, 카카오 페이 서비스가 있음
    -   모두 Bean으로 등록되어있음
-   payController에서는 어떤 거를 주입받아야할까?
    -   그대로 시작하면 애플리케이션 실패되면서 에러가 뜬다.

<br>

1.  스프링은 의존성 주입 대상을 찾을 때 **정의되어 있는 타입을 기준**으로 찾는다. 현재는 PayService라는 타입으로 검색된다.
2.  이렇게 타입을 기준으로 여러 Bean이 검색되었다면, 스프링은 Bean의 이름을 기준으로 의존성을 주입한다.
    -   이때, 주입하는데 사용되는 메서드의 매개변수 명과 등록된 빈의 이름이 일치하는지 체크한다.
    -   생성자 매개변수 명을 naverPayService로 바꿔주면, 자동으로 naverPayService 빈이 주입되고 생성에 성공한다.
    -   하지만, 이런식으로 매개변수 명을 바꿔버리면 수동으로 kakaoPayService를 주입해야하는 경우에 헷갈리고 자동으로 주입하는 빈을 바꿀때도 귀찮을 것
3.  스프링이 제공하는 @Qualifier 애노테이션 사용

<br>

```java
@Service
@Qualifier("mainPayService")
public class NaverPayService implements PayService {

}
```

<br>

```java
@Controller
public class PayController {
	private final PayService payService;

	public PayController(@Qualifier("mainPayService") PayService payService) {
		this.payService = payService;
	}
}
```

-   @Qualifier 애노테이션 안에 해당 빈의 구분자를 지정할 수 있음
-   NaverPayService에 `@Qualifier("mainPayService")` 를 붙여서 지정
-   의존성을 주입받을 부분에 동일하게 @Qualifier 애노테이션 작성하면 네이버 페이 서비스가 주입된다.

<br>

4. 스프링이 제공하는 @Primary 애노테이션 사용

<br>

```java
@Service
@Primary
public class NaverPayService implements PayService {

}
```

<br>

```java
@Controller
public class PayController {
	private final PayService payService;

	public PayController(PayService payService) {
		this.payService = payService;
	}
}
```

- @Primary 애노테이션이 붙은 빈은 해당 타입으로 의존성을 검색할 때 우선적으로 주입된다. 일종의 기본 빈이 되는 것이다.

<br>

5.  @Qualifier vs @Primary
    -   @Qualifier가 @Primary보다 우선권을 가짐

<br>

**스프링 의존성 주입 기준**

타입 → @Qualifier → @Primary → 변수 명

<br>

## 스프링 컨테이너

스프링 컨테이너
- ==**IoC와 DI의 원리가 이 스프링 컨테이너에 적용**==
- 자바 객체의 생명 주기를 관리
- 생성된 자바 객체들에게 추가적인 기능을 제공하는 역할
- 대표적으로 BeanFactory, ApplicationContext가 있음
	- 둘 다 Bean을 등록하고 생성하고 조회하고 돌려주는 등 Bean을 관리하는 역할
	- ApplicationContext가 BeanFactory의 빈 관리 기능들을 상속받았고, 그 외에 국제화 등의 추가적인 기능을 갖고 있어 스프링 컨테이너라고 하면 보통 ApplicationContext라고 한다.

<br>

## 참고

- https://www.youtube.com/watch?v=8lp_nHicYd4