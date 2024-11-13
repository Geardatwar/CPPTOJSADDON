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
// Ensure MeditationCalculator is initialized before use
MeditationCalculator.initialize().then(() => {
    system.runInterval(() => {
        for (const player of world.getAllPlayers()) {
            try {
                const system = cultivationSystems.get(player.id);
                if (!system) continue;

                // Meditation logic: Increment meditation time if player is sneaking
                if (player.isSneaking) {
                    system.meditationTime++;

                    // Calculate progress using MeditationCalculator module
                    const progress = MeditationCalculator.calculateMeditationProgress(system.meditationTime, 100);
                    if (progress < 100) {
                        player.onScreenDisplay.setActionBar(`§eMeditating... ${Math.floor(progress)}%`);
                    }

                    // Check if meditation is complete
                    if (progress >= 100) {
                        system.isInBreakthrough = true;

                        // First, check for enlightenment using the rollForEnlightenment function
                        const enlightenmentResult = system.checkEnlightenment();
                        let powerGain;

                        if (enlightenmentResult) {
                            // If enlightened, calculate power gain with enlightenment bonus
                            const enlightenmentBonus = 1.5; // Example value for enlightenment bonus
                            powerGain = system.calculatePowerGain(system.basePower, true, enlightenmentBonus);
                            player.onScreenDisplay.setTitle(`§dAchieved Enlightenment: +${Math.floor(powerGain)}%`);
                        } else {
                            // If not enlightened, calculate regular power gain
                            powerGain = system.calculatePowerGain(system.basePower, true, 1);
                            player.onScreenDisplay.setTitle(`§aAdvanced to ${system.newStage}!`);
                        }

                        // Add the power gain to the system
                        const result = system.addPower(powerGain);

                        // Reset meditation time after breakthrough
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
}).catch((error) => {
    debug(`Failed to initialize MeditationCalculator: ${error}`);
});

// CultivationSystem class to track and manage player progress
class CultivationSystem {
    constructor(savedData = null) {
        if (savedData) {
            this.power = savedData.power;
            this.meditationTime = savedData.meditationTime || 0;
            this.isInBreakthrough = savedData.isInBreakthrough || false;
            this.isEnlightened = savedData.isEnlightened || false;
            this.realm = savedData.realm || "Mortal"; // Track current realm
        } else {
            this.power = 0;
            this.meditationTime = 0;
            this.isInBreakthrough = false;
            this.isEnlightened = false;
            this.realm = "Mortal";
        }
    }

    // New method to calculate power gain in the system
    calculatePowerGain(basePower, isEnlightened, enlightenmentBonus = 1) {
        // Apply enlightenment bonus if player is enlightened
        const bonus = isEnlightened ? enlightenmentBonus : 1;
        const powerGain = basePower * 0.1 * bonus; // Simple formula for power gain (10% of base power)
        return powerGain;
    }

    // Method to add power, check for realm upgrade, and show meditation progress
    addPower(amount) {
        this.power += amount;
        const result = { powerGain: amount, newPower: this.power };

        // Check for realm upgrade after gaining power
        const newRealm = this.checkRealmUpgrade();
        if (newRealm !== this.realm) {
            this.realm = newRealm;
            result.newRealm = this.realm;
            // Display realm upgrade message
            this.displayRealmUpgrade(newRealm);
        }

        // Calculate and display the progress toward the next realm
        const progress = this.calculateProgressToNextStage();
        result.progressToNextStage = progress; // Percentage of progress to the next stage

        // Display meditation progress (e.g., in the action bar or title)
        this.displayMeditationProgress(progress);

        return result;
    }

    // Method to check if the player should upgrade to a new realm based on power
    checkRealmUpgrade() {
        const realms = [
            { name: "Mortal", power: 1 },
            { name: "Qi Condensation", power: 100 },
            { name: "Foundation Establishment", power: 300 },
            { name: "Core Formation", power: 600 },
            { name: "Nascent Soul", power: 1000 }
        ];

        for (let i = realms.length - 1; i >= 0; i--) {
            if (this.power >= realms[i].power) {
                return realms[i].name;
            }
        }
        return "Mortal";  // Default realm if no upgrade occurs
    }

    // Method to calculate the percentage progress toward the next cultivation stage
    calculateProgressToNextStage() {
        const realms = [
            { name: "Mortal", power: 1 },
            { name: "Qi Condensation", power: 100 },
            { name: "Foundation Establishment", power: 300 },
            { name: "Core Formation", power: 600 },
            { name: "Nascent Soul", power: 1000 }
        ];
    
        let currentRealmPower = 0;
        let nextRealmPower = 0;
    
        // Find the current realm and the next realm
        for (let i = 0; i < realms.length; i++) {
            if (realms[i].name === this.realm) {
                currentRealmPower = realms[i].power;
                nextRealmPower = realms[i + 1] ? realms[i + 1].power : currentRealmPower; // Ensure nextRealmPower exists
                break;
            }
        }
    
        // Ensure nextRealmPower is greater than currentRealmPower to avoid division by zero
        if (nextRealmPower > currentRealmPower) {
            const progress = ((this.power - currentRealmPower) / (nextRealmPower - currentRealmPower)) * 100;
            return Math.min(100, progress); // Ensure it doesn't exceed 100%
        }
    
        // If nextRealmPower is the same or no valid next realm, return 0
        return 0;
    }

    // Method to display realm upgrade to the player
    displayRealmUpgrade(newRealm) {
        // Assuming you have a way to display messages to the player
        console.log(`Congratulations! You've reached the ${newRealm} realm!`);
        // player.onScreenDisplay.setActionBar(`Congratulations! You've reached the ${newRealm} realm!`); 
    }

    // Display meditation progress (percentage towards next stage)
    displayMeditationProgress(progress) {
        console.log(`You are ${progress.toFixed(2)}% of the way to the next cultivation stage!`);
    }

    // Check for enlightenment and add power considering enlightenment
    async addPowerWithEnlightenment() {
        // Assuming this.power is your basePower here
        const basePower = this.power;
        
        // Check enlightenment first
        this.isEnlightened = await this.checkEnlightenment();

        // If enlightened, apply the enlightenment bonus
        const enlightenmentBonus = this.isEnlightened ? 1.5 : 1; // Example: 1.5x power gain if enlightened
        const powerGain = this.calculatePowerGain(basePower, this.isEnlightened, enlightenmentBonus);

        // Add the power to the system
        return this.addPower(powerGain);
    }

    // Assuming EnlightenmentCalculator is properly initialized and loaded
    checkEnlightenment() {
        return EnlightenmentCalculator.rollForEnlightenment(0.25); // 25% chance for enlightenment
    }

    reset() {
        this.power = 1;
        this.meditationTime = 0;
        this.isInBreakthrough = false;
        this.isEnlightened = false;
        this.realm = "Mortal"; // Reset realm
    }
}