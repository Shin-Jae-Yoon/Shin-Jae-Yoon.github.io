---
title: "06. 배열과 Arrays 클래스"
date: "2023-03-29 04:13"
enableToc: true
tags: [""]
---

인프런의 <a href='https://www.inflearn.com/course/%EC%A6%90%EA%B1%B0%EC%9A%B4-%EC%9E%90%EB%B0%94' target='_blank'>부부 개발단 토토님의 즐거운 자바 강의</a>를 정리한 내용

<hr>

## 배열

- ==**참조 타입**==
- 같은 타입의 변수가 여러 개 필요할 때 사용
- ==**배열은 참조 전에 반드시 초기화를 하여야 사용 가능하다**==
	- 그렇지 않으면 참조타입은 null로 초기화되니까 ==**NullPointerException 발생**==
- 배열은 **기본형 배열**과 **참조형 배열**로 나뉨
	- 기본형 배열 : boolean, byte, short, char, int, long, float, double 타입의 변수를 여러 개 선언할 필요가 있을 때 사용
	- 참조형 배열 : 참조형 타입을 참조할 수 있는 배열

<br>

### 기본형 배열

- boolean, byte, short, char, int, long, float, double 타입의 변수를 여러 개 선언할 필요가 있을 때 사용

```java
기본형타입[] 변수명;
기본형타입 변수명[];
```

<br>

```java
public class Array01 {  
    public static void main(String[] args) {  
        int[] array1;  
        int array2[];  
        int array3[];
        // 아직 초기화하지 않았기 때문에 null을 참조
        
        array1 = new int[5];  
        array2 = new int[5];  
        array3 = new int[0];

		System.out.println(array1.length);  
		System.out.println(array2.length);  
		System.out.println(array3.length);
    }  
}

// 5
// 5
// 0
```

- array1, array2, array3은 배열을 가리킬 수 있는 변수
- `array3 = new int[0];`
	- 정수를 아무것도 가질 수 없는 배열 인스턴스를 만드는 것
	- 길이가 0인 배열

![](brain/image/fun-java06-1.png)

<br>

```java
public class Array02 {  
    public static void main(String[] args) {  
        int[] array1, array2;  
        int array3[], array4;  
    }  
}
```

- 위에껀 int 타입의 배열 array1, array2
- 아래껀 int 타입의 배열 array3, int 타입의 변수 array4
- ==**타입 뒤에 `[]`를 선언하여 모두 배열로 선언할 것이냐, 아니면 원하는 변수 뒤에 `[]`를 선언하여 원하는것만 배열로 선언할 것이냐의 차이**==

<br>

**선언과 동시에 초기화**

<br>

```java
기본형타입[] 변수명 = new 기본형타입[배열의크기];
변수명[index값] = 값;
기본형타입[] 변수명 = new 기본형타입[]{값1, 값2, ...};
기본형타입[] 변수명 = {값1, 값2, 값3, ...};
```

<br>

<details><summary><strong>코드 예시보기</strong></summary>

```java
public class Array03 {  
    public static void main(String[] args) {  
        int[] array1 = new int[5];  
        array1[0] = 1;  
        array1[1] = 2;  
        array1[2] = 3;  
        array1[3] = 4;  
        array1[4] = 5;  
  
        int[] array2 = new int[]{1, 2, 3, 4, 5};  
        int[] array3 = {1, 2, 3, 4, 5};  
  
        System.out.println("array1의 값 출력");  
        for (int i = 0; i < 5; i++) {  
            System.out.println(array1[i]);  
        }  
  
        System.out.println("array2의 값 출력");  
        for (int i = 0; i < 5; i++) {  
            System.out.println(array2[i]);  
        }  
  
        System.out.println("array3의 값 출력");  
        for (int i = 0; i < 5; i++) {  
            System.out.println(array3[i]);  
        }  
    }  
}
```
<br>

</details>

<br>

### 참조형 배열

- 배열의 타입이 기본형이 아닌 경우
- ==**배열 변수가 참조하는 배열의 공간**==이 값을 저장하는 것이 아니라 ==**값을 참조한다**==는 것을 의미

```java {title="ItemForArray.java"}
// 불변 객체  
public class ItemForArray {  
    private int price;  
    private String name;  
  
    public ItemForArray(int price, String name) {  
        this.price = price;  
        this.name = name;  
    }  
  
    public int getPrice() {  
        return price;  
    }  
  
    public String getName() {  
        return name;  
    }  
}
```

