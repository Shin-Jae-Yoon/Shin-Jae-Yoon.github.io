---
title: "05. AdminClient"
date: "2025-06-25 22:05"
enableToc: true
tags: ["📚 카프카 핵심가이드"]
---

AdminClient는 프로그램적인 관리 기능 API를 제공하기 위해 추가된 기능이다.  토픽 목록 조회, 생성, 삭제, 클러스터 상세 정보 확인, ACL 관리, 설정 변경 등의 기능이 가능하다.

- 특정 토픽에 이벤트를 작성해야하는 상황에 토픽이 존재하지 않는다고 가정하자.
- AdminClient 이전에는 방법이 거의 없었고, 사용자 친화적이지도 않았다.
	- `producer.send()` 메서드에서 `UNKNOWN_TOPIC_OR_PARTITION` 예외를 잡아서 사용자에게 토픽을 만들라고 알려주기
	- 카프카 클러스터에 자동 토픽 생성 기능이 켜져있는 경우
	- 호환성 포기하고 내부 API 사용
- AdminClient 이후에는 이를 활용하면 된다.
	- 토픽이 존재하는지 확인
	- 만약 없다면, 즉석에서 생성

<br><hr>

## AdminClient

기본적으로 AdminClient는 **Result 객체를 리턴**하고 **Options 객체를 파라미터**로 받을 수 있다.

<br>

### 비동기적 / 최종적 일관성

AdminClient는 기본적으로 **비동기적(asynchronous)** 으로 작동
- AdminClient의 각 메서드는 1개 이상의 **Future 객체를 리턴**
	- Future 객체는 비동기 작업의 결과를 의미
- AdminClient는 **Result 객체로 Future 객체를 감싼다**
	- e.g. `AdminClient.createTopics()`
		- 모든 토픽이 생성될 때까지 "기다리거나"
		- 각각의 토픽 상태를 하나씩 "확인하거나"
		- 특정 토픽 생성 이후 해당 토픽의 설정을 가져올 수 있도록

카프카 컨트롤러 → 브로커로의 메타데이터 전파가 비동기적으로 작동
- 리턴하는 Future 객체들은 **컨트롤러의 상태가 완전히 업데이트된 시점에 완료된 것으로 간주**
- 이러한 것이 **최종적 일관성(eventual consistency)**
	- 최종적으로 모든 브로커는 토픽에 대해서 알게됨
	- 그 시점이 정확히 언제인지는 보장 ❌

<br>

> [!note] Future 객체 까먹었으면 아래 블로그 게시글 참조 ! <br>
> <a href='https://kangmoo.github.io/posts/Java-Future/' target='_blank'># Java의 Future에 대해 알아보자</a>


<br><br>

### 옵션

AdminClient의 각 메서드는 특정한 **Options 객체를 파라미터로 받음**
- 파라미터로 들어오는 객체들은 브로커가 요청을 어떻게 처리할지에 대해 설정을 담음
  
- e.g. `listTopics() → ListTopicsOptions 객체를 파라미터로`
  
  ![](brain/image/chap05-6.png)
  
- e.g. `describeCluster → DescribeClusterOptions 객체`
  
  ![](brain/image/chap05-7.png)

<br>

모든 Options 클래스들은 AbstractOptions 추상 클래스를 상속하는 형태
- 따라서, 모든 AdminClient 메서드는 `timeoutMs` 매개변수를 가지고 있음
- TimeoutException 발생시키기 전에 클러스터로부터 응답을 기다리는 시간을 조정하는 것

![](brain/image/chap05-8.png)

![](brain/image/chap05-9.png)

<br><br>

### 수평구조

모든 어드민 작업은 KafkaAdminClient에 구현되어 있는 아파치 카프카 프로토콜을 사용하여 진행
- KafkaAdminClient는 내부적으로 Kafka가 정의한 **Admin 명령용 네트워크 프로토콜** 메시지를 직접 만들어 브로커로 전송하고, 그 응답을 해석하는 방식으로 작동
- AdminClient에 어떠한 기능이 없다면, 그건 진짜 구현이 안된 것 (**여기에 없으면 없는거다, 인터페이스가 크긴 한데 IDE 자동완성도 그렇고 편하다**)

<br>

객체 간 의존 관계나 네임스페이스 같은것이 존재 ❌
- 카프카 프로토콜이 단순 네트워크 메세지 수준에서 동작한다는 의미
- 카프카 어드민 API를 호출한다고 Kafka 서버의 Java 객체와 직접 연결되는 것이 아니다
- "토픽", "브로커", "파티션" 등의 리소스는 단지 **문자열이나 숫자 ID로 식별되는 엔터티**이며, 서버 내부 객체와 직접적인 레퍼런스나 의존 관계가 없다
- "네임스페이스"라는 개념도 없다. 예를 들어 Kubernetes나 Java에서는 네임스페이스를 통해 논리적으로 객체를 구분할 수 있지만, Kafka에서는 **토픽 이름이 곧 유일 식별자**이고, 계층 구조나 컨텍스트는 없다

```java
AdminClient admin = AdminClient.create(props);
admin.createTopics(List.of(new NewTopic("my-topic", 3, (short) 1)));
```

