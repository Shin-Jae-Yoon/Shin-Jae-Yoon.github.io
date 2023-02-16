---
title: "고급모듈"
date: "2023-02-12 16:35"
enableToc: true
tags: ["🖥️ 코딩애플 HTML/CSS"]
---

> 해당 게시글은 <a href='https://codingapple.com/course/html-basics/' target='_blank'>HTML/CSS All-in-one : 기초부터 Bootstrap, SASS, 고급 animation 까지</a> 강의를 정리한 내용입니다.

<hr>

## Pseudo-element
- pseudo-class (다른 상태일 때 스타일 줄 때) `.class:`
- pseudo-element (내부의 일부분만 스타일 줄 때) `.class::`

<br>

기초 모듈 수업에서 pseudo-class 가 무엇인지 학습했었다. `:hover`와 같이 특정 요소가 다른 상태일 때 (ex. 마우스 올렸을 때) 스타일 줄 수 있게 해주는 것이었다. pseudo-element는 콜론 2개 `::`를 입력하여 사용한다.

```css
/* 이러면 pseudo 클래스의 첫 번째 글자만 빨간색으로 바뀜! */
.pseudo::first-letter {
	color: red;
	font-size: 2rem;
}
```

<br>

보통 `::after (내부 맨 뒤에 뭔가 추가)`나 `::before (내부 맨 앞에 뭔가 추가)`를 어느정도 자주 사용하는 편이다.  

```css
/* 이러면 pseudo 클래스 맨 뒤에 '안녕' 글자 생김 */
.pseudo::after {
	content: '안녕';
	color: red;
	font-size: 2rem;
}
```

만약, float를 사용해서 `clear: both;`를 하고 싶은 경우에 pseudo-element를 이용해서 빈 div 박스를 추가해줄 수 있다. (즉, 귀찮게 html 맨 밑에 div 박스 추가하고 style 줄 필요 없다는 말이지만, 나는 앞으로 float 안쓰고 flex 같은거 쓸거니깐... 그래도 혹시 모르니 메모 !)
  
```css
.product-container::after {
	content: ''; /* 그냥 내용 없는거 */
	display: block;
	clear: both;
	float: none;
}
```

<br>  

`input 태그의 type이 file`인 경우 화면에 `파일 선택` 버튼 말고 `선택된 파일 없음`이라는 글자가 나온다. 아래에서 설명한 shadow dom인데 이 경우 단순히 input 태그를 조작하여서 버튼 색깔을 변경할 수는 없다.

```css
/* 이러면 "선택된 파일 없음" 여기 배경색이 바뀜 */
.input_file {
	background: skyblue;
}

/* 이렇게 해야 "파일 선택" 버튼의 배경색이 바뀜 */
.input_file::file-selector-button {
	background: skyblue;
}

/* pseudo-element에 pseudo-class도 사용 가능 */

.input_file::file-selector-button:hover {
	background: blue;
}
```

<br>

- Pseudo-element 활용한 쓸데없는 짓들

- CSS 만으로 버튼에 마우스 올리면 배경 어둡게하기 https://codepen.io/css-tricks/pen/dxyfA

- CSS만으로 3D 느낌 리본모양만들기 https://codepen.io/team/css-tricks/pen/mVZGKa

- ol 태그의 숫자 스타일링하기 https://www.456bereastreet.com/archive/201105/ styling_ordered_list_numbers/

- table 반응형으로 만드는 여러가지 방법 https://css-tricks.com/responsive-data-tables/

- CSS만으로 영문 폰트 만들기 https://yusugomori.com/projects/css-sans/fonts

<hr>  

## Shadow DOM

```html
<input type="file" />
```

이와 같은 코드 입력 시, 화면에 `파일 선택` 버튼 말고 `선택된 파일 없음`이라는 글자가 나온다. 분명 태그 하나만 사용했는데 2개를 사용한 것처럼 보인다. 이것은 **Shadow DOM**이라는 숨겨진 요소 때문이다.  

<br>

크롬 개발자 도구 설정에서 Elements의 `Show user agent shadow DOM`을 체크한 이후 input 태그의 내부를 살펴보면 shadow-root가 있고 그 안에 보면 `pseudo="-webkit-file-upload-button"`이 있을 것이다. 이것이 shadow DOM이다. input 태그 하나만 입력해도 span 태그인 선택된 파일 없음이 한 번에 입력되도록 개발자에게 편하려고 생긴 것이다.

