---
title: ELK Stack 日志管理 详解
series: Elasticsearch
language: zh-CN
author: Joekma
pubDatetime: 2024-08-25T00:00:00Z
slug: elk-stack-complete-guide
modDatetime: 2026-05-17T00:00:00Z
featured: false
draft: false
tags:
  - DevOps
  - 日志
  - ELK
  - Elasticsearch
  - 可观测性
description: 面向日志采集、清洗、检索与可视化，讲解 ELK Stack 架构、Logstash/Filebeat 配置、Elasticsearch 查询、Kibana 看板和性能优化。
---

# ELK Stack 日志管理 详解

## 简介

ELK Stack 是 Elastic 公司推出的开源数据处理与可视化套件，由三个核心组件组成：Elasticsearch、Logstash 和 Kibana。被广泛应用于日志收集、业务检索、运维监控等场景。

**核心价值：**

- 全链路覆盖：数据采集、存储检索、可视化形成完整闭环
- 实时性强：毫秒级检索，满足实时日志分析需求
- 高可扩展性：支持集群部署，横向扩展处理能力
- 开源免费：核心功能完全开源，社区活跃

## 阅读路线

ELK 的学习主线可以拆成四层：采集、处理、存储、消费。排障时也建议沿这条链路逐段定位。

| 层级 | 关注点 | 常见组件 |
|------|--------|----------|
| 采集 | 日志文件、容器日志、系统指标是否完整进入管道 | Filebeat、Metricbeat |
| 处理 | 字段解析、时间戳、脱敏、标签和异常数据 | Logstash filter |
| 存储 | 索引模板、分片副本、生命周期和查询性能 | Elasticsearch |
| 消费 | 检索、仪表盘、告警和权限 | Kibana |

如果是本地验证，可以先用 Docker Compose 跑通最小链路；如果是生产建设，应重点看索引生命周期、权限、TLS、告警和容量规划。

## 核心组件

### Elasticsearch（ES）

分布式搜索引擎，基于 Apache Lucene 构建，提供数据存储、实时检索与聚合分析功能。

**核心特性：**

- 分布式架构，支持水平扩展
- 轻松处理 PB 级数据
- RESTful API 接口
- 近实时（NRT）搜索
- 向量数据库支持

### Logstash

数据采集与转换工具，负责从多源采集数据，进行过滤、清洗、格式化后输出到目的地。

**核心特性：**

- 插件式架构，灵活扩展
- 支持多种输入输出源
- 强大的过滤和转换能力
- 管道式处理流程

### Kibana

可视化与交互平台，提供图形化界面，支持对 ES 中的数据进行检索、分析、可视化展示。

**核心特性：**

- 交互式仪表盘
- 丰富的可视化图表
- Discover 数据探索
- 告警规则配置
- Canvas 画布

### Beats

轻量级数据采集器，用于收集各类日志和数据。

| 组件 | 用途 |
|------|------|
| Filebeat | 收集日志文件 |
| Metricbeat | 收集系统指标 |
| Heartbeat | 健康检查 |
| Packetbeat | 网络数据包分析 |
| Auditbeat | 安全审计日志 |
| Winlogbeat | Windows 事件日志 |

## 架构与工作流程

### 完整架构图

```text
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Beats     │────▶│  Logstash   │────▶│Elasticsearch│
│ (Filebeat)  │     │  (处理)     │     │  (存储)     │
└─────────────┘     └─────────────┘     └─────────────┘
                                            │
                                            ▼
                                      ┌─────────────┐
                                      │   Kibana    │
                                      │  (可视化)   │
                                      └─────────────┘
```

### 工作流程

1. **数据采集**：Logstash/Beats 通过输入插件从多源获取原始数据
2. **数据处理**：Logstash 通过过滤插件进行清洗、转换、格式化
3. **数据存储**：Logstash 通过输出插件将处理后的数据写入 Elasticsearch
4. **数据可视化**：用户通过 Kibana 连接 ES，进行检索、分析、生成仪表盘

## 环境搭建

### 系统要求

| 项目 | 要求 |
|------|------|
| 操作系统 | CentOS 7+ / Ubuntu 20.04+ |
| 内存 | 至少 4GB（生产环境建议 8GB+） |
| JDK | JDK 17+（ES 8.x 内置） |
| 用户权限 | 需创建非 root 用户 |

### 前置配置

#### 1. 创建非 root 用户

```bash
useradd elk
passwd elk
echo "elk ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
```

#### 2. 关闭防火墙

```bash
sudo systemctl stop firewalld
sudo systemctl disable firewalld
```

#### 3. 关闭 SELinux

