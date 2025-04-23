'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import { useRouter } from 'next/navigation'

// Define types for our game entities
type ItemType = 'npc' | 'building';

interface GameItem {
  id: string;
  name: string;
  description: string;
  size: number;
  type: ItemType;
  icon: string;
}

interface NPC extends GameItem {
  type: 'npc';
}

interface Building extends GameItem {
  type: 'building';
  shape: number[][];
}

interface PlacedItem extends GameItem {
  position: {
    row: number;
    col: number;
  };
}

interface GridCell {
  id: string;
  row: number;
  col: number;
  content: GameItem | null;
}

// Define the game entities (NPCs and buildings)
const npcs: NPC[] = [
  { id: 'npc-1', name: '剪纸艺人', description: '精通中国传统剪纸技艺', size: 1, type: 'npc', icon: '✂️' },
  { id: 'npc-2', name: '瓷器匠人', description: '掌握景德镇制瓷工艺', size: 1, type: 'npc', icon: '🏺' },
  { id: 'npc-3', name: '戏曲表演者', description: '精通京剧、昆曲等戏曲', size: 1, type: 'npc', icon: '🎭' },
  { id: 'npc-4', name: '刺绣大师', description: '擅长苏绣、湘绣等刺绣艺术', size: 1, type: 'npc', icon: '🧵' },
  { id: 'npc-5', name: '茶艺师', description: '精通中国传统茶道文化', size: 1, type: 'npc', icon: '🍵' },
]

const buildings: Building[] = [
  { id: 'building-1', name: '茶艺馆', description: '展示中国茶道文化的场所', size: 2, shape: [[1,1]], type: 'building', icon: '🍵' },
  { id: 'building-2', name: '戏曲舞台', description: '传统戏曲表演的场所', size: 4, shape: [[1,1],[1,0],[0,1],[0,0]], type: 'building', icon: '🏮' },
  { id: 'building-3', name: '瓷器工坊', description: '制作传统陶瓷的场所', size: 3, shape: [[1,0,0],[1,1,1]], type: 'building', icon: '🏺' },
  { id: 'building-4', name: '刺绣坊', description: '传统刺绣工艺展示处', size: 2, shape: [[1,1]], type: 'building', icon: '🧶' },
  { id: 'building-5', name: '剪纸馆', description: '剪纸艺术的展示与制作场所', size: 2, shape: [[1,1]], type: 'building', icon: '📄' },
]

// Create a grid of 8x7 hexagonal cells
const createEmptyGrid = (): GridCell[][] => {
  const grid: GridCell[][] = [];
  for(let row = 0; row < 8; row++) {
    const currentRow: GridCell[] = [];
    for(let col = 0; col < 15; col++) {
      currentRow.push({
        id: `cell-${row}-${col}`,
        row,
        col,
        content: null
      });
    }
    grid.push(currentRow);
  }
  return grid;
};

