import { world, system } from "@minecraft/server";

console.warn("Loading addon");

// Constants and configuration
const MODULE_INIT_TIMEOUT = 30000; // 30 seconds max wait time
const MODULE_POLL_INTERVAL = 100; // Check every 100ms
const DEBUG = true;

// State management
const cultivationSystems = new Map();
const recentlyDiedPlayers = new Map();
let Module = null;
let moduleInitStartTime = 0;

// Debug logging helper
function debugLog(message) {
    if (DEBUG) {
        console.warn(`[DEBUG] ${message}`);
        try {
            world.sendMessage(`§e[DEBUG] ${message}`);
        } catch (e) {
            console.warn(`Failed to send message: ${e}`);
        }
    }
}

// Import the cultivation module
// Make sure this path matches your file structure
import "./dependencies/cultivation.js";

// Wait for module to be available
async function waitForGlobalModule(maxAttempts = 50) {
    for (let i = 0; i < maxAttempts; i++) {
        if (typeof globalThis.createCultivationModule === 'function') {
            return true;
        }
        await new Promise(resolve => system.runTimeout(resolve, 20));
    }
    return false;
}

let moduleInitialized = false;
let moduleInitializationPromise = null;

const FallbackRandom = {
    // Xoshiro256** algorithm for high-quality randomness
    state: new Uint32Array(4),
    initialized: false,
    
    initialize() {
        if (this.initialized) return;
        
        // Seed based on current time and some system values
        const seed = Date.now();
        this.state[0] = seed;
        this.state[1] = seed >>> 16;
        this.state[2] = ~seed;
        this.state[3] = seed << 16;
        
        // Warm up the PRNG
        for (let i = 0; i < 20; i++) this.next();
        
        this.initialized = true;
    },
    
    next() {
        const result = this.rotl(this.state[1] * 5n, 7n) * 9n;
        const t = this.state[1] << 17n;
        
        this.state[2] ^= this.state[0];
        this.state[3] ^= this.state[1];
        this.state[1] ^= this.state[2];
        this.state[0] ^= this.state[3];
        
        this.state[2] ^= t;
        this.state[3] = this.rotl(this.state[3], 45n);
        
        return Number(result) / 2 ** 64;
    },
    
    rotl(x, k) {
        return ((x << k) | (x >> (64n - k))) & ((1n << 64n) - 1n);
    }
};

async function initializeModule() {
    if (moduleInitialized) return Module;
    if (moduleInitializationPromise) return moduleInitializationPromise;

    moduleInitializationPromise = (async () => {
        try {
            moduleInitStartTime = Date.now();
            debugLog(`Module initialization started at: ${new Date().toISOString()}`);
            
            // Initialize fallback random system first
            FallbackRandom.initialize();
            debugLog("Fallback random system initialized");

            // Wait for module to be available
            const moduleAvailable = await waitForGlobalModule(10); // Reduced attempts
            if (!moduleAvailable) {
                throw new Error("createCultivationModule not found after waiting");
            }
            
            debugLog("createCultivationModule found in global scope");

            // Initialize dynamic property first
            if (!world.getDynamicProperty("cultivationData")) {
                world.setDynamicProperty("cultivationData", "{}");
                debugLog("Dynamic property 'cultivationData' initialized");
            }

            const config = {
                print: (text) => debugLog(`[WASM] ${text}`),
                printErr: (text) => debugLog(`[WASM Error] ${text}`),
                onAbort: (what) => {
                    debugLog(`Module aborted: ${what}`);
                    return false;
                },
                noInitialRun: true,
                noExitRuntime: true,
                isWasm2js: true,
                TOTAL_MEMORY: 16777216, // 16MB
                TOTAL_STACK: 5242880,   // 5MB - added comma here
                // Add custom random device initialization
                getRandomValue: () => {
                    return Math.floor(FallbackRandom.next() * 2**32);
                },
                // Override the default random device initialization
                initRandomDevice: () => {
                    debugLog("Using custom random device initialization");
                    return true;
                }
            };

            Module = await new Promise((resolve, reject) => {
                try {
                    const initModule = globalThis.createCultivationModule(config);
                    if (initModule && typeof initModule === 'object') {
                        moduleInitialized = true;
                        resolve(initModule);
                    } else {
                        reject(new Error("Invalid module initialization"));
                    }
                } catch (e) {
                    reject(new Error(`Module initialization failed: ${e.message}`));
                }
            });

            debugLog(`Module initialization completed after ${Date.now() - moduleInitStartTime}ms`);
            return Module;
        } catch (error) {
            debugLog(`Module initialization failed: ${error.message}`);
            moduleInitializationPromise = null;
            throw error;
        }
    })();

    return moduleInitializationPromise;
}

