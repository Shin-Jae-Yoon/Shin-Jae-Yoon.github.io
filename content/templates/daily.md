  

---

<%*

const title = tp.file.title;

const today = moment(title).format("YYYY-MM-DD");

const yesterday = moment(title).subtract(1, 'days').format("YYYY-MM-DD");

const tomorrow = moment(title).add(1, 'days').format("YYYY-MM-DD");

-%>

created: <% tp.file.creation_date() %>

tag: ['Daily']

---

  

# <% today %>

[ 어제 : [[<% yesterday %>]] | 내일 [[<% tomorrow %>]] ]

  

---

  

<br>

  

## 📅 To Do List

- [ ] 목록1 <% tp.file.cursor(0) %>

- [ ] 목록2

- [ ] 목록3

- [ ] 목록4

  

<br>

  

---

  

<br>

  

## 📝 Notes

-

---

  

<br>

  

## 💻 오늘 작성한 파일

  

```dataview

List FROM "" WHERE file.cday = date("<%today%>") SORT file.ctime asc

```