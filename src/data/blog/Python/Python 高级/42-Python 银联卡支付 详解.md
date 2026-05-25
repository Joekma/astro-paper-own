---
title: Python 银联卡支付 详解
series: python
seriesOrder: 42
language: zh-CN
author: Joekma
pubDatetime: 2024-08-18T00:00:00Z
slug: unionpay-python-integration-guide
modDatetime: 2026-04-22T00:00:00Z
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

## 简介

这篇文章整理的是银联卡支付接入的完整流程，涵盖网关支付、无跳转支付、令牌支付等常见场景。

文中的代码和流程保留了原始实践内容，按接入顺序重新组织，方便直接查阅和排障。

## 接入场景与前置条件

### 典型需求

```text
用户选择银联卡支付 -> 填写银行卡信息 -> 跳转到银联页面或控件支付 -> 完成支付
```

### 需要准备的配置

银联支付接入通常需要以下信息：

- 商户号 `merId`
- 消息来源 `msgSrc`
- 机构代码 `msgSrcId`
- 渠道类型 `channelType`（如 UPOP 等）
- 验签密钥（用于回调验签）
- 安全密钥（用于请求签名）

### 基础配置示例

```python
UPC = {
    'MERID': '8983401839361234',
    'MSG_SRC': 'WWW.SMARTA.COM',
    'MSG_SRC_ID': 'SMARTA001',
    'CHANNEL_TYPE': 'UPOP',
    'NOTIFY_URL': 'https://www.xxxx.com/service/unionpay/notify',
    'FRONT_URL': 'https://www.xxxx.com/payment/return',
    'SIGN_KEY': '1234567890abcdef1234567890abcdef',
    'VERIFY_KEY': '1234567890abcdef1234567890abcdef',
}
```

### 测试与生产环境

- **测试环境**：`https://gateway.test.95516.com`
- **生产环境**：`https://gateway.95516.com`

## 核心流程概览

银联卡支付的核心链路如下：

1. 构建支付请求参数
2. 生成签名（通常是 MD5 或 SM3 等）
3. 调用银联网关接口
4. 前端跳转或使用控件支付
5. 支付完成后银联回调通知
6. 验签回调，确认支付结果

### 支付场景选择

- **网关支付（无跳转）**：用户输入卡号等信息，在商户页面完成支付
- **网银支付（有跳转）**：跳转到银联页面完成支付
- **令牌支付（Token Pay）**：使用绑定的卡号令牌完成支付，适合快捷支付场景

新项目通常优先使用网关支付（无跳转）或网银支付。

## 步骤一：安装依赖

```bash
pip install pyDes cryptography
```

## 步骤二：构建支付请求

### 网关支付（无跳转）示例

```python
import hashlib
import time
import json
import base64
from urllib.parse import urlencode


class UnionPayClient:
    def __init__(self, config):
        self.mer_id = config['MERID']
        self.msg_src = config['MSG_SRC']
        self.msg_src_id = config['MSG_SRC_ID']
        self.notify_url = config['NOTIFY_URL']
        self.front_url = config['FRONT_URL']
        self.sign_key = config['SIGN_KEY']
        self.gateway = 'https://gateway.test.95516.com/gateway/api/frontTransReq.do'

    def create_order(self, order_no, amount, subject):
        timestamp = time.strftime('%Y%m%d%H%M%S')
        expire_time = time.strftime('%Y%m%d%H%M%S', time.localtime(time.time() + 1800))

        params = {
            'version': '5.1.0',
            'encoding': 'UTF-8',
            'signMethod': '01',
            'txnType': '01',
            'txnSubType': '01',
            'bizType': '000201',
            'channelType': '07',
            'backUrl': self.notify_url,
            'frontUrl': self.front_url,
            'accessType': '0',
            'merId': self.mer_id,
            'orderId': order_no,
            'txnTime': timestamp,
            'txnAmt': str(int(amount * 100)),
            'currencyCode': '156',
            'defaultPayType': '01',
            'orderDesc': subject[:100],
            'reqReserved': json.dumps({'merId': self.mer_id}),
        }

        params['signature'] = self.sign(params)
        return params

    def sign(self, params):
        keys = sorted([k for k in params.keys() if k != 'signature'])
        sign_str = '&'.join(['{}={}'.format(k, params[k]) for k in keys])
        sign_str += '&{}'.format(self.sign_key)

        md5 = hashlib.md5()
        md5.update(sign_str.encode('UTF-8'))
        return md5.hexdigest().upper()

    def verify_sign(self, params):
        if 'signature' not in params:
            return False

        received_sign = params['signature']
        verify_key = params.get('verifyKey', self.sign_key)

        keys = sorted([k for k in params.keys() if k != 'signature'])
        sign_str = '&'.join(['{}={}'.format(k, params[k]) for k in keys])
        sign_str += '&{}'.format(verify_key)

        md5 = hashlib.md5()
        md5.update(sign_str.encode('UTF-8'))
        expected_sign = md5.hexdigest().upper()

        return received_sign == expected_sign
```

