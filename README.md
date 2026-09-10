# TGS · Sticker Hub

Telegram 贴纸接收器。同一个应用，两套 UI：

| UI | 入口 | 技术栈 |
| --- | --- | --- |
| **Material 3**（原版，完整保留） | `/` | 单文件 `index.html`（Vanilla JS） |
| **Neo-Brutalism**（新，默认显示） | `/`（补丁覆盖层） / `nb/` | React 18 + Vite，Gumroad Foundry 风格架构 |

## Neo-Brutalism 补丁（不删旧 UI）

新 UI **没有替换**旧 UI，而是以补丁方式打在它上面：

- `index.html` 只在结尾追加了 2 行（`nb/nb-patch.css` + `nb/nb-patch.js`），
  head 里另加了一行 `X-UA-Compatible` meta，M3 代码一行未动；
- 补丁在页面之上挂载全屏覆盖层 `#__nb_root__`，React 应用渲染在其中；
- 左下角有悬浮 **STYLE** 切换钮：`NB ⇄ M3`，随时来回切（选择会记忆）；
  NB 顶栏也有 `M3` 返回按钮；`?ui=nb|m3` 可直接指定；
- Bot 令牌两套 UI 共用同一个 localStorage key，换肤不掉令牌；
- **回滚方法**：删掉 `index.html` 底部那两行 `nb/` 引入（以及 head 里的
  `X-UA-Compatible` meta）即可，其余文件无需改动。

架构、目录与构建说明见 [nb/ARCHITECTURE.md](nb/ARCHITECTURE.md)。

## 引擎优化与 IE 兼容（无感运行）

补丁之外还有一层 `nb/browser-compat.js`，在页面加载的**最早期**同步运行，
为不同浏览器内核注入各自原生技术，全程不产生任何可见 UI 变化：

| 引擎 | 采用的原生技术 | 作用 |
| --- | --- | --- |
| 全部 | `preconnect` + `dns-prefetch` 到 `api.telegram.org` | 首个 `getUpdates` 前省掉 DNS/TCP/TLS 往返 |
| 全部 | `requestIdleCallback` 调度历史记录写盘 | 把 localStorage 写移出交互热路径 |
| Chrome / Edge（Blink） | `content-visibility:auto` + `contain-intrinsic-size` | 跳过屏外卡片的渲染/布局 |
| Firefox（Gecko） | 标准 `scrollbar-width` / `scrollbar-color` | 细滚动条、跟主题走 |
| Safari / iOS（WebKit） | `viewport-fit=cover` + `env(safe-area-inset-*)`、`100dvh` | 刘海/底部横条安全区、动态视口高度 |
| 全部 | `X-UA-Compatible: IE=edge`（head 静态 meta） | 禁止 IE 降为兼容渲染模式 |
| 屏外视频 | `IntersectionObserver` 自动暂停/恢复 | 多视频堆积时降 GPU/电池开销 |

**IE 兼容模式**：`browser-compat.js` 与 `nb/nb-patch.js` 均为纯 ES5，
检测到 IE（`Trident`/`MSIE`）或缺 `fetch`/`Promise` 的古老内核时：

- **不加载**现代 NB 包（避免整页 SyntaxError），保持 Material 3 皮肤；
- 给 `<html>` 加 `nb-legacy` 类并注入 `nb/ie-fallback.css`
  （无 CSS 变量 / 无 flex gap / 无 grid 的字面值降级，选择器与 M3 标记逐一对应）；
- 隐藏 NB 覆盖层与悬浮切换钮。

> 说明：原版 M3 页面自身的 JS 已使用 async/await 等现代语法（历史现状，
> 按需求不改旧 UI），因此 IE 下保证的是「静态布局正确渲染、补丁层不再叠加
> 第二层致命错误」；轮询等功能在 IE 上仍依赖原生内核，属预期限制。

## 本轮修复的 Bug / 内存泄漏（两套 UI 共用逻辑层）

- **M3 lottie 泄漏**：旧代码为每张 TGS 卡创建 lottie 实例但从不调用
  `destroy()`，卡片移除后 WebGL/Shader 残留。兼容层包装
  `lottie.loadAnimation` + `MutationObserver`，容器或其祖先被移除时自动 `destroy()`。
- **NB 侧**：`TgsPlayer` 卸载时 `destroy()`；停止监听时通过
  `AbortController` 立即中止在途的 `getUpdates`（最长 30s 长轮询），
  `AbortError` 不再计入连续错误。
- **React 渲染泄漏/抖动**：轮询每 ~20s 的 tick 之前会让整个媒体列表重渲染——
  现在 `MediaCard` 用 `React.memo` + 稳定回调 + 唯一 `data-media-id`；
  状态在值未变时不再 setState。
- **ZIP 打包泄漏**：套装收起 / 历史清空后打包循环不再继续拉取剩余文件。
- **杂项**：开始按钮防双击；历史缩略图 `onError` 回退只触发一次（防死循环）；
  图片 `loading="lazy"` + `decoding="async"`；「清除全部」改为两步确认防误触；
  启动失败自动聚焦令牌输入框。

## 运行

仓库根目录起任意静态服务器即可（`nb/dist/` 已构建并提交）：

```bash
python3 -m http.server 8080
# 打开 http://localhost:8080/
```

仅重建 NB 包：

```bash
cd nb && npm install && npm run build   # → nb/dist/nb-app.js
```
