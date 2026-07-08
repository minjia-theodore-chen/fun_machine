#include "Renderer.hpp"
#include <iostream>
#include <sstream>

Renderer::Renderer() {
  initialize();
  clear();
}

Renderer::~Renderer() { shutdown(); }

void Renderer::initialize() {
  // \033[?25l: Hide cursor
  // \033[2J: Clear screen
  // \033[H: Move cursor to home (top-left)
  std::cout << "\033[?25l\033[2J\033[H" << std::flush;

  // Initialize buffers to empty
  for (int y = 0; y < SCREEN_HEIGHT; ++y) {
    for (int x = 0; x < SCREEN_WIDTH; ++x) {
      currentChars[y][x] = ' ';
      nextChars[y][x] = ' ';
      currentColors[y][x] = 0;
      nextColors[y][x] = 0;
    }
  }
}

void Renderer::shutdown() {
  // \033[?25h: Show cursor
  // \033[0m: Reset colors
  // \033[2J\033[H: Clear screen and reset cursor on exit
  std::cout << "\033[?25h\033[0m\033[2J\033[H" << std::flush;
}

void Renderer::clear() {
  for (int y = 0; y < SCREEN_HEIGHT; ++y) {
    for (int x = 0; x < SCREEN_WIDTH; ++x) {
      nextChars[y][x] = ' ';
      nextColors[y][x] = 0;
    }
  }
}

void Renderer::writeStringToBuffer(int x, int y, const std::string &str,
                                   uint8_t colorCode) {
  if (y < 0 || y >= SCREEN_HEIGHT)
    return;
  int curX = x;
  for (char ch : str) {
    if (curX < 0 || curX >= SCREEN_WIDTH)
      break;
    nextChars[y][curX] = ch;
    nextColors[y][curX] = colorCode;
    curX++;
  }
}

void Renderer::writeBlockToBuffer(int x, int y, uint8_t colorCode) {
  if (y < 0 || y >= SCREEN_HEIGHT)
    return;
  if (x < 0 || x + 1 >= SCREEN_WIDTH)
    return;

  // A square block is drawn using two characters, e.g. "██"
  // Block character: '█' is multibyte in UTF-8, so for raw ASCII terminal, we
  // can use "[]" or "▒▒" or "██" Let's use standard brackets "[]" to draw
  // blocks. It looks very retro-clean and compiles safely.
  nextChars[y][x] = '[';
  nextChars[y][x + 1] = ']';
  nextColors[y][x] = colorCode;
  nextColors[y][x + 1] = colorCode;
}

std::string Renderer::getColorCodeStr(uint8_t colorCode) const {
  switch (colorCode) {
  case 1:
    return NeonColors::CYAN;
  case 2:
    return NeonColors::YELLOW;
  case 3:
    return NeonColors::PURPLE;
  case 4:
    return NeonColors::GREEN;
  case 5:
    return NeonColors::MAGENTA;
  case 6:
    return NeonColors::BLUE;
  case 7:
    return NeonColors::ORANGE;
  case 8:
    return NeonColors::DARK_GRAY;
  case 9:
    return NeonColors::TEXT_WHITE;
  default:
    return NeonColors::RESET;
  }
}

uint8_t Renderer::shapeToColorCode(TetrominoShape shape) const {
  return static_cast<uint8_t>(shape);
}

