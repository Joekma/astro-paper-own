---
title: DDD 领域驱动设计详解
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: ddd-domain-driven-design
description: "深入学习领域驱动设计（DDD）方法论，掌握实体、值对象、聚合、领域服务、仓储模式等核心概念，以及在 .NET 项目中的实践应用。"
tags:
  - DDD
  - 领域驱动设计
  - 架构
  - 设计模式
  - CQRS
  - 仓储模式
draft: false
series: csharp
language: zh-CN
---

## 概述

领域驱动设计（Domain-Driven Design，简称 DDD）是一种软件开发方法论，强调将软件的核心业务逻辑放在领域模型中。DDD 通过深入理解业务领域，建立通用语言（Ubiquitous Language），使技术团队和业务团队能够有效沟通，共同构建符合业务价值的软件系统。

### 为什么要使用 DDD

| 动因             | 说明                                       |
| ---------------- | ------------------------------------------ |
| **复杂业务逻辑** | 当业务逻辑复杂时，需要清晰的结构来组织代码 |
| **团队协作**     | 帮助开发者和业务专家建立共同语言           |
| **可维护性**     | 将业务规则封装在领域层，易于理解和修改     |
| **可测试性**     | 领域模型可独立于基础设施进行测试           |

---

## 核心概念

### 领域模型结构

```
┌─────────────────────────────────────────────────────────┐
│                  领域层（Domain Layer）                  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐  │
│  │              实体（Entity）                        │  │
│  │  具有唯一标识，生命周期内状态可变                    │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │              值对象（Value Object）                │  │
│  │  无唯一标识，不可变，用于描述实体的特征              │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │              聚合（Aggregate）                     │  │
│  │  一组相关对象的集合，有聚合根统一外部访问            │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │              领域服务（Domain Service）              │  │
│  │  不属于任何实体或值对象的业务行为                    │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │              仓储（Repository）                    │  │
│  │  提供聚合的持久化抽象                              │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │              领域事件（Domain Event）               │  │
│  │  领域中发生的业务事件                             │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 实体（Entity）

### 什么是实体

实体是具有唯一标识的领域对象，在整个生命周期中保持连续性：

- 具有唯一标识（ID）
- 状态可变
- 两个实体即使属性相同，若 ID 不同则被视为不同对象

### 实体的实现

```csharp
public class Case : AuditableEntity
{
    // 唯一标识
    public Guid Id { get; private set; }

    // 业务属性
    public CaseNumber CaseNumber { get; private set; }
    public CustomerInfo Customer { get; private set; }
    public CaseStatus Status { get; private set; }
    public Money LoanAmount { get; private set; }

    // 私有构造函数
    private Case() { }

    // 工厂方法
    public static Case Create(CustomerInfo customer, Money loanAmount)
    {
        return new Case
        {
            Id = Guid.NewGuid(),
            CaseNumber = CaseNumber.New(),
            Customer = customer,
            Status = CaseStatus.Draft,
            LoanAmount = loanAmount
        };
    }

    // 业务方法
    public void Submit()
    {
        if (Status != CaseStatus.Draft)
            throw new InvalidOperationException("只有草稿状态的案件才能提交");

        Status = CaseStatus.Submitted;
        AddDomainEvent(new CaseSubmittedEvent(this));
    }

    public void Approve()
    {
        if (Status != CaseStatus.Submitted)
            throw new InvalidOperationException("只有已提交的案件才能审批");

        Status = CaseStatus.Approved;
        AddDomainEvent(new CaseApprovedEvent(this));
    }
}
```

### 基类设计

```csharp
public abstract class AuditableEntity
{
    public Guid Id { get; protected set; }
    public DateTime CreatedAt { get; protected set; }
    public string CreatedBy { get; protected set; }
    public DateTime? ModifiedAt { get; protected set; }
    public string? ModifiedBy { get; protected set; }

