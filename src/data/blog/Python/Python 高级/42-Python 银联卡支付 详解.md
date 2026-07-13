---
title: Python 银联卡支付 详解
series: python
seriesOrder: 42
language: zh-CN
author: Joekma
pubDatetime: 2024-08-18T00:00:00Z
slug: unionpay-python-integration-guide
modDatetime: 2026-07-11T00:00:00.000+08:00
featured: false
draft: false
tags:
  - Python
  - 支付
  - 银联
  - docs
description: 银联卡支付Python接入指南，涵盖网关支付、无跳转支付、API控件式支付等完整流程。
---

# Python 银联卡支付 详解

## 当前接入边界

银联接入使用开放平台当前网关和证书体系。本文只采用银联当前开放平台的 API 和官方提供的 SDK/示例。旧版 MD5/SHA-1 签名、客户端成功页入账和未验签回调已经删除。平台接口、证书格式和 SDK 会独立更新，接入前必须再次核对开放平台文档，并在官方沙箱/测试商户中运行。

私钥、API 密钥和证书不进入源码。创建订单时服务端生成不可预测的业务订单号，以最小货币单位保存金额；客户端只提交商品/订单意图，不能决定最终金额或商户号。

## 回调状态机与沙箱实践

真实验签必须调用该支付机构开放平台当前证书验签入口，并把未经重新编码的原始请求体、签名头和平台证书交给它。验签通过后，再把标准化字段交给下面的纯业务函数；该函数不替代官方验签。

<!-- snippet: id=unionpay-callback-state-machine mode=sandbox python=3.12-3.14 deps=stdlib -->
```python
from dataclasses import dataclass
from decimal import Decimal

@dataclass
class Order:
    merchant_id: str
    amount: Decimal
    currency: str = "CNY"
    status: str = "PENDING"
    platform_txn: str | None = None

def apply_verified_callback(order: Order, event: dict[str, str]) -> bool:
    if event["merchant_id"] != order.merchant_id:
        raise ValueError("merchant mismatch")
    if Decimal(event["amount"]) != order.amount or event["currency"] != order.currency:
        raise ValueError("amount mismatch")
    if order.status == "PAID":
        return False  # 平台至少一次投递：重复通知直接返回成功
    if order.status != "PENDING" or event["status"] != "SUCCESS":
        raise ValueError("illegal state transition")
    order.status = "PAID"
    order.platform_txn = event["transaction_id"]
    return True

order = Order(merchant_id="merchant-test", amount=Decimal("88.00"))
event = {"merchant_id": "merchant-test", "amount": "88.00", "currency": "CNY",
         "status": "SUCCESS", "transaction_id": "sandbox-txn-1"}
assert apply_verified_callback(order, event) is True
assert apply_verified_callback(order, event) is False
```

数据库实现中，读取订单、检查状态、写入平台流水号和记录幂等键必须位于同一事务；订单号和平台流水号都加唯一约束。处理时间戳/nonce 的允许窗口，拒绝过期重放。事务失败时让平台稍后重试，不能先返回成功再异步入账。

## 必测失败路径

| 场景 | 预期行为 |
| --- | --- |
| 签名错误、证书不可信或请求体被改动 | 在任何业务查询/写入前拒绝 |
| 商户号、订单号、金额或币种不匹配 | 记录安全事件并拒绝入账 |
| 同一通知重复或并发到达 | 只入账一次，重复请求得到平台要求的成功响应 |
| 回调过期或 nonce 已使用 | 作为重放拒绝 |
| 数据库事务失败 | 回滚全部状态，让平台按协议重试 |

退款与撤销同样是状态机：使用独立退款单号和金额约束，异步结果仍需验签、核对并幂等处理。生产监控只记录订单号、平台流水号和错误分类，不记录私钥、完整签名材料或敏感用户数据。
