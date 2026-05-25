---
title: NuGet 包管理
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: nuget-package-management
description: "深入学习 NuGet 包管理器，掌握 NuGet 包的安装、更新、管理依赖项，以及私有 NuGet 源配置。"
tags:
  - NuGet
  - 包管理
  - .NET
  - 依赖管理
  - NuGet 源
draft: false
series: csharp
seriesOrder: 21
language: zh-CN
---

## 概述

NuGet 是 .NET 平台的包管理器，用于创建、共享和使用可重用的代码包。通过 NuGet，开发人员可以轻松地将第三方库添加到项目中，实现代码复用。

### NuGet 的核心功能

| 功能         | 说明                      |
| ------------ | ------------------------- |
| **包管理**   | 安装、更新、卸载 NuGet 包 |
| **依赖解析** | 自动处理包之间的依赖关系  |
| **版本控制** | 管理不同版本的包          |
| **私有源**   | 支持私有 NuGet 源         |
| **缓存管理** | 加快包的安装和还原速度    |

---

## NuGet 基础

### 什么是 NuGet 包

NuGet 包是带有 `.nupkg` 扩展名的 ZIP 文件，包含：

- 编译后的代码（DLL）
- 相关的清单文件（nuspec）
- 其他资源文件

### NuGet 工作流程

```
包创建者 → 发布到主机 → 包使用者 → 安装到项目
   ↓                              ↓
  创建包                    还原依赖项
```

---

## 包管理格式

### PackageReference（推荐）

从 NuGet 4.0+ 开始使用，直接在项目文件中管理依赖项：

```xml
<ItemGroup>
  <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
  <PackageReference Include="Microsoft.Extensions.Logging" Version="8.0.0" />
</ItemGroup>
```

**优点：**

- 依赖关系清晰
- 自动解析依赖图
- 支持浮点版本号

### packages.config（遗留格式）

传统格式，使用独立的配置文件：

```xml
<?xml version="1.0" encoding="utf-8"?>
<packages>
  <package id="Newtonsoft.Json" version="13.0.3" targetFramework="net8.0" />
</packages>
```

---

## dotnet CLI 命令

### 安装包

```powershell
# 安装最新版本
dotnet add package Newtonsoft.Json

# 安装指定版本
dotnet add package Newtonsoft.Json --version 13.0.3

# 安装预发布版本
dotnet add package Newtonsoft.Json --version 13.0.3-beta1
```

### 查看包

```powershell
# 查看项目已安装的包
dotnet list package

# 查看可更新的包
dotnet list package --outdated

# 查看包的详细信息
dotnet list package --include-transitive
```

### 更新包

```powershell
# 更新所有包
dotnet restore

# 更新特定包
dotnet add package Newtonsoft.Json --version 13.0.3
```

### 卸载包

```powershell
# 卸载包
dotnet remove package Newtonsoft.Json
```

### 还原包

```powershell
# 还原项目依赖项
dotnet restore

# 还原并强制重新下载
dotnet restore --force
```

---

## Package Manager 控制台命令

在 Visual Studio 中使用包管理器控制台：

```powershell
# 安装包
Install-Package Newtonsoft.Json

# 安装指定版本
Install-Package Newtonsoft.Json -Version 13.0.3

# 更新包
Update-Package Newtonsoft.Json

# 更新所有包
Update-Package

# 卸载包
Uninstall-Package Newtonsoft.Json

# 查看已安装的包
Get-Package
```

---

## NuGet 源配置

### 添加 NuGet 源

```powershell
# 添加 nuget.org 源
dotnet nuget add source https://api.nuget.org/v3/index.json -n nuget.org

# 添加私有源
dotnet nuget add source https://pkgs.dev.azure.com/yourorg/_packaging/yourfeed/nuget/v3/index.json -n YourOrg

# 添加本地源
dotnet nuget add source C:\LocalPackages -n Local
```

### 列出源

```powershell
dotnet nuget list source
```

### 移除源

```powershell
dotnet nuget remove source YourOrg
```

### 禁用源

```powershell
dotnet nuget disable source YourOrg
```

---

## 版本管理

### 版本号格式

```
主版本.次版本.修订版本[-预发布标签]
13.0.3              # 标准版本
13.0.3-beta1        # 预发布版本
13.0.3-rc.1         # 发布候选版本
```

