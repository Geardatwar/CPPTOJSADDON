// cultivationMath.js
import { ProgressCalculator } from './progressCalculatorModule.js';
//import { PowerCalculator } from './powerModule.js';
//import { EnlightenmentCalculator } from './enlightenmentModule.js';
//import { MeditationCalculator } from './meditationModule.js';

export const CultivationMath = {
    initialized: false,
    
    async initialize() {
        if (this.initialized) return;
        
        await Promise.all([
            ProgressCalculator.initialize(),
            //PowerCalculator.initialize(),
            //EnlightenmentCalculator.initialize(),
            //MeditationCalculator.initialize()
        ]);
        
        this.initialized = true;
    },
    
    calculateProgress(currentPower, currentStageReq, nextStageReq) {
        return ProgressCalculator.calculate(currentPower, currentStageReq, nextStageReq);
    },
    
    // calculatePowerGain(basePower, isEnlightened, enlightenmentBonus) {
    //     return PowerCalculator.calculate(basePower, isEnlightened, enlightenmentBonus);
    // },
    
    // rollForEnlightenment(chance) {
    //     return EnlightenmentCalculator.calculate(chance);
    // },
    
    // calculateMeditationProgress(meditationTime, maxTime) {
    //     return MeditationCalculator.calculate(meditationTime, maxTime);
    // }
};