---
title: "05. 객체지향 3/3"
date: "2023-03-25 00:01"
enableToc: true
tags: [""]
---

인프런의 <a href='https://www.inflearn.com/course/%EC%A6%90%EA%B1%B0%EC%9A%B4-%EC%9E%90%EB%B0%94' target='_blank'>부부 개발단 토토님의 즐거운 자바 강의</a>를 정리한 내용

<hr>

## 생성자

- 인스턴스를 생성할 때 사용
- **어떤 값을 가지고 인스턴스가 만들어지게 하고 싶다**면 생성자를 사용
- 클래스 작성 시 생성자를 하나도 만들지 않았다면 자동으로 기본 생성자(default) 생성자 생성
	- 기본생성자는 매개변수를 하나도 받지 않는 생성자를 의미
- **생성자를 하나라도 만들게 되면 기본 생성자가 자동으로 안만들어짐**  
- **생성자 오버로딩(Overloading) 가능**
- ==**`cmd + p` 누르면 생성자에 어떤 파라미터 들어가는지 확인 가능**==

<br>

**생성자 생성**

```java
class Car {
	public Car() {
		System.out.println("자동차가 1대 생성됩니다.");
	}
}
```
- 생성자는 메서드와 비슷하다.
- ==**return type이 없고, 클래스이름과 같아야 한다.**==

<br>

**생성자로 만들 때 필드 가지게**

```java
class Car {  
	// 필드가 가지는 것  
	// 처음에 참조형으로 선언하고 초기화 안했으니 당연히 null이겠네
    private String name;
  
    public Car() {  
        System.out.println("자동차가 1대 생성됩니다.");  
    }  
  
    public Car(String name) {  
        this.name = name;  
    }  
  
    public void printName() {  
        System.out.println("자동차 이름 : " + name);  
    }
}

public class CarExam02 {  
    public static void main(String[] args) {  
        Car c1 = new Car();  
        c1.printName();  
        System.out.println("----------------------");  
        Car c2 = new Car("람보르기니");  
        c2.printName();  
    }  
}

// 자동차가 1대 생성됩니다.
// 자동차 이름 : null
// ----------------------
// 자동차 이름 : 람보르기니
```

<br>

### 불변객체

- 생성자에 넣어준 값은 return하는 기능만 있음.
- setter 메서드를 만들어놓지 않았음
- 인스턴스가 만들어질때 값을 넣어주고 getter 메서드만 가지고 있는 객체를 ==**불변 객체(immutable Object)라고 함.**==
- 태어날 때 어떤 값을 가지고 태어나게 한 다음에 외부에 전달할 때 불변객체를 사용
	- 외부에 전달했을 때 값이 바뀌지 않았다는 불변성이 보장되어야 하는 경우 !
- 참고로, ==**문자열 String 클래스는 대표적인 불변객체이다.**==
	- 이 말은 String이 가지고 있는 모든 메서드는 String 내부의 값을 변화시키지 않는다는 의미이다. 

```java
public class User {  
    private String email;  
    private String password;  
    private String name;  
  
    // 생성자를 하나라도 만들게 되면 기본 생성자가 자동으로 안만들어짐  
    public User(String name, String email) {  
        this.name = name;  
        this.email = email;  
    }  
  
    // 생성자 오버로딩(Overloading)  
    public User(String name, String email, String password) {  
        this.name = name;  
        this.email = email;  
        this.password = password;  
    }  
  
    public String getEmail() {  
        return email;  
    }
  
    public String getName() {  
        return name;  
    }  
}
```

<br>

### 생성자 toString()으로 출력

근데 귀찮게 매번 `user.getName()`, `user.getEmail()` 이렇게 한꺼번에 하기 힘들지않니? 이전시간에 배운 `toString() 오버라이딩`을 이용해보자.

<br>

```java
public class User {  
    private String email;  
    private String password;  
    private String name;  
  
    // 생성자를 하나라도 만들게 되면 기본 생성자가 자동으로 안만들어짐  
    public User(String name, String email) {  
        this.name = name;  
        this.email = email;  
    }  
  
    // 생성자 오버로딩(Overloading)  
    public User(String name, String email, String password) {  
        this.name = name;  
        this.email = email;  
        this.password = password;  
    }  
  
    public String getEmail() {  
        return email;  
    }  
  
    public String getName() {  
        return name;  
    }  

	// password는 일부로 뺐음
    @Override  
    public String toString() {  
        return "User{" +  
                "email='" + email + '\'' +  
                ", name='" + name + '\'' +  
                '}';  
    }  
}

public class UserExam {  
    public static void main(String[] args) {  
        User user2 = new User("신재윤", "wlwhsvkdlxh@gmail.com", "1234");  
        System.out.println(user2);  
    }  
}

// User{email='wlwhsvkdlxh@gmail.com', name='신재윤'}
```

<br>

### this 생성자

근데 위에 생성자쪽 코드보면 중복이 생긴다. `this.name=name;`, `this.email=email;`

```java
public User(String name, String email) {  
    this.name = name;  
    this.email = email;  
}  
  
public User(String name, String email, String password) {  
    this.name = name;  
    this.email = email;  
    this.password = password;  
}
```

