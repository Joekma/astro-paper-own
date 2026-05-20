---
title: Avalonia Markdown ImageLoader 入门指南
author: Joekma
pubDatetime: 2026-05-20T00:00:00.000+08:00
modDatetime: 2026-05-20T00:00:00.000+08:00
slug: avalonia-markdown-imageloader
description: "面向初学者的 Avalonia Markdown ImageLoader 快速上手指南，从安装 Avalonia.Controls.Markdown、配置 Pro license、引入默认主题，到加载 PNG/JPG、SVG、鉴权图片和缓存图片。"
tags:
  - Avalonia
  - Avalonia Pro
  - Markdown
  - ImageLoader
  - MarkdownImage
  - 控件
draft: false
series: Avalonia
seriesOrder: 20
language: zh-CN
---

## 概述

Avalonia 12 的 Welcome 文档主要帮助你完成安装、创建项目和理解框架入口；Markdown 控件文档则直接进入 `Avalonia.Controls.Markdown` 的专项能力。对于刚上手的开发者，真正容易卡住的地方通常是：Markdown 文字能显示，图片却不显示。

原因很简单：`Markdown` 控件会把 Markdown 文本解析成文档元素，图片会变成动态创建的 `MarkdownImage`。未设置自定义 `ImageLoader` 时，图片不会自动加载；官方基类 `MarkdownImageLoader` 支持 `http://`、`https://` 和 `file://`，但仍需要你把 loader 绑定到 `MarkdownImage`。如果 Markdown 里写的是 SVG、应用资源、相对路径或需要鉴权的图片，就要在 loader 里扩展对应逻辑。本文把完整路径串起来：

```text
显示 Markdown -> 显示图片 -> 自定义 ImageLoader -> SVG / 鉴权 / 缓存
```

> 注意：`Avalonia.Controls.Markdown` 和 `ImageLoader` 属于 Avalonia Pro 或更高版本能力。普通 Avalonia 开源应用不需要 Pro license，但使用这个 Markdown 控件包时需要按官方 Pro 安装文档配置 license。

---

## 前置条件

| 项目             | 要求或说明                                                                 |
| ---------------- | -------------------------------------------------------------------------- |
| Avalonia 项目    | 推荐使用 .NET 8 或更高版本                                                 |
| NuGet 包         | `Avalonia.Controls.Markdown`                                               |
| License          | 在可执行项目 `.csproj` 中配置 `AvaloniaUILicenseKey`                       |
| 主题资源         | 在 `App.axaml` 中引入 Markdown 默认主题                                    |
| 图片加载器       | 继承 `MarkdownImageLoader`，重写 `LoadImageAsync` 并绑定到 `MarkdownImage` |
| SVG 支持（可选） | 额外安装 `Avalonia.Svg.Skia`                                               |

学习顺序建议如下：

| 阶段 | 你要完成的事                   | 读完后应能做到             |
| ---- | ------------------------------ | -------------------------- |
| 1    | 显示普通 Markdown              | 标题、列表、链接能正常渲染 |
| 2    | 给 `MarkdownImage` 设置 loader | PNG/JPG 能显示             |
| 3    | 理解动态文档元素               | 知道为什么用样式选择器     |
| 4    | 扩展 `LoadImageAsync`          | 支持 SVG、鉴权、缓存       |
| 5    | 排错                           | 能定位图片不显示的原因     |

---

## 5 分钟快速开始

### 1. 安装 Markdown 包

在你的 Avalonia 项目目录中运行：

```powershell
dotnet add package Avalonia.Controls.Markdown
```

然后在可执行项目的 `.csproj` 中添加 license。不要把示例值原样提交到公开仓库，真实项目可以用环境变量或共享 props 文件管理。

```xml
<ItemGroup>
  <AvaloniaUILicenseKey Include="YOUR_LICENSE_KEY" />
</ItemGroup>
```

安装后先运行一次构建，确认包和 license 都能被项目识别：

```powershell
dotnet build
```

### 2. 引入 Markdown 默认主题

在 `App.axaml` 中引入默认主题，否则控件模板和样式资源不完整。

```xml
<Application xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:services="clr-namespace:MyApp.Services"
             x:Class="MyApp.App">

  <Application.Resources>
    <services:BasicMarkdownImageLoader x:Key="MarkdownImageLoader" />
  </Application.Resources>

  <Application.Styles>
    <FluentTheme />
    <StyleInclude Source="avares://Avalonia.Controls.Markdown/Themes/Default.axaml" />

    <Style Selector="MarkdownImage">
      <Setter Property="ImageLoader" Value="{StaticResource MarkdownImageLoader}" />
    </Style>
  </Application.Styles>
</Application>
```

