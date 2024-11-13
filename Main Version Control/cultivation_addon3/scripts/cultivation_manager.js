// import { world, system } from "@minecraft/server";

// console.warn("Loading addon");

// // Store cultivation systems for each player
// const cultivationSystems = new Map();
// const recentlyDiedPlayers = new Map();
// let Module = null;

// // Debug flag
// const DEBUG = true;

// function debugLog(message) {
//     if (DEBUG) {
//         console.warn(`[DEBUG] ${message}`);
//         try {
//             world.sendMessage(`§e[DEBUG] ${message}`);
//         } catch (e) {
//             console.warn(`Failed to send message: ${e}`);
//         }
//     }
// }

// // Save/Load functions
// function saveAllData() {
//     try {
//         const saveData = {};
//         for (const [playerId, system] of cultivationSystems) {
//             saveData[playerId] = system.addPower(0).newPower;
//         }
//         world.setDynamicProperty("cultivationData", JSON.stringify(saveData));
//         debugLog("Data saved successfully");
//     } catch (e) {
//         debugLog(`Failed to save cultivation data: ${e}`);
//     }
// }

// function loadAllData() {
//     try {
//         const savedDataStr = world.getDynamicProperty("cultivationData");
//         if (savedDataStr) {
//             return JSON.parse(savedDataStr);
//         }
//     } catch (e) {
//         debugLog(`Failed to load cultivation data: ${e}`);
//     }
//     return {};
// }

// // Initialize world dynamic property if it doesn't exist
// system.runInterval(() => {
//     try {
//         if (!world.getDynamicProperty("cultivationData")) {
//             world.setDynamicProperty("cultivationData", "{}");
//             debugLog("Dynamic property 'cultivationData' initialized");
//         }
//     } catch (e) {
//         debugLog(`Failed to initialize dynamic property: ${e}`);
//     }
// }, 1);

// async function initializePlayer(player, savedPower = 0) {
//     try {
//         const module = await initializeModule();
//         if (!module) {
//             debugLog(`Module not initialized for player ${player.name}`);
//             return;
//         }

//         const playerSystem = new module.CultivationSystem(savedPower);
//         cultivationSystems.set(player.id, playerSystem);
//         debugLog(`Initialized cultivation system for player ${player.name}`);
//     } catch (error) {
//         debugLog(`Failed to initialize cultivation system for player ${player.name}: ${error.toString()}`);
//     }
// }

// function spawnRogueCultivatorAroundPlayer(player) {
//     try {
//         const system = cultivationSystems.get(player.id);
//         if (!system || !system.isInQiCondensation()) {
//             return;
//         }

//         const angle = Math.random() * 2 * Math.PI;
//         const distance = Math.random() * 3;

//         const spawnPos = {
//             x: Math.floor(player.location.x + Math.cos(angle) * distance),
//             y: Math.floor(player.location.y),
//             z: Math.floor(player.location.z + Math.sin(angle) * distance)
//         };

//         const vindicator = player.dimension.spawnEntity("minecraft:vindicator", spawnPos);
//         vindicator.nameTag = "Rogue Cultivator";

//         const commands = [
//             `attribute @e[type=vindicator,c=1,r=5] minecraft:generic.max_health base set 30`,
//             `effect @e[type=vindicator,c=1,r=5] instant_health 1 255 true`,
//             `effect @e[type=vindicator,c=1,r=5] strength 999999 0 true`,
//             `effect @e[type=vindicator,c=1,r=5] resistance 999999 0 true`
//         ];

//         for (const command of commands) {
//             try {
//                 player.dimension.runCommand(command);
//             } catch (e) {
//                 debugLog(`Failed to run command: ${command}`);
//             }
//         }
//     } catch (error) {
//         debugLog(`Error spawning Rogue Cultivator: ${error}`);
//     }
// }

// // Improved event subscription system
// function safeSubscribe(eventPath, handler, eventName) {
//     try {
//         debugLog(`Attempting to subscribe to ${eventName}...`);
        
//         // Check if world object exists
//         if (!world) {
//             debugLog(`World object not available for ${eventName}`);
//             return false;
//         }

//         // Log available events
//         debugLog(`Available beforeEvents: ${Object.keys(world.beforeEvents || {}).join(', ')}`);
//         debugLog(`Available afterEvents: ${Object.keys(world.afterEvents || {}).join(', ')}`);

//         const parts = eventPath.split('.');
//         const eventType = parts[0]; // beforeEvents or afterEvents
//         const eventName = parts[1]; // entityHit, playerDie, etc.

