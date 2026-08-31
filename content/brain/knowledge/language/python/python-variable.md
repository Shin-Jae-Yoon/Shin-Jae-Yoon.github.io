---
title: 파이썬 변수와 객체
aliases:
  - 파이썬 변수와 객체
  - id()
  - is 연산자
tags:
  - language
  - python
origin:
  verified: 2026-08-30
---

파이썬은 모든 것을 객체로 다룬다. 지금까지 다룬 자료형이 전부 객체다. 값을 만들면 객체가 메모리에 자리를 잡고, 변수는 그 주소를 가리킬 뿐이다. 변수 안에 값이 들어 있는 것이 아니라 C의 포인터에 가깝다.

## id()가 알려주는 주소

`id()`가 객체의 메모리 주소를 알려준다.

```python
a = [1, 2, 3]
b = a
print(id(a))   # 140539428263424
print(id(b))   # 140539428263424  ← 같다
```

대입은 값을 복사하지 않는다. 같은 주소를 하나 더 가리키게 할 뿐이다.

## is와 ==

`is`와 `==`는 다른 것을 묻는다. `==`는 값을 비교하고 `is`는 정체를 비교한다.

```python
a = [1, 2, 3]
b = a
a is b    # True
```

`a is b`는 "a와 b가 같은가"가 아니라 **"a와 b가 가리키는 객체가 동일한가"** 를 묻는다. 자바에서 `==`와 `equals()`가 갈리는 것과 같은 구분이고, [[string-pool|문자열과 String Pool]]에서 같은 이야기를 한다.

## 대입이 복사가 아니라는 것

대입이 복사가 아니라는 것 때문에 이런 일이 생긴다.

```python
a = [1, 2, 3]
b = a
a[1] = 4

print(a)   # [1, 4, 3]
print(b)   # [1, 4, 3]  ← 건드리지도 않았는데
```

b를 손대지 않았는데 b가 바뀐다. 둘이 같은 리스트 객체를 가리키고 있었기 때문이다. 파이썬을 처음 쓸 때 가장 많이 당하는 함정이다.

## 값만 가져오는 세 방법

주소는 다르게 값만 가져오려면 복사해야 한다. 방법은 셋이다.

```python
b = a[:]              # 슬라이싱

from copy import copy
b = copy(a)           # copy 모듈

b = a.copy()          # 리스트의 copy 메서드
```

```python
a = [1, 2, 3]
b = a[:]
a[1] = 4

print(a)   # [1, 4, 3]
print(b)   # [1, 2, 3]  ← 영향 없다
print(id(a) == id(b))  # False
```

셋 다 [[shallow-and-deep-copy|얕은 복사]]다. 리스트 안에 또 리스트가 들어 있으면 안쪽은 여전히 공유된다. 그때는 `copy.deepcopy()`가 필요하다.

## 관련

- [[shallow-and-deep-copy|얕은 복사와 깊은 복사]]
- [[python-collection|파이썬 자료형]]
- [[string-pool|문자열과 String Pool]]

## 출처

- [[brain/lectures/pl/funny-python/funny09|재미있는 파이썬 9강 - 변수의 정확한 의미, 변수 다루기 응용]]
