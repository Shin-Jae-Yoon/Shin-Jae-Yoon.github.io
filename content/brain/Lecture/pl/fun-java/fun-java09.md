---
title: "09. Java I/O"
date: "2023-04-07 21:23"
enableToc: true
tags: [""]
---

인프런의 <a href='https://www.inflearn.com/course/%EC%A6%90%EA%B1%B0%EC%9A%B4-%EC%9E%90%EB%B0%94' target='_blank'>부부 개발단 토토님의 즐거운 자바 강의</a>를 정리한 내용

<hr>

## Java I/O

**I/O는 Input, Output이다.**
- Input & Output, 입출력
- 입력은 **키보드, 네트워크, 파일** 등으로부터 받을 수 있음
- 출력은 **화면, 네트워크 파일** 등에 할 수 있음

<br>

**Java IO도 객체다.**
- Java IO에서 제공하는 객체는 자바 세상에서 사용되는 객체이다.
- Java IO가 제공하는 객체는 어떤 대상으로부터 읽어들여, 어떤 대상에게 쓰는 일을 한다.

<br>

### Decorator 패턴

![](brain/image/fun-java09-1.png)

- Java IO는 **조립되어 사용**되도록 만들어졌다.
	- Decorator 패턴으로 만들어졌다.
	- 연관관계 UML에 대한 참조는 [여기](brain/Lecture/pl/fun-java/fun-java07.md)
	- 그냥 화살표는 일반화, 마름모는 집합관계
	- ==**Decorator는 Component를 가질 수 있다.**==
		- ==**이 말은 Decorator의 생성자는 Component를 받아들일 수 있게 되어있다는 것**==
		- 이 말은 컴포넌트를 상속받고 있는 것들도 가질 수 있다. (ConcreteComponent)
- 강사님 표현에 따르면 ConcreteComponent가 주인공, Decorator가 장식

<br>

**주인공과 장식을 구분할 수 있어야 한다.**
- 장식은 ==**InputStream, OutputStream, Reader, Writer**==를 생성자에서 받아들인다.
	- 이 네 가지가 ==**Component 역할을 수행**==
	- **추상 클래스라 new로 인스턴스 생성 불가**
- 주인공은 어떤 대상에게서 읽어들일지, 쓸지를 결정
- 주인공은 1byte or `byte[]` 단위로 읽고 쓰는 메서드를 가짐
- 주인공은 1char or `char[]` 단위로 읽고 쓰는 메서드를 가짐
- 장식은 다양한 방식으로 읽고 쓰는 메서드를 가짐

<br>

**Java IO 클래스는 생성자가 중요하다.**
- 장식(Decorator)은 InputStream, OutputStream, Reader, Writer를 생성자에서 받아들인다. 주인공은 생성자에서 위 4개를 받아들이지 않는다.

==**정리하자면, InputStream, OutputStream, Reader, Writer이 생성자에 있으면 Decorator(장식) 없으면 ConcreteComponent(주인공)**==

<br>

### Java IO의 특수한 객체

<a href='https://docs.oracle.com/javase/8/docs/api/java/lang/System.html' target='_blank'>System 클래스 api</a>를 참고하자.

- `System.in` : 표준 입력 (InputStream)
- `System.out` : 표준 출력 (PrintStream)
- `System.err` : 표준 에러 출력 (PrintStream)

![](brain/image/fun-java09-4.png)

예를 들어, System 클래스의 in 필드의 타입은 InputStream이다.

<br>

### Java IO의 클래스 상속도

![](brain/image/fun-java09-2.png)

<a href='https://docs.oracle.com/javase/7/docs/api/java/io/package-summary.html' target='_blank'>Java api I/O 문서</a>를 참고하면서 보자.

- **4가지 추상 클래스 InputStream, OutputStream, Reader, Writer**가 가장 중요
	- 들어가서 보면 `public abstract class InputStream`이라고 보일 것

==**Java IO 클래스 이름이 굉장히 중요하다.**==

<br>

| 클래스 이름                                | 기능                                                                                                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stream으로 끝나는 클래스                   | byte 단위 입출력 클래스                                                                                                                                           |
| InputStream으로 끝나는 클래스              | byte 단위로 입력을 받는 클래스                                                                                                                                    |
| OutputStream으로 끝나는 클래스             | byte 단위로 출력을 하는 클래스                                                                                                                                    |
| Reader로 끝나는 클래스                     | 문자 단위로 입력을 받는 클래스                                                                                                                                    |
| Writer로 끝나는 클래스                     | 문자 단위로 출력을 하는 클래스                                                                                                                                    |
| File로 시작할 경우 <br> (File 클래스 제외) | File로부터 입력이나 출력을 하는 클래스                                                                                                                            |
| ByteArrary로 시작할 경우                   | 입력 클래스의 경우 byte 배열로부터 읽어 들이고, <br> 출력 클래스의 경우 클래스 내부의 자료구조에 출력을 <br> 한 후 출력된 결과를 byte 배열로 반환하는 기능을 가짐 |
| CharArray로 시작할 경우                    | 입력 클래스의 경우 char 배열로부터 읽어 들이고, <br> 출력 클래스의 경우 클래스 내부의 자료구조에 출력을 <br> 한 후 출력된 결과를 char 배열로 반환하는 기능을 가짐 |
| Filter로 시작할 경우                       | Filter로 시작하는 입출력 클래스는 직접 사용하는 것 <br> 보다는 상속받아 사용하며, 사용자가 원하는 내용만 <br> 필터링할 목적으로 사용됨                            |
| Data로 시작할 경우                         | 다양한 데이터 형을 입출력 할 목적으로 사용한다. <br> 특히 기본형 값 (int, float, double 등)을 출력하는데 <br> 유리하다.                                           |
| Buffrered로 시작할 경우                    | 프로그램에서 Buffer라는 말은 메모리를 의미한다. <br> 입출력 시에 병목현상을 줄이고 싶을 경우 사용한다.                                                            |
| RandomAccessFile                           | 입력이나 출력을 모두 할 수 있는 클래스로써, 파일에서 <br> 임의의 위치의 내용을 읽거나 쓸 수 있는 기능을 제공                                                                                                                                                                  |