//         let eventObj;
//         if (eventType === 'beforeEvents') {
//             eventObj = world.beforeEvents?.[eventName];
//         } else if (eventType === 'afterEvents') {
//             eventObj = world.afterEvents?.[eventName];
//         }

//         if (!eventObj) {
//             debugLog(`Event object not found for ${eventPath}`);
//             return false;
//         }

//         if (typeof eventObj.subscribe !== 'function') {
//             debugLog(`Subscribe method not available for ${eventPath}`);
//             return false;
//         }

//         eventObj.subscribe(handler);
//         debugLog(`Successfully subscribed to ${eventName}`);
//         return true;
//     } catch (error) {
//         debugLog(`Failed to subscribe to ${eventName}: ${error}`);
//         return false;
//     }
// }

// // Improved combat modifiers
// function applyCombatModifiers(player, stage) {
//     try {
//         const stageInfo = {
//             "Mortal": { damageBonus: 0, defenseBonus: 0 },
//             "Qi Condensation": { damageBonus: 2, defenseBonus: 1 },
//             "Foundation Establishment": { damageBonus: 4, defenseBonus: 2 },
//             "Core Formation": { damageBonus: 6, defenseBonus: 3 },
//             "Nascent Soul": { damageBonus: 8, defenseBonus: 4 }
//         }[stage];

//         if (!stageInfo) {
//             debugLog(`Invalid stage: ${stage}`);
//             return;
//         }

//         const commands = [
//             `effect @a[name="${player.name}",c=1] strength ${stageInfo.damageBonus} 1 true`,
//             `effect @a[name="${player.name}",c=1] resistance ${stageInfo.defenseBonus} 1 true`
//         ];

//         for (const command of commands) {
//             try {
//                 player.dimension.runCommand(command);
//             } catch (e) {
//                 debugLog(`Failed to run command ${command}: ${e}`);
//             }
//         }
//     } catch (e) {
//         debugLog(`Failed to apply combat modifiers: ${e}`);
//     }
// }

// // Event Subscriptions
// safeSubscribe('beforeEvents.entityHit', (eventData) => {
//     const hitEntity = eventData.hitEntity;
//     const source = eventData.entity;
    
//     if (source && cultivationSystems.has(source.id)) {
//         const system = cultivationSystems.get(source.id);
//         const currentStage = system.getCurrentStageName();
//         const stageInfo = {
//             "Mortal": { damageBonus: 0 },
//             "Qi Condensation": { damageBonus: 2 },
//             "Foundation Establishment": { damageBonus: 4 },
//             "Core Formation": { damageBonus: 6 },
//             "Nascent Soul": { damageBonus: 8 }
//         }[currentStage];

//         if (stageInfo && hitEntity) {
//             const baseDamage = eventData.damage || 0;
//             eventData.damage = baseDamage + stageInfo.damageBonus;
//         }
//     }
// }, 'Entity Hit');

// safeSubscribe('afterEvents.entityDie', (eventData) => {
//     const player = eventData.deadEntity;
//     if (!player || !player.id) return;
    
//     try {
//         const system = cultivationSystems.get(player.id);
//         if (system) {
//             cultivationSystems.delete(player.id);
//             recentlyDiedPlayers.set(player.id, true);
//             saveAllData();
//         }
//     } catch (error) {
//         debugLog(`Error handling player death: ${error}`);
//     }
// }, 'Entity Die');

// safeSubscribe('afterEvents.playerSpawn', (eventData) => {
//     const player = eventData.player;
//     if (!cultivationSystems.has(player.id)) {
//         const savedData = loadAllData();
//         const savedPower = savedData[player.id] || 0;
//         initializePlayer(player, savedPower);
        
//         player.sendMessage("§6=== Cultivation System ===");
//         player.sendMessage("§e- Hold shift to meditate and gain power");
//         player.sendMessage("§e- Higher stages grant combat bonuses");
//         player.sendMessage("§e- Release shift after gaining power to continue");
//         player.sendMessage("§e- Sometimes you'll become enlightened during meditation for bonus power!");
//         player.sendMessage("§e- When in Qi Condensation realm Rogue Cultivators will spawn every 15 seconds");
//         player.sendMessage("§c- If you die, you will lose all cultivation progress!");
//     }
// }, 'Player Spawn');

// // For entity damage events, we might need to use a different event
// safeSubscribe('beforeEvents.entityHurt', (event) => {
//     debugLog(`Entity hurt event fired`);
//     const source = event.damageSource;
//     if (source.damagingEntity?.id) {
//         const system = cultivationSystems.get(source.damagingEntity.id);
//         if (system) {
//             const currentStage = system.getCurrentStageName();
//             const stageInfo = {
//                 "Mortal": { damageBonus: 0 },
//                 "Qi Condensation": { damageBonus: 2 },
//                 "Foundation Establishment": { damageBonus: 4 },
//                 "Core Formation": { damageBonus: 6 },
//                 "Nascent Soul": { damageBonus: 8 }
//             }[currentStage];

