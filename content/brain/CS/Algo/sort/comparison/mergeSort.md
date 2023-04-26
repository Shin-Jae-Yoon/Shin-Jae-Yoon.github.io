---
title: "합병 정렬"
date: "2023-04-24 15:08"
enableToc: true
tags: [""]
weight: 4
---

<hr>

### 합병정렬 개념

==**합병정렬 (Merge Sort) : 분할 정복의 일종으로, 하나의 배열을 두 개의 균등한 배열로 분할하고 재귀적인 방식으로 분할된 배열을 각각 정렬한 다음, 이를 다시 합해서 정렬을 완성하는 알고리즘**==
- ==**시간복잡도 : $O(n \log n)$**==
	- **최선** : $O(n \log n)$, **평균** : $O(n \log n)$, **최악** :  $O(n \log n)$
	- 분할정복의 시간복잡도는 $O(\log n)$이지만, n개의 서브 배열들로 나눠야 하니까 $O(n \log n)$이 되는 것
	- 합병정렬은, pivot을 잘 선택하는 [퀵정렬](brain/CS/Algo/sort/comparison/quickSort)의 느낌이다. 최악의 경우 $O(n^2)$인 퀵정렬에 비해 합병정렬은 최악도 $O(n \log n)$이니까.
- ==**공간복잡도 : $O(n)$**==
	- 크기가 1인 n개의 서브 배열이 필요하니까
	- 따라서, 추가로 메모리 공간을 사용하기를 원치 않으면 **퀵정렬** 사용
- ==**안정성&제자리성 : 안정 정렬(Stable-sort), 제자리 정렬 ❌(Not-in-place sort)**==
	- 동일한 원소에 대하여 정렬 후 본래의 순서가 유지되니까 → 안정
	- 임시배열이라는 추가적인 메모리를 사용함 → 제자리 정렬 아님 ❌
<br>

![](brain/image/gif/mergeSort.gif)

<br>

<hr>

### 합병정렬 원리

<br>

![](brain/image/mergeSort-1.png)

더 작은 크기의 서브 문제들로 나눈 후 이들을 **재귀적**으로 같은 방식으로 해결한다고 분할정복에서 언급했었다. pseudo-code를 살펴보면,

```java
// 어디부터 어디까지인지를 파라미터로 이해
merge_sort(nums, start_index, end_index) {
	if (start_index < end_index) {
		middle_index = (start_index + end_index) / 2

		// 각각의 서브 문제들에 대하여 재귀 수행
		merge_sort(nums, start_index, middle_index)
		merge_sort(nums, middle_index + 1, end_index)

		merge(nums, start_index, middle_index, end_index)
	}
}
```

- 시작 인덱스와 끝 인덱스가 같은 순간은, 배열의 방이 1개이고 그 안에 값이 1개 있는 상황이니까 최대한 작은 서브 문제까지 나눈 상태 !

<br>

<hr>

### 합병정렬 구현

<br>

```java
import java.util.Arrays;  
  
public class MergeSort {  
    private static void mergeSort(int[] arr) {  
        int[] temp = new int[arr.length];  
        mergeSort(arr, temp, 0, arr.length - 1);  
    }  
  
    private static void mergeSort(int[] arr, int[] temp, int start, int end) {  
        if (start < end) {  
            int mid = (start + end) / 2;  
            // 절반 쪼개고 배열의 앞부분  
            mergeSort(arr, temp, start, mid);  
            // 절반 쪼개고 배열의 뒷부분  
            mergeSort(arr, temp, mid + 1, end);  
            
            // 가운데를 기준으로 왼쪽, 오른쪽이 정렬된 상태일 것이니까 이걸 합치기  
            merge(arr, temp, start, mid, end);  
        }  
    }  
  
    private static void merge(int[] arr, int[] temp, int start, int mid, int end) {  
        // 임시 배열에 복사해놓기  
        for (int i = start; i <= end; i++) {  
            temp[i] = arr[i];  
        }  
  
        // 2개의 배열은 mid 를 기준으로 하나로 붙어있음  
        // 첫 번째 배열의 첫 번째 방 - part1        
        int part1 = start;  
        
        // 두 번째 배열의 첫 번째 방 - part2        
        int part2 = mid + 1;  
        
        // 양쪽에서 작은값을 하나씩 복사할 때마다  
        // 결과 배열 방의 어디에 저장할 지 알아야 하니까  
        int index = start;  
  
        while (part1 <= mid && part2 <= end) {  
            if (temp[part1] <= temp[part2]) {  
                arr[index] = temp[part1];  
                part1++;  
            }  
            else {  
                arr[index] = temp[part2];  
                part2++;  
            }  
            index++;  
        }  
  
        // 앞의 배열은 남아있고, 뒤의 배열은 빈 상황  
        for (int i = 0; i <= mid - part1; i++) {  
            arr[index + i] = temp[part1 + i];  
        }  
  
        // 앞의 배열은 비었고, 뒤의 배열은 남아있을 때는 상관 안해도됨  
        // 이미 최종 배열의 뒤쪽에 정렬된 상태로 자리잡고 있기 때문임  
    }  
  
    public static void main(String[] args) {  
        int[] arr = {2, 13, 4, 11, 9, 8, 1, 1, 10, 5};  
        System.out.println("Before Sorting : " + Arrays.toString(arr));  
        mergeSort(arr);  
        System.out.println("After Sorting : " + Arrays.toString(arr));  
    }  
}
```