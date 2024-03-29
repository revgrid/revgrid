import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { AssertError } from '../../types-utils/revgrid-error';
import { Canvas } from '../canvas/canvas';

export abstract class ScrollDimension<BGS extends BehavioredGridSettings> {
    changedEventer: ScrollDimension.ChangedEventer;
    computedEventer: ScrollDimension.ComputedEventer;
    scrollerTargettedViewportStartChangedEventer: ScrollDimension.ViewportStartChangedEventer;
    eventBehaviorTargettedViewportStartChangedEventer: ScrollDimension.ViewportStartChangedEventer;

    private _start = ScrollDimension.resetStart;
    private _size = ScrollDimension.resetSize;
    private _viewportSize = ScrollDimension.resetViewportSize;
    private _viewportSizeExactMultiple = ScrollDimension.resetViewportSizeExactMultiple;
    private _overflowed = ScrollDimension.resetOverflowed;

    private _startScrollAnchorLimitIndex = ScrollDimension.resetStartScrollAnchorLimitIndex;
    private _startScrollAnchorLimitOffset = ScrollDimension.resetStartScrollAnchorLimitOffset;
    private _finishScrollAnchorLimitIndex = ScrollDimension.resetFinishScrollAnchorLimitIndex;
    private _finishScrollAnchorLimitOffset = ScrollDimension.resetFinishScrollAnchorLimitOffset;

    private _viewportStart: number | undefined = ScrollDimension.resetViewportStart;

    private _computed = ScrollDimension.resetComputed;

    constructor(
        public readonly horizontalVertical: ScrollDimension.AxisEnum,
        protected readonly _gridSettings: GridSettings,
        protected readonly _canvas: Canvas<BGS>,
    ) {

    }

    get start() {
        this.ensureComputedOutsideAnimationFrame();
        return this._start;
    }
    get size() {
        this.ensureComputedOutsideAnimationFrame();
        return this._size;
    }
    get finish() {
        this.ensureComputedOutsideAnimationFrame();
        return this._start + this._size - 1;
    }
    get after() {
        this.ensureComputedOutsideAnimationFrame();
        return this._start + this._size;
    }

    get viewportStart() {
        this.ensureComputedOutsideAnimationFrame();
        return this._viewportStart;
    }

    get viewportSize() {
        this.ensureComputedOutsideAnimationFrame();
        const viewportSize = this._viewportSize;
        return viewportSize;
    }

    get viewportSizeExactMultiple() { return this._viewportSizeExactMultiple; }

    get viewportFinish() {
        this.ensureComputedOutsideAnimationFrame();
        const viewportStart = this._viewportStart;
        if (viewportStart === undefined) {
            throw new AssertError('SPDVF60998');
        } else {
            return viewportStart + this._viewportSize - 1;
        }
    }

    get startScrollAnchorLimitIndex() {
        this.ensureComputedOutsideAnimationFrame();
        return this._startScrollAnchorLimitIndex;
    }
    get startScrollAnchorLimitOffset() {
        this.ensureComputedOutsideAnimationFrame();
        return this._startScrollAnchorLimitOffset;
    }
    get finishScrollAnchorLimitIndex() {
        this.ensureComputedOutsideAnimationFrame();
        return this._finishScrollAnchorLimitIndex;
    }
    get finishScrollAnchorLimitOffset() {
        this.ensureComputedOutsideAnimationFrame();
        return this._finishScrollAnchorLimitOffset;
    }

    get overflowed() {
        this.ensureComputedOutsideAnimationFrame();
        return this._overflowed;
    }

    get scrollable() {
        this.ensureComputedOutsideAnimationFrame();
        return this._viewportSize > 0 && this._overflowed;
    }

