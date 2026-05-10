---
title: Kubernetes 集群管理：架构、组件与部署
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: kubernetes-deployment-guide
description: '深入讲解Kubernetes集群管理工具，包括架构、组件和部署方法。'
tags:
  - Docker
  - Kubernetes
  - 容器编排
draft: false
series: docker
language: zh-CN
---

## 概述

Kubernetes（K8S）是 Google 于 2014 年开源的容器集群管理系统，使用 Go 语言开发。它基于 Google 内部的 Borg 系统，用于自动化部署、扩展和管理容器应用。

### 核心功能

| 功能 | 说明 |
|------|------|
| **数据卷** | Pod 中容器之间共享数据 |
| **健康检查** | 监控检查策略保证应用健壮性 |
| **副本控制** | 维护 Pod 副本数量 |
| **弹性伸缩** | 根据指标自动缩放 Pod 副本数 |
| **服务发现** | 环境变量或 DNS 服务 |
| **负载均衡** | 一组 Pod 副本分配集群 IP |
| **滚动更新** | 逐个更新 Pod，不中断服务 |
| **资源监控** | 集成 cAdvisor 资源收集 |

## 架构与组件

### Master 组件

| 组件 | 说明 |
|------|------|
| `kube-apiserver` | 资源操作的唯一入口 |
| `kube-controller-manager` | 维护集群状态 |
| `kube-scheduler` | 资源调度，分配 Pod 到节点 |
| `etcd` | 分布式键值存储，保存集群状态 |

### Node 组件

| 组件 | 说明 |
|------|------|
| `kubelet` | 管理 Pod 和容器生命周期 |
| `kube-proxy` | 提供服务发现和负载均衡 |
| `docker/rkt` | 运行容器 |

### 插件

| 插件 | 说明 |
|------|------|
| `kube-dns` | 为集群提供 DNS 服务 |
| `Ingress Controller` | 提供外网入口 |
| `Heapster` | 资源监控 |
| `Dashboard` | GUI 管理界面 |

## 基本对象概念

### 核心对象

| 对象 | 说明 |
|------|------|
| **Pod** | 最小部署单元，包含一个或多个容器 |
| **Service** | 应用服务抽象，定义 Pod 逻辑集合 |
| **Volume** | 数据卷，共享容器数据 |
| **Namespace** | 命名空间，多租户隔离 |
| **Label** | 标签，用于区分对象 |

### 高级对象

| 对象 | 说明 |
|------|------|
| **Deployment** | 管理 ReplicaSets 和 Pod |
| **StatefulSet** | 持久化应用，有唯一网络标识 |
| **DaemonSet** | 所有节点运行同一个 Pod |
| **Job** | 一次性任务 |

## 重要概念

### Cluster

Cluster 是计算、存储和网络资源的集合，Kubernetes 利用这些资源运行基于容器的应用。

### Master

集群管理节点，负责管理集群，提供资源数据访问入口。

### Node

工作节点，运行 Pod 的服务节点，运行关键进程：

| 进程 | 说明 |
|------|------|
| `kubelet` | 创建和管理 Pod |
| `kube-proxy` | Service 通信与负载均衡 |
| `Docker` | 容器创建和管理 |

### Pod

Pod 是 Kubernetes 调度的最小单位，可以包含一个或多个共享网络和存储的容器。

**Pod 特点：**
- 共享同一网络命名空间（相同 IP 和端口）
- 可以共享存储
- 紧密耦合的容器组合

### Deployment 示例

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.19
        ports:
        - containerPort: 80
```

### Service 示例

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
```

## 常用命令

```bash
# 集群操作
kubectl cluster-info              # 查看集群信息
kubectl get nodes                 # 查看节点

# Pod 操作
kubectl get pods                  # 查看 Pod
kubectl describe pod <name>       # 查看 Pod 详情
kubectl logs <pod-name>           # 查看日志
kubectl exec -it <pod-name> -- /bin/bash  # 进入容器

# Deployment 操作
kubectl get deployments           # 查看 Deployment
kubectl apply -f <file.yaml>      # 应用配置
kubectl scale deployment nginx --replicas=3  # 扩缩容

# Service 操作
kubectl get services              # 查看 Service
kubectl delete service <name>     # 删除 Service
```

## 小结

Kubernetes 是容器编排领域的标杆，它的：

- **声明式配置**：通过 YAML 文件定义期望状态
- **自愈能力**：自动恢复失败的容器
- **弹性伸缩**：根据负载自动调整副本数
- **服务发现**：内置 DNS 和负载均衡