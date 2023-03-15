---
title: "5주차 - Spring 응용"
date: "2023-03-11 03:50"
enableToc: true
tags: [""]
weight: 6
---

<hr>

>[!note] 5주차 스터디
><br>
> **TOPIC** <br>
> - Bean 정의
> 	- 생명주기
> 	- 스코프
> - 싱글턴 vs 스프링 싱글턴
> - Annotation
> - Spring Annotation
> - MVC 패턴
> 	- MVVM MVP MVI
> - 레이어드 아키텍쳐

<br>

## Spring Bean

- ==**Spring Bean : Spring IoC Container가 관리하는 객체**==
- ==**Spring IoC Continaer : Spring Bean을 관리하는 객체**==

Spring Bean 이 왜 필요할까?
- Spring IoC Container가 특정 객체 Lifecycle을 관리한다는 것을 나타내기 위하여

Spring IoC Container는 왜 Bean을 관리하는 것일까?
- 의존성을 자동 주입하여 개발자들이 해당 의존성을 사용하는 로직에만 집중할 수 있도록 도와주는 역할
- 의존성을 주입할 때 사용되는 객체가 항상 동일함을 보장하기 위해

<br>

### Bean을 쓰지 않는 경우 문제점

객체를 Bean으로 등록하지 않고 직접 의존성 주입을 도입한다면 어떤 문제가 있을까?

<br>

```java
public class Service {
	private final Dao dao;

	public Service(Dao dao) {
		this.dao = dao;
	}
}
```

<br>

```java
Service service = new Service(new JdbcDao());
```

<br>

이렇게 Dao 구현체를 의존성 주입 한다고 하자. 그렇다면 어디에선가 new 키워드를 사용하여 객체를 생성해야 한다. 이때 Dao 구현체가 변경된다면 어떻게 될까?

<br>

```java
Service service = new Service(new TestDao());
```

<br>

Service를 생성할 때 의존성 주입으로 Dao를 초기화하면서 어떤 Dao의 구현체를 선택할 것인지에 대한 책임을 가지기 때문에 Service를 생성하는 곳에서도 변경이 일어난다. 

<br>

```java
Service service = new Service(new Test1Dao(), new Test2Dao(), new Test3Dao());
```

<br>

또, 이렇게 의존성 주입을 여러 개 하는 경우 해당 의존성 주입의 순서와 관계를 모두 파악해야해서 번거로움이 생긴다.

따라서, 아래와 같이 Bean을 사용해보자.

- 의존성 주입이 필요한 객체를 Bean으로 등록
- 스프링 IoC 컨테이너가 객체의 생성과 의존성 주입을 관리하도록 함
- 장점 : 개발자가 주입된 의존성 부분에만 집중할 수 있게 됨

<br>

### Bean 생명주기

==**스프링 IoC 컨테이너 생성 → 스프링 빈 객체 생성 → 의존관계 주입 → 초기화 콜백 메소드 호출 → 사용 → 소멸 전 콜백 메소드 호출 → 스프링 종료**==

<br>

Bean의 Lifecycle의 관리자 => Spring Container
- Bean의 Lifecycle 관련 **callback 메서드를 호출**하여, Bean 객체의 생성, 초기화, 소멸의 Lifecycle을 관리한다.
- callback 메서드 : 어떤 이벤트에 의해 호출되는 함수

Bean의 Lifecycle에서 callback의 필요성
- Database Connection, 네트워크 소켓 연결 등 시작 지점에 미리 연결한 뒤 애플리케이션 종료 시점에 연결을 종료해야하는 경우 => 객체의 초기화 및 종료 작업이 필요할 것
- 예를 들어, Connection Pool의 connect & disconnect
- Spring Bean도 동일한 원리로 **초기화 작업**과 **종료 작업**이 나눠서 진행됨
	- Spring Bean은 의존관계 주입이 끝나야만 사용이 가능하기 때문에 그때 **초기화 콜백 메서드**를 호출해서 사용하는 것이니까. 끝나고 나면 다시 **소멸 전 콜백 메서드**로 종료!

<br>

**Spring이 Bean Lifecycle Callback을 관리하는 방법**

- Spring의 인터페이스 (InitializingBean, DisposableBean)

```java
class MySpringBean implements InitializingBean {
	@Override
	public void afterPropertiesSet() {
	
	}
}
```

<br>

- JSR-250 애노테이션 지원
	- `@PostConstruct`, `@PreDestroy` 사용
	- ==**Spring에서 Bean 초기화, 소멸 시 권장하는 방식**==
	- 단점 : 외부 라이브러리에는 적용 못함

```java
@PostConstruct
public void postConstruct() {

}

@PreDestroy
public void preDestroy() {

}
```

<br>

- `@Bean` 애노테이션에 속성을 추가
	- JSR-250 애노테이션이 외부 라이브러리에는 적용 못하기 때문에 그럴 경우 `@Bean` 애노테이션에 속성을 추가하는 방식을 사용함
	- 설정 정보에 초기화 메서드, 종료 메서드 지정