<br>  

그래서 결국, 버튼에 배경색을 주려면 위에서 했던 `.input_file::file-selector-button` 말고 어떻게 하지?

<br>

**input [type=file]**

```css
input[type='file']::-webkit-file-upload-button {
	background: black;
	color: white;
}
```

크롬 개발자 도구 열어서 pseudo 부분을 pseudo-element 부분에다가 넣고 스타일링 하면 된다. 왜냐면 pseudo-element 역할 자체가 **내부의 일부분만 스타일 줄 때** 사용하는 것이니까 내부의 버튼에만 스타일을 주고싶은 거니까 이렇게 사용하는 것이다.

<br>

추가로, `-webkit-`은 크롬, 사파리, Edge에서만 적용되는 스타일이다. Firefox는 `-moz`를 작성해야하고 Explorer는 `-ms-`를 사용한다. 즉, 브라우저마다 shadow DOM 까보면 살짝씩 다르다.

<br>

> [!note]  실제 파일 업로드 버튼 만드는 것
>
> 글자를 눌러도 버튼이 선택되게 스타일링한다.
그리고 input태그는 display를 none 줘버린다.


```html
<label for="sub">
	파일 업로드
	<input id="sub" type="file" style="display: none" />
</label>
```

<br>  

**input placeholder**

input 태그의 `placeholder`도 div 박스 두 개의 형태 같지 않는가? shadow DOM인가? 까보면 역시 그렇다.

```css
/* 이러면 placeholder 안에 글자 색깔 빨간색으로 바뀜 */
input::-webkit-input-placeholder {
	color: red;
}
```

<br>
  
**input [type=range]**

range 또한 마찬가지이다. range는 id가 track과 thumb 두 개가 있음을 확인 가능하다. 그런데 아마 손잡이 thumb는 pseudo 어쩌구가 없어서 선택 어떻게 해야하나 의문이 들 것이다. 눌러서 밑에 보면 `user agent stylesheet`가 보일 것인데 **브라우저 기본 CSS**를 의미한다. 우리가 스타일 주지 않아도 기본적으로 보이는 스타일이다. 따라서, 여기 `input[type='range']::-webkit-slider-thumb` 부분을 복사해오고 조작하면 된다. 따옴표나 i 이런건 지우고 사용한다. 이때, apperance가 기본 값이 auto라서 none으로 바꾸고 사용해야 한다. 손잡이 thumb의 apperance만 바꾸면 안되고 range 자체의 apperance를 바꿔야 적용될 것이다.

<br>

```css
input[type='range'] {
	appearance: none;
	background-color: lightgray;
	border-radius: 1rem;
}

input[type='range']::-webkit-slider-thumb {
	appearance: none;
	background-color: green;
	width: 1rem;
	height: 1rem;
	border-radius: 1rem;
}
```

<br>

**progress**

```css
progress {
	/*기본 배경은 없애주는게 좋습니다*/
	-webkit-appearance: none;
	-moz-appearance: none;
	appearance: none;
	background: white;
	
	/* IE10 호환성용 */
	color: red;
}

progress::-webkit-progress-bar {
	background-color: lightgray;
	border-radius: 1rem;
}

progress::-webkit-progress-value {
	background-color: red;
	border-radius: 1rem;
}

/*파이어폭스 호환성을 위해*/
progress::-moz-progress-bar {
	background-color: red;
	border-radius: 2px;
}
```

<hr>

## Sass

- CSS를 개선한 CSS 전처리언어 (Preprocessor) = SASS

- Sass에는 조건문, 반복문, 변수, 함수 존재

- 즉, 문법이 존재한다는 의미 => 반복적인 부분 쉽게 처리 가능

- SASS 파일은 `파일명.scss`

- 웹 브라우저는 sass파일을 읽지 못하니까 css로 변환 작업이 필요하다. vscode extension에서 `Live Sass Compiler version 5 이상`을 설치한다. 그러면 vscode 하단에 `Watch Sass`가 보인다. 이를 누르면 scss에서 css로 변환이 된다.

- 같이 생성되는 `.map`파일은 크롬 개발자도구 디버깅 용도이다. 크롬에서는 scss 파일을 읽는 것이 아니라 css 파일을 읽을 것이다. `.map` 파일이 있으면 크롬에서 css가 아닌 scss 파일로 분석해준다.

<br>

