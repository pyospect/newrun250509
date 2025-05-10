import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { runningCoachPrompt } from './prompts';

// Initialize the Generative AI client
export const getAiClient = (apiKey?: string) => {
  // Use provided API key or look for environment variable
  const key = apiKey || process.env.GEMINI_API_KEY;
  
  if (!key) {
    throw new Error('Google AI API key is required. Please provide it or set GEMINI_API_KEY environment variable.');
  }
  
  return new GoogleGenerativeAI(key);
};

// Create a running plan using Google AI API
export const generateRunningPlan = async (
  conversationHistory: { role: 'user' | 'model'; text: string }[],
  apiKey?: string
) => {
  try {
    const genAI = getAiClient(apiKey);
    
    // 최신 Google AI 모델 사용
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash", // 최신 모델명 (실제 존재하는 모델)
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });
    
    // 외부 파일에서 시스템 프롬프트 가져오기
    const systemPrompt = runningCoachPrompt;
    
    // 대화 컨텍스트 구성
    let chatContext = "";
    
    // 최대 8개의 최근 대화 포함 (이전보다 더 많은 맥락 유지)
    const recentMessages = conversationHistory.slice(-8);
    if (recentMessages.length > 1) {
      chatContext = "이전 대화 내용:\n\n";
      recentMessages.forEach(msg => {
        const role = msg.role === 'user' ? '사용자' : '코치';
        chatContext += `${role}: ${msg.text}\n\n`;
      });
    }
    
    // 대화 맥락에서 수집된 정보 추출
    const userInfo = extractUserInfoFromContext(conversationHistory);
    if (Object.keys(userInfo).length > 0) {
      chatContext += "\n사용자 정보:\n";
      Object.entries(userInfo).forEach(([key, value]) => {
        chatContext += `${key}: ${value}\n`;
      });
      chatContext += "\n";
    }
    
    // 사용자의 최신 메시지 가져오기
    const lastUserMessage = getLastUserMessage(conversationHistory);
    
    // 전체 프롬프트 구성
    const fullPrompt = `${systemPrompt}
    
${chatContext}

사용자의 메시지: ${lastUserMessage}`;

    console.log("Calling Google AI API with prompt...");
    
    try {
      // 최신 API 방식으로 직접 콘텐츠 생성 요청
      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const text = response.text();
      
      console.log("API response received successfully");
      
      // JSON 데이터 추출 시도
      let planData = null;
      try {
        const jsonMatch = text.match(/```json\s*({[\s\S]*?})\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          planData = JSON.parse(jsonMatch[1]);
        }
      } catch (error) {
        console.error('Failed to parse JSON plan data:', error);
      }
      
      return {
        text,
        planData
      };
    } catch (error) {
      console.error('Error with Google AI API:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // API 호출 실패 시 모의 응답 사용
      const mockText = mockChatResponse(lastUserMessage, conversationHistory);
      const mockPlanData = createMockPlanData(lastUserMessage, conversationHistory);
      
      return {
        text: mockText,
        planData: mockPlanData
      };
    }
  } catch (error) {
    console.error('Error in generateRunningPlan:', error);
    
    // 항상 최소한의 응답 제공
    const mockText = mockChatResponse("러닝 계획", conversationHistory);
    
    return {
      text: mockText,
      planData: createMockPlanData("러닝 계획", conversationHistory)
    };
  }
};

// 사용자의 마지막 메시지 가져오기
function getLastUserMessage(history: { role: 'user' | 'model'; text: string }[]): string {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'user') {
      return history[i].text;
    }
  }
  return "러닝 계획에 대해 알려주세요"; // 기본 메시지
}

// 모의 응답 생성 함수 (API 호출 실패 시 사용)
function mockChatResponse(message: string, history?: { role: 'user' | 'model'; text: string }[]) {
  // 대화 히스토리가 있으면 사용자 정보 추출
  const userInfo = history ? extractUserInfoFromContext(history) : {};
  
  // 수집된 정보에 따른 맞춤형 응답
  const hasExperience = '경험 수준' in userInfo;
  const hasDistance = '목표 거리' in userInfo;
  const hasDate = '날짜 시간' in userInfo;
  const hasIntensity = '강도' in userInfo;
  const hasTime = '목표 시간' in userInfo || '목표 페이스' in userInfo;
  const hasFrequency = '주간 빈도' in userInfo;
  const hasGoal = '목표' in userInfo;
  const wantsNewPlan = '새 계획 요청' in userInfo;
  
  // 새 계획 요청 처리
  if (wantsNewPlan) {
    const newPlanResponses = [
      "새로운 러닝 계획을 원하시는군요! 😊 어떤 거리와 난이도로 새롭게 만들어드릴까요?",
      "기존 계획을 변경해드릴게요! 어떤 거리로 달리고 싶으신가요? 그리고 언제 달리실 계획인지도 알려주세요~",
      "새 러닝 플랜을 만들어 드릴게요! 목표 거리와 달리고 싶은 날짜를 알려주시면 바로 준비해드릴게요 👍"
    ];
    return randomSelect(newPlanResponses);
  }
  
  // 정보가 충분하면 플랜 제공
  if (hasExperience && hasDistance && hasDate && hasIntensity && hasTime) {
    const experience = userInfo['경험 수준'] || '초보자';
    const distance = userInfo['목표 거리'] || '5km';
    const date = userInfo['날짜 시간'] || '내일 아침';
    const time = userInfo['목표 시간'] || userInfo['목표 페이스'] || '';
    const intensity = userInfo['강도'] || '중간';
    
    const emojiOptions = ['😊', '👍', '🏃‍♀️', '🏃', '💪', '✨', '🌟'];
    const emoji = emojiOptions[Math.floor(Math.random() * emojiOptions.length)];
    
    const planResponses = [
      `${date}에 ${distance} 달리기 플랜이 준비됐어요! ${emoji} ${time ? time + ' 목표로 ' : ''}${intensity} 강도로 시작해보세요. 아래 위젯에서 세부 계획을 확인하실 수 있어요~`,
      `${experience} 수준에 맞는 ${distance} 플랜을 만들었어요! ${emoji} ${date}에 ${intensity} 강도로 진행하시면 좋을 것 같아요. 세부 계획은 아래 카드에서 확인하세요!`,
      `${date} ${distance} 러닝 계획이 완성됐어요! ${emoji} ${time}${intensity} 강도로 달리는 맞춤 플랜이니 참고하세요. 즐거운 러닝 되세요~`
    ];
    return randomSelect(planResponses);
  }
  
  // 정보 수집 단계 - 친근한 말투로 변경
  if (!hasDistance) {
    const distanceResponses = [
      "안녕하세요! 뉴런 러닝 코치예요~ 😊 어떤 거리를 목표로 하고 계신가요? 5km, 10km 등 알려주시면 맞춤 플랜을 만들어 드릴게요!",
      "반가워요! 러닝 플랜을 위해 목표 거리부터 알려주세요~ 5km, 10km 등 달리고 싶은 거리가 있으신가요? 🏃‍♀️",
      "안녕하세요! 뉴런 러닝 코치입니다~ 어떤 거리로 러닝 계획을 세워드릴까요? 목표 거리를 알려주세요! 😊"
    ];
    return randomSelect(distanceResponses);
  }
  
  if (hasDistance && !hasExperience) {
    return `${userInfo['목표 거리']} 러닝 플랜이군요! 👍 혹시 달리기 경험은 어느 정도인가요? 초보자, 중급자, 고급자 중에 골라주시면 맞춤 플랜을 만들어 드릴게요~`;
  }
  
  if (hasDistance && hasExperience && !hasDate) {
    return `${userInfo['경험 수준']}를 위한 ${userInfo['목표 거리']} 플랜이군요! 😊 언제 달리실 계획인가요? 내일, 주말 등 알려주시면 더 구체적인 계획을 세워드릴게요~`;
  }
  
  if (hasDistance && hasExperience && hasDate && !hasIntensity) {
    return `${userInfo['날짜 시간']}에 ${userInfo['목표 거리']} 달리실 계획이군요! 어느 정도 강도로 달리고 싶으신가요? 가벼움, 중간, 높음 중에 알려주세요~ 💪`;
  }
  
  if (hasDistance && hasExperience && hasDate && hasIntensity && !hasTime) {
    return `거의 다 왔어요! 👍 ${userInfo['목표 거리']}를 완주하는데 목표 시간이나, 페이스가 있으신가요? 예를 들어 "30분 안에" 또는 "킬로당 6분" 같은 목표요!`;
  }

  // 인사 응답
  if (message.toLowerCase().includes('안녕') || message.toLowerCase().includes('hi') || message.toLowerCase().includes('hello')) {
    const greetings = [
      "안녕하세요! 뉴런 러닝 코치예요~ 😊 오늘은 어떤 달리기 계획을 도와드릴까요?",
      "반가워요! 뉴런 러닝 코치입니다. 어떤 달리기 목표를 갖고 계신가요? 도와드릴게요! 👋",
      "안녕하세요! 달리기 계획을 함께 세워볼까요? 어떤 거리를 목표로 하고 계신지 알려주세요~ 🏃‍♀️"
    ];
    return randomSelect(greetings);
  }
  
  // 기본 응답
  const defaultResponses = [
    "뉴런 러닝 코치예요~ 💪 맞춤 러닝 플랜을 위해 목표 거리와 달리기 경험을 알려주세요!",
    "즐거운 러닝을 위한 맞춤 플랜을 만들어 드릴게요! 😊 목표 거리, 경험 수준, 그리고 언제 달리실 건지 알려주세요~",
    "안녕하세요! 뉴런과 함께 달려볼까요? 🏃‍♀️ 어떤 거리를 목표로 하시는지, 그리고 달리기 경험은 어느 정도인지 알려주세요!"
  ];
  return randomSelect(defaultResponses);
}

// 모의 플랜 데이터 생성 함수
function createMockPlanData(message: string, history?: { role: 'user' | 'model'; text: string }[]) {
  // 사용자 정보 추출
  const userInfo = history ? extractUserInfoFromContext(history) : {};
  
  // 기본값 설정
  const experience = userInfo['경험 수준'] || '초보자';
  const targetDistance = userInfo['목표 거리'] || '5km';
  const frequency = userInfo['주간 빈도'] || '주 3회';
  const goal = userInfo['목표'] || '';
  
  const now = new Date();
  
  // 랜덤 미래 날짜 생성 (1~7일 이내)
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + Math.floor(Math.random() * 7) + 1);
  
  // 오전 6시 ~ 오전 9시 사이 랜덤 시간
  const hour = 6 + Math.floor(Math.random() * 4);
  const minute = Math.floor(Math.random() * 6) * 10; // 0, 10, 20, 30, 40, 50
  
  const formattedDate = `${futureDate.getFullYear()}년 ${futureDate.getMonth() + 1}월 ${futureDate.getDate()}일 (${getKoreanDayOfWeek(futureDate)}) 오전 ${hour}:${minute < 10 ? '0' + minute : minute}`;

  // 추출된 거리 값 사용
  const distanceMatch = targetDistance.match(/(\d+)/);
  const distance = distanceMatch ? parseInt(distanceMatch[1]) : 5;
  
  // 초보자 플랜
  if (experience.includes('초보') || experience.includes('beginner')) {
    return {
      title: `${targetDistance} 초보자 러닝 플랜`,
      date: formattedDate,
      distance: targetDistance,
      duration: `약 ${distance * 7 + Math.floor(Math.random() * 10)}분`,
      intensity: '가벼움',
      details: `준비운동 5분 → ${Math.floor(Math.random() * 2) + 2}분 걷기/${Math.floor(Math.random() * 2) + 1}분 달리기 반복(총 ${distance * 5}분) → 정리운동 5분`
    };
  }
  
  // 중급자 플랜
  if (experience.includes('중급') || experience.includes('intermediate')) {
    return {
      title: `${targetDistance} 중급자 러닝 플랜`,
      date: formattedDate,
      distance: targetDistance,
      duration: `약 ${distance * 6 + Math.floor(Math.random() * 10)}분`,
      intensity: '중간',
      details: `준비운동 8분 → ${targetDistance} 일정 페이스로 달리기(${Math.floor(Math.random() * 2) + 5}:${Math.floor(Math.random() * 6)}0/km) → 정리운동 5분`
    };
  }
  
  // 고급자 플랜
  if (experience.includes('고급') || experience.includes('advanced')) {
    return {
      title: `${targetDistance} 고급자 인터벌 훈련`,
      date: formattedDate,
      distance: targetDistance,
      duration: `약 ${distance * 5 + Math.floor(Math.random() * 10)}분`,
      intensity: '높음',
      details: `준비운동 10분 → ${Math.floor(Math.random() * 2) + 3}00m 인터벌 x ${Math.floor(Math.random() * 3) + 6}회(빠른 페이스) → 정리운동 8분`
    };
  }
  
  // 달리기 거리에 따른 기본 플랜
  return {
    title: `${targetDistance} ${frequency} 러닝 플랜${goal ? ` (${goal})` : ''}`,
    date: formattedDate,
    distance: targetDistance,
    duration: `약 ${distance * 6 + Math.floor(Math.random() * 15)}분`,
    intensity: '중간',
    details: `준비운동 ${5 + Math.floor(Math.random() * 5)}분 → ${Math.floor(Math.random() * 2) + 5}:${Math.floor(Math.random() * 6)}0/km 페이스로 ${targetDistance} 달리기 → 정리운동 ${5 + Math.floor(Math.random() * 3)}분`
  };
}

// 한국어 요일 변환 함수
function getKoreanDayOfWeek(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
}

// 배열에서 무작위 요소 선택 헬퍼 함수
function randomSelect<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 대화 맥락에서 사용자 정보 추출하는 헬퍼 함수
function extractUserInfoFromContext(history: { role: 'user' | 'model'; text: string }[]): Record<string, string> {
  const userInfo: Record<string, string> = {};
  
  // 경험 수준 추출
  const experienceRegex = /(초보자|초보|입문자|beginner|중급자|중급|intermediate|고급자|고급|advanced)/i;
  const distanceRegex = /(\d+)[\s]*(km|킬로미터|kilometer|k|킬로)/i;
  const frequencyRegex = /(주|week)[\s]*(\d+)[\s]*(회|번|times|time)/i;
  const timeRegex = /(\d+)[\s]*(분|시간|hours?|minutes?|mins?)/i;
  const paceRegex = /(페이스|pace|킬로[당미]|km[당미])[\s]*(\d+)[\s]*(분|초|초?)/i;
  const dateRegex = /(오늘|내일|모레|다음주|weekend|주말|월요일|화요일|수요일|목요일|금요일|토요일|일요일|아침|점심|저녁|오전|오후|새벽)/i;
  const intensityRegex = /(가볍|낮|쉽|편안|중간|보통|높|강한?|hard|moderate|easy|light|intense)/i;
  const goalRegex = /(체중[\s]*감량|다이어트|대회|마라톤|체력|건강|health|weight|diet|race|competition|marathon)/i;
  
  for (const message of history) {
    if (message.role === 'user') {
      const text = message.text.toLowerCase();
      
      // 경험 수준 매칭
      const expMatch = text.match(experienceRegex);
      if (expMatch && !userInfo['경험 수준']) {
        userInfo['경험 수준'] = expMatch[0];
      }
      
      // 거리 매칭
      const distMatch = text.match(distanceRegex);
      if (distMatch && !userInfo['목표 거리']) {
        userInfo['목표 거리'] = `${distMatch[1]}km`;
      }
      
      // 빈도 매칭
      const freqMatch = text.match(frequencyRegex);
      if (freqMatch && !userInfo['주간 빈도']) {
        userInfo['주간 빈도'] = `주 ${freqMatch[2]}회`;
      }
      
      // 시간 목표 매칭
      const timeMatch = text.match(timeRegex);
      if (timeMatch && !userInfo['목표 시간']) {
        const unit = timeMatch[2].includes('시') || timeMatch[2].includes('hour') ? '시간' : '분';
        userInfo['목표 시간'] = `${timeMatch[1]}${unit}`;
      }
      
      // 페이스 매칭
      const paceMatch = text.match(paceRegex);
      if (paceMatch && !userInfo['목표 페이스']) {
        userInfo['목표 페이스'] = `킬로당 ${paceMatch[2]}분`;
      }
      
      // 날짜 매칭
      const dateMatch = text.match(dateRegex);
      if (dateMatch && !userInfo['날짜 시간']) {
        userInfo['날짜 시간'] = dateMatch[0];
      }
      
      // 강도 매칭
      const intensityMatch = text.match(intensityRegex);
      if (intensityMatch && !userInfo['강도']) {
        const intensity = intensityMatch[0];
        if (intensity.includes('가볍') || intensity.includes('낮') || intensity.includes('쉽') || 
            intensity.includes('편안') || intensity.includes('easy') || intensity.includes('light')) {
          userInfo['강도'] = '가벼움';
        } else if (intensity.includes('중간') || intensity.includes('보통') || intensity.includes('moderate')) {
          userInfo['강도'] = '중간';
        } else {
          userInfo['강도'] = '높음';
        }
      }
      
      // 목표 매칭
      const goalMatch = text.match(goalRegex);
      if (goalMatch && !userInfo['목표']) {
        userInfo['목표'] = goalMatch[0];
      }
      
      // 새 계획 요청 여부 (위젯 삭제/재생성 관련)
      if (text.includes('새로운') || text.includes('새 계획') || text.includes('다시') || 
          text.includes('바꿔') || text.includes('변경') || text.includes('삭제') || 
          text.includes('지워') || text.includes('없애') || text.includes('취소')) {
        userInfo['새 계획 요청'] = 'true';
      }
    }
  }
  
  return userInfo;
} 