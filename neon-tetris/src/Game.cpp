#include "Game.hpp"
#include <random>
#include <algorithm>
#include <thread>
#include <chrono>
#include <iostream>

Game::Game() : 
    score(0), 
    level(1), 
    linesCleared(0), 
    isPaused(false), 
    isGameOver(false), 
    shouldQuit(false), 
    gravityAccumulator(0.0) 
{
    // Seed initial piece generator bag
    refillPieceBag();
    
    // Initialize the preview piece and the active piece
    nextPiece = Tetromino(getRandomShape());
    spawnNextPiece();
}

double Game::getTickInterval() const {
    // Dynamic drop speeds. Speeds up as levels progress.
    // Level 1: 0.8s, Level 10: 0.08s
    return std::max(0.08, 0.8 - (level - 1) * 0.08);
}

void Game::refillPieceBag() {
    pieceBag = {
        TetrominoShape::I, TetrominoShape::O, TetrominoShape::T,
        TetrominoShape::S, TetrominoShape::Z, TetrominoShape::J,
        TetrominoShape::L
    };
    
    // Professional 7-bag randomizer using Mersenne Twister engine
    std::random_device rd;
    std::mt19937 g(rd());
    std::shuffle(pieceBag.begin(), pieceBag.end(), g);
}

TetrominoShape Game::getRandomShape() {
    if (pieceBag.empty()) {
        refillPieceBag();
    }
    TetrominoShape nextShape = pieceBag.back();
    pieceBag.pop_back();
    return nextShape;
}

void Game::spawnNextPiece() {
    activePiece = nextPiece;
    
    // Place piece at top center
    // BOARD_WIDTH / 2 = 5, offset left by 2 to center 4x4 shapes
    activePiece.setPosition({BOARD_WIDTH / 2 - 2, -1});
    
    // Generate next piece preview
    nextPiece = Tetromino(getRandomShape());
    
    // If piece spawns in collision immediately, the stack reached the top (Game Over)
    if (board.checkCollision(activePiece)) {
        isGameOver = true;
    }
}

void Game::processInput() {
    char key = input.readKey();
    if (key == '\0') return;

    // Handle quit globally
    if (key == 'q' || key == 'Q') { // q or Q to quit
        shouldQuit = true;
        return;
    }

    // Handle restart when game is over
    if (isGameOver && (key == 'r' || key == 'R')) {
        resetGame();
        return;
    }

    // Toggle pause state
    if (key == 'p' || key == 'P' || key == '\033') { // p, P, or Esc to pause
        isPaused = !isPaused;
        return;
    }

    // If game is over or paused, do not process gameplay buttons
    if (isGameOver || isPaused) return;

    switch (key) {
        case 'a': // Move Left
            activePiece.move(-1, 0);
            if (board.checkCollision(activePiece)) {
                activePiece.move(1, 0); // Revert
            }
            break;
            
        case 'd': // Move Right
            activePiece.move(1, 0);
            if (board.checkCollision(activePiece)) {
                activePiece.move(-1, 0); // Revert
            }
            break;
            
        case 's': // Soft Drop (move down, user gains 1 point per soft drop tick)
            activePiece.move(0, 1);
            if (board.checkCollision(activePiece)) {
                activePiece.move(0, -1); // Revert
                board.lockTetromino(activePiece);
                int cleared = board.clearLines();
                if (cleared > 0) addScore(cleared);
                spawnNextPiece();
            } else {
                score += 1;
            }
            break;
            
        case 'w': { // Rotate clockwise (with basic wall kicks)
            activePiece.rotate();
            if (board.checkCollision(activePiece)) {
                // Try kicking 1 block right
                activePiece.move(1, 0);
                if (board.checkCollision(activePiece)) {
                    // Try kicking 1 block left
                    activePiece.move(-2, 0);
                    if (board.checkCollision(activePiece)) {
                        // Undo kicks and undo rotation
                        activePiece.move(1, 0);
                        activePiece.rotateBack();
                    }
                }
            }
            break;
        }
            
        case ' ': // Hard Drop
            performHardDrop();
            break;
    }
}

void Game::performHardDrop() {
    int dropDistance = 0;
    while (!board.checkCollision(activePiece)) {
        activePiece.move(0, 1);
        dropDistance++;
    }
    // Step back from collision
    activePiece.move(0, -1);
    dropDistance--;
    
    board.lockTetromino(activePiece);
    score += dropDistance * 2; // Double points for hard drops
    
    int cleared = board.clearLines();
    if (cleared > 0) {
        addScore(cleared);
    }
    
    spawnNextPiece();
}

void Game::addScore(int lines) {
    // Nintendo Tetris scoring multiplier
    int multiplier = 0;
    switch (lines) {
        case 1: multiplier = 100; break;
        case 2: multiplier = 300; break;
        case 3: multiplier = 500; break;
        case 4: multiplier = 800; break; // Tetris!
        default: break;
    }
    
    score += multiplier * level;
    linesCleared += lines;
    
    // Advance levels every 10 lines
    level = (linesCleared / 10) + 1;
}

void Game::updatePhysics(double deltaTime) {
    if (isGameOver || isPaused) return;

    gravityAccumulator += deltaTime;
    
    if (gravityAccumulator >= getTickInterval()) {
        gravityAccumulator = 0.0;
        
        activePiece.move(0, 1);
        if (board.checkCollision(activePiece)) {
            activePiece.move(0, -1); // Revert
            board.lockTetromino(activePiece);
            
            int cleared = board.clearLines();
            if (cleared > 0) {
                addScore(cleared);
            }
            
            spawnNextPiece();
        }
    }
}

void Game::render() {
    renderer.clear();
    renderer.draw(board, activePiece, nextPiece, score, level, linesCleared, isPaused, isGameOver);
    renderer.display();
}

void Game::run() {
    // Initial draw to screen
    render();
    
    // Reset timer starting point
    timer.reset();
    
    while (!shouldQuit) {
        // Delta time computation
        double deltaTime = timer.getElapsedSeconds();
        
        // 1. Check for player keyboard inputs
        processInput();
        
        // 2. Perform gravity checks and line shifts
        updatePhysics(deltaTime);
        
        // 3. Redraw modifications to screen
        render();
        
        // 4. Yield CPU slice (reduces CPU utilization significantly)
        std::this_thread::sleep_for(std::chrono::milliseconds(16)); // Target ~60hz ticks
    }
}

void Game::resetGame() {
    score = 0;
    level = 1;
    linesCleared = 0;
    isPaused = false;
    isGameOver = false;
    gravityAccumulator = 0.0;
    board.clear();
    refillPieceBag();
    nextPiece = Tetromino(getRandomShape());
    spawnNextPiece();
}