- 위에껀 2개를 받는 생성자
- 아래껀 3개를 받는 생성자
- 중복된 코드를 줄이기 위하여 생성자 안에서 자기 자신의 생성자를 호출할 수 있음

```java
public User(String name, String email) {  
	// password는 없으니까 null
    this(name, email, null);
}  
  
public User(String name, String email, String password) {  
    this.name = name;  
    this.email = email;  
    this.password = password;  
}
```

- 되도록 파라미터를 많이 받아들이는 쪽의 생성자를 this로 호출!
	- 2개쪽에서 3개쪽의 생성자를 호출
-  ==**this는 인스턴스 자기 자신을 참조할 때 사용하는 키워드**==
	- this() 생성자는 자기 자신의 생성자를 의미
	- this() 생성자는 생성자 안에서만 사용 가능
	- this() 생성자는 생성자 안에서 super() 생성자를 호출하는 코드 다음이나, 첫 번째 줄에 위치해야함.

<br>

### super()

- ==**super는 인스턴스 부모를 참조할 때 사용하는 키워드**==
- super() 생성자는 부모 생성자를 의미
- super() 생성자는 생성자 안에서만 사용 가능
- super() 생성자는 생성자 안에서 무조건 첫 번째 줄
- 생성자는 무조건 super() 생성자를 호출해야 한다.
	- ==**사용자가 super() 생성자를 호출하는 코드를 작성하지 않았다면 자동으로 부모의 기본 생성자가 호출**==된다.
- ==**부모클래스가 기본 생성자를 가지고 있지 않다면, 사용자는 반드시 자식 클래스에서 직접 super() 생성자를 호출하는 코드를 작성해야 한다.**==

<br>

```java
public class Car2 {  
    public Car2() {  
        System.out.println("Car2() 생성자 호출");  
    }  
}

public class Bus2 extends Car2{  }

public class Car2Exam {  
    public static void main(String[] args) {  
        Car2 c1 = new Car2();  
        Bus2 b1 = new Bus2();  
    }  
}

// Car2() 생성자 호출
// Car2() 생성자 호출
```

- Bus2 클래스에 아무것도 안적었는데 이게 무슨일 !?
- 사실 기본 생성자(=디폴트 생성자)에 `super()` 메서드가 컴파일 타임에 자동으로 들어가서 그렇다.

```java
public class Car2 {  
    public Car2() {  
	    super();  // 자동으로 들어간다.
        System.out.println("Car2() 생성자 호출");  
    }  
}

public class Bus2 extends Car2{ 
	public Bus2() { // 자동으로 들어간 디폴트 생성자
		super();  // 자동으로 들어간다.
	}
}

public class Car2Exam {  
    public static void main(String[] args) {  
        Car2 c1 = new Car2();  
        Bus2 b1 = new Bus2();  
    }  
}

// Car2() 생성자 호출
// Car2() 생성자 호출
```

- 실질적인 코드는 이와 같다.

```java
public class Car2 {  
    public Car2() {  
        System.out.println("Car2() 생성자 호출");  
    }  
}

public class Bus2 extends Car2{ 
	public Bus2() {
		System.out.println("Bus2() 생성자 호출");
	}
}

public class Car2Exam {  
    public static void main(String[] args) {  
        Car2 c1 = new Car2();  
        Bus2 b1 = new Bus2();  
    }  
}

// Car2() 생성자 호출
// Car2() 생성자 호출
// Bus2() 생성자 호출
```

- 이 코드도 자동으로 `super()` 이 자동으로 추가되어서 부모 생성자도 같이 호출됨

<br>

### 부모에 기본생성자 없으면?

- 만약 아래와 같이 부모 Car2 클래스에서 기본 생성자가 없는 상황이라고 하자.

```java
public class Car2 {  
    public Car2(String name) {  
        System.out.println("Car2() 생성자 호출");  
    }  
}
```

```java
public class Bus2 extends Car2{  
    public Bus2() {  
        super();  // 에러!!
        System.out.println("Bus2() 생성자 호출");  
    }  
}
```

이러면 Car2를 상속받는 Bus2의 `super()` 에서 문제가 생긴다. 
- 부모가 기본생성자를 가지고 있지 않으니까, 그에 맞는 형식으로 만들어줘야함
- ==**부모가 기본 생성자가 없으면, 자식 생성자에서는 부모가 가지고 있는 생성자를 super를 통해 호출해줘야한다. 안그러면 컴파일 오류난다.**==

<hr>

## 추상 클래스

- 추상 클래스는 ==**인스턴스가 될 수 없는 클래스**==
	- 추상 클래스를 상속받는 자손이 인스턴스가 된다.
	- 따라서, 반드시 자식 클래스가 필요하다.
- `abstract` 키워드를 사용하여 클래스 정의
- 추상 클래스는 보통 1개 이상의 추상 메서드 가짐
	- 추상 메서드가 없어도 오류가 발생하진 않음
	- 추상 메서드는 메서드가 선언만 되어있고 구현되어있지 않은 메서드
