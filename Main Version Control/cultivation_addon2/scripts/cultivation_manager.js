// // scripts/cultivation_manager.js
// import { world, system } from "@minecraft/server";

// console.warn("Loading addon");


// // Initialize the WASM module
// let cultivationModule = null;
// let cultivationSystems = new Map();

// // Load the WASM module
// async function initializeCultivationSystem() {
//     try {
//         // Import the WASM module
//         const Module = await createCultivationModule();
//         cultivationModule = Module;
//         console.warn("Cultivation system WASM module loaded successfully");
//     } catch (error) {
//         console.error("Failed to load cultivation WASM module:", error);
//     }
// }

// // Initialize cultivation system for a player
// function initializePlayer(player) {
//     if (!cultivationModule) return;
    
//     try {
//         const playerSystem = new cultivationModule.CultivationSystem(0);
//         cultivationSystems.set(player.id, playerSystem);
//         console.warn(`Initialized cultivation system for player ${player.name}`);
//     } catch (error) {
//         console.error(`Failed to initialize cultivation system for player ${player.name}:`, error);
//     }
// }

// // Example usage of the cultivation system
// function handleMeditation(player) {
//     const system = cultivationSystems.get(player.id);
//     if (!system) return;

//     const result = system.addPower(10);
//     if (result.stageChanged) {
//         world.sendMessage(`${player.name} has advanced to ${result.newStage}!`);
//     }

//     if (result.wasEnlightened) {
//         world.sendMessage(`${player.name} has gained enlightenment!`);
//     }
// }

// // Event handlers
// system.afterEvents.scriptEventReceive.subscribe((eventData) => {
//     if (eventData.id === "cultivation:meditate") {
//         const player = eventData.sourceEntity;
//         if (player) {
//             handleMeditation(player);
//         }
//     }
// });

// world.afterEvents.playerSpawn.subscribe((event) => {
//     const player = event.player;
//     if (!cultivationSystems.has(player.id)) {
//         initializePlayer(player);
//     }
// });

// // Initialize the WASM module when the script loads
// initializeCultivationSystem();


//ver 2
// import { world, system } from "@minecraft/server";
// import "./dependencies/cultivation.js";

// console.warn("Loading addon");

// // Initialize the WASM module
// let cultivationModule = null;
// let cultivationSystems = new Map();

// // Debug flag
// const DEBUG = true;

// // Debug logging function
// function debugLog(message) {
//     if (DEBUG) {
//         world.sendMessage(`§e[DEBUG] ${message}`);
//     }
// }

// // Simple cultivation system class (temporary replacement)
// class SimpleCultivationSystem {
//     constructor() {
//         this.power = 0;
//         debugLog("Created SimpleCultivationSystem");
//     }

//     getCurrentStage() {
//         return {
//             name: "Basic Stage",
//             damageBonus: 1,
//             defenseBonus: 1
//         };
//     }
// }

// // Stores each player's cultivation system
// //const cultivationSystems = new Map();

// // Set up dynamic properties for persistence
// world.afterEvents.worldInitialize.subscribe(() => {
//     debugLog("World initialization started");
//     try {
//         const def = new DynamicPropertiesDefinition();
//         def.defineString("cultivationData", 16384);
//         world.setDynamicPropertyDefinition(def);
//         debugLog("Dynamic properties initialized");
//     } catch (e) {
//         debugLog(`Failed to setup dynamic properties: ${e}`);
//     }
// });

// // Spawn handler
// world.afterEvents.playerSpawn.subscribe((event) => {
//     const player = event.player;
//     debugLog(`Player ${player.name} spawned`);
    
//     if (!cultivationSystems.has(player.id)) {
//         debugLog("Creating new cultivation system for player");
//         try {
//             cultivationSystems.set(player.id, new SimpleCultivationSystem());
//             debugLog("Successfully created cultivation system");
            
//             player.sendMessage("§6=== Test Cultivation System ===");
//             player.sendMessage("§eThis is a test version of the cultivation system");
//         } catch (error) {
//             debugLog(`Failed to create cultivation system: ${error}`);
//         }
//     }
// });

// // Import the WASM module
// async function initializeCultivationSystem() {
//     try {
//         // Import the WASM module
//         const Module = await cultivationModule();
//         cultivationModule = Module;
//         console.warn("Cultivation system WASM module loaded successfully");
//     } catch (error) {
//         console.error("Failed to load cultivation WASM module:", error);
//     }
// }

// // Initialize cultivation system for a player
// function initializePlayer(player) {
//     if (!cultivationModule) return;
    
