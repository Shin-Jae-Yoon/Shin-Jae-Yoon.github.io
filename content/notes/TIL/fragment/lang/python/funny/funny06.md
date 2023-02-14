---
title: "[잔재미] Dictionary"
date: "2023-02-14 01:43"
enableToc: true
tags: ["잔재미코딩 파이썬"]
---

> 해당 게시글은 <a href='https://www.inflearn.com/course/python-crawling-basic' target='_blank'>파이썬 입문과 크롤링기초 부트캠프</a> 강의를 정리한 내용입니다.

## 01. 딕셔너리 자료형이란?  

<br>

`{키 : 값}`의 대응 관계를 가지는 자료형이다. 연관 배열(Associative array) 또는 해시(Hash)라고도 한다. 리스트와 튜플과는 다르게 순차적이지 않고, 오직 키(Key)를 이용해 값(Value)를 얻어낸다.  

**즉, 딕셔너리의 어떤 값을 찾기 위해 순차적으로 모든 키를 탐색할 필요 없이 해당하는 값의 키만 찾으면 된다는 의미이다.**
  
<br>

- **데이터 구조 : 딕셔너리 or 사전**
	- 선언 + 입력 : `변수명 = {}` 또는 `dict()` , `변수명 = {키:값}`
	- 읽기 : `변수명[키]`
	- 추가 : `변수명[새로운 키] = 새로운 값`
	- 삭제 : `del 변수명[삭제할 키]`
	- 수정 : `변수명[수정할 키] = 수정할 값`

<br><br>

## 02. 딕셔너리 다루기

<br>  

딕셔너리를 다루기에 앞서 리스트, 튜플, 딕셔너리 빈 배열을 만드는 방법을 정리해보자면 아래와 같다.

```python
data_list = list() # []
data_tuple = tuple() # ()
data_dict = dict() # {}
```

<br>

딕셔너리는 리스트와 튜플과는 다르게 순서가 없다고 했다. 그 말은, 인덱스를 이용해서 값을 뽑아내는 것이 불가능하고 오직, **딕셔너리의 키를 이용해서 값을 뽑아내는 것 말고는 방법이 없다는 말이다.**  

<br>

- 딕셔너리 선언과 입력

```python
data_dict = {'한국' : 'KR', '일본' : 'JP', '중국' : 'CN'}
print(data_dict['한국'])
출력결과 : 'KR'

a = {1 : 'hi'}
b = {'a' : [1, 2, 3]}
```

<br>
  
- 딕셔너리 추가

```python
data_dict = {'한국' : 'KR', '일본' : 'JP', '중국' : 'CN'}
data_dict['미국'] = 'US'
  
print(data_dict)
출력결과 : {'한국' : 'KR', '일본' : 'JP', '중국' : 'CN', '미국' : 'US'}
```

<br>

- 딕셔너리 삭제

```python
data_dict = {'한국' : 'KR', '일본' : 'JP', '중국' : 'CN'}
del data_dict['한국']

print(data_dict)
출력결과 : {'일본': 'JP', '중국': 'CN'}
```

<br>  

- 딕셔너리 수정

```python
data_dict = {'한국' : 'KR', '일본' : 'JP', '중국' : 'CN'}
data_dict['한국'] = 'Korea'

print(data_dict)
출력결과 : {'한국': 'Korea', '일본': 'JP', '중국': 'CN'}
```
  
<br><br>

## 03. 딕셔너리 응용  

<br>

**딕셔너리 주의사항**

<br>

1. 키가 중복되는 경우

딕셔너리 다루기에서 딕셔너리는 키(Key)를 이용해 값(Value)를 얻어낸다고 하였다. 그러면 중복된 키가 존재한다면 어떻게 될까?

키가 중복되면, 1개의 값을 제외하고 나머지 값은 무시된다. 키를 통해서 값을 얻는 딕셔너리의 특징 때문에 그러하다.

```python
a = {1: 'a', 1: 'b', 1: 'c'}
print(a[1])
  
출력결과 : c
```

<br>

2. 키로 변하는 값을 설정할 수 없다.

키(Key)는 값(Value)과는 다르게 변하지 않는 요소이다. 따라서, 리스트는 사용할 수 없지만 튜플은 사용할 수 있다. 리스트는 가변 객체이고 튜플은 불변 객체이기 때문이다.
  
