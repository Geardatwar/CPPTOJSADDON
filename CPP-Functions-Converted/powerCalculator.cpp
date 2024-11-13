// powerCalculator.cpp
#include <emscripten.h>

extern "C" {
    EMSCRIPTEN_KEEPALIVE int calculatePowerGain(int basePower, bool isEnlightened, float enlightenmentBonus) {
        if (isEnlightened) {
            return static_cast<int>(basePower * enlightenmentBonus);
        }
        return basePower;
    }
}