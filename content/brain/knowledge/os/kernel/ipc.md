---
title: IPC
aliases:
  - Inter-Process Communication
  - 프로세스 간 통신
  - 병행과 병렬
tags:
  - os
origin:
  verified: 2026-08-30
  scouted: 2026-08-30
---

프로세스끼리 통신하는 방법. [[process-basics|프로세스]]는 저마다 독립된 메모리 공간에서 돌기 때문에 A가 B의 메모리를 직접 들여다볼 수 없고, 데이터를 주고받으려면 별도의 수단을 거쳐야 한다.

## 파이프와 시스템 콜

파이프(pipe)와 메일슬롯(mailslot)이 그런 수단이다.

운영체제는 이것들을 통신 계열 [[system-call|시스템 콜]]로 열어둔다. `pipe`, `shm_open`, `mmap`이 그 분류에 속하고, 통신 연결을 만들고 없애는 일, 메시지를 보내고 받는 일, 상태 정보를 전달하는 일, 원격 장치를 붙이고 떼는 일이 함께 들어간다.

IPC를 거치는 비용과 무거운 [[context-switching|컨텍스트 스위칭]]을 함께 피하려고 나온 것이 [[thread|스레드]]다. 프로세스를 여러 개 만들 때 치르는 대가는 [[process-basics|프로세스]] 쪽에 정리해두었다.

## 병행과 병렬

병행과 병렬은 섞여 쓰이지만 다른 말이다. 병행(Concurrent)은 여러 작업이 번갈아 진행되어 동시처럼 보이는 것이고, 멀티스레드 프로그래밍이 여기 해당한다. 병렬(Parallel)은 여러 작업이 실제로 같은 순간에 실행되는 것이고, 멀티코어 프로그래밍이 여기 해당한다.

싱글 코어에서도 병행은 되지만 병렬은 되지 않는다. 자바에서 다루는 동시성 프로그래밍은 대개 병행 쪽이다.

## 참고

원본 둘이 용어를 다르게 썼다. `fun-java10`은 병행을 번갈아 진행하는 것으로, 병렬을 실제로 동시에 실행하는 것으로 갈라 적었는데, `easy-os/lecture01`은 멀티 코어에서 스레드가 병렬로 도는 쪽을 "진정한 의미의 동시성"이라고 불렀다. 이 저장소는 앞쪽으로 통일했다. 동시성을 구조로, 병렬성을 실행으로 갈라 쓰는 용법이 더 널리 통한다. [Concurrency is not parallelism](https://go.dev/blog/waza-talk)

## 관련

- [[process-basics|프로세스]]
- [[thread|스레드]]
- [[context-switching|컨텍스트 스위칭]]
- [[system-call|시스템 콜]]
- [[brain/knowledge/network/protocol/socket|소켓]]

## 출처

- [[brain/lectures/pl/fun-java/fun-java10|재미있는 자바 10강 - IPC, 병행 vs 병렬]]
- [[brain/notes/CS/OS/SystemCall|CS 노트 - 시스템 콜]]
