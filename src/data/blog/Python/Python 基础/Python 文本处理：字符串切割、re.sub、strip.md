---
title: Python 文本处理：字符串切割、re.sub、strip
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
slug: python-text-processing-string-split-re-sub-strip
modDatetime: 2026-05-03T00:00:00.000+08:00
featured: false
draft: false
tags:
  - Python
  - 文本处理
  - 字符串
  - re模块
  - 文件读写
description: '利用Python简单处理文本，涵盖字符串切割、文本格式化、文件读写、正则替换（re.sub）、strip删除字符等基础操作和实战技巧。'
series: python
language: zh-CN
---

# Python 简单处理文本

## 字符串切割

例如，我想将下面代码中，每行的开头处理一下，可以使用字符串的切分

### 样本
```python
from selenium import webdriver
from selenium.webdriver import ActionChains
from selenium.webdriver.common.by import By # 按照什么方式查找，By.ID,By.CSS_SELECTOR
from selenium.webdriver.common.keys import Keys # 键盘按键操作
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait # 等待页面加载某些元素
import time

def get_goods(driver):
    try:
        goods=driver.find_elements_by_class_name('gl-item')
        for good in goods:
            detail_url=good.find_element_by_tag_name('a').get_attribute('href')
            p_name=good.find_element_by_css_selector('.p-name em').text.replace('\n','')
            price=good.find_element_by_css_selector('.p-price i').text
            p_commit=good.find_element_by_css_selector('.p-commit a').text
            msg = '''
            商品 : %s
            链接 : %s
            价钱 ：%s
            评论 ：%s
            ''' % (p_name,detail_url,price,p_commit)
            print(msg,end='\n\n')
        button=driver.find_element_by_partial_link_text('下一页')
        button.click()
        time.sleep(1)
        get_goods(driver)
    except Exception:
        pass

def spider(url,keyword):
    driver = webdriver.Chrome()
    driver.get(url)
    driver.implicitly_wait(3)  # 使用隐式等待
    try:
        input_tag=driver.find_element_by_id('key')
        input_tag.send_keys(keyword)
        input_tag.send_keys(Keys.ENTER)
        get_goods(driver)
    finally:
        driver.close()

if __name__ == '__main__':
    spider('https://www.jd.com/',keyword='iPhone8手机')
```
### 文本处理代码
```python
file = open("111.txt", "r",encoding='utf-8')  # 以只读模式读取文件
lines = []
for i in file:
    lines.append(i)  # 逐行将文本存入列表lines中
file.close()

new = []
for line in lines:  # 逐行遍历
    new_line=line[3:] # 字符串切割
    # line.replace('\s*\d+\s+?','')
    new.append(new_line)

# 以写的方式打开文件，如果文件不存在，就会自动创建，如果存在就会覆盖原文件
file_write_obj = open("222.txt", 'w',encoding='utf-8')
for var in new:
    file_write_obj.writelines(var)
    # file_write_obj.writelines('\n')
file_write_obj.close()
```

## replace()

```python
# 对象.replace(rgExp, replaceText, max)

# rgExp、replaceText 是必须参数，max 是可选参数
# 将对象中的 rgExp 从左到右最多替换 max 次

# 比如：
class Solution:
    def replace_space(self, s):
        if not s:
            return False
        # 对象.replace(rgExp,replaceText,max)
        ss = s.replace(' ', '20%')
        return ss

if __name__ == '__main__':
    strings = 'We Are Happy'
    s = Solution()

    print(s.replace_space(strings))
# 输出：We20%Are20%Happy
```
## re.sub---substitute，进行相对复杂的字符串替换

要用sub()，记住要import re哦！
```python
re.sub(pattern,repl,string,count,flags)
```
  * 三个必选参数：pattern,repl,string
  * 两个可选参数：count,flags
```
pattern： 正则表达式中的模式字符串；
repl： 原来字符串中要换的东西，比如上面例子中的20%（既可以是字符串，也可以是函数）；
string： 要被处理的，要被替换的字符串，比如上面例子中的strings，即：'We Are Happy'；
count： 匹配的次数，最多的次数
flags： 标志位，用于控制正则表达式的匹配方式，如是否区分大小写，多行匹配等等
```
比如：
```python
import re

class Solution:
    def replace_space(self, s):
        if not s:
            return False
        pattern = re.compile(r' ')
        # re.sub(pattern,repl,string,count,flags)
        return re.sub(pattern, r'20%', s)
if __name__ == '__main__':
    strings = 'We Are Happy'
    s = Solution()
    print(s.replace_space(strings))
```
## strip()

strip()并不是一个真正意义上的替换函数，它是用来删除一些字符的，所以我们可以把这看作是把字符串中的一些字符替换成空（不是空格，是空）

>开头和结尾的空格都被去掉了,并不能删除字符串中间的空格(注意字符串首位是否会有空格)

>lstrip()和rstrip(),分别是用来删除开头的“其他字符”的

---
