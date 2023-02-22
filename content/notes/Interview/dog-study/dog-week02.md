---
title: "Exception Handling"
date: "2023-02-18 18:58"
enableToc: true
tags: ["Exception Handling", "Spring 예외 처리", "Spring 예외 흐름"]
---

<a href='https://github.com/dingding-21/Rebellion-Of-Interviewees/issues/4' target='_blank'>2주차 스터디 Issue 바로가기</a> 

<hr>

>[!note] 2주차 스터디
><br>
> **TOPIC - 01** <br>
> &nbsp;&nbsp;&nbsp;Java의 Exception Handling 방법에 대하여 설명해주세요.
> <br><br>
> **TOPIC - 02** <br>
> &nbsp;&nbsp;&nbsp;Spring에서의 예외 처리 방법과 흐름에 관하여 설명해주세요.



## TOPIC 01 - 예외 핸들링

제공하고 있는 서비스가 **프로그램 실행 중** 어떤 원인에 의하여 비정상적으로 종료가 되었다고 하자. 이러한 경우 대처를 어떻게 해야할까?

- **실행 중을 뜻하는 것이라서 Runtime Exception을 의미**하는 것이다.
	- Error : 오류는 메모리 부족, 스택오버플로우와 같이 일단 발생하면 복구할 수 없는 심각한 오류이기 때문에 개발자가 예측이 불가능하다. 따라서 프로그램 코드에 어떠한 대비는 불가능
	- Exception : Exception Handling을 통하여 개발자가 예측해서 프로그램 코드에 대비가 가능하다.
		- Checked Exception : Runtime 시점이기 때문에 고려하지 않는다. 애초에 Checked Exception이면 컴파일 자체가 안되고 빨간줄이 뜰 것
		- **Unchecked Exception : 바로 이 부분에 관하여 핸들링하는 것이다.**

<br>

### 예외복구

- Exception이 발생하여도 Application은 정상적으로 동작
- Exception 발생 시 이를 예측하여 다른 비즈니스 로직 흐름으로 유도
- Exception이 발생하지 않는 상황으로 복구를 시도하는 로직을 추가
- `try-catch-finally` 블록을 이용하여 예외상황을 파악하고 정상상태로 되돌려 놓는 것

예를 들어, 네트워크의 환경이 좋지 않아서 서버에 접속이 안되는 상황의 시스템에 적용하면 효율적일 것이다. 

<details>
<summary><strong>==코드 예시보기==</strong></summary>

```java
private void NetworkThrowException() {
    int maxTry = 5;
    while(maxTry --> 0) {
    	try {
    		// RandomException 이 Throw 될 수 가능성이 있는 로직
        	// 성공 시 return, 해당 메소드 종료
        	return ;
    	} catch(RandomException re) {
    		// Error 로그 출력
            // 실패 로직 존재 시 원상 복구
        	// 일정 시간 동안 대기
    	} finally {
    		// 작업에 사용한 Resource 반환 및 정리
    	}
    }
    // 최대 횟수 실패시 예외 Throw
    throw new MaxTryFailedException();

	// 혹은 네트워크 연결 실패 페이지로 이동시켜 흐름을 전환할 수도 있음
}
```

</details>

<br>

### 예외회피

- 메서드에 `throws`를 붙여서 예외처리를 직접 담당하지 않고 호출한 쪽으로 던져서 회피
- 예외를 회피하고 던지는 것이 정말 최선일 경우에만 던지기
- 긴밀하게 역할을 분담하고 있는 경우가 아니라면, 굉장히 무책임한 행동
- 프로그래머가 예외처리를 각자 프로그램에 맞기 처리하도록 유도하는 경우에는 괜찮을 수도 있음

> [!note] 잠깐! throw와 throws의 차이는? <br>
> - **throw**는 예외를 던져주는 코드, 특정 조건에서 예외를 던지는 것, 사용자가 직접 예외를 만들어서 일부로 발생시킬 때 사용하는 것
> - **throws**는 throw 값을 받는 곳에서 예외를 처리하도록 하여, 예외처리의 주체를 바꿔주는 것
> - 메서드 옆에 붙이는 건 **throws**, new 연산자 옆에 붙이는게 **throw**

<br>

### 예외전환

- 특정 Exception 발생 시 명확한 의미의 새로운 Exception으로 전환하고 호출한 쪽으로 던짐
- 호출 부분에서 Exception Handling 할 때, 어떤 Exception인지 분명하게 하여 해당하는 Exception에 대한 Handling이 수월하게 해주는 것
- `Checked Exception`처럼 복구 불가능한 Exception을 **catch**하여 `Unchecked Exception`으로 전환하여 Handling 하면 다른 계층에서 일일이 Checked Exception을 선언하지 않도록 한다

