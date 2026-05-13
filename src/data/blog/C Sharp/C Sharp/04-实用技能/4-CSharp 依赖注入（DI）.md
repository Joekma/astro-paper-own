---
title: "C# 依赖注入（Dependency Injection）详解"
author: Joekma
pubDatetime: 2026-05-13T00:00:00.000+08:00
modDatetime: 2026-05-13T00:00:00.000+08:00
slug: csharp-dependency-injection
description: "深入学习 .NET 依赖注入框架，掌握服务注册、生命周期管理、构造函数注入以及最佳实践。"
tags:
  - C#
  - 依赖注入
  - DI
  - IoC
  - ASP.NET Core
  - 服务容器
draft: false
series: csharp
language: zh-CN
---

## 概述

依赖注入（Dependency Injection，DI）是一种实现**控制反转（IoC）**的软件设计模式。在 C#/.NET 中，依赖注入是框架的内置部分，与配置、日志记录和选项模式一样是核心基础设施。

依赖注入的核心思想：
- **依赖关系抽象化**：使用接口或基类将依赖关系实现抽象化
- **依赖关系注册**：在服务容器中注册依赖关系
- **依赖关系解析**：将服务注入到使用它的类的构造函数中

## 为什么需要依赖注入

### 传统方式的缺点

```csharp
// ❌ 传统方式：类直接创建依赖
public class OrderService
{
    private readonly EmailService _emailService = new EmailService();
    private readonly PaymentGateway _paymentGateway = new PaymentGateway();

    public void ProcessOrder(Order order)
    {
        _emailService.SendConfirmation(order);
        _paymentGateway.ProcessPayment(order);
    }
}
```

这种方式的问题：
1. **紧耦合**：服务直接依赖具体实现，难以替换
2. **难以测试**：无法使用 Mock 对象进行单元测试
3. **配置分散**：依赖配置代码散落在各处
4. **违反单一职责**：类负责业务逻辑同时还要管理依赖创建

### 依赖注入的优势

```csharp
// ✅ 使用依赖注入：依赖通过构造函数注入
public class OrderService
{
    private readonly IEmailService _emailService;
    private readonly IPaymentGateway _paymentGateway;

    // 依赖通过构造函数注入
    public OrderService(IEmailService emailService, IPaymentGateway paymentGateway)
    {
        _emailService = emailService;
        _paymentGateway = paymentGateway;
    }

    public void ProcessOrder(Order order)
    {
        _emailService.SendConfirmation(order);
        _paymentGateway.ProcessPayment(order);
    }
}
```

## 基础使用

### 定义服务接口和实现

```csharp
// 定义服务接口
public interface IMessageWriter
{
    void Write(string message);
}

// 实现服务
public class ConsoleMessageWriter : IMessageWriter
{
    public void Write(string message)
    {
        Console.WriteLine($"Console: {message}");
    }
}

// 另一个实现
public class FileMessageWriter : IMessageWriter
{
    private readonly string _filePath;

    public FileMessageWriter(string filePath)
    {
        _filePath = filePath;
    }

    public void Write(string message)
    {
        File.AppendAllText(_filePath, message + Environment.NewLine);
    }
}
```

### 注册服务

```csharp
using Microsoft.Extensions.DependencyInjection;

// 创建服务集合
var services = new ServiceCollection();

// 注册服务（接口 → 实现）
services.AddSingleton<IMessageWriter, ConsoleMessageWriter>();
// 或者
services.AddSingleton<IMessageWriter>(new ConsoleMessageWriter());

// 构建服务提供者
var serviceProvider = services.BuildServiceProvider();

// 获取服务
var writer = serviceProvider.GetRequiredService<IMessageWriter>();
writer.Write("Hello, Dependency Injection!");
```

### 现代主机方式

```csharp
// 使用 .NET 6+ 的 HostApplicationBuilder
using Microsoft.Extensions.Hosting;

var builder = Host.CreateApplicationBuilder(args);

// 注册服务
builder.Services.AddSingleton<IMessageWriter, ConsoleMessageWriter>();

// 添加托管服务
builder.Services.AddHostedService<WorkerService>();

// 构建并运行
var host = builder.Build();
host.Run();

// 托管服务示例
public class WorkerService : BackgroundService
{
    private readonly IMessageWriter _messageWriter;

    // 依赖自动注入
    public WorkerService(IMessageWriter messageWriter)
    {
        _messageWriter = messageWriter;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _messageWriter.Write($"Worker running at: {DateTimeOffset.Now}");
            await Task.Delay(1000, stoppingToken);
        }
    }
}
```

## 服务生命周期

.NET DI 容器支持三种服务生命周期：

### 1. 瞬态（Transient）

每次请求时创建新实例：

```csharp
// 每次注入都创建新实例
services.AddTransient<IEmailService, EmailService>();

// 使用 lambda 表达式注册
services.AddTransient<IEmailService>(sp => new EmailService());

// 适合：无状态、轻量级服务
```

