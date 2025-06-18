---
title: "자료구조"
date: "2024-08-14 22:44"
enableToc: true
tags: [""]
weight: 6
---

코드트리(Codetree)의 <a href='https://www.codetree.ai/curriculums/6' target='_blank'>Novice High - 자료구조 알고리즘</a>을 정리한 내용입니다.
- 그림은 해당 내용을 참고하여 그렸습니다.

<hr>

## ArrayList

<br>

```java
import java.util.ArrayList;

public class Main {
	public static void main(String[] args) {
		ArrayList<T> list = new ArrayList<>();
	}
}
```

- 정적 배열과는 다르게, 가변적인 배열인 ArrayList (동적 배열)
- `add(E)` : 맨 뒤에 데이터 E를 추가
- `remove(index)` : index 위치에 있는 원소 삭제
- `size()` : ArrayList에 들어있는 데이터 수 반환
- `get(index)` : index 위치에 있는 원소 반환
- 삽입, 삭제, 탐색 시간 복잡도는 정적 배열과 동일
	- 삽입 : ==**$O(N)$**==
	- 삭제 : ==**$O(N)$**==
	- 탐색 : ==**$O(1)$**==
		- Index 기반 ==**$O(1)$** ==
		- Data 기반 ==**$O(N)$**==

> [!note] **정적 배열 시간복잡도 (동적 배열과 동일)** <br>
> - 삽입 : ==**$O(N)$**==
> - 삭제 : ==**$O(N)$**==
> - 탐색 : ==**$O(1)$**==
> - Index 기반으로 접근할 시 원하는 원소에 바로 접근할 수 있기 때문에 ==**$O(1)$** ==
> - Data 기반으로 접근할 시 조건에 만족하는 Data를 찾지 못한다면 모든 원소를 한번씩 탐색해야 하기 때문에 ==**$O(N)$**==

<br>

> [!note] **Array vs ArrayList vs LinkedList** <br>
> ![](brain/image/dataStructure-47.png)
> - 해당 <a href='https://stonage.tistory.com/229' target='_blank'>게시글</a> 참조


<br>

<hr>

## LinkedList

<br>

```java
import java.util.LinkedList;

public class Main {
    public static void main(String[] args) {
        LinkedList<T> ll = new LinkedList<>();
    }
}
```

- `addFirst(E)` : 맨 앞에 데이터 E 추가
- `addLast(E)` : 맨 뒤에 데이터 E 추가
- `pollFirst()` : 맨 앞에 데이터 반환하면서 리스트에서 제거
- `pollLast()` 맨 뒤에 데이터 반환하면서 리스트에서 제거
- `size()` : 데이터 수 반환
- `isEmpty()` : list 비어있으면 true, 아니면 false
- `peekFirst()` : 맨 앞에 데이터 반환
- `peekLast()` : 맨 뒤에 데이터 반환

<br>

![](brain/image/dataStructure-35.png)

- 하나의 Node는 Data와 다른 Node로 이동하는 경로를 가지고 있음
- 배열과는 다르게 삽입과 삭제가 자주 일어나는 상황에 용이
	- 삽입 : ==**$O(1)$**==
	- 삭제 : ==**$O(1)$**==
	- 탐색 : ==**$O(N)$**==
- <a href='/brain/CodeTree/dataStructure/#single-linked-list'>단일 연결리스트 (Single Linked List)</a>
- <a href='/brain/CodeTree/dataStructure/#double-linked-list'>이중 연결리스트 (Double Linked List)</a>

<br>

### Single Linked List

![](brain/image/dataStructure-36.png)

- 연결 방향이 단방향
- next에 null이 있으면 연결이 끊어진 상태
	- 즉, 이는 노드를 삭제하는 과정에서 유용함
- ==`head` : 리스트가 시작되는 지점==
	- ex) 리스트의 모든 값을 탐색해야 하는 상황에 시작점을 모르면 모든 값을 탐색했는지 판단할 수 없으니까 head가 필요한 것
- ==`tail` : 리스트가 종료되는 지점==
	- ex) 종료 지점을 명시해놓으면 탐색할 때 추가적인 처리 없이 현재 방문한 노드가 종료 지점인지 판단하는 과정만 거치고 탐색을 종료할 수 있음
- 단일 연결리스트는 head → tail 단방향으로, tail에 도달하면 다시 뒤로 돌아갈 수 없음
- 시간 복잡도
	- 삽입 : ==**$O(1)$**==
	- 삭제 : ==**$O(1)$**==
	- 탐색 : ==**$O(N)$**==
		- 탐색은 Head부터 Tail까지 일일이 확인해야함

<br>

==**단일 연결리스트 tail 뒤에 신규 노드 삽입**==

![](brain/image/dataStructure-37.png)

```
function SLL.insert_end(num)
  set new_node = node(num)       # Step 1. 노드 만들기
  SLL.tail.next = new_node       # Step 2. 이어 붙이기
  SLL.tail = new_node            # Step 3. Tail 변경하기
```

<br>

==**단일 연결리스트 head 앞에 신규 노드 삽입**==

![](brain/image/dataStructure-38.png)

```
function SLL.insert_front(num)
  set new_node = node(num)       # Step 1. 노드 만들기
  new_node.next = SLL.head       # Step 2. 이어 붙이기
  SLL.head = new_node            # Step 3. Head 변경하기
```

<br>

==**단일 연결리스트 head 뒤에 신규 노드 삽입**==
- head 바로 뒤에 노드를 추가하는 것은 조금 복잡함 
- 연결을 아무 생각 없이 끊어버리게 되면 예상치 못한 결과가 나올 수 있어서

1. 새로운 노드 생성

	![](brain/image/dataStructure-34.png)

<br>

2. 새로운 노드의 next 값을 head의 next 값으로 설정

	![](brain/image/dataStructure-33.png)

<br>

3. head의 next 값을 새로운 노드로 변경

	![](brain/image/dataStructure-32.png)

<br>

4. 최종

	![](brain/image/dataStructure-31.png)

<br>

