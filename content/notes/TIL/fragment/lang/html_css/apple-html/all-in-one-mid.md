---
title: "중급모듈"
date: "2023-02-12 16:35"
enableToc: true
tags: ["🖥️ 코딩애플 HTML/CSS"]
---

> 해당 게시글은 <a href='https://codingapple.com/course/html-basics/' target='_blank'>HTML/CSS All-in-one : 기초부터 Bootstrap, SASS, 고급 animation 까지</a> 강의를 정리한 내용입니다.

<hr>

## 폰트 설정법

- `font-family : '폰트'` 형식으로 설정한다.

- 버그 없이 사용하려면 폰트의 영문명 사용

- 폰트를 여러개 설정하는 이유는 안정석 확보를 위해서이다. 왼쪽부터 적용된다.

- 아래 예시에서 gulim이 없어서 적용 안된다면 gothic으로 적용한다는 의미

- 웹사이트 이용자의 컴퓨터에 설치가 된 폰트들을 적용할 수 있다.

```css
body {
	font-family: 'gulim', 'gothic';
}
```

<br>

**사용자의 컴퓨터에 설치되지 않은 폰트를 사이트에서 이용하는 방법**

- css 최상단에 `@font-face`로 적용할 폰트의 경로와 이름 작성

- 웹 폰트용으로 나온 **woff**파일은 ttf에 비해 용량의 3분의 1 수준

```css
@font-face {
	font-family: '폰트이름';
	src: url(폰트 저장 주소);
}
```

<br>

**Google Fonts 사용**

- 폰트 파일 없이, 구글 폰트를 직접 링크하는 방식

- 구글이 호스팅해주는 폰트가 미리 정의된 css 파일을 가져다 사용하는 방식이다.

- **내 사이트의 트래픽 절약 가능**

- 크롬 브라우저가 이미 방문한 사이트는 캐싱해주기 때문에 많은 사람들이 이용할수록 더 빠르게 폰트를 이용 가능

- html 적용 - `<link>` 부분

- css 적용 - `@import` 부분

<hr>

## 폰트 Anti-aliasing  

- 폰트 앤티앨리어싱은 폰트를 부드럽게 보여주는 기술

- 픽셀의 각진 부분을 부드럽게 바꾸는 방법

- mac은 자동으로 앤티앨리어싱 해주지만, window는 아님

- 글자에 각도를 주고 살짝 돌리면 됨

```css
p,
h4,
h3,
h2,
h1,
span,
button {
	transform: rotate(0.03deg);
}
```

<hr>

## flex

- 가로 배치, 혹은 여러 배치에서 자주 사용할 flex 속성이다.

- 부모 태그에 `display : flex;` 설정한다.

- `justify-content: flex-start;` 좌측 정렬

- `justify-content: flex-end;` 우측 정렬

- `justify-content: flex-center;` 가운데 정렬

- `justify-content: space-between;` 사이 사이 떨어뜨리게 꽉차게

- 세로 배치 원하면, `flex-direction: column;`

```css
.flex-container {
	display: flex;
	justify-content: flex-start;
}

.flex-item {
	width: 100px;
	height: 100px;
	background-color: gray;
	margin: 5px;
}
```

<br>

- flex에서 600px를 줬다고 하면, 실제 크기가 600px 되는 것이 아니라, 최대한 거기까지 키운다는 의미

- width가 커서 밑으로 보내고 싶다면 `flex-wrap: wrap;` 속성 이용

- flex 이용 시 상하 정렬은 `align-item: center;` 속성 이용

```css
/* 궁극적인 상하좌우 정렬 */

.flex-container {
	display: flex;
	height: 500px;
	align-items: center;
	justify-content: center;
}
```

<br>

- flex에서는 박스 크기를 px 말고 **비율**로 설정 가능하다.

- `flex-grow` 속성은 몇 배수를 의미한다.

- 아래의 예시는 1:2:1이다.

