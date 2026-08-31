
### Intro

- 병목은 모델이 아닌 distance
	- Website (For Humans)
	- SKills (For Agents)
		- 제공해주는 pre 스킬 셋 다수 존재
		- 목록에 대해서 봐야할듯 ?
	- CLI (For setup)

### LLM 가드레일

트레이블랩스 Token Never Sleep 정책 속에서
- agents의 속도를 human이 따라가지 못한다 (코드 인지)

**Q. 인간의 개입을 얼마나 줄일 수 있을까**
**Q. 사람이 지켜보지 않아도 중요 정보에 대한 외부 전송을 어떻게 막을까?**

엔터프라이즈 설정에서 provider/platform에 관한 가드레일을 설정할 수 있지만, 모델 왔다갔다 할 수 있으니
모델에 종속되지 않는 가드레일을 설정

LLM 호출 전, 프리콜 설정 (Lite LLM)

중앙 정책은 Git에서 운영 (Git)

Lite LLM + GitOps

Secret과 키, DB와 Infrastructure, Token과 인증 등이 MVP 보호 대상

OMP (Oh my p?)


### Qwen + Hermes-Agent

에이전틱 메모리로 관리하는 md / git 으로 관리되는 파일에 라벨을 남겨서 장기 기억으로 전환

e.g.
- Fact
- TTL
- Observer
- Episode


Pruning
- 에이전트에게 내가 어떤 스타일을 선호하는지 말하라고 해보자

Hermes Dreaming