1. 코드를 scss에 작성
2. html에 파일 넣는건 css 파일 넣기

<br>

> [!note] 하단에 바가 안보여서 watch sass를 찾을 수 없다면?
>
> View - Appearance - Status bar 켜기

<br>

파일 확장명에 따른 차이

- sass 문법을 작성해서 만든 파일명은 2개가 있음
- `.scss` : 중괄호 써야 하는거 (보통 이거 많이 사용)
- `.sass` : 중괄호 안써도 되는거

<br><br>

### Sass 문법

<br>

### 문법01. 값을 저장하고 사용하는 변수

- 어려운 단어 기억해야할 때 변수 문법을 사용한다. `$변수명 : 저장해서 사용할 값;`
- 규칙적인 스타일 만들 때도 변수를 사용하는 것은 도움이 된다.
- 사칙연산 바로 가능 (단, %에서 px 빼는 행위는 하지 말고 같은 단위끼리 하자.)

```css
/* 기존 css 코드 */
.background {
	background-color: #2a4cb2;
}

.box {
	color: #2a4cb2;
}
```
  
```scss
// 변수 사용 scss 코드
$메인컬러: #2a4cb2;

.background {
	background-color: $메인컬러;
}
```

```scss
// scss 응용하기 좋은거
$메인컬러: #2a4cb2;
$서브컬러: #eeeeee;
$기본사이즈: 16px;

.background {
	background-color: $메인컬러;
	font-size: $기본사이즈 - 2px;
}

.box {
	color: $서브컬러;
	font-size: $기본사이즈 + 2px;
}
```

위 코드는 font-size를 기본사이즈에서 빼고 더함으로써 **상대적인 크기**를 결정했다. 그래서 나중에 수정하기에 용이하다. 즉, 규칙적인 스타일 만들 때도 변수를 사용하는 것은 도움이 된다는 의미이다.

<br>  

```scss
// 괄호를 치는 것이 좋은 습관 !
$기본사이즈: 16px;

.box {
	font-size: $기본사이즈 + 2px;
	width: (100px * 2);
	height: (300px / 3);
}
```

<br>

사실 CSS 기본 문법에도 변수 문법 이용 가능하고 사칙연산도 사용 가능하다. 근데 귀찮음

<br>  

### 문법02. 셀렉터 대신 사용하는 Nesting

- 관련있는 class들을 묶어서 사용할 때 편함
- nesting 안에다가 또 nesting 가능하지만, 보통 2개 이상 중첩하지는 않음

```css
/* CSS 문법 */
.navbar ul {
	width: 100%;
}

.navbar li {
	color: black;
}
```

```scss
// sass 문법
.navbar {
	ul {
		width: 100%;
	}

	li {
		color: black;
	}
}
```

```scss
// sass 문법으로 hover 사용법
.navbar {
	:hover {
		color: blue;
	}
}

.navbar {
	&:hover {
		color: blue;
	}
}
```

- 위의 방식은 `.navbar :hover`
- 밑의 방식은 `.navbar:hover`
- 즉 `&`기호를 붙히면 셀렉터를 스페이스바 없이 붙힐 수 있음

<br>

### 문법03. 이미 있는 클래스를 확장하는 @extend

- 반복되는 코드 없애고 싶을 때 사용
- class 전체를 복사해주는 문법이 `@extend`
- `%`는 `.` 대신 사용할 수 있는 임시 클래스
- css에서 클래스로 컴파일하고 싶지 않을 때 사용
- 컴파일 하고나면 `%` 안에 있는 것들은 모두 사라짐

1. 중복된 스타일이 많으면 클래스로 묶는다
2. `@extend`로 필요할 때 복사한다.

```scss
%btn {
	width: 100px;
	height: 100px;
	padding: 20px;
}

.btn-green {
	@extend %btn;
	color: green;
}

.btn-red {
	@extend %btn;
	color: red;
}
```

```css
/* 위의 scss에서 컴파일된 css 결과 */
.btn-green,
.btn-red {
	width: 100px;
	height: 100px;
	padding: 20px;
}

.btn-green {
	background: green;
}

.btn-red {
	background: red;
}
```

<br>

### 문법04. 코드를 한 단어로 축약하는 @mixin

- 약간 함수 같은 느낌
- `@mixin`으로 선언, `@include`로 불러오기, `$ 변수 사용해서 파라미터`
- `@extend`와 비슷해보이지만 파라미터 때문에 `@mixin`을 더 많이 사용함

