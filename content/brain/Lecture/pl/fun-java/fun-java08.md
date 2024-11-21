---
title: "08. 예외처리, enum"
date: "2023-03-31 01:26"
enableToc: true
tags: [""]
---

인프런의 <a href='https://www.inflearn.com/course/%EC%A6%90%EA%B1%B0%EC%9A%B4-%EC%9E%90%EB%B0%94' target='_blank'>부부 개발단 토토님의 즐거운 자바 강의</a>를 정리한 내용

<hr>

## 주석문

- 프로그래밍 실행과 관련 없는 문장
- 프로그램에 설명을 붙이기 위해 사용

| **주석기호** | **설명**                                                          |
| ------------ | ----------------------------------------------------------------- |
| `//`         | `//`부터 시작해서 줄 끝까지 주석처리                              |
| `/* ... */`  | `/*`와 `*/` 사이의 내용 모두 주석처리                             |
| `/** .. */`  | `/**`와 `*/` 사이의 내용 모두 주석처리. JavaDoc 주석문이라고도 함 | 

<br>

```java
/**  
 * 책 한 권의 정보를 담기 위한 클래스  
 *   
 * @author jaeyoon(<a href="mailto:wlwhsvkdlxh@gmail.com">신재윤</a>)  
 * @since 2023.03  
 * @version 0.1  
 * 
 */  
  
public class Book {  

	/**
	*  책의 제목을 반환한다.
	*  @return 책의 제목
	*/
	
	public String getName() { return title; }
```

이런식으로 주석문을 사용할 수 있다. JavaDoc 주석문에 `@`가 있는데 이 애노테이션들로 추가적인 정보를 제공할 수 있다. JavaDoc 주석문에서 사용하는 태그는 아래와 같다.

<br>

| **annotation** | **설명**                                                |
| -------------- | ------------------------------------------------------- |
| `@version`     | 클래스나 메서드의 버전                                  |
| `@author`      | 작성자                                                  |
| `@deprecated`  | 더이상 사용되지 않거나, 삭제될 예정                     |
| `@since`       | 언제 생성, 추가, 수정되었는가?                          |
| `@see`         | 외부 링크나 텍스트, 다른 필드나 메서드를 링크할 때 사용 |
| `@link`        | see와 동일한 기능. 링크 제공                            |
| `@exception`   | 발생할 수 있는 Exception 정의                           |
| ...            | ...                                                     | 

<br>

### JavaDoc 장점

- JavaDoc 주석문을 활용하여 Java Document를 만들 수 있다.

인텔리제이에서 JavaDoc 생성하기
1. shift 키를 2번 연속 누른다.
2. generate javaDoc을 입력
3. custom scope를 선택한 후 JavaDoc을 생성할 패키지, 클래스, 인터페이스 등을 선택한다. exclude를 선택해서 생성하지 않을 것들도 지정할 수 있다.
4. output directory에서 JavaDoc이 생성할 경로를 지정한다.
5. other command line arguments에는 다음을 입력한다.
	- `-encoding UTF-8 -charset UTF-8 -docencoding UTF-8`
6. OK 버튼 누르고 생성

![](brain/image/fun-java08-1.png)

![](brain/image/fun-java08-2.png)

<br>

### 주석문을 잘 작성하는 법

- 주석문이 없어도 이해할 수 있도록 클래스, 메서드, 변수 이름을 작성하는 것이다.
- 즉, 주석문을 최소한으로 작성하라는 것이다.
- 정~ 주석문을 쓸거면 JavaDoc 주석문을 잘 작성하자.


<hr>

## 예외 처리

**Error와 Exception : 비정상적으로 프로그램을 종료하게 되는 원인**

자세한 예외 처리는 [개발바닥 2주차 스터디](brain/Interview/dog-study/dog-week02) 참고

<br>

**Error의 종류**
- 컴파일 에러
	- 컴파일 시 발생하는 에러 (아예 실행 자체가 불가)
- 런타임 에러
	- 실행 시 발생하는 에러

<br>

**자바에서는 실행 시 2가지 형태의 오류가 발생할 수 있다.**
- Error : 수습할 수 없는 심각한 오류
	- 메모리 부족, 스택오버플로우(stack overflow) 등이 발생하여 프로그램이 죽는 것은 프로그래머가 ==**제어할 수 없음**==
	- 원인 자체를 해결해줘야함. 메모리를 늘리던지 과도하게 메모리를 사용하는 알고리즘을 재작성해서 프로그램을 실행하던지 등
