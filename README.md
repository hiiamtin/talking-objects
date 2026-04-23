# 🗯️ ฉันอยากบอกว่า / I Want to Say

ถ่ายรูปสิ่งของ → AI พูดแทนมัน → ได้รูปการ์ตูนพร้อม speech bubble ไปแชร์

Take a photo of any object → AI speaks as that object → get a shareable comic-style image.

**[Demo →](https://talking-objects.pages.dev)**

---

## Features

- 📷 ถ่ายรูปด้วยกล้อง (หน้า/หลัง) หรืออัพโหลดรูปจากเครื่อง
- 🎭 4 โมด: ตลก / จิกกัด (roast) / น่ารัก / จริงจัง
- 🇹🇭🇬🇧 รองรับภาษาไทยและอังกฤษ
- 💬 ลาก speech bubble ไปไว้ตรงไหนก็ได้ในรูป
- 🎨 เลือก style bubble: ทิศลูกศร, สีพื้นหลัง, ขนาด/สีตัวอักษร
- 💾 บันทึกรูปเป็น PNG พร้อม bubble

## Stack

- Vite + React
- Gemini 3.1 Flash Lite Preview (Google AI Studio — free tier)
- Cloudflare Worker (API proxy — API key อยู่ฝั่ง server)
- html2canvas

## Run locally

**ต้องรัน 2 process:**

**1. Worker (API proxy):**
```bash
cd worker
echo "GEMINI_API_KEY=your_key_here" > .dev.vars   # จาก aistudio.google.com
npx wrangler dev                                    # รันที่ http://localhost:8787
```

**2. Frontend:**
```bash
cp .env.example .env
# แก้ .env: VITE_WORKER_URL=http://localhost:8787
npm install
npm run dev                                         # รันที่ http://localhost:5173
```

> **Shortcut:** ถ้า deploy worker ไปแล้ว ชี้ `VITE_WORKER_URL` ไปที่ worker URL จริงแล้ว `npm run dev` อย่างเดียวพอ

## Deploy

**Worker (ทำครั้งแรกก่อน):**
```bash
cd worker
npx wrangler secret put GEMINI_API_KEY   # ใส่ key
npx wrangler deploy
```

**Frontend (Cloudflare Pages):**
- Build command: `npm run build`
- Output directory: `dist`
- Env var: `VITE_WORKER_URL=https://your-worker.workers.dev`
