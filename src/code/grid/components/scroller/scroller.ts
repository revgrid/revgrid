import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { CssTypes } from '../../types-utils/css-types';
import { AssertError, UnreachableCaseError } from '../../types-utils/revgrid-error';
import { RevgridObject } from '../../types-utils/revgrid-object';
import { SizeUnitEnum } from '../../types-utils/size-unit';
import { SizeWithUnit } from '../../types-utils/size-with-unit';
import { numberToPixels } from '../../types-utils/utils';
import { Canvas } from '../canvas/canvas';
import { ScrollDimension } from '../view/scroll-dimension';
import { ViewLayout } from '../view/view-layout';

// Following is the sole style requirement for bar and thumb elements.
// Maintained in code so not dependent being in stylesheet.
// const BAR_STYLE = 'position: absolute;';

/** @public */
export class Scroller<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> implements RevgridObject {
    readonly bar: HTMLDivElement;
    readonly barCssClass: string;
    readonly axisBarCssClass: string;
    readonly thumbCssClass: string;

    /** @internal */
    actionEventer: Scroller.ActionEventer;
    /** @internal */
    wheelEventer: Scroller.WheelEventer;
    /** @internal */
    visibilityChangedEventer: Scroller.VisibilityChangedEventer;

    /**
     * @summary The generated scrollbar thumb element.
     * @desc The thumb element's parent element is always the {@link Scroller#bar|bar} element.
     *
     * This property is typically referenced internally only. The size and position of the thumb element is maintained by `_calcThumb()`.
     * @internal
     */
    private _thumb: HTMLDivElement;
    /**
     * @readonly
     * @summary <u>O</u>rientation <u>h</u>ash for this scrollbar.
     * @desc Set by the `orientation` setter to either the vertical or the horizontal orientation hash. The property should always be synchronized with `orientation`; do not update directly!
     *
     * This object is used internally to access scrollbars' DOM element properties in a generalized way without needing to constantly query the scrollbar orientation. For example, instead of explicitly coding `this.bar.top` for a vertical scrollbar and `this.bar.left` for a horizontal scrollbar, simply code `this.bar[this.oh.leading]` instead.
     * @internal
     */
    private readonly _axisProperties: AxisProperties;

    /**
     * @summary Maximum offset of thumb's leading edge.
     * @desc This is the pixel offset within the scrollbar of the thumb when it is at its maximum position at the extreme end of its range.
     *
     * This value takes into account the newly calculated size of the thumb element (including its margins) and the inner size of the scrollbar (the thumb's containing element, including _its_ margins).
     *
     * NOTE: Scrollbar padding is not taken into account and assumed to be 0 in the current implementation and is assumed to be `0`; use thumb margins in place of scrollbar padding.
     * @internal
     */
    private _thumbMax: number;
    /** @internal */
    private _thumbMarginLeading: number;
    /** @internal */
    private _pinOffset: number;

    /** @internal */
    private _pointerOverBar = false;
    /** @internal */
    private _pointerOverThumb = false;
    /** @internal */
    private _temporaryThumbFullVisibilityTimePeriod: number | undefined; // milliseconds
    /** @internal */
    private _temporaryThumbFullVisibilityTimeoutId: ReturnType<typeof setTimeout> | undefined;
    /** @internal */
    private _pointerScrollingState = Scroller.PointerScrollingState.Inactive;
    /** @internal */
    private _viewLayoutTrackingActive = false;
    /** @internal */
    private _thumbVisibilityState = ThumbVisibilityState.Reduced;
    /** @internal */
    private readonly _settingsChangedListener = () => { this.applySettings(); };
    /** @internal */
    private readonly _barWheelListener = (event: WheelEvent) => { this.handleBarWheelEvent(event) };
    /** @internal */
    private readonly _barClickListener = (event: MouseEvent) => { this.handleBarClickEvent(event); };
    /** @internal */
    private readonly _thumbClickListener = (event: MouseEvent) => { this.handleThumbClickEvent(event); };
    /** @internal */
    private readonly _thumbPointerEnterListener = () => { this.handleThumbPointerEnterEvent(); };
    /** @internal */
    private readonly _thumbPointerLeaveListener = () => { this.handleThumbPointerLeaveEvent(); };
    /** @internal */
    private readonly _thumbTransitionEndListener = () => { this.handleThumbTransitionEndEvent(); };
    /** @internal */
    private readonly _barPointerEnterListener = () => { this.handleBarPointerEnterEvent(); };
    /** @internal */
    private readonly _barPointerLeaveListener = () => { this.handleBarPointerLeaveEvent(); };
    /** @internal */
    private readonly _barPointerDownListener = (event: PointerEvent) => { this.handleBarPointerDownEvent(event); };
    /** @internal */
    private _barPointerMoveListener: Scroller.PointerEventListener | undefined;
    /** @internal */
    private _barPointerUpListener: Scroller.PointerEventListener | undefined;
    /** @internal */
    private _barPointerCancelListener: Scroller.PointerEventListener | undefined;
    /** @internal */
    private _barPointerCaptured = false;

