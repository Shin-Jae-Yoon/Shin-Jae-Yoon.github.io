
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

## 🕖 Schedule (simple)

- 09:00 ~ 12:00 - <% tp.file.cursor(0) %>
- ==12:00 ~ 13:00 - 점심시간==
- 13:00 ~ 18:00 - 
- ==18:00 ~ 19:00 - 저녁시간==
- 19:00 ~ 23:00 - 
- ==23:00 ~ 24:00 - 다음날 일정 정리==

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