```java
@Bean(initMethod = "onInitialize", destroyMethod = "onDestroy")
public MySpringBean mySpringBean() {
	return new MySpringBean();
}
```

<br><br>

<details>
<summary><strong>Bean의 생성 Lifecycle 상세</strong></summary>

1. Spring이 Bean 객체를 인스턴스화 한다.
2. 의존 관계를 주입한다.
3. `BeanNameAware.setBeanName()` 메서드를 호출한다.
	- setBeanName의 파라미터로 넘어온 문자열 값으로 빈의 이름 설정
4. `BeanFactoryAware.setBeanFactory()` 메서드를 호출한다.
	- BeanFactory 객체를 주입하기 위해서 사용
5. `ApplicationContextAware.setApplicationContext()` 메서드를 호출한다.
	- ApplicationContext 객체를 주입하기 위해서 사용
6. `BeanPostProcessor.postProcessBeforeInitialization()` 메서드를 호출한다.
7. `@PostConstruct`이 붙은 메서드, `InitializingBean.afterPropertiesSet()` 메서드, `@Bean`의 initMethod로 지정한 메서드 순서로 호출
8. `BeanPostProcessor.postProcessAfterInitialization()` 메서드를 호출한다.

Q. Bean의 생성과 초기화를 분리하는 이유는?
- 생성자에서 초기화라는 무거운 작업을 하는 것보다 분리하여 유지보수에 용이하도록 하기 위하여.

Q. Spring에서 BeanFactory 컨테이너보다 ApplicationContext를 권장하는 이유?
- BeanFactory는 스프링 컨테이너의 최상위 인터페이스이고 ApplicationContext는 BeanFactory를 상속하여 만들어져서, BeanFactory의 모든 기능을 포함하며 그보다 더 다양한 기능을 제공하기 때문이다.

</details>

<br>

<details>
<summary><strong>Bean의 소멸 Lifecycle 상세</strong></summary>

1. Spring IoC 컨테이너가 종료된다.
2. `@PreDestory` 애노테이션이 붙은 메서드, `DisposableBean.destroy()` 메서드, `@Bean`의 destroyMethod로 지정한 메서드 순서로 실행된다.

</details>

<br>

Bean의 default 설정은 싱글턴이다. Spring IoC Container에 객체로 Bean을 등록하지 않고 개발자가 객체를 싱글턴으로 만들어서 사용하면 어떤 문제가 있을까?

<br>

```java
public class DatabaseConnection {
	private static final DatabaseConnection databaseConnection = new DatabaseConnection();

	private DatabaseConnection() {
	}

	public static DatabaseConnection getConnection() {
		return databaseConnection;
	}
}
```

<br>

1. 다형성을 이용하지 못함. 싱글턴이라서 private을 썼기 때문에 해당 객체는 상속이 불가능하게 됨.
2. 단위 테스트가 어렵다. 메모리 절약에는 이점이 있겠지만, 해당 객체는 공유 객체가 되므로 단위 테스트를 실행할 때마다 테스트의 순서에 따라 결과가 달라지게 된다.

<br>

객체를 싱글턴으로 만들어서 사용했을 때 단점들은 스프링 IoC 컨테이너가 어떻게 해결했을까? 스프링 IoC 컨테이너가 Bean의 LifeCycle을 관리하는 과정을 보면 해답을 찾을 수 있다.

1. 객체 생성 + property 설정
2. 의존 설정
3. 초기화
4. 사용
5. 소멸

<br>

**객체 생성 + property 설정**

- Spring IoC 컨테이너가 생성되면 빈 스코프가 싱글턴인 객체를 생성
-  Bean으로 등록하기 위해 애노테이션 기반, Java 설정 클래스 기반, xml 기반 등 다양한 configuration 메타 데이터를 이용하여 **통일된 Bean Definition을 생성**한다.
- Bean으로 등록할 POJO + Bean Definition 정보를 이용하여 Bean 생성
- 이 과정에서 싱글턴 패턴을 사용하는 것이 아니라 평범한 Java class를 이용하여 객체를 생성

그리고, Spring IoC Container에는 Singleton Registry 기능이 있다.
- Registry는 CS 전반적으로 사용되는 개념. Key-Value 형태로 데이터를 저장하는 방법
- Spring IoC Container는 Bean Scope가 Singleton인 객체에 **Bean의 이름을 Key, 객체를 Value로 저장**한다.
- 의존성이 주입되어야하는 **객체가 빈으로 등록되어 있을 때 Spring은 빈의 이름을 이용하여 항상 동일한 Single Object를 반환하게 되는 것**

<br>

**의존 설정**

- Bean 객체가 생성되면 IoC 컨테이너가 의존 설정을 함
- 이 과정에서 의존성이 자동 주입되게 된다.

<br>

**겍체 초기화, 사용, 소멸**

- 초기화 : 모든 객체가 초기화 될 필요는 없고, Connection Pool처럼 사용전에 초기화 과정이 필요한 객체들이 초기화 됨
- 사용 : 초기화가 끝나면 Bean을 사용할 수 있음
- 소멸 : Spring Container가 종료될 때 Bean scope가 싱글턴인 객체들도 함께 소멸

