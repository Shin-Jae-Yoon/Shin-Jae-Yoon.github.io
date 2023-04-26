---
title: "Queue"
date: "2023-04-26 18:19"
enableToc: true
tags: [""]
weight: 2
---

<hr>

### 큐 기본개념

==**큐 (Queue) : 삽입과 삭제 연산이 FIFO로 이뤄지는 자료구조**==

![](brain/image/queue-1.png)

- FIFO (First-In-First-Out, 선입선출) : 가장 처음에 들어온 것이 가장 먼저 나감
	- 입력을 rear, 출력을 front로 제한
		- 큐의 가장 첫 원소가 front, 끝 원소가 rear
		- 들어오는건 rear로 들어오고, 나가는건 front부터 빠지는거임
- 버퍼, 대기 큐, BFS 등 다양한 곳에서 사용됨

<br>

==**큐를 구성하는 4가지 기능**==

- **`add()`** : 맨 끝 (rear)에 데이터 추가
- **`remove()`** : 맨 앞 (front)에서 데이터 꺼내기
- **`peek()`** : 맨 앞 (front)에 데이터 보는거
- **`isEmpty()`** : 큐가 비었는지 확인

<br>

<hr>

### 큐 자바로 구현해보기

<br>

```java
import java.util.NoSuchElementException;  
  
class Queue<T> {  
    class Node<T> {  
        // 제네릭 타입인 T로 data 받음  
        private T data;  
        // 다음 노드 next        private Node<T> next;  
  
        public Node(T data) {  
            this.data = data;  
        }  
    }  
  
    // 큐는 앞, 뒤의 주소 알아야하니까  
    private Node<T> first;  
    private Node<T> last;  
  
    public void add(T item) {  
        // add 할 아이템을 가지고 Node 를 하나 생성  
        Node<T> t = new Node<T>(item);  
  
        // 마지막 Node 가 있다면 거기에 item 붙이기  
        if (last != null) {  
            last.next = t;  
        }  
  
        // 이제 t가 마지막 노드가 됨  
        last = t;  
  
        // 데이터가 없을 때  
        if (first == null) {  
            first = last;  
        }  
    }  
  
    public T remove() {  
        // 큐가 비어있으면  
        if (first == null) {  
            throw new NoSuchElementException();  
        }  
  
        // 맨 앞에 있는 데이터를 반환하기 전에  
        // 그 다음에 있는 녀석을 first 으로 만들어줘야함  
        // 그래서 데이터 백업해놓는거  
        T data = first.data;  
        first = first.next;  
  
        if (first == null) {  
            last = null;  
        }  
  
        return data;  
    }  
  
    public T peek() {  
        if (first == null) {  
            throw new NoSuchElementException();  
        }  
        return first.data;  
    }  
  
    public boolean isEmpty() {  
        return first == null;  
    }  
}  
  
public class QueueTest {  
    public static void main(String[] args) {  
        Queue<Integer> queue = new Queue<Integer>();  
        queue.add(1);  
        queue.add(2);  
        queue.add(3);  
        queue.add(4);  
        System.out.println(queue.remove());  
        System.out.println(queue.remove());  
        System.out.println(queue.peek());  
        System.out.println(queue.remove());  
        System.out.println(queue.isEmpty());  
        System.out.println(queue.remove());  
        System.out.println(queue.isEmpty());  
    }  
}

// 1
// 2
// 3
// 3
// false
// 4
// true
```