- 정말 단순하게, `my-topic`이라는 이름을 가진 토픽이 카프카에 없으면, 메타데이터에 추가하고 각 브로커에 분산처리
- `my-topic`이라는 이름을 가진 토픽이 어떤 객체에 속한다거나 네임스페이스 안에 있다는 개념은 없다

<br>

> [!note] 네임스페이스? <br>
> 네임스페이스(namespace)는 프로그램 내에서 식별자(변수, 함수, 클래스 등)가 충돌하지 않도록 구분짓는 논리적 영역
> - 네임스페이스를 사용하면 동일한 이름의 식별자가 다른 네임스페이스에 존재하더라도 충돌 없이 사용 가능
> - Java에서는 패키지와 클래스가 네임스페이스 역할
> - Docker는 네임스페이스를 활용하여 컨테이너라는 격리된 공간을 제공

<br><br>

### 참고사항

- 클러스터의 **상태를 변경하는 모든 작업** (create, delete, alter)는 **컨트롤러**에 의해 수행
- 클러스터의 **상태를 읽기만 하는 작업** (list, describe)는 **아무 브로커**에서나 수행 가능
	- 이때, 클라이언트 입장에서 보이는 가장 부하가 적은 브로커로 전달됨

<br><hr>

## 사용법

AdminClient는 생성, 설정, 닫기 과정이 필요

```java
Properties props = new Properties();
props.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
AdminClient admin = AdminClient.create(props);
admin.close(Duration.ofSeconds(30));
```

- **Properties에 반드시 필요한 설정** → 클러스터에 대한 URI (연결할 브로커 목록을 쉼표로 구분한 목록)
- 타임아웃 없이 `close()`를 호출 → 진행중인 모든 작업이 완료될 때까지 대기하겠다는 의미

<br><br>

### client.dns.lookup

카프카는 부트스트랩 서버 설정(BOOTSTRAP_SERVERS_CONFIG)에 포함된 호스트명을 기준으로 연결을 검증, 해석, 생성
- 1. 브로커로부터 호스트 정보를 받음
- 2. 이후, `advertised.listeners` 설정에 있는 호스트명 기준으로 연결

아래 2가지 경우에 문제가 발생할 수 있어서, `client.dns.lookup` 설정 필요

<br>


**(1) DNS 별칭을 사용하는 경우**
- `broker1.hostname.com`, `broker2.hostname.com` ... 같이 이름이 겹치는 경우 부트스트랩 서버 설정을 일일이 지정하지 않고 모든 브로커 전체를 가리킬 하나의 DNS 별칭 (alias) 생성하여 관리 가능
- 카프카의 보안 프로토콜인 SASL을 사용하여 인증할 때 문제 발생
	- `all-brokers.hostname.com` 처럼 alias에 대해서 인증하려고 함
	- 서버의 보안 주체는 `broker1.hostname.com`임
	- 인증 거부 및 연결 실패
- 이때 **`client.dns.lookup=resolve_canonical_bootstrap_servers_only`** 설정 가능
	- 클라이언트가 DNS 별칭을 펼쳐서, DNS 별칭에 포함된 모든 브로커 이름을 일일이 부트스트랩 서버 설정에 넣어준 것과 동일하게 작동

<br>

**(2) 다수의 IP 주소로 연결되는 DNS 이름을 사용하는 경우**
- 고가용성을 위해 `broker1.hostname.com`에 여러 IP 주소가 연결되었다고 하자
- 카프카 클라이언트는 첫 번째 호스트명으로 연결 시도
	- → 이는 해석된 IP 주소가 사용 불가능한 경우, 브로커가 멀쩡히 작동하는데도 연결에 실패할 수 있다는 의미
- 이때 **`client.dns.lookup=use_all_dns_ips`** 설정 가능
	- 로드밸런서 계층의 고가용성을 충분히 활용하도록 하는 설정

<br><br>

### request.timeout.ms

애플리케이션이 AdminClient의 응답을 기다릴 수 있는 시간의 최대값
- 에러를 받고 재시도하는 시간 포함
- default : 120s

<br>

컨슈머 그룹 관리 기능 같은 AdminClient 작업은 꽤 시간이 걸릴 수 있다
- 타임아웃 값을 포함하는 Options 객체를 메서드에 넘겨서 사용하자

<br>

AdminClient 작업이 크리티컬한 작업의 경로에 포함된 경우, 낮게 잡도록 하자
- e.g. 
	- 서비스 시작 시, 특정 토픽이 존재하는지 확인한다고 하자
	- 이때 브로커 응답이 30s 이상 걸릴 경우, 확인 작업을 건너뛰거나 서버 기동을 마무리 한 뒤에 나중에 토픽의 존재를 확인하도록 할 수 있다

<br><hr>

## 토픽 관리 기능

AdminClient의 가장 흔한 활용 사례는 **토픽 관리**
- 토픽 목록 조회
- 토픽 상세 내역 조회
- 토픽 생성
- 토픽 삭제

<br>

### 토픽 목록 조회

<br>

```java
ListTopicsResult topics = admin.listTopics();
topics.names().get().forEach(System.out::println);
```

