#pragma once

#include "Common.hpp"
#include "Tetromino.hpp"
#include <array>

class Board {
public:
    Board();

    // Resets the board grid to empty
    void clear();

    // Checks if the given tetromino collides with walls, floor, or other locked blocks
    bool checkCollision(const Tetromino& tetromino) const;

    // Checks collision at a hypothetical position and rotation
    bool checkCollisionAt(const Tetromino& tetromino, Point position, int rotation) const;

    // Copies tetromino blocks into the board grid
    void lockTetromino(const Tetromino& tetromino);

    // Clears full lines and returns the count of lines cleared
    int clearLines();

    // Returns the shape at a specific grid position
    TetrominoShape getCell(int x, int y) const;

private:
    std::array<std::array<TetrominoShape, BOARD_WIDTH>, BOARD_HEIGHT> grid;

    // Internal check if coordinates are within standard board bounds
    bool isOutOfBounds(int x, int y) const;
};