- `public abstract class 클래스명 { ... }`
- ==**즉, 추상 클래스는 미완성인 클래스이다. 메서드가 여러 개 있다면 그 중 몇 개는 구현되어있지 않고 선언만 되어있음**==

<br>

```java
public abstract class Car2 {  
    public Car2(String name) {
        System.out.println("Car2() 생성자 호출");  
    }  

    public abstract void run();  
}
```

- 추상 메서드 `run()`가 선언만 되어있고 구현되어있지는 않다.
- Car2 추상 클래스를 상속받는 자식들은 `run()` 메서드를 구현하지 않으면 컴파일 에러가 발생한다.

<br>

```java
public class Bus2 extends Car2 {  
    public Bus2() {  
        super("Bus!!");  
        System.out.println("Bus2 기본 생성자");  
    }  

    @Override  
    public void run() {  
        System.out.println("후륜구동으로 동작한다.");  
    }  
}

public class SportsCar extends Car2 {  
    public SportsCar(String name) {  
        super(name);  
    }  
  
    @Override  
    public void run() {  
        System.out.println("사륜구동으로 동작한다.");  
    }  
}
```

- Car2를 상속받은 두 클래스 모두 `run()` 메서드를 `@Override`를 이용하여 오버라이딩해서 구현했다.
- 부모가 기본 생성자가 없기 때문에 반드시 super()를 호출하는 모습 또한 확인가능하다.

<br>

### 인스턴스를 만들면 어떻게 될까?

**아래와 같은 코드일 때 어떤 결과가 나올까?**

<br>

```java
Car2 c = new Car2();  
c.run();
```

- `Car2' is abstract; cannot be instantiated` 오류 발생
- 추상 클래스는 인스턴스가 될 수 없는 클래스이니까!

<br>

### 부모 타입으로 자식 참조

<br>

```java
Car2 c = new Bus2();
c.run()

// Car2() 생성자 호출
// Bus2 기본 생성자
// 후륜구동으로 동작한다.
```

- 이전 시간에 한 것처럼 부모의 타입으로 자식 인스턴스를 참조한다.
- ==**메서드가 오버라이딩되면 무조건 자식의 메서드가 실행되니까**==

<br>

### 추상클래스와 배열

<br>

```java
public class Car2Exam {  
    public static void main(String[] args) {  
        Car2[] array = new Car2[2];  
        array[0] = new Bus2();  
        array[1] = new SportsCar("스포츠카");  
        for (Car2 c2 : array) {  
            c2.run();  
        }  
    }  
}
```

- Car2를 2개 참조할 수 있는 배열을 선언  
- 자동차의 배열 = 자동차의 후손들을 참조할 수 있는 배열
- 오브젝트 배열 = 모든 객체를 참조할 수 있는 배열  
- ==**일반화시켜서 여러가지 것들을 마치 하나의 종류인 것처럼 다룰 수 있다. 추상클래스와 배열을 사용하면 편리하게 다룰 수 있음!**==
	- 그래서, 버스든 스포츠카든 자동차라는 하나의 종류로 일반화시켜서 다루는 것

<br>

### 템플릿 메서드 패턴, protected

==**추상 클래스는 템플릿 메서드 패턴(Template Method Pattern)에서 가장 많이 사용된다고 생각함.**==

프로그래밍을 작성하는데, 어떤 기능들이 있다고 하자. 이 기능들은 항상 **초기화, 실행, 마무리**의 순서로 작성되어야한다. 그런데 이때, **초기화와 마무리는 동일하고 실행만 다르다**고 해보자. Controller 클래스를 상속받도록 하여 만들자.

<br>

```java {title="Controller.java"}
public abstract class Controller {  
    public void init() {  
        System.out.println("초기화 하는 코드");  
    }  
  
    public void close() {  
        System.out.println("마무리 하는 코드");  
    }  
  
    public abstract void run(); // 매번 달라지는 코드  
  
    public void execute() {  
        this.init();
        this.run();  
        this.close();  
    }  
}
```

- `init()`과 `close()`는 미리 구현해놓고 `run()`은 추상 메서드로 선언하여 선언만하고 구현은 Controller를 상속받는 클래스에게 하도록 한다.
- 추가로 `execute()` 메서드를 만들어서 ==**정해진 순서대로 실행하도록 만든 메서드를 추가했다. 이런 메서드를 템플릿 메서드라고 한다.**==

<br>

```java {title="FirstController.java"}
public class FirstController extends Controller {  
    @Override  
    public void run() {  
        System.out.println("별도로 동작하는 코드 111111");  
    }  
}
```

<br>

```java {title="ControllerMain.java"}
public class ControllerMain {  
    public static void main(String[] args) {  
        Controller c1 = new FirstController();  
        c1.execute();  
        }  
}
```

- 부모 타입(Controller)으로 자식(FirstController)을 참조하도록 했다.
- 하지만 이렇게하면 **부모 클래스인 Controller의 init과 close 메서드의 접근제한자가 public이라서 ControllerMain 클래스에서 `c1.init()`과 같은 형태로 사용할 수 있게 되버린다.**

<br>