<br>

### Bean 스코프

==**Bean 스코프 : 빈이 생성되고 존재하고 적용되는 범위를 지정할 수 있는 것**==
- `@Scope` 애노테이션을 사용하여 설정 가능
- default 타입은 싱글턴 타입

- 싱글턴
	- Spring Framework의 default scope
	- Spring Continaer 시작과 종료까지 1개의 객체로 유지
	- 빈 스코프를 싱글턴으로 설정할 경우 상태를 가지면 안된다.
		- 싱글턴 스코프의 빈이 value라는 상태를 가지고 있고 Thread 1이 value의 값을 증가시키고 Thread 2가 value라는 값을 가져와서 사용한다고 가정해보면, 해당 빈의 상태를 항상 예측할 수 없어서 의도한 결과가 항상 나온다고 보장할 수 없게 된다.
	- Spring이 시작할 때 생성됨

- 프로토타입
	- 빈의 생성, 의존관계 주입, 초기화까지만 관여하고 이후에는 컨테이너에서 관리하지 않는 스코프
	- 이 때문에 매번 요청마다 새로 만들어진다. 
		- 모든 스레드에서 공유하는 것이 아니므로 싱글턴과는 다르게 해당 객체는 상태를 가질 수 있다.
	- 요청할 때 생성됨

-   웹 스코프
    -   request : 각 요청이 들어오고 나갈때까지 유지
    -   session : 세션이 생성되고 종료될때까지 유지
    -   application : 웹의 서블릿 컨텍스트와 동일한 생명주기를 갖는 스코프
        -   서블릿 컨텍스트는 **web application내에 있는 모든 서블릿들을 관리하며 정보공유할 수 있게 도와 주는 역할** 을 하는데, 톰캣 컨테이너가 실행 시 애플리케이션 하나당 한개의 서블릿컨텍스트가 생성된다.
        -   생명 주기는 보통 톰캣의 시작과 종료와 일치한다.

<br>

### Bean 설정 시 주의점

1. 빈 스코프를 싱글턴으로 설정할 경우 상태를 가지면 안된다.
2. 의존성을 자동 주입해야 할 인터페이스에 구현체가 두 개 이상이라면, Spring은 어떤 구현체를 자동 주입할 지 정하지 못해서 충돌이 발생함.

<br>

```java
@Repository
public class InMemoryStationDao implements StationDao {

}

@Repository
public class JdbcStationDao implements StationDao {

}

@Service
public class StationService {
	private final StationDao stationDao;

	public StationService(final StationDao stationDao) {
		this.stationDao = stationDao;
	}
}

// 둘 중 어떤 구현체를 넣어야 할 지 Spring은 모른다
```

<br>
이 경우, 애노테이션을 이용하여 의존성 주입 시 우선순위를 정할 수 있음.

1. 의존성을 자동 주입해야 하는 구현체가 하나인 경우
	- `@Primary` 애노테이션
2. 상황에 따라 다른 구현체를 자동 주입 되도록
	- `@Qualifier` 애노테이션

<a href='/brain/Interview/dog-study/dog-week03' target='_blank'>3주차 - Spring 기본 # 주입하고자 하는 의존성이 여러 개 참고</a>

<br>

## 싱글턴

프로그램 전역에서 사용되는 유일한 클래스를 만드는 방법이 **싱글턴 패턴, 정적 클래스**이다.

싱글턴 패턴 : 디자인 패턴 중 하나로, ==**객체 인스턴스가 오로지 한 개만 생성 되도록 설계하는 패턴이다.**== 따라서, 애플리케이션 내에서 인스턴스가 유일해야 한다.

<hr>

### 싱글턴 패턴의 순수한 구현

- 인스턴스를 private static 변수
- `getInstance()`에서 인스턴스 생성
- 외부 생성자를 private으로 막는다.
- 문제점 : Thread-safe하지 않다.

<br>

<details>
<summary><strong>상세 설명 보기</strong></summary>

- 클래스의 인스턴스를 정적 필드에 저장 (`private static 변수`)
- 정적 메서드로 `getInstance()`에서 인스턴스 생성
	- 사용자가 인스턴스를 요청할 때마다 만약에 인스턴스가 존재하지 않으면 만들어서 반환하고 존재한다면 인스턴스를 반환
- 외부에서 인스턴스를 생성할 수 없도록 생성자를 private으로 막음

</details>

<br>

```java
public class Settings {
	private static Settings instance;

	private Settings() {
	}

	public static Settings getInstance() {
		if (instance == null) {
			instance = new Settings();
		}
		return instance;
	}
}
```

하지만, 이와 같은 구현은 ==멀티 스레드 환경에서 싱글턴이 보장되지 않는다. 즉, Thread-safe 하지 않다는 의미이다.==

