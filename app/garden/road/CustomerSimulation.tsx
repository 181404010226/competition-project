import { useEffect, useRef } from 'react';
import { isAdjacent } from './RoadBuilder';

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

interface NPC extends GameItem {
  type: 'npc';
  bonusMultiplier?: number;
  bonusPrice?: number;
}

interface Building extends GameItem {
  type: 'building';
  shape: number[][];
  baseConsumption?: number;
  basePrice?: number;
}

interface PlacedItem extends GameItem {
  position: {
    row: number;
    col: number;
  };
  baseConsumption?: number;
  basePrice?: number;
  bonusMultiplier?: number;
  bonusPrice?: number;
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

interface ConsumptionEvent {
  buildingId: string;
  buildingName: string;
  amount: number;
  position: {row: number, col: number};
  timestamp: number;
  isSpecial?: boolean;
}

interface ActiveConsumption {
  amount: number;
  timestamp: number;
  isSpecial?: boolean;
}

interface CustomerSimulationProps {
  grid: GridCell[][];
  selectedCells: {row: number, col: number}[];
  businessStarted: boolean;
  businessStartedRef: React.MutableRefObject<boolean>;
  users: RoadUser[];
  setUsers: React.Dispatch<React.SetStateAction<RoadUser[]>>;
  setTotalCoins: React.Dispatch<React.SetStateAction<number>>;
  setConsumptionEvents: React.Dispatch<React.SetStateAction<ConsumptionEvent[]>>;
  setActiveConsumptions: React.Dispatch<React.SetStateAction<Record<string, ActiveConsumption>>>;
}

export default function CustomerSimulation({
  grid,
  selectedCells,
  businessStarted,
  businessStartedRef,
  users,
  setUsers,
  setTotalCoins,
  setConsumptionEvents,
  setActiveConsumptions
}: CustomerSimulationProps) {
  const lastUpdateTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const coinUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to start the business simulation
  const startBusiness = () => {
    if (selectedCells.length < 2) return;
    
    // Generate random users
    const newUsers: RoadUser[] = [];
    const userCount = Math.floor(Math.random() * 5) + 3; // 3-7 users
    
    for (let i = 0; i < userCount; i++) {
      const isWealthy = Math.random() > 0.7; // 30% chance for wealthy user
      newUsers.push({
        id: `user-${i}`,
        type: isWealthy ? 'wealthy' : 'normal',
        position: Math.random() * selectedCells.length, // Random position on the path
        icon: isWealthy ? '💰' : '👤',
        speed: (Math.random() * 0.3 + 0.1), // Lower speed for more consumption opportunities
        coins: isWealthy ? Math.floor(Math.random() * 30) + 20 : Math.floor(Math.random() * 10) + 1, // Wealthy users have 20-50 coins, normal users 1-10
        consumeCooldown: 5 // Consumption cooldown in seconds
      });
    }
    
    setUsers(newUsers);
    
    // Start interval to process building consumption and earnings
    coinUpdateIntervalRef.current = setInterval(() => {
      // Check for users near buildings and process consumption
      handleBuildingConsumption();
    }, 1000); // Check every second
  };

  // Helper function to check if a building has NPCs nearby
  const getNPCsNearBuilding = (buildingPosition: {row: number, col: number}) => {
    const nearbyNPCs: PlacedItem[] = [];
    
    // Get all NPCs from the grid
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[0].length; col++) {
        const cell = grid[row][col];
        if (cell.content && cell.content.type === 'npc') {
          // Check if this NPC is adjacent to the building
          if (isAdjacent(row, col, buildingPosition.row, buildingPosition.col)) {
            // Get the full PlacedItem data from the original garden layout
            const npcItem = { 
              ...cell.content as NPC, 
              position: { row, col },
              bonusMultiplier: 0.2, // Default bonus multiplier for all NPCs
              bonusPrice: Math.floor(Math.random() * 5) + 1 // Random bonus price between 1-5
            };
            nearbyNPCs.push(npcItem);
          }
        }
      }
    }
    
