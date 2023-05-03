---
title: "Binary Search Tree"
date: "2023-05-03 18:20"
enableToc: true
tags: [""]
weight: 3
---

<hr>

### 이진탐색트리 기본

==**이진탐색트리 (Binary Search Tree)**==
- [이진탐색(Binary Search)](brain/CS/Algo/principle/binarySearch)과 연결리스트(Linked list)를 결합한 자료구조

![](brain/image/lecture08-26.png)

- 모든 노드의 왼쪽 서브 트리는 해당 노드의 값보다 작은 값들만 가짐
- 모든 노드의 오른쪽 서브 트리는 해당 노드의 값보다 큰 값들만 가짐
- **이진 탐색 트리의 최소값** : 트리의 가장 왼쪽에 존재
	- 왼쪽 → 왼쪽 하니까 최소값 3
- **이진 탐색 트리의 최대값** : 트리의 가장 오른쪽에 존재
	- 오른쪽 1번밖에 안됨. 최대값 50

<br><br>

==**이진탐색트리 장점**==
- 삽입 / 삭제가 유연 (레퍼런스만 재조정하면 되니까)
- 값의 크기에 따라 좌우 서브트리가 나눠지기 때문에 삽입/삭제/검색이 (보통은) 빠르다
- 값의 순서대로 순회 가능 (정렬된 형태로 접근 가능하다는 말)

<br>

==**이진탐색트리 단점**==
- 트리가 구조적으로 한쪽으로 편향되면 삽입/삭제/검색 등등 수행시간이 악화됨
- 이 문제를 해결하기 위해 스스로 균형을 잡는 이진탐색트리가 사용됨
	- ex) AVL 트리, Red-Black 트리
	- 얘네는 worst case 에서도 $O(\log N)$으로 처리됨

<br>

==**이진탐색트리 시간복잡도**==

|            |     best     |   average   |    worst     |
|:----------:|:------------:|:-----------:|:------------:|
| **insert** | $\theta (1)$ | $O(\log N)$ | $\theta (N)$ |
| **delete** | $\theta (1)$ | $O(\log N)$ | $\theta (N)$ |
| **search** | $\theta (1)$ | $O(\log N)$ | $\theta (N)$ |

<br><br>

==**이진탐색트리 순회방법**==
- **전위순회 (preorder traversal)**
	1. 현재 노드 방문 (ex. 값 출력)
	2. 재귀적으로 왼쪽 서브 트리 순회
	3. 재귀적으로 오른쪽 서브 트리 순회
- ==**중위순회 (inorder traversal)**==
	1. 재귀적으로 왼쪽 서브 트리 순회
	2. 현재 노드 방문 (ex. 값 출력)
	3. 재귀적으로 오른쪽 서브 트리 순회
- **후위순회 (postorder traversal)**
	1. 재귀적으로 왼쪽 서브 트리 순회
	2. 재귀적으로 오른쪽 서브 트리 순회
	3. 현재 노드 방문 (ex. 값 출력)

<br><hr>

### 이진탐색트리 연산

**삽입**
- 그냥 값이 크면 오른쪽, 작으면 왼쪽 이거만 기억하고 넣으면 됨

![](brain/image/lecture08-37.png)

<br>

**삭제**
- 삭제하려는 노드가 있는지 먼저 검색
- 있으면 삭제
- 즉, 삭제는 검색이라는 작업이 동반됨

**자녀가 없는 노드 삭제**
- 삭제될 노드를 가리키던 레퍼런스를 가리키는 것이 없도록 처리

**자녀가 하나인 노드 삭제**
- 삭제될 노드를 가리키던 레퍼런스를 삭제될 노드의 자녀를 가리키게 변경

**자녀가 둘인 노드 삭제**
- 삭제될 노드의 오른쪽 서브트리에서 제일 값이 작은 노드가 삭제될 노드를 대체
- 만약, 왼쪽 서브트리로 정했다면 제일 값이 큰 노드가 삭제될 노드를 대체하면 됨


<br><hr>

### 이진탐색트리 구현

<br>

