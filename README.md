# 🗯️ ฉันอยากบอกว่า / I Want to Say

ถ่ายรูปสิ่งของ → AI พูดแทนมัน → ได้รูปการ์ตูนพร้อม speech bubble ไปแชร์

Take a photo of any object → AI speaks as that object → get a shareable comic-style image.

**[Demo →](https://talking-objects.pages.dev)**

---

## Features

- 📷 ถ่ายรูปด้วยกล้อง หรืออัพโหลดรูปจากเครื่อง
- 🎭 4 โมด: ตลก / จิกกัด (roast) / น่ารัก / จริงจัง
- 🇹🇭🇬🇧 รองรับภาษาไทยและอังกฤษ
- 💬 ลาก speech bubble ไปไว้ตรงไหนก็ได้ในรูป
- 🎨 เลือก style bubble: ทิศลูกศร, สีพื้นหลัง, ขนาด/สีตัวอักษร
- 💾 บันทึกรูปเป็น PNG พร้อม bubble

## Stack

- Vite + React
- Gemini 3.1 Flash Lite Preview (Google AI Studio — free tier)
- html2canvas

## Run locally

```bash
cp .env.example .env
# เพิ่ม VITE_GEMINI_API_KEY จาก aistudio.google.com
npm install
npm run dev
```

## Deploy

Cloudflare Pages — build command: `npm run build`, output: `dist`