<br>

```java {title="Array04.java"}
public class Array04 {  
    public static void main(String[] args) {  
        ItemForArray[] array1;  
        ItemForArray array2[];  
        array1 = new ItemForArray[5];  
        array2 = new ItemForArray[5];  
    }  
}
```

- array1, array2 모두 참조 타입 ItemForArray 인스턴스 5개를 가리킬 수 있는 방이 만들어 진 것이지 ==**아직은 null을 참조하는 상태**==
- `array1[0] = new ItemForArray(500, "item01");`와 같이 인스턴스를 생성해야 가리킨다.

![](brain/image/fun-java06-2.png)

<br>

**선언과 동시에 초기화**

<details>
<summary><strong>코드 예시보기</strong></summary>

```java
public class Array05 {  
    public static void main(String[] args) {  
        ItemForArray[] array1 = new ItemForArray[3];  
        array1[0] = new ItemForArray(500, "사과");  
        array1[1] = new ItemForArray(300, "바나나");  
        array1[2] = new ItemForArray(900, "수박");  
  
        ItemForArray[] array2 = new ItemForArray[]{  
                new ItemForArray(500, "사과"),  
                new ItemForArray(300, "바나나"),  
                new ItemForArray(900, "수박")  
        };  
  
        ItemForArray[] array3 = {  
                new ItemForArray(500, "사과"),  
                new ItemForArray(300, "바나나"),  
                new ItemForArray(900, "수박")  
        }; 
    }  
}
```

</details>

<br>

### length

<br>

```java
public class Array06 {  
    public static void main(String[] args) {  
        double[] array1 = new double[5];  
        double[] array2 = {1.5, 2.4, 3.5};  
        double[] array3;  
        double[] array4 = null;  
        System.out.println(array1.length);  
        System.out.println(array2.length);  
        //System.out.println(array3.length);  
        //System.out.println(array4.length);    
    }  
}

// 5
// 3
// NullPointerException
// NullPointerException
```

- 참고로 array1은 기본형 타입인 double이라서 0.0으로 초기화되어있다.
- **array3은 초기화되어있지 않으니까 자연스럽게 null로 초기화**

<br>

### ArrayIndexOutOfBoundsException

<br>

```java
public class Array07 {  
    public static void main(String[] args) {  
        double[] array1 = {1.5, 2.4, 3.5};  
        System.out.println(array1[3]);  
  
        double[] array2 = new double[0];  
        System.out.println(array2.length);
        // 0
        System.out.println(array2[0]);  
    }  
}
```

- `array1[3]`, `array2[0]`을 참조하려고 하면 초기화 된 배열의 방 크기 범위를 벗어나니까 `ArrayIndexOutOfBoundsException` 발생

<br>

### 이차원 배열

<br>

```java
타입[][] 변수명 = new 타입[행의 수][열의 수];
변수명[행 인덱스][열 인덱스] = 값;
```

<br>

<details>
<summary><strong>코드 예시보기</strong></summary>

```java
public class Array08 {  
    public static void main(String[] args) {  
        int[][] array = new int[2][3];  
        array[0][0] = 0;  
        array[0][1] = 1;  
        array[0][2] = 2;  
  
        array[1][0] = 3;  
        array[1][1] = 4;  
        array[1][2] = 5;  
  
        for (int i = 0; i < array.length; i++) {  
            for (int j = 0; j < array[i].length; j++) {  
                System.out.print(array[i][j] + "\t");  
            }  
            System.out.println();  
        }  
    }  
}
```

</details>

<br>

==**이차원 배열 선언과 동시에 초기화**==

<details>
<summary><strong>코드 예시보기</strong></summary>

```java
public class Array09 {  
    public static void main(String[] args) {  
        int[][] array = {  
                {0, 1, 2},  
                {3, 4, 5}  
        };  
  
        for (int i = 0; i < array.length; i++) {  
            for (int j = 0; j < array[i].length; j++) {  
                System.out.print(array[i][j] + "\t");  
            }  
            System.out.println();  
        }  
    }  
}
```

</details>

<br>

==**이차원 가변 배열의 선언과 동시에 초기화**==

```java
타입[][] 변수명 = new 타입[행의 수][];
변수명[행 인덱스] = new 타입[열의 수];
```