```java {title="Controller.java"}
public abstract class Controller {  
    protected void init() {  
        System.out.println("초기화 하는 코드");  
    }  
  
    protected void close() {  
        System.out.println("마무리 하는 코드");  
    }  
  
    public abstract void run(); // 매번 달라지는 코드  
  
    public void execute() {  
        this.init();
        this.run();  
        this.close();  
    }  
}
```

- 접근제한자 public을 protected으로 바꿔서 상속받는 클래스만 사용할 수 있게 코드를 수정했다.
- ==**접근제한자 protected는 동일한 패키지 내에 존재하거나, 상속받는 클래스만 사용 가능**==하다.
- 하지만, 이렇게하면 문제점이 `init()`과 `close()`를 상속받는 클래스에서 수정할 수 있다.

<br>

```java {title="Controller.java"}
public abstract class Controller {  
    protected final void init() {  
        System.out.println("초기화 하는 코드");  
    }  
  
    protected final void close() {  
        System.out.println("마무리 하는 코드");  
    }  
  
    public abstract void run(); // 매번 달라지는 코드  
  
    public void execute() {  
        this.init();
        this.run();  
        this.close();  
    }  
}
```

- init()과 close()의 수정을 막기 위해 ==**`final` 키워드를 붙여 재선언이 불가능하게 만들었다.**==

<br>

정리한 내용은 아래와 같다.

> - 반복되는 메서드는 미리 선언과 구현을 해줬음
> - 매번 달라지는 메서드는 추상 메서드로 선언만 하고 구현은 상속받는 클래스에 넘김
> - 제작자가 원하는 순서대로 메서드가 실행되도록 **템플릿 메서드를 구현**했음
> - 사용하는 곳에서 반복되는 메서드를 직접 사용하지는 못하게 접근제한자를 protected으로 수정했음
> - 상속받는 곳에서 반복되는 메서드를 직접 수정하지 못하게 final 키워드를 추가했음

<br>

### 접근제한자

<br>

| 접근제한자 | 클래스 내부 | 동일 패키지 | 하위 클래스 | 그 외 |
|:----------:|:-----------:|:-----------:|:-----------:|:-----:|
|   **public**   |      O      |      O      |      O      |   O   |
| **protected**  |      O      |      O      |      O      |   X   |
|  **default(없음)**   |      O      |      O      |      X      |   X   |
|  **private**   |      O      |      X      |      X      |   X   | 

<br>

<hr>

## final 클래스, 불변객체 String

### final

- 부모가 될 수 없는 클래스가 있다.
	- abstract 클래스는 인스턴스가 될 수 없기 때문에 반드시 자식이 필요하다고 했다.
- ==**상속을 금지시키려면 클래스를 정의할 때 final 키워드를 사용한다.**==
- `public final class 클래스명 { ... }`

<br>

### String 클래스

- String 클래스는 대표적인 ==**final 클래스이다. 따라서, 상속받을 수 없다.**==
- String은 대표적인 ==**불변 객체**==이다. 따라서, 문자열을 만들 때마다 내부적으로 새로운 문자열을 만든다.

<br>

```java {title="StringExam.java"}
public class StringExam {  
    public static void main(String[] args) {  
        String str1 = "hello";  
        String str2 = "hello";  
        String str3 = new String("Hello");  
        String str4 = new String("hello");  
  
        if (str1 == str2)  
            System.out.println("str1 == str2");  
        if (str1 == str3)  
            System.out.println("str1 == str3");  
        if (str3 == str4)  
            System.out.println("str3 == str4");  
    }  
}

// str1 == str2
```

- `""`로 선언한 문자열은 Heap 영역의 String Pool에 미리 저장되고, 동일한 문자열에 대해서 동일하게 참조를 한다. 따라서, ==**String은 불변을 보장한다는 의미이다.**==
- new로 선언하면 Heap 영역에 인스턴스 형태로 매번 새로 생성한다. 따라서 메모리 낭비이기 때문에 String을 new로 선언하는 것은 좋지 못하다.

<br>

### equals()

- ==**문자열의 값이 같은지를 확인할 때는 `equals()` 메서드를 사용하자.**==
- `toUpperCase()`는 소문자를 대문자로 바꾸는 메서드
- `substring()`은 파라미터에 입력한 인덱스부터 출력해주는 메서드

```java {title="StringExam02.java"}
public class StringExam2 {  
    public static void main(String[] args) {  
        String str1 = "hello";  
        String str2 = new String("hello");  
  
        if (str1.equals(str2)) {    // 값이 같나요?  
            System.out.println("str1과 str2의 값이 같다.");  
        }  
  
        String s = str1.toUpperCase();  
        System.out.println(s);  
        System.out.println(str1);  
  
        String substring = str1.substring(3);  
        System.out.println(substring);  
        System.out.println(str1);  
    }  
}
// str1과 str2의 값이 같다.
// HELLO
// hello
// lo
// hello
```

<hr>

## 인터페이스

==**인터페이스(interface)는 기능들의 목록이다. 선언만 있고 구현은 없다.**==