```
function SLL.insert_after_head(num)
  set new_node = node(num)            # Step 1. 노드 만들기
  new_node.next = SLL.head.next       # Step 2. 새로운 노드의 next 값 변경
  SLL.head.next = new_node            # Step 3. Head의 next 값 변경
```

<br>

==**단일 연결리스트 삭제**==
- 삭제하게 되는 노드의 ==**바로 전 노드**==에서 그 다음 노드로 연결관계를 바꿔줘야 한다는 것
- ex) tail을 삭제하는 과정
	- tail 바로 전 노드의 next 값을 null로 변경
	- tail을 그 전으로 옮기기

<br>

==**단일 연결리스트 tail 삭제**==

![](brain/image/dataStructure-30.png)

- tail 바로 전 노드의 next 값 → null로 변경
- tail 옮기기

<br>

==**단일 연결리스트 head 삭제**==

![](brain/image/dataStructure-29.png)

- head의 값을 head.next로 지정
- 실제로 값을 삭제하지는 않았지만, 노드가 정상적으로 삭제된 것처럼 보임

<br><br>

### Double Linked List

![](brain/image/dataStructure-28.png)

- 연결 방향이 양방향
- 삽입/삭제 시 앞/뒤 연결 모두 변경해야함

<br>

![](brain/image/dataStructure-27.png)

<br><br>

### Iterator

- Iterator(반복자)는 연결리스트 내의 노드를 가리키는 역할
- Iterator를 이용해 prev, next 값을 활용하여 특정 위치를 지정할 수 있음
- 최초에 k번째 위치 찾는건 ==**$O(N)$**== 이후 바로 옆에 삽입/삭제/탐색은 ==**$O(1)$**==

<br>

1. ==`hasNext()` 순회==

```java
import java.util.LinkedList;
import java.util.ListIterator;

public class Main {
    public static void main(String[] args) {
        LinkedList<Character> l = new LinkedList<>(); 
        l.add('a');             // l : ['a']
        l.add('b');             // l : ['a', 'b']
        l.add('c');             // l : ['a', 'b', 'c']

        // Iterator를 이용한 list 내의 원소들 순회 (맨 앞에서 시작)
        ListIterator<Character> it = l.listIterator();

        while(it.hasNext())               // 'a' 'b' 'c'
            System.out.print(it.next());  // next는 뒤로 이동하면서 값을 반환
    }
}
```

<br>

2. ==`hasPrevious()` 순회==

```java
import java.util.LinkedList;
import java.util.ListIterator;

public class Main {
    public static void main(String[] args) {
        LinkedList<Character> l = new LinkedList<>();
        l.add('a');             // l : ['a']
        l.add('b');             // l : ['a', 'b']
        l.add('c');             // l : ['a', 'b', 'c']

        // Iterator를 이용한 list 내의 원소들 순회 (맨 뒤에서 시작)
        ListIterator<Character> it = l.listIterator(l.size());

        while(it.hasPrevious())               // 'c' 'b' 'a'
            System.out.print(it.previous());  // previous는 앞으로 이동하면서 값을 반환
    }
}

```

<br>

==**Iterator 주요 메서드**==

- `next()`, `previous()`
	- `next()`는 뒤에서 ==앞으로== 이동
	- `next()`는 `hasNext()`가 true인 경우에만 사용
	- `previous()`는 앞에서 ==뒤로== 이동
	- `previous()`는 `hasPrevious()`가 true인 경우에만 사용
- `remove()`
	- `next()`를 진행했던 원소 제거
	- ==`remove()`전에 `next()`가 반드시 선행되어야 함==
- `add()`
	- iterator 위치에 새로운 원소 E 추가

<br>

```java
import java.util.LinkedList;
import java.util.ListIterator;

public class Main {
    public static void main(String[] args) {
        LinkedList<Character> l = new LinkedList<>(); 
        l.add('a');
        l.add('b');
        l.add('c');

        // iterator를 list의 맨 앞에 위치시킴
        ListIterator<Character> it = l.listIterator();
        System.out.println(it.next());      // 원소 값을 한 칸 뒤로 이동 ('a')
        System.out.println(it.next());      // 원소 값을 한 칸 뒤로 이동 ('b')
        System.out.println(it.previous());  // 원소 값을 한 칸 앞으로 이동 ('b')
        System.out.println(it.previous());  // 원소 값을 한 칸 앞으로 이동 ('a')

        it.next();                          // remove 전에 next 필요
        it.remove();                        // 원소 'a'를 제거
        it.add('d');                        // 원소 'd'를 추가
        
        // list에 들어있는 원소 값을 순서대로 출력합니다.
        it = l.listIterator();
        while(it.hasNext()) {               // 'd' 'b' 'c' q
            System.out.print(it.next());    // 원소 값을 출력하며 한 칸 뒤로 이동합니다.
        } 
    }
}

```

<br><br>

### Circular Linked List

- 원형 연결리스트는 연결리스트를 원 형태로 구현한 모습
- 기존 연결리스트의 head와 tail만 연결하면 됨
- `head.prev = tail`이 되기에 굳이 tail을 들고 있을 필요가 없음
- 그래서 보통 head만 놔둠
- head에서 next를 계속 반복하면 다시 head에 도달함

![](brain/image/dataStructure-26.png)

<br>

<hr>

## Stack

<br>

```java
import java.util.Stack;

Stack<T> stack = new Stack<>();

// Stack은 class, 구현체 그 자체 (Vector 상속)
```

- LIFO (Last In First Out)
- 위에서부터 쌓아가는 자료구조
- `push(E)` : E를 스택 맨 위에 넣기
- `size()` : 스택에 쌓인 블럭 개수 반환
- `isEmpty()` : 스택 맨 위에 비어있으면 true, 아니면 false
- `peek()` : 스택 맨 위에 값 반환
- `pop()` : 스택 맨 위에 값 반환하면서 블럭 제거
- 삽입 삭제 시간복잡도 ==**$O(1)$**==