    /**
     * @summary Create a scrollbar object.
     * @desc Creating a scrollbar is a three-step process:
     *
     * 1. Instantiate the scrollbar object by calling this constructor function. Upon instantiation, the DOM element for the scrollbar (with a single child element for the scrollbar "thumb") is created but is not insert it into the DOM.
     * 2. After instantiation, it is the caller's responsibility to insert the scrollbar, {@link Scroller#bar|this.bar}, into the DOM.
     * 3. After insertion, the caller must call {@link Scroller#resize|resize()} at least once to size and position the scrollbar and its thumb. After that, `resize()` should also be called repeatedly on resize events (as the content element is being resized).
     *
     * Suggested configurations:
     * * _**Unbound**_<br/>
     * The scrollbar serves merely as a simple range (slider) control. Omit both `options.onchange` and `options.content`.
     * * _**Bound to virtual content element**_<br/>
     * Virtual content is projected into the element using a custom event handler supplied by the programmer in `options.onchange`. A typical use case would be to handle scrolling of the virtual content. Other use cases include data transformations, graphics transformations, _etc._
     * * _**Bound to real content**_<br/>
     * Set `options.content` to the "real" content element but omit `options.onchange`. This will cause the scrollbar to use the built-in event handler (`this.scrollRealContent`) which implements smooth scrolling of the content element within the container.
     *
     * @param options - Options object. See the type definition for member details.
     * @internal
     */
    constructor(
        readonly revgridId: string,
        readonly internalParent: RevgridObject,
        /** @internal */
        private readonly _gridSettings: BGS,
        /** @internal */
        private readonly _hostElement: HTMLElement, // Revgrid host element
        /** @internal */
        private readonly _canvas: Canvas<BGS>,
        /** @internal */
        private readonly _scrollDimension: ScrollDimension<BGS>,
        /** @internal */
        private readonly _viewLayout: ViewLayout<BGS, BCS, SF>,
        /** @internal */
        private readonly axis: ScrollDimension.Axis,
        /** @internal */
        private _trailing: boolean, // true: right/bottom of canvas, false: otherwise left/top of canvas
        /** @internal */
        private readonly _spaceAccomodatedScroller: Scroller<BGS, BCS, SF> | undefined,
    ) {
        this._axisProperties = axesProperties[this.axis];

        const thumb = document.createElement('div');
        this._thumb = thumb;
        thumb.id = `${revgridId}-${axis}-${Scroller.thumbCssSuffix}`;
        thumb.style.position = 'absolute';

        this.thumbCssClass = `${CssTypes.libraryName}-${Scroller.thumbCssSuffix}`;
        thumb.classList.add(this.thumbCssClass);
        thumb.addEventListener('click', this._thumbClickListener);
        thumb.addEventListener('pointerenter', this._thumbPointerEnterListener);
        thumb.addEventListener('pointerleave', this._thumbPointerLeaveListener);
        thumb.addEventListener('transitionend', this._thumbTransitionEndListener);

        const bar = document.createElement('div');
        this.bar = bar;
        bar.id = `${revgridId}-${axis}-${Scroller.barCssSuffix}`;
        bar.style.position = 'absolute';
        const leadingKey = this._axisProperties.leading;
        bar.style.setProperty(leadingKey, '0');
        const trailingKey = this._axisProperties.trailing;
        bar.style.setProperty(trailingKey, '0');
        bar.addEventListener('pointerenter', this._barPointerEnterListener);
        bar.addEventListener('pointerleave', this._barPointerLeaveListener);
        bar.addEventListener('pointerdown', this._barPointerDownListener);
        bar.addEventListener('click', this._barClickListener);
        bar.addEventListener('wheel', this._barWheelListener);
        bar.appendChild(thumb);

        this.setAfterInsideOffset(Scroller.defaultInsideOffset);

        this.applySettings();

        // presets
        this.axis = axis;
        this.barCssClass = `${CssTypes.libraryName}-${Scroller.barCssSuffix}`;
        this.axisBarCssClass = `${CssTypes.libraryName}-${axis}-${Scroller.barCssSuffix}`;
        bar.classList.add(this.barCssClass);
        bar.classList.add(this.axisBarCssClass);

        this._gridSettings.subscribeChangedEvent(this._settingsChangedListener);

        this._scrollDimension.changedEventer = () => { this.resize(); };
        this._scrollDimension.scrollerTargettedViewportStartChangedEventer = () => {
            if (this._pointerScrollingState !== Scroller.PointerScrollingState.Active) {
                this.setThumbPosition(this._scrollDimension.viewportStart);
            }
        }

        if (this._spaceAccomodatedScroller !== undefined) {
            this._spaceAccomodatedScroller.visibilityChangedEventer = () => { this.resize(); };
        }

        this._hostElement.appendChild(bar);
    }