    reset() {
        this._start = ScrollDimension.resetStart;
        this._size = ScrollDimension.resetSize;
        this._viewportSize = ScrollDimension.resetViewportSize;
        this._viewportSizeExactMultiple = ScrollDimension.resetViewportSizeExactMultiple;
        this._overflowed = ScrollDimension.resetOverflowed;
        this._startScrollAnchorLimitIndex = ScrollDimension.resetStartScrollAnchorLimitIndex;
        this._startScrollAnchorLimitOffset = ScrollDimension.resetStartScrollAnchorLimitOffset;
        this._finishScrollAnchorLimitIndex = ScrollDimension.resetFinishScrollAnchorLimitIndex;
        this._finishScrollAnchorLimitOffset = ScrollDimension.resetFinishScrollAnchorLimitOffset;
        this._viewportStart = ScrollDimension.resetViewportStart;
        this._computed = ScrollDimension.resetComputed;
    }

    invalidate() {
        this._computed = false;
    }

    ensureComputedOutsideAnimationFrame() {
        return this.ensureComputed(false);
    }

    ensureComputedInsideAnimationFrame() {
        return this.ensureComputed(true);
    }

    setViewportStart(value: number | undefined, withinAnimationFrame: boolean) {
        if (value !== this._viewportStart) {
            this._viewportStart = value;
            if (withinAnimationFrame) {
                setTimeout(() => { this.notifyViewportStartChanged(); }, 0);
            } else {
                this.notifyViewportStartChanged();
            }
        }
    }

    calculateLimitedScrollAnchorIfRequired(index: number, offset: number, gridRightAlignedPossible: boolean): ScrollDimension.Anchor | undefined {
        // only called directly after scroll dimension computed so will not trigger another compute
        if (this.overflowed) {
            if (!this.isScrollAnchorWithinStartLimit(index, offset)) {
                return {
                    index: this._startScrollAnchorLimitIndex,
                    offset: this._startScrollAnchorLimitOffset,
                };
            } else {
                if (!this.isScrollAnchorWithinFinishLimit(index, offset)) {
                    return {
                        index: this._finishScrollAnchorLimitIndex,
                        offset: this._finishScrollAnchorLimitOffset,
                    };
                } else {
                    return undefined;
                }
            }
        } else {
            if (gridRightAlignedPossible && this._gridSettings.gridRightAligned) {
                const finishScrollAnchorLimitIndex = this._finishScrollAnchorLimitIndex;
                const finishScrollAnchorLimitOffset = this._finishScrollAnchorLimitOffset;
                if (index !== finishScrollAnchorLimitIndex || offset !== finishScrollAnchorLimitOffset) {
                    return {
                        index: finishScrollAnchorLimitIndex,
                        offset: finishScrollAnchorLimitOffset
                    };
                } else {
                    return undefined;
                }
            } else {
                const startScrollAnchorLimitIndex = this._startScrollAnchorLimitIndex;
                const startScrollAnchorLimitOffset = this._startScrollAnchorLimitOffset;
                if (index !== startScrollAnchorLimitIndex || offset !== startScrollAnchorLimitOffset) {
                    return {
                        index: startScrollAnchorLimitIndex,
                        offset: startScrollAnchorLimitOffset
                    };
                } else {
                    return undefined;
                }
            }
        }
    }

    isScrollAnchorWithinStartLimit(index: number, offset: number) {
        const startScrollAnchorLimitIndex = this.startScrollAnchorLimitIndex;
        if (index > startScrollAnchorLimitIndex) {
            return true;
        } else {
            if (index < startScrollAnchorLimitIndex) {
                return false;
            } else {
                if (this._gridSettings.gridRightAligned) {
                    return offset <= this.startScrollAnchorLimitOffset;
                } else {
                    return offset >= this.startScrollAnchorLimitOffset;
                }
            }
        }
    }

    isScrollAnchorWithinFinishLimit(index: number, offset: number) {
        const finishScrollAnchorLimitIndex = this.finishScrollAnchorLimitIndex;
        if (index < finishScrollAnchorLimitIndex) {
            return true;
        } else {
            if (index > finishScrollAnchorLimitIndex) {
                return false;
            } else {
                if (this._gridSettings.gridRightAligned) {
                    return offset >= this.finishScrollAnchorLimitOffset;
                } else {
                    return offset <= this.finishScrollAnchorLimitOffset;
                }
            }
        }
    }

