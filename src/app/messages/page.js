'use client';

import { useState } from 'react';
import Image from 'next/image';
import Sidebar from '../components/Sidebar';

const mockChats = [
  {
    id: 1,
    name: 'John Smith',
    avatar: '/avatars/john.jpg',
    lastMessage: 'Hey, I have a question about the Rock Revolt event...',
    time: '2 min ago',
    unread: 2,
    online: true
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    avatar: '/avatars/sarah.jpg',
    lastMessage: 'The ticket sales are going great! We\'ve already sold...',
    time: '1 hour ago',
    unread: 0,
    online: true
  },
  {
    id: 3,
    name: 'Michael Chen',
    avatar: '/avatars/michael.jpg',
    lastMessage: 'I\'ve updated the event description as requested.',
    time: '2 hours ago',
    unread: 1,
    online: false
  }
];

const mockMessages = [
  {
    id: 1,
    sender: 'John Smith',
    avatar: '/avatars/john.jpg',
    content: 'Hey, I have a question about the Rock Revolt event. What\'s the maximum capacity?',
    time: '2:30 PM',
    type: 'received'
  },
  {
    id: 2,
    sender: 'You',
    content: 'Hi John! The maximum capacity for Rock Revolt is 500 people.',
    time: '2:32 PM',
    type: 'sent'
  },
  {
    id: 3,
    sender: 'John Smith',
    avatar: '/avatars/john.jpg',
    content: 'Great, thanks! And is there parking available at the venue?',
    time: '2:33 PM',
    type: 'received'
  },
  {
    id: 4,
    sender: 'You',
    content: 'Yes, there\'s a parking lot that can accommodate up to 200 cars. It\'s included in the ticket price.',
    time: '2:35 PM',
    type: 'sent'
  }
];

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState(mockChats[0]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Add message handling logic here
    setNewMessage('');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex justify-between items-center px-8 py-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Messages</div>
              <h1 className="text-2xl font-semibold">Messages</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                <div>
                  <div className="text-sm font-medium">Jennifer King</div>
                  <div className="text-xs text-gray-500">@rightrealestate</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex h-[calc(100vh-73px)]">
          {/* Chat List */}
          <div className="w-80 bg-white border-r border-gray-200">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Chat List */}
            <div className="overflow-y-auto h-full">
              {mockChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedChat.id === chat.id ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-gray-200 relative overflow-hidden">
                        <Image
                          src={chat.avatar}
                          alt={chat.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      {chat.online && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{chat.name}</h3>
                        <span className="text-xs text-gray-500">{chat.time}</span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                    </div>
                    {chat.unread > 0 && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-pink-500 text-xs font-medium text-white">
                          {chat.unread}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gray-200 relative overflow-hidden">
                    <Image
                      src={selectedChat.avatar}
                      alt={selectedChat.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {selectedChat.online && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{selectedChat.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedChat.online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {mockMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end gap-2 max-w-[70%] ${message.type === 'sent' ? 'flex-row-reverse' : ''}`}>
                    {message.type === 'received' && (
                      <div className="h-8 w-8 rounded-full bg-gray-200 relative overflow-hidden flex-shrink-0">
                        <Image
                          src={message.avatar}
                          alt={message.sender}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className={`rounded-lg p-3 ${
                      message.type === 'sent'
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'sent' ? 'text-pink-100' : 'text-gray-500'
                      }`}>
                        {message.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 