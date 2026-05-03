---
title: Go语言反射：reflect包、TypeOf、ValueOf、动态调用与JSON解析
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-reflection
description: '深入讲解Go语言reflect.TypeOf、reflect.ValueOf、类型断言、动态调用、字段操作、方法调用、JSON/YAML编解码和反射性能优化建议，包含完整代码示例。'
tags:
  - Go
  - 反射
  - reflect
  - 动态编程
  - JSON
  - YAML
  - 序列化
draft: false
language: zh-CN
---

## 反射获取类型信息

### reflect.TypeOf

```go
import "reflect"

var a int
typeOfA := reflect.TypeOf(a)
fmt.Println(typeOfA.Name(), typeOfA.Kind())  // int int
```

## Type 与 Kind

| 概念 | 说明 |
|------|------|
| **Type** | 系统原生类型或自定义类型名 |
| **Kind** | 对象归属的品种 |

### Kind 常量

```go
const (
    Invalid Kind = iota
    Bool
    Int, Int8, Int16, Int32, Int64
    Uint, Uint8, Uint16, Uint32, Uint64
    Float32, Float64
    Complex64, Complex128
    Array, Chan, Func, Interface, Map
    Ptr, Slice, String, Struct
    UnsafePointer
)
```

### 示例

```go
type Enum int

typeOfA := reflect.TypeOf(Zero)
fmt.Println(typeOfA.Name(), typeOfA.Kind())  // Enum int
```

## 指针元素类型

### Elem()

```go
ins := &cat{}
typeOfCat := reflect.TypeOf(ins)
fmt.Println(typeOfCat.Kind())           // ptr
typeOfCat = typeOfCat.Elem()
fmt.Println(typeOfCat.Kind())           // struct
```

## 结构体成员

### NumField / Field

```go
type cat struct {
    Name string
    Type int `json:"type" id:"100"`
}

ins := cat{Name: "mimi", Type: 1}
typeOfCat := reflect.TypeOf(ins)

for i := 0; i < typeOfCat.NumField(); i++ {
    fieldType := typeOfCat.Field(i)
    fmt.Printf("name: %v tag: '%v'\n", fieldType.Name, fieldType.Tag)
}
```

### StructField 结构

```go
type StructField struct {
    Name    string      // 字段名
    PkgPath string      // 字段路径
    Type    Type        // 反射类型对象
    Tag     StructTag   // 结构体标签
    Offset  uintptr     // 相对偏移
    Index   []int       // 索引值
    Anonymous bool      // 是否匿名字段
}
```

### FieldByName

```go
if catType, ok := typeOfCat.FieldByName("Type"); ok {
    fmt.Println(catType.Tag.Get("json"))  // type
    fmt.Println(catType.Tag.Get("id"))    // 100
}
```

## 结构体标签

### 标签格式

```go
`key1:"value1" key2:"value2"`
```

### 获取标签值

```go
StructTag.Get(key string) string
StructTag.Lookup(key string) (value string, ok bool)
```

### 示例

```go
type Person struct {
    Name string `json:"name" validate:"required"`
    Age  int    `json:"age"`
}

t := reflect.TypeOf(Person{})
field, _ := t.FieldByName("Name")
fmt.Println(field.Tag.Get("json"))       // name
fmt.Println(field.Tag.Get("validate"))   // required
```

## 反射获取值信息

### reflect.ValueOf

```go
var x = 100
v := reflect.ValueOf(x)
fmt.Println(v.Kind())     // int
fmt.Println(v.Int())      // 100
```

### 设置值

```go
var x = 100
v := reflect.ValueOf(&x)
v.Elem().SetInt(200)
fmt.Println(x)  // 200
```

## 动态调用方法

```go
type T struct{}

func (t T) Add(a, b int) int {
    return a + b
}

v := reflect.ValueOf(T{})
method := v.MethodByName("Add")
args := []reflect.Value{reflect.ValueOf(1), reflect.ValueOf(2)}
result := method.Call(args)
fmt.Println(result[0].Int())  // 3
```

## 反射应用场景

| 场景 | 说明 |
|------|------|
| 序列化/反序列化 | JSON、XML 处理 |
| ORM | 数据库对象映射 |
| 配置解析 | 读取结构体标签 |
| 依赖注入 | 运行时创建实例 |