---
title: "URI & Web"
date: "2023-04-27 20:51"
enableToc: true
tags: [""]
weight: 3
---

인프런 김영한님의 <a href='https://www.inflearn.com/course/http-%EC%9B%B9-%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC' target='_blank'>모든 개발자를 위한 HTTP 웹 기본 지식</a> 강의를 정리한 내용

<hr>

### URI

==**URI (Uniform Resource Identifier) : 리소스를 식별하는 통합된 방법**==
- 리소스를 식별한다는 것은, 사람을 주민등록번호로 식별하는 것처럼 **자원이 어디에 있는 지, 자원 자체를 식별하는 방법을 의미**

<br>

==**URI? URL? URN?**==
- URI는 로케이터(**L**ocator), 이름(**N**ame) 또는 둘 다 추가로 분류될 수 있음
- URL : 리소스가 이 위치에 있어요 !
- URN : 리소스의 이름이 이거에요 !

![](brain/image/section02-1.png)

![](brain/image/section02-2.png)

<br><br>

**URI의 단어 의미**
- **U**niform : 리소스를 식별하는 통일된 방식
- **R**esource : 자원, URI로 식별할 수 있는 모든 것 (제한 ❌)
- **I**dentifier : 다른 항목과 구분하는데 필요한 정보
	- URL : Uniform Resource Locator
	- URN : Uniform Resource Name

<br>

**URL, URN의 단어 의미**
- URL - Locator : 리소스가 있는 위치를 지정
- URN - Name : 리소스에 이름을 부여
- **위치**는 변할 수 있지만, **이름**은 변하지 않는다.
- `urn:isbn:8960777331` (어떤 책의 isbn URN)
- URN 이름만으로 실제 리소스를 찾을 수 있는 방법이 보편화 되지 않음
- ==앞으로 URI를 URL과 같은 의미로 이야기하겠음==

<br>

**URL 분석해보기**

![](brain/image/section02-3.png)

`scheme://[userinfo@]host[:port][/path][?query][#fragment]`

- 프로토콜 (`https`)
- 호스트명 (`www.google.com`)
- 포트번호 (`443`)
- 자원 경로 (`/search`)
- 쿼리 파라미터 (`q=hello&hl=ko`)

<br>

==**scheme**==

 **`scheme`**`://[userinfo@]host[:port][/path][?query][#fragment]`
 
 **`https`**`://www.google.com:443/search?q=hello&hl=ko`
 
 - 주로 프로토콜 사용
 - 프로토콜 : 어떤 방식으로 자원에 접근할 것인가 하는 약속, 규약, 규칙
	 - ex) http, https, ftp 등등
- http는 80 포트, https는 443 포트를 주로 사용, **포트는 생략 가능**
- https는 http에 보안이 추가된 형태 (HTTP Secure)

<br>

==**userinfo**==

`scheme://`**`[userinfo@]`**`host[:port][/path][?query][#fragment]` 

`https://www.google.com:443/search?q=hello&hl=ko`

- URL에 사용자 정보를 포함해서 인증
- 거의 사용하지 않음

<br>

==**host**==

`scheme://[userinfo@]`**`host`**`[:port][/path][?query][#fragment]`

`https://`**`www.google.com`**`:443/search?q=hello&hl=ko`

- 호스트명
- 도메인명 or IP주소를 직접 사용 가능

<br>

==**PORT**==

`scheme://[userinfo@]host`**`[:port]`**`[/path][?query][#fragment]`

`https://www.google.com:`**`443`**`/search?q=hello&hl=ko`

- 포트(PORT)
- 접속 포트
- 일반적으로 생략, 생략시 http는 80, https는 443

<br>

==**path**==

`scheme://[userinfo@]host[:port]`**`[/path]`**`[?query][#fragment]`

`https://www.google.com:443/`**`search`**`?q=hello&hl=ko`

- 리소스가 있는 경로(path), **계층적 구조**
- ex) `/home/file1.jpg`, `/members`, `/members/100`, `/items/iphone12`

<br>

==**query**==

`scheme://[userinfo@]host[:port][/path]`**`[?query]`**`[#fragment]`

`https://www.google.com:443/search`**`?q=hello&hl=ko`**

- key=value 형태
- ?로 시작, &로 추가 가능 `?keyA=valueA&keyB=valueB`
- query parameter, query string 등으로 불림
	- 웹서버에 제공하는 파라미터, 문자 형태

<br>

==**fragment**==

`scheme://[userinfo@]host[:port][/path][?query]`**`[#fragment]`**

`https://docs.spring.io/spring-boot/docs/current/reference/html/getting-started.html`**`#getting-started-introducing-spring-boot`**

- **html 내부 북마크** 등에 사용
- **서버에 전송하는 정보 아님**

<br><hr>

### Web Browser

<br>

==**웹 브라우저 요청 흐름**==
![](brain/image/section02-3.png)
- 웹 브라우저의 주소창에 입력했을 때 일어나는 흐름을 살펴보자

<br> <hr>


==**1. 웹 브라우저가 DNS 서버 조회하여 IP 찾고, https 인 것을 이용하여  포트 정보 443 찾아내고 HTTP 요청 메시지 생성**==

![](brain/image/section02-4.png)
![](brain/image/section02-5.png)

<br>

==**2. 생성한 HTTP 요청 메시지를 SOCKET 라이브러리를 통해 TCP/IP 계층으로 전달**==
- SYN - SYN/ACK - ACK로 TCP/IP에 연결 (IP, PORT 정보 있으니까)
- 그리고 데이터 전달

![](brain/image/section02-6.png)

<br>

==**3. HTTP 메시지를 감싸는 TCP/IP 패킷 생성하고, 최종적으로 물리적인 네트워크 인터페이스를 통해 인터넷 공간으로 나감**==

![](brain/image/section02-9.png)

<br>

==**4. 웹 브라우저에서 출발한 요청 패킷이 구글 서버로 전달**==
- 패킷을 받으면, 구글 서버에서는 HTTP 메시지 빼고는 다 까서 버림
- 마치 택배 도착한거 포장 까는것처럼

![](brain/image/section02-12.png)

![](brain/image/section02-11.png)

<br>

==**6. 구글 서버에서 HTTP 응답 메시지 생성하고 웹 브라우저로 응답 패킷 전달**==

![](brain/image/section02-13.png)

![](brain/image/section02-14.png)

![](brain/image/section02-15.png)

<br>

==**7. 최종적으로 웹 브라우저가 응답 패킷을 까서 HTTP 메시지를 확인하고 렌더링해서 화면에 모습을 보여줌**==

![](brain/image/section02-16.png)

