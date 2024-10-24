class InputEventTracker {

    constructor() {
        this.trackedEvents = {};
    }

    isEventTracked(inputEventKey) {
        return !!this.trackedEvents[inputEventKey];
    }
}

class KeyboardEventTracker extends InputEventTracker {

    constructor(trackedItem) {
        super();

        trackedItem.addEventListener('keydown', (event) => this.onKeyDown(event));
        trackedItem.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    onKeyDown(event) {
        this.trackedEvents[event.key] = true;
    }

    onKeyUp(event) {
        this.trackedEvents[event.key] = false;
    }

    getTrackedKeyEvents() {
        return Object.keys(this.trackedEvents).filter(key => this.trackedEvents[key]);
    }
}