```html
<div class="flex-container">
	<div class="flex-item" style="flex-grow: 1">1</div>
	<div class="flex-item" style="flex-grow: 2">2</div>
	<div class="flex-item" style="flex-grow: 1">3</div>
</div>
```

<br>

- navbar 디자인 하고싶을 때 가운데를 붕 띄우고 싶으면 가운데만 비율주고 띄운다.

```html
<div class="flex-container">
	<div class="flex-item">1</div>
	<div class="flex-item" style="flex-grow: 1">2</div>
	<div class="flex-item">3</div>
</div>
```

<br>

<p align="center"><img src="https://i.imgur.com/S9vcMgL.png" height="30%" width="40%"></p>

- <a href='https://studiomeal.com/archives/197' target='_blank'>1분 코딩 css-flex</a>
- <a href='https://studiomeal.com/archives/533' target='_blank'>1분 코딩 css-grid</a>

<hr>

## HTML head 태그

- head 태그에는 사이트 내에서 눈에 보이지 않는 중요한 정보들

<br>

1. css 파일 첨부
	- link 태그 이용
	- 상대경로 방식, 절대경로 방식

<br>

  

2. 스타일 태그
	- css 파일과 유사하게 동작
	- body 태그 안에 있어도 동작하지만 html 파일 코드는 위에서 아래로 읽어나가는 방식이라서 body 태그에 뒀을 때 사이트 로딩 시 스타일이 깨질 수 있음

<br>

3. 사이트 제목
	- 브라우저 탭에 뜨는 이름

<br>

4. **meta 태그**

```html
<head>
	<meta charset="UTF-8" />
	<meta name="description" content="백엔드 마스터 신재윤입니다." />
	<meta name="keywords" content="백엔드, backend, 개발자, 신재윤" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
```

- 4-1 : 사이트 인코딩 형식 지정 방법

- 4-2 : 사이트 검색 결과 화면에 뜨는 글귀

- 4-3 : 검색에 도움을 주는 키워드

- description은 구글 검색 시 파란 제목으로 뜨는 글귀

- keywords는 검색에 도움을 주는 키워드

- 4-4 : 사이트 초기 줌 레벨이나 폭을 지정해주는 것

- `width=device-width`는 모바일 기기의 실제 폭으로 렌더링 해주는 것

- 실제 접속 시 스마트폰 기기의 실제 가로폭을 보고 렌더링하라는 명령어

- `initial-scale=1`은 접속시의 화면 줌 레벨 설정

<br>

5. open graph

```html
<head>
	<meta property="og:image" content="/이미지경로.jpg" />
	<meta property="og:description" content="사이트설명" />
	<meta property="og:title" content="사이트제목" />
</head>
```

- og 메타 태그는 facebook이 만든 태그

- 카카오톡, 페이스북 같은 sns에 링크를 공유했을 때 뜨는 박스

- 그 박스에 보이는 이미지, 사이트 제목, 사이트 설명

<p align="center"><img src="https://i.imgur.com/IAP6Xwh.png" height="30%" width="40%"></p>

<br>  

6. Favicon

```html
<head>
	<link rel="icon" href="아이콘경로.ico" type="image/s-icon" />
</head>
```

- 상단 탭 웹사이트 제목 옆에 뜨는 이미지 아이콘

- ico 형식 대신 png도 가능, 하지만 ico가 호환성 best

- 32 x 32 사이즈가 보편적

- 웹 사이트를 바탕화면에 바로가기 추가했을 경우 뜨는 아이콘도 커스터마이징 가능

- `rel="apple-touch-icon-precomposed"` 이렇게 rel 속성을 조정

- OS마다 요구하는 rel 속성이 달라지니까 그때그때 찾아서 적용

- 혹은 favicon generator 검색하면 OS별로 알아서 만들어줌

<hr>

## **반응형 웹**

<br>

vw (viewport width)
- 브라우저 폭에 비례

<br>

vh (viewport height)
- 브라우저 높이에 비례

<br>  

**rem (기본 폰트사이즈에 비례)**

