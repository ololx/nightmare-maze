const Status = Object.freeze({
    RUNNING: 'RUNNING',
    STOPPED: 'STOPPED'
});

class FpsCounter {

    #lastFpsUpdateTime = Date.now();
    #fpsUpdateIntervalMS = 1000;
    #currentFrames = 0;
    #fps = 0;
    #renderCallback;

    constructor(renderCallback = (fps) => {}) {
        this.#renderCallback = renderCallback;
    }

    reset() {
        this.#lastFpsUpdateTime = Date.now();
        this.#currentFrames = 0;
        this.#fps = 0;
    }

    inc() {
        const currentTime = Date.now();

        if (currentTime - this.#lastFpsUpdateTime >= this.#fpsUpdateIntervalMS) {
            this.#fps = this.#currentFrames;
            this.#currentFrames = 0;
            this.#lastFpsUpdateTime = currentTime;
            this.#renderCallback(this.#fps);
        }

        this.#currentFrames++;
    }
}

class GameController {

    processInput() {}

    processUpdate(elapsedTime) {}

    processRender() {}
}

class GameLoop {

    #gameController;
    #fpsCounter;
    #animationFrame;
    #status = Status.STOPPED;
    #previousTime;
    #targetFPS;
    #frameDuration;
    #lag = 0;

    constructor(fpsLimit = 1, gameController, fpsCounter = new FpsCounter()) {
        this.#targetFPS = fpsLimit;
        this.#frameDuration = 1000 / fpsLimit;
        this.#gameController = gameController;
        this.#fpsCounter = fpsCounter;
    }

    start() {
        this.#status = Status.RUNNING;
        this.#previousTime = Date.now();
        this.#loop();
    }

    stop() {
        this.#status = Status.STOPPED;
        cancelAnimationFrame(this.#animationFrame);
    }

    isActive() {
        return this.#status === Status.RUNNING;
    }

    #processInput() {
        this.#gameController.processInput();
    }

    #processUpdate(elapsedTime) {
        this.#gameController.processUpdate(elapsedTime);
    }

    #processRender() {
        this.#fpsCounter.inc();
        this.#gameController.processRender();
    }

    #loop() {
        if (!this.isActive()) {
            return;
        }

        const currentTime = Date.now();
        const elapsedTime = currentTime - this.#previousTime;

        if (elapsedTime >= this.#frameDuration) {
            this.#previousTime = currentTime - (elapsedTime % this.#frameDuration);
            this.#lag += elapsedTime;

            this.#processInput();

            while (this.#lag >= this.#frameDuration) {
                this.#processUpdate(this.#frameDuration);
                this.#lag -= this.#frameDuration;
            }

            this.#processRender();
        }

        this.#animationFrame = requestAnimationFrame(this.#loop.bind(this));
    }
}