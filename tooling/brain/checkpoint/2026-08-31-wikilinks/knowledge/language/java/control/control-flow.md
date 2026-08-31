---
title: 제어 흐름
aliases:
  - 제어 흐름
  - 조건문
  - 반복문
  - switch
  - break
  - continue
tags:
  - language
  - java
  - python
  - javascript
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

위에서 아래로 흐르는 실행 순서를 조건과 반복으로 꺾는 문법. 자바에서는 `if`, `switch`, `while`, `do-while`, `for`가 그 일을 맡는다.

## 조건문

`if`는 조건이 참일 때 블록을 실행하고, 조건이 여럿이면 `else if`로 잇다가 `else`로 받는다. 안에 든 수행문이 한 줄이면 중괄호를 생략해도 컴파일되지만 읽기에는 붙여두는 편이 낫다.

`switch`는 값 하나를 여러 경우와 견준다. `if`는 조건을 위에서부터 차례로 검사하므로 경우가 많아지면 늘어지고, 값 하나를 여러 경우와 비교하는 것뿐이라면 `switch`가 읽기 좋다. 속도 차이는 이론적으로만 있고 실제로는 의미 없는 수준이다.

`case`를 나란히 붙이면 여러 값을 한 묶음으로 처리한다. 달마다 날수를 매길 때 이 문법이 잘 맞는다.

```java
case 1 : case 3 : case 5 : case 7 : case 8 : case 10 : case 12 : day = 31;
    break;
case 4 : case 6 : case 9 : case 11 : day = 30;
    break;
case 2 : day = 28;
    break;
```

자바 7부터 `case` 값에 문자열을 쓸 수 있다. 그전에는 `medal.equals("Gold")`처럼 `if`와 `equals()`로 비교해야 했다.

간단한 분기는 삼항 연산자로 한 줄에 담는다. `조건식 ? 반환값1 : 반환값2` 형태이고 조건이 참이면 앞쪽, 거짓이면 뒤쪽을 돌려준다.

```java
int max = (a > b) ? a : b;
```

## 반복문

`while`은 조건을 먼저 보고 참인 동안 블록을 되풀이한다. 1부터 10까지 더해 55를 얻는 누적 계산이 전형적인 쓰임이다. `do-while`은 조건을 뒤에서 검사하기 때문에 무조건 한 번은 돈다. 사용자 입력을 받아 검증하는 자리에 어울린다.

`for`는 변수 초기화, 탈출 조건, 증감을 한 줄에 모은다. `while`이 세 줄로 나눠 쓰던 것을 한 줄로 줄인 셈이다. 셋을 각각 생략할 수 있고 전부 비우면 `for(;;)`가 무한 루프가 된다. 조건식만 비우고 안에서 `break`로 끊는 방식도 자주 쓴다. 0부터 차례로 더해 합이 100을 넘는 지점을 찾을 때 조건을 `sum < 100`으로 걸면 `num`이 한 번 더 증가한 뒤에 빠져나와 15가 나오지만, 조건식을 비우고 안에서 `break`하면 14가 나온다.

향상된 `for`문은 [[Iterator]]를 써서 컬렉션을 처음부터 끝까지 훑는다. 인덱스를 다루지 않아도 되니 가장 짧다.

```java
for (String s : list) { }
```

반복을 중간에 끊을 때는 `break`와 `continue`를 쓴다. `break`는 반복문 자체를 끝내고, `continue`는 이번 회차의 남은 문장을 건너뛰고 다음 회차로 넘어간다. 1부터 100까지 홀수만 더할 때는 `if (i % 2 == 0) continue;` 한 줄로 짝수를 걸러낸다. 구구단에서 짝수 단만 출력하려면 바깥 `for` 첫머리에서 홀수 단을 `continue`로 넘겨 안쪽 반복문을 아예 돌지 않게 하는 쪽이 안쪽까지 다 돌고 나서 출력만 거르는 것보다 낫다.

## 파이썬의 조건과 반복