<br>


### BufferedReader 클래스

**키보드로부터 한 줄씩 입력받고, 한 줄씩 화면에 출력하시오.**
- 키보드 : `System.in`은 주인공, InputStream 타입
- 화면 : `System.out`은 주인공, PrintStream 타입
- 키보드로 입력받는다는 것은 문자를 입력받는 것, char 단위 입출력
	- char 단위 입출력 클래스는 Reader, Writer

![](brain/image/fun-java09-5.png)

- 한줄 읽기 : BufferedReader 클래스는 `readLine()` 메서드를 이용해 한 줄씩 입력 받음
	- 더 이상 읽어들일 것이 없으면(EOF, End Of File) null 반환
- 한줄 쓰기 : PrintStream, PrintWriter
- BufferedReader 클래스의 생성자를 보면 Reader.in이 들어와야하네. 얘는 장식이네
	- InputStream, OutputStream, Reader, Writer은 추상 클래스라서 인스턴스 생성이 불가능했잖아? 그럼 Reader를 상속받는 어떤 녀석을 찾아야겠네.

![](brain/image/fun-java09-6.png)

- Reader를 상속받는 InputStreamReader 클래스의 생성자를 보면 InputStream이 들어오네.
- System.in이 주인공이고, 타입이 InputStream이었으니까 딱 맞네!


<br>

```java
import java.io.BufferedReader;  
import java.io.IOException;  
import java.io.InputStreamReader;  
  
public class KeyboardIOExam {  
    public static void main(String[] args) throws IOException {  

        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));  
        String line = null;  
        while ((line = br.readLine()) != null) {  
            System.out.println("읽어들인 값 : " + line);  
        }  
    }  
}
```

- 종료하려면 cmd + d 누르면 EOF라고 알려줘서 null 반환받고 프로그램 종료

<br>

### File 클래스

- `java.io.File` 클래스는 파일의 크기, 파일의 접근 권한, 파일의 삭제, 이름 변경 등의 작업을 할 수 있는 기능을 제공
	- 주의해야 할 것은 디렉토리(폴더) 역시 파일로써 취급됨
- 여기서도 역시 주인공이 중요하다.

- txt 파일로부터 한 줄씩 입력받아 화면에 출력한다.  
	- 입력 주인공 : 파일, 출력 주인공 : 화면
- 키보드로부터 한 줄씩 입력받아 파일에 출력한다.  
	- 입력 주인공 : 키보드, 출력 주인공 : 파일
- txt 파일로부터 한 줄씩 입력받아 다른 파일에 한 줄씩 출력한다.
	- 입력 주인공 : 파일, 출력 주인공 : 파일

<br>

**File 클래스 생성자**

| 생성자                            | 내용                                                    |
| --------------------------------- | ------------------------------------------------------- |
| File(File parent, String child)   | parent 디렉토리에 child 라는 파일에 대한 File 객체 생성 |
| File(String child)                | child 라는 파일에 대한 File 객체 생성                   |
| File(String parent, String child) |      parent 디렉토리에 child 라는 파일에 대한 File 객체 생성                                                   |

- 파일 인스턴스를 만들었다고, 실제 폴더에 파일이 생성되는 것은 아니다.

<br>

**File 클래스 중요 메서드**

| 메서드                    | 내용                                                |
| ------------------------- | --------------------------------------------------- |
| boolean canRead()         | 파일이 읽기 가능하면 true, 아니면 false 반환        |
| boolean canWrite()        | 파일이 쓰기 가능하면 true, 아니면 false 반환        |
| boolean createNewFile()   | 지정한 파일이 없을 경우 파일 생성                   |
| boolean delete()          | 파일 삭제, 디렉토리일 경우에는 비어있을 경우에 삭제 |
| void deleteOnExit()       | JVM이 종료될 때 파일을 삭제                         |
| boolean exists()          | 파일이 존재하면 true, 없으면 false                  |
| String getAbsolutePath()  | 파일의 절대 경로를 문자열로 반환                    |
| String getCanonicalPath() | 파일의 전체 경로를 문자열로 반환                    |
| String getName()          | 파일이나 디렉토리의 이름 반환                       |
| String getParent()        | 부모 경로에 대한 경로명을 문자열로 반환             |
| File getParentFile()      | 부모 디렉토리를 File의 형태로 반환                  |
| String getPath()          | 파일의 경로를 문자열의 형태로 반환                  |
| boolean isDirectory()     | 디렉토리면 true, 아니면 false 반환                                                    |