    /**
     * @summary Remove the scrollbar.
     * @desc Unhooks all the event handlers and then removes the element from the DOM. Always call this method prior to disposing of the scrollbar object.
     * @internal
     */
    destroy() {
        this._gridSettings.unsubscribeChangedEvent(this._settingsChangedListener);
        this.bar.removeEventListener('pointerenter', this._barPointerEnterListener);
        this.bar.removeEventListener('pointerleave', this._barPointerLeaveListener);
        this.bar.removeEventListener('click', this._barClickListener);
        this.bar.removeEventListener('pointerdown', this._barPointerDownListener);
        this.bar.removeEventListener('wheel', this._barWheelListener);
        this._thumb.removeEventListener('click', this._thumbClickListener);
        this._thumb.removeEventListener('pointerenter', this._thumbPointerEnterListener);
        this._thumb.removeEventListener('pointerleave', this._thumbPointerLeaveListener);
        this._thumb.removeEventListener('transitionend', this._thumbTransitionEndListener);

        this.cancelTemporaryThumbFullVisibilityTimeout();

        this.bar.remove();
    }

    get trailing() { return this._trailing; }

    /** @internal */
    get index() {
        return this._scrollDimension.viewportStart;
    }
    set index(idx: number | undefined) {
        if (idx !== undefined) {
            idx = Math.min(this._scrollDimension.finish, Math.max(this._scrollDimension.start, idx)); // clamp it
            this.setThumbPosition(idx);
        // this._setThumbSize();
        }
    }

    get hidden() {
        return this.bar.style.visibility === 'hidden'
    }

    get thickness() {
        return this.bar[this._axisProperties.offsetThickness];
    }

    get insideOverlap() {
        const crossLeadingPropertyKey = this._axisProperties.crossLeading;
        const crossOffsetLeadingPropertyKey = this._axisProperties.crossOffsetLeading;
        const thicknessPropertyKey = this._axisProperties.offsetThickness;
        if (this.bar.style[crossLeadingPropertyKey] === '') {
            const parentElement = this.bar.parentElement;
            if (parentElement === null) {
                throw new AssertError('SIO50184');
            } else {
                // Must be trailing
                return parentElement[thicknessPropertyKey] - this.bar[crossOffsetLeadingPropertyKey];
            }
        } else {
            return this.bar[crossOffsetLeadingPropertyKey] + this.bar[thicknessPropertyKey];
        }
    }

    setBeforeInsideOffset(offset: number) {
        const crossLeadingPropertyKey = this._axisProperties.crossLeading;
        this.bar.style[crossLeadingPropertyKey] = numberToPixels(offset);
        const crossTrailingPropertyKey = this._axisProperties.crossTrailing;
        this.bar.style[crossTrailingPropertyKey] = '';
    }

    setAfterInsideOffset(offset: number) {
        const crossLeadingPropertyKey = this._axisProperties.crossLeading;
        this.bar.style[crossLeadingPropertyKey] = '';
        const crossTrailingPropertyKey = this._axisProperties.crossTrailing;
        this.bar.style[crossTrailingPropertyKey] = numberToPixels(offset);
    }

    temporarilyGiveThumbFullVisibility(timePeriod: number) {
        this.cancelTemporaryThumbFullVisibilityTimeout();
        this._temporaryThumbFullVisibilityTimePeriod = timePeriod;
        this.updateThumbVisibility();
    }

    /** @internal */
    private applySettings() {
        this._thumb.style.backgroundColor = this._gridSettings.scrollerThumbColor;
        this._thumb.style.opacity = this._gridSettings.scrollerThumbReducedVisibilityOpacity.toString(10);
        this.applyThumbThickness(this._gridSettings.scrollerThickness);
    }

