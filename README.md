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
- Cloudflare Worker (API proxy — API key อยู่ฝั่ง server ใน production)
- html2canvas

## Run locally

```bash
cp .env.example .env
# แก้ .env ใส่ key จาก aistudio.google.com
npm install
npm run dev
```

**.env สำหรับ local dev:**
```
VITE_GEMINI_API_KEY=your_key_here
```

> เมื่อตั้ง `VITE_GEMINI_API_KEY` แอปจะ call Gemini โดยตรงจาก browser (ไม่ต้องรัน wrangler)
> สำหรับ production ให้ลบ key นี้ออกแล้วใช้ `VITE_WORKER_URL` แทน

## Deploy

**Worker (ทำครั้งแรกก่อน):**
```bash
cd worker
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put ALLOWED_ORIGINS   # เช่น https://talking-objects.pages.dev,https://fun.tintindev.com
npx wrangler deploy
```

**Frontend (Cloudflare Pages):**
- Build command: `npm run build`
- Output directory: `dist`
- Env var: `VITE_WORKER_URL=https://talking-objects-api.workers.dev`
- **ไม่ต้องใส่ `VITE_GEMINI_API_KEY` ใน production**
