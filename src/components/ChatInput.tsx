import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
      
      // 제출 후 텍스트 영역 크기 조정
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // 텍스트 영역 높이 자동 조정
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const lineHeight = 24; // 한 줄 높이
      const maxLines = 3; // 최대 3줄
      const newHeight = Math.min(textarea.scrollHeight, lineHeight * maxLines);
      textarea.style.height = `${newHeight}px`;
    }
  };

  // 메시지 변경 시 텍스트 영역 높이 조정
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // Enter 키 처리 (Shift+Enter는 줄바꿈)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input-container">
      <div className="w-full relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="러닝 플랜에 대해 물어보세요..."
          className="chat-input w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none overflow-auto"
          disabled={isLoading}
          rows={1}
          style={{ minHeight: '40px', maxHeight: '96px' }}
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        {!isLoading && message.trim() && (
          <button 
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-primary-400 rounded-full"
          >
            <Send size={16} className="text-white" />
          </button>
        )}
      </div>
    </form>
  );
};

export default ChatInput; 