    calculateLimitedScrollAnchor(index: number, offset: number): ScrollDimension.Anchor {
        if (!this.isScrollAnchorWithinStartLimit(index, offset)) {
            index = this.startScrollAnchorLimitIndex;
            offset = this.startScrollAnchorLimitOffset;
        } else {
            if (!this.isScrollAnchorWithinFinishLimit(index, offset)) {
                index = this.finishScrollAnchorLimitIndex;
                offset = this.finishScrollAnchorLimitOffset;
            }
        }

        return {
            index,
            offset
        };
    }

    protected setComputedValues(
        start: number,
        size: number,
        viewportSize: number,
        viewportSizeExactMultiple: boolean,
        overflowed: boolean,
        anchorLimits: ScrollDimension.ScrollAnchorLimits
    ) {
        // set within animation frame
        this._start = start;
        this._size = size;
        this._viewportSize = viewportSize;
        this._viewportSizeExactMultiple = viewportSizeExactMultiple;
        this._overflowed = overflowed;

        this._startScrollAnchorLimitIndex = anchorLimits.startAnchorLimitIndex;
        this._startScrollAnchorLimitOffset = anchorLimits.startAnchorLimitOffset;
        this._finishScrollAnchorLimitIndex = anchorLimits.finishAnchorLimitIndex;
        this._finishScrollAnchorLimitOffset = anchorLimits.finishAnchorLimitOffset;
    }

    protected abstract compute(): void;

    private ensureComputed(withinAnimationFrame: boolean) {
        if (this._computed) {
            return true;
        } else {
            this.compute();
            this._computed = true;
            const viewportStart = this.computedEventer(withinAnimationFrame);
            const viewportStartChanged = viewportStart !== this._viewportStart;
            this._viewportStart = viewportStart;
            if (withinAnimationFrame) {
                setTimeout(() => { this.notifyChanged(viewportStartChanged); }, 0);
            } else {
                this.notifyChanged(viewportStartChanged);
            }
            return false;
        }
    }

    private notifyChanged(viewportStartChanged: boolean) {
        this.changedEventer();
        if (viewportStartChanged) {
            this.notifyViewportStartChanged();
        }
    }

    private notifyViewportStartChanged() {
        this.scrollerTargettedViewportStartChangedEventer();
        this.eventBehaviorTargettedViewportStartChangedEventer();
    }
}

export namespace ScrollDimension {
    export type ChangedEventer = (this: void) => void
    export type ComputedEventer = (this: void, withinAnimationFrame: boolean) => number | undefined; // return Viewport Start
    export type ViewportStartChangedEventer = (this: void) => void;

    /** @public */
    export const enum AxisEnum {
        horizontal,
        vertical,
    }

    export type Axis = keyof typeof AxisEnum;

    export interface Anchor {
        index: number; // Index of column/row
        offset: number; // number of pixels anchor is offset in current column/row
    }

    export interface ScrollAnchorLimits {
        startAnchorLimitIndex: number;
        startAnchorLimitOffset: number;
        finishAnchorLimitIndex: number;
        finishAnchorLimitOffset: number;
    }

    export interface ScrollSizeAndAnchorLimits {
        scrollSize: number;
        overflowed: boolean;
        anchorLimits: ScrollAnchorLimits;
    }

    export const resetStart = 0;
    export const resetSize = 0;
    export const resetViewportSize = 0;
    export const resetViewportSizeExactMultiple = true;
    export const resetOverflowed = false;
    export const resetComputed = true;
    export const resetStartScrollAnchorLimitIndex = 0;
    export const resetStartScrollAnchorLimitOffset = 0;
    export const resetFinishScrollAnchorLimitIndex = 0;
    export const resetFinishScrollAnchorLimitOffset = 0;
    export const resetViewportStart = undefined;
}
