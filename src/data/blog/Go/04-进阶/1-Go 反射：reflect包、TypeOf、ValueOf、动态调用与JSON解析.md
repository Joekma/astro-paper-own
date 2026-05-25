---
title: Go 反射：reflect包、TypeOf、ValueOf、动态调用与JSON解析
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-03T00:00:00.000+08:00
slug: go-reflection
description: '深入讲解 Go reflect.TypeOf、reflect.ValueOf、Type 与 Kind、结构体字段和标签、动态设置值、方法调用、JSON 关系以及反射使用边界。'
tags:
  - Go
  - 反射
  - reflect
  - 动态编程
  - JSON
  - YAML
  - 序列化
draft: false
series: go
seriesOrder: 11
language: zh-CN
---

## 什么是反射

反射让程序在运行时检查类型和值。Go 是静态类型语言，大多数代码不需要反射；但序列化、ORM、依赖注入、通用工具库经常会用到它。

反射的代价是：代码更难读、运行时开销更高、错误更容易推迟到运行时暴露。

---

## TypeOf 和 ValueOf

```go
var age int = 18

t := reflect.TypeOf(age)
v := reflect.ValueOf(age)

fmt.Println(t.Name()) // int
fmt.Println(t.Kind()) // int
fmt.Println(v.Int())  // 18
```

| API | 说明 |
|-----|------|
| `reflect.TypeOf` | 获取运行时类型信息 |
| `reflect.ValueOf` | 获取运行时值 |
| `Type.Name` | 类型名，自定义类型会显示自己的名字 |
| `Type.Kind` | 底层分类，例如 `Int`、`Struct`、`Slice` |

---

## Type 与 Kind

`Type` 表示具体类型，`Kind` 表示底层类别。

```go
type UserID int64

var id UserID = 100
t := reflect.TypeOf(id)

fmt.Println(t.Name()) // UserID
fmt.Println(t.Kind()) // int64
```

理解这个区别很重要：自定义类型可以有自己的方法和语义，但它的底层类别仍然是某个基础类型。

---

## 指针和 Elem

反射中经常需要通过指针拿到底层元素。

```go
type User struct {
    Name string
}

u := &User{Name: "Alice"}
t := reflect.TypeOf(u)

fmt.Println(t.Kind())        // ptr
fmt.Println(t.Elem().Name()) // User
```

`Elem` 用于获取指针、切片、数组、map、channel、接口等类型的元素类型或元素值。调用前要确认 `Kind`，否则可能 panic。

---

## 读取结构体字段

```go
type User struct {
    ID   int64  `json:"id"`
    Name string `json:"name"`
}

func printFields(x any) {
    t := reflect.TypeOf(x)
    if t.Kind() == reflect.Pointer {
        t = t.Elem()
    }
    if t.Kind() != reflect.Struct {
        fmt.Println("not a struct")
        return
    }

    for i := 0; i < t.NumField(); i++ {
        field := t.Field(i)
        fmt.Printf("field=%s json=%s\n", field.Name, field.Tag.Get("json"))
    }
}
```

结构体标签本身只是字符串，`encoding/json`、校验库、ORM 等会通过反射读取它。

---

## 设置值

要通过反射修改值，必须传入指针，并使用可设置的 `Value`。

```go
func setName(target any, name string) error {
    v := reflect.ValueOf(target)
    if v.Kind() != reflect.Pointer || v.IsNil() {
        return fmt.Errorf("target 必须是非 nil 指针")
    }

    elem := v.Elem()
    if elem.Kind() != reflect.Struct {
        return fmt.Errorf("target 必须指向结构体")
    }

    field := elem.FieldByName("Name")
    if !field.IsValid() {
        return fmt.Errorf("字段 Name 不存在")
    }
    if !field.CanSet() {
        return fmt.Errorf("字段 Name 不可设置，可能未导出")
    }
    if field.Kind() != reflect.String {
        return fmt.Errorf("字段 Name 不是 string")
    }

    field.SetString(name)
    return nil
}
```

复杂反射代码要在每一步检查 `Kind`、`IsValid`、`CanSet`，这样错误会更清楚。

---

## 动态调用方法

```go
type Calculator struct{}

func (Calculator) Add(a, b int) int {
    return a + b
}

func callAdd() {
    v := reflect.ValueOf(Calculator{})
    method := v.MethodByName("Add")
    if !method.IsValid() {
        fmt.Println("method not found")
        return
    }

    args := []reflect.Value{
        reflect.ValueOf(1),
        reflect.ValueOf(2),
    }

    results := method.Call(args)
    fmt.Println(results[0].Int())
}
```

动态调用方法可用于框架或插件系统，但普通业务代码应优先直接调用。

---

## JSON 与反射

`encoding/json` 会通过反射读取导出字段和标签。

```go
type User struct {
    ID       int64  `json:"id"`
    Name     string `json:"name"`
    password string `json:"password"`
}

data, _ := json.Marshal(User{
    ID:       1,
    Name:     "Alice",
    password: "secret",
})

fmt.Println(string(data)) // password 不会输出，因为字段未导出
```

标签不会让未导出字段变成可导出字段。字段首字母小写时，`encoding/json` 无法访问它。

---

## 反射使用建议

1. 能用普通类型、接口、泛型解决时，优先不用反射。
2. 反射适合写框架、编码器、通用库，不适合散落在业务核心逻辑里。
3. 反射代码要写足检查和错误信息。
4. 性能敏感路径谨慎使用反射，必要时用 benchmark 验证。
5. 结构体标签只是约定，真正语义由读取标签的库决定。

---

## 小结

反射是一把锋利但需要克制的工具。掌握 `TypeOf`、`ValueOf`、`Kind`、`Elem`、`FieldByName`、`CanSet` 和结构体标签，就能读懂大多数 Go 框架内部的动态能力。