블록을 중괄호가 아니라 콜론과 들여쓰기로 묶는다. 탭과 공백 중 무엇을 쓸지는 의견이 갈리지만 최근 커뮤니티는 공백 네 칸을 권한다.

반복은 순회할 대상을 직접 받는다. 숫자를 돌리고 싶으면 `range()`를 쓰는데 `range(10)`은 0 이상 10 미만, `range(1, 10)`은 1 이상 10 미만이다.

조건부 표현식의 순서도 다르다. 자바가 `조건 ? a : b`로 쓰는 자리를 파이썬은 `a if 조건 else b`로 쓴다.

```python
print("짝수") if a % 2 == 0 else print("홀수")
```

리스트 내포는 반복과 생성을 한 줄에 담는다. `[표현식 for 항목 in 반복가능객체 if 조건문]` 형태이고, 빈 리스트를 만들어 `append`하던 세 줄이 `result = [num * 3 for num in a]` 한 줄이 된다.

값이 안에 있는지 묻는 `in`과 `not in`도 조건문에 그대로 들어간다. `if 'money' in pocket:`이 문장처럼 읽힌다.

## 자바스크립트의 truthy와 falsy

[[truthy와 falsy]] 때문에 조건 판단이 자바와 다르게 동작한다. `0`, `""`, `null`, `undefined`, `NaN`이 거짓으로 취급된다.

## switch의 fall-through

`switch`에서 `break`를 빠뜨리면 해당 `case`부터 아래로 쭉 실행된다. 의도한 fall-through가 아니면 버그다.

## 중첩 반복문과 레이블

중첩 반복문에서 `break`는 가장 안쪽 하나만 빠져나온다. 바깥까지 끊으려면 반복문에 레이블을 붙인다.

```java
outter:
for (int i = 0; i < 3; i++) {
    for (int k = 0; k < 3; k++) {
        if (i == 0 && k == 2)
            break outter;
        System.out.println(i + ", " + k);
    }
}

// 0, 0
// 0, 1
```

같은 자리에 `continue outter`를 쓰면 바깥 반복문의 다음 회차로 건너뛰므로 출력이 `1, 0`부터 다시 이어진다.

## 참고

원본에는 향상된 `for`문이 배열과 컬렉션을 훑는 문법으로만 나온다. 자바 언어 명세는 이 문법의 헤더가 원소 변수 하나만 선언하도록 못박고, 반복마다 그 변수를 `Iterable`이나 배열의 다음 원소로 초기화한다고 정의한다. 몇 번째 원소인지 알려주는 변수는 어디에도 없다. [JLS SE 21 §14.14.2](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.14.2)

순회 도중 컬렉션을 직접 고치면 `ConcurrentModificationException`이 난다. javadoc은 "한 스레드가 fail-fast 반복자로 컬렉션을 순회하는 도중에 그 컬렉션을 직접 수정하면 반복자가 이 예외를 던진다"고 적는다. [ConcurrentModificationException javadoc](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ConcurrentModificationException.html)

fall-through를 없앤 `switch` 표현식은 자바 14에서 정식 기능이 되었다. JEP 361은 `switch`를 문장으로도 식으로도 쓸 수 있게 넓히면서 전통적인 `case ... :` 레이블(fall through 있음)과 새 `case ... ->` 레이블(fall through 없음) 둘을 함께 제공한다고 적는다. [JEP 361](https://openjdk.org/jeps/361)

## 관련

- [[Iterator]]
- [[truthy와 falsy]]
- [[파이썬 자료형]]

## 출처

- [[brain/lectures/pl/fun-java/fun-java02|재미있는 자바 2강 - 제어문]]
- [[brain/books/do-it-java/chap04|Do it 자바 4장 - 제어문]]
- [[brain/lectures/pl/funny-python/funny10|재미있는 파이썬 10강 - 조건문]]
- [[brain/lectures/pl/funny-python/funny11|재미있는 파이썬 11강 - for문]]
- [[brain/books/do-it-java/chap07|Do it 자바 7장 - 향상된 for문과 배열]]