// Initialize the module when the script loads
system.runTimeout(async () => {
    try {
        await initializeModule();
        debugLog("Cultivation system ready to use");
        world.sendMessage("§aCultivation System initialized!");
    } catch (error) {
        debugLog(`Failed to initialize cultivation system: ${error.toString()}`);
    }
}, 20); // Give a small delay for everything to load

// Modify the enlightenment check to use fallback if needed
function checkEnlightenmentWithFallback(system) {
    try {
        return system.checkEnlightenment();
    } catch (error) {
        if (error.toString().includes('initRandomDevice')) {
            // Use fallback random system
            const randomValue = FallbackRandom.next();
            // Simulate 5% chance of enlightenment
            return randomValue < 0.05;
        }
        throw error;
    }
}

// Update the meditation handler to use the fallback system
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        try {
            const system = cultivationSystems.get(player.id);
            if (!system) continue;

            const currentStage = system.getCurrentStageName();
            
            if (!currentStage || typeof currentStage !== 'string') {
                debugLog(`Invalid stage for player ${player.name}: ${currentStage}`);
                continue;
            }

            applyCombatModifiers(player, currentStage);

            if (player.isSneaking) {
                try {
                    const progress = system.getProgressToNextStage();
                    
                    if (isNaN(progress) || progress < 0) {
                        throw new Error(`Invalid progress value: ${progress}`);
                    }

                    if (progress < 100) {
                        player.onScreenDisplay.setActionBar(`§eMeditating... ${progress}%`);
                    }

                    if (checkEnlightenmentWithFallback(system)) {
                        const result = system.addPower(25);
                        
                        if (!result || typeof result !== 'object') {
                            throw new Error('Invalid power addition result');
                        }

                        if (result.wasEnlightened) {
                            player.onScreenDisplay.setTitle(`§dAchieved Enlightenment: +${result.progressGained}%`);
                        } else if (result.stageChanged) {
                            player.onScreenDisplay.setTitle(`§aAdvanced to ${result.newStage}!`);
                            world.sendMessage(`§6${player.name} has advanced to ${result.newStage}!`);
                        } else {
                            player.onScreenDisplay.setActionBar(`§6Minor Realm Increase: +${result.progressGained}% Tip: unshift`);
                        }
                        
                        saveAllData();
                    }
                } catch (error) {
                    debugLog(`Meditation error for ${player.name}: ${error.message}`);
                    player.onScreenDisplay.setActionBar(`§cMeditation interrupted - retrying...`);
                }
            }
        } catch (error) {
            debugLog(`Error in meditation handler for ${player.name}: ${error.message}`);
            try {
                player.onScreenDisplay.setActionBar(`§cMeditation system error`);
            } catch (e) {
                debugLog(`Failed to show error message to player: ${e.message}`);
            }
        }
    }
}, 1);

// Save/Load functions
function saveAllData() {
    try {
        const saveData = {};
        for (const [playerId, system] of cultivationSystems) {
            saveData[playerId] = system.addPower(0).newPower;
        }
        world.setDynamicProperty("cultivationData", JSON.stringify(saveData));
        debugLog("Data saved successfully");
    } catch (e) {
        debugLog(`Failed to save cultivation data: ${e}`);
    }
}

function loadAllData() {
    try {
        const savedDataStr = world.getDynamicProperty("cultivationData");
        if (savedDataStr) {
            return JSON.parse(savedDataStr);
        }
    } catch (e) {
        debugLog(`Failed to load cultivation data: ${e}`);
    }
    return {};
}

// Initialize world dynamic property if it doesn't exist
system.runInterval(() => {
    try {
        if (!world.getDynamicProperty("cultivationData")) {
            world.setDynamicProperty("cultivationData", "{}");
            debugLog("Dynamic property 'cultivationData' initialized");
        }
    } catch (e) {
        debugLog(`Failed to initialize dynamic property: ${e}`);
    }
}, 1);