- `admin.listTopics()` : Future 객체를 감싸고 있는 `ListTopicsResult` 객체 리턴
- `topics.names()` : 토픽 이름의 집합에 대한 Future 객체 리턴
- `get()` : Future 객체에 대한 get을 호출 → 실행 스레드는 토픽 이름 집합을 리턴할 때까지 대기 or TimeoutException
- 리턴된 토픽 이름 집합으로 반복 돌려서 출력

<br>


### 토픽  존재 확인 및 생성

- **`listTopics()`** 로 모든 토픽 목록을 조회하고 원하는 토픽이 존재하는지 찾아도 된다
	- 다만, 큰 클러스터에서 비효율적일 수 있음
	- 토픽의 존재여부 말고 더 많은 정보가 필요한 경우 있음

<br>

**e.g. Kafka Connect와 Confluence Schema Registery는 설정 저장을 위해 카프카 토픽 이용. 이때 아래의 조건을 만족하는 설정 토픽이 있는지 확인 (존재 확인 그 이상의 작업 수행)**
- 하나의 파티션 (설정 변경에 올바른 순서 부여를 위해)
- 3개의 레플리카 (가용성 보장)
- 토픽에 압착 설정 (오래된 설정값도 계속해서 저장 되도록)

<br>

```java
// (1)
DescribeTopicsResult demoTopic = admin.describeTopics(TOPIC_LIST);

try {
	// (2)
	TopicDescription topicDescription = demoTopic.topicNameValues().get(TOPIC_NAME).get();

	// (3)
	if (topicDescription.partitions().size() != NUM_PARTITIONS) {
		System.out.println("토픽 숫자 이상이상");
		System.exit(-1);
	}
} catch (ExecutionException e) {
	// (4)
	// 예외 발생 시, 바로 종료
	if (!(e.getCause() instanceof UnknownTopicOrPartitionException)) {
		e.printStackTrace();
		throw e;
	}

	// 여기까지 왔으면 토픽 존재 X
	System.out.println("토픽 없음 ㅠㅠ. 지금 당장 만들겠음");

	// (5)
	// 파티션 수, 레플리카 수는 선택이고 안적으면 브로커에 설정된 기본값 적용됨
	CreateTopicsResult newTopic = admin.createTopics(Collections.singletonList(new Topic(TOPIC_NAME, NUM_PARTITIONS, REP_FACTOR)));

	// (6)
	// 토픽 생성됐는지 확인
	if (newTopic.numPartitions(TOPIC_NAME).get() != NUM_PARTITIONS) {
		System.out.println("토픽 숫자 이상이상");
		System.exit(-1);
	}
}
```

(1) **`describeTopics()`** 에서 리턴되는 `DescribeTopicResult` 객체 내부에는 맵이 있음
- key : 토픽 이름
- value : 토픽에 대한 상세정보를 담는 Future 객체

<br>

(2) `get()` Future 객체에 대한 get은 원하는 결과까지 대기하고 받기 or ExecutionException

<br>

(3) 토픽이 존재할 경우 리턴된 Future 객체는 토픽에 속한 `모든 파티션의 목록`을 담은 TopicDescription 리턴
- 파티션별로 어떤 브로커가 리더인지
- 어디에 레플리카가 있는지
- 인-싱크 레플리카는 무엇인지

<br>
 
(4) 모든 AdminClient의 Result (Future) 객체는 카프카가 에러 응답을 보낼 경우 ExecutionException 발생
- AdminClient가 리턴한 객체는 Future 객체는 맞는데, 이 Future 객체 안에 다시 예외 포함하고 있기 때문
- **카프카가 리턴한 에러를 열어보려면 항상 ExecutuionException의 cause 확인**

<br>

(5) 토픽 없으면 새로 생성
- 이름만 지정하고 나머지 기본값으로 설정하던가
- 아니면 파티션 수, 레플리카 등 토픽 설정 잡던가

<br>

(6) 결과물 확인 !
- 결과물 확인을 위해 `get()`을 다시 호출해서 이 메서드가 예외를 발생시킬 수 있음
- TopicExistsException이 보통 발생하고 처리해주어야 할 것

<br><br>

### 토픽 삭제

- **`deleteTopics()`** : 삭제할 토픽 목록을 파라미터로 넘기면 삭제
	- 카프카에서 토픽 삭제는 돌이킬 수 없음
	- 토픽을 되살릴 수 없고, 토픽이 비었는지 정말 삭제하고 싶은게 맞는지 확인하는 절차도 없음
	- 반드시 주의해서 삭제

<br><br>

### 비동기 처리

- AdminClient가 리턴하는 Future 객체에서 get 메서드를 호출하는 방식은 결국 블로킹
	- Future 객체 : 비동기 계산의 **아직 계산되지 않은 결과**를 표현하는 인터페이스
	- get 메서드 : 연산의 결과를 반환. 블로킹 방식
- 어드민 작업은 드물고, 대부분의 어드민 작업은 블로킹 방식을 사용해도 되지만, 많은 어드민 요청을 처리할 것으로 예상되는 서버를 개발할 때는 서버 스레드가 블로킹되지 않게 개발하자

