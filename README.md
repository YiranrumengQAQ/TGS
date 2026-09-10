# TGS · Sticker Hub

Telegram 贴纸接收器。同一个应用，两套 UI：

| UI | 入口 | 技术栈 |
| --- | --- | --- |
| **Material 3**（原版，完整保留） | `/` | 单文件 `index.html`（Vanilla JS） |
| **Neo-Brutalism**（新，默认显示） | `/`（补丁覆盖层） / `nb/` | React 18 + Vite，Gumroad Foundry 风格架构 |

## Neo-Brutalism 补丁（不删旧 UI）

新 UI **没有替换**旧 UI，而是以补丁方式打在它上面：

- `index.html` 只在结尾追加了 2 行（`nb/nb-patch.css` + `nb/nb-patch.js`），M3 代码一行未动；
- 补丁在页面之上挂载全屏覆盖层 `#__nb_root__`，React 应用渲染在其中；
- 左下角有悬浮 **STYLE** 切换钮：`NB ⇄ M3`，随时来回切（选择会记忆）；
  NB 顶栏也有 `M3` 返回按钮；`?ui=nb|m3` 可直接指定；
- Bot 令牌两套 UI 共用同一个 localStorage key，换肤不掉令牌；
- **回滚方法**：删掉 `index.html` 底部那两行 `nb/` 引入即可。

架构、目录与构建说明见 [nb/ARCHITECTURE.md](nb/ARCHITECTURE.md)。

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