```python
function push(arr, E)
  if arr.size == maxsize          // 배열에 이미 원소들이 가득 채워져 있으면
    throw exception()             // 예외처리
  arr.append(E)                   // 정상적인 상황이라면, E를 
                                  // 마지막 위치에 추가


function pop(arr) 
  if arr.size == 0                // 배열에 아무런 원소도 없다면
    throw exception()             // 예외처리
  set last = arr[arr.size - 1]    // 정상적인 상황이라면, 마지막 값을 변수에 저장
  delete arr[arr.size - 1]        // 맨 끝에 있는 값을 실제로 제거
  return last                     // 마지막에 있었던 값을 반환
```

<br>

> [!note] 배열을 스택처럼 쓸 수 있음 <br>
> - 배열의 삽입 삭제 시간 복잡도는 ==**$O(N)$**==
> - 만약, 배열의 맨 뒤에다가 값을 넣고 빼면 스택처럼 사용할 수 있겠네
> - 다만 그 공간은 남아있어야겠네
> - 혹은, 연결리스트를 써서 스택처럼 쓸 수도 있음 !
> - 연결리스트는 모든 연산에 대해 시간복잡도 ==**$O(1)$**== 이니까

<br>

<hr>

## Queue

<br>

```java
import java.util.Queue;
import java.util.LinkedList;

// Queue는 interface, LinkedList는 class (구현체)
Queue<T> queue = new LinkedList<>();

// Queue<T> queue = new Queue<>();
// 이렇게 작성 시 당연히 오류나겠지 ?
```

- FIFO (First In First Out)
- `add(E)` : E를 맨 뒤(rear)에 추가
- `size()` : 큐에 들어있는 데이터 개수 반환
- `isEmpty()` : 큐가 비어있으면 true, 아니면 false
- `peek()` : 맨 앞(front)에 있는 값 반환
- `poll()` : 맨 앞(front)에 있는 값 반환하면서 제거
- 삽입 삭제 시간복잡도 ==**$O(1)$**==

> [!note] 배열을 큐처럼은? <br>
> - 배열 맨 앞에 삽입 + 맨 뒤에 삭제하면 시간복잡도 ==**$O(N)$**==
> - 큐처럼 쓰기에는 무리가 있음
> - 근데 맨 앞이나 뒤에서 삽입 삭제가 일어날 때 ==**$O(1)$**==인거 있잖아
> - → 연결리스트 !

> [!note] 큐를 스택처럼 사용하려면? <br>
> - 큐 2개를 이용해서 사용 가능
> - 15 35 20 순서로 데이터 삽입
> - 스택은 15 35 20 (아래에서 위)
> - 첫 번째 큐는 20 35 15 (왼쪽에서 오른쪽)
> - 스택의 pop을 구현하기 위해, 첫번째 큐에서 가장 마지막에 들어온 20을 제외한 나머지를 두번째 큐로 이동하고 빼면 됨

```
function Stack.push(q, val)
  q.push(val)

function Stack.pop(q)
  set new_q = empty queue
  while q.size() != 1
    new_q.push(q.pop())
  set top = q.pop()
  q = new_q
  return top
```


<br>

<hr>

## Deque

<br>

```java
import java.util.Deque;
import java.util.ArrayDeque;

public class Main {
    public static void main(String[] args) {
        Deque<Integer> dq = new ArrayDeque<>();
    }
}

// Deque는 interface, ArrayDeque는 class (구현체)
```

- 덱은 스택과 큐의 특성을 합친 자료구조
- 덱은 스택처럼 큐처럼 둘다 사용 가능, 메서드가 지원됨 (<a href='https://docs.oracle.com/en/java/javase/14/docs/api/java.base/java/util/ArrayDeque.html' target='_blank'>오라클</a>)
- ==맨 앞, 맨 뒤에서 삽입/삭제 모두 가능==
- 삽입/삭제 시간복잡도 ==**$O(1)$**==
- `addFirst(E)` : 맨 앞에 데이터 E 추가
- `addLast(E)` : 맨 뒤에 데이터 E 추가
- `pollFirst()` : 맨 앞에 데이터 반환하면서 덱에서 제거
- `pollLast()` : 맨 뒤에 데이터 반환하면서 덱에서 제거
- `size()` : 덱에 있는 데이터 개수 반환
- `isEmpty()` : 덱이 비어있다면 true, 아니면 false 반환
- `peekFirst()` : 맨 앞에 데이터 반환
- `peekLast()` : 맨 뒤에 데이터 반환

<br>

<hr>

## Vector, Stack 권장하지 않는 이유

<br>

출처 : <a href='https://vanslog.io/posts/language/java/why-use-deque-instead-of-stack/' target='_blank'>[Java] 왜 Stack 대신 Deque를 사용하는가?</a>

<br>

| **비교**    | **Vector**  | **ArrayList** |
| ----------- | ----------- | ------------- |
| 동기화 처리 | O           | X             |
| 쓰레드 안전 | O           | X             |
| 성능        | 비교적 느림 | 비교적 빠름   |
| 용량 증가   | 2배         | 1.5배              |

- Vector
	- 동기화한 메서드로 구성되어 멀티스레드 환경에서 안전
	- 단일스레드 환경에서는 동기화 처리에 대한 오버헤드로 성능 하락
- ArrayList
	- 동기화처리 하지 않으니 단일스레드 환경에서 성능 좋음
	- 멀티스레드 환경에서는 동기화 처리를 위해 `Collections.synchronizedList` 이용

<br>

| **비교**    | **Stack**   | **ArrayDeque** |
| ----------- | ----------- | -------------- |
| 동기화 처리 | O           | X              |
| 쓰레드 안전 | O           | X              |
| 성능        | 비교적 느림 | 비교적 빠름               |

- Vector, ArrayList와 Stack, ArrayDeque는 유사한 관계
- 다만, ArrayDeque는 ArrayLIst 처럼 동기화처리를 위한 메서드 존재 X
	- `Collections.synchronizedDeque` 이런건 없음
	- 그러나, 아래의 코드처럼 멀티스레드 환경에서 동기화처리 가능

```java
class SyncStack<E> {
    private final Deque<E> stack = new ArrayDeque<>();

    public synchronized void push(E e) {
        stack.push(e);
    }
}
```

<br>

<hr>

## Tree

![](brain/image/dataStructure-14.png)

