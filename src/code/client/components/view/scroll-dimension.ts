import { RevAssertError } from '../../../common';
import { RevBehavioredGridSettings, RevGridSettings } from '../../settings';
import { RevCanvas } from '../canvas/canvas';

/**
 * Base class to track viewport size, position and scrollability in scroll dimension (horizontal or vertical)
 * @public
 * @see [View Layout Component 🗎](../../../../../Architecture/Client/Components/View_Layout/)
 */
export abstract class RevScrollDimension<BGS extends RevBehavioredGridSettings> {
    /** @internal */
    changedEventer: RevScrollDimension.ChangedEventer;
    /** @internal */
    computedEventer: RevScrollDimension.ComputedEventer;
    /** @internal */
    scrollerTargettedViewportStartChangedEventer: RevScrollDimension.ViewportStartChangedEventer;
    /** @internal */
    eventBehaviorTargettedViewportStartChangedEventer: RevScrollDimension.ViewportStartChangedEventer;

    private _start = RevScrollDimension.resetStart;
    private _size = RevScrollDimension.resetSize;
    private _viewportSize = RevScrollDimension.resetViewportSize;
    private _viewportSizeExactMultiple = RevScrollDimension.resetViewportSizeExactMultiple;
    private _viewportCoverageExtent = RevScrollDimension.resetViewportCoverageExtent;
    private _startScrollAnchorLimitIndex = RevScrollDimension.invalidScrollAnchorIndex;
    private _startScrollAnchorLimitOffset = RevScrollDimension.invalidScrollAnchorOffset;
    private _finishScrollAnchorLimitIndex = RevScrollDimension.invalidScrollAnchorIndex;
    private _finishScrollAnchorLimitOffset = RevScrollDimension.invalidScrollAnchorOffset;

    private _viewportStart: number | undefined = RevScrollDimension.resetViewportStart;

    private _computed = RevScrollDimension.resetComputed;

    private _scrollable: boolean;

    /** @internal */
    constructor(
        /** Specifies whether is is the Horizontal or Vertical dimension */
        public readonly horizontalVertical: RevScrollDimension.AxisId,
        /** @internal */
        protected readonly _gridSettings: RevGridSettings,
        /** @internal */
        protected readonly _canvas: RevCanvas<BGS>,
    ) {
        this.updateScrollable();
    }

    /** Start of scrollable range in dimension */
    get start() {
        this.ensureComputedOutsideAnimationFrame();
        return this._start;
    }
    /** Size of scrollable range in dimension */
    get size() {
        this.ensureComputedOutsideAnimationFrame();
        return this._size;
    }
    /** Finish of scrollable range in dimension */
    get finish() {
        this.ensureComputedOutsideAnimationFrame();
        return this._start + this._size - 1;
    }
    /** Position in dimension after scrollable range finish */
    get after() {
        this.ensureComputedOutsideAnimationFrame();
        return this._start + this._size;
    }

    /** Start of scroll viewport in dimension */
    get viewportStart() {
        this.ensureComputedOutsideAnimationFrame();
        return this._viewportStart;
    }

    /** Size of scroll viewport in dimension */
    get viewportSize() {
        this.ensureComputedOutsideAnimationFrame();
        const viewportSize = this._viewportSize;
        return viewportSize;
    }

    /**
     * Indicates whether viewport size is an exact multiple of the respective row or column size.
     * If `true`, no partial respective row or columns will be rendered.
     */
    get viewportSizeExactMultiple() { return this._viewportSizeExactMultiple; }

