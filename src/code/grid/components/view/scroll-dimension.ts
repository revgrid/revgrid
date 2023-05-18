import { AssertError } from '../../lib/revgrid-error';
import { HorizontalVertical } from '../../lib/types';
import { CanvasEx } from '../canvas-ex/canvas-ex';

export abstract class ScrollDimension {
    changedEventer: ScrollDimension.ChangedEventer;
    computedEventer: ScrollDimension.ComputedEventer;
    scrollerTargettedViewportStartChangedEventer: ScrollDimension.ViewportStartChangedEventer;
    eventBehaviorTargettedViewportStartChangedEventer: ScrollDimension.ViewportStartChangedEventer;

    private _start: number | undefined;
    private _size: number | undefined;
    private _viewportSize: number | undefined;
    private _overflowed: boolean | undefined;

    private _valid = false;

    private _startScrollAnchorLimitIndex: number;
    private _startScrollAnchorLimitOffset: number;
    private _finishScrollAnchorLimitIndex: number;
    private _finishScrollAnchorLimitOffset: number;

    private _viewportStart: number | undefined;

    constructor(
        public readonly horizontalVertical: HorizontalVertical,
        protected readonly _canvasEx: CanvasEx,
    ) {

    }

    get valid() { return this._valid; }

    get exists() { return this._overflowed !== undefined; }

    get start() {
        this.ensureValidOutsideAnimationFrame();
        if (this._start === undefined) {
            throw new AssertError('SPDST60998');
        } else {
            return this._start;
        }
    }
    get size() {
        this.ensureValidOutsideAnimationFrame();
        if (this._size === undefined) {
            throw new AssertError('SPDSI60998');
        } else {
            return this._size;
        }
    }
    get finish() {
        this.ensureValidOutsideAnimationFrame();
        if (this._start === undefined || this._size === undefined) {
            throw new AssertError('SPDF60998');
        } else {
            return this._start + this._size - 1;
        }
    }
    get after() {
        this.ensureValidOutsideAnimationFrame();
        if (this._start === undefined || this._size === undefined) {
            throw new AssertError('SPDA60998');
        } else {
            return this._start + this._size;
        }
    }

    get viewportStart() {
        this.ensureValidOutsideAnimationFrame();
        return this._viewportStart;
    }

    get viewportSize() {
        this.ensureValidOutsideAnimationFrame();
        const viewportSize = this._viewportSize;
        if (viewportSize === undefined) {
            throw new AssertError('SPDVSI60998');
        } else {
            return viewportSize;
        }
    }
    get viewportFinish() {
        this.ensureValidOutsideAnimationFrame();
        const viewportStart = this._viewportStart;
        const viewportSize = this._viewportSize;
        if (viewportStart === undefined || viewportSize === undefined) {
            throw new AssertError('SPDVF60998');
        } else {
            return viewportStart + viewportSize - 1;
        }
    }

    get startScrollAnchorLimitIndex() {
        this.ensureValidOutsideAnimationFrame();
        return this._startScrollAnchorLimitIndex;
    }
    get startScrollAnchorLimitOffset() {
        this.ensureValidOutsideAnimationFrame();
        return this._startScrollAnchorLimitOffset;
    }
    get finishScrollAnchorLimitIndex() {
        this.ensureValidOutsideAnimationFrame();
        return this._finishScrollAnchorLimitIndex;
    }
    get finishScrollAnchorLimitOffset() {
        this.ensureValidOutsideAnimationFrame();
        return this._finishScrollAnchorLimitOffset;
    }

    get overflowed() {
        this.ensureValidOutsideAnimationFrame();
        return this._overflowed;
    }

    reset() {
        this._valid = false;
    }

    invalidate() {
        this._valid = false;
    }

    ensureValidOutsideAnimationFrame() {
        return this.ensureValid(false);
    }

    ensureValidInsideAnimationFrame() {
        return this.ensureValid(true);
    }

    setViewportStart(value: number | undefined, withinAnimationFrame: boolean) {
        if (value !== this._viewportStart) {
            this._viewportStart = value;
            if (withinAnimationFrame) {
                setTimeout(() => this.notifyViewportStartChanged(), 0);
            } else {
                this.notifyViewportStartChanged();
            }
        }
    }

    protected setDimensionValues(
        start: number | undefined,
        size: number | undefined,
        viewportSize: number | undefined,
        overflowed: boolean | undefined,
        anchorLimits: ScrollDimension.ScrollAnchorLimits
    ) {
        // set within animation frame
        this._start = start;
        this._size = size;
        this._viewportSize = viewportSize;
        this._overflowed = overflowed;

        this._startScrollAnchorLimitIndex = anchorLimits.startAnchorLimitIndex;
        this._startScrollAnchorLimitOffset = anchorLimits.startAnchorLimitOffset;
        this._finishScrollAnchorLimitIndex = anchorLimits.finishAnchorLimitIndex;
        this._finishScrollAnchorLimitOffset = anchorLimits.finishAnchorLimitOffset;
    }

    protected abstract compute(): void;

    private ensureValid(withinAnimationFrame: boolean) {
        if (this._valid) {
            return true;
        } else {
            this.compute();
            this._valid = true;
            const viewportStart = this.computedEventer(withinAnimationFrame);
            const viewportStartChanged = viewportStart !== this._viewportStart;
            this._viewportStart = viewportStart;
            if (withinAnimationFrame) {
                setTimeout(() => this.notifyChanged(viewportStartChanged), 0);
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

    export interface ScrollableSizeAndAnchorLimits {
        scrollableSize: number;
        overflowed: boolean;
        anchorLimits: ScrollAnchorLimits;
    }
}