### 3. 创建最小 PNG/JPG 图片加载器

如果你只需要加载普通 `http://`、`https://`、`file://` 的 PNG/JPG 图片，可以先写一个小 loader。它把远程或本地文件读成流，再返回 Avalonia 的 `Bitmap`。

```csharp
namespace MyApp.Services;

using Avalonia.Controls;
using Avalonia.Media;
using Avalonia.Media.Imaging;
using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;

public sealed class BasicMarkdownImageLoader : MarkdownImageLoader
{
    private static readonly HttpClient Client = new();

    public override async Task<IImage?> LoadImageAsync(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return null;
        }

        if (uri.Scheme is "http" or "https")
        {
            using var response = await Client.GetAsync(uri);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var memoryStream = new MemoryStream();
            await using var responseStream = await response.Content.ReadAsStreamAsync();
            await responseStream.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            return new Bitmap(memoryStream);
        }

        if (uri.Scheme == "file" && File.Exists(uri.LocalPath))
        {
            var memoryStream = new MemoryStream();
            await using var fileStream = File.OpenRead(uri.LocalPath);
            await fileStream.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            return new Bitmap(memoryStream);
        }

        return await base.LoadImageAsync(url);
    }
}
```

### 4. 放置 Markdown 控件

在窗口或用户控件中放一个 `Markdown`。下面的例子使用 GitHub 上的 Avalonia 组织头像作为远程 PNG 图片。

```xml
<Window xmlns="https://github.com/avaloniaui"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        x:Class="MyApp.MainWindow"
        Width="800"
        Height="600"
        Title="Markdown ImageLoader Demo">

  <ScrollViewer>
    <Markdown Text="## Hello Markdown&#x0a;&#x0a;![Avalonia](https://avatars.githubusercontent.com/u/14075148?s=200&amp;v=4)" />
  </ScrollViewer>
</Window>
```

### 5. 运行并检查

```powershell
dotnet run
```

如果标题能显示但图片不显示，优先检查三件事：

- 是否安装了 `Avalonia.Controls.Markdown`
- 是否在 `App.axaml` 引入了 `Default.axaml`
- 是否通过 `Style Selector="MarkdownImage"` 设置了 `ImageLoader`

---

## 为什么要给 MarkdownImage 写样式

你在 XAML 中写的是一个 `Markdown` 控件，但 Markdown 里的图片并不是你手动声明的 `<Image />`。运行时大致经历这条链路：

```text
Markdown.Text
  -> Markdig 解析 Markdown
  -> 生成文档快照
  -> 创建 FlowDocument 文档元素
  -> ![](...) 变成 MarkdownImage
  -> MarkdownImage.ImageSource 保存图片 URL
  -> MarkdownImage.ImageLoader 调用 LoadImageAsync
  -> 返回 IImage?，通常是 Bitmap 或 SvgImage
```

`MarkdownImage` 是动态创建的文档元素，无法提前用 `x:Name` 找到它。Avalonia 的样式选择器正好适合这类场景：只要写 `Style Selector="MarkdownImage"`，后续所有动态创建出来的 Markdown 图片元素都会拿到同一个 loader。

如果你只给 `Markdown` 控件设置普通属性，图片节点不会自动知道该如何把 URL 转成图像对象。

---

## 关键类型速查

| 类型或成员                          | 作用                                                    |
| ----------------------------------- | ------------------------------------------------------- |
| `Markdown`                          | 渲染 Markdown 文本的控件                                |
| `MarkdownImage`                     | Markdown 中 `![](...)` 生成的图片文档元素               |
| `MarkdownImageLoader`               | 图片加载器基类，负责把图片地址解析成 Avalonia 图像      |
| `MarkdownImage.ImageLoaderProperty` | C# 中通过样式 setter 绑定 loader 时使用的 Avalonia 属性 |
| `LoadImageAsync(string url)`        | 自定义图片加载逻辑的入口                                |
| `IImage?`                           | 加载成功返回图像，失败返回 `null`                       |
| `Bitmap`                            | PNG、JPG 等位图格式常用返回类型                         |

用 XAML 设置时通常写：

```xml
<Style Selector="MarkdownImage">
  <Setter Property="ImageLoader" Value="{StaticResource MarkdownImageLoader}" />
</Style>
```

用 C# 设置时可以写：