<br>

e.g. Vert.x를 사용한 비동기 서버 개발하는 상황

```java
vertx.createHttpServer().requestHandler(request -> {
		String topic = request.getParam("topic");
		String timeout = request.getParam("timeout");
		int timeoutMs = NumberUtils.toInt(timeout, 1000);

		DescribeTopicResult demoTopic = admin.describeTopics(Collections.singletonList(topic), new DescribeTopicsOptions().timeoutMs(timeoutMs));

		// 여기서 get() 안쓰고 whenComplete() 사용
		demoTopic.topicNameValues().get(topic).whenComplete(
			(final TopicDescription description, final Throwable throwable) -> {
				if (throwable != null) {
					request.response().end("실패해부러쓰" + topic + "이거땜시" + throwable.getMessage());
				} else {
					request.response().end(description.toString());
				}
			}
		) 
	}).listen(8080);
```

- `get()`으로 블로킹 호출하는 것 대신 CompletableFuture의 `whenComplete()` 비동기 메서드를 활용
	- 비동기 작업의 결과나 예외를 받아서 처리하는 메서드
	- get 대신 Future 객체의 작업이 완료되면 호출되는 함수를 생성해서 사용한 것
- 카프카로부터 응답을 기다리지 않음
	- 카프카로부터 응답이 도착하면 DescribeTopicResult가 HTTP 클라이언트에 응답 보냄
	- HTTP 서버는 그 사이 다른 요청 처리 가능

<br><br>

### 설정 관리

**ConfigResource 객체** 사용하여 설정관리 가능
- 설정 가능한 자원
	- 브로커
	- 브로커 로그
	- 토픽
- 브로커와 브로커 로깅 관련 설정은 `kafka-configs.sh` 혹은 `카프카 관리 툴` 활용하는게 보통
- 토픽의 설정을 확인하거나 수정하는 것은 애플리케이션에서 굉장히 흔하게 수행

<br>

e.g. 많은 애플리케이션들은 정확한 작동을 위해 압착 설정이 된 토픽 사용
- 주기적으로 해당 토픽에 압착 설정이 되어있는지 확인해줌 (보존 기한 default 보다 짧은 주기가 안전)
- 설정이 안되어있으면 수정해주기

> [!note] 압착 기억나지? <br>
> 카프카 토픽에 저장된 데이터는 기본적으로 추가(append)만 가능하며, 삭제는 불가능 <br>
> 토픽 압착 기능을 활성화하면, "동일한 키를 가진 메시지 중 가장 최신의 메시지만 보존"하고 <br>
> 나머지는 삭제하여 토픽의 크기를 줄일 수 있음

<br>

```java
// (1)
ConfigResource configResource = new ConfigResource(Type.TOPIC, TOPIC_NAME);  

DescribeConfigsResult configsResult = admin.describeConfigs(Collections.singleton(configResource));  

Config configs = configsResult.all().get().get(configResource);  

// (2)
// 기본값이 아닌 설정 출력
configs.entries().stream()
	.filter(entry -> !entry.isDefault())
	.forEach(System.out::println);  
  
// 토픽 압착 설정 확인  
ConfigEntry compaction = new ConfigEntry(TopicConfig.CLEANUP_POLICY_CONFIG, TopicConfig.CLEANUP_POLICY_COMPACT);

if (!configs.entries().contains(compaction)) {  
	// (3)
    // 압착 설정 되어있지 않은 경우 수정
    Collection<AlterConfigOp> configOp = new ArrayList<>();
    configOp.add(new AlterConfigOp(compaction, AlterConfigOp.OpType.SET));
    
    HashMap<ConfigResource, Collection<AlterConfigOp>> alterConf = new HashMap<>(); 
    alterConf.put(configResource, configOp);
    
    admin.incrementalAlterConfigs(alterConf).all().get();  
} else {  
    System.out.println(TOPIC_NAME + "압착된 토픽임");  
}
```

(1) `describeConfigs` 리턴은 Map
- key : ConfigResource
- value : 설정값의 모음

<br>

(2) 각 설정 항목은 default에서 변경되었는지 확인할 수 있는 `isDefault()` 가짐
- 토픽 설정이 default가 아닌 것으로 취급되는 경우
	- 사용자가 토픽의 설정값을 default가 아닌 것으로 잡은 경우
	- 브로커 단위 설정이 수정된 상태에서 토픽이 생성되어 default가 아닌 값을 브로커 설정으로부터 상속받은 경우

<br>

(3) 설정 변경 시, 변경하고자 하는 ConfigResource를 key로, 설정값 모음을 value로 하는 Map 지정
- 각각 설정 변경 작업은 `설정 항목 - 작업 유형`으로 이루어짐
	- 설정 항목
		- 설정 이름 : `CLEANUP_POLICY`
		- 설정값 `COMPACTED`
- `SET` : 설정값을 잡아줌
- `DELETE` : 현재 설정값을 삭제하고 default로 돌림
- `APPEND`, `SUBSTRACT` : 전체 목록을 주고받을 필요 없이 필요한 설정만 추가하거나 삭제

<br><hr>

## 컨슈머 그룹 관리

