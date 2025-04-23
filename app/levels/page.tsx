'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeftIcon, ChevronUpIcon, ChevronDownIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export type Stats = {
  道: number
  德: number
  仁: number
  义: number
  礼: number
}

type LevelStatus = 'locked' | 'unlocked' | 'completed'

type Level = {
  id: number
  name: string
  description: string
  position: { x: number; y: number }
  requirements: Stats | null
  connections: number[]
}

// 定义关卡数据结构
const levels: Level[] = [
  {
    id: 1,
    name: '初入江湖',
    description: '你刚刚踏入这片充满智慧的土地...',
    position: { x: 50, y: 50 }, // 中心位置
    requirements: null, // 起始点无要求
    connections: [2, 3, 4], // 连接到的关卡ID
  },
  {
    id: 2,
    name: '仁者之道',
    description: '探索仁爱之道',
    position: { x: 25, y: 45 }, // 左上方
    requirements: { 道: 3, 德: 2, 仁: 5, 义: 2, 礼: 3 },
    connections: [1, 5],
  },
  {
    id: 3,
    name: '义之抉择',
    description: '在正义与私利之间...',
    position: { x: 55, y: 25 }, // 右上方
    requirements: { 道: 4, 德: 3, 仁: 2, 义: 5, 礼: 2 },
    connections: [1, 6],
  },
  {
    id: 4,
    name: '礼之准则',
    description: '礼节背后的深意',
    position: { x: 50, y: 75 }, // 下方
    requirements: { 道: 2, 德: 4, 仁: 3, 义: 2, 礼: 5 },
    connections: [1, 7],
  },
  {
    id: 5,
    name: '道法自然',
    description: '顺应自然，探寻道的真谛',
    position: { x: 15, y: 15 }, // 左上远处
    requirements: { 道: 6, 德: 3, 仁: 4, 义: 2, 礼: 2 },
    connections: [2],
  },
  {
    id: 6,
    name: '德行天下',
    description: '以德服人，建立和谐社会',
    position: { x: 85, y: 15 }, // 右上远处
    requirements: { 道: 3, 德: 6, 仁: 3, 义: 4, 礼: 3 },
    connections: [3],
  },
  {
    id: 7,
    name: '智者无忧',
    description: '用智慧化解人生困境',
    position: { x: 80, y: 90 }, // 下方远处
    requirements: { 道: 4, 德: 3, 仁: 3, 义: 3, 礼: 4 },
    connections: [4],
  },
  {
    id: 8,
    name: '大道至简',
    description: '回归本源，领悟大道真意',
    position: { x: 35, y: 15 }, // 最左上方
    requirements: { 道: 5, 德: 5, 仁: 5, 义: 5, 礼: 5 },
    connections: [5],
  },
]

// 关卡解锁物品映射
const levelUnlocks = {
  1: { type: 'npc', name: '剪纸艺人', description: '精通中国传统剪纸技艺', icon: '✂️' },
  2: { type: 'building', name: '茶艺馆', description: '展示中国茶道文化的场所', icon: '🍵' },
  3: { type: 'npc', name: '瓷器匠人', description: '掌握景德镇制瓷工艺', icon: '🏺' },
  4: { type: 'building', name: '戏曲舞台', description: '传统戏曲表演的场所', icon: '🏮' },
  5: { type: 'npc', name: '戏曲表演者', description: '精通京剧、昆曲等戏曲', icon: '🎭' },
  6: { type: 'building', name: '瓷器工坊', description: '制作传统陶瓷的场所', icon: '🏺' },
  7: { type: 'npc', name: '刺绣大师', description: '擅长苏绣、湘绣等刺绣艺术', icon: '🧵' },
  8: { type: 'building', name: '刺绣坊', description: '传统刺绣工艺展示处', icon: '🧶' },
};

