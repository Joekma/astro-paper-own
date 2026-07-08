---
title: Python 支付宝支付 详解
series: python
seriesOrder: 41
language: zh-CN
author: Joekma
pubDatetime: 2024-08-15T00:00:00Z
slug: alipay-python-integration-guide
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - 支付
  - 支付宝
  - docs
description: 支付宝Python接入指南，涵盖当面付（扫码支付）、电脑网站支付、手机网站支付等完整流程。
---

# Python 支付宝支付 详解

## 简介

这篇文章整理的是支付宝支付接入的完整流程，涵盖当面付（扫码支付）、电脑网站支付、手机网站支付等常见场景。

文中的代码和流程保留了原始实践内容，按接入顺序重新组织，方便直接查阅和排障。

## 接入场景与前置条件

### 典型需求

```text
用户打开支付页面 -> 选择支付方式 -> 扫码或跳转 -> 完成支付
```

### 需要准备的配置

支付宝支付接入通常需要以下信息：

- 应用 `app_id`
- 商户 `merchant_private_key`：RSA2 私钥，用于请求签名
- 支付宝 `alipay_public_key`：RSA2 公钥，用于回调验签
- `alipay_root_cert`：支付宝根证书
- `app_cert`：应用证书

### 基础配置示例

```python
APC = {
    'APPID': '2021001234567890',
    'PRIVATE_KEY': 'MIIEvQIBADANBgkqhkiG9w0BAQEFAA...',
    'ALIPAY_PUBLIC_KEY': 'MIIBIjANBgkqhkiG9w0BAQEFAA...',
    'ALIPAY_ROOT_CERT': '-----BEGIN CERTIFICATE-----...',
    'APP_CERT': '-----BEGIN CERTIFICATE-----...',
    'NOTIFY_URL': 'https://www.xxxx.com/service/alipay/notify',
}
```

## 核心流程概览

支付宝支付的核心链路如下：

1. 构建支付请求参数
2. 使用 RSA2 签名生成请求字符串
3. 调用支付宝接口获取支付链接或二维码
4. 前端展示二维码或跳转支付页面
5. 用户完成支付后，支付宝回调通知
6. 验签回调，确认支付结果

### 支付场景选择

- **当面付（扫码支付）**：用户扫描商家生成的二维码完成支付
- **电脑网站支付**：PC 网页端唤起支付宝收银台
- **手机网站支付**：H5/移动端网页唤起支付宝 APP 或网页版

新项目推荐使用 RSA2 签名和 SHA256withRSA 算法。

## 步骤一：安装依赖

```bash
pip install alipay-sdk-python
```

或使用轻量级方式，直接实现签名和请求逻辑。

## 步骤二：构建支付参数

### 当面付（扫码支付）

```python
def create_qr_code(trade_no, total_amount, subject):
    biz_content = {
        'out_trade_no': trade_no,
        'total_amount': str(total_amount),
        'subject': subject,
        'store_id': 'SZDJ001',
        'timeout_express': '5m',
        'qr_code_width': 200,
    }

    order_string = alipay.api_alipay_trade_precreate(
        app_id=APC['APPID'],
        biz_content=json.dumps(biz_content),
        alipay_root_cert_sn=get_cert_sn(APC['ALIPAY_ROOT_CERT']),
        app_cert_sn=get_cert_sn(APC['APP_CERT']),
        private_key=APC['PRIVATE_KEY'],
        alipay_public_key=APC['ALIPAY_PUBLIC_KEY'],
    )
    return order_string
```

### 电脑网站支付

