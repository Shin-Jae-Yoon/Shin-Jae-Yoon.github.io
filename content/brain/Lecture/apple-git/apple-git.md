---
title: "코딩애플 git"
date: "2023-02-14 18:16"
enableToc: true
tags: ["🖥️ 코딩애플 git"]
---

> 해당 게시글은 <a href='https://codingapple.com/course/git-and-github/' target='_blank'>코딩애플의 git/github 강좌</a>의 필기와 제가 알던 지식을 정리한 글 입니다. 

<hr>

## git 세팅

<br>

**Windows**

1. 구글에 git windows 검색 후 다운
2. 설치 과정에서 `Use Visual Studio Code as Git's default editor` 체크
3. 설치 과정에서 `Override the default branch` 체크하고 원하는 branch 명 <br> 현재, 깃과 깃허브 기본 브랜치를 **master**로 설정해놨음
4. 설치 과정에서 기본 에디터 체크 안했다면 `git config --global core.editor "code --wait"`
5. 기본 브랜치 바꾸는 명령어는 `git branch -M 브랜치명`

<br>

**mac**  

1. 구글에 Homebrew 검색 후 설치
2. 터미널에 `brew install git` 입력 후 깃 설치
3. `git config --global init.defaultBranch master` 기본 브랜치 master 설정
4. `git config --global core.editor "code --wait"` 기본 에디터 vscode 설정
5. 만약, 기본 브랜치 바꾸는 명령어는 `git branch -M 브랜치명`

<br>  

```bash
git config --global init.defaultBranch master
git config --global core.editor "code --wait"
git config --global user.email "github 아이디"
git config --global user.name "이름"
git config --global core.autocrlf true # windows
git config --global core.autocrlf input # mac
```

<br>

### 현재 세팅

```bash
[user]
    name = jae_yoon(mac)
    email = wlwhsvkdlxh@gmail.com

[init]
    defaultBranch = master

[core]
    editor = code --wait
    autocrlf = input

[push]
    default = current

[pull]
    rebase = true

[diff]
    tool = vscode

[difftool "vscode"]
    cmd = code --wait --diff $LOCAL $REMOTE

[alias]
    hist = log --graph --all --pretty=format:'%C(yellow)[%ad]%C(reset) %C(green)[%h]%C(reset) | %C(white)%s %C(bold red)[[%an]]%C(reset) %C(blue)%d%C(reset)' --date=short

[merge]
    tool = vscode

[mergetool "vscode"]
    cmd = code --wait $MERGED

[mergetool]
    keepBackup = false
```

<hr>

## git 명령어

### 기본 명령어

![[brain/image/apple-git-1.png]]

  

```bash
git init # 초기 폴더를 git 사용할 수 있게
git add file_name # 작업 폴더 -> staging area
git commit -m "memo" # staging area -> repository
git status # staging area 목록 확인
git log --all --oneline # commit 내역 한 줄로 조회
git commit --amend -m "메모" # 가장 최근 commit 내용 변경
```

작업 폴더에서 staging area로 올릴 파일을 고르는 행위를 **스테이징 한다** 라고 함

git add는 파일을 새로 추적할 때도 사용하고

수정한 파일을 staged 상태로 만들 때도 사용한다.

<br>

### git diff

- `git diff` : 최근 commit과 현재 파일의 차이점 보여줌

- j, k로 스크롤바 조작 / q로 종료

- diff가 엔터키 하나, 스페이스바 하나만 했다고 해도 차이점으로 보여주기 때문에 좀 쓰레기 같음

- `git difftool` : vi 에디터 형태로 비교해서 편하게 보여줌

- vi에디터 기본 동작키 h, j, k, l, `:q` 이런거 사용

- `git difftool 커밋아이디` : 현재 파일과 특정커밋 비교 가능

- 사실 difftool도 쓰레기라... 그냥 vscode로 설정하고 보자

- vscode extensions에서 git graph 다운받으면

