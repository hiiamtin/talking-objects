export const moods = ['sweet', 'touching', 'cool', 'cute', 'pro']

const QUOTES = {
  th: {
    sweet: ['สุขสันต์ครบรอบ 5 ปี SCB TechX ขอให้ทุกวันเต็มไปด้วยรอยยิ้มและพลังดีๆ', '5 ปีที่อบอุ่นและแข็งแรง ขอให้ SCB TechX เติบโตอย่างงดงามต่อไป'],
    touching: ['ขอบคุณทุกคนที่ร่วมสร้าง 5 ปีแห่งความหมายให้ SCB TechX เดินต่อด้วยหัวใจเดียวกัน', '5 ปีที่ผ่านมาคือความภูมิใจ และอนาคตคือความเป็นไปได้ไม่สิ้นสุดของ SCB TechX'],
    cool: ['SCB TechX 5 ปีแล้ว ยังเท่เหมือนวันแรก และพร้อมพุ่งไปไกลกว่าเดิม', 'ฉลอง 5 ปีแบบตัวจริง เส้นทางนี้ยังอีกยาว และ SCB TechX พร้อมลุย'],
    cute: ['ขอให้ SCB TechX อายุ 5 ขวบแบบสดใส น่ารัก และเก่งขึ้นทุกวัน', 'Happy 5th! ขอให้ทีม SCB TechX มีแต่โมเมนต์ดีๆ และโปรเจกต์ปังๆ'],
    pro: ['ครบรอบ 5 ปี SCB TechX ขอให้ทุกก้าวต่อจากนี้ขับเคลื่อนนวัตกรรมที่สร้างผลลัพธ์จริง', '5 ปีแห่งความร่วมมือและความเชี่ยวชาญ ขอให้ SCB TechX เติบโตอย่างมั่นคงและยั่งยืน'],
  },
  en: {
    sweet: ['Happy 5th anniversary, SCB TechX. Wishing you joy, warmth, and unstoppable momentum.', 'Five beautiful years of SCB TechX—may the next chapter shine even brighter.'],
    touching: ['Thank you to every team member for shaping five meaningful years at SCB TechX.', 'Five years of pride, trust, and growth—here’s to the next bold chapter, SCB TechX.'],
    cool: ['SCB TechX at 5: still bold, still sharp, still building the future.', 'Five years in, and SCB TechX is just getting started.'],
    cute: ['Happy 5th, SCB TechX! Keep being brilliant, kind, and full of spark.', 'Wishing SCB TechX endless good vibes and winning ideas on your 5th year.'],
    pro: ['Congratulations on 5 years of innovation and impact, SCB TechX.', 'Wishing SCB TechX continued excellence, collaboration, and sustainable growth.'],
  },
}

export function getRandomQuote(lang, mood) {
  const list = QUOTES[lang]?.[mood] ?? QUOTES.th.sweet
  return list[Math.floor(Math.random() * list.length)]
}