<br>

**예제 - java Fileinfo**

```java
import java.io.File;  
import java.io.IOException;  
  
public class FileInfo {  
    public static void main(String[] args) {  
        if (args.length != 1) {  
            System.out.println("사용법 : FileInfo 파일이름");  
            System.exit(0);  
        }   // if end  
  
        File f = new File(args[0]);  
  
        // 파일이 존재할 경우  
        if (f.exists()) {  
            System.out.println("length : " + f.length());  
            System.out.println("canRead : " + f.canRead());  
            System.out.println("canWrite : " + f.canWrite());  
            System.out.println("getAbsolutePath : " + f.getAbsolutePath());  
  
            try {  
                System.out.println("getCanonicalPath : " + f.getCanonicalPath());  
            } catch (IOException e) {  
                System.out.println(e);  
            }  
  
            System.out.println("getName : " + f.getName());  
            System.out.println("getParent : " + f.getParent());  
            System.out.println("getPath : " + f.getPath());  
        }  
  
        // 파일이 존재하지 않을 경우  
        else {  
            System.out.println("파일이 존재하지 않습니다.");  
        }  
    }  
}
```

<br>

**예제 - java FileDelete**

```java
import java.io.File;  
  
public class FileDelete {  
    public static void main(String[] args) {  
        if (args.length != 1) {  
            System.out.println("사용법 : java FileDelete 파일이름");  
            System.exit(0);  
        }   // if end  
  
        File f = new File(args[0]);  
          
        if (f.exists()) {  
            boolean deleteflag = f.delete();  
            if(deleteflag)  
                System.out.println("파일 삭제를 성공하였습니다.");  
            else  
                System.out.println("파일 삭제를 실패하였습니다.");  
        } else {  
            System.out.println("파일이 존재하지 않습니다.");  
        }  
    }  
}
```

<br>

**예제 - FileList**
- `ls -la` 같은거

```java
public class FileList {  
    public static void main(String[] args) {  
        File file = new File("/Users/jaeyoon/Desktop");  
        printFiles(file);  
    }  
  
    private static void printFiles(File file) {  
        if (file.isDirectory()) {  
            File[] files = file.listFiles();  
            for (int i = 0; i < files.length; i++) {  
                System.out.println("[dir] - " + files[i]);  
                printFiles(files[i]);  
            }  
        } else {  
            System.out.println(file.getName());  
        }  
    }  
}
```

<br>

**예제 - 임시파일 생성**

```java
import java.io.File;  
import java.io.IOException;  
  
public class TempFile {  
    public static void main(String[] args) {  
        try {  
            File f = File.createTempFile("tmp_", ".dat");  
            System.out.println(f.getAbsolutePath());  
            System.out.println("10초 동안 멈춰있습니다.");  
  
            try {  
                Thread.sleep(10000); // 10초 동안 프로그램 멈춤  
            } catch (InterruptedException e) {  
                System.out.println(e);  
            }  
  
            f.deleteOnExit();   // JVM이 종료될 때 임시파일을 자동으로 삭제  
        } catch (IOException e) {  
            System.out.println(e);  
        }  
    }  
}

// /var/folders/mc/pg8hsl1s6ng960_zspk455cc0000gn/T/tmp_17714656951715397422.dat
//  10초 동안 멈춰있습니다.
```

<br>

## IO Stream

- ==**byte나 char의 흐름을 IO Stream이라 한다.**==
- byte의 흐름은 Byte Stream
	- 추상 클래스
	- InputStream, OutputStream
	- byte 단위 입출력 클래스는 전부 InputStream, OutputStream의 후손
- char의 흐름을 Char Stream
	- 추상 클래스
	- Reader, Writer
	- char 단위 입출력 클래스는 전부 Reader, Writer의 후손

![](brain/image/fun-java09-7.png)

![](brain/image/fun-java09-8.png)

![](brain/image/fun-java09-9.png)

![](brain/image/fun-java09-10.png)

![](brain/image/fun-java09-11.png)

![](brain/image/fun-java09-12.png)

![](brain/image/fun-java09-13.png)

![](brain/image/fun-java09-14.png)

- `read(byte[])`가 아니라 `read(char[])`임

![](brain/image/fun-java09-15.png)

- `write(byte[])`가 아니라 `write(char[])`임

<br>

### InputStream

<br>

**InputStream이 가지는 중요 메서드**

| 메서드명                                     | 내용                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `int available() throws IOException`         | 현재 읽을 수 있는 바이트 수 반환                                                                              |
| `void close() throws IOException`            | 입력 스트림 닫음                                                                                              |
| **`int read() throws IOException`**              | 입력 스트림에서 한 바이트 읽어서 int로 반환 <br> 더이상 읽을 내용 없으면 -1 반환                              |
| `int read(byte buf[]) throws IOException`    | 입력 스트림에서 `buf[]` 크기만큼 읽어 buf에 저장하고 읽은 바이트 수 반환 <br> 더이상 읽을 내용 없으면 -1 반환 |
| `int skip(long numBytes) throws IOException` | numBytes로 지정된 바이트 무시, 무시된 바이트 수 반환                                                                                                              |

<br>

### InputStream - read()

<br>