    /** @internal */
    private applyThumbThickness(value: string) {
        let thicknessSizeWithUnit = SizeWithUnit.tryParse(value);
        if (thicknessSizeWithUnit === undefined) {
            thicknessSizeWithUnit = {
                size: 7,
                sizeUnit: SizeUnitEnum.Pixel,
            }
        }

        let pixelsSize: number;
        switch (thicknessSizeWithUnit.sizeUnit) {
            case SizeUnitEnum.Pixel:
                pixelsSize = thicknessSizeWithUnit.size;
                break;
            case SizeUnitEnum.Em: {
                const emWidth = this._canvas.gc.getEmWidth();
                pixelsSize = Math.ceil(thicknessSizeWithUnit.size * emWidth);
                break;
            }
            case SizeUnitEnum.Fractional:
            case SizeUnitEnum.Percent: {
                throw new AssertError('SATT83210', thicknessSizeWithUnit.sizeUnit);
            }
            default:
                throw new UnreachableCaseError('SATTD83210', thicknessSizeWithUnit.sizeUnit);
        }

        const propertyName = this._axisProperties.thickness;
        const propertyValue = numberToPixels(pixelsSize);
        this.bar.style.setProperty(propertyName, propertyValue);
    }

    /**
     * @summary Move the thumb.
     * @desc Also displays the index value in the test panel and invokes the callback.
     * @param viewportStart - The new scroll index, a value in the range `min`..`max`.
     * @param barPosition - The new thumb position in pixels and scaled relative to the containing {@link Scroller#bar|bar} element, i.e., a proportional number in the range `0`..`thumbMax`.
     * @internal
     */
    private setThumbPosition(viewportStart: number | undefined) {
        if (this._scrollDimension.scrollable && viewportStart !== undefined) {
            // Move the thumb
            const thumbPosition = (viewportStart - this._scrollDimension.start) / (this._scrollDimension.size - this._scrollDimension.viewportSize) * this._thumbMax;
            this._thumb.style[this._axisProperties.leading] = thumbPosition.toString(10) + 'px';
            // this._currentThumbPosition = thumbPosition;
        }
    }

    /**
     * @summary Sets the proportional thumb size and hides thumb when 100%.
     * @desc The thumb size has an absolute minimum of 20 (pixels).
     * @internal
     */
    private setThumbSize() {
        const oh = this._axisProperties;
        const thumbComp = window.getComputedStyle(this._thumb);
        const thumbMarginLeading = parseInt(thumbComp[oh.marginLeading]);
        const thumbMarginTrailing = parseInt(thumbComp[oh.marginTrailing]);
        const thumbMargins = thumbMarginLeading + thumbMarginTrailing;
        const barSize = this.bar.getBoundingClientRect()[oh.size];

        const oldHidden = this.hidden;
        if (this._scrollDimension.scrollable) {
            const thumbSize = Math.max(20, barSize * this._scrollDimension.viewportSize / this._scrollDimension.size);
            this._thumb.style[oh.size] = thumbSize.toString(10) + 'px';
            this._thumbMax = barSize - thumbSize - thumbMargins;
            if (oldHidden) {
                this.bar.style.visibility = 'visible';
                if (this.visibilityChangedEventer !== undefined) {
                    this.visibilityChangedEventer();
                }
            }
        } else {
            if (!oldHidden) {
                this.bar.style.visibility = 'hidden';
                if (this.visibilityChangedEventer !== undefined) {
                    this.visibilityChangedEventer();
                }
            }
        }


        this._thumbMarginLeading = thumbMarginLeading; // used in pointerdown
    }

    /** @internal */
    private handleThumbClickEvent(evt: MouseEvent) {
        evt.stopPropagation();
    }

    /** @internal */
    private handleBarWheelEvent(event: WheelEvent) {
        if (this.wheelEventer !== undefined) {
            this.wheelEventer(event);
        }
    }

    /** @internal */
    private handleBarClickEvent(evt: MouseEvent) {
        if (this._pointerScrollingState === Scroller.PointerScrollingState.ClickWaiting) {
            this.updatePointerScrolling(Scroller.PointerScrollingState.Inactive, undefined);
        } else {
            if (evt.target === this.bar && this._scrollDimension.viewportStart !== undefined) {
                const thumbBox = this._thumb.getBoundingClientRect();
                const goingUp = evt[this._axisProperties.client] < thumbBox[this._axisProperties.leading];

                let actionType: Scroller.Action.TypeEnum;
                if (goingUp) {
                    if (evt.altKey) {
                        actionType = Scroller.Action.TypeEnum.StepBack;
                    } else {
                        actionType = Scroller.Action.TypeEnum.PageBack;
                    }
                } else {
                    if (evt.altKey) {
                        actionType = Scroller.Action.TypeEnum.StepForward;
                    } else {
                        actionType = Scroller.Action.TypeEnum.PageForward;
                    }
                }
                const action: Scroller.Action = {
                    type: actionType,
                    viewportStart: undefined,
                };

                this.actionEventer(action);

                // make the thumb glow momentarily
                const temporaryThumbFullVisibilityTimePeriod = this.isThumbVisibilityTransitionSpecified() ? 0 : 300;
                this.temporarilyGiveThumbFullVisibility(temporaryThumbFullVisibilityTimePeriod);

                evt.stopPropagation();
            }
        }
    }

