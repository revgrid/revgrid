import { RevAssertError } from '../../../common/internal-api';
import { RevAnimator } from './animator';

export class RevAnimation {
    private _animationFrameHandle: ReturnType<typeof requestAnimationFrame> | undefined;
    private _nextAnimateTimeoutHandle: ReturnType<typeof setTimeout> | undefined;
    private _nextAnimateTime: DOMHighResTimeStamp | undefined;

    private _animators: RevAnimator[] = [];
    private _backgroundIntervaliserMap = new Map<number, RevAnimation.BackgroundIntervaliser>();

    createAnimator(
        minimumAnimateTimeInterval: number,
        backgroundAnimateTimeInterval: number | undefined,
        animateEventer: RevAnimator.AnimateEventer,
    ) {
        const animator = new RevAnimator(
            minimumAnimateTimeInterval,
            backgroundAnimateTimeInterval,
            animateEventer,
            () => { this.requestAnimationFrame(); },
            (atTime, nowTime) => { this.scheduleAnimationFrame(atTime, nowTime); },
            (changedAnimator, oldInterval) => { this.processAnimatorBackgroundAnimateTimeIntervalChanged(changedAnimator, oldInterval); },
        );
        this._animators.push(animator);

        if (backgroundAnimateTimeInterval !== undefined) {
            this.incrementBackgroundIntervaliserCount(backgroundAnimateTimeInterval);
        }

        return animator;
    }

    destroyAnimator(animator: RevAnimator) {
        const animators = this._animators;
        const index = animators.indexOf(animator);
        if (index === -1) {
            throw new RevAssertError('ADAI28995');
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
                    this._nextAnimateTime = undefined;
                }
            }
        }
    }

    private requestAnimationFrame() {
        if (this._animationFrameHandle === undefined) {
            this._animationFrameHandle = requestAnimationFrame(
                (now) => { this.frameCallback(now); }
            );
        }
    }

    private scheduleAnimationFrame(atTime: DOMHighResTimeStamp, nowTime: DOMHighResTimeStamp) {
        // atTime has to be greater than or equal to nowTime
        if (this._nextAnimateTime !== undefined) {
            if (atTime < this._nextAnimateTime) {
                clearTimeout(this._nextAnimateTimeoutHandle);
                this._nextAnimateTimeoutHandle = undefined;
                this._nextAnimateTime = undefined;
            }
        }

        if (this._nextAnimateTimeoutHandle === undefined) {
            const timeout = atTime - nowTime;
            this._nextAnimateTime = atTime;
            this._nextAnimateTimeoutHandle = setTimeout(() => {
                this._nextAnimateTimeoutHandle = undefined;
                this._nextAnimateTime = undefined;
                this.requestAnimationFrame();
            }, timeout);
        }
    }

    private frameCallback(beforeAnimateNow: DOMHighResTimeStamp) {
        this._animationFrameHandle = undefined;

        const animators = this._animators;
        const animatorCount =  animators.length;
        const nowAnimators = new Array<RevAnimator>(animatorCount);
        let nowAnimatorCount = 0;

        let nextAnimateTime: DOMHighResTimeStamp | undefined;
        beforeAnimateNow = performance.now();
        for (const animator of this._animators) {
            const animatorNextAnimateTime = animator.getNextAnimateTime(beforeAnimateNow);
            if (animatorNextAnimateTime !== undefined) {
                if (animatorNextAnimateTime <= beforeAnimateNow) {
                    nowAnimators[nowAnimatorCount++] = animator;
                } else {
                    if (nextAnimateTime === undefined) {
                        nextAnimateTime = animatorNextAnimateTime;
                    } else {
                        if (animatorNextAnimateTime < nextAnimateTime) {
                            nextAnimateTime = animatorNextAnimateTime;
                        }
                    }
                }
            }
        }

        if (nowAnimatorCount > 0) {
            for (let i = 0; i < nowAnimatorCount; i++) {
                nowAnimators[i].animate();
            }
        }

        if (nextAnimateTime !== undefined) {
            const afterAnimateTime = performance.now();
            if (nextAnimateTime < afterAnimateTime) {
                nextAnimateTime = afterAnimateTime;
            }

            this.scheduleAnimationFrame(nextAnimateTime, afterAnimateTime);
        }
    }

    private processAnimatorBackgroundAnimateTimeIntervalChanged(animator: RevAnimator, oldInterval: number | undefined) {
        if (oldInterval !== undefined) {
            this.decrementBackgroundIntervaliserCount(oldInterval);
        }

        const newInterval = animator.backgroundAnimateTimeInterval;

        if (newInterval !== undefined) {
            this.incrementBackgroundIntervaliserCount(newInterval);
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
                handle: setInterval(() => { this.requestAnimationFrame(); }, backgroundAnimateTimeInterval),
            }
        }
}

    private decrementBackgroundIntervaliserCount(backgroundAnimateTimeInterval: number) {
        const backgroundIntervaliser = this._backgroundIntervaliserMap.get(backgroundAnimateTimeInterval);
        if (backgroundIntervaliser === undefined) {
            throw new RevAssertError('ADAB28995');
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
export namespace RevAnimation {
    export interface BackgroundIntervaliser {
        readonly interval: number;
        readonly handle: ReturnType<typeof setInterval>;
        count: number;
    }

    export const animation = new RevAnimation();
}