```java
import java.io.IOException;  
import java.io.InputStream;  
  
public class InputStreamExam01 {  
    public static void main(String[] args) {  
        InputStream in = null;  
        try {  
            int data = in.read();  
        } catch (IOException e) {  
            System.out.println("io 오류 : " + e);  
        } finally {  
            try {  
                in.close();  
            } catch (Exception e) {  
                System.out.println("io 오류 : " + e);  
            }  
        }  
    }  
}
```

위의 코드를 보면, InputStream 클래스는 byte 단위 입출력이라면서 `read()` 메서드는 왜 정수형 int일까?

==**Q. byte 단위로 읽어들이는 read() 메서드가 왜 byte를 return 하지 않고 int를 return 하나?**  ==
- A. 1byte의 범위인 (00000000 ~ 11111111) 만으로는 EOF를 표현할 수 있는 방법이 없어서.

1byte가 표현할 수 있는 값은 8bits니까 00000000 ~ 1111111 중 하나이다. 만약 byte를 return 한다면 이 범위 중 하나의 값을 가졌을 것이다. 만약 파일 크기가 100byte라면 1byte씩 100번 읽어들이면 될 것임을 알 수 있는데, **파일 크기를 모른다면 몇 번 만큼 읽어야 할까?**

그래서 파일의 마지막임을 알릴 EOF(End Of File)이라는 것이 필요하게 되었다. 이 EOF를 표현하기 위해 정수 -1을 사용하려고 했는데 1byte로 이를 표현할 수 있는가? 그래서 int형이 4byte니까 이를 이용하여 EOF를 표현한 것이다.

- int(4byte) 1 : 00000000 00000000 00000000 00000001
- 1의 보수 : 11111111 11111111 11111111 11111110
- 2의 보수
	- 1의 보수 + 1
	- 11111111 11111111 11111111 11111111 = -1

<br>

### InputStream OutputStream

<br>

```java {title="HelloIO01.java"}
import java.io.FileOutputStream;  
import java.io.OutputStream;  
  
public class HelloIO01 {  
    public static void main(String[] args) throws Exception {  
        OutputStream out = new FileOutputStream("/Users/jaeyoon/Desktop/hello01.dat");  
        out.write(1); // 0000 0000  0000 0000   0000 0000   0000 0001  
        out.write(255);  
        out.write(0);  
        out.close();  
    }  
}
```

- 3 바이트 크기의 파일이 생성됨. 1바이트씩 3번이니까

<br>

```java {title="HelloIO02.java"}
import java.io.FileInputStream;  
import java.io.InputStream;  
  
public class HelloIO02 {  
    public static void main(String[] args) throws Exception {  
        InputStream in = new FileInputStream("/Users/jaeyoon/Desktop/hello01.dat");  
        int i1 = in.read();  
        System.out.println(i1); // 1  
        int i2 = in.read();  
        System.out.println(i2); // 255  
        int i3 = in.read();  
        System.out.println(i3); // 0  
        int i4 = in.read();  
        System.out.println(i4); // -1, 파일의 끝 EOF        in.close();  
    }  
}
```

- 3바이트 파일을 3번 읽으니까 정상적으로 값이 나옴
- 1번 더 읽으려고 하면 -1이 나옴. EOF니까

<br>

```java
import java.io.FileInputStream;  
import java.io.InputStream;  
  
public class HelloIO02 {  
    public static void main(String[] args) throws Exception {  
        InputStream in = new FileInputStream("/Users/jaeyoon/Desktop/hello01.dat");  
        int buf = -1;  
        while ((buf = in.read()) != -1) {  
            System.out.println(buf);  
        }  
        in.close();  
    }  
}
```

- 이렇게 하면 EOF 전까지 계속 출력해주는거임

<br>

### Reader Writer

<br>

```java {title="HelloIO03.java"}
public class HelloIO03 {  
    public static void main(String[] args) throws Exception {  
        Writer out = new FileWriter("/Users/jaeyoon/Desktop/hello.txt");  
        out.write((int)'a');  
        out.write((int)'h');  
        out.write((int)'!');  
        out.close();  
    }  
}
```

- 결과물로 저장된 hello.txt 파일의 크기는 3byte가 나온다.
- 하지만, `가, 나, 다`와 같이 저장하면 파일의 크기가 9byte가 나온다.

<br>

```java {title="HelloIO04.java"}
import java.io.FileReader;  
import java.io.Reader;  
  
public class HelloIO04 {  
    public static void main(String[] args) throws Exception {  
        Reader in = new FileReader("/Users/jaeyoon/Desktop/hello.txt");  
        int ch = -1;  
        while ((ch = in.read()) != -1) {  
            System.out.println((char)ch);  
        }  
        in.close();  
    }  
}

// 가
// 나
// 다
```

<br>

### Stream 흐름

![](brain/image/fun-java09-16.png)

- Java IO는 다양하게 연결할 수 있다.
- 이때 IO 스트림은 생성자에 들어온 것을 토대로 읽어들인다.
- `readLine()` 메서드를 실행하면 BufferedReader가 생성자에 있는 Reader의 `read()` 메서드를 계속 호출 -> InputStreamReader의 생성자에 있는 InputStream의 `read()` 메서드 계속 호출 -> FileInputStream은 File에서 계속 읽어옴
- buffer가 한 줄 가득차면 내보냄

<br>