### 版本范围

```xml
<!-- 精确版本 -->
<PackageReference Include="Newtonsoft.Json" Version="13.0.3" />

<!-- 最低版本（包含） -->
<PackageReference Include="Newtonsoft.Json" Version="13.0.3" />

<!-- 浮动版本 -->
<PackageReference Include="Newtonsoft.Json" Version="13.0.*" />
<PackageReference Include="Newtonsoft.Json" Version="[13.0.3, 14.0.0)" />
```

### 版本范围语法

| 范围         | 说明                       |
| ------------ | -------------------------- |
| `1.0`        | 精确版本 1.0               |
| `[1.0, 2.0)` | 大于等于 1.0，小于 2.0     |
| `[1.0, 2.0]` | 大于等于 1.0，小于等于 2.0 |
| `(1.0, 2.0)` | 大于 1.0，小于 2.0         |
| `1.0.*`      | 以 1.0 开头的最新版本      |

---

## 私有 NuGet 源

### Azure Artifacts

```powershell
# 添加 Azure Artifacts 源
dotnet nuget add source https://pkgs.dev.azure.com/yourorg/_packaging/yourfeed/nuget/v3/index.json -n YourOrg --username your.email@outlook.com --password $env:PAT
```

### NuGet.Server

创建私有 NuGet 服务器：

```xml
<!-- NuGet.Server.csproj -->
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="NuGet.Server" Version="6.8.0" />
  </ItemGroup>
</Project>
```

### GitHub Packages

```powershell
# 添加 GitHub Packages 源
dotnet nuget add source https://nuget.pkg.github.com/yourusername/index.json -n github -u yourusername -p YOUR_TOKEN
```

---

## 依赖项解析

### 依赖解析规则

1. 优先使用直接依赖的版本
2. 解决版本冲突
3. 选择最高兼容版本
4. 防止回退到更低版本

### 可传递依赖项

```powershell
# 查看可传递依赖项
dotnet list package --include-transitive
```

### 锁定依赖项

创建 `Directory.Packages.props` 集中管理版本：

```xml
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include="Newtonsoft.Json" Version="13.0.3" />
    <PackageVersion Include="Microsoft.Extensions.Logging" Version="8.0.0" />
  </ItemGroup>
</Project>
```

---

## NuGet 缓存管理

### 全局包文件夹

```powershell
# 查看全局包位置
dotnet nuget locals global-packages --list

# 清除全局包
dotnet nuget locals global-packages --clear

# 清除 HTTP 缓存
dotnet nuget locals http-cache --clear

# 清除所有缓存
dotnet nuget locals all --clear
```

### 缓存位置

| 缓存类型          | 说明            |
| ----------------- | --------------- |
| `global-packages` | 下载的 NuGet 包 |
| `http-cache`      | HTTP 请求缓存   |
| `temp`            | 临时文件        |

---

## 实用示例

### 示例1：安装常用工具包

```powershell
# JSON 处理
dotnet add package Newtonsoft.Json

# 日志框架
dotnet add package Microsoft.Extensions.Logging
dotnet add package Serilog.Extensions.Logging
dotnet add package Serilog.Sinks.Console

# HTTP 客户端
dotnet add package System.Net.Http.Json
dotnet add package Refit

# 验证
dotnet add package FluentValidation

# 文档生成
dotnet add package Swashbuckle.AspNetCore
```

### 示例2：创建本地 NuGet 包

创建 `MyLibrary.csproj`：

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
    <PackageId>MyLibrary</PackageId>
    <Version>1.0.0</Version>
    <Authors>Your Name</Authors>
    <Description>A useful library</Description>
  </PropertyGroup>

</Project>
```

打包发布：

```powershell
dotnet pack -c Release
dotnet nuget push ./bin/Release/MyLibrary.1.0.0.nupkg --source https://api.nuget.org/v3/index.json --api-key YOUR_API_KEY
```

### 示例3：多目标框架

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFrameworks>net8.0;net6.0;netstandard2.0</TargetFrameworks>
  </PropertyGroup>

</Project>
```

---

## NuGet 配置

### nuget.config 文件

