'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {/* Logo/Title */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="mb-12 text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-2">国学文化游戏</h1>
        <p className="text-gray-300">探索传统文化的智慧</p>
      </motion.div>

      {/* Navigation Buttons */}
      <div className="flex flex-col gap-6 w-full max-w-xs">
        <Link href="/levels" className="w-full">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-4 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
          >
            关卡选择
          </motion.button>
        </Link>

        <Link href="/garden" className="w-full">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-4 px-8 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold shadow-lg hover:from-green-700 hover:to-teal-700 transition-all"
          >
            我的家园
          </motion.button>
        </Link>

        <Link href="/npc" className="w-full">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-4 px-8 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold shadow-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
          >
            家园NPC对话
          </motion.button>
        </Link>
      </div>

      {/* Background Decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/bg-pattern.png')] opacity-10" />
      </div>
    </div>
  )
} 