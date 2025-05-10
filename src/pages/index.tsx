import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import ChatWindow, { Message } from '@/components/ChatWindow'
import ChatInput from '@/components/ChatInput'
import SummaryCard, { RunPlan } from '@/components/SummaryCard'
import Logo from '@/components/Logo'

// API 키 직접 설정 (주의: 실제 프로덕션 환경에서는 .env 파일 등을 사용하세요)
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [runPlan, setRunPlan] = useState<RunPlan | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize session ID on component mount
  useEffect(() => {
    // Generate a unique session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    // Add initial AI welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      text: '안녕하세요! 러닝 세션 계획을 도와드릴 Running Coach입니다 😀 오늘은 어떤 러닝 목표를 가지고 계신가요?',
      isUser: false,
    };
    setMessages([welcomeMessage]);
  }, []);

  // 메시지 전송 처리
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // 유저 메시지 추가
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // API 호출
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: text, 
          sessionId
        }),
      });
      
      if (!response.ok) {
        throw new Error('API 응답 오류');
      }
      
      const data = await response.json();
      
      // AI 응답 메시지 추가
      const aiMessage: Message = {
        id: data.id,
        text: data.text,
        isUser: false,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // 플랜 데이터가 있는 경우 요약 카드 표시
      if (data.planData) {
        setRunPlan(data.planData);
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      // 오류 메시지 추가
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: '메시지 전송 중 오류가 발생했습니다. 다시 시도해주세요.',
          isUser: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 캘린더 저장 처리
  const handleSaveToCalendar = async () => {
    if (!runPlan) return;
    
    try {
      // POST 요청으로 ICS 파일 생성
      const response = await fetch('/api/ical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: runPlan.title,
          date: runPlan.date,
          duration: runPlan.duration,
          details: runPlan.details,
        }),
      });
      
      if (!response.ok) {
        throw new Error('ICS 파일 생성 오류');
      }
      
      // 파일 다운로드
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'running_plan.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      // 성공 메시지 추가
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: '러닝 일정이 캘린더 파일로 저장되었습니다! 파일을 열어 캘린더에 추가하세요.',
          isUser: false,
        },
      ]);
    } catch (error) {
      console.error('캘린더 저장 오류:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: '캘린더 파일 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
          isUser: false,
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
      <Head>
        <title>뉴런(newrun) - AI 러닝 플래너</title>
        <meta name="description" content="AI로 러닝 계획을 세우고 캘린더에 등록하세요" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* 배경 블러 효과 (고정된 위치) */}
      <div className="blurred-circle"></div>

      <main className="flex flex-col flex-1 h-screen w-full max-w-md mx-auto relative">
        <div className="chat-container">
          {/* Logo */}
          <div className="flex justify-between items-center py-4 px-6 z-10">
            <Logo className="w-16 h-auto" />
          </div>
          
          {/* Chat Window */}
          <ChatWindow messages={messages} loading={isLoading} />
          
          {/* Running Plan Card */}
          {runPlan && (
            <div className="fixed top-20 left-0 right-0 mx-auto z-30 px-4">
              <SummaryCard plan={runPlan} onSaveToCalendar={handleSaveToCalendar} />
            </div>
          )}
          
          {/* Chat Input */}
          <div className="mt-4 mb-2 px-2">
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
} 