    /** @internal */
    private handleThumbPointerEnterEvent() {
        this._thumb.classList.add('hover');
        this._pointerOverThumb = true;
        this.updateThumbVisibility();
    }

    /** @internal */
    private handleThumbPointerLeaveEvent() {
        this._thumb.classList.remove('hover');
        this._pointerOverThumb = false;
        this.updateThumbVisibility();
    }

    /** @internal */
    private handleThumbTransitionEndEvent() {
        if (this._thumbVisibilityState === ThumbVisibilityState.ToFullTransitioning) {
            this._thumbVisibilityState = ThumbVisibilityState.Full;
            this.updateThumbVisibility();
        }
    }

    /** @internal */
    private handleBarPointerEnterEvent() {
        this.bar.classList.add('hover');
        this._pointerOverBar = true;
        this.updateThumbVisibility();
    }

    /** @internal */
    private handleBarPointerLeaveEvent() {
        this.bar.classList.remove('hover');
        this._pointerOverBar = false;
        this.updateThumbVisibility();
    }

    /** @internal */
    private handleBarPointerDownEvent(event: PointerEvent) {
        this.updatePointerScrolling(Scroller.PointerScrollingState.Armed, event);

        event.stopPropagation();
        event.preventDefault();
    }

    /** @internal */
    private handleBarPointerMoveEvent(evt: PointerEvent) {
        this.updatePointerScrolling(Scroller.PointerScrollingState.Active, evt);

        // if (!(evt.buttons & 1)) {
        //     // mouse button may have been released without `onmouseup` triggering (see
        //     window.dispatchEvent(new MouseEvent('mouseup', evt));
        //     return;
        // }

        let thumbPosition: number | undefined;

        thumbPosition = evt[this._axisProperties.page] - this._pinOffset;
        if (thumbPosition < 0) {
            // make sure does not go beyond start edge
            thumbPosition = 0;
        } else {
            if (thumbPosition > this._thumbMax) {
                thumbPosition = this._thumbMax;
            }
        }
        const possiblyFractionalViewportStart = thumbPosition / this._thumbMax * (this._scrollDimension.size - this._scrollDimension.viewportSize) + this._scrollDimension.start;

        const viewportStart = Math.round(possiblyFractionalViewportStart);

        this.setThumbPosition(viewportStart);

        const action: Scroller.Action = {
            type: Scroller.Action.TypeEnum.newViewportStart,
            viewportStart,
        };

        this.actionEventer(action);

        evt.stopPropagation();
        evt.preventDefault();
    }

    /** @internal */
    private handleBarPointerUpCancelEvent(event: PointerEvent) {
        this.updatePointerScrolling(Scroller.PointerScrollingState.Inactive, event)

        event.stopPropagation();
        event.preventDefault();
    }

    /** @internal */
    private resize() {
        const leadingTrailing = this.calculateLeadingTrailingForSpaceAccomodatedScroller();
        for (const key in leadingTrailing) {
            const value = leadingTrailing[key];
            if (value !== undefined) {
                this.bar.style.setProperty(key, value);
            }
        }

        this.setThumbSize();
        this.setThumbPosition(this._scrollDimension.viewportStart);
    }

    /** @internal */
    private calculateLeadingTrailingForSpaceAccomodatedScroller(): LeadingTrailing {
        const leadingTrailing: LeadingTrailing = {};
        const leadingKey = this._axisProperties.leading;
        const trailingKey = this._axisProperties.trailing;
        const spaceAccomodatedScroller = this._spaceAccomodatedScroller;
        if (spaceAccomodatedScroller === undefined) {
            leadingTrailing[leadingKey] = '0';
            leadingTrailing[trailingKey] = '0';
        } else {
            if (spaceAccomodatedScroller.hidden) {
                leadingTrailing[leadingKey] = '0';
                leadingTrailing[trailingKey] = '0';
                } else {
                const insideOverlap = spaceAccomodatedScroller.insideOverlap;
                if (spaceAccomodatedScroller.trailing) {
                    leadingTrailing[leadingKey] = '0';
                    leadingTrailing[trailingKey] = numberToPixels(insideOverlap);
                } else {
                    leadingTrailing[leadingKey] = numberToPixels(insideOverlap);
                    leadingTrailing[trailingKey] = '0';
                }
            }
        }
        return leadingTrailing;
    }

