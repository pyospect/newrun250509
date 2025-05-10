import type { NextApiRequest, NextApiResponse } from 'next';
import { generateICSFile } from '@/lib/utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  try {
    const { title, date, duration, details } = req.body;
    
    if (!title || !date || !duration || !details) {
      res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
      return;
    }
    
    // Generate ICS content
    const icsContent = await generateICSFile(title, date, duration, details);
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="running_plan.ics"`);
    
    // Send ICS content
    res.status(200).send(icsContent);
  } catch (error) {
    console.error('ICS Generation Error:', error);
    res.status(500).json({ error: '일정 파일 생성 중 오류가 발생했습니다.' });
  }
} 