```bash
sudo sed -i 's/SELINUX=enforcing/SELINUX=disabled/' /etc/selinux/config
source /etc/selinux/config
```

#### 4. 配置内核参数

```bash
sudo vim /etc/sysctl.conf
vm.max_map_count=262144
fs.file-max=65536
sudo sysctl -p
```

#### 5. 配置用户资源限制

```bash
sudo vim /etc/security/limits.conf
elk soft nofile 65536
elk hard nofile 65536
elk soft nproc 4096
elk hard nproc 4096
```

### Docker 快速部署（推荐）

```bash
version: '3'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.15.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - elk

  logstash:
    image: docker.elastic.co/logstash/logstash:8.15.0
    container_name: logstash
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logstash/config/logstash.yml:/usr/share/logstash/config/logstash.yml
    ports:
      - "5044:5044"
    networks:
      - elk
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.15.0
    container_name: kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    networks:
      - elk
    depends_on:
      - elasticsearch

volumes:
  elasticsearch-data:

networks:
  elk:
    driver: bridge
```

启动命令：

```bash
docker-compose up -d
```

### 单机手动安装

#### Elasticsearch 安装

```bash
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.15.0-linux-x86_64.tar.gz
tar -xzf elasticsearch-8.15.0-linux-x86_64.tar.gz
cd elasticsearch-8.15.0

# 配置
vim config/elasticsearch.yml
cluster.name: my-cluster
node.name: node-1
network.host: 0.0.0.0
discovery.type: single-node

# 启动
./bin/elasticsearch -d
```

#### Logstash 安装

```bash
wget https://artifacts.elastic.co/downloads/logstash/logstash-8.15.0-linux-x86_64.tar.gz
tar -xzf logstash-8.15.0-linux-x86_64.tar.gz
cd logstash-8.15.0
```

#### Kibana 安装

```bash
wget https://artifacts.elastic.co/downloads/kibana/kibana-8.15.0-linux-x86_64.tar.gz
tar -xzf kibana-8.15.0-linux-x86_64.tar.gz
cd kibana-8.15.0

# 配置
vim config/kibana.yml
elasticsearch.hosts: ["http://localhost:9200"]

# 启动
./bin/kibana
```

## Logstash 配置

### 基础管道配置

```ruby
input {
  beats {
    port => 5044
  }
  
  file {
    path => "/var/log/nginx/access.log"
    start_position => "beginning"
    sincedb_path => "/dev/null"
  }
  
  jdbc {
    jdbc_connection_string => "jdbc:mysql://localhost:3306/mydb"
    jdbc_user => "root"
    jdbc_password => "password"
    jdbc_driver_library => "/usr/share/logstash/mysql-connector.jar"
    jdbc_driver_class => "com.mysql.cj.jdbc.Driver"
    statement => "SELECT * FROM logs WHERE updated_at > :sql_last_value"
    use_column_value => true
    tracking_column => "updated_at"
    tracking_column_type => "timestamp"
    schedule => "* * * * *"
  }
}

filter {
  if [log_type] == "nginx" {
    grok {
      match => { "message" => "%{IPORHOST:client_ip} - %{DATA:user} \[%{HTTPDATE:timestamp}\] \"%{WORD:method} %{URIPATHPARAM:request} HTTP/%{NUMBER:http_version}\" %{NUMBER:status:int} %{NUMBER:bytes:int} \"%{DATA:referrer}\" \"%{DATA:user_agent}\"" }
    }
    
    date {
      match => [ "timestamp", "dd/MMM/yyyy:HH:mm:ss Z" ]
      target => "@timestamp"
    }
    
    mutate {
      convert => {
        "bytes" => "integer"
        "status" => "integer"
      }
    }
    
    geoip {
      source => "client_ip"
      target => "geo"
    }
  }
  
  if [log_type] == "application" {
    json {
      source => "message"
      target => "parsed"
    }
    
    date {
      match => [ "parsed.timestamp", "ISO8601" ]
      target => "@timestamp"
    }
    
    mutate {
      remove_field => [ "message", "host" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["http://localhost:9200"]
    index => "app-logs-%{+YYYY.MM.dd}"
    user => "elastic"
    password => "changeme"
  }
  
  stdout {
    codec => rubydebug
  }
}
```

### 常用过滤插件

#### Grok 解析日志

```ruby
grok {
  match => { "message" => "%{IP:client_ip} %{WORD:method} %{URIPATHPARAM:request} %{NUMBER:status}" }
  overwrite => [ "message" ]
}
```

#### Date 日期解析

```ruby
date {
  match => [ "timestamp", "yyyy-MM-dd HH:mm:ss" ]
  target => "@timestamp"
}
```

#### Mutate 数据转换