void Renderer::draw(const Board &board, const Tetromino &activePiece,
                    const Tetromino &nextPiece, int score, int level, int lines,
                    bool paused, bool gameOver) {
  // 1. Draw Title
  writeStringToBuffer(2, 0, "▲ NEON TETRIS ▲", 1);     // Cyan Title
  writeStringToBuffer(22, 0, "[CYBERPUNK MATRIX]", 8); // Dark Gray

  // 2. Draw Board Borders
  // Left border (col 1), Right border (col 22), Bottom border (row 22)
  // Board rows: 0 to 19 map to screen rows: 2 to 21
  for (int y = 2; y <= 21; ++y) {
    writeStringToBuffer(1, y, "|", 8);  // Dark gray wall
    writeStringToBuffer(22, y, "|", 8); // Dark gray wall
  }
  for (int x = 1; x <= 22; ++x) {
    nextChars[22][x] = '=';
    nextColors[22][x] = 8;
  }

  // 3. Draw Board Locked Cells
  for (int y = 0; y < BOARD_HEIGHT; ++y) {
    for (int x = 0; x < BOARD_WIDTH; ++x) {
      TetrominoShape shape = board.getCell(x, y);
      if (shape != TetrominoShape::NONE) {
        writeBlockToBuffer(2 + 2 * x, 2 + y, shapeToColorCode(shape));
      } else {
        // Subtle dot grid background for a retro matrix look
        nextChars[2 + y][2 + 2 * x] = '.';
        nextColors[2 + y][2 + 2 * x] = 8; // Dark gray dots
      }
    }
  }

  // 4. Draw Active Falling Tetromino
  if (!gameOver) {
    std::array<Point, 4> blocks = activePiece.getBlockPositions();
    for (const auto &block : blocks) {
      if (block.y >= 0 && block.y < BOARD_HEIGHT && block.x >= 0 &&
          block.x < BOARD_WIDTH) {
        writeBlockToBuffer(2 + 2 * block.x, 2 + block.y,
                           shapeToColorCode(activePiece.getShape()));
      }
    }
  }

  // 5. Draw Next Piece Panel
  writeStringToBuffer(26, 2, "┌─ NEXT MODULE ─┐", 9);
  for (int y = 3; y <= 6; ++y) {
    writeStringToBuffer(26, y, "│               │", 9);
  }
  writeStringToBuffer(26, 7, "└───────────────┘", 9);

  // Draw Next Piece centered in the box
  if (!gameOver) {
    std::array<Point, 4> nextBlocks = nextPiece.getBlockPositionsAt({0, 0}, 0);

    // Find bounding box to adjust centers dynamically
    int minX = 4, maxX = -1;
    for (const auto &b : nextBlocks) {
      if (b.x < minX)
        minX = b.x;
      if (b.x > maxX)
        maxX = b.x;
    }
    int width = maxX - minX + 1;
    int startCol = 32 - width; // Center inside the 15 char wide box

    for (const auto &b : nextBlocks) {
      writeBlockToBuffer(startCol + 2 * (b.x - minX), 4 + b.y,
                         shapeToColorCode(nextPiece.getShape()));
    }
  }

  // 6. Draw Dashboard/HUD
  writeStringToBuffer(26, 9, "SCORE: " + std::to_string(score),
                      2); // Yellow Score
  writeStringToBuffer(26, 11, "LEVEL: " + std::to_string(level),
                      4); // Green Level
  writeStringToBuffer(26, 13, "LINES: " + std::to_string(lines),
                      7); // Orange Lines

  // 7. Draw Controls Panel
  writeStringToBuffer(26, 16, "CONTROLS:", 9);
  writeStringToBuffer(28, 17, "<- / A  : Move Left", 8);
  writeStringToBuffer(28, 18, "-> / D  : Move Right", 8);
  writeStringToBuffer(28, 19, "v  / S  : Soft Drop", 8);
  writeStringToBuffer(28, 20, "^  / W  : Rotate CW", 8);
  writeStringToBuffer(28, 21, "Space   : Hard Drop", 8);
  writeStringToBuffer(28, 22, "Esc / P : Pause Game", 8);

  // 8. Draw Paused/GameOver Overlays
  if (gameOver) {
    // Clear board cells for Game Over text visibility
    for (int y = 7; y <= 13; ++y) {
      for (int x = 2; x <= 21; ++x) {
        nextChars[y][x] = ' ';
        nextColors[y][x] = 0;
      }
    }
    writeStringToBuffer(3, 8, "==================", 5);
    writeStringToBuffer(3, 9, "  CONNECTION LOST ", 5); // Red/Magenta Game Over
    writeStringToBuffer(3, 10, "     GAME OVER    ", 5);
    writeStringToBuffer(3, 11, " ---------------- ", 5);
    writeStringToBuffer(3, 12, "   R TO RE-BOOT   ", 5);
    writeStringToBuffer(3, 13, "==================", 5);
  } else if (paused) {
    // Clear board cells for Pause text visibility
    for (int y = 9; y <= 11; ++y) {
      for (int x = 2; x <= 21; ++x) {
        nextChars[y][x] = ' ';
        nextColors[y][x] = 0;
      }
    }
    writeStringToBuffer(3, 9, "==================", 3); // Purple Pause
    writeStringToBuffer(3, 10, "  SYSTEM SUSPENDED", 3);
    writeStringToBuffer(3, 11, "==================", 3);
  }
}

void Renderer::display() {
  std::stringstream ss;
  bool cursorMoved = false;

  for (int y = 0; y < SCREEN_HEIGHT; ++y) {
    for (int x = 0; x < SCREEN_WIDTH; ++x) {
      char nc = nextChars[y][x];
      uint8_t ncol = nextColors[y][x];

      // Only print if either character or color code changed
      if (nc != currentChars[y][x] || ncol != currentColors[y][x]) {
        // Move cursor to y+1, x+1 (1-indexed ANSI)
        // If it is adjacent to previous output, terminal cursor moves
        // automatically! So we only generate explicit move instructions if we
        // skipped characters.
        if (!cursorMoved) {
          ss << "\033[" << (y + 1) << ";" << (x + 1) << "H";
        }

        // Output color escape sequence
        ss << getColorCodeStr(ncol);
        // Output character
        ss << nc;

        // Sync current buffers
        currentChars[y][x] = nc;
        currentColors[y][x] = ncol;
        cursorMoved = true;
      } else {
        cursorMoved = false;
      }
    }
    // Force break adjacent tracking on line wrap
    cursorMoved = false;
  }

  // Flush updates to stdout
  std::cout << ss.str() << std::flush;
}
