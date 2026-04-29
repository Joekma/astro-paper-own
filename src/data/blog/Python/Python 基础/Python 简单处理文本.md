---
title: Python 简单处理文本
author: FjellOverflow
pubDatetime: 2024-08-13T00:00:00Z
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - 文本处理
  - docs
description: 利用Python简单处理文本，涵盖字符串切割、文本格式化、文件读写等基础操作。
---

# Python 简单处理文本

## 字符串切割

例如，我想将下面代码中，每行的开头处理一下，可以使用字符串的切分

### 样本
```python

 1 from selenium import webdriver
 2 from selenium.webdriver import ActionChains
 3 from selenium.webdriver.common.by import By [[按照什么方式查找，By]].ID,By.CSS_SELECTOR
 4 from selenium.webdriver.common.keys import Keys [[键盘按键操作]]
 5 from selenium.webdriver.support import expected_conditions as EC
 6 from selenium.webdriver.support.wait import WebDriverWait [[等待页面加载某些元素]]
 7 import time
 8
 9
10 def get_goods(driver):
11     try:
12         goods=driver.find_elements_by_class_name('gl-item')
13
14         for good in goods:
15             detail_url=good.find_element_by_tag_name('a').get_attribute('href')
16
17             p_name=good.find_element_by_css_selector('.p-name em').text.replace('\n','')
18             price=good.find_element_by_css_selector('.p-price i').text
19             p_commit=good.find_element_by_css_selector('.p-commit a').text
20
21             msg = '''
22             商品 : %s
23             链接 : %s
24             价钱 ：%s
25             评论 ：%s
26             ''' % (p_name,detail_url,price,p_commit)
27
28             print(msg,end='\n\n')
29
30
31         button=driver.find_element_by_partial_link_text('下一页')
32         button.click()
33         time.sleep(1)
34         get_goods(driver)
35     except Exception:
36         pass
37
38 def spider(url,keyword):
39     driver = webdriver.Chrome()
40     driver.get(url)
41     driver.implicitly_wait(3)  # 使用隐式等待
42     try:
43         input_tag=driver.find_element_by_id('key')
44         input_tag.send_keys(keyword)
45         input_tag.send_keys(Keys.ENTER)
46         get_goods(driver)
47     finally:
48         driver.close()
49
50
51 if __name__ == '__main__':
52     spider('https://www.jd.com/',keyword='iPhone8手机')　

```
### 文本处理代码
```

file = open("111.txt", "r",encoding='utf-8')  # 以只读模式读取文件
lines = []
for i in file:
    lines.append(i)  # 逐行将文本存入列表lines中
file.close()

new = []
for line in lines:  # 逐行遍历
    new_line=line[3:] [[字符串切割]]
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
```

对象.replace(rgExp, replaceText, max)

```python
  * rgExp，replaceText是必须要有的，max是可选的参数，可以不加
  * 在对象的每个rgExp都替换成replaceText，从左到右最多max次

比如：

  1. class Solution:

  2. def replace_space(self, s):

  3. if not s:

  4. return False

  5. # 对象.replace(rgExp,replaceText,max)

  6. ss = s.replace(' ', '20%')

  7. return ss

  8. if __name__ == '__main__':

  9. strings = 'We Are Happy'

  10. s = Solution()

  11. print s.replace_space(strings)

  12. >>> We20%Are20%Happy

## re.sub---substitute，进行相对复杂的字符串替换

要用sub()，记住要import re哦！
```

re.sub(pattern,repl,string,count,flags)

```
  * 三个必选参数：pattern,repl,string，两个可选参数：count,flags

  1. pattern： 正则表达式中的模式字符串；
  2. repl： 原来字符串中要换的东西，比如上面例子中的20%（既可以是字符串，也可以是函数）；
  3. string： 要被处理的，要被替换的字符串，比如上面例子中的strings，即：'We Are Happy'；
  4. count： 匹配的次数，最多的次数
  5. flages： 标志位，用于控制正则表达式的匹配方式，如是否区分大小写，多行匹配等等

比如：

  1. import re

  2. class Solution:

  3. def replace_space(self, s):

  4. if not s:

  5. return False

  6. pattern = re.compile(r' ')

  7. # re.sub(pattern,repl,string,count,flags)

  8. return re.sub(pattern, r'20%', s)

  9. if __name__ == '__main__':

  10. strings = 'We Are Happy'

  11. s = Solution()

  12. print s.replace_space(strings)

## strip()

strip()并不是一个真正意义上的替换函数，它是用来删除一些字符的，所以我们可以把这看作是把字符串中的一些字符替换成空（不是空格，是空）

  1. 开头和结尾的空格都被去掉了,并不能删除字符串中间的空格(注意字符串首位是否会有空格)
  2. lstrip()和rstrip(),分别是用来删除开头的“其他字符”的

---
