#pragma once

#include "Common.hpp"
#include <array>

class Tetromino {
public:
    Tetromino() : shape(TetrominoShape::NONE), position({0, 0}), rotationIndex(0) {}
    Tetromino(TetrominoShape shape);

    // Moves the tetromino relative to its current position
    void move(int dx, int dy);

    // Rotates the tetromino clockwise
    void rotate();

    // Reverts a rotation
    void rotateBack();

    // Returns absolute coordinates of the 4 blocks on the board
    std::array<Point, 4> getBlockPositions() const;

    // Returns absolute coordinates of the 4 blocks at a potential position and rotation
    std::array<Point, 4> getBlockPositionsAt(Point pos, int rot) const;

    // Getters and Setters
    TetrominoShape getShape() const { return shape; }
    Point getPosition() const { return position; }
    int getRotation() const { return rotationIndex; }
    void setPosition(Point pos) { position = pos; }

private:
    TetrominoShape shape;
    Point position;
    int rotationIndex; // 0 to 3

    // 4 blocks, each having coordinates for 4 rotation states
    std::array<std::array<Point, 4>, 4> offsets;

    // Helper to load offsets for a shape
    void initializeOffsets();
};
