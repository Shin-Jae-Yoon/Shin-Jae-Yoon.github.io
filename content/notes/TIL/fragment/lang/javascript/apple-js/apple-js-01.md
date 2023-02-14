---
title: "JS 입문과 웹 개발 01"
date: "2023-02-12 23:01"
enableToc: true
tags: ["코딩애플 Javascript"]
---

> 해당 게시글은 <a href='https://codingapple.com/course/javascript-jquery-ui/' target='_blank'>JavaScript 입문과 웹 UI 개발</a> 강의를 정리한 내용입니다.

## 자바스크립트 사용 목적

JavaScript는 html 파일 내부에 숨어서 **html 조작과 변경**을 담당하는 언어이다.

- 탭, 모달 등 웹페이지 UI 제작 가능
- 유저가 입력한 데이터 검사 가능
- 유저가 버튼 누르면 서버로 데이터 요청 가능 등

script 태그 안에 넣어서 작성한다. 물론 js 파일을 따로 만들어서 link 해도 된다. script 태그 안에 적은 코드는 **브라우저 새로고침시 1번 실행된다.**

<br>

**`document.getElementById('id명').무엇을 = '어떻게';`** <br>

`document.getElementById('hi').innerHTML = 'JS 고수에요';` <br>

- document : 문서, html 문서를 의미
- 마침표 : ~의
- getElementById('hi') : 아이디가 hi인 html 요소 (element)를 가져와라, 셀렉터
- innerHTML : HTML 내부에서
- 그리고 'JS 고수에요'를 대입하라.
  
```javascript
// 글자 색깔 빨간색으로 변경
document.getElementById('id').style.color = 'red';

// img의 src 변경
document.getElementById('id').src = './img/주소';
```

<br>

**`document.getElementsByClassName('class명')\[인덱스].무엇을 = '어떻게';`**<br>

`document.getElementsByClassName('hi')[0].innerHTML = 'JS 고수에요';`

- class는 여러 개 나올 수 있어서 인덱싱 해줘야함

<br><br>

## querySelector

getElementsByClassName, getElementById와 같이 querySelector는 유용하다. css의 셀렉터 기능을 사용할 수 있게 해준다.

```javascript
document.querySelector('.test').innerHTML = '안녕';
document.querySelector('#test').innerHTML = '안녕';
```

단, 클래스 사용 시 제일 최상단 요소만 선택되므로, 예를 들어, 두번째 요소를 선택하고 싶으면 querySelectorAll을 사용하고 인덱스를 줘야 한다.

```html
<ul class="list-group">
	<li class="list-group-item">An item</li>
	<li class="list-group-item">A second item</li>
	<li class="list-group-item">A third item</li>
</ul>
  
<script>
	document.querySelectorAll('list-group-item')[1].innerHTML = '두번째 아이템';
</script>
```

<br><br>

### getElementById와 비교

<a href='https://www.measurethat.net/Benchmarks/ShowResult/11974' target='_blank'>벤치마크 결과</a>를 살펴보면, getElement가 querySelector보다 약 1.2배 빠른 것을 확인 가능하다. getElement가 성능이 좋은 것은 확실하다.

<br>

하지만, id는 getElementById, class는 getElementByClassName 등 요소마다 다른 것을 사용하는 것은 querySelector를 이용하여 셀렉터를 취급하는 것보다 분명 피곤한 일이다. 또, querySelector는 `id, class, [data-*=""], input[name=""]`등 다양한 셀렉터를 사용할 수 있다.

<br>

querySelector가 성능이 약간 떨어질 수 있지만 생산성이 높다는 말이다. 실제로 조금 더 느리다고는 하지만, querySelector는 초당 약 7,000,000 건의 작업을 처리할 수 있다. querySelector도 충분히 빠르다는 말이다. 성능 때문에 querySelector를 지양하고 getElement를 사용하라는 건 조금 받아드리기 힘들다. 실제로, querySelector보다 느린 <a href='https://w3techs.com/technologies/history_overview/javascript_library/all/y' target='_blank'>jQuery의 시장 점유율</a>을 보면 2022년 8월 17일 기준 77.4%이다. 느려서 querySelector를 쓰지 말아야 한다면, jQuery도 사용하지 말아야 하는 것 아닌가?

<br>

