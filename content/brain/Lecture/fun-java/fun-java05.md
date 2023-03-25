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