export default function Levels() {
  const router = useRouter()
  // 玩家属性状态
  const [playerStats, setPlayerStats] = useState<Stats>({
    道: 3,
    德: 3,
    仁: 3,
    义: 3,
    礼: 3,
  })

  // 关卡完成状态
  const [completedLevels, setCompletedLevels] = useState<number[]>([])
  
  // 通知状态
  const [notification, setNotification] = useState<{
    visible: boolean;
    item: typeof levelUnlocks[keyof typeof levelUnlocks] | null;
    levelId: number | null;
  }>({
    visible: false,
    item: null,
    levelId: null
  });

  // 从 localStorage 加载状态
  useEffect(() => {
    console.log('关卡页面加载，开始检查通知');
    
    const savedCompletedLevels = JSON.parse(localStorage.getItem('completedLevels') || '[]') as number[]
    const previousCompletedLevels = JSON.parse(localStorage.getItem('previousCompletedLevels') || '[]') as number[]
    
    console.log('关卡完成状态:', {
      savedCompletedLevels,
      previousCompletedLevels,
      difference: savedCompletedLevels.filter(id => !previousCompletedLevels.includes(id))
    });
    
    // 首先检查是否有直接标记的新完成关卡
    const newCompletedLevelId = localStorage.getItem('newCompletedLevel')
    console.log('检测到新完成关卡标志:', newCompletedLevelId);
    
    if (newCompletedLevelId) {
      // 清除标记
      localStorage.removeItem('newCompletedLevel')
      console.log('已清除新完成关卡标志');
      
      const levelId = Number(newCompletedLevelId)
      const unlockedItem = levelUnlocks[levelId as keyof typeof levelUnlocks]
      
      console.log('解锁物品信息:', {
        levelId,
        unlockedItem: unlockedItem ? {...unlockedItem} : null
      });
      
      if (unlockedItem) {
        console.log('显示通知...');
        setNotification({
          visible: true,
          item: unlockedItem,
          levelId: levelId
        })
        
        // 通知显示5秒后自动关闭
        setTimeout(() => {
          console.log('自动关闭通知');
          setNotification(prev => ({...prev, visible: false}))
        }, 8000) // 延长到8秒，便于观察
      } else {
        console.log('未找到对应关卡的解锁物品');
      }
      
      // 更新之前完成的关卡记录
      localStorage.setItem('previousCompletedLevels', JSON.stringify(savedCompletedLevels))
    } 
    // 备用方法：查找新完成的关卡
    else {
      const newlyCompletedLevels = savedCompletedLevels.filter(
        levelId => !previousCompletedLevels.includes(levelId)
      )
      
      console.log('通过比较检测到的新完成关卡:', newlyCompletedLevels);
      
      // 如果有新完成的关卡，显示解锁通知
      if (newlyCompletedLevels.length > 0) {
        const recentlyCompletedLevelId = newlyCompletedLevels[0]
        const unlockedItem = levelUnlocks[recentlyCompletedLevelId as keyof typeof levelUnlocks]
        
        console.log('备用方法解锁物品:', {
          levelId: recentlyCompletedLevelId,
          unlockedItem: unlockedItem ? {...unlockedItem} : null
        });
        
        if (unlockedItem) {
          console.log('显示通知(备用方法)...');
          setNotification({
            visible: true,
            item: unlockedItem,
            levelId: recentlyCompletedLevelId
          })
          
          // 通知显示5秒后自动关闭
          setTimeout(() => {
            console.log('自动关闭通知(备用方法)');
            setNotification(prev => ({...prev, visible: false}))
          }, 8000) // 延长到8秒，便于观察
        } else {
          console.log('备用方法未找到对应关卡的解锁物品');
        }
        
        // 更新之前完成的关卡记录
        localStorage.setItem('previousCompletedLevels', JSON.stringify(savedCompletedLevels))
      }
    }
    
    setCompletedLevels(savedCompletedLevels)

    const levelEffects = JSON.parse(localStorage.getItem('levelEffects') || '{}') as Record<string, Partial<Stats>>
    // 计算总的属性效果
    const totalEffects = Object.values(levelEffects).reduce((acc: Partial<Stats>, curr: Partial<Stats>) => {
      Object.entries(curr).forEach(([key, value]) => {
        if (value) {
          acc[key as keyof Stats] = (acc[key as keyof Stats] || 3) + value
        }
      })
      return acc
    }, {} as Partial<Stats>)

    // 更新玩家属性
    setPlayerStats(prev => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(totalEffects).map(([key, value]) => [key, Math.max(0, Math.min(10, value || 3))])
      ) as Stats
    }))
  }, [])

  // 检查关卡是否可解锁
  const checkLevelAvailability = (level: Level): boolean => {
    if (!level.requirements) return true // 起始关卡总是可用
    
    // 检查前置关卡是否已完成（至少完成一个连接的关卡）
    const prerequisitesCompleted = level.connections.some(connectedId => 
      completedLevels.includes(connectedId)
    )
    
    if (!prerequisitesCompleted) return false
    
    // 计算属性差值的绝对值之和
    const getDifference = (stats: Stats, requirements: Stats): number => {
      return Object.keys(requirements).reduce((sum, key) => {
        return sum + Math.abs(stats[key as keyof Stats] - requirements[key as keyof Stats])
      }, 0)
    }

    // 获取所有已解锁或已完成关卡的连接关卡
    const connectedLevels = levels.filter(l => 
      // 关卡具有要求
      l.requirements && 
      // 该关卡未完成（已完成关卡不考虑）
      !completedLevels.includes(l.id) &&
      // 与已完成关卡有连接
      l.connections.some(connId => completedLevels.includes(connId))
    )
    
    // 计算所有连接关卡的差值
    const differences = connectedLevels.map(l => 
      getDifference(playerStats, l.requirements as Stats)
    )
    
    if (differences.length === 0) return false // 如果没有连接的关卡，则不可解锁
    
    // 当前关卡的差值
    const currentDiff = getDifference(playerStats, level.requirements)
    
    // 如果当前关卡的差值是最小的，或者完全满足要求（差值为0），则可解锁
    return currentDiff === Math.min(...differences, currentDiff) || currentDiff === 0
  }

  // 获取关卡状态
  const getLevelStatus = (level: Level): LevelStatus => {
    if (completedLevels.includes(level.id)) return 'completed'
    if (checkLevelAvailability(level)) return 'unlocked'
    return 'locked'
  }

  // 获取关卡样式
  const getLevelStyle = (status: LevelStatus): string => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-br from-green-600 to-green-700 cursor-pointer'
      case 'unlocked':
        return 'bg-gradient-to-br from-blue-600 to-blue-700 cursor-pointer'
      default:
        return 'bg-gray-700 cursor-not-allowed'
    }
  }

  // 调整玩家属性
  const adjustStat = (stat: keyof Stats, amount: number) => {
    setPlayerStats(prev => {
      const newValue = Math.max(0, Math.min(10, prev[stat] + amount));
      return {
        ...prev,
        [stat]: newValue
      };
    });
  };

  // 获取关卡背景颜色
  const getLevelBackgroundColor = (status: LevelStatus): string => {
    switch (status) {
      case 'completed':
        return 'rgba(16, 185, 129, 0.8)'; // 绿色
      case 'unlocked':
        return 'rgba(59, 130, 246, 0.8)'; // 蓝色
      default:
        return 'rgba(75, 85, 99, 0.8)'; // 灰色
    }
  };

  // 处理关卡点击
  const handleLevelClick = (level: Level) => {
    const status = getLevelStatus(level)
    if (status === 'locked') return
    router.push(`/novel/${level.id}`)
  }

  // 重置游戏状态
  const resetGameState = () => {
    if (confirm('确定要重置所有进度吗？这将清除所有已完成的关卡记录。')) {
      localStorage.removeItem('completedLevels')
      localStorage.removeItem('levelEffects')
      localStorage.removeItem('previousCompletedLevels')
      setCompletedLevels([])
      setPlayerStats({
        道: 3,
        德: 3,
        仁: 3,
        义: 3,
        礼: 3,
      })
    }
  }

  // 测试通知功能
  const testNotification = () => {
    // 随机选择一个关卡和对应的解锁项目
    const randomLevelId = Math.floor(Math.random() * 8) + 1;
    const testItem = levelUnlocks[randomLevelId as keyof typeof levelUnlocks];
    
    console.log('测试通知:', { randomLevelId, testItem });
    
    if (testItem) {
      setNotification({
        visible: true,
        item: testItem,
        levelId: randomLevelId
      });
      
      // 8秒后自动关闭
      setTimeout(() => {
        setNotification(prev => ({...prev, visible: false}));
      }, 8000);
    }
  }

  // 关闭通知
  const closeNotification = () => {
    setNotification(prev => ({...prev, visible: false}));
  };

  return (
    <div className="min-h-screen p-6 relative">
      {/* Back Button */}
      <Link href="/">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="mb-8 flex items-center text-white hover:text-gray-300"
        >
          <ArrowLeftIcon className="h-6 w-6 mr-2" />
          返回主页
        </motion.button>
      </Link>

      {/* 物品解锁通知 */}
      <div className="fixed bottom-0 left-0 bg-black bg-opacity-50 text-white p-2 text-xs z-50">
        通知状态: {notification.visible ? '可见' : '隐藏'}, 
        关卡: {notification.levelId}, 
        物品: {notification.item ? notification.item.name : '无'}
      </div>
      <AnimatePresence>
        {notification.visible && notification.item && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-lg shadow-xl z-50 w-80 border-2 border-indigo-300"
            style={{ boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)' }}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold flex items-center">
                <span className="mr-2 text-xl">🎉</span> 新解锁！
              </h3>
              <button 
                onClick={closeNotification} 
                className="text-white hover:text-gray-200 bg-indigo-800 rounded-full p-1"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-3 bg-indigo-800 bg-opacity-40 p-2 rounded-lg">
              <div className="text-3xl">{notification.item?.icon}</div>
              <div>
                <p className="font-semibold">
                  {notification.item?.type === 'npc' ? 'NPC: ' : '建筑: '}
                  {notification.item?.name}
                </p>
                <p className="text-sm text-gray-200">{notification.item?.description}</p>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-200 italic">
              完成关卡: {notification.levelId ? levels.find(l => l.id === notification.levelId)?.name : ''}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Player Stats */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">当前属性</h2>
          <div className="flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={testNotification}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              测试通知
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={resetGameState}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              重置游戏
            </motion.button>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(playerStats).map(([stat, value]) => (
            <div key={stat} className="text-center flex flex-col items-center">
              <div className="text-lg font-bold text-white">{stat}</div>
              <div className="text-purple-400 my-1">{value}</div>
              <div className="flex flex-col">
                <button 
                  onClick={() => adjustStat(stat as keyof Stats, 1)}
                  className="text-white bg-purple-700 hover:bg-purple-600 rounded-t px-2 py-0.5"
                >
                  <ChevronUpIcon className="h-4 w-4" />
                  <span className="sr-only">+</span>
                </button>
                <button 
                  onClick={() => adjustStat(stat as keyof Stats, -1)}
                  className="text-white bg-purple-700 hover:bg-purple-600 rounded-b px-2 py-0.5"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                  <span className="sr-only">-</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spider Web Level Map */}
      <div className="relative w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500" />
        </div>

        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {levels.map(level =>
            level.connections.map(connectedId => {
              const connectedLevel = levels.find(l => l.id === connectedId)
              if (!connectedLevel) return null
              return (
                <line
                  key={`${level.id}-${connectedId}`}
                  x1={`${level.position.x}%`}
                  y1={`${level.position.y}%`}
                  x2={`${connectedLevel.position.x}%`}
                  y2={`${connectedLevel.position.y}%`}
                  stroke="#4B5563"
                  strokeWidth="3"
                  strokeDasharray="4 4"
                />
              )
            })
          )}
        </svg>

        {/* Level Nodes */}
        {levels.map((level) => {
          const status = getLevelStatus(level)
          return (
            <motion.div
              key={level.id}
              onClick={() => handleLevelClick(level)}
              className={`absolute w-48 p-4 rounded-xl border-2 backdrop-blur-sm shadow-lg transform -translate-x-1/2 -translate-y-1/2 ${getLevelStyle(status)}`}
              style={{
                left: `${level.position.x}%`,
                top: `${level.position.y}%`,
                zIndex: 2,
                backgroundColor: getLevelBackgroundColor(status),
                borderColor: status === 'completed' ? '#10B981' : status === 'unlocked' ? '#3B82F6' : '#4B5563',
              }}
              whileHover={status !== 'locked' ? { scale: 1.1, y: '-55%' } : {}}
            >
              <h3 className="text-lg font-bold text-white mb-1">{level.name}</h3>
              <p className="text-sm text-gray-200 mb-2">{level.description}</p>
              {level.requirements && (
                <div className="text-xs text-gray-300">
                  需求：
                  {Object.entries(level.requirements as Stats).map(([stat, value], index, array) => (
                    <span key={stat}>
                      {stat}:{value}
                      {index < array.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
} 