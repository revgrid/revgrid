export class Animator {
    animateRequiredEventer: Animator.AnimateRequiredEventer;
    backgroundAnimateTimeIntervalChangedEventer: Animator.BackgroundAnimateTimeIntervalChangedEventer;

    private _animateRequired = false;
    private _nextAnimateAllowedTime = performance.now();
    private _animating = false;

    constructor(
        private _minimumAnimateTimeInterval: number,
        private _backgroundAnimateTimeInterval: number | undefined,
        readonly animateEventer: Animator.AnimateEventer,
    ) {
    }

    get minimumAnimateTimeInterval() { return this._minimumAnimateTimeInterval; }
    get backgroundAnimateTimeInterval() { return this._backgroundAnimateTimeInterval; }
    get animateRequired() { return this._animateRequired; }
    get animating() { return this._animating; }

    flagAnimateRequired() {
        this._animateRequired = true;
        this.animateRequiredEventer();
    }

    checkAnimate(now: DOMHighResTimeStamp): DOMHighResTimeStamp | undefined {
        if (!this._animateRequired) {
            return undefined;
        } else {
            if (now < this._nextAnimateAllowedTime) {
                return this._nextAnimateAllowedTime;
            } else {
                this.animate(now);
                return undefined;
            }
        }
    }

    setAnimateTimeIntervals(minimumAnimateTimeInterval: number, backgroundAnimateTimeInterval: number | undefined) {
        const oldBackgroundAnimateTimeInterval = this._backgroundAnimateTimeInterval;
        this._minimumAnimateTimeInterval = minimumAnimateTimeInterval;
        this._backgroundAnimateTimeInterval = backgroundAnimateTimeInterval;

        this.backgroundAnimateTimeIntervalChangedEventer(oldBackgroundAnimateTimeInterval);
    }

    private animate(now: number) {
        let animated = false;
        this._animating = true;
        try {
            animated = this.animateEventer();
        } catch (e) {
            console.error(e);
        } finally {
            this._animating = false;
        }

        if (animated) {
            this._animateRequired = false;
            this._nextAnimateAllowedTime = performance.now() + this._minimumAnimateTimeInterval;
        }
    }
}

export namespace Animator {
    export type AnimateEventer = (this: void) => boolean;
    export type AnimateRequiredEventer = (this: void) => void;
    export type BackgroundAnimateTimeIntervalChangedEventer = (this: void, oldBackgroundAnimateTimeInterval: number | undefined) => void;
}
