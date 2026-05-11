---
title: RAG 生产部署：从开发到上线的完整指南
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: rag-production-deployment
description: '全面讲解RAG系统从开发到生产环境部署的最佳实践，包括架构设计、容器化、监控告警和持续优化。'
tags:
  - RAG
  - 生产部署
  - DevOps
  - 监控
  - 最佳实践
draft: false
series: RAG
language: zh-CN
---

## 概述

将 RAG 系统从开发环境迁移到生产环境需要考虑可靠性、性能、安全性和可维护性等多个方面。本篇将详细介绍生产级 RAG 系统的完整部署流程和最佳实践。

### 生产部署架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                     生产级 RAG 架构                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      用户请求                               │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                            │                                      │
│                            ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    负载均衡 (Nginx)                         │  │
│  │                    限流、SSL termination                    │  │
│  └─────────────────────────┬───────────────────────────────┘    │
│                            │                                      │
│           ┌────────────────┼────────────────┐                     │
│           ▼                ▼                ▼                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  API Server │  │  API Server │  │  API Server │              │
│  │  (实例1)     │  │  (实例2)     │  │  (实例3)     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│           │                │                │                     │
│           └────────────────┼────────────────┘                     │
│                            │                                      │
│                            ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   缓存层 (Redis)                            │  │
│  │                   查询缓存、会话缓存                          │  │
│  └─────────────────────────┬───────────────────────────────┘    │
│                            │                                      │
│                            ▼                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  向量数据库  │  │  关系数据库  │  │  对象存储    │            │
│  │  (Pinecone) │  │  (PostgreSQL)│  │  (S3/MinIO)  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 项目结构

```
rag-production/
├── src/
│   ├── __init__.py
│   ├── config.py           # 配置管理
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py         # FastAPI 主入口
│   │   ├── routes/
│   │   │   ├── query.py    # 查询接口
│   │   │   └── upload.py   # 文档上传接口
│   │   └── middleware/
│   │       ├── auth.py      # 认证中间件
│   │       └── logging.py   # 日志中间件
│   ├── core/
│   │   ├── loader.py        # 文档加载
│   │   ├── chunker.py       # 文本分割
│   │   ├── vectorstore.py   # 向量存储
│   │   ├── retriever.py    # 检索器
│   │   └── generator.py    # 生成器
│   ├── agents/
│   │   └── rag_agent.py    # RAG Agent
│   └── utils/
│       ├── cache.py         # 缓存工具
│       └── metrics.py       # 指标收集
├── tests/
│   ├── unit/
│   ├── integration/
│   └── load/
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── nginx.conf
├── k8s/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ingress.yaml
├── .env.example
├── requirements.txt
├── pyproject.toml
└── README.md
```

## 配置管理

### 环境配置

```python
from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache

class Settings(BaseSettings):
    # 应用配置
    app_name: str = "RAG System"
    app_version: str = "1.0.0"
    debug: bool = False

    # API 配置
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    workers: int = 4

    # OpenAI 配置
    openai_api_key: str
    openai_model: str = "gpt-4"
    openai_embeddings_model: str = "text-embedding-3-small"

    # 向量数据库配置
    vectorstore_type: str = "chroma"
    chroma_persist_directory: str = "./data/chroma"
    pinecone_api_key: Optional[str] = None
    pinecone_environment: Optional[str] = None

    # Redis 配置
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0

    # 数据库配置
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "rag_db"
    postgres_user: str = "rag_user"
    postgres_password: str

    # 存储配置
    s3_endpoint: Optional[str] = None
    s3_access_key: Optional[str] = None
    s3_secret_key: Optional[str] = None
    s3_bucket: str = "rag-documents"

    # 性能配置
    max_concurrent_requests: int = 100
    request_timeout: int = 60
    embedding_batch_size: int = 100

    # RAG 配置
    chunk_size: int = 1000
    chunk_overlap: int = 200
    retrieval_k: int = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

### 配置验证

```python
from pydantic import validator

class Settings(BaseSettings):
    openai_api_key: str

    @validator("openai_api_key")
    def validate_api_key(cls, v):
        if not v or v == "your-api-key":
            raise ValueError("请设置有效的 OpenAI API Key")
        if not v.startswith("sk-"):
            raise ValueError("API Key 格式不正确")
        return v

    chunk_size: int = 1000

    @validator("chunk_size")
    def validate_chunk_size(cls, v):
        if v < 100:
            raise ValueError("chunk_size 必须 >= 100")
        if v > 8000:
            raise ValueError("chunk_size 必须 <= 8000")
        return v

    max_concurrent_requests: int = 100

    @validator("max_concurrent_requests")
    def validate_concurrency(cls, v):
        if v < 1:
            raise ValueError("max_concurrent_requests 必须 >= 1")
        if v > 1000:
            raise ValueError("max_concurrent_requests 不宜超过 1000")
        return v
