import React, { useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface ChatWindowProps {
  messages: Message[];
  loading?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, loading = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-window px-4 py-4">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 z-10 h-full min-h-[50vh]">
          <p className="text-center">
            안녕하세요! 러닝 계획에 대해 물어보세요.
          </p>
          <p className="text-center text-sm mt-2">
            예: "이번 주말에 10km 러닝을 하고 싶어요. 계획을 짜주세요."
          </p>
        </div>
      ) : (
        <div className="flex flex-col z-10 w-full pb-10">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg.text} isUser={msg.isUser} />
          ))}
        </div>
      )}
      
      {loading && (
        <div className="chat-bubble chat-bubble-ai z-10">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow; 