예를 들어, 클라이언트 단에서는 SQLException에 대하여 어떻게 처리해야할 지 모를 것이다. 이러한 Checked Exception에 관하여 **서버 단에서 클라이언트 단에게 에러 메세지를 정확하게 알려주고 싶은 경우**에 사용하면 유용한 방법이다.

대표적인 예시로, Spring에서 로그인 5회이상 실패 혹은 잘못된 이미지 파일 확장자 검사 등 예외상황에 Unchecked Exception으로 처리하는 것이 일반적이다.

<details>
<summary><strong>==코드 예시보기==</strong></summary>

<a href='https://dev-cool.tistory.com/24' target='_blank'>코드출처</a>

```java
public class ExceptionTest {
	public static void main(String[] args) throws CustomException {
		String test = "test";

		try {
			System.out.write(test.getBytes());
		} catch (IOException e) {
			throw new CustomException("list 못 읽음");
		}
	}
}

public class UncheckedExceptionTest {
	static String test;
	public static void main(String[] args) throws NullPointerException {
		String test2 = test.toLowerCase();
		System.out.println(test2);
	}
}
```

</details>

<br><br>

### 다중 catch

try 블록 내부는 다양한 종류의 예외가 발생할 수 있다. 이를 해결하는 방법이 여러 개의 catch문을 사용하는 것이다.

**하지만 catch 블록이 여러 개라 할지라도 단 하나의 catch 블록만 실행된다.** 그 이유는 try 블록에서 동시 다발적으로 예외가 발생하지 않고, 하나의 예외가 발생하면 즉시 실행을 멈추고 해당 catch
블록으로 이동하기 때문이다.

**그렇기 때문에 상위 예외 클래스가 하위 예외 클래스(더 상세한)보다 아래쪽에 위치해야 한다.** try블록에서 예외가 발생했을 때, 예외를 처리해줄 catch블록은 위에서부터 차례대로 검색된다. 만약, 상위 예외 클래스의 catch블록이 위에 있다면, 하위 예외 클래스의 catch 블록은 실행되지 않는다.

왜냐하면 ==하위 예외는 상위 예외를 상속했기 때문에 상위 예외 타입도 되기 때문==이다. 아래 코드 예시처럼 상위 예외 클래스인 Exception이 ArrayIndexOutOfBoundsException보다 위에 있으면 에러가 난다.

<details>
<summary><strong>==코드 예시보기==</strong></summary>

```java
// Exception이 더 상위니까 에러남
public class CatchExceptionTest {  
    public static void main(String[] args) {  
        try {
		    // 블라블라~ 
        } catch (Exception e) {  
    
        } catch (ArrayIndexOutOfBoundsException e) {  
        
        }
    }  
}

// 상위 예외 클래스가 아래로 가야 에러가 안남
public class CatchExceptionTest {  
    public static void main(String[] args) {  
        try {
		    // 블라블라~ 
        } catch (ArrayIndexOutOfBoundsException e) {  
        
        } catch (Exception e) {  
        
        }
    }  
}
```

</details>

<br><br>

### 멀티 catch

<a href='https://dololak.tistory.com/61' target='_blank'>[관련 출처]</a> 하나의 catch 블록에서 여러 개의 예외를 처리하는 것이다. `|`로 예외 연결한다. 그러나, 다중 catch처럼 멀티 catch도 사용 시 주의사항이 있다. 

1. **Multi Catch문에 사용된 예외들은 예외의 상속관계에서 부모와 자식관계에 있으면 안된다.**

```java
try {
} catch (ArithmeticException | RuntimeException e) {
}

// Exception in thread "main" java.lang.Error: Unresolved compilation problem: 
// The exception ArithmeticException is already caught by the alternative RuntimeException
```

`ArithmeticException`은 `RuntimeException`의 자손 클래스이기 때문에 ==RuntimeException 하나만으로 처리가 가능하기 때문==에 예외가 발생한다. 즉, **다형성에 의해 RuntimeException 하나로 자손 예외들을 모두 처리 가능**하다는 의미이다.

```java
// 이렇게 수정하면 정상작동
try {
} catch (RuntimeException e) {
    RuntimeException 하나로 하위 예외들을 모두 처리           
}
```

<br>

