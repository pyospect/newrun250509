import type { NextApiRequest, NextApiResponse } from 'next';
import { generateRunningPlan } from '@/lib/aiClient';

type ChatResponse = {
  text: string;
  id: string;
  planData?: any; // RunPlan data when available
};

// In-memory storage for conversation history (will be reset on server restart)
// In a production app, you would store this in a database or session
const conversationHistories: Record<string, { role: 'user' | 'model'; text: string }[]> = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse>
) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  try {
    const { message, sessionId } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!message || typeof message !== 'string') {
      res.status(400).json({ 
        text: '메시지가 올바르지 않습니다.', 
        id: Date.now().toString() 
      });
      return;
    }
    
    if (!apiKey) {
      res.status(400).json({ 
        text: 'API 키가 필요합니다. 앱 설정을 확인해주세요.', 
        id: Date.now().toString() 
      });
      return;
    }
    
    // Create or get session history
    const sid = sessionId || 'default';
    if (!conversationHistories[sid]) {
      conversationHistories[sid] = [];
    }
    
    // 대화 히스토리가 너무 길어지지 않도록 최대 10개 메시지만 유지
    if (conversationHistories[sid].length >= 20) {
      // 처음 메시지는 시스템 프롬프트일 수 있으므로 유지
      const firstMessage = conversationHistories[sid][0];
      // 최근 9개 메시지만 유지
      conversationHistories[sid] = [
        firstMessage,
        ...conversationHistories[sid].slice(-9)
      ];
    }
    
    // Add user message to history
    conversationHistories[sid].push({
      role: 'user',
      text: message
    });
    
    // Call Gemini API
    try {
      console.log(`Calling Gemini API with session ${sid}, message: ${message.substring(0, 50)}...`);
      
      // 항상 API 키를 전달
      const response = await generateRunningPlan(conversationHistories[sid], apiKey);
      
      // Add AI response to history
      conversationHistories[sid].push({
        role: 'model',
        text: response.text
      });
      
      // Send response with plan data if available
      res.status(200).json({
        text: response.text,
        id: Date.now().toString(),
        planData: response.planData
      });
    } catch (apiError) {
      console.error('Gemini API Error:', apiError);
      
      // 서버 로그를 위한 에러 정보
      if (apiError instanceof Error) {
        console.error(`Error message: ${apiError.message}`);
        console.error(`Error stack: ${apiError.stack}`);
      }
      
      // Fallback to mock response if API fails
      const mockResponse = mockChatResponse(message);
      
      // Add mock response to history
      conversationHistories[sid].push({
        role: 'model',
        text: mockResponse
      });
      
      // 모의 플랜 데이터 생성
      const mockPlanData = createMockPlanData(message);
      
      res.status(200).json({
        text: mockResponse,
        id: Date.now().toString(),
        planData: mockPlanData
      });
    }
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ 
      text: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 
      id: Date.now().toString() 
    });
  }
}

