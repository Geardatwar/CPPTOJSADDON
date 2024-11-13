import { world, system } from "@minecraft/server";

// Import the enlightenment calculator module
import { EnlightenmentCalculator } from "./enlightenmentCalculatorModule.js";

let enlightenmentState = {
    calculator: null,
    isInitialized: false,
};

async function initializeEnlightenmentCalculator() {
    try {
        await EnlightenmentCalculator.initialize();
        enlightenmentState.calculator = EnlightenmentCalculator;
        enlightenmentState.isInitialized = true;
        console.warn("[Cultivation] Enlightenment calculator initialized successfully");
        return true;
    } catch (error) {
        console.warn(`[Cultivation] Failed to initialize enlightenment calculator: ${error}`);
        enlightenmentState.isInitialized = false;
        return false;
    }
}

function checkEnlightenmentStatus(chance) {
    try {
        if (!enlightenmentState.isInitialized) {
            console.warn("[Cultivation] Enlightenment calculator not initialized, using fallback");
            return Math.random() < chance; // Fallback system
        }
        //console.warn("Enlightenment check passed");
        return enlightenmentState.calculator.rollForEnlightenment(chance);
    } catch (error) {
        console.warn(`[Cultivation] Error in enlightenment check: ${error}`);
        return Math.random() < chance; // Fallback system
    }
}

class CultivationSystem {
    constructor(savedData = null) {
        this.power = savedData ? savedData.power : 0;
        this.stages = [
            { name: "Mortal", requiredPower: 0, damageBonus: 0, defenseBonus: 0 },
            { name: "Qi Condensation", requiredPower: 100, damageBonus: 2, defenseBonus: 1 },
            { name: "Foundation Establishment", requiredPower: 300, damageBonus: 4, defenseBonus: 2 },
            { name: "Core Formation", requiredPower: 600, damageBonus: 6, defenseBonus: 3 },
            { name: "Nascent Soul", requiredPower: 1000, damageBonus: 8, defenseBonus: 4 },
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
        this.isEnlightened = checkEnlightenmentStatus(this.enlightenmentChance);
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

// Initialize the system with the enlightenment calculator
system.run(async () => {
    const moduleInitialized = await initializeEnlightenmentCalculator();
    if (moduleInitialized) {
        world.sendMessage("§aCultivation System initialized with advanced enlightenment calculations!");
    } else {
        world.sendMessage("§eCultivation System initialized with basic enlightenment calculations.");
    }

    // Load saved data and continue with initialization
    const savedData = loadAllData();
    for (const player of world.getAllPlayers()) {
        if (savedData[player.id]) {
            cultivationSystems.set(player.id, new CultivationSystem({ power: savedData[player.id].power }));
        }
    }
});

const cultivationSystems = new Map();
const recentlyDiedPlayers = new Map();

function saveAllData() {
    try {
        const saveData = {};
        for (const [playerId, system] of cultivationSystems) {
            saveData[playerId] = {
                power: system.power,
                meditationTime: system.meditationTime,
                lastBreakthrough: system.lastBreakthrough,
                isInBreakthrough: system.isInBreakthrough,
                isEnlightened: system.isEnlightened
            };
        }
        const serializedData = JSON.stringify(saveData);
        world.setDynamicProperty("cultivationData", serializedData);
    } catch (e) {
        console.warn("Failed to save cultivation data:", e);
    }
}

function loadAllData() {
    try {
        const savedDataStr = world.getDynamicProperty("cultivationData");
        if (!savedDataStr) {
            return {};
        }
        const data = JSON.parse(savedDataStr);
        // Validate and migrate old data format if necessary
        const migratedData = {};
        for (const [playerId, savedState] of Object.entries(data)) {
            if (typeof savedState === 'number') {
                // Old format - just power
                migratedData[playerId] = {
                    power: savedState,
                    meditationTime: 0,
                    lastBreakthrough: 0,
                    isInBreakthrough: false,
                    isEnlightened: false
                };
            } else {
                // New format
                migratedData[playerId] = savedState;
            }
        }
        return migratedData;
    } catch (e) {
        console.warn("Failed to load cultivation data:", e);
        return {};
    }
}

// Function to spawn custom Rogue Cultivator in random location around player
function spawnRogueCultivatorAroundPlayer(player) {
    try {
        const system = cultivationSystems.get(player.id);
        if (!system || !system.isInQiCondensation()) {
            return;
        }

        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 3;

        const spawnPos = {
            x: Math.floor(player.location.x + Math.cos(angle) * distance),
            y: Math.floor(player.location.y),
            z: Math.floor(player.location.z + Math.sin(angle) * distance)
        };

        const vindicator = player.dimension.spawnEntity("minecraft:vindicator", spawnPos);
        vindicator.nameTag = "Rogue Cultivator";
        
        // Using direct commands on the vindicator entity
        player.runCommand(`effect @e[name="Rogue Cultivator",r=5] health_boost 999999 4 true`);
        player.runCommand(`effect @e[name="Rogue Cultivator",r=5] instant_health 1 255 true`);
        player.runCommand(`effect @e[name="Rogue Cultivator",r=5] strength 999999 0 true`);
        player.runCommand(`effect @e[name="Rogue Cultivator",r=5] resistance 999999 0 true`);
        player.sendMessage("§c A Rogue Cultivator Found You!");
    } catch (error) {
        console.warn(`Error spawning Rogue Cultivator: ${error}`);
    }
}

// Load saved data on world start
system.run(() => {
    const savedData = loadAllData();
    for (const player of world.getAllPlayers()) {
        if (savedData[player.id]) {
            cultivationSystems.set(player.id, new CultivationSystem({ power: savedData[player.id].power }));
        }
    }
});

// Update the entity death handler
world.beforeEvents.playerLeave.subscribe((eventData) => {
    saveAllData();
});

// Modified death handler
world.afterEvents.entityDie.subscribe((eventData) => {
    try {
        const player = eventData.deadEntity;
        if (player.typeId === "minecraft:player") {
            const system = cultivationSystems.get(player.id);
            if (system) {
                system.power = 0;
                system.meditationTime = 0;
                system.isInBreakthrough = false;
                system.isAlive = false;
                system.isEnlightened = false;  // Reset enlightenment
                recentlyDiedPlayers.set(player.id, true);
                saveAllData();
            }
        }
    } catch (error) {
        console.warn(`Error handling player death: ${error}`);
    }
});

// Update spawn handler to properly reset meditation state
world.afterEvents.playerSpawn.subscribe((eventData) => {
    const player = eventData.player;
    
    if (!cultivationSystems.has(player.id)) {
        const savedData = loadAllData();
        const playerData = savedData[player.id];
        
        const system = new CultivationSystem(playerData || null);
        cultivationSystems.set(player.id, system);
        
        player.sendMessage("§6=== Cultivation System ===");
        player.sendMessage("§e- Hold shift to meditate and gain power");
        player.sendMessage("§e- Higher stages grant combat bonuses");
        player.sendMessage("§e- When in Qi Condensation realm Rogue Cultivators will spawn");
        player.sendMessage("§e- Sometimes you'll become enlightened during meditation for bonus power!");
        player.sendMessage("§c- If you die, you will lose all cultivation progress!");
        player.onScreenDisplay.setTitle(`§a Press enter to open chat`);
    } 

    // Reset meditation state on spawn
    const system = cultivationSystems.get(player.id);
    if (system) {
        system.isAlive = true;
        system.meditationTime = 0;
        system.isInBreakthrough = false;
        system.isEnlightened = false;
    }

    if (recentlyDiedPlayers.get(player.id)) {
        player.onScreenDisplay.setTitle("§cCultivation Lost!");
        recentlyDiedPlayers.delete(player.id);
    }
});

// Update damage handler
world.afterEvents.entityHitEntity.subscribe((eventData) => {
    try {
        const source = eventData.damagingEntity;
        const target = eventData.hitEntity;
        
        if (source?.id) {
            const system = cultivationSystems.get(source.id);
            if (system) {
                const stage = system.getCurrentStage();
                applyCombatModifiers(source, stage);
            }
        }
    } catch (error) {
        console.warn(`Error in combat handler: ${error}`);
    }
});

// Update the applyCombatModifiers function to be more robust
function applyCombatModifiers(player, stage) {
    try {
        // Apply strength effect based on damageBonus from the player's current stage
        if (stage.damageBonus > 0) {
            player.runCommand(`effect @s strength 999999 ${stage.damageBonus - 1} true`);
        }
        // Apply resistance effect based on defenseBonus from the player's current stage
        if (stage.defenseBonus > 0) {
            player.runCommand(`effect @s resistance 999999 ${stage.defenseBonus - 1} true`);
        }
    } catch (e) {
        console.warn(`Failed to apply combat modifiers: ${e}`);
    }
}

// Autosave interval
system.runInterval(() => {
    if (world.getAllPlayers().length > 0) {
        saveAllData();
    }
}, 200);

// Spawn Rogue Cultivator interval
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        spawnRogueCultivatorAroundPlayer(player);
    }
}, 500);