- 보통 html 태그 폰트 사이즈는 기본 16px로 설정되어있다.

- 10rem이라고 하면 160px이 되는 것이다.

- 버튼이든 패딩이든 마진이든 전부 rem으로 크기지정하면 기본 font-size가 커져도 모든게 같이 커진다는 장점이 있다.

- 요즘은 컨트롤 누르고 마우스휠 올리면... 다 같이 커지기는 한다

<br>

em (내 폰트 사이즈의 몇배)

- 만약 내 폰트 사이즈가 15px, width가 20em이면 300px이 되는 것이다.

<br><br>

반응형 웹사이트를 만들 때, html head 태그에 meta 태그를 반드시 추가해야한다. 느낌표 emmet 하면 들어가있기는 하다.

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

<br>

기본적인 원리는 media query 문법이다. 아래 코드는 현재 브라우저 폭이 1200px 이하인 경우 저 내용을 적용해라는 의미이다.

```css
@media screen and (max-width: 1200px) {
	.main-title {
		font-size: 30px;
	}
}
```

반응형 웹에서 breakpoint 기준은 **1200px, 992px, 768px, 576px** 단위를 많이 사용한다. 보통 1200px 부터 태블릿, 768px부터 모바일 이런식으로 많이 사용한다. breakpoint는 4개 이상으로 넘어가면 복잡해진다.

<hr>

## 크롬 개발자 도구 (디버깅)

- css 스타일링을 바꿨는데 바뀌지 않는 오류가 있다면, 파일을 찾기보다 크롬 개발자 도구를 사용하자

- **우선 적용중인 스타일을 맨 위에서 보여준다**

- css의 !important 속성 (10000점)

- html의 style 속성 (1000점)

- css의 id 속성 (100점)

- css의 class 속성 (10점)

- html의 태그를 css에서 셀렉터 이용 (1점)

<hr>

## Font Awesome

평소에 자주 사용하던 폰트어썸 사이트, 간단한 아이콘을 폰트 취급하여 사용

<br>

사용방법

  1. 웹 Kit 방식 : 폰트 어썸 사이트에서 kit 생성하고 html head 파일에 삽입하는 방식. 서버 용량이 많지 않거나 귀찮을때 그냥 사용한다. 간단한 프로젝트에서 보통 많이 사용함.

2. CDN 방식 : Content Delivery Network (콘텐츠 전송 네트워크) 방식으로 폰트 어썸이 호스팅하는 서버에서 아이콘들을 받아와서 사용하는 방식이다.

> [!note] Kit 방식 vs CDN 방식?
>
> 사실 kit 방식과 cdn 방식이 어떤 차이인지 모르겠다.
kit 방식은 회원가입 후 발급받은 킷을 이용했고
cdn 방식은 구글에 fontawesome cdn 검색해서 나오는
cdnjs 사이트에서 그 링크를 이용했다.
cdnjs에서 가져온 링크는 로그인 할 필요도 없이 바로
사용할 수 있었다.

<br>

3. css 파일 다운로드 : 위의 두 방식은 폰트어썸 측의 서버가 다운되면 나에게도 영향이 끼친다는 의미이다. 이를 방지하고자 css 파일을 다운로드 받고 사용하는 방식이 있다. 강의에서는 다운받은 zip 파일에서 css 폴더의 `all.css`, `all.min.css`, `webfonts 폴더` 빼고 모두 지웠다. 그리고 웹폰트 폴더에서도 용량이 적은 woff만 사용했다.

<br>

Font Awesome 사용할 때 css 파일에서 font-size를 조절 혹은 html의 style 속성에서 font-size를 조절하곤 했는데, 간단한 약어로 아이콘 크기 조정, 회전, 애니메이션 효과, 아이콘 끼리 중첩 등이 가능했다. 보통 크기 조절은 간단하게 `<i class="fa-solid fa-cart-shopping fa-3x"></i>`와 같이 `fa-1x` 부터 `fa-5x`까지 되는 것 같았다.