// Fallback mock response (used when Gemini API fails or for testing)
const mockChatResponse = (message: string) => {
  // 더 구체적인 응답 패턴
  if (message.toLowerCase().includes('안녕') || message.toLowerCase().includes('hi') || message.toLowerCase().includes('hello')) {
    return '안녕하세요! 저는 러닝 코치입니다. 오늘은 어떤 러닝 계획을 도와드릴까요? 평소 달리기 경험이나 목표 거리가 있으신가요?';
  }
  
  if (message.toLowerCase().includes('처음') || message.toLowerCase().includes('초보') || message.toLowerCase().includes('beginner')) {
    return '처음 달리기를 시작하시는군요! 좋습니다. 초보자에게는 걷기와 달리기를 번갈아가며 시작하는 방법을 추천해 드려요. 예를 들어 2분 걷고 1분 달리기를 반복하는 방식으로 20-30분간 운동하는 것이 좋습니다. 점차 달리는 시간을 늘려가세요. 운동화는 편안한 것으로 선택하시고, 무리하지 않는 것이 중요합니다. 특정 프로그램을 원하시나요?';
  }
  
  if (message.toLowerCase().includes('5k') || message.toLowerCase().includes('5km') || (message.includes('5') && message.includes('km'))) {
    return '5km 러닝을 준비하고 계시군요! 좋은 목표입니다. 처음 5km에 도전하신다면, 4-6주 정도의 훈련 계획이 필요합니다. 주 3-4회, 각 30-40분씩 훈련하는 것이 좋으며, 처음에는 걷기와 달리기를 번갈아가면서 점차 달리는 시간을 늘려가는 것이 좋습니다. 구체적인 주간 계획을 세워드릴까요?';
  }
  
  if (message.toLowerCase().includes('10k') || message.toLowerCase().includes('10km') || (message.includes('10') && message.includes('km'))) {
    return '10km 러닝을 계획하고 계시는군요! 훌륭합니다. 10km 훈련은 기초 체력이 중요합니다. 이미 5km를 완주할 수 있다면, 8-10주간의 훈련으로 10km에 도전할 수 있습니다. 주 4회 훈련을 권장하며, 긴 거리 달리기 1회(점진적으로 6km→8km→10km로 늘림), 짧은 인터벌 훈련 1회, 가벼운 조깅 2회로 구성하는 것이 효과적입니다. 어떤 현재 러닝 경험이 있으신가요?';
  }
  
  if (message.toLowerCase().includes('마라톤') || message.toLowerCase().includes('marathon') || message.toLowerCase().includes('42km')) {
    return '마라톤 도전을 고려하고 계시는군요! 마라톤은 체계적인 훈련이 필요합니다. 하프 마라톤을 완주한 경험이 있다면, 16-20주 훈련 프로그램을 추천드립니다. 주요 훈련은 긴 거리 달리기(최대 32-35km까지), 템포 런, 인터벌 훈련으로 구성됩니다. 주 4-5회 훈련하며, 회복과 영양 관리도 중요합니다. 현재 달리기 경험과 목표 완주 시간이 있으신가요?';
  }
  
  if (message.toLowerCase().includes('부상') || message.toLowerCase().includes('injury') || message.toLowerCase().includes('아파')) {
    return '부상 관리는 러닝에서 매우 중요합니다. 통증이 있다면 우선 충분한 휴식을 취하세요. RICE(Rest, Ice, Compression, Elevation) 요법을 적용하고, 심한 통증이 지속되면 전문의 상담을 권장합니다. 부상 후 러닝 복귀는 천천히 진행해야 합니다. 초기에는 거리와 강도를 50% 정도로 줄이고, 2주에 걸쳐 점진적으로 늘려가세요. 구체적으로 어떤 부위에 통증이 있으신가요?';
  }
  
  if (message.toLowerCase().includes('페이스') || message.toLowerCase().includes('pace') || message.toLowerCase().includes('속도')) {
    return '적절한 러닝 페이스는 목표와 경험에 따라 다릅니다. 초보자는 대화가 가능한 정도의 편안한 페이스(약 6:30-7:30/km)로 달리는 것이 좋습니다. 5km 목표가 있다면 약 6:00/km, 10km는 6:15/km, 하프 마라톤은 6:30/km, 풀 마라톤은 6:45/km 정도가 초보-중급자의 평균적인 페이스입니다. 주 훈련의 80%는 편안한 페이스로, 20%는 더 빠른 페이스로 진행하는 것이 효과적입니다. 현재 어느 정도의 페이스로 달리고 계신가요?';
  }
  
  if (message.toLowerCase().includes('식단') || message.toLowerCase().includes('영양') || message.toLowerCase().includes('nutrition') || message.toLowerCase().includes('diet')) {
    return '러너를 위한 영양 관리는 중요합니다. 탄수화물(전체 칼로리의 50-60%), 단백질(15-20%), 건강한 지방(20-30%)의 균형 잡힌 식단이 좋습니다. 장거리 달리기 전에는 탄수화물 비중을 높이고, 달리기 30-60분 전에 가볍게 탄수화물 위주로 섭취하세요. 달리기 후에는 30분 이내에 단백질과 탄수화물을 함께 섭취하는 것이 회복에 도움이 됩니다. 수분 섭취도 매우 중요합니다. 특별히 궁금한 부분이 있으신가요?';
  }
  
  if (message.toLowerCase().includes('장비') || message.toLowerCase().includes('신발') || message.toLowerCase().includes('shoes') || message.toLowerCase().includes('gear')) {
    return '좋은 러닝 장비는 경험을 크게 향상시킵니다. 가장 중요한 것은 자신의 발 형태와 러닝 스타일에 맞는 러닝화입니다. 전문 러닝 매장에서 발 분석(gait analysis)을 받아보는 것을 추천합니다. 기능성 의류는 땀 배출이 잘 되는 소재가 좋으며, 계절에 맞는 레이어링이 중요합니다. 또한 장거리 러닝 시에는 수분과 영양 보충을 위한 벨트나 수분 팩도 고려해보세요. 어떤 종류의 장비에 관심이 있으신가요?';
  }
  
  // 일반적인 러닝 관련 질문
  if (message.toLowerCase().includes('러닝') || message.toLowerCase().includes('달리기') || message.toLowerCase().includes('running') || message.toLowerCase().includes('jogging')) {
    return '러닝은 신체적, 정신적 건강에 매우 좋은 운동입니다. 좋은 러닝 계획을 세우기 위해서는 현재 체력 수준, 목표, 가용 시간을 고려해야 합니다. 초보자라면 주 3회, 각 20-30분부터 시작하여 점진적으로 늘려가는 것이 좋습니다. 정기적인 러닝은 심폐 기능 강화, 스트레스 감소, 수면 개선 등의 효과가 있습니다. 구체적인 목표나 질문이 있으시면 말씀해주세요.';
  }
  
  if (message.toLowerCase().includes('계획') || message.toLowerCase().includes('플랜') || message.toLowerCase().includes('plan') || message.toLowerCase().includes('schedule')) {
    return '효과적인 러닝 계획은 목표, 현재 체력 수준, 그리고 생활 패턴을 고려해야 합니다. 초보자는 주 3-4회, 중급자는 4-5회, 고급자는 5-6회 훈련이 적절합니다. 훈련의 종류도 다양화하는 것이 좋습니다: 긴 거리 달리기(총 거리의 30-40%), 회복 달리기, 속도 훈련(인터벌, 템포 런)을 포함시키세요. 또한 최소 1-2일의 휴식일을 반드시 포함해야 합니다. 어떤 수준의 러닝 계획이 필요하신가요?';
  }
  
  // 기본 응답
  return '러닝 계획에 대해 도움이 필요하시군요. 현재 달리기 경험, 목표 거리, 목표 시간 등을 알려주시면 더 구체적인 계획을 세워드릴 수 있습니다. 평소 운동 빈도나 건강 상태에 대해서도 알려주시면 도움이 됩니다. 어떤 부분에 관심이 있으신가요?';
};