<br>

<details>
<summary><strong>코드 예시보기</strong></summary>

```java
public class Array10 {  
    public static void main(String[] args) {  
        int[][] array = new int[2][];  
        array[0] = new int[2];  
        array[1] = new int[3];  
  
        array[0][0] = 0;  
        array[0][1] = 1;  
        array[1][0] = 2;  
        array[1][1] = 3;  
        array[1][2] = 4;  
  
  
        for (int i = 0; i < array.length; i++) {  
            for (int j = 0; j < array[i].length; j++) {  
                System.out.print(array[i][j] + "\t");  
            }  
            System.out.println();  
        }  
    }  
}
```

</details>

<br>

### for each문

<br>

```java
for (타입 변수명 : 배열명) {
	...
}
```

- 배열 안에 있는 것을 하나씩 꺼내서 변수명에 담아서 사용할 수 있게 됨

<br>

```java
public class Array12 {  
    public static void main(String[] args) {  
        int[] array = {1, 2, 3, 4, 5};  
  
        for (int i : array) {  
            System.out.println(i);  
        }  
    }  
}
```

<br>

```java
public class Array13 {  
    public static void main(String[] args) {  
        ItemForArray[] array = {  
                new ItemForArray(500, "사과"),  
                new ItemForArray(300, "바나나"),  
                new ItemForArray(900, "수박")  
        };  
  
        for (ItemForArray i : array) {  
            System.out.println(i.getName());  
            System.out.println(i.getPrice());  
        }  
    }  
}
```

<br>

## Arrays

- 배열을 다룰 때 사용하는 유틸리티, 자바가 제공해주는 클래스
- <a href='https://docs.oracle.com/javase/7/docs/api/java/util/Arrays.html' target='_blank'>Java Arrays API</a>를 확인해보면 static 메서드 임을 확인할 수 있다.
	- `Arrays.메서드()`로 사용하면 되겠네

<br>

### copyOf()

**`Arrays.copyOf(원본배열, 만들배열의크기)`**

<br>

```java
import java.util.Arrays;  
  
public class Array14 {  
    public static void main(String[] args) {  
        int[] copyFrom = {1, 2, 3};  
        
        int[] copyTo = Arrays.copyOf(copyFrom, copyFrom.length);  
        for (int c : copyTo) {  
            System.out.println(c);  
        }  
  
        System.out.println("----------------------------------");  
  
        int[] copyTo2 = Arrays.copyOf(copyFrom, 5);  
        for (int c : copyTo2) {  
            System.out.println(c);  
        }
        
        System.out.println("----------------------------------");  
        
		int[] copyTo3 = copyFrom;  
		for (int c : copyTo3) {  
		    System.out.println(c);  
		}
    }  
}

// 1
// 2
// 3
// ----------------------------------
// 1
// 2
// 3
// 0
// 0
// ----------------------------------
// 1
// 2
// 3
```

- `Arrays.copyOf(원본배열, 만들배열의크기)`를 이용하여 만든 copyTo는 copyFrom과는 전혀 다른 인스턴스를 가리킨다.
	- 따라서, `copyTo != copyFrom`이다.
- 그러나, `int[] copyTo3 = copyFrom;`는 copyFrom이 참조하는 인스턴스와 동일하게 copyTo가 참조한다. 따라서, `copyTo3 == copyFrom`이다.
- ==**배열을 복사한다는 것과 참조한다는 것은 전혀 다른 이야기이다.**==

> 참고로, `a == b`는 a와 b가 참조하는 것이 같냐는 것이다.

![](brain/image/fun-java06-3.png)

<br>

### copyOfRange()

**`Arrays.copyOfRange(원본배열, 시작인덱스, 끝인덱스)`**

- 시작 인덱스부터 끝 인덱스 전까지만 복사해서 배열을 만들어냄

```java
import java.util.Arrays;  
  
public class Array15 {  
    public static void main(String[] args) {  
        char[] copyFrom = {'h', 'e', 'l', 'l', 'o', '!'};  
        char[] copyTo = Arrays.copyOfRange(copyFrom, 1, 3);  
        for (char c : copyTo) {  
            System.out.println(c);  
        }  
    }  
}

// e
// l
```

<br>

### 얕은복사 vs 깊은복사

- 얕은 복사(Shallow Copy) : 같은 것을 참조
- 깊은 복사(Deep Copy) : 진짜로 복사가 이루어지게

