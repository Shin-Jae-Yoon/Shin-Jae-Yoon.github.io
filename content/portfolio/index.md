---
title: Portfolio
description: 신재윤의 실제 백엔드 업무 경험과 프로젝트를 정리한 포트폴리오입니다.
created: 2026-07-19T00:00:00+09:00
modified: 2026-07-19T00:00:00+09:00
published: 2026-07-19T00:00:00+09:00
cssclasses:
  - portfolio-index
portfolio:
  name: 신재윤
  role: Backend Software Engineer
  email: wlwhsvkdlxh@gmail.com
  phone: 010-5152-3730
  github: https://github.com/Shin-Jae-Yoon
  blog: https://shin-jae-yoon.github.io/
  overview:
    - label: Company
      value: 피플앤드테크놀러지
    - label: Period
      value: 2024.12 — 재직중
    - label: Role
      value: 솔루션개발 1팀 · 백엔드 엔지니어
    - label: Domain
      value: 의료 IoT · RTLS · 협력사 연동
  company:
    name: 피플앤드테크놀러지
    period: 2024.12 — 재직중
    role: 솔루션개발 1팀 · 사원 · 백엔드 엔지니어
    domain: IoT 기기에서 수집한 센서·위치 신호를 처리·가공하는 B2B 솔루션을 개발하고 유지보수합니다. 의료 도메인을 담당하며 산업 프로젝트 일부를 지원했습니다.
    projects:
      - number: "01"
        title: IoT 데이터 처리 엔진
        period: 2025.09 — 진행중
        stack: Spring Boot 3.1 · Java 17 · MariaDB · Redis · Kafka · MongoDB · EMQX
        team: "백엔드 엔지니어 5명 / 단독: 데이터 계층·부하 테스트·튜닝 / 공동 설계: 메시징·관심사 분리·모니터링"
        context: 심박수·산소포화도 등 환자 바이탈 센서와 위치추적 태그, 스캐너의 실시간 데이터를 처리하는 사내 RTLS가 동기 HTTP와 단일 서버 구조에서 2,000 TPS 한계에 도달했습니다.
        groups:
          - label: 해결
            items:
              - IoT↔RTLS 통신을 HTTP에서 MQTT(EMQX)로 전환하고, 중복 메시지 처리와 IoT 저전력 QoS를 근거로 브로커를 선택했습니다.
              - RTLS↔API 사이에 Kafka를 도입하고 단일 API 서버를 core-api와 service-api로 분리했습니다.
              - MariaDB 샤딩과 Galera Cluster, Kafka Streams→MongoDB 시계열 저장, Redis Cluster를 구성했습니다.
              - k6 부하 시나리오와 Prometheus·Grafana 대시보드로 성능 목표와 IoT 특화 지표를 검증했습니다.
          - label: 결과
            items:
              - 가상 사용자 10,000명, 30분 지속, 총 1,800만 건 요청 조건에서 10,000 TPS를 안정적으로 달성했습니다.
              - 응답속도를 40% 개선하고 서버 운영 비용을 약 30% 절감했습니다.
        metrics:
          - value: 2,000 → 10,000 TPS
            label: 처리량 5배 확장
          - value: 40% 개선
            label: 응답속도
          - value: 약 30% 절감
            label: 서버 운영 비용
      - number: "02"
        title: 협력사 연동 파이프라인
        period: 2025.06 — 2025.08
        stack: Spring Boot 3.1 · Java 17 · Netty · Kafka Streams
        team: "백엔드 엔지니어 2명 / 담당: Netty 커넥터 구현·KDNP 엔진 일부 구현·운영 검증"
        context: Kafka 기반 사내 플랫폼과 Kafka를 사용하지 않는 협력사 모니터링 서버를 연결해야 했습니다. 협력사는 timestamp가 2초 이상 지연된 패킷을 폐기했고, ECG 프레임 분할·순서 역전·카운터 롤오버가 동시에 발생했습니다.
        groups:
          - label: Netty TCP 커넥터
            items:
              - Kafka 스트림을 TCP 바이너리 프로토콜로 변환해 외부 서버로 송신하는 연동 게이트웨이를 담당했습니다.
              - Blocking IO 커넥터를 Netty로 재설계해 센서 1,000대, 초당 1,000 메시지를 단일 TCP 세션으로 안정 송신했습니다.
          - label: Kafka Streams ECG 엔진
            items:
              - 프레임 ID와 조각 인덱스로 분할된 ECG 프레임을 원본 단위로 재조립했습니다.
              - 유예 시간 내 재정렬과 고정 간격 방출, 단조 증가 가상 시퀀스 키로 순서·간격·지연 상한과 롤오버를 제어했습니다.
          - label: 결과
            items:
              - 협력사의 2초 폐기 SLA를 충족하고 모니터 화면 끊김을 대폭 줄였습니다.
              - 정책 모듈만 교체해 다른 제조사 기기를 연동할 수 있는 의료 도메인 표준 ECG 처리 엔진으로 선정됐습니다.
        metrics:
          - value: 2초 SLA
            label: 협력사 폐기 기준 충족
          - value: 1,000 msg/s
            label: 단일 TCP 세션 안정 송신
          - value: 의료팀 표준
            label: ECG 엔진 선정
      - number: "03"
        title: EMR 연동 장애 해결
        period: 2025.05 — 2025.06
        stack: Spring 4.3 · Java 8 · MyBatis · MariaDB · Redis
        context: 개인정보 접근 제한으로 운영 데이터를 개발 환경에 복제할 수 없는 상황에서, 마스킹된 운영 로그와 APM 프로파일링 데이터로 교대 시간 동시 로그인 장애를 추적했습니다.
        groups:
          - label: 원인
            items:
              - Redis 조회·쓰기 경로의 O(n) 비효율, AOP 프록시 오적용에 따른 DB 직행, 10억 건 로그 테이블의 락 경합이 복합 작용했습니다.
          - label: 해결
            items:
              - Redis 단일 HASH를 직원별 개별 키로 분리해 O(1) 조회 구조로 바꿨습니다.
              - CGLib/JDK 프록시 혼재를 제거하고 JDK Dynamic Proxy로 일원화했습니다.
              - 날짜 기반 파티셔닝과 DROP PARTITION으로 로그 삭제 구조를 전환했습니다.
          - label: 결과
            items:
              - CPU 사용률을 99%에서 60% 이하로 안정화하고 톰캣 다운 현상을 해결했습니다.
              - 로그 삭제 스케줄러 실행시간을 20시간에서 1시간으로 단축했습니다.
        metrics:
          - value: 99% → 60%
            label: 상용 서버 CPU
          - value: 20h → 1h
            label: 로그 삭제 시간 95% 단축
          - value: 10억 건
            label: 로그 테이블 파티셔닝
      - number: "04"
        title: 테스트 코드 도입
        period: 2025.03 — 2025.04
        stack: Spring REST Docs · Testcontainers · JUnit5 · Jenkins
        context: 사내 테스트 문화가 없고 팀이 회의적인 상황에서 3개월간 자사 솔루션 테스트 코드 작성 업무를 맡았습니다.
        groups:
          - label: 해결
            items:
              - 테스트 코드의 필요성을 주제로 사내 교육 세미나를 진행했습니다.
              - Spring REST Docs로 테스트와 API 문서 생성을 연결하고 Slack 알림을 연동했습니다.
              - Testcontainers로 고객사 DB 버전과 네트워크 환경을 로컬에서 재현했습니다.
          - label: 결과
            items:
              - QA 단계 수정 PR을 약 90% 줄이고 3개월 목표를 2개월 만에 완료했습니다.
              - 팀원이 자발적으로 테스트를 작성하는 문화를 정착시켰습니다.
        metrics:
          - value: 약 90% 감소
            label: QA 수정 PR
          - value: 3개월 → 2개월
            label: 목표 조기 달성
      - number: "05"
        title: 호선·선박 RTLS
        period: 2024.12 — 2025.02
        stack: Spring 4.3 · Java 8 · MyBatis · Oracle 19c · Redis
        context: 산업 현장의 작업자 측위 데이터를 실시간으로 전달하고, 한 번에 한 건만 받는 협력사 제약에 맞춰 안정적인 순차 전송이 필요했습니다.
        groups:
          - label: 해결
            items:
              - 기존 MySQL 쿼리를 Oracle 19c 기반 쿼리로 재작성했습니다.
              - Redis Pub/Sub과 웹소켓으로 측위 데이터를 실시간 전송했습니다.
              - 큐 기반 순차 전송과 실패 재전송 로직으로 협력사 수신 제약을 처리했습니다.
          - label: 결과
            items:
              - 일 평균 1만 작업자가 참여하는 시스템을 평균 500 TPS로 안정 운영했습니다.
              - 출퇴근 시간 수신일시 차이를 1시간에서 5분으로 줄였습니다.
        metrics:
          - value: 일 1만 명
            label: 작업자 참여
          - value: 평균 500 TPS
            label: 안정 운영
          - value: 1h → 5m
            label: 수신일시 차이 92% 단축
  project:
    title: 모아밤 · 모두의 아침과 밤
    period: 2023.10 — 2024.01
    stack: Spring Boot · MySQL · JPA · Redis · AWS · GitHub Actions
    team: "프론트 4명·백엔드 5명 / 담당: 방 도메인 설계·구현, AWS·CI/CD 전담, 루틴 인증 일부"
    context: 루틴 수행 동기를 높이는 서비스의 방 도메인과 인프라를 담당한 프로그래머스 백엔드 데브코스 최종 프로젝트입니다.
    groups:
      - label: 결과
        items:
          - 더미 데이터 100만 건에서 커서 페이징과 쿼리 최적화로 검색 속도를 965ms에서 284ms로 개선했습니다.
          - Blue/Green 무중단 배포로 downtime을 5초에서 0초로 줄였습니다.
          - 가상 사용자 50명 기준 TPS를 293에서 842로 높였습니다.
          - 커버리지 80%를 유지하며 447개의 테스트 코드를 작성했습니다.
          - 데브코스 최종 프로젝트 16팀 중 1등으로 개발 우수상을 받았습니다.
    metrics:
      - value: 70.6% 개선
        label: 검색 응답 시간
      - value: 293 → 842 TPS
        label: 처리량
      - value: 0초
        label: 배포 중단 시간
      - value: 16팀 중 1등
        label: 개발 우수상
    link:
      label: GitHub
      href: https://github.com/team-moabam/moabam-BE
  activities:
    - title: 프로그래머스 백엔드 데브코스 4기
      meta: 2023.06 — 2023.12 · 클라우드 기반 백엔드 개발자 국비교육
      highlights:
        - Java, Spring, Clean Code, AWS, Docker 등 다양한 지식을 습득했습니다.
        - 피어 리뷰 높은 참여도와 소프트스킬 평가, 협업 규칙 정착에 기여했습니다.
    - title: 한국지능정보시스템학회 2022 추계 학술대회
      meta: 2022.03 — 2022.11 · Fashion Boomer
      highlights:
        - 빅데이터 기반 패션 추천 시스템 논문 초록 1저자로 등재됐습니다.
        - 빅데이터와 AI 세션에 투고하고 발표했습니다.
  education:
    title: 국립 부경대학교 · 졸업
    meta: 2017.03 — 2023.02 · 컴퓨터공학부 / 전기공학부 제어계측공학
    highlights:
      - 학점 3.95 / 4.5, 165학점 취득
      - 컴퓨터공학부 2021.03 — 2023.02 / 전기공학부 제어계측공학 2017.03 — 2021.02
  writing:
    - label: JVM을 통한 Java 실행 원리
      href: /articles/tistory/14
    - label: DCLP 지양에 관한 이야기
    - label: 모놀리식과 MSA 아키텍처 정리
    - label: 트래픽 증가에 따른 AWS 아키텍처 변화 발표
  skills:
    - label: Language
      value: Java, SQL
    - label: Framework / API
      value: Spring Boot, Spring MVC, RESTful API
    - label: RDB / NoSQL / ORM
      value: MySQL, MariaDB, Oracle, Redis, MongoDB, MyBatis, JPA
    - label: Messaging
      value: Kafka, Kafka Streams, MQTT (EMQX)
    - label: Infrastructure
      value: Docker, Linux, Nginx, AWS, Grafana, Prometheus
    - label: Tool
      value: Git, Jenkins, Redmine
