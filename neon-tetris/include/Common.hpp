#pragma once

#include <string>

// Game board dimensions (standard Tetris)
constexpr int BOARD_WIDTH = 10;
constexpr int BOARD_HEIGHT = 20;

// Enums for game shapes
enum class TetrominoShape { NONE = 0, I, O, T, S, Z, J, L };

// Movement directions
enum class Direction { LEFT, RIGHT, DOWN };

// 2D coordinate representation
struct Point {
  int x;
  int y;

  bool operator==(const Point &other) const {
    return x == other.x && y == other.y;
  }

  Point operator+(const Point &other) const {
    return {x + other.x, y + other.y};
  }
};

// Nord color definitions (soft, elegant pastel theme to reduce eye fatigue)
namespace NeonColors {
const std::string RESET = "\033[0m";
const std::string CYAN =
    "\033[38;2;136;192;208m"; // I piece: Nord Frost Cyan (#88C0D0)
const std::string YELLOW =
    "\033[38;2;235;203;139m"; // O piece: Nord Sand Yellow (#EBCB8B)
const std::string PURPLE =
    "\033[38;2;180;142;173m"; // T piece: Nord Aurora Lavender (#B48EAD)
const std::string GREEN =
    "\033[38;2;163;190;140m"; // S piece: Nord Aurora Sage Green (#A3BE8C)
const std::string MAGENTA =
    "\033[38;2;191;97;106m"; // Z piece: Nord Aurora Rose Red (#BF616A)
const std::string BLUE =
    "\033[38;2;94;129;172m"; // J piece: Nord Frost Steel Blue (#5E81AC)
const std::string ORANGE =
    "\033[38;2;208;135;112m"; // L piece: Nord Aurora Orange (#D08770)
const std::string DARK_GRAY =
    "\033[38;2;76;86;106m"; // Grid/Borders: Nord Slate Gray (#4C566A)
const std::string TEXT_WHITE =
    "\033[38;2;216;222;233m"; // GUI Text: Nord Snow White (#D8DEE9)

// Returns corresponding ANSI color string for a shape
inline std::string getShapeColor(TetrominoShape shape) {
  switch (shape) {
  case TetrominoShape::I:
    return CYAN;
  case TetrominoShape::O:
    return YELLOW;
  case TetrominoShape::T:
    return PURPLE;
  case TetrominoShape::S:
    return GREEN;
  case TetrominoShape::Z:
    return MAGENTA;
  case TetrominoShape::J:
    return BLUE;
  case TetrominoShape::L:
    return ORANGE;
  default:
    return RESET;
  }
}
} // namespace NeonColors
