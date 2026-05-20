---
title: Kubernetes 集群管理：架构、组件与部署
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-17T00:00:00.000+08:00
slug: kubernetes-deployment-guide
description: '讲解 Kubernetes 控制平面、工作节点、CRI 运行时、核心对象、工作负载发布和常用 kubectl 运维操作。'
tags:
  - DevOps
  - Kubernetes
  - 容器编排
  - 云原生
draft: false
series: Kubernetes
seriesOrder: 1
language: zh-CN
---

## 概述

Kubernetes（K8s）是容器编排平台，用于自动化部署、扩缩容和管理容器化应用。它关注的不是单个容器命令，而是通过声明式配置维护集群的期望状态。

需要注意：Kubernetes 已移除 dockershim，不再把 Docker Engine 作为内置容器运行时接口。生产集群通常使用符合 CRI 的运行时，例如 `containerd` 或 `CRI-O`。

## 阅读路线

学习 Kubernetes 时，不要从 YAML 字段硬背开始。更稳的顺序是先理解控制平面如何维护期望状态，再理解 Pod、Deployment、Service 这些对象如何协作，最后再扩展到网络、存储、监控和安全。

## 核心能力

| 能力 | 说明 |
|------|------|
| **声明式配置** | 使用 YAML 描述期望状态 |
| **副本管理** | 维持指定数量的 Pod |
| **自愈能力** | Pod 异常退出后自动重建 |
| **滚动更新** | 逐步发布新版本并支持回滚 |
| **服务发现** | 通过 Service 和 DNS 访问应用 |
| **负载均衡** | 在多个 Pod 副本之间分发流量 |
| **配置管理** | 使用 ConfigMap 和 Secret 管理配置 |
| **弹性伸缩** | 根据指标自动调整副本数 |

## 架构与组件

### 控制平面组件

过去很多资料把控制平面称为 Master。现在更推荐使用“控制平面”这一术语。

| 组件 | 说明 |
|------|------|
| `kube-apiserver` | Kubernetes API 入口 |
| `etcd` | 分布式键值存储，保存集群状态 |
| `kube-scheduler` | 为 Pod 选择合适节点 |
| `kube-controller-manager` | 运行各类控制器，维护期望状态 |
| `cloud-controller-manager` | 对接云厂商负载均衡、节点和存储资源 |

### 工作节点组件

| 组件 | 说明 |
|------|------|
| `kubelet` | 节点代理，负责创建和管理 Pod |
| `kube-proxy` | 维护 Service 网络转发规则 |
| `containerd` / `CRI-O` | 符合 CRI 的容器运行时 |
| CNI 插件 | 提供 Pod 网络，例如 Calico、Cilium、Flannel |

### 常见集群插件

| 插件 | 说明 |
|------|------|
| CoreDNS | 集群 DNS 服务，替代旧的 kube-dns |
| Metrics Server | 为 HPA 和 `kubectl top` 提供资源指标 |
| Ingress Controller | 提供 HTTP/HTTPS 入口能力 |
| CSI Driver | 对接存储系统，提供持久卷 |
| Dashboard | Web 管理界面，通常只用于受控内网环境 |

Heapster 已被 Metrics Server 等组件取代，不应再作为新集群监控方案。

## 核心对象

| 对象 | 说明 |
|------|------|
| **Pod** | Kubernetes 调度的最小单元，包含一个或多个容器 |
| **Deployment** | 管理无状态应用的副本和滚动更新 |
| **ReplicaSet** | 维持 Pod 副本数，通常由 Deployment 管理 |
| **StatefulSet** | 管理有稳定身份和存储需求的有状态应用 |
| **DaemonSet** | 保证每个目标节点运行一个 Pod |
| **Service** | 为一组 Pod 提供稳定访问入口 |
| **Ingress** | 管理集群入口 HTTP/HTTPS 路由 |
| **ConfigMap** | 保存非敏感配置 |
| **Secret** | 保存敏感配置，仍需结合加密和权限控制 |
| **Namespace** | 对资源进行逻辑隔离 |

## Pod

Pod 中的容器共享网络命名空间和部分存储。一个 Pod 会拥有自己的 IP，同一 Pod 内的容器可以通过 `localhost` 通信。

常见用法：

- 一个主业务容器。
- 一个主业务容器加一个 sidecar，例如日志采集或代理。
- 多个强耦合容器共享同一生命周期。

不要把多个无关服务硬塞进同一个 Pod。它们应该拆成不同 Deployment，并通过 Service 通信。

## Deployment 示例

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
          image: nginx:1.27-alpine
          ports:
            - containerPort: 80
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
```

应用配置：

```bash
kubectl apply -f deployment.yaml
kubectl get deployments
kubectl get pods -l app=nginx
```

## Service 示例

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
  type: ClusterIP
```

`ClusterIP` 只在集群内部暴露服务。需要外部访问时，可根据环境选择 `Ingress`、`LoadBalancer` 或 `NodePort`。

## 常用命令

```bash
# 集群信息
kubectl cluster-info
kubectl get nodes

# Pod 操作
kubectl get pods
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl exec -it <pod-name> -- sh

# Deployment 操作
kubectl get deployments
kubectl rollout status deployment/nginx-deployment
kubectl scale deployment nginx-deployment --replicas=5
kubectl rollout undo deployment/nginx-deployment

# Service 操作
kubectl get services
kubectl describe service nginx-service
```

## 运维检查清单

- 每个工作负载都配置资源 requests/limits 和 readinessProbe。
- 外部流量优先通过 Ingress 或云负载均衡统一管理。
- Secret 结合 RBAC、命名空间和加密策略使用。
- 发布前用 `kubectl rollout status` 观察滚动更新状态。
- 排障时按 Pod 事件、容器日志、Service 选择器、节点状态逐层检查。

## 小结

Kubernetes 的核心思路是“声明期望状态，由控制器持续调谐”。学习时应先分清控制平面、工作节点、CRI 运行时和核心对象，再逐步理解网络、存储、监控和安全策略。