컨슈머 그룹을 활용하여 오래된 메세지를 다시 토픽으로부터 읽어오는 경우를 4장에서 학습
- 메세지를 재처리하는 시나리오
	- 이슈가 발생했을 때 오작동하는 애플리케이션을 트러블슈팅하는 과정
	- 재해 복구 상황에서 애플리케이션을 새로운 클러스터에서 작동시키려 하는 경우

AdminClient를 활용하여 컨슈머 그룹과 이 그룹들이 커밋한 오프셋을 조회하고 수정해보자

<br>

### 컨슈머 그룹 조회

<br>

**컨슈머 그룹 목록 조회**

```java
admin.listConsumerGroups().valid().get().forEach(System.out::println);
```

- `valid()`, `get()`을 통해 리턴되는 목록은 **클러스터가 에러 없이 리턴한 컨슈머 그룹만 포함**
- `erros()` 메서드를 통해 발생한 에러의 모든 예외 가져올 수 있음
- `all()` 메서드를 호출하면 클러스터가 리턴한 에러 중 첫 번째 것만 예외 형태로 발생
- 에러의 원인
	- 해당 컨슈머 그룹에 대한 정보를 볼 수 있는 권한이 없는 인가 문제
	- 특정한 컨슈머 그룹의 코디네이터 작동 불능 문제

<br>

**특정 컨슈머 그룹 상세 조회**

```java
ConsumerGroupDescription groupDescription = admin
	.describeConsumerGroups(CONSUMER_GROUP_LIST)
	.describedGroups().get(CONSUMER_GROUP).get();  
  
System.out.println("그룹 상세 : " + groupDescription);
```

- `description` : 그룹 상세
	- 그룹 멤버
	- 멤버별 식별자와 호스트 명
	- 멤버별로 할당된 파티션
	- 할당 알고리즘
	- 그룹 코디네이터의 호스트명

<br>

**오프셋 값, 랙 조회**
- description에는 컨슈머 그룹에 있어서 가장 중요한 정보인 **컨슈머 그룹이 읽고 있는 각 파티션에 대한 마지막으로 커밋된 오프셋 값**, **최신 메세지에서 얼마나 뒤떨어졌는지에 대한 랙(lag)** 이 빠져있음
	- AdminClient 이전 : 컨슈머 그룹이 카프카 내부 토픽에 쓴 커밋 메세지를 가져와서 파싱
		- 내부 메세지 형식의 호환성에 대한 보장이 없어서 권장 ❌
	- AdminClient 이후 : 이거 이용해서 커밋 정보 얻어오면 됩니다 ~!

```java
// (1)
Map<TopicPartition, OffsetAndMetadata> offsets = 
	admin.listConsumerGroupOffsets(CONSUMER_GROUP)
		 .partitionsToOffsetAndMetadata().get();  

Map<TopicPartition, OffsetSpec> requestLatestOffsets = new HashMap<>();  

// (2)
for (TopicPartition tp : offsets.keySet()) {  
    requestLatestOffsets.put(tp, OffsetSpec.latest());  
}  
  
Map<TopicPartition, ListOffsetsResultInfo> latestOffsets = 
	admin.listOffsets(requestLatestOffsets).all().get();  

// (3)
for (Map.Entry<TopicPartition, OffsetAndMetadata> e : offsets.entrySet()) {  
    String topic = e.getKey().topic();  
    int partition = e.getKey().partition();  
    long committedOffset = e.getValue().offset();  
    long latestOffset = latestOffsets.get(e.getKey()).offset();
    long lag = latestOffset - committedOffset;
    
    System.out.println("결과" + topic + partition + offset + latestOffset + lag);  
}
```

(1) 맵 가져오기
- key : 컨슈머 그룹이 사용중인 모든 토픽 파티션
- value : 각 토픽 파티션에 대해 마지막으로 커밋된 오프셋
- `admin.describeConsumerGroups()` : 컨슈머 그룹의 모음
- `admin.listCounsumerGroupOffsets()` : 하나의 컨슈머 그룹

<br>

(2) 각각의 토픽 파티션에 대해 마지막 메세지의 오프셋을 얻고자 함
- `OffsetSpec`
	- `earliest()` : 파티션의 첫 번째 오프셋
	- `latest()` : 파티션의 마지막 오프셋
	- `forTimestamp()` : 지정된 시각 이후에 쓰여진 레코드의 오프셋

<br>

(3) 모든 파티션 반복하여 아래의 결과 얻어옴
- `committedOffset` : 마지막으로 커밋된 오프셋
- `latestOffset` : 마지막 오프셋
- `lag` : 둘 사이의 랙

<br><br>

### 컨슈머 그룹 수정

AdminClient가 컨슈머 그룹을 수정하기 위한 메서드
- 그룹 삭제
- 멤버 제외
- 커밋된 오프셋 삭제 혹은 변경

오프셋 변경이 가장 유용하게 많이 쓰이는 기능 !!
- 카프카에서는 현재 작업이 돌아가고 있는 컨슈머 그룹에 대한 오프셋을 수정하는 것을 허용하지 않음
- 컨슈머 그룹이 돌아가고 있는 상태에서 오프셋을 변경하고자 한다면 `UnknownMemeberIdException`이 발생
- 그러니 반드시 정지시키고 변경해야함

