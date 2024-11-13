// main.js
import { world, system } from "@minecraft/server";
import { Calculator } from "./calculatorModule.js";

function debug(message) {
    console.warn(`[Debug] ${message}`);
}

// In Minecraft Bedrock 1.21.44, we need to use the updated event system
system.afterEvents.scriptEventReceive.subscribe((event) => {
    debug("Script event received");
    if (event.id === "calculator:test") {
        try {
            const result = Calculator.add(5, 3);
            debug(`Add result: ${result}`);
            world.sendMessage(`Add result: ${result}`);
            
            const msg = Calculator.getMessage();
            debug(`Message: ${msg}`);
            world.sendMessage(`Message: ${msg}`);
        } catch (e) {
            debug(`Test error: ${e.toString()}`);
        }
    }
});

system.run(async () => {
    try {
        await Calculator.initialize();
        debug("Calculator initialized");
        world.sendMessage("Calculator system ready! Use /scriptevent calculator:test to try it.");
    } catch (error) {
        debug(`Main error: ${error.toString()}`);
    }
});