```ruby
mutate {
  add_field => { "environment" => "production" }
  remove_field => [ "host" ]
  convert => {
    "status" => "integer"
    "duration" => "float"
  }
  uppercase => [ "level" ]
}
```

#### JSON 解析

```ruby
json {
  source => "message"
  target => "parsed"
  skip_on_invalid_json => true
}
```

#### GeoIP 地理位置

```ruby
geoip {
  source => "client_ip"
  target => "geo"
  database => "/usr/share/GeoIP/GeoLite2-City.mmdb"
}
```

#### UserAgent 用户代理解析

```ruby
useragent {
  source => "user_agent"
  target => "ua"
}
```

## Elasticsearch 查询

### REST API 基础操作

#### 创建索引

```bash
curl -X PUT "localhost:9200/my-app-logs" -H 'Content-Type: application/json' -d'
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "index.refresh_interval": "5s"
  },
  "mappings": {
    "properties": {
      "@timestamp": { "type": "date" },
      "level": { "type": "keyword" },
      "message": { "type": "text" },
      "service": { "type": "keyword" },
      "host": { "type": "ip" },
      "client_ip": { "type": "ip" },
      "status": { "type": "integer" },
      "duration": { "type": "float" }
    }
  }
}
'
```

#### 插入文档

```bash
curl -X POST "localhost:9200/my-app-logs/_doc" -H 'Content-Type: application/json' -d'
{
  "@timestamp": "2024-08-25T10:30:00Z",
  "level": "ERROR",
  "message": "Connection timeout",
  "service": "api-gateway",
  "host": "192.168.1.100"
}
'
```

#### 搜索查询

```bash
# 基础搜索
curl -X GET "localhost:9200/my-app-logs/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "level": "ERROR"
    }
  }
}
'

# 复合查询
curl -X GET "localhost:9200/my-app-logs/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        { "range": { "@timestamp": { "gte": "now-1d" } } },
        { "term": { "level": "ERROR" } }
      ],
      "filter": [
        { "term": { "service": "api-gateway" } }
      ]
    }
  },
  "sort": [{ "@timestamp": "desc" }],
  "size": 100
}
'
```

### DSL 查询详解

```json
{
  "query": {
    "bool": {
      "must": [],
      "should": [],
      "must_not": [],
      "filter": []
    }
  },
  "aggs": {
    "status_counts": {
      "terms": { "field": "status" }
    },
    "avg_duration": {
      "avg": { "field": "duration" }
    }
  }
}
```

## Kibana 使用

### 访问与配置

1. 访问 `http://localhost:5601`
2. 首次进入创建索引模式
3. 选择时间字段 `@timestamp`
4. 点击 "Create index pattern"

### Discover 数据探索

- **搜索栏**：输入 KQL 查询语法
- **时间选择器**：选择查询时间范围
- **文档列表**：查看匹配的文档
- **字段列表**：添加/移除显示字段

### KQL 查询语法

```kql
# 基础查询
level:ERROR

# 范围查询
duration > 1000

# 通配符
service:api-*

# 布尔组合
level:(ERROR or WARNING)

# 时间范围
@timestamp > "now-1d"
```

### 仪表盘创建

1. 点击 **Dashboard** → **Create dashboard**
2. 点击 **Add panel**
3. 选择可视化类型（Line、Bar、Pie、Metric 等）
4. 选择索引和聚合方式
5. 保存仪表盘

### 可视化类型

| 类型 | 用途 |
|------|------|
| Line | 趋势变化 |
| Bar | 对比分析 |
| Pie | 占比分析 |
| Metric | 数值展示 |
| Heatmap | 热力图 |
| Map | 地图分布 |

### 告警配置

```json
{
  "rule_type_id": "logs.alert.document.count",
  "params": {
    "index": ["my-app-logs-*"],
    "condition": {
      "comparison": ">",
      "value": 100,
      "metrics": {
        "agg_type": "count"
      }
    },
    "time_window": "5m"
  },
  "actions": [
    {
      "connector_type_id": ".slack",
      "params": {
        "message": "Error count exceeded threshold"
      }
    }
  ]
}
```

## Filebeat 配置

### 基础配置

```yaml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/nginx/*.log
  fields:
    log_type: nginx
    environment: production
  fields_under_root: true

processors:
- add_host_metadata:
    when.not.contains.tags: forwarded
- add_cloud_metadata: ~
- add_docker_metadata: ~

output.logstash:
  hosts: ["localhost:5044"]

setup.kibana:
  host: "localhost:5601"

setup.index-template:
  enabled: true
```

### 多日志源配置

