---
title: 병합 전략
aliases:
  - 병합 전략
  - 3-way merge
  - fast-forward
  - rebase
  - squash and merge
tags:
  - vcs
  - git
origin:
  verified: 2026-08-31
  scouted: 2026-08-30
---

브랜치를 합치는 네 가지 방법. merge한 흔적이 남느냐가 갈림길이다.

## fast-forward merge

신규 브랜치에만 새 커밋이 있고 중심 브랜치에는 없을 때 쓰인다. 합칠 것이 없으니 그냥 브랜치 포인터를 앞으로 옮긴다. "지금부터 네 이름이 master다"라고 하는 셈이라 merge한 흔적이 남지 않는다.

흔적을 남기고 싶으면 `git merge --no-ff 브랜치명`으로 3-way merge를 강제할 수 있다.

## 3-way merge

양쪽 브랜치에 각각 새 커밋이 있을 때 쓰인다. 두 브랜치의 코드를 합쳐 새로운 커밋을 자동으로 만들고, merge했다는 흔적이 남는다. 이것이 장점이자 단점이다.

모든 브랜치를 3-way merge 하면 나중에 참사가 난다. master의 로그를 보면 병합된 브랜치들의 커밋 내역이 전부 함께 나와 읽을 수 없을 만큼 지저분해진다.

## rebase and merge

rebase는 브랜치의 시작점을 다른 커밋으로 옮기는 것이다. 양쪽에 새 커밋이 있을 때 신규 브랜치의 시작점을 중심 브랜치의 최신 커밋으로 옮긴 뒤 fast-forward로 합치면 흔적이 남지 않는다.

```bash
git switch sub
git rebase master
git switch master
git merge sub
```

대신 conflict가 날 확률이 매우 높아진다. 시작점을 옮기면서 그 사이 커밋들과 부딪히기 때문이다.

## squash and merge

브랜치의 여러 커밋을 전부 합쳐 하나의 커밋으로 중심 브랜치에 만든다. 3-way merge가 많아 로그를 보기 힘들 때 주로 쓰고, 흔적이 남지 않으며 커밋 하나만 깔끔하게 남는다.

## 고르는 기준

작업 이력을 있는 그대로 남기고 싶으면 3-way merge, 로그를 깔끔하게 유지하고 싶으면 squash and merge, 선형 이력을 원하고 conflict를 감수하겠다면 rebase and merge다.

강의는 잔챙이 브랜치만 squash로 합치고 feature와 develop은 3-way merge로 남기라고 한다. 팀마다 가이드가 다르니 정해진 답은 없고, 혼자 할 때는 아무거나 써도 된다.

## 참고

원본 강의는 3-way merge를 강제하는 옵션을 `git merge --no --ff 브랜치명`으로 적었는데 그런 옵션은 없다. 공백 없이 `--no-ff` 하나가 옵션 이름이고, 문서는 "병합이 fast-forward로 처리될 수 있을 때에도 병합 커밋을 만든다"고 적어둔다. `--ff`가 기본값이라 fast-forward가 가능하면 병합 커밋 없이 포인터만 옮긴다. [git-scm, git-merge](https://git-scm.com/docs/git-merge#Documentation/git-merge.txt---no-ff)

## 관련

- [[commit-and-branch|커밋과 브랜치]]
- [[undo|되돌리기]]
- [[branch-strategy|브랜치 전략]]

## 출처

- [[brain/lectures/etc/apple-git/git-and-github|코딩애플 Git과 GitHub - 방법론]]