```csharp
// 示例：验证行为
public void TransientExample()
{
    var services = new ServiceCollection();
    services.AddTransient<GuidService>();
    
    var provider = services.BuildServiceProvider();
    
    var guid1 = provider.GetRequiredService<GuidService>();
    var guid2 = provider.GetRequiredService<GuidService>();
    
    // guid1 和 guid2 是不同的实例
    Console.WriteLine(guid1.Id);  // 不同的 Guid
    Console.WriteLine(guid2.Id);
}

public class GuidService
{
    public Guid Id { get; } = Guid.NewGuid();
}
```

### 2. 作用域（Scoped）

每个请求创建一个实例（Web 应用中常用）：

```csharp
// 同一请求内共享实例
services.AddScoped<IUserRepository, UserRepository>();

// 适合：数据库上下文、用户相关服务
```

```csharp
// Web 应用示例
public class HomeController
{
    private readonly IUserRepository _userRepository;

    // 同一 HTTP 请求中获取相同的 UserRepository 实例
    public HomeController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }
}

// Entity Framework Core DbContext 就是 Scoped
services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));
```

### 3. 单例（Singleton）

整个应用生命周期只创建一次：

```csharp
// 整个应用只创建一个实例
services.AddSingleton<ISettings, AppSettings>();
services.AddSingleton<IMetricsCollector, MetricsCollector>();

// 适合：有状态但需要全局共享的服务、性能计数器
```

```csharp
// 示例
public void SingletonExample()
{
    var services = new ServiceCollection();
    services.AddSingleton<CounterService>();
    
    var provider = services.BuildServiceProvider();
    
    var counter1 = provider.GetRequiredService<CounterService>();
    var counter2 = provider.GetRequiredService<CounterService>();
    
    counter1.Increment();
    counter1.Increment();
    
    // counter1 和 counter2 是同一个实例
    Console.WriteLine(counter2.Value);  // 2
}

public class CounterService
{
    public int Value { get; private set; }
    
    public void Increment() => Value++;
}
```

### 生命周期对比

| 生命周期 | 创建时机 | 销毁时机 | 适用场景 |
|---------|---------|---------|---------|
| Transient | 每次请求 | 每次 GC | 无状态、轻量级服务 |
| Scoped | 首次请求 | 请求结束 | DbContext、用户服务 |
| Singleton | 首次请求 | 应用关闭 | 配置、缓存、计数器 |

## 服务注册方法

### 泛型注册

```csharp
// 接口 → 实现
services.AddSingleton<IService, Service>();

// 仅实现类型（接口和实现相同）
services.AddSingleton<Service>();

// Lambda 表达式（可传递参数）
services.AddSingleton<IService>(sp => new Service("参数"));
```

### 多个实现

```csharp
// 注册多个实现
services.AddSingleton<ILogger, ConsoleLogger>();
services.AddSingleton<ILogger, FileLogger>();

// 获取所有实现
public class LoggerConsumer
{
    private readonly IEnumerable<ILogger> _loggers;

    public LoggerConsumer(IEnumerable<ILogger> loggers)
    {
        _loggers = loggers;
    }

    public void Log(string message)
    {
        foreach (var logger in _loggers)
        {
            logger.Log(message);
        }
    }
}

// 获取最后一个注册的实现
var logger = serviceProvider.GetRequiredService<ILogger>();
```

### TryAdd 系列方法

```csharp
// 仅当未注册时才添加
services.TryAddSingleton<IMessageWriter, DefaultMessageWriter>();
services.TryAddSingleton<IMessageWriter, CustomMessageWriter>();  // 不会添加

// TryAddEnumerable：仅当没有同类型实现时添加
services.TryAddEnumerable(ServiceDescriptor.Singleton<IMessageWriter, Logger1>());
services.TryAddEnumerable(ServiceDescriptor.Singleton<IMessageWriter, Logger1>());  // 不会添加
```

### 替换实现

```csharp
// 替换已注册的服务
services.AddSingleton<IEmailService, OriginalEmailService>();
services.AddSingleton<IEmailService>(sp => new CustomEmailService());

// 使用 descriptor 替换
var descriptor = new ServiceDescriptor(
    typeof(IEmailService),
    typeof(CustomEmailService),
    ServiceLifetime.Singleton);
services.Replace(descriptor);
```

## 构造函数注入

### 基础用法

```csharp
public class UserService
{
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;
    private readonly ILogger<UserService> _logger;

    // 依赖自动从 DI 容器注入
    public UserService(
        IUserRepository userRepository,
        IEmailService emailService,
        ILogger<UserService> logger)
    {
        _userRepository = userRepository;
        _emailService = emailService;
        _logger = logger;
    }
}
```

### 多个构造函数

```csharp
public class ExampleService
{
    // 无参数构造函数
    public ExampleService() { }

    // 可注入的构造函数
    public ExampleService(ILogger<ExampleService> logger) { }

    // 优先选择参数最多的可解析构造函数
    // 如果 FooService 或 BarService 未注册，使用 ILogger 版本
    public ExampleService(FooService foo, BarService bar) { }
}
```

