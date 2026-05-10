---
title: Desktop Application的多种打包方案
series: 打包部署
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: claw-desktop-packaging
description: '全面介绍 .NET/Avalonia 桌面应用程序的多种打包方案，包括直接发布、安装包制作和 MSIX 打包。'
tags:
  - .NET
  - Avalonia
  - 桌面应用
  - 打包部署
  - Windows
  - Inno Setup
  - MSIX
draft: false
language: zh-CN
---

## 概述

本文档介绍 Desktop Application 的多种打包方案，帮助开发者选择最适合的发布方式。

### 核心优势

| 特性 | 说明 |
|------|------|
| **多种发布方式** | 支持直接发布、安装包、MSIX 等 |
| **跨平台支持** | Windows x64 优化，支持自包含部署 |
| **灵活配置** | 根据场景选择框架依赖或独立部署 |
| **自动化脚本** | 提供一键发布脚本，简化流程 |

### 快速开始

```powershell
# 使用提供的发布脚本（推荐）
.\publish.ps1
```

发布后的文件位于 `publish\win-x64` 目录。

---

## 发布方案对比

| 方案 | 适用场景 | 工具 | 输出格式 |
|------|---------|------|---------|
| **直接发布** | 快速分发、内部使用 | dotnet publish | 目录/单文件 |
| **安装包** | 商业分发、用户友好 | Inno Setup/WiX | .exe/.msi |
| **MSIX** | 应用商店、企业部署 | Windows SDK | .msix |

---

## 方案1：直接发布

### 基础发布

```bash
# 发布为 Windows x64 自包含应用
dotnet publish src/Claw.Desktop/Claw.Desktop.csproj -c Release -r win-x64 --self-contained true -o ./publish/basic
```

### 单文件发布（推荐）

生成单个可执行文件，包含所有依赖：

```bash
dotnet publish src/Claw.Desktop/Claw.Desktop.csproj `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -p:EnableCompressionInSingleFile=true `
    -o ./publish/singlefile
```

**优点：**

- ✅ 只需分发一个 .exe 文件
- ✅ 自动包含运行时，无需用户安装 .NET
- ✅ 文件压缩，减少分发大小

**缺点：**

- ❌ 文件较大（包含整个运行时）
- ❌ 首次启动解压缩需要几秒钟

### 框架依赖发布

适用于目标机器已安装 .NET 8.0 运行时：

```bash
dotnet publish src/Claw.Desktop/Claw.Desktop.csproj -c Release -r win-x64 --self-contained false -o ./publish/framework-dependent
```

**优点：**

- ✅ 文件较小
- ✅ 启动速度快
- ✅ 可以共享运行时

**缺点：**

- ❌ 需要用户先安装 .NET 8.0 运行时
- ❌ 分发两个文件（exe + dll）

---

## 方案2：创建安装包

### Inno Setup（推荐）

Inno Setup 是免费的安装包制作工具，功能强大且易于使用。

#### 安装步骤

1. 下载地址：https://jrsoftware.org/isinfo.php
2. 安装完成后继续

#### 创建安装脚本

创建 `installer.iss` 文件：

```iss
#define MyAppName "Desktop"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Claw"
#define MyAppURL "https://claw.example.com"
#define MyAppExeName "Claw.Desktop.exe"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=installer
OutputBaseFilename=ClawDesktop-Setup-{#MyAppVersion}
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "chinesesimplified"; MessagesFile: "compiler:Languages\ChineseSimplified.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "publish\win-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
```

#### 编译安装包

```bash
# 使用 Inno Setup 编译
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer.iss
```

或者通过 Inno Setup GUI：

1. 打开 Inno Setup Compiler
2. 打开 `installer.iss` 文件
3. 点击 Compile (Ctrl+F9)

### WiX Toolset

WiX 是微软官方的安装包创建工具，功能强大但配置复杂。

#### 安装命令

```bash
dotnet tool install --global wix
```

#### 创建 Product.wxs

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
    <Product Id="*" 
             Name="Desktop" 
             Language="2052" 
             Version="1.0.0.0" 
             Manufacturer="Claw" 
             UpgradeCode="GUID-HERE">
        
        <Package InstallerVersion="500" 
                 Compressed="yes" 
                 InstallScope="perMachine" />
        
        <MajorUpgrade DowngradeErrorMessage="A newer version is already installed." />
        
        <Feature Id="ProductFeature" Title="Desktop">
            <ComponentGroupRef Id="ProductComponents" />
        </Feature>
        
    </Product>

    <Fragment>
        <Directory Id="TARGETDIR" Name="SourceDir">
            <Directory Id="ProgramFilesFolder">
                <Directory Id="INSTALLFOLDER" Name="Desktop" />
            </Directory>
        </Directory>
    </Fragment>

    <Fragment>
        <ComponentGroup Id="ProductComponents" Directory="INSTALLFOLDER">
            <Component Id="MainExecutable">
                <File Source="publish\win-x64\Claw.Desktop.exe" />
            </Component>
        </ComponentGroup>
    </Fragment>