```java
class BinarySearchTree {  
    class Node {  
        int data;  
        Node left;  
        Node right;  
  
        public Node(int data) {  
            this.data = data;  
        }  
    }  
  
    Node root;  
  
    public Node search(Node root, int key) {  
        // leaf 노드 도착, 찾는 노드 만남  
        if (root == null || root.data == key)  
            return root;  
        // 찾는 값이 작으면 왼쪽  
        if (root.data > key)  
            return search(root.left, key);  
        // 찾는 값이 크면 오른쪽  
        return search(root.right, key);  
    }  
  
    public void insert(int data) {  
        root = insert(root, data);  
    }  
  
    public Node insert(Node root, int data) {  
        // 맨 처음 혹은 리프노드일 때도 해당됨  
        if (root == null) {  
            root = new Node(data);  
            return root;  
        }  
  
        // 루트가 null 도 아니고 리프노드에도 도착안했으면  
        if (data < root.data)  
            root.left = insert(root.left, data);  
        else if (data > root.data)  
            root.right = insert(root.right, data);  
  
        return root;  
    }  
  
    public void delete(int data) {  
        root = delete(root, data);  
    }  
  
    public Node delete(Node root, int data) {  
        if (root == null)  
            return root;  
  
        if (data < root.data)  
            root.left = delete(root.left, data);  
        else if (data > root.data)  
            root.right = delete(root.right, data);  
        // 삭제할 데이터를 찾은 경우  
        else {  
            // 자녀가 없는 경우  
            // 부모에게 그냥 null 을 반환해서 링크 끊고 그냥 삭제  
            if (root.left == null && root.right == null)  
                return null;  
            // 자녀가 하나인 경우  
            // 자녀를 그냥 위로 올려버리면 됨  
            else if (root.left == null)  
                return root.right;  
            else if (root.right == null)  
                return root.left;  
  
            // 자녀가 둘인 경우  
            // 루트의 데이터를 대체, 오른쪽 서브트리에서 제일 값이 작은 노드  
            root.data = findMin(root.right);  
            root.right = delete(root.right, root.data);  
        }  
        return root;  
    }  
  
    // 루트 노드를 받아서 계속 왼쪽으로 null 을 만날때까지 감  
    // 왼쪽 자식이 null 인 노드는 해당 트리에서 가장 작은 값이니까  
    int findMin(Node root) {  
        int min = root.data;  
        while (root.left != null) {  
            min = root.left.data;  
            root = root.left;  
        }  
        return min;  
    }  
  
    // 전위순회  
    public void preorder() {  
        System.out.println("---전위순회---");  
        preorder(root);  
        System.out.println();  
    }  
  
    private void preorder(Node root) {  
        if (root != null) {  
            System.out.print(root.data + " ");  
            preorder(root.left);  
            preorder(root.right);  
        }  
    }  
  
    // 중위순회  
    public void inorder() {  
        System.out.println("---중위순회---");  
        inorder(root);  
        System.out.println();  
    }  
  
    private void inorder(Node root) {  
        if (root != null) {  
            inorder(root.left);  
            System.out.print(root.data + " ");  
            inorder(root.right);  
        }  
    }  
  
    // 후위순회  
    public void postorder() {  
        System.out.println("---후위순회---");  
        postorder(root);  
    }  
  
    private void postorder(Node root) {  
        if (root != null) {  
            postorder(root.left);  
            postorder(root.right);  
            System.out.print(root.data + " ");  
        }  
    }  
}  
  
public class BinarySearchTreeTest {  
    public static void main(String[] args) {  
        BinarySearchTree bst = new BinarySearchTree();  

        bst.insert(4);  
        bst.insert(2);  
        bst.insert(1);  
        bst.insert(3);  
        bst.insert(6);  
        bst.insert(5);  
        bst.insert(7);  
  
        bst.preorder();  
        bst.inorder();  
        bst.postorder();  
    }  
}

// ---전위순회---
// 4 1 2 3 5 6 7 
// ---중위순회---
// 1 2 3 4 5 6 7 
// ---후위순회---
// 1 2 3 5 6 7 4

// ---전위순회---
// 4 2 1 3 6 5 7 
// ---중위순회---
// 1 2 3 4 5 6 7 
// ---후위순회---
// 1 3 2 5 7 6 4 
```