- "무슨 기능을 만들어야 할까?" vs "구현부터 하기"
- ==**어떤 기능을 만들어야 할 지 부터 고민하자**==
	- 회원가입 기능? 로그인 기능? 게시판 글쓰기 기능?
- 만들어야 할 기능들을 관련된 것끼리 묶은 후 이름을 지어준다.
	- 기능들을 잘 모아서 가지는 것을 **응집도가 높다!** 
- 다시 한 번 말하지만, ==**설계라는 것은 이름을 정하는 것**==이다.
	- 클래스의 이름을 정하고 메서드의 이름을 정하고 그들간의 관계를 형성

<br>

### 인터페이스 작성법

<br>

```java
[public] interface 인터페이스이름 { ... }

// 예시
public interface User { ... }
```

- "인터페이스이름"은 Upper Camel Case로 작성
- interface도 확장자가 .java 파일로 작성
- interface도 추상 클래스처럼 인스턴스화 할 수 없다.
- **인터페이스의 모든 필드는 public static final 이어야 하며, 모든 메서드는 public abstract** 이어야 한다.
	- ==**필드가 public static 하다는 건 메모리에 인스턴스가 올라가지 않아도 사용할 수 있다는 의미**==이다.
	- 따라서, `클래스명.필드명`이 가능하다는 의미
	- ==**메서드가 추상메서드라는 말은 구현하는 클래스에서 메서드를 오버라이딩 해야한다는 것**==
- Java 7까지는 **final, abstract를 생략하면 자동으로 붙는다.**
- Java 8부터는 **디폴트(default) 메서드와 정적(static) 메서드도 선언 가능**

<br>

### JDK8 추가 문법

- A라는 사용자가 3개의 메서드가 선언된 인터페이스를 작성한 후 라이브러리로 제공하는 형태로 외부에 공개하였음
- 여러 사용자가 해당 인터페이스를 이용해 구현함
- A라는 사용자가 인터페이스에 1개의 메서드를 추가하였음
- 여러 사용자들은 라이브러리가 업데이트 된 줄 알고 업데이트함. 어떤 일이 발생할까?
	- 새로 추가된 추상 메서드 때문에 컴파일 에러가 발생할 것

<br>

이 때문에 ==**디폴트(default) 메서드**==가 나왔다.
- 새로 추가된 메서드를 선언만 한게 아니라 ==**구현까지 해버린 것**==
- 그래서 라이브러리 업데이트 해도 마치 상속받는 것처럼 추가된 메서드를 사용할 수 있음
- 원한다면 메서드 오버라이딩도 가능!

<br>

추가로 ==**정적(static) 메서드**==도 추가되었다.
- 인터페이스를 구현한 클래스가 없어도 `인터페이스명.method()`의 형태로 사용가능


<br>

### 로또 번호 생성기 실습

먼저, 구현할 기능에 대한 인터페이스 작성을 해보자.

1. 1~45까지 번호가 있는 공을 로또 기계에 넣는다.
2. 로또 기계에 있는 공들을 섞는다.
3. 섞인 공 중 6개를 꺼낸다.

<br>

```java {title="LottoMachine.java"}
public interface LottoMachine {  
    int MAX_BALL_COUNT = 45;  
    int RETURN_BALL_COUNT = 7;  
  
    public void setBalls(Ball[] balls); // Ball[]은 Ball 여러 개를 받겠다. 45개를 받는다.  
    public void mix();  // 자기가 가지고 있는 Ball들을 섞는다.  
    public Ball[] getBalls();   // 6개의 Ball을 반환한다.  
}
```

- 모든 필드에는 `public static`, 모든 메서드에는 `abstract`를 붙여야하지만, Java 8부터는 생략해도 자동으로 붙는다.
- 필드가 public static 하다는거니까 `LottoMachine.MAX_BALL_COUNT`처럼 쓸 수 있다는 의미
- 생각의 과정
	- 코드를 보면 `Ball[]`을 쓰니까 Ball 객체를 위해 Ball 클래스를 만들어야겠네.
	- 인터페이스를 구현할 LottoMachineImpl 클래스를 만들어야겠네.
	- 메인 메서드를 포함할 LottoMachineMain 클래스를 만들어야겠네.

<br>

```java {title="Ball.java"}
// 생성자를 통해서만 값을 받고 setter가 없으니 불변객체
public class Ball {  
    private int number;  
  
    public Ball(int number) {  
        this.number = number;  
    }  
  
    public int getNumber() {  
        return number;  
    }  
}
```

<br>