```java
import java.io.FileOutputStream;  
import java.io.OutputStreamWriter;  
import java.io.PrintWriter;  
  
public class HelloIO05 {  
    public static void main(String[] args) throws Exception {  
        PrintWriter out = new PrintWriter(new OutputStreamWriter(new FileOutputStream("/Users/jaeyoon/Desktop/my.txt")));  
        out.println("hello");  
        out.println("world");  
        out.println("!!!!");  
        out.close();  
    }  
}
```

- FileOutputStream은 "/Users/jaeyoon/Desktop/my.txt"에 저장  
- FileOutputStream은 write(int); int의 마지막 byte만 저장  
- OutputStreamWriter는 생성자에 들어온 OutputStream의 write()를 이용하여야 한다.  
- OutputStreamWriter는 write(int); int의 끝부분 char를 저장  
- PrintWriter는 생성자에 들어온 OutputStreamWriter의 write() 메서드를 이용하여야 한다.  
- PrintWriter는 println(문자열); 문자열을 출력  

<br>

```java
import java.io.BufferedReader;  
import java.io.FileInputStream;  
import java.io.InputStreamReader;  
  
public class HelloIO06 {  
    public static void main(String[] args) throws Exception {  
        BufferedReader in = new BufferedReader(new InputStreamReader(new FileInputStream("/Users/jaeyoon/Desktop/my.txt")));  
        String line = null;  
        while ((line = in.readLine()) != null) {  
            System.out.println(line);  
        }  
        in.close();  
    }  
}
```

<br>

### Composite 패턴

![](brain/image/fun-java09-18.png)

- Composite 패턴이란 객체들의 관계를 트리 구조로 구성하여 부분-전체 계층을 표현하는 패턴으로, 사용자가 단일 객체와 복합 객체 모두 동일하게 다루도록 하는 것이다.
- 인터페이스가 아니라 추상클래스가 되어도 상관없다.
- Folder와 File은 둘 다 모두 공통적으로 가지고 있는 FileComponent를 상속받게 된다.
- 추가적으로, Folder는 FileComponent를 가질 수 있다.( 마름모로 연결되어 있으니까 )
- ==**Folder나 File을 공통인 FileComponent로 봄으로써 일체화시킨다는 의미**==
- <a href='https://refactoring.guru/ko/design-patterns/composite' target='_blank'>링크 참고</a>하기
- 자바 IO는 데코레이터 패턴이라고 했는데, 위에 세 가지 부분 Component, ConcreateComponent, Decorater 부분을 보면 Composite 패턴과 닮았다는 것이 보일 것이다.

<br>

<details><summary><strong>코드 예시보기</strong></summary>
	
```java {title="Node.java"}
public abstract class Node {  
    private String name;  
    public Node(String name) {  
        this.name = name;  
    }  

    public String getName() {  
        return name;  
    }  

    public void setName(String name) {  
        this.name = name;  
    }  

    public abstract long getSize();  
    public abstract boolean isFolder();  
}
```

<br>

```java {title="File.java"}
public class File extends Node {  
    private long size;  
    public File(String name, long size) {  
        super(name);  
        this.size = size;  
    }  

    @Override  
    public long getSize() {  
        return this.size;  
    }  

    @Override  
    public boolean isFolder() {  
        return false;  
    }  
}
```

<br>

```java {title="Folder.java"}
public class Folder extends Node { 
	private List<Node> nodes;
    public Folder(String name) {  
        super(name);  
        nodes = new ArrayList<>();  
    }  

    public void add(File file) {  
        nodes.add(file);  
    }  

    public void add (Folder folder) {  
        nodes.add(folder);  
    }  

    @Override  
    public long getSize() {  
        long total = 0L;
        for (int i = 0; i < nodes.size(); i++) {
	        total = total + nodes.get(i).getSize();
        }
        return total;  
    }  

    @Override  
    public boolean isFolder() {  
        return true;  
    }  
}
```
<br>

</Node>

<br>

```java
public class CompositePatternDemo {  
    public static void main(String[] args) {  
        File f1 = new File("file1", 10L);  
        File f2 = new File("file2", 20L);  
        File f3 = new File("file3", 30L);  

        Folder folder1 = new Folder("folder1");  
        Folder folder2 = new Folder("folder2");  

        folder1.add(f1);  
        folder1.add(folder2);  

        folder2.add(f2);  
        folder2.add(f3);  
        System.out.println(folder1.getSize());  
    }  
}
```

- 결과적으로, File과 Folder를 추상 클래스인 Node를 상속받으면서 Node 취급하여 일체화시켜서 처리할 수 있게 되었음
- folder1의 크기를 물어봤는데, folder1은 파일인 f1과 폴더인 folder2의 합이다.
- folder2는 다시 파일인 f2와 f3이다.
- 따라서, 출력은 최종적으로 크기 60이 나온다.

</details>

<br>

### Decorator 패턴 실습

![](brain/image/fun-java09-19.png)

- Shape를 상속받으면서 Shape를 가지지는 않는 Circle과 Rectangle이 주인공
	- 장식할 대상
- Shape를 가질 수 있는 ShapeDecorator, RedShapeDecorator가 장식
- Demo 코드를 보자.
	- `Shape shape = new RedShapeDecorator(new RedShapeDecorator(new Rectangle()));`
	- `InputStream in = new DataInputStream(new FileInputStream("a.txt"));`
		- Shape --> InputStream (추상클래스)
		- Rectangle --> FileInputStream
		- RedShapeDecorator --> DataInputStream