//             if (stageInfo) {
//                 event.damage += stageInfo.damageBonus;
//             }
//         }
//     }
// }, 'Entity Hurt');

// // Meditation handler
// system.runInterval(() => {
//     for (const player of world.getAllPlayers()) {
//         try {
//             const system = cultivationSystems.get(player.id);
//             if (!system) continue;

//             const currentStage = system.getCurrentStageName();
//             applyCombatModifiers(player, currentStage);

//             if (player.isSneaking) {
//                 const progress = system.getProgressToNextStage();
                
//                 if (progress < 100) {
//                     player.onScreenDisplay.setActionBar(`§eMeditating... ${progress}%`);
//                 }

//                 if (system.checkEnlightenment()) {
//                     const result = system.addPower(25);
                    
//                     if (result.wasEnlightened) {
//                         player.onScreenDisplay.setTitle(`§dAchieved Enlightenment: +${result.progressGained}%`);
//                     } else if (result.stageChanged) {
//                         player.onScreenDisplay.setTitle(`§aAdvanced to ${result.newStage}!`);
//                         world.sendMessage(`§6${player.name} has advanced to ${result.newStage}!`);
//                     } else {
//                         world.sendMessage(`§6Minor Realm Increase: +${result.progressGained}% Tip: unshift`);
//                     }
                    
//                     saveAllData();
//                 }

//                 player.onScreenDisplay.setActionBar(`§6${currentStage} - Progress: ${progress}%`);
//             }
//         } catch (error) {
//             debugLog(`Error in meditation handler: ${error}`);
//         }
//     }
// }, 1);

// // Spawn rogue cultivators
// system.runInterval(() => {
//     for (const player of world.getAllPlayers()) {
//         spawnRogueCultivatorAroundPlayer(player);
//     }
// }, 300);

// // Save data periodically
// system.runInterval(() => {
//     saveAllData();
// }, 100);

// // Improved module initialization
// async function initializeModule() {
//     if (!Module) {
//         try {
//             // Ensure dynamic property exists first
//             try {
//                 if (!world.getDynamicProperty("cultivationData")) {
//                     world.setDynamicProperty("cultivationData", "{}");
//                     debugLog("Dynamic property 'cultivationData' initialized");
//                 }
//             } catch (e) {
//                 debugLog(`Failed to initialize dynamic property: ${e}`);
//             }

//             debugLog("Starting module initialization...");
            
//             // Import and initialize module
//             await import("./dependencies/cultivation.js");
            
//             if (typeof globalThis.createCultivationModule !== 'function') {
//                 throw new Error("createCultivationModule not found in global scope");
//             }
            
//             const config = {
//                 print: (text) => debugLog(`[WASM] ${text}`),
//                 printErr: (text) => debugLog(`[WASM Error] ${text}`),
//                 onAbort: (what) => debugLog(`Module aborted: ${what}`),
//                 noInitialRun: true,
//                 noExitRuntime: true,
//                 onRuntimeInitialized: () => {
//                     debugLog("Runtime initialized");
//                 }
//             };

//             Module = await globalThis.createCultivationModule(config);
            
//             // Use system.runTimeout instead of setTimeout
//             let checkCount = 0;
//             const maxChecks = 50; // 5 seconds worth of checks at 100ms intervals
            
//             const checkModule = () => {
//                 if (Module.ready) {
//                     debugLog("Module is ready!");
//                     return true;
//                 }
                
//                 checkCount++;
//                 if (checkCount >= maxChecks) {
//                     throw new Error("Module initialization timed out");
//                 }
//                 return false;
//             };

//             // Use system.runInterval for checking module readiness
//             let checkInterval = null;
//             await new Promise((resolve, reject) => {
//                 checkInterval = system.runInterval(() => {
//                     try {
//                         if (checkModule()) {
//                             system.clearRun(checkInterval);
//                             resolve();
//                         }
//                     } catch (error) {
//                         system.clearRun(checkInterval);
//                         reject(error);
//                     }
//                 }, 1);
//             });
            
//             if (typeof Module.CultivationSystem !== 'function') {
//                 throw new Error("CultivationSystem not found in module");
//             }
            
//             debugLog("Module loaded successfully");
//             return Module;
//         } catch (error) {
//             debugLog(`Module initialization error: ${error.toString()}`);
//             return null;
//         }
//     }
//     return Module;
// }

