'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeftIcon, ChatBubbleLeftRightIcon, HeartIcon, SparklesIcon } from '@heroicons/react/24/solid'
import { getAllNPCs, NPCData } from '../data/npcData'

// NPC Card component to make the design more modular
const NPCCard = ({ npc }: { npc: NPCData }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Link href={`/npc/${npc.id}`} className="block h-full no-underline hover:no-underline visited:text-inherit">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-xl h-full border border-gray-700 transition-all duration-300 hover:shadow-2xl hover:border-indigo-500/30 flex flex-col">
          {/* Card Header with Icon and Name */}
          <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 p-3 border-b border-gray-700">
            <div className="flex items-center">
              <div className="text-3xl mr-3 bg-gradient-to-br from-indigo-400 to-purple-500 p-2 rounded-full shadow-inner">
                {npc.icon}
              </div>
              <div className="overflow-hidden">
                <h2 className="text-base font-bold text-white truncate">{npc.name}</h2>
                <p className="text-indigo-300 text-xs truncate">{npc.description}</p>
              </div>
            </div>
          </div>
          
          {/* Card Body with Details */}
          <div className="p-3 space-y-2.5 flex-grow">
            <div>
              <h3 className="text-xs font-medium text-gray-400 flex items-center">
                <SparklesIcon className="h-3 w-3 mr-1.5 text-indigo-400" />
                背景
              </h3>
              <p className="text-gray-300 text-xs mt-1 line-clamp-2">{npc.background}</p>
            </div>
            
            <div>
              <h3 className="text-xs font-medium text-gray-400 flex items-center">
                <HeartIcon className="h-3 w-3 mr-1.5 text-pink-400" />
                好感度
              </h3>
              <div className="mt-1.5 relative">
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-rose-500 h-1.5 rounded-full"
                    style={{ width: `${npc.relationship}%` }}
                  ></div>
                </div>
                <span className="absolute -right-1 -top-1 text-2xs font-medium text-pink-300">
                  {npc.relationship}%
                </span>
              </div>
            </div>
            
            <div>
              <h3 className="text-xs font-medium text-gray-400 flex items-center">
                <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1.5 text-blue-400" />
                兴趣
              </h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {npc.interests.map((interest, index) => (
                  <span 
                    key={index} 
                    className="px-1.5 py-0.5 bg-indigo-900/50 text-indigo-200 text-2xs rounded-full border border-indigo-700/50"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Card Footer with Action Button */}
          <div className="px-3 pb-3 pt-1">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg text-white font-medium shadow-lg shadow-indigo-700/20 transition-all flex items-center justify-center"
            >
              <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
              <span className="text-xs">开始对话</span>
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// Masonry grid layout component
const NPCGrid = ({ npcs }: { npcs: NPCData[] }) => {
  // 默认使用3列作为初始状态，避免服务端与客户端不匹配
  const [columns, setColumns] = useState(3);
  
  // 在组件挂载后执行的操作
  useEffect(() => {
    const getColumnsForScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) return 1;      // xs: 1 column
      if (width < 768) return 2;      // sm: 2 columns  
      if (width < 1024) return 3;     // md: 3 columns
      if (width < 1280) return 4;     // lg: 4 columns
      return 5;                       // xl: 5 columns
    };
    
    setColumns(getColumnsForScreenSize());
    
    const handleResize = () => {
      setColumns(getColumnsForScreenSize());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 将 NPCs 分配到各列
  const columnedNPCs = useMemo(() => {
    const result: NPCData[][] = Array.from({ length: columns }, () => []);
    npcs.forEach((npc, i) => {
      result[i % columns].push(npc);
    });
    return result;
  }, [npcs, columns]);
  
  return (
    <div className="flex gap-3 w-full">
      {columnedNPCs.map((columnNPCs, columnIndex) => (
        <div key={columnIndex} className="flex-1 flex flex-col gap-3">
          {columnNPCs.map((npc, npcIndex) => (
            <motion.div
              key={npc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: (columnIndex * 0.1) + (npcIndex * 0.05)
              }}
            >
              <NPCCard npc={npc} />
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default function NPCPage() {
  const [npcs, setNpcs] = useState<NPCData[]>([])

  useEffect(() => {
    // Get all NPCs
    const allNPCs = getAllNPCs()
    setNpcs(allNPCs)
  }, [])

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-b from-gray-900 to-black">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-5">
        <div className="flex justify-between items-center mb-5">
          {/* Back Button */}
          <Link href="/garden" className="no-underline hover:no-underline visited:text-inherit">
            <motion.button
              whileHover={{ scale: 1.05, x: -3 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center text-white hover:text-indigo-300 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
              <span className="text-sm">返回家园</span>
            </motion.button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
            家园NPC
          </h1>
          
          <p className="text-xs sm:text-sm text-gray-300 mb-5 max-w-3xl">
            与您家园中的NPC互动，了解他们的背景故事，提升好感度，解锁更多互动内容。
          </p>
        </motion.div>
      </div>

      {/* NPC Display Section */}
      <div className="max-w-7xl mx-auto">
        <NPCGrid npcs={npcs} />
      </div>
      
      {/* Add global style to override visited link color */}
      <style jsx global>{`
        a:visited {
          color: inherit;
        }
      `}</style>
    </div>
  )
} 