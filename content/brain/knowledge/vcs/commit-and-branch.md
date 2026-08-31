---
title: 커밋과 브랜치
aliases:
  - 커밋과 브랜치
  - git commit
  - staging area
  - git branch
  - git stash
tags:
  - vcs
  - git
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

Git이 변경을 기록하는 단위가 커밋이고, 그 커밋들을 갈래로 나눈 것이 브랜치다.

## staging area를 거치는 커밋

Git을 이해하는 출발점은 세 개의 공간이다.

```
작업 폴더  --git add-->  staging area  --git commit-->  저장소
```

staging area가 중간에 있는 이유는 올릴 것을 고르기 위해서다. 파일 열 개를 고쳤어도 그중 셋만 하나의 커밋으로 묶을 수 있다.

```bash
git add 파일               # 작업 폴더에서 staging area로
git commit -m "메시지"     # staging area에서 저장소로
git status                 # 지금 상태
git diff                   # 변경 내용 비교
git log                    # 커밋 이력
```

`git diff`는 무엇을 바꿨는지 확인할 때 쓴다. 커밋하기 전에 한 번 보는 습관이 실수를 줄인다.

## 갈래를 나누는 브랜치

브랜치는 작업을 나누어 진행하는 갈래다. 서로 영향을 주지 않으므로 기능마다 브랜치를 파고 작업한 뒤 합친다.

```bash
git branch 브랜치명       # 만들기
git switch 브랜치명       # 이동
git branch -d 브랜치명    # 삭제
```

합치는 방법은 [[merge-strategy|병합 전략]]에, 어떻게 운영할지는 [[branch-strategy|브랜치 전략]]에 있다.

## git stash

작업하던 것을 잠시 치워두는 명령이 `git stash`다. 최근 커밋과 차이 나는 부분을 전부 보관하고, 스테이징했든 안 했든 함께 들어간다.

```bash
git stash          # 치워두기
git stash pop      # 다시 꺼내기
git stash list     # 목록
```

커밋하기는 이르고 버리기는 아까운 변경을 잠시 넣어두는 서랍이다.

## 참고

브랜치를 옮기려는데 커밋하지 않은 변경이 남아 있으면 이동이 막힐 수 있다. git 문서는 "브랜치를 바꾸는 데 인덱스와 작업 트리가 깨끗할 필요는 없지만, 로컬 변경을 잃게 되는 결과라면 작업이 중단된다"고 적고 `error: You have local changes to 'frotz'; not switching branches.`가 나오는 예를 든다. stash를 쓰는 대표적인 자리가 여기다. [git-scm, git-switch](https://git-scm.com/docs/git-switch)

브랜치를 만들면서 곧바로 옮기는 `git switch -c 브랜치명`도 있다. 같은 문서는 이 옵션을 "`git branch <new-branch>`와 `git switch <new-branch>`를 이어 하는 것과 같되, switch가 성공하지 못하면 브랜치를 만들지도 옮기지도 않는 트랜잭션 방식"이라고 설명한다. [git-scm, git-switch](https://git-scm.com/docs/git-switch#Documentation/git-switch.txt--cltnew-branchgt)

## 관련

- [[merge-strategy|병합 전략]]
- [[branch-strategy|브랜치 전략]]
- [[undo|되돌리기]]

## 출처

- [[brain/lectures/etc/apple-git/git-and-github|코딩애플 Git과 GitHub - git 명령어, branch, stash]]