    return nearbyNPCs;
  };

  // Function to handle building consumption
  const handleBuildingConsumption = () => {
    // Use ref to check if business is started
    if (!businessStartedRef.current) {
      return;
    }
    
    const now = Date.now();
    
    let totalEarned = 0;
    const newConsumptionEvents: ConsumptionEvent[] = [];
    
    // Process each user
    setUsers(prevUsers => {
      return prevUsers.map(user => {
        // Skip if user is on cooldown
        const userLastConsumeTime = user.lastConsumeTime || 0;
        if (now - userLastConsumeTime < user.consumeCooldown * 1000) {
          return user;
        }
        
        // Get user's current position on the path
        const userPosition = Math.floor(user.position);
        if (userPosition >= selectedCells.length) {
          return user;
        }
        
        const userCell = selectedCells[userPosition];
        
        // Check for nearby buildings
        let consumptionAmount = 0;
        
        for (let row = 0; row < grid.length; row++) {
          for (let col = 0; col < grid[0].length; col++) {
            const cell = grid[row][col];
            
            // Only check cells with buildings
            if (cell.content && cell.content.type === 'building') {
              // Check if this building is adjacent to the user's cell
              if (isAdjacent(userCell.row, userCell.col, row, col)) {
                
                // Skip if user already consumed this building recently
                if (user.lastConsumedBuilding === cell.content.id) {
                  continue;
                }
                
                // 70% chance to consume
                const consumeChance = Math.random();
                const willConsume = consumeChance > 0.3;
                
                if (willConsume) {
                  // Calculate consumption amount based on building type and user type
                  const building = cell.content as Building;
                  const baseConsumption = building.baseConsumption || 5; // Default to 5 if not set
                  
                  // Check for nearby NPCs that can boost the building's consumption/price
                  const nearbyNPCs = getNPCsNearBuilding({ row, col });
                  
                  // Calculate bonus multiplier from all nearby NPCs
                  const bonusMultiplier = nearbyNPCs.reduce((total, npc) => 
                    total + (npc.bonusMultiplier || 0), 1); // Start with 1 (100%)
                  
                  // Calculate bonus price from all nearby NPCs
                  const bonusPrice = nearbyNPCs.reduce((total, npc) => 
                    total + (npc.bonusPrice || 0), 0);
                  
                  // Special event - wealthy users might make large purchases (10% chance)
                  const isSpecialPurchase = user.type === 'wealthy' && Math.random() > 0.9;
                  const specialMultiplier = isSpecialPurchase ? Math.floor(Math.random() * 3) + 2 : 1; // 2-4x multiplier
                  
                  // Final consumption calculation, influenced by user type and special events
                  consumptionAmount = Math.floor((baseConsumption * bonusMultiplier + bonusPrice) * 
                    (user.type === 'wealthy' ? 2 : 1) * specialMultiplier); // Wealthy users pay double
                  
                  // Update user data
                  totalEarned += consumptionAmount;
                  
                  // Add consumption event
                  newConsumptionEvents.push({
                    buildingId: building.id,
                    buildingName: building.name,
                    amount: consumptionAmount,
                    position: { row, col },
                    timestamp: now,
                    isSpecial: isSpecialPurchase
                  });
                  
                  // Add visual feedback for this building
                  setActiveConsumptions(prev => ({
                    ...prev,
                    [`${row}-${col}`]: {
                      amount: consumptionAmount,
                      timestamp: now,
                      isSpecial: isSpecialPurchase
                    }
                  }));
                  
                  // Return updated user object
                  return {
                    ...user,
                    lastConsumedBuilding: cell.content.id,
                    lastConsumeTime: now,
                    // Wealthy users might leave with some coins, normal users spend all
                    coins: user.type === 'wealthy' ? Math.max(0, user.coins - consumptionAmount/2) : 0
                  };
                }
              }
            }
          }
        }
        
        return user;
      });
    });
    
    // Update total coins
    if (totalEarned > 0) {
      setTotalCoins(prev => prev + totalEarned);
      
      // Update consumption events
      setConsumptionEvents(prev => {
        // Add new events
        const combined = [...prev, ...newConsumptionEvents];
        // Keep only the latest 10 events
        return combined.slice(-10);
      });
    } else {
      // If no building consumption occurred, still add some baseline income
      const baseIncome = Math.floor(Math.random() * users.length) + 1;
      setTotalCoins(prev => prev + baseIncome);
    }
  };

  // Reset business simulation
  const resetBusiness = () => {
    // Cancel any animation frame and interval
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (coinUpdateIntervalRef.current) {
      clearInterval(coinUpdateIntervalRef.current);
      coinUpdateIntervalRef.current = null;
    }
    
    setUsers([]);
    lastUpdateTimeRef.current = 0;
  };

  // Animation loop for user movement
  useEffect(() => {
    if (!businessStarted || selectedCells.length < 2) return;
    
    const animate = (time: number) => {
      if (!lastUpdateTimeRef.current) {
        lastUpdateTimeRef.current = time;
      }
      
      const deltaTime = (time - lastUpdateTimeRef.current) / 1000; // Convert to seconds
      lastUpdateTimeRef.current = time;
      
      // Update all users' positions
      setUsers(prevUsers => 
        prevUsers.map(user => {
          const newPosition = user.position + user.speed * deltaTime;
          
          // If user reached the end, wrap around to the start
          if (newPosition >= selectedCells.length) {
            return { ...user, position: 0 };
          }
          
          return { ...user, position: newPosition };
        })
      );
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Cleanup animation frame on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (coinUpdateIntervalRef.current) {
        clearInterval(coinUpdateIntervalRef.current);
      }
    };
  }, [businessStarted, selectedCells.length, setUsers]);

  return {
    startBusiness,
    resetBusiness,
    handleBuildingConsumption
  };
}