async function initializePlayer(player, savedPower = 0) {
    try {
        const module = await initializeModule();
        if (!module) {
            debugLog(`Module not initialized for player ${player.name}`);
            return;
        }

        const playerSystem = new module.CultivationSystem(savedPower);
        cultivationSystems.set(player.id, playerSystem);
        debugLog(`Initialized cultivation system for player ${player.name}`);
    } catch (error) {
        debugLog(`Failed to initialize cultivation system for player ${player.name}: ${error.toString()}`);
    }
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

        const commands = [
            `attribute @e[type=vindicator,c=1,r=5] minecraft:generic.max_health base set 30`,
            `effect @e[type=vindicator,c=1,r=5] instant_health 1 255 true`,
            `effect @e[type=vindicator,c=1,r=5] strength 999999 0 true`,
            `effect @e[type=vindicator,c=1,r=5] resistance 999999 0 true`
        ];

        for (const command of commands) {
            try {
                player.dimension.runCommand(command);
            } catch (e) {
                debugLog(`Failed to run command: ${command}`);
            }
        }
    } catch (error) {
        debugLog(`Error spawning Rogue Cultivator: ${error}`);
    }
}

// Improved event subscription system
function safeSubscribe(eventPath, handler) {
    try {
        const [eventType, eventName] = eventPath.split('.');
        debugLog(`Attempting to subscribe to ${eventName}`);
        
        if (!world) {
            throw new Error('World object not available');
        }

        const events = world[eventType];
        if (!events) {
            throw new Error(`Event type ${eventType} not found`);
        }

        const event = events[eventName];
        if (!event) {
            throw new Error(`Event ${eventName} not found in ${eventType}`);
        }

        if (typeof event.subscribe !== 'function') {
            throw new Error(`Subscribe method not available for ${eventName}`);
        }

        event.subscribe(handler);
        debugLog(`Successfully subscribed to ${eventName}`);
        return true;
    } catch (error) {
        debugLog(`Failed to subscribe: ${error.message}`);
        return false;
    }
}

// Improved combat modifiers
function applyCombatModifiers(player, stage) {
    try {
        const stageInfo = {
            "Mortal": { damageBonus: 0, defenseBonus: 0 },
            "Qi Condensation": { damageBonus: 2, defenseBonus: 1 },
            "Foundation Establishment": { damageBonus: 4, defenseBonus: 2 },
            "Core Formation": { damageBonus: 6, defenseBonus: 3 },
            "Nascent Soul": { damageBonus: 8, defenseBonus: 4 }
        }[stage];

        if (!stageInfo) {
            debugLog(`Invalid stage: ${stage}`);
            return;
        }

        const commands = [
            `effect @a[name="${player.name}",c=1] strength ${stageInfo.damageBonus} 1 true`,
            `effect @a[name="${player.name}",c=1] resistance ${stageInfo.defenseBonus} 1 true`
        ];

        for (const command of commands) {
            try {
                player.dimension.runCommand(command);
            } catch (e) {
                debugLog(`Failed to run command ${command}: ${e}`);
            }
        }
    } catch (e) {
        debugLog(`Failed to apply combat modifiers: ${e}`);
    }
}