```scss
@mixin 버튼기본디자인() {
	font-size: 16px;
	padding: 10px;
}

.btn-green {
	@include 버튼기본디자인();
	background: green;
}
```

```scss
@mixin 버튼기본디자인($구멍1, $구멍2) {
	font-size: 16px;
	padding: 10px;
	background: $구멍1;
	color: $구멍2;
}

.btn-green {
	@include 버튼기본디자인(green, black);
}
```

```css
/* 컴파일된 css 파일 */
.btn-green {
	font-size: 16px;
	padding: 10px;
	background: green;
	color: black;
}
```

만약, 글자 중간에 `$변수` 혹은 `$파라미터` 넣고 싶으면 `#{ $변수명 }`을 사용한다.

```scss
@mixin 폰트기본스타일($구멍1, $구멍2) {
	font-size: $구멍1;
	#{ $구멍2 }: -1px;
}

h2 {
	@include 폰트기본스타일(40px, letter-spacing);
}
```

```css
/* 컴파일 된 css */
h2 {
	font-size: 40px;
	letter-spacing: -1px;
}
```

<br>

### 문법05. 다른 파일에 있는 내용 가져오는 @use 문법
  
- 파이썬의 `@import`같은 느낌이다.
- 예를 들어, 여러 파일에 공통적으로 사용되는 css 기본 세팅같은거 파일 저장해놓고 불러와서 사용
- css 기본 문법에도 `@import` 있음 scss에서는 `@use` 쓰는거
- 컴파일을 원하지 않는 파일은 `_파일명.scss`로 작명한다.
- `@use '파일명'` 할 때 컴파일 안되게 언더바 붙힌 파일에서 언더바는 빼도 된다
- 예를 들어, `sass01.scss` 파일에서 `_reset.scss` 파일 `@use`할 때, `@use 'reset'` 이까지만 적어도 되는거

<br>

> [!note] Memo
>
> 뭐 기본세팅 .scss 파일은 종속적인 파일이니까 굳이 매번 .css로 컴파일 할 필요가 없잖아? 그러니까 언더바(_) 붙혀서 컴파일 못하게 하자.

<br>

파일을 불러오면 거기에 있던 `@mixin`, `$변수` 이런거 다 사용 가능

1. 다른 파일의 `$변수` 사용
	- `파일명.$변수`

2. 다른 파일의 `@mixin` 사용
	- `@include 파일명.mixin이름`

<hr>

## HTML video, audio

- `<video src="영상.mp4"></video>`의 형태로 넣음
- `<video src="영상.mp4" controls></video>` 하면 재생버튼 생김 **controls**
- 근데 영상 넣을때 `source`를 따로 넣는게 더 나

<br>

**source 태그**를 이용해서 따로 넣는 방식의 장점은 **호환성을 챙길 수 있다**는 것이다. 비디오의 형식이 mp4, webM, mkv 등 브라우저마다 지원하는 비디오 확장자가 다르다. 따라서, 아래와 같은 코드로 작성하면 위에거 틀어보고 안되면 밑에거 틀어보세요~ 이런 말이다.  

```html
<!-- 보통 용량이 작은 확장자부터 위에 작성한다. -->
<video controls>
	<source src="영상-m.webm" type="video/mp4" />
	<source src="영상-m.???" type="video/mp4" />
	<source src="영상.mp4" type="video/mp4" />
</video>
```

<br>

**autoplay**는 크롬 브라우저에서 자동재생 정책상 그냥 `autoplay` 작성하면 안되고 `autoplay muted`해야 된다.

```html
<video controls autoplay muted>
	<source src="영상.mp4" type="video/mp4" />
</video>
```

<br>

**preload**는 브라우저 로딩 시 영상을 미리 다운받을지, 말지, 적당히 받을지에 관한 속성 `<video preload="metadata">`  

- `preload="none"` : 미리 다운로드 X
- `preload="auto"` : 미리 다운로드 O
- `preload="metadata"` : 미리 다운로드 적당히, 초반 썸네일과 영상 초반부 약간 로딩. 제일 추천

<br>

**poster**는 비디오 썸네일 결정 가능 `<video poster="이미지.jpg"></video>`

<br>

**loop**은 비디오 무한 재생 `<video loop></video>`

<br>

**audio**도 마찬가지, `<audio src="음악.mp3" controls></audio>` 추가로, autoplay 자동재생 기능은 애초에 안된다. 자바스크립트로 조작하면 가능