- **노드** : 각 지점, **정점**이라고도 부름
	- 루트 노드 : 트리에서 부모가 없는 최상위 노드, 트리의 시작점
	- 부모 노드 : 루트 노드 방향으로 직접 연결된 노드
	- 자식 노드 : 루트 노드 반대방향으로 직접 연결된 노드
	- 형제 노드 : 같은 부모 노드를 갖는 노드들
	- 리프 노드 : 차수가 0인 노드, 자식이 없는 노드, 단말 노드라고도 부름
- **간선** : 두 노드를 연결하는 선, **엣지**
- **차수** : 각 노드의 자식 개수
- **깊이** : 루트 노드와 얼마나 떨어져있는지
- **높이** : 트리에서 깊이가 가장 깊은 노드의 깊이
- 레벨은 논문에 따라 0부터 시작하거나 1부터 시작하거나 둘 중 하나

<br>

![](brain/image/dataStructure-15.png)

- **Unrooted Tree**
	- 이렇게 부모-자식 관계가 정의되어있지 않아도 트리라고 부름
	- 트리의 원래 정의는 ==노드끼리 전부 연결되어 있으면서 사이클이 존재하지 않는 **그래프**==
	- 위의 그림처럼 루트 노드가 설정되어 있는 트리는 **Rooted Tree**

<br>

![](brain/image/dataStructure-25.png)

- 노드끼리 전부 연결되어있지 않거나, 사이클이 존재하므로 위의 예시는 **트리가 아님**

<br><hr>

### Binary Tree

![](brain/image/dataStructure-19.png)

- **이진트리** : 자식의 수가 최대 2인 트리
- 이진트리는 배열로 구현 가능
- ==특정 노드의 위치 `i`인 경우, 그 노드의 왼쪽 자식은 `i * 2`, 오른쪽 자식은 `i * 2 + 1`==
	- ==그럼 자식의 입장에서 부모는? `i / 2` 겠네==

```
// 1은 루트노드
// 2는 왼쪽 자식
// 3은 오른쪽 자식

Index 0  1  2  3  4  5  6  7
Array -  5  3  3  4  7  8  9
```

<br><br>

![](brain/image/dataStructure-20.png)

- 방문하는 순서에 따라 탐색을 구현할 수 있음 (전위, 중위, 후위)
- **전위 탐색 (Preorder Traversal)** : 부모 → 왼쪽 → 오른쪽
	- 1 - 2 - 5 - 4 - 3 - 6 - 8 - 7
- **중위 탐색 (Inorder Traversal)** : 왼쪽 → 부모 → 오른쪽
	- 2 - 4 - 5 - 1 - 3 - 6 - 8 - 7
- **후위 탐색 (Postorder Traversal)** : 왼쪽 → 오른쪽 → 부모
	- 4 - 5 - 2 - 8 - 6 - 7 - 3 - 1

```
function Preorder(n)
	visit(n)
	Preorder(n.left)
	Preorder(n.right)

function Inorder(n)
	Inorder(n.left)
	visit(n)
	Inorder(n.right)

function Postorder(n)
	Postorder(n.left)
	Postorder(n.right)
	visit(n)
```

<br><hr>

### Binary Search Tree

![](brain/image/dataStructure-21.png)

![](brain/image/dataStructure-22.png)

- 이진 탐색 트리의 특성
	- 부모의 왼쪽 방향에 있는 노드들은 전부 부모보다 값이 작음
	- 부모의 오른쪽 방향에 있는 노드들은 전부 부모보다 값이 큼
	- 시간 복잡도 (삽입/삭제/탐색)
		- 균형 잡히지 않은 이진 탐색 트리의 경우 : ==**$O(N)$**==
		- 균형 잡힌 이진 탐색 트리의 경우 : ==**$O(log N)$**==
			- ex) Red Black Tree, AVL Tree
			- 노드를 회전과 같은 작업을 통해 트리의 높이를 ==**$log N$**==으로 유지할 수 있음
	- **이진 탐색 트리를 중위 탐색하면 정렬된 순서대로 값이 나옴**

<br>

- ==**이진 탐색 트리 - 탐색**==

```
function bst.search(x)
    set node = bst.root                     // root에서 시작
    while node != null and node.value != x  // node의 값 == x까지 계속 반복
        if node.value > x                   // node의 값 > x이면
            node = node.left                // 왼쪽 자식으로 내려와 탐색진행 
        else                                // node의 값 < x이면
            node = node.right               // 오른쪽 자식으로 내려와 탐색진행
    
    return node                             // 최종 위치를 반환
```

<br>

- ==**이진 탐색 트리 - 삽입**==
	- 데이터 삽입 과정은, 부모를 계속 업데이트하면서 내려가면 됨
	- Case 1. 부모가 비어있는(null) 인 경우 → root를 node(x)로 설정
	- Case 2. 부모의 값이 삽입하려는 값보다 큰 경우 → 부모의 왼쪽에 node(x) 삽입
	- Case 3. 부모의 값이 삽입하려는 값보다 작은 경우 → 부모의 오른쪽에 node(x) 삽입

```
function bst.insert(x)
    set node = bst.root          // root에서 시작
    set parent = bst.root        // parent도 root로 설정하고 시작

    while node != null           // node가 null이 되기 전까지 반복
        parent = node            // parent는 node가 움직이기 직전 위치로 갱신 
        if node.value > x        // node의 값 > x이면
            node = node.left     // 왼쪽 자식으로 이동 
        else                     // node의 값 < x이면
            node = node.right    // 오른쪽 자식으로 이동
    
    if parent == null            // Case 1. 비어있는 tree이면
        bst.root = node(x)       // root를 node(x)로 설정.
    else if parent.value < x     // Case 2. parent의 값 < x이면
        parent.left = node(x)    // parent의 왼쪽에 node(x) 삽입
    else                         // Case 3. parent의 값 > x
        parent.right = node(x)   // parent의 오른쪽에 node(x) 삽입

```

<br><br>

