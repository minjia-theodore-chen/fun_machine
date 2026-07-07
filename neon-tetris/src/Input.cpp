#include "Input.hpp"
#include <unistd.h>
#include <fcntl.h>

Input::Input() {
    enableRawMode();
}

Input::~Input() {
    disableRawMode();
}

void Input::enableRawMode() {
    // Query standard input settings
    tcgetattr(STDIN_FILENO, &originalTermios);
    
    struct termios raw = originalTermios;
    
    // Disable canonical mode (line-buffering) and input echoing
    // ICANON: Canonical input mode (line by line editing)
    // ECHO: Echo input characters
    raw.c_lflag &= ~(ICANON | ECHO);
    
    // VMIN: Minimum number of characters for non-canonical read
    // VTIME: Timeout in deciseconds for non-canonical read
    // Setting both to 0 makes read() completely non-blocking
    raw.c_cc[VMIN] = 0;
    raw.c_cc[VTIME] = 0;
    
    // Apply raw settings to standard input terminal
    tcsetattr(STDIN_FILENO, TCSAFLUSH, &raw);
}

void Input::disableRawMode() {
    // Restore original terminal attributes
    tcsetattr(STDIN_FILENO, TCSAFLUSH, &originalTermios);
}

char Input::readKey() {
    char ch = '\0';
    
    // Attempt non-blocking read of one byte
    ssize_t bytesRead = read(STDIN_FILENO, &ch, 1);
    
    if (bytesRead > 0) {
        // If it's an Escape sequence (Arrow keys send '\033[A', '\033[B', etc.)
        if (ch == '\033') {
            char seq[2];
            // Attempt to read the next two bytes of the sequence
            // (arrow key inputs occur within microseconds, so they are grouped in the buffer)
            if (read(STDIN_FILENO, &seq[0], 1) > 0 && read(STDIN_FILENO, &seq[1], 1) > 0) {
                if (seq[0] == '[') {
                    switch (seq[1]) {
                        case 'A': return 'w'; // Up Arrow -> map to Rotate ('w')
                        case 'B': return 's'; // Down Arrow -> map to Down ('s')
                        case 'C': return 'd'; // Right Arrow -> map to Right ('d')
                        case 'D': return 'a'; // Left Arrow -> map to Left ('a')
                    }
                }
            }
            return '\033'; // Raw escape pressed (like pause/exit)
        }
        return ch;
    }
    
    return '\0';
}