<br>

```bash
git config --global diff.tool vscode
git config --global difftool.vscode.cmd 'code --wait --diff $LOCAL $REMOTE'
git difftool
```

<br>

### vscode git

![](brain/image/apple-git-2.png)

1. 1번 버튼 누르면 사용 가능

2. 플러스 모양 눌러서 `작업폴더 -> staging area`

3. 마이너스 모양 눌러서 `staging area -> 작업폴더`

4. 체크 모양 눌러서 `staging area -> repository`

5. 그래프 모양 눌러서 브랜치 별 커밋 내용들, 각 파일 눌러서 diff 모두 확인 가능

<br>  

### git branch

![](brain/image/apple-git-3.png)

```bash
git branch 브랜치명 # 브랜치 생성
git switch 브랜치명 # 브랜치로 이동
git log --all --oneline --graph # branch 그래프 모양도 같이 보기
git merge 브랜치명 # 현재 위치(HEAD)에 브랜치명을 병합
```

<br>

![](brain/image/apple-git-4.png)

- 충돌이 났을 때, 어떤 것을 적용할 지 선택하고 꼭 git add, git commit 해주자.

- merge는 현재 위치(HEAD)에 브랜치를 병합하는 과정이다. 따라서 switch로 브랜치 이동을 꼭 해주고 병합하자.

- 과거에는 checkout을 주로 썼는데, checkout은 만능인 반면 switch는 정말 브랜치 이동만 한다. 무지성 checkout 하는걸 염려해서 브랜치 이동은 `switch`, 스테이징 취소는 `git restore --staged <file>` 명확하게 나눠서 사용하는 추세인 듯 하다.

<br>

![](brain/image/apple-git-5.png)

![](brain/image/apple-git-6.png)

- git graph로 보면 시간 순서가 완벽하게 되어있는데, git log는 그래보이진 않음

<br>

```bash
git branch # 브랜치 목록 확인 (로컬)
git branch -r # 브랜치 목록 확인 (원격 ex.github)
git branch -a # 브랜치 목록 확인 (전체)
git branch -d 브랜치명 # 브랜치 삭제 (로컬저장소)
git push origin --delete 브랜치명 # 브랜치 삭제 (원격저장소)
```

<br>

```bash
git branch -d 브랜치명 # merge 완료된 브랜치 삭제
git branch -D 브랜치명 # merge 안한 브랜치 삭제
# 깔끔하게 그 브랜치에서 작업한거 싹 날라감

git branch -m 변경전 변경후 # 브랜치명 변경
git branch -M 브랜치명 # 기본 브랜치 변경
```
  
<br>

### git hist
  
<br>

`git hist`는 실제로는 없는 명령어이다. 매번 `git log --all --oneline --graph` 이런식으로 작성하기 귀찮으니까 `alias` 기능으로 만든 것이다. 일종의 커스텀 기능이다. 원래 oneline만 하면 날짜나 누가 커밋했는지는 안나와서, 내가 커스텀 한 것은 아래와 같다.

```bash
git config --global alias.hist "log --graph --all --pretty=format:'%C(yellow)[%ad]%C(reset) %C(green)[%h]%C(reset) | %C(white)%s %C(bold red)[[%an]]%C(reset) %C(blue)%d%C(reset)' --date=short"
```

![](brain/image/apple-git-7.png)

- 날짜, 커밋명 간단히, 커밋내용, 커밋작성자, 브랜치 다 보인다.

- 보면 git config user name을 수정했었는데, `origin/master`, `orign/HEAD` 저기까지가 깃허브에 git push로 올렸던 커밋들이다. 그 이후 user name을 저렇게 수정했었다. 아직은 push 하지 않은 상태라 브랜치가 coupon, HEAD -> master 이렇게 되어있는 모습이다.

- vim 환경이기 때문에 j가 아래 방향키, k가 위 방향키로 잘먹는다.  

