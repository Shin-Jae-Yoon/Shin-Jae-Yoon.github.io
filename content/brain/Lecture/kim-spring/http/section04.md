---
title: "HTTP 메서드"
date: "2023-04-27 20:51"
enableToc: true
tags: [""]
weight: 5
---

인프런 김영한님의 <a href='https://www.inflearn.com/course/http-%EC%9B%B9-%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC' target='_blank'>모든 개발자를 위한 HTTP 웹 기본 지식</a> 강의를 정리한 내용

<hr>

### HTTP API 제작

<br>

**요구사항 : 회원 정보 관리 API를 만들어라**
- 회원 목록 조회
- 회원 조회
- 회원 등록
- 회원 수정
- 회원 삭제

<br>

**API URI(Uniform Resource Identifier) 설계**
- 회원 목록 조회 : `/read-member-list`
- 회원 조회 : `/read-member-by-id`
- 회원 등록 : `/create-member`
- 회원 수정 : `/update-member`
- 회원 삭제 : `/delete-member`

이것은 좋은 URI 설계일까? 아니다. 가장 중요한 것은 ==**리소스 식별**==이다.

<br>

==**API URI(Uniform Resource Identifier) 고민**==
- 리소스의 의미는 뭘까?
	- 회원을 등록하고 수정하고 조회하는게 리소스가 아니다 !
	- ex) 미네랄을 캐라 → 미네랄이 리소스
	- **회원이라는 개념 자체가 바로 리소스**
- 리소스를 어떻게 식별하는게 좋을까?
	- 회원을 등록하고 수정하고 조회하는 것을 모두 배제
	- **회원이라는 리소스만 식별하면 된다. → 회원 리소스를 URI에 매핑**

<br>

**API URI(Uniform Resource Identifier) 설계**
- **회원** 목록 조회
- **회원** 조회
- **회원** 등록
- **회원** 수정
- **회원** 삭제

<br>

**API URI 설계 - 리소스 식별, URI 계층 구조 활용**
- **회원** 목록 조회 : `/members`
- **회원** 조회 : `/members/{id}`
- **회원** 등록 : `/members/{id}`
- **회원** 수정 : `/members/{id}`
- **회원** 삭제 : `/members/{id}`
- 참고 : **계층 구조상 상위를 컬렉션으로 보고 복수단어 사용 권장**
	- member가 아닌 members

==**그런데, 리소스인 회원만 가지고 설계하면 조회/등록/수정/삭제를 어떻게 구분하지?**==

<br>

==**리소스와 행위를 분리 : 가장 중요한 것은 리소스를 식별하는 것**==
- **URI는 리소스만 식별!**
- **리소스**와 해당 리소스를 대상으로 하는 **행위**를 분리
	- 리소스 : 회원
	- 행위 : 조회, 등록, 삭제, 변경
- 리소스는 명사, 행위는 동사
- 행위(메서드)는 어떻게 구분할까?
	- → 이게 바로 ==**HTTP 메서드!!**==

<br><hr>

### HTTP 메서드 종류

==**HTTP 메서드는 클라이언트가 서버에 요청할 때 기대하는 행동**==

<br>

==**HTTP 주요 메서드**==
- **GET** : 리소스 조회
- **POST** : 요청 데이터 처리, 주로 등록에 사용
	- 무조건 데이터를 담아서 서버로 보내야함
- **PUT** : 리소스를 대체, 해당 리소스가 없으면 생성
- **PATCH** : 리소스 부분 변경
- **DELETE** : 리소스 삭제

> 근데, 최근에는 이 resource라는 표현은 <br>
> Representation으로 대체되었다.

<br>

**HTTP 기타 메서드**
- **HEAD** : GET과 동일하지만 메시지 부분을 제외하고, 상태 줄과 헤더만 반환
- **OPTIONS** : 대상 리소스에 대한 통신 가능 옵션(메서드)을 설명(주로 CORS에서 사용)
- **CONNECT** : 대상 자원으로 식별되는 서버에 대한 터널을 설정
- **TRACE** : 대상 리소스에 대한 경로를 따라 메시지 루프백 테스트를 수행

<br><hr>

### GET, POST

<br>

==**GET**==

```http
GET /search?q=hello&hl=ko HTTP/1.1
Host: www.google.com
```

- 리소스 조회
- 서버에 전달하고 싶은 데이터는 query(쿼리 파라미터, 쿼리 스트링)을 통해서 전달
- 메시지 바디를 사용해서 데이터를 전달할 수 있지만, 지원하는 곳이 많지 않아서 권장 ❌

<br>

**리소스 조회 1 : 클라이언트에서 GET으로 요청 메시지 전달** ![](brain/image/section04-1.png)

<br>

**리소스 조회 2: 요청 메시지 서버 도착** ![](brain/image/section04-3.png)

<br>

**리소스 조회 3. 서버가 요청받은거 기반으로 응답 메시지 만들어서 전달** ![](brain/image/section04-2.png)

<br><br>

==**POST**==
- 클라이언트가 서버로 데이터를 보내면서 이것 좀 처리해달라고 하는 것