```python
def create_page_pay_url(trade_no, total_amount, subject, return_url):
    biz_content = {
        'out_trade_no': trade_no,
        'total_amount': str(total_amount),
        'subject': subject,
        'product_code': 'FAST_INSTANT_TRADE_PAY',
        'time_expire': '15m',
    }

    order_string = alipay.api_alipay_trade_page_pay(
        app_id=APC['APPID'],
        biz_content=json.dumps(biz_content),
        return_url=return_url,
        alipay_root_cert_sn=get_cert_sn(APC['ALIPAY_ROOT_CERT']),
        app_cert_sn=get_cert_sn(APC['APP_CERT']),
        private_key=APC['PRIVATE_KEY'],
        alipay_public_key=APC['ALIPAY_PUBLIC_KEY'],
    )
    return order_string
```

### 手机网站支付

```python
def create_wap_pay_url(trade_no, total_amount, subject, quit_url):
    biz_content = {
        'out_trade_no': trade_no,
        'total_amount': str(total_amount),
        'subject': subject,
        'product_code': 'QUICK_WAP_WAY',
        'quit_url': quit_url,
    }

    order_string = alipay.api_alipay_trade_wap_pay(
        app_id=APC['APPID'],
        biz_content=json.dumps(biz_content),
        alipay_root_cert_sn=get_cert_sn(APC['ALIPAY_ROOT_CERT']),
        app_cert_sn=get_cert_sn(APC['APP_CERT']),
        private_key=APC['PRIVATE_KEY'],
        alipay_public_key=APC['ALIPAY_PUBLIC_KEY'],
    )
    return order_string
```

## 步骤三：生成二维码（当面付场景）

```python
import qrcode
from io import BytesIO

def generate_qr_code(qr_url):
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=2)
    qr.add_data(qr_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer
```

前端轮询查询订单状态：

```javascript
function checkOrderStatus(orderId) {
    var timer = null;

    function poll() {
        $.get('/order/status/' + orderId, function(resp) {
            if (resp.code == '000') {
                clearInterval(timer);
                window.location.href = '/order/success/' + orderId;
            }
        });
    }

    timer = setInterval(poll, 2000);
}
```

## 步骤四：前端唤起支付

### 电脑网站支付跳转

```html
<!DOCTYPE html>
<html>
<head>
    <title>跳转支付宝</title>
</head>
<body>
    <script>
        window.location.href = '{{ payment_url }}';
    </script>
</body>
</html>
```

### 手机网站支付唤起

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>支付宝支付</title>
</head>
<body>
    <div id="wait" style="text-align:center; padding-top:100px;">
        <p>正在唤起支付宝，请稍候...</p>
    </div>
    <form name="pay_form" id="pay_form" action="{{ payment_url }}" method="get">
        <input type="hidden" name="biz_context" id="biz_context" value="">
    </form>
    <script>
        document.getElementById('pay_form').submit();
    </script>
</body>
</html>
```

## 步骤五：异步回调通知处理

支付宝完成后会异步 POST 通知到你配置的 `notify_url`。

### 回调验签与处理

```python
def alipay_notify(request):
    if request.method == 'POST':
        params = request.POST.dict()
        sign = params.pop('sign', None)
        sign_type = params.get('sign_type', 'RSA2')

        is_valid = verify_sign(params, sign, APC['ALIPAY_PUBLIC_KEY'], sign_type)

        if not is_valid:
            return HttpResponse('fail')

        trade_status = params.get('trade_status')

        if trade_status in ['TRADE_SUCCESS', 'TRADE_FINISHED']:
            out_trade_no = params.get('out_trade_no')
            trade_no = params.get('trade_no')
            total_amount = params.get('total_amount')

            try:
                order = Order.objects.get(order_no=out_trade_no)
                if not order.is_paid:
                    order.is_paid = True
                    order.pay_time = datetime.now()
                    order.trade_no = trade_no
                    order.save()
            except Order.DoesNotExist:
                pass

        return HttpResponse('success')
    return HttpResponse('fail')
```

### 验签函数

```python
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend
import base64