```

## API 开发

### FastAPI 主入口

```python
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time

from src.config import settings
from src.api.routes import query_router, upload_router
from src.utils.metrics import MetricsCollector

metrics = MetricsCollector()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.info("RAG 系统启动中...")

    await initialize_vectorstore()
    await initialize_cache()

    logging.info("RAG 系统启动完成")

    yield

    logging.info("RAG 系统关闭中...")
    await cleanup_resources()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()

    try:
        response = await call_next(request)

        duration = time.time() - start_time
        metrics.record_request(
            endpoint=request.url.path,
            method=request.method,
            duration=duration,
            status=response.status_code
        )

        return response

    except Exception as e:
        duration = time.time() - start_time
        metrics.record_error(
            endpoint=request.url.path,
            error_type=type(e).__name__
        )
        raise

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logging.error(f"未处理异常: {exc}", exc_info=True)

    return JSONResponse(
        status_code=500,
        content={"error": "内部服务器错误"}
    )

app.include_router(query_router, prefix="/api/v1", tags=["query"])
app.include_router(upload_router, prefix="/api/v1", tags=["upload"])

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.app_version,
        "vectorstore": await check_vectorstore(),
        "cache": await check_cache()
    }

@app.get("/metrics")
async def get_metrics():
    return metrics.get_all_metrics()
```

### 查询接口

```python
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import uuid

from src.core.rag_chain import RAGChain
from src.api.middleware.auth import verify_api_key

router = APIRouter()

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    use_rag: bool = True
    retrieval_k: int = Field(default=5, ge=1, le=20)
    temperature: float = Field(default=0.7, ge=0, le=2)

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict]
    session_id: str
    latency: float
    tokens_used: Optional[int] = None

class FeedbackRequest(BaseModel):
    query: str
    answer: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

@router.post("/query", response_model=QueryResponse)
async def query(
    request: QueryRequest,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_api_key)
):
    start_time = time.time()
    session_id = request.session_id or str(uuid.uuid4())

    try:
        rag_chain = get_rag_chain()

        result = await rag_chain.query(
            query=request.query,
            session_id=session_id,
            use_rag=request.use_rag,
            k=request.retrieval_k,
            temperature=request.temperature
        )

        latency = time.time() - start_time

        background_tasks.add_task(
            log_query,
            session_id=session_id,
            query=request.query,
            answer=result["answer"],
            latency=latency
        )

        return QueryResponse(
            answer=result["answer"],
            sources=result.get("sources", []),
            session_id=session_id,
            latency=latency,
            tokens_used=result.get("tokens_used")
        )

    except Exception as e:
        logging.error(f"查询处理失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback")
async def submit_feedback(
    request: FeedbackRequest,
    api_key: str = Depends(verify_api_key)
):
    await save_feedback(
        query=request.query,
        answer=request.answer,
        rating=request.rating,
        comment=request.comment
    )

    return {"status": "success", "message": "反馈已提交"}

@router.get("/history/{session_id}")
async def get_history(
    session_id: str,
    limit: int = 20,
    api_key: str = Depends(verify_api_key)
):
    history = await get_session_history(session_id, limit)

    return {"session_id": session_id, "history": history}
```

### 文档上传接口

```python
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
import hashlib
import aiofiles
import os
from datetime import datetime

router = APIRouter()

class UploadResponse(BaseModel):
    file_id: str
    filename: str
    status: str
    chunks_created: int
    processing_time: float

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".docx", ".doc"}
MAX_FILE_SIZE = 50 * 1024 * 1024

@router.post("/upload", response_model=UploadResponse)
async def upload_documents(
    files: List[UploadFile] = File(...),
    category: Optional[str] = None,
    api_key: str = Depends(verify_api_key)
):
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="每次最多上传10个文件")

    results = []

    for file in files:
        result = await process_single_file(file, category)
        results.append(result)

    return UploadResponse(
        file_id=results[0]["file_id"],
        filename=", ".join([r["filename"] for r in results]),
        status="completed",
        chunks_created=sum(r["chunks_created"] for r in results),
        processing_time=sum(r["processing_time"] for r in results)
    )