여긴 나중에 찾아서 다시 공부하기

<br>

### compare()

**`Arrays.compare(배열1, 배열2)`**

- 리턴값이 정수인 **양수, 0, 음수**
- `x - y`의 결과이다.
	- 양수가 나오면 x가 큰 것
	- 0이 나오면 x = y
	- 음수가 나오면 y가 큰 것

![](brain/image/fun-java06-4.png)

```java
public class Array16 {  
    public static void main(String[] args) {  
        int[] array1 = {1, 2, 3, 4, 5};  
        //int[] array2 = {1, 2, 3, 4, 5};  
        //int[] array2 = {1, 2, 3, 4, 6};        
        //int[] array2 = {1, 2, 3, 4, 4};  
        int compare = Arrays.compare(array1, array2);  
        System.out.println(compare);  
    }  
}

// 0
// -1
// 1
```

<br>

### sort()

**`Arrays.sort(배열)`**

- 배열 자체를 오름차순으로 정렬해준다.
- 자바는 내부적으로 DualPivotQuickSort 방식을 채택한다.
	- 일반적인 퀵소트와 다르게 피봇을 2개 둬서 구간을 3개로 나눴음
	- 삽입정렬과 퀵소트를 섞은 것

> Best Cases : O(nlog(n))  <br>
> Average Cases : O(nlog(n))  <br>
> Worst Cases :O(n^2)

![](brain/image/fun-java06-5.png)

```java
public class Array17 {  
    public static void main(String[] args) {  
        int[] array = {5, 1, 3, 4, 2};  
  
        Arrays.sort(array);  
  
        for (int i : array) {  
            System.out.println(i);  
        }  
    }  
}

// 1
// 2
// 3
// 4
// 5
```

<br>

### binarySearch()

**`Arrays.binarySearch(배열, key)`**

- 정렬된 배열로부터 key(찾고자 하는 수)를 이진탐색으로 찾아주는 메서드
- 해당 key를 찾으면 그 위치를 return
- 해당 key를 찾지 못하면 `- Insertion Point - 1`을 리턴한다.
	- Insertion Point는 key보다 큰 최초의 위치이다.
	- 예를 들어, `{1, 3, 5, 7, 9}` 배열이 있고 key는 6이라고 하자.
	- 6보다 큰 최초의 위치는 7이니까 7의 인덱스`-3-1`하여 `-4`이 리턴된다.

```java
public class Array18 {  
    public static void main(String[] args) {  
        int[] array = {5, 1, 3, 4, 2};  
  
        Arrays.sort(array);  
  
        int i = Arrays.binarySearch(array, 3);  
        System.out.println(i);  
    }  
}

// 2
// 정렬된 배열이 {1, 2, 3, 4, 5}이고
// 3은 인덱스 2에 위치하니까
```

<br>

<hr>

## Comparable

- Comparable은 Object의 어떤 부분이 큰 지, 작은 지 기준을 정하는 Interface이다.

<br>

`Arrays.sort()` 메서드는 Object 배열도 sort가 가능하다고 나오는데, 막상 참조형 타입으로 인스턴스를 생성하고 나면 `ClassCastException`이 발생한다. 이는 정렬을 하기 위해 먼저 비교가 되어야 한다는 건데, 기준에 따라 달라지는 비교라면 정렬이 되지 않는다.

```java
public class ArraySort {  
    public static void main(String[] args) {  
        Item[] items = new Item[]{  
                new Item("java", 5000),  
                new Item("python", 4000),  
                new Item("c++", 7500),  
                new Item("javascript", 1000),  
                new Item("dart", 20000)  
        };  
  
        Arrays.sort(items);  
  
        for (Item item : items) {  
            System.out.println(item);  
        }  
    }  
}  
  
class Item {  
    private String name;  
    private int price;  
  
    public Item(String name, int price) {  
        this.name = name;  
        this.price = price;  
    }  
  
    public String getName() {  
        return name;  
    }  
    
    public int getPrice() {  
        return price;  
    }
}

// Exception in thread "main" java.lang.ClassCastException
```

<br>

### Item 내부 Comparable 구현

- Item을 비교하고자 하니 Item 클래스에 Comparable을 구현하자.
- `compareTo()` 메서드를 오버라이딩 해야한다.
	- 파라미터로 들어온 Object와 내 자신을 비교하는 메서드이다. 이때, 자기 자신과 같은 타입의 객체가 들어온다.
	- sort 할 때는 실제로 Item이 들어올 것이다.

