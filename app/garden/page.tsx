'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'

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
  { id: 'npc-1', name: '诗人', description: '能够创作诗词', size: 1, type: 'npc', icon: '👨‍🎓' },
  { id: 'npc-2', name: '画家', description: '能够绘制山水画', size: 1, type: 'npc', icon: '👨‍🎨' },
  { id: 'npc-3', name: '琴师', description: '能够演奏古琴', size: 1, type: 'npc', icon: '🧙‍♂️' },
  { id: 'npc-4', name: '儒者', description: '教授儒家经典', size: 1, type: 'npc', icon: '👴' },
  { id: 'npc-5', name: '茶艺师', description: '精通茶道', size: 1, type: 'npc', icon: '👩‍🍳' },
]

const buildings: Building[] = [
  { id: 'building-1', name: '竹林小径', description: '静谧幽深的竹林', size: 2, shape: [[1,1]], type: 'building', icon: '🎋' },
  { id: 'building-2', name: '古琴亭台', description: '抚琴修心的场所', size: 4, shape: [[1,1],[1,0],[0,1],[0,0]], type: 'building', icon: '🏯' },
  { id: 'building-3', name: '书画阁楼', description: '创作艺术的空间', size: 3, shape: [[1,0,0],[1,1,1]], type: 'building', icon: '🏛️' },
  { id: 'building-4', name: '茶道小筑', description: '品茶悟道之处', size: 2, shape: [[1,1]], type: 'building', icon: '🏮' },
  { id: 'building-5', name: '梅花小院', description: '赏梅品香之地', size: 2, shape: [[1,1]], type: 'building', icon: '🌸' },
]

// Create a grid of 8x7 hexagonal cells
const createEmptyGrid = (): GridCell[][] => {
  const grid: GridCell[][] = [];
  for(let row = 0; row < 8; row++) {
    const currentRow: GridCell[] = [];
    for(let col = 0; col < 7; col++) {
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
  const cancelHoldingItem = (e: React.MouseEvent | React.KeyboardEvent) => {
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
  };

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
  }, [holdingItem]);

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
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Hexagonal Grid */}
          <div className="bg-white bg-opacity-10 rounded-lg p-6 flex-grow">
            <h2 className="text-xl font-bold text-white mb-4">家园布局</h2>
            <div className="grid-container">
              {grid.map((row, rowIndex) => (
                <div key={`row-${rowIndex}`} className="hex-row" style={{ marginLeft: rowIndex % 2 === 0 ? '0' : '25px' }}>
                  {row.map((cell, colIndex) => (
                    <div 
                      key={cell.id}
                      className={`hex-cell 
                        ${holdingItem && !cell.content ? 'bg-green-700' : 'bg-gray-700'} 
                        ${cell.content ? 'has-content' : ''} 
                        ${selectedCell?.row === cell.row && selectedCell?.col === cell.col ? 'selected-cell' : ''}`}
                      onClick={() => handleCellClick(cell)}
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
                  ))}
                </div>
              ))}
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
        .grid-container {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .hex-row {
          display: flex;
          gap: 5px;
        }
        
        .hex-cell {
          width: 80px;
          height: 70px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .hex-cell:hover {
          transform: scale(1.05);
          background-color: ${holdingItem ? 'rgba(74, 222, 128, 0.5)' : 'rgba(74, 222, 128, 0.2)'} !important;
        }
        
        .hex-coordinates {
          position: absolute;
          bottom: 5px;
          font-size: 9px;
          color: rgba(255, 255, 255, 0.4);
        }
        
        .hex-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
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
        }
        
        .selected-cell {
          box-shadow: 0 0 0 2px yellow;
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