2. **Multi Catch문에 사용된 예외들의 공통된 조상의 멤버만 사용할 수 있다.**

```java
catch (ExceptionA | ExceptionB | ExceptionC e) {
	e.methodA();
	// e라는 참조변수 하나로 여러 가지 예외를 처리하기 때문에
	// e가 A, B, C 어느 예외인지 몰라서 처리할 수 없다.
}
```

Multi Catch문에서는 ==공통된 조상의 메서드만 호출하거나 정확히 어느 예외의 인스턴스인지 판단하여 캐스팅(형변환) 후 해당 메서드를 사용==해야 한다.

<p align="center"><img src="https://i.imgur.com/aqNQUD5.png" width="80%"></p>

```java
try {
} catch(ChildExA | ChildExB | ChildExC e){
   e.parentsMethod(); //공통조상인 parentsMethod()만 호출 가능
}
```

<br>

```java
try {
} catch(ChildExA | ChildExB | ChildExC e){
   if (e instanceof ChildExA) {
       ChildExA a = (ChildExA)e; //캐스팅
       a.childMethodA();
   } else if (e instanceof ChildExB) {
       ChildExB b = (ChildExB)e; //캐스팅                     
       b.childMethodB();
   } else{ ... }
}
```

그런데, 코드를 보면 이렇게 캐스팅해서 if문 쓸바에 평소대로 여러 개의 캐치문을 쓰는게 낫다

<br>

### 에러 출력 메서드

- `e.getMessage()` : 에러의 원인을 간단하게 출력
- `e.toString()` : 에러의 Exception 내용과 원인을 출력
- `e.printStackTrace()` : 에러의 발생 근원지를 찾아서 단계별로 에러를 출력
	- getMesage()와 toString()과는 다르게 printStackTrace는 리턴 값이 없다. 이 메소드를 호출하게 되면 예외 발생 당시의 호출 스택(Call stack)에 있던 메서드의 정보와 예외 결과를 화면에 출력한다. 

<p align="center"><img src="https://i.imgur.com/9RkBRlu.png" width="80%"></p>

<br>

### 진짜 Handling

1. **catch**만 하지마라.

```java
try {
	// Exception 발생 가능 로직
} catch(???Exception e) {

}
```

예외를 잡기만 하지말고, 로깅 / 복구 등 Exception에 대한 처리를 해라

<br>

2. **catch**하고 바로 **throw** 하지마라.

```java
try {
	// Exception 발생 가능 로직
} catch(???Exception e) {
	throw e;
}
```

예외를 잡자마자 던질 것이면 왜 잡냐? 역시 로깅 / 복구 등 Exception에 대한 처리를 해라

<br>

3. `e.printStackTrace()`는 지양하라

```java
try {
    // Exception 발생 가능 로직
} catch (IOException e) {
    e.printStackTrace()
}
```

단순하게만 보면, Spring 서버의 콘솔에 얼마나 많은 내용이 찍히겠는가? 그 사이에서 `e.printStackTrace()` 내용을 찾기는 하늘에 별따기 일 것이다. 또, 따로 로깅을 통해서 파일에 정리해놔야 할 정도로 중요한 내용인데 단순히 출력만 했다고 에러 처리를 끝마쳤다고 볼 수는 없다.

추가로, `printStackTrace()`를 지양해야하는 이유는 아래와 같다.

- printStackTrace()를 call 할 경우, System.err로 쓰여져서 제어하기가 힘듦
- printStackTrace()는 java 리플렉션을 사용하여 추적하는 것이라서 많은 오버헤드가 발생할 수 있음
- printStackTrace()는 서버에서 스택정보를 취합하기 때문에 서버에 부하가 발생할 수 있음
- printStackTrace()는 출력이 어디로 가는지 파악하기가 어려움. 톰캣의 경우 `catalina.out`에 남음
- printStackTrace()는 관리가 힘듦

로깅 라이브러리는 **log4j**, **logback**, **slf4j**, **commons logging** 등이 있다. 로그 패턴 및 로그 메세지를 지정 및 콘솔로그 / 파일로그 형태로 관리할 수 있다. 이런식으로 printStackTrace가 아닌 로깅을 하도록 하자. 여담으로 2021년에 log4j에서 엄청난 보안 취약점이 발견되어 세상이 뒤집어진 사건이 있었다. 대표적인 취약점 역직렬화, SQL 인젝션, 역직렬화 코드실행이 있는데 자세한건 검색해보길 바란다.

