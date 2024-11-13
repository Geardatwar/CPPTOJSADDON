import { world, system } from "@minecraft/server";

console.warn("Cultivation script loading...");
world.sendMessage("§eScript initialization starting...");

import "./dependencies/cultivation.js";

// Global state tracking
const STATE = {
    isModuleInitialized: false,
    initializationAttempted: false
};

// Enhanced debug logging
function debugLog(message, level = "INFO") {
    const prefix = {
        INFO: "§e[INFO]",
        ERROR: "§c[ERROR]",
        SUCCESS: "§a[SUCCESS]",
        DEBUG: "§b[DEBUG]"
    }[level] || "§e[INFO]";
    
    
    world.sendMessage(`${prefix} ${message}`);
}

// Initialize the WebAssembly module with better error handling
async function initializeWasm() {
    if (STATE.initializationAttempted) {
        debugLog("Initialization already attempted, skipping.", "INFO");
        return STATE.isModuleInitialized;
    }

    STATE.initializationAttempted = true;
    debugLog("Starting WebAssembly initialization...", "DEBUG");
    
    try {
        const module = await CultivationModule();
        
        // Validate module interface
        if (!module || typeof module !== 'object') {
            throw new Error("Module loaded but is not an object");
        }
        
        // Check for required functions
        const requiredFunctions = ['CultivationSystem'];
        const missingFunctions = requiredFunctions.filter(func => !module[func]);
        
        if (missingFunctions.length > 0) {
            throw new Error(`Missing required functions: ${missingFunctions.join(', ')}`);
        }
        
        debugLog(`Module properties: ${Object.keys(module).join(', ')}`, "DEBUG");
        
        // Store module globally
        global.Module = module;
        STATE.isModuleInitialized = true;
        
        debugLog("WebAssembly module loaded successfully!", "SUCCESS");
        return true;
    } catch (error) {
        debugLog(`WebAssembly initialization failed: ${error}`, "ERROR");
        return false;
    }
}

// Stores each player's cultivation system
const cultivationSystems = new Map();
const recentlyDiedPlayers = new Map();

// Enhanced world initialization handler
world.afterEvents.worldInitialize.subscribe(async () => {
    debugLog("World initialization started", "DEBUG");
    
    try {
        // Set up dynamic properties
        const def = new DynamicPropertiesDefinition();
        def.defineString("cultivationData", 16384);
        world.setDynamicPropertyDefinition(def);
        debugLog("Dynamic properties configured", "SUCCESS");
        
        // Initialize WebAssembly
        const success = await initializeWasm();
        if (!success) {
            debugLog("Failed to initialize WebAssembly module - cultivation system will not function", "ERROR");
            return;
        }
        
        // Load saved data
        const savedData = loadAllData();
        debugLog(`Loaded saved data for ${Object.keys(savedData).length} players`, "INFO");
        
        debugLog("Cultivation System fully initialized!", "SUCCESS");
    } catch (e) {
        debugLog(`Critical initialization error: ${e}`, "ERROR");
        debugLog(e.stack || "No stack trace available", "DEBUG");
    }
});

// Save player cultivation data, optionally using a C++ function if exposed
function saveAllData() {
    try {
        const saveData = {};
        for (const [playerId, system] of cultivationSystems) {
            // Example: Call a C++ function, if available, to handle saving
            if (Module && Module._saveCultivationData) { 
                Module._saveCultivationData(playerId, system.power); // Adjust with your actual C++ function
            }
            saveData[playerId] = system.power;
        }
        world.setDynamicProperty("cultivationData", JSON.stringify(saveData));
    } catch (e) {
        console.warn("Failed to save cultivation data:", e);
    }
}

