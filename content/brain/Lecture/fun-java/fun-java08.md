---
title: "08. 주석문, 예외처리, enum"
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

<hr>

## enum