</Wix>
```

#### 构建 MSI

```bash
wix build Product.wxs -o installer/ClawDesktop.msi
```

### Advanced Installer

Advanced Installer 是收费工具，但提供免费版本：

- 下载地址：https://www.advancedinstaller.com/
- 免费版本支持基本功能

---

## 方案3：MSIX 打包

MSIX 是 Windows 10/11 的现代应用打包格式，可以发布到 Microsoft Store。

### 配置清单文件

创建 `Package.appxmanifest`：

```xml
<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
         xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10">
  
  <Identity Name="Claw.Desktop"
            Publisher="CN=Claw"
            Version="1.0.0.0"
            ProcessorArchitecture="x64"/>
  
  <Properties>
    <DisplayName>贷款经纪人 Claw</DisplayName>
    <PublisherDisplayName>Claw</PublisherDisplayName>
    <Description>贷款经纪人桌面应用程序</Description>
    <Logo>Assets\StoreLogo.png</Logo>
  </Properties>
  
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.17763.0" MaxVersionTested="10.0.22621.0" />
  </Dependencies>
  
  <Resources>
    <Resource Language="zh-CN"/>
  </Resources>
  
  <Applications>
    <Application Id="App"
                 Executable="Claw.Desktop.exe"
                 EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements DisplayName="Desktop"
                          Description="贷款经纪人桌面应用程序"
                          BackgroundColor="transparent"
                          Square150x150Logo="Assets\Square150x150Logo.png"
                          Square44x44Logo="Assets\Square44x44Logo.png">
        <uap:DefaultTile Wide310x150Logo="Assets\Wide310x150Logo.png"/>
      </uap:VisualElements>
    </Application>
  </Applications>
</Package>
```

### 创建 MSIX 包

#### 方法1：使用 Windows SDK 的 makeappx

```bash
# 创建打包布局
makeappx pack /d publish\win-x64 /p ClawDesktop.msix

# 创建证书（仅用于测试）
powershell New-SelfSignedCertificate -Type Custom -Subject "CN=Claw" -KeyUsage DigitalSignature -FriendlyName "Claw Test Certificate" -CertStoreLocation "Cert:\CurrentUser\My"

# 签名
signtool sign /a /fd SHA256 /f certificate.pfx /p password ClawDesktop.msix
```

#### 方法2：使用 Visual Studio

1. 右键项目 → 发布
2. 选择 "MSIX 包"
3. 配置签名证书
4. 点击发布

---

## 常见问题

### Q1: 发布后运行报错缺少 DLL？

**A:** 确保使用 `--self-contained true` 参数，这样会包含所有运行时依赖。

### Q2: 如何减小单文件发布的大小？

**A:** 可以使用 Ready2Run 编译：

```bash
-p:PublishReadyToRun=true
```

### Q3: 如何添加应用图标？

**A:**

1. 准备一个 256x256 的 ICO 文件
2. 放在 `Assets\app.ico`
3. 在 `.csproj` 中添加 `<ApplicationIcon>Assets\app.ico</ApplicationIcon>`
4. 重新发布

### Q4: 如何支持多语言？

**A:**

- Windows 应用支持通过资源文件实现多语言
- 安装包语言已在 Inno Setup 脚本中配置

### Q5: 如何实现自动更新？

**A:**

1. 使用 Squirrel.Windows
2. 配置自动更新服务器
3. 在应用中集成更新检查逻辑

### Q6: 发布的应用被杀毒软件误报？

**A:**

- 使用代码签名证书签名
- 向杀毒软件厂商提交白名单申请
- 自签名证书会被误报，仅限测试使用

---

## 方案选择建议

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| **快速分发** | 单文件发布 | 简单直接，一个 exe 就够了 |
| **商业产品** | Inno Setup | 免费、功能完善、用户友好 |
| **企业部署** | MSI 包 (WiX) | 支持企业级管理工具 |
| **应用商店** | MSIX | Microsoft Store 必需格式 |

---

## 下一步

### 测试发布

```bash
.\publish.ps1
.\publish\win-x64\Claw.Desktop.exe
```

### 创建安装包

```bash
# 使用 Inno Setup
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer.iss
```

### 签名发布

- 购买代码签名证书
- 使用 signtool 签名

---

## 相关资源

- [Avalonia 发布指南](https://docs.avaloniaui.net/docs/getting-started/publishing)
- [Inno Setup 文档](https://jrsoftware.org/ishelp/)
- [.NET 发布文档](https://docs.microsoft.com/dotnet/core/deploying/)
