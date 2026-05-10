---
title: Milvus 环境配置与安装部署
series: 'Milvus'
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: milvus-installation
description: '详细介绍Milvus单机部署和分布式部署的安装配置方法。'
tags:
  - Milvus
  - 向量数据库
  - 安装部署
  - Docker
draft: false
language: zh-CN
---

## 概述

Milvus 支持多种部署方式，从单机测试到大规模生产环境。本文将详细介绍 Milvus 的安装部署方法，包括 Docker Compose 单机部署、Kubernetes 分布式部署以及配置优化。

### 部署方式对比

| 方式 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| **Docker Compose** | 开发测试 | 快速简单 | 不适合生产 |
| **Helm Chart** | 生产环境 | 可扩展 | 配置复杂 |
| **Kubernetes** | 大规模部署 | 高可用 | 需要 K8s 经验 |
| **源码编译** | 定制需求 | 灵活 | 耗时 |

## Docker Compose 部署

### 环境要求

| 要求 | 最小配置 | 推荐配置 |
|------|----------|----------|
| **CPU** | 4 核 | 8+ 核 |
| **内存** | 8 GB | 16+ GB |
| **磁盘** | 50 GB | 100+ GB SSD |
| **Docker** | 20.10+ | 最新版 |
| **Docker Compose** | 1.29+ | 最新版 |

### 安装 Docker 和 Docker Compose

```bash
# 安装 Docker (Ubuntu)
curl -fsSL https://get.docker.com | bash

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 下载 Milvus 配置

```bash
# 创建目录
mkdir -p /opt/milvus
cd /opt/milvus

# 下载配置文件
wget https://github.com/milvus-io/milvus/releases/download/v2.3.0/milvus-standalone-docker-compose.yml

# 重命名
mv milvus-standalone-docker-compose.yml docker-compose.yml
```

### 启动 Milvus

```bash
# 拉取镜像并启动
docker-compose up -d

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f milvus-standalone
```

### 配置自定义

```yaml
# docker-compose.yml
version: '3.8'

services:
  etcd:
    container_name: milvus-etcd
    image: quay.io/coreos/etcd:v3.5.5
    environment:
      - ETCD_AUTO_COMPACTION_MODE=revision
      - ETCD_AUTO_COMPACTION_RETENTION=1000
      - ETCD_QUOTA_BACKEND_BYTES=4294967296
    volumes:
      - etcd_data:/etcd
    command: etcd -advertise-client-urls=http://127.0.0.1:2379 -listen-client-urls=http://0.0.0.0:2379 --data-dir=/etcd

  minio:
    container_name: milvus-minio
    image: minio/minio:RELEASE.2023-03-20T20-16-18Z
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    volumes:
      - minio_data:/minio_data
    command: minio server /minio_data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]

  milvus:
    container_name: milvus-standalone
    image: milvusdb/milvus:v2.3.0
    command: ["milvus", "run", "standalone"]
    environment:
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    volumes:
      - milvus_data:/var/lib/milvus
    ports:
      - "19530:19530"      # Milvus 服务端口
      - "9091:9091"        # Prometheus 端口
    depends_on:
      - etcd
      - minio

volumes:
  etcd_data:
  minio_data:
  milvus_data:
```

## Kubernetes 部署

### 前置条件

```bash
# 安装 kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# 安装 Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# 验证安装
kubectl version --client
helm version
```

### 添加 Milvus Helm 仓库

```bash
# 添加仓库
helm repo add milvus https://milvus-io.github.io/milvus-helm

# 更新仓库
helm repo update

# 搜索 Milvus
helm search repo milvus
```

### 部署 Milvus

```bash
# 创建 namespace
kubectl create namespace milvus

# 部署 Milvus
helm install my-milvus milvus/milvus \
  --namespace milvus \
  --set mode=standalone \
  --set persistence.enabled=true \
  --set persistence.storageClass=gp2

# 查看部署状态
kubectl get pods -n milvus

# 查看服务
kubectl get svc -n milvus
```

### 配置生产环境

```bash
# 部署分布式 Milvus
helm install my-milvus milvus/milvus \
  --namespace milvus \
  --set mode=cluster \
  --set indexNode.replicas=2 \
  --set queryNode.replicas=2 \
  --set dataNode.replicas=2 \
  --set persistence.enabled=true \
  --set persistence.storageClass=fast-ssd \
  --set etcd.persistence.storageClass=fast-ssd \
  --set minio.persistence.storageClass=fast-ssd
```

### 高可用配置

```yaml
# values-ha.yaml
mode: cluster

# 数据节点配置
dataNode:
  replicas: 3
  resources:
    limits:
      cpu: "2"
      memory: 8Gi