- Exception(예외) : 예외 처리를 통해 수습할 수 있는 덜 심각한 오류
	- 프로그래머가 이런 예외가 발생하면 이렇게 하라고 ==**제어할 수 있음**==

<br>

```java
public class Exception01 {  
    public static void main(String[] args) {  
        ExceptionObj1 exobj = new ExceptionObj1();  
        int value = exobj.divide(10, 0);  
        System.out.println(value);  
    }  
}  
  
class ExceptionObj1 {  
    public int divide(int i, int k) {  
        int value = 0;  
        value = i / k;  
        return value;  
    }  
}
```

![](brain/image/fun-java08-3.png)

- 0으로 나눌 수 없다고 **Exception**이 발생하는 것을 볼 수 있다.
	- 이는 ==**JVM이 해당하는 예외 클래스의 객체 인스턴스를 생성하여 발생시키는 것**==이다.
- `value = i / k;` 부분에서 발생하는 것인데 이 부분에서 발생하는 예외를 처리한다면, 프로그램이 비정상적으로 종료되는 것을 막을 수 있다.
- 이를 예외 처리, Exception Handling이라고 한다.

<br>

### try-catch

- 예외 처리하는 가장 간단한 방법

```java
try {
	코드1
	코드2
	....
} catch (Exception클래스명1 변수명1) {
	Exception을 처리하는 코드
} catch (Exception클래스명2 변수명2) {
	Exception을 처리하는 코드
}
```

- 예외가 발생하면 JVM이 예외 클래스의 인스턴스를 생성하여 발생시킨다고 했었다.
- 이때문에 catch(타입명 참조하는변수)와 같이 적는 것이다.

<br>

```java
class ExceptionObj1 {  
    public int divide(int i, int k) {  
        int value = 0;  
        try {  
            value = i / k;  
        } catch (ArithmeticException e) {  
            System.out.println("0으로 나눌 수 없음");  
            System.out.println(e.toString());  
        }  
        return value;  
    }  
}

// 0으로 나눌 수 없음
// java.lang.ArithmeticException: / by zero
// 0
```

- 출력을 보면 예외 때문에 프로그램이 비정상적으로 종료되던 것과는 다르게 종료되지 않음
- e에 대하여 출력해보면 예외 클래스가 ArithmeticException 클래스임을 확인 가능

근데 이게 좋은 코드일까 ??

**1번 문제점 : 오류 발생한 결과보다 못한 경우**
- 10을 0으로 나눈다면, 결과가 있는게 아니라 아예 안나와야한다.
- 위와 같이 return 해주면 잘못된 value가 전달되는 것이다. 아까처럼 비정상적으로 프로그램이 종료되는게 훨씬 나을 결과다.

**2번 문제점 : 사용자가 원하지 않는 출력**
- ExceptionObj1 클래스를 A 개발자가 작성했고 B 개발자가 이를 이용한다고 하자.
- 하지만, B 개발자는 A 개발자가 의도한 출력을 원하지 않는 상황이 있을 수 있다.

<br>

### throws

- 메서드를 호출한 쪽으로 예외를 떠넘기는 방법

```java
리턴타입 메서드명(아규먼트 리스트) throws Exception클래스명1, Exception클래스명2 ... {
	코드1
	코드2
	...
}
```

<br>

```java
package chap08;  
  
public class Exception01 {  
    public static void main(String[] args) {  
        ExceptionObj1 exobj = new ExceptionObj1();  
        try {  
            int value = exobj.divide(10, 0);  
            System.out.println(value);  
        } catch (ArithmeticException e) {  
            System.out.println("0으로 나눌 수 없습니다.");  
        }  
    }  
}  
  
class ExceptionObj1 {  
    /**  
     * i를 k로 나눈 나머지를 반환한다.  
     * @param i  
     * @param k  
     * @return  
     * @throws ArithmeticException  
     */  
    public int divide(int i, int k) throws ArithmeticException {  
        int value = 0;  
        value = i / k;  
        return value;  
    }  
}

// 0으로 나눌 수 없습니다.
```

