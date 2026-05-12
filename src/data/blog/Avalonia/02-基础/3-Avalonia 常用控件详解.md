---
title: Avalonia 常用控件详解
author: Joekma
pubDatetime: 2026-05-06T00:00:00.000+08:00
modDatetime: 2026-05-06T00:00:00.000+08:00
slug: avalonia-common-controls
description: "深入学习 Avalonia 常用控件，包括 Button、TextBox、TextBlock、ListBox、ComboBox、CheckBox、RadioButton 等基础控件的使用方法和属性。"
tags:
  - Avalonia
  - 控件
  - Button
  - TextBox
  - TextBlock
  - ListBox
  - ComboBox
  - CheckBox
  - RadioButton
  - ScrollViewer
draft: false
series: Avalonia
language: zh-CN
---

## 概述

Avalonia 提供了丰富的内置控件，用于构建用户界面。本文介绍最常用的基础控件。

### 控件分类

| 类别       | 控件                              |
| ---------- | --------------------------------- |
| **按钮**   | Button、ToggleButton、RadioButton |
| **文本**   | TextBlock、TextBox、PasswordBox   |
| **选择**   | CheckBox、ComboBox、ListBox       |
| **容器**   | Border、ScrollViewer、Expander    |
| **对话框** | Window、WindowDialog              |

---

## Button（按钮）

### 基本属性

| 属性               | 类型      | 说明                            |
| ------------------ | --------- | ------------------------------- |
| `Content`          | object    | 按钮文本/内容                   |
| `Command`          | ICommand  | 绑定的命令                      |
| `CommandParameter` | object    | 命令参数                        |
| `IsEnabled`        | bool      | 是否启用                        |
| `ClickMode`        | ClickMode | 点击模式（Press/Release/Hover） |

### 基本使用

```xml
<Button Content="点击我" />
```

### 带命令绑定

```xml
<Button Content="保存"
        Command="{Binding SaveCommand}" />
```

### 带图标

```xml
<Button>
    <StackPanel Orientation="Horizontal" Spacing="5">
        <Image Source="/Assets/save.png" Width="16" Height="16" />
        <TextBlock Text="保存" />
    </StackPanel>
</Button>
```

### 样式变体

```xml
<!-- 主要按钮 -->
<Button Classes="primary" Content="确定" />

<!-- 成功按钮 -->
<Button Classes="success" Content="成功" />

<!-- 危险按钮 -->
<Button Classes="danger" Content="删除" />
```

---

## ToggleButton 和 CheckBox

### ToggleButton

```xml
<ToggleButton Content="开关" IsChecked="{Binding IsEnabled}" />
```

### CheckBox

```xml
<CheckBox Content="记住我" IsChecked="{Binding RememberMe}" />
```

### 三态 CheckBox

```xml
<CheckBox Content="全选"
          IsThreeState="True"
          IsChecked="{Binding SelectAll}" />
```

---

## RadioButton

### 分组使用

```xml
<StackPanel>
    <RadioButton Content="选项 A" GroupName="Options" IsChecked="True" />
    <RadioButton Content="选项 B" GroupName="Options" />
    <RadioButton Content="选项 C" GroupName="Options" />
</StackPanel>
```

### 绑定到枚举

```xml
<StackPanel>
    <RadioButton Content="低"
                 GroupName="Priority"
                 IsChecked="{Binding Priority, Converter={StaticResource EnumBooleanConverter}, ConverterParameter=Low}" />
    <RadioButton Content="中"
                 GroupName="Priority"
                 IsChecked="{Binding Priority, Converter={StaticResource EnumBooleanConverter}, ConverterParameter=Medium}" />
    <RadioButton Content="高"
                 GroupName="Priority"
                 IsChecked="{Binding Priority, Converter={StaticResource EnumBooleanConverter}, ConverterParameter=High}" />
</StackPanel>
```

---

## TextBlock（文本块）

### 基本属性

| 属性           | 类型         | 说明                                   |
| -------------- | ------------ | -------------------------------------- |
| `Text`         | string       | 显示文本                               |
| `FontSize`     | double       | 字体大小                               |
| `FontWeight`   | FontWeight   | 字重（Bold/Normal）                    |
| `Foreground`   | IBrush       | 前景色                                 |
| `TextWrapping` | TextWrapping | 文本换行（NoWrap/Wrap/WrapWholeWords） |

### 使用示例

```xml
<TextBlock Text="普通文本" />

<TextBlock Text="大号加粗文本" FontSize="24" FontWeight="Bold" />

<TextBlock Text="换行文本" TextWrapping="Wrap" />
```

### 文本装饰

```xml
<TextBlock Text="带下划线" TextDecorations="Underline" />
<TextBlock Text="删除线" TextDecorations="Strikethrough" />
```

