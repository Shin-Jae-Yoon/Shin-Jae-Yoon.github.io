---
title: 되돌리기
aliases:
  - 되돌리기
  - git restore
  - git revert
  - git reset
tags:
  - vcs
  - git
origin:
  verified: 2026-08-30
---

셋 다 되돌리는 명령인데 되돌리는 대상과 파괴력이 다르다.

## git restore

파일 하나를 특정 커밋 시점 내용으로 되돌린다. 수정한 게 너무 많아 손으로 되돌리기 어려울 때 쓴다.

```bash
git restore 파일명                          # 최신 커밋 상태로
git restore --source 커밋아이디 파일명       # 특정 커밋 상태로
git restore --staged 파일명                 # 스테이징 취소
```

`git add`로 올린 것을 내리고 싶을 때 `--staged`를 쓴다.

## git revert

커밋을 취소하는데, 그 커밋을 없애는 것이 아니라 취소하는 커밋을 새로 만든다.

```bash
git revert 커밋아이디
git revert HEAD          # 가장 최근 커밋 취소
```

b 파일을 만든 커밋을 revert하면 b 파일을 지우는 새 커밋이 생긴다. b는 사라지지만 이력에는 둘 다 남는다. merge로 생긴 커밋도 취소할 수 있고, 이력이 남으므로 협업에서 안전하다.

## git reset

특정 커밋 시점으로 모든 것을 되돌린다.

```bash
git reset --hard 커밋아이디
git push -f              # 원격에도 반영
```

revert와 달리 그 이후의 커밋이 통째로 사라진다. 다른 사람의 커밋까지 날아갈 수 있어서 협업할 때는 쓰지 않는다. `push -f`가 필요하다는 것 자체가 위험 신호다. 혼자 작업할 때도 되돌린 이후의 기억이 통째로 지워지는 것이라 부담이 크다.

`--soft`를 쓰면 변경 내용은 남기고 staging area에 올려둔다. 커밋만 다시 하면 되므로 커밋 메시지를 고치거나 여러 커밋을 합칠 때 쓴다.

## 세 명령의 차이

| 명령      | 무엇을 되돌리나  | 이력                 |
| --------- | ---------------- | -------------------- |
| `restore` | 파일 내용        | 그대로               |
| `revert`  | 커밋 하나        | 취소 커밋이 추가된다 |
| `reset`   | 그 시점으로 전부 | 이후 이력이 사라진다 |

## 관련

- [[커밋과 브랜치]]
- [[병합 전략]]

## 출처

- [[brain/lectures/etc/apple-git/git-and-github|코딩애플 Git과 GitHub - git 되돌리기]]