<br>

**오프셋 삭제** 
- 컨슈머를 맨 처음부터 실행시키는 가장 간단한 방법으로 보일 수 있지만, 이는 컨슈머 설정에 의존적
- 컨슈머가 시작됐는데 커밋된 오프셋을 못 찾을 경우 컨슈머는 어디서부터 시작하는가?
	- 맨 처음부터 시작?
	- 가장 최신 메세지로?
	- `auto.offest.rest` 설정값을 가지고 있지 않은 한 알 수 없음
- 명시적으로 커밋된 오프셋을 맨 처음으로 변경 → 컨슈머는 토픽의 맨 처음에서부터 처리
	- **컨슈머가 리셋 되는 것**

<br>

**오프셋 토픽의 오프셋 값 변경**
- 컨슈머 그룹에 변경 여부가 전달되지는 않음
- 컨슈머 그룹은 컨슈머가 새로운 파티션을 할당받거나 새로 시작할 때만 오프셋 토픽에 저장된 값 읽어옴
- 컨슈머가 모르는 오프셋 변경을 방지하기 위해 **카프카에서는 현재 작업이 진행 중인 컨슈머 그룹에 대한 오프셋 수정하는 것 허용 ❌**

<br>

**상태를 가지고 있는 컨슈머 애플리케이션의 오프셋 변경**
- 상태를 가진 경우 오프셋을 리셋하면 저장된 상태가 깨질 수 있다
- e.g. 상점에서 판매된 신발의 수를 연속적으로 집계하는 스트림 애플리케이션
	- 오전 8시에 입력에 문제 있는 것 발견
	- 오전 3시부터의 매상을 완전히 다시 계산 필요
	- 저장된 집계값을 변경하지 않고 오프셋만 오전 3시로 돌리면 중복된 계산 발생
- 개발서버라면 상태 저장소 꼭 비우고 토픽의 시작점으로 오프셋 리셋합시다

<br>

**맨 처음 오프셋 값으로 돌리는 예시**

```java
// (1)
Map<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> earliestOffsets = 
		admin.listOffsets(requestEarliestOffsets).all().get();

// (2)
Map<TopicPartition, OffsetAndMetadata> resetOffsets = new HashMap<>();
for (Map.Entry<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> e : earliestOffsets.entrySet()) {
	resetOffsets.put(e.getKey(), new OffsetAndMetadata(e.getValue().offset()));
}

// (3)
try {
	admin.alterConsumerGroupOffsets(CONSUMER_GROUP, resetOffsets).all().get();
} catch (ExecutionException e) {
	System.out.println("커밋된 오프센 변경 실패요 ㅠㅠ");

	// (4)
	if (e.getCause() instanceof UnknownMemberIdException) {
		System.out.println("컨슈머 그룹 살아있는지 체크좀여");
	}
}
```

(1) 맨 앞 오프셋 값 얻어오기
- 맨 앞 오프셋부터 처리를 시작하도록 컨슈머 그룹을 리셋하기 위해

<br>

(2) OffsetAndMetadata의 맵 객체로 변환
- `admin.listOffsets()`가 리턴한 `ListOffsetsResultInfo`의 맵 객체로
- `admin.alterConsumerGroupOffsets()` 호출하는데 필요한 파라미터 생성

<br>

(3) `get()`을 통해 Future 객체가 작업 성공적으로 완료할 때까지 대기

<br>

(4) 보통 실패하는 이유
- 컨슈머 그룹을 미리 정지시키지 않은 상태에서 실패
	- 컨슈머 애플리케이션을 정지시키는거 말고 방법 ❌
	- 특정 컨슈머 그룹 정지시키는 어드민 명령 없음
- 컨슈머 그룹이 여전히 동작하는 중
	- 컨슈머 코디네이터 입장에서는 컨슈머 그룹에 대한 오프셋 변경 시도가 그룹의 멤버가 아닌 클라이언트가 오프셋을 커밋하려는 것으로 간주해서 그럼
	- 그래서 `UnknownMemberIdException` 발생하는 것

<br><hr>

## 클러스터 메타데이터

애플리케이션이 연결된 클러스터에 대한 정보를 명시적으로 읽어와야하는 경우는 드뭄
- 얼마나 많은 브로커가 있는지
- 어느 브로커가 컨트롤러인지
- **이런거 알 필요 없이 메세지를 읽고 쓸 수 있으니까**

<br>

카프카 클라이언트는 이러한 정보들을 추상화
- 클라이언트는 토픽/파티션에 대한 정보면 충분

<br>

그렇다고 클러스터 메타데이터에 대한 정보를 조회 못하는건 아님

```java
DescribeClusterResult cluster = admin.describeCluster();

System.out.println("연결된 클러스터" + cluster.clusterId().get());
System.out.println("클러스터에 있는 브로커들" + cluster.nodes().get.forEach(node -> System.out.println(" * " + node)));
System.out.println("컨트롤러" + cluster.controller().get());
```

<br><hr>

## 고급 어드민 작업

### 토픽에 파티션 추가