项目级配置 `nuget.config`：

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <clear />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" />
    <add key="private" value="https://pkgs.dev.azure.com/yourorg/_packaging/yourfeed/nuget/v3/index.json" />
  </packageSources>

  <packageSourceMapping>
    <packageSource key="nuget.org">
      <package pattern="Newtonsoft.Json" />
    </packageSource>
    <packageSource key="private">
      <package pattern="YourOrg.*" />
    </packageSource>
  </packageSourceMapping>
</configuration>
```

### 信任设置

```xml
<configuration>
  <trustSettings>
    <signature maxUris="10">
      < fingerprints>
        <certificate fingerprint="..." name="nuget.org"/>
      </fingerprints>
    </signature>
  </trustSettings>
</configuration>
```

---

## 常见问题

### 1. 包版本冲突

```
Unable to resolve conflicts between...
```

**解决方案：**

```powershell
# 更新到兼容版本
dotnet list package --outdated
dotnet add package Problematic.Package --version LATEST_COMPATIBLE
```

### 2. 包还原失败

```
Unable to find package...
```

**解决方案：**

```powershell
# 清除缓存
dotnet nuget locals all --clear

# 强制还原
dotnet restore --force
```

### 3. NuGet API 密钥配置

```powershell
# 添加 API 密钥
dotnet nuget add source https://api.nuget.org/v3/index.json -n nuget.org -u yourname -p $YOUR_API_KEY

# 设置 API 密钥（Windows）
nuget setapikey YOUR_API_KEY -Source https://api.nuget.org/v3/index.json
```

### 4. 离线恢复包

```powershell
# 配置本地包源
dotnet nuget add source C:\LocalPackages -n local

# 推送包到本地源
dotnet nuget push .\bin\Release\*.nupkg -n local
```

---

## 最佳实践

### 1. 使用 Central Package Management

集中管理包版本：

```xml
<!-- Directory.Packages.props -->
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include="Newtonsoft.Json" Version="13.0.3" />
  </ItemGroup>
</Project>
```

### 2. 定期更新依赖项

```powershell
# 检查可更新的包
dotnet list package --outdated

# 更新所有包
dotnet restore
```

### 3. 使用可传递依赖项分析

```powershell
# 分析依赖关系
dotnet list package --include-transitive

# 查看依赖图
dotnet restore --verbosity detailed
```

### 4. 锁定关键包的版本

```xml
<PackageReference Include="Critical.Package" Version="[1.0.0, 2.0.0)" />
```

---

## 常用 NuGet 包推荐

### JSON 处理

| 包               | 说明                       |
| ---------------- | -------------------------- |
| Newtonsoft.Json  | 功能强大的 JSON 序列化库   |
| System.Text.Json | 微软官方 JSON 库，性能更好 |

### HTTP 客户端

| 包        | 说明                     |
| --------- | ------------------------ |
| Refit     | 类型安全的 REST 客户端库 |
| RestSharp | 简单的 REST 客户端       |
| Polly     | 弹性和暂时性故障处理     |

### 日志

| 包      | 说明                  |
| ------- | --------------------- |
| Serilog | 结构化日志库          |
| NLog    | 灵活的日志框架        |
| log4net | Apache log4net 移植版 |

### 数据库

| 包                    | 说明         |
| --------------------- | ------------ |
| Entity Framework Core | ORM 框架     |
| Dapper                | 轻量级 ORM   |
| MongoDB.Driver        | MongoDB 驱动 |

### 测试

| 包               | 说明         |
| ---------------- | ------------ |
| xUnit            | 单元测试框架 |
| Moq              | 模拟框架     |
| FluentAssertions | 断言库       |

---

## 总结

| 主题         | 说明                                 |
| ------------ | ------------------------------------ |
| **包安装**   | dotnet add package / Install-Package |
| **包更新**   | dotnet restore / Update-Package      |
| **NuGet 源** | nuget.org / 私有源                   |
| **版本管理** | 精确版本 / 版本范围                  |
| **依赖解析** | 自动处理冲突                         |
| **缓存管理** | global-packages / http-cache         |

---

## 相关资源

- [NuGet 官方文档](https://learn.microsoft.com/zh-cn/nuget/)
- [NuGet 是什么](https://learn.microsoft.com/zh-cn/nuget/what-is-nuget)
- [dotnet CLI 参考](https://learn.microsoft.com/zh-cn/dotnet/core/tools/)
- [NuGet 包发现](https://nuget.org)
