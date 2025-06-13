export class RevAnimator {
    private _animateRequired = false;
    private _nextAnimateAllowedTime = performance.now();
    private _animating = false;

    constructor(
        private _minimumAnimateTimeInterval: number,
        private _backgroundAnimateTimeInterval: number | undefined,
        private readonly _animateEventer: RevAnimator.AnimateEventer,
        private readonly _animateRequiredNowEventer: RevAnimator.AnimateRequiredNowEventer,
        private readonly _animateRequiredAtEventer: RevAnimator.AnimateRequiredAtEventer,
        private readonly _backgroundAnimateTimeIntervalChangedEventer: RevAnimator.BackgroundAnimateTimeIntervalChangedEventer,
    ) {
    }

    get minimumAnimateTimeInterval() { return this._minimumAnimateTimeInterval; }
    get backgroundAnimateTimeInterval() { return this._backgroundAnimateTimeInterval; }
    get animateRequired() { return this._animateRequired; }
    get animating() { return this._animating; }

    flagAnimateRequired() {
        this._animateRequired = true;
        const now = performance.now();
        if (now >= this._nextAnimateAllowedTime) {
            this._animateRequiredNowEventer(now);
        } else {
            this._animateRequiredAtEventer(this._nextAnimateAllowedTime, now);
        }
    }

    makeRequiredAnimateImmediate() {
        if (this._animateRequired) {
            const now = performance.now();
            this._nextAnimateAllowedTime = now;
            this._animateRequiredNowEventer(now);
        }
    }

    getNextAnimateTime(now: DOMHighResTimeStamp): DOMHighResTimeStamp | undefined {
        if (!this._animateRequired) {
            return undefined;
        } else {
            return this._nextAnimateAllowedTime;
        }
    }

    animate() {
        this._animating = true;
        try {
            this._animateEventer();
        } catch (e) {
            console.error(e);
        } finally {
            this._animating = false;
        }

        this._animateRequired = false;
        this._nextAnimateAllowedTime = performance.now() + this._minimumAnimateTimeInterval;
    }

    setAnimateTimeIntervals(minimumAnimateTimeInterval: number, backgroundAnimateTimeInterval: number | undefined) {
        const oldBackgroundAnimateTimeInterval = this._backgroundAnimateTimeInterval;
        this._minimumAnimateTimeInterval = minimumAnimateTimeInterval;
        this._backgroundAnimateTimeInterval = backgroundAnimateTimeInterval;

        this._backgroundAnimateTimeIntervalChangedEventer(this, oldBackgroundAnimateTimeInterval);
    }
}

export namespace RevAnimator {
    export type AnimateEventer = (this: void) => void;
    export type AnimateRequiredNowEventer = (this: void, now: DOMHighResTimeStamp) => void;
    export type AnimateRequiredAtEventer = (this: void, atTime: DOMHighResTimeStamp, nowTime: DOMHighResTimeStamp) => void;
    export type BackgroundAnimateTimeIntervalChangedEventer = (this: void, animator: RevAnimator, oldBackgroundAnimateTimeInterval: number | undefined) => void;
}