스레드 A와 B가 동시에 요청을 보낸 상황
- A가 if문을 통과하여 인스턴스를 생성하기 전에 B도 통과한다고 가정해보자. 그러면 각각 다른 인스턴스가 생길 가능성이 존재한다.

<hr>

### 동기화(Synchronized)

- 인스턴스를 private static 변수
- **synchronized** `getInstance()`
- 외부 생성자를 private으로 막는다.
- 문제점 : 리소스 낭비

<details>
<summary><strong>상세 설명 보기</strong></summary>

- 위와 같은 문제를 해결하기 위해 synchronized 키워드를 이용한 동시성 문제 해결
- 현재 메서드를 사용하고 있는 스레드를 제외하고 나머지 스레드가 메서드에 접근할 수 없도록 막아준다.

</details>

<br>

```java
public class Settings {
	private static Settings instance;

	private Settings() {
	}

	public synchronized static Settings getInstance() {
		if (instance == null) {
			instance = new Settings();
		}
		return instance;
	}
}
```

하지만, 이와 같은 구현은 ==리소스가 낭비된다==는 단점이 있다. 멀티 스레드 환경에서 인스턴스를 하나만 만들기 위해서 synchronized 키워드를 사용했는데, 인스턴스가 존재하는 경우에는 더이상 필요 없기 때문이다.
- 괜히, 메서드를 실행할 때마다 Lock이 걸리게 되어 리소스 낭비가 발생

<hr>

### DCL

DCL(Double Checked Locking)은 두 번 체크하여 리소스 낭비를 줄여본 버전이다.

- **synchronized 시점 지연**
- private static **volatile** 인스턴스
- 외부 생성자를 private으로 막는다.
- 문제점 : volatile 키워드

<details>
<summary><strong>상세 설명 보기</strong></summary>

- 현재, `getInstance()` 메서드를 호출할 때마다 인스턴스가 있을 때는 synchronized 블록이 스킵되는 것이다. 즉시 인스턴스만 반환하게 되어 리소스 낭비를 없앨 수 있다.
- 이때, 클래스 변수에 정의해놨던 인스턴스를 `volatile` 키워드를 사용해야 한다.

</details>

<br>

<details>
<summary><strong>volatile 키워드?</strong></summary>

원래, 스레드를 이용하게 되면 각각의 스레드는 성능을 위하여 CPU 레지스터의 캐시 메모리를 사용하게 된다. 첫 번째 스레드 -> 캐시 메모리 -> 메인 메모리 순서로 값을 대입한다면, 다음 스레드는 메인 메모리에 담긴 값을 메인 메모리 -> 캐시 메모리 -> 두 번째 스레드 순서로 가져온다.

문제는, 첫 번째 스레드가 메인 메모리에 값을 넣기 이전인 상황에 두 번째 스레드가 메인 메모리에서 값을 읽으려고 할 때 발생한다. 이때 volatile 키워드를 사용하면 대입과 읽는 것 모두 메인 메모리에서 하도록 만들어서 시간차를 극복할 수 있다.

Java에서 volatile 키워드는 변수의 값을 다른 스레드에서 **변경할 수 있도록** 하며, 클래스를 thread-safe하게 만드는 데 사용된다. 이는 여러 스레드가 동시에 메소드와 클래스 인스턴스를 사용할 수 있게 하고 문제가 발생하지 않도록 한다. volatile 키워드는 기본형 혹은 객체와 함께 사용할 수 있다.

volatile 키워드는 상호배제(mutual exclusion)를 제공하지 않고도 데이터 변경의 가시성(visibility) 측면을 보장해주므로 매우 유용하다. 다중 스레드가 코드 블록을 병렬로 실행하는 것이 문제가 되지 않지만 가시성 속성을 보장해야 하는 경우에 사용한다. 또한 happens-before ordering을 수행한다.

volatile 키워드는 두 가지 다른 용도로 사용한다. JVM이 **레지스터(register)에서 값을 읽지 않도록 하고, 값을 메인 메모리에서 읽도록 하여**== 메모리 불일치 오류(memory in-consistency errors)의 위험을 줄인다.== 또한, JVM이 레지스터에서 값을 읽지 않도록 하고, 값을 메모리에서 읽도록 함으로써 ==메모리 일관성 오류(memory consistency errors)를 방지==한다.

정리하자면, Java에서 volatile 키워드는 다중 스레드 환경에서 변수의 가시성을 보장하고, 메모리 일관성 오류를 방지하며, 다중 스레드가 동시에 클래스와 메소드 인스턴스를 사용할 수 있게 하기 위해 사용된다.

</details>

<br>

```java
public class Settings {
	private static volatile Settings instance;

	private Settings() {
	}

	public static Settings getInstance() {
		if (instance == null) {
			synchronized (Settings.class) {
				if (instance == null) {
					instance = new Settings(); 
				}
			}
		}
		return instance;
	}
}
```

<br>

하지만, 이 코드도 완벽하지 않다. 이는 <a href='/brain/Interview/dog-study/dog-week01/' target='_blank'>개발바닥 1주차 면접스터디</a>의 DLCP 지양에 관한 이야기에서도 다룬 내용이다.

