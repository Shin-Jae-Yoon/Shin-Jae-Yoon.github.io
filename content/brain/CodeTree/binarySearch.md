---
title: "이진탐색"
date: "2024-10-28 22:56"
enableToc: true
tags: [""]
---

코드트리(Codetree)의 <a href='https://www.codetree.ai/curriculums/6' target='_blank'>Novice High - 자료구조 알고리즘</a>을 정리한 내용입니다.
- 그림은 해당 내용을 참고하여 그렸습니다.

<hr>

## Binary Search

- 찾아야 하는 수의 범위 중 가운데 값과 찾고자 하는 값을 비교하여 대소 관계에 따라 특정 구간으로 이동 반복
- left는 `mid + 1`이고, right는 `mid - 1`인 이유
	- mid는 target을 포함할 숫자 범위에서 명확히 제외해야하니까
- 시간 복잡도
	- 정렬된 상태 : ==**$O(log N)$**==
	- 정렬되지 않은 상태 : ==**$O(N log N + log N)$**==
	- 

```python
function binary_search(arr, target)
	set left = 0
	set right = arr.size - 1
	while (left <= right)
		set mid = (left + right) / 2
		if arr[mid] == target
			return mid

		if arr[mid] > target
			right = mid - 1
		else
			left = mid + 1

	return -1
```
