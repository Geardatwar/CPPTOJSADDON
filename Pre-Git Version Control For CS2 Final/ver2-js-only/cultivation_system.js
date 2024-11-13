import { world, system } from "@minecraft/server";

class CultivationSystem {
    constructor(savedData = null) {
        if (savedData) {
            this.power = savedData.power;
        } else {
            this.power = 0;
        }
        
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
        this.enlightenmentChance = 0.15; // 15% chance of enlightenment
        this.enlightenmentBonus = 2; // 2x power gain when enlightened
    }

    getCurrentStage() {
        for (let i = this.stages.length - 1; i >= 0; i--) {
            if (this.power >= this.stages[i].requiredPower) {
                return this.stages[i];
            }
        }
        return this.stages[0];
    }

    addPower(amount) {
        const oldStage = this.getCurrentStage();
        const finalAmount = this.isEnlightened ? Math.floor(amount * this.enlightenmentBonus) : amount;
        this.power += finalAmount;
        const newStage = this.getCurrentStage();
        return {
            powerGain: finalAmount,
            newPower: this.power,
            stageChanged: oldStage.name !== newStage.name,
            newStage: newStage.name,
            wasEnlightened: this.isEnlightened
        };
    }

    checkEnlightenment() {
        this.isEnlightened = Math.random() < this.enlightenmentChance;
        return this.isEnlightened;
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

// Function to spawn custom Jiangshi zombie in front of player
function spawnRogueCultivatorInFrontOfPlayer(player) {
  try {
      const system = cultivationSystems.get(player.id);
      if (!system || !system.isInQiCondensation()) {
          return;
      }

      const viewDirection = player.getViewDirection();
      const spawnDistance = 3;

      const spawnPos = {
          x: Math.floor(player.location.x + (viewDirection.x * spawnDistance)),
          y: Math.floor(player.location.y),
          z: Math.floor(player.location.z + (viewDirection.z * spawnDistance))
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

// Player spawn handler
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
        player.sendMessage("§e- When in Qi Condensation realm Rogue Cultivators will spawn every 15 ");
    }
});

// Save data periodically
system.runInterval(() => {
    saveAllData();
}, 100); // Save every 5 seconds

// Spawn Jiangshi every 15 seconds
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        spawnRogueCultivatorInFrontOfPlayer(player);
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
                            
                            // Check for enlightenment
                            const isEnlightened = system.checkEnlightenment();
                            
                            const powerGain = Math.floor(Math.random() * 10) + 15; // 15-25 power per meditation
                            const result = system.addPower(powerGain);
                            
                            if (result.stageChanged) {
                                player.onScreenDisplay.setTitle(`§6Stage Breakthrough!`);
                                player.onScreenDisplay.setSubtitle(`§aAdvanced to ${result.newStage}!`);
                                world.sendMessage(`§6${player.name} has advanced to ${result.newStage}!`);
                            } else {
                                player.onScreenDisplay.setTitle(`§6Power Gained!`);
                                if (result.wasEnlightened) {
                                    player.onScreenDisplay.setSubtitle(`§d✨ Enlightened! §a+${result.powerGain} Cultivation Power`);
                                } else {
                                    player.onScreenDisplay.setSubtitle(`§a+${result.powerGain} Cultivation Power`);
                                }
                            }
                            
                            system.meditationTime = 0;
                            system.lastBreakthrough = currentTime;
                            
                            player.onScreenDisplay.setActionBar("§eRelease shift to continue meditation");
                            saveAllData(); // Save immediately after gaining power
                        }
                    }
                }
                
                const nextStageIndex = system.stages.findIndex(s => s.name === currentStage.name) + 1;
                if (nextStageIndex < system.stages.length) {
                    const nextStage = system.stages[nextStageIndex];
                    const progress = Math.floor((system.power / nextStage.requiredPower) * 100);
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