<hr>

## 궁극의 가운데 정렬

어떤 요소를 진짜 극한으로 가운데 정렬할 때 사용하는 방법

```css
/* 어떤 요소 위 빈 박스 */
.box {
	height: 500px;
	width: 100%;
	overflow: hidden;
	position: relative;
}

.container {
	position: absolute;
	width: 100%;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: 0;
}
```

<hr>

## 애니메이션 만들기 심화 (@keyframes)

[중급 모듈](notes/TIL/fragment/lang/html_css/apple-html/all-in-one-mid) 애니메이션 만들기에서 one-way 애니메이션 만드는 방법을 배웠었다. 그때는 a에서 b로만 가능했다. 아래와 같이 복잡한 애니메이션은 `@keyframes`로 구현한다. `transition`은 one-way 밖에 안되서이다.

1. a -> b -> c
2. a -> b -> a
3. a -> 1초정지 -> b

<br>

먼저, **transform**에 관하여 알아야한다.

- `transform: rotate(숫자deg)` : 각도만큼 회전

- `transform: translateX(숫자px)`: 숫자px 만큼 X축 좌표이동 (animation 줄 경우 margin-left 같은걸로 이동하는 것보다 부드럽게 이동함)

- `transform: scale(숫자)` 숫자만큼 크기 변화 줌, 2라고 하면 2배 키워줌

- `transform: skew(숫자deg)` : 각도만큼 비틀기

<br>

**왜 복잡한 애니메이션을 만드는데 transform을 쓰면 좋다는 것인가?** 간단하다. 성능이 좋아서이다. 애니메이션이 느리고 버벅이면 역효과 일으키기 때문이다. 즉, `@keyframes`안에다가 transform을 안쓰고 margin을 쓰더라도 애니메이션을 만들 수 있겠지만, margin 변경은 transform에 비하여 느리다.

<br>

**transform의 성능이 좋은 이유가 뭘까?** 웹브라우저는 HTML, CSS 코드를 2D 그래픽으로 바꿔주는 간단한 프로그램인데, 이때 브라우저가 그림 그리는 순서가 있다. 첫번째로 HTML, CSS를 쭉 읽으면서 Render Tree를 만든다. Render tree는 그림 그리기 전 CSS를 쭉 정리한 참고자료 느낌이다. 이걸보고 그림그리기 시작한다. 먼저 박스를 그리며 어디에 위치하는지 Layout을 잡고 다음으로 픽셀 하나하나에 색을 입히는 Paint를 하고 쓸데없는 Composite 단계의 css 속성들을 처리한다.

<br>

정리하자면 1단계 Rander tree 그리면서 css 속성들 정리 2단계 Layout 잡기에 margin, padding, width, height 같은 속성들을 처리하고 3단계 Paint에서 background-color 같은거 처리하고 4단계 Composite 처리 단계에서 transform, opacity 같은거 처리한다.

<br>

### 브라우저가 그림 그리는 순서 (렌더링 과정)

1. Render tree

2. Layout 잡기

3. Paint 하기

4. Composite 처리

<br>

그러면, 만약 margin을 갑자기 변경했다고 하자. 그럼 브라우저는 margin을 변경하기 위하여 2단계 Layout 잡기 단계를 해야한다. 그러면 3단계, 4단계도 다시 해야하는 것이다. 즉, 다시 **렌더링** 된다는 말이다. 그러면 transform을 갑자기 변경하면? **4단계 composite 처리만 다시 하면 되니까 부담이 훨씬 덜하게 되는 것**이다. 결과적으로 transform의 성능이 margin보다 좋은 것이다. 특히, 자바스크립트가 너무 많은 사이트는 애니메이션을 항상 transform으로 줘야한다.

<br>

추가로, **transform이 더 빠른 두 번째 이유**가 있다. 원래 웹 브라우저는 HTML, CSS 처리건 자바스크립트 실행이건 쓰레드 1개만 사용한다. 그런데, composite 처리 단계에 있는 css 속성들은 **다른 쓰레드에서 처리해준다.** 자바스크립트가 아무리 많아도 애초에 다른 쓰레드에서 처리하기 때문에 transform이 빠른 것이다.  

<br>

다음으로, **keyframes**는 몇 퍼센트 진행했는지 진행도에 따라 나눠서 코드를 작성하면 된다. 그 이후, 사용하고자 하는 클래스에 `animation-name: 작명;` , `animation-duration: 몇초;`와 같은 식으로 작성하면 된다.

