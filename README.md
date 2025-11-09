# 以太坊链上监控面板（Web & macOS 桌面版）

该项目提供了一个用于追踪以太坊交易量趋势和巨鲸行为的可视化面板，同时附带一个可在 macOS 上独立运行的 Electron 桌面封装，方便在本地桌面环境中随时查看数据并管理 OKX Wallet 连接。

## 功能亮点

- **交易量洞察**：调用 CoinGecko API 获取 24 小时总交易额、7 日平均值、价格波动等数据，并以表格和折线图展示趋势。
- **巨鲸监控**：基于 Blockchair API 筛选超过自定义阈值的大额转账，自动生成摘要和详细列表。
- **OKX Wallet 集成**：优先检测桌面浏览器或扩展中的 OKX 钱包，支持一键连接、刷新余额、复制地址、跳转 OKLink 等操作。
- **macOS 体验优化**：Electron 桌面版加入菜单栏刷新、全局截图导出、系统剪贴板复制等增强能力，并针对 macOS 隐藏标题栏进行了样式优化。

## 目录结构

```
.
├── index.html        # Web 端页面模版（Electron 也复用）
├── script.js         # 主业务逻辑，包含数据获取与钱包交互
├── styles.css        # 统一的深色系 UI 样式
└── mac-app/          # macOS 桌面端封装
    ├── main.js       # Electron 主进程，创建窗口与菜单
    ├── package.json  # 桌面端依赖与构建配置
    └── preload.js    # 预加载脚本，向渲染层暴露安全 API
```

## 快速开始（Web 版）

直接在任意现代浏览器中打开 `index.html` 即可体验全部功能。如果已安装 OKX Wallet 浏览器扩展，页面会自动检测并允许连接。

## 快速开始（macOS 桌面应用）

1. 确保系统安装了 [Node.js](https://nodejs.org/)（推荐 LTS 版本）。
2. 在终端中进入桌面封装目录并安装依赖：
   ```bash
   cd mac-app
   npm install
   ```
3. 启动开发模式的桌面程序：
   ```bash
   npm start
   ```
   Electron 会加载上层的 `index.html` 页面，并在菜单栏中提供“刷新链上数据”“导出截图”等本地特性。
4. 若需打包 macOS 应用（包含 Intel 与 Apple Silicon 双架构）：
   ```bash
   npm run build:mac
   ```
   生成的 DMG/ZIP 会位于 `mac-app/dist/` 目录下。首次签名或分发时，请根据自身 Apple 开发者账号完成额外配置。

> 提示：桌面应用会复用默认浏览器中的 OKX Wallet 扩展。如果尚未安装，可点击连接按钮后根据提示前往 OKX 官网安装或使用移动端钱包扫码授权。

## 数据与隐私

- 所有行情、链上数据均通过公共 REST API 获取，不需要提供任何私钥或敏感信息。
- 钱包连接仅用于读取公开账户信息，所有操作在本地完成，可随时在应用内重置连接状态。

## 许可

本项目以 MIT 许可证发布，可在保留版权与许可声明的前提下自由使用与修改。
