---
title: "ISA"
date: "2023-02-24 18:07"
enableToc: true
tags: ["컴퓨터구조"]
---

==**ISA(Instruction Set Architecture, 명령어 집합 구조)는 마이크로프로세서가 인식해서 기능을 이해하고 실행할 수 있는 기계어 명령어를 의미한다.**== 즉, 이는 하드웨어와 소프트웨어 사이의 **Interface를 정의**하는 것이다.
- ISA는 소프트웨어 관점에서 굉장히 중요한 하드웨어 추상화를 진행한다.
- ISA는 하드웨어를 프로그래밍한다. 가장 밑단에 있는 언어이다.
- 장점 : HW가 바뀌더라도 architecture가 동일하면, ISA는 변하지 않는다.
	- ( ISA가 변하지 않는다 = SW가 변할 필요 없다. )
- 단점 : ISA는 SW/HW 양쪽 모두 영향을 받아서 쉽게 바꾸지 못한다.
- 예시 : IA-32, PowerPC, MIPS, SPARC, ARM 등
<br>

![](brain/image/ISA-1.png)

<br>

ISA를 설계하는 것은 아주 중요하다. 왜냐하면, **ISA에 따라 마이크로프로세서의 성능이 정해지기 때문이다.** 하드웨어가 얼마나 잘 설계되었는지 보다는 ISA가 얼마나 잘 설계되었는지가 훨씬 중요하다. 하드웨어는 마음대로 바꿀 수 있지만, ISA는 한번 정해지면 쉽게 바꾸지 못하기 때문이다. 이것이 바로 ISA를 잘 설계해야하는 궁극적인 목표이다.

ISA는 굉장히 다양한데, 예를 들어, Intel, AMD 프로세서를 사용하는 아키텍처는 **x86 ISA를 가지고 있다**라고 한다. 스마트폰에 쓰이는 것으로 **ARM ISA**가 있다. x86과 ARM은 서로 다른 ISA이다. 그래서 데스크탑의 application이 있고 모바일 전용 application이 있는데 호환이 안되는 것은 **애초에 Interface가 다르니 말이 통하지 않는 것**이다.

ISA를 ==**물리적으로 구현하는 방법을 마이크로 아키텍쳐**==라고 하는데, 같은 ISA를 서로 다른 마이크로 아키텍쳐로 구현하기도 한다. 그래서 Intel과 AMD가 x86 ISA를 사용함에도 다른 성능을 내는 이유는 **ISA를 구현하는 방법이 다르기 때문**이다.

마이크로 아키텍처는 마이크로 프로세서가 사용하는 명령어 처리 방식인데, 마이크로 프로세서를 우리가 흔히 아는 CPU라고 이해하면 된다. 과거와 비교하였을 때, 상대적으로 작아져서 micro가 붙은 것이다. 따라서, micro architecture 역시 [CPU architecture](brain/CS/CA/CpuArchitecture)의 맥락으로 이해하면 편하다. 미리 말하자면, 대표적으로 CISC(Complex Instruction Set Computer)와 RISC(Reduced Instruction Set Computer) 방식이 있다.