토픽의 파티션 수는 보통 토픽이 생성될 때 결정됨
- 각 파티션은 매우 높은 처리량을 받을 수 있음
	- 토픽 용량 한계를 늘리기 위해 파티션 수를 늘리는 경우는 드뭄
- 토픽의 메세지들이 키를 가지고 있고, 동일 키를 가진 메세지들은 동일한 파티션에 들어가 동일 컨슈머에 의해 동일 순서로 처리될 것이라고 생각할 수 있음

**위와 같은 이유로 토픽에 파티션을 추가하는 것은 드문 경우이고 위험**
- 진짜 최대 부하량까지 차서 파티션 추가 외에 선택지가 없을 때는 추가하자
- 단, 토픽을 읽고 있는 애플리케이션들이 깨지지 않는지 확인 필수 !!!

<br>

**`admin.createPartitions()`**

```java
Map<String, NewPartitions> newPartitions = new HashMap<>); newPartitions.put(TOPIC_NAME, NewPartitions. increaseTo(NUM_PARTITIONS+2));

admin.createPartitions(newPartitions).all).get();
```

- 토픽 확장 시, 새로 추가될 파티션의 수가 아닌 **파티션이 추가된 뒤의 파티션 수를 지정**
- 즉, 확장 이전 토픽 상세 정보를 확인하여 몇 개의 파티션 가지고 있는지 확인 필요

<br><br>

### 토픽에서 레코드 삭제

e.g. 법적 요구사항에 의해 토픽에 30일간의 보존 기한을 건 경우
- 파티션별로 모든 데이터가 하나의 세그먼트에 저장되어 있다고 가정
- 보존기한을 넘겨도 삭제되지 않을 수 있음
	- [2장 - 카프카 설치하기](brain/Book/kafka/chap02)의 브로커 설정 - 토픽별 기본값 - log.segment.bytes 내용 참조

<br>

**`deleteRecords()**
- 호출 시점을 기준으로 지정된 오프셋보다 더 오래된 모든 레코드에 삭제 표시
- 삭제 표시하여 컨슈머가 접근할 수 없게함
- 삭제된 레코드의 오프셋 중 가장 큰 값을 리턴해줘서 의도한 삭제가 이루어졌는지 확인 가능
- **삭제 표시된 레코드를 디스크에서 실제로 지우는 작업은 비동기적으로 일어남**
- 특정 시각 혹은 바로 뒤에 쓰여진 레코드의 오프셋을 가져올 때 `listOffsets()` 쓰는거 기억나시죠?

```java
Map<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> olderOffsets = 
		admin.listOffsets(requestOlderOffsets).all().get();

Map<TopicPartition, RecordsToDelete> recordsToDelete = new HashMap<>();
for (Map.Entry<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> e : olderOffsets.entrySet()) {
	recordsToDelete.put(e.getKey(), RecordsToDelete.beforeOffset(e.getValue().offset()));
}

admin.deleteRecords(recordsToDelete).all().get();
```

<br><br>

### 리더 선출

**선호 리더 선출 (preferred leadere election)**
- 각 파티션은 선호 리더로 불리는 레플리카를 1개씩 가짐
- 모든 파티션이 "선호" 리더 레플리카를 리더로 삼을 경우 **각 브로커마다 할당되는 리더의 개수가 균형을 이룸**
- 카프카는 5분마다 선호 리더 레플리카가 실제로 리더를 맡고 있는지를 확인
	- 맡을 수 있는데도 리더를 맡고 있지 않은 경우, 해당 레플리카를 리더로 삼음
- `auto.leader.rebalance.enable = false`이거나 이 과정을 빠르게 작동하고 싶은 경우
	- **`electLeader()`** 메서드 이용

<br>

**언클린 리더 선출 (unclean leader election)**
- 어느 파티션의 리더 레플리카가 사용 불능 상태가 됨 + 다른 레플리카들이 리더 맡을 수 없는 상황
	- 보통 데이터가 없어서 리더를 맡을 수 없는 경우가 많다
	- 결과적으로 해당 파티션은 리더가 없게 되고 사용 불능 상태가 된 것
- 리더가 될 수 없는 레플리카를 그냥 리더로 삼아버리는 언클린 리더 선출하는 것
	- 데이터 유실 초래
	- 사용 불능 이전 리더에 쓰여졌지만, 새 리더로 복제되지 않은 모든 이벤트는 유실됨
	- **`electLeader()`** 메서드 동일하게 사용 가능

<br>

**`electLeader()`**
- 비동기적 작동
- 성공적으로 메서드 리턴 이후에도 **모든 브로커가 새로운 상태에 대해 알아차리기까지 시간이 걸림**
- `describeTopics()` 호출 결과가 일관적이지 않은 결과물 리턴 가능
- 다수의 파티션에 대해 리더 선출 작동시키면 몇 개는 성공하고 나머지는 실패 가능

```java
Set<TopicPartition> electableTopics = new HashSet<>();
electableTopics.add(new TopicPartition(TOPIC_NAME, 0));

