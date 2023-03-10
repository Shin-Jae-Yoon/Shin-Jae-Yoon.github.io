---
title: "시스템콜"
date: "2023-02-27 00:06"
enableToc: true
tags: ["운영체제"]
---

<br>

==**시스템 콜(System Call)이란, 응용 프로그램과 하드웨어 사이에서 운영체제(OS)에 동작을 요청하는 함수 또는 동작들에 대한 인터페이스이다. 하드웨어를 간접제어하고 OS가 관리하는 정보에 접근하도록 요청하는 규약을 정의한 것을 의미한다.**==

OS는 다양한 서비스 들을 수행하기 위해 하드웨어를 **직접적**으로 관리한다. 반면, 응용 프로그램은 OS가 제공하는 인터페이스를 통해서만 자원을 사용할 수 있다. **OS가 제공하는 이러한 인터페이스를 '시스템 콜 (system call)' 이라고 한다.**

운영체제 커널이 제공하는 함수를 호출하여 운영체제 서비스를 이용하는데, 이러한 운영체제 서비스는 일반적으로 하드웨어와 직접적인 상호작용을 필요로 하는 기능들이며, 프로그램에서 직접 접근할 수 없는 보호된 자원에 대한 접근을 허용한다.

- 사용자가 하드웨어를 직접 제어할 수 없음
- 사용자와 하드웨어의 중간의 운영체제(OS)가 하드웨어 제어를 대신 해줌
- 시스템 콜(System Call)은 운영체제의 기능을 호출하는 인터페이스로서, API의 일종이다. ==다만, 시스템 콜은 **운영체제의 기능을 호출하는 데에만 사용**되며, 운영체제의 다른 기능들을 호출하는 API와는 구분된다.==

<br>

![](brain/image/SystemCall-1.png)

위 그림처럼 운영체제(OS)는 메모리에 프로그램 적재, I/O처리, 파일시스템 처리 등 여러 서비스들을 제공하는데 **사용자 프로세스는 이에 직접적인 접근이 아닌 시스템 콜 호출을 통해 서비스를 제공받을 수 있다.** 이때, 직접적으로 System Call을 사용하기보다는 [API](brain/Common/API) (라이브러리 함수)를 통해 사용하게 된다.

![](brain/image/SystemCall-2.png)

<br>

시스템 콜은 크게 6가지로 분류할 수 있다.

1. <details>
	<summary><strong>프로세스 제어 (Process Control)</strong></summary>
	
	- 끝내기(exit), 중지(abort)
	- 적재(load), 실행(excute)
	- 프로세스 생성(CreateProcess) - fork()
	- 프로세스 속성 획득과 속성 설정
	- 시간 대기 (wait time)
	- 사건 대기 (wait event)
	- 사건을 알림 (signal event)
	- 메모리 할당 및 해제 (malloc, free)
	
	</details>

2. <details>
	<summary><strong>파일 조작 (File Manipulation)</strong></summary>
	
	- 파일 생성(create), 삭제(delete)
	- 열기 / 닫기 / 읽기 / 쓰기 (open, close, read, write)
	- 위치 변경 (reposition)
	- 파일 속성 획득 및 설정 (get file attribute, set file attribute)
	
	</details>

3. <details>
	<summary><strong>장치 관리 (Device Manipulation)</strong></summary>
	
	- 하드웨어의 제어와 상태 정보를 얻음 (ioctl)
	- 장치를 요구(request device), 장치를 방출 (release device)
	- 읽기 / 쓰기 / 위치변경 (read, write, reposition)
	- 장치 속성 획득 및 설정
	- 장치의 논리적 부착 및 분리 (attach, detach)
	
	</details>

4. <details>
	<summary><strong>정보 유지 (Information Maintenance)</strong></summary>
	
	- getpid(), alarm(), sleep()
	- 시간과 날짜의 설정과 획득 (time)
	- 시스템 데이터의 설정과 획득 (date)
	- 프로세스 파일, 장치 속성의 획득 및 설정
	
	</details>

5. <details>
	<summary><strong>통신 (Communication)</strong></summary>
	
	- pipe(), shm_open(), mmap()
	- 통신 연결의 생성, 제거
	- 메시지의 송신, 수신
	- 상태 정보 전달
	- 원격 장치의 부착 및 분리
	
	</details>

6. <details>
	<summary><strong>보호 (Protection)</strong></summary>
	
	- chmod()
	- umask()
	- chown()
	
	</details>

<br>

위 사진을 보면 Windows와 Unix에서 인터페이스를 구현한 함수의 모양이 다른 것을 알 수 있다. 당연하게도 **인터페이스는 사양만 정의해놓은 것이라 동일한 인터페이스에 대한 구현은 OS마다 차이가 있을 수 있는 것**이다.

시스템 콜을