async def process_single_file(file: UploadFile, category: str = None) -> Dict:
    start_time = time.time()

    if not any(file.filename.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件格式: {file.filename}"
        )

    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"文件过大: {file.filename} (最大50MB)"
        )

    file_hash = hashlib.md5(content).hexdigest()
    file_id = f"{file_hash}_{datetime.now().strftime('%Y%m%d%H%M%S')}"

    upload_dir = f"./uploads/{datetime.now().strftime('%Y%m%d')}"
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, f"{file_id}_{file.filename}")

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    chunks = await process_and_index_document(
        file_path=file_path,
        file_id=file_id,
        category=category,
        original_filename=file.filename
    )

    processing_time = time.time() - start_time

    await record_upload_metadata(
        file_id=file_id,
        filename=file.filename,
        category=category,
        chunks_created=len(chunks),
        file_size=len(content)
    )

    return {
        "file_id": file_id,
        "filename": file.filename,
        "chunks_created": len(chunks),
        "processing_time": processing_time
    }
```

## Docker 部署

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - POSTGRES_HOST=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    depends_on:
      - redis
      - postgres
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '0.5'
          memory: 1G

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --maxmemory 1gb --maxmemory-policy allkeys-lru
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=rag_db
      - POSTGRES_USER=rag_user
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:
```

### Nginx 配置

```nginx
upstream rag_api {
    least_conn;

    server api:8000 weight=10 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name rag.example.com;

    client_max_body_size 50M;

    location /health {
        proxy_pass http://rag_api;
        proxy_connect_timeout 5s;
        proxy_read_timeout 10s;
    }

    location /api {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://rag_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /docs {
        proxy_pass http://rag_api;
        proxy_set_header Host $host;
    }

    location /metrics {
        proxy_pass http://rag_api;
        allow 10.0.0.0/8;
        deny all;
    }
}

limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
```

## Kubernetes 部署

### deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rag-api
  labels:
    app: rag-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rag-api
  template:
    metadata:
      labels:
        app: rag-api
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8000"
    spec:
      containers:
        - name: rag-api
          image: rag-system:latest
          ports:
            - containerPort: 8000
          env:
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: rag-secrets
                  key: openai-api-key
            - name: REDIS_HOST
              value: "redis-service"
            - name: REDIS_PORT
              value: "6379"
          resources:
            requests:
              cpu: 500m
              memory: 1Gi
            limits:
              cpu: 2000m
              memory: 4Gi
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 2
          volumeMounts:
            - name: data
              mountPath: /app/data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: rag-data-pvc

---
apiVersion: v1
kind: Service
metadata:
  name: rag-api-service
spec:
  selector:
    app: rag-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8000
  type: ClusterIP

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: rag-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: rag-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### ingress.yaml

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: rag-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - rag.example.com
      secretName: rag-tls
  rules:
    - host: rag.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: rag-api-service
                port:
                  number: 80
          - path: /docs
            pathType: Prefix
            backend:
              service:
                name: rag-api-service
                port:
                  number: 80
```

## 监控与告警

### Prometheus 指标

```python
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry

registry = CollectorRegistry()

request_counter = Counter(
    "rag_requests_total",
    "Total RAG requests",
    ["endpoint", "method", "status"],
    registry=registry
)

request_duration = Histogram(
    "rag_request_duration_seconds",
    "Request duration in seconds",
    ["endpoint"],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
    registry=registry
)

active_requests = Gauge(
    "rag_active_requests",
    "Number of active requests",
    registry=registry
)

cache_hit_rate = Gauge(
    "rag_cache_hit_rate",
    "Cache hit rate",
    registry=registry
)

embedding_duration = Histogram(
    "rag_embedding_duration_seconds",
    "Embedding generation duration",
    ["model"],
    registry=registry
)

llm_tokens = Counter(
    "rag_llm_tokens_total",
    "Total LLM tokens used",
    ["model", "type"],
    registry=registry
)

