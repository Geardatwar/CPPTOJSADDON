// Import C++ modules
import { calculateMeditationProgress } from "./meditationCalculatorModule.js";
import { rollForEnlightenment } from "./enlightenmentCalculatorModule.js";
import { calculatePowerGain } from "./powerCalculatorModule.js";
import { calculateProgressToNextStage } from "./progressCalculatorModule.js";

// Existing imports
import { world, system } from "@minecraft/server";

class CultivationSystem {
  constructor(savedData = null) {
      if (savedData) {
          this.power = savedData.power;
      } else {
          this.power = 0;
      }
      
      this.stages = [
          {name: "Mortal", requiredPower: 0, damageBonus: 0, defenseBonus: 0},
          {name: "Qi Condensation", requiredPower: 100, damageBonus: 2, defenseBonus: 1},
          {name: "Foundation Establishment", requiredPower: 300, damageBonus: 4, defenseBonus: 2},
          {name: "Core Formation", requiredPower: 600, damageBonus: 6, defenseBonus: 3},
          {name: "Nascent Soul", requiredPower: 1000, damageBonus: 8, defenseBonus: 4}
      ];
      this.meditationTime = 0;
      this.lastBreakthrough = 0;
      this.isInBreakthrough = false;
      this.isEnlightened = false;
      this.enlightenmentChance = 0.15;
      this.enlightenmentBonus = 2;
      this.isAlive = true;
  }

  getCurrentStage() {
      for (let i = this.stages.length - 1; i >= 0; i--) {
          if (this.power >= this.stages[i].requiredPower) {
              return this.stages[i];
          }
      }
      return this.stages[0];
  }

  getProgressToNextStage() {
      const currentStage = this.getCurrentStage();
      const nextStageIndex = this.stages.findIndex(s => s.name === currentStage.name) + 1;

      if (nextStageIndex >= this.stages.length) {
          return 100; // Max stage reached
      }

      const nextStage = this.stages[nextStageIndex];
      const powerInCurrentStage = this.power - currentStage.requiredPower;
      const powerRequiredForNextStage = nextStage.requiredPower - currentStage.requiredPower;

      // Call C++ function for progress calculation
      return calculateProgressToNextStage(powerInCurrentStage, powerRequiredForNextStage);
  }

  calculatePowerToPercentage(powerAmount) {
      const currentStage = this.getCurrentStage();
      const nextStageIndex = this.stages.findIndex(s => s.name === currentStage.name) + 1;

      if (nextStageIndex >= this.stages.length) {
          return 0; // Already at max stage
      }

      const nextStage = this.stages[nextStageIndex];
      const powerRequiredForNextStage = nextStage.requiredPower - currentStage.requiredPower;

      // Use calculateProgressToNextStage for power-to-percentage conversion
      return calculateProgressToNextStage(powerAmount, powerRequiredForNextStage);
  }

  addPower(amount) {
      const oldStage = this.getCurrentStage();
      
      // Call C++ function to calculate power gain with enlightenment bonus
      const finalAmount = calculatePowerGain(amount, this.enlightenmentBonus, this.isEnlightened);
      const percentageGained = this.calculatePowerToPercentage(finalAmount);

      this.power += finalAmount;
      const newStage = this.getCurrentStage();

      return {
          powerGain: finalAmount,
          newPower: this.power,
          stageChanged: oldStage.name !== newStage.name,
          newStage: newStage.name,
          wasEnlightened: this.isEnlightened,
          progressGained: percentageGained
      };
  }

  checkEnlightenment() {
      // Call C++ function to determine enlightenment success
      this.isEnlightened = rollForEnlightenment(this.enlightenmentChance);
      return this.isEnlightened;
  }
}

// Meditation tick handler (updates every tick)
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
                    
                    // Call C++ function to calculate meditation progress percentage
                    const progress = calculateMeditationProgress(system.meditationTime, 100);
                    
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
                                world.sendMessage(`§6Minor Realm Increase: +${result.progressGained}%`);
                            }
                            
                            system.meditationTime = 0;
                            system.lastBreakthrough = currentTime;
                            saveAllData();
                        }
                    }
                }
                
                const progress = system.getProgressToNextStage();
                const nextStageIndex = system.stages.findIndex(s => s.name === currentStage.name) + 1;
                if (nextStageIndex < system.stages.length) {
                    const nextStage = system.stages[nextStageIndex];
                    player.onScreenDisplay.setActionBar(`§6${currentStage.name} - Progress to ${nextStage.name}: ${progress}%`);
                }
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