def verify_sign(params, sign, alipay_public_key, sign_type='RSA2'):
    sorted_params = sorted(params.items())
    sign_content = '&'.join(['{}={}'.format(k, v) for k, v in sorted_params])

    public_key = serialization.load_pem_public_key(
        alipay_public_key.encode('utf-8'),
        backend=default_backend()
    )

    try:
        if sign_type == 'RSA2':
            public_key.verify(
                base64.b64decode(sign),
                sign_content.encode('utf-8'),
                padding.PKCS1v15(),
                hashes.SHA256()
            )
        else:
            public_key.verify(
                base64.b64decode(sign),
                sign_content.encode('utf-8'),
                padding.PKCS1v15(),
                hashes.SHA1()
            )
        return True
    except Exception:
        return False
```

## 步骤六：订单查询

```python
def query_order(trade_no):
    biz_content = {
        'out_trade_no': trade_no,
    }

    result = alipay.api_alipay_trade_query(
        app_id=APC['APPID'],
        biz_content=json.dumps(biz_content),
        alipay_root_cert_sn=get_cert_sn(APC['ALIPAY_ROOT_CERT']),
        app_cert_sn=get_cert_sn(APC['APP_CERT']),
        private_key=APC['PRIVATE_KEY'],
        alipay_public_key=APC['ALIPAY_PUBLIC_KEY'],
    )

    return result
```

## 步骤七：退款

```python
def refund_order(trade_no, refund_amount, refund_reason=''):
    biz_content = {
        'out_trade_no': trade_no,
        'refund_amount': str(refund_amount),
        'refund_reason': refund_reason,
    }

    result = alipay.api_alipay_trade_refund(
        app_id=APC['APPID'],
        biz_content=json.dumps(biz_content),
        alipay_root_cert_sn=get_cert_sn(APC['ALIPAY_ROOT_CERT']),
        app_cert_sn=get_cert_sn(APC['APP_CERT']),
        private_key=APC['PRIVATE_KEY'],
        alipay_public_key=APC['ALIPAY_PUBLIC_KEY'],
    )

    return result
```

## 常见坑

### 1. 密钥格式问题

确保 RSA2 私钥和公钥格式正确，通常以 `-----BEGIN RSA PRIVATE KEY-----` 或 `-----BEGIN PRIVATE KEY-----` 开头。如果使用 PKCS8 格式，需要确认支付宝支持该格式。

### 2. 签名类型不匹配

确认 `sign_type` 参数与密钥类型匹配。RSA2 对应 SHA256withRSA，RSA 对应 SHA1withRSA。

### 3. 证书序列号获取

应用证书和应用根证书的序列号是支付宝验签的重要参数，需要正确获取：

```python
from cryptography import x509
import hashlib

def get_cert_sn(cert_content):
    cert = x509.load_pem_x509_certificate(cert_content.encode('utf-8'), default_backend())
    cert_bytes = cert.public_bytes(serialization.Encoding.DER)
    return hashlib.md5(cert_bytes).hexdigest()
```

### 4. 回调验签失败

检查是否有参数在验签前被修改或遗漏，确保所有参数都参与验签。

### 5. 订单金额精度

支付宝的 `total_amount` 参数单位为元且支持小数，建议使用字符串格式传递，避免浮点数精度问题。

## 小结

支付宝网页支付接入可以概括成：

**构建请求参数，使用 RSA2 签名，调用支付宝接口获取支付链接或二维码，前端展示或跳转，用户支付后回调验签确认结果。**

落地清单检查项：

- 应用配置 `APPID` 和密钥是否正确
- 密钥格式是否与支付宝要求一致
- 回调 `notify_url` 是否可访问
- 验签逻辑是否正确实现
- 订单查询和退款接口是否可用

附加参考：

- [支付宝开放平台文档](https://opendocs.alipay.com/)
- [支付宝当面付接入指南](https://opendocs.alipay.com/open/194/103039)
- [支付宝电脑网站支付接入指南](https://opendocs.alipay.com/open/270/106034)

---