### 网银支付（有跳转）示例

```python
def create_bank_pay_request(self, order_no, amount, subject):
    timestamp = time.strftime('%Y%m%d%H%M%S')

    params = {
        'version': '5.1.0',
        'encoding': 'UTF-8',
        'signMethod': '01',
        'txnType': '01',
        'txnSubType': '00',
        'bizType': '000202',
        'channelType': '07',
        'backUrl': self.notify_url,
        'accessType': '0',
        'merId': self.mer_id,
        'orderId': order_no,
        'txnTime': timestamp,
        'txnAmt': str(int(amount * 100)),
        'currencyCode': '156',
        'orderDesc': subject[:100],
    }

    params['signature'] = self.sign(params)
    return params
```

## 步骤三：前端跳转支付

### 网银支付页面

银联会返回包含表单的 HTML 页面，直接重定向即可：

```html
<!DOCTYPE html>
<html>
<head>
    <title>银联支付</title>
</head>
<body>
    <div style="text-align:center; padding-top:100px;">
        <p>正在跳转到银联支付页面...</p>
    </div>
    <form id="pay_form" action="{{ gateway_url }}" method="post">
        {% for key, value in params.items %}
        <input type="hidden" name="{{ key }}" value="{{ value }}">
        {% endfor %}
    </form>
    <script>document.getElementById('pay_form').submit();</script>
</body>
</html>
```

### JavaScript 自动提交

```javascript
function submitUnionPayForm(params, action) {
    var form = document.createElement('form');
    form.action = action;
    form.method = 'POST';

    for (var key in params) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = params[key];
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
}
```

## 步骤四：异步回调通知处理

银联支付完成后会异步 POST 通知到你配置的 `backUrl`。

### 回调处理

```python
def unionpay_notify(request):
    if request.method == 'POST':
        params = request.POST.dict()

        if not unionpay.verify_sign(params):
            return HttpResponse('fail')

        resp_code = params.get('respCode')
        resp_msg = params.get('respMsg')

        if resp_code == '00' and resp_msg == 'success':
            order_no = params.get('orderId')
            txn_amt = params.get('txnAmt')
            trade_no = params.get('queryId')
            settle_amt = params.get('settleAmt', '0')
            sett le_date = params.get('settleDate', '')

            try:
                order = Order.objects.get(order_no=order_no)
                if not order.is_paid:
                    order.is_paid = True
                    order.pay_time = datetime.now()
                    order.trade_no = trade_no
                    order.pay_amount = int(txn_amt) / 100
                    order.settle_date = settle_date
                    order.save()
            except Order.DoesNotExist:
                pass

        return HttpResponse('ok')
    return HttpResponse('fail')
```

### 前端回跳处理

用户支付完成后，银联会重定向回 `frontUrl`：