물론, 생산성 측면에서 봤을 때 jQuery가 querySelector보다 훨씬 높으니까 조~금 어불성설일 수 있지만, 말하고자 하는 것은 속도때문에 querySelector를 포기해야 할 이유가 있는가 하는 것이다. 하나의 주장일 뿐이지만 나도 굳이 getElement를 쓰기 보다는 querySelector를 쓰는 것에 한 표 던진다.

<br><br>

## UI 만드는 법칙
1. HTML/CSS로 미리 디자인 (필요하면 미리 숨김)
	- `display: none;` 이용
2. 필요할때 보여주기 (자바스크립트 사용)
	- `display: block;` 이용

이걸로 모달창, 드롭다운 메뉴 등 구현 가능

<br><br>

## 자바스크립트 function

- 긴 코드 축약하고 싶을 때 사용
- 긴 코드 재사용이 잦을 때 사용
- 함수명 영어 작명 시

1. 소문자 시작
2. camelCase

`open_alert()` **X**, `openAlert()` **O**

```javascript
function 작명(파라미터) {
	document.getElementById('alert').style.display = 파라미터;
}
```

```html
<button class="alert-open" onclick="작명('flex')">띄우기</button>
```

- 파라미터 내부에 문자는 `' '` 안, 숫자는 바로  

<br><br>

## 자바스크립트 초창기 겪는 문제들, 오류들

<br>

1. script 태그를 body 내부에서 상단에 작성한 경우

script 태그를 body 내부에서 상단에 작성하면 잘 안되는 경우가 있다. script 태그를 조작할 html의 하단에 코드를 작성하는 이유는 렌더링 과정에서 위에서 아래로 읽어가기 때문이다. 따라서 상단에 작성하면 렌더링이 늦을 수 있다.

  <br>

2. 셀렉터 오타 주의

셀렉터 오타로 자바스크립트 실행이 안되는 경우, 크롬 개발자 도구에서 console 탭에서 에러 타입을 보자. **어쩌구 of null**은 대부분 셀렉터 오타이다. "style을 읽고 싶은데 왼쪽에 있는것이 null이다~" 라는 형태의 오류가 자주 보일 것이다.

<br>

3. 기본 문법 오타  

대문자, 소문자 확인 잘하자. `getElementById`를 `getElementByid`로 작성하지 않았는가? 뭐 잘 안보이면 항상 크롬 개발자도구 console 탭을 확인하자.

<br><br>

## 자바스크립트 이벤트리스너

html 버튼 태그에 `onclick` 붙히면 좀 더럽지 않음? 그때 `addEventListener()`을 자바스크립트에서 구현하자. 클릭, 키 입력, 스크롤, 드래그 등 웹 페이지에 조작을 가하는 행위가 **이벤트**이다. 이벤트가 일어나길 귀 기울여서 기다리는 친구가 **이벤트 리스너**이다.

- `'click'` : 마우스 클릭
- '`mouseover`' : 마우스 갖다대는거
- `'scroll'` : 마우스 스크롤
- `'keydown'` : 키 입력

<a href='https://developer.mozilla.org/en-US/docs/Web/Events' target='_blank'>그 외 수많은 이벤트 목록 참고</a>

```javascript
셀렉터로찾은요소.addEventListener('event명', function () {
// 실행할 코드
});

document.getElementById('alert2_close').addEventListener('click', function () {
	document.getElementById('alert2').style.display = 'none';
});
```

<br><br>

## 자바스크립트 콜백함수  

위에 addEventListener 사용할 때 첫번째 파라미터에는 event 요소가 들어가고, 두번째 파라미터 자리에 들어갔던 function()이 있을거임

```javascript
셀렉터로찾은요소.addEventListener('event명', function () {
// 실행할 코드
});
```

- 이 function()이 바로 콜백함수
- 자바스크립트에서 코드를 순차적으로 실행하고 싶을 때 콜백함수를 자주 사용
- 콜백함수 자리에 만든 함수 넣어도 됨. 단, `함수()`의 형태가 아닌 `함수`로 넣어야 오류 없이 작동할 것

<br><br>

## classList, toggle

navbar 같은 곳에서 주로 사용하는 버튼 눌렀을 때 등장하는 서브메뉴를 구현하려고 한다. 해당하는 UI 제작할 때는