문제점은 volatile 키워드 자체가 JDK 1.5 이상에서만 구현가능하다는 점이 있고, JVM에 따라서 thread-safe 하지 않는 경우가 발생할 수 있다는 것이다. 자바의 메모리 모델이 "out-of-order-write"를 지원하기 때문에 메모리에 작성되는 순서를 보장하지 않기도 하다.

<hr>

### Bill Pugh Solution

**Bill Pugh Solution (Initialization on demand holder idiom)** : 싱글턴을 구현할 때 권장되어지는 방법 중의 하나이다. 구현 방법은 Holder 역할을 하는 `private static` 클래스를 이용하는 것이다.

- static inner class 인스턴스
- 생성자를 private
- 문제점 : 클라이언트가 임의로 싱글턴을 파괴할 수 있다.

```java
public class Settings {
	private Settings() {
	}

	private static class SettingsHolder {
		private static final Settings SETTINGS = new Settings();
	}

	public static Settings getInstance() {
		return SettingsHolder.SETTINGS;
	}
}
```

먼저, JVM의 ClassLoader에 의해 클래스가 로드될 때 실행하는 `loadClass()` 메서드의 내부를 봐보자.

![](brain/image/dog-week05-1.png)

여기서 보면 내부적으로 `synchronized`가 실행되는 것을 볼 수 있다. 그래서 명시적으로 synchronized를 이용하지 않고 동일한 효과를 낼 수 있다.

왜냐하면, 해당 SettingsHolder 클래스는 static 이므로 메서드가 실행될 때 JVM의 static initializer에 의해 초기화되고 메모리로 올라간다. **따라서, thread-safe와 lazy-loading을 둘 다 만족하는 싱글턴이 구현 가능하다.**

해당 코드의 문제점도 살펴보자. 클라이언트가 임의로 싱글턴을 파괴할 수 있다는 문제가 있다. 리플렉션과 직렬화를 통해 파괴할 수 있다고 한다.

<br>

### Enum

- enum 자체가 싱글턴이다.
- 애초에 생성자를 private으로 갖게 만들거고 상수만 갖는 클래스이기 때문에 싱글턴의 성질을 가진다.
- 리플렉션과 직렬화로 싱글턴을 깰 수도 없음.
- 문제점 : 싱글턴을 해제할 때 번거러움, Enum 이외 클래스 상속 불가

```java
public enum Settings {
	INSTANCE;
}
```

<br>

### 권장 방법

1. Bill Pugh 방법
	- Lazy Loading
	- thread-safe

2. enum
	- thread-Safe
	- 간편하다


<br>

### 정적 클래스

static class : static method만 갖고 있는 클래스를 의미한다. 자바에서는 따로 정적 클래스라는 것이 존재하지는 않는다.

<br>

```java
public class Setting {
	private Setting() {
	}

	// static 메서드들
	public static void setMap() {
	
	}
}
```

<br>

싱글턴과의 공통점
1. 스레드가 공유하는 메인 메모리쪽에 static이 올라가니까 전역적으로 사용 가능
2. 인스턴스를 따로 생성하지 않아서 유일성을 보장받을 수 있다.

싱글턴과의 차이점
1. 인스턴스를 생성할 수 없기 때문에 클래스 메서드를 이용한다는 점

<br>

**싱글턴 패턴 vs 정적 클래스**

- 싱글턴 패턴
	- 상속 받아서 사용할 수 있다.
	- 메서드 파라미터로 사용할 수 있다.
	- 권장 환경
		- 완벽한 객체지향을 필요로 할 때 ( = 애플리케이션 내에서 객체처럼 사용하고 싶을 때 )
		- lazy-loading이 필요할 때 ( = 인스턴스 생성 할 때 리소스가 많이 드는 경우 )
- 정적 클래스
	- 객체처럼 사용할 수는 없지만 컴파일 시 정적바인딩이 되기 때문에 보통 싱글턴보다 효율이 좋다.
	- 권장 환경
		- 유틸 메서드를 보관하는 용도로 사용할 때 ( = 유틸 클래스처럼 객체 성질이 필요 없을 때 사용하는 것을 권장 )
		- 다형성이나 상속이 필요없는 클래스

<br>

### Spring 싱글턴

사실, 위에서 언급한 다양한 싱글턴 패턴 구현의 단점들은 Spring 프레임워크를 사용하면서 모든 단점들이 없어지게 된다. 스프링에서 Bean 생성 시 별 다른 설정이 없으면 default로 싱글턴이 적용되는데, 이때 스프링은 컨테이너를 통해 직접 싱글턴 객체를 생성하고 관리한다.

==**객체의 생성을 스프링에 위임함으로써 스프링 컨테이너가 관리하기 때문에 그러하다.**==

스프링에서 DI(Dependency Injection)하는 방법으로 싱글턴 패턴을 적용하였다. 