```css
@keyframes 작명 {
	0% {

	}

	50% {
	
	}

	100% {
	
	}
}
```

<br>

**animation 관련 속성**

```css
.box:hover {
	animation-name: 움찔움찔;
	animation-duration: 1s;
	/* 베지어 주기 (처음에 실행할 지 나중에 실행할 지) */
	animation-timing-function: linear;
	/* 시작 전 딜레이 */
	animation-delay: 1s;
	/* 몇회 반복할것인가 */
	animation-iteration-count: 3;
	/* 애니메이션을 멈추고 싶은 경우 자바스크립트로 이거 조정 */
	animation-play-state: paused;
	/* 애니메이션 끝난 후에 원상복구 하지말고 정지 */
	animation-fill-mode: forwards; 
}
```

<br>

### 3D 애니메이션 (사진 뒤집기)
  
- 앞면, 뒷면 배치는 `position: absolute` 사용해야함

- inner 자체를 뒤집어버리는게 나음

- `transform: rotate()`를 사용하는 것이라 처음에 뒷면을 미리 뒤집어놔야함

- 뒷면의 모습이 안보이게 `transform-style: preserve-3d;`와 `front의 z-index 우선순위 높이기`, `backface-visibility: hidden;`

- 내용은 <a href='https://github.com/Shin-Jae-Yoon/TILbefore/blob/master/Language/html_css/lecture/codding_apple/%EA%B3%A0%EA%B8%89%EB%AA%A8%EB%93%88/threeD_animation.html' target='_blank'>threeD_animation.html</a> 참고

<br>

### 애니메이션 성능 잡는 방법들

1. `will-change` 사용

```css
.box {
	will-change: transform;
}
```

애니메이션을 주는 `.box`가 약간 느리게 동작할 때 `will-change: 애니메이션 줄 속성`을 써놓으면 성능개선이 가능하다. 이는 **바뀔 내용을 미리 렌더링 해주는 속성**이기 때문이다. 애니메이션이 이상하게 버벅이면 사용하고 잘 작동하면 굳이 쓸 필요는 없다. 왜냐하면 많이쓰면 오히려 더 느려질 수 있기 때문이다. 이와 관련된 내용과 will-change에 관한 추가적인 내용은 <a href='https://dev.opera.com/articles/ko/css-will-change-property/' target='_blank'>여기</a>에 있다.

<br>

2. 하드웨어 가속

애니메이션이 많아서 CPU만으로 연산이 불가능하면 GPU의 도움을 받으면 된다.

```css
.box {
	transform: translate3d(0, 0, 0);
}
```

이와 같이 쓰면 3D 이동도 가능한데, 이때 GPU를 사용해서 연산한다. 그래서 이걸 이용한 꼼수인데 `translate3d(0, 0, 0)`으로 사용하면 아무곳으로 이동하지 않는 3D 이동 명령을 주고 뒤에 필요한 transform을 적용한다면 GPU를 이용해서 box 클래스가 가진 transform 속성들을 연산하는 원리이다.

<hr>

## CSS 스킬 심화

### CSS Grid

- `display: grid`는 격자 모눈종이가 있다면 색칠해나가는 방식으로 생각

- 부모 div에 `display: grid`, `grid-template-columns: `, `grid-template-rows: ` 주면 자식들은 모눈종이가 된다.

- rows는 가로칸 갯수, 사이즈 columns는 세로칸 갯수, 사이즈

- `grid-gap: `은 격자 간격

<br>  

가로 2칸, 세로 3칸짜리 모눈종이

```html
<div class="grid-container">
	<div></div>
	<div></div>
	<div></div>
	<div></div>
	<div></div>
	<div></div>
</div>
```

```css
.grid-container {
	display: grid;
	grid-template-columns: 100px 100px 100px;
	grid-template-rows: 100px 100px;
}
```

<p align="center"><img src="https://i.imgur.com/1OMcnmg.png" height="30%" width="30%"></p>
  
<br>

grid 컨테이너에서 사용하기 좋은 단위는 **fr(fraction)** 이다. 그리드 트랙 사이즈로 사용 되는 fr 단위는 유연한 단위로 그리드 컨테이너의 여유 공간을 비율로 나눠 설정한다. 퍼센트(%) 단위와 유사해 보일 수 있으나, 퍼센트 값과 다르게 길이가 아니다. **fr은 몇 배수**로 이해한다.