- 이렇게 예외를 메서드에서 호출하는 쪽으로 던져버려서 처리할 수 있도록 하면 try-catch에서 언급한 문제점 1, 2를 모두 해결하였다.
- 대신 중요한 점은 떠넘긴 예외를 반드시 처리해야한다. 무책임하게 떠넘기지만 하는 것은 좋지않다. 예를 들어, ==**main 메서드 뒤에 throws를 붙이는건 JVM에 예외를 떠넘기는 것으로, 굉장히 무책임한 행동이다.**==

<br>

### Checked / UnChecked

![](brain/image/fun-java08-5.png)

![](brain/image/fun-java08-4.png)

==**UnChecked Exception**==
- **RuntimeException 클래스를 상속받는** 예외 클래스들
- 컴파일 시에는 에러가 발생하지 않고, 실행 시에 에러가 발생해서 죽는 경우
- ==**반드시 예외 처리를 해야하는 것은 아니다. 처리하지 않아도 컴파일은 된다.**==

==**Checked Exception**==
- **RuntimeException 클래스를 상속받지 않으면서** Exception 클래스를 상속받는 예외 클래스들
- 컴파일 시에 에러가 발생함.
- ==**반드시 예외 처리를 해야한다. 그렇지 않으면 컴파일 에러 발생**==

![](brain/image/fun-java08-6.png)

![](brain/image/fun-java08-7.png)

- 애초에 IDE에서 빨간줄이 뜬다. 무시하고 실행해보면 빌드 자체가 안된다.

![](brain/image/fun-java08-8.png)

- RuntimeException을 상속받지 않는 Checked Exception임을 확인했다.
- 이는 반드시 예외처리를 해줘야하는 것이다.

<br>

번외로 Exception은 클래스이니까 ==**내가 커스텀한 예외 클래스**==도 만들 수 있을 것이다. 이 경우 Checked Exception 보다는 되도록이면, ==**UnChecked Exception으로 만드는 것이 좋다. 예외를 강제하지 않고 사용자가 알아서 처리하도록 하는 것이 여러 면에서 좋기 때문이다.**== 체크드가 많아지면 강제적으로 처리해야 하는 것이 너무 많아져서 귀찮고 좋지 않다.

<br>

### 다중 catch

- 여러 개의 catch 문을 사용해 다양한 예외를 처리할 수 있다.
- 그런데, Exception 하나만으로 가능한데 왜 여러 개를 쓰는가?
	- 좀 더 예외에 관해 구체적으로 처리하고 싶어서
- 주의할 점은 **catch 블록이 여러 개라 할지라도 단 하나의 catch 블록만 실행된다.**
	- 위에서부터 내려오다가 해당되면 그 catch 블록에서 처리하고 break 되는 것처럼 끝남
	- 이 때문에 ==**상위 예외 클래스가 하위 예외 클래스(더 상세한)보다 더 아래에 위치해야함**==

```java
public class Exception03 {  
    public static void main(String[] args) {  
        int[] array = {4, 0};  
        int[] value = null;  
  
        try {  
            value[0] = array[0] / array[1];  
        } catch (ArrayIndexOutOfBoundsException aiob) {  
            System.out.println(aiob.toString());  
        } catch (ArithmeticException ae) {  
            System.out.println(ae.toString());  
        } catch (Exception e) {  
            System.out.println(e);  
        }  
    }  
}
```

- ArithmeticException이 먼저 처리되니까 ArithmeticException 예외처리하고 끝!
- `array[] = {4, 2};` 라면 ArrayIndexOutOf 해당 안됨 -> ArithmeticException 해당 안됨 -> Exception에는 해당됨. 이 중에서도 NullPointerException에 해당되니까 그거 뱉을거

<br>

### Custom Exception

- 사용자 정의 Exception과 예외 발생시키기 (throw)
- ==**오류 메시지나, 발생한 Exception을 감싼 결과로 내가 만든 Exception을 사용하고 싶은 경우가 많아서 사용함**==

![](brain/image/fun-java08-9.png)

- 기본 RuntimeException이 가진 생성자 중에서 이 두 가지를 많이 사용함
- RuntimeException 발생 시 받은 메시지를 부모에게 전달
- Throwable은 또다른 Exception이나 RuntimeException을 받을 수 있다.
- Throwable은 Exception으로 바꿔서 받을 수도 있다.