- 싱글턴 : 농사를 하는 경우, 농부가 매번 삽을 만들면 삽을 만드는 것에 대한 리소스 낭비가 심할 것이기 때문에 공용 삽을 1개만 만들어 놓고 이를 돌려가면서 사용

- DI : 농부의 손에 아무것도 쥐게 하지 않고, 손에 쥘 수 있도록 준비만 해놓은 상태에서 대감마님이 농사 도구를 손에 쥐어주는 상황

싱글턴으로 공용 삽을 만들어놓은 상황에 알아서 사용하면 충분하지 않냐고 생각할 수 있다. 하지만, 그렇게 하면 삽을 만드는 시간, 메모리를 절약할 수 있는 장점이 있지만 **의존성이 높아져서 테스트하기 어려운 단점**이 있다.

예를 들어, 공용 삽과 호미 각각 1개를 농부 10명이 돌려쓰는 경우가 있다. 공용 삽과 공용 호미가 땅을 파는(Digging) 기능이 잘 되는지 테스트 해보고 싶은데, 삽이 단 1개, 호미가 단 1개이기 때문에 돌려 가면서 테스트하기 힘들다. 이때, 대감마님이 나서서 너부터 이걸로 테스트 해봐. 다음은 너가 이걸로 테스트 해봐. 교통정리 해주면 해결될 것이다.

농부가 땅파기 기능이 있는 도구를 받을 준비를 한 것이 생성자를 만들어 놓은 상태이다. 그리고 땅파 기 기능이 있는 인터페이스를 만들어놓으면 살과 호미는 땅파기 기능을 구현만 하면 된다. 이후, 대감 마님이 농사 도구를 농부에게 넘겨주는 식으로 하면 해결 !

결과적으로, 스프링에서 싱글턴 패턴을 사용하면서 얻게 되는 장점에는
- private 생성자가 필요 없어지게 되니까 상속이 가능해진다.
- 의존성이 높아져서 테스트하기 어려웠던 문제를 해결하여 테스트하기 편해진다.
- 프레임워크를 통해 1개의 객체 생성을 보장받을 수 있게 된다.
- static 메서드를 사용하지 않아서 객체지향적으로 개발할 수 있다.

<br>

## Annotation

==**Annotation(주석) : 코드 사이에 주석처럼 쓰이며 특별한 의미, 기능을 수행하도록 하는 기술이다.**==

- 메타 데이터의 일종
	- 애플리케이션이 처리해야 할 데이터가 아니라 컴파일러를 위한 정보를 제공하기 위한 용도
- 용도
	- 컴파일러에게 코드 작성 문법 에러를 체크하도록 정보를 제공
	- 소프트웨어 개발 툴이 빌드나 배치시 코드를 자동으로 생성할 수 있도록 정보 제공
	- 실행 시(런타임 시) 특정 기능을 실행하도록 정보 제공
- 동작 순서
	- 애노테이션 정의
	- 원하는 위치에 배치
	- 코드가 실행되는 중 Reflection을 이용하여 추가 정보를 획득하여 기능 실시

<details>
<summary><strong>Reflaction 상세보기</strong></summary>

-   Reflection이란 프로그램이 실행 중에 자신의 구조와 동작을 검사하고, 조사하고, 수정하는 것
-   Reflection을 사용하면 컴파일 타임에 인터페이스, 필드, 메소드의 이름을 알지 못해도 실행 중에 클래스, 인터페이스, 필드 및 메소드에 접근할 수 있다. 또한 새로운 객체의 인스턴스화 및 메소드 호출을 허용한다.
-   **Annotation 자체는 아무런 동작을 가지지 않는 단순한 표식일 뿐이지만, Reflection을 이용하면 Annotation의 적용 여부와 엘리먼트 값을 읽고 처리할 수 있다.**
-   **Spring 컨테이너(BeanFactory)에서 객체가 호출되면 객체의 인스턴스를 생성하게 되는데 이 때 필요하게 된다. 즉, 프레임워크에서 유연성있는 동작을 위해 쓰인다.**
-   Reflection을 이용하면 Annotation 지정만으로도 원하는 클래스를 주입할 수 있다.
-   Class에 적용된 Annotation 정보를 읽으려면 java.lang.Class를 이용하고  
    필드, 생성자, 메소드에 적용된 어노테이션 정보를 읽으려면 Class의 메소드를 통해 java.lang.reflect 패키지의 배열을 얻어야 한다.  
    - Class.forName(), getName(), getModifier(), getFields() getPackage() 등등 여러 메소드로 정보를 얻을 수 있다.

</details>

<br>

### Java Annotation

자바 표준 애노테이션은 자바에서 기본적으로 제공하는 애노테이션이다. 가장 많이 사용하는 4가지 애노테이션은 아래와 같다.

`@Override`
- 선언한 메서드가 오버라이드 되었다는 것을 나타냄
- 상위(부모) 클래스(혹은 인터페이스)에서 해당 메서드를 찾을 수 없으면 컴파일 에러 발생

`@Deprecated`
- 해당 메서드가 더 이상 사용되지 않음을 표시
- 컴파일러에게 이 메서드는 없어질 것이라는 걸 알려주고 사용하지 말라고 경고하는 것

