---
title: "Stack"
date: "2023-04-26 18:19"
enableToc: true
tags: [""]
weight: 1
---

<hr>

### 스택 기본개념

==**스택 (Stack) : 삽입과 삭제 연산이 LIFO로 이뤄지는 자료구조**==

![](brain/image/stack-2.png)

- LIFO (Last-In-First-Out, 후입선출) : 가장 나중에 들어온 것이 가장 먼저 나감
	- 입력과 출력이 하나의 방향으로 제한
- 바로 넣었다가 거꾸로 정렬된 데이터를 꺼내고 싶을 때 유용
	- 함수의 콜스택, 문자열 역순 출력, 연산자 후위표기법 등등
	- DFS에서도 쓰긴 하는데.. 사실 DFS는 그냥 재귀로 하는게 ...

<br>

==**스택을 구성하는 4가지 기능**==

- **`push()`** : 맨 위에 데이터를 하나 쌓아올리기
- **`pop()`** : 맨 위에 데이터를 가져오면서 **삭제**
- **`peek()`** : 맨 위에 데이터가 뭔지 보는거
- **`isEmpty()`** : 스택이 비었는지 확인

<br>

<hr>

### 스택 자바로 구현해보기

<br>

```java
import java.util.EmptyStackException;  
  
class Stack<T> {  
    class Node<T> {  
        // 제네릭 타입인 T로 data 받음  
        private T data;  
        // 다음 노드 next        
        private Node<T> next;  
  
        public Node(T data) {  
            this.data = data;  
        }  
    }  
  
    // 스택은 맨 위의 주소만 알고 있으면 되니까  
    private Node<T> top;  
  
    public void push(T item) {  
        // push 할 아이템을 가지고 Node 를 하나 생성  
        Node<T> t = new Node<T>(item);  
        // top 앞에 생성한 Node 를 위치시킴  
        t.next = top;  
        // 이제 이 push 된 Node 가 top        
        top = t;  
    }  
  
    public T pop() {  
        if (top == null) {  
            throw new EmptyStackException();  
        }  
  
        // 맨 위에 있는 데이터를 반환하기 전에  
        // 그 아래에 있는 녀석을 top 으로 만들어줘야함
        // 그래서 데이터 백업해놓는거  
        T item = top.data;  
        top = top.next;  
        return item;  
    }  
  
    public T peek() {  
        if (top == null) {  
            throw new EmptyStackException();  
        }  
        return top.data;  
    }  
  
    public boolean isEmpty() {  
        return top == null;  
    }  
}  
  
public class StackTest {  
    public static void main(String[] args) {  
        Stack<Integer> stack = new Stack<Integer>();  
        stack.push(1);  
        stack.push(2);  
        stack.push(3);  
        stack.push(4);  
        System.out.println(stack.pop());  
        System.out.println(stack.pop());  
        System.out.println(stack.peek());  
        System.out.println(stack.pop());  
        System.out.println(stack.isEmpty());  
        System.out.println(stack.pop());  
        System.out.println(stack.isEmpty());  
    }  
}

// 4
// 3
// 2
// 2
// false
// 1
// true
```

<br>

<hr>

### 스택 2개로 큐 1개 구현

- 스택의 특성을 이용하면 [큐](brain/CS/DS/queue)를 구현할 수 있다.

![](brain/image/stack-3.png)

- **Enqueue** : 큐가 `add()` 할 때 새로운 데이터를 stack1에다가 `push()`
- **Dequeue** : 큐가 `peek()`, `remove()` 호출 했을 때 stack2가 비어있으면
	1. stack1에서 `pop()`
	2. stack2에다가 `push()`
	3. stack2에서 `pop()` 해서 확인

<br>

```java
import java.util.Stack;  
  
class MyQueue<T> {  
    Stack<T> stackNew, stackOld;  
  
    MyQueue() {  
        stackNew = new Stack<T>();  
        stackOld = new Stack<T>();  
    }  
  
    public int size() {  
        return stackNew.size() + stackOld.size();  
    }  
  
    public void add(T item) {  
        stackNew.push(item);  
    }  
  
    private void shiftStack() {  
        // stackOld 가 비어있는 상태가 아닌 경우에는  
        // 데이터가 mass up 될 수도 있음  
        if (stackOld.isEmpty()) {  
            while (!stackNew.isEmpty()) {  
                stackOld.push(stackNew.pop());  
            }  
        }  
    }  
  
    public T peek() {  
        shiftStack();  
        return stackOld.peek();  
    }  
  
    public T remove() {  
        shiftStack();  
        return stackOld.pop();  
    }  
}  
  
public class StackQueueTest {  
    public static void main(String[] args) {  
        MyQueue<Integer> myQueue = new MyQueue<Integer>();  
        myQueue.add(1);  
        myQueue.add(2);  
        myQueue.add(3);  
        System.out.println(myQueue.remove());  
        System.out.println(myQueue.remove());  
        System.out.println(myQueue.remove());  
    }  
}

// 1
// 2
// 3
```