```csharp
using Avalonia.Controls;
using Avalonia.Styling;

var loader = new BasicMarkdownImageLoader();
var style = new Style(x => x.OfType<MarkdownImage>());
style.Setters.Add(new Setter(MarkdownImage.ImageLoaderProperty, loader));
myMarkdownControl.Styles.Add(style);
```

---

## 常见需求怎么选

| 需求                     | 推荐做法                                                    |
| ------------------------ | ----------------------------------------------------------- |
| 普通远程 PNG/JPG         | 自定义 loader，用 `HttpClient` 下载后返回 `Bitmap`          |
| 本地文件图片             | 使用 `file://` 绝对路径，或在 loader 中解析路径             |
| 应用内资源图片           | 在 loader 中识别 `avares://`，用 Avalonia 资源加载 API 读取 |
| SVG 图片                 | 安装 `Avalonia.Svg.Skia`，在 loader 中识别 SVG 并返回图像   |
| 需要登录态或请求头的图片 | 在自定义 loader 中使用 `HttpClient` 设置 Authorization      |
| 重复出现的大量图片       | 在 loader 中加缓存，避免重复下载和重复解码                  |
| 加载失败时不想崩溃       | 返回 `null`，并在日志中记录 URL 与异常                      |

---

## 支持 SVG 图片

SVG 不是普通位图，先安装 SVG 包：

```powershell
dotnet add package Avalonia.Svg.Skia
```

然后写一个能识别 SVG 内容的 loader。下面示例同时保留 PNG/JPG 加载能力：如果不是 SVG，就交给基类处理。

```csharp
namespace MyApp.Services;

using Avalonia.Controls;
using Avalonia.Media;
using Avalonia.Media.Imaging;
using Avalonia.Svg.Skia;
using System;
using System.IO;
using System.Net.Http;
using System.Text;

public sealed class SvgMarkdownImageLoader : MarkdownImageLoader
{
    private static readonly HttpClient Client = new();

    public override async Task<IImage?> LoadImageAsync(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return null;
        }

        await using var stream = await OpenStreamAsync(uri);
        if (stream is null)
        {
            return null;
        }

        if (IsSvg(stream))
        {
            return new SvgImage
            {
                Source = SvgSource.LoadFromStream(stream),
            };
        }

        return new Bitmap(stream);
    }

    private static async Task<Stream?> OpenStreamAsync(Uri uri)
    {
        if (uri.Scheme is "http" or "https")
        {
            using var response = await Client.GetAsync(uri);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var memoryStream = new MemoryStream();
            await using var responseStream = await response.Content.ReadAsStreamAsync();
            await responseStream.CopyToAsync(memoryStream);
            memoryStream.Position = 0;
            return memoryStream;
        }

        if (uri.Scheme == "file" && File.Exists(uri.LocalPath))
        {
            return File.OpenRead(uri.LocalPath);
        }

        return null;
    }

    private static bool IsSvg(Stream stream)
    {
        if (!stream.CanSeek || stream.Length == 0)
        {
            return false;
        }

        Span<byte> buffer = stackalloc byte[(int)Math.Min(512, stream.Length)];
        var read = stream.Read(buffer);
        stream.Position = 0;

        var header = Encoding.UTF8.GetString(buffer[..read]);
        return header.Contains("<svg", StringComparison.OrdinalIgnoreCase);
    }
}
```

把 `App.axaml` 里的资源替换成：

```xml
<services:SvgMarkdownImageLoader x:Key="MarkdownImageLoader" />
```

然后 Markdown 中就可以写：

```markdown
![Logo](https://example.com/logo.svg)
```

---

## 鉴权图片与缓存图片

私有图片一般需要请求头。思路是重写 `LoadImageAsync`，在下载时使用自己的 `HttpClient`。

```csharp
namespace MyApp.Services;

using Avalonia.Controls;
using Avalonia.Media;
using Avalonia.Media.Imaging;
using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;

public sealed class AuthenticatedMarkdownImageLoader : MarkdownImageLoader
{
    private readonly HttpClient _client = new();

    public string? BearerToken { get; set; }

    public override async Task<IImage?> LoadImageAsync(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return null;
        }

        if (uri.Scheme is not ("http" or "https"))
        {
            return await base.LoadImageAsync(url);
        }

        using var request = new HttpRequestMessage(HttpMethod.Get, uri);
        if (!string.IsNullOrWhiteSpace(BearerToken))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", BearerToken);
        }

        using var response = await _client.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        var memoryStream = new MemoryStream();
        await using var responseStream = await response.Content.ReadAsStreamAsync();
        await responseStream.CopyToAsync(memoryStream);
        memoryStream.Position = 0;

        return new Bitmap(memoryStream);
    }
}
```