    /** @internal */
    private updatePointerScrolling(newState: Scroller.PointerScrollingState, event: PointerEvent | undefined) {
        switch (this._pointerScrollingState) {
            case Scroller.PointerScrollingState.Inactive: {
                switch (newState) {
                    case Scroller.PointerScrollingState.Inactive:
                        break; // no change
                    case Scroller.PointerScrollingState.Armed:
                        this._pointerScrollingState = Scroller.PointerScrollingState.Armed;
                        if (event === undefined) {
                            throw new AssertError('SUPSIR50521')
                        } else {
                            this.armPointerScrolling(event);
                        }
                        break;
                    case Scroller.PointerScrollingState.Active:
                        // weird
                        if (event === undefined) {
                            throw new AssertError('SUPSIA50521')
                        } else {
                            this._pointerScrollingState = Scroller.PointerScrollingState.Armed;
                            this.armPointerScrolling(event);
                            this._pointerScrollingState = Scroller.PointerScrollingState.Active;
                            this.activatePointerScrolling(event);
                        }
                        break;
                    case Scroller.PointerScrollingState.ClickWaiting:
                        throw new AssertError('SUPSIC50521');
                    default:
                        throw new UnreachableCaseError('SUPSDI50521', newState);
                }
                break;
            }
            case Scroller.PointerScrollingState.Armed:
                switch (newState) {
                    case Scroller.PointerScrollingState.Inactive:
                        this._pointerScrollingState = Scroller.PointerScrollingState.Inactive;
                        if (event === undefined) {
                            throw new AssertError('SUPSRI50521')
                        } else {
                            this.deactivatePointerScrolling(event);
                        }
                        break;
                    case Scroller.PointerScrollingState.Armed:
                        break; // no change
                    case Scroller.PointerScrollingState.Active:
                        if (event === undefined) {
                            throw new AssertError('SUPSRA50521')
                        } else {
                            this._pointerScrollingState = Scroller.PointerScrollingState.Active;
                            this.activatePointerScrolling(event);
                        }
                        break;
                    case Scroller.PointerScrollingState.ClickWaiting:
                        throw new AssertError('SUPSRC50521')
                        // this._pointerScrollingState = Scroller.PointerScrollingState.ClickWaiting;
                        // this.deactivatePointerScrolling(event);
                        break;
                    default:
                        throw new UnreachableCaseError('SUPSRD50521', newState);
                }
                break;
            case Scroller.PointerScrollingState.Active:
                switch (newState) {
                    case Scroller.PointerScrollingState.Inactive:
                        // Since we are active, we want to ignore the next click
                        this._pointerScrollingState = Scroller.PointerScrollingState.ClickWaiting;
                        if (event === undefined) {
                            throw new AssertError('SUPSAI50521')
                        } else {
                            this.deactivatePointerScrolling(event);
                        }
                        break;
                    case Scroller.PointerScrollingState.Armed:
                        // weird
                        if (event === undefined) {
                            throw new AssertError('SUPSAR50521')
                        } else {
                            this._pointerScrollingState = Scroller.PointerScrollingState.Inactive;
                            this.deactivatePointerScrolling(event);
                            this._pointerScrollingState = Scroller.PointerScrollingState.Armed;
                            this.armPointerScrolling(event);
                        }
                        break;
                    case Scroller.PointerScrollingState.Active:
                        break; // no change
                    case Scroller.PointerScrollingState.ClickWaiting:
                        this._pointerScrollingState = Scroller.PointerScrollingState.ClickWaiting;
                        if (event === undefined) {
                            throw new AssertError('SUPSAC50521')
                        } else {
                            this.deactivatePointerScrolling(event);
                        }
                        break;
                    default:
                        throw new UnreachableCaseError('SUPSAD50521', newState);
                }
                break;
            case Scroller.PointerScrollingState.ClickWaiting:
                switch (newState) {
                    case Scroller.PointerScrollingState.Inactive:
                        this._pointerScrollingState = Scroller.PointerScrollingState.Inactive;
                        break;
                    case Scroller.PointerScrollingState.Armed:
                        // must have lost a click event
                        this._pointerScrollingState = Scroller.PointerScrollingState.Armed;
                        if (event === undefined) {
                            throw new AssertError('SUPSCR50521')
                        } else {
                            this.armPointerScrolling(event);
                        }
                        break;
                    case Scroller.PointerScrollingState.Active:
                        // weird
                        if (event === undefined) {
                            throw new AssertError('SUPSCA50521')
                        } else {
                            this._pointerScrollingState = Scroller.PointerScrollingState.Armed;
                            this.armPointerScrolling(event);
                            this._pointerScrollingState = Scroller.PointerScrollingState.Active;
                            this.activatePointerScrolling(event);
                        }
                        break;
                    case Scroller.PointerScrollingState.ClickWaiting:
                        break; // no action
                    default:
                        throw new UnreachableCaseError('SUPSCD50521', newState);
                }
                break;
            default:
                throw new UnreachableCaseError('SUPSDD50521', this._pointerScrollingState);
        }
    }

