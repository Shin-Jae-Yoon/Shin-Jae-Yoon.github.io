---
title: "Java 환경설정"
date: "2023-02-12 16:27"
enableToc: true
tags: ["Java"]
weight: 3
---

<hr>

## Java 코딩 컨벤션

- 클래스 이름 : 대문자로 시작

- 패키지 이름 : 모두 소문자로

- public 클래스는 단 하나, public 클래스 이름과 자바 파일이름은 동일하게

- 변수, 메서드 이름 : 소문자로 시작, 이름이 길어지는 경우 camel notation이용하여 중간중간 대문자로 구분하기

<hr>

## Java settings

### Windows

<a href='https://suzxc2468.tistory.com/141' target='_blank'>환경 변수 설정법 링크</a>

1. https://www.oracle.com/java/technologies/downloads/ 에서 Java 8에 Java SE Development Kit 8u341를 windows x64 다운로드 받기

2. 검색창 - 내 pc(클릭 X, 마우스 우클릭) 속성 - 고급 시스템 설정 - 환경 변수

	- 아래 시스템 변수 - 새로 만들기
		- 변수 이름 : JAVA_HOME
		- 변수 값 : C:\Program Files\Java\jdk1.8.0_341 (자바 JDK 설치 경로)
	- 아래 시스템 변수 - Path - 편집 - 새로 만들기
		- %JAVA_HOME%\bin
	- 아래 시스템 변수 - 새로 만들기
		- 변수 이름 : CLASSPATH
		- 변수 값 : %JAVA_HOME%\lib

3. 환경변수 설정 이후 확인하려면 cmd에서 `javac -version` 입력

4. 자바11 쓸거면 JAVA_HOME의 JDK 설치 경로만 11로 바꿔주면 됨

<br>

### WSL2

1. `sudo vi /etc/apt/sources.list`에서 카카오 미러서버 되어있는지 부터 확인
	- 안되어 있으면 `%s /기존주소/mirror.kakao.com` 으로 변경하고 저장

2. `sudo apt-get update`로 우분투 패치

3. `sudo apt install openjdk-11-jdk`로 자바11 JDK 설치

<br>

- 환경설정

1. `which java`로 java 위치 파악, 결과 `/usr/bin/java`로 뜰 것

2. `readlink -f /usr/bin/java` 하면 결과 `/usr/lib/jvm/java-8-openjdk-amd64/bin/java`로 뜰 것, 여기서 `/usr/lib/jvm/java-8-openjdk-amd64`를 기억

3. `sudo vi /etc/environment`에서 기존에 있던거 지우고 `JAVA_HOME=/usr/lib/jvm/java-11-openjdk-arm64` 입력 후 저장

4. `source /etc/environment`로 환경설정 파일 적용

5. `echo $JAVA_HOME`로 JAVA 환경변수 작동 확인. 경로 나오면 제대로 된거

<br>

- 버전관리

1. <a href='https://codechacha.com/ko/ubuntu-install-open-jdk11/' target='_blank'>블로그 링크</a>를 따라하려고 했는데.. 나랑은 뭔가 달라서 일단

2. `sudo apt install openjdk-8-jdk`로 자바8 jdk 설치

3. `sudo update-alternatives --config java` 이거 해보면 알아서 적용 되어있음. 아마 환경설정할때 경로 다 날리고 JAVA_HOME만 냅둬서 그런듯

4. 저기서 원하는 모드 선택하면 버전 왔다갔다 끝

<br>

### Mac (M1)

homebrew를 이용한 jdk 설치는 인텔 맥을 기반으로 되어있어서, arm 칩셋인 M1은 다른 방식으로 설치하여야 한다.

<br>

<a href='https://www.azul.com/downloads/?version=java-17-lts&os=macos&architecture=arm-64-bit&package=jdk' target='_blank'>zulu</a>에서 제공하는 java 버전, ARM-64bit, JDK를 선택하고 설치가 편한 dmg파일로 설치한다.

- `/usr/libexec/java_home -V` : 설치된 자바 버전 목록

- `java -version` : 현재 설정된 자바 버전 (상세한 버전)

- `javac -version` : 현재 설정된 자바 버전 (간단히)

<br>

이후 환경변수 설정을 위하여 zsh 설정 파일을 연다. (bash 쓰면 bash로)

- `code ~/.zshrc`

- 혹시 zsh 커맨드가 안먹으면 vscode 명령 팔레트에서 **셀 명령 : PATH에 코드 명령 설치**를 이용하여 설치하자.


