'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeftIcon, HeartIcon, InformationCircleIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid'
import { getNPCData, DialogueOption, ConversationEntry, addConversationEntry, updateNPCRelationship, NPCData } from '../../data/npcData'
import { useRouter } from 'next/navigation'
import React, { use } from 'react'

// 使用标准的 Next.js 15 参数格式
export default function NPCDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [npc, setNpc] = useState<NPCData | null>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'info' | 'relationship'>('chat')
  const [userInput, setUserInput] = useState('')
  const [conversations, setConversations] = useState<ConversationEntry[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  // 使用 React.use 访问异步参数
  const { id } = use(params) || { id: '' };
  
  useEffect(() => {
    if (!id) {
      router.push('/npc');
      return;
    }
    
    // Load NPC data
    const npcData = getNPCData(id)
    if (npcData) {
      setNpc(npcData)
      setConversations(npcData.conversationHistory)
    } else {
      // If NPC doesn't exist, redirect back to NPC list
      router.push('/npc')
    }
  }, [id, router])
  
  useEffect(() => {
    // Scroll to bottom of chat when conversation updates
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversations])

  if (!npc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-white">加载中...</div>
      </div>
    )
  }

  // Handle sending user message
  const handleSendMessage = () => {
    if (!userInput.trim()) return
    
    // Add user message to conversation
    const userEntry: Omit<ConversationEntry, 'id' | 'timestamp'> = {
      speaker: 'user',
      text: userInput.trim()
    }
    
    addConversationEntry(npc.id, userEntry)
    
    // Update state
    setConversations([...conversations, {
      id: `conv-${Date.now()}-user`,
      speaker: 'user',
      text: userInput.trim(),
      timestamp: Date.now()
    }])
    
    // Clear input
    setUserInput('')
    
    // Generate NPC response
    setTimeout(() => {
      const relationshipChange = npc.favoriteResponse(userInput) ? 2 : 0
      
      // Add relationship points if the NPC likes the message
      if (relationshipChange > 0) {
        updateNPCRelationship(npc.id, relationshipChange)
      }
      
      // Generate a response
      const npcEntry: Omit<ConversationEntry, 'id' | 'timestamp'> = {
        speaker: 'npc',
        text: generateResponse(userInput)
      }
      
      addConversationEntry(npc.id, npcEntry)
      
      // Update state
      setConversations(prev => [...prev, {
        id: `conv-${Date.now()}-npc`,
        speaker: 'npc',
        text: npcEntry.text,
        timestamp: Date.now()
      }])
    }, 800)
  }
  
  // Generate NPC response based on user input
  const generateResponse = (input: string): string => {
    // Check if input matches any dialogue options
    const matchingOption = npc.dialogueOptions.find(option => 
      input.toLowerCase().includes(option.text.toLowerCase())
    )
    
    if (matchingOption) {
      // Use predefined responses for recognized questions
      updateNPCRelationship(npc.id, matchingOption.relationshipEffect)
      return matchingOption.responseTexts[Math.floor(Math.random() * matchingOption.responseTexts.length)]
    } else if (npc.favoriteResponse(input)) {
      // NPC likes this topic
      return `这是个很有趣的话题。作为${npc.name}，我很欣赏你对${npc.interests[0]}的兴趣。`
    } else {
      // Generic responses
      const genericResponses = [
        `嗯，这倒是个有意思的问题。`,
        `让我思考一下这个问题...`,
        `作为${npc.name}，我对这个问题有些看法。`,
        `这个问题很深奥，值得我们探讨。`,
        `我想我们可以从不同角度来思考这个问题。`
      ]
      return genericResponses[Math.floor(Math.random() * genericResponses.length)]
    }
  }
  
  // Handle preset dialogue option click
  const handleDialogueOptionClick = (option: DialogueOption) => {
    // Add user message using the dialogue option text
    const userEntry: Omit<ConversationEntry, 'id' | 'timestamp'> = {
      speaker: 'user',
      text: option.text
    }
    
    addConversationEntry(npc.id, userEntry)
    
    // Update state
    setConversations([...conversations, {
      id: `conv-${Date.now()}-user`,
      speaker: 'user',
      text: option.text,
      timestamp: Date.now()
    }])
    
    // Generate NPC response with delay
    setTimeout(() => {
      // Add relationship points
      updateNPCRelationship(npc.id, option.relationshipEffect)
      
      // Get a random response from the option's responseTexts
      const responseText = option.responseTexts[Math.floor(Math.random() * option.responseTexts.length)]
      
      const npcEntry: Omit<ConversationEntry, 'id' | 'timestamp'> = {
        speaker: 'npc',
        text: responseText
      }
      
      addConversationEntry(npc.id, npcEntry)
      
      // Update state
      setConversations(prev => [...prev, {
        id: `conv-${Date.now()}-npc`,
        speaker: 'npc',
        text: responseText,
        timestamp: Date.now()
      }])
    }, 800)
  }
  
  // Get relationship level description
  const getRelationshipLevel = (value: number): string => {
    if (value >= 90) return '知己'
    if (value >= 75) return '挚友'
    if (value >= 60) return '好友'
    if (value >= 40) return '相识'
    if (value >= 20) return '点头之交'
    return '陌生人'
  }
  
  // Format timestamp
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen p-6">
      {/* Back Button */}
      <Link href="/npc">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="mb-8 flex items-center text-white hover:text-gray-300"
        >
          <ArrowLeftIcon className="h-6 w-6 mr-2" />
          返回NPC列表
        </motion.button>
      </Link>

      <div className="max-w-6xl mx-auto">
        {/* NPC Header */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <div className="text-6xl mr-6">{npc.icon}</div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{npc.name}</h1>
              <p className="text-gray-300">{npc.description}</p>
              <div className="mt-2 flex items-center">
                <div className="w-32 bg-gray-700 rounded-full h-2 mr-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full"
                    style={{ width: `${npc.relationship}%` }}
                  ></div>
                </div>
                <span className="text-white">{npc.relationship}</span>
                <span className="text-gray-400 ml-1">({getRelationshipLevel(npc.relationship)})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-t-lg overflow-hidden mb-1">
          <div className="flex space-x-1 p-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === 'chat' 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
              对话
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === 'info' 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <InformationCircleIcon className="w-5 h-5 mr-2" />
              信息
            </button>
            <button
              onClick={() => setActiveTab('relationship')}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg ${
                activeTab === 'relationship' 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <HeartIcon className="w-5 h-5 mr-2" />
              好感度
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-gray-700 rounded-b-lg rounded-tr-lg p-6 min-h-[60vh]">
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[60vh]">
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                {conversations.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    开始与{npc.name}的对话吧！
                  </div>
                ) : (
                  <>
                    {conversations.map((entry) => (
                      <div 
                        key={entry.id} 
                        className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] rounded-lg p-3 ${
                          entry.speaker === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-800 text-white'
                        }`}>
                          <p>{entry.text}</p>
                          <div className={`text-xs mt-1 ${
                            entry.speaker === 'user' ? 'text-blue-200' : 'text-gray-400'
                          }`}>
                            {formatTime(entry.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </>
                )}
              </div>
              
              {/* Dialogue options */}
              <div className="mb-4 flex flex-wrap gap-2">
                {npc.dialogueOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleDialogueOptionClick(option)}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-900 text-gray-200 text-sm rounded-full transition-colors"
                  >
                    {option.text}
                  </button>
                ))}
              </div>
              
              {/* Input area */}
              <div className="flex mt-auto">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`对${npc.name}说些什么...`}
                  className="flex-1 bg-gray-800 text-white rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  发送
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">背景故事</h3>
                <p className="text-gray-300">{npc.background}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">性格特点</h3>
                <p className="text-gray-300">{npc.personality}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">兴趣爱好</h3>
                <div className="flex flex-wrap gap-2">
                  {npc.interests.map((interest, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 bg-gray-800 text-gray-200 text-sm rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'relationship' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">好感度</h3>
                <div className="w-full bg-gray-800 rounded-full h-4 mb-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-pink-500 h-4 rounded-full"
                    style={{ width: `${npc.relationship}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
                <div className="mt-4 text-center">
                  <span className="text-xl font-bold text-white">{npc.relationship}</span>
                  <span className="text-gray-300 ml-2">({getRelationshipLevel(npc.relationship)})</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">提升好感度</h3>
                <p className="text-gray-300 mb-2">
                  与{npc.name}交流他/她感兴趣的话题，可以提升好感度。
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {npc.interests.map((interest, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 bg-gray-800 text-gray-200 text-sm rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
                <p className="text-gray-300">使用预设对话选项也可以提升好感度。</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 