```http
POST /members HTTP/1.1
Content-Type: application/json

{  
	"username": "hello", 
	"age": 20
}
```

- 요청 데이터 처리
- **메시지 바디를 통해 서버로 요청 데이터 전달**
- 서버는 요청 데이터를 **처리**
	- 메시지 바디를 통해 들어온 데이터를 처리하는 모든 기능 수행
- 주로 전달된 데이터로 ==신규 리소스 등록==, ==프로세스 처리에 사용==

<br>

**리소스 등록 1 : 클라이언트에서 POST로 요청 메시지 전달** ![](brain/image/section04-4.png)

<br>

**리소스 등록 2 : 서버에서 신규 리소스 생성** ![](brain/image/section04-5.png)

<br>

**리소스 등록 3 : 응답 데이터 전달** ![](brain/image/section04-6.png)

<br><br>

==**POST는 요청 데이터를 어떻게 처리한다는 의미일까?**==
- 스펙 : POST 메서드는 **대상 리소스가 리소스의 고유한 의미 체계에 따라 포함된 표현을 처리하도록 요청**합니다. (구글 번역)

**ex) POST는 다음과 같은 기능에 사용됨**
- HTML 양식에 입력된 필드와 같은 데이터 블록을 데이터 처리 프로세스에 제공
	- ex) HTML FORM에 입력한 정보로 회원가입, 주문 등에서 사용
- 게시판, 뉴스 그룹, 메일링 리스트, 블로그 또는 유사한 기사 그룹에 메시지 게시
	- ex) 게시판 글쓰기, 댓글 달기
- 서버가 아직 식별하지 않은 새 리소스 생성
	- ex) 신규 주문 생성
- 기존 자원에 데이터 추가
	- ex) 한 문서 끝에 내용 추가하기
- ==**정리하자면, 이 리소스 URI에 POST 요청이 오면 요청 데이터를 어떻게 처리할 지 리소스 마다 따로 정해야 함 → 정해진 것이 없음**==

<br><br>

==**POST 최종 정리**==
1. **새 리소스 생성(등록)에 사용**
	- 서버가 아직 식별하지 않은 새 리소스 생성
2. **요청 데이터 처리**
	- 단순히 데이터를 생성하거나, 변경하는 것을 넘어서 **프로세스**를 처리해야 하는 경우
		- ex) 주문에서 결제완료 → 배달시작 → 배달완료 처럼 단순히 값 변경을 넘어서 프로세스의 상태가 변경되는 경우를 의미
	- POST의 결과로 새로운 리소스가 생성되지 않을 수도 있음
		- ex) `POST /orders/{orderId}/start-delivery` (**컨트롤 URI**)
3. **다른 메서드로 처리하기 애매한 경우**
	- ex) JSON으로 조회 데이터를 넘겨야 하는데, GET 메서드를 사용하기 어려운 경우
		- GET 메서드는 보통 메시지 바디를 허용하지 않는 경우가 많아서, 이런 경우에는 조회이지만 POST를 사용해야 한다.
	- 애매하면 POST

<br>

> <a href='/brain/Lecture/kim-spring/http/section04/#http-api-제작'>위에서</a>는, URI는 리소스만 식별하여 명사를 사용하라고 했는데, POST의 예시로 만든 URI는 동사의 형태가 있다. 이는, 실무에서는 이상적으로 리소스인 명사만 구별할 수 없는 상황도 있기 때문이다. <br><br>
> 이렇게 동사 URI가 나올 수 있고, 이를 **컨트롤 URI**라고 한다. 기본적으로, 리소스를 가지고 최대한 URI를 설계하되, 어쩔 수 없는 경우에 컨트롤 URI를 사용한다.

<br><br>

==**POST는 사실 만능이다. BUT**==
- 사실 POST는 메시지를 담아서 보내는 모든 것을 할 수 있다.
- 하지만, 조회할 때는 GET을 사용하는게 유리하다.
	- 서버끼리는 GET으로 오면 캐싱하자는 약속을 하는 경우가 많기 때문
	- POST로 오면 캐싱하기는 사실 어렵다.
- 조회 데이터는 최대한 GET
- 변경 데이터, 프로세스 처리, 진짜 어쩔 수 없는 경우에는 POST

<br><hr>

### PUT, PATCH, DELETE

<br>

==**PUT**==

```http
PUT /members/100 HTTP/1.1
Content-Type: application/json

{  
	"username": "hello", 
	"age": 20
}
```

- **리소스를 ==완전히== 대체**
	- 리소스가 있으면 대체
	- 리소스가 없으면 생성
	- 쉽게 이야기하여, 덮어버림
	- 기존 리소스를 갈아치우는 것이라서, 사실 수정에 PUT을 사용하기에는 어려움
		- 수정은 PATCH를 사용하자
		- 요새는 PATCH가 다 되지만, 지원 안되는 서버도 있다. 그런 경우에는 무적의 **POST** 사용하자
- **중요! 클라이언트가 리소스를 식별**
	- 클라이언트가 구체적인 리소스 위치를 알고 URI 지정
	- POST와 차이점

<br>

**리소스가 있는 경우**