    /** @internal */
    private armPointerScrolling(event: PointerEvent) {
        const thumbBox = this._thumb.getBoundingClientRect();
        this._pinOffset = event[this._axisProperties.page] - thumbBox[this._axisProperties.leading] + this.bar.getBoundingClientRect()[this._axisProperties.leading] + this._thumbMarginLeading;
        document.documentElement.style.cursor = 'default';

        this._barPointerMoveListener = (moveEvent) => { this.handleBarPointerMoveEvent(moveEvent); };
        this.bar.addEventListener('pointermove', this._barPointerMoveListener);
        this._barPointerUpListener = (upEvent: PointerEvent) => { this.handleBarPointerUpCancelEvent(upEvent); }
        this.bar.addEventListener('pointerup', this._barPointerUpListener);
        this._barPointerCancelListener = (cancelEvent: PointerEvent) => { this.handleBarPointerUpCancelEvent(cancelEvent); }
        this.bar.addEventListener('pointercancel', this._barPointerCancelListener);

        this.updateThumbVisibility();
    }

    /** @internal */
    activatePointerScrolling(event: PointerEvent) {
        this.bar.setPointerCapture(event.pointerId);
        this._barPointerCaptured = true;

        this._viewLayout.beginUiControlTracking();
        this._viewLayoutTrackingActive = true;
        this.updateThumbVisibility();
    }

    /** @internal */
    deactivatePointerScrolling(event: PointerEvent) {
        if (this._barPointerMoveListener !== undefined) {
            this.bar.removeEventListener('pointermove', this._barPointerMoveListener);
            this._barPointerMoveListener = undefined;
        }
        if (this._barPointerUpListener !== undefined) {
            this.bar.removeEventListener('pointerup', this._barPointerUpListener);
            this._barPointerUpListener = undefined;
        }
        if (this._barPointerCancelListener !== undefined) {
            this.bar.removeEventListener('pointercancel', this._barPointerCancelListener);
            this._barPointerCancelListener = undefined;
        }

        if (this._barPointerCaptured) {
            this.bar.releasePointerCapture(event.pointerId);
            this._barPointerCaptured = false;
        }

        if (this._viewLayoutTrackingActive) {
            this._viewLayout.endUiControlTracking();
            this._viewLayoutTrackingActive = false;
        }

        document.documentElement.style.cursor = 'auto';

        this.updateThumbVisibility();
        this.setThumbPosition(this._scrollDimension.viewportStart);
    }

    /** @internal */
    private updateThumbVisibility() {
        switch (this._thumbVisibilityState) {
            case ThumbVisibilityState.Reduced: {
                if (this.wantThumbFullVisibility()) {
                    this._thumb.style.opacity = '1';
                    if (this.isThumbVisibilityTransitionSpecified()) {
                        this._thumbVisibilityState = ThumbVisibilityState.ToFullTransitioning;
                    } else {
                        this._thumbVisibilityState = ThumbVisibilityState.Full;
                        this.updateThumbVisibility(); // check for temporary
                    }
                }
                break;
            }
            case ThumbVisibilityState.ToFullTransitioning: {
                break;
            }
            case ThumbVisibilityState.Full: {
                if (this.wantThumbFullVisibility()) {
                    if (this._temporaryThumbFullVisibilityTimePeriod !== undefined && this._temporaryThumbFullVisibilityTimeoutId === undefined) {
                        this._temporaryThumbFullVisibilityTimeoutId = setTimeout(
                            () => { this.handleTemporaryThumbFullVisibilityTimeout(); },
                            this._temporaryThumbFullVisibilityTimePeriod
                        );
                    }
                } else {
                    this._thumb.style.opacity = this._gridSettings.scrollerThumbReducedVisibilityOpacity.toString(10);
                    this._thumbVisibilityState = ThumbVisibilityState.Reduced;
                }
                break;
            }
            default:
                throw new UnreachableCaseError('SUTV55509', this._thumbVisibilityState);
        }
    }

