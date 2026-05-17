---
title: Elasticsearch 集群部署
series: Elasticsearch
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-17T00:00:00.000+08:00
slug: elasticsearch-cluster-deployment
description: '讲解 Elasticsearch 单节点、三节点集群、Docker 部署、安全配置、快照备份与恢复的运维实践。'
tags:
  - DevOps
  - Elasticsearch
  - 搜索
  - 集群
  - 部署
draft: false
language: zh-CN
---

> Elasticsearch 集群部署需要考虑硬件资源、网络配置、数据安全等因素。本文详细介绍从安装到生产环境的完整部署流程。

## 部署原则

Elasticsearch 集群部署的核心不是把节点启动起来，而是保证主节点选举稳定、数据节点容量可控、分片能均衡分配，并且备份、安全和监控在上线前就位。

## 环境要求

### 硬件配置

| 资源 | 最低配置 | 推荐配置 | 说明 |
|------|----------|----------|------|
| **CPU** | 4 核 | 8+ 核 | 多核提升并发 |
| **内存** | 8GB | 16GB+ | 内存密集型 |
| **磁盘** | 100GB SSD | 500GB+ NVMe | 性能关键 |
| **网络** | 1Gbps | 10Gbps | 影响集群通信 |

### 软件要求

```bash
# JDK 11 或 JDK 17
# CentOS 7+ / Ubuntu 18.04+

ulimit -n 65536
ulimit -l unlimited
sysctl -w vm.max_map_count=262144
```

## 单节点部署

### 安装步骤

```bash
# 1. 下载
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.17.0-linux-x86_64.tar.gz
tar -xzf elasticsearch-7.17.0-linux-x86_64.tar.gz

# 2. 创建用户
useradd elasticsearch
chown -R elasticsearch:elasticsearch elasticsearch-7.17.0

# 3. 配置
vim config/elasticsearch.yml
vim config/jvm.options

# 4. 启动
su - elasticsearch
./bin/elasticsearch -d

# 5. 验证
curl http://localhost:9200
```

### 配置文件

```yaml
cluster.name: my-cluster
node.name: node-1
path.data: /data/elasticsearch/data
path.logs: /data/elasticsearch/logs
network.host: 0.0.0.0
http.port: 9200
discovery.seed_hosts: ["127.0.0.1"]
```

## 集群部署

### 三节点集群

```yaml
cluster.name: my-cluster
node.name: node-1
node.master: true
node.data: true
network.host: 192.168.1.10
http.port: 9200
transport.tcp.port: 9300
discovery.seed_hosts:
  - 192.168.1.10:9300
  - 192.168.1.11:9300
  - 192.168.1.12:9300
cluster.initial_master_nodes:
  - node-1
  - node-2
  - node-3
```

### 验证集群

```bash
curl http://192.168.1.10:9200/_cluster/health
curl http://192.168.1.10:9200/_cat/nodes?v
```

## Docker 部署

### 单节点

```bash
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "ES_JAVA_OPTS=-Xms2g -Xmx2g" \
  -v es-data:/usr/share/elasticsearch/data \
  elasticsearch:7.17.0
```

### Docker Compose

```yaml
version: '3'
services:
  es01:
    image: elasticsearch:7.17.0
    environment:
      - node.name=es01
      - cluster.name=my-cluster
      - discovery.seed_hosts=es02,es03
      - cluster.initial_master_nodes=es01,es02,es03
      - ES_JAVA_OPTS=-Xms1g -Xmx1g
    ports:
      - "9200:9200"
    volumes:
      - es01-data:/usr/share/elasticsearch/data

  es02:
    image: elasticsearch:7.17.0
    environment:
      - node.name=es02
      - cluster.name=my-cluster
      - discovery.seed_hosts=es01,es03
      - ES_JAVA_OPTS=-Xms1g -Xmx1g
    volumes:
      - es02-data:/usr/share/elasticsearch/data

volumes:
  es01-data:
  es02-data:
```

## 安全配置

### TLS 配置

```yaml
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
xpack.security.transport.ssl.verification_mode: certificate
xpack.security.transport.ssl.keystore.path: certs/elastic-certificates.p12
xpack.security.transport.ssl.truststore.path: certs/elastic-certificates.p12
```

### 角色配置

```bash
POST /_security/role/my_role
{
  "cluster": ["monitor"],
  "indices": [{"names": ["my-*"], "privileges": ["all"]}]
}

POST /_security/user/my_user
{
  "password": "password123",
  "roles": ["my_role"]
}
```

## 备份恢复

```bash
# 创建仓库
PUT /_snapshot/my_backup
{
  "type": "fs",
  "settings": {"location": "/data/backup"}
}

# 创建快照
PUT /_snapshot/my_backup/snapshot_1

# 恢复
POST /_snapshot/my_backup/snapshot_1/_restore
```

## 上线检查清单

- 至少规划 3 个可参与选举的主节点，避免单点选主风险。
- JVM 堆内存固定 `Xms`/`Xmx`，并为文件系统缓存保留足够内存。
- 磁盘 watermark、分片数量、索引生命周期和快照策略已配置。
- 安全认证、TLS、最小权限账号和运维访问边界已明确。
- 已验证节点重启、索引恢复和快照恢复流程。

## 小结

- **硬件要求**：内存和 SSD 最重要
- **集群配置**：3 节点起步，副本保障高可用
- **安全配置**：开启认证和 TLS
- **备份恢复**：定期快照是数据安全关键