    /** Finish of scroll viewport in dimension */
    get viewportFinish() {
        this.ensureComputedOutsideAnimationFrame();
        const viewportStart = this._viewportStart;
        if (viewportStart === undefined) {
            throw new RevAssertError('SPDVF60998');
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

    /**
     * Indicates the extent to which the viewport covers the scrollable range.
     * @returns One of:
     * * Viewport does not exist (None)
     * * Viewport is smaller than the scrollable range (Partial)
     * * Viewport is covers the scrollable range (Full)
     */
    get viewportCoverageExtent() {
        this.ensureComputedOutsideAnimationFrame();
        return this._viewportCoverageExtent;
    }

    /**
     * Indicates whether scrolling is possible.
     * `true` if the viewport exists and is smaller than the scrollable range
     */
    get scrollable() {
        this.ensureComputedOutsideAnimationFrame();
        // return this._viewportSize > 0 && this._overflowed;
        return this._scrollable;
    }

    /** @internal */
    reset() {
        this._start = RevScrollDimension.resetStart;
        this._size = RevScrollDimension.resetSize;
        this._viewportSize = RevScrollDimension.resetViewportSize;
        this._viewportSizeExactMultiple = RevScrollDimension.resetViewportSizeExactMultiple;
        this._viewportCoverageExtent = RevScrollDimension.resetViewportCoverageExtent;
        this._startScrollAnchorLimitIndex = RevScrollDimension.invalidScrollAnchorIndex;
        this._startScrollAnchorLimitOffset = RevScrollDimension.invalidScrollAnchorOffset;
        this._finishScrollAnchorLimitIndex = RevScrollDimension.invalidScrollAnchorIndex;
        this._finishScrollAnchorLimitOffset = RevScrollDimension.invalidScrollAnchorOffset;
        this._viewportStart = RevScrollDimension.resetViewportStart;
        this._computed = RevScrollDimension.resetComputed;

        this.updateScrollable();
    }

    /** @internal */
    invalidate() {
        this._computed = false;
    }

    /** @internal */
    ensureComputedOutsideAnimationFrame() {
        return this.ensureComputed(false);
    }

    /** @internal */
    ensureComputedInsideAnimationFrame() {
        return this.ensureComputed(true);
    }

    /** @internal */
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

    /** @internal */
    calculateLimitedScrollAnchorIfRequired(index: number, offset: number, gridRightAlignedPossible: boolean): RevScrollDimension.Anchor | undefined {
        // only called directly after scroll dimension computed so will not trigger another compute
        if (this._startScrollAnchorLimitIndex === RevScrollDimension.invalidScrollAnchorIndex) {
            if (index === RevScrollDimension.invalidScrollAnchorIndex) {
                return undefined;
            } else {
                return RevScrollDimension.invalidAnchor;
            }
        } else {
            if (this.viewportCoverageExtent !== RevScrollDimension.ViewportCoverageExtent.Full) {
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
    }

    isScrollAnchorWithinStartLimit(index: number, offset: number) {
        const startScrollAnchorLimitIndex = this.startScrollAnchorLimitIndex;
        if (startScrollAnchorLimitIndex === RevScrollDimension.invalidScrollAnchorIndex) {
            throw new RevAssertError('SDISAWSL50215', index.toString());
        } else {
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
    }

    isScrollAnchorWithinFinishLimit(index: number, offset: number): boolean {
        const finishScrollAnchorLimitIndex = this.finishScrollAnchorLimitIndex;
        if (finishScrollAnchorLimitIndex === RevScrollDimension.invalidScrollAnchorIndex) {
            throw new RevAssertError('SDISAWFL50215', index.toString());
        } else {
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
    }

    /** @internal */
    calculateLimitedScrollAnchor(index: number, offset: number): RevScrollDimension.Anchor {
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

    /** @internal */
    protected setComputedValues(
        start: number,
        size: number,
        viewportSize: number,
        viewportSizeExactMultiple: boolean,
        viewportCoverageExtent: RevScrollDimension.ViewportCoverageExtent,
        startAnchorLimit: RevScrollDimension.Anchor,
        finishAnchorLimit: RevScrollDimension.Anchor,
    ) {
        // set within animation frame
        this._start = start;
        this._size = size;
        this._viewportSize = viewportSize;
        this._viewportSizeExactMultiple = viewportSizeExactMultiple;
        this._viewportCoverageExtent = viewportCoverageExtent;

        this._startScrollAnchorLimitIndex = startAnchorLimit.index;
        this._startScrollAnchorLimitOffset = startAnchorLimit.offset;
        this._finishScrollAnchorLimitIndex = finishAnchorLimit.index;
        this._finishScrollAnchorLimitOffset = finishAnchorLimit.offset;

        this.updateScrollable();
    }

    /** @internal */
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

    /** @internal */
    private updateScrollable() {
        this._scrollable = this._viewportCoverageExtent === RevScrollDimension.ViewportCoverageExtent.Partial && this._startScrollAnchorLimitIndex >= 0;
    }

    /** @internal */
    private notifyChanged(viewportStartChanged: boolean) {
        this.changedEventer();
        if (viewportStartChanged) {
            this.notifyViewportStartChanged();
        }
    }

    /** @internal */
    private notifyViewportStartChanged() {
        this.scrollerTargettedViewportStartChangedEventer();
        this.eventBehaviorTargettedViewportStartChangedEventer();
    }

    /** @internal */
    protected abstract compute(): void;
}

/**
 * @public
 */
export namespace RevScrollDimension {
    export type ChangedEventer = (this: void) => void
    export type ComputedEventer = (this: void, withinAnimationFrame: boolean) => number | undefined; // return Viewport Start
    export type ViewportStartChangedEventer = (this: void) => void;

    export enum ViewportCoverageExtent {
        /** Viewport does not have any size (does not exist) (Scrolling not active) */
        None,
        /** Viewport does not cover all of Scrollable range (Scrolling active) */
        Partial,
        /** Viewport covers all of Scrollable range (Scrolling not active) */
        Full,
    }

    /** @public */
    export const enum AxisId {
        horizontal,
        vertical,
    }

    export type Axis = keyof typeof AxisId;

    export interface Anchor {
        /**Index of column/row */
        readonly index: number;
        /**number of pixels anchor is offset in current column/row */
        readonly offset: number;
    }

    export interface AnchorLimits {
        readonly start: Anchor;
        readonly finish: Anchor;
    }

    export interface ScrollSizeAndAnchor {
        readonly scrollSize: number;
        readonly anchor: Anchor;
    }

    export interface ScrollSizeAndAnchorLimits {
        readonly scrollSize: number;
        readonly anchorLimits: AnchorLimits;
    }

    export const invalidScrollAnchorIndex = -1;
    export const invalidScrollAnchorOffset = 0;

    export const resetStart = 0;
    export const resetSize = 0;
    export const resetViewportSize = 0;
    export const resetViewportSizeExactMultiple = true;
    export const resetViewportCoverageExtent = ViewportCoverageExtent.None;
    export const resetComputed = false;
    export const resetViewportStart = undefined;

    export const invalidAnchor: Anchor = {
        index: invalidScrollAnchorIndex,
        offset: invalidScrollAnchorOffset,
    } as const;
}
