import { world, system } from "@minecraft/server";
import { ProgressCalculator } from "./progressCalculatorModule.js";
import { MeditationCalculator } from "./meditationCalculatorModule.js";
import { EnlightenmentCalculator } from "./enlightenmentCalculatorModule.js";

function debug(message) {
    console.warn(`[Debug] ${message}`);
}

async function initializeModules() {
    try {
        await Promise.all([
            ProgressCalculator.initialize(),
            MeditationCalculator.initialize(),
            EnlightenmentCalculator.initialize(),
        ]);
        debug("All modules initialized");
        world.sendMessage("All calculator systems are ready!");
    } catch (error) {
        debug(`Initialization error: ${error.toString()}`);
    }
}

system.run(() => initializeModules());

let cultivationSystems = new Map();

function saveAllData() {
    try {
        const saveData = {};
        for (const [playerId, system] of cultivationSystems) {
            saveData[playerId] = {
                power: system.power,
                meditationTime: system.meditationTime,
                isInBreakthrough: system.isInBreakthrough,
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

system.runTimeout(() => {
    const savedData = loadAllData();
    for (const player of world.getAllPlayers()) {
        if (savedData[player.id]) {
            cultivationSystems.set(player.id, new CultivationSystem(savedData[player.id]));
        }
    }
}, 1);

world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    
    if (!cultivationSystems.has(player.id)) {
        const savedData = loadAllData();
        cultivationSystems.set(player.id, new CultivationSystem(savedData[player.id] || {}));
        
        player.sendMessage("§6=== Cultivation System ===");
        player.sendMessage("§e- Hold shift to meditate and gain power");
        player.sendMessage("§e- Higher stages grant combat bonuses");
        player.sendMessage("§e- Release shift after gaining power to continue");
        player.sendMessage("§e- Sometimes you'll become enlightened during meditation for bonus power!");
        player.sendMessage("§c- If you die, you will lose all cultivation progress!");
    }
});

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

system.runInterval(() => {
    saveAllData();
}, 500);

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        try {
            const system = cultivationSystems.get(player.id);
            if (!system) continue;

            if (player.isSneaking) {
                system.meditationTime++;

                const meditationProgress = MeditationCalculator.calculateMeditationProgress(system.meditationTime, 100);
                if (meditationProgress < 100) {
                    player.onScreenDisplay.setActionBar(`§eMeditating... ${meditationProgress.toFixed(1)}%`);
                }

                if (meditationProgress >= 100) {
                    system.isInBreakthrough = true;
                    const { powerGain, newStage, progressToNextStage } = system.handleBreakthrough();

                    let titleText = '';
                    if (newStage) {
                        titleText = `§aAdvanced to ${newStage.name}!`;
                    } else {
                        titleText = `§dAchieved Enlightenment: +${powerGain}%`;
                    }
                    player.onScreenDisplay.setTitle(titleText);

                    player.sendMessage(`§eProgress to next stage: ${progressToNextStage.toFixed(2)}%`);

                    system.meditationTime = 0;
                    saveAllData();
                }
            } else {
                system.meditationTime = 0;
                system.isInBreakthrough = false;
            }
        } catch (error) {
            debug(`Error in meditation handler: ${error}`);
        }
    }
}, 1);

class CultivationSystem {
    constructor(savedData = null) {
        this.power = savedData?.power || 0;
        this.meditationTime = savedData?.meditationTime || 0;
        this.isInBreakthrough = savedData?.isInBreakthrough || false;
       
        this.stageRequirements = [
            { name: "Mortal", power: 0 },
            { name: "Qi Condensation", power: 100 },
            { name: "Foundation Establishment", power: 300 },
            { name: "Core Formation", power: 600 },
            { name: "Nascent Soul", power: 1000 }
        ];
    }

    calculateProgressToNextStage() {
        const currentStage = this.getCurrentStage();
        const nextStage = this.getNextStage();

        if (!nextStage) {
            return 100;
        }

        const progress = ((this.power - currentStage.power) / (nextStage.power - currentStage.power)) * 100;
        return progress;
    }

    addPower(amount) {
        this.power += amount;
        return { powerGain: amount };
    }

    getCurrentStage() {
        let currentStage = 0;
        for (let i = 0; i < this.stageRequirements.length; i++) {
            if (this.power >= this.stageRequirements[i].power) {
                currentStage = i;
            } else {
                break;
            }
        }
        return this.stageRequirements[currentStage];
    }

    getNextStage() {
        const currentStage = this.getCurrentStage();
        const index = this.stageRequirements.indexOf(currentStage);
        return this.stageRequirements[index + 1];
    }

    handleBreakthrough() {
        const powerGain = this.calculatePowerGain();
        this.addPower(powerGain);

        let newStage = null;
        let progressToNextStage = this.calculateProgressToNextStage();

        const nextStage = this.getNextStage();
        if (nextStage && this.power >= nextStage.power) {
            newStage = nextStage;
            progressToNextStage = 0; // Reset progress when advancing to a new stage
        }

        this.isInBreakthrough = false;
        return { powerGain, newStage, progressToNextStage };
    }

    calculatePowerGain() {
        // Implement power gain calculation logic here
        return 10; // Example: Gain 10 power points per breakthrough
    }

    reset() {
        this.power = 0;
        this.meditationTime = 0;
        this.isInBreakthrough = false;
    }
}