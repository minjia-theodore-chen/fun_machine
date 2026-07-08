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

// Neon color definitions matching the brick breaker game
namespace NeonColors {
const std::string RESET = "\033[0m";
const std::string CYAN = "\033[38;2;0;243;255m";         // I piece
const std::string YELLOW = "\033[38;2;255;240;0m";       // O piece
const std::string PURPLE = "\033[38;2;188;19;254m";      // T piece
const std::string GREEN = "\033[38;2;57;255;20m";        // S piece
const std::string MAGENTA = "\033[38;2;255;0;127m";      // Z piece
const std::string BLUE = "\033[38;2;0;30;255m";          // J piece
const std::string ORANGE = "\033[38;2;255;110;0m";       // L piece
const std::string DARK_GRAY = "\033[38;2;60;60;60m";     // Grid lines/Borders
const std::string TEXT_WHITE = "\033[38;2;240;240;240m"; // GUI Text

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
