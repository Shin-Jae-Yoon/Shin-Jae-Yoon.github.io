---
title: 모아밤 (모두의 아침과 밤)
description: 루틴 수행 동기 강화 서비스 모아밤의 백엔드와 인프라 작업입니다.
contentType: portfolio
created: 2023-10-01T00:00:00+09:00
modified: 2024-01-31T00:00:00+09:00
published: 2024-01-31T00:00:00+09:00
tags:
  - Java
  - Spring Boot
  - MySQL
  - Redis
  - AWS
cssclasses:
  - portfolio-detail
---

프로그래머스 백엔드 데브코스 4기 최종 프로젝트로 진행한 루틴 수행 동기 강화 서비스입니다. 프론트엔드 4명, 백엔드 5명으로 구성됐으며 방 도메인 설계와 구현, AWS와 CI/CD 인프라, 루틴 인증 일부를 담당했습니다.

- 기간: 2023.10 - 2024.01
- 기술: Spring Boot, MySQL, JPA, Redis, AWS, GitHub Actions
- 결과: 16팀 중 1등, 프로젝트 개발 우수상
- GitHub: [team-moabam/moabam-BE](https://github.com/team-moabam/moabam-BE)

## 검색 성능 개선

더미 데이터 100만 건 기준으로 커서 페이징과 쿼리 최적화를 적용해 검색 속도를 **965ms에서 284ms로 70.6% 개선**했습니다.

## 배포와 처리량

- Blue/Green 무중단 배포로 downtime을 **5초에서 0초**로 줄였습니다.
- 가상 사용자 50명 기준 TPS를 **293에서 842**로 높였습니다.

## 테스트

커버리지 80%를 유지하며 447개의 테스트 코드를 작성했습니다.