const subscribeEvents = () => {
    const events = [
        {
            path: 'afterEvents.entityHitEntity',
            handler: (eventData) => {
                try {
                    const hitEntity = eventData.hitEntity;
                    const source = eventData.entity;
                    
                    if (!source || !cultivationSystems.has(source.id)) {
                        return;
                    }

                    const system = cultivationSystems.get(source.id);
                    const currentStage = system.getCurrentStageName();
                    const stageInfo = {
                        "Mortal": { damageBonus: 0 },
                        "Qi Condensation": { damageBonus: 2 },
                        "Foundation Establishment": { damageBonus: 4 },
                        "Core Formation": { damageBonus: 6 },
                        "Nascent Soul": { damageBonus: 8 }
                    }[currentStage];

                    if (stageInfo && hitEntity) {
                        const baseDamage = eventData.damage || 0;
                        eventData.damage = baseDamage + stageInfo.damageBonus;
                    }
                } catch (error) {
                    debugLog(`Error in entityHit handler: ${error.message}`);
                }
            }
        },
        {
            path: 'afterEvents.entityDie',
            handler: (eventData) => {
                try {
                    const player = eventData.deadEntity;
                    if (!player || !player.id) return;
                    
                    const system = cultivationSystems.get(player.id);
                    if (system) {
                        cultivationSystems.delete(player.id);
                        recentlyDiedPlayers.set(player.id, true);
                        saveAllData();
                        debugLog(`Player ${player.name} died, cultivation progress reset`);
                    }
                } catch (error) {
                    debugLog(`Error in entityDie handler: ${error.message}`);
                }
            }
        },
        {
            path: 'afterEvents.playerSpawn',
            handler: (eventData) => {
                try {
                    const player = eventData.player;
                    if (cultivationSystems.has(player.id)) {
                        return;
                    }

                    const savedData = loadAllData();
                    const savedPower = savedData[player.id] || 0;
                    
                    initializePlayer(player, savedPower).then(() => {
                        player.sendMessage("§6=== Cultivation System ===");
                        player.sendMessage("§e- Hold shift to meditate and gain power");
                        player.sendMessage("§e- Higher stages grant combat bonuses");
                        player.sendMessage("§e- Release shift after gaining power to continue");
                        player.sendMessage("§e- Sometimes you'll become enlightened during meditation for bonus power!");
                        player.sendMessage("§e- When in Qi Condensation realm Rogue Cultivators will spawn every 15 seconds");
                        player.sendMessage("§c- If you die, you will lose all cultivation progress!");
                        
                        debugLog(`Player ${player.name} initialized with power: ${savedPower}`);
                    }).catch(error => {
                        debugLog(`Failed to initialize player ${player.name}: ${error.message}`);
                    });
                } catch (error) {
                    debugLog(`Error in playerSpawn handler: ${error.message}`);
                }
            }
        },
        {
            path: 'afterEvents.entityHurt',
            handler: (eventData) => {
                try {
                    const source = eventData.damageSource;
                    if (!source.damagingEntity?.id) {
                        return;
                    }

                    const system = cultivationSystems.get(source.damagingEntity.id);
                    if (!system) {
                        return;
                    }

                    const currentStage = system.getCurrentStageName();
                    const stageInfo = {
                        "Mortal": { damageBonus: 0 },
                        "Qi Condensation": { damageBonus: 2 },
                        "Foundation Establishment": { damageBonus: 4 },
                        "Core Formation": { damageBonus: 6 },
                        "Nascent Soul": { damageBonus: 8 }
                    }[currentStage];

                    if (stageInfo) {
                        const originalDamage = eventData.damage;
                        eventData.damage = originalDamage + stageInfo.damageBonus;
                        debugLog(`Damage modified for ${source.damagingEntity.name}: ${originalDamage} -> ${eventData.damage}`);
                    }
                } catch (error) {
                    debugLog(`Error in entityHurt handler: ${error.message}`);
                }
            }
        }
    ];

    // Subscribe to all events
    for (const event of events) {
        const success = safeSubscribe(event.path, event.handler);
        if (!success) {
            debugLog(`Failed to subscribe to ${event.path}`);
        }
    }
};

// Helper function to handle null checks and exceptions when accessing properties
//doensnt do anything
function safeGet(obj, ...path) {
    try {
        return path.reduce((acc, key) => acc?.[key], obj);
    } catch {
        return undefined;
    }
}

// Initialize events after module is loaded
system.runTimeout(async () => {
    try {
        const module = await initializeModule();
        if (module) {
            subscribeEvents();
            debugLog("Events successfully initialized");
        } else {
            throw new Error("Module initialization failed");
        }
    } catch (error) {
        debugLog(`Failed to initialize events: ${error.message}`);
    }
}, 1);

// Spawn rogue cultivators
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        spawnRogueCultivatorAroundPlayer(player);
    }
}, 300);

// Save data periodically
system.runInterval(() => {
    saveAllData();
}, 500);

// Initialize the module when the script loads
initializeModule().then(() => {
    debugLog("Cultivation manager initialized");
    world.sendMessage("§aCultivation System initialized!");
}).catch(error => {
    debugLog(`Failed to initialize cultivation manager: ${error.toString()}`);
});