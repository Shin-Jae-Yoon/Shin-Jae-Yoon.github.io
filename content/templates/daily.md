
---
<%*
const title = tp.file.title;
const todayDataView = moment(title).format("YYYY-MM-DD");
const today = moment(title).format("YYYY-MM-DD (dddd)");
const yesterday = moment(title).subtract(1, 'days').format("YYYY-MM-DD");
const tomorrow = moment(title).add(1, 'days').format("YYYY-MM-DD");
-%>
created: <% tp.file.creation_date() %> 
updated: <% tp.file.creation_date() %>
tag: ['Daily']
---

# 오늘은 <% today %> 입니다.

[ 어제 : [[<% yesterday %>]] | 내일 [[<% tomorrow %>]] ]

---

<br>

## 🕖 오늘의 순공시간

- 순공시간

<br>

## 📅 To Do List

- [ ] 목록1
- [ ] 목록2
- [ ] 목록3
- [ ] 목록4

<br>

## 📝 Notes

- 오늘 학습한 핵심 내용

---

<br>

## 📚 오늘 작성한 파일

```dataview
List FROM "" WHERE file.cday = date("<%todayDataView%>") SORT file.ctime asc
```

## 📚 오늘 수정한 파일

```dataview 
List FROM "" WHERE file.mday = date("<%todayDataView%>") SORT file.mtime asc
```