class MetricsCollector:
    def __init__(self):
        self.registry = registry

    def record_request(self, endpoint: str, method: str, duration: float, status: int):
        request_counter.labels(
            endpoint=endpoint,
            method=method,
            status=status
        ).inc()

        request_duration.labels(endpoint=endpoint).observe(duration)

    def record_embedding(self, model: str, duration: float):
        embedding_duration.labels(model=model).observe(duration)

    def record_tokens(self, model: str, prompt_tokens: int, completion_tokens: int):
        llm_tokens.labels(model=model, type="prompt").inc(prompt_tokens)
        llm_tokens.labels(model=model, type="completion").inc(completion_tokens)

    def set_cache_hit_rate(self, rate: float):
        cache_hit_rate.set(rate)

metrics_collector = MetricsCollector()
```

### Grafana 仪表盘

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboard
  labels:
    app: grafana
data:
  rag-dashboard.json: |
    {
      "dashboard": {
        "title": "RAG System Metrics",
        "panels": [
          {
            "title": "Request Rate",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(rag_requests_total[5m])",
                "legendFormat": "{{endpoint}}"
              }
            ]
          },
          {
            "title": "Latency Distribution",
            "type": "heatmap",
            "targets": [
              {
                "expr": "rate(rag_request_duration_seconds_bucket[5m])",
                "legendFormat": "{{le}}"
              }
            ]
          },
          {
            "title": "Cache Hit Rate",
            "type": "gauge",
            "targets": [
              {
                "expr": "rag_cache_hit_rate"
              }
            ]
          },
          {
            "title": "Token Usage",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(rag_llm_tokens_total[1h])",
                "legendFormat": "{{model}} - {{type}}"
              }
            ]
          }
        ]
      }
    }
```

### 告警规则

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: rag-alerts
spec:
  groups:
    - name: rag-alerts
      rules:
        - alert: HighErrorRate
          expr: |
            sum(rate(rag_requests_total{status=~"5.."}[5m]))
            / sum(rate(rag_requests_total[5m])) > 0.05
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "RAG 系统错误率过高"
            description: "错误率超过 5%，当前值: {{ $value }}"

        - alert: HighLatency
          expr: |
            histogram_quantile(0.95, sum(rate(rag_request_duration_seconds_bucket[5m])) by (le)) > 5
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "RAG 系统延迟过高"
            description: "P95 延迟超过 5 秒，当前值: {{ $value }}秒"

        - alert: LowCacheHitRate
          expr: rag_cache_hit_rate < 0.5
          for: 15m
          labels:
            severity: warning
          annotations:
            summary: "缓存命中率低"
            description: "缓存命中率低于 50%，当前值: {{ $value }}"

        - alert: HighTokenUsage
          expr: |
            sum(rate(rag_llm_tokens_total[1h])) > 100000
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Token 使用量过高"
            description: "小时 Token 使用量超过 10 万，当前值: {{ $value }}"
```

## 日志系统

### 结构化日志

```python
import logging
import json
from datetime import datetime
from typing import Dict, Any

class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }

        if hasattr(record, "extra_data"):
            log_data.update(record.extra_data)

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data, ensure_ascii=False)

def setup_logging(log_level: str = "INFO"):
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())

    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    root_logger.setLevel(getattr(logging, log_level.upper()))

    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

setup_logging()

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)

    def log(self, level: str, message: str, **kwargs):
        extra = {"extra_data": kwargs}
        getattr(self.logger, level.lower())(message, extra=extra)

    def info(self, message: str, **kwargs):
        self.log("INFO", message, **kwargs)

    def error(self, message: str, **kwargs):
        self.log("ERROR", message, **kwargs)

    def warning(self, message: str, **kwargs):
        self.log("WARNING", message, **kwargs)

logger = StructuredLogger("rag")
logger.info("处理查询", query_id="123", user_id="456", latency=0.5)
```

### 日志聚合配置

```yaml
# Loki 配置
server:
  http_listen_port: 3100

limits_config:
  reject_old_samples: true
  max_entries_limit: 5000000

auth_enabled: false

ingester:
  lifecycler:
    address: 127.0.0.1
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2024-01-01
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /data/loki/index
  filesystem:
    directory: /data/loki/chunks