// // Initialize the module when the script loads
// initializeModule().then(() => {
//     debugLog("Cultivation manager initialized");
//     world.sendMessage("§aCultivation System initialized!");
// }).catch(error => {
//     debugLog(`Failed to initialize cultivation manager: ${error.toString()}`);
// });

import { world, system } from "@minecraft/server";

console.warn("Loading addon");

// Store cultivation systems for each player
const cultivationSystems = new Map();
const recentlyDiedPlayers = new Map();
let Module = null;

// Debug flag
const DEBUG = true;

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

        // Direct access to before/after events
        if (eventType === 'beforeEvents' && world.beforeEvents && world.beforeEvents[eventName]) {
            world.beforeEvents[eventName].subscribe(handler);
            debugLog(`Successfully subscribed to beforeEvents.${eventName}`);
            return true;
        }
        
        if (eventType === 'afterEvents' && world.afterEvents && world.afterEvents[eventName]) {
            world.afterEvents[eventName].subscribe(handler);
            debugLog(`Successfully subscribed to afterEvents.${eventName}`);
            return true;
        }

        throw new Error(`Event ${eventName} not found in ${eventType}`);
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
                    debugLog(`Error in entityHitEntity handler: ${error.message}`);
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


// Meditation handler
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        try {
            const system = cultivationSystems.get(player.id);
            if (!system) continue;

            const currentStage = system.getCurrentStageName();
            applyCombatModifiers(player, currentStage);

            if (player.isSneaking) {
                const progress = system.getProgressToNextStage();
                
                if (progress < 100) {
                    player.onScreenDisplay.setActionBar(`§eMeditating... ${progress}%`);
                }

                if (system.checkEnlightenment()) {
                    const result = system.addPower(25);
                    
                    if (result.wasEnlightened) {
                        player.onScreenDisplay.setTitle(`§dAchieved Enlightenment: +${result.progressGained}%`);
                    } else if (result.stageChanged) {
                        player.onScreenDisplay.setTitle(`§aAdvanced to ${result.newStage}!`);
                        world.sendMessage(`§6${player.name} has advanced to ${result.newStage}!`);
                    } else {
                        world.sendMessage(`§6Minor Realm Increase: +${result.progressGained}% Tip: unshift`);
                    }
                    
                    saveAllData();
                }

                player.onScreenDisplay.setActionBar(`§6${currentStage} - Progress: ${progress}%`);
            }
        } catch (error) {
            debugLog(`Error in meditation handler: ${error}`);
        }
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
}, 100);

async function initializeModule() {
    if (Module?.isInitialized) return Module;

    try {
        debugLog("Starting module initialization...");
        
        // Initialize dynamic property
        if (!world.getDynamicProperty("cultivationData")) {
            world.setDynamicProperty("cultivationData", "{}");
            debugLog("Dynamic property initialized");
        }

        const config = {
            print: (text) => debugLog(`[WASM] ${text}`),
            printErr: (text) => debugLog(`[WASM Error] ${text}`),
            onAbort: (what) => {
                debugLog(`Module abort: ${what}`);
                return false; // Prevent throwing
            },
            noInitialRun: true,
            noExitRuntime: true
        };

        debugLog("Creating cultivation module...");
        Module = await globalThis.createCultivationModule(config);
        
        // Wait for initialization
        debugLog("Waiting for module initialization...");
        await Module.initPromise;
        
        if (!Module.isInitialized) {
            throw new Error("Module failed to initialize");
        }

        // Verify CultivationSystem exists
        if (typeof Module.CultivationSystem !== 'function') {
            throw new Error("CultivationSystem not found after initialization");
        }

        debugLog("Module initialized successfully");
        return Module;
    } catch (error) {
        debugLog(`Module initialization failed: ${error.message}`);
        Module = null;
        return null;
    }
}

// Modified initialization call
system.runInterval(async () => {
    try {
        if (!Module?.isInitialized) {
            debugLog("Attempting module initialization...");
            const initialized = await initializeModule();
            if (initialized) {
                debugLog("Module initialized successfully, setting up events...");
                subscribeEvents();
                // Clear the interval after successful initialization
                return false;
            }
        }
    } catch (error) {
        debugLog(`Initialization error: ${error.message}`);
    }
}, 20);

// Initialize the module when the script loads
initializeModule().then(() => {
    debugLog("Cultivation manager initialized");
    world.sendMessage("§aCultivation System initialized!");
}).catch(error => {
    debugLog(`Failed to initialize cultivation manager: ${error.toString()}`);
});