// Meditation tick handler
// Update meditation tick handler to check isAlive
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        try {
            const system = cultivationSystems.get(player.id);
            if (!system || !system.isAlive) continue;  // Skip if system doesn't exist or player is dead

            const currentStage = system.getCurrentStage();
            applyCombatModifiers(player, currentStage);

            if (player.isSneaking) {
                system.meditationTime++;
                
                const meditationProgress = Math.min(Math.floor((system.meditationTime / 100) * 100), 100);
                
                if (meditationProgress < 100) {
                    player.onScreenDisplay.setActionBar(`§eMeditating... ${meditationProgress}%`);
                }

                if (system.meditationTime >= 100) {
                    const currentTime = Date.now();
                    if (currentTime - system.lastBreakthrough >= 2000) {
                        system.checkEnlightenment();
                        const powerGain = Math.floor(Math.random() * 10) + 15;
                        const result = system.addPower(powerGain);
                        
                        // Calculate actual stage progress
                        const stageProgress = system.getProgressToNextStage();
                        const nextStageIndex = system.stages.findIndex(s => s.name === currentStage.name) + 1;
                        
                        if (result.stageChanged) {
                            player.sendMessage(`§a☄ Breakthrough! Advanced to ${result.newStage}!`);
                            world.sendMessage(`§6${player.name} has advanced to ${result.newStage}!`);
                        } else if (nextStageIndex < system.stages.length) {
                            const nextStage = system.stages[nextStageIndex];
                            let message = `§6${currentStage.name} - Progress to ${nextStage.name}: ${stageProgress}%% + ${result.powerGain} Power`;
                            if (result.wasEnlightened) {
                                message += " §d(Enlightened!)";
                            }
                            player.sendMessage(message);
                        }
                        
                        system.meditationTime = 0;
                        system.lastBreakthrough = currentTime;
                        saveAllData();
                    }
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

// Initialize message
system.run(() => {
    world.sendMessage("§aCultivation System initialized!");
});