얘는 문자열을 받거나 다른 Exception을 받아서 감싼 Exception을 만드려고 하는구나~로 이해

<br>

```java
class Exception05 {  
    public int divide(int i, int k) throws MyException {  
        int value = 0;  
        try {  
            value = i / k;  
        } catch (ArithmeticException ae) {  
            throw new MyException("0으로 나눌 수 없슴");  
        }  
        return value;  
    }  
}
```

- `value = i / k;`에서 JVM이 `throws` 해준 것을 개발자가 다시 받아서 개발자가 만든 `MyException`으로 다시 Exception을 `throw`로 재생성해서 발생하게 한 것

<br>

![](brain/image/fun-java08-10.png)

![](brain/image/fun-java08-11.png)

<br>

### Custom 상세 사용법

Custom Exception을 정확하게 어떤 경우에 사용하면 좋을까?

![](brain/image/fun-java08-12.png)

이러한 이유로, 아래와 같이 Custom Exception을 이용하면 훨씬 편할 것

![](brain/image/fun-java08-13.png)

<hr>

## enum

- Enum은 Enumeration의 약자로 JDK 5부터 지원하는 기능
- ==**Enum 덕분에 타입에 안전한, Type-Safety한 코드 작성 가능**==

<br>

### 상수 사용 시 문제점

- JDK 5 이전에 어떤 상수들을 표현하고자 할 때 아래와 같이 작성했다.

```java
public class DayType {
	public final static int SUNDAY = 0;
	public final static int MONDAY = 1;
	public final static int TUESDAY = 2;
	public final static int WEDNESDAY = 3;
	public final static int THURSDAY = 4;
	public final static int FRIDAY = 5;
	public final static int SATURDAY = 6;
	
}
```

- DayType 클래스는 `final static int`로 정의된 상수를 6개 가지고 있음

<br>

```java
int today = DayType.SUNDAY;
// 0
```

- today는 SUNDAY 상수 값을 가지게 되니 0이라는 숫자 값을 가짐

<br>

```java
if (today == DayType.SUNDAY) {
	System.out.println("일요일입니다.");
}
```

- 이렇게 검사도 가능

<br>

그런데 문제는, today는 int형이라서 상수로 정의한 일월화수목금토, 0~6사이 값 이외에 다른 값도 할당할 수 있다. ==**즉, 정해진 값만 변수에 할당할 수 있는 건 아니라는 문제점이 있다. 이를 타입에 안전하지 않다고 하여 (No-Type-Safety)라고 한다.**==

<br>

### enum 사용

- 위와 같은 문제를 해결하고자 enum이 나왔다.
- 클래스를 생성하는 것과 같은 방식으로 Enum을 생성
	- 인텔리제이에서 new java class file 하면 목록에 enum 있음

```java
package chap08.enumtype;  
  
public enum Day {  
    SUNDAY,  
    MONDAY,  
    TUESDAY,  
    WEDNESDAY,  
    THURSDAY,  
    FRIDAY,  
    SATURDAY  
}
```

- Day 안에 상수를 나타내는 값을 적는다.
- 보통 모두 대문자로 표현하는데, 상수와 상수는 콤마로 구분한다.

<br>

```java
package chap08.enumtype;  
  
public class Today {  
    private Day day;  
  
    public Day getDay() {  
        return day;  
    }  
  
    public void setDay(Day day) {  
        this.day = day;  
    }  
}
```

- Today 클래스에서 사용된 ==**Day 타입은 enum 타입**==이다.
- enum Day에 선언된 것만 사용 가능하다.
- ==**즉, setDay에 들어올 수 있는 값은 enum에 선언된 일월화수목금토만 가능하다는 의미**==

<br>

```java
package chap08.enumtype;  
  
public class TodayTest {  
    public static void main(String[] args) {  
        Today today = new Today();  
        today.setDay(Day.SATURDAY);  
        System.out.println(today.getDay());  
    }  
}

// SATURDAY
```

- 타입에 안전한 코드 작성 가능!!

<br>

### Enum 타입의 특징

**밑에서 설명할 특징들**

