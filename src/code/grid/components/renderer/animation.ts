import { AssertError } from '../../types-utils/revgrid-error';
import { Animator } from './animator';

export class Animation {
    private _animationFrameHandle: ReturnType<typeof requestAnimationFrame> | undefined;
    private _nextAnimateTimeoutHandle: ReturnType<typeof setTimeout> | undefined;

    private _animators: Animator[] = [];
    private _backgroundIntervaliserMap = new Map<number, Animation.BackgroundIntervaliser>();

    createAnimator(
        minimumAnimateTimeInterval: number,
        backgroundAnimateTimeInterval: number | undefined,
        animateEventer: Animator.AnimateEventer,
    ) {
        const animator = new Animator(minimumAnimateTimeInterval, backgroundAnimateTimeInterval, animateEventer);
        this._animators.push(animator);
        animator.animateRequiredEventer = () => this.requestAnimationFrame();
        animator.backgroundAnimateTimeIntervalChangedEventer = (oldInterval) => this.processAnimatorBackgroundAnimateTimeIntervalChanged(animator, oldInterval);

        if (backgroundAnimateTimeInterval !== undefined) {
            this.incrementBackgroundIntervaliserCount(backgroundAnimateTimeInterval);
        }

        return animator;
    }

    destroyAnimator(animator: Animator) {
        const animators = this._animators;
        const index = animators.indexOf(animator);
        if (index === -1) {
            throw new AssertError('ADAI28995');
        } else {
            const backgroundAnimateTimeInterval = animator.backgroundAnimateTimeInterval;
            if (backgroundAnimateTimeInterval !== undefined) {
                this.decrementBackgroundIntervaliserCount(backgroundAnimateTimeInterval);
            }

            animators.splice(index, 1);

            if (animators.length === 0) {
                if (this._animationFrameHandle !== undefined) {
                    cancelAnimationFrame(this._animationFrameHandle);
                    this._animationFrameHandle = undefined;
                }

                if (this._nextAnimateTimeoutHandle !== undefined) {
                    clearTimeout(this._nextAnimateTimeoutHandle);
                    this._nextAnimateTimeoutHandle = undefined;
                }
            }
        }
    }

    private requestAnimationFrame() {
        if (this._animationFrameHandle === undefined) {
            this._animationFrameHandle = requestAnimationFrame(
                (now) => this.frameCallback(now)
            );
        }
    }

    private frameCallback(now: DOMHighResTimeStamp) {
        this._animationFrameHandle = undefined;
        let nextAnimateTime: DOMHighResTimeStamp | undefined;
        for (const animator of this._animators) {
            now = performance.now();
            const animateRequiredAfterTime = animator.checkAnimate(now);
            if (animateRequiredAfterTime !== undefined) {
                if (nextAnimateTime === undefined) {
                    nextAnimateTime = animateRequiredAfterTime;
                } else {
                    if (animateRequiredAfterTime < nextAnimateTime) {
                        nextAnimateTime = animateRequiredAfterTime;
                    }
                }
            }
        }

        if (nextAnimateTime !== undefined) {
            now = performance.now();
            let timeout = nextAnimateTime - now;
            if (timeout < 0) {
                timeout = 0;
            }

            this._nextAnimateTimeoutHandle = setTimeout(() => {
                this._nextAnimateTimeoutHandle = undefined;
                this.requestAnimationFrame();
            }, timeout);
        }
    }

    private processAnimatorBackgroundAnimateTimeIntervalChanged(animator: Animator, oldInterval: number | undefined) {
        if (oldInterval !== undefined) {
            this.decrementBackgroundIntervaliserCount(oldInterval);
        }

        const newInterval = animator.backgroundAnimateTimeInterval;
        if (newInterval !== undefined) {
            this.decrementBackgroundIntervaliserCount(newInterval);
        }
    }

    private incrementBackgroundIntervaliserCount(backgroundAnimateTimeInterval: number) {
        let backgroundIntervaliser = this._backgroundIntervaliserMap.get(backgroundAnimateTimeInterval);
        if (backgroundIntervaliser !== undefined) {
            backgroundIntervaliser.count++;
        } else {
            backgroundIntervaliser = {
                interval: backgroundAnimateTimeInterval,
                count: 1,
                handle: setInterval(() => this.requestAnimationFrame(), backgroundAnimateTimeInterval),
            }
        }
}

    private decrementBackgroundIntervaliserCount(backgroundAnimateTimeInterval: number) {
        const backgroundIntervaliser = this._backgroundIntervaliserMap.get(backgroundAnimateTimeInterval);
        if (backgroundIntervaliser === undefined) {
            throw new AssertError('ADAB28995');
        } else {
            backgroundIntervaliser.count--;
            if (backgroundIntervaliser.count === 0) {
                clearInterval(backgroundIntervaliser.handle);
                this._backgroundIntervaliserMap.delete(backgroundAnimateTimeInterval);
            }
        }
    }
}

/** Controls initiation of painting of all grids with one animation frame */
export namespace Animation {
    export interface BackgroundIntervaliser {
        readonly interval: number;
        readonly handle: ReturnType<typeof setInterval>;
        count: number;
    }

    export const animation = new Animation();
}