---

안녕하세요. 백엔드 개발자 신재윤입니다. 빠르게 변화하는 시대에 유연하게 적응하기 위해 단순히 구현하는 것에서 그치지 않고, 유지보수가 수월하고 확장 가능한 코드를 작성하려고 노력해왔습니다. 이러한 과정에서 객체지향 프로그래밍, 추상화에 큰 매력을 느꼈습니다.

소프트웨어 제품을 개발할 때, 방대한 지식을 가진 것은 중요합니다. 이를 위해 끊임없이 노력하고 특히, 기본적인 원리를 깊게 공부하는 것이 중요하다고 여깁니다. 하지만 그럼에도 모든 지식을 알 수 없기에 팀원들과의 소통으로 문제를 해결하는 것이 제가 보는 핵심입니다. 저와 팀원이 가진 지식이 통합하여 하나의 거대한 집합체가 되었을 때 커다란 희열을 느낍니다.

인사이트 공유와 코드리뷰로 동료와 함께 성장하며, 열린 마음으로 피드백을 수용하는 자세로 사람들의 불편함을 해결하고 더 나은 삶을 살게 해주는 소프트웨어 제품을 개발하기 위해 나아가는 중입니다.

아래에는 실제 업무 경험, 프로젝트, 교육, 학술 활동과 발표 기록을 정리했습니다.