    private readonly List<DomainEvent> _domainEvents = new();
    public IReadOnlyList<DomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected void AddDomainEvent(DomainEvent eventItem)
    {
        _domainEvents.Add(eventItem);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}
```

---

## 值对象（Value Object）

### 什么是值对象

值对象是没有唯一标识的对象，通过其属性值来定义相等性：

- 无唯一标识
- 不可变
- 可以安全共享
- 用于描述实体的特征

### 值对象的实现

```csharp
public readonly struct Money : IEquatable<Money>
{
    public decimal Amount { get; }
    public Currency Currency { get; }

    public Money(decimal amount, Currency currency)
    {
        if (amount < 0)
            throw new ArgumentException("金额不能为负数");

        Amount = amount;
        Currency = currency;
    }

    // 值对象操作
    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException("货币类型必须相同");
        return new Money(Amount + other.Amount, Currency);
    }

    // 操作符重载
    public static Money operator +(Money a, Money b) => a.Add(b);

    // 相等性
    public bool Equals(Money other) =>
        Amount == other.Amount && Currency == other.Currency;

    public override bool Equals(object? obj) =>
        obj is Money other && Equals(other);

    public override int GetHashCode() => HashCode.Combine(Amount, Currency);
}
```

### 常用值对象示例

```csharp
// 邮箱
public readonly struct Email
{
    public string Value { get; }

    public Email(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("邮箱不能为空");
        if (!IsValidEmail(value))
            throw new ArgumentException("邮箱格式不正确");

        Value = value;
    }

    private static bool IsValidEmail(string email)
    {
        return email.Contains("@");
    }
}

// 电话号码
public readonly struct PhoneNumber
{
    public string CountryCode { get; }
    public string Number { get; }

    public PhoneNumber(string countryCode, string number)
    {
        CountryCode = countryCode;
        Number = number;
    }
}
```

---

## 聚合（Aggregate）

### 什么是聚合

聚合是一组相关对象的组合，有聚合根（Aggregate Root）统一外部访问：

- 聚合根是聚合的入口点
- 外部对象只能通过聚合根访问内部对象
- 聚合内的对象共享相同的生命周期
- 聚合是事务的边界

### 聚合的实现

```csharp
public class CaseAggregate
{
    private readonly List<Document> _documents = new();
    private readonly List<Note> _notes = new();

    public CaseAggregateId Id { get; private set; }
    public CaseInfo Info { get; private set; }
    public CaseStatus Status { get; private set; }

    // 外部只能通过聚合根访问
    public IReadOnlyList<Document> Documents => _documents.AsReadOnly();
    public IReadOnlyList<Note> Notes => _notes.AsReadOnly();

    // 添加文档（通过聚合根）
    public void AddDocument(Document document)
    {
        if (Status == CaseStatus.Closed)
            throw new InvalidOperationException("已关闭的案件不能添加文档");

        _documents.Add(document);
    }

    // 移除文档（通过聚合根）
    public void RemoveDocument(DocumentId documentId)
    {
        var document = _documents.FirstOrDefault(d => d.Id == documentId);
        if (document == null)
            throw new InvalidOperationException("文档不存在");

        if (Status == CaseStatus.Closed)
            throw new InvalidOperationException("已关闭的案件不能移除文档");

        _documents.Remove(document);
    }

    // 业务规则在聚合根中
    public void Close()
    {
        if (_documents.Any(d => d.Status == DocumentStatus.Pending))
            throw new InvalidOperationException("存在待处理的文档");

        Status = CaseStatus.Closed;
    }
}
```

### 聚合的设计原则

| 原则             | 说明                           |
| ---------------- | ------------------------------ |
| **保持聚合小**   | 聚合应保持精简，只包含必要对象 |
| **引用其他聚合** | 通过 ID 而非直接引用           |
| **事务边界**     | 一个聚合对应一个事务           |
| **最终一致性**   | 聚合之间通过事件同步           |

---

## 领域服务（Domain Service）

### 什么时候使用领域服务

当某个业务行为不属于任何实体或值对象时，使用领域服务：

```csharp
// 计算贷款额度 - 领域服务
public class LoanCalculationService
{
    public LoanCalculationResult Calculate(LoanApplication application)
    {
        // 复杂的贷款计算逻辑
        var baseAmount = CalculateBaseAmount(application);
        var riskAdjustment = CalculateRiskAdjustment(application);
        var finalAmount = baseAmount * riskAdjustment;

        return new LoanCalculationResult(finalAmount);
    }