<details>
<summary><strong>==코드 예시보기==</strong></summary>

```java
private final Logger logger = LoggerFactory.getLogger(this.getClass());  
  {  
    try{  
        //블라블라....  
    } catch (FileNotFoundException e) {  
        logger.error("FileNotFoundException", e);  
    } catch (IOException e) {  
        logger.error("IOException", e);  
    }}
```

</details>

<br>

> [!note] Reflection 이란? <br>
> 리플렉션은 간단하게 말하면 **구체적인 클래스 타입을 알지 못해도 그 클래스의 메소드, 타입, 변수들에 접근할 수 있도록 해주는 자바 API**이다. <br><br>
> 힙 영역에 로드된 Class 타입의 객체를 통해, 원하는 클래스의 인스턴스를 생성할 수 있도록 지원하고, 인스턴스의 필드와 메소드를 접근 제어자와 상관 없이 사용할 수 있도록 지원하는 API이다. <br><br>
> 여기서 로드된 클래스라고 함은, JVM의 클래스 로더에서 클래스 파일에 대한 로딩을 완료한 후, 해당 클래스의 정보를 담은 **Class 타입의 객체**를 생성하여 메모리의 힙 영역에 저장해 둔 것을 의미한다. new 키워드를 통해 만드는 객체와는 다른 것임을 유의하자.

<br>

### printStackTrace 취약점

CWE (Common Weakness Enumeration) 취약점이라는 다양한 소프트웨어 언어 및 아키텍처, 디자인 패턴, 설계 단계에 발생 가능한 취약점이라는 것이 있다. printStackTrace는 **CWE-497**에 등록된 취약점으로 매우 주의하여야 한다.

**CWE-497 : Exposure of Sensitive System Information tp an authorized Control Sphere**

Exception이 발생할 경우 콘솔에 발생지 근원부터 파일 경로 및 각종 정보들이 찍히는데, 이는 내가 아닌 외부인에게도 제공될 수 있다는 것이 큰 취약점이다. 이는 **자바 레벨의 순수 메서드까지 호출 경로가 노출이 된다**는 의미이다.

따라서, printStackTrace를 사용한 경우에는 디버깅 중에 넣었던 시스템 정보 출력 코드를 반드시 **모두 삭제**하여야 한다. 

<br>

### try-with-resources

자세한 내용은 <a href='https://mangkyu.tistory.com/217' target='_blank'>링크</a>를 참고하자. 설명이 너무 잘되어있다.

- `try-catch-finally`문에서 resources를 사용 후 반납하는 과정에서 여러 문제점이 있다.
	- 자원 반납에 의해 코드가 복잡해짐
		- Null 검사 귀찮게 해야해서
	- 실수로 자원을 반납 못함
	- 에러로 반납 못함
	- 에러 스택 트레이스가 누락되어 디버깅 어려움

- `try-with-resources`를 이용하여 문제점을 해결하자.
	- 코드를 간결하게 만들 수 있음
	- 번거로운 자원 반납 안해도 됨
	- 실수로 자원 반납 못하는 경우 방지
	- 에러로 자원 반납 못하는 경우 방지
	- 모든 에러에 대한 스택 트레이스 남길 수 있음

그냥 `try ( 여기에서 resources 생성 )`하면 바로 try-with-resources를 사용하는 것이다. 이는 Java에서 ==AutoCloseable 인터페이스를 구현==하고 있는 자원에 대하여 지원한다. 재미있는 점은, AutoCloseable 인터페이스는 Java 7 이전에 있던 기존의 Closeable 인터페이스에 **부모 인터페이스로 추가된 것**이라서 하위 호환성을 100% 달성했다.

```java
public interface Closeable extends AutoCloseable {  
    public void close() throws IOException;  
}  
  
public interface AutoCloseable {  
    void close() throws Exception;  
}
```

<br>

<details>
<summary><strong>==코드 예시보기==</strong></summary>

- `try-catch-finally`

```java
public static void main(String args[]) throws IOException {  
    FileInputStream is = null;  
    BufferedInputStream bis = null;  
    
    try {  
        is = new FileInputStream("file.txt");  
        bis = new BufferedInputStream(is);  
        int data = -1;  
        while((data = bis.read()) != -1){  
            System.out.print((char) data);  
        }    
    } finally {  
        // close resources  
        if (is != null) is.close();  
        if (bis != null) bis.close();  
    }
}
```

- `try-with-resources`

