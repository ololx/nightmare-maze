class GameObject {

    constructor(physicProperties = {x: 0, y: 0, v: 1, r: .40}, display, graphicProperties = {width: 64, height: 64, offset: {x: -32, y: -32}}) {
        this.position = {x: physicProperties.x, y: physicProperties.y};
        this.velocity = physicProperties.v;
        this.radius = physicProperties.r;
        this.display = display;
    }
}

class World extends Maze {

    constructor(board, start = {x: 0, y: 0}, finish = {x: 0, y: 0}, deadEnds = [], floorSprite, wallSprite) {
        super(board, start, finish, deadEnds);
        this.floorSprite = floorSprite;
        this.wallSprite = wallSprite;
    }

    draw() {
        for (let row = 0; row < this.board().length; row++) {
            for (let col = 0; col < this.board()[row].length; col++) {
                if (this.board()[row][col] === 1) {
                    this.wallSprite.draw(ctx, {x: col * tileSize, y: row * tileSize}, {w: tileSize, h: tileSize})
                } else if (this.board()[row][col] < 0) {
                    ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
                } else {
                    this.floorSprite.draw(ctx, {x: col * tileSize, y: row * tileSize}, {w: tileSize, h: tileSize})
                }
            }
        }
    }
}

class Level {

    constructor(params = {level: 1, world: {rows: 10, cols: 10}}) {
        this.level = params.level;
        let floorImage = new Image();
        floorImage.src = "assets/floor.png";
        let floorSprite = new Sprite(floorImage);
        let wallImage = new Image();
        wallImage.src = "assets/wall.png";
        let wallSprite = new Sprite(wallImage);
        let maze = new MazeGenerator().generate(params.world.rows, params.world.cols, {x: 1, y: 1}, 20, 35);
        this.world = new World(maze.board(), maze.start(), maze.finish(), maze.deadEnds(), floorSprite, wallSprite);

        let enemyImage = new Image();
        enemyImage.src = "assets/enemies.png";
        let enemySprite = new AnimatedSprite(
            enemyImage,
            6, 4,
            {
                idle: new Animation([
                    new Frame(0, 0, 300),
                    new Frame(1, 0, 200),
                    new Frame(2, 0, 300),
                    new Frame(3, 0, 200),
                ])
            }
        )
        let velocity = Math.min((this.level * .5) + 3, 6);
        let enemies = [];
        for (let deadEndNumber = 0; deadEndNumber < maze.deadEnds().length; deadEndNumber++) {
            let deadEnd = maze.deadEnds()[deadEndNumber];
            enemies[deadEndNumber] = new GameObject({x: deadEnd.x + .5, y: deadEnd.y + .5, v: velocity, r: .25}, enemySprite);
        }
        this.enemies = enemies;


        let friendImage = new Image();
        friendImage.src = "assets/friend.png";
        let friendSprite = new AnimatedSprite(
            friendImage,
            1, 5,
            {
                idle: new Animation([
                    new Frame(0, 0, 300),
                    new Frame(1, 0, 250),
                    new Frame(2, 0, 300),
                    new Frame(3, 0, 250),
                    new Frame(4, 0, 250),
                ])
            }
        )
        this.friend = new GameObject({x: maze.finish().x, y: maze.finish().y}, friendSprite);

        this.player = new PlayerFactory().newInstance({x: this.world.start().x + .5, y: this.world.start().y + .5, v: 1.5, r: .25});
    }
}

class PlayerFactory {

    newInstance(physicProperties = {x: 0, y: 0, v: 1, r: .40}) {
        let playerSpriteSheet = new Image();
        playerSpriteSheet.src = "assets/player.png";
        let playerAnimatedSprite = new AnimatedSprite(
            playerSpriteSheet,
            7, 4,
            {
                wd: new Animation([
                    new Frame(0, 0, 300),
                    new Frame(0, 1, 300),
                    new Frame(0, 2, 300),
                    new Frame(0, 3, 300),
                ]),
                wu: new Animation([
                    new Frame(1, 0, 300),
                    new Frame(1, 1, 300),
                    new Frame(1, 2, 300),
                    new Frame(1, 3, 300),
                ]),
                wl: new Animation([
                    new Frame(2, 0, 300),
                    new Frame(2, 1, 300),
                    new Frame(2, 2, 300),
                    new Frame(2, 3, 300),
                ]),
                wr: new Animation([
                    new Frame(3, 0, 300),
                    new Frame(3, 1, 300),
                    new Frame(3, 2, 300),
                    new Frame(3, 3, 300),
                ]),
                idle: new Animation([
                    new Frame(0, 6, 350),
                    new Frame(1, 6, 350),
                    new Frame(2, 6, 350),
                    new Frame(3, 6, 350),
                ])
            }
        );

        return new GameObject(physicProperties, playerAnimatedSprite);
    }
}
