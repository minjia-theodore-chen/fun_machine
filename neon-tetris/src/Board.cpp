#include "Board.hpp"

Board::Board() {
    clear();
}

void Board::clear() {
    for (int y = 0; y < BOARD_HEIGHT; ++y) {
        for (int x = 0; x < BOARD_WIDTH; ++x) {
            grid[y][x] = TetrominoShape::NONE;
        }
    }
}

bool Board::checkCollision(const Tetromino& tetromino) const {
    return checkCollisionAt(tetromino, tetromino.getPosition(), tetromino.getRotation());
}

bool Board::checkCollisionAt(const Tetromino& tetromino, Point position, int rotation) const {
    std::array<Point, 4> blocks = tetromino.getBlockPositionsAt(position, rotation);
    
    for (const auto& block : blocks) {
        // Wall boundaries
        if (block.x < 0 || block.x >= BOARD_WIDTH) {
            return true;
        }
        
        // Floor boundary
        if (block.y >= BOARD_HEIGHT) {
            return true;
        }
        
        // Ceilings (above the screen is allowed for rotations, but not below y=0 collisions)
        if (block.y < 0) {
            continue;
        }
        
        // Check collision with locked blocks
        if (grid[block.y][block.x] != TetrominoShape::NONE) {
            return true;
        }
    }
    
    return false;
}

void Board::lockTetromino(const Tetromino& tetromino) {
    std::array<Point, 4> blocks = tetromino.getBlockPositions();
    for (const auto& block : blocks) {
        if (!isOutOfBounds(block.x, block.y)) {
            grid[block.y][block.x] = tetromino.getShape();
        }
    }
}

int Board::clearLines() {
    int linesCleared = 0;
    
    // Scan from bottom to top
    for (int y = BOARD_HEIGHT - 1; y >= 0; --y) {
        bool rowFull = true;
        for (int x = 0; x < BOARD_WIDTH; ++x) {
            if (grid[y][x] == TetrominoShape::NONE) {
                rowFull = false;
                break;
            }
        }
        
        if (rowFull) {
            ++linesCleared;
            // Shift all rows above down by one
            for (int sy = y; sy > 0; --sy) {
                grid[sy] = grid[sy - 1];
            }
            
            // Clear top row
            for (int x = 0; x < BOARD_WIDTH; ++x) {
                grid[0][x] = TetrominoShape::NONE;
            }
            
            // Recheck the current row index since rows shifted down
            ++y;
        }
    }
    
    return linesCleared;
}

TetrominoShape Board::getCell(int x, int y) const {
    if (isOutOfBounds(x, y)) {
        return TetrominoShape::NONE;
    }
    return grid[y][x];
}

bool Board::isOutOfBounds(int x, int y) const {
    return x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT;
}