# 查询节点配置
queryNode:
  replicas: 3
  resources:
    limits:
      cpu: "2"
      memory: 8Gi

# 索引节点配置
indexNode:
  replicas: 2
  resources:
    limits:
      cpu: "4"
      memory: 16Gi

# 持久化存储
persistence:
  enabled: true
  storageClass: "fast-ssd"
  accessModes:
    - ReadWriteOnce
  size: 100Gi
```

## Python SDK 连接

### 安装 pymilvus

```bash
# 使用 pip 安装
pip install pymilvus

# 或使用 conda
conda install -c conda-forge pymilvus

# 验证安装
python -c "from pymilvus import connections; print('pymilvus 安装成功')"
```

### 基本连接

```python
from pymilvus import connections, Collection

# 1. 连接 Milvus
connections.connect(
    host='localhost',      # Milvus 服务器地址
    port='19530',         # Milvus 端口
    alias='default'         # 连接别名
)

print("Milvus 连接成功！")

# 2. 执行操作...

# 3. 断开连接
connections.disconnect('default')
```

### 连接配置选项

```python
# TLS 连接
connections.connect(
    host='milvus.example.com',
    port='19530',
    secure=True,
    tls_cert_check=True,
    tls_cert_file='/path/to/cert.pem',
    user='user',
    password='password'
)

# 连接池配置
pool = {
    'max_pool_size': 10,
    'idle_timeout': 30
}

connections.connect(
    host='localhost',
    port='19530',
    pool=pool
)
```

## 配置优化

### 系统参数调优

```bash
# 调整系统限制
echo "* soft nofile 655360" >> /etc/security/limits.conf
echo "* hard nofile 655360" >> /etc/security/limits.conf
echo "* soft nproc 131072" >> /etc/security/limits.conf
echo "* hard nproc 131072" >> /etc/security/limits.conf

# 调整内核参数
echo "vm.max_map_count=655360" >> /etc/sysctl.conf
sysctl -p
```

### Milvus 参数调优

```yaml
# milvus.yaml
common:
  retentionDuration:
    # 数据保留时间（秒）
    gc:
      enabled: true
      interval: 1h

dataCoord:
  # 数据段配置
  segment:
    maxSize: 512      # MB
    sealProportion: 0.25

queryCoord:
  # 查询调度配置
  autoHandoff: true
  autoBalance: true
```

## 客户端连接池

### 最佳实践

```python
from pymilvus import connections, Collection

class MilvusClient:
    """Milvus 连接管理类"""
    
    def __init__(self, host='localhost', port='19530'):
        self.connections = connections
        self.connections.connect(
            host=host,
            port=port,
            alias='default'
        )
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.connections.disconnect('default')
    
    def get_collection(self, name):
        return Collection(name)

# 使用上下文管理器
with MilvusClient('localhost', '19530') as client:
    collection = client.get_collection('my_collection')
    # 执行操作
```

## 监控配置

### Prometheus + Grafana

```bash
# 启用 Prometheus
helm upgrade my-milvus milvus/milvus \
  --set metrics.enabled=true \
  --set metrics.serviceMonitor.enabled=true

# 查看 Prometheus metrics
kubectl port-forward svc/prometheus 9090:9090

# 查看 Grafana
kubectl port-forward svc/grafana 3000:3000
```

### 监控指标

| 指标 | 说明 |
|------|------|
| **QueryNode_query_vectors** | 查询向量数 |
| **DataNode_insert_vectors** | 插入向量数 |
| **QueryCoord_search_requests** | 搜索请求数 |
| **IndexNode_build_index** | 索引构建数 |

## 备份和恢复

### 数据备份

```bash
# Milvus backup 工具
git clone https://github.com/milvus-io/milvus-backup.git

cd milvus-backup

# 构建
go build -o milvus-backup

# 创建备份
./milvus-backup create -n backup_20240101

# 查看备份
./milvus-backup list
```

### 数据恢复

```bash
# 恢复备份
./milvus-backup restore -n backup_20240101 -t target_collection
```

## 常见问题

### 问题 1：连接超时

```python
# 增加超时时间
connections.connect(
    host='localhost',
    port='19530',
    timeout=60  # 60秒超时
)
```

### 问题 2：内存不足

```bash
# 查看 Milvus 日志
docker-compose logs milvus-standalone | grep OOM

# 增加内存限制
# docker-compose.yml
milvus:
  mem_limit: 16g
  mem_reservation: 4g
```

### 问题 3：磁盘空间不足

```bash
# 清理旧数据
docker system prune -a

# 扩展存储卷
docker volume create milvus_data
```