export default function Garden() {
  const router = useRouter()
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [inventory, setInventory] = useState<GameItem[]>([...npcs, ...buildings]);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [holdingItem, setHoldingItem] = useState<{item: GameItem, fromGrid: boolean, position?: {row: number, col: number}} | null>(null);

  // Initialize the grid
  useEffect(() => {
    setGrid(createEmptyGrid());
  }, []);

  // Save garden layout to localStorage whenever grid changes
  useEffect(() => {
    if (grid.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem('gardenLayout', JSON.stringify(grid));
    }
  }, [grid]);

  // Handle inventory item click
  const handleInventoryItemClick = (item: GameItem, index: number) => {
    setSelectedItem(item);
    setSelectedItemIndex(index);
    
    // If already holding an item, put it back first
    if (holdingItem) {
      if (holdingItem.fromGrid && holdingItem.position) {
        // Put back to original position in grid
        const newGrid = [...grid];
        newGrid[holdingItem.position.row][holdingItem.position.col].content = holdingItem.item;
        setGrid(newGrid);
      } else {
        // Put back to inventory
        // (No action needed, it's already in inventory)
      }
    }
    
    // Pick up from inventory
    setHoldingItem({ item, fromGrid: false });
  };

  // Handle grid cell click
  const handleCellClick = (cell: GridCell) => {
    setSelectedCell({ row: cell.row, col: cell.col });
    
    // If holding an item, try to place it
    if (holdingItem) {
      if (cell.content === null) {
        // Place item in this cell
        const newGrid = [...grid];
        newGrid[cell.row][cell.col].content = holdingItem.item;
        
        // If item was from grid, remove from old position and update in placed items
        if (holdingItem.fromGrid && holdingItem.position) {
          // Update placed items
          const newPlacedItems = placedItems.map(placedItem => {
            if (placedItem.position.row === holdingItem.position!.row && 
                placedItem.position.col === holdingItem.position!.col) {
              return { ...placedItem, position: { row: cell.row, col: cell.col } };
            }
            return placedItem;
          });
          setPlacedItems(newPlacedItems);
        } else {
          // Remove from inventory and add to placed items
          const newInventory = [...inventory];
          if (selectedItemIndex !== null) {
            newInventory.splice(selectedItemIndex, 1);
            setInventory(newInventory);
          }
          setPlacedItems([...placedItems, { ...holdingItem.item, position: { row: cell.row, col: cell.col } }]);
        }
        
        setGrid(newGrid);
        setHoldingItem(null);
        setSelectedItemIndex(null);
      }
    } else if (cell.content) {
      // Pick up item from grid
      setHoldingItem({ 
        item: cell.content, 
        fromGrid: true, 
        position: { row: cell.row, col: cell.col } 
      });
      
      // Remove from current position
      const newGrid = [...grid];
      newGrid[cell.row][cell.col].content = null;
      setGrid(newGrid);
    }
  };

  // Cancel holding item (on right click or escape key)
  const cancelHoldingItem = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    if (e.type === 'contextmenu') {
      e.preventDefault();
    }
    
    if (holdingItem) {
      if (holdingItem.fromGrid && holdingItem.position) {
        // Put back to original position in grid
        const newGrid = [...grid];
        newGrid[holdingItem.position.row][holdingItem.position.col].content = holdingItem.item;
        setGrid(newGrid);
      }
      setHoldingItem(null);
      setSelectedItemIndex(null);
    }
  }, [holdingItem, grid, setGrid, setHoldingItem, setSelectedItemIndex]);

  // Register escape key event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && holdingItem) {
        cancelHoldingItem(e as unknown as React.KeyboardEvent);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdingItem]);

  // Handle right click on an NPC
  const handleCellRightClick = (e: React.MouseEvent, cell: GridCell) => {
    e.preventDefault(); // Prevent default context menu
    
    if (cell.content && cell.content.type === 'npc') {
      // Navigate to Garden NPC page
      router.push(`/garden/npc/${cell.content.id}`)
    } else if (holdingItem) {
      // Cancel holding item if right click anywhere else
      cancelHoldingItem(e);
    }
  };

  return (
    <div className="min-h-screen p-6" onContextMenu={cancelHoldingItem}>
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

      {holdingItem && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{ 
            left: `calc(var(--mouse-x, 0) * 1px)`, 
            top: `calc(var(--mouse-y, 0) * 1px)`, 
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="text-3xl">{holdingItem.item.icon}</div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">我的家园</h1>

        {/* Garden Stats */}
        <div className="bg-white bg-opacity-10 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-gray-400">放置建筑</p>
              <p className="text-2xl font-bold text-white">{placedItems.filter(item => item.type === 'building').length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">放置NPC</p>
              <p className="text-2xl font-bold text-white">{placedItems.filter(item => item.type === 'npc').length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">文化值</p>
              <p className="text-2xl font-bold text-white">{placedItems.length * 40}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">格子使用</p>
              <p className="text-2xl font-bold text-white">{placedItems.reduce((acc, item) => acc + item.size, 0)}/{8*7}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Link href="/npc">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors flex items-center"
              >
                管理家园NPC
              </motion.button>
            </Link>
            <Link href="/garden/road">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm transition-colors flex items-center ml-4"
              >
                开始经营
              </motion.button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Hexagonal Grid */}
          <div className="bg-white bg-opacity-10 rounded-lg p-6 flex-grow">
            <h2 className="text-xl font-bold text-white mb-4">家园布局</h2>
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
                      
                      // Implement a proper hexagonal grid layout
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
                      
                      return (
                        <div 
                          key={cell.id}
                          className={`hex-cell 
                            ${holdingItem && !cell.content ? 'bg-green-700' : 'bg-gray-700'} 
                            ${cell.content ? 'has-content' : ''} 
                            ${cell.content?.type === 'npc' ? 'npc-cell' : ''}
                            ${selectedCell?.row === cell.row && selectedCell?.col === cell.col ? 'selected-cell' : ''}`}
                          onClick={() => handleCellClick(cell)}
                          onContextMenu={(e) => handleCellRightClick(e, cell)}
                          style={{
                            position: 'absolute',
                            left: `${x}px`,
                            top: `${y}px`,
                            width: `${width}px`,
                            height: `${height}px`,
                          }}
                        >
                          {cell.content && (
                            <div className="hex-content">
                              <span className="item-icon">{cell.content.icon}</span>
                              <span className="item-name">{cell.content.name}</span>
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

          {/* Item Inventory */}
          <div className="bg-white bg-opacity-10 rounded-lg p-6 md:w-80">
            <h2 className="text-xl font-bold text-white mb-4">可放置物品</h2>
            <div className="inventory-container space-y-2">
              {inventory.map((item, index) => (
                <div
                  key={item.id}
                  className={`inventory-item p-3 rounded-lg bg-gradient-to-br ${
                    item.type === 'npc' 
                      ? 'from-blue-600 to-indigo-600' 
                      : 'from-green-600 to-teal-600'
                  } transition-all cursor-pointer ${selectedItemIndex === index ? 'ring-2 ring-yellow-400' : ''}`}
                  onClick={() => handleInventoryItemClick(item, index)}
                >
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">{item.icon}</div>
                    <div>
                      <h3 className="text-white font-semibold">{item.name}</h3>
                      <p className="text-xs text-gray-200">{item.description}</p>
                      <p className="text-xs text-gray-300">占用格子: {item.size}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Item Detail Panel */}
            {selectedItem && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <h3 className="text-lg font-bold text-white">{selectedItem.name}</h3>
                <p className="text-sm text-gray-300 mb-2">{selectedItem.description}</p>
                <p className="text-sm text-gray-400">占用格子: {selectedItem.size}</p>
                
                {holdingItem && (
                  <p className="text-sm text-yellow-400 mt-2">
                    点击格子放置物品，右键点击或按Esc取消
                  </p>
                )}
              </div>
            )}
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
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.3); /* Light border with increased opacity */
          box-sizing: border-box; /* Include border in element size */
        }
        
        .hex-cell:hover {
          transform: scale(1.05);
          background-color: ${holdingItem ? 'rgba(74, 222, 128, 0.5)' : 'rgba(74, 222, 128, 0.2)'} !important;
          z-index: 10;
          border-color: rgba(255, 255, 255, 0.8); /* Brighter border on hover */
        }
        
        .hex-coordinates {
          position: absolute;
          bottom: 5px;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 300;
          text-shadow: 0 0 2px rgba(0, 0, 0, 0.8); /* Text shadow to make coordinates more visible */
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
        
        .inventory-container {
          max-height: 500px;
          overflow-y: auto;
        }
        
        .has-content {
          background-color: rgba(59, 130, 246, 0.5) !important;
          border: 1px solid rgba(255, 255, 255, 0.5); /* Brighter border for cells with content */
        }
        
        .npc-cell {
          background-color: rgba(124, 58, 237, 0.5) !important;
          cursor: pointer;
        }
        
        .npc-cell:hover {
          background-color: rgba(124, 58, 237, 0.7) !important;
        }
        
        .selected-cell {
          box-shadow: 0 0 0 2px yellow;
          z-index: 5;
        }
      `}</style>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('mousemove', (e) => {
            document.documentElement.style.setProperty('--mouse-x', e.clientX);
            document.documentElement.style.setProperty('--mouse-y', e.clientY);
          });
        `
      }} />
    </div>
  )
} 