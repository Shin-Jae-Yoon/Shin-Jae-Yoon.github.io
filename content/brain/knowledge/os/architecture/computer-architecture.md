---
title: 컴퓨터 구조
aliases:
  - 컴퓨터 구조
  - 마이크로아키텍처
  - CISC
  - RISC
tags:
  - os
origin:
  verified: 2026-08-30
---

하드웨어를 구성하는 각 장치의 특성과 동작 원리를 다루는 학문. 정의를 쪼개면 명령어 집합 구조([[brain/knowledge/os/architecture/isa|ISA]])와 machine organization 둘로 나뉜다. ISA는 기계가 쓰는 언어이고 하드웨어를 제어하기 위한 아주 저수준의 언어다. machine organization은 그 언어를 실제로 수행하는 하드웨어의 구성이다. 실제 하드웨어와 그것을 제어하는 언어를 함께 다루는 분야인 셈이다.

형태는 계속 바뀌어 왔다. 예전에는 규모가 큰 컴퓨터의 보드 형태였다면 지금은 One-Chip 형태로 옮겨가고 있다.

## 마이크로아키텍처

마이크로아키텍처는 CPU나 GPU 같은 하드웨어가 작동하는 방식을 서술한 설계도다. CPU architecture라고도 부르지만 실제로는 마이크로아키텍처라는 말이 더 자주 쓰인다.

같은 [[brain/knowledge/os/architecture/isa|ISA]]를 서로 다른 마이크로아키텍처로 구현하기도 한다. 인텔과 AMD가 똑같이 x86 ISA를 쓰면서도 성능이 갈리는 것은 그 구현 방법이 다르기 때문이다.

대표적인 두 방식으로 CISC(Complex Instruction Set Computer)와 RISC(Reduced Instruction Set Computer)가 있다.

## 관련

- [[brain/knowledge/os/architecture/isa|ISA]]
- [[kernel-mode|커널]]
- [[compiler-structure|컴파일러의 구조]]

## 출처

- [[brain/notes/CS/CA/ComputerArchitecture|CS 노트 - 컴퓨터 구조]]
- [[brain/notes/CS/CA/CpuArchitecture|CS 노트 - CPU 아키텍처]]
- [[brain/notes/CS/CA/ISA|CS 노트 - ISA]]
