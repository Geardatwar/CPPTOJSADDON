import { world, system } from "@minecraft/server";
import { ProgressCalculator } from "./progressCalculatorModule.js";
import { MeditationCalculator } from "./meditationCalculatorModule.js";
import { EnlightenmentCalculator } from "./enlightenmentCalculatorModule.js";
import { PowerCalculator } from "./powerCalculatorModule.js";

function debug(message) {
    console.warn(`[Debug] ${message}`);
}

async function initializeModules() {
    try {
        await Promise.all([
            ProgressCalculator.initialize(),
            MeditationCalculator.initialize(),
            EnlightenmentCalculator.initialize(),
            PowerCalculator.initialize()
        ]);
        debug("All modules initialized");
        world.sendMessage("All calculator systems are ready!");
    } catch (error) {
        debug(`Initialization error: ${error.toString()}`);
    }
}

system.afterEvents.scriptEventReceive.subscribe((event) => {
    debug("Script event received");

    // Progress Calculation (using ProgressCalculator)
    if (event.id === "progressCalculator:test") {
        const progress = ProgressCalculator.calculateProgressToNextStage(50, 100, 200);
        debug(`Progress to next stage: ${progress}%`);
        world.sendMessage(`Progress to next stage: ${progress}%`);
    } 

    // Meditation Progress Calculation (using MeditationCalculator)
    else if (event.id === "meditationCalculator:test") {
        const progress = MeditationCalculator.calculateMeditationProgress(30, 60);
        debug(`Meditation progress: ${progress}%`);
        world.sendMessage(`Meditation progress: ${progress}%`);
    } 

    // Enlightenment Calculation (using EnlightenmentCalculator)
    else if (event.id === "enlightenmentCalculator:test") {
        const enlightened = EnlightenmentCalculator.rollForEnlightenment(0.25);
        debug(`Enlightenment roll: ${enlightened}`);
        world.sendMessage(`Enlightenment roll success: ${enlightened}`);
    } 

    // Power Gain Calculation (using PowerCalculator)
    else if (event.id === "powerCalculator:test") {
        const powerGain = PowerCalculator.calculatePowerGain(100, true, 1.5);
        debug(`Power gain: ${powerGain}`);
        world.sendMessage(`Power gain: ${powerGain}`);
    }
});

system.run(() => initializeModules());

// New functionality additions below, integrating the new logic

let cultivationSystems = new Map(); // This will store player cultivation systems

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

// Event to initialize the cultivation system when the world loads
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
    
    // Initialize a new cultivation system if the player doesn't have one
    if (!cultivationSystems.has(player.id)) {
        const savedData = loadAllData();
        cultivationSystems.set(player.id, new CultivationSystem(savedData[player.id] || {}));
        
        // Send player cultivation info
        player.sendMessage("§6=== Cultivation System ===");
        player.sendMessage("§e- Hold shift to meditate and gain power");
        player.sendMessage("§e- Higher stages grant combat bonuses");
        player.sendMessage("§e- Release shift after gaining power to continue");
        player.sendMessage("§e- Sometimes you'll become enlightened during meditation for bonus power!");
        player.sendMessage("§c- If you die, you will lose all cultivation progress!");
    }
});

// Handle player death
world.afterEvents.entityDie.subscribe((event) => {
    const player = event.deadEntity;
    if (player.typeId === "minecraft:player") {
        const system = cultivationSystems.get(player.id);
        if (system) {
            system.reset(); // Reset player system on death
            saveAllData();
        }
    }
});

// Update player cultivation data regularly
system.runInterval(() => {
    saveAllData();
}, 100); // Save every 5 seconds

// Meditation and Breakthrough functionality
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        try {
            const system = cultivationSystems.get(player.id);
            if (!system) continue;

            // Meditation logic: Increment meditation time if player is sneaking
            if (player.isSneaking) {
                system.meditationTime++;

                const progress = Math.min(Math.floor((system.meditationTime / 100) * 100), 100);
                if (progress < 100) {
                    player.onScreenDisplay.setActionBar(`§eMeditating... ${progress}%`);
                }

                if (system.meditationTime >= 100) {
                    system.isInBreakthrough = true;
                    const powerGain = Math.floor(Math.random() * 10) + 15;
                    const result = system.addPower(powerGain);

                    // Enlightenment chance during meditation
                    const enlightenmentResult = system.checkEnlightenment();
                    if (enlightenmentResult) {
                        player.onScreenDisplay.setTitle(`§dAchieved Enlightenment: +${result.progressGained}%`);
                    } else {
                        player.onScreenDisplay.setTitle(`§aAdvanced to ${result.newStage}!`);
                    }

                    system.meditationTime = 0; // Reset meditation time
                    saveAllData(); // Save progress
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

// CultivationSystem class to track and manage player progress
class CultivationSystem {
    constructor(savedData = null) {
        if (savedData) {
            this.power = savedData.power;
            this.meditationTime = savedData.meditationTime || 0;
            this.isInBreakthrough = savedData.isInBreakthrough || false;
        } else {
            this.power = 0;
            this.meditationTime = 0;
            this.isInBreakthrough = false;
        }
    }

    addPower(amount) {
        this.power += amount;
        return { powerGain: amount, newPower: this.power };
    }

    reset() {
        this.power = 0;
        this.meditationTime = 0;
        this.isInBreakthrough = false;
    }
}