```java
public static void main(String args[]) throws IOException {  
    try (FileInputStream is = new FileInputStream("file.txt"); BufferedInputStream bis = new BufferedInputStream(is)) {  
        int data;  
        while ((data = bis.read()) != -1) {  
            System.out.print((char) data);  
        }    
    }
}
```

</details>

<br><br>

### try-catch 성능

try-catch문을 많이 사용한다면 성능이 어떻게 될 지 의문점을 가졌었다.

-   <a href='https://stackoverflow.com/questions/16451777/is-it-expensive-to-use-try-catch-blocks-even-if-an-exception-is-never-throw' target='_blank'>스택오버플로 게시글</a>에서도  `try-catch는 성능에 별 영향을 끼치지 않는다 vs JVM이 일부 최적화를 수행하지 못하도록 하기 때문에 영향이 있을 수 있다`로 의견이 좀 갈리는 듯 하였다.
- <a href='https://january-diary.tistory.com/entry/JAVA-%EC%98%88%EC%99%B8%EC%B2%98%EB%A6%AC%EC%9D%98-%EB%B9%84%EC%9A%A9' target='_blank'>다른 게시글</a>에서는 예외를 만들어내는 비용이 크기 때문에 무분별한 남용을 지양하자고 하였다.
-   try문 자체는 성능에 영향을 끼치지 않고 exception thread stack을 채우는데 걸리는 시간을 영향에 끼친다고 하는건가? e.printStackTrace 할 때 그것

> [!note] 결론부터 말하겠다 <br>
> try-catch 성능저하에 대한 의문점에 답은 예외처리를 했을때와 안했을때 실행시간 차이가 있기는 하지만, 예외처리가 필수로 해야하는 부분은 어쩔수 없고 그렇다고해서 예외처리를 안 할 수 없어서 어느정도는 감안하고 사용한다. <br><br>
> 그리고, **생각보다 실행시간 차이가 크지 않아서, 성능 이슈는 사실 상관없다. 불필요한 예외처리는 비용이 발생하므로, 적절하게 사용하되 방어코드를 사용하는 것이 비용이 덜 소모된다.** <br><br>
> <a href='https://jojoldu.tistory.com/58' target='_blank'>향로님의 성능 비교 링크</a>

<br>

여기서부터는 고민의 과정일 뿐, 참고만 하자

**Q. try-catch 성능에 관하여**

-   Java에서 try-catch 블록을 사용하면 특히 코드의 중요한 섹션에서 try-catch 블록을 사용하는 경우 성능에 영향을 줄 수 있다고 한다.
-   try-catch 블록이 발생하면 Java는 예외가 발생했는지 여부와 예외를 잡아서 처리해야 하는지 여부를 결정하기 위해 추가 검사를 수행해야 하는데, 이 추가 오버헤드로 인해 코드 실행 속도가 느려질 수 있다.
-   **그러나 try-catch 블록이 초당 수백만 번 실행되지 않는 한 일반적으로 try-catch 블록의 성능 영향은 최소로 간주된다. 대부분의 경우 예외를 처리하기 위해 try-catch 블록을 사용하는 이점이 약간의 성능 저하보다 크다.**
-   또한 try-catch 블록의 기본 목적은 예외 상황을 처리하고 예기치 않은 오류가 발생해도 프로그램이 계속 실행되도록 하는 것임을 기억하는 것이 중요하다. 따라서 일반적으로 try-catch 블록을 피함으로써 발생할 수 있는 작은 성능 향상보다 코드 명확성과 정확성을 우선시하는 것이 좋다.
-   요약하면 try-catch 블록을 많이 사용하면 성능에 약간의 영향을 줄 수 있지만 일반적으로 최소한의 것으로 간주되며 대부분의 응용 프로그램에서 중요한 문제가 아니다.

<br>

**Q. Java에서 try-catch 문의 성능 부하를 줄이는 방법에 관하여**

Java에서 try-catch 블록의 성능 영향은 일반적으로 최소로 간주되지만 성능 오버헤드를 추가로 줄이는 데 사용할 수 있는 몇 가지 전략이 있다.

