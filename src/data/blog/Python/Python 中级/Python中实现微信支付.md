---
title: Python中实现微信支付
author: FjellOverflow
pubDatetime: 2024-08-13T00:00:00Z
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - 微信支付
  - docs
description: Python中实现微信支付，涵盖扫码支付、JSAPI支付、支付回调等核心流程。
---

# Python中实现微信支付

## 一，准备环境

### 1，要有微信公众号，商户平台账号

[https://pay.weixin.qq.com/wiki/doc/api/index.html](https://pay.weixin.qq.com/wiki/doc/api/index.html)

## 2，支持的支付方式有

![image](//upload-images.jianshu.io/upload_images/14359574-5eed3f3dd01a72de.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/990/format/webp)

1540176727044.png

## 3，备案域名

选择扫码支付，如果使用模式二则不需要域名，只需要可访问的IP地址就行。

## 一，扫码支付

  * 点击“扫码支付”按官方文档配置好回调URL（如何具体看配置[官网](https://pay.weixin.qq.com/wiki/doc/api/native.php?chapter=6_3)）

  * 先从[公众号](https://mp.weixin.qq.com/)上APP_ID电子杂志，APP_SECRECT，从[商户平台个人文库](https://pay.weixin.qq.com/index.php/core/home/login?return_url=%2Findex.php)上电子杂志MCH_ID，API_KEY

### 如图1所示，使用模式一生成支付二维码

这个二维码是没有时间限制的。

#### create_qrcode.html

创建二维码页面
```html

<!DOCTYPE html>
<html lang="en">
<head>
 <meta charset="UTF-8">
 <title>生成扫码支付二维码</title>
</head>
<body>
​
<form method="post" action="/wxpay/QRcode/" >
输入手机号：<input name="phone"/>
<input id="submit" type="submit"  value="生成二维码">
 <br>
 {% if img_url %}
 <img src="{{ img_url }}" style="width: 200px;height: 200px"/>
 {% endif %}
<br>
{{ url }}
</form>
</body>
</html></pre>

```
#### pay_settings.py
```python

# 微信支付配置
# ========支付相关配置信息===========
import random
import time
import hashlib
from random import Random
​
import qrcode
from bs4 import BeautifulSoup
​
APP_ID = "xxx"  # 你公众账号上的appid
MCH_ID = "xxx"  # 你的商户号
API_KEY = "xxx"  # 微信商户平台(pay.weixin.qq.com) -->账户设置 -->API安全 -->密钥设置，设置完成后把密钥复制到这里
APP_SECRECT = "xxx"
UFDODER_URL = "https://api.mch.weixin.qq.com/pay/unifiedorder"  # 该url是微信下单api
​
NOTIFY_URL = "http://xxx/"  # 微信支付结果回调接口，需要改为你的服务器上处理结果回调的方法路径
CREATE_IP = 'xxx'  # 你服务器的IP
​
​
def random_str(randomlength=8):
 """
 生成随机字符串
 :param randomlength: 字符串长度
 :return:
 """
 str = ''
 chars = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789'
 length = len(chars) - 1
 random = Random()
 for i in range(randomlength):
 str+=chars[random.randint(0, length)]
 return str
​
​
def order_num(phone):
 """
 生成扫码付款订单号
 :param phone: 手机号
 :return:
 """
 local_time = time.strftime('%Y%m%d%H%M%S', time.localtime(time.time()))
 result = phone + 'T' + local_time + random_str(5)
 return result
​
​
def get_sign(data_dict, key):
  # 签名函数，参数为签名的数据和密钥
  params_list = sorted(data_dict.items(), key=lambda e: e[0], reverse=False)  # 参数字典倒排序为列表
  params_str = "&".join(u"{}={}".format(k, v) for k, v in params_list) + '&key=' + key
  # 组织参数字符串并在末尾添加商户交易密钥
  md5 = hashlib.md5()  # 使用MD5加密模式
  md5.update(params_str.encode('utf-8'))  # 将参数字符串传入
  sign = md5.hexdigest().upper()  # 完成加密并转为大写
  return sign
​
​
def trans_dict_to_xml(data_dict):  # 定义字典转XML的函数
  data_xml = []
  for k in sorted(data_dict.keys()):  # 遍历字典排序后的key
  v = data_dict.get(k)  # 取出字典中key对应的value
  if k == 'detail' and not v.startswith('<![CDATA['):  # 添加XML标记
  v = '<![CDATA[{}>'.format(v)
  data_xml.append('<{key}>{value}</{key}>'.format(key=k, value=v))
  return '<xml>{}</xml>'.format(''.join(data_xml)).encode('utf-8')  # 返回XML，并转成utf-8，解决中文的问题
​
​
def trans_xml_to_dict(data_xml):
  soup = BeautifulSoup(data_xml, features='xml')
  xml = soup.find('xml')  # 解析XML
  if not xml:
  return {}
  data_dict = dict([(item.name, item.text) for item in xml.find_all()])
  return data_dict
​
​
def wx_pay_unifiedorde(detail):
  """
  访问微信支付统一下单接口
  :param detail:
  :return:
  """
  detail['sign'] = get_sign(detail, API_KEY)
  # print(detail)
  xml = trans_dict_to_xml(detail)  # 转换字典为XML
  response = requests.request('post', UFDODER_URL, data=xml)  # 以POST方式向微信公众平台服务器发起请求
  # data_dict = trans_xml_to_dict(response.content)  # 将请求返回的数据转为字典
  return response.content
​
​
def pay_fail(err_msg):
  """
  微信支付失败
  :param err_msg: 失败原因
  :return:
  """
  data_dict = {'return_msg': err_msg, 'return_code': 'FAIL'}
  return trans_dict_to_xml(data_dict)
​
​
def create_qrcode(phone,url):
  """
  生成扫码支付二维码
  :param phone: 手机号
  :param url: 支付路由
  :return:
  """
  img = qrcode.make(url)  # 创建支付二维码片
  # 你存放二维码的地址
  img_url = r'media/QRcode' + '/' + phone + '.png'
  img.save(img_url)
  return img_url  

```
#### views.py
```python
import render
from django.http import HttpResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from pay_settings import *
​
class Wxpay_QRccode(View):
 """
 生成微信支付二维码
 """
 def get(self, request, *args, **kwargs):
 return render(request, 'create_qrcode.html')
​
 def post(self, request, *args, **kwargs):
  """
  # 生成可扫码支付的二维码
  :param request:
  :param args:
  :param kwargs:
  :return:
  """

  phone = request.data.get('phone', None)
  if not phone:
    return HttpResponse('手机号获取失败')
  paydict = {
  'appid': APP_ID,
  'mch_id': MCH_ID,
  'nonce_str': random_str(phone),
  'product_id': phone,  # 商品id，可自定义
  'time_stamp': int(time.time()),
  }
  paydict['sign'] = get_sign(paydict, API_KEY)
  url = "weixin://wxpay/bizpayurl?appid=%s&mch_id=%s&nonce_str=%s&product_id=%s&time_stamp=%s&sign=%s" \
  % (paydict['appid'], paydict['mch_id'], paydict['nonce_str'], paydict['product_id'], paydict['time_stamp'], paydict['sign'])
  # 可以直接在微信中点击该url，如果有错误，微信会弹出提示框，如果是扫码，如果失败，什么提示都没有，不利于调试
  print(url)
  # 创建二维码
  img_url = create_qrcode(url)
  return render(request, 'create_qrcode.html', context={'img_url': img_url})
​
​
@method_decorator(csrf_exempt, name='dispatch')
class Wxpay_ModelOne_pay(View):
 """
 使用微信扫一扫扫描二维码，微信系统会自动回调此路由，Post请求
 """
​
 def post(self, request, *args, **kwargs):
 """
 扫描二维码后，微信系统回调的地址处理
 微信传来的参数格式经trans_xml_to_dict()转成字典
 {'openid': 'xxx',
 'is_subscribe': 'Y',
 'mch_id': 'xxx',
 'nonce_str': 'xxx',
 'sign': 'xxx',
 'product_id': 'xxx',
 'appid': 'xxx'}
​
 :param request:
 :param args:
 :param kwargs:
 :return:
 """
​
 data_dict = trans_xml_to_dict(request.body)  # 回调数据转字典
 sign = data_dict.pop('sign')  # 取出签名
 key = API_KEY  # 商户交易密钥
 back_sign = get_sign(data_dict, key)  # 计算签名
​
 if sign == back_sign:  # 验证签名是否与回调签名相同
 total_fee = 1  # 付款金额，单位是分，必须是整数
​
 params = {
 'appid': APP_ID,  # APPID
 'mch_id': MCH_ID,  # 商户号
 'nonce_str': random_str(16),  # 随机字符串
 'out_trade_no': order_num(data_dict['product_id']),  # 订单编号
 'total_fee': total_fee,  # 订单总金额
 'spbill_create_ip': CREATE_IP,  # 发送请求服务器的IP地址
 'notify_url': NOTIFY_URL,
 'body': 'xxx公司',   # 商品描述
 'detail': 'xxx商品',  # 商品详情
 'trade_type': 'NATIVE',  # 扫码支付类型
 }
 # 调用微信统一下单支付接口url
 notify_result = wx_pay_unifiedorde(params)
 # print(trans_xml_to_dict(notify_result))
 return HttpResponse(notify_result)
​
 return HttpResponse(pay_fail('交易信息有误，请重新扫码'))
​

```
### 2，使用模式二生成支付二维码

这个二维码是有时间限制的。

模式二与模式一相比，流程更为简单，不依赖设置的回调支付网址。商户后台系统先调用微信支付的统一下单接口，微信后台系统返回链接参数code_url，商户后台系统将code_url值生成二维码图片，用户使用微信客户端扫码后发起支付注意：。code_url有效期为2小时，后过期扫码不能再发起支付具体流程看[微信公众号](https://pay.weixin.qq.com/wiki/doc/api/native.php?chapter=6_5)。

主体代码：

#### pay_settings.py
```python
# 微信支付配置
# ========支付相关配置信息===========
import random
import time
import hashlib
from random import Random
from bs4 import BeautifulSoup
​
APP_ID = "xxx"  # 你公众账号上的appid
MCH_ID = "xxx"  # 你的商户号
API_KEY = "xxx"  # 微信商户平台(pay.weixin.qq.com) -->账户设置 -->API安全 -->密钥设置，设置完成后把密钥复制到这里
APP_SECRECT = "xxx"
UFDODER_URL = "https://api.mch.weixin.qq.com/pay/unifiedorder"  # 该url是微信下单api
​
NOTIFY_URL = "http://xxx/"  # 微信支付结果回调接口，需要改为你的服务器上处理结果回调的方法路径
CREATE_IP = 'xxx'  # 你服务器的IP
​
​
def get_sign(data_dict, key):  
 """
 签名函数
 :param data_dict: 需要签名的参数，格式为字典
 :param key: 密钥 ，即上面的API_KEY
 :return: 字符串
 """
 params_list = sorted(data_dict.items(), key=lambda e: e[0], reverse=False)  # 参数字典倒排序为列表
 params_str = "&".join(u"{}={}".format(k, v) for k, v in params_list) + '&key=' + key
 # 组织参数字符串并在末尾添加商户交易密钥
 md5 = hashlib.md5()  # 使用MD5加密模式
 md5.update(params_str.encode('utf-8'))  # 将参数字符串传入
 sign = md5.hexdigest().upper()  # 完成加密并转为大写
 return sign
​
​
def order_num(phone):
 """
 生成扫码付款订单号
 :param phone: 手机号
 :return:
 """
 local_time = time.strftime('%Y%m%d%H%M%S', time.localtime(time.time()))
 result = phone + 'T' + local_time + random_str(5)
 return result
​
​
def random_str(randomlength=8):
 """
 生成随机字符串
 :param randomlength: 字符串长度
 :return: 
 """
 strs = ''
 chars = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789'
 length = len(chars) - 1
 random = Random()
 for i in range(randomlength):
 strs += chars[random.randint(0, length)]
 return strs
​
def trans_dict_to_xml(data_dict):
 """
 定义字典转XML的函数
 :param data_dict: 
 :return: 
 """
 data_xml = []
 for k in sorted(data_dict.keys()):  # 遍历字典排序后的key
 v = data_dict.get(k)  # 取出字典中key对应的value
 if k == 'detail' and not v.startswith('<![CDATA['):  # 添加XML标记
 v = '<![CDATA[{}>'.format(v)
 data_xml.append('<{key}>{value}</{key}>'.format(key=k, value=v))
 return '<xml>{}</xml>'.format(''.join(data_xml))  # 返回XML
​
​
def trans_xml_to_dict(data_xml):
 """
 定义XML转字典的函数
 :param data_xml: 
 :return: 
 """
 soup = BeautifulSoup(data_xml, features='xml')
 xml = soup.find('xml')  # 解析XML
 if not xml:
 return {}
 data_dict = dict([(item.name, item.text) for item in xml.find_all()])
 return data_dict
```
#### views.py
```python
import qrcode
from django.shortcuts import render
from pay_settings import *
from django.http import HttpResponse
from django.views import View
​
class WXPayView(View):
 def get(self,request):
 # 在info.html有一个按钮，点击后跳转到这个类的post()中，具体urls.py设置不详述
 return render(request, 'info.html')
​
 def post(self,request):
 phone = request.POST.get('phone','')
 if not phone:
 return render(request, 'info.html', {'err_msg': '获取手机号失败'})
 data_dict = wxpay(phone)

 if data_dict.get('return_code') == 'SUCCESS':  # 如果请求成功
 qrcode_name = phone + '.png'  # 二维码图片名称
 img = qrcode.make(data_dict.get('code_url'))  # 创建支付二维码片
 img.save(r'static' + '/' + qrcode_name)
 return render(request, 'qrcode.html', {'qrcode_img': qrcode_name})
 return render(request, 'info.html', {'err_msg': '获取微信的code_url失败'})
​
​
def wxpay(phone):
 nonce_str = random_str() # 拼接出随机的字符串即可，我这里是用  时间+随机数字+5个随机字母
​
 total_fee = 1  # 付款金额，单位是分，必须是整数
​
 params = {
 'appid': APP_ID,  # APPID
 'mch_id': MCH_ID,  # 商户号
 'nonce_str': nonce_str,    # 随机字符串
 'out_trade_no': order_num(phone),  # 订单编号，可自定义
 'total_fee': total_fee, # 订单总金额
 'spbill_create_ip': CREATE_IP,  # 自己服务器的IP地址
 'notify_url': NOTIFY_URL,  # 回调地址，微信支付成功后会回调这个url，告知商户支付结果
 'body': 'xxx公司',  # 商品描述
 'detail': 'xxx商品',  # 商品描述
 'trade_type': 'NATIVE',  # 扫码支付类型
 }
​
 sign = get_sign(params,API_KEY)  # 获取签名
 params['sign'] = sign  # 添加签名到参数字典
 # print(params)
 xml = trans_dict_to_xml(params)  # 转换字典为XML
 response = requests.request('post', settings._UFDODER_URL, data=xml)  # 以POST方式向微信公众平台服务器发起请求
 data_dict = trans_xml_to_dict(response.content)  # 将请求返回的数据转为字典
 return data_dict
​
​
class Wxpay_Result(View):
 """
 微信支付结果回调通知路由
 """
 def get(self, request, *args, **kwargs):
 machine_code = request.GET.get('machine_code', '获取机器编号失败')
 # 返回支付成功页面，可自定义
 return render(request, 'zfcg.html', {'machine': {'machine_code': machine_code}})
​
 def post(self, request, *args, **kwargs):
 """
 微信支付成功后会自动回调
 返回参数为：
 {'mch_id': '',
 'time_end': '',
 'nonce_str': '',
 'out_trade_no': '',
 'trade_type': '',
 'openid': '',
 'return_code': '',
 'sign': '',
 'bank_type': '',
 'appid': '',
 'transaction_id': '',
 'cash_fee': '',
 'total_fee': '',
 'fee_type': '', '
 is_subscribe': '',
 'result_code': 'SUCCESS'}
​
 :param request:
 :param args:
 :param kwargs:
 :return:
 """
 data_dict = trans_xml_to_dict(request.body)  # 回调数据转字典
 # print('支付回调结果', data_dict)
 sign = data_dict.pop('sign')  # 取出签名
 back_sign = get_sign(data_dict, API_KEY)  # 计算签名
 # 验证签名是否与回调签名相同
 if sign == back_sign and data_dict['return_code'] == 'SUCCESS':
 '''
 检查对应业务数据的状态，判断该通知是否已经处理过，如果没有处理过再进行处理，如果处理过直接返回结果成功。
 '''
 print('微信支付成功会回调！')
 # 处理支付成功逻辑
 # 返回接收结果给微信，否则微信会每隔8分钟发送post请求
 return HttpResponse(trans_dict_to_xml({'return_code': 'SUCCESS', 'return_msg': 'OK'}))
 return HttpResponse(trans_dict_to_xml({'return_code': 'FAIL', 'return_msg': 'SIGNERROR'}))
​

```
## 二，使用JSAPI发起微信支付

在[微信公众号](https://mp.weixin.qq.com/cgi-bin/settingpage?t=setting/function&action=function)中左下角设置 - >公众号设置 - >功能设置，把业务域名，js接口安全域名，网页授权域名设置好。

用户在微信中点击一个路由地址（可把这个网址封装成二维码）。在后台中的views.py中的WxJsAPIPay类中使用得到（）函数处理用户的请求，先获取用户的OpenID的，然后调用微信统一下单接口，获取prepay_id，看具体[官网](https://pay.weixin.qq.com/wiki/doc/api/jsapi.php?chapter=7_7&index=6)。

#### wx_js_pay.html
```html
<!DOCTYPE html>
<html lang="en">
 <head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0" id="vp"/>
{#        <script type="text/javascript" src="/static/js/rem.js"></script>#}
{#        <link rel="stylesheet" type="text/css" href="/static/css/base.css" />#}
{#        <link rel="stylesheet" type="text/css" href="/static/css/index.css" />#}
 </head>
 <body>
 <div class="bigbox">
 <div class="top">
 <span>订单详情</span>
 </div>
 <div class="zhong">
​
 </div>
​
 <div class="zhifu">
 <button class="btn" type="button" onclick="javascript:callpay();return false;">立即支付</button>
 </div>
​
 </div>
​
<script src="https://cdn.bootcss.com/jquery/1.12.1/jquery.js"></script>
<script type="text/javascript">
 //调用微信JS api 支付
 function onBridgeReady() {
 WeixinJSBridge.invoke(
 'getBrandWCPayRequest',
 {
 appId: "{{ params.appid }}",        //公众号名称，由商户传入
 timeStamp: "{{ params.timeStamp }}", //时间戳，自1970年以来的秒数
 nonceStr: "{{ params.nonceStr }}",  //随机串
 package: "prepay_id={{ params.prepay_id }}",  //预支付id
 signType: "MD5",  //微信签名方式
 paySign: "{{ params.sign }}"     //微信签名
 },
 function (res) {
 //支付成功后返回 get_brand_wcpay_request:ok
 if (res.err_msg == "get_brand_wcpay_request:ok") {
 // 跳转到支付成功的页面
 window.location.href = '#';
 {#alert('支付成功');#}
 } else if (res.err_msg == "get_brand_wcpay_request:cancel") {
 alert("您已取消支付!");
 {#alert({{ params.machine_code }});#}
 {#window.location.href = '';#}
 } else if (res.err_msg == "get_brand_wcpay_request:fail") {
 $.each(res, function(key,value){
 alert(value);
 });
 alert("支付失败!");
 }
 }
 );
 }
​
 function callpay() {
 if (typeof WeixinJSBridge == "undefined") {
 if (document.addEventListener) {
 document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
 } else if (document.attachEvent) {
 document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
 document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
 }
 } else {
 onBridgeReady();
 }
 }
​
</script>
 </body>
</html>
```
#### pay_settings.py
```python
import hashlib
import time
import requests
from collections import OrderedDict
from random import Random
from bs4 import BeautifulSoup
​
​
APP_ID = "xxx"  # 公众账号appid
MCH_ID = "xxx"  # 商户号
API_KEY = "xxx"  # 微信商户平台(pay.weixin.qq.com) -->账户设置 -->API安全 -->密钥设置，设置完成后把密钥复制到这里
APP_SECRECT = "xxx"
UFDODER_URL = "https://api.mch.weixin.qq.com/pay/unifiedorder"  # url是微信下单api
NOTIFY_URL = "http://xxx/wxpay/pay_result/"  # 微信支付结果回调接口,需要你自定义
CREATE_IP = 'xxx'  # 你服务器上的ip
​
​
# 生成随机字符串
def random_str(randomlength=8):
 """
 生成随机字符串
 :param randomlength: 字符串长度
 :return:
 """
 str = ''
 chars = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789'
 length = len(chars) - 1
 random = Random()
 for i in range(randomlength):
 str+=chars[random.randint(0, length)]
 return str
​
​
def order_num(phone):
 """
 生成扫码付款订单,
 :param phone: 
 :return:
 """
 local_time = time.strftime('%Y%m%d%H%M%S', time.localtime(time.time()))
 result = phone + 'T' + local_time + random_str(5)
 return result
​
​
def get_sign(data_dict, key):
 # 签名函数，参数为签名的数据和密钥
 params_list = sorted(data_dict.items(), key=lambda e: e[0], reverse=False)  # 参数字典倒排序为列表
 params_str = "&".join(u"{}={}".format(k, v) for k, v in params_list) + '&key=' + key
 # 组织参数字符串并在末尾添加商户交易密钥
 md5 = hashlib.md5()  # 使用MD5加密模式
 md5.update(params_str.encode('utf-8'))  # 将参数字符串传入
 sign = md5.hexdigest().upper()  # 完成加密并转为大写
 return sign
​
​
def trans_dict_to_xml(data_dict):  # 定义字典转XML的函数
 data_xml = []
 for k in sorted(data_dict.keys()):  # 遍历字典排序后的key
 v = data_dict.get(k)  # 取出字典中key对应的value
 if k == 'detail' and not v.startswith('<![CDATA['):  # 添加XML标记
 v = '<![CDATA[{}>'.format(v)
 data_xml.append('<{key}>{value}</{key}>'.format(key=k, value=v))
 return '<xml>{}</xml>'.format(''.join(data_xml)).encode('utf-8')  # 返回XML，并转成utf-8，解决中文的问题
​
​
def trans_xml_to_dict(data_xml):
 soup = BeautifulSoup(data_xml, features='xml')
 xml = soup.find('xml')  # 解析XML
 if not xml:
 return {}
 data_dict = dict([(item.name, item.text) for item in xml.find_all()])
 return data_dict
​
​
def wx_pay_unifiedorde(detail):
 """
 访问温馨支付统一下单接口
 :param detail:
 :return:
 """
 detail['sign'] = get_sign(detail, API_KEY)
 # print(detail)
 xml = trans_dict_to_xml(detail)  # 转换字典为XML
 response = requests.request('post', UFDODER_URL, data=xml)  # 以POST方式向微信公众平台服务器发起请求
 # data_dict = trans_xml_to_dict(response.content)  # 将请求返回的数据转为字典
 return response.content
​
​
def get_redirect_url():
 """
 获取微信返回的重定向的url
 :return: url,其中携带code
 """
 WeChatcode = 'https://open.weixin.qq.com/connect/oauth2/authorize'
 urlinfo = OrderedDict()
 urlinfo['appid'] = APP_ID
 urlinfo['redirect_uri'] = 'http://xxx/wxjsapipay/?getInfo=yes'  # 设置重定向路由
 urlinfo['response_type'] = 'code'
 urlinfo['scope'] = 'snsapi_base'  # 只获取基本信息
 urlinfo['state'] = 'mywxpay'   # 自定义的状态码
​
 info = requests.get(url=WeChatcode, params=urlinfo)
 return info.url
​
​
def get_openid(code,state):
 """
 获取微信的openid
 :param code:
 :param state:
 :return:
 """
​
 if code and state and state == 'mywxpay':
​
 WeChatcode = 'https://api.weixin.qq.com/sns/oauth2/access_token'
 urlinfo = OrderedDict()
 urlinfo['appid'] = APP_ID
 urlinfo['secret'] = APP_SECRECT
 urlinfo['code'] = code
 urlinfo['grant_type'] = 'authorization_code'
 info = requests.get(url=WeChatcode, params=urlinfo)
 info_dict = eval(info.content.decode('utf-8'))
​
 return info_dict['openid']
 return None
​
​
def get_jsapi_params(openid):
 """
 获取微信的Jsapi支付需要的参数
 :param openid: 用户的openid
 :return:
 """
​
 total_fee = 1  # 付款金额，单位是分，必须是整数
​
 params = {
 'appid': APP_ID,  # APPID
 'mch_id': MCH_ID,  # 商户号
 'nonce_str': random_str(16),  # 随机字符串
 'out_trade_no': order_num('123'),  # 订单编号,可自定义
 'total_fee': total_fee,  # 订单总金额
 'spbill_create_ip': CREATE_IP,  # 发送请求服务器的IP地址
 'openid': openid,
 'notify_url': NOTIFY_URL,  # 支付成功后微信回调路由
 'body': 'xxx公司',  # 商品描述
 'trade_type': 'JSAPI',  # 公众号支付类型
 }
 # print(params)
 # 调用微信统一下单支付接口url
 notify_result = wx_pay_unifiedorde(params)
​
 params['prepay_id'] = trans_xml_to_dict(notify_result)['prepay_id']
 params['timeStamp'] = int(time.time())
 params['nonceStr'] = random_str(16)
 params['sign'] = get_sign({'appId': APP_ID,
 "timeStamp": params['timeStamp'],
 'nonceStr': params['nonceStr'],
 'package': 'prepay_id=' + params['prepay_id'],
 'signType': 'MD5',
 },
 API_KEY)

 return params
```
#### views.py
```python
from django.http import HttpResponseRedirect, HttpResponse
from django.shortcuts import render
from django.views import View
from pay_settings import *
​
​
class WxJsAPIPay(View):
 def get(self, request, *args, **kwargs):
 """
 用户点击一个路由或者扫码进入这个views.py中的函数，首先获取用户的openid,
 使用jsapi方式支付需要此参数
 :param self:
 :param request:
 :param args:
 :param kwargs:
 :return:
 """
 getInfo = request.GET.get('getInfo', None)
 openid = request.COOKIES.get('openid', '')
 if not openid:
 if getInfo != 'yes':
 # 构造一个url，携带一个重定向的路由参数，
 # 然后访问微信的一个url,微信会回调你设置的重定向路由，并携带code参数
 return HttpResponseRedirect(get_redirect_url())
 elif getInfo == 'yes':
 # 我设置的重定向路由还是回到这个函数中，其中设置了一个getInfo=yes的参数
 # 获取用户的openid
 openid = get_openid(request.GET.get('code'), request.GET.get('state', ''))
 if not openid:
 return HttpResponse('获取用户openid失败')
 response = render_to_response('wx_js_pay.html', context={'params': get_jsapi_params(openid)})
 response.set_cookie('openid', openid, expires=60 * 60 * 24 *30)
 return response
​
 else:
 return HttpResponse('获取机器编码失败')
 else:
 return render(request, 'wx_js_pay.html', context={'params': get_jsapi_params(openid)})
```
---