1. 미리 htmml/css 디자인 해놓고 `display: none;`으로 숨긴다.
2. 버튼 누르면 display 속성 바꿔서 보여준다.

이 경우 `document.getElementById('id').style.display = 'none'`과 같이 작성해도 되지만, class 탈부착식으로 만드는 것이 유지보수에 편리하기 때문이다.

<br>

```css
.list-group {
	display: none;
}

.show {
	display: block;
}
```

다음과 같이 show 클래스를 list-group 클래스에 붙혔다 뗐다 하는 방식으로 만들면 될 것 같다. 이때 자바스크립트에서 html에 접근하여 클래스를 붙히는 기능을 해주는 것이 **classList**이다.

```javascript
document
	.getElementsByClassName('navbar-toggler')[0]
	.addEventListener('click', function () {
		document.getElementsByClassName('list-group')[0].classList.add('show');
});
```

만약, 버튼을 한 번 더 누르면 서브메뉴를 숨기고 싶다면 if문, 변수문법을 사용해서 가능하다. 아직 안배웠으니까 쉬운 방법인 **toggle**을 이용한다.

```javascript
document
	.getElementsByClassName('navbar-toggler')[0]
	.addEventListener('click', function () {
	document.getElementsByClassName('list-group')[0].classList.toggle('show');
});
```

이렇게 코드 작성 시, toggle 기능을 이용하여 show 클래스가 있다면 없애고 없다면 붙히는 방식이다.

<br><br>

## jQuery 라이브러리

자바스크립트 코드가 길고 더러워서 HTMl 조작을 쉽게하는 라이브러리들이 대표적으로 jQuery, React, Vue이다. React와 Vue는 자바스크립트 숙련도를 요구하기 때문에 간단하게 jQuery를 배워본다. jQuery는 라이브러리일 뿐 새로운 문법이나 이런게 아니라 함수명만 짧아진다. 예를 들어, `document.querySelect`와 같은 셀렉터는 짧게 `$` 하나로 바뀌고 `addEventListener`는 짧게 `on` 하나로 바뀐다.

<br>

jQuery CDN을 이용하여 사용한다.

```javascript
<script
src="https://code.jquery.com/jquery-3.6.0.min.js"
integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4="
crossorigin="anonymous"></script>
```

거의 모든 자바스크립트 라이브러리는 로딩 속도 때문에 `<body>` 태그 끝나기 전에 넣는 것을 권장한다. jQuery 설치한 곳 **하단**에서 jQuery 문법을 사용 가능하다. 상단에 코드 짜고 안된다고 울지말고 제발 하단에다가 짜라. 강의에서는 편의상 그냥 head 태그 끝에 jQuery를 설치했다. 로딩속도는 조금 느리겠지만, 코드 보기에 좋으니깐 편의상~

<br>

- `$` : querySelectorAll의 역할

- `.eq()` : querySelectorAll의 인덱스 역할

- `.html` : jQuery로 html의 내용 변경

- `.css('속성', '값')` : jQuery로 css의 내용 변경

- `.addClass('클래스명')` : jQuery로 클래스 부착

- `.removeClass('클래스명')` : jQuery로 클래스 제거

- `.toggleClass('클래스명')` : jQuery로 클래스 토글

```javascript
document.querySelector('.hello').innerHTML('바보');
$('.hello').html('바보');

document.querySelector('.hello').style.color = 'red';
$('.hello').css('color', 'red');
```

querySelector를 쓰면 인덱스 하나하나 지정하고 바꿔줘야해서 양이 늘어난다. (뭐, 클래스명 같게 하고 querySelectorAll 말고 querySelector 쓰면 되긴 함) 근데 jQuery를 쓰면 그냥 한꺼번에 바꿀 수 있다.

```html
<p class="hello">안녕</p>
<p class="hello">안녕</p>
<p class="hello">안녕</p>
```

```javascript
document.querySelectorAll('.hello')[0].innerHTML = '바보';
document.querySelectorAll('.hello')[1].innerHTML = '바보';
document.querySelectorAll('.hello')[2].innerHTML = '바보';
  
$('.hello').html('바보');
```

<br>

jQuery 이벤트리스너 사용법

```javascript
$("#test-btn").on("click", function () {
	어쩌구~
});
```

