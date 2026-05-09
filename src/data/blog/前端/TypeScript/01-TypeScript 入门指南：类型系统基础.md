---
title: TypeScript 入门指南：类型系统基础
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: typescript-getting-started
description: '详细介绍TypeScript的类型系统，包括基础类型、接口、泛型等核心概念。'
tags:
  - TypeScript
  - 前端
  - 类型系统
  - JavaScript 超集
draft: false
language: zh-CN
---

## 概述

TypeScript 是 JavaScript 的超集，由微软开发并维护。它添加了**类型系统**和**面向对象编程**特性，使代码更加健壮和可维护。

### 为什么选择 TypeScript？

| 特性 | 说明 |
|------|------|
| **类型安全** | 编译时类型检查 |
| **IDE 支持** | 智能提示和重构 |
| **代码文档** | 类型即文档 |
| **可维护性** | 大型项目友好 |
| **生态兼容** | 完全兼容 JavaScript |
| **渐进式学习** | 可逐步采用 |

### TypeScript vs JavaScript

```typescript
// JavaScript
function add(a, b) {
  return a + b;
}

// TypeScript
function add(a: number, b: number): number {
  return a + b;
}
```

## 基础类型

### 基本类型

```typescript
// 字符串
const name: string = "张三";
const greeting: string = `Hello, ${name}`;

// 数字
const age: number = 25;
const price: number = 99.99;

// 布尔值
const isActive: boolean = true;
const hasPermission: boolean = false;

// undefined 和 null
let notDefined: undefined = undefined;
let empty: null = null;

// 数组
const numbers: number[] = [1, 2, 3];
const names: Array<string> = ["Alice", "Bob"];

// 元组
const tuple: [string, number] = ["age", 25];
```

### any 和 unknown

```typescript
// any - 任意类型（跳过类型检查）
let value: any = 4;
value = "string"; // OK
value = true; // OK

// unknown - 未知类型（更安全）
let userInput: unknown;
userInput = 4;
userInput = "string";

// unknown 需要类型检查
if (typeof userInput === "string") {
  console.log(userInput.toUpperCase());
}

// never - 从不返回
function error(message: string): never {
  throw new Error(message);
}
```

### void 和 never

```typescript
// void - 没有返回值
function logMessage(message: string): void {
  console.log(message);
}

// never - 永不返回
function infiniteLoop(): never {
  while (true) {
    // 无限循环
  }
}
```

## 接口和类型别名

### 接口定义

```typescript
// 基本接口
interface User {
  id: number;
  name: string;
  email: string;
  age?: number; // 可选属性
  readonly createdAt: Date; // 只读属性
}

const user: User = {
  id: 1,
  name: "张三",
  email: "zhang@example.com",
  createdAt: new Date(),
};
```

### 接口继承

```typescript
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}

interface GuideDog extends Dog {
  certifications: string[];
}

const guide: GuideDog = {
  name: "Buddy",
  breed: "Golden Retriever",
  certifications: ["导盲", "搜救"],
};
```

### 类型别名

```typescript
// 类型别名
type ID = string | number;
type Point = { x: number; y: number };
type Callback = () => void;

// 联合类型
type Status = "pending" | "success" | "error";
type Result<T> = { data: T; error: null } | { data: null; error: Error };
```

## 函数类型

### 函数签名

```typescript
// 基本函数
function add(a: number, b: number): number {
  return a + b;
}

// 函数类型
type AddFunction = (a: number, b: number) => number;
const add: AddFunction = (x, y) => x + y;

// 可选参数
function greet(name: string, greeting?: string) {
  return greeting ? `${greeting}, ${name}!` : `Hello, ${name}!`;
}

// 默认参数
function createPoint(x: number, y: number = 0): Point {
  return { x, y };
}
```

### 泛型函数

```typescript
// 泛型约束
function identity<T>(arg: T): T {
  return arg;
}

// 泛型接口
interface Container<T> {
  value: T;
  getValue(): T;
}

// 泛型类
class Box<T> {
  private content: T;
  
  set(value: T): void {
    this.content = value;
  }
  
  get(): T {
    return this.content;
  }
}
```

## 类和对象

### 类定义