`@SuppressWarnings`
- 선언한 곳의 컴파일 경고를 무시

`@FunctionalInterface`
- Java 8부터 지원, 함수형 인터페이스를 지정
- 메서드가 존재하지 않거나, 1개 이상의 메서드 (default 메서드 제외)가 존재할 경우 컴파일 오류 발생

### Meta Annotation

사용자가 직접 정의하여 사용하는 Custom Annotation을 만들 때 사용하는 것이 Meta Annotation이며, 프레임워크나 API 등을 만들어서 사용할 때 주로 사용한다. Custom Annotation은`@interface`를 통해 애노테이션 클래스를 작성할 수 있다. 이때 애노테이션은 내부에 값을 가질 수 있고 설정할 수 있는데, 설정하려면 `default 값` 형태로 설정해야 한다.

`@Retention`
- 애노테이션이 유지되는 기간을 정하기 위해 사용

`@Target`
- 애노테이션을 정의할 때 적용 대상을 지정할 때 사용

`@Documented`
- 애노테이션 정보를 javadoc로 작성된 문서에 포함

`@Inherited`
- 애노테이션이 하위 클래스에 상속되도록 함

`@Repeatable`
- 애노테이션을 반복해서 적용할 수 있게 함

<br>

### Spring Annotation

해당 Annotation에 대한 설명은 <a href='https://velog.io/@ruinak_4127/Annotation%EC%9D%B4%EB%9E%80#annotation-%EC%A2%85%EB%A5%98' target='_blank'>Spring Annotation 총정리</a>에서 몇 가지 가져온 것이다.

-   **@ComponentScan**
    -   @Component, @Service, @Repository, @Controller, @Configuration이 붙은 클래스 Bean들을 찾아서 Context에 bean을 등록해주는 애노테이션
    -   전부 다 @Component를 사용하지 않고 @Repository 등으로 분리해서 사용하는 이유는, 예를 들어 @Repository는 DAO에서 발생할 수 있는 unchecked exception들을 스프링의 DataAccessException으로 처리할 수 있기 때문이다.
    -   또한 가독성에서도 해당 애노테이션을 갖는 클래스가 무엇을 하는지 단 번에 알 수 있다.
-   **@EnableAutoConfiguration**
    -   autoConfiguration도 Configuration중 하나에 해당한다.
    -   spring.factories 내부에 여러 Configuration들이 있고 조건에 따라 Bean이 등록되게 되는데 메인 클래스 @SpringBootApplication을 실행하면 @EnableAutoConfiguration에 의해 spring.factories 안에 있는 수많은 자동 설정들이 조건에 따라 적용되어 수 많은 Bean들이 생성된다.
    -   간단하게 정리하면, **Application Context를 만들 때 자동으로 빈설정이 되도록 하는 기능이다.**
-   @Component
    -   개발자가 직접 작성한 class를 Bean으로 등록하기 위한 애노테이션
-   @Bean
    -   개발자가 직접 제어가 불가능한 외부 라이브러리등을 bean으로 만들려할 때 사용되는 애노테이션
-   @Configuration
    -   @Configuration을 클래스에 적용하고 @Bean을 해당 class의 메서드에 적용하면 @autowired로 Bean을 부를 수 있다.
-   @Autowired
    -   스프링이 Type에 따라 알아서 Bean을 주입해준다.
    -   Type을 먼저 확인한 후 못 찾으면 Name에 따라 주입한다.
    -   강제로 주입하고자 하는 경우 @Qulifier을 같이 명시
-   @Qualifier
    -   같은 타입의 빈이 두 개 이상 존재하는 경우 스프링이 어떤 빈을 주입해야할 지 알 수 없어서 스프링 컨테이너를 초기화하는 과정에서 예외가 발생한다.
    -   @Qualifier는 @Autowired와 함께 사용하여 정확히 어떤 bean을 사용할지 지정하여 특정 의존 객체를 주입할 수 있다.
-   **@Resource**
    -   **@Autowired와 마찬가지로 Bean 객체를 주입해주는데 차이점은 Autowired는 타입으로, Resource는 이름으로 연결해준다.**
    -   **애노테이션 사용으로 인해 특정 Framework에 종속적인 애플리케이션을 구성하지 않기 위해서 @Resource 사용을 권장한다.**
-   @Controller
    -   API와 view를 동시에 사용하는 경우에 사용
    -   보통 view 화면 return을 목적으로 사용한다.
-   @RestController
    -   view가 필요 없이 API만 지원하는 서비스에서 사용
-   @SpringBootApplication
    -   @Configuration, @EnableAutoConfiguration, @ComponentScan 3가지를 하나로 합친 애노테이션

<br>

## Spring MVC



<br>

## Layered Architecture

==**레이어드 아키텍처 패턴은 소프트웨어 아키텍처의 일반적인 패턴 중 하나이다. 일반적으로 사용자 상호 작용 레이어, 비즈니스 로직 레이어, 데이터 액세스 레이어, 데이터베이스 레이어로 구성된다.**==