- ==**이진 탐색 트리 - 삭제**==
	- Case 1. 삭제하려는 값 노드의 왼쪽 노드가 비어있음 → 오른쪽 노드 올려주기
	- Case 2. 삭제하려는 값 노드의 오른쪽 노드가 비어있음 → 왼쪽 노드 올려주기
	- Case 3. 삭제하려는 값 노드의 왼쪽 오른쪽 노드 전부 채워짐 → successor 찾기
		- successor(후임자) : 현재 노드 기준으로 더 크면서 가장 작은 값을 갖는 노드
		- 현재 노드보다 크니까, 오른쪽부터 시작해서 왼쪽으로 계속 내려가면 됨
		- successor의 값을 node로 옮겨주고 successor의 오른쪽 자식을 전부 올려
		- successor가 노드 바로 오른쪽에 있으면 node 지우고 그대로 오른쪽 노드 전체를 위로 올려

```
function bst.search(x)
    set node = bst.root                     
    while node != null and node.value != x 
        if node.value > x                
            node = node.left           
        else                               
            node = node.right           
    
    return node            


function bst.minimum(node)             // node 하위 트리에서 최솟값 구해
    while node.left != null            // node.left != null이면 내려가
        node = node.left
    return node                        // 최종 node의 위치를 반환합니다.


function bst.delete(x)                 // x를 찾아 삭제하는 함수
    set node = bst.search(x)                // x 값 찾기
    
    if node.left == null               // Case1. node의 왼쪽자식 비어있으면
        move(node.right, node)         // 오른쪽 자식을 위로 올려
    else if node.right == null         // Case2. node의 오른쪽자식 비어있으면
        move(node.left, node)          // 왼쪽 자식을 위로 올려
    else                               // Case3. 왼쪽 오른쪽 자식이 풀이면
        set succ = bst.minimum(node.right)  // successor를 구해
        
        // successor는 현재 노드의 오른쪽 자식에서 시작하여 계속 왼쪽으로 내려가면 됨
        if succ == node.right          // successor가 노드의 오른쪽 자식이면 
            move(node.right, node)     // 오른쪽 자식을 위로 올려
        else                           // 그렇지 않은 일반적인 경우라면
            node.value = succ.value    // node의 값 successor 값으로 대체
            move(succ.right, succ)     // successor의 오른쪽 자식을 위로 올려

```

<br><hr>

### Heap

- 힙은 이진 트리의 특별한 형태
	- 완전 이진트리 모양
	- 트리의 높이 ==**$log N$**==
- 최대 힙(max-heap), 최소 힙(min-heap) 둘 중 하나
- 특정 수가 추가되거나 삭제될 때, heap 구조를 유지하려면 ==**$O(log N)$**== 만큼 소요됨
	- ==**최대 최소값을 찾는 시간복잡도 $O(1)$이 가능하게 함**==

<br>

**완전 이진 트리**

![](brain/image/dataStructure-23.png)

- 트리의 모든 값이 비는 것 없이 왼쪽부터 순서대로 차 있는 형태

<br><br>

==**최대 힙(max-heap)**==

![](brain/image/dataStructure-24.png)

- 완전 이진 트리를 띄면서, 모든 노드에 대해 부모 노드가 자신의 자식 노드가 갖는 값보다 같거나 큰 경우를 만족하는 경우
- 루트 노드에는 전체 숫자 중 최댓값이 들어있음
- 시간 복잡도
	- 최대 힙 만드는 데에 ==**$O(N)$**==
	- 최댓값 탐색 ==**$O(1)$**==
	- 삽입/삭제 ==**$O(log N)$**==
		- 완전 이진 트리에서의 삽입/삭제니까
- 최대 힙에서의 삭제는 **루트 노드**에서만 가능
- k번째 최댓값을 구할 수  ❌
	- 루트 노드를 제외하고 다른 원소가 어느 위치에 있는 지 알 수 없음

<br><br>

==**힙 만들기**==

- $n / 2$번째 원소부터 거꾸로 1번째 원소까지 **heapify** 진행
-  heapify : 현재 노드를 기준으로 heap 특성에 맞을 때까지 계속 밑으로 내려주는 과정
	1. `현재 노드 위치 = i` , `왼쪽 자식 노드 = i * 2` , `오른쪽 자식 노드 = i * 2 + 1` 세 노드 중 가장 큰 노드를 largest 라고 한다.
	2. `largest 노드`가 `i`가 아니라 자식 노드라면, `현재 노드(i)`와 `자식 노드(largest)`의 값을 교환
	3. 만약 `largest 노드`가 `현재 노드(i)` 이면 종료
- 힙은 트리의 높이가 $log N$ 이니까 heapify 과정은 1번 일어날 때, 최대 $log N$번까지 가능
- 최대 힙(max-heap) 만들 때, $n / 2$ 개의 원소에 대해 heapify 과정을 거침
- 각 노드별로 최대로 움직이게 되는 횟수를 합해보면 시간복잡도 ==**$O(N)$**== 소요
- 예시

	![](brain/image/dataStructure-39.png)

	- `n = 7` 이므로, `n / 2 = 3`이니까 `heapify(3)`부터 진행
	- `heapify(3)` 진행
		- largest 노드는 7번 노드이므로, 3번 노드와 교환하고 `heapify(7)` 진행
		- 다만, 7번 노드는 자식이 없으므로 heapify 종료
	- `heapify(2)` 진행
		- largest 노드는 5번 노드이므로, 2번 노드와 교환하고 `heapify(5)` 진행
		- 다만, 5번  노드는 자식이 없으므로 heapify 종료
	- `heapify(1)` 진행
		- largest 노드는 3번 노드이므로, 1번 노드와 교체하고 `heapify(3)` 진행
		- `heapify(3)`에서 다시 largest 노드가 6번 노드이므로, 3번 노드와 교체하고 `heapify(6)` 진행
		- 다만, 6번 노드는 자식이 없으므로 heapfiy 종료
- 최종 모습

	![](brain/image/dataStructure-40.png)

<br>

