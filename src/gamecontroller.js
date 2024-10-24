class MainGameController extends GameController {

    showingLevelScreen = true;
    levelScreenDelay = 0;
    currentLevel = 1;

    player;
    enemies;
    friend;
    flash;

    constructor() {
        super();
        this.audio = new AudioController();
        this.#init(this.currentLevel);
    }

    #init(level = 1) {
        this.showingLevelScreen = true;
        this.currentLevel = level;
        let rows = Math.min(20, level * 2 + 8);
        let cols = Math.min(35, level * 2 + 8);
        this.level = new Level(
            {
                level: this.currentLevel,
                world: {rows: rows, cols: cols}
            }
        );

        this.world = new WorldController(this.level.world, this.level.world.floorSprite, this.level.world.wallSprite);
        this.enemies = this.level.enemies.map(enemy => new EnemyController(enemy, this.level.player, this.level.world));
        this.friend = new FriendController(this.level.player, this.level.friend);
        this.player = new PlayerController(this.level.player, this.level.world, keyboard);
        this.flash = new FlashController(this.level.player);

    }

    processUpdate(elapsedTime) {
        if (!this.showingLevelScreen) {
            if (this.flash.boom) {
                this.audio.playFlash();
                this.enemies.forEach(enemy => enemy.update(elapsedTime));
            } else {
                this.audio.stopFlash();
            }

            this.player.update(elapsedTime);
            this.flash.update(elapsedTime);
            this.friend.update(elapsedTime);

            if (this.friend.checkCollision()) {
                this.audio.playWin();
                this.#init(++this.currentLevel);
            }

            this.enemies.forEach(enemy => {
                if (enemy.checkCollision()) {
                    this.audio.playDead();
                    this.#init(this.currentLevel);
                }
            });

            this.audio.playMain();
        } else {
            if (this.levelScreenDelay >= 3000) {
                this.levelScreenDelay = 0;
                this.showingLevelScreen = false;
            }

            this.levelScreenDelay += elapsedTime;
        }
    }

    processRender() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!this.showingLevelScreen) {
            this.world.draw();
            this.enemies.forEach(enemy => enemy.draw());
            this.friend.draw();
            this.player.draw();
            this.flash.draw();
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            ctx.font = "48px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Level " + this.level.level, canvas.width / 2, canvas.height / 2);
        }
    }
}

class PlayerController {

    constructor(player, world, keyboard) {
        this.player = player;
        this.world = world;
        this.keyboard = keyboard;
    }

    update(frameTime = .1) {
        let newX = this.player.position.x;
        let newY = this.player.position.y;

        let step = this.player.velocity * frameTime / 1000;
        this.player.display.switchAnimation("idle");

        if ( this.keyboard.isEventTracked('ArrowUp') && !this.#isValidMove(this.player.position.x, this.player.position.y - step)) {
            newY -= step;
            this.player.display.switchAnimation("wu");
        }

        if ( this.keyboard.isEventTracked('ArrowDown') && !this.#isValidMove(this.player.position.x, this.player.position.y + step)) {
            newY += step;
            this.player.display.switchAnimation("wd");
        }

        if ( this.keyboard.isEventTracked('ArrowLeft') && !this.#isValidMove(this.player.position.x - step, this.player.position.y)) {
            newX -= step;
            this.player.display.switchAnimation("wl");
        }

        if ( this.keyboard.isEventTracked('ArrowRight') && !this.#isValidMove(this.player.position.x + step, this.player.position.y)) {
            newX += step;
            this.player.display.switchAnimation("wr");
        }

        this.player.position.x = newX;
        this.player.position.y = newY;

        this.player.display.update(frameTime);
    }

    #isValidMove(newX, newY) {
        let row = Math.floor(newY);
        let col = Math.floor(newX);
        return !!(this.world.board()[row] && this.world.board()[row][col] === 1);
    }

    draw() {
        this.player.display.draw(ctx, {x: this.player.position.x * tileSize, y: this.player.position.y * tileSize}, {w: tileSize / 2, h: tileSize / 2}, {x: -tileSize / 4, y: -tileSize / 4})
    }
}

class EnemyController {
    constructor(enemy, player, world) {
        this.enemy = enemy;
        this.player = player;
        this.world = world;
    }

    update(frameTime = .1) {
        this.enemy.display.update(frameTime);

        const map = this.world.board();
        const startX = Math.floor(this.enemy.position.x);
        const startY = Math.floor(this.enemy.position.y);
        const targetX = Math.floor(this.player.position.x);
        const targetY = Math.floor(this.player.position.y);

        if (startX === targetX && startY === targetY) {
            const exactDirX = (this.player.position.x - this.enemy.position.x) * this.enemy.velocity * frameTime / 1000;
            const exactDirY = (this.player.position.y - this.enemy.position.y) * this.enemy.velocity * frameTime / 1000;

            this.enemy.position.x += exactDirX;
            this.enemy.position.y += exactDirY;

        } else {
            const path = this.#findPath(map, startX, startY, targetX, targetY);

            if (path.length > 0) {
                const nextStep = path[0];
                const dirX = (nextStep.x - startX) * this.enemy.velocity * frameTime / 1000;
                const dirY = (nextStep.y - startY) * this.enemy.velocity * frameTime / 1000;

                if (this.#isValidMove(map, this.enemy.position.x + dirX, this.enemy.position.y)) {
                    this.enemy.position.x += dirX;
                }

                if (this.#isValidMove(map, this.enemy.position.x, this.enemy.position.y + dirY)) {
                    this.enemy.position.y += dirY;
                }
            }
        }
    }