<details><summary><strong>코드 예시보기</strong></summary>
	
<br>

```java {title="Shape.java"}
public abstract class Shape {  
    public abstract void draw();  
}
```

<br>

```java {title="Circle.java"}
public class Circle extends Shape {  
    @Override    
    public void draw() {  
        System.out.println("Shape : Circle");  
    }  
}
```

<br>

```java {title="Rectangle.java"}
public class Rectangle extends Shape {  
    @Override    
    public void draw() {  
        System.out.println("Shape : Rectangle");  
    }  
}
```

<br>

```java {title="ShapeDecorator.java"}
public class ShapeDecorator extends Shape {  
    protected Shape decoratedShape;  
  
    public ShapeDecorator(Shape decoratedShape) {  
        this.decoratedShape = decoratedShape;  
    }  
  
    public void draw() {  
        decoratedShape.draw();  
    }  
}
```

<br>

```java {title="RedShapeDecorator.java"}
public class RedShapeDecorator extends ShapeDecorator {  
    public RedShapeDecorator(Shape decoratedShape) {  
        super(decoratedShape);  
    }  
  
    @Override  
    public void draw() {  
        setRedBorder(decoratedShape);  
    }  
  
    private void setRedBorder(Shape decoratedShape) {  
        System.out.println("Red ============== Start");  
        decoratedShape.draw();  
        System.out.println("Red ============== End");  
    }  
}
```

<br>

```java {title="DecoratorPatternDemo.java"}
public class DecoratorPatternDemo {  
    public static void main(String[] args) {  
        Shape circle = new Circle();  
  
        // 빨간색으로 장식할 대상이 Circle        
        Shape redCircle = new RedShapeDecorator(new Circle());  
        Shape greenCircle = new GreenShapeDecorator(new Circle());  
        Shape redRectangle = new RedShapeDecorator(new Rectangle());  
  
        System.out.println("Circle with normal border");  
        circle.draw();  
  
        System.out.println("\nCircle of red border");  
        redCircle.draw();  
  
        System.out.println("\nCircle of green border");  
        greenCircle.draw();  
  
        System.out.println("\nRectangle of red border");  
        redRectangle.draw();  
    }  
}
```

<br>

</details>

### DataStream

- 기본형 타입과 문자열을 읽고 쓸 수 있다.
- DataInputStream, DataOutputStream
- Stream, 흐름에 맞게 순서대로 출력 및 입력 !

<br>

<details><summary><strong>코드 예시보기</strong></summary>
	
```java
public class HelloIO07 {  
    public static void main(String[] args) throws Exception {  
        // 이름, 국어, 영어, 수학, 총점, 평균 점수를 /Users/jaeyoon/Desktop/score.dat 파일에 저장  
        String name = "kim";  
        int kor = 90;  
        int eng = 50;  
        int math = 70;  
        double total = kor + eng + math;  
        double avg = total / 3.0;  
  
        DataOutputStream out = new DataOutputStream(new FileOutputStream("/Users/jaeyoon/Desktop/score.dat"));  
        out.writeUTF(name);  
        out.writeInt(kor);  
        out.writeInt(eng);  
        out.writeInt(math);  
        out.writeDouble(total);  
        out.writeDouble(avg);  
  
        out.writeUTF(name);  
        out.writeInt(kor);  
        out.writeInt(eng);  
        out.writeInt(math);  
        out.writeDouble(total);  
        out.writeDouble(avg);  
        out.close();  
    }  
}
```

<br>

```java
public class HelloIO08 {  
    public static void main(String[] args) throws Exception {  
        // 이름, 국어, 영어, 수학, 총점, 평균 점수를 /Users/jaeyoon/Desktop/score.dat 파일에서 읽기  
        DataInputStream in = new DataInputStream(new FileInputStream("/Users/jaeyoon/Desktop/score.dat"));  
        printStudent(in);  
        printStudent(in);  
        in.close();  
    }  
  
    private static void printStudent(DataInputStream in) throws IOException {  
        String name = in.readUTF();  
        int kor = in.readInt();  
        int eng = in.readInt();  
        int math = in.readInt();  
        double total = in.readDouble();  
        double avg = in.readDouble();  
  
        System.out.println(name);  
        System.out.println(kor);  
        System.out.println(eng);  
        System.out.println(math);  
        System.out.println(total);  
        System.out.println(avg);  
    }  
}
// kim
// 90
// 50
// 70
// 210.0
// 70.0
// kim
// 90
// 50
// 70
// 210.0
// 70.0
```

</details>

<br>

### ByteArrayStream

- `byte[]`에 데이터를 읽고 쓰기
- ByteArrayInputStream, ByteArrayOutputStream
- 생성자에 아무것도 안받는 것은 "메모리에 쓴다는 의미"

<details><summary><strong>코드 예시보기</strong></summary>
	
