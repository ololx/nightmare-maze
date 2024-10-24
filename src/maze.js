class Maze {

    #start = {x: 0, y: 0};

    #finish = {x: 0, y: 0};

    #deadEnds = [];

    #board = [];

    constructor(board, start = {x: 0, y: 0}, finish = {x: 0, y: 0}, deadEnds = []) {
        this.#board = board;
        this.#deadEnds = deadEnds;
        this.#start = start;
        this.#finish = finish;
    }

    board() {
        return this.#board;
    }

    deadEnds() {
        return this.#deadEnds;
    }

    start() {
        return this.#start;
    }

    finish() {
        return this.#finish;
    }
}

class MazeGenerator {

    generate(mazeRows = 0, mazeCols = 0, start = {x: 0, y: 0}, outerRows = 0, outerCols = 0) {
        let outerBoard = this.#createBoard(outerRows, outerCols, -1);

        let startRow = Math.floor((outerRows - mazeRows) / 2);
        let startCol = Math.floor((outerCols - mazeCols) / 2);

        let mazeBoard = this.#createBoard(mazeRows, mazeCols);
        mazeBoard = this.#fillPaths(mazeBoard, start);

        for (let i = 0; i < mazeRows; i++) {
            for (let j = 0; j < mazeCols; j++) {
                outerBoard[startRow + i][startCol + j] = mazeBoard[i][j];
            }
        }

        start = {x: start.x + startCol, y: start.y + startRow};

        let deadEnds = this.#createDeadEnds(outerBoard);
        let finish = this.#findFurthestDeadEnd(start, deadEnds);

        deadEnds = deadEnds.filter(deadEnd =>
            !(deadEnd.x === start.x && deadEnd.y === start.y) &&
            !(deadEnd.x === finish.x && deadEnd.y === finish.y)
        );

        return new Maze(outerBoard, start, finish, deadEnds);
    }

    #createBoard(rows, cols, filler = 1) {
        let board = [];

        for (let row = 0; row < rows; row++) {
            board[row] = [];

            for (let col = 0; col < cols; col++) {
                board[row][col] = filler;
            }
        }

        return board;
    }

    #fillPaths(board, start) {
        let currCell = start;
        let stack = [];
        stack.push(currCell);
        board[currCell.x][currCell.y] = 0;

        while (stack.length > 0) {
            let directions = this.#createDirections();
            let moved = false;

            for (let i = 0; i < directions.length; i++) {
                let direction = directions[i];
                let newX = currCell.x + direction[0] * 2;
                let newY = currCell.y + direction[1] * 2;

                if (newX > 0 && newY > 0 && newX < board[0].length - 1 && newY < board.length - 1 && board[newY][newX] === 1) {
                    board[currCell.y + direction[1]][currCell.x + direction[0]] = 0;
                    board[newY][newX] = 0;
                    currCell = {x: newX, y: newY};
                    stack.push(currCell);
                    moved = true;
                    break;
                }
            }

            if (!moved) {
                currCell = stack.pop();
            }
        }

        return board;
    }

    #createDirections() {
        let directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }

        return directions;
    }

    #createDeadEnds(board) {
        let deadEnds = [];
        let number = -1;

        for (let row = 1; row < board.length - 1; row++) {
            for (let col = 1; col < board[row].length - 1; col++) {
                if (board[row][col] !== 0 || !this.#isDeadEnd(board, row, col)) {
                    continue;
                }

                deadEnds[++number] = {x: col, y: row};
            }
        }

        return deadEnds;
    }

    #isDeadEnd(board, row, col) {
        let wallsCount = 0;
        let neighbors = [
            [row - 1, col],
            [row + 1, col],
            [row, col - 1],
            [row, col + 1]
        ];

        neighbors.forEach(([nRow, nCol]) => {
            if (board[nRow][nCol] === 1) {
                wallsCount++;
            }
        });

        return wallsCount === 3;
    }

    #findFurthestDeadEnd(start, deadEnds) {
        let maxDistance = -1;
        let furthestDeadEnd = start;

        deadEnds.forEach(deadEnd => {
            let distance = this.#manhattanDistance(start, deadEnd);
            if (distance > maxDistance) {
                maxDistance = distance;
                furthestDeadEnd = deadEnd;
            }
        });

        return furthestDeadEnd;
    }

    #manhattanDistance(pointA, pointB) {
        return Math.abs(pointA.x - pointB.x) + Math.abs(pointA.y - pointB.y);
    }
}
