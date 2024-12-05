function htmlToElement(html) {
  const template = document.createElement("template")
  html = html.trim()
  template.innerHTML = html
  return template.content.firstChild
}

function initPopover(baseURL, useContextualBacklinks) {
  const basePath = baseURL.replace(window.location.origin, "")
  fetchData.then(({ content }) => {
    const links = [...document.getElementsByClassName("internal-link")]
    links
      .filter((li) => li.dataset.src || (li.dataset.idx && useContextualBacklinks))
      .forEach((li) => {
        let el
        if (li.dataset.ctx) {
          const linkDest = content[li.dataset.src]
          const popoverElement = `<div class="popover">
    <h3>${linkDest.title}</h3>
    <p>${highlight(removeMarkdown(linkDest.content), li.dataset.ctx)}</p>
</div>`
          el = htmlToElement(popoverElement)
        } else {
          const linkDest = content[li.dataset.src.replace(/\/$/g, "").replace(basePath, "")]
          if (linkDest) {
            let splitLink = li.href.split("#")
            let cleanedContent = removeMarkdown(linkDest.content)
            if (splitLink.length > 1) {
              let headingName = decodeURI(splitLink[1]).replace(/\-/g, " ")
              let headingIndex = cleanedContent.toLowerCase().indexOf("<b>" + headingName + "</b>")
              cleanedContent = cleanedContent.substring(headingIndex, cleanedContent.length)
            }
            const popoverElement = `<div class="popover">
    <h3>${linkDest.title}</h3>
    <p>${cleanedContent.split(" ", 20).join(" ")}</p>
</div>`
            el = htmlToElement(popoverElement)
          }
        }

        if (el) {
          li.appendChild(el)
          if (LATEX_ENABLED) {
            renderMathInElement(el, {
              delimiters: [
                { left: "$$", right: "$$", display: false },
                { left: "$", right: "$", display: false },
              ],
              throwOnError: false,
            })
          }

          let hidePopoverTimeout;

          li.addEventListener("mouseover", () => {
            clearTimeout(hidePopoverTimeout); // 기존 숨김 타이머 취소
          
            // Popover를 body로 이동
            document.body.appendChild(el);
          
            window.FloatingUIDOM.computePosition(li, el, {
              middleware: [
                window.FloatingUIDOM.offset(10),
                window.FloatingUIDOM.inline(),
                window.FloatingUIDOM.shift(),
              ],
              placement: "right", // Popover 기본 위치를 설정
            }).then(({ x, y }) => {
              Object.assign(el.style, {
                position: "absolute", // body 기준으로 위치 설정
                left: `${x}px`,
                top: `${y}px`,
              });
          
              el.classList.add("visible");
            });
          });
          
          li.addEventListener("mouseout", (event) => {
            // 마우스가 Popover로 이동했는지 확인
            if (event.relatedTarget && el.contains(event.relatedTarget)) {
              return;
            }
          
            hidePopoverTimeout = setTimeout(() => {
              el.classList.remove("visible");
              li.appendChild(el); // Popover를 다시 부모로 이동
            }, 100); // 약간의 지연 시간 추가
          });
          
          el.addEventListener("mouseover", () => {
            // Popover에 마우스가 올라가면 숨김 타이머 취소
            clearTimeout(hidePopoverTimeout);
          });
          
          el.addEventListener("mouseout", (event) => {
            // 마우스가 li로 돌아갔다면 Popover를 닫지 않음
            if (event.relatedTarget && li.contains(event.relatedTarget)) {
              return;
            }
          
            hidePopoverTimeout = setTimeout(() => {
              el.classList.remove("visible");
              li.appendChild(el); // Popover를 다시 부모로 이동
            }, 100); // 약간의 지연 시간 추가
          });
          
          li.addEventListener("click", () => {
            if (el.classList.contains("visible")) {
              el.classList.remove("visible");
              li.appendChild(el); // Popover를 원래 위치로 복구
            }
          });
          
          // 정상 작동 코드 - popover issue
          // li.addEventListener("mouseover", () => {
          //   // fix tooltip positioning

          //   document.body.appendChild(el)

          //   window.FloatingUIDOM.computePosition(li, el, {
          //     middleware: [
          //       window.FloatingUIDOM.offset(10),
          //       window.FloatingUIDOM.inline(),
          //       window.FloatingUIDOM.shift(),
          //     ],
          //     placement: "right",
          //   }).then(({ x, y }) => {
          //     Object.assign(el.style, {
          //       position: "absolute", // body 기준으로 위치 설정
          //       left: `${x}px`,
          //       top: `${y}px`,
          //     })

          //     el.classList.add("visible")
          //   })

          //   li.addEventListener("mouseout", () => {
          //     el.classList.remove("visible")
          //     // Popover를 다시 부모로 이동
          //     li.appendChild(el)
          //   })
          // })

          // li.addEventListener("click", () => {
          //   if (el.classList.contains("visible")) {
          //     el.classList.remove("visible")
          //     li.appendChild(el) // Popover를 원래 위치로 복구
          //   }
          // })


        }
      })
  })
}
