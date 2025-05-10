import React from 'react';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isUser }) => {
  const cleanedMessage = message
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .trim();
  
  return (
    <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
      <div className={`${isUser ? 'chat-bubble-user-content' : 'chat-bubble-ai-content'}`}>
        {cleanedMessage}
      </div>
    </div>
  );
};

export default ChatBubble; 