```
function heapify(arr[], n, i)
  set largest = i                     // 최대 노드를 i번이라 가정
  set l = i * 2                       // 왼쪽 자식 노드 번호
  set r = i * 2 + 1                   // 오른쪽 자식 노드 번호

  if l <= n && arr[l] > arr[largest]  // 왼쪽 자식이 크면, 최대 번호를 수정
    largest = l

  if r <= n && arr[r] > arr[largest] // 오른쪽 자식이 크면, 최대 번호를 수정
    largest = r

  if largest != i                   // 최대 노드가 자식 노드라면
    swap(arr[i], arr[largest])      // 해당 자식과 현재 노드를 교환
    heapify(arr, n, largest)        // 내려간 위치에서 다시 heapify 진행
```

<br>

```
function build_heap(arr[], n)
  for i = n / 2 ... i >= 1      // n / 2번째 원소부터 1번째 원소까지 돌며
    heapify(arr, n, i)         // heapify 과정을 진행하여 max-heap 만듦
```

<br><br>

==**최대 힙 - 삽입**==

- 트리 맨 끝에 삽입하고, 현재 노드 기준 부모와 값을 계속 비교하며, 부모가 더 작으면 교환
- 삽입의 시간 복잡도는 트리의 높이와 관련, 따라서 ==**$O(log N)$**==

```
function insert(arr[], n, x)
  arr.append(x)                          // 가장 끝에 노드 x를 추가

  set i = n + 1                          // 마지막 노드에서 시작
  while i > 1 and arr[i / 2] < arr[i]    // 부모가 자식보다 값이 작은 경우라면
                                         // max-heap 조건에 어긋나므로
    swap(arr[i], arr[i / 2])             // 두 값을 교환하고
    i = i / 2                            // 부모 위치로 올라감
```

<br>

==**최대 힙 - 삭제**==

- 루트 노드 값 삭제하면, 빈 자리가 남을 것
- 빈 자리에 트리의 끝 값을 넣고 난 이후에도 max-heap 특성 유지해야하니까 heapify 진행
- n번 노드를 1번 노드로 바로 올린 것이니까 반드시 **`heapify(1)`** 진행
- heapify 과정의 시간 복잡도가 ==**$O(log N)$**== 이므로, 삭제 또한 마찬가지

```
function heapify(arr[], n, i)
  set largest = i                     // 최대 노드를 i번이라 가정
  set l = i * 2                       // 왼쪽 자식 노드 번호
  set r = i * 2 + 1                   // 오른쪽 자식 노드 번호

  if l <= n && arr[l] > arr[largest]  // 왼쪽 자식이 크면, 최대 번호를 수정
    largest = l

  if r <= n && arr[r] > arr[largest] // 오른쪽 자식이 크면, 최대 번호를 수정
    largest = r

  if largest != i                   // 최대 노드가 자식 노드라면
    swap(arr[i], arr[largest])      // 해당 자식과 현재 노드를 교환
    heapify(arr, n, largest)        // 내려간 위치에서 다시 heapify 진행


function remove(arr[], n)
  arr[1] = arr[n]                   // 가장 끝 노드를 루트 노드로 이동
  delete arr[n]                     // 가장 마지막 노드를 삭제
  heapify(arr, n - 1, 1)            // 루트 노드 기준으로 heapify를 진행
                                    // max-heap 상태 계속 유지됨 
```

<br>

<hr>

## Hasing

![](brain/image/dataStructure-41.png)

- 해싱, 해시 함수
	- ==**들어온 순서 상관 없이** 삽입/삭제/탐색 자주 발생할 때 사용하기 좋음==
	- 임의의 데이터를 받아, 해당 데이터를 고정된 길이의 특정 값으로 반환하는 함수
	- 어떤 값을 넣더라도 특정 범위에 해당하는 값 반환
	- ex) 해시 함수의 반환값을 0부터 시작하는 양의 정수로 설정한 상황
		- 특정 값 → 해시함수 → 해시함수의 반환 값에 해당하는 인덱스 → 배열의 인덱스에 해당하는 위치에 값 저장
	- 해시 충돌 자체를 줄이기 위해, 일반적으로 들어갈 최대 데이터의 3~4배 정도의 크기로 해시 테이블을 설정함
	- 시간 복잡도 : 해시 함수를 1번만 통과하여 나온 인덱스만 관리하면 됨
		- 탐색 : ==**$O(1)$**==
		- 삽입 : ==**$O(1)$**==
		- 삭제 : ==**$O(1)$**==

```
function append(key, value)
  set index = hash_function(key)
  hash[index] = value
  
function find(key)
  set index = hash_function(key)
  if hash[index] != null
    return hash[index]
    
function remove(key)
  set index = hash_function(key)
  if hash[index] == null
    return 
  hash[index] = null
```


> [!note] 해싱이 만능은 아니다 <br>
> - 문자열, 숫자 등 대응 가능한 타입이 많다
> - 다만, 배열의 경우 배열 내 값의 개수가 불분명해서 해시 함수에서 배열을 다루지 않음

<br><br>

==**대표적인 해시 함수**==

- <a href='https://dbehdrhs.tistory.com/70' target='_blank'>고니님 블로그</a> 참조
- <a href='https://ratsgo.github.io/data%20structure&algorithm/2017/10/25/hash/' target='_blank'>ratsgo's blog</a> 참조
- <a href='https://velog.io/@stresszero/hash-table#%EC%B6%A9%EB%8F%8C-%ED%95%B4%EA%B2%B0-%EA%B8%B0%EB%B2%95' target='_blank'>개발자 강세영</a> 참조
- <a href='https://dev-kani.tistory.com/2' target='_blank'>개발자 카니</a> 참조

1. **Division Method (제산법)** : 나눗셈과 나머지 연산자 이용, 입력 값(key)을 테이블의 크기로 나눈 나머지를 반환
	- `hash_index = key % M`
	- M은 해시 테이블의 크기인데, 소수(prime number)로 설정 시 해시 주소가 좋은 효율을 가짐
		- M이 짝수라면 메모리 주소는 대부분 짝수이므로, 해시 함수값 또한 짝수가 나올 것	
		- 소수로 하게 된다면, 0 ~ M - 1을 골고루 사용하는 값을 만들어냄
		- 특히 2의 제곱수와 거리가 먼 소수를 사용한 해시 함수가 좋은 성능을 냄