### 主构造函数（C# 12+）

```csharp
// 使用主构造函数的简洁语法
public class UserService(IUserRepository repository, IEmailService emailService)
    : IUserService
{
    public async Task<User> GetUserAsync(int id)
    {
        return await repository.GetByIdAsync(id);
    }
}
```

## 依赖解析

### 基本解析

```csharp
var services = new ServiceCollection();
services.AddSingleton<IMessageWriter, ConsoleMessageWriter>();

var provider = services.BuildServiceProvider();

// 获取服务（不存在则抛出异常）
var writer = provider.GetRequiredService<IMessageWriter>();

// 获取服务（不存在返回 null）
var optional = provider.GetService<IMessageWriter>();

// 获取多个服务
var allWriters = provider.GetServices<IMessageWriter>();
```

### IServiceProvider

```csharp
public class MessageProcessor
{
    private readonly IServiceProvider _serviceProvider;

    public MessageProcessor(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public void Process()
    {
        // 按需创建服务
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        
        // 执行数据库操作
    }
}
```

## 作用域与依赖注入

### 创建作用域

```csharp
public class ScopedService { }

// 在根容器注册
services.AddSingleton<SingletonService>();

// 在作用域注册
services.AddScoped<ScopedService>();

// 使用
var rootProvider = services.BuildServiceProvider();

// 创建作用域
using (var scope = rootProvider.CreateScope())
{
    var scoped = scope.ServiceProvider.GetRequiredService<ScopedService>();
}

// 另一个独立作用域
using (var scope = rootProvider.CreateScope())
{
    var scoped = scope.ServiceProvider.GetRequiredService<ScopedService>();
}
```

### Web 应用中的作用域

```csharp
// ASP.NET Core 中每个 HTTP 请求自动创建作用域
public class HomeController : Controller
{
    private readonly AppDbContext _context;

    // HTTP 请求期间使用同一个 DbContext 实例
    public HomeController(AppDbContext context)
    {
        _context = context;
    }
}
```

## 实际应用示例

### 分层架构

```csharp
// 数据访问层
public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id);
    Task<List<User>> GetAllAsync();
}

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(int id)
        => await _context.Users.FindAsync(id);

    public async Task<List<User>> GetAllAsync()
        => await _context.Users.ToListAsync();
}

// 业务逻辑层
public interface IUserService
{
    Task<UserDto?> GetUserAsync(int id);
}

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;  // AutoMapper 示例

    public UserService(IUserRepository userRepository, IMapper mapper)
    {
        _userRepository = userRepository;
        _mapper = mapper;
    }

    public async Task<UserDto?> GetUserAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        return user == null ? null : _mapper.Map<UserDto>(user);
    }
}

// 表现层
public class UserController
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _userService.GetUserAsync(id);
        return user == null ? NotFound() : Ok(user);
    }
}
```

### Program.cs 配置

```csharp
var builder = WebApplication.CreateBuilder(args);

// 添加服务到容器
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 数据层
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// 业务层
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();

// 通用服务
builder.Services.AddSingleton<IMetricsCollector, MetricsCollector>();
builder.Services.AddTransient<IEmailService, SmtpEmailService>();

// AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// Swagger
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 配置管道
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();

app.Run();
```

## 常见问题

### 循环依赖

```csharp
// ❌ 循环依赖会导致异常
public class A
{
    public A(B b) { }
}

public class B
{
    public B(A a) { }
}

// ✅ 解决方案：使用接口抽象
public interface IA { }
public interface IB { }

public class A : IA
{
    public A(IB b) { }
}

public class B : IB
{
    public B(IA a) { }
}
```

### 释放资源

```csharp
// 实现 IDisposable
public class DatabaseConnection : IDisposable
{
    private bool _disposed;

    public void Dispose()
    {
        if (!_disposed)
        {
            // 释放资源
            _disposed = true;
        }
    }
}

// 或实现 IAsyncDisposable
public class AsyncResource : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        await CleanupAsync();
    }
}

// DI 容器会自动调用 Dispose
services.AddTransient<DatabaseConnection>();
```

## 总结

| 注册方法 | 说明 |
|---------|------|
| `AddSingleton<T>()` | 单例，整个应用生命周期 |
| `AddScoped<T>()` | 作用域，每个请求一个实例 |
| `AddTransient<T>()` | 瞬态，每次请求创建新实例 |
| `TryAddSingleton<T>()` | 仅未注册时添加 |
| `TryAddEnumerable()` | 添加不重复的实现 |

## 相关资源

- [.NET 依赖注入](https://learn.microsoft.com/zh-cn/dotnet/core/extensions/dependency-injection)
- [依赖注入指南](https://learn.microsoft.com/zh-cn/dotnet/core/extensions/dependency-injection-guidelines)
- [在 ASP.NET Core 中使用依赖注入](https://learn.microsoft.com/zh-cn/aspnet/core/fundamentals/dependency-injection)