import { world, system } from "@minecraft/server";
import { ProgressCalculator } from "./progressCalculatorModule.js";
import { MeditationCalculator } from "./meditationCalculatorModule.js";
import { EnlightenmentCalculator } from "./enlightenmentCalculatorModule.js";
import { PowerCalculator } from "./powerCalculatorModule.js";

// Debugging utility function
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
            { name: "Mortal", power: 0, strength: 0, resistance: 0 },
            { name: "Qi Condensation", power: 100, strength: 1, resistance: 1 },
            { name: "Foundation Establishment", power: 300, strength: 2, resistance: 2 },
            { name: "Core Formation", power: 600, strength: 3, resistance: 3 },
            { name: "Nascent Soul", power: 1000, strength: 4, resistance: 4 }
        ];
    }

    // Get current cultivation stage based on power
    getCurrentStage() {
        for (let i = this.stageRequirements.length - 1; i >= 0; i--) {
            if (this.power >= this.stageRequirements[i].power) {
                return this.stageRequirements[i];
            }
        }
        return this.stageRequirements[0];
    }

    // Apply strength and resistance effects based on stage
    applyEffects(player) {
        const currentStage = this.getCurrentStage();
        
        const strengthLevel = currentStage.strength;
        const resistanceLevel = currentStage.resistance;

        if (strengthLevel > 0) {
            player.dimension.runCommand(`effect "${player.name}" strength ${strengthLevel} 999999 true`);  // Permanent effect
        }
        if (resistanceLevel > 0) {
            player.dimension.runCommand(`effect "${player.name}" resistance ${resistanceLevel} 999999 true`);  // Permanent effect
        }
    }

    // Get progress to next stage, using C++ module for calculation
    async getProgress() {
        try {
            const currentStage = this.getCurrentStage();
            const currentIndex = this.stageRequirements.findIndex(s => s.name === currentStage.name);
            
            if (currentIndex === this.stageRequirements.length - 1) {
                return 100;
            }

            const nextStage = this.stageRequirements[currentIndex + 1];
            
            // Use C++ module for progress calculation
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

    // Add power, calculate new power, and check if stage or enlightenment changes
    async addPower(amount) {
        const oldStage = this.getCurrentStage();
        this.power += amount;
        const newStage = this.getCurrentStage();

        const progress = await this.getProgress();

        // Use PowerCalculator for calculating power gain
        const calculatedPowerGain = await PowerCalculator.calculatePowerGain(this.power, amount, this.isEnlightened);

        // Check for enlightenment after power gain
        await this.checkEnlightenment();

        // Apply effects if the player has advanced to a new stage
        if (oldStage.name !== newStage.name) {
            this.applyEffects(newStage);
        }

        return {
            powerGain: calculatedPowerGain,
            newPower: this.power,
            stageChanged: oldStage.name !== newStage.name,
            newStage: newStage.name,
            progressGained: progress
        };
    }

    // Meditate and calculate progress based on meditation time
    async meditate() {
        try {
            // Use MeditationCalculator for meditation progress calculation
            await MeditationCalculator.initialize();
            const meditationProgress = await MeditationCalculator.calculateMeditationProgress(this.meditationTime);
            this.meditationTime += meditationProgress;

            if (this.meditationTime >= 100) {
                // If meditation reaches 100%, calculate power gain
                const powerGain = Math.floor(Math.random() * 10) + 15; // Replace with calculation if needed
                return await this.addPower(powerGain);
            }
            return { meditationProgress };
        } catch (error) {
            debug(`Meditation calculation error: ${error}`);
            return { meditationProgress: 0 };
        }
    }

    // Check if player has achieved enlightenment based on power
    async checkEnlightenment() {
        try {
            // Use EnlightenmentCalculator to check if enlightenment is achieved
            const enlightenmentSuccess = await EnlightenmentCalculator.rollForEnlightenment(this.power);
            
            if (enlightenmentSuccess) {
                this.isEnlightened = true;
                debug("Player has reached enlightenment!");
            }
        } catch (error) {
            debug(`Enlightenment calculation error: ${error}`);
        }
    }

    // Reset the player's cultivation data
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
                const result = await system.meditate();
                
                if (result.meditationProgress < 100) {
                    player.onScreenDisplay.setActionBar(`§eMeditating... ${result.meditationProgress}%`);
                }

                if (result.meditationProgress >= 100) {
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