2. **Digit Folding (폴딩법)** : 입력 값(key)을 몇 개의 부분으로 나누어 더하거나 비트별로 XOR 연산하여 해시 주소로 사용
	- `hash_index = (short)(key ^ key >> 16)` 
	- key가 문자열일 경우 ASCII 코드로 바꿔서 연산

3. **Multiplication Method (곱셈법)** : 숫자로 된 입력 값(key)이 k이고, A는 0~1 사이의 실수일 때, 보통 2의 제곱수인 m을 활용하여 계산하고 해시 주소로 사용
	- `h(k) = (kA % 1) * m`

4. **Mid-Square (중간 제곱법)** : 키 값을 제곱한 후에 중간의 몇 자리를 선택하여 그 중간 값을 해시 주소로 사용

5. **Radix Conversion (기수 변환법)** : 입력 값(key)을 다른 진법으로 변환하여 얻은 값을 해시 주소로 사용

6. **Digit Analysis(숫자 분석법)** : 입력 값(key) 각각의 위치에 있는 숫자 중 편중되지 않은 수들을 해시 테이블의 크기에 적합한 만큼 조합해 해시 주소로 사용

7. **Universal Hasing (무작위 해싱)** : 다수의 해시함수를 만들고 이 해시함수의 집합 H에서 무작위로 해시함수를 선택해 해시 주소로 사용

<br><br>

==**대표적인 해시 알고리즘**==

- MD(메시지 출력) 시리즈, SHA 시리즈, RIPEMD, WhirlPool
- MD4 : MD5의 초기 버전으로, 입력 데이터(길이에 상관없는 하나의 메시지)로부터 128비트 메시지 축약을 만듦으로써 데이터 무결성을 검증하는데 사용되는 알고리즘
- MD5 : 널리 사용된 해시 알고리즘이지만, 충돌 회피성에서 문제점 이 있다는 분석이 있으므로 기존의 응용과의 호환으로만 사용하고 더 이상 사용하지 않도록 하고 있음
- SHA : 가장 많이 사용되고 있는 방식이다. SHA1은 DSA에서 사용하도록 되어 있으며 많은 인터넷 응용에서 default 해시 알고리즘으로 사용된다. SHA256, SHA384, SHA512 는 AES의 키 길이인 128, 192, 256 비트에 대응하도록 출력 길이를 늘인 해시 알고리즘이다.

<br>

<hr>

### Hash collision

- <a href='https://dev-kani.tistory.com/1' target='_blank'>개발자 카니</a> 참조

![](brain/image/dataStructure-42.png)

- ==**해시 충돌**==
	- 해시 함수를 적용해 생성된 배열의 고유한 index가 동일해서 충돌이 발생하는 상황
	- 가장 쉬운 해결 방법으로는 인덱스에 **연결 리스트**를 적용
		- 다만, 충돌 횟수가 증가하면 연결리스트를 순회해야해서 삽입/삭제/탐색 시간복잡도가 $O(N)$이 됨
		- 이렇게 되면 해싱을 써야할 이유가 없어짐
		- 결국 충돌이 최대한 덜 일어나게 적절한 해시 함수 적용하는 것이 중요

<br>

- ==**해시 충돌 해결방법**==
	- Separata chaining (분리 연결법, 체이닝)
	- Open Addressing (개방 주소법)

<br>

- ==**Separata chaining (분리 연결법, 체이닝)**==
	![](brain/image/dataStructure-44.png)
	- 연결 리스트를 사용하여 관리
	- 즉, 추가적인 메모리를 이용하는 방식
	- 연결 리스트가 쌓이면 탐색에 $O(N)$ 소요
	- 데이터가 채워짐에 따라 성능 저하 발생

<br>

- Separata chaining 상세한 내용
	- 연결리스트를 이용하여 관리
		- key에 매핑된 index가 가리키는 LinkedList에 Node를 추가하여 Value 추가
	- 데이터의 주소 값(index)이 변경되지 않음
	- 부하율이 100%에 가까울수록 삽입/삭제/탐색의 효율이 매우 낮아진다.
		- 부하율 (Load Factor) : 전체 버킷에서 사용 중인 버킷의 비율
	- 해시 함수를 선택하는 관점에서 클러스터링(Clustering)에 거의 영향을 받지 않기에 충돌의 최소화만 중점적으로 보면 됨
	- 해시 테이블의 버킷이 채워져도 성능 저하가 선형적으로 발생

<br>

- ==**Open Addressing (개방 주소법)**==
	![](brain/image/dataStructure-45.png)
	- 추가적인 메모리를 사용하는 Chaining 방식과 다르게 **비어있는 해시 테이블의 공간을 활용하는 방법**
	- ==선형 탐사법 (Linear Probing)== : 해시충돌 시 다음 버킷 또는 비어 있지 않다면 몇 개 건너뛰어 데이터를 삽입
	- ==제곱 탐사법 (Quadratic Probing)== : 해시충돌 시 제곱만큼 건너뛴 버킷에 데이터를 삽입
	- ==이중 해시법 (Double Hasing)== : 해시충돌 시 한번 더 적용해서 나온 버킷에 데이터 삽입
	- n차 충돌 발생 가능, 메모리 효율 높음, 다른 자료구조가 필요 ❌, 데이터가 적을 때 유리
	- 데이터 삭제 시, 삭제된 공간은 Dummy Space로 활용되기에 Hash Table을 재정리 해주는 작업이 필요

<br>