![](brain/image/section04-7.png)

![](brain/image/section04-8.png)

<br>

**리소스가 없는 경우**

![](brain/image/section04-9.png)

![](brain/image/section04-10.png)

<br>

**주의 : 리소스를 ==완전히== 대체한다**
- 기존 리소스를 삭제하고 완전 덮어버림!!!

![](brain/image/section04-11.png)

![](brain/image/section04-12.png)

<br><br>

==**PATCH**==

```http
PATCH /members/100 HTTP/1.1
Content-Type: application/json

{  
	"age": 50
}
```

- 리소스를 **부분적으로** 변경

<br>

**리소스 부분 변경** 

![](brain/image/section04-13.png)

![](brain/image/section04-14.png)

<br><br>

==**DELETE**==

```http
DELETE /members/100 HTTP/1.1
Host: localhost:8080
```

- 리소스 제거

<br>

**리소스 제거**

![](brain/image/section04-15.png)

![](brain/image/section04-16.png)

<br><hr>

### HTTP 메서드 속성

==**HTTP 메서드의 속성**==
- 안전 (Safe Methods)
- 멱등 (Idempotent Methods)
- 캐시가능 (Cacheable Methods)

![](brain/image/section04-17.png)

<br>

==**안전 (Safe Methods)**==
- **호출해도 대상 리소스를 변경하지 않는다.**
	- ex) GET 메서드는 안전할까?
		- 안전하다. 단순히 조회만 하니까
	- ex) POST, DELETE, PUT, PATCH 메서드는?
		- 당연히 안전하지 않다. 어떠한 변경이 발생하니까
- Q. 그런데 계속 호출해서, 로그 같은게 쌓여서 장애가 발생하면 어떻게하나?
- ==**A. 안전은 해당 리소스만 고려하고 그런 부분까지 고려 ❌. 말 그대로 해당 리소스가 안전하냐 안전하지 않냐 그것만 고려한다.**==

<br><br>

==**멱등 (Idempotent Methods)**==
- $f(f(x)) = f(x)$
- 한 번 호출하든, 두 번 호출하든, 100번 호출하든, **결과가 똑같다**
- 멱등 메서드
	- **GET** : 한 번 조회하든, 두 번 조회하든 같은 결과가 조회됨
	- **PUT** : 결과를 대체한다. 따라서 같은 요청을 여러 번 해도 최종 결과는 동일
	- **DELETE** : 결과를 삭제한다. 같은 요청을 여러 번 해도 삭제된 결과는 동일
	- ==**POST**== : 멱등 ❌!! 두 번 호출하면 같은 결제가 중복해서 발생할 수 있음

<br>

> **PUT이 왜 멱등일까?** 예를 들어서, 리소스가 없는 상태에서 이미지 파일 image1을 업로드 했다고 하자. 다음으로 똑같은 image1 파일을 또 업로드하면, 기존걸 날리고 결과가 대체되고 또 image1이 남아있다. 즉, image1 파일을 몇 번을 PUT을 해도 결과는 image1로 동일하다. 첫번째에 한 행위랑 몇번을 했던 마지막 행위랑 결과가 동일하다. 이는 **DELETE도 동일, 한번 호출하든 백번 호출하든 최종적으로 결과는 삭제되니까**

<br>

==**멱등 활용처**==
- **자동 복구 메커니즘**
	- **ex)** DELETE 메서드를 호출했는데, 뭔가 서버에서 응답이 없다. 이때 클라이언트가 잘 됐는지 안됐는지 모르니까 서버에다가 다시 DELETE 메서드를 호출해도 될까?
		- ㅇㅇ 된다. 왜냐하면 멱등하니까. 요청을 몇 번 하든 결과는 동일하니까.
- 서버가 TIMEOUT 등으로 정상 응답을 못주었을 때, 클라이언트가 같은 요청을 다시 해도 되는가?를 의미하는 것

<br>

==**멱등 추가 예시**==
- **Q. 재요청 중간에 다른 곳에서 리소스를 변경해버리면 어떻게 되나?**
	- 사용자1 : `GET -> username: A, age: 20`
	- 사용자2 : `PUT -> username: A, age: 30`
	- 사용자1 : `GET -> username: A, age: 30`
		- 사용자2의 영향으로 바뀐 데이터를 조회하게 됨
- ==**A. 멱등은 외부 요인으로 중간에 리소스가 변경되는 것까지 고려 ❌**==

<br><br>

==**캐시가능 (Cacheable Methods)**==
- 응답 결과 리소스를 캐시해서 사용할 수 있는가?
	- ex) 웹 브라우저가 되게 큰 이미지를 요청했을 때, 또 이를 받아올 필요가 있나?
- **GET, HEAD, POST, PATCH** 캐시 가능
- 실제로는 ==**GET, HEAD**== 정도만 캐시로 사용
	- 캐시를 하려면 이 똑같은 리소스랑 키가 맞아야 한다. **GET은 URL만 키로 잡고 캐시하면 되니까 되게 심플하다.**
	- POST, PATCH는 본문 내용까지 캐시 키로 고려해야 하는데, 구현이 쉽지 않다.