<br>

- <a href='https://nuknukhan.tistory.com/38' target='_blank'>FontAwesome 스타일링 간단 사용법</a>
- <a href='https://fontawesome.com/docs/web/style/styling' target='_blank'>FontAwesome DOCS</a>

<hr>

## 애니메이션 만드는 원리

<br>

one-way 애니메이션 만드는 방법 

1. 시작스타일 만들기
2. 최종스타일 만들기
3. 언제 최종스타일로 변하는지 (ex. 마우스로 올렸을 때)
4. transition으로 애니메이션 속성 주기

<br>

transition 세부 속성

```css
.box {
	transition-delay: 1s; /* 시작 전 딜레이 */
	transition-duration: 0.5s; /* transition 작동 속도 */
	transition-property: opacity; /* 어떤 속성에 transition 입힐 지 */
	transition-timing-function: ease-in; /* 동작 속도 그래프 조정 */
}
```

- <a href='https://github.com/Shin-Jae-Yoon/TIL/blob/master/Language/html_css/lecture/codding_apple/%EC%A4%91%EA%B8%89%EB%AA%A8%EB%93%88/hw_responsive.css' target='_blank'>애니메이션 실습 예제 -  hw_responsive</a>
- <a href='https://github.com/Shin-Jae-Yoon/TIL/blob/master/Language/html_css/lecture/codding_apple/%EC%A4%91%EA%B8%89%EB%AA%A8%EB%93%88/hw2_animation.css' target='_blank'>애니메이션 숙제 예제 hw2_animation</a>

<br>

흘러넘치는거 숨겨주는 `overflow: hidden` 속성 까먹지 말자. overflow 속성은 박스의 폭이나 높이를 초과하는 내부요소를 처리하기 위한 속성이다. 만약 `overflow: visible`하면 넘치는 부분 보여주고 `overflow: scroll`하면 넘치는 요소를 보기 위한 스크롤 바가 생성된다.

<br>

추가로 다른 사이트에서 애니메이션 작동원리 보려면 크롬 개발자 도구에서 마우스로 찍은 후에 점 세개 눌러서 more tools에서 animations 탭을 보면 어떤 속성이 어느 정도의 시간에 거쳐서 변화하는지 보여준다.

<hr>

## Bootstrap  

- html, css 개발 속도를 빠르게 해주는 것
- css와 js cdn을 복사해서 붙혀넣기 하면 사용할 수 있다. css는 head 태그, js는 body 태그
- 유용한 키워드 : Navbar, Card, Carousel, Modal, Badge, Media Object, Shadow

<br>

개발시간 단축하는 Utility class가 제공된다.  
- container 클래스를 사용하면 여백 가진 박스가 생성된다.
- margin-top 같은 경우 `mt-3`이라고 하면 margin-top이 3정도 들어간다. 1~5까지 있다.
- padding-left와 right의 경우 `ps-5`, `pe-5`라고 한다. start와 end의 약자이다.
- 가운데 정렬은 `text-center`하면 된다.
- 폰트 사이즈는 `fs-3`로 하면된다. 1~6까지 있다.
- width는 `w-50`으로 하면 된다. %수치라서 100%까지 된다.
- 부트스트랩 홈페이지에서 Utilities에서 유틸리티 클래스 명을 찾을 수 있다.

```html
<div class="container">카드 같은거 ~</div>
<h5 class="card-title mt-3">Card title</h5>
<h5 class="card-title text-center">Card title</h5>
<h5 class="card-title fs-5">Card title</h5>
```

<br>  

부트스트랩은 특히 **반응형 레이아웃**에 관한 개발속도를 향상시킨다. container 박스 안에 row와 col을 적절하게 배열하면 된다. 보통 한 행 기준 12칸으로 쪼개는데 `col-4`로 하면 정확하게 3등분 되는 것이다.

```html
<div class="container">
	<div class="row text-center">
		<div class="col-4">안녕하세요</div>
		<div class="col-4">안녕하세요</div>
		<div class="col-4">안녕하세요</div>
	</div>
</div>
```

