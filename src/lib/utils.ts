import { createEvents, DateArray } from 'ics';

/**
 * Format date to ICS format (YYYYMMDDTHHMMSS)
 */
export const formatDateForICS = (date: Date): DateArray => {
  return [
    date.getFullYear(),
    date.getMonth() + 1, // Month is 0-indexed in JS
    date.getDate(),
    date.getHours(),
    date.getMinutes()
  ];
};

/**
 * Parse a date string in Korean format to Date object
 * Example: "2023년 5월 13일 (토) 오전 7:00" -> Date
 */
export const parseKoreanDateString = (dateStr: string): Date => {
  try {
    // Extract components from Korean date string
    const yearMatch = dateStr.match(/(\d{4})년/);
    const monthMatch = dateStr.match(/(\d{1,2})월/);
    const dayMatch = dateStr.match(/(\d{1,2})일/);
    const hourMatch = dateStr.match(/(오전|오후)\s*(\d{1,2}):(\d{2})/);
    
    if (!yearMatch || !monthMatch || !dayMatch) {
      throw new Error('Cannot parse date components');
    }
    
    const year = parseInt(yearMatch[1], 10);
    const month = parseInt(monthMatch[1], 10) - 1; // Month is 0-indexed in JS
    const day = parseInt(dayMatch[1], 10);
    
    let hours = 0;
    let minutes = 0;
    
    if (hourMatch) {
      hours = parseInt(hourMatch[2], 10);
      minutes = parseInt(hourMatch[3], 10);
      
      // Adjust for AM/PM
      if (hourMatch[1] === '오후' && hours < 12) {
        hours += 12;
      } else if (hourMatch[1] === '오전' && hours === 12) {
        hours = 0;
      }
    }
    
    return new Date(year, month, day, hours, minutes);
  } catch (error) {
    console.error('Error parsing Korean date string:', error);
    // Return current date as fallback
    return new Date();
  }
};

/**
 * Generate ICS file content for a running plan
 */
export const generateICSFile = (
  title: string,
  startDateStr: string,
  duration: string,
  details: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Parse start date
    const startDate = parseKoreanDateString(startDateStr);
    
    // Parse duration to get end time
    let durationMinutes = 60; // Default to 1 hour
    try {
      const durationMatch = duration.match(/(\d+)\s*시간|(\d+)\s*분/g);
      if (durationMatch) {
        durationMinutes = 0;
        durationMatch.forEach(match => {
          const hourMatch = match.match(/(\d+)\s*시간/);
          const minuteMatch = match.match(/(\d+)\s*분/);
          
          if (hourMatch && hourMatch[1]) {
            durationMinutes += parseInt(hourMatch[1], 10) * 60;
          } else if (minuteMatch && minuteMatch[1]) {
            durationMinutes += parseInt(minuteMatch[1], 10);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing duration:', error);
    }
    
    // Calculate end date by adding duration
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
    
    // Create ICS event
    createEvents([
      {
        title,
        description: details,
        start: formatDateForICS(startDate),
        end: formatDateForICS(endDate),
        location: '',
        categories: ['러닝', '운동'],
        status: 'CONFIRMED',
        busyStatus: 'BUSY',
        productId: 'run-planner/ics'
      }
    ], (error, value) => {
      if (error) {
        reject(error);
      } else {
        resolve(value);
      }
    });
  });
}; 