```java
class Item implements Comparable {  

	// 편의를 위해 toString() 메서드 오버라이딩
    @Override  
    public String toString() {  
        return "Item{" +  
                "name='" + name + '\'' +  
                ", price=" + price +  
                '}';  
    }  
  
    @Override  
    public int compareTo(Object o) {  
        Item d = (Item)o;  
        return this.name.compareTo(d.name);  
    }  
  
    @Override  
    public int compareTo(Object o) {  
        Item d = (Item)o;  
        return this.price - d.price;  
    }  
}

// Item{name='c++', price=7500}
// Item{name='dart', price=20000}
// Item{name='java', price=5000}
// Item{name='javascript', price=1000}
// Item{name='python', price=4000}
```

- 위에꺼는 문자열을 기준으로 했다. 
	- 인스턴스 자기 자신의 name 문자열과 같은 타입으로 들어오는 객체의 name 문자열을 비교하여 리턴한다.
	- String 클래스 내부를 보면 거기에도 `Comparable` 인터페이스를 구현하고 있고 `compareTo()` 메서드가 있기 때문에 위와 같이 사용했다.
- 밑에꺼는 정수를 기준으로 했다.
	- 인스턴스 자기 자신의 price 정수와 같은 타입으로 들어오는 객체의 price 정수를 뺀다.
	- 자기 자신이 크면 양수, 같으면 0, 작으면 음수를 리턴한다.

<br>

### Item 외부 Comparator 구현

근데, 저렇게 Item 클래스 내부에서 compareTo를 구현하면 name을 기준으로 할 때는 밑에꺼 주석 처리, price를 기준으로 할 때는 위에꺼 주석처리 할거냐? 그럼 이상하지 않겠나. 따라서 Item 외부에서 **Comparator**를 이용하여 정렬해보자.


```java
public class ArraySort {  
    public static void main(String[] args) {  
        Item[] items = new Item[]{  
                new Item("java", 5000),  
                new Item("python", 4000),  
                new Item("c++", 7500),  
                new Item("javascript", 1000),  
                new Item("dart", 20000)  
        };  
  
        Arrays.sort(items, new ItemSorter());  
  
        for (Item item : items) {  
            System.out.println(item);  
        }  
    }  
}

class ItemSorter implements Comparator {  
    @Override  
    public int compare(Object o1, Object o2) {  
        Item item1 = (Item)o1;  
        Item item2 = (Item)o2;  
        return item1.getName().compareTo(item2.getName());  
    }  
}
```

- `Arrays.sort(배열, 정렬 방법을 정의한 객체)`와 같이 사용할 수 있다.
- Comparator를 구현하는 ItemSorter 클래스를 만들었고 여기에 정렬 방법을 정의하자.
	- Comparator 인터페이스는 `compare()` 메서드를 오버라이딩 했다.

<br>

### 람다 인터페이스

- Comparator 인터페이스에서 1개의 메서드만 사용했으니까 람다 인터페이스이다.
- 한 번 코드를 줄여보자.

<br>

1. 익명 클래스 써보기

```java
Arrays.sort(items, new Comparator() {  
    @Override  
    public int compare(Object o1, Object o2) {  
        Item item1 = (Item)o1;  
        Item item2 = (Item)o2;  
        return item1.getName().compareTo(item2.getName());  
    }});
```

<br>

2. 람다 표현식으로 바꿔보기

```java
Arrays.sort(items, (Object o1, Object o2) -> {  
    Item item1 = (Item)o1;  
    Item item2 = (Item)o2;  
    return item1.getName().compareTo(item2.getName());  
});
```

<br>

3. 사실 파라미터에 item1, item2와 같이 적어도 자동으로 유추해줌

```java
Arrays.sort(items, (item1, item2) -> {  
    return item1.getName().compareTo(item2.getName());  
});
```

<br>

4. return 문도 생략 가능

```java
Arrays.sort(items, (item1, item2) -> item1.getName().compareTo(item2.getName()));
```

<br>

<hr>

## 명령행 아규먼트 args