<br>

여기서 반응형을 추가하는 방법은 **조건문**을 더하면 된다. 현재, 웹 사이즈에서는 가로로 배열되어있는데 모바일에서는 세로로 배열하고 싶다고 하자. 그때 `-md`를 달아본다. md는 768px 이상에서만 저 조건을 실행해달라는 의미이다. 추가적인 자료는 <a href='https://getbootstrap.com/docs/5.1/layout/grid/' target='_blank'>Bootstrap 공식 문서</a>에서 확인한다.

<br>

반응형 웹을 디자인 할 때, 모바일 화면을 먼저 설계하는 것이 편하다.
- <a href='https://github.com/Shin-Jae-Yoon/TIL/blob/master/Language/html_css/lecture/codding_apple/%EC%A4%91%EA%B8%89%EB%AA%A8%EB%93%88/hw4_snsProfile.html' target='_blank'>hw4_snsProfile 실습</a>은 99% 부트스트랩으로 제작했음
- 부트스트랩에서 flex의 shrink, grow가 헷갈린다? <a href='https://studiomeal.com/archives/197' target='_blank'>1분 코딩 css-flex</a>, <a href='https://darrengwon.tistory.com/130' target='_blank'>티스토리 블로그</a> 참고
- 부트스트랩의 d-flex 등 다양한 레이아웃은 <a href='https://espania.tistory.com/142' target='_blank'>여기</a> 참조

<br>

### Bootstrap 수직정렬

<br>

<a href='https://github.com/Shin-Jae-Yoon/TIL/blob/master/Language/html_css/lecture/codding_apple/%EC%A4%91%EA%B8%89%EB%AA%A8%EB%93%88/bootstrap2.html' target='_blank'>bootstrap2.html</a> 예제에서 사진과 글자를 수직정렬할 때의 문제이다. css를 다룰 때 고질적으로 겪었던 오류이다. 부트스트랩의 `align-middle`을 아무리 써봐도 글자가 수직정렬 되지 않았다. 근본적인 해결책을 찾고자 한다.

<br>

먼저, 글은 p 태그로 작성한 상태이다. <a href='https://programmer-ririhan.tistory.com/83' target='_blank'>티스토리 블로그 글</a>에서 css를 통한 수직 정렬을 하는 vertical-align 속성은 block 요소가 아닌 inline 혹은 inline-block에서만 사용 가능하다는 점이다. 아차! 싶었다. p 태그는 display 기본 속성이 block 속성이다. 그래서 <a href='https://getbootstrap.com/docs/5.1/utilities/vertical-align/' target='_blank'>Bootstrap docs Vertical alignment</a>도 살펴보면, `To vertically center non-inline content (like <div>s and more), use our flex box utilities.`라고 떡하니 나와있었다. block 속성은 flex box utilities를 이용하라고..

<br>

또 vertical-align 속성에 대한 잘못된 지식이 있었음을 알 수 있었다. 하나의 div 박스가 있고 그 박스에 `text-align : middle;`속성을 줬을 때 가운데 정렬이 되었던 경험을 살려 `vertical-align: middle;`하면 되겠지~ 싶었는데 서로 다른 느낌이다. text-align은 말 그대로 박스 안의 가운데 정렬이 맞지만, vertical-align은 간단한 inline 내에서 높낮이 정도 조절하는 것이다. <a href='https://developer.mozilla.org/ko/docs/Web/CSS/text-align' target='_blank'>text-align MDN 공식문서</a>에서 **블록 요소나 표의 칸 상자의 가로 정렬을 설정한다**고 떡하니 나와있고, <a href='https://developer.mozilla.org/ko/docs/Web/CSS/vertical-align' target='_blank'>vertical-align MDN 공식문서</a>에서 **inline 또는 table-cell box에서의 수직 정렬을 지정한다**고 떡하니 나와있다. 내가 가진 개념은 오개념이었다.

<br>

