import { world, system } from "@minecraft/server";
import enlightenmentCalculator from "./enlightenmentCalculatorModule.js";

// Function to initialize and check the enlightenment calculator
async function checkAndRollForEnlightenment(chance) {
    try {
        if (!enlightenmentCalculator.initialized) {
            await enlightenmentCalculator.initialize();
        }
        
        if (typeof enlightenmentCalculator.rollForEnlightenment === "function") {
            return enlightenmentCalculator.rollForEnlightenment(chance);
        } else {
            console.warn("rollForEnlightenment function is not available in the enlightenment calculator module.");
            return false; // Default to not enlightened if the function is missing
        }
    } catch (error) {
        console.warn(`Error checking enlightenment calculator: ${error}`);
        return false;
    }
}

class CultivationSystem {
    constructor(savedData = null) {
        // Existing properties
        this.power = savedData ? savedData.power : 0;
        this.stages = [
            {name: "Mortal", requiredPower: 0, damageBonus: 0, defenseBonus: 0},
            {name: "Qi Condensation", requiredPower: 100, damageBonus: 2, defenseBonus: 1},
            {name: "Foundation Establishment", requiredPower: 300, damageBonus: 4, defenseBonus: 2},
            {name: "Core Formation", requiredPower: 600, damageBonus: 6, defenseBonus: 3},
            {name: "Nascent Soul", requiredPower: 1000, damageBonus: 8, defenseBonus: 4}
        ];
        this.meditationTime = 0;
        this.lastBreakthrough = 0;
        this.isInBreakthrough = false;
        this.isEnlightened = false;
        this.enlightenmentChance = 0.15;
        this.enlightenmentBonus = 2;
        this.isAlive = true;
    } 

    checkEnlightenment() {
        this.isEnlightened = checkAndRollForEnlightenment(this.enlightenmentChance);
        return this.isEnlightened;
    }

    getCurrentStage() {
        for (let i = this.stages.length - 1; i >= 0; i--) {
            if (this.power >= this.stages[i].requiredPower) {
                return this.stages[i];
            }
        }
        return this.stages[0];
    }

    getProgressToNextStage() {
        const currentStage = this.getCurrentStage();
        const currentStageIndex = this.stages.findIndex(s => s.name === currentStage.name);
        
        if (currentStageIndex === this.stages.length - 1) {
            return 100; // Already at max stage
        }

        const nextStage = this.stages[currentStageIndex + 1];
        const powerInCurrentStage = this.power - currentStage.requiredPower;
        const powerRequiredForNextStage = nextStage.requiredPower - currentStage.requiredPower;
        
        return Math.floor((powerInCurrentStage / powerRequiredForNextStage) * 100);
    }

    calculatePowerToPercentage(powerAmount) {
        const currentStage = this.getCurrentStage();
        const currentStageIndex = this.stages.findIndex(s => s.name === currentStage.name);
        
        if (currentStageIndex === this.stages.length - 1) {
            return 0; // No percentage if at max stage
        }

        const nextStage = this.stages[currentStageIndex + 1];
        const powerRequiredForNextStage = nextStage.requiredPower - currentStage.requiredPower;
        
        return Math.floor((powerAmount / powerRequiredForNextStage) * 100);
    }

    addPower(amount) {
        const oldStage = this.getCurrentStage();
        const finalAmount = this.isEnlightened ? Math.floor(amount * this.enlightenmentBonus) : amount;
        
        // Calculate percentage this power gain represents
        const percentageGained = this.calculatePowerToPercentage(finalAmount);
        
        this.power += finalAmount;
        const newStage = this.getCurrentStage();

        return {
            powerGain: finalAmount,
            newPower: this.power,
            stageChanged: oldStage.name !== newStage.name,
            newStage: newStage.name,
            wasEnlightened: this.isEnlightened,
            progressGained: percentageGained
        };
    }

    isInQiCondensation() {
        const currentStage = this.getCurrentStage();
        return currentStage.name === "Qi Condensation";
    }
}

const cultivationSystems = new Map();