# Promtail 配置
scrape_configs:
  - job_name: rag-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: rag-logs
          __path__: /var/log/rag/*.log
    pipeline_stages:
      - json:
          expressions:
            timestamp: timestamp
            level: level
            message: message
      - labels:
          level:
          service:
```

## 安全措施

### API 认证

```python
from fastapi import Security, HTTPException, Depends
from fastapi.security import APIKeyHeader
from typing import Optional
import hashlib
import time

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

VALID_API_KEYS = {}

def create_api_key(name: str, expires_in_days: int = 30) -> str:
    key = hashlib.sha256(f"{name}{time.time()}".encode()).hexdigest()[:32]

    expires_at = time.time() + expires_in_days * 86400

    VALID_API_KEYS[key] = {
        "name": name,
        "expires_at": expires_at,
        "rate_limit": 100
    }

    return key

async def verify_api_key(api_key: Optional[str] = Security(api_key_header)) -> str:
    if not api_key:
        raise HTTPException(status_code=401, detail="缺少 API Key")

    if api_key not in VALID_API_KEYS:
        raise HTTPException(status_code=401, detail="无效的 API Key")

    key_info = VALID_API_KEYS[api_key]

    if time.time() > key_info["expires_at"]:
        raise HTTPException(status_code=401, detail="API Key 已过期")

    return key_info["name"]

def rate_limit_key(api_key: str) -> str:
    return f"rate_limit:{api_key}"

def check_rate_limit(api_key: str, max_requests: int = 100, window: int = 60) -> bool:
    key = rate_limit_key(api_key)

    current = redis.get(key)

    if current is None:
        redis.setex(key, window, 1)
        return True

    if int(current) >= max_requests:
        return False

    redis.incr(key)
    return True
```

### 数据脱敏

```python
import re
from typing import Dict, Any

class DataSanitizer:
    def __init__(self):
        self.patterns = {
            "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            "phone": r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            "credit_card": r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',
            "ssn": r'\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b'
        }

    def sanitize(self, text: str, patterns: list = None) -> str:
        if patterns is None:
            patterns = list(self.patterns.keys())

        sanitized = text

        for pattern_name in patterns:
            if pattern_name in self.patterns:
                pattern = self.patterns[pattern_name]
                sanitized = re.sub(pattern, f'[{pattern_name}已脱敏]', sanitized)

        return sanitized

    def sanitize_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        sanitized = {}

        for key, value in data.items():
            if isinstance(value, str):
                sanitized[key] = self.sanitize(value)
            elif isinstance(value, dict):
                sanitized[key] = self.sanitize_dict(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    self.sanitize(v) if isinstance(v, str) else v
                    for v in value
                ]
            else:
                sanitized[key] = value

        return sanitized

sanitizer = DataSanitizer()

sanitized_text = sanitizer.sanitize("联系邮箱: user@example.com")
print(sanitized_text)
```

## 持续集成与部署

### GitHub Actions

```yaml
name: RAG CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run linting
        run: |
          ruff check src/
          mypy src/

      - name: Run tests
        run: pytest tests/ -v --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/rag:${{ github.sha }}
            ghcr.io/${{ github.repository }}/rag:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v1
        with:
          namespace: production
          manifests: |
            k8s/deployment.yaml
            k8s/service.yaml
            k8s/ingress.yaml
          images: |
            ghcr.io/${{ github.repository }}/rag:${{ github.sha }}
```

## 性能基准测试

```python
import asyncio
import time
from typing import List, Dict
import statistics

class LoadTester:
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url
        self.api_key = api_key

    async def run_load_test(
        self,
        concurrency: int = 10,
        total_requests: int = 1000,
        queries: List[str] = None
    ):
        queries = queries or [
            "Python 装饰器是什么？",
            "解释机器学习",
            "RAG 系统的工作原理"
        ]

        results = []
        errors = 0

        async with aiohttp.ClientSession() as session:
            tasks = []

            for i in range(total_requests):
                query = queries[i % len(queries)]
                task = self._make_request(session, query)
                tasks.append(task)

            start_time = time.time()

            for i in range(0, len(tasks), concurrency):
                batch = tasks[i:i+concurrency]
                batch_results = await asyncio.gather(*batch, return_exceptions=True)

                for result in batch_results:
                    if isinstance(result, Exception):
                        errors += 1
                    else:
                        results.append(result)

            total_time = time.time() - start_time

        return self._generate_report(results, errors, total_time)

    async def _make_request(self, session, query: str) -> Dict:
        start = time.time()

        async with session.post(
            f"{self.api_url}/api/v1/query",
            json={"query": query},
            headers={"X-API-Key": self.api_key}
        ) as response:
            result = await response.json()
            latency = time.time() - start

            return {
                "latency": latency,
                "status": response.status,
                "tokens": result.get("tokens_used")
            }

    def _generate_report(self, results: List[Dict], errors: int, total_time: float):
        latencies = [r["latency"] for r in results]

        return {
            "total_requests": len(results) + errors,
            "successful_requests": len(results),
            "failed_requests": errors,
            "total_time": total_time,
            "requests_per_second": len(results) / total_time,
            "avg_latency": statistics.mean(latencies),
            "p50_latency": statistics.median(latencies),
            "p95_latency": statistics.quantiles(latencies, n=20)[18],
            "p99_latency": statistics.quantiles(latencies, n=100)[98],
            "total_tokens": sum(r.get("tokens", 0) for r in results)
        }

tester = LoadTester("https://rag.example.com", "your-api-key")
report = await tester.run_load_test(concurrency=20, total_requests=1000)

print(f"QPS: {report['requests_per_second']:.2f}")
print(f"P95 延迟: {report['p95_latency']:.3f}s")
```

## 灾难恢复

### 自动故障转移

```python
import asyncio
from typing import Optional

class FailoverManager:
    def __init__(self):
        self.primary_endpoint = "http://primary-api:8000"
        self.secondary_endpoint = "http://secondary-api:8000"
        self.current_endpoint = self.primary_endpoint

    async def health_check(self, endpoint: str) -> bool:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{endpoint}/health", timeout=5) as response:
                    return response.status == 200
        except:
            return False

    async def switch_endpoint(self):
        if self.current_endpoint == self.primary_endpoint:
            new_endpoint = self.secondary_endpoint
        else:
            new_endpoint = self.primary_endpoint

        if await self.health_check(new_endpoint):
            self.current_endpoint = new_endpoint
            logging.info(f"故障转移至: {new_endpoint}")
            return True

        return False

    async def monitor_and_failover(self):
        while True:
            if not await self.health_check(self.current_endpoint):
                logging.warning(f"当前端点不可用: {self.current_endpoint}")

                if await self.switch_endpoint():
                    await self.notify_failover()

            await asyncio.sleep(30)

failover_manager = FailoverManager()
asyncio.create_task(failover_manager.monitor_and_failover())
```

### 数据备份策略

```python
import asyncio
from datetime import datetime, timedelta

class BackupManager:
    def __init__(self, vectorstore, db_connection):
        self.vectorstore = vectorstore
        self.db = db_connection

    async def backup_vectorstore(self):
        backup_dir = f"./backups/vectorstore_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        os.makedirs(backup_dir, exist_ok=True)

        await self.vectorstore.backup(backup_dir)

        await self.db.execute(
            "INSERT INTO backups (type, path, created_at) VALUES ($1, $2, $3)",
            ["vectorstore", backup_dir, datetime.now()]
        )

        logging.info(f"向量数据库已备份至: {backup_dir}")

    async def cleanup_old_backups(self, retention_days: int = 30):
        cutoff_date = datetime.now() - timedelta(days=retention_days)

        old_backups = await self.db.fetch(
            "SELECT * FROM backups WHERE created_at < $1",
            [cutoff_date]
        )

        for backup in old_backups:
            os.remove(backup["path"])

            await self.db.execute(
                "DELETE FROM backups WHERE id = $1",
                [backup["id"]]
            )

        logging.info(f"清理了 {len(old_backups)} 个旧备份")

backup_manager = BackupManager(vectorstore, db)
```

## 总结

| 环节 | 关键要点 | 工具/技术 |
|------|---------|-----------|
| **配置管理** | 环境隔离、敏感信息安全 | pydantic-settings, Vault |
| **API 开发** | 异步处理、错误处理、限流 | FastAPI, 中间件 |
| **容器化** | 多阶段构建、资源限制 | Docker, docker-compose |
| **编排部署** | 自动扩缩容、自愈 | Kubernetes, HPA |
| **监控告警** | 实时指标、异常告警 | Prometheus, Grafana |
| **日志系统** | 结构化日志、集中存储 | Loki, ELK |
| **安全** | API 认证、数据脱敏 | API Key, 脱敏工具 |
| **CI/CD** | 自动化测试和部署 | GitHub Actions |
| **容灾** | 自动故障转移、数据备份 | Failover Manager |

生产级 RAG 系统需要综合考虑可靠性、性能、安全性和可维护性，本篇提供的最佳实践可以帮助你构建一个稳定、高效的 RAG 服务。

---

**RAG 系列文章完结** 🎉

本系列涵盖了 RAG 的核心概念、数据处理、向量检索、检索策略、实战应用、性能优化、多模态处理、Agent 融合以及生产部署的全方位内容。希望对你有所帮助！