```java
public class HelloIO09 {  
    public static void main(String[] args) throws Exception {  
        int data1 = 1;  
        int data2 = 2;  
        // 메모리 상에 저장한다  
        ByteArrayOutputStream out = new ByteArrayOutputStream();  
        out.write(data1);   // data1의 마지막 1 byte만 저장  
        out.write(data2);   // data2의 마지막 1 byte만 저장  
        out.close();  
  
        byte[] array = out.toByteArray();  
        System.out.println(array.length);  
        System.out.println(array[0]);  
        System.out.println(array[1]);  
    }  
}
// 2
// 1
// 2
```

<br>

```java
public class HelloIO10 {  
    public static void main(String[] args) throws Exception {  
        byte[] array = new byte[2];  
        array[0] = (byte)1;  
        array[1] = (byte)2;  
  
        ByteArrayInputStream in = new ByteArrayInputStream(array);  
        int read1 = in.read();  
        int read2 = in.read();  
        int read3 = in.read();  
        in.close();  
  
        System.out.println(read1);  
        System.out.println(read2);  
        System.out.println(read3);  
    }  
}
// 1
// 2
// -1
```

</details>

<br>

### CharArray

- `char[]`에 데이터를 읽고 쓰기
- CharArrayReader, CharArrayWriter

<br>

### StringReader, StringWriter

- 문자열 쓰고 읽기
- 생성자에 아무것도 안받는 것은 "메모리에 쓴다는 의미"

<details><summary><strong>코드 예시보기</strong></summary>
	
```java
public class HelloIO11 {  
    public static void main(String[] args) throws Exception {  
        StringWriter out = new StringWriter();  
        out.write("hello");  
        out.write("world");  
        out.write("!!!");  
        out.close();  
  
        String str = out.toString();  
        System.out.println(str);  
    }  
}
// helloworld!!!
```

<br>

```java
public class HelloIO12 {  
    public static void main(String[] args) throws Exception {  
        StringReader in = new StringReader("helloworld!!!");  
        int ch = -1;  
        while ((ch = in.read()) != -1) {  
            System.out.print((char)ch);  
        }  
        in.close();  
    }  
}
// helloworld!!!
```

<br>

</details>

<br>

### ObjectStream, 직렬화

- ObjectIntputStream, ObjectOutputStream
- 직렬화 가능한 대상을 읽고 쓸 수 있다.
- ==**직렬화 가능한 대상은 `기본형 타입` or `java.io.Serializable` 인터페이스를 구현하고 있는 객체**==이다.
	- 아무 객체나 읽고 쓸 수 있는 것이 아니다.
	- Serializable 인터페이스는 메서드가 하나도 없어서 구현만 해주면 된다.
	- 이렇게 메서드가 하나도 없는 인터페이스를 ==**Mark Interface**==라고 하는데 이는 메소드 구현목적이 아니라 표시만 해두는 기능에 주 목적이 있다.

<br>

==**객체 직렬화는 객체를 write 하게 되면, 객체가 byte의 흐름으로 바뀌어서 다른 장소로 전송될 수 있게 되는 것이다. 전송되는 공간은 파일이나 메모리 같은 것이 있다. 전송받은 곳에서는 객체의 byte의 흐름을 다시 역직렬화를 통하여 객체로 만들게 된다.**==

<br>

```java
public class ObjectOutputExam {  
    public static void main(String[] args) throws Exception {  
        User user = new User("uni@example.com", "신재윤", 1996);  
        ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream("/Users/jaeyoon/Desktop/user.dat"));  
        out.writeObject(user);  
        out.close();  
    }  
}
```

<br>

```java
public class ObjectInputExam {  
    public static void main(String[] args) throws Exception {  
        ObjectInputStream in = new ObjectInputStream(new FileInputStream("/Users/jaeyoon/Desktop/user.dat"));  
        User user = (User)in.readObject();  
        in.close();  
        System.out.println(user);  
    }  
}

// User{email='uni@example.com', name='신재윤', birthYear=1996}
```

<br>

```java
public class ObjectOutputExam {  
    public static void main(String[] args) throws Exception {  
        User user1 = new User("uni@example.com", "신재윤", 1996);  
        User user2 = new User("zzzzz@example.com", "홍길동", 1986);  
        User user3 = new User("asdfasdf@example.com", "둘리", 1972);  
        ArrayList<User> list = new ArrayList<>();  
        list.add(user1);  
        list.add(user2);  
        list.add(user3);  
  
        ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream("/Users/jaeyoon/Desktop/userlist.dat"));  
        out.writeObject(list);  
        out.close();  
    }  
}
```

<br>

```java
public class ObjectInputExam {  
    public static void main(String[] args) throws Exception {  
        ObjectInputStream in = new ObjectInputStream(new FileInputStream("/Users/jaeyoon/Desktop/userlist.dat"));  
        ArrayList<User> list = (ArrayList)in.readObject();  
        in.close();  
        for (int i = 0; i < list.size(); i++) {  
            System.out.println(list.get(i));  
        }  
    }  
}

// User{email='uni@example.com', name='신재윤', birthYear=1996}
// User{email='zzzzz@example.com', name='홍길동', birthYear=1986}
// User{email='asdfasdf@example.com', name='둘리', birthYear=1972}
```

<br>

### 얕은복사 깊은복사

<br>

![](brain/image/fun-java09-20.png)

<br>