<a href='https://getbootstrap.com/docs/5.1/utilities/flex/#align-items' target='_blank'>Bootstrap docs align</a>에서는 정의한다. `align-items-center`를 이용하여 flex 아이템들을 정렬시키든 `align-self-center`를 이용하여 정렬시키는 방법이 떡하니 나와있었다. 예제의 경우 `row` 클래스의 행 속성에 `align-items-center`를 이용하여 아이템들을 가운데 정렬 시키든가 혹은 `col`클래스의 열 속성에 `align-self-center`를 이용하여 가운데 정렬 시키든가 두 방법 중 하나를 선택하면 된다.

<br>

추가로, flex 박스의 순서를 부여하고자 할 때는 `order`를 이용하도록 한다. 물론 order 클래스 역시 조건문을 달아서 반응형으로 제작 가능하다. `order-lg-3`의 형태로 !

<br>

### Bootstrap pill badge  

부트스트랩에서 알약 모양 bill badge 썼을 때 알약이 깨지는 경우에는 `box-sizing: border-box;` 확인하자

<hr>

## CSS 레거시 코드 수정 방법

원본 CSS 파일을 건들기 애매한 경우 CSS를 덮어쓰는 방법이 있다.

1. 같은 클래스명 하단에 작성
2. 우선순위 높이기
3. specificity 높이기

먼저, 1번의 방법을 설명하겠다. HTML 파일에서 main.css를 link하고 있다고 하자. 그러면 그 아래에 main2.css를 한 번 더 link 하는 방식이다.


```css
/* main.css */
.custom {
	color: green;
}

/* main2.css */
.custom {
	color: blue;
}
```

이렇게 작성하면 결과적으로 색깔이 blue로 바뀔 것이다. **같은 class면 더 밑에 있는게 우선 적용되는 원리이다.** 즉, css 파일이 나뉘어져 있어도 밑에 있으면 더 우선적으로 적용되는 성질이다. media query도 밑에 작성하는 이유도 바로 이것이다.

<br>

2번의 방법은 우선순위를 높이는 것이다. 위에서 **html의 style 속성 (1000점), css의 id 속성 (100점), css의 class 속성 (10점), html 태그 셀렉터 (1점)** 방법을 이용한다. 사실 10000점 짜리도 있다. `!important`가 붙은것은 무조건 최우선적으로 적용된다.

```css
.custom {
	color: red !important;
}
```

그러나, 우선순위를 높이는 방식은 근본적인 해결방법이 아니다. 계속 우선순위를 높여갈 수 없지 않은가? 따라서 이 방법은 급할 때 사용하되 가능한 사용하지 않도록 한다.

<br>

마지막으로 specificity 점수를 높이는 것이다. 클래스 명을 더 세부적으로 적어서 점수를 찔끔찔끔 올리는 방식이다.  

```css
/* 태그 셀렉터 1점 + class 10점 + class 10점 = 21점 */
div.main-background .custom {
	color: green;
}

/* class 10점 = 10점 */
.custom {
	color: red;
}
```


따라서, .custom이 아래에 있다고 해도 위가 최종적으로 점수가 높기 때문에 위의 코드가 적용된다. 그러면 애초에 위처럼 누가 작성해놨다고 하면?

```css
/* 남이 짜놓은 레거시 코드, 21점 */
div.main-background .custom {
	color: green;
}

/* 조금이라도 점수 올리기 위한 발악, 22점 */
div.main-background p.custom {
	color: red;
}
```

그래서, 처음부터 셀렉터를 너무 정확하게 적어놓으면 나중에 덮어쓰기 힘들 수 있다. 그래서 클래스명 하나를 작성하는 방식을 처음에 사용하도록 노력하자.

<br>

**좋은 코드의 기준**

1. 나중에 수정/관리가 쉬운 코드
2. 확장성이 좋은 코드

즉, 재활용 가능하고 확장해서 다른 class 만들기 쉽다면 좋은 css 코드라고 할 수 있다.