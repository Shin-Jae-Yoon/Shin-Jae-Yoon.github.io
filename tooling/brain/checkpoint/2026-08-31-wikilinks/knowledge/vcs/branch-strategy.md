---
title: 브랜치 전략
aliases:
  - 브랜치 전략
  - Git Flow
  - Trunk-based
  - GitHub Flow
  - Pull Request
tags:
  - vcs
  - git
origin:
  verified: 2026-08-31
  scouted: 2026-08-30
---

프로젝트가 커지고 사람이 늘어도 브랜치와 병합을 깔끔하게 유지하려는 규칙. Git Flow, GitHub Flow, Trunk-based, GitLab Flow가 있다.

## Pull Request와 병합 옵션

협업에서는 작업을 마쳤다고 바로 merge하지 않고 Pull Request로 검토를 거친다.

```
1. 브랜치에서 작업하고 git push origin 브랜치명
2. GitHub에서 Pull Request 생성
3. 검토 후 병합 방식을 골라 merge
4. conflict가 있으면 해결
5. 브랜치 정리
```

3번에서 고르는 GitHub의 병합 옵션 셋이 [[병합 전략]]과 그대로 대응된다.

| GitHub 옵션           | 무엇                   | 로그                               |
| --------------------- | ---------------------- | ---------------------------------- |
| Create a merge commit | 3-way merge            | 합쳐진 브랜치 커밋이 전부 나온다   |
| Squash and merge      | 커밋을 하나로 합친다   | 브랜치가 안 나온다. 많이 선호된다  |
| Rebase and merge      | rebase 후 fast-forward | 커밋은 보존되고 브랜치는 안 나온다 |

## 원격을 먼저 가져오기

다른 사람이 push한 뒤에는 내가 push할 수 없다. 먼저 `git pull`로 원격 내용을 가져와야 한다.

```bash
git pull origin 브랜치명
```

`git pull`은 엄밀히 `git fetch`와 `git merge`를 이어 하는 것이다. 원격의 신규 커밋을 가져와 내 브랜치에 병합하는 것이라 conflict가 날 수 있다.

## .gitignore

`.gitignore`에는 원격에 올리지 않을 파일을 적는다. 여기 적힌 것은 `git add`해도 스테이징되지 않는다. `node_modules`가 대표적이다. `package.json`만 있으면 `npm install`로 다시 만들어지므로 올릴 이유가 없다.

## Git Flow

항상 안정적인 릴리스가 필요한 경우에 맞는다. 게임 개발 같은 것이다. 브랜치를 다섯 개 운영한다. main은 배포되는 것, develop은 main의 복사본인 개발용, feature는 develop에 기능을 추가하는 갈래, hotfix는 main의 버그 수정, release는 develop을 main에 합치기 전 최종 테스트본이다.

안정적이지만 간단한 개발에는 리소스 낭비가 심하다. 사소한 작업에도 develop과 release를 거쳐야 한다. 자주 배포하는 흐름과 어긋나서 CI/CD를 도입한 곳에는 맞지 않는다.

## Trunk-based

main 브랜치와 기능 추가용 feature 브랜치만 쓴다. GitHub Flow도 이것과 비슷하다.

배포가 잦거나 큰 업데이트가 없는 안정적인 프로그램에 맞는다. 브랜치가 적으니 관리 비용이 낮고 [[빌드와 배포|CI/CD]]와 잘 어울린다.

## 참고

무엇을 적을지는 원본이 `node_modules` 하나만 예로 든다. Pro Git은 대상을 "로그 파일이나 빌드 시스템이 만들어낸 파일처럼 자동으로 생성되는 파일"로 일반화하고 로그와 임시 디렉터리, 자동 생성 문서를 예로 든다. 편집기가 만드는 파일은 GitHub 문서가 들면서 운영체제와 언어별 템플릿 모음인 `github/gitignore` 저장소를 가리키고, 비밀 값에 대해서는 "민감한 데이터가 git이 추적하지 않아야 할 파일에 들어갈 것 같으면 그 파일 이름을 `.gitignore`에 넣으라"고 적는다. [git-scm, Pro Git - Ignoring Files](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository), [GitHub Docs, Ignoring files](https://docs.github.com/en/get-started/git-basics/ignoring-files), [GitHub Docs, Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

`.gitignore`에는 예외가 둘 있는데 원본 강의에는 빠져 있다. 이미 추적 중인 파일에는 효력이 없다. 규칙을 나중에 적어도 그 파일은 계속 따라오므로, `git rm --cached`로 인덱스에서 먼저 빼야 이후 커밋에 다시 끌려 들어오지 않는다. [git-scm, gitignore](https://git-scm.com/docs/gitignore)

`git add -f`는 무시 규칙을 뚫고 스테이징한다. 문서가 이 옵션을 "무시된 파일도 추가할 수 있게 한다"고 적어둔 그대로다. [git-scm, git-add](https://git-scm.com/docs/git-add)

## 관련

- [[병합 전략]]
- [[커밋과 브랜치]]
- [[빌드와 배포]]

## 출처

- [[brain/lectures/etc/apple-git/git-and-github|코딩애플 Git과 GitHub - 브랜치 전략, pull request]]
