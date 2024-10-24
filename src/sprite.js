class Sprite {

    constructor(image = new Image()) {
        this.image = image;
    }

    draw(context, position = {x: 0, y: 0}, scale = {w: 1, h: 1}, offset = {x: 0, y: 0}) {
        context.drawImage(
            this.image,
            0, 0,
            this.image.width, this.image.height,
            position.x + offset.x, position.y + offset.y,
            scale.w, scale.h
        );
    }
}

class Frame {

    constructor(col, row, duration) {
        this.col = col;
        this.row = row;
        this.duration = duration;
    }
}

class Animation {

    constructor(frames) {
        this.frames = frames;
        this.currentFrameIndex = 0;
        this.elapsedTime = 0.0;
    }

    update(deltaTime) {
        const currentFrame = this.frames[this.currentFrameIndex];
        this.elapsedTime += deltaTime;

        if (this.elapsedTime >= currentFrame.duration) {
            this.elapsedTime -= currentFrame.duration;
            this.currentFrameIndex = (this.currentFrameIndex + 1) % this.frames.length;
        }
    }

    getCurrentFrame() {
        return this.frames[this.currentFrameIndex];
    }
}

class AnimatedSprite extends Sprite {

    constructor(image, rows, cols, animations) {
        super(image);
        this.rows = rows;
        this.cols = cols;
        this.frameWidth = image.width / cols;
        this.frameHeight = image.height / rows;
        this.animations = animations;
        this.currentAnimation = animations["idle"];
    }

    switchAnimation(key) {
        if (this.animations[key]) {
            this.currentAnimation = this.animations[key];
        } else {
            console.error(`Animation ${key} does not exist`);
        }
    }

    update(deltaTime = 0) {
        if (this.currentAnimation) {
            this.currentAnimation.update(deltaTime);
        }
    }

    draw(context, position = {x: 0, y: 0}, scale = {w: 1, h: 1}, offset = {x: 0, y: 0}) {
        if (!this.currentAnimation) {
            return;
        }

        if (this.frameWidth === 0 || this.frameHeight === 0) {
            this.frameWidth = this.image.width / this.cols;
            this.frameHeight = this.image.height / this.rows;
        }

        const frame = this.currentAnimation.getCurrentFrame();
        let frameX = frame.col * this.frameWidth;
        let frameY = frame.row * this.frameHeight;

        context.drawImage(
            this.image,
            frameX, frameY,
            this.frameWidth, this.frameHeight,
            position.x + offset.x, position.y + offset.y,
            scale.w, scale.h
        );
    }
}