```java {title="LottoMachineImpl.java"}
// 인터페이스를 구현하게 되면 반드시 인터페이스가 가지고 있는 메서드를 오버라이딩 할 필요가 있다.  
public class LottoMachineImpl implements LottoMachine {  
  
    private Ball[] balls;  
  
    @Override  
    public void setBalls(Ball[] balls) {  
        this.balls = balls;  
    }  
  
    @Override  
    public void mix() {  
        for(int i = 0; i < 10000; i++) {  
            int x1 = (int) (Math.random() * LottoMachine.MAX_BALL_COUNT);  
            int x2 = (int) (Math.random() * LottoMachine.MAX_BALL_COUNT);  
            if (x1 != x2) {  
                Ball tmp = balls[x1]; // 값을 치환할 때는 같은 Type의 임시변수가 필요하다.  
                balls[x1] = balls[x2];  
                balls[x2] = tmp;  
            }  
        }  
    }  
  
    @Override  
    public Ball[] getBalls() {  
        // Ball 6개를 참조할 수 있는 배열  
        Ball[] result = new Ball[LottoMachine.RETURN_BALL_COUNT];  
        for (int i = 0; i < LottoMachine.RETURN_BALL_COUNT; i ++) {  
            result[i] = balls[i];  
        }  
        return result;  
    }  
}
```

- `Math.random()` : 숫자를 랜덤하게 정하고 싶을 때
	- 이 메서드는 `0.0 <= x < 1.0`의 실수값이 나온다. 예를 들어, 0.5432342 같은거
	- 여기에 45를 곱했다고 생각해보자. `0.0 <= x < 45.0`이겠네
	- 이걸 int로 형변환 해주면 정밀한 범위 -> 덜 정밀한 범위니까 정보의 손실 발생
	- 따라서, `0 <= x < 45`니까 0~44 정수겠네!
- 이렇게 랜덤한 값을 구하고 나면 둘을 swap 한다.
	- 0~44 인덱스를 가지는 배열이 있다.
	- 랜덤하게 뽑은 인덱스가 3번과 9번이라고 하자.
	- 3번 인덱스는 숫자가 4인 공을 참조, 9번 인덱스는 숫자가 10인 공을 참조
	- 이때, 참조를 서로 바꾼다. 3번 인덱스는 숫자가 10인 공을 참조하게 바꾸고 9번 인덱스는 숫자가 4인 공을 참조하도록 바꾼다.
	- 컴퓨터는 속도가 빠르기 때문에 이 과정을 10,000번 반복한다.
	- 이러면 공을 섞는 효과가 나는 것이다.

<br>

```java {title="LottoMachineMain.java"}
public class LottoMachineMain {  
    public static void main(String[] args) {  
        Ball[] balls = new Ball[LottoMachine.MAX_BALL_COUNT];  
        for (int i = 0; i < LottoMachine.MAX_BALL_COUNT; i++) {  
            balls[i] = new Ball(i + 1);  
        }  
  
        // 인터페이스도 참조하는 레퍼런스 타입은 가능하다.  
        // LottoMachine 인스턴스가 생성된다.  
        LottoMachine lottoMachine = new LottoMachineImpl();  
        lottoMachine.setBalls(balls);  
        lottoMachine.mix();  
        Ball[] result = lottoMachine.getBalls();  
  
        for (int i = 0; i < result.length; i++) {  
            System.out.println(result[i].getNumber());  
        }  
    }  
}
```

- `Ball b1 = new Ball(1);`과 같이 b1~b45까지 한다고 하면, 변수가 45개나 필요하다.
	- 이렇게 ==**같은 타입의 변수가 여러 개 필요한 상황에 배열을 사용하면 유용하다.**==
- `Ball[] balls = new Ball[45];`와 같이 배열로 만들었음
	- Ball 인스턴스 45개를 참조할 수 있는 배열이 만들어진 것
	- 방이 45개 있는 것이고, 각각의 방이 인스턴스를 참조할 수 있는 변수
	- 따라서, 아직은 참조형 변수를 초기화 안해서 null을 참조하는 상태
- `balls[i] = new Ball(i + 1);`
	- Ball 인스턴스를 만들어서 방이 이것을 참조하게 만들었음
- 즉, **배열 변수인 balls는 배열의 방을 참조하고 배열의 방은 Ball 인스턴스를 참조하는 형태**

![](brain/image/fun-java05-1.png)

<br>

<hr>

## 팩토리 메서드 패턴

- 자동차를 구입하여 사용하고 싶은데, 고객 입장에서 자동차가 만들어지는 과정은 궁금하지 않음
- 객체가 생성되는 과정을 숨겨주는 패턴이 팩토리 메서드 패턴이다.
- ==**공장에서 하는 복잡한 생산 과정을 숨기고, 완성된 인스턴스만 반환한다.**==

<br>

```java {title="BeanFactory.java"}
public class BeanFactory {  
    // 1. private 생성자를 만들어서 외부에서 인스턴스를 생성하지 못하게 한다.  
    private BeanFactory() {}  
  
    // 2. 자기 자신 인스턴스를 참조하는 static한 필드를 선언한다.  
    private static BeanFactory instance = new BeanFactory();  
  
    // 3. 2번에서 생성한 인스턴스를 반환하는 static한 메서드를 만든다.  
    public static BeanFactory getInstance() {  
        return instance;  
    }

	// 객체 생성 메서드
	public Bus getBus() {  
	    return new Bus();  
	}
}
```

- 싱글턴 패턴으로 작성된 BeanFactory 클래스가 있다고 하자.
- 여기에 `getBus()` 메서드를 통해 `new Bus()`라는 새로 생성한 인스턴스를 반환한다.

<br>

