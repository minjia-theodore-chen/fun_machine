#pragma once

#include "Common.hpp"
#include "Board.hpp"
#include "Tetromino.hpp"
#include <string>
#include <vector>
#include <array>

class Renderer {
public:
    Renderer();
    ~Renderer();

    // Clears the screen and resets terminal cursor
    void initialize();

    // Restores standard terminal settings (cursor visibility, color reset)
    void shutdown();

    // Clears the virtual next buffer
    void clear();

    // Renders the board grid, the active tetromino, and the next tetromino preview
    void draw(const Board& board, const Tetromino& activePiece, const Tetromino& nextPiece, int score, int level, int lines, bool paused, bool gameOver);

    // Compares next buffer with current buffer, writes changes to terminal, and swaps buffers
    void display();

private:
    static constexpr int SCREEN_WIDTH = 50;
    static constexpr int SCREEN_HEIGHT = 24;

    // Buffer arrays representing characters and color strings
    std::array<std::array<char, SCREEN_WIDTH>, SCREEN_HEIGHT> currentChars;
    std::array<std::array<char, SCREEN_WIDTH>, SCREEN_HEIGHT> nextChars;

    // To keep it memory-efficient, we store an index to a palette of color strings
    // Color Palette mapping:
    // 0: Reset, 1: Cyan, 2: Yellow, 3: Purple, 4: Green, 5: Magenta, 6: Blue, 7: Orange, 8: Dark Gray, 9: White
    std::array<std::array<uint8_t, SCREEN_WIDTH>, SCREEN_HEIGHT> currentColors;
    std::array<std::array<uint8_t, SCREEN_WIDTH>, SCREEN_HEIGHT> nextColors;

    // Helper to draw a string to the next buffer
    void writeStringToBuffer(int x, int y, const std::string& str, uint8_t colorCode);

    // Helper to draw a cell block (2 chars wide, e.g. "[]")
    void writeBlockToBuffer(int x, int y, uint8_t colorCode);

    // Converts color enum index to ANSI escape code string
    std::string getColorCodeStr(uint8_t colorCode) const;

    // Translates TetrominoShape to color palette code
    uint8_t shapeToColorCode(TetrominoShape shape) const;
};
