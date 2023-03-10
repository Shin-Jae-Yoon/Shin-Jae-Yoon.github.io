---
title: "01 - 파이썬 입문"
date: "2023-02-14 01:36"
enableToc: true
tags: ["🖥️ 잔재미코딩 파이썬"]
---

> 해당 게시글은 <a href='https://www.inflearn.com/course/python-crawling-basic' target='_blank'>파이썬 입문과 크롤링기초 부트캠프</a> 강의를 정리한 내용입니다.

<hr>

## 01. Python 학습의 이유

<br>  

Java와 Javascript를 학습하며 프론트엔드와 백엔드 모두를 경험해보고자 언어를 학습 중인 상태였고, 코딩 테스트와 프로젝트를 대비하려고 했으나, 크롤링에 친숙하고 라이브러리의 강점을 가지며 쉬운 언어인 Python도 경험해보고 싶다는 생각을 항상 가지고만 있었다. 추가로, Web project를 진행하기 위해 백엔드 framework 학습의 필요성을 느끼고 있었다. <br>

현재의 나는 개인 토이 프로젝트나 소규모 프로젝트를 희망하는 상태이다. 대표적인 후보군으로는 spring, django, flask 등이 있었는데, Java 기반 framework인 spring은 대규모 프로젝트를 하지 않는 나의 입장에서는 맞지 않다고 느꼈다. 하지만, Python 기반 framework는 django와 flask라는 선택지가 있었다. django는 extension이 기본적으로 포함되어 서비스 사용 용도에 적합하고, flask는 extension이 기본적으로 포함되어 있지 않아서, 학습에 용이하다는 검색 결과를 얻었다. <br>

**따라서, flask를 학습하기로 마음 먹었고 그것을 위하여 python에 대한 학습이 필요하다고 느꼈다.**

나아가, python을 이용하여 database 학습을 하려는 계획도 세웠다. 아직 Java를 제대로 사용하지 못하는 것도 있어서, 이참에 주력 언어를 python으로 정하겠다는 결심이 섰기 때문에 기초를 탄탄히 하고자 언어의 기본 문법을 학습하고자 한다.

<hr>

## 02. Python 설치

<br>  

Python은 고급 언어이기 때문에, 컴퓨터가 이해하도록 하기 위한 컴파일러가 필요하다. 따라서, 기본 Python을 https://www.python.org/downloads/ 에서 설치해주도록 한다. 설치하는 과정에서 PATH에 체크하여 환경 변수를 미리 추가한다. 

Python을 사용하기 위한 여러 가지 옵션이 있다.

- anaconda의 주요 툴인 jupyter notebook 활용하기

- pycharm, visual studio code 같은 텍스트 에디터 활용하기

<br>

### mac 초기 설정

1. <a href='https://jjam89.tistory.com/228' target='_blank'>mac의 기본 python을 건드리지 않고 pyen를 사용하는 이유와 설치 방법</a>
2. <a href='https://seorenn.github.io/note/pyenv-virtualenv.html#d3f541ab' target='_blank'>virtualpyenv 사용 방법</a>
3. <a href='https://carmack-kim.tistory.com/90' target='_blank'>virtualpyenv activate 오류 발생 시</a>
4. <a href='https://codenoyes.tistory.com/63' target='_blank'>mac에 jupyter notebook 설치</a>

<hr>

## 03. Python IDE

<br>

### **anaconda - jupyter**

anaconda는 파이썬 컴파일러, 주요 라이브러리, 주요 툴을 모아놓은 패키지이다. anaconda의 주요 툴 중 하나인 jupyter notebook을 활용하여 python을 사용할 수 있다.

![](brain/image/funny01-1.png)

jupyter notebook의 장점은 코드를 작성함과 동시에 컴파일하여 가시적으로 결과를 확인 가능하다는 점이다. 그리고 마크다운을 이용하여 필요한 메모를 즉각적으로 작성할 수 있어서 학습에 용이하다고 생각했다. 따라서, 학습하는 과정에서 jupyter notebook을 사용하기로 했다.

설치 방법은 https://www.anaconda.com/products/individual 페이지에서 다운로드하여 설치한다. 이때, python 최신 버전을 다운로드 한다. 왜냐하면, 구버전인 python 2와 신버전인 python 3는 약간의 문법적 차이가 있을 수 있다. python 2 에서는 `print len(something)`이 올바른 문법이라면 python 3 에서는 `print (len(something))`이 올바른 문법이기 때문에 최신 버전을 다운 받아서 사용하도록 하자.

<br>

### **pycharm, vs code**

pycharm 혹은 visual studio code의 extension에서 python을 설치하여 텍스트 에디터를 사용하는 방법도 있다. 언어의 학습을 위해서 강의를 들을 때는 jupyter notebook을 사용하기로 했지만, 추후에 프로젝트나 여러 작업을 진행하기 위해서는 텍스트 에디터를 이용한 python의 사용법 또한 필요하다고 생각했다.  

html, css, javascript를 사용하면서 익숙했던 visual studio code를 사용하기로 결정했다. 위의 python 설치 과정에서 PATH 추가만 제대로 했다면, visual studio code의 extension에서 python만 추가로 설치해주면 된다.

파일의 확장명은 .py이고 윈도우에서는 터미널 창에 `python 파일이름.py` 리눅스나 mac의 경우에는 터미널 창에 `python3 파일이름.py`라고 버전을 명시해줘야 한다. 나는 wsl2를 이용하여 윈도우 환경에서 리눅스를 사용할 때도 있기 때문에 아래에서 윈도우와 wsl2의 사용 예시를 보여줬다.

![](brain/image/funny01-2.png)

![](brain/image/funny01-3.png)

<hr>

## 04. jupyter사용 TIP

- jupyter notebook file을 python3 형태로 만든다.

- 코드를 작성하고 실행할 때는 기본적으로 `shift + enter` 키를 활용한다.

- 해당하는 셀을 코드 블록으로 사용하려면 `Y` 마크다운 블록으로 사용하려면 `M`을 누른다.

- 해당하는 셀의 위에 새로운 블록 생성은 `a` 아래에 새로운 블록 생성은 `b`를 누른다.

- 해당하는 셀을 삭제하려면 `d + d`, 복사는 `C`, 붙혀넣기는 `V`를 누른다.

- 기본적인 단축키 이외에도 필요한 단축키가 있다면 그때 그때 학습하도록 한다.