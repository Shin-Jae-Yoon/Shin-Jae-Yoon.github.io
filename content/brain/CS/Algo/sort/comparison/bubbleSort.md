---
title: "버블 정렬"
date: "2023-04-24 13:52"
enableToc: true
tags: [""]
weight: 1
---

<hr>

### 버블정렬 개념

==**버블정렬 (Bubble Sort) : 앞에서부터 2개씩 서로 인접한 원소와 비교하여, 조건에 맞지 않다면 자리를 교환하여 정렬하는 알고리즘**==
- 오름차순을 예시로, 2개씩 비교하면서 앞에가 작으면 넘어가고 앞에가 뒤에보다 크면 자리교환
- ==**시간복잡도 : $O(n^2)$**==
	- **최선** : $O(n)$ (이미 정렬된 경우 + 최적화), **평균** : $O(n^2)$, **최악** : $O(n^2)$
	- 외부 루프를 n-1번 도는 동안, n-1, n-2, ... , 1번 인접한 원소를 비교
	- $T(n) = (n-1) + (n-2) + ... + 1 = (n-1) * \frac{n}{2}$
- ==**공간복잡도 : $O(1)$**==
	- 교환(swap)을 통해 정렬이 수행되므로, 추가적인 배열 공간 필요없음
- ==**안정성&제자리성 : 안정정렬(Stable-sort), 제자리 정렬(In-place sort)**==
	- 동일한 값을 지니는 경우, 원소들의 본래 순서가 유지됨 → 안정
	- 기존 배열 이외의 추가적인 메모리를 거의 사용하지 않고 배열 안에서 교환 → 제자리

<br>

![](brain/image/gif/bubbleSort.gif)

<br><hr>

### 버블정렬 - 단순 반복

<br>

```java {title="Bubble.java"}
import java.util.Arrays;  
  
public class Bubble {  
    private static void bubbleSort(int[] arr) {  
        for (int i = 0; i < arr.length; i++) {  
            for (int j = 1; j < arr.length; j++) {
                if (arr[j - 1] > arr[j]) {  
                    int temp = arr[j - 1];  
                    arr[j - 1] = arr[j];  
                    arr[j] = temp;  
                }  
            }  
        }  
    }  
  
    public static void main(String[] args) {  
        int[] arr = {3, 5, 4, 2, 1};  
        System.out.println("Before Sorting: " + Arrays.toString(arr));  
        bubbleSort(arr);  
        System.out.println("After Sorting: " + Arrays.toString(arr));  
    }  
}
```

<br>

**swap을 메서드로 추출한 방식**

```java {title="Bubble.java"}
import java.util.Arrays;  
  
public class Bubble {  
    private static void bubbleSort(int[] arr) {  
        for (int i = 0; i < arr.length; i++) {  
            for (int j = 1; j < arr.length; j++) {  
                if (arr[j - 1] > arr[j]) {  
                    swap(arr, j - 1, j);  
                }  
            }  
        }  
    }  
  
    private static void swap(int[] arr, int preIndex, int currentIndex) {  
        int temp = arr[preIndex];  
        arr[preIndex] = arr[currentIndex];  
        arr[currentIndex] = temp;  
    }  
  
    public static void main(String[] args) {  
        int[] arr = {3, 5, 4, 2, 1};  
        System.out.println("Before Sorting: " + Arrays.toString(arr));  
        bubbleSort(arr);  
        System.out.println("After Sorting: " + Arrays.toString(arr));  
    }  
}
```

<br><hr>

### 버블정렬 - 최적화 반복

<br>

```java {title="Bubble.java"}
import java.util.Arrays;  
  
public class Bubble {  
    private static void bubbleSort(int[] arr) {  
        // 제외될 원소의 개수 의미, 맨 마지막은 정렬된 상태니까  
        for (int i = 0; i < arr.length; i++) {  
            boolean swapped = false;  
            // j는 현재 원소, j-1은 이전 원소  
            for (int j = 1; j < arr.length - i; j++) {  
                if (arr[j - 1] > arr[j]) {  
                    swap(arr, j - 1, j);  
                    swapped = true;  
                }  
            }  
            if (!swapped)  
                break;  
        }  
    }  
  
    private static void swap(int[] arr, int preIndex, int currentIndex) {  
        int temp = arr[preIndex];  
        arr[preIndex] = arr[currentIndex];  
        arr[currentIndex] = temp;  
    }  
  
    public static void main(String[] args) {  
        int[] arr = {3, 5, 4, 2, 1};  
        System.out.println(Arrays.toString(arr));  
        bubbleSort(arr);  
        System.out.println(Arrays.toString(arr));  
    }  
}
```

- swap이 발생하여 정렬이 되었는지 확인하는 불리안 변수 추가
	- 앞에서 swap이 발생하지 않았다면 정렬되었다고 간주 가능하여, break 하면됨
- 비교하는 인덱스 `j`를 `arr.length - i` 까지로 변경
	- 맨 마지막은 정렬 된거니까 빼주는거임

<br><hr>

### 버블정렬 - 재귀 구현

<br>

```java
import java.util.Arrays;  
  
public class Bubble {  
    private static void bubbleSort(int[] arr) {  
        // 배열의 주소, 배열에서 정렬이 되지 않은 부분의 마지막 인덱스  
        // 처음에는 모든 배열의 방이 정렬 안된 상태니까 마지막 인덱스 줬음  
        bubbleSort(arr, arr.length - 1);  
    }  
  
    private static void bubbleSort(int[] arr, int last) {  
        // 마지막 인덱스가 0보다 클때까지 재귀호출  
        if (last > 0) {  
            for (int i = 1; i <= last; i++) {  
                // 내 앞에 있는 애가 나보다 큰가?  
                if (arr[i - 1] > arr[i]) {  
                    // 크면 자리 바꾸기  
                    swap(arr, i - 1, i);  
                }  
            }  
            // 맨 마지막은 정렬 됐으니까 빼고 다시 버블정렬  
            bubbleSort(arr, last - 1);  
        }  
    }  
  
    private static void swap(int[] arr, int preIndex, int currentIndex) {  
        int temp = arr[preIndex];  
        arr[preIndex] = arr[currentIndex];  
        arr[currentIndex] = temp;  
    }  
  
    public static void main(String[] args) {  
        int[] arr = {3, 5, 4, 2, 1};  
        System.out.println("Before Sorting: " + Arrays.toString(arr));  
        bubbleSort(arr);  
        System.out.println("After Sorting: " + Arrays.toString(arr));  
    }  
}
```