```typescript
class Person {
  // 访问修饰符
  public name: string;      // 公开
  private age: number;      // 私有
  protected id: string;      // 受保护
  readonly createdAt: Date; // 只读
  
  constructor(name: string, age: number, id: string) {
    this.name = name;
    this.age = age;
    this.id = id;
    this.createdAt = new Date();
  }
  
  greet(): string {
    return `Hello, I'm ${this.name}`;
  }
}

const person = new Person("张三", 25, "001");
console.log(person.name); // OK
// console.log(person.age); // Error: Property 'age' is private
```

### 抽象类

```typescript
abstract class Shape {
  abstract calculateArea(): number;
  
  display(): void {
    console.log(`Area: ${this.calculateArea()}`);
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }
  
  calculateArea(): number {
    return Math.PI * this.radius ** 2;
  }
}

const circle = new Circle(5);
circle.display();
```

## 联合和交叉类型

### 联合类型

```typescript
type StringOrNumber = string | number;
type Status = "pending" | "success" | "error";

function printId(id: number | string): void {
  if (typeof id === "string") {
    console.log(id.toUpperCase());
  } else {
    console.log(id.toFixed(2));
  }
}
```

### 交叉类型

```typescript
type Printable = {
  print(): void;
};

type Loggable = {
  log(message: string): void;
};

interface Logger extends Printable, Loggable {
  name: string;
}

class LoggerImpl implements Logger {
  name: string;
  
  constructor(name: string) {
    this.name = name;
  }
  
  print(): void {
    console.log(this.name);
  }
  
  log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }
}
```

## 实用工具类型

### 内置工具类型

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Partial - 所有属性可选
type PartialUser = Partial<User>;

// Required - 所有属性必需
type RequiredUser = Required<User>;

// Pick - 选择属性
type UserPreview = Pick<User, "id" | "name">;

// Omit - 排除属性
type UserWithoutEmail = Omit<User, "email">;

// Record - 键值映射
type UserMap = Record<string, User>;

// Nullable - 属性可空
type OptionalUser = {
  [K in keyof User]?: User[K] | null;
};
```

### 条件类型

```typescript
// 条件类型
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>; // false

// infer - 推断类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type ReturnOfFunction = ReturnType<() => string>; // string
```

## 模块系统

### 导入导出

```typescript
// math.ts
export const PI = 3.14;
export function add(a: number, b: number): number {
  return a + b;
}

export default class Calculator {
  // 默认导出
}

// main.ts
import Calculator, { PI, add } from './math';
import * as MathUtils from './math';
import type { User } from './types';
```

### 命名空间

```typescript
// shapes.ts
export namespace Shapes {
  export class Circle {
    constructor(public radius: number) {}
    
    area(): number {
      return Math.PI * this.radius ** 2;
    }
  }
  
  export class Square {
    constructor(public side: number) {}
  }
}

// 使用命名空间
import { Shapes } from './shapes';
const circle = new Shapes.Circle(5);
```

## 声明文件

### .d.ts 声明

```typescript
// globals.d.ts
declare const VERSION: string;
declare function greet(name: string): string;
declare class MyClass {}

// 模块声明
declare module 'my-library' {
  export const version: string;
  export function myFunction(): void;
}

// 使用
/// <reference types="node" />
import { version } from 'my-library';
```

## 最佳实践

### 类型注解

```typescript
// ✅ 显式类型注解（公共 API）
function fetchUser(id: number): Promise<User> {
  return fetch(`/api/users/${id}`).then(res => res.json());
}

// ✅ 类型推断（局部变量）
const message = "Hello"; // string

// ✅ 避免 any
// ❌ const value: any = getValue();
// ✅ 
const value: unknown = getValue();
if (typeof value === "string") {
  console.log(value.toUpperCase());
}
```

### 接口 vs 类型别名

```typescript
// 接口 - 对象结构
interface User {
  id: number;
  name: string;
}

// 类型别名 - 联合类型、原始类型
type Status = "active" | "inactive";
type ID = string | number;
```

### 泛型约束

```typescript
// ✅ 有意义的泛型名称
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// ✅ 使用 extends 约束
function merge<T extends object, U extends object>(target: T, source: U): T & U {
  return { ...target, ...source };
}
```

## 编译配置

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 严格模式

```typescript
// 严格类型检查
strict: true; // 开启所有严格检查

// 单独配置
strictNullChecks: true;
strictFunctionTypes: true;
noImplicitAny: true;
noUnusedLocals: true;
noUnusedParameters: true;
```


