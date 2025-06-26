import { numberToPixels } from '@pbkware/js-utils';
import { RevAssertError, RevClientObject, RevCssTypes, RevSchemaField, RevSizeUnitId, RevSizeWithUnit, RevUnreachableCaseError } from '../../../common';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../../settings';
import { RevCanvas } from '../canvas/canvas';
import { RevScrollDimension } from '../view/scroll-dimension';
import { RevViewLayout } from '../view/view-layout';

// Following is the sole style requirement for bar and thumb elements.
// Maintained in code so not dependent being in stylesheet.
// const BAR_STYLE = 'position: absolute;';

/** @public */
export class RevScroller<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    readonly bar: HTMLDivElement;
    readonly barCssClass: string;
    readonly axisBarCssClass: string;
    readonly thumbCssClass: string;

    /** @internal */
    actionEventer: RevScroller.ActionEventer;
    /** @internal */
    wheelEventer: RevScroller.WheelEventer | undefined;
    /** @internal */
    visibilityChangedEventer: RevScroller.VisibilityChangedEventer | undefined;

    /**
     * The generated scrollbar thumb element.
     * @remarks The thumb element's parent element is always the {@link RevScroller#bar|bar} element.
     *
     * This property is typically referenced internally only. The size and position of the thumb element is maintained by `_calcThumb()`.
     * @internal
     */
    private _thumb: HTMLDivElement;
    /**
     * @readonly
     * <u>O</u>rientation <u>h</u>ash for this scrollbar.
     * @remarks Set by the `orientation` setter to either the vertical or the horizontal orientation hash. The property should always be synchronized with `orientation`; do not update directly!
     *
     * This object is used internally to access scrollbars' DOM element properties in a generalized way without needing to constantly query the scrollbar orientation. For example, instead of explicitly coding `this.bar.top` for a vertical scrollbar and `this.bar.left` for a horizontal scrollbar, simply code `this.bar[this.oh.leading]` instead.
     * @internal
     */
    private readonly _axisProperties: AxisProperties;

    /**
     * Maximum offset of thumb's leading edge.
     * @remarks This is the pixel offset within the scrollbar of the thumb when it is at its maximum position at the extreme end of its range.
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
    private _pointerScrollingState = RevScroller.PointerScrollingStateId.Inactive;
    /** @internal */
    private _viewLayoutTrackingActive = false;
    /** @internal */
    private _thumbVisibilityState = ThumbVisibilityStateId.Reduced;
    /** @internal */
    private _barPointerMoveListener: RevScroller.PointerEventListener | undefined;
    /** @internal */
    private _barPointerUpListener: RevScroller.PointerEventListener | undefined;
    /** @internal */
    private _barPointerCancelListener: RevScroller.PointerEventListener | undefined;
    /** @internal */
    private _barPointerCaptured = false;

    /**
     * Create a scrollbar object.
     * @remarks Creating a scrollbar is a three-step process:
     *
     * 1. Instantiate the scrollbar object by calling this constructor function. Upon instantiation, the DOM element for the scrollbar (with a single child element for the scrollbar "thumb") is created but is not insert it into the DOM.
     * 2. After instantiation, it is the caller's responsibility to insert the scrollbar, {@link RevScroller#bar|this.bar}, into the DOM.
     * 3. After insertion, the caller must call {@link RevScroller#resize|resize()} at least once to size and position the scrollbar and its thumb. After that, `resize()` should also be called repeatedly on resize events (as the content element is being resized).
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
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        /** @internal */
        private readonly _gridSettings: BGS,
        /** @internal */
        private readonly _hostElement: HTMLElement, // Revgrid host element
        /** @internal */
        private readonly _canvas: RevCanvas<BGS>,
        /** @internal */
        private readonly _scrollDimension: RevScrollDimension<BGS>,
        /** @internal */
        private readonly _viewLayout: RevViewLayout<BGS, BCS, SF>,
        /** @internal */
        private readonly axis: RevScrollDimension.Axis,
        /** @internal */
        private _trailing: boolean, // true: right/bottom of canvas, false: otherwise left/top of canvas
        /** @internal */
        private readonly _spaceAccomodatedScroller: RevScroller<BGS, BCS, SF> | undefined,
    ) {
        this._axisProperties = axesProperties[this.axis];

        const thumb = document.createElement('div');
        this._thumb = thumb;
        thumb.id = `${clientId}-${axis}-${RevScroller.thumbCssSuffix}`;
        thumb.style.position = 'absolute';

        this.thumbCssClass = `${RevCssTypes.libraryName}-${RevScroller.thumbCssSuffix}`;
        thumb.classList.add(this.thumbCssClass);
        thumb.addEventListener('click', this._thumbClickListener);
        thumb.addEventListener('pointerenter', this._thumbPointerEnterListener);
        thumb.addEventListener('pointerleave', this._thumbPointerLeaveListener);
        thumb.addEventListener('transitionend', this._thumbTransitionEndListener);

        const bar = document.createElement('div');
        this.bar = bar;
        bar.id = `${clientId}-${axis}-${RevScroller.barCssSuffix}`;
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

        this.setAfterInsideOffset(RevScroller.defaultInsideOffset);

        this.applySettings();

        // presets
        this.axis = axis;
        this.barCssClass = `${RevCssTypes.libraryName}-${RevScroller.barCssSuffix}`;
        this.axisBarCssClass = `${RevCssTypes.libraryName}-${axis}-${RevScroller.barCssSuffix}`;
        bar.classList.add(this.barCssClass);
        bar.classList.add(this.axisBarCssClass);

        this._gridSettings.subscribeChangedEvent(this._settingsChangedListener);

        this._scrollDimension.changedEventer = () => { this.resize(); };
        this._scrollDimension.scrollerTargettedViewportStartChangedEventer = () => {
            if (this._pointerScrollingState !== RevScroller.PointerScrollingStateId.Active) {
                this.setThumbPosition(this._scrollDimension.viewportStart);
            }
        }

        if (this._spaceAccomodatedScroller !== undefined) {
            this._spaceAccomodatedScroller.visibilityChangedEventer = () => { this.resize(); };
        }

        this._hostElement.appendChild(bar);
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
                throw new RevAssertError('SIO50184');
            } else {
                // Must be trailing
                return parentElement[thicknessPropertyKey] - this.bar[crossOffsetLeadingPropertyKey];
            }
        } else {
            return this.bar[crossOffsetLeadingPropertyKey] + this.bar[thicknessPropertyKey];
        }
    }

    /**
     * Remove the scrollbar.
     * @remarks Unhooks all the event handlers and then removes the element from the DOM. Always call this method prior to disposing of the scrollbar object.
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
    private applySettings() {
        this._thumb.style.backgroundColor = this._gridSettings.scrollerThumbColor;
        this._thumb.style.opacity = this._gridSettings.scrollerThumbReducedVisibilityOpacity.toString(10);
        this.applyThumbThickness(this._gridSettings.scrollerThickness);
    }

    /** @internal */
    private applyThumbThickness(value: string) {
        let thicknessSizeWithUnit = RevSizeWithUnit.tryParse(value);
        if (thicknessSizeWithUnit === undefined) {
            thicknessSizeWithUnit = {
                size: 7,
                sizeUnit: RevSizeUnitId.Pixel,
            }
        }

        let pixelsSize: number;
        switch (thicknessSizeWithUnit.sizeUnit) {
            case RevSizeUnitId.Pixel:
                pixelsSize = thicknessSizeWithUnit.size;
                break;
            case RevSizeUnitId.Em: {
                const emWidth = this._canvas.gc.getEmWidth();
                pixelsSize = Math.ceil(thicknessSizeWithUnit.size * emWidth);
                break;
            }
            case RevSizeUnitId.Fractional:
            case RevSizeUnitId.Percent: {
                throw new RevAssertError('SATT83210', `${thicknessSizeWithUnit.sizeUnit}`);
            }
            default:
                throw new RevUnreachableCaseError('SATTD83210', thicknessSizeWithUnit.sizeUnit);
        }

        const propertyName = this._axisProperties.thickness;
        const propertyValue = numberToPixels(pixelsSize);
        this.bar.style.setProperty(propertyName, propertyValue);
    }

    /**
     * Move the thumb.
     * @remarks Also displays the index value in the test panel and invokes the callback.
     * @param viewportStart - The new scroll index, a value in the range `min`..`max`.
     * @param barPosition - The new thumb position in pixels and scaled relative to the containing {@link RevScroller#bar|bar} element, i.e., a proportional number in the range `0`..`thumbMax`.
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
     * Sets the proportional thumb size and hides thumb when 100%.
     * @remarks The thumb size has an absolute minimum of 20 (pixels).
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
        if (this._pointerScrollingState === RevScroller.PointerScrollingStateId.ClickWaiting) {
            this.updatePointerScrolling(RevScroller.PointerScrollingStateId.Inactive, undefined);
        } else {
            if (evt.target === this.bar && this._scrollDimension.viewportStart !== undefined) {
                const thumbBox = this._thumb.getBoundingClientRect();
                const goingUp = evt[this._axisProperties.client] < thumbBox[this._axisProperties.leading];

                let actionType: RevScroller.Action.TypeId;
                if (goingUp) {
                    if (evt.altKey) {
                        actionType = RevScroller.Action.TypeId.StepBack;
                    } else {
                        actionType = RevScroller.Action.TypeId.PageBack;
                    }
                } else {
                    if (evt.altKey) {
                        actionType = RevScroller.Action.TypeId.StepForward;
                    } else {
                        actionType = RevScroller.Action.TypeId.PageForward;
                    }
                }
                const action: RevScroller.Action = {
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
        if (this._thumbVisibilityState === ThumbVisibilityStateId.ToFullTransitioning) {
            this._thumbVisibilityState = ThumbVisibilityStateId.Full;
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
        this.updatePointerScrolling(RevScroller.PointerScrollingStateId.Armed, event);

        event.stopPropagation();
        event.preventDefault();
    }

    /** @internal */
    private handleBarPointerMoveEvent(evt: PointerEvent) {
        this.updatePointerScrolling(RevScroller.PointerScrollingStateId.Active, evt);

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

        const action: RevScroller.Action = {
            type: RevScroller.Action.TypeId.newViewportStart,
            viewportStart,
        };

        this.actionEventer(action);

        evt.stopPropagation();
        evt.preventDefault();
    }

    /** @internal */
    private handleBarPointerUpCancelEvent(event: PointerEvent) {
        this.updatePointerScrolling(RevScroller.PointerScrollingStateId.Inactive, event)

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
    private updatePointerScrolling(newState: RevScroller.PointerScrollingStateId, event: PointerEvent | undefined) {
        switch (this._pointerScrollingState) {
            case RevScroller.PointerScrollingStateId.Inactive: {
                switch (newState) {
                    case RevScroller.PointerScrollingStateId.Inactive:
                        break; // no change
                    case RevScroller.PointerScrollingStateId.Armed:
                        this._pointerScrollingState = RevScroller.PointerScrollingStateId.Armed;
                        if (event === undefined) {
                            throw new RevAssertError('SUPSIR50521')
                        } else {
                            this.armPointerScrolling(event);
                        }
                        break;
                    case RevScroller.PointerScrollingStateId.Active:
                        // weird
                        if (event === undefined) {
                            throw new RevAssertError('SUPSIA50521')
                        } else {
                            this._pointerScrollingState = RevScroller.PointerScrollingStateId.Armed;
                            this.armPointerScrolling(event);
                            this._pointerScrollingState = RevScroller.PointerScrollingStateId.Active;
                            this.activatePointerScrolling(event);
                        }
                        break;
                    case RevScroller.PointerScrollingStateId.ClickWaiting:
                        throw new RevAssertError('SUPSIC50521');
                    default:
                        throw new RevUnreachableCaseError('SUPSDI50521', newState);
                }
                break;
            }
            case RevScroller.PointerScrollingStateId.Armed:
                switch (newState) {
                    case RevScroller.PointerScrollingStateId.Inactive:
                        this._pointerScrollingState = RevScroller.PointerScrollingStateId.Inactive;
                        if (event === undefined) {
                            throw new RevAssertError('SUPSRI50521')
                        } else {
                            this.deactivatePointerScrolling(event);
                        }
                        break;
                    case RevScroller.PointerScrollingStateId.Armed:
                        break; // no change
                    case RevScroller.PointerScrollingStateId.Active:
                        if (event === undefined) {
                            throw new RevAssertError('SUPSRA50521')
                        } else {
                            this._pointerScrollingState = RevScroller.PointerScrollingStateId.Active;
                            this.activatePointerScrolling(event);
                        }
                        break;
                    case RevScroller.PointerScrollingStateId.ClickWaiting:
                        throw new RevAssertError('SUPSRC50521')
                        // this._pointerScrollingState = Scroller.PointerScrollingState.ClickWaiting;
                        // this.deactivatePointerScrolling(event);
                        break;
                    default:
                        throw new RevUnreachableCaseError('SUPSRD50521', newState);
                }
                break;
            case RevScroller.PointerScrollingStateId.Active:
                switch (newState) {
                    case RevScroller.PointerScrollingStateId.Inactive:
                        // Since we are active, we want to ignore the next click
                        this._pointerScrollingState = RevScroller.PointerScrollingStateId.ClickWaiting;
                        if (event === undefined) {
                            throw new RevAssertError('SUPSAI50521')
                        } else {
                            this.deactivatePointerScrolling(event);
                        }
                        break;
                    case RevScroller.PointerScrollingStateId.Armed:
                        // weird
                        if (event === undefined) {
                            throw new RevAssertError('SUPSAR50521')
                        } else {
                            this._pointerScrollingState = RevScroller.PointerScrollingStateId.Inactive;
                            this.deactivatePointerScrolling(event);
                            this._pointerScrollingState = RevScroller.PointerScrollingStateId.Armed;
                            this.armPointerScrolling(event);
                        }
                        break;
                    case RevScroller.PointerScrollingStateId.Active:
                        break; // no change
                    case RevScroller.PointerScrollingStateId.ClickWaiting:
                        this._pointerScrollingState = RevScroller.PointerScrollingStateId.ClickWaiting;
                        if (event === undefined) {
                            throw new RevAssertError('SUPSAC50521')
                        } else {
                            this.deactivatePointerScrolling(event);
                        }
                        break;
                    default:
                        throw new RevUnreachableCaseError('SUPSAD50521', newState);
                }
                break;
            case RevScroller.PointerScrollingStateId.ClickWaiting:
                switch (newState) {
                    case RevScroller.PointerScrollingStateId.Inactive:
                        this._pointerScrollingState = RevScroller.PointerScrollingStateId.Inactive;
                        break;
                    case RevScroller.PointerScrollingStateId.Armed:
                        // must have lost a click event
                        this._pointerScrollingState = RevScroller.PointerScrollingStateId.Armed;
                        if (event === undefined) {
                            throw new RevAssertError('SUPSCR50521')
                        } else {
                            this.armPointerScrolling(event);
                        }
                        break;
                    case RevScroller.PointerScrollingStateId.Active:
                        // weird
                        if (event === undefined) {
                            throw new RevAssertError('SUPSCA50521')
                        } else {
                            this._pointerScrollingState = RevScroller.PointerScrollingStateId.Armed;
                            this.armPointerScrolling(event);
                            this._pointerScrollingState = RevScroller.PointerScrollingStateId.Active;
                            this.activatePointerScrolling(event);
                        }
                        break;
                    case RevScroller.PointerScrollingStateId.ClickWaiting:
                        break; // no action
                    default:
                        throw new RevUnreachableCaseError('SUPSCD50521', newState);
                }
                break;
            default:
                throw new RevUnreachableCaseError('SUPSDD50521', this._pointerScrollingState);
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
    private updateThumbVisibility() {
        switch (this._thumbVisibilityState) {
            case ThumbVisibilityStateId.Reduced: {
                if (this.wantThumbFullVisibility()) {
                    this._thumb.style.opacity = '1';
                    if (this.isThumbVisibilityTransitionSpecified()) {
                        this._thumbVisibilityState = ThumbVisibilityStateId.ToFullTransitioning;
                    } else {
                        this._thumbVisibilityState = ThumbVisibilityStateId.Full;
                        this.updateThumbVisibility(); // check for temporary
                    }
                }
                break;
            }
            case ThumbVisibilityStateId.ToFullTransitioning: {
                break;
            }
            case ThumbVisibilityStateId.Full: {
                if (this.wantThumbFullVisibility()) {
                    if (this._temporaryThumbFullVisibilityTimePeriod !== undefined && this._temporaryThumbFullVisibilityTimeoutId === undefined) {
                        this._temporaryThumbFullVisibilityTimeoutId = setTimeout(
                            () => { this.handleTemporaryThumbFullVisibilityTimeout(); },
                            this._temporaryThumbFullVisibilityTimePeriod
                        );
                    }
                } else {
                    this._thumb.style.opacity = this._gridSettings.scrollerThumbReducedVisibilityOpacity.toString(10);
                    this._thumbVisibilityState = ThumbVisibilityStateId.Reduced;
                }
                break;
            }
            default:
                throw new RevUnreachableCaseError('SUTV55509', this._thumbVisibilityState);
        }
    }

    /** @internal */
    private wantThumbFullVisibility() {
        return (
            this._pointerOverBar ||
            this._pointerOverThumb ||
            this._pointerScrollingState === RevScroller.PointerScrollingStateId.Armed ||
            this._pointerScrollingState === RevScroller.PointerScrollingStateId.Active ||
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
export namespace RevScroller {
    export type WheelEventer = (this: void, event: WheelEvent) => void;

    export const barCssSuffix = 'scroller';
    export const thumbCssSuffix = 'scroller-thumb';

    export const defaultInsideOffset = 3;

    /** @public */
    export interface Action {
        readonly type: Action.TypeId;
        readonly viewportStart: number | undefined;
    }

    /** @public */
    export namespace Action {
        export const enum TypeId {
            StepForward,
            StepBack,
            PageForward,
            PageBack,
            newViewportStart,
        }
    }

    /** @internal */
    export type ActionEventer = (this: void, action: RevScroller.Action) => void;
    /** @internal */
    export type VisibilityChangedEventer = (this: void) => void;
    /** @internal */
    export type PointerEventListener = (event: PointerEvent) => void;

    /** @internal */
    export const enum PointerScrollingStateId {
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
type AxesProperties = { [axis in keyof typeof RevScrollDimension.AxisId]: AxisProperties };

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const enum LeadingTrailingKey {
    left,
    top,
    right,
    bottom,
}

type LeadingTrailing = {
    -readonly [key in keyof typeof LeadingTrailingKey]?: string;
}

const enum ThumbVisibilityStateId {
    Reduced,
    ToFullTransitioning,
    Full,
}