<hr>

## 방법론
  
<br>

### 3-way merge

![](brain/image/apple-git-8.png)

- 신규 브랜치, merge 하고자 하는 중심 브랜치 각각에 새로운 commit이 있을 때 merge하면 두 브랜치의 코드를 합쳐서 새로운 commit을 자동으로 생성

- 3-way merge 방식은 merge 했다는 흔적이 남게 된다.

- 3-way 방식이 싫은 경우 강제로 <a href='/brain/Lecture/apple-git/apple-git/#rebase-and-merge'>rebase하여 fast-forward 방식</a>을 사용하거나 <a href='/brain/Lecture/apple-git/apple-git/#squash-and-merge'>squash and merge 방식</a>을 사용한다.

<br>  

모든 브랜치를 3-way merge 해버리면 나중에 참사가 일어날 수 있다.

![](brain/image/apple-git-9.png)

- 3-way merge 되면, 흔적이 남아서 매우 복잡하게 보인다.

![](brain/image/apple-git-10.png)
  
- master branch의 git log를 출력해보면 3-way merge 된 branch들의 commit 내역도 다 같이 출력되어서 보기 더럽다. (ex. 깃허브에서 커밋 내역 볼 때)

이러한 참사를 해결하기 위하여 **squash and merge 방식**을 사용하곤 한다.

<br>

### fast-forward merge

![](brain/image/apple-git-11.png)
  
- 신규 브랜치에만 새로운 commit이 있고 merge 하고자 하는 브랜치에는 새로운 commit이 없는 경우 사용하는 merge 방식

- 그냥 신규 브랜치보고 지금부터 너의 이름은 master 브랜치야! 라고 한다.

- 그래서 merge한 흔적이 남지 않는다.

- fast-forward merge가 싫은 경우 강제로 `git merge --no --ff 브랜치명`으로 강제로 3-way merge 할 수 있다.

<br>

### rebase and merge

![](brain/image/apple-git-12.png)

- rebase는 브랜치의 시작점을 다른 commit으로 옮겨주는 것

- 신규 브랜치, merge 하고자 하는 중심 브랜치 각각에 새로운 commit이 있을 때 신규 브랜치의 시작점을 merge 하고자 하는 중심 브랜치의 가장 최근 commit으로 옮기고 fast-forward 방식으로 merge 한다.

- 3-way merge가 싫을 때 사용할 수 있다.

- 역시나 merge한 흔적이 남지 않는다.

- 단, rebase를 사용했기 때문에 master branch의 새로운 커밋과 **conflict 할 가능성이 매우 높아진다.**

<br>

**rebase and merge 사용법**

1. rebase 할, 시작점 바꾸고 싶은 브랜치로 이동

2. `git rebase merge할 브랜치명`

3. 그 다음 이동하여 fast-forward merge

```bash
git switch sub
git rebase master
git switch master
git merge sub
```

<br>

### squash and merge

![](brain/image/apple-git-13.png)

- 3-way merge가 너무 많아서 git log 보기 힘들까봐 주로 사용

- merge 흔적이 남지 않음

- 브랜치에서 만들어놨던 많은 commit을 모두 합쳐서 하나의 commit으로 master 브랜치에 생성해줌  

<br>

**squash and merge 사용법**

```bash
git switch master
git merge --squash 브랜치명
git commit -m "메세지"
```

<br><br>

### 그래서 어떤 방식?

<br>  

- 프로젝트 마다, 팀마다 branching/merge 가이드가 존재

- 예를 들어, 안중요한 잔챙이 브랜치는 **squash**하세요.

- feature/develop 브랜치는 **3-way merge**하세요.

- 혼자서 할 때는 대충 쓰세요.

<hr>

## git merge 실습

실습과정에서, branch를 만드는 시점은 중요하다. 예를 들어, commit2에서 git branch를 이용하며 브랜치를 생성하면 commit2가 시작지점이 되는 것이니까. 이를 잘 이해하며 실습을 시작한다.

