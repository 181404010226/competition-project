'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import { createEmptyGrid } from './RoadBuilder'
import RoadBuilder from './RoadBuilder'
import CustomerSimulation, { 
  getBuildingBaseConsumption, 
  getBuildingBasePrice,
  getNPCBonusMultiplier,
  getNPCBonusPrice
} from './CustomerSimulation'

// Types
type ItemType = 'npc' | 'building';

interface GameItem {
  id: string;
  name: string;
  description: string;
  size: number;
  type: ItemType;
  icon: string;
}

interface GardenCell {
  id: string;
  row: number;
  col: number;
  content: GameItem | null;
}

interface GridCell {
  id: string;
  row: number;
  col: number;
  isRoad: boolean;
  isStartPoint: boolean;
  isEndPoint: boolean;
  isValidNextCell?: boolean;
  content: GameItem | null;
}

interface RoadUser {
  id: string;
  type: 'normal' | 'wealthy';
  position: number;
  icon: string;
  speed: number;
  coins: number;
  lastConsumedBuilding?: string;
  lastConsumeTime?: number;
  consumeCooldown: number;
}

// Constants
const GRID_ROWS = 8;
const GRID_COLS = 15;

export default function BusinessManagement() {
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [selectedCells, setSelectedCells] = useState<{row: number, col: number}[]>([]);
  const [startPoint, setStartPoint] = useState<{row: number, col: number} | null>(null);
  const [endPoint, setEndPoint] = useState<{row: number, col: number} | null>(null);
  const [businessStarted, setBusinessStarted] = useState(false);
  const businessStartedRef = useRef(false);
  const [users, setUsers] = useState<RoadUser[]>([]);
  const [isEditing, setIsEditing] = useState(true);
  const [totalCoins, setTotalCoins] = useState(0);
  const [consumptionEvents, setConsumptionEvents] = useState<Array<{
    buildingId: string;
    buildingName: string;
    amount: number;
    position: {row: number, col: number};
    timestamp: number;
    isSpecial?: boolean;
  }>>([]);
  const [activeConsumptions, setActiveConsumptions] = useState<{
    [key: string]: {
      amount: number;
      timestamp: number;
      isSpecial?: boolean;
    }
  }>({});

  // Initialize the road builder component
  const { handleCellClick } = RoadBuilder({
    grid,
    setGrid,
    selectedCells,
    setSelectedCells,
    startPoint,
    setStartPoint,
    endPoint,
    setEndPoint,
    isEditing
  });

  // Initialize the customer simulation component
  const { startBusiness: startBusinessSim, resetBusiness: resetBusinessSim } = CustomerSimulation({
    grid,
    selectedCells,
    businessStarted,
    businessStartedRef,
    users,
    setUsers,
    setTotalCoins,
    setConsumptionEvents,
    setActiveConsumptions
  });
  
  // Initialize the grid with garden layout
  useEffect(() => {
    // Start with an empty grid
    const newGrid = createEmptyGrid(GRID_ROWS, GRID_COLS);
    setGrid(newGrid);
    
    // Get the garden layout from the main page
    if (typeof window !== 'undefined') {
      try {
        // Try to get garden grid from localStorage - this would be set by the garden page
        const gardenGrid = localStorage.getItem('gardenLayout');
        
        if (gardenGrid) {
          const parsedGrid: GardenCell[][] = JSON.parse(gardenGrid);
          
          // Copy content from garden grid to our grid with added economic properties
          const gridWithContent = newGrid.map((row, rowIndex) => 
            row.map((cell, colIndex) => {
              const content = parsedGrid[rowIndex]?.[colIndex]?.content;
              if (!content) return { ...cell, content: null };
              
              // Add economic properties based on item type
              if (content.type === 'building') {
                // Add consumption and price values based on building type
                const buildingContent = { 
                  ...content,
                  baseConsumption: getBuildingBaseConsumption(content.id),
                  basePrice: getBuildingBasePrice(content.id)
                };
                return { ...cell, content: buildingContent };
              } else if (content.type === 'npc') {
                // Add bonus multiplier and price based on NPC type
                const npcContent = {
                  ...content,
                  bonusMultiplier: getNPCBonusMultiplier(content.id),
                  bonusPrice: getNPCBonusPrice(content.id)
                };
                return { ...cell, content: npcContent };
              }
              
              return { ...cell, content };
            })
          );
          
          setGrid(gridWithContent);
        }
      } catch (error) {
        console.error('Failed to load garden layout', error);
      }
    }
  }, []);

  // Sync businessStarted state to ref
  useEffect(() => {
    businessStartedRef.current = businessStarted;
  }, [businessStarted]);

  // Start business wrapper function
  const startBusinessWrapper = () => {
    if (selectedCells.length < 2) return;
    
    // Set the businessStarted state
    businessStartedRef.current = true;
    setBusinessStarted(true);
    setIsEditing(false);
    
    // Call the startBusiness function from the CustomerSimulation component
    startBusinessSim();
  };

  // Reset business wrapper function
  const resetBusinessWrapper = () => {
    // Reset the grid but keep the garden content
    const currentGrid = [...grid];
    const newGrid = currentGrid.map(row => 
      row.map(cell => ({
        ...cell,
        isRoad: false,
        isStartPoint: false,
        isEndPoint: false,
        isValidNextCell: false
      }))
    );
    
    setGrid(newGrid);
    setSelectedCells([]);
    setStartPoint(null);
    setEndPoint(null);
    
    // Update state and ref
    businessStartedRef.current = false;
    setBusinessStarted(false);
    setIsEditing(true);
    
    // Call the resetBusiness function from the CustomerSimulation component
    resetBusinessSim();
  };

  // Add useEffect for expiring visual feedback after a delay
  useEffect(() => {
    // Clean up expired consumption animations after 2 seconds
    const animationCleanupInterval = setInterval(() => {
      const now = Date.now();
      setActiveConsumptions(prev => {
        const newActive = { ...prev };
        let hasChanges = false;
        
        Object.entries(newActive).forEach(([key, consumption]) => {
          if (now - consumption.timestamp > 2000) { // Remove after 2 seconds
            delete newActive[key];
            hasChanges = true;
          }
        });
        
        return hasChanges ? newActive : prev;
      });
    }, 500); // Check every 500ms
    
    return () => {
      clearInterval(animationCleanupInterval);
    };
  }, []);

  return (
    <div className="min-h-screen p-6">
      {/* Back Button */}
      <Link href="/garden">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="mb-8 flex items-center text-white hover:text-gray-300"
        >
          <ArrowLeftIcon className="h-6 w-6 mr-2" />
          返回家园
        </motion.button>
      </Link>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">家园经营管理</h1>

        {/* Business Stats */}
        <div className="bg-white bg-opacity-10 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">经营详情</h2>
              <p className="text-gray-300 text-sm mt-2">
                {isEditing 
                  ? '选择相邻的格子来修建游客参观道路，选择的第一个格子为起点，最后一个格子为终点。'
                  : `经营中，游客流量: ${users.length} 人，已获得金币: ${totalCoins}`}
              </p>
            </div>
            <div>
              {isEditing ? (
                <button
                  onClick={startBusinessWrapper}
                  disabled={selectedCells.length < 2}
                  className={`px-4 py-2 rounded-lg text-white ${
                    selectedCells.length < 2 
                      ? 'bg-gray-500 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  开始经营
                </button>
              ) : (
                <button
                  onClick={resetBusinessWrapper}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  重设道路
                </button>
              )}
            </div>
          </div>
          
          {/* Consumption Events Display */}
          {businessStarted && (
            <div className="mt-4">
              <h3 className="text-white font-semibold mb-2">最近消费记录</h3>
              <div className="bg-black bg-opacity-30 rounded-lg p-3 max-h-40 overflow-y-auto">
                {consumptionEvents.length > 0 ? (
                  <ul className="space-y-2">
                    {consumptionEvents.map((event, index) => (
                      <li key={index} className={`text-sm flex justify-between items-center ${event.isSpecial ? 'special-event p-1 rounded-md' : ''}`}>
                        <span className="text-gray-300">
                          游客在 <span className="text-amber-300">{event.buildingName}</span> 
                          {event.isSpecial && <span className="text-pink-500 font-bold ml-1">豪华消费</span>}
                        </span>
                        <span className={`font-bold ${event.isSpecial ? 'text-yellow-300 text-base' : 'text-yellow-400'}`}>
                          {event.amount} 金币
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-sm">暂无消费记录，游客还未在建筑内消费</p>
                )}
              </div>
            </div>
          )}
          
          {/* Building and NPC info */}
          {businessStarted && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-white font-semibold mb-2">建筑收益信息</h3>
                <div className="bg-black bg-opacity-30 rounded-lg p-3">
                  <ul className="text-xs space-y-1">
                    <li className="text-gray-300">茶艺馆: 基础收益 <span className="text-yellow-400">{getBuildingBaseConsumption('building-1')} × {getBuildingBasePrice('building-1')}</span> 金币</li>
                    <li className="text-gray-300">戏曲舞台: 基础收益 <span className="text-yellow-400">{getBuildingBaseConsumption('building-2')} × {getBuildingBasePrice('building-2')}</span> 金币</li>
                    <li className="text-gray-300">瓷器工坊: 基础收益 <span className="text-yellow-400">{getBuildingBaseConsumption('building-3')} × {getBuildingBasePrice('building-3')}</span> 金币</li>
                    <li className="text-gray-300">刺绣坊: 基础收益 <span className="text-yellow-400">{getBuildingBaseConsumption('building-4')} × {getBuildingBasePrice('building-4')}</span> 金币</li>
                    <li className="text-gray-300">剪纸馆: 基础收益 <span className="text-yellow-400">{getBuildingBaseConsumption('building-5')} × {getBuildingBasePrice('building-5')}</span> 金币</li>
                  </ul>
                  <p className="mt-2 text-xs text-amber-300">提示: 当游客路过建筑相邻格子时，有70%的概率进行消费!</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-2">NPC加成信息</h3>
                <div className="bg-black bg-opacity-30 rounded-lg p-3">
                  <ul className="text-xs space-y-1">
                    <li className="text-gray-300">剪纸艺人: 提升收益 <span className="text-green-400">{Math.round(getNPCBonusMultiplier('npc-1') * 100)}%</span> 和 <span className="text-green-400">{getNPCBonusPrice('npc-1')}</span> 金币</li>
                    <li className="text-gray-300">瓷器匠人: 提升收益 <span className="text-green-400">{Math.round(getNPCBonusMultiplier('npc-2') * 100)}%</span> 和 <span className="text-green-400">{getNPCBonusPrice('npc-2')}</span> 金币</li>
                    <li className="text-gray-300">戏曲表演者: 提升收益 <span className="text-green-400">{Math.round(getNPCBonusMultiplier('npc-3') * 100)}%</span> 和 <span className="text-green-400">{getNPCBonusPrice('npc-3')}</span> 金币</li>
                    <li className="text-gray-300">刺绣大师: 提升收益 <span className="text-green-400">{Math.round(getNPCBonusMultiplier('npc-4') * 100)}%</span> 和 <span className="text-green-400">{getNPCBonusPrice('npc-4')}</span> 金币</li>
                    <li className="text-gray-300">茶艺师: 提升收益 <span className="text-green-400">{Math.round(getNPCBonusMultiplier('npc-5') * 100)}%</span> 和 <span className="text-green-400">{getNPCBonusPrice('npc-5')}</span> 金币</li>
                  </ul>
                  <p className="mt-2 text-xs text-amber-300">提示: 将NPC放置在建筑旁边可以大幅提高建筑的收益能力!</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hexagonal Grid */}
        <div className="bg-white bg-opacity-10 rounded-lg p-6">
          <div className="grid-container-wrapper">
            <div className="grid-container">
              {grid.map((row, rowIndex) => (
                <div key={`row-${rowIndex}`} className="hex-row">
                  {row.map((cell, colIndex) => {
                    // Constants for hexagon dimensions
                    const hexSize = 40; // Size of hexagon (can be thought of as radius)
                    const width = hexSize * 2; // Width of the hexagon
                    const height = Math.sqrt(3) * hexSize; // Height factor for regular hexagon
                    
                    // Calculate position based on hexagonal grid math
                    let x, y;
                    
                    // For even columns: cells align vertically
                    // For odd columns: cells are offset vertically to create interlocking pattern
                    if (colIndex % 2 === 0) {
                      // Even columns
                      x = colIndex * width * 0.75;
                      y = rowIndex * height;
                    } else {
                      // Odd columns - offset vertically to create honeycomb
                      x = colIndex * width * 0.75;
                      y = (rowIndex * height) + (height * 0.5); // Offset by half height
                    }
                    
                    // Find users on this cell
                    const cellUsers = users.filter(user => {
                      const userPosition = Math.floor(user.position);
                      if (userPosition >= selectedCells.length) return false;
                      
                      const userCell = selectedCells[userPosition];
                      return userCell.row === cell.row && userCell.col === cell.col;
                    });
                    
                    return (
                      <div 
                        key={cell.id}
                        className={`hex-cell ${
                          cell.isRoad 
                            ? cell.isStartPoint 
                              ? 'start-point' 
                              : cell.isEndPoint 
                                ? 'end-point' 
                                : 'road-cell' 
                            : cell.isValidNextCell
                              ? 'valid-next-cell'
                              : cell.content
                                ? 'has-content'
                                : 'bg-gray-700'
                        } ${cell.content?.type === 'npc' ? 'npc-cell' : ''}
                        ${activeConsumptions[`${cell.row}-${cell.col}`] ? 'has-consumption' : ''}`}
                        onClick={() => handleCellClick(cell.row, cell.col)}
                        style={{
                          position: 'absolute',
                          left: `${x}px`,
                          top: `${y}px`,
                          width: `${width}px`,
                          height: `${height}px`,
                        }}
                      >
                        {cell.isStartPoint && <div className="point-label">起点</div>}
                        {cell.isEndPoint && <div className="point-label">终点</div>}
                        
                        {cell.content && !cell.isRoad && (
                          <div className="hex-content">
                            <span className="item-icon">{cell.content.icon}</span>
                            <span className="item-name">{cell.content.name}</span>
                          </div>
                        )}
                        
                        {cellUsers.length > 0 && (
                          <div className="users-container">
                            {cellUsers.map(user => (
                              <div 
                                key={user.id} 
                                className={`user-icon ${user.type === 'wealthy' ? 'wealthy-user' : 'normal-user'}`}
                                title={`${user.type === 'wealthy' ? '富裕游客' : '普通游客'} - 携带金币: ${user.coins}`}
                              >
                                {user.icon}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Consumption animation */}
                        {activeConsumptions[`${cell.row}-${cell.col}`] && (
                          <div className="consumption-animation">
                            <div className={`coin-animation ${activeConsumptions[`${cell.row}-${cell.col}`].isSpecial ? 'special-purchase' : ''}`}>
                              +{activeConsumptions[`${cell.row}-${cell.col}`].amount}
                              {activeConsumptions[`${cell.row}-${cell.col}`].isSpecial && 
                                <span className="special-label">豪华消费!</span>
                              }
                            </div>
                          </div>
                        )}
                        
                        <div className="hex-coordinates">
                          {rowIndex},{colIndex}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .grid-container-wrapper {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 30px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }
        
        .grid-container {
          position: relative;
          width: 100%;
          height: 600px; /* Fixed height to contain all hexagons */
          margin: 0 auto;
        }
        
        .hex-row {
          position: relative;
        }
        
        .hex-cell {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
          transition: all 0.2s ease;
          cursor: ${isEditing ? 'pointer' : 'default'};
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-sizing: border-box;
        }
        
        .hex-cell:hover {
          ${isEditing ? 'transform: scale(1.05);' : ''}
          ${isEditing ? 'background-color: rgba(74, 222, 128, 0.3) !important;' : ''}
          ${isEditing ? 'z-index: 10;' : ''}
          ${isEditing ? 'border-color: rgba(255, 255, 255, 0.8);' : ''}
        }
        
        .road-cell {
          background-color: #8B4513 !important; /* Brown for road */
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        
        .start-point {
          background-color: #22C55E !important; /* Green for start */
          border: 2px solid rgba(255, 255, 255, 0.8);
        }
        
        .end-point {
          background-color: #EF4444 !important; /* Red for end */
          border: 2px solid rgba(255, 255, 255, 0.8);
        }
        
        .has-content {
          background-color: rgba(59, 130, 246, 0.5) !important;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        
        .npc-cell {
          background-color: rgba(124, 58, 237, 0.5) !important;
        }
        
        .hex-coordinates {
          position: absolute;
          bottom: 5px;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 300;
          text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
        }
        
        .point-label {
          position: absolute;
          top: 10px;
          font-size: 12px;
          font-weight: bold;
          color: white;
          text-shadow: 0 0 3px black;
        }
        
        .users-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 100%;
          padding: 2px;
        }
        
        .user-icon {
          font-size: 16px;
          margin: 2px;
          filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8));
        }
        
        .wealthy-user {
          transform: scale(1.2);
          z-index: 5;
        }
        
        .valid-next-cell {
          background-color: rgba(74, 222, 128, 0.3) !important; /* Light green for valid next cells */
          border: 1px dashed rgba(255, 255, 255, 0.8);
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        
        .hex-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          z-index: 2;
        }
        
        .item-icon {
          font-size: 20px;
          margin-bottom: 2px;
        }
        
        .item-name {
          font-size: 10px;
          color: white;
          max-width: 60px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .consumption-animation {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          pointer-events: none;
          z-index: 20;
        }
        
        .coin-animation {
          font-size: 18px;
          font-weight: bold;
          color: gold;
          text-shadow: 0 0 6px black, 0 0 10px rgba(255, 215, 0, 0.7);
          animation: coin-float 2s ease-out;
          position: absolute;
        }
        
        @keyframes coin-float {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
          10% {
            transform: translateY(-5px) scale(1.2);
            opacity: 1;
          }
          50% {
            transform: translateY(-15px) scale(1.1);
            opacity: 1;
          }
          90% {
            transform: translateY(-25px) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-35px) scale(0.8);
            opacity: 0;
          }
        }
        
        .has-consumption {
          animation: pulse-gold 1.5s;
          box-shadow: 0 0 15px 8px rgba(255, 215, 0, 0.7) !important;
          z-index: 15;
          transform: scale(1.1);
          transition: transform 0.3s ease-out;
        }
        
        @keyframes pulse-gold {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 20px 12px rgba(255, 215, 0, 0.8);
            transform: scale(1.15);
          }
          100% {
            box-shadow: 0 0 15px 8px rgba(255, 215, 0, 0.7);
            transform: scale(1.1);
          }
        }
        
        .special-purchase {
          font-size: 22px !important;
          color: #FFD700 !important;
          text-shadow: 0 0 8px black, 0 0 15px rgba(255, 215, 0, 0.9) !important;
          animation: special-coin-float 2.5s ease-out !important;
        }
        
        .special-label {
          display: block;
          font-size: 12px;
          color: #FF4500;
          text-shadow: 0 0 4px black;
          margin-top: -4px;
        }
        
        @keyframes special-coin-float {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
          10% {
            transform: translateY(-5px) scale(1.5);
            opacity: 1;
          }
          50% {
            transform: translateY(-20px) scale(1.3);
            opacity: 1;
          }
          90% {
            transform: translateY(-35px) scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-45px) scale(0.9);
            opacity: 0;
          }
        }
        
        .special-event {
          background-color: rgba(255, 215, 0, 0.15);
          border-left: 3px solid #FFD700;
          animation: special-event-glow 2s infinite alternate;
        }
        
        @keyframes special-event-glow {
          from {
            box-shadow: 0 0 5px rgba(255, 215, 0, 0.3);
          }
          to {
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
          }
        }
      `}</style>
    </div>
  )
} 