1.  필요한 경우에만 try-catch 블록 사용 : 예외가 발생할 가능성이 있는 경우에만 try-catch 블록을 사용하는 것이 좋다. 예외가 발생할 가능성이 없는 상황과 같이 불필요하게 사용하지 마라.
2.  try-catch 블록의 범위 제한 : try-catch 블록의 범위를 가능한 가장 작은 코드 블록으로 제한하라. 이렇게 하면 try-catch 블록 내에서 실행해야 하는 코드의 양을 줄이는 데 도움이 되어 성능 오버헤드를 줄일 수 있습니다.
3.  조건문 사용: 경우에 따라 try-catch 블록이 필요하지 않도록 조건문을 사용할 수 있다. 예를 들어 예외를 발생시키는 조건을 확인하고 try-catch 블록 내에서 잠재적으로 예외를 발생시킬 수 있는 코드만 실행할 수 있다.
4.  올바른 예외 처리 메커니즘 사용: Java에는 Checked Exception, Unchecked Exception 및 error와 같은 몇 가지 예외 처리 메커니즘이 있는데, 상황에 맞는 메커니즘을 사용하면 try-catch 블록의 성능 오버헤드를 줄이는 데 도움이 될 수 있다.
5.  로깅 프레임워크 사용: 예외를 발생시키는 대신 로깅 프레임워크를 사용하여 오류를 기록하고 실행을 계속할 수 있다. 이것은 프로그램이 예외를 처리하기 위해 호출 스택을 중지하고 해제할 필요가 없기 때문에 try-catch 블록의 성능 오버헤드를 줄이는 데 도움이 될 수 있다.

전반적으로 try-catch 블록의 성능 오버헤드를 줄일 수 있지만 이를 사용하는 주요 목표는 프로그램이 예외 상황을 처리하고 계속 실행되도록 하는 것임을 기억하는 것이 중요하다. 따라서 정확하고 신뢰할 수 있는 소프트웨어의 필요성과 성능 고려 사항의 균형을 맞추는 것이 중요하다.

<br>

<hr>

## TOPIC 02 - Spring에서는?

몇몇 자바 파일에서 예외 처리하는 것을 넘어, 서버 규모로 넘어가면 어떻게 될까?
- 예외처리 해야하는 부분이 매우 많아진다. => `try-catch`문 남용
	- 가독성 저하 : 일반 코드를 예외 처리 코드로 만들면, 코드 본래 목적 혼란스러움
	- 부작용 발생 : 예외가 발생해도 무시될 수 있어서 개발자가 모르는 부작용 발생, 디버깅 어려워짐

그렇다면, Spring에서는 어떻게 try-catch문을 줄이면서 Exception Handling을 할 수 있을까?

<br><br>

### 스프링 예외처리

스프링의 처리과정을 보면 예외처리가 발생하는 부분은 크게 2가지로 나눌 수 있다.
1. Dispatcher Servlet 내에서 발생하는 예외 (Controller, Service, Repository 등)
2. Dispatcher Servlet 전의 Filter에서 발생하는 예외

Dispatcher Servlet은 ==클라이언트에게 요청을 받아  MVC 처리과정을 통제하는== 것이다. Dispatcher Servlet 내에서라는 의미는 Spring 영역에서의 예외처리를 뜻하는 것이고, Disaptcher Servlet 전은 Spring 영역의 바깥에서 예외처리를 뜻하는 것이다. 

<br><br>

### Dispatcher Servlet 내에서

Dispatcher Servlet 내의 Spring에서 예외처리는 ==HandlerExceptionResolver==가 담당한다.

<p align="center"><img src="https://i.imgur.com/TtU0zno.png" width="80%"></p>

1. 메서드 단위에서 Handling
2. Controller Level에서 Handling
3. Global Level에서 Handling

<br>

==**메서드 단위 : try-catch**==

메서드 단위는 기존 하던 방법에서 `try-catch`를 이용하여 Exception Handling하는 과정이다. 그러나, 프로그램의 규모가 커지고 try-catch가 많아져서 가독성 저하, 부작용 발생 등의 단점이 생겨난다면 어떻게 해야할까 ?

<br><br>

==**Controller Level에서 Handling : @ExceptionHandler**==

메서드 하나하나의 예외처리가 아닌, 컨트롤러 레벨에서 예외 처리를 진행한다. 즉, 컨트롤러에서 발생하는 예외를 공통적으로 처리해주는 기능을 이용한 것이다. 이때 `@ExceptionHandler` 애노테이션을 사용하여 **Controller의 메서드에서 throw된 Exception에 대한 공통적인 처리**를 할 수 있다.

-   Controller 메서드 내의 하위 서비스에서 Checked Exception이 발생하더라도, Controller 메서드 상위까지 예외를 throw 시키면 `@ExceptionHandler` 어노테이션을 사용하여 Controller 전역적으로 예외처리가 가능하다.
-   Controller 메서드 내의 하위 서비스에서 Unchecked Exception이 발생하면, 서비스를 호출한 최상위 Controller에서 해당 예외를 처리해준다