// Helper functions for economy
export const getBuildingBaseConsumption = (buildingId: string): number => {
  // Define base consumption values for each building type
  switch (buildingId) {
    case 'building-1': // 茶艺馆
      return 8;
    case 'building-2': // 戏曲舞台
      return 15;
    case 'building-3': // 瓷器工坊
      return 12;
    case 'building-4': // 刺绣坊
      return 10;
    case 'building-5': // 剪纸馆
      return 6;
    default:
      return 5; // Default value
  }
};

export const getBuildingBasePrice = (buildingId: string): number => {
  // Define base price values for each building type
  switch (buildingId) {
    case 'building-1': // 茶艺馆
      return 12;
    case 'building-2': // 戏曲舞台
      return 20;
    case 'building-3': // 瓷器工坊
      return 18;
    case 'building-4': // 刺绣坊
      return 15;
    case 'building-5': // 剪纸馆
      return 10;
    default:
      return 10; // Default value
  }
};

export const getNPCBonusMultiplier = (npcId: string): number => {
  // Define bonus multiplier values for each NPC type
  switch (npcId) {
    case 'npc-1': // 剪纸艺人
      return 0.2;
    case 'npc-2': // 瓷器匠人
      return 0.3;
    case 'npc-3': // 戏曲表演者
      return 0.5;
    case 'npc-4': // 刺绣大师
      return 0.25;
    case 'npc-5': // 茶艺师
      return 0.4;
    default:
      return 0.2; // Default value
  }
};

export const getNPCBonusPrice = (npcId: string): number => {
  // Define bonus price values for each NPC type
  switch (npcId) {
    case 'npc-1': // 剪纸艺人
      return 2;
    case 'npc-2': // 瓷器匠人
      return 4;
    case 'npc-3': // 戏曲表演者
      return 6;
    case 'npc-4': // 刺绣大师
      return 3;
    case 'npc-5': // 茶艺师
      return 5;
    default:
      return 2; // Default value
  }
}; 