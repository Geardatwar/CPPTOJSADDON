// cultivation_core.hpp
#pragma once
#include <vector>
#include <string>
#include <memory>
#include <bits/algorithmfwd.h>

namespace CultivationCore {

struct CultivationStage {
    std::string name;
    int requiredPower;
    int damageBonus;
    int defenseBonus;
};

struct PowerResult {
    int powerGain;
    int newPower;
    bool stageChanged;
    std::string newStage;
    bool wasEnlightened;
    int progressGained;
};

class CultivationSystem {
private:
    static const std::vector<CultivationStage> stages;
    static constexpr float ENLIGHTENMENT_CHANCE = 0.15f;
    static constexpr float ENLIGHTENMENT_BONUS = 2.0f;

public:
    static const CultivationStage& getCurrentStage(int power) {
        for (auto it = stages.rbegin(); it != stages.rend(); ++it) {
            if (power >= it->requiredPower) {
                return *it;
            }
        }
        return stages[0];
    }

    static int getProgressToNextStage(int power) {
        const auto& currentStage = getCurrentStage(power);
        auto currentStageIt = std::find_if(stages.begin(), stages.end(),
            [&](const CultivationStage& stage) { return stage.name == currentStage.name; });
        
        size_t currentIndex = std::distance(stages.begin(), currentStageIt);
        if (currentIndex == stages.size() - 1) return 100;

        const auto& nextStage = stages[currentIndex + 1];
        int powerInCurrentStage = power - currentStage.requiredPower;
        int powerRequiredForNextStage = nextStage.requiredPower - currentStage.requiredPower;
        
        return static_cast<int>((static_cast<float>(powerInCurrentStage) / powerRequiredForNextStage) * 100);
    }

    static PowerResult addPower(int currentPower, int amount, bool isEnlightened) {
        const auto& oldStage = getCurrentStage(currentPower);
        int finalAmount = isEnlightened ? static_cast<int>(amount * ENLIGHTENMENT_BONUS) : amount;
        int newPower = currentPower + finalAmount;
        const auto& newStage = getCurrentStage(newPower);

        return PowerResult{
            finalAmount,
            newPower,
            oldStage.name != newStage.name,
            newStage.name,
            isEnlightened,
            getProgressToNextStage(newPower)
        };
    }

    static bool checkEnlightenment() {
        return (static_cast<float>(rand()) / RAND_MAX) < ENLIGHTENMENT_CHANCE;
    }

    static bool isInQiCondensation(int power) {
        const auto& currentStage = getCurrentStage(power);
        return currentStage.name == "Qi Condensation";
    }
};

// Static member initialization
const std::vector<CultivationStage> CultivationSystem::stages = {
    {"Mortal", 0, 0, 0},
    {"Qi Condensation", 100, 2, 1},
    {"Foundation Establishment", 300, 4, 2},
    {"Core Formation", 600, 6, 3},
    {"Nascent Soul", 1000, 8, 4}
};

} // namespace CultivationCore