try {
	// (1)
	admin.electLeaders(ElectionType.PREFFERRED, electableTopics).all().get();
} catch (ExecutionException e) {
	if (e.getCause() instanceof ElectionNotNeededException) {
		// (2)
		System.out.println("모든 리더들이 이미 선호입니다 ~!");
	}
}
```

(1) 선호 리더 선출 시, 지정할 수 있는 토픽과 파티션 수에는 제약 ❌
- 파티션 모음이 아닌 null 값으로 지정하면 모든 파티션에 대해 지정된 선출 유형 작업 시작

<br>

(2) 클러스터의 상태가 좋으면 아무 작업도 하지 않음
- 선호 리더 선출 / 언클린 리더 선출
	- 선호 리더가 아닌 레플리카가 현재 리더를 맡고 있는 경우에만 수행

<br><hr>

## 레플리카 재할당

레플리카 현재 위치 바꾸고 싶은 시나리오
- e.g. 브로커에 너무 많은 레플리카가 올라가있는 경우 몇 개는 다른 곳으로 옮기고 싶어
- e.g. 레플리카를 추가하고 싶어
- e.g. 장비를 내리기 위해 모든 레플리카를 다른 장비로 내보내고 싶어
- e.g. 몇몇 토픽에 대한 요청이 너무 많아서 나머지에서 따로 분리해놓고 싶어

<br>

**`alterPartitionReassignments`**
- 파티션에 속한 각각의 레플리카 위치를 정밀하게 제어 가능

<br>

**레플리카를 브로커 → 브로커로 재할당하는 경우**
- 대량의 데이터 복제 초래
- 사용 가능한 네트워크 대역폭 주의
- 필요하다면 쿼터 설정하여 복제 작업을 스로틀링
	- 쿼터 역시 브로커 설정이라서 AdminClient를 사용하여 조회 및 수정 가능

<br>

**e.g. 새로운 브로커를 추가하고 토픽의 레플리카 일부를 새 브로커에 저장하고 싶은 상황**
- 기존에 ID가 0인 브로커를 가지고 있음
- 토픽에는 여러 개의 파티션 존재
- 각 파티션은 브로커에 하나의 레플리카를 가지고 있음

```java
Map<TopicPartition, Optional<NewPartitionReassignment>> reassignment = new HashMap<>();

// (1)
reassignment.put(new TopicPartition(TOPIC_NAME, 0), Optional.of(new NewPartitionReassignment(List.of(0, 1))));

// (2)
reassignment.put(new TopicPartition(TOPIC_NAME, 1), Optional.of(new NewPartitionReassignment(List.of(1))));

// (3)
reassignment.put(new TopicPartition(TOPIC_NAME, 2), Optional.of(new NewPartitionReassignment(List.of(1, 0))));

// (4)
reassignment.put(new TopicPartition(TOPIC_NAME, 3), Optional.empty());

admin.alterPartitionReassignments(reassignment).all().get();

// (5)
System.out.println("지금 재할당 하는 중 : " + admin.listPartitionReassignments().reassignments().get());

demoTpic = admin.describeTopics(TOPIC_LIST);
topicDescription = demoTopic.topicNameValues().get(TOPIC_NAME).get();

// (6)
System.out.println("데모 토픽 설명 : " + topicDescription);
```

(1) 파티션 0
- 새로운 레플리카 추가
- 새 레플리카를 ID가 1인 새 브로커에 배치
- 리더 변경 ❌

(2) 파티션 1
- 레플리카 추가 ❌
- 이미 있던 레플리카를 새 브로커로 옮김
- 레플리카가 하나뿐이라서 이것이 리더가 됨

(3) 파티션 2
- 새로운 레플리카 추가
- 이것을 선호 리더로 설정
- 다음 선호 리더 선출 시, 새로운 브로커에 있는 새로운 레플리카로 리더가 변경됨
- 이전 레플리카는 팔로워가 됨

(4) 파티션 3
- 진행중인 재할당 작업 ❌
- 만약 있으면 작업 취소되고 재할당 작업 시작 전 상태로 원상 복구

(5) 현재 진행 중인 재할당 보여줌

(6) 새로운 상태 보여줌
- 일관된 결과 보이기 전까지 좀 걸림 (최종적 일관성)

<br><hr>

## 테스트

### MockAdminClient

- 해당 테스트 클래스는 원하는 수만큼의 브로커를 설정해서 초기화할 수 있음
- 실제 카프카 클러스터를 돌려서 실제 어드민 작업 수행할 필요 ❌
- 카프카 API 일부가 아니라서 언제든 변경될 수 있어서 위험한 부분이 존재하긴 함
	- 다만, 공개된 메서드에 대한 목업이라 메서드 시그니처는 호환성 유지
	- 약간의 트레이드 오프가 있는거지 ~

<br>

```java
@Before
public void setUp() {
	Node broker = new Node(0, "localhost", 9092);
	MockAdminClient adminClient = new MockAdminClient(Collections.singletonList(broker));
	this.admin = spy(adminClient, broker);

	AlterConfigsResult emptyResult = mock(AlterConfigsResult.class);
	doReturn(KafkaFuture.completedFuture(null)).when(emptyResult).all();
	doReturn(emptyResult).when(admin).incrementalAlterConfigs(any());
}
```