//     try {
//         const playerSystem = new cultivationModule.CultivationSystem(0);
//         cultivationSystems.set(player.id, playerSystem);
//         console.warn(`Initialized cultivation system for player ${player.name}`);
//     } catch (error) {
//         console.error(`Failed to initialize cultivation system for player ${player.name}:`, error);
//     }
// }

// // Example usage of the cultivation system
// function handleMeditation(player) {
//     const system = cultivationSystems.get(player.id);
//     if (!system) return;

//     const result = system.addPower(10);
//     if (result.stageChanged) {
//         world.sendMessage(`${player.name} has advanced to ${result.newStage}!`);
//     }

//     if (result.wasEnlightened) {
//         world.sendMessage(`${player.name} has gained enlightenment!`);
//     }
// }

// // Event handlers
// system.afterEvents.scriptEventReceive.subscribe((eventData) => {
//     if (eventData.id === "cultivation:meditate") {
//         const player = eventData.sourceEntity;
//         if (player) {
//             handleMeditation(player);
//         }
//     }
// });

// world.afterEvents.playerSpawn.subscribe((event) => {
//     const player = event.player;
//     if (!cultivationSystems.has(player.id)) {
//         initializePlayer(player);
//     }
// });

// // Initialize the WASM module when the script loads
// initializeCultivationSystem();

//ver 3
// main.js
// import { world, system } from "@minecraft/server";
// import createCultivationModule from "./dependencies/cultivation.js";

// console.warn("Loading addon");

// // Initialize the WASM module
// let cultivationModule = null;
// const cultivationSystems = new Map();

// // Debug flag
// const DEBUG = true;

// // Debug logging function
// function debugLog(message) {
//     if (DEBUG) {
//         console.warn(`[DEBUG] ${message}`);
//         world.sendMessage(`§e[DEBUG] ${message}`);
//     }
// }

// // Set up dynamic properties for persistence
// world.afterEvents.worldInitialize.subscribe(() => {
//     debugLog("World initialization started");
//     try {
//         const def = new DynamicPropertiesDefinition();
//         def.defineString("cultivationData", 16384);
//         world.setDynamicPropertyDefinition(def);
//         debugLog("Dynamic properties initialized");
//     } catch (e) {
//         debugLog(`Failed to setup dynamic properties: ${e}`);
//     }
// });

// // Initialize cultivation system
// async function initializeCultivationSystem() {
//     try {
//         // Set up module configuration
//         const moduleConfig = {
//             // Add any necessary module configuration here
//             locateFile: (path, scriptDirectory) => {
//                 // Adjust the path to your .wasm file
//                 if (path.endsWith('.wasm')) {
//                     return `./dependencies/${path}`;
//                 }
//                 return scriptDirectory + path;
//             },
//             print: (text) => debugLog(`[WASM] ${text}`),
//             printErr: (text) => debugLog(`[WASM ERROR] ${text}`)
//         };

//         // Initialize the module
//         cultivationModule = await createCultivationModule(moduleConfig);
//         debugLog("Cultivation system module loaded successfully");
//         return true;
//     } catch (error) {
//         debugLog(`Failed to load cultivation module: ${error.toString()}`);
//         return false;
//     }
// }

// // Initialize player's cultivation system
// async function initializePlayer(player) {
//     if (!cultivationModule) {
//         const initialized = await initializeCultivationSystem();
//         if (!initialized) {
//             debugLog(`Failed to initialize module for player ${player.name}`);
//             return;
//         }
//     }
    
//     try {
//         // Assuming your WASM module exports a CultivationSystem constructor
//         const playerSystem = new cultivationModule.CultivationSystem(0);
//         cultivationSystems.set(player.id, playerSystem);
//         debugLog(`Initialized cultivation system for player ${player.name}`);
//     } catch (error) {
//         debugLog(`Failed to initialize cultivation system for player ${player.name}: ${error.toString()}`);
//     }
// }

// // Handle meditation event
// function handleMeditation(player) {
//     const system = cultivationSystems.get(player.id);
//     if (!system) {
//         debugLog(`No cultivation system found for player ${player.name}`);
//         return;
//     }

//     try {
//         const result = system.addPower(10);
//         if (result.stageChanged) {
//             world.sendMessage(`§6${player.name} has advanced to ${result.newStage}!`);
//         }

//         if (result.wasEnlightened) {
//             world.sendMessage(`§d${player.name} has gained enlightenment!`);
//         }
//     } catch (error) {
//         debugLog(`Error during meditation: ${error.toString()}`);
//     }
// }

// // Event handlers
// system.afterEvents.scriptEventReceive.subscribe((eventData) => {
//     if (eventData.id === "cultivation:meditate") {
//         const player = eventData.sourceEntity;
//         if (player) {
//             handleMeditation(player);
//         }
//     }
// });

