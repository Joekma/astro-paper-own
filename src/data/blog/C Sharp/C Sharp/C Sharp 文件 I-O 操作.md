---
title: C# 文件 I/O 操作
author: Joekma
pubDatetime: 2026-05-07T00:00:00.000+08:00
modDatetime: 2026-05-07T00:00:00.000+08:00
slug: csharp-file-io
description: '深入学习 C# 文件操作，掌握文件读写、目录管理、路径处理、Stream 编程等核心技能。'
tags:
  - C#
  - 文件操作
  - File
  - Stream
  - Directory
  - Path
  - I/O
draft: false
language: zh-CN
---

## 概述

文件 I/O 是应用程序与文件系统交互的基础。C# 提供了丰富的 API 来读写文件、创建目录、处理路径等。本文将详细介绍这些功能。

### 核心命名空间

| 命名空间 | 说明 |
|----------|------|
| `System.IO` | 核心 I/O 类型 |
| `System.IO.File` | 文件静态方法 |
| `System.IO.Directory` | 目录静态方法 |
| `System.IO.Path` | 路径操作工具 |
| `System.IO.FileStream` | 文件流操作 |

---

## 文件读写

### 一次性读取

```csharp
// 读取所有文本
string content = File.ReadAllText("example.txt");

// 读取所有行
string[] lines = File.ReadAllLines("example.txt");

// 读取为字节数组
byte[] data = File.ReadAllBytes("image.png");
```

### 一次性写入

```csharp
// 写入文本
string text = "Hello, World!";
File.WriteAllText("output.txt", text);

// 写入多行
string[] lines = { "Line 1", "Line 2", "Line 3" };
File.WriteAllLines("output.txt", lines);

// 写入字节
byte[] data = new byte[] { 0x01, 0x02, 0x03 };
File.WriteAllBytes("data.bin", data);
```

### 追加内容

```csharp
// 追加文本
File.AppendAllText("log.txt", "New log entry\n");

// 追加多行
string[] entries = { "Entry 1", "Entry 2" };
File.AppendAllLines("log.txt", entries);
```

---

## Stream 流操作

### FileStream 基础

```csharp
using var stream = new FileStream("data.bin", FileMode.Create, FileAccess.Write);

// 写入字节
byte[] buffer = new byte[] { 1, 2, 3, 4, 5 };
stream.Write(buffer, 0, buffer.Length);

// 刷新缓冲区
stream.Flush();
```

### 读取文件

```csharp
using var stream = new FileStream("data.bin", FileMode.Open, FileAccess.Read);

byte[] buffer = new byte[1024];
int bytesRead = stream.Read(buffer, 0, buffer.Length);

string content = System.Text.Encoding.UTF8.GetString(buffer, 0, bytesRead);
Console.WriteLine($"读取了 {bytesRead} 字节");
```

### 使用 using 语句

```csharp
// 自动释放资源
using (var writer = new StreamWriter("output.txt"))
{
    writer.WriteLine("Hello");
    writer.WriteLine("World");
}  // writer.Dispose() 自动调用
```

---

## StreamReader 和 StreamWriter

### 文本读写

```csharp
// 读取文本
using var reader = new StreamReader("input.txt");
while (!reader.EndOfStream)
{
    string? line = reader.ReadLine();
    Console.WriteLine(line);
}
```

```csharp
// 写入文本
using var writer = new StreamWriter("output.txt");
writer.WriteLine("第一行");
writer.WriteLine("第二行");
```

### 指定编码

```csharp
// 使用特定编码读取
using var reader = new StreamReader("file.txt", System.Text.Encoding.UTF8);

// 使用特定编码写入
using var writer = new StreamWriter("output.txt", false, System.Text.Encoding.UTF8);
```

---

## 二进制读写

### BinaryReader 和 BinaryWriter

```csharp
// 写入二进制数据
using (var writer = new BinaryWriter(File.OpenWrite("data.bin")))
{
    writer.Write(42);           // int
    writer.Write(3.14);         // double
    writer.Write("Hello");     // string
    writer.Write(true);        // bool
}
```

```csharp
// 读取二进制数据
using (var reader = new BinaryReader(File.OpenRead("data.bin")))
{
    int number = reader.ReadInt32();      // 42
    double pi = reader.ReadDouble();      // 3.14
    string text = reader.ReadString();     // "Hello"
    bool flag = reader.ReadBoolean();      // true
}
```

---

## 文件操作

### 检查文件是否存在