<br>

```css
/* 이러면 전체 가로에 대해 1배, 1배, 1배 */
/* rows는 높이의 개념이라 height 속성이 있어야 fr 먹을거임 */
.grid-container {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	grid-template-rows: 100px 100px;
}
```

<br>

**grid 이용한 레이아웃 만들 때**

1. 내부 박스 크기 조절
2. 그냥 부모 건드리기

<br>  

**1번 방법**. 자식 div 높이와 폭을 조정하는 방법이다. 내부 박스에게 그냥 `grid-column`이나 `grid-row`를 줘본다.

```css
.grid-nav {
	grid-column: 1 / 4;
}
```
  
`grid-column`은 세로 선을 의미한다. 이때 `display: grid`의 자식들에만 사용 가능하다. 따라서 여기서는 여러 div 박스를 의미한다. `1 / 4`가 의미하는 바는 세로선 1~4 만큼 차지해달라는 뜻이다.

<br>

<p align="center"><img src="https://i.imgur.com/lEhjq3T.png" height="30%" width="40%"></p>  

```css
.grid-nav {
	grid-row: 1 / 3;
}
```

`grid-row`은 가로 선을 의미한다. 이때 `display: grid`의 자식들에만 사용 가능하다. 따라서 여기서는 여러 div 박스를 의미한다. `1 / 3`가 의미하는 바는 가로선 1~3 만큼 차지해달라는 뜻이다.

<p align="center"><img src="https://i.imgur.com/od9SQy1.png" height="30%" width="40%"></p>  

<br>

이런식으로 작성하고 최종적으로 나머지 div박스 지운다.

```html
<div class="grid-container">
	<div class="grid-nav"></div>
	<div class="grid-sidebar"></div>
	<div class="grid-content"></div>
</div>
```

```css
.grid-container {
	display: grid;
	grid-template-columns: 100px 100px 100px 100px;
	grid-template-rows: 100px 100px 100px;
}
 
.grid-container div {
	border: 1px solid black;
}

.grid-nav {
	grid-column: 1 / 5;
}

.grid-sidebar {
	grid-row: 2 / 4;
}

.grid-content {
	grid-column: 2 / 5;
	grid-row: 2 / 4;
}
```

<br>  

**2번 방법**. 자식에 이름 쓰고 부모는 색칠하기

```css
.grid-nav {
	grid-area: 헤더;
}

.grid-sidebar {
	grid-area: 사이드;
}
```

`grid-area: `는 자식에 이름짓는 속성이다. 그리고 이후에 `grid-template-areas: " " ` 형태로 배치해주면 된다. 배치할 때 기억자 같이 배치는 안되고 사각형 모양으로만 가능하다.

```css
.grid-container {
	display: grid;
	grid-template-columns: 100px 100px 100px 100px;
	grid-template-rows: 100px 100px 100px;
	grid-template-areas:

	'헤더 헤더 헤더 헤더'
	'사이드 . . .'
	'사이드 . . .';
}
```

<br>

**Grid 숙제 관련**

<br>

이미지 (img) 파일은 기본적으로 글자취급 받기 때문에 글자의 베이스라인처럼 이미지 밑에 하얀색 선이 거슬리게 나올 수 있다. 그때 반드시 `display: block;`을 줘서 없애도록 해보자!

<br>

### CSS 스킬 sticky

- 스크롤해도 상단에 고정하고자 하는 속성에 `position: sticky;`

- 주고 나서 어느 위치에 고정될 지도 정해준다. ex) top, bottom

- sticky는 마치 fixed와 유사하다.

- fixed는 viewport에다가 div 박스나 이미지를 고정시킬 때 쓰는 속성이었다. 그래서 fixed 해버리면 스크롤 해도 그 화면에 딱 고정된다.

- 즉, sticky는 조건부 fixed이다. 그냥 스크롤 하다가 sticky 부여된 녀석을 만났을 때 조건적으로 fixed 되는 것이다.

- 부모 박스 넘어서면 sticky는 해제된다.

```css
.image {
	float: right;
	width: 400px;
	position: sticky;
	top: 100px;
}
```

정리하자면, `position: sticky` 

1. 스크롤을 할 만한 부모 박스가 있어야 함
2. top 등 좌표속성과 함께 써야 제대로 보임
