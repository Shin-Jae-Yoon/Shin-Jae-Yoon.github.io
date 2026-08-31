---
title: 무중단 배포
aliases:
  - 무중단 배포
  - 블루-그린
  - 카나리
  - 롤링
  - Zero Downtime
tags:
  - infra
origin:
  verified: 2026-08-30
  scouted: 2026-08-30
---

서비스를 멈추지 않고 새 버전을 올리는 것. [[monolithic-vs-msa|모놀리식]]에서 배포 속도가 느리다는 단점을 완화하는 방법으로 꼽힌다.

## 블루-그린, 카나리, 롤링

블루-그린, 카나리, 롤링 세 가지가 있다.

## 참고

원본 노트에는 세 이름과 모놀리식이라는 맥락까지만 있다. 아래는 각 방식이 실제로 어떻게 도는지를 1차 출처에서 확인한 것이다. 블루-그린은 똑같은 운영 환경을 두 벌 둔다. 하나가 실서비스를 받는 동안 다른 하나에 다음 릴리스를 올려 시험하고, 준비가 끝나면 라우터를 돌려 요청을 통째로 새 환경으로 보낸다. 문제가 생기면 라우터를 원래 환경으로 되돌린다. 환경 두 벌을 유지해야 한다는 것이 이 방식의 전제다. [Martin Fowler, BlueGreenDeployment](https://martinfowler.com/bliki/BlueGreenDeployment.html)

카나리는 새 버전을 올린 뒤 고른 일부 사용자만 그쪽으로 보낸다. 무작위로 뽑기도 하고 내부 사용자부터 보내기도 한다. 이름은 광산에 카나리아를 데리고 내려가던 데서 왔다. 유독가스가 새면 광부보다 카나리아가 먼저 죽기 때문이다. 두 버전을 한동안 함께 굴려야 하므로 DB 스키마 같은 것의 호환을 따로 관리해야 한다. [Martin Fowler, CanaryRelease](https://martinfowler.com/bliki/CanaryRelease.html)

롤링은 인스턴스를 조금씩 새것으로 바꾼다. 쿠버네티스의 기본 배포 전략이 이것이라, 새 파드를 띄워 준비되기를 기다린 뒤에 옛 파드를 내린다. 한 번에 더 띄울 수 있는 파드 수(`maxSurge`)와 내려도 되는 파드 수(`maxUnavailable`)는 기본값이 각각 25%여서, 원하는 파드 수의 125%까지만 뜨고 75% 아래로는 내려가지 않는다. 추가 자원이 적게 드는 대신 교체가 끝날 때까지 두 버전이 함께 돈다. [Kubernetes API, RollingUpdateDeployment](https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/deployment-v1/)

## 관련

- [[multi-was|다중 WAS]]
- [[monolithic-vs-msa|모놀리식과 MSA]]
- [[build-and-ci|빌드와 배포]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week09|면접 스터디 9주차 - 무중단 배포]]
