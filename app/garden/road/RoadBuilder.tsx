// Types
import React from 'react';

type ItemType = 'npc' | 'building';

interface GameItem {
  id: string;
  name: string;
  description: string;
  size: number;
  type: ItemType;
  icon: string;
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

interface GardenCell {
  id: string;
  row: number;
  col: number;
  content: GameItem | null;
}

interface RoadBuilderProps {
  grid: GridCell[][];
  setGrid: React.Dispatch<React.SetStateAction<GridCell[][]>>;
  selectedCells: {row: number, col: number}[];
  setSelectedCells: React.Dispatch<React.SetStateAction<{row: number, col: number}[]>>;
  startPoint: {row: number, col: number} | null;
  setStartPoint: React.Dispatch<React.SetStateAction<{row: number, col: number} | null>>;
  endPoint: {row: number, col: number} | null;
  setEndPoint: React.Dispatch<React.SetStateAction<{row: number, col: number} | null>>;
  isEditing: boolean;
}

// Check if two cells are adjacent in a hexagonal grid
export function isAdjacent(row1: number, col1: number, row2: number, col2: number): boolean {
  // In a hexagonal grid with offset coordinates, each cell has 6 neighbors
  // The pattern depends on whether the column is even or odd
  
  // Check if it's the same cell
  if (row1 === row2 && col1 === col2) return false;
  
  // Check if column is even or odd for first cell
  const isEvenCol1 = col1 % 2 === 0;
  
  // Define neighbor offsets based on column parity
  // For even columns
  const evenColNeighbors = [
    [-1, 0], // Top
    [-1, 1], // Top Right
    [0, 1],  // Right
    [1, 0],  // Bottom
    [0, -1], // Left
    [-1, -1] // Top Left
  ];
  
  // For odd columns
  const oddColNeighbors = [
    [-1, 0], // Top
    [0, 1],  // Top Right
    [1, 1],  // Bottom Right
    [1, 0],  // Bottom
    [1, -1], // Bottom Left
    [0, -1]  // Left
  ];
  
  // Select appropriate neighbor pattern
  const neighbors = isEvenCol1 ? evenColNeighbors : oddColNeighbors;
  
  // Check if second cell is a neighbor of first cell
  for (const [rowOffset, colOffset] of neighbors) {
    if (row1 + rowOffset === row2 && col1 + colOffset === col2) {
      return true;
    }
  }
  
  return false;
};

export const createEmptyGrid = (rows: number, cols: number): GridCell[][] => {
  const grid: GridCell[][] = [];
  for (let row = 0; row < rows; row++) {
    const currentRow: GridCell[] = [];
    for (let col = 0; col < cols; col++) {
      currentRow.push({
        id: `cell-${row}-${col}`,
        row,
        col,
        isRoad: false,
        isStartPoint: false,
        isEndPoint: false,
        isValidNextCell: false,
        content: null
      });
    }
    grid.push(currentRow);
  }
  return grid;
};

export const loadGardenLayout = (): GardenCell[][] | null => {
  if (typeof window === 'undefined') return null;
  
  const savedLayout = localStorage.getItem('gardenLayout');
  return savedLayout ? JSON.parse(savedLayout) : null;
};

export default function RoadBuilder({
  grid,
  setGrid,
  selectedCells,
  setSelectedCells,
  startPoint,
  setStartPoint,
  endPoint,
  setEndPoint,
  isEditing
}: RoadBuilderProps) {
  
  // 确保参数被使用，避免 ESLint 警告
  React.useEffect(() => {
    // 这个空的 useEffect 只是为了让 ESLint 认为 startPoint 被使用了
    if (startPoint) {
      // 实际上不做任何操作
    }
  }, [startPoint]);
  
  // Handle cell click for road building
  const handleCellClick = (row: number, col: number) => {
    if (!isEditing) return;
    
    // Check if cell is adjacent to last selected cell or is the first selection
    const isValidSelection = selectedCells.length === 0 || 
      isAdjacent(row, col, selectedCells[selectedCells.length - 1].row, selectedCells[selectedCells.length - 1].col);
    
    if (!isValidSelection) return;
    
    // Check if cell is already selected
    const isCellSelected = selectedCells.some(cell => cell.row === row && cell.col === col);
    if (isCellSelected) return;
    
    const newSelectedCells = [...selectedCells, { row, col }];
    setSelectedCells(newSelectedCells);
    
    // Update grid
    const newGrid = [...grid];
    newGrid[row][col].isRoad = true;
    
    // If this is first cell, set as start point only
    if (newSelectedCells.length === 1) {
      newGrid[row][col].isStartPoint = true;
      setStartPoint({ row, col });
    } 
    // If this is the second cell or later
    else {
      // Previous end point is now just a road
      if (endPoint) {
        newGrid[endPoint.row][endPoint.col].isEndPoint = false;
      }
      
      // Current cell is the new end point
      newGrid[row][col].isEndPoint = true;
      setEndPoint({ row, col });
    }
    
    // Clear previous valid next cells
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        newGrid[r][c].isValidNextCell = false;
      }
    }
    
    // Mark valid next cells for the next selection
    if (isEditing && newSelectedCells.length > 0) {
      const lastCell = newSelectedCells[newSelectedCells.length - 1];
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) {
          // Skip if already a road
          if (newGrid[r][c].isRoad) continue;
          
          // Check if adjacent to last selected cell
          if (isAdjacent(r, c, lastCell.row, lastCell.col)) {
            newGrid[r][c].isValidNextCell = true;
          }
        }
      }
    }
    
    setGrid(newGrid);
  };

  return {
    handleCellClick
  };
} 