    private decimal CalculateRiskAdjustment(LoanApplication application)
    {
        // 风险调整逻辑
        return 1.0m;
    }
}
```

### 领域服务 vs 实体方法

| 领域服务           | 实体方法       |
| ------------------ | -------------- |
| 涉及多个实体或聚合 | 只涉及单个实体 |
| 无状态             | 有状态         |
| 执行领域操作       | 维护实体完整性 |

---

## 仓储模式（Repository）

### 什么是仓储

仓储提供聚合的持久化抽象，隔离领域与数据访问逻辑：

```
┌────────────────┐
│   应用服务     │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│    领域层      │
│  ┌──────────┐  │
│  │  仓储接口 │  │
│  └─────┬────┘  │
└─────────┼────────┘
          │
          ▼
┌────────────────┐
│   基础设施层   │
│  ┌──────────┐  │
│  │ 仓储实现 │  │
│  └──────────┘  │
└────────────────┘
```

### 仓储接口

```csharp
public interface ICaseRepository
{
    // 查询
    Task<Case?> GetByIdAsync(CaseAggregateId id);
    Task<IReadOnlyList<Case>> GetByCustomerAsync(CustomerId customerId);
    Task<IReadOnlyList<Case>> GetPendingCasesAsync();

    // 命令
    Task AddAsync(Case case);
    Task UpdateAsync(Case case);
    Task DeleteAsync(CaseAggregateId id);

    // 批量操作
    Task AddRangeAsync(IEnumerable<Case> cases);
}
```

### 仓储实现

```csharp
public class CaseRepository : ICaseRepository
{
    private readonly ApplicationDbContext _context;

    public CaseRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Case?> GetByIdAsync(CaseAggregateId id)
    {
        return await _context.Cases
            .Include(c => c.Documents)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task AddAsync(Case case)
    {
        await _context.Cases.AddAsync(case);
        await _context.SaveChangesAsync();
    }
}
```

---

## 领域事件（Domain Event）

### 领域事件的作用

领域事件用于解耦聚合，事件驱动实现最终一致性：

```csharp
public abstract class DomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
    public Guid EventId { get; } = Guid.NewGuid();
}

public class CaseSubmittedEvent : DomainEvent
{
    public CaseAggregateId CaseId { get; }
    public CustomerId CustomerId { get; }
    public Money LoanAmount { get; }

    public CaseSubmittedEvent(CaseAggregate case)
    {
        CaseId = case.Id;
        CustomerId = case.Info.CustomerId;
        LoanAmount = case.LoanAmount;
    }
}
```

### 事件处理

```csharp
public class CaseSubmittedEventHandler : INotificationHandler<CaseSubmittedEvent>
{
    private readonly IEmailService _emailService;

    public async Task Handle(CaseSubmittedEvent notification,
        CancellationToken cancellationToken)
    {
        // 发送通知等
        await _emailService.SendCaseSubmittedEmailAsync(notification);
    }
}
```

---

## 应用服务（Application Service）

### 应用服务的职责

应用服务编排领域对象和仓储，实现用例：

```csharp
public class CaseApplicationService
{
    private readonly ICaseRepository _caseRepository;
    private readonly IMediator _mediator;

    public async Task<CaseDto> SubmitCaseAsync(SubmitCaseCommand command)
    {
        var customer = await _customerRepository.GetByIdAsync(command.CustomerId);

        var case = Case.Create(customer, command.Amount);

        await _caseRepository.AddAsync(case);
        await _mediator.Publish(new CaseSubmittedEvent(case));

        return new CaseDto(case);
    }
}
```

---

## 项目结构

### 分层架构

```
Claw.Domain/
├── Entities/
│   ├── Case.cs
│   ├── Customer.cs
│   └── Document.cs
├── ValueObjects/
│   ├── Money.cs
│   ├── Email.cs
│   └── PhoneNumber.cs
├── Aggregates/
│   ├── CaseAggregate/
│   │   ├── CaseAggregate.cs
│   │   ├── Document.cs
│   │   └── Note.cs
│   └── CustomerAggregate/
├── Events/
│   ├── DomainEvent.cs
│   ├── CaseSubmittedEvent.cs
│   └── CaseApprovedEvent.cs
├── Repositories/
│   ├── ICaseRepository.cs
│   └── ICustomerRepository.cs
├── Services/
│   └── LoanCalculationService.cs
└── Specifications/
    ├── CaseSpecification.cs
    └── CustomerSpecification.cs