```csharp
if (File.Exists("example.txt"))
{
    Console.WriteLine("文件存在");
    var info = new FileInfo("example.txt");
    Console.WriteLine($"大小: {info.Length} 字节");
    Console.WriteLine($"创建时间: {info.CreationTime}");
    Console.WriteLine($"最后修改: {info.LastWriteTime}");
}
```

### 复制、移动、删除

```csharp
// 复制文件
File.Copy("source.txt", "destination.txt");
File.Copy("source.txt", "backup.txt", overwrite: true);

// 移动文件
File.Move("old.txt", "new.txt");

// 删除文件
File.Delete("temp.txt");
```

### FileInfo 对象

```csharp
var file = new FileInfo("document.pdf");

Console.WriteLine($"名称: {file.Name}");
Console.WriteLine($"目录: {file.DirectoryName}");
Console.WriteLine($"扩展名: {file.Extension}");
Console.WriteLine($"大小: {file.Length / 1024} KB");
Console.WriteLine($"只读: {file.IsReadOnly}");
```

---

## 目录操作

### Directory 静态方法

```csharp
// 检查目录是否存在
if (Directory.Exists("logs"))
{
    Console.WriteLine("目录存在");
}

// 创建目录
Directory.CreateDirectory("data/reports");

// 删除目录（必须是空的）
Directory.Delete("temp");

// 删除目录及内容
Directory.Delete("temp", recursive: true);
```

### 列举目录内容

```csharp
// 获取子目录
string[] subdirs = Directory.GetDirectories("C:\\Projects");

// 获取文件
string[] files = Directory.GetFiles("C:\\Projects", "*.cs");

// 获取所有文件（包括子目录）
string[] allFiles = Directory.GetFiles("C:\\Projects", "*.cs", SearchOption.AllDirectories);
```

### 递归遍历

```csharp
void PrintDirectory(string path, int indent = 0)
{
    foreach (var dir in Directory.GetDirectories(path))
    {
        Console.WriteLine($"{new string(' ', indent)}📁 {Path.GetFileName(dir)}");
        PrintDirectory(dir, indent + 2);
    }
    
    foreach (var file in Directory.GetFiles(path))
    {
        Console.WriteLine($"{new string(' ', indent)}📄 {Path.GetFileName(file)}");
    }
}

PrintDirectory("C:\\Projects\\MyApp");
```

---

## 路径处理

### Path 静态方法

```csharp
string fullPath = "C:\\Projects\\App\\bin\\debug\\config.json";

// 获取文件名
Path.GetFileName(fullPath);        // "config.json"

// 获取不带扩展名的文件名
Path.GetFileNameWithoutExtension(fullPath);  // "config"

// 获取扩展名
Path.GetExtension(fullPath);       // ".json"

// 获取目录
Path.GetDirectoryName(fullPath);   // "C:\\Projects\\App\\bin\\debug"

// 获取根目录
Path.GetPathRoot(fullPath);        // "C:\\"
```

### 组合路径

```csharp
// 组合路径（自动处理分隔符）
string path = Path.Combine("C:\\Projects", "App", "bin", "config.json");
// "C:\Projects\App\bin\config.json"

// 连接相对路径
string fullPath = Path.Combine(Directory.GetCurrentDirectory(), "data", "file.txt");
```

### 临时文件

```csharp
// 创建临时文件
string tempFile = Path.GetTempFileName();
File.WriteAllText(tempFile, "临时内容");

// 获取临时目录路径
string tempPath = Path.GetTempPath();

// 生成随机文件名
string randomName = Path.GetRandomFileName();
```

---

## 异步文件操作

### 异步读写文本

```csharp
async Task ReadFileAsync(string path)
{
    string content = await File.ReadAllTextAsync(path);
    Console.WriteLine(content);
}

async Task WriteFileAsync(string path, string content)
{
    await File.WriteAllTextAsync(path, content);
}
```

### 异步 Stream 操作

```csharp
async Task ProcessLargeFileAsync(string path)
{
    using var stream = new FileStream(path, FileMode.Open, FileAccess.Read);
    byte[] buffer = new byte[1024];
    
    int bytesRead;
    while ((bytesRead = await stream.ReadAsync(buffer)) > 0)
    {
        ProcessBuffer(buffer, bytesRead);
    }
}
```

### 取消操作

```csharp
async Task ReadWithCancellationAsync(string path, CancellationToken token)
{
    using var stream = new FileStream(path, FileMode.Open);
    byte[] buffer = new byte[1024];
    
    int bytesRead = await stream.ReadAsync(buffer, token);
}
```

---

## 监视文件变化

### FileSystemWatcher