여기에서 나아가, 여러 Controller에서 같은 Exception이 발생하는 경우에, 전체적으로 처리하려면 어떻게 해야할까?

<br><br>

==**Global Level에서 Handling : @ControllerAdvice**==

여러 Controller에서 발생하는 예외를 전역적으로 처리할 수 있다.

- @ControllerAdvice
	- 모든 Controller에서 발생하는 예외를 처리하는 애노테이션
	- DispatcherServlet에서 발생하는 예외를 전역적으로 처리
	- Exception 처리 이후 Error Page 등을 통해 처리가 가능
- @RestControllerAdvice
	- REST API에 대한 Exception 처리 용이
	- @ControllerAdvice + @ResponseBody

<br>

> [!note] 어떤 @ExceptionHandler가 먼저 실행? <br>
> Controller 클래스 내의 @ExceptionHandler <br>
> @ControllerAdvice 클래스 내의 @ExceptionHandler <br>
> 둘 중 어떤 것이 먼저 실행될까? <br><br>
> =>  **Controller 내의 @ExceptionHandler로 예외처리를 하게 되면 거기서 예외처리가 끝난다.**  더 상위로 Exception을 throw하더라도 **@ControllerAdvice의 @ExceptionHandler에서 예외처리를 하지 않는다.**

<br>

### HandlerExceptionResolver

Dispatcher Servlet 내에서 예외가 발생했을 때 HandlerExceptionResolver이 처리한다고 했다. 이를 자세히 들여다겠다.

- HandlerExceptionResolver는 Controller의 작업 중 발생한 예외를 어떻게 처리할 지에 대한 전략이다.
- Controller에서 Exception이 발생하면 Controller 밖으로 던져짐
- 예외가 발생하면 ExceptionResolver가 발동
- Dispatcher Servlet 내부에 등록된 3가지가 순서대로 실행
	1. ExceptionHandlerExceptionResolver
	2. ResponseStatusExceptionResolver
	3. DefaultHandlerExceptionResolver

<br>

==**ExceptionHandlerExceptionResolver**==

Spring 3.2의 AnnotationMethodExceptionResolver가 deprecated 처리되었고 Spring 4.0부터 사용하고 있는 ExceptionHandlerExceptionResolver이다. `@ExceptionHandler` 애노테이션에 관한 Resolver 클래스이다.

1. 예외가 발생한 Controller 안에 적합한 @ExceptionHandler가 있는지 검사
2. Controller의 @ExceptionHandler에서 처리가 가능하다면 처리하고, 그렇지 않으면 @ControllerAdvice로 넘어감
3. @ControllerAdvice에 적합한 @ExceptionHandler가 있는지 검사하고 없으면 다음 Resolver로 넘어감

<br>

==**ResponseStatusExceptionResolver**==

Exception에 대한 HTTP 응답을 설정해줄 수 있다. 단순히 internal-server-error인 500 에러 대신 더 구체적인 응답 상태값을 전달해줄 수 있다.

1. @ResponseStatus가 있는지 혹은 ResponseStatusException인지 검사
2. 있다면 ServletResponse의 sendError()로 예외를 Servlet까지 전달하고 Servlet이 BasicErrorController로 요청을 전달

<br>

> [!note] ResponseStatusException?  <br>
> 외부 라이브러리를 사용하는 경우, @ResponseStatus 애노테이션으로 직접적으로 수정할 수 없는 상황이 있다. 이때, 상태값에 관하여 직접 핸들링하고 싶은 경우에는 ResponseStatusException을 사용하여 처리한다.


<br>

==**DefaultHandlerExceptionResolver**==

위의 두 Resolver로도 처리가 안된다면 DefaultHandlerExceptionResolver를 사용하여 내부적으로 Spring 표준 예외처리를 해준다. 각 상황에 맞는 응답 코드를 반환하는 역할이다.

- Request URL에 맞는 Controller를 찾지 못한 경우 - **404 Not Found**
- Controller 메서드 실행 중 예외가 발생하는 경우 - **500 Internal Server Error**
- Controller의 파라미터 형식이 잘못된 경우 - **400 Bad Request**

1. Spring의 내부 예외인지 검사하여 맞으면 Exception을 처리하고 아니면 넘어감
2. 적합한 ExceptionResolver가 없으므로 예외가 Servlet까지 전달되고, Servlet은 SpringBoot가 진행한 자동 설정에 맞게 BasicErrorController로 요청을 다시 전달