// Dynamic property setup for persistence
world.afterEvents.worldInitialize.subscribe(() => {
    try {
        const def = new DynamicPropertiesDefinition();
        def.defineString("cultivationData", 16384); // Plenty of space for JSON data
        world.setDynamicPropertyDefinition(def);
    } catch (e) {
        console.warn("Failed to setup dynamic properties:", e);
    }
});

// Save/Load functions
function saveAllData() {
    try {
        const saveData = {};
        for (const [playerId, system] of cultivationSystems) {
            saveData[playerId] = system.power;
        }
        world.setDynamicProperty("cultivationData", JSON.stringify(saveData));
    } catch (e) {
        console.warn("Failed to save cultivation data:", e);
    }
}

function loadAllData() {
    try {
        const savedDataStr = world.getDynamicProperty("cultivationData");
        if (savedDataStr) {
            return JSON.parse(savedDataStr);
        }
    } catch (e) {
        console.warn("Failed to load cultivation data:", e);
    }
    return {};
}

/// Function to spawn custom Rogue Cultivator in random location around player
function spawnRogueCultivatorAroundPlayer(player) {
  try {
      const system = cultivationSystems.get(player.id);
      if (!system || !system.isInQiCondensation()) {
          return;
      }

      // Generate random angle and distance
      const angle = Math.random() * 2 * Math.PI; // Random angle in radians
      const distance = Math.random() * 3; // Random distance up to 3 blocks

      // Calculate spawn position
      const spawnPos = {
          x: Math.floor(player.location.x + Math.cos(angle) * distance),
          y: Math.floor(player.location.y),
          z: Math.floor(player.location.z + Math.sin(angle) * distance)
      };

      // Spawn the vindicator
      const vindicator = player.dimension.spawnEntity("minecraft:vindicator", spawnPos);

      // Set name tag
      vindicator.nameTag = "Rogue Cultivator";

      // Apply attributes and effects
      player.dimension.runCommand(`attribute @e[type=vindicator,c=1,r=5] minecraft:generic.max_health base set 30`);
      player.dimension.runCommand(`effect @e[type=vindicator,c=1,r=5] instant_health 1 255 true`);
      player.dimension.runCommand(`effect @e[type=vindicator,c=1,r=5] strength 999999 0 true`);
      player.dimension.runCommand(`effect @e[type=vindicator,c=1,r=5] resistance 999999 0 true`);

  } catch (error) {
      console.warn(`Error spawning Rogue Cultivator: ${error}`);
  }
}

// Apply combat modifiers based on cultivation stage
function applyCombatModifiers(player, stage) {
    try {
        player.dimension.runCommand(`effect "${player.name}" strength ${stage.damageBonus} 1 true`);
        player.dimension.runCommand(`effect "${player.name}" resistance ${stage.defenseBonus} 1 true`);
    } catch (e) {
        console.warn(`Failed to apply combat modifiers: ${e}`);
    }
}

// Load saved data on world start
system.runTimeout(() => {
    const savedData = loadAllData();
    for (const player of world.getAllPlayers()) {
        if (savedData[player.id]) {
            cultivationSystems.set(player.id, new CultivationSystem({ power: savedData[player.id] }));
        }
    }
}, 1);

// Add a Map to track player deaths at the top level with other declarations
const recentlyDiedPlayers = new Map();

// Modify your death handler to add the recentlyDied tracking:
world.afterEvents.entityDie.subscribe((event) => {
  try {
      const player = event.deadEntity;
      if (player.typeId === "minecraft:player") {
          const system = cultivationSystems.get(player.id);
          if (system) {
              system.power = 0;
              system.meditationTime = 0;
              system.isInBreakthrough = false;
              system.isAlive = false;
              recentlyDiedPlayers.set(player.id, true);  // Add this line
              saveAllData();
          }
      }
  } catch (error) {
      console.warn(`Error handling player death: ${error}`);
  }
});

