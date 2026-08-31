---
title: I/O 스트림
aliases:
  - I/O 스트림
  - Java IO
  - InputStream
  - Reader
  - BufferedReader
tags:
  - language
  - java
origin:
  verified: 2026-08-31
---

바이트나 문자의 흐름으로 입력과 출력을 다루는 자바 라이브러리. 입력은 키보드, 네트워크, 파일에서 받고 출력은 화면, 네트워크, 파일로 한다. Java IO가 제공하는 것 역시 자바 객체이고, 어떤 대상에게서 읽어 어떤 대상에게 쓰는 일을 한다.

## 주인공과 장식의 조립

Java IO는 조립해서 쓰도록 만들어졌다. [[decorator|데코레이터 패턴]]이 그 구조다. 어디서 읽고 쓸지를 정하는 쪽이 주인공, 그 위에 어떻게 읽고 쓸지를 얹는 쪽이 장식이다. 주인공에게는 1바이트나 1문자 단위로 읽고 쓰는 메서드만 있고, 장식은 그것을 불러다 쓰면서 더 편한 메서드를 붙인다.

뼈대가 되는 것은 `InputStream`, `OutputStream`, `Reader`, `Writer` 네 추상 클래스다. 추상 클래스라서 `new`로 만들 수 없고, 대신 둘을 가르는 기준이 된다. 생성자가 이 넷 중 하나를 받으면 장식이고 받지 않으면 주인공이다.

```java
new BufferedReader(new InputStreamReader(System.in))
//   장식              장식                  주인공
```

키보드에서 한 줄씩 읽는 코드가 이렇게 조립된다. `System.in`은 바이트를 읽는 주인공이고 타입은 `InputStream`이다. `InputStreamReader`가 그 바이트를 문자로 바꾸고, 한 줄 읽기를 맡는 `BufferedReader`가 다시 그 위에 버퍼링을 얹는다. 읽어들일 것이 없으면 `readLine()`은 null을 돌려준다.

## 바깥에서 안쪽으로 넘어가는 호출

조립된 스트림은 바깥에서 안쪽으로 호출을 넘긴다. `readLine()`을 부르면 `BufferedReader`가 생성자로 받은 `Reader`의 `read()`를 계속 부르고, `InputStreamReader`는 다시 자기가 받은 `InputStream`의 `read()`를 계속 부른다. 맨 안쪽 `FileInputStream`이 파일에서 읽어오고, 버퍼가 한 줄만큼 차면 그때 한 줄이 나온다.

## read()가 int를 돌려주는 이유

주인공의 `read()`가 `byte`가 아니라 `int`를 돌려주는 데에는 이유가 있다. 1바이트로는 `00000000`부터 `11111111`까지가 전부라 파일의 끝을 알릴 값을 따로 뺄 수 없다. 4바이트짜리 `int`를 쓰면 -1을 EOF 표시로 남겨둘 수 있다. 1바이트씩 세 번 쓴 3바이트 파일을 네 번째로 읽으면 -1이 나오고, `while ((buf = in.read()) != -1)`은 이 값을 보고 멈춘다.

## 버퍼링이 바꾸는 속도

버퍼링이 속도를 바꾸는 폭은 크다. 버퍼 없이 쓰면 호출할 때마다 실제로 출력 장치에 나가므로 백만 번 부르면 백만 번의 [[system-call|시스템 콜]]이다. 버퍼를 쓰면 메모리에 모아뒀다가 한꺼번에 내보내니 실제 나가는 횟수가 확 준다. 100만 줄 출력에서 30초와 1초의 차이가 여기서 난다([[io-performance|입출력 성능]]).

## 이름이 드러내는 갈래

이름이 갈래를 드러낸다. `~Stream`으로 끝나는 것은 바이트 단위이고 `InputStream`, `OutputStream`의 후손이다. `~Reader`와 `~Writer`로 끝나는 것은 문자 단위이고 `Reader`, `Writer`의 후손이다. 이미지나 동영상 같은 이진 데이터에는 앞쪽을, 텍스트에는 뒤쪽을 쓴다.

한글은 한 글자가 여러 바이트라 바이트 단위로 끊어 읽으면 깨진다. `FileWriter`로 `a`, `h`, `!`를 쓴 파일은 3바이트지만 `가`, `나`, `다`를 쓴 파일은 9바이트다.

표준 입출력도 이 갈래 안에 있다. `System.in`은 `InputStream`이고 `System.out`과 `System.err`은 `PrintStream`이다.

읽고 쓰는 대상으로도 나뉜다. 파일이 대상이면 `FileInputStream`과 `FileWriter`를 쓰고, 생성자에 아무것도 받지 않는 `ByteArrayOutputStream`이나 `StringWriter`는 메모리에 쓴다.

장식 쪽에도 갈래가 있다. `DataOutputStream`과 `DataInputStream`은 `writeUTF()`, `writeInt()`, `writeDouble()`로 기본형과 문자열을 흐름에 맞춰 순서대로 쓰고, 읽을 때도 쓴 순서대로 읽어야 값이 맞는다.

## flush와 close

버퍼에 모아둔 것은 `flush()`나 `close()`를 불러야 실제로 나간다. 출력이 통째로 사라지는 사고가 대개 여기서 시작한다.

## 관련

- [[decorator|데코레이터 패턴]]
- [[serialization|직렬화]]
- [[io-performance|입출력 성능]]
- [[try-with-resources]]

## 출처

- [[brain/lectures/pl/fun-java/fun-java09|재미있는 자바 9강 - Java I/O]]
- [[brain/lectures/algo/fastcampus-algo/part1-4/p1-ch03|패스트캠퍼스 알고리즘 Ch03 - 15552번 버퍼]]