```java
public class ObjectInputOutExam {  
    public static void main(String[] args) throws Exception {  
        User user1 = new User("uni@example.com", "신재윤", 1996);  
        User user2 = new User("zzzzz@example.com", "홍길동", 1986);  
        User user3 = new User("asdfasdf@example.com", "둘리", 1972);  
        ArrayList<User> list = new ArrayList<>();  
        list.add(user1);  
        list.add(user2);  
        list.add(user3);

		ArrayList<User> list2 = list;  
		  
		for (int i = 0; i < list2.size(); i++) {  
		    System.out.println(list2.get(i));  
		}

		list.remove(2);
		System.out.println(list.size());
		System.out.println(list2.size());
    }
}

// User{email='uni@example.com', name='신재윤', birthYear=1996}
// User{email='zzzzz@example.com', name='홍길동', birthYear=1986}
// User{email='asdfasdf@example.com', name='둘리', birthYear=1972}
// 2
// 2
```

- 이와 같은 코드는 list배열이 list2에 복사된 것 일까? 아니다.
- 기존 list에 있는 내용을 복사하는 것이 아니라 ==**기존 list를 참조하는 것을 동일하게 참조하는 것이다.**==
	- 그래서, `list.remove(2)` 하면 동일한 참조니까 같이 사라지는 것


<hr>

![](brain/image/fun-java09-21.png)

<br>

```java
public class ObjectInputOutExam {  
    public static void main(String[] args) throws Exception {  
        User user1 = new User("uni@example.com", "신재윤", 1996);  
        User user2 = new User("zzzzz@example.com", "홍길동", 1986);  
        User user3 = new User("asdfasdf@example.com", "둘리", 1972);  
        ArrayList<User> list = new ArrayList<>();  
        list.add(user1);  
        list.add(user2);  
        list.add(user3);

		ArrayList<User> list2 = new ArrayList<>();  
		  
		for (int i = 0; i < list2.size(); i++) {  
		    list2.add(list.get(i));  
		}

		list.remove(2);
		System.out.println(list.size());
		System.out.println(list2.size());
    }
}
```

- 그렇다면 이런 상황은 어떠할까? 깊은 복사인가?
- list만 새로 만들었을 뿐이지, User 객체 자체가 복사되는 것은 아니다. User가 바뀌면 역시 바뀌는 것이라서 얕은 복사이다.

<br>

![](brain/image/fun-java09-22.png)

**메서드 안 뺀 버전**

```java
public class ObjectInputOutExam {  
    public static void main(String[] args) throws Exception {  
        User user1 = new User("uni@example.com", "신재윤", 1996);  
        User user2 = new User("zzzzz@example.com", "홍길동", 1986);  
        User user3 = new User("asdfasdf@example.com", "둘리", 1972);  
        ArrayList<User> list = new ArrayList<>();  
        list.add(user1);  
        list.add(user2);  
        list.add(user3);  
  
        ByteArrayOutputStream bout = new ByteArrayOutputStream();  
        ObjectOutputStream out = new ObjectOutputStream(bout);  
        out.writeObject(list);  
        out.close();  
        bout.close();  
  
        list.remove(2);  
  
        byte[] array = bout.toByteArray();  
  
        ObjectInputStream in = new ObjectInputStream(new ByteArrayInputStream(array));  
        ArrayList<User> list2 = (ArrayList)in.readObject();  
        in.close();  
  
        for (int i = 0; i < list2.size(); i++) {  
            System.out.println(list2.get(i));  
        }  
    }  
}

// User{email='uni@example.com', name='신재윤', birthYear=1996}
// User{email='zzzzz@example.com', name='홍길동', birthYear=1986}
// User{email='asdfasdf@example.com', name='둘리', birthYear=1972}
```

<br>

**메서드 뺀 버전**

```java
public class ObjectInputOutExam {  
    public static void main(String[] args) throws Exception {  
        User user1 = new User("uni@example.com", "신재윤", 1996);  
        User user2 = new User("zzzzz@example.com", "홍길동", 1986);  
        User user3 = new User("asdfasdf@example.com", "둘리", 1972);  
        ArrayList<User> list = new ArrayList<>();  
        list.add(user1);  
        list.add(user2);  
        list.add(user3);  
  
        ArrayList<User> list2 = copy(list);  
  
        for (int i = 0; i < list2.size(); i++) {  
            System.out.println(list2.get(i));  
        }  
    }  
  
    private static ArrayList<User> copy(ArrayList<User> list) throws IOException, ClassNotFoundException {  
        ByteArrayOutputStream bout = new ByteArrayOutputStream();  
        ObjectOutputStream out = new ObjectOutputStream(bout);  
        out.writeObject(list);  
        out.close();  
        bout.close();  
  
        byte[] array = bout.toByteArray();  
  
        ObjectInputStream in = new ObjectInputStream(new ByteArrayInputStream(array));  
        ArrayList<User> list2 = (ArrayList)in.readObject();  
        in.close();  
        return list2;  
    }  
}
```

- 이렇게, list가 참조하는 User 객체 자체를 직렬화하여 `byte[]`로 만들어놓는 것이다. Deep Copy! 이러고 나중에 역직렬화해서 사용하면 된다. 진짜 인스턴스가 두 쌍이 되는 것이다.
- ==**객체 직렬화를 이용하여 객체를 복사하는 예제!**==
- 다시 한 번 말하면, 직렬화가 가능하다는건 기본형 타입이거나 Serializable 인터페이스를 구현하고 있는 객체!