- Enum은 타입에 대해 안전하다. 미리 정의된 Enum 변수 안의 상수만을 대입할 수 있다.
- Enum 값끼리 비교할 때는 비교 연산자를 사용한다.
- Enum은 switch 문에서 사용 가능하다.
- Enum은 인터페이스를 구현하고, 해당 인터페이스를 오버라이딩하여 구현할 수 있다.
- Enum은 추상 메서드를 가질 수 있다. 추상 메서드를 가질 경우엔 상수를 정의할 때 추상 메서드를 함께 구현해 줘야한다.
- Enum 생성자와 값을 지정할 수 있다.
- Enum은 이 외에도 아래와 같은 특징을 가진다.
	- Enum 객체는 Enum 상수가 처음 호출되거나 참조될 때 생성된다.
	- Enum은 Serializable과 Comparable 인터페이스를 이미 구현하고 있다.

<hr>

- ==**Enum은 타입에 대해 안전하다. 미리 정의된 Enum 변수 안의 상수만을 대입할 수 있다.**==

```java
// 가능
Day day = Day.SUNDAY;

// 불가능
Day day = 5;
```

<br>

- ==**Enum 값끼리 비교할 때는 비교 연산자를 사용한다.**==
	- 상수기 때문에 메모리 상에 딱 하나만 올라가니까 같은 주소를 참조할 것

```java
Day day1 = Day.MONDAY;
Day day2 = Day.MONDAY;

if (day1 == day2) {
	System.out.println("같은 요일입니다.");
}
```


- ==**Enum은 switch 문에서 사용 가능하다.**==
	- JDK 7 이상부터는 switch 문에서 String도 사용 가능해서 그럼
- switch 문을 사용하는 경우에는 case에 `day.SUNDAY`와 같이 쓰면 컴파일 오류가 나서 안되고 상수만 적어야 한다.

```java
package chap08.enumtype;  
  
public class DaySwitchTest {  
    public static void main(String[] args) {  
        Day day = Day.SUNDAY;  
  
        switch (day) {  
            case SUNDAY:  
                System.out.println("일요일 입니다.");  
                break;  
            case MONDAY:  
                System.out.println("월요일 입니다.");  
                break;  
            default:  
                System.out.println("그 밖의 요일");  
        }  
    }  
}
```

<br>

- ==**Enum은 인터페이스를 구현하고, 해당 인터페이스를 오버라이딩하여 구현할 수 있다.**==

```java
public interface Printer {
	public void print();
}
```

<br>

```java
public enum Color implements Printer {  
    RED("FF0000"),  
    GREEN("00FF00"),  
    BLUE("0000FF");  
      
    private String rgb;  
    private Color(String rgb) {  
        this.rgb = rgb;  
    }  
  
    @Override  
    public void print() {  
        System.out.println("rgb : " + rgb);  
    }  
}
```

<br>

```java
public class ColorTest {  
    public static void main(String[] args) {  
        Color color = Color.RED;  
        color.print();  
    }  
}

// rgb : FF0000
```

<br>

- ==**Enum은 추상 메서드를 가질 수 있다. 추상 메서드를 가질 경우엔 상수를 정의할 때 추상 메서드를 함께 구현해 줘야한다.**==

```java
public enum Country {  
    KOREA {  
        public void print() {  
            System.out.println("대한민국");  
        }  
    },  
    JAPAN {  
        public void print() {  
            System.out.println("일본");  
        }  
    },  
    USA {  
        public void print() {  
            System.out.println("미국");  
        }  
    };  
    public abstract void print();  
}
```

<br>

```java
public class CountryTest {  
    public static void main(String[] args) {  
        Country country = Country.KOREA;  
        country.print();  
    }  
}

// 대한민국
```

<br>

- ==**Enum 생성자와 값을 지정할 수 있다.**==
	- Enum은 생성자를 가질 수 있지만, 단, private 해야한다.
	- Enum의 생성자는 내부에서만 호출 가능하다.

```java
public enum Gender {  
    MALE("XY"),  
    FEMALE("XX");  
  
    private String chromosome; // 염색체  
    private Gender(String chromosome) {  
        this.chromosome = chromosome;  
    }  
}
```