### 3-way merge 실습

![](brain/image/apple-git-14.png)

- 분기되었던 모습, 즉, merge된 흔적이 남아있다.

- `git branch -d 3-way`로 브랜치를 지워도 그래프 모양으로 나타난다.

- 3-way merge는 각각의 브랜치가 합쳐져서 새로운걸 만들어내는 형태라 mergetool이 따로 열렸다. 그래서 Merge branch 'commit4'와 같이 커밋을 남겼다.

<br>

### fast-forward 실습

![](brain/image/apple-git-15.png)

- fast-forward 방식은 master 브랜치에 새로운 commit이 없으니까 master 브랜치의 HEAD만 fastforward 브랜치로 바뀐 모습이다.

- 따라서, merge 흔적이 남아있지 않다.

- HEAD만 바뀌는 형태라 mergetool이 따로 열리지 않았다.

- HEAD가 `(HEAD -> master, fast)` 이런식으로 나타났다.

<br>

### rebase and fast-forward 실습  

![](brain/image/apple-git-16.png)

- rebase 하기 전 모습

![](brain/image/apple-git-17.png)

- rebase 이후 모습

- 그래프에서 분기가 사라짐을 확인 가능하다.

![](brain/image/apple-git-18.png)

- rebase 이후 fast-forward 한 모습

- fast-forward 방식과 동일하게 HEAD만 바뀐 모습이다.

<br>

### squash and merge 실습

![](brain/image/apple-git-19.png)

- squash 하기 이전 모습
  
![](brain/image/apple-git-20.png)

- squash를 하고 나서 squash는 되었지만, HEAD는 업데이트가 되지 않았다고 한다. commit을 추가적으로 하고 log를 확인해보면

![](brain/image/apple-git-21.png)

- commit4가 정상적으로 생성된 모습이다. 하지만 squash 브랜치는 남아있다. 그래서 `git branch -D squash`로 브랜치를 삭제해보면

![](brain/image/apple-git-22.png)
  
- 이와 같이 깔끔하게 merge 흔적이 사라진 모습이다.

- squash로 merge하면 브랜치의 내용이 순간이동하는 개념이라 squash 브랜치는 아직 merge 되지 않았다고 나왔다. 그래서 `git branch -d squash`가 아닌 `git branch -D squash`로 삭제했다.

<hr>

## git 되돌리기

<br>

### git restore  

- 파일 하나를 수정하고 싶은데 ctrl + z로 수정하기에 수정사항이 너무 많다면 사용

- 해당하는 commit 시점으로 파일 내용 되돌림

```bash
git restore 파일명
git restore --source 커밋아이디 파일명
git restore --staged 파일명
```

예를 들어, `a.txt` 파일 작업 중, 내용1을 입력하고 커밋1, 내용2를 입력하고 커밋2를 한 상태라고 하자. 내용3을 입력했다가 뭔가 이상해서 파일 내용을 돌리려고 하면 `git restore a.txt`를 사용해서 가장 최신 커밋으로 돌리자.  

만약, 가장 최신 커밋보다 이전의 커밋으로 내용을 돌리고 싶으면 `git restore --source 커밋아이디 파일명`으로 돌아가자.

`git add`로 작업폴더에서 staging area로 올렸다가 staging area에서 다시 작업폴더로 내리고 싶으면, 즉, 스테이징을 취소하고 싶으면 `git restore --staged 파일명`을 사용하도록 하자.

<br>  

### git revert

- commit을 취소하고 싶은 경우 revert 사용

- commit을 없애는 건 아니고 commit 하나를 취소한 commit을 하나 생성해줌

![](brain/image/apple-git-23.png)

- 예를 들어, b파일을 만든 **244ef15** commit을 취소하고싶음.

- `git revert 244ef15`를 입력하면 에디터가 열림. 그리고 새로운 commit을 하나 추가해줌.