```bash
# JAVA settings
export JAVA_HOME=$(/usr/libexec/java_home -v 1.8)
alias setJava8='export JAVA_HOME=$(/usr/libexec/java_home -v 1.8)'
alias setJava11='export JAVA_HOME=$(/usr/libexec/java_home -v 11)'
alias setJava17='export JAVA_HOME=$(/usr/libexec/java_home -v 17)'
export PATH=${PATH}:$JAVA_HOME/bin:
```

이와 같은 코드를 추가한다. alias를 추가해준 이유는 버전 왔다갔다하면서 사용하려고 추가한 것이다.

<hr>

## IntelliJ 단축키

- `psvm` : public static void main

- `sout` : System.out.println()

- `soutv` : System.out.println( 여기다가 연관된 변수 같이 넣어줌 )

- `cmd + D` : 드래그한거 밑에 복제해줌

- `shift + F6` : 복제한거 변수 이름 똑같은거 편하게 바꿀 수 있음

- `option + cmd + V` : 지금 쓰고 있던거 앞에 변수 추가해줌

![](brain/image/화면-기록-2023-03-25-오후-2.47.26.gif)

- `cmd + P` : 메서드 파라미터에 기대되는 값 보기

- `cmd + E` : 최근 파일 목록 열기

- `shift + shift` : 파일 검색

- `control + shift + R` : 내가 찍은걸로 바꿔서 실행

- `control + R` : 지금 찍혀있는걸로 실행

- `control + enter` : Generator 열기

- `/** + enter` : 이쁜 주석문

- `cmd + X` : 한 줄 삭제

- `control + T` : 리팩토링과 관련된 단축키. 예를 들어 method 뽑아낼 때 (검색도 가능)

- `cmd + shift + T` : 테스트케이스 파일 편하게 만들어주기

- `cmd + option + L` : 코드 정렬

- `command + 1` : 왼쪽 메뉴 창으로 이동, esc키 누르면 다시 코드

- `command + N` : 새로운 파일 생성 (패키지든 클래스든)
	- 이걸 코드창에서 쓰면 Generator 열기

- 번역 플러그인 (Translation) 설치
	- `ctrl + cmd + i` : 번역기 팝업 띄우기
	- `ctrl + cmd + u` : 영어 → 한글 번역
	- `ctrl + cmd + o` : 한글 → 영어 번역 (변수명 지을 때 편함)

- `command + B` : 정의된 곳으로 이동

<hr>

## IntelliJ settings

1. 인텔리제이 pro버전 다운로드 체크는 전부 다 체크하고 맨 밑에 association만 java파일 연관 체크

2. 깃허브 권한 설정으로 아이디 연동

<br>

### IntelliJ plugins

- Material Theme UI
	- 인텔리제이 테마 설정 플러그인
	- Monokai Pro 이용 중, 우측 하단에서 설정 가능

![](brain/image/java-settings-1.png)

<br>

- Atom Material Icons
	- 인텔리제이 폴더 아이콘 플러그인

![](brain/image/java-settings-2.png)

<br>

- CodeGlance Pro
	- 코드 우측에 vscode 처럼 작은 화면 뜨는거
	- 클릭하면 해당 위치로 바로 이동 가능

![](brain/image/java-settings-3.png)

<br>

- Commit Message Template
	- commit 메시지 템플릿 생성
	- Settings - Tools - Commit Message Template
	- 좌측 메뉴바 - commit - 연필모양

![](brain/image/java-settings-4.png)

![](brain/image/java-settings-5.png)

![](brain/image/java-settings-6.png)

<br>

- Embedded Web Browser
	- 프로그래머스 같은 문제 풀 때 인터넷 창 띄워놓기
	- 우측 메뉴바에 Embedded Web Browser 클릭
	- 링크는 찾아서 붙여넣기

![](brain/image/java-settings-7.png)

<br>

- Key Promoter X
	- 마우스로 수행한 동작 단축키 알려줌

![](brain/image/java-settings-8.png)

![](brain/image/java-settings-9.png)

<br>

- Presentation Assistant
	- 키보드로 수행한 동작 단축키 보여줌

![](brain/image/java-settings-10.png)

![](brain/image/java-settings-11.png)

<br>

- Nyan Progress bar
	- 진행바 귀여운 고양이 표시

![](brain/image/java-settings-12.png)

<br>

- Rainbow Brackets
	- 중괄호 구분하기 쉽게 색깔 표시

![](brain/image/java-settings-13.png)

<br>

- Discord Integration
	- 디스코드 게임 활동 중에 인텔리제이 뜨도록

![](brain/image/java-settings-14.png)

<br>

## 참고

- https://suzxc2468.tistory.com/141
- https://codechacha.com/ko/ubuntu-install-open-jdk11/
- https://www.azul.com/downloads/?version=java-17-lts&os=macos&architecture=arm-64-bit&package=jdk