// bridge.cpp
#include "cultivation_core.hpp"
#include <string>

extern "C" {
    // Bridge function declarations
    const char* getCurrentStageName(int power) {
        static std::string stageName;
        stageName = CultivationCore::CultivationSystem::getCurrentStage(power).name;
        return stageName.c_str();
    }

    int getProgressToNextStage(int power) {
        return CultivationCore::CultivationSystem::getProgressToNextStage(power);
    }

    CultivationCore::PowerResult* addPower(int currentPower, int amount, bool isEnlightened) {
        static CultivationCore::PowerResult result;
        result = CultivationCore::CultivationSystem::addPower(currentPower, amount, isEnlightened);
        return &result;
    }

    bool checkEnlightenment() {
        return CultivationCore::CultivationSystem::checkEnlightenment();
    }

    bool isInQiCondensation(int power) {
        return CultivationCore::CultivationSystem::isInQiCondensation(power);
    }
}