**명령행 아규먼트(Command-Line Arguments)** 
- 강좌에서 가장 많이 사용된 배열은 바로 main 메서드에 있는 `String[] args`이다.
- main 메서드는 JVM이 실행하는 메서드이다.
- ==**JVM이 main 메서드를 실행할 때 `String[]`을 아규먼트로 넘겨준다는 것을 의미**==

```java
public class EmptyCommandLineArgumentExam {  
    public static void main(String[] args) {  
        System.out.println(args.length);  
    }  
}

// 0
```

<br>

인텔리제이에서는 아래와 같이 Edit Configurations -> Program arguments에 아규먼트를 추가할 수 있다.

![](brain/image/fun-java06-6.png)

![](brain/image/fun-java06-7.png)

<br>

JVM이 실행 시킨 내용은 아래와 같다.
- `String[] args = new String[0];`
- `main(args);`  
- `javac EmptyCommandLineArgumentExam .java` 

만약, Program arguments에 a b c d e를 입력하면
- `java EmptyCommandLineArgumentExam a b c d e` 
	- (a b c d e가 명령행 아규먼트), 여기서는 공백을 기준으로 5개 문자열 배열  
	- `"d e"`와 같이 큰 따옴표로 묶으면 1개로 취급

<br>

실행창을 보면 아래와 같다.

![](brain/image/fun-java06-8.png)

![](brain/image/fun-java06-9.png)
- `java -javaagent:어떤설정 EmptyCommandLineArgumentExam a b c`  
	- java 명령과 클래스명 사이에 있는건 자바에 옵션 주는거  
	- 클래스명 뒤에 있는건 프로그램 아규먼트

<br>

### System.exit()의 의미

<br>

```java
public class CommandLineArgumentExam {  
    public static void main(String[] args) {  
        if (args.length == 0) {  
            System.out.println("사용법 : CommandLineArgumentExam 값 값 ...");  
            System.exit(0); // return; 으로 변경 가능  
        }  
    
        for (String arg : args) {  
            System.out.println(arg);  
        }  
    }  
}

// 사용법 : CommandLineArgumentExam 값 값 ...
```

<br>

**`System.exit(0)` 이 안에 0은 뭐를 의미할까?** 
  
Hello.java 파일 작성하고 javac Hello.java 했을 때  아무 메세지가 안나오면? 좋은거지. 에러 없이 컴파일 잘 된거니까. 명령을 실행할 때 성공하면 아무런 메시지도 출력하지 않는다는 것은 Unix의 철학이다. (참고로 Linux도 Unix의 계열)
  
- 작은 명령들을 조합해서 또 다른 명령을 만든다. (쉘 스크립트 작성)  
- 작은 명령들이 실행되고 종료될 때, 이게 성공하고 실패하는 지 궁금하다  
- 그때 사용되는 것이 `System.exit()`의 파라미터인 종료코드이다.  

<br>

![](brain/image/fun-java06-10.png)
터미널에서 `man wc`를 해보면 EXIT STATUS가 나온다. 0이면 성공, 오류가 발생하면 0보다 크다고 한다. 즉, `System.exit(0)`은 프로그램이 성공적으로 종료되었다는 의미이다.

<br>

### 제한없는 아규먼트

**제한없는 아규먼트(unlimited arguments)**
- 경우에 따라서 메서드 아규먼트를 **가변적**으로 전달하고 싶은 경우가 있다.
- 메서드에 정수값을 경우에 따라 3개, 어떤 경우에는 5개를 넘기고 싶다면 어떻게 해야할까?
- ==**제한없는 아규먼트 문법인 `...` 을 써보도록 하자.**==

```java
리턴타입 메서드명(타입... 변수명) {
	...
}
```

<br>

```java
public class UnlimitedArgumentsExam {  
    public static void main(String[] args) {  
        System.out.println(sum(5, 10));  
        System.out.println(sum(1, 2, 4, 2));  
        System.out.println(sum(3, 1, 2, 3, 4, 1));  
    }  
  
    public static int sum(int... args) {  
        System.out.println("print1 메서드 - args 길이 : " + args.length);  
        int sum = 0;  
        for (int i : args) {  
            sum += i;  
        }  
  
        return sum;  
    }  
}

// print1 메서드 - args 길이 : 2
// 15
// print1 메서드 - args 길이 : 4
// 9
// print1 메서드 - args 길이 : 6
// 14
```

- `int... args` : 정수를 여러 개 받을 수 있다는 의미, 배열로 처리된다.