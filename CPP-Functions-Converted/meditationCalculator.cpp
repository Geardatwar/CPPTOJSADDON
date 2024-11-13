// meditationCalculator.cpp
#include <emscripten.h>
#include <algorithm>

extern "C" {
    EMSCRIPTEN_KEEPALIVE float calculateMeditationProgress(int meditationTime, int maxTime) {
        return std::min(static_cast<float>(meditationTime) / maxTime * 100, 100.0f);
    }
}