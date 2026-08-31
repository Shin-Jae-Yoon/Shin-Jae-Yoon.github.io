---
title: 문자 연산
aliases:
  - 문자 연산
  - 아스키 코드
  - charAt
  - toCharArray
tags:
  - algorithm
  - java
origin:
  verified: 2026-08-30
---

자바에서 `char`는 아스키 코드값을 가진 정수형이라 더하고 뺄 수 있다. 문자열 문제의 절반이 이 사실 하나로 풀린다.

## 기준점과 상대 위치로 계산하기

대문자는 65부터 90, 소문자는 97부터 122이고 차이는 32다. 그런데 32를 외울 필요가 없다.

```java
// 대문자를 소문자로
arr[i] = (char)('a' + arr[i] - 'A');
```

읽는 법은 이렇다. 소문자로 만들 것이니 기준점은 `'a'`이고, 거기에 이 대문자가 `'A'`로부터 몇 번째인가를 더한다. 기준점과 상대 위치로 생각하면 상수를 기억할 일이 없다.

같은 발상이 [[counting-array|카운트 배열]]로 이어진다. `- 'a'`가 문자를 0부터 시작하는 인덱스로 바꿔준다.

```java
int[] count = new int[26];
count[str.charAt(i) - 'a']++;   // 'a'는 0번, 'b'는 1번

int digit = time.charAt(0) - '0';   // '9'가 9로
```

알파벳이면 `- 'a'`나 `- 'A'`, 숫자 문자면 `- '0'`이다.

## 불변 문자열을 고치는 세 방법

`String`은 [[string-pool|불변]]이라 `str[2] = 'D'`가 컴파일 에러다. 바꾸려면 새로 만들어야 하고 방법이 셋이다. 여러 자리를 자유롭게 고칠 때는 `toCharArray()`로 배열을 만들어 수정하고 `new String(arr)`으로 되돌린다. 한 군데만 바꿀 때는 `substring(a, b)`으로 앞뒤를 잘라 이어 붙인다. 읽기만 할 때는 `charAt(i)`면 된다.

`"ABCD"`의 세 번째 글자를 `'E'`로 바꾸는 일을 두 방식으로 쓰면 이렇다.

```java
String str = "ABCD";

char[] arr = str.toCharArray();
arr[2] = 'E';
str = new String(arr);                          // ABED

str = str.substring(0, 2) + 'E' + str.substring(3, 4);   // ABED
```

`substring(a, b)`는 b 직전까지다. 끝 인덱스가 포함되지 않는다.

## 원본을 바꾸지 않는 메서드들

자주 쓰는 메서드는 전부 새 문자열을 돌려주지 원본을 바꾸지 않는다. 불변이니 당연한 결과인데, 반환값을 안 받아서 틀리는 일이 잦다.

| 메서드                           | 반환     | 무엇                                       |
| -------------------------------- | -------- | ------------------------------------------ |
| `length()`                       | int      | 길이. 배열의 `length`와 달리 괄호가 붙는다 |
| `equals()`                       | boolean  | 값 비교                                    |
| `compareTo()`                    | int      | 사전순 비교 결과                           |
| `contains()`                     | boolean  | 포함 여부                                  |
| `replace()`                      | String   | 모두 치환한 새 문자열                      |
| `split(regex)`                   | String[] | 정규식으로 분할                            |
| `indexOf(ch, from)`              | int      | from부터 첫 등장 위치                      |
| `toUpperCase()`, `toLowerCase()` | String   | 대소문자 변환한 새 문자열                  |

대소문자를 구분할 필요가 없는 문제라면 읽자마자 `toUpperCase()`로 통일해두는 것이 조건 분기를 줄이는 가장 쉬운 방법이다.

## 관련

- [[counting-array|카운트 배열]]
- [[string-pool|문자열과 String Pool]]
- [[string-parsing|문자열 파싱과 출력 형식]]

## 출처

- [[brain/lectures/algo/fastcampus-algo/part1-4/p1-ch01|패스트캠퍼스 알고리즘 Ch01 - 문자열, 2744번, 1919번, 1157번]]
- [[brain/notes/CodeTree/string|코드트리 - 문자열 관련 메서드]]