    /** @internal */
    private wantThumbFullVisibility() {
        return (
            this._pointerOverBar ||
            this._pointerOverThumb ||
            this._pointerScrollingState === Scroller.PointerScrollingState.Armed ||
            this._pointerScrollingState === Scroller.PointerScrollingState.Active ||
            this._temporaryThumbFullVisibilityTimePeriod !== undefined
        );
    }

    /** @internal */
    private isThumbVisibilityTransitionSpecified() {
        return this._thumb.style.transition.includes('opacity');
    }

    /** @internal */
    private handleTemporaryThumbFullVisibilityTimeout() {
        this._temporaryThumbFullVisibilityTimePeriod = undefined;
        this.updateThumbVisibility();
    }

    /** @internal */
    private cancelTemporaryThumbFullVisibilityTimeout() {
        if (this._temporaryThumbFullVisibilityTimeoutId !== undefined) {
            clearTimeout(this._temporaryThumbFullVisibilityTimeoutId);
            this._temporaryThumbFullVisibilityTimeoutId = undefined;
        }
    }
}

/** @public */
export namespace Scroller {
    export type WheelEventer = (this: void, event: WheelEvent) => void;

    export const barCssSuffix = 'scroller';
    export const thumbCssSuffix = 'scroller-thumb';

    export const defaultInsideOffset = 3;

    /** @public */
    export interface Action {
        readonly type: Action.TypeEnum;
        readonly viewportStart: number | undefined;
    }

    /** @public */
    export namespace Action {
        export const enum TypeEnum {
            StepForward,
            StepBack,
            PageForward,
            PageBack,
            newViewportStart,
        }
    }

    /** @internal */
    export type ActionEventer = (this: void, action: Scroller.Action) => void;
    /** @internal */
    export type VisibilityChangedEventer = (this: void) => void;
    /** @internal */
    export type PointerEventListener = (event: PointerEvent) => void;

    /** @internal */
    export const enum PointerScrollingState {
        Inactive,
        Armed,
        Active,
        ClickWaiting,
    }
}

interface AxisProperties {
    client: 'clientX' | 'clientY';
    page: 'pageX' | 'pageY';
    size: 'width' | 'height';
    leading: 'left' | 'top';
    trailing: 'right' | 'bottom';
    crossLeading: 'left' | 'top';
    crossTrailing: 'right' | 'bottom';
    marginLeading: 'marginLeft' | 'marginTop';
    marginTrailing: 'marginRight' | 'marginBottom';
    offsetLeading: 'offsetLeft' | 'offsetTop';
    crossOffsetLeading: 'offsetLeft' | 'offsetTop';
    thickness: 'width' | 'height';
    offsetThickness: 'offsetWidth' | 'offsetHeight';
}

// Note Axes is plural of Axis
type AxesProperties = { [axis in keyof typeof ScrollDimension.AxisEnum]: AxisProperties };

const axesProperties: AxesProperties = {
    vertical: {
        client:             'clientY',
        page:               'pageY',
        size:               'height',
        leading:            'top',
        trailing:           'bottom',
        crossLeading:       'left',
        crossTrailing:      'right',
        marginLeading:      'marginTop',
        marginTrailing:     'marginBottom',
        offsetLeading:      'offsetTop',
        crossOffsetLeading: 'offsetLeft',
        thickness:          'width',
        offsetThickness:    'offsetWidth',
    },
    horizontal: {
        client:             'clientX',
        page:               'pageX',
        size:               'width',
        leading:            'left',
        trailing:           'right',
        crossLeading:       'top',
        crossTrailing:      'bottom',
        marginLeading:      'marginLeft',
        marginTrailing:     'marginRight',
        offsetLeading:      'offsetLeft',
        crossOffsetLeading: 'offsetTop',
        thickness:          'height',
        offsetThickness:    'offsetHeight',
    }
};

const enum LeadingTrailingKey {
    left,
    top,
    right,
    bottom,
}

type LeadingTrailing = {
    -readonly [key in keyof typeof LeadingTrailingKey]?: string;
}

const enum ThumbVisibilityState {
    Reduced,
    ToFullTransitioning,
    Full,
}