```java {title="BeanFactoryMain.java"}
public class BeanFactoryMain {  
    public static void main(String[] args) {  
        BeanFactory bf1 = BeanFactory.getInstance();  
        BeanFactory bf2 = BeanFactory.getInstance();  
        if (bf1 == bf2) {  
            System.out.println("bf1 == bf2");  
        }  
  
        Bus b1 = bf1.getBus();  
        Bus b2 = bf1.getBus();
    }  
}
```

- 원래는 객체를 사용하는 클래스에서 `Bus bus = new Bus();`와 같이 직접 인스턴스를 생성했다면, 팩토리 메서드 패턴을 통해 객체 생성 과정을 가릴 수 있다.
- `Bus bus = bf1.getBus();`라고 작성하면 bf1에 객체 생성을 맡겨서 그 과정을 가릴 수 있게 된다. ==**객체 생성을 대신 해주는 곳을 팩토리라고 한다.**==

<br>

### 클래스로더 이용 인스턴스 생성

생각의 과정을 살펴보자.

1. `a()` 메서드를 가지는 클래스가 있다.
2. 하지만 클래스의 이름을 아직은 모른다.
3. 나중에 클래스 이름을 가르쳐준다.
4. 이때 `a()` 메서드를 실행할 수 있도록 코드를 작성하라.

<br>

이런 경우, 사용할 수 있는 방법이 클래스로더를 이용한 인스턴스 생성이다.
- JVM의 클래스로더는 클래스를 CLASSPATH 에서 찾는다.
- 이를 이용하면 아래의 코드와 같다.

```java
String className = "클래스풀네임";
Class clazz = Class.forName(className);
Object obj = clazz.newInstance();
```

<br>

예를 들어, Car 추상 클래스가 있고 이를 상속받는 Bus, SuperCar 클래스가 있다고 하자.

<br>

```java {title="chap05/Car.java"}
public abstract class Car {  
    public abstract void a();  
}
```

<br>

```java {title="chap05/Bus.java"}
public class Bus extends Car {  
    public void a() {  
        System.out.println("Bus 클래스 a()");  
    }
}
```

<br>

```java {title="chap05/SuperCar.java"}
public class SuperCar extends Car {  
    public void a() {  
        System.out.println("SuperCar 클래스 a()");  
    }
}
```

<br>

```java {title="ClassLoaderMain.java"}
public class ClassLoaderMain {  
    public static void main(String[] args) throws Exception {  
        String className = "chap05.Bus";  
        Class clazz = Class.forName(className);  
        Object obj = clazz.newInstance();  

		Car car = (Car)obj;
    }  
}

// Bus 클래스 a()
```

- className에 해당하는 클래스 정보를 CLASSPATH에서 읽어들이고 그 정보를 참조변수 clazz가 참조하도록 하였다.
- 그를 통해 인스턴스를 생성하고 obj에 저장했다.
- Bus와 SuperCar를 Car라는 추상 클래스로 일반화하여 형변환 했다.
	- 이때문에 className이 `chap05.Bus`든 `chap05.SuperCar`든 상관없다.

그러나, 만약 아예 Car와 관련없는 MyHome이라는 클래스를 받아온다면? 위 코드는 동작하지 않을 것이다. Car 타입으로 형변환 할 수 없기 때문이다.

<br>

```java {title="ClassLoaderMain.java"}
public class ClassLoaderMain {  
    public static void main(String[] args) throws Exception {  
        String className = "chap05.MyHome";  
        Class clazz = Class.forName(className);  
        Object obj = clazz.newInstance();  

		Method m = clazz.getDeclaredMethod("a", null);
		m.invoke(obj, null);
    }  
}

// MyHome 클래스 a()
```

- Method 타입으로 참조하는 참조변수 m은 className에서 `a()` 메서드 정보를 가지고 있는 메서드를 반환받은 것이다. m은 메서드 정보라는 말이다.
- `m.invoke()`는 Object obj가 참조하는 객체의 m 메서드를 실행하라는 의미이다.

<br>

> 정리하자면, ==**클래스 정보를 얻고 그 정보를 통해서 인스턴스를 만든다. 그리고 메서드 이름을 통해서 실행한다. 즉, 문자열로 된 클래스 이름과 문자열로 된 메서드 이름만 있어도 인스턴스를 만들도록 표현할 수 있는 방법이 있다는 말이다. 이것이 자바의 리플렉션(Reflection)이다.**==

<br>

### 팩토리 메서드 패턴 + 리플렉션

- 객체를 생성해주는 공장(팩토리)이 있다.
- 이 공장에서는 클래스로더를 이용한 인스턴스 생성처럼 리플렉션을 이용해 복잡한 과정을 거쳐 객체를 생성해준다.
- 하지만 사용하는 입장에서는 이 과정을 모른다.
- ==**따라서, 복잡한 과정은 모르겠지만, 클래스 이름만 가지고도 인스턴스를 생성해주는 공장을 얻게 된 것이다.**==

<br>

<hr>

## 익명 클래스

### 이름없는 클래스

- Anonymous Class
- `new 생성자() {...}`
- 원래라면 생성자가 나오면 세미콜론으로 끝난다.
	- `Car car = new Car();`