- 결과적으로 244ef15에서 일어난 commit을 취소해줌

- 작업폴더에서 a파일과 c파일만 있고 b파일은 사라져있을 것

- merge로 생성된 commit도 취소 가능

```bash
git revert 커밋아이디
git revert 커밋아이디1 커밋아이디2
git revert HEAD # 가장 최근 commit 취소
```

<br>

### git reset

- 특정 commit 시절로 아예 모든 것을 되돌려버림  

```bash
git reset --hard 커밋아이디
git push -f # 원격저장소에도 업데이트 하기
```

![](brain/image/apple-git-24.png)

- git revert 예제에서 git reset --hard 한 모습

- 아예 c파일 생성, revert b 커밋 자체가 날라간 모습

- (주의) 따라서, 협업시 사용금지. 갑자기 커밋을 다 날려버릴 수도 있기 때문이다.

<br>

혼자 작업할 때도 reset을 잘 사용하지는 않는다. 기억 잃고 7살로 되돌아갈래?라고 한다면 안돌아가지 않을까. 미래 기억을 reset은 삭제해버리니까 좀 쫄린다.  

```bash
git reset --soft 커밋아이디
```

- 리셋이긴 한데, 변동사항을 지우지는 않고 staging area에 올려놓는다. 사용하려면 git commit 하면 됨

```bash
git reset --mixed 커밋아이디
```

- 리셋이긴 한데, 변동사항을 지우지는 않고 staging area에도 올려놓지 않는다. 사용하려면 git add, git commit 둘다 해야함

<hr>

## git push

- 로컬 repository를 원격 repository로 올리기
  
```bash
git push -u 원격저장소주소 올릴로컬브랜치명
git remote add 변수명 주소
git push origin 올릴로컬브랜치명
git remote -v # 변수목록 확인
git clone 원격저장소주소 # 원격저장소 받아오기
```

- `git push -u https://github.com/Shin-Jae-Yoon/TIL.git master`라고 하면 로컬의 master 브랜치가 해당하는 원격저장소에 push 된다.

- 매번 주소 치기 귀찮으니까 remote 기능 이용해보자.

- `git remote add origin https://github.com/Shin-Jae-Yoon/TIL.git`이라고 하면 git 주소를 origin 변수에 저장한 것이다.

- `git push -u origin master`이라고 하면 위의 것과 같은 말이다.

- `-u` 옵션은 주소를 기억하라는 옵션이라서 앞으로는 `git push`만 입력해도 될 것 이다.

<br>  

### .gitignore

원격저장소에 쓸데없는 파일은 commit해서 올리지 않도록 하는 것이 좋은데, `.gitignore` 파일을 만들면 원격저장소에 올리지 않을 파일들을 쉽게 명시 가능하다. 명시된 파일들은 git add 해도 스테이징 되지 않는다.
  
예를 들어, `node_modules`는 깃허브에 올리지 않는다. 어차피 `package.json` 파일만 잘 있으면 `npm install` 했을 때 자동으로 `node_modules` 폴더가 생성되니까.

<hr>

## github 이용 협업

- 기본적으로 `git clone 원격저장소` 하는 것부터 시작한다.

- 팀원도 push 하고 싶으면 깃허브의 settings -> Access -> Collaborators -> Manage access에서 팀원 깃헙아이디를 등록해놔야 push 가능해진다.  

<br>

### 다른 팀원이 최근에 git push 한 경우

다른 팀원이 최근에 git push 한 경우에 내가 git push를 하지 못하는 경우가 있을 수 있다. 즉, 원격저장소에 변동사항이 생겨서 새로운게 생기면 git push 하지 못한다. 이런 경우 `git pull`로 먼저 원격저장소의 내용을 가져와서 업데이트 해야 한다.
  

```bash
git pull origin 브랜치명
# 원격저장소에서 해당하는 branch만 pull 가능
```

