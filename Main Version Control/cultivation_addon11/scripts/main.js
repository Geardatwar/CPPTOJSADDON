import { world, system } from "@minecraft/server";
import { ProgressCalculator } from "./progressCalculatorModule.js";
import { MeditationCalculator } from "./meditationCalculatorModule.js";
import { EnlightenmentCalculator } from "./enlightenmentCalculatorModule.js";
import { PowerCalculator } from "./powerCalculatorModule.js";

function debug(message) {
    console.warn(`[Debug] ${message}`);
}

// Simplified CultivationSystem that works with C++ modules
class CultivationSystem {
    constructor(savedData = null) {
        this.power = savedData?.power || 0;
        this.meditationTime = savedData?.meditationTime || 0;
        this.isInBreakthrough = savedData?.isInBreakthrough || false;
        this.isEnlightened = savedData?.isEnlightened || false;
        
        // Only store stage requirements, let C++ handle calculations
        this.stageRequirements = [
            { name: "Mortal", power: 0 },
            { name: "Qi Condensation", power: 100 },
            { name: "Foundation Establishment", power: 300 },
            { name: "Core Formation", power: 600 },
            { name: "Nascent Soul", power: 1000 }
        ];
    }

    getCurrentStage() {
        for (let i = this.stageRequirements.length - 1; i >= 0; i--) {
            if (this.power >= this.stageRequirements[i].power) {
                return this.stageRequirements[i];
            }
        }
        return this.stageRequirements[0];
    }

    async getProgress() {
        try {
            const currentStage = this.getCurrentStage();
            const currentIndex = this.stageRequirements.findIndex(s => s.name === currentStage.name);
            
            if (currentIndex === this.stageRequirements.length - 1) {
                return 100;
            }

            const nextStage = this.stageRequirements[currentIndex + 1];
            
            // Use C++ module for calculation
            await ProgressCalculator.initialize();
            return ProgressCalculator.calculateProgressToNextStage(
                this.power,
                currentStage.power,
                nextStage.power
            );
        } catch (error) {
            debug(`Progress calculation error: ${error}`);
            return 0;
        }
    }

    async addPower(amount) {
        const oldStage = this.getCurrentStage();
        this.power += amount;
        const newStage = this.getCurrentStage();
        
        const progress = await this.getProgress();
        
        return {
            powerGain: amount,
            newPower: this.power,
            stageChanged: oldStage.name !== newStage.name,
            newStage: newStage.name,
            progressGained: progress
        };
    }

    reset() {
        this.power = 0;
        this.meditationTime = 0;
        this.isInBreakthrough = false;
        this.isEnlightened = false;
    }
}

const cultivationSystems = new Map();

// Save/Load functions
function saveAllData() {
    try {
        const saveData = {};
        for (const [playerId, system] of cultivationSystems) {
            saveData[playerId] = {
                power: system.power,
                meditationTime: system.meditationTime,
                isInBreakthrough: system.isInBreakthrough,
                isEnlightened: system.isEnlightened
            };
        }
        world.setDynamicProperty("cultivationData", JSON.stringify(saveData));
    } catch (e) {
        debug(`Failed to save cultivation data: ${e}`);
    }
}

function loadAllData() {
    try {
        const savedDataStr = world.getDynamicProperty("cultivationData");
        if (savedDataStr) {
            return JSON.parse(savedDataStr);
        }
    } catch (e) {
        debug(`Failed to load cultivation data: ${e}`);
    }
    return {};
}

// Meditation handler
system.runInterval(async () => {
    for (const player of world.getAllPlayers()) {
        try {
            const system = cultivationSystems.get(player.id);
            if (!system) continue;

            if (player.isSneaking) {
                system.meditationTime++;
                
                const progress = Math.min(Math.floor((system.meditationTime / 100) * 100), 100);
                
                if (progress < 100) {
                    player.onScreenDisplay.setActionBar(`§eMeditating... ${progress}%`);
                }

                if (system.meditationTime >= 100) {
                    const powerGain = Math.floor(Math.random() * 10) + 15;
                    const result = await system.addPower(powerGain);
                    
                    if (result.stageChanged) {
                        player.onScreenDisplay.setTitle(`§aAdvanced to ${result.newStage}!`);
                        world.sendMessage(`§6${player.name} has advanced to ${result.newStage}!`);
                    } else {
                        player.onScreenDisplay.setTitle(`§6Power Increased: +${result.progressGained}%`);
                    }
                    
                    system.meditationTime = 0;
                    saveAllData();
                }

                const currentStage = system.getCurrentStage();
                const stageProgress = await system.getProgress();
                const nextStageIndex = system.stageRequirements.findIndex(s => s.name === currentStage.name) + 1;
                
                if (nextStageIndex < system.stageRequirements.length) {
                    const nextStage = system.stageRequirements[nextStageIndex];
                    player.onScreenDisplay.setActionBar(`§6${currentStage.name} - Progress to ${nextStage.name}: ${stageProgress}%`);
                }
            } else {
                system.meditationTime = 0;
                system.isInBreakthrough = false;
                system.isEnlightened = false;
            }
        } catch (error) {
            debug(`Error in meditation handler: ${error}`);
        }
    }
}, 1);

// Initialize on world start
system.runTimeout(() => {
    const savedData = loadAllData();
    for (const player of world.getAllPlayers()) {
        if (savedData[player.id]) {
            cultivationSystems.set(player.id, new CultivationSystem(savedData[player.id]));
        }
    }
}, 1);

// Handle player spawn
world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    
    if (!cultivationSystems.has(player.id)) {
        const savedData = loadAllData();
        cultivationSystems.set(player.id, new CultivationSystem(savedData[player.id]));
        
        player.sendMessage("§6=== Cultivation System ===");
        player.sendMessage("§e- Hold shift to meditate and gain power");
        player.sendMessage("§e- Higher stages grant increased power");
        player.sendMessage("§c- If you die, you will lose all cultivation progress!");
    }
});

// Handle player death
world.afterEvents.entityDie.subscribe((event) => {
    const player = event.deadEntity;
    if (player.typeId === "minecraft:player") {
        const system = cultivationSystems.get(player.id);
        if (system) {
            system.reset();
            saveAllData();
        }
    }
});

// Save data periodically
system.runInterval(() => {
    saveAllData();
}, 100);

// Initialize message
system.runTimeout(() => {
    world.sendMessage("§aCultivation System initialized!");
}, 20);