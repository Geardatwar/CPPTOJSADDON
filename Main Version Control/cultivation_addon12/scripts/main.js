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
            { 
                name: "Mortal", 
                power: 0,
                effects: null
            },
            { 
                name: "Qi Condensation", 
                power: 100,
                effects: { strength: 1, resistance: 1 }
            },
            { 
                name: "Foundation Establishment", 
                power: 300,
                effects: { strength: 2, resistance: 2 }
            },
            { 
                name: "Core Formation", 
                power: 600,
                effects: { strength: 3, resistance: 3 }
            },
            { 
                name: "Nascent Soul", 
                power: 1000,
                effects: { strength: 4, resistance: 4 }
            }
        ];
    }

    
    async getMeditationProgress() {
        try {
            //await MeditationCalculator.initialize();  // THIS LINE IS THE PROBLEM
            return MeditationCalculator.calculateMeditationProgress(this.meditationTime, 100);
        } catch (error) {
            debug(`Meditation progress calculation error: ${error}`);
            return Math.min((this.meditationTime / 100) * 100, 100);
        }
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
            
            //await ProgressCalculator.initialize();
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
            progressGained: progress,
            effects: newStage.effects
        };
    }

    checkEnlightenment() {
        try {
            this.isEnlightened = EnlightenmentCalculator.rollForEnlightenment(0.25);
            return this.isEnlightened;
        } catch (error) {
            debug(`Enlightenment calculation error: ${error}`);
            return false;
        }
    }

    reset() {
        this.power = 0;
        this.meditationTime = 0;
        this.isInBreakthrough = false;
        this.isEnlightened = false;
    }
}

// async function initializeModules() {
//     try {
//         await Promise.all([
//             ProgressCalculator.initialize(),
//             MeditationCalculator.initialize(),
//             EnlightenmentCalculator.initialize(),
//             PowerCalculator.initialize()
//         ]);
//         debug("All calculator modules initialized");
//     } catch (error) {
//         debug(`Module initialization error: ${error}`);
//     }
// }

async function initializeModules() {
    try {
        debug("Starting module initialization...");
        
        // Initialize each module separately to identify which one fails
        try {
            await ProgressCalculator.initialize();
            debug("ProgressCalculator initialized");
        } catch (e) {
            debug(`ProgressCalculator init failed: ${e}`);
        }
        
        try {
            await MeditationCalculator.initialize();
            debug("MeditationCalculator initialized");
        } catch (e) {
            debug(`MeditationCalculator init failed: ${e}`);
        }
        
        try {
            await EnlightenmentCalculator.initialize();
            debug("EnlightenmentCalculator initialized");
        } catch (e) {
            debug(`EnlightenmentCalculator init failed: ${e}`);
        }
        
        try {
            await PowerCalculator.initialize();
            debug("PowerCalculator initialized");
        } catch (e) {
            debug(`PowerCalculator init failed: ${e}`);
        }
        
    } catch (error) {
        debug(`Module initialization error: ${error.stack}`);
    }
}

// Run initialization when the script starts
system.run(() => initializeModules());

const cultivationSystems = new Map();

// Enhanced meditation handler with status effects

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        try {
            // debug(`Checking player ${player.id}`);
            // const system = cultivationSystems.get(player.id);
            // debug(`Found system: ${system ? 'yes' : 'no'}`);
            if (!system) continue;

            if (player.isSneaking) {
                debug(`Meditation time: ${system.meditationTime}`); // Add this debug
                system.meditationTime++;
                
                // Only show stage progress after meditation is complete
                if (system.meditationTime < 100) {
                    const progress = MeditationCalculator.calculateMeditationProgress(system.meditationTime, 100);
                    player.onScreenDisplay.setActionBar(`§eMeditating... ${progress.toFixed(1)}%`);
                    debug(`Meditation progress: ${progress}%`); // Add this debug
                }

                if (system.meditationTime >= 100) {
                    const powerGain = PowerCalculator.calculatePowerGain(
                        system.power,
                        system.isEnlightened,
                        1.5
                    );
                    debug(`Power gain calculated: ${powerGain}`); // Add this debug
                    const result = system.addPower(powerGain);
                    
                    if (result.stageChanged) {
                        player.onScreenDisplay.setTitle(`§aAdvanced to ${result.newStage}!`);
                        world.sendMessage(`§6${player.name} has advanced to ${result.newStage}!`);
                    } else {
                        player.onScreenDisplay.setTitle(`§6Power Increased: +${powerGain}`);
                    }
                    
                    // Only show stage progress after gaining power
                    const currentStage = system.getCurrentStage();
                    const nextStageIndex = system.stageRequirements.findIndex(s => s.name === currentStage.name) + 1;
                    
                    if (nextStageIndex < system.stageRequirements.length) {
                        const nextStage = system.stageRequirements[nextStageIndex];
                        player.onScreenDisplay.setActionBar(
                            `§6${currentStage.name} - Progress to ${nextStage.name}: ${result.progressGained.toFixed(1)}%`
                        );
                    }
                    
                    system.meditationTime = 0;
                    saveAllData();
                }
            } else {
                system.meditationTime = 0;
            }
        } catch (error) {
            debug(`Error in meditation handler: ${error}`);
        }
    }
}, 1);

// Keep existing save/load functions
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

        // Add debug here
        debug(`Created cultivation system for player ${player.id}`);
        debug(`Initial system state: ${JSON.stringify(cultivationSystems.get(player.id))}`);
        
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