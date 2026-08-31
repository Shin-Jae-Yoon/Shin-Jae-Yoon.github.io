---
title: 정규식
aliases:
  - 정규식
  - 정규 표현식
  - Regular Expression
  - RegExp
tags:
  - language
  - javascript
origin:
  verified: 2026-08-31
---

문자열의 패턴을 표현하는 형식. 유저가 입력한 것이 이메일 형식에 맞는지 검사할 때처럼 형식을 확인하는 자리에 쓴다.

## includes()의 한계

문자를 검사하는 쉬운 방법으로 `includes()`가 있다.

```javascript
"abc".includes("a") // true
"abc".includes("d") // false
```

여기까지가 한계다. 왼쪽 문자에 한글이 들어 있냐, 영어가 들어 있냐, A로 끝나냐, 숫자가 한 번 출현하냐 같은 것은 `includes()`로 검사할 수 없다.

## 문자 하나를 찾는 표기

자바스크립트에서는 `/ /` 안에 문자를 넣어 쓴다.

```javascript
;/a/.test("abcde") // true
```

`[]`로 묶으면 그 안의 아무 글자 하나를 뜻한다. `[a-z]`는 a부터 z까지 중 하나, `[A-Z]`는 대문자 하나이니 `/[A-Z]/.test('abcde')`는 false이고 `/[A-Z]/.test('abcdA')`는 true다. 알파벳 하나는 `[a-zA-Z]`, 숫자 하나는 `[0-9]`로 쓴다. `\S`는 특수기호까지 포함해 아무 문자 하나다.

한글은 `[ㄱ-ㅎ가-힣ㅏ-ㅣ]` 세 구간을 다 써야 아무 한글 문자 하나가 된다. `가-힣`은 완성된 글자, `ㄱ-ㅎ`은 자음, `ㅏ-ㅣ`는 모음이라 앞의 둘만 쓰면 `ㅏㅏㅏ` 같은 입력을 놓친다.

```javascript
;/[ㄱ-ㅎ가-힣]/.test("안녕") // true
;/[ㄱ-ㅎ가-힣]/.test("ㅏㅏㅏ") // false
;/[ㄱ-ㅎ가-힣ㅏ-ㅣ]/.test("ㅏㅏ") // true
```

## 반복과 위치와 선택

지금까지가 전부 문자 하나를 찾는 것이다. `/a/`는 a 문자 하나"만" 찾는다. 여러 개를 찾고 싶으면 `/a+/`처럼 `+`를 붙인다. `+`는 왼쪽 문자를 반복 검색한다.

위치와 선택도 기호로 적는다. `/^a/`는 a로 시작하냐, `/a$/`는 a로 끝나냐를 묻는다. `/a|b/`는 a 또는 b가 있냐이고, 괄호를 쓴 `/(a|b)/`도 가능하다. 정규식에서 괄호는 묶어서 계산해준다.

## 이메일 형식 검사

이메일 형식 검사가 이 기호들을 한자리에 모은다. `.`은 정규식의 특별한 문법이라 점 자체를 쓰고 싶으면 `\`를 붙여야 한다.

```javascript
;/\S@\S\.\S/.test("aaa@bbb.ccc") // false
;/\S@\S\.\S/.test("a@b.c") // true
;/\S+@\S+\.\S+/.test("aaa@bbb.ccc") // true
```

## 문자열인 줄 알고 넘길 때

정규식을 받는 자리인 줄 모르고 문자열을 넘기면 여기서 막힌다. 자바 `Scanner`의 `useDelimiter()`가 그렇다. 안의 값을 정규 표현식으로 해석하므로 `.`이나 `$` 같은 특수 기호가 의도했던 바와 다르게 작용한다. 점을 구분자로 쓰려면 `\.`이라고 써야 하는데, 자바에서는 역슬래시 자체를 나타내려고 `\`를 한 번 더 붙이므로 최종적으로는 `\\.`가 된다.

```java
Scanner sc = new Scanner(System.in);
sc.useDelimiter(".");     // 런타임 에러
sc.useDelimiter("\\.");   // 정상 작동
```

## 관련

- [[string-pool|문자열과 String Pool]]
- [[control-flow|제어 흐름]]

## 출처

- [[brain/lectures/frontend/apple-js/apple-js-02|코딩애플 자바스크립트 2편 - 정규식]]
- [[brain/notes/CodeTree/inputoutput|코드트리 입출력 - 구분자]]
