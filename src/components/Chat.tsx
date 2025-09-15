import { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { apiService } from '../services/api';
import './Chat.css';

interface ChatProps {
  datasetId: string;
}

const Chat = ({ datasetId }: ChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState<string>(`conv_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      content: `Hello! I'm your AI assistant for analyzing the ${datasetId} dataset. You can ask me questions about the data, request specific analyses, or get insights. What would you like to know?`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'text',
    };
    setMessages([welcomeMessage]);
  }, [datasetId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await apiService.sendChatMessage(
        datasetId,
        inputMessage,
        conversationId
      );

      if (response.success && response.data) {
        const aiMessage: ChatMessage = {
          id: `ai_${Date.now()}`,
          content: response.data.message,
          sender: 'ai',
          timestamp: new Date(),
          type: response.data.type,
          data: response.data.data,
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          sender: 'ai',
          timestamp: new Date(),
          type: 'text',
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: 'Connection error. Please check your connection and try again.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const suggestions = [
    "What are the key trends in this dataset?",
    "Show me the top performing metrics",
    "What patterns do you see in the data?",
    "Generate a summary report",
    "What insights can you provide?",
    "Compare performance across different categories"
  ];

  return (
    <div className="section-container">
      <div className="section-header">
        <h2 className="section-title">AI Chat Assistant</h2>
        <p className="section-subtitle">
          Ask questions about your {datasetId} dataset and get AI-powered insights
        </p>
      </div>

      <div className="chat-container">
        {/* Chat Messages */}
        <div className="chat-messages">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
            >
              <div className="message-avatar">
                {message.sender === 'user' ? (
                  <div className="user-avatar">👤</div>
                ) : (
                  <div className="ai-avatar">🤖</div>
                )}
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  <div className="message-text">{message.content}</div>
                  {message.data && message.type === 'chart' && (
                    <div className="message-chart">
                      <div className="chart-placeholder-small">
                        📊 Chart visualization would appear here
                      </div>
                    </div>
                  )}
                  {message.data && message.type === 'table' && (
                    <div className="message-table">
                      <div className="table-placeholder-small">
                        📋 Table data would appear here
                      </div>
                    </div>
                  )}
                </div>
                <div className="message-timestamp">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message ai-message">
              <div className="message-avatar">
                <div className="ai-avatar">🤖</div>
              </div>
              <div className="message-content">
                <div className="message-bubble typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="chat-suggestions">
            <h4>Try asking about:</h4>
            <div className="suggestions-grid">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div className="chat-input-area">
          <div className="input-container">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your dataset..."
              className="chat-input"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="send-button"
            >
              {isLoading ? (
                <div className="loading-spinner-small"></div>
              ) : (
                <span className="send-icon">➤</span>
              )}
            </button>
          </div>
          <div className="input-help">
            <small>Press Enter to send • Shift+Enter for new line</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