style의 display 속성을 none으로 바꿔도 되지만 jQuery는 편리한 것들을 제공해줌  

- `.hide()` : 사라지게

- `.fadeOut()` : 서서히 사라지게

- `.slideUp()` : 줄어들며 사라지게

- `.show()` : 보이게

- `.fadeIn()` : 서서히 보이게

- `.slideDown()` : 늘어나며 보이게

- `.fadeToggle()` : 누를때마다 fade

<br><br>

## 모달(Modal) 창 제작 Tip

Modal창은 보통 페이지 맨 앞에, 모든 html 요소 제일 위에 존재하기 때문에 **html 맨 위에 적는 것**이 관습이다.  

```css
/* 모달창 국룰 세팅 */
.modal {
	position: fixed;
	z-index: 5;
}
```

```html
<div class="black-bg">
	<div class="white-bg">
		<h4>로그인하세요</h4>
		<button class="btn btn-danger" id="close">닫기</button>
	</div>
</div>

<button id="login">로그인</button>

<script>
$('#login').on('click', function () {
	$('.black-bg').addClass('show-modal');
});

$('#close').on('click', function () {
	$('.black-bg').removeClass('show-modal');
});
</script>
```

<br><br>

## UI에 애니메이션 추가
  
위의 예제 코드에서 addClass와 removeClass 대신에 fadeIn과 fadeOut을 넣으면 애니메이션을 넣을 수 있지만, 자바스크립트에 애니메이션을 넣는 것은 성능 때문에 좋은 관습은 아니고 css에 넣는 것이 좋다.

- <a href='/notes/TIL/fragment/lang/html_css/all-in-one-mid' target='_blank'>one-way-animation</a>

- <a href='/notes/TIL/fragment/lang/html_css/all-in-one-last' target='_blank'>animation 심화</a>

추가로, 애니메이션 제작 시 `display: none;` 보다 `visibility: hidden;`이 낫다.

<br>

- 자바스크립트 (jQuery)로 애니메이션 넣은 코드

```html
<body>
	<div class="black-bg">
		<div class="white-bg">
			<h4>로그인하세요</h4>
			<button class="btn btn-danger" id="close">닫기</button>
		</div>
	</div>

	<button id="login">로그인</button>
</body>
  
<script>
	$('#login').on('click', function () {
		// fadeIn() 사용
		$('.black-bg').fadeIn();
	});
</script>
```

```css
.black-bg {
	width: 100%;
	height: 100%;
	position: fixed;
	background: rgba(0, 0, 0, 0.5);
	z-index: 5;
	padding: 30px;
	/* display: none 사용 */
	display: none;
}

.show-modal {
	/* display: block 사용 */
	display: block;
}
```

<br>

- css로 애니메이션 적용한 코드  

```html
<body>
	<div class="black-bg">
		<div class="white-bg">
			<h4>로그인하세요</h4>
			<button class="btn btn-danger" id="close">닫기</button>
		</div>
	</div>

	<button id="login">로그인</button>
</body>
  
<script>
	$('#login').on('click', function () {
		// addClass() 사용
		$('.black-bg').addClass('show-modal');
	});
</script>
```

```css
.black-bg {
	width: 100%;
	height: 100%;
	position: fixed;
	background: rgba(0, 0, 0, 0.5);
	z-index: 5;
	padding: 30px;

	/* visibility, opacity, transition 사용 */
	visibility: hidden;
	opacity: 0;
	transition: all 1s;
}

.show-modal {
	/* visibility, opacity 사용 */
	visibility: visible;
	opacity: 1;
}
```

- 자바스크립트 (jQuery)로 애니메이션 넣은 서브메뉴바  

```html
<script>
	$('.navbar-toggler').on('click', function () {
		$('.list-group').slideToggle();
	});
</script>
```

```css
.list-group {
	display: none;
}
```

- css로 애니메이션 적용한 서브메뉴바

```html
<script>
	$('.navbar-toggler').on('click', function () {
		$('.list-group').toggleClass('show-menubar');
	});
</script>
```

```css
.list-group {
	display: block;
	height: 0;
	overflow: hidden;
	transition: all 1s;
}

.show-menubar {
	height: 210px;
}
```

<br><br>

## form태그 if/else

