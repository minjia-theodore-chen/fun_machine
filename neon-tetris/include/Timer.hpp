#pragma once

#include <chrono>

class Timer {
public:
  Timer();

  // Resets the timer's starting point to now
  void reset();

  // Returns seconds elapsed since the last time getElapsedSeconds() was called
  double getElapsedSeconds();

  // Returns the total time in seconds since the timer was created/reset
  double getTotalTimeSeconds() const;

private:
  std::chrono::time_point<std::chrono::high_resolution_clock> lastTime;
  std::chrono::time_point<std::chrono::high_resolution_clock> startTime;
};
