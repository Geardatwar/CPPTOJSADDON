// main.js
import { world, system } from "@minecraft/server";
import { CultivationMath } from "./cultivationModule.js";

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
        this.enlightenmentChance = 0.15;
        this.enlightenmentBonus = 2;
        this.isAlive = true;
    }

    getCurrentStage() {
        const stageIndex = CultivationMath.getCurrentStageIndex(this.power, this.stages);
        return this.stages[stageIndex];
    }

    getProgressToNextStage() {
        const currentStage = this.getCurrentStage();
        const currentStageIndex = this.stages.findIndex(s => s.name === currentStage.name);
        
        if (currentStageIndex === this.stages.length - 1) {
            return 100;
        }

        const nextStage = this.stages[currentStageIndex + 1];
        return CultivationMath.calculateProgress(
            this.power,
            currentStage.requiredPower,
            nextStage.requiredPower
        );
    }

    calculatePowerToPercentage(powerAmount) {
        const currentStage = this.getCurrentStage();
        const currentStageIndex = this.stages.findIndex(s => s.name === currentStage.name);
        
        if (currentStageIndex === this.stages.length - 1) {
            return 0;
        }

        const nextStage = this.stages[currentStageIndex + 1];
        return CultivationMath.calculateProgress(
            powerAmount,
            currentStage.requiredPower,
            nextStage.requiredPower
        );
    }

    addPower(amount) {
        const oldStage = this.getCurrentStage();
        const finalAmount = CultivationMath.calculatePowerGain(
            amount,
            this.isEnlightened,
            this.enlightenmentBonus
        );
        
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

    checkEnlightenment() {
        this.isEnlightened = CultivationMath.rollForEnlightenment(this.enlightenmentChance);
        return this.isEnlightened;
    }

    isInQiCondensation() {
        return this.getCurrentStage().name === "Qi Condensation";
    }

    getMeditationProgress() {
        return CultivationMath.calculateMeditationProgress(this.meditationTime, 100);
    }
}

const cultivationSystems = new Map();
const recentlyDiedPlayers = new Map();

// Changed to use system events instead of world initialization
world.afterEvents.worldLoad.subscribe(() => {
  try {
      // Initialize with empty data if none exists
      if (!world.getDynamicProperty("cultivationData")) {
          world.setDynamicProperty("cultivationData", JSON.stringify({}));
      }
      
      // Initialize the math module
      CultivationMath.initialize().catch(e => {
          console.warn("Failed to initialize cultivation math:", e);
      });
  } catch (e) {
      console.warn("Failed to setup properties:", e);
  }
});

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

        player.dimension.runCommand(`attribute @e[type=vindicator,c=1,r=5] minecraft:generic.max_health base set 30`);
        player.dimension.runCommand(`effect @e[type=vindicator,c=1,r=5] instant_health 1 255 true`);
        player.dimension.runCommand(`effect @e[type=vindicator,c=1,r=5] strength 999999 0 true`);
        player.dimension.runCommand(`effect @e[type=vindicator,c=1,r=5] resistance 999999 0 true`);
    } catch (error) {
        console.warn(`Error spawning Rogue Cultivator: ${error}`);
    }
}

function applyCombatModifiers(player, stage) {
    try {
        player.dimension.runCommand(`effect "${player.name}" strength ${stage.damageBonus} 1 true`);
        player.dimension.runCommand(`effect "${player.name}" resistance ${stage.defenseBonus} 1 true`);
    } catch (e) {
        console.warn(`Failed to apply combat modifiers: ${e}`);
    }
}


// Event handlers for player death
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
              recentlyDiedPlayers.set(player.id, true);
              saveAllData();
          }
      }
  } catch (error) {
      console.warn(`Error handling player death: ${error}`);
  }
});

world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    
    if (!cultivationSystems.has(player.id)) {
        const savedData = loadAllData();
        cultivationSystems.set(player.id, new CultivationSystem(savedData[player.id] ? { power: savedData[player.id] } : null));
        
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

    if (recentlyDiedPlayers.get(player.id)) {
        player.onScreenDisplay.setTitle("§cCultivation Lost!");
        recentlyDiedPlayers.delete(player.id);
    }
});

// Intervals
system.runInterval(() => {
    saveAllData();
}, 100);

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        spawnRogueCultivatorAroundPlayer(player);
    }
}, 300);

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
                    
                    const progress = system.getMeditationProgress();
                    
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
                                player.onScreenDisplay.setTitle(`§aAdvanced to ${result.newStage}!`);
                                world.sendMessage(`§6${player.name} has advanced to ${result.newStage}!`);
                            } else {
                                world.sendMessage(`§6Minor Realm Increase: +${result.progressGained}% Tip: unshift`);
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

system.runTimeout(() => {
    world.sendMessage("§aCultivation System initialized!");
}, 20);