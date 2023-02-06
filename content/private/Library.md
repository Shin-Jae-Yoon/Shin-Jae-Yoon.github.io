---
banner: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2790&q=80"
banner_x: 0.5
banner_y: 0.05
banner_icon: 📚
cssClasses: row-alt, table-small, col-lines, row-lines, table-numbers
---
# 독서

### 상태별

```dataview

TABLE without id

status as "상태",

length(rows) as "책 수"

FROM #📚독서

WHERE !contains(file.path, "templates")

GROUP BY status

SORT length(rows) DESC

```


### 🟦 읽고 있는 책

```dataview

TABLE without id

status as "상태",

("![coverimg|100](" + cover_url+ ")") as "북커버",

file.link as "도서명",

category as "카테고리",

total_page as "전체 페이지",

dateformat(start_read_date, "DD") as "시작일",

dateformat(finish_read_date, "DD") as "완료일",

my_rate as "내 평점",

book_note as "서평"

FROM #📚독서 

WHERE status = "🟦 진행중" and !contains(file.path, "Templates")

SORT start_read_date desc

```
### 🟧 읽을 책

```dataview

TABLE without id

status as "상태",

("![coverimg|100](" + cover_url+ ")") as "북커버",

file.link as "도서명",

category as "카테고리",

total_page as "전체 페이지",

dateformat(start_read_date, "DD") as "시작일",

dateformat(finish_read_date, "DD") as "완료일",

my_rate as "내 평점",

book_note as "서평"

FROM #📚독서 

WHERE status = "🟧 예정" and !contains(file.path, "templates")

SORT start_read_date desc

```
### 🟩 다 읽은 책

```dataview

TABLE without id

status as "상태",

("![coverimg|100](" + cover_url+ ")") as "북커버",

file.link as "도서명",

category as "카테고리",

total_page as "전체 페이지",

dateformat(start_read_date, "DD") as "시작일",

dateformat(finish_read_date, "DD") as "완료일",

my_rate as "내 평점",

book_note as "서평"

FROM #📚독서 

WHERE status = "🟩 완료" and !contains(file.path, "templates")

SORT start_read_date desc

```
