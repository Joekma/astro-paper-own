---
title: React 深入浅出：测试、错误边界与 TypeScript 工程化
author: Joekma
pubDatetime: 2026-05-15T00:00:00.000+08:00
modDatetime: 2026-05-15T00:00:00.000+08:00
slug: react-testing-error-boundary-typescript
description: '补充 React 工程化实践：组件测试、错误边界、TypeScript Props 类型和项目约束。'
tags:
  - React
  - TypeScript
  - 测试
  - Error Boundary
  - 工程实践
draft: false
series: React 深入浅出
language: zh-CN
---

React 入门关注“怎么写组件”，工程实践关注“组件坏了怎么发现、错误怎么兜底、接口怎么约束”。这篇补齐测试、错误边界和 TypeScript 三块内容。

## 组件测试目标

组件测试不应该测试内部实现细节，而应该测试用户能看到和操作的行为。

```tsx
// 示例：用用户视角测试按钮行为。
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

test('点击按钮后数字加一', async () => {
  render(<Counter />);

  await userEvent.click(screen.getByRole('button', { name: '增加' }));

  expect(screen.getByText('1')).toBeInTheDocument();
});
```

## 避免脆弱测试

```tsx
// 不推荐：依赖 className 或组件内部结构。
expect(container.querySelector('.count')?.textContent).toBe('1');

// 推荐：通过角色、标签、文本等用户可感知信息查询。
expect(screen.getByText('1')).toBeInTheDocument();
```

## 错误边界

错误边界可以捕获渲染阶段、生命周期和子组件构造函数中的错误。它不能捕获事件处理器、异步回调和服务端错误。

```tsx
// 示例：基础错误边界。
import { Component, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  fallback: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // 生产项目中可以把错误上报到监控平台。
    console.error(error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
```

## TypeScript Props

```tsx
// 示例：用联合类型表达明确的组件状态。
type ButtonProps =
  | {
      variant: 'link';
      href: string;
      children: string;
    }
  | {
      variant: 'button';
      onClick: () => void;
      children: string;
    };

export function ActionButton(props: ButtonProps) {
  if (props.variant === 'link') {
    return <a href={props.href}>{props.children}</a>;
  }

  return <button onClick={props.onClick}>{props.children}</button>;
}
```

## 目录约束

React 项目可以按业务域组织，而不是按文件类型堆在一起。

```text
src/
  features/
    auth/
      LoginForm.tsx
      auth-api.ts
      auth-types.ts
      LoginForm.test.tsx
    posts/
      PostList.tsx
      post-api.ts
  shared/
    ui/
    hooks/
    lib/
```

## 质量门禁

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "lint": "eslint .",
    "build": "vite build"
  }
}
```

## 小结

测试保证行为不倒退，错误边界保证局部失败不拖垮整个页面，TypeScript 保证组件契约清晰。三者配合起来，React 项目才更适合长期维护。
