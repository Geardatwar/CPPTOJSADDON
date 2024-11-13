// main.js
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

    if (event.id === "progressCalculator:test") {
        const progress = ProgressCalculator.calculateProgressToNextStage(50, 100, 200);
        debug(`Progress to next stage: ${progress}%`);
        world.sendMessage(`Progress to next stage: ${progress}%`);
    } 
    else if (event.id === "meditationCalculator:test") {
        const progress = MeditationCalculator.calculateMeditationProgress(30, 60);
        debug(`Meditation progress: ${progress}%`);
        world.sendMessage(`Meditation progress: ${progress}%`);
    } 
    else if (event.id === "enlightenmentCalculator:test") {
        const enlightened = EnlightenmentCalculator.rollForEnlightenment(0.25);
        debug(`Enlightenment roll: ${enlightened}`);
        world.sendMessage(`Enlightenment roll success: ${enlightened}`);
    } 
    else if (event.id === "powerCalculator:test") {
        const powerGain = PowerCalculator.calculatePowerGain(100, true, 1.5);
        debug(`Power gain: ${powerGain}`);
        world.sendMessage(`Power gain: ${powerGain}`);
    }
});

system.run(() => initializeModules());