- form 태그 다룰 때, 전송 버튼은 반드시 `type="submit"` 해줄 것 명심하자. 일반 버튼은 `type="button"` 이렇게 해야 오류가 없다.
- form 태그는 서버로 유저정보 전송하려고 쓰는 것이다.
- `<form action="url~~~"></form>` 서버 경로 제대로 설정하자.

<br>

### 조건문 (if-else)

```javascript
if (조건) {
	조건이 참일 때 실행할 코드
} else {
	조건이 거짓일 때 실행할 코드
}
```

- 조건 사용 시 비교연산자 `==, ===, !=, !==, <, <=, >, >=`
- 조건 사용 시 boolean `true(1), false(0)` 이용
- 참고로 `elif`는 파이썬임 `else if`가 자바스크립트
- `else if`는 위의 조건이 참이면 실행 안되는 것임

```javascript
if (1 == 3) {
	console.log('맞아요1');
} else if (1 == 1) {
	console.log('맞아요2');
}

// 출력 : 맞아요2
if (3 == 3) {
	console.log('맞아요1');
} else if (1 == 1) {
	console.log('맞아요2');
}

// 출력 : 맞아요1
// 위에가 참이니까 맞아요2는 출력안되고 그냥 끝남

if (1 == 1) {
	console.log('맞아요1');
}

if (2 == 2) {
	console.log('맞아요2');
}

// 출력 : 맞아요1
// 출력 : 맞아요2
```

<br>

### 비교 연산자

그냥 비교할 때는 `==`, `!=` 타입까지 맞춰서 비교할 때는 `===`, `!==`

- 동등 연산자(`==`) : 두 피연산자의 자료형을 일치시킨 후 비교 수행
- 부등 연산자(`!=`) : 두 피연산자의 자료형을 일치시킨 후 비교 수행
- 일치 연산자(`===`) : 자료형 변환 없이 비교 수행
- 불일치 연산자(`!==`) : 자료형 변환 없이 비교 수행

<br>

### 논리 연산자

- `&&` : AND
- `||` : OR
- `!` : NOT

<br>

## truthy, falsy 자료

| truthy 자료 | falsy 자료 |
| :---------: | :--------: |
| 0 제외 숫자 | 0 |
| '문자' | '' |
| [] | null |
| {} | undefined |
| | NaN |  

<br>

## undefined, null

undefined와 null은 '값이 없다' 라는 점에서 유사하지만 엄밀히 말하면 다른 개념이다. typeof 연산자로 타입을 확인해보면 undefined는 undefined 타입이, null은 object 타입이라고 표시된다.

- undefiend : 변수는 존재하나, 어떠한 값으로도 할당되지 않아 자료형이 정해지지(undefined) 않은 상태

- null : 변수는 존재하나, null 로 (값이) 할당된 상태. 즉 null은 자료형이 정해진(defined) 상태

```javascript
var var1;
//undefined (어떤 값도 할당되지 않아서 자료형을 알 수 없음)

var var2 = null;
//null (null로 (값이) 할당되어서 자료형을 알 수 있음 - null의 자료형은 object)
``` 

근데, `undefined == null`을 비교하면 true값이 나온다. 이는 위에서 설명한 비교연산자 때문이다. 엄격한 비교인지 엄격하지 않은 비교인지 때문이다.

```javascript
undefined == null; //true , 형변환 까지 해줘서 true가 나옴
undefined === null; //false , 형변환을 하지 않아서 false가 나옴
```

<br>

### if문 이용한 form 태그

  

```javascript
// 물론 둘다 else if 말고 그냥 if 문들로 해도 됨
// 근데 else if가 나은듯

document
	.getElementsByTagName('form')[0]
	.addEventListener('submit', function (e) {
		if (document.getElementById('email').value == '') {
			e.preventDefault();
			alert('아이디를 입력 해주세요 !');
		} else if (document.getElementById('pw').value == '') {
			e.preventDefault();
			alert('비밀번호를 입력 해주세요 !');
		} else if (document.getElementById('pw').value.length < 6) {
			e.preventDefault();
			alert('비밀번호를 6자리 이상 입력 해주세요 !');
		} else {
			alert('정상적으로 제출되었습니다.');
		}
});

// jQuery 사용
$('form').on('submit', function (e) {
	if (document.getElementById('email').value == '') {
		e.preventDefault();
		alert('아이디를 입력 해주세요 !');
	} else if (document.getElementById('pw').value == '') {
		e.preventDefault();
		alert('비밀번호를 입력 해주세요 !');
	} else if (document.getElementById('pw').value.length < 6) {
		e.preventDefault();
		alert('비밀번호를 6자리 이상 입력 해주세요 !');
	} else {
		alert('정상적으로 제출되었습니다.');
	}
});
```

