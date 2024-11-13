// Import modules for math-only calculations
import { world, system } from "@minecraft/server";

import { ProgressCalculator } from "./progressCalculatorModule.js";
import { MeditationCalculator } from "./meditationCalculatorModule.js";
import { EnlightenmentCalculator } from "./enlightenmentCalculatorModule.js";
import { PowerCalculator } from "./powerCalculatorModule.js";

const cultivationSystems = new Map();

// Debugging function
function debug(message) {
    console.warn(`[Debug] ${message}`);
}

// Main Cultivation System Class
class CultivationSystem {
    constructor(savedData = null) {
        this.power = savedData?.power || 0;
        this.meditationTime = savedData?.meditationTime || 0;
        this.isInBreakthrough = savedData?.isInBreakthrough || false;
        this.isEnlightened = savedData?.isEnlightened || false;
    }

    // Initialize calculator modules
    async initializeCalculators() {
        await MeditationCalculator.initialize();
        debug("MeditationCalculator initialized.");
    }

    // Wrapper function to retrieve meditation progress
    async getMeditationProgress() {
        await this.initializeCalculators();

        try {
            debug("Calling MeditationCalculator.calculateMeditationProgress...");
            const progress = MeditationCalculator.calculateMeditationProgress(this.meditationTime, 100);
            return Math.min(progress, 100);  // Cap at 100%
        } catch (error) {
            debug(`Meditation progress calculation error: ${error}`);
            return (this.meditationTime / 100) * 100;
        }
    }

    // Wrapper function to retrieve progress to the next stage
    async getProgress() {
        // Initialize other calculators here if needed
        try {
            const currentStage = this.getCurrentStage();
            const nextStage = this.getNextStage();
            if (!nextStage) return 100;  // At the highest stage

            const progress = ProgressCalculator.calculateProgressToNextStage(
                this.power,
                currentStage.power,
                nextStage.power
            );
            return progress;
        } catch (error) {
            debug(`Progress calculation error: ${error}`);
            return 0;
        }
    }

    getCurrentStage() {
        return this.stageRequirements.find(stage => this.power >= stage.power) || this.stageRequirements[0];
    }

    getNextStage() {
        const currentIndex = this.stageRequirements.findIndex(s => s.name === this.getCurrentStage().name);
        return this.stageRequirements[currentIndex + 1] || null;
    }

    async addPower(amount) {
        const currentStage = this.getCurrentStage();
        this.power += amount;
        const newStage = this.getCurrentStage();

        const progressGained = await this.getProgress();
        return {
            powerGain: amount,
            newPower: this.power,
            stageChanged: currentStage.name !== newStage.name,
            newStage: newStage.name,
            progressGained,
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
}

// Sample usage in the meditation handler
system.runInterval(async () => {
    for (const player of world.getAllPlayers()) {
        const cultivationSystem = cultivationSystems.get(player.id);
        if (!cultivationSystem || !player.isSneaking) continue;

        try {
            cultivationSystem.meditationTime++;
            const meditationProgress = await cultivationSystem.getMeditationProgress();
            player.onScreenDisplay.setActionBar(`Meditating... ${meditationProgress.toFixed(1)}%`);

            if (cultivationSystem.meditationTime >= 100) {
                const powerGain = PowerCalculator.calculatePowerGain(cultivationSystem.power, cultivationSystem.isEnlightened, 1.5);
                const result = await cultivationSystem.addPower(powerGain);

                if (result.stageChanged) {
                    player.onScreenDisplay.setTitle(`Advanced to ${result.newStage}!`);
                } else {
                    player.onScreenDisplay.setTitle(`Power Increased: +${powerGain}`);
                }

                cultivationSystem.meditationTime = 0;
                saveAllData();
            }
        } catch (error) {
            debug(`Error in meditation handler: ${error}`);
        }
    }
}, 1);

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
        debug("Data saved successfully");
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
    debug("Initialized cultivation systems for all players on world start");
}, 1);

// Handle player spawn
world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    
    if (!cultivationSystems.has(player.id)) {
        const savedData = loadAllData();
        cultivationSystems.set(player.id, new CultivationSystem(savedData[player.id]));

        debug(`Created cultivation system for player ${player.id}`);
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
            debug(`Player ${player.id} died and cultivation progress was reset`);
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
    debug("Cultivation system initialized message sent");
}, 20);