如果同一张图会反复出现，可以加一个简单缓存。缓存要注意内存占用，不建议无限增长。

```csharp
private readonly Dictionary<string, IImage> _cache = new();

public override async Task<IImage?> LoadImageAsync(string url)
{
    if (_cache.TryGetValue(url, out var cached))
    {
        return cached;
    }

    var image = await base.LoadImageAsync(url);
    if (image is not null)
    {
        _cache[url] = image;
    }

    return image;
}
```

实际生产项目可以进一步加入容量限制、过期时间、取消令牌和失败重试。

---

## 本地资源图片

Markdown 文本常见写法是相对路径：

```markdown
![avatar](images/avatar.png)
```

但 loader 收到的只是字符串 `images/avatar.png`。如果你需要支持这种写法，可以约定一个基础目录：

```csharp
public sealed class LocalFolderMarkdownImageLoader : MarkdownImageLoader
{
    public string BaseDirectory { get; init; } = AppContext.BaseDirectory;

    public override Task<IImage?> LoadImageAsync(string url)
    {
        if (Uri.TryCreate(url, UriKind.Absolute, out _))
        {
            return base.LoadImageAsync(url);
        }

        var fullPath = Path.GetFullPath(Path.Combine(BaseDirectory, url));
        if (!File.Exists(fullPath))
        {
            return Task.FromResult<IImage?>(null);
        }

        return Task.FromResult<IImage?>(new Bitmap(fullPath));
    }
}
```

如果图片是应用资源，也可以约定 `avares://`，然后在 loader 中用 Avalonia 的资源加载 API 读取流，再返回 `Bitmap`。核心原则不变：把 Markdown 里的 URL 字符串转换成一个 `IImage?`。

---

## 常见问题排查

| 现象                       | 优先检查项                                      | 修复方向                                   |
| -------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Markdown 控件完全不显示    | 是否安装 `Avalonia.Controls.Markdown`           | 安装包并确认 license 配置                  |
| 构建出现 license 警告      | `.csproj` 中是否有 `AvaloniaUILicenseKey`       | 把 license 放到可执行项目或共享 props 文件 |
| 文字显示，远程图片不显示   | 是否给 `MarkdownImage` 设置自定义 `ImageLoader` | 添加 `Style Selector="MarkdownImage"`      |
| 控件样式很奇怪             | 是否引入 `Default.axaml`                        | 在 `Application.Styles` 加 `StyleInclude`  |
| SVG 不显示                 | 是否安装 `Avalonia.Svg.Skia`                    | 安装包并使用 SVG-aware loader              |
| `file://` 图片不显示       | 路径是否是绝对路径，文件是否存在                | 用 `File.Exists(uri.LocalPath)` 验证       |
| 相对路径图片不显示         | loader 是否处理相对路径                         | 约定 `BaseDirectory` 或转换为 `file://`    |
| 私有图片 401/403           | 请求头或 token 是否传入                         | 在自定义 loader 中设置 Authorization       |
| 有时显示、有时不显示       | 网络请求是否失败，是否吞掉异常                  | 记录 URL、状态码和异常                     |
| 返回 `null` 后没有错误弹窗 | `null` 表示加载失败，不会生成有效图像           | 加日志或显示占位图策略                     |

---

## 最终检查清单

- 已安装 `Avalonia.Controls.Markdown`
- 已在可执行 `.csproj` 配置 `AvaloniaUILicenseKey`
- 已在 `App.axaml` 引入 Markdown `Default.axaml`
- 已创建 `MarkdownImageLoader` 子类
- 已用 `Style Selector="MarkdownImage"` 设置 `ImageLoader`
- 普通 PNG/JPG URL 能显示
- 如果需要 SVG，已安装 `Avalonia.Svg.Skia` 并返回 `SvgImage`
- 如果需要私有图片，已处理请求头和失败状态码
- 如果需要本地或相对路径，已明确路径解析规则
- loader 失败时返回 `null`，同时记录足够的排错信息

---

## 相关资源

- [Avalonia 12 Welcome 文档](https://docs.avaloniaui.net/docs)
- [Avalonia Controls 总览](https://docs.avaloniaui.net/controls)
- [Markdown control](https://docs.avaloniaui.net/controls/data-display/text-display/markdown)
- [ImageLoader 官方文档](https://docs.avaloniaui.net/controls/data-display/text-display/imageloader)
- [Installing Avalonia Pro](https://docs.avaloniaui.net/tools/installing-avalonia-pro)