---

## TextBox（文本框）

### 基本属性

| 属性            | 类型   | 说明     |
| --------------- | ------ | -------- |
| `Text`          | string | 文本内容 |
| `Watermark`     | string | 占位符   |
| `MaxLength`     | int    | 最大长度 |
| `AcceptsReturn` | bool   | 接受回车 |
| `PasswordChar`  | char   | 密码字符 |

### 基本使用

```xml
<TextBox Text="{Binding UserName, Mode=TwoWay}" Watermark="请输入用户名" />
```

### 多行文本框

```xml
<TextBox Text="{Binding Description}"
         Watermark="请输入描述"
         AcceptsReturn="True"
         TextWrapping="Wrap"
         Height="100" />
```

### 密码框

```xml
<PasswordBox PasswordChar="*"
             Watermark="请输入密码"
             RevealPasswordButtonVisible="True" />
```

---

## ComboBox（下拉框）

### 基本属性

| 属性            | 类型        | 说明     |
| --------------- | ----------- | -------- |
| `ItemsSource`   | IEnumerable | 数据源   |
| `SelectedItem`  | object      | 选中项   |
| `SelectedIndex` | int         | 选中索引 |

### 使用示例

```xml
<ComboBox ItemsSource="{Binding Countries}"
          SelectedItem="{Binding SelectedCountry}" />
```

### 带占位符

```xml
<ComboBox ItemsSource="{Binding Options}"
          SelectedItem="{Binding SelectedOption}"
          PlaceholderText="请选择..." />
```

### 自定义项模板

```xml
<ComboBox ItemsSource="{Binding Users}"
          SelectedItem="{Binding SelectedUser}">
    <ComboBox.ItemTemplate>
        <DataTemplate>
            <StackPanel Orientation="Horizontal" Spacing="10">
                <TextBlock Text="{Binding Name}" FontWeight="Bold" />
                <TextBlock Text="{Binding Email}" Foreground="Gray" />
            </StackPanel>
        </DataTemplate>
    </ComboBox.ItemTemplate>
</ComboBox>
```

---

## ListBox（列表框）

### 基本属性

| 属性            | 类型          | 说明     |
| --------------- | ------------- | -------- |
| `ItemsSource`   | IEnumerable   | 数据源   |
| `SelectedItem`  | object        | 选中项   |
| `SelectionMode` | SelectionMode | 选择模式 |

### 使用示例

```xml
<ListBox ItemsSource="{Binding Items}"
         SelectedItem="{Binding SelectedItem}">
    <ListBox.ItemTemplate>
        <DataTemplate>
            <TextBlock Text="{Binding Name}" />
        </DataTemplate>
    </ListBox.ItemTemplate>
</ListBox>
```

### 多选模式

```xml
<ListBox ItemsSource="{Binding Items}"
         SelectedItems="{Binding SelectedItems}"
         SelectionMode="Multiple">
    <ListBox.ItemTemplate>
        <DataTemplate>
            <CheckBox Content="{Binding Name}"
                      IsChecked="{Binding IsSelected, Mode=TwoWay}" />
        </DataTemplate>
    </ListBox.ItemTemplate>
</ListBox>
```

---

## ItemsControl（项目控件）

### 基本使用

```xml
<ItemsControl ItemsSource="{Binding Items}">
    <ItemsControl.ItemTemplate>
        <DataTemplate>
            <Border Padding="5" Margin="2" Background="LightGray">
                <TextBlock Text="{Binding}" />
            </Border>
        </DataTemplate>
    </ItemsControl.ItemTemplate>
</ItemsControl>
```

---

## ScrollViewer（滚动查看器）

### 基本属性

| 属性                            | 类型                | 说明           |
| ------------------------------- | ------------------- | -------------- |
| `HorizontalScrollBarVisibility` | ScrollBarVisibility | 水平滚动条     |
| `VerticalScrollBarVisibility`   | ScrollBarVisibility | 垂直滚动条     |
| `ScrollBarsAreAttached`         | bool                | 是否显示滚动条 |

### ScrollBarVisibility 选项

| 值       | 说明       |
| -------- | ---------- |
| `Auto`   | 需要时显示 |
| `Always` | 始终显示   |
| `Never`  | 从不显示   |

### 使用示例

```xml
<ScrollViewer Height="300" VerticalScrollBarVisibility="Auto">
    <StackPanel Spacing="5">
        <TextBlock Text="第一项" />
        <TextBlock Text="第二项" />
        <!-- 更多内容 -->
    </StackPanel>
</ScrollViewer>
```

---

## Border（边框）

### 基本属性