<br><br>

### Dispatcher Servlet 외부에서

스프링 영역이 아닌 외부에서 발생하는 Exception은 어떻게 처리해야할까? 이를 말하기에 앞서서 스프링 영역의 컨트롤러 단에서 예외가 발생한 경우, 전체적인 흐름을 먼저 살펴보자.

<p align="center"><img src="https://i.imgur.com/wfzH5da.png" width="80%"></p>

Spring MVC request life cycle을 보면, 아래와 같이 흐름이 생긴다.
- ==WAS -> 필터 -> 서블릿 -> 인터셉터 -> 컨트롤러(예외발생)==
- ==WAS <- 필터 <- 서블릿 <- 인터셉터 <- 컨트롤러==

그렇다면, Dispatcher Servlet 내부인 Spring 영역에서는 HandlerExceptionResolver를 이용하여 다양한 예외 처리를 하는데, **외부인 Filter 단에서 예외가 발생하면 어떻게 처리해야할까?**

<br>

<p align="center"><img src="https://i.imgur.com/U0EBqbk.png" width="80%"></p>

이 그림을 봤을 때, Filter 단에서 예외가 발생하면 애초에 ==스프링 영역으로 들어가지 못하고, 튕겨져 나온다.== 하지만, `@HandlerException`, `@ControllerAdvice`와 같은 예외 처리는 Spring에서 제공하는 애노테이션이라서 스프링 영역이 아닌 필터에서는 사용할 수 없다.

<br>

<p align="center"><img src="https://i.imgur.com/3JXXEhS.png" width="80%"></p>

이러한 경우에는 ==Filter에서 try-catch 문으로 예외를 잡아서 처리한다.== 위 그림의 예시로는 `doFilter()` 메서드를 try-catch로 잡아서 그 시점에 발생한 예외를 곧바로 handling 하는 것이다.

<br>

### Filter에서 처리하는 예외

1. **(가장중요) 모든 요청에 대한 로깅**
2. 보안 관련 공통 작업 (JWT)
3. ServletRequest 커스터마이징
4. 이미지/데이터 압축 및 문자열 인코딩

이중, 모든 요청에 대한 로깅은 특히 중요한데, 말 그대로 request, response 등 모든 처리에 관하여 로깅할 수 있다.

<br>

### 참고자료

- <a href='https://cheese10yun.github.io/spring-guide-exception/#null' target='_blank'>(가장 쓸만할 듯)프로젝트에 적용하면 좋을 실제 Spring 예외</a>
- <a href='https://www.nextree.co.kr/p3239/' target='_blank'>자바에서의 Exception Handling 3가지 방법</a>
- <a href='https://catsbi.oopy.io/92cfa202-b357-4d47-8de2-b9b3968dfb2e' target='_blank'>종합적인 예외처리 설명</a>
- <a href='https://jaehun2841.github.io/2018/08/30/2018-08-25-spring-mvc-handle-exception/#ResponseStatusExceptionResolver' target='_blank'>Spring Handler Exception</a>
- <a href='https://github.com/binghe819/TIL/blob/master/Spring/%EA%B8%B0%ED%83%80/%EC%8A%A4%ED%94%84%EB%A7%81%20%EC%98%88%EC%99%B8%EC%B2%98%EB%A6%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%EC%A0%84%EB%9E%B5.md' target='_blank'>스프링 예외처리 개념 전략</a>
- <a href='https://velog.io/@backtony/면접-시리즈2-Spring-JPA' target='_blank'>Spring-JPA 면접시리즈</a>
- <a href='https://terasolunaorg.github.io/guideline/5.3.0.RELEASE/en/ArchitectureInDetail/WebApplicationDetail/ExceptionHandling.html#exception-handling-basic-flow-label' target='_blank'>(원본)Exception Handling Guideline</a>
- <a href='https://steady-coding.tistory.com/601' target='_blank'>Filter vs Interceptor</a>
- <a href='https://velog.io/@wonizizi99/SpringSpring%EC%9D%98-%EC%98%88%EC%99%B8-%EC%B2%98%EB%A6%AC-%ED%9D%90%EB%A6%84' target='_blank'>Spring에서의 예외 처리 흐름도</a>
- <a href='https://jhkimmm.tistory.com/29' target='_blank'>Filter 내에서 발생한 예외 처리하기</a>
- <a href='https://beemiel.tistory.com/11' target='_blank'>Spring Security JWT 토큰 검증시 Exception 처리</a>