// Modify your spawn handler to check the recentlyDied status:
world.afterEvents.playerSpawn.subscribe((event) => {
  const player = event.player;
  
  if (!cultivationSystems.has(player.id)) {
      const savedData = loadAllData();
      cultivationSystems.set(player.id, new CultivationSystem(savedData[player.id] ? { power: savedData[player.id] } : null));
      
      // Send instructions
      player.sendMessage("§6=== Cultivation System ===");
      player.sendMessage("§e- Hold shift to meditate and gain power");
      player.sendMessage("§e- Higher stages grant combat bonuses");
      player.sendMessage("§e- Release shift after gaining power to continue");
      player.sendMessage("§e- Sometimes you'll become enlightened during meditation for bonus power!");
      player.sendMessage("§e- When in Qi Condensation realm Rogue Cultivators will spawn every 15 seconds");
      player.sendMessage("§c- If you die, you will lose all cultivation progress!");
      player.onScreenDisplay.setTitle(`§aEnter/t opens chat`);
  } 

  const system = cultivationSystems.get(player.id);
  if (system) {
      system.isAlive = true;
  }

  // Check if player died and show message
  if (recentlyDiedPlayers.get(player.id)) {
      player.onScreenDisplay.setTitle("§cCultivation Lost!");
      recentlyDiedPlayers.delete(player.id);  // Remove the death flag after showing message
  }
});

// Save data periodically
system.runInterval(() => {
    saveAllData();
}, 100); // Save every 5 seconds

// Spawn Rogue Cultivator every 15 seconds
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        spawnRogueCultivatorAroundPlayer(player);
    }
}, 300); // 300 ticks = 15 seconds

// Meditation tick handler
system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
      try {
          const system = cultivationSystems.get(player.id);
          if (!system) continue;

          const currentStage = system.getCurrentStage();
          applyCombatModifiers(player, currentStage);

          if (player.isSneaking) {
              if (!system.isInBreakthrough) {
                  system.meditationTime++;
                  
                  const progress = Math.min(Math.floor((system.meditationTime / 100) * 100), 100);
                  
                  if (progress < 100) {
                      player.onScreenDisplay.setActionBar(`§eMeditating... ${progress}%`);
                  }

                  if (system.meditationTime >= 100) {
                      const currentTime = Date.now();
                      if (currentTime - system.lastBreakthrough >= 2000) {
                          system.isInBreakthrough = true;
                          system.checkEnlightenment();
                          const powerGain = Math.floor(Math.random() * 10) + 15;
                          const result = system.addPower(powerGain);
                          
                          if (system.isEnlightened) {
                              player.onScreenDisplay.setTitle(`§dAchieved Enlightenment: +${result.progressGained}%`);
                          } else if (result.stageChanged) {
                              // Reverted to original breakthrough display
                              player.onScreenDisplay.setTitle(`§aAdvanced to ${result.newStage}!`);
                              world.sendMessage(`§6${player.name} has advanced to ${result.newStage}!`);
                          } else {
                              //player.onScreenDisplay.setTitle(`§6Minor Realm Increase: +${result.progressGained}%`);
                              world.sendMessage(`§6Minor Realm Increase: +${result.progressGained}%% Tip: unshift`);
                          }
                          
                          system.meditationTime = 0;
                          system.lastBreakthrough = currentTime;
                          saveAllData();
                      }
                  }
              }
              
              const progress = system.getProgressToNextStage();
              const nextStageIndex = system.stages.findIndex(s => s.name === currentStage.name) + 1;
              if (nextStageIndex < system.stages.length) {
                  const nextStage = system.stages[nextStageIndex];
                  player.onScreenDisplay.setActionBar(`§6${currentStage.name} - Progress to ${nextStage.name}: ${progress}%`);
              }
          } else {
              system.meditationTime = 0;
              system.isInBreakthrough = false;
              system.isEnlightened = false;
          }
      } catch (error) {
          console.warn(`Error in meditation handler: ${error}`);
      }
  }
}, 1);


// Player hit handler for combat benefits
world.beforeEvents.entityHurt.subscribe((event) => {
    const source = event.damageSource;
    if (source.damagingEntity?.id) {
        const system = cultivationSystems.get(source.damagingEntity.id);
        if (system) {
            const stage = system.getCurrentStage();
            event.damage += stage.damageBonus;
        }
    }
});

// Initialize message
system.runTimeout(() => {
    world.sendMessage("§aCultivation System initialized!");
}, 20);