Claw.Application/
├── Cases/
│   ├── Commands/
│   │   └── SubmitCaseCommand.cs
│   └── Queries/
│       └── GetCaseQuery.cs
├── Services/
│   └── CaseApplicationService.cs
└── DTOs/
    └── CaseDto.cs

Claw.Infrastructure/
├── Persistence/
│   ├── ApplicationDbContext.cs
│   └── Repositories/
│       ├── CaseRepository.cs
│       └── CustomerRepository.cs
└── External/
    └── EmailService.cs
```

---

## 最佳实践

### 1. 保持领域模型纯净

- 领域层不应依赖 Infrastructure 层
- 不使用数据库相关的特性（如主键生成策略）
- 不直接使用依赖注入容器

### 2. 使用工厂方法

```csharp
// 工厂方法创建实体
public class Case
{
    private Case() { }  // 私有构造函数

    public static Case Create(Customer customer, Money amount)
    {
        return new Case
        {
            Id = CaseId.New(),
            Customer = customer,
            Status = CaseStatus.Draft,
            LoanAmount = amount
        };
    }
}
```

### 3. 封装业务规则

```csharp
public void Submit()
{
    // 验证规则内聚在实体中
    if (CannotSubmit())
        throw new BusinessRuleException("无法提交");

    Status = CaseStatus.Submitted;
}
```

### 4. 使用规约模式

```csharp
public interface ISpecification<T>
{
    bool IsSatisfiedBy(T entity);
}

public class PendingCasesSpecification : ISpecification<Case>
{
    public bool IsSatisfiedBy(Case entity) =>
        entity.Status == CaseStatus.Pending;
}
```

---

## 常见问题

### 1. 贫血模型 vs 充血模型

| 贫血模型               | 充血模型                 |
| ---------------------- | ------------------------ |
| 只有属性，没有行为     | 属性和行为都在领域对象中 |
| 服务类处理所有业务逻辑 | 业务逻辑封装在领域对象中 |
| 简单，但业务逻辑分散   | 封装良好，但复杂度较高   |

### 2. 聚合边界设计

- 根据业务不变性（Invariant）确定边界
- 避免跨聚合事务
- 聚合应尽量小

### 3. 领域事件的使用场景

- 解耦微服务
- 实现最终一致性
- 审计日志
- 通知系统

---

## 相关模式

### CQRS

命令查询职责分离：

```
┌─────────────────┐     ┌─────────────────┐
│    Commands     │     │     Queries      │
│  (写入操作)      │     │    (读取操作)     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│      领域写模型      │     │      读模型       │
│   (聚合、仓储)      │     │    (视图模型)     │
└─────────────────┘     └─────────────────┘
```

### 防腐层（Anti-Corruption Layer）

隔离外部系统的影响：

```
┌────────────┐     ┌─────────────┐     ┌────────────┐
│  外部系统  │ ──→ │  防腐层     │ ──→ │   领域层   │
└────────────┘     └─────────────┘     └────────────┘
```

---

## 总结

| 概念         | 说明               | 关键点             |
| ------------ | ------------------ | ------------------ |
| **实体**     | 有唯一标识的对象   | 生命周期内状态可变 |
| **值对象**   | 无标识的不可变对象 | 通过属性值相等     |
| **聚合**     | 一组对象的组合     | 有聚合根统一访问   |
| **领域服务** | 不属于实体的行为   | 跨聚合操作         |
| **仓储**     | 持久化抽象         | 隔离数据访问       |
| **领域事件** | 解耦机制           | 实现最终一致性     |

### DDD 核心价值

1. **通用语言** - 团队共享的业务语言
2. **边界清晰** - 明确的领域边界
3. **业务封装** - 业务规则内聚在领域层
4. **可测试性** - 领域模型可独立测试
5. **演进式设计** - 持续重构以反映业务理解

---

## 相关资源

- [DDD 官方文档](https://learn.microsoft.com/zh-cn/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-layer-microservices)
- [DDD 入门](https://learn.microsoft.com/zh-cn/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns)
- [CQRS 模式](https://learn.microsoft.com/zh-cn/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/apply-simplified-microservice-cqrs-ddd-patterns)