// 모의 플랜 데이터 생성 함수
function createMockPlanData(message: string) {
  const now = new Date();
  const formattedDate = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${getKoreanDayOfWeek(now)}) 오전 7:00`;
  
  // 5km 러닝 플랜
  if (message.toLowerCase().includes('5k') || message.toLowerCase().includes('5km') || 
      (message.includes('5') && message.includes('km'))) {
    return {
      title: '초보자를 위한 5K 러닝 플랜',
      date: formattedDate,
      distance: '5 km',
      duration: '약 35분',
      intensity: '가벼움 - 중간',
      details: '준비운동 5분 → 5분 조깅/1분 걷기 반복(총 25분) → 정리운동 5분'
    };
  }
  
  // 10km 러닝 플랜
  if (message.toLowerCase().includes('10k') || message.toLowerCase().includes('10km') || 
      (message.includes('10') && message.includes('km'))) {
    return {
      title: '중급자를 위한 10K 러닝 플랜',
      date: formattedDate,
      distance: '10 km',
      duration: '약 1시간',
      intensity: '중간',
      details: '준비운동 10분 → 5:30-6:00/km 페이스로 10km 달리기 → 정리운동 5분'
    };
  }
  
  // 기본 주말 러닝 플랜
  return {
    title: '주말 러닝 플랜',
    date: formattedDate,
    distance: '7 km',
    duration: '약 45분',
    intensity: '중간',
    details: '준비운동 8분 → 6:00/km 페이스로 편안하게 7km 달리기 → 정리운동 7분'
  };
}

// 한국어 요일 변환 함수
function getKoreanDayOfWeek(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
} 