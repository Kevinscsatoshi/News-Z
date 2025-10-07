import express from 'express';
import { Client, middleware as lineMiddleware } from '@line/bot-sdk';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

if (!config.channelAccessToken || !config.channelSecret) {
  console.warn('⚠️  LINE credentials are missing. Check your environment variables.');
}

if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY is not set.');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const lineClient = new Client(config);
const app = express();

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/webhook', lineMiddleware(config), async (req, res) => {
  try {
    const results = await Promise.all(req.body.events.map(handleEvent));
    res.json(results);
  } catch (error) {
    console.error('Failed to handle events', error);
    res.status(500).send('Internal Server Error');
  }
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: '請傳送想詢問的文字問題，我會為你提供協助。',
    });
  }

  const question = event.message.text.trim();

  if (!question) {
    return lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: '我需要一個問題才能幫你喔！',
    });
  }

  try {
    const completion = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content:
            '你是一個專業且友善的LINE問答助理。請使用繁體中文回答，並提供清楚、結構化的說明。如果有必要，請以步驟或條列方式整理答案。',
        },
        {
          role: 'user',
          content: question,
        },
      ],
      temperature: 0.3,
    });

    const answer = completion.output_text?.trim();

    if (!answer) {
      throw new Error('Empty response from OpenAI');
    }

    return lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: answer.slice(0, 4999),
    });
  } catch (error) {
    console.error('OpenAI request failed', error);
    const message =
      '抱歉，我目前無法取得答案。請稍後再試，或確認系統設定是否正確。';

    return lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: message,
    });
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`LINE Q&A bot listening on port ${port}`);
});