```python
a = {[1, 2] : 'hi'}
b = {(1, 2) : 'hi'}
  
print(a)
print(b)
  
출력결과 : TypeError: unhashable type: 'list'
출력결과 : {(1, 2): 'hi'}
```

<br><br>
  
## 04. 딕셔너리 다양한 함수

<br>  

- keys()
	- 딕셔너리의 key 만을 모아서 dict_keys 객체를 반환
- values()
	- 딕셔너리의 values 만을 모아서 dict_values 객체를 반환
- items()
	- 딕셔너리의 keys와 values의 쌍을 튜플로 묶어서 dict_items 객체를 반환
- clear()
	- 딕셔너리 안의 모든 요소 삭제
- get()
	- 해당하는 key에 대응하는 value 반환
- in
	- 해당하는 key가 딕셔너리 내부에 있는지 조사

<br><br>  

**keys()**

- 파이썬 2.7 버전 까지는 keys 함수를 사용할 경우 반환 값으로 dict_keys 객체가 아닌 리스트를 반환했다. 하지만, 리스트를 반환하기 위한 과정에서 메모리 낭비가 심해 파이썬 3.0 버전 이후에는 메모리 낭비를 줄이려고 dict_keys 객체를 반환한다. <br><br> 반환 값으로 리스트가 필요한 경우에는 `list(a.keys())`를 사용하면 된다.

```python
a = {'key1': 'value1', 'key2': 'value2', 'key3': 'value3'}
print(a.keys())
  
출력결과 : dict_keys([key1, key2, key3])
  
# type() 함수를 이용해서 봐도 리스트가 아닌 객체 타입임을 확인 가능
print(type(a.keys()))
  
출력결과 : <class 'dict_keys'>
```

<br>

- 반복문을 이용해서 dict_keys 객체를 핸들링 할 수 있다. 리스트를 사용하는 것과 차이는 없지만, 리스트의 append, insert 같은 함수를 사용할 수는 없다.

```python
a = {'key1': 'value1', 'key2': 'value2', 'key3': 'value3'}
  
for key in a.keys():
	print(key)

출력결과 :
key1
key2
key3
```

- keys() 함수를 가장 많이 쓰는 형태는 아래이다.

```python
a = {'key1': 'value1', 'key2': 'value2', 'key3': 'value3'}
  
for key in a.keys():
	print(a[key])

출력결과 :
value1
value2
value3
```

<br><br>

**values()**

```python
a = {'key1': 'value1', 'key2': 'value2', 'key3': 'value3'}
  
for value in a.values():
	print(value)

출력결과 :
value1
value2
value3
```

<br><br>

**items()**

```python
a = {'key1': 'value1', 'key2': 'value2', 'key3': 'value3'}
  
for data in a.items():
	print(data)

출력결과 :
('key1', 'value1')
('key2', 'value2')
('key3', 'value3')
```

<br><br>

**clear()**

```python
a = {'key1': 'value1', 'key2': 'value2', 'key3': 'value3'}
a.clear()
  
print(a)
출력결과 : {}
```

<br><br>

**get()**

- get() 함수는 그냥 key를 이용해셔 value를 읽는 것과 동일한 역할을 한다.

- 사용하는 이유는 존재하지 않는 key를 이용하여 value를 가져 오려고 할 때, 그냥 읽으면 오류를 반환하지만 `get() 함수를 이용해서 읽으면 none을 반환해준다.`

```python
a = {'key1' : 'value1', 'key2' : 'value2'}
print(a[key3])
print(a.get('key3'))
  
출력결과 : NameError: name 'key3' is not defined
출력결과 : None
```
  
- 찾는 값이 없을 경우, None이 아닌 원하는 디폴트 값을 반환하도록 할 수 있다.
  
```python
a = {'key1' : 'value1', 'key2' : 'value2'}
print(a.get('key3', '해당하는 키가 없어요.'))

출력결과 : 해당하는 키가 없어요.
```

<br><br>

**in()**

- 해당하는 키가 딕셔너리 안에 있는 지 조사하는 것이다.

```python
a = {'key1' : 'value1', 'key2' : 'value2'}
print('key1' in a)
print('key3' in a)
print('value1' in a)
  
출력결과 : True
출력결과 : False
출력결과 : False # key가 아닌 value를 찾으니까 false로 나온다.
```