```csharp
void WatchDirectory(string path)
{
    using var watcher = new FileSystemWatcher(path);
    
    watcher.NotifyFilter = NotifyFilters.LastWrite 
                         | NotifyFilters.FileName 
                         | NotifyFilters.DirectoryName;
    
    watcher.Filter = "*.txt";
    
    watcher.Changed += (s, e) => 
    {
        Console.WriteLine($"文件已更改: {e.FullPath}");
    };
    
    watcher.Created += (s, e) => 
    {
        Console.WriteLine($"新文件: {e.FullPath}");
    };
    
    watcher.Deleted += (s, e) => 
    {
        Console.WriteLine($"已删除: {e.FullPath}");
    };
    
    watcher.EnableRaisingEvents = true;
    
    Console.WriteLine("监控中... 按任意键退出");
    Console.ReadKey();
}
```

---

## 大文件处理

### 分块读写

```csharp
async Task SplitFileAsync(string sourcePath, string destFolder, int chunkSizeMB = 10)
{
    var fileInfo = new FileInfo(sourcePath);
    long totalBytes = fileInfo.Length;
    int chunkSize = chunkSizeMB * 1024 * 1024;
    int chunkIndex = 0;
    
    using var sourceStream = new FileStream(sourcePath, FileMode.Open, FileAccess.Read);
    
    byte[] buffer = new byte[chunkSize];
    int bytesRead;
    
    while ((bytesRead = await sourceStream.ReadAsync(buffer)) > 0)
    {
        string chunkPath = Path.Combine(destFolder, $"chunk_{chunkIndex:D4}.bin");
        await File.WriteAllBytesAsync(chunkPath, buffer.Take(bytesRead).ToArray());
        chunkIndex++;
        Console.WriteLine($"已处理 {(double)sourceStream.Position / totalBytes * 100:F2}%");
    }
}
```

### 内存映射文件

```csharp
using var memoryMapped = MemoryMappedFile.CreateFromFile("largefile.bin", FileMode.Open);

using var viewStream = memoryMapped.CreateViewStream();
using var reader = new BinaryReader(viewStream);

long fileSize = memoryMapped.CreateViewStream().Length;
```

---

## 压缩文件

### 使用 GZipStream

```csharp
void CompressFile(string sourcePath, string destPath)
{
    using var sourceStream = new FileStream(sourcePath, FileMode.Open);
    using var destStream = new FileStream(destPath, FileMode.Create);
    using var gzipStream = new GZipStream(destStream, CompressionMode.Compress);
    
    sourceStream.CopyTo(gzipStream);
}

void DecompressFile(string sourcePath, string destPath)
{
    using var sourceStream = new FileStream(sourcePath, FileMode.Open);
    using var gzipStream = new GZipStream(sourceStream, CompressionMode.Decompress);
    using var destStream = new FileStream(destPath, FileMode.Create);
    
    gzipStream.CopyTo(destStream);
}
```

---

## 错误处理

```csharp
try
{
    string content = File.ReadAllText("data.txt");
}
catch (FileNotFoundException)
{
    Console.WriteLine("文件不存在");
}
catch (UnauthorizedAccessException)
{
    Console.WriteLine("没有访问权限");
}
catch (IOException ex)
{
    Console.WriteLine($"IO 错误: {ex.Message}");
}
finally
{
    Console.WriteLine("文件操作结束");
}
```

---

## 最佳实践

### 应该做的事情

| 实践 | 说明 |
|------|------|
| **使用 using** | 确保资源正确释放 |
| **异常处理** | 处理文件操作可能的各种异常 |
| **异步操作** | 大文件使用异步避免阻塞 |
| **路径规范化** | 使用 Path.Combine 避免分隔符问题 |
| **检查存在性** | 操作前检查文件/目录是否存在 |

### 不应该做的事情

| 反模式 | 说明 |
|--------|------|
| **硬编码路径** | 使用相对路径或配置路径 |
| **忘记 Dispose** | 可能导致文件锁定 |
| **大文件读入内存** | 使用 Stream 分块处理 |
| **忽略异常** | 至少记录日志 |
| **并发写入同一文件** | 使用锁或队列 |

---

## 总结

文件 I/O 是 C# 开发中的重要技能：

1. **File 类** - 简单的静态方法用于快速操作
2. **Stream** - 底层流控制，适合大文件
3. **StreamReader/Writer** - 文本文件读写
4. **BinaryReader/Writer** - 二进制数据读写
5. **Path** - 路径操作和规范化
6. **Directory** - 目录管理
7. **FileSystemWatcher** - 监控文件变化
8. **异步操作** - 提高大文件处理的性能

掌握这些技巧能让你高效地处理各种文件操作需求。