| 属性              | 类型         | 说明     |
| ----------------- | ------------ | -------- |
| `Background`      | IBrush       | 背景色   |
| `BorderBrush`     | IBrush       | 边框颜色 |
| `BorderThickness` | Thickness    | 边框厚度 |
| `CornerRadius`    | CornerRadius | 圆角     |
| `Padding`         | Thickness    | 内边距   |

### 使用示例

```xml
<Border Background="LightBlue"
        BorderBrush="DarkBlue"
        BorderThickness="2"
        CornerRadius="5"
        Padding="10">
    <TextBlock Text="带边框的内容" />
</Border>
```

---

## StackPanel 和 WrapPanel

### StackPanel

```xml
<StackPanel Spacing="10">
    <Button Content="按钮1" />
    <Button Content="按钮2" />
    <Button Content="按钮3" />
</StackPanel>
```

### 水平 StackPanel

```xml
<StackPanel Orientation="Horizontal" Spacing="5">
    <Button Content="新建" />
    <Button Content="打开" />
    <Button Content="保存" />
</StackPanel>
```

---

## Expander（可折叠面板）

### 基本属性

| 属性              | 类型            | 说明     |
| ----------------- | --------------- | -------- |
| `IsExpanded`      | bool            | 是否展开 |
| `Header`          | object          | 标题内容 |
| `ExpandDirection` | ExpandDirection | 展开方向 |

### 使用示例

```xml
<Expander Header="高级选项" IsExpanded="True">
    <StackPanel Spacing="5" Margin="10">
        <TextBox Watermark="选项1" />
        <TextBox Watermark="选项2" />
    </StackPanel>
</Expander>
```

---

## ProgressBar（进度条）

### 基本属性

| 属性              | 类型   | 说明       |
| ----------------- | ------ | ---------- |
| `Value`           | double | 当前值     |
| `Minimum`         | double | 最小值     |
| `Maximum`         | double | 最大值     |
| `IsIndeterminate` | bool   | 不确定模式 |

### 使用示例

```xml
<ProgressBar Value="50" Minimum="0" Maximum="100" Height="10" />

<ProgressBar IsIndeterminate="True" />
```

---

## Slider（滑块）

### 基本属性

| 属性                  | 类型   | 说明           |
| --------------------- | ------ | -------------- |
| `Value`               | double | 当前值         |
| `Minimum`             | double | 最小值         |
| `Maximum`             | double | 最大值         |
| `TickFrequency`       | double | 刻度间隔       |
| `IsSnapToTickEnabled` | bool   | 是否吸附到刻度 |

### 使用示例

```xml
<Slider Value="{Binding Volume}"
        Minimum="0"
        Maximum="100"
        TickFrequency="10"
        IsSnapToTickEnabled="True" />
```

---

## 常用控件速查表

| 控件         | 用途     | 关键属性                      |
| ------------ | -------- | ----------------------------- |
| Button       | 按钮     | Command, Content              |
| TextBox      | 文本输入 | Text, Watermark, PasswordChar |
| TextBlock    | 文本显示 | Text, FontSize                |
| CheckBox     | 复选框   | IsChecked, Content            |
| RadioButton  | 单选框   | IsChecked, GroupName          |
| ComboBox     | 下拉选择 | ItemsSource, SelectedItem     |
| ListBox      | 列表     | ItemsSource, SelectedItem     |
| Border       | 边框容器 | Background, BorderThickness   |
| ScrollViewer | 滚动容器 | HorizontalScrollBarVisibility |

---

## 常见问题

### 1. 按钮不触发

**检查项：**

- Command 是否正确绑定
- CanExecute 是否返回 true
- 事件处理是否正确

### 2. 列表项不显示

**检查项：**

- ItemsSource 是否设置
- DataTemplate 是否正确
- 绑定路径是否正确

### 3. 文本框无法输入

**检查项：**

- 是否设置了 ReadOnly
- IsEnabled 是否为 true
- DataContext 是否正确

---

## 总结

| 类别     | 控件                  | 使用场景  |
| -------- | --------------------- | --------- |
| **交互** | Button, ToggleButton  | 用户操作  |
| **输入** | TextBox, PasswordBox  | 文本输入  |
| **显示** | TextBlock             | 文本显示  |
| **选择** | CheckBox, RadioButton | 二元/单选 |
| **列表** | ListBox, ComboBox     | 多项选择  |
| **容器** | Border, ScrollViewer  | 布局组织  |

---

## 相关资源

- [Avalonia 控件参考](https://docs.avaloniaui.net/docs/controls/)
- [按钮控件](https://docs.avaloniaui.net/docs/controls/buttons/)
- [文本控件](https://docs.avaloniaui.net/docs/controls/text/)
- [选择控件](https://docs.avaloniaui.net/docs/controls/selection/)
