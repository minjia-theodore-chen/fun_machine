#include "Timer.hpp"

Timer::Timer() { reset(); }

void Timer::reset() {
  startTime = std::chrono::high_resolution_clock::now();
  lastTime = startTime;
}

double Timer::getElapsedSeconds() {
  auto now = std::chrono::high_resolution_clock::now();
  std::chrono::duration<double> elapsed = now - lastTime;
  lastTime = now;
  return elapsed.count();
}

double Timer::getTotalTimeSeconds() const {
  auto now = std::chrono::high_resolution_clock::now();
  std::chrono::duration<double> elapsed = now - startTime;
  return elapsed.count();
}
