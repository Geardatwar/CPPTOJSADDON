// enlightenmentCalculator.cpp
#include <emscripten.h>
#include <cstdlib>

extern "C" {
    EMSCRIPTEN_KEEPALIVE bool rollForEnlightenment(float chance) {
        return (static_cast<float>(rand()) / RAND_MAX) < chance;
    }
}