```python
def unionpay_return(request):
    params = request.GET.dict()

    if not unionpay.verify_sign(params):
        return render(request, 'payment/failed.html', {'msg': '签名验证失败'})

    resp_code = params.get('respCode')
    if resp_code == '00':
        order_no = params.get('orderId')
        return redirect('/payment/success/{}'.format(order_no))
    else:
        return render(request, 'payment/failed.html', {'msg': params.get('respMsg')})
```

## 步骤五：订单查询

```python
def query_order(self, order_no, txn_time):
    timestamp = time.strftime('%Y%m%d%H%M%S')

    params = {
        'version': '5.1.0',
        'encoding': 'UTF-8',
        'signMethod': '01',
        'txnType': '00',
        'txnSubType': '00',
        'bizType': '000201',
        'channelType': '07',
        'accessType': '0',
        'merId': self.mer_id,
        'orderId': order_no,
        'txnTime': txn_time,
    }

    params['signature'] = self.sign(params)

    resp = requests.post(
        'https://gateway.test.95516.com/gateway/api/queryTrans.do',
        data=params,
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )

    result = dict(urllib.parse.parse_qsl(resp.text))
    return result
```

## 步骤六：退款

```python
def refund_order(self, order_no, txn_time, txn_amt, refund_amt, orig_query_id):
    timestamp = time.strftime('%Y%m%d%H%M%S')

    params = {
        'version': '5.1.0',
        'encoding': 'UTF-8',
        'signMethod': '01',
        'txnType': '04',
        'txnSubType': '00',
        'bizType': '000201',
        'channelType': '07',
        'backUrl': self.notify_url,
        'accessType': '0',
        'merId': self.mer_id,
        'orderId': order_no,
        'txnTime': timestamp,
        'txnAmt': str(int(refund_amt * 100)),
        'currencyCode': '156',
        'origTxnTime': txn_time,
        'origTxnAmt': str(int(txn_amt * 100)),
        'origQryId': orig_query_id,
    }

    params['signature'] = self.sign(params)
    return params
```

## 常见坑

### 1. 签名验证失败

银联的签名验证需要确保所有参与签名的字段顺序正确，且不包含 `signature` 本身。如果使用 SM 签名算法，需要使用对应的加密库。

### 2. 金额单位问题

银联接口的 `txnAmt` 参数单位为**分**，而不是元。需要在请求时将元转换为分，响应时将分转换为元。

### 3. 时间格式问题

`txnTime` 格式为 `YYYYMMDDHHmmss`，例如 `20240422143050`，需要严格按照此格式。

### 4. 订单号重复问题

同一个商户号下的 `orderId` 必须唯一，银联会拒绝重复的订单号。建议使用业务系统的时间戳加随机数生成唯一订单号。

### 5. backUrl 和 frontUrl 配置

- `backUrl`：支付完成后异步通知的 URL，必须可公网访问
- `frontUrl`：前端跳转返回的 URL，用于展示支付结果

### 6. 字符编码问题

确保所有请求参数的编码为 UTF-8，特别是中文描述等字段。

### 7. 测试环境与生产环境

测试环境网关和生产环境网关不同，切换时需要注意修改网关地址。

## 小结

银联卡网页支付接入可以概括成：

**构建请求参数，使用 MD5 或 SM 签名，调用银联网关接口，前端跳转或控件支付，银联回调验签确认结果。**

落地清单检查项：

- 商户号 `merId` 是否正确
- 回调 `backUrl` 和 `frontUrl` 是否可公网访问
- 签名密钥是否正确配置
- 金额单位是否为分
- 时间格式是否为 `YYYYMMDDHHmmss`
- 字符编码是否为 UTF-8

附加参考：

- [银联开放平台文档](https://open.unionpay.com/)
- [银联网关支付接入指南](https://open.unionpay.com/tjgy/web/index)
- [银联测试环境](https://gateway.test.95516.com)

---