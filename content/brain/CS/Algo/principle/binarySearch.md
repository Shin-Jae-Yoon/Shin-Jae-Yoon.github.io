---
title: "이진 탐색"
date: "2023-04-26 00:31"
enableToc: true
tags: [""]
---

<hr>

### 이진탐색 개념

==**이진 탐색 (이분 탐색, Binary Search) : 정렬되어 있는 리스트에서 탐색 범위를 절반씩 좁혀가며 데이터를 탐색하는 탐색 알고리즘**==
- 배열 내부의 데이터가 정렬되어있어야 사용 가능
- [분할 정복](brain/CS/Algo/principle/divideConquer) 알고리즘을 사용한 예시
- ==**시간복잡도 : $O(\log n)$**==
	- **최선** : $O(1)$ (찾고자 하는걸 바로 찾을 때), **평균** : $O(\log n)$, **최악** : $O(\log n)$
	- 이렇게 ==**1번 처리할 때마다 검색해야하는 데이터의 양이 절반씩 떨어지는 알고리즘을 $O(\log n)$ 알고리즘이라고 함**==
		- $\log n$은 굉장히 작아서 상수에 거의 근접하다고 보면됨
		- ex) N이 10,000,000이면 $\log 10000000 = 23.253\dots$

![](brain/image/binarySearch-2.png)

- 매번 실행할 때마다 $\frac {1} {2}$씩 크기가 줄어든다. 몇 번 만에 크기가 1이 될까? 입력 크기가 N이라고 하자.

$$
N * \left( \frac{1}{2} \right)^k = \frac {N} {2^k} = 1
$$

$$
2^k = N \Rightarrow \log_2 2^k = \log_2 N
$$

$$
\therefore k = log N
$$

<br>

<hr>

### 이진탐색 - 단순 반복

<br>

```java
public class BinarySearch {  
    private static int binarySearch(int[] arr, int key, int start, int end) {  
        int mid;  
  
        while (start <= end) {  
            mid = (start + end) / 2;  
            // 탐색 성공  
            if (key == arr[mid]) {  
                return mid;  
            }  
            // key 보다 작은 부분 탐색 start ~ mid -1            
            else if (key < arr[mid]) {  
                end = mid - 1;  
            }  
            // key 보다 큰 부분 탐색 mid + 1 ~ end            
            else {  
                start = mid + 1;  
            }  
        }  
  
        // 탐색 실패  
        return -1;  
    }  
  
    public static void main(String[] args) {  
        int arr[] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};  
        System.out.println(binarySearch(arr, 3, 0, arr.length - 1));  
    }  
}

// key가 위치한 인덱스 반환, 없으면 -1 반환
```

<br>

<hr>

### 이진탐색 - 재귀 구현

<br>

```java {title="BinarySearch.java"}
public class BinarySearch {  
    private static int binarySearch(int[] arr, int key, int start, int end) {  
        // 탐색 실패  
        if (start > end)  
            return -1;  
          
        int mid = (start + end) / 2;  
  
        // 탐색 성공  
        if (key == arr[mid]) {  
            return mid;  
        }  
        // key 보다 작은 부분 탐색 start ~ mid -1        
        else if (key < arr[mid]) {  
            return binarySearch(arr, key, start, mid - 1);  
        }  
        // key 보다 큰 부분 탐색 mid + 1 ~ end        
        else  
            return binarySearch(arr, key, mid + 1, end);  
    }  
  
    public static void main(String[] args) {  
        int arr[] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};  
        System.out.println(binarySearch(arr, 3, 0, arr.length - 1));  
    }  
}

// key가 위치한 인덱스 반환, 없으면 -1 반환
```

<hr>

### 참고

- <a href='https://www.youtube.com/watch?v=tTFoClBZutw&list=PLcXyemr8ZeoQGXwikaiVxhdYRpQU4ojCu' target='_blank'>쉬운코드님의 시간복잡도 강의</a>
