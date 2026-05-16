---
title: "SaaS、CRM、ERP 业务系统设计模式：对象、流程和权限"
author: Joekma
pubDatetime: 2026-05-16T00:00:00.000+08:00
modDatetime: 2026-05-16T00:00:00.000+08:00
slug: ai-cross-platform-design-saas-crm-erp
featured: false
draft: false
tags:
  - SaaS
  - CRM
  - ERP
  - B端设计
description: "面向企业级业务系统，讲解对象管理、状态流转、权限、审批和操作日志等通用设计模式。"
series: AI 多端页面设计
language: zh-CN
---

## 核心结论

SaaS、CRM、ERP 的设计核心不是页面漂亮，而是把业务对象、流程状态、权限边界和操作记录表达清楚。

企业系统用户通常关心：数据是否准确、流程是否可控、责任是否清楚、操作是否可追溯。

## 对象管理

业务对象通常需要列表、详情、编辑、导入、导出、归档和权限控制。对象详情页要展示状态、关键字段、关联对象和操作历史。

不要把所有字段平铺。按业务分组更容易理解。

## 状态流转

订单、线索、合同、工单、审批都有状态流转。状态标签要清楚，下一步操作要符合当前状态。

禁用不可执行动作时，最好说明原因，而不是只隐藏按钮。

## 权限设计

企业系统权限复杂。页面应区分无数据、无权限、部分权限和只读权限。用户需要知道自己为什么不能操作，以及如何申请。

## 审计和日志

关键操作要有日志：谁、什么时候、做了什么、影响了哪些对象。高风险操作需要确认和撤销策略。

## AI 开发提示词

```text
请为【业务对象】设计 SaaS/CRM/ERP 页面模式。
请输出列表、详情、编辑、状态流转、权限、审批、操作日志和风险操作确认。
要求所有操作符合对象当前状态。
```

## 检查清单

- 对象状态是否清楚？
- 下一步操作是否符合流程？
- 权限不足是否有解释？
- 关键操作是否可追溯？
- 详情页是否按业务分组？

## 参考来源

- Salesforce Lightning Design System：https://www.lightningdesignsystem.com/
- Atlassian Design System：https://atlassian.design/design-system/
- IBM Carbon Design System：https://carbondesignsystem.com/