git pull은 엄밀히 말하면 `git fetch + git merge`이다. 원격 저장소의 신규 commit을 가져오고 내 브랜치에 merge 하는 것이다. 이 말은 merge 과정에서 conflict 발생 가능성이 있다는 말이다. 뭐 conflict 나면 에디터 열고 수정해야지 ...

<br>

### pull request

- 프로젝트를 할 때 branch를 쪼개서 작업하는 경우가 많아질 것

- 예를 들어, `git push origin feature`로 feature 브랜치를 로컬에서 생성하고 작업하고 있다고 가정하자. (물론, 깃허브에서 브랜치 생성하고 pull 해왔어도 가능)

- feature가 잘 작동해서 master 브랜치에 merge 하려고 한다.

- github에서 merge 하거나

- 로컬에서 merge 한 다음 push 하거나

- 협업할 때는 merge 하기 전에 검토를 하는 경우가 일반적

- github의 pull request 기능을 이용해보자.

<br>

![](brain/image/apple-git-25.png)

1. 로컬 환경에서 만든 다른 브랜치로 작업하고 `git push origin 만든브랜치` 해서 브랜치에서 작업한 내용을 원격 repository로 push

2. github에서 pull requests 탭 들어가서 pull request 생성

3. 검토해보고 merge 될 것 같으면 3가지 옵션 중 선택해서 merge

4. conflict 발생했다면 github에서 수정 가능하니까 conflict 해결하기

5. 다쓰고 나면 브랜치 삭제해주고 이런건 알아서 하기

<br>

![](brain/image/apple-git-26.png)

<br>

![](brain/image/apple-git-27.png)

<br>

![](brain/image/apple-git-28.png)

<br>

![](brain/image/apple-git-29.png)
  
<br>

![](brain/image/apple-git-30.png)

<br>

![](brain/image/apple-git-31.png)

merge 전략 3가지 역시 깃허브에 반영되어있음.

<br>

1. create a merge commit

새로운 merge commit 생성해주는 <a href='/brain/Lecture/apple-git/apple-git/#3-way-merge'>3-way-merge</a>를 실행한다. master 브랜치 조회해보면 합쳐진 브랜치의 commit 내역도 전부 나온다. 역시 git log를 보면 합쳐진 브랜치도 나오기 때문에 commit 내역이 많으면 복잡하고 더러워 보일 수 있다.

<br>

2. squash and merge

합쳐질 브랜치의 commit 내역을 하나로 합쳐서 master 브랜치에 신규 commit을 생성해준다. git log를 보면 합쳐진 브랜치는 안나온다. commit을 하나로 합쳐서 master 브랜치로 순간이동하는 방식이라 많은 사람이 선호한다.

<br>

3. rebase and merge

합쳐질 브랜치를 master 브랜치 최신 commit으로 rebase 하고 나서 fast-forward merge 같은 작동을 해준다. 결과는 squash and merge와 비슷한데, 합쳐질 브랜치의 commit 내역이 전부 보존된다. 하지만, git log에는 합쳐진 브랜치가 나오지 않는다.

<hr>

## 브랜치 전략

- 프로젝트 커지고 사람 많아져도 branch, merge를 깔끔하게 하려고 사용하는 전략들이 있다. **GitFlow, Github Flow, Trunk-based, Gitlab Flow**

<br>  

### Git Flow 전략

![](brain/image/apple-git-32.png)

![](brain/image/apple-git-33.png)

![](brain/image/apple-git-34.png)

**GitFlow** 개발 전략은 게임 개발 같이 항상 안정적인 release를 해야하는 경우에 사용하기 적합하다. 크게 5개 브랜치를 운영한다.

- main 브랜치

- develop 브랜치 (개발용, main 브랜치의 복사본)

- feature 브랜치 (develop에 기능 추가용)

- hotfix 브랜치 (main 브랜치 버그 픽스용)

