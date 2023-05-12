import { AssertError } from '../../lib/revgrid-error';
import { CanvasEx } from '../canvas-ex/canvas-ex';

export abstract class ScrollPlaneDimension {
    changedEventer: ScrollPlaneDimension.ChangedEventer;
    computedEventer: ScrollPlaneDimension.ComputedEventer;
    viewportStartChangedEventer: ScrollPlaneDimension.ViewportStartChangedEventer;


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
        protected readonly _canvasEx: CanvasEx,
    ) {

    }

    get valid() { return this._valid; }

    get exists() { return this._overflowed !== undefined; }

    get start() {
        this.ensureValid();
        if (this._start === undefined) {
            throw new AssertError('SPDST60998');
        } else {
            return this._start;
        }
    }
    get size() {
        this.ensureValid();
        if (this._size === undefined) {
            throw new AssertError('SPDSI60998');
        } else {
            return this._size;
        }
    }
    get finish() {
        this.ensureValid();
        if (this._start === undefined || this._size === undefined) {
            throw new AssertError('SPDF60998');
        } else {
            return this._start + this._size - 1;
        }
    }
    get after() {
        this.ensureValid();
        if (this._start === undefined || this._size === undefined) {
            throw new AssertError('SPDA60998');
        } else {
            return this._start + this._size;
        }
    }

    get viewportStart() {
        this.ensureValid();
        const viewportStart = this._viewportStart;
        if (viewportStart === undefined) {
            throw new AssertError('SPDVST60998');
        } else {
            return viewportStart;
        }
    }
    get viewportSize() {
        this.ensureValid();
        const viewportSize = this._viewportSize;
        if (viewportSize === undefined) {
            throw new AssertError('SPDVSI60998');
        } else {
            return viewportSize;
        }
    }
    get viewportFinish() {
        this.ensureValid();
        const viewportStart = this._viewportStart;
        const viewportSize = this._viewportSize;
        if (viewportStart === undefined || viewportSize === undefined) {
            throw new AssertError('SPDVF60998');
        } else {
            return viewportStart + viewportSize - 1;
        }
    }

    get startScrollAnchorLimitIndex() {
        this.ensureValid();
        return this._startScrollAnchorLimitIndex;
    }
    get startScrollAnchorLimitOffset() {
        this.ensureValid();
        return this._startScrollAnchorLimitOffset;
    }
    get finishScrollAnchorLimitIndex() {
        this.ensureValid();
        return this._finishScrollAnchorLimitIndex;
    }
    get finishScrollAnchorLimitOffset() {
        this.ensureValid();
        return this._finishScrollAnchorLimitOffset;
    }

    get overflowed() {
        this.ensureValid();
        return this._overflowed;
    }

    reset() {
        this._valid = false;
    }

    invalidate() {
        this._valid = false;
    }

    ensureValid() {
        if (this._valid) {
            return true;
        } else {
            this.compute();
            this._valid = true;
            this._viewportStart = this.computedEventer();
            this.changedEventer();
        }
    }

    setViewportStart(value: number | undefined) {
        if (value !== this._viewportStart) {
            this._viewportStart = value;
            setTimeout(() => this.viewportStartChangedEventer(), 0); // do in next tick as can be fired in animation frame
        }
    }

    protected setDimensionValues(
        start: number | undefined,
        size: number | undefined,
        viewportSize: number | undefined,
        overflowed: boolean | undefined,
        anchorLimits: ScrollPlaneDimension.ScrollAnchorLimits
    ) {
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
}

export namespace ScrollPlaneDimension {
    export type ChangedEventer = (this: void) => void
    export type ComputedEventer = (this: void) => number; // return Viewport Start
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