// // Player spawn handler
// world.afterEvents.playerSpawn.subscribe(async (event) => {
//     const player = event.player;
//     debugLog(`Player ${player.name} spawned`);
    
//     if (!cultivationSystems.has(player.id)) {
//         await initializePlayer(player);
//         player.sendMessage("§6=== Cultivation System Initialized ===");
//         player.sendMessage("§eUse /scriptevent cultivation:meditate to cultivate");
//     }
// });

// // Initialize the module when the script loads
// initializeCultivationSystem().catch(error => {
//     debugLog(`Failed to initialize cultivation system: ${error.toString()}`);
// });

//ver 4
// cultivation_manager.js
// import { world, system } from "@minecraft/server";
// import { createCultivationModule } from "./dependencies/cultivation.js";

// console.warn("Loading addon");

// // Initialize the WASM module
// let cultivationModule = null;
// const cultivationSystems = new Map();

// // Debug flag
// const DEBUG = true;

// // Debug logging function
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

// // Set up dynamic properties for persistence
// world.afterEvents.worldInitialize.subscribe(() => {
//     debugLog("World initialization started");
//     try {
//         const def = new DynamicPropertiesDefinition();
//         def.defineString("cultivationData", 16384);
//         world.setDynamicPropertyDefinition(def);
//         debugLog("Dynamic properties initialized");
//     } catch (e) {
//         debugLog(`Failed to setup dynamic properties: ${e}`);
//     }
// });

// // Initialize cultivation system
// async function initializeCultivationSystem() {
//     try {
//         // Set up module configuration
//         const moduleConfig = {
//             locateFile: (path) => {
//                 if (path.endsWith('.wasm')) {
//                     return `./dependencies/${path}`;
//                 }
//                 return path;
//             },
//             print: (text) => debugLog(`[WASM] ${text}`),
//             printErr: (text) => debugLog(`[WASM ERROR] ${text}`)
//         };

//         // Initialize the module
//         cultivationModule = await createCultivationModule(moduleConfig);
//         debugLog("Cultivation system module loaded successfully");
//         return true;
//     } catch (error) {
//         debugLog(`Failed to load cultivation module: ${error.toString()}`);
//         return false;
//     }
// }

// // Initialize player's cultivation system
// async function initializePlayer(player) {
//     if (!cultivationModule) {
//         const initialized = await initializeCultivationSystem();
//         if (!initialized) {
//             debugLog(`Failed to initialize module for player ${player.name}`);
//             return;
//         }
//     }
    
//     try {
//         // Assuming your WASM module exports a CultivationSystem constructor
//         const playerSystem = new cultivationModule.CultivationSystem(0);
//         cultivationSystems.set(player.id, playerSystem);
//         debugLog(`Initialized cultivation system for player ${player.name}`);
//     } catch (error) {
//         debugLog(`Failed to initialize cultivation system for player ${player.name}: ${error.toString()}`);
//     }
// }

// // Handle meditation event
// function handleMeditation(player) {
//     const system = cultivationSystems.get(player.id);
//     if (!system) {
//         debugLog(`No cultivation system found for player ${player.name}`);
//         return;
//     }

//     try {
//         const result = system.addPower(10);
//         if (result.stageChanged) {
//             world.sendMessage(`§6${player.name} has advanced to ${result.newStage}!`);
//         }

//         if (result.wasEnlightened) {
//             world.sendMessage(`§d${player.name} has gained enlightenment!`);
//         }
//     } catch (error) {
//         debugLog(`Error during meditation: ${error.toString()}`);
//     }
// }

// // Event handlers
// system.afterEvents.scriptEventReceive.subscribe((eventData) => {
//     if (eventData.id === "cultivation:meditate") {
//         const player = eventData.sourceEntity;
//         if (player) {
//             handleMeditation(player);
//         }
//     }
// });

// // Player spawn handler
// world.afterEvents.playerSpawn.subscribe(async (event) => {
//     const player = event.player;
//     debugLog(`Player ${player.name} spawned`);
    
//     if (!cultivationSystems.has(player.id)) {
//         await initializePlayer(player);
//         player.sendMessage("§6=== Cultivation System Initialized ===");
//         player.sendMessage("§eUse /scriptevent cultivation:meditate to cultivate");
//     }
// });

// // Initialize the module when the script loads
// initializeCultivationSystem().catch(error => {
//     debugLog(`Failed to initialize cultivation system: ${error.toString()}`);
// });

//ver 5
// cultivation_manager.js
import { world, system, DynamicPropertiesDefinition } from "@minecraft/server";

console.warn("Loading addon");

