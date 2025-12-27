import React from 'react';
import ChatConversation from './ChatConversation';

interface ChatProps {
  onBack?: () => void;
}

const Chat: React.FC<ChatProps> = ({ onBack }) => {
  return <ChatConversation onBack={onBack} />;
};

export default Chat;