// Load player cultivation data, optionally using a C++ function if exposed
function loadAllData() {
    try {
        const savedDataStr = world.getDynamicProperty("cultivationData");
        if (savedDataStr) {
            const savedData = JSON.parse(savedDataStr);
            
            // Example: Call a C++ function to process loaded data
            if (Module && Module._loadCultivationData) {
                for (const playerId in savedData) {
                    Module._loadCultivationData(playerId, savedData[playerId]); // Adjust with your actual C++ function
                }
            }

            return savedData;
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

// Load saved data on world start
system.runTimeout(() => {
    const savedData = loadAllData();
    for (const player of world.getAllPlayers()) {
        if (savedData[player.id]) {
            const system = new Module.CultivationSystem(savedData[player.id]);
            cultivationSystems.set(player.id, system);
        }
    }
}, 1);

// Death handler
world.afterEvents.entityDie.subscribe((event) => {
    try {
        const player = event.deadEntity;
        if (player.typeId === "minecraft:player") {
            const system = cultivationSystems.get(player.id);
            if (system) {
                system.power = 0;
                system.meditationTime = 0;
                system.setIsInBreakthrough(false);
                system.setIsAlive(false);
                recentlyDiedPlayers.set(player.id, true);
                saveAllData();
            }
        }
    } catch (error) {
        console.warn(`Error handling player death: ${error}`);
    }
});

// Spawn handler
world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    
    // First debug message - shows when any player spawns
    world.sendMessage(`§e[DEBUG] Player ${player.name} spawned`);
    
    // Check if player needs a new cultivation system
    if (!cultivationSystems.has(player.id)) {
        world.sendMessage("§e[DEBUG] Creating new cultivation system for player");
        
        try {
            // Load saved data
            const savedData = loadAllData();
            
            // Check if WebAssembly module is ready
            if (!Module) {
                world.sendMessage("§c[ERROR] Module not initialized!");
                return;
            }
            
            // Try to create new cultivation system
            world.sendMessage("§e[DEBUG] Attempting to create CultivationSystem");
            
            // Create new system
            cultivationSystems.set(
                player.id, 
                new Module.CultivationSystem(savedData[player.id] ? savedData[player.id] : 0)
            );
            
            // Success message if creation worked
            world.sendMessage("§a[SUCCESS] CultivationSystem created");
            
            // Show instructions to player
            player.sendMessage("§6=== Cultivation System ===");
            player.sendMessage("§e- Hold shift to meditate and gain power");
            player.sendMessage("§e- Higher stages grant combat bonuses");
            player.sendMessage("§e- Release shift after gaining power to continue");
            player.sendMessage("§e- Sometimes you'll become enlightened during meditation for bonus power!");
            player.sendMessage("§e- When in Qi Condensation realm Rogue Cultivators will spawn every 15 seconds");
            player.sendMessage("§c- If you die, you will lose all cultivation progress!");
            player.onScreenDisplay.setTitle(`§aEnter/t opens chat`);
        } catch (error) {
            // Error message if anything failed
            world.sendMessage(`§c[ERROR] Failed to create cultivation system: ${error}`);
        }
    }

    // Handle existing player system
    const system = cultivationSystems.get(player.id);
    if (system) {
        system.isAlive = true;
        world.sendMessage(`§e[DEBUG] Existing system found for ${player.name}`);
    }

    // Handle player death status
    if (recentlyDiedPlayers.get(player.id)) {
        player.onScreenDisplay.setTitle("§cCultivation Lost!");
        recentlyDiedPlayers.delete(player.id);
        world.sendMessage(`§e[DEBUG] Handled death status for ${player.name}`);
    }
});

// Save data periodically
system.runInterval(() => {
    saveAllData();
}, 100);

// Spawn Rogue Cultivator every 15 seconds
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        spawnRogueCultivatorAroundPlayer(player);
    }
}, 300);

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
                const currentStageInfo = system.getCurrentStage();
                player.onScreenDisplay.setActionBar(`§6${currentStageInfo.name} - Progress: ${progress}%`);
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

// Combat handler
world.beforeEvents.entityHurt.subscribe((event) => {
    try {
        const source = event.damageSource;
        if (source.damagingEntity?.id) {
            const system = cultivationSystems.get(source.damagingEntity.id);
            if (system) {
                if (!system.getCurrentStage) {
                    world.sendMessage("§c[ERROR] Combat handler: getCurrentStage method missing");
                    return;
                }
                const stage = system.getCurrentStage();
                event.damage += stage.damageBonus;
            }
        }
    } catch (error) {
        world.sendMessage(`§c[ERROR] Combat handler error: ${error}`);
    }
});