```yaml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/nginx/access.log
  fields:
    log_type: nginx_access
  fields_under_root: true

- type: log
  enabled: true
  paths:
    - /var/log/nginx/error.log
  fields:
    log_type: nginx_error
  fields_under_root: true

- type: log
  enabled: true
  paths:
    - /var/log/app/*.log
  fields:
    log_type: application
  fields_under_root: true
  multiline.pattern: '^\['
  multiline.negate: true
  multiline.match: after

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "logs-%{+yyyy.MM.dd}"

setup.kibana:
  host: "localhost:5601"
```

## 实战案例

### Python 应用日志收集

#### 应用端日志格式

```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)

handler = logging.FileHandler("/var/log/app/application.log")
handler.setFormatter(JSONFormatter())
logger = logging.getLogger("app")
logger.addHandler(handler)
logger.setLevel(logging.INFO)
```

#### Logstash 配置

```ruby
input {
  file {
    path => "/var/log/app/application.log"
    start_position => "beginning"
    codec => json
    sincedb_path => "/var/lib/logstash/sincedb_app"
  }
}

filter {
  date {
    match => [ "timestamp", "ISO8601" ]
    target => "@timestamp"
  }
  
  mutate {
    add_field => {
      "service" => "my-python-app"
      "environment" => "production"
    }
  }
  
  if [level] == "ERROR" {
    mutate {
      add_tag => [ "error" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["http://localhost:9200"]
    index => "python-app-logs-%{+YYYY.MM.dd}"
  }
}
```

### Java 应用日志收集（使用 Filebeat）

#### Logback 配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>/var/log/app/application.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>/var/log/app/application.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <appender name="JSON" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>/var/log/app/application.json</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>/var/log/app/application.%d{yyyy-MM-dd}.json</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
        <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
    </appender>
    
    <root level="INFO">
        <appender-ref ref="JSON"/>
    </root>
</configuration>
```

#### Filebeat 配置

```yaml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/app/application.json
  json.keys_under_root: true
  json.add_error_key: true
  json.message_key: message

processors:
- add_host_metadata: ~
- decode_json_fields:
    fields: ["message"]
    target: ""
    overwrite_keys: true
```

## 性能优化

### Elasticsearch 优化

```yaml
# elasticsearch.yml
indices.memory.index_buffer_size: 20%
indices.queries.cache.size: 15%
thread_pool.write.queue_size: 1000
```

### Logstash 优化

```ruby
# 管道配置优化
pipeline {
  workers => 4
  batch_size => 125
  batch_delay => 5
}
```

### 索引生命周期管理

```json
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_age": "7d",
            "max_primary_shard_size": "50gb"
          },
          "set_priority": 100
        }
      },
      "warm": {
        "min_age": "30d",
        "actions": {
          "shrink": {
            "number_of_shards": 1
          },
          "forcemerge": {
            "max_num_segments": 1
          },
          "set_priority": 50
        }
      },
      "cold": {
        "min_age": "60d",
        "actions": {
          "set_priority": 0
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

## 常见问题与排查

### 1. Elasticsearch 启动失败

- 检查内存：`vm.max_map_count` 是否足够
- 检查权限：确保非 root 用户运行
- 查看日志：`/var/log/elasticsearch/*.log`

### 2. Logstash 无法连接 ES

- 检查 ES 是否启动
- 验证网络连接：`curl http://localhost:9200`
- 检查防火墙端口

### 3. Kibana 无法连接 ES

- 检查 ES 地址配置
- 验证端口可访问性
- 检查安全设置（认证、SSL）

### 4. Filebeat 无法收集日志

- 检查文件路径是否正确
- 验证文件权限
- 检查 sincedb 文件

### 5. 索引写入性能低

- 增加批量写入大小
- 使用 bulk API
- 优化索引配置

## 小结

ELK Stack 作为最成熟的日志与数据分析解决方案，其核心价值在于：

- **完整链路**：从采集、处理、存储到可视化全覆盖
- **实时检索**：毫秒级响应，支持 PB 级数据
- **灵活扩展**：支持集群部署，横向扩展
- **丰富生态**：Beats、Logstash 插件生态丰富

落地清单：

- 合理规划索引结构和生命周期
- 使用 Beats 收集日志减轻 Logstash 压力
- 配置合理的副本和分片数
- 启用索引生命周期管理自动化管理
- 配置告警规则及时发现问题

附加参考：

- [Elastic 官方文档](https://www.elastic.co/docs/)
- [Elasticsearch 文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/)
- [Logstash 文档](https://www.elastic.co/guide/en/logstash/current/)
- [Kibana 文档](https://www.elastic.co/guide/en/kibana/current/)
- [Beats 文档](https://www.elastic.co/guide/en/beats/libbeat/current/)

---