    draw() {
        this.enemy.display.draw(ctx, {x: this.enemy.position.x * tileSize, y: this.enemy.position.y * tileSize}, {w: tileSize, h: tileSize}, {x: -tileSize / 2, y: -tileSize / 2});
    }

    #isValidMove(map, newX, newY) {
        const col = Math.floor(newX);
        const row = Math.floor(newY);

        return row >= 0 && row < map.length && col >= 0 && col < map[0].length && map[row][col] === 0;
    }

    #findPath(map, startX, startY, targetX, targetY) {
        const directions = [
            {x: 0, y: -1},
            {x: 1, y: 0},
            {x: 0, y: 1},
            {x: -1, y: 0}
        ];

        const queue = [{x: startX, y: startY, path: []}];
        const visited = new Set();
        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
            const current = queue.shift();
            const {x, y, path} = current;

            if (x === targetX && y === targetY) {
                return path;
            }

            for (const dir of directions) {
                const newX = x + dir.x;
                const newY = y + dir.y;

                if (this.#isValidMove(map, newX, newY) && !visited.has(`${newX},${newY}`)) {
                    visited.add(`${newX},${newY}`);
                    queue.push({
                        x: newX,
                        y: newY,
                        path: [...path, {x: newX, y: newY}]
                    });
                }
            }
        }

        return [];
    }

    checkCollision() {
        return this.#checkCollision(this.player, this.enemy);
    }

    #checkCollision(object1, object2) {
        const dx = object2.position.x - object1.position.x;
        const dy = object2.position.y - object1.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const combinedRadii = object1.radius + object2.radius;

        return distance < combinedRadii;
    }
}

class FriendController {

    constructor(player, friend) {
        this.player = player;
        this.friend = friend;
    }

    update(frameTime = .1) {
        this.friend.display.update(frameTime);
    }

    draw() {
        this.friend.display.draw(ctx, {x: this.friend.position.x * tileSize, y: this.friend.position.y * tileSize}, {w: tileSize, h: tileSize});
    }

    checkCollision() {
        return this.#checkCollision(this.player, this.friend);
    }

    #checkCollision(object1, object2) {
        const col = Math.floor(object1.position.x);
        const col2 = Math.floor(object2.position.x);
        const row = Math.floor(object1.position.y);
        const row2 = Math.floor(object2.position.y);

        return row === row2 && col === col2;
    }
}

class FlashController {

    lastPlayerX = 0;
    lastPlayerY = 0;
    boom = false;
    currBoomTime = 0;
    distanceTraveled = 0;

    constructor(player) {
        this.player = player;
        this.lastPlayerX = this.player.position.x;
        this.lastPlayerY = this.player.position.y;
    }

    update(frameTime = .1) {
        let currPlayerX = this.player.position.x;
        let currPlayerY = this.player.position.y;

        if (this.boom) {
            this.currBoomTime += frameTime;
            this.lastPlayerX = currPlayerX;
            this.lastPlayerY = currPlayerY;
            this.distanceTraveled = 0;

            if (this.currBoomTime >= 300) {
                this.boom = false;
                this.currBoomTime = 0;
            }

            return;
        }

        let deltaX = currPlayerX - this.lastPlayerX;
        let deltaY = currPlayerY - this.lastPlayerY;
        let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        this.distanceTraveled += distance;

        if (this.distanceTraveled >= 5) {
            this.boom = true;
        }

        this.lastPlayerX = currPlayerX;
        this.lastPlayerY = currPlayerY;
    }

    draw() {
        let radius = tileSize;
        if (this.boom) {
            radius = 600;
        }

        ctx.globalCompositeOperation = 'destination-out';
        const gradient = ctx.createRadialGradient(
            this.player.position.x * tileSize,
            this.player.position.y * tileSize,
            0,
            this.player.position.x * tileSize,
            this.player.position.y * tileSize,
            radius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
    }
}

class WorldController {

    constructor(world) {
        this.world = world;
    }

    draw() {
        this.world.draw();
    }
}

class AudioController {

    constructor(audio = {main: "assets/maintheme.wav", flash: "assets/flash.wav", dead: "assets/dead.wav", win: "assets/win.wav"}) {
        this.main = {play: false, audio: new Audio(audio.main)};
        this.main.audio.loop = true;
        this.main.audio.volume = .3;

        this.flash = {play: false, audio: new Audio(audio.flash)};
        this.flash.audio.volume = .1;

        this.dead = {play: false, audio: new Audio(audio.dead)};
        this.dead.audio.volume = .8;

        this.win = {play: false, audio: new Audio(audio.win)};
        this.win.audio.volume = .6;
    }

    playMain() {
        if (!this.main.play) {
            this.main.audio.play();
            this.main.play = true;
        }
    }

    playFlash() {
        if (!this.flash.play) {
            this.flash.audio.play();
            this.flash.play = true;
        }
    }

    stopFlash() {
        if (this.flash.play) {
            this.flash.play = false;
        }
    }

    playDead() {
        this.dead.audio.play();
    }

    playWin() {
        this.win.audio.play();
    }
}