- getElementsByTagName 할 때도 인덱스 지정해줘야함

- 제출버튼에 id 지정해줘도 되지만, form 태그의 이벤트를 submit으로 해줘도 됨

- input의 값은 value로 가져옴

- 전송을 원하지 않으면 function의 괄호 안에 `e`를 넣고 `e.preventDefault();` 해주면 됨

<br>

## input 이벤트  

```javascript
document.getElementById('email').addEventListener('input', function () {});

document.getElementById('email').addEventListener('change', function () {});
```

- 불러온 id 태그가 input 태그일 때 addEventListener 이벤트에 input / change 준 경우

- input 태그에 유저가 입력한 값이 변할 때 실행된다는 의미

- 이벤트 input 일 때 : input 태그에 입력한 값이 바뀔 때마다 실행

- 이벤트 change 일 때 : input 태그에 입력한 값이 바뀌고 **포커스를 잃을 때** 실행

- 응용하면 비밀번호 6자리 이상 입력해야할 때 그것보다 작게 입력하고 있으면 계속 ui 띄우는 경우가 있겠네

<br>

## 변수 문법
  

```javascript
var 변수명 = 넣을자료;
```

변수를 사용하는 이유

- 길고 복잡한 자료들 저장 가능
- 특정 값을 기억하게 하려고 (count 같은거)
- **좋은 관습 : 자주쓰는 셀렉터 변수에 넣어쓰기**

<br>

변수는 **변수의 선언, 할당, 범위** 세 가지만 잘 기억하면 된다.  

- 변수의 선언 : 변수 만들겠습니다.
- 변수의 할당 : 변수에 자료 넣기
- 변수의 범위
- 함수 안에서 변수 만들면 사용가능 범위는 함수 내부 <br> 함수 안에서 만든 변수를 함수 밖에서 사용하려고 하면 사용 불가능
  
```javascript
var 이름; // 변수의 선언
이름 = 'kim'; // 변수의 할당

var 이름 = 'kim'; // 변수의 선언과 할당
이름 = 'park'; // 변수의 재할당
```

```javascript
function 함수() {
	var 이름 = 'kim';
	console.log(이름);
}
// 출력 : kim

function 함수() {
	var 이름 = 'kim';
}

console.log(이름);
// 출력 : Uncaught ReferenceError: 이름 is not defined
```

<br>

## var let const 차이

| var | let | const |
| :--------------------------------: | :-------------------------: | :-------------------------: |
| 재선언O | 재선언X | 재선언X |
| 재할당O | 재할당O | 재할당X |
| 범위 function <br> Function-scoped | 범위{ } <br> {Block-scoped} | 범위{ } <br> {Block-scoped} |

- let 변수 : 재선언 불가

- 코드가 길어지면 사용한 변수를 까먹고 또 만들 수 있다. <br> let은 이것을 방지 가능

```javascript
let 이름 = 'kim';
let 이름 = 'park';

// 출력 : Uncaught SyntaxError: Identifier '이름' has already been declared
```

- const 변수 : 재선언 불가, 재할당 불가

- 변하는 안되는 값을 보관할 때 좋다. 상수

```javascript
const 이름 = 'kim';
이름 = 'park';

// 출력 : Uncaught TypeError: Assignment to constant variable.
```

- 추가로, let과 const는 function뿐만 아니라 중괄호 `{}` 내부는 모두 범위로 취급한다.

```javascript
if () {
	let 이름;
}

// 이것도 밖에서 이름 사용 못함
```

<br>

## 문자 중간에 변수 쉽게 넣기

- 백틱 기호를 사용한다.

- 변수는 `${변수}`와 같이 담는다.

```javascript
let a = '안녕';
console.log('문자' + a + '문자');
console.log(`문자${a}문자`);

// 문자안녕문자
```