- ==**익명 클래스는 생성자 뒤에 중괄호가 나오고 보통 코드를 오버라이딩 하여 구현**==한다.
- ==**재사용 하지 않고 특정 부분에서만 수행할 때 사용한다.**==

<br>

```java {title="Car.java"}
public abstract class Car {  
    public abstract void a();  
}
```

<br>

```java {title="CarExam.java"}
public class CarExam {  
    public static void main(String[] args) {
        Car car = new Car(){  
            @Override  
            public void a() {  
                System.out.println("이름없는 객체의 a() 메서드 오버라이딩");  
            }  
        };  
  
        car.a();  
    }  
}

// 이름없는 객체의 a() 메서드 오버라이딩
```

- Car 클래스는 추상 클래스이기 때문에 `Car car = new Car();`와 같이 인스턴스화 할 수 없다.
- 이때 Car를 상속받고 있기는 하지만 클래스를 만들고 싶지 않다고 하자. 그래서 Car를 상속받고 있는 이름없는 객체를 만들었다.
- 필요한 부분만 메서드 오버라이딩 하여 사용할 수 있음.

<br>

```java {title="MyRunnable.java"}
public interface MyRunnable {  
    public void run();  
}
```

<br>

```java {title="MyRunnableMain.java"}
public class MyRunnableMain {  
    public static void main(String[] args) {  
        MyRunnable r = new MyRunnable() {  
            @Override  
            public void run() {  
                System.out.println("MyRunnable run!!!");  
            }  
        };  
  
        r.run();  
    }  
}

// MyRunnable run!!!
```

- 인터페이스도 추상 클래스처럼 인스턴스화 할 수 없다.
- 하지만, 익명 객체를 만들면 바로 메서드 오버라이딩 되면서 사용할 수 있게 되는 것을 확인할 수 있다.

<br>

### 추가 예시

<br>

```java {title="MyRunnable.java"}
public interface MyRunnable {  
    public void run();  
}
```

<br>

```java {title="RunnableExecute.java"}
public class RunnableExecute {  
    public void execute(MyRunnable myRunnable) {  
        myRunnable.run();  
    }  
}
```

- 이렇게 인터페이스를 메서드의 매개변수(파라미터)로 넣을 수도 있다.
	- 뭐, 인스턴스화만 못할 뿐이지 당연한 것 아니겠는가?

<br>

```java {title="MyRunnableMain2.java"}
public class MyRunnableMain2 {  
    public static void main(String[] args) {  
		MyRunnable myRunnable = new MyRunnable() {  
		    @Override  
		    public void run() {  
		        System.out.println("hello!!!");  
		    }  
		};  
		  
		RunnableExecute runnableExecute = new RunnableExecute();  
		runnableExecute.execute(myRunnable);  
    }  
}

// hello!!!
```

- RunnableExecute 클래스의 `execute()` 메서드는 MyRunnable 인터페이스를 파라미터로 받고 있다.
- 따라서, 그에 대하여 익명 객체를 생성하여 파라미터로 넣어줬다.
- ==**재사용할 일이 없다고 생각하면 이렇게 이름없는 객체를 사용할 수 있다.**==

<br>

```java {title="MyRunnableMain2.java"}
public class MyRunnableMain2 {  
    public static void main(String[] args) {  
		RunnableExecute runnableExecute = new RunnableExecute();  
		runnableExecute.execute(new MyRunnable() {  
		    @Override  
		    public void run() {  
		        System.out.println("hello!!!");  
		    }});  
    }  
}

// hello!!!
```

- 이와 같이 바로 `execute()` 메서드의 파라미터에서 익명 객체를 생성해줘도 된다. 

<br>

### 람다 인터페이스

==**람다(Lambda) 인터페이스는 메서드를 딱 하나만 가지고 있는 인터페이스 일 때 사용할 수 있다.**==
- 람다(lambda) interface는 메서드를 딱 "한 개" 가지고 있다.
- 객체를 이름없는 객체로 만들어서 전달할 수 있다.
- 람다 인터페이스를 사용하는 람다 표현식은 JDK 8에서 추가되었다.
- JDK 8에 추가된 이러한 문법들을 사용할 때 보통 모던 자바(Modern JAVA)라고 한다.
- Stream API와 만나면 굉장히 편리하게 사용할 수 있다.

<br>

```java {title="MyRunnableMain2.java"}
public class MyRunnableMain2 {  
    public static void main(String[] args) {  
        RunnableExecute runnableExecute = new RunnableExecute();  
        runnableExecute.execute(() -> {  
            System.out.println("hello!!!");  
        });   
    }  
}
// hello!!!
```

- 추가적인 예시에서 보여줬던 형태 말고 이렇게 작성할 수 있다.
- ==**이름없는 객체를 간략화시켜서 람다(Lambda) 인터페이스로 구현했다.**==

<br>

```java
@Override  
public void run() {  
   System.out.println("hello!!!");  
}

// 위에께 이렇게 간략화 !

() -> {  
   System.out.println("hello!!!");  
}
```