레이어드 아키텍처 패턴은 백엔드 API 코드에 가장 널리 적용되는 패턴인데, **코드를 논리적인 부분 혹은 역할에 따라 독립된 모듈로 나누어서 구성하는 패턴**이다.

![](brain/image/dog-week05-2.png)

<br>

### Presentation Layer

Presentation Layer(User Interface) : 사용자 상호작용 레이어로, 해당 시스템을 사용하는 사용자 혹은 클라이언트 시스템과 직접적으로 연결되는 부분이다. 사용자가 애플리케이션과 상호 작용할 수 있는 스크린, 폼, 메뉴, 리포트 등을 포함한다.

웹 사이트에서는 UI 부분, 백엔드 API에서는 엔드포인트 부분에 해당한다. 그래서 백엔드 API 관점에서 보면, **Presentation layer에서 API의 엔드포인트들을 정의하고 전송된 HTTP request를 읽는 로직을 구현한다. 이 이상의 역할은 담당하지 않고 실제 시스템이 구현하는 비즈니서 로직은 다음 레이어로 넘긴다.**

- EndPoint
- Authentication (인증)
- JSON Translation

<br>

### Business Layer

Business Layer(Business Logic) : 애플리케이션의 비즈니스 로직을 처리하는 레이어이다. Presentation layer에서 전송된 요청을 읽어들여 요청에 맞게 동작하는 로직을 구현하면 된다. 예를 들어 회원가입 요청 시 필수적인 요소들이 다 포함되어 있지 않으면 거부한다던가 하는 로직 등이 비즈니스 로직이다.

-   Business Logic
-   Validation (사용자 중심의 시스템 검증)
-   Authorisation (권한 부여)

<details>
<summary><strong>영단어 Verification vs Validation</strong></summary>

- **Verificaion**은 개발자 중심의 시스템 검증 과정이며, 무언가를 만드는 **"과정"을 잘 지켰는지**를 의미 ( 스펙에 대한 요구사항을 충족했니? )
- **Validation**은 사용자 중심의 시스템 검증 과정이다. 무언가를 **최종적으로 만든 결과물이 잘 나왔는지**를 말한다. ( 사용자에 대한 요구사랑을 충족했니? )

</details>

<br>

### Persistence Layer

Persistence Layer(Data Access)는 데이터베이스와 상호 작용하며 데이터를 검색하고 저장한다. 즉, 데이터베이스와 관련된 로직을 구현하는 부분이다. Business Layer에서 필요한 데이터를 생성, 수정, 읽기 등을 처리하여 실제로 데이터베이스에서 데이터를 저장, 수정, 읽어오기를 하는 역할이다.

- Storage Logic

<br>

### Spring Layered Architecture

Spring도 레이어드 아키텍터로 구성된다. 레이어는 자신의 고유 역할을 수행하고 인접한 다른 레이어에 무언가를 요청하거나 응답하기 때문에 각 레이어는 자신의 역할에만 충실하면 된다.

**따라서 시스템 전체를 수정하지 않고 특정한 레이어의 기능을 개선하거나 교체할 수 있기 때문에 재사용성이 좋고 유지 보수하기에도 유리하다.  또한, 레이어별로 테스트 구현이 편해지고 코드 가독성도 높아진다.**

- Presentation Layer
	- Controller가 여기에 속한다. view를 담당하는 부분으로, 클라이언트와 직접적으로 맞닿는 부분이다.
- Business Layer
	- Service가 여기에 속한다. 비즈니스 핵심 로직을 처리하는 부분이기 때문인데, 이때 Service 객체라는 것은 **하나의 트랜잭션**으로 구성되어 작동한다.
- Persistence Layer
	- Repository가 여기에 속한다.

<br>

## 참고

- [우테코 10분 테코톡 - 주디의 Spring Bean](https://www.youtube.com/watch?v=3gURJvJw_T4&t=392s)
- [프로그래머스 데브코스 - Bean의 LifeCycle 정다현](https://www.youtube.com/watch?v=5CBZPb3o0XI)
- [우테코 10분 테코톡 - 아서의 싱글턴 패턴과 정적 클래스](https://www.youtube.com/watch?v=5oUdqn7WeP0)
- [Java Annotation](https://bangu4.tistory.com/199)
- [Custom Annotation](https://ittrue.tistory.com/m/158)
- [Spring Annotation 총정리](https://velog.io/@ruinak_4127/Annotation%EC%9D%B4%EB%9E%80#annotation-%EC%A2%85%EB%A5%98)
- [소프트웨어 아키텍처 패턴](https://velog.io/@vov3616/MVVM-MVC-MVP-MVI-%EB%AD%90%EA%B0%80-%EB%8B%A4%EB%A5%BC%EA%B9%8C)
- [레이어드 아키텍처 패턴](https://kimjingo.tistory.com/159)
- [스프링 부트 레이어드 아키텍처](https://www.javatpoint.com/spring-boot-architecture)