- release 브랜치 (develop 브랜치를 main 브랜치에 merge 하기 전 최종 테스트본, 가끔 사용)

장점은 안정적이지만, 단점은 간단한 개발의 경우 리소스 낭비가 심할 수 있다. 간단한 작업임에도 매번 develop 브랜치~ release 브랜치~ 이런식으로 진행해야하니까. 최근 CI/CD를 도입하는 회사가 많이 늘었는데, 그런 경우에 git flow 전략은 적합하지 않다.

> <a href='https://seosh817.tistory.com/104' target='_blank'>CI/CD</a>에 관한 것은 해당 링크에 자세히 설명되어있다.

  

<br>

  

### Trunk-based 전략

![](brain/image/apple-git-35.png)

코드 짠 것을 대충 배포해도 상관없거나 굳이 큰 업데이트가 없는 안정적인 프로그램의 경우, git flow 처럼 많은 브랜치를 만드는 것보다 해당하는 **Trunk-based 전략**이 더 적합할 수 있다. 그냥 main 브랜치와 기능추가용 feature 브랜치만 사용하면 된다. **github flow**도 해당하는 전략과 비슷하다.

1. 기능추가, 버그픽스가 필요하면 main 브랜치에서 새로운 브랜치를 분기하여 코드 작성

2. 기능이 완성되면 main 브랜치에 merge (다 쓴 브랜치 삭제)

3. main 브랜치를 필요할 때마다 배포

<br>

**장점**은 코드를 한 브랜치에서만 관리하기에 편하다는 점이다. 이때 크게 개발하고 한 번에 merge 하는 것보다 작은 단위로 자주 merge 하는 것이 더 안전하다. **단점**은 역시 main 브랜치의 코드가 뻑이 나면 큰일나서 테스트나 코드 리뷰를 자주해야 한다. 그래서 테스트와 배포를 자동으로 하는 <a href='https://seosh817.tistory.com/104' target='_blank'>CI/CD</a>를 도입한 곳에서 자주 사용한다.

<hr>

## git stash

- 코드를 작성하다가 잠시 보관하고 싶을 때 사용

- 최근 commit과 차이점 있는 부분 전부 보관

- 스테이징 되었든 안되었든 모두 stash 된다

- 하지만, 스테이징 안해놓은 새로운 파일 (untranked file 인듯)은 stash 안될 수도 있다.  

<br>


**stash 되는 파일 목록** <br><br>

stash란 아래에 해당하는 파일들을 보관해두는 장소 이다.

1. Modified이면서 Tracked 상태인 파일

	- Tracked 상태인 파일을 수정한 경우

	- Tracked: 과거에 이미 commit하여 스냅샷에 넣어진 관리 대상 상태의 파일

2. Staging Area에 있는 파일(Staged 상태의 파일)

	- git add 명령을 실행한 경우

	- staged 상태로 만들려면 git add 명령을 실행해야 한다.

	- git add는 **파일을 새로 추적할 때도 사용**하고 **수정한 파일을 Staged 상태로 만들 때**도 사용한다.

```bash
git stash
git stash list # 보관된 코드 목록
git stash save "메모" # 메모와 함께 보관
git stash pop # 코드 다시 불러오기
git stash drop 번호 # stash 1개 삭제
git stash clear # stash 전부 삭제
```

- git stash pop은 pop에서 알 수 있다시피 가장 최근 것부터 가져온다. stash는 스택에 새로운 stash가 만들어지면서 저기에 넣고 working directory, 작업공간이 깔끔해지는 효과이다.

<br>

> [!note] stash가 왜 필요함? 주석처리 하면 어떰?  
>
> 주석처리를 한다고 하더라도 commit 하면 그 내역이 같이 올라간다. 따라서 그걸 숨기고 싶을 때 stash 쓰면 유용하다. 혹은 따로 stash 같은 역할을 하는 branch 하나 만들고 거기에 작성해도 된다. 둘 중 마음에 드는 방식 사용하자.