- Open Addressing 상세한 내용
	- 연결 리스트(Linked List)같은 추가적인 메모리를 사용하지 않고 해시 테이블(Hash Table)의 빈 버킷(Bucket)을 이용하는 방법
	- 데이터의 주소 값(index) 바뀜
		- 충돌 발생 시, 다른 버킷에 저장하니까
	- 특히, 선형 검색법에서 체이닝 방식보다 뛰어난 참조 지역성(Locality of reference)을 가짐
		- 이러한 특성으로 LoopUp 연산에서 특히 좋은 성능
	- 테이블에 모두 저장될 수 있고, 캐시 라인에 적합할 수 있을 정도로 데이터의 크기가 작을수록 성능이 좋아짐
	- 삭제의 경우 충돌에 의해 뒤에 저장된 데이터가 검색되지 않을 수 있음
		- 이를 방지하기 위해 삭제한 위치에 Dummy Node를 삽입
		- Dummy Node는 실제 값을 가지지는 않지만, 검색할 때 다음 위치(인덱스)까지 연결해주는 역할
		- 삭제가 빈번히 일어날 경우 Dummy Node 수가 많아져서, 검색할 경우에 많은 버킷(Bucket)을 연속적으로 검색해야 하기 때문에 이 Dummy Node의 개수가 일정 수 이상이 되었을 경우에 주기적으로 새로운 배열을 만들려고 재해시(Rehash)를 해줘야 성능을 유지할 수 있음

- Linear Probing 상세한 내용
	- 충돌 발생시 새로운 키(Key)를 저장할 기억공간을 찾기 위해 충돌이 일어난 그 위치에서 선형적으로 검색하여 첫 번째 빈 영역에 키를 저장하는 방법
	- 현재의 버킷 index로부터 고정된 폭만큼 이동하여 차례대로 검색
	- 테이블의 끝에 도달하게 되면 처음으로 되돌아 감
	- 조사를 시작한 위치로 되돌아 오게 되면 테이블이 가득찬 것
	- 장점 : 구조가 간단하고 캐시의 효율이 높음
	- 단점 : 최악의 경우 해시 테이블(Hash Table) 전체를 검색해야 하는 상황이 발생할 수 있으므로 비효율적이고, 데이터의 클러스터링(Clustering)에 가장 취약

- Quadratic Probing 상세한 내용
	- Linear Probing에서 발생하는 제1밀집(primary clustering) 문제를 제거하는 방법
	- 같은 해시 값을 갖는 키(Key)에 대해서는 제2밀집(secondary clustering) 발생
	- 해시의 저장순서 폭을 제곱으로 저장하는 방식
	- 원래 저장할 위치로부터 1, 4, 9, 16, ... 과 같이 떨어진 영역을 차례대로 검색하여 첫번째 빈 영역에 키를 저장하는 방법
	- 캐시 효율과 클러스터링(Clustering) 방지 측면에서 Linear Probing과 Double Hashing의 중간 정도의 성능

- Double Hasing 상세한 내용
	- 하나의 해시 함수(Hash Function)에서 충돌이 발생하면 2차 해시 함수를 이용해 검색 이동 거리를 얻는 방법
	- 캐시 효율은 떨어지지만 클러스터링(Clustering)에 영향을 거의 받지 않음
	- 가장 많은 연산량을 요구

<br>

<hr>

### Java Hash collision

<a href='https://d2.naver.com/helloworld/831311' target='_blank'>Naver D2의 Java HashMap은 어떻게 동작하는가?</a> 필수로 보기

![](brain/image/dataStructure-43.png)

- 각각의 Key 값에 해시함수 적용 이후 배열의 고유한 index를 생성하고, 이 index를 활용해 값을 저장하거나 검색하는데, 이때 ==**내부적으로 저장되는 배열을 버킷**==이라고 함
- 서로 다른 key 들이 같은 hash를 가지는 경우 충돌함

<br>

**HashTable 에서의 충돌**
- `hf(key1) != hf(key2)` 이지만, `hf(key1) % M == hf(key2) % M` 인 경우
- 즉, 서로 다른 key에 대하여 제산법을 적용시킨 결과가 동일한 경우

<br>

**Hash Collision 발생 이유**
- 완벽한 해시 함수 구현의 어려움
	- Boolean같이 서로 구별되는 객체의 종류가 적거나, Integer, Long, Double 같은 Number 객체는 객체가 나타내려는 값 자체를 해시 값으로 사용할 수 있기 때문에 완전한 해시 함수 대상으로 삼을 수 있음
	- 하지만 String이나 POJO(plain old java object)에 대하여 완전한 해시 함수를 제작하는 것은 사실상 불가능
	- → 그래서, 보조 해시 함수를 사용하기도 함
- key의 크기에 비해, hash table의 크기가 작기 때문

<br>

==**Java에서의 Hash Collision 해결**==
- JDK 7 이전 : LinkedList를 사용한 **Separata Chaining 활용**
- JDK 8 이후 : LinkedList와 Red-Black Tree를 혼용한 **Separata Chaining 활용**
	- 충돌을 한 key-value 쌍이 적을 때 : LinkedList로 작동
	- 충돌을 한 key-value 쌍이 임계치에 도달 : Red-Black Tree로 작동
- LinkedList의 최악은 $O(N)$ 이지만, RBT의 최악은 $O(log n)$ 이니까 성능적으로 개선됐다고 볼 수 있음

![](brain/image/dataStructure-46.png)

- JDK 8에서는 슬롯(Slot)의 갯수가 8개 이하일 경우 연결 리스트(Linked List)를 사용하며 그 이상의 경우는 레드 블랙 트리(RBT) 구조를 사용하여 검색의 효율을 높임
-  **부하율(Load Factor, 전체 버킷에서 사용중인 버킷의 비율)이 100%에 가까울수록 삽입, 삭제, 검색의 효율이 비약적으로 낮아진다**는 설명을 위에서 했었는데, 보통 80%로 제한한다.
	- Java의 HashMap의 경우에는 75%로 제한한다.

<hr>

### HashMap

<br>

```java
import java.util.HashMap;

public class Main {
	public static void main(String[] args) {
		HashMap<K, V> m = new HashMap<>();
	}
}
```

- `m.put(K, V)` : HashMap에 쌍(Key, Value) 추가
- `m.remove(K)` : key가 K인 쌍을 찾아서 제거
- `m.get(K)` : key가 K인 쌍을 찾아서 value인 V를 반환
	- `m.containsKey(K)` 를 확인하여 true 인 경우에만 get을 사용
	- 해당하는 쌍이 없으면 에러가 발생하기 때문
	- `m.getOrDefault(K, D)` 쓰면 해당하는 쌍이 없으면 D를 기본으로 반환해줌