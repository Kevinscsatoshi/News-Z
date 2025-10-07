# LINE Q&A Bot

這個專案示範如何在 LINE 平台上建立一個問答機器人，並透過 OpenAI API 提供智慧回覆。專案採用 Node.js、Express 與官方的 `@line/bot-sdk`，將傳入的訊息轉發給 OpenAI，再把答案回覆給使用者。

## 需求條件

- Node.js 18 以上版本
- 一個 LINE Developers 帳號與 Messaging API channel
- OpenAI API 金鑰

## 安裝

```bash
npm install
```

## 設定環境變數

建立 `.env` 檔案，並填入以下參數：

```
LINE_CHANNEL_ACCESS_TOKEN=你的 LINE Channel access token
LINE_CHANNEL_SECRET=你的 LINE Channel secret
OPENAI_API_KEY=你的 OpenAI API key
PORT=3000
```

> 可參考 `.env.example` 取得範本。

## 啟動伺服器

在本地端啟動開發伺服器：

```bash
npm run dev
```

部署或正式運行可執行：

```bash
npm start
```

伺服器啟動後會監聽 `PORT`（預設為 3000）。

## LINE Webhook 設定

1. 在 LINE Developers 後台建立 Messaging API channel。
2. 將 Webhook URL 設定為 `https://你的網域/webhook`（本地開發可使用 [ngrok](https://ngrok.com/) 等工具暴露連線）。
3. 啟用 Webhook 並將好友加入機器人。

## 運作流程

1. 使用者於 LINE 對話框輸入文字問題。
2. Webhook 收到訊息後觸發 `handleEvent`。
3. 程式呼叫 OpenAI Responses API，並以繁體中文生成結構化回答。
4. 機器人將回答內容回傳給使用者。

## 專案結構

```
├── package.json          # 專案定義與指令
├── src
│   └── index.js          # 主要的伺服器與事件處理邏輯
└── README.md             # 使用說明
```

## 進一步擴充

- 自訂系統提示語以符合品牌語氣。
- 將常見問題緩存或儲存於資料庫，以降低 API 使用成本。
- 加入非文字訊息的處理流程，例如圖片或語音轉文字。

## 授權

此範例以 MIT 授權釋出，可自由調整與應用。
