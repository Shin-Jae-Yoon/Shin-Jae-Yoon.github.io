---
title: 트리거
aliases:
  - 트리거
  - OLD
  - NEW
tags:
  - database
origin:
  verified: 2026-08-30
---

DB에 어떤 이벤트가 일어났을 때 자동으로 실행되는 [[stored-routine|프로시저]]. `INSERT`, `UPDATE`, `DELETE`가 계기가 되어 미리 정의해둔 동작이 따라 실행된다.

## 실행 시점과 대상 테이블

```sql
DELIMITER $$
CREATE TRIGGER 트리거이름
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    수행할 것;
END $$
DELIMITER ;
```

`BEFORE UPDATE`가 언제 실행할지를 정한다. `BEFORE`나 `AFTER`에 `INSERT`, `UPDATE`, `DELETE`를 짝지은 조합이다. `ON users`는 감시할 테이블이고, `FOR EACH ROW`는 영향받는 행마다 실행하라는 뜻이다. 한 번의 `UPDATE`가 10행을 바꾸면 트리거도 10번 돈다.

## OLD와 NEW

트리거 안에서 변경 전후의 값을 가리키는 키워드가 `OLD`와 `NEW`다.

| 시점     | `OLD`      | `NEW`      |
| -------- | ---------- | ---------- |
| `INSERT` | 없다       | 삽입될 행  |
| `UPDATE` | 수정 전 행 | 수정 후 행 |
| `DELETE` | 삭제될 행  | 없다       |

닉네임 변경 이력을 남기려면 `BEFORE UPDATE` 시점에 `OLD.nickname`을 로그 테이블에 넣는다. 반대로 마트에서 물건을 살 때마다 누적 구매액을 갱신하려면 `AFTER INSERT` 시점에 `NEW`의 금액을 기존 합계에 더한다. 2,000원짜리를 사고 5,000원짜리를 사면 누적액이 7,000원으로 따라 올라간다.

## WHEN 절과 DBMS 차이

`WHEN` 절로 세부 조건을 걸어 값이 실제로 바뀐 경우에만 실행되게 할 수도 있다. 다만 MySQL은 `WHEN` 절을 지원하지 않는다. 위 예제가 MySQL 문법이므로 그대로 따라 쓰면 문법 오류가 난다. MySQL에서는 트리거 본문 안에 `IF`를 써서 같은 일을 한다. `INSERT`와 `UPDATE`와 `DELETE`를 한 트리거로 함께 감지하는 것도 MySQL에서는 안 되고 PostgreSQL에서 된다.

## 행 단위와 문장 단위

행마다 도는 것이 늘 맞지도 않다. 부서 id가 1003인 임직원 다섯 명의 연봉을 한 번에 1.5배로 올리면서 평균 연봉을 다시 계산하는 트리거를 `FOR EACH ROW`로 걸어두면 같은 계산이 다섯 번 돈다. `FOR EACH STATEMENT`로 바꾸면 문장 단위로 한 번만 도는데, 이것 역시 MySQL에서는 쓸 수 없다.

## 보이지 않는 로직의 비용

트리거는 유지보수가 어렵다. 최후의 보루로 남겨두는 편이 낫다.

무엇보다 눈에 보이지 않는다. 애플리케이션 코드 어디에도 트리거를 부르는 곳이 없다. 프로시저는 소스 코드에 호출하는 줄이라도 남지만 트리거는 그것조차 없다. `UPDATE` 한 줄을 실행했는데 다른 테이블에 데이터가 생기면 코드만 읽어서는 원인을 찾을 수 없다. 새로 들어온 사람이 원인 불명의 동작을 만났을 때 트리거를 의심하기까지 오래 걸린다.

지나치게 쓰면 연쇄된다. 트리거가 바꾼 데이터가 또 다른 트리거를 부르고, 그것이 또 부른다. 하나를 고치면 어디까지 영향이 가는지 추적하기 어려워지고, 그동안 DB는 계속 일을 더 하므로 응답도 느려진다. 디버깅이 어려운 만큼 문서로 남겨두는 일이 특히 중요하다.

이유가 [[procedure-tradeoff|프로시저의 장단점]]과 같은 계열이다. 로직이 눈에 보이지 않는 곳에 숨는 것이 문제다.

## 관련

- [[stored-routine|저장 함수와 저장 프로시저]]
- [[procedure-tradeoff|프로시저의 장단점]]

## 출처

- [[brain/lectures/db/easy-db/lecture13|쉬운코드 데이터베이스 13강 - Trigger]]