// Initialize the systems map
const cultivationSystems = new Map();

// Debug flag
const DEBUG = true;

// Debug logging function
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

// Fallback CultivationSystem class
class CultivationSystem {
    constructor(initialPower = 0) {
        this.power = initialPower;
        this.stage = 0;
        this.stages = [
            { name: "Qi Condensation", threshold: 0 },
            { name: "Foundation Establishment", threshold: 100 },
            { name: "Core Formation", threshold: 300 },
            { name: "Nascent Soul", threshold: 600 },
            { name: "Divine Soul", threshold: 1000 }
        ];
    }

    getCurrentStage() {
        for (let i = this.stages.length - 1; i >= 0; i--) {
            if (this.power >= this.stages[i].threshold) {
                return {
                    name: this.stages[i].name,
                    damageBonus: 1 + (i * 0.2),
                    defenseBonus: 1 + (i * 0.1)
                };
            }
        }
        return { name: "Mortal", damageBonus: 1, defenseBonus: 1 };
    }

    addPower(amount) {
        const oldStage = this.getCurrentStage();
        this.power += amount;
        const newStage = this.getCurrentStage();

        return {
            stageChanged: oldStage.name !== newStage.name,
            newStage: newStage.name,
            wasEnlightened: this.power >= 1000,
            powerGained: amount,
            totalPower: this.power
        };
    }

    serialize() {
        return JSON.stringify({
            power: this.power,
            stage: this.stage
        });
    }

    static deserialize(data) {
        const parsed = JSON.parse(data);
        const system = new CultivationSystem();
        system.power = parsed.power;
        system.stage = parsed.stage;
        return system;
    }
}

// Set up dynamic properties for persistence
world.afterEvents.worldInitialize.subscribe(() => {
    debugLog("World initialization started");
    try {
        const def = new DynamicPropertiesDefinition();
        def.defineString("cultivationData", 16384);
        world.setDynamicPropertyDefinition(def);
        debugLog("Dynamic properties initialized successfully");
    } catch (e) {
        debugLog(`Failed to setup dynamic properties: ${e}`);
    }
});

// Initialize player's cultivation system
function initializePlayer(player) {
    try {
        // Try to load existing data
        const savedData = world.getDynamicProperty(`cultivation:${player.id}`);
        let playerSystem;
        
        if (savedData) {
            playerSystem = CultivationSystem.deserialize(savedData);
            debugLog(`Loaded existing cultivation data for ${player.name}`);
        } else {
            playerSystem = new CultivationSystem(0);
            debugLog(`Created new cultivation system for ${player.name}`);
        }
        
        cultivationSystems.set(player.id, playerSystem);
        
        // Save initial state
        world.setDynamicProperty(`cultivation:${player.id}`, playerSystem.serialize());
        
        return true;
    } catch (error) {
        debugLog(`Failed to initialize cultivation system for ${player.name}: ${error}`);
        return false;
    }
}

// Handle meditation event
function handleMeditation(player) {
    const system = cultivationSystems.get(player.id);
    if (!system) {
        debugLog(`No cultivation system found for ${player.name}`);
        return;
    }

    try {
        const baseGain = 10;
        const result = system.addPower(baseGain);
        
        // Save updated state
        world.setDynamicProperty(`cultivation:${player.id}`, system.serialize());

        // Send feedback messages
        player.sendMessage(`§a+${result.powerGained} Cultivation Power (Total: ${result.totalPower})`);
        
        if (result.stageChanged) {
            world.sendMessage(`§6${player.name} has advanced to ${result.newStage}!`);
        }

        if (result.wasEnlightened) {
            world.sendMessage(`§d${player.name} has achieved enlightenment!`);
        }

        const currentStage = system.getCurrentStage();
        player.sendMessage(`§7Current Stage: ${currentStage.name}`);
        player.sendMessage(`§7Combat Bonuses: +${Math.round((currentStage.damageBonus-1)*100)}% DMG, +${Math.round((currentStage.defenseBonus-1)*100)}% DEF`);
    } catch (error) {
        debugLog(`Error during meditation: ${error}`);
    }
}

// Event handlers
system.afterEvents.scriptEventReceive.subscribe((eventData) => {
    if (eventData.id === "cultivation:meditate") {
        const player = eventData.sourceEntity;
        if (player) {
            handleMeditation(player);
        }
    }
});

// Player spawn handler
world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    debugLog(`Player ${player.name} spawned`);
    
    if (!cultivationSystems.has(player.id)) {
        if (initializePlayer(player)) {
            player.sendMessage("§6=== Cultivation System Initialized ===");
            player.sendMessage("§eUse /scriptevent cultivation:meditate to cultivate");
        }
    }
});