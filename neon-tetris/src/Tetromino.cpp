#include "Tetromino.hpp"

Tetromino::Tetromino(TetrominoShape shape) : shape(shape), position({0, 0}), rotationIndex(0) {
    initializeOffsets();
}

void Tetromino::move(int dx, int dy) {
    position.x += dx;
    position.y += dy;
}

void Tetromino::rotate() {
    rotationIndex = (rotationIndex + 1) % 4;
}

void Tetromino::rotateBack() {
    rotationIndex = (rotationIndex + 3) % 4; // Moves backward
}

std::array<Point, 4> Tetromino::getBlockPositions() const {
    return getBlockPositionsAt(position, rotationIndex);
}

std::array<Point, 4> Tetromino::getBlockPositionsAt(Point pos, int rot) const {
    std::array<Point, 4> absolutePos;
    for (int i = 0; i < 4; ++i) {
        absolutePos[i] = pos + offsets[rot][i];
    }
    return absolutePos;
}

void Tetromino::initializeOffsets() {
    switch (shape) {
        case TetrominoShape::I:
            // I shape (4x4 grid space rotation)
            offsets[0] = {{{0, 1}, {1, 1}, {2, 1}, {3, 1}}};
            offsets[1] = {{{2, 0}, {2, 1}, {2, 2}, {2, 3}}};
            offsets[2] = {{{0, 2}, {1, 2}, {2, 2}, {3, 2}}};
            offsets[3] = {{{1, 0}, {1, 1}, {1, 2}, {1, 3}}};
            break;
            
        case TetrominoShape::O:
            // O shape (doesn't rotate in practice)
            offsets[0] = {{{1, 0}, {2, 0}, {1, 1}, {2, 1}}};
            offsets[1] = {{{1, 0}, {2, 0}, {1, 1}, {2, 1}}};
            offsets[2] = {{{1, 0}, {2, 0}, {1, 1}, {2, 1}}};
            offsets[3] = {{{1, 0}, {2, 0}, {1, 1}, {2, 1}}};
            break;
            
        case TetrominoShape::T:
            // T shape
            offsets[0] = {{{1, 0}, {0, 1}, {1, 1}, {2, 1}}};
            offsets[1] = {{{1, 0}, {1, 1}, {2, 1}, {1, 2}}};
            offsets[2] = {{{0, 1}, {1, 1}, {2, 1}, {1, 2}}};
            offsets[3] = {{{1, 0}, {0, 1}, {1, 1}, {1, 2}}};
            break;
            
        case TetrominoShape::S:
            // S shape
            offsets[0] = {{{1, 0}, {2, 0}, {0, 1}, {1, 1}}};
            offsets[1] = {{{1, 0}, {1, 1}, {2, 1}, {2, 2}}};
            offsets[2] = {{{1, 1}, {2, 1}, {0, 2}, {1, 2}}};
            offsets[3] = {{{0, 0}, {0, 1}, {1, 1}, {1, 2}}};
            break;
            
        case TetrominoShape::Z:
            // Z shape
            offsets[0] = {{{0, 0}, {1, 0}, {1, 1}, {2, 1}}};
            offsets[1] = {{{2, 0}, {1, 1}, {2, 1}, {1, 2}}};
            offsets[2] = {{{0, 1}, {1, 1}, {1, 2}, {2, 2}}};
            offsets[3] = {{{1, 0}, {0, 1}, {1, 1}, {0, 2}}};
            break;
            
        case TetrominoShape::J:
            // J shape
            offsets[0] = {{{0, 0}, {0, 1}, {1, 1}, {2, 1}}};
            offsets[1] = {{{1, 0}, {2, 0}, {1, 1}, {1, 2}}};
            offsets[2] = {{{0, 1}, {1, 1}, {2, 1}, {2, 2}}};
            offsets[3] = {{{1, 0}, {1, 1}, {0, 2}, {1, 2}}};
            break;
            
        case TetrominoShape::L:
            // L shape
            offsets[0] = {{{2, 0}, {0, 1}, {1, 1}, {2, 1}}};
            offsets[1] = {{{1, 0}, {1, 1}, {1, 2}, {2, 2}}};
            offsets[2] = {{{0, 1}, {1, 1}, {2, 1}, {0, 2}}};
            offsets[3] = {{{0, 0}, {1, 0}, {1, 1}, {1, 2}}};
            break;
            
        default:
            // Empty shape offsets
            for (int r = 0; r < 4; ++r) {
                for (int b = 0; b < 4; ++b) {
                    offsets[r][b] = {0, 0};
                }
            }
            break;
    }
}
