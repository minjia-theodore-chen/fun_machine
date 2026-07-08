#pragma once

#include <termios.h>

class Input {
public:
  Input();
  ~Input();

  // Disable copy constructor and assignment operator to prevent multiple
  // instances managing the terminal settings.
  Input(const Input &) = delete;
  Input &operator=(const Input &) = delete;

  // Checks standard input for keypress in a non-blocking manner.
  // Returns the char pressed, or '\0' if no key is pending.
  char readKey();

private:
  struct termios originalTermios;

  void enableRawMode();
  void disableRawMode();
};
