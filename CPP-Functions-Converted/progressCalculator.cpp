// progressCalculator.cpp
#include <emscripten.h>

extern "C" {
    EMSCRIPTEN_KEEPALIVE int calculateProgressToNextStage(int currentPower, int currentStageReq, int nextStageReq) {
        if (nextStageReq <= currentStageReq) return 100;
        
        int powerInCurrentStage = currentPower - currentStageReq;
        int powerRequiredForNextStage = nextStageReq - currentStageReq;
        return static_cast<int>((static_cast<float>(powerInCurrentStage) / powerRequiredForNextStage) * 100);
    }
}