- MALE과 FEMALE 2가지 상수 가짐
- 위에서 나온 예제와 다르게 상수 뒤에 `("XY")`, `("XX")` 있음
- **상수 뒤에 괄호 열고 닫고 기호가 있으면 Enum의 생성자를 호출하게 됨**
- 생성자가 호출되어 chromosome가 초기화 된다.
- 이렇게 값을 지정했다 하더라도 앞에서 설명한 것처럼 동일하게 enum 쓰면 됨

<br>

```java
public class GenderTest {  
    public static void main(String[] args) {  
        Gender gender = Gender.MALE;  
        System.out.println(gender);  
    }  
}

// MALE
```

- Gender 타입의 변수 gender에는 `Gender.MALE`이나 `Gender.FEMALE` 값만 할당 가능
- 해당 gender를 출력하면 상수 이름이 그대로 출력됨

<br>

### Enum에 메서드와 변수 선언

- Enum 안에 선언된 메서드나 변수를 가질 수 있음
- 또한 Object가 가지고 있는 메서드를 오버라이딩 할 수도 있음
	- 오호라~ `toString()` 쓸 수 있겠구만?
- Gender Enum을 생성할 때 chromosome 필드를 작성했었는데, Gender Enum에 Object가 가지고 있는 toString() 메서드를 오버라이딩 해보자

```java
public enum Gender {  
    MALE("XY"),  
    FEMALE("XX");  
  
    private String chromosome; // 염색체  
    private Gender(String chromosome) {  
        this.chromosome = chromosome;  
    }  
  
    @Override  
    public String toString() {  
        return "Gender{" +  
                "chromosome='" + chromosome + "\'" +  
                "}";  
    }  
  
    public void print() {  
        System.out.println("염색채 정보 : " + chromosome);  
    }  
}
```

<br>

```java
public class GenderTest {  
    public static void main(String[] args) {  
        Gender gender = Gender.MALE;  
        System.out.println(gender);  
        gender.print();  
    }  
}
// Gender{chromosome='XY'}
// 염색채 정보 : XY
```

- 동일하게 출력하면 `MALE`이라는 enum 상수값만 출시되는 아까와는 다르게 `toString()` 메서드를 오버라이딩 했기 때문에 저런 출력이 나온다.

<br>

### EnumMap

- EnumMap은 Enum 타입을 키(key)로 사용할 수 있도록 도와주는 클래스
	- 키 값으로 Enum에 정의된 것만 사용 가능
- `import java.util.EnumMap;`으로 임포트해서 사용!

```java
import java.util.EnumMap;  
  
public class EnumMapTest {  
    public static void main(String[] args) {  
        EnumMap emap = new EnumMap(Day.class);  
        emap.put(Day.SUNDAY, "일요일은 자는 것이 최고");  
        emap.put(Day.FRIDAY, "불금은 놀아야지");  
        emap.put(Day.MONDAY, "월요병.. 극혐..");  
  
        System.out.println(emap.get(Day.SUNDAY));  
    }  
}

// 일요일은 자는 것이 최고
```

<br>

### EnumSet

- EnumSet은 Enum 상수를 Set 자료구조로 다루기 위한 유용한 메서드를 제공하는 클래스

```java
import java.util.EnumSet;  
import java.util.Iterator;  
  
public class EnumSetTest {  
    public static void main(String[] args) {  
        EnumSet eset = EnumSet.allOf(Day.class);  
        Iterator<Day> dayIter = eset.iterator();  
  
        while (dayIter.hasNext()) {  
            Day day = dayIter.next();  
            System.out.println(day);  
        }  
        
        System.out.println("-------------------------------------");  
  
        EnumSet eset2 = EnumSet.range(Day.MONDAY, Day.WEDNESDAY);  
        Iterator<Day> dayIter2 = eset2.iterator();  
        
        while (dayIter2.hasNext()) {  
            Day day = dayIter2.next();  
            System.out.println(day);  
        }  
    }  
}

// SUNDAY
// MONDAY
// TUESDAY
// WEDNESDAY
// THURSDAY
// FRIDAY
// SATURDAY
// --------------------------
// MONDAY
// TUESDAY
// WEDNESDAY
```

- EnumSet의 static 메서드인 `allOf()` 메서드는 인자로 들어온 Enum 타입의 모든 상수를 가지고 있는 EnumSet 객체를 리턴한다