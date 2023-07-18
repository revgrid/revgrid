import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { CssClassName } from '../../types-utils/html-types';
import { AssertError, UnreachableCaseError } from '../../types-utils/revgrid-error';
import { RevgridObject } from '../../types-utils/revgrid-object';
import { numberToPixels } from '../../types-utils/utils';
import { ScrollDimension } from '../view/scroll-dimension';
import { ViewLayout } from '../view/view-layout';

// Following is the sole style requirement for bar and thumb elements.
// Maintained in code so not dependent being in stylesheet.
// const BAR_STYLE = 'position: absolute;';

/** @public */
export class Scroller<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> implements RevgridObject {
    readonly bar: HTMLDivElement;
    readonly barCssClass: string;

    /**
     * @summary Callback for scroll events.
     * @desc Set by the constructor via the similarly named property in the {@link finbarOptions} object. After instantiation, `this.onchange` may be updated directly.
     *
     * This event handler is called whenever the value of the scrollbar is changed through user interaction. The typical use case is when the content is scrolled. It is called with the `FinBar` object as its context and the current value of the scrollbar (its index, rounded) as the only parameter.
     *
     * Set this property to `null` to stop emitting such events.
     */
    actionEventer: Scroller.ActionEventer;
    visibilityChangedEventer: Scroller.VisibilityChangedEventer;

    /**
     * @summary The generated scrollbar thumb element.
     * @desc The thumb element's parent element is always the {@link Scroller#bar|bar} element.
     *
     * This property is typically referenced internally only. The size and position of the thumb element is maintained by `_calcThumb()`.
     */
    private _thumb: HTMLDivElement;
    /**
     * @readonly
     * @summary <u>O</u>rientation <u>h</u>ash for this scrollbar.
     * @desc Set by the `orientation` setter to either the vertical or the horizontal orientation hash. The property should always be synchronized with `orientation`; do not update directly!
     *
     * This object is used internally to access scrollbars' DOM element properties in a generalized way without needing to constantly query the scrollbar orientation. For example, instead of explicitly coding `this.bar.top` for a vertical scrollbar and `this.bar.left` for a horizontal scrollbar, simply code `this.bar[this.oh.leading]` instead. See the {@link orientationHashType} definition for details.
     *
     * This object is useful externally for coding generalized {@link finbarOnChange} event handler functions that serve both horizontal and vertical scrollbars.
     */
    private readonly _axisProperties: AxisProperties;
    /**
     * @summary The name of the `WheelEvent` property this scrollbar should listen to.
     * @desc Set by the constructor. See the similarly named property in the {@link finbarOptions} object.
     *
     * Useful values are `'deltaX'`, `'deltaY'`, or `'deltaZ'`. A value of `null` means to ignore mouse wheel events entirely.
     *
     * The mouse wheel is one-dimensional and only emits events with `deltaY` data. This property is provided so that you can override the default of `'deltaX'` with a value of `'deltaY'` on your horizontal scrollbar primarily to accommodate certain "panoramic" interface designs where the mouse wheel should control horizontal rather than vertical scrolling. Just give `{ deltaProp: 'deltaY' }` in your horizontal scrollbar instantiation.
     *
     * Caveat: Note that a 2-finger drag on an Apple trackpad emits events with _both_ `deltaX ` and `deltaY` data so you might want to delay making the above adjustment until you can determine that you are getting Y data only with no X data at all (which is a sure bet you on a mouse wheel rather than a trackpad).
     */
    private readonly _deltaProp: Scroller.DeltaProp;

    /**
     * @summary Maximum offset of thumb's leading edge.
     * @desc This is the pixel offset within the scrollbar of the thumb when it is at its maximum position at the extreme end of its range.
     *
     * This value takes into account the newly calculated size of the thumb element (including its margins) and the inner size of the scrollbar (the thumb's containing element, including _its_ margins).
     *
     * NOTE: Scrollbar padding is not taken into account and assumed to be 0 in the current implementation and is assumed to be `0`; use thumb margins in place of scrollbar padding.
     */
    private _thumbMax: number;
    private _thumbMarginLeading: number;
    private _thumbScaling: number;
    private _pinOffset: number;

    private _pointerOverThumb = false;
    private _temporaryThumbFullVisibilityTimePeriod: number | undefined; // milliseconds
    private _temporaryThumbFullVisibilityTimeoutId: ReturnType<typeof setTimeout> | undefined;
    private _pointerScrollingState = Scroller.PointerScrollingState.Inactive;
    private _viewLayoutTrackingActive = false;
    private _thumbVisibilityState = ThumbVisibilityState.Reduced;
    /**
     * Wheel metric normalization, applied equally to all three axes.
     *
     * This value is overridden with a platform- and browser-specific wheel factor when available in {@link Scroller.normals}.
     *
     * To suppress, delete `FinBar.normals` before instantiation or override this instance variable (with `1.0`) after instantiation.
     */
    // normal: number;

    private readonly _settingsChangedListener = () => this.applySettings();
    private readonly _hostWheelListener = (event: WheelEvent) => this.handleHostWheelEvent(event);
    private readonly _barClickListener = (event: MouseEvent) => this.handleBarClickEvent(event);
    private readonly _thumbClickListener = (event: MouseEvent) => this.handleThumbClickEvent(event);
    private readonly _thumbPointerEnterListener = () => this.handleThumbPointerEnterEvent();
    private readonly _thumbPointerLeaveListener = () => this.handleThumbPointerLeaveEvent();
    private readonly _thumbTransitionEndListener = () => this.handleThumbTransitionEndEvent();
    private readonly _barPointerDownListener = (event: PointerEvent) => this.handleBarPointerDownEvent(event);
    private _barPointerMoveListener: Scroller.PointerEventListener | undefined;
    private _barPointerUpListener: Scroller.PointerEventListener | undefined;
    private _barPointerCancelListener: Scroller.PointerEventListener | undefined;

    /**
     * @name increment
     * @summary Number of scrollbar index units representing a pageful. Used exclusively for paging up and down and for setting thumb size relative to content size.
     * @desc Set by the constructor. See the similarly named property in the {@link finbarOptions} object.
     *
     * Can also be given as a parameter to the {@link Scroller#resize|resize} method, which is pertinent because content area size changes affect the definition of a "pageful." However, you only need to do this if this value is being used. It not used when:
     * * you define `paging.up` and `paging.down`
     * * your scrollbar is using `scrollRealContent`
     */
    private increment: number;

    /**
     * Default value of multiplier for `WheelEvent#deltaX` (horizontal scrolling delta).
     * Not used
     */
    private deltaXFactor: number;

    /**
     * Default value of multiplier for `WheelEvent#deltaY` (vertical scrolling delta).
     * Not used
     */
    private deltaYFactor: number;

    /**
     * Default value of multiplier for `WheelEvent#deltaZ` (delpth scrolling delta).
     * Not used
     */
    private deltaZFactor: number;

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
     */
    constructor(
        readonly revgridId: string,
        readonly internalParent: RevgridObject,
        private readonly _gridSettings: BGS,
        private readonly _hostElement: HTMLElement, // Revgrid host element
        private readonly _scrollDimension: ScrollDimension<BGS>,
        private readonly _viewLayout: ViewLayout<BGS, BCS, SF>,
        private readonly _indexMode: boolean, // legacy - remove when vertical scrollbar is updated to use viewport
        private readonly axis: ScrollDimension.Axis,
        private _trailing: boolean, // true: right/bottom of canvas, false: otherwise left/top of canvas
        deltaXFactor: number,
        deltaYFactor: number,
        classPrefix: string,
        private readonly _spaceAccomodatedScroller: Scroller<BGS, BCS, SF> | undefined,
    ) {
        this._axisProperties = axesProperties[this.axis];

        const thumb = document.createElement('div');
        this._thumb = thumb;
        thumb.id = `${revgridId}-${CssClassName.gridHostElementCssIdBase}-${axis}-${Scroller.thumbElementIdBase}`;
        thumb.style.position = 'absolute';

        thumb.classList.add(Scroller.thumbCssClass);
        thumb.addEventListener('click', this._thumbClickListener);
        thumb.addEventListener('pointerenter', this._thumbPointerEnterListener);
        thumb.addEventListener('pointerleave', this._thumbPointerLeaveListener);
        thumb.addEventListener('transitionend', this._thumbTransitionEndListener);

        const bar = document.createElement('div');
        this.bar = bar;
        bar.id = `${revgridId}-${CssClassName.gridHostElementCssIdBase}-${axis}-${Scroller.barElementIdBase}`;
        bar.style.position = 'absolute';
        const leadingKey = this._axisProperties['leading'];
        bar.style.setProperty(leadingKey, '0');
        const trailingKey = this._axisProperties['trailing'];
        bar.style.setProperty(trailingKey, '0');
        bar.addEventListener('pointerdown', this._barPointerDownListener);
        bar.addEventListener('click', this._barClickListener);
        bar.appendChild(thumb);

        this.setAfterInsideOffset(Scroller.defaultInsideOffset);

        this.applySettings();

        this._hostElement.addEventListener('wheel', this._hostWheelListener);
        // presets
        this.axis = axis;
        this.barCssClass = `${axis}-${Scroller.barCssClassBase}`;
        bar.classList.add(this.barCssClass);
        this._deltaProp = this._axisProperties.delta;
        this.increment = 1;
        this._deltaProp = (this.axis === 'vertical' ? Scroller.DeltaPropEnum.deltaY : Scroller.DeltaPropEnum.deltaX);
        this.deltaXFactor = deltaXFactor;
        this.deltaYFactor = deltaYFactor;
        this.deltaZFactor = 1;

        this._gridSettings.subscribeChangedEvent(this._settingsChangedListener);

        this._scrollDimension.changedEventer = () => this.resize();
        this._scrollDimension.scrollerTargettedViewportStartChangedEventer = () => {
            if (this._pointerScrollingState !== Scroller.PointerScrollingState.Active) {
                this.setThumbPosition(this._scrollDimension.viewportStart);
            }
        }

        if (this._spaceAccomodatedScroller !== undefined) {
            this._spaceAccomodatedScroller.visibilityChangedEventer = () => this.resize();
        }

        this._hostElement.appendChild(bar);
    }

    /**
     * @summary Remove the scrollbar.
     * @desc Unhooks all the event handlers and then removes the element from the DOM. Always call this method prior to disposing of the scrollbar object.
     */
    destroy() {
        this._hostElement.removeEventListener('wheel', this._hostWheelListener);

        this._gridSettings.unsubscribeChangedEvent(this._settingsChangedListener);
        this.bar.removeEventListener('click', this._barClickListener);
        this.bar.removeEventListener('pointerdown', this._barPointerDownListener);
        this._thumb.removeEventListener('click', this._thumbClickListener);
        this._thumb.removeEventListener('pointerenter', this._thumbPointerEnterListener);
        this._thumb.removeEventListener('pointerleave', this._thumbPointerLeaveListener);
        this._thumb.removeEventListener('transitionend', this._thumbTransitionEndListener);

        this.cancelTemporaryThumbFullVisibilityTimeout();

        this.bar.remove();
    }

    get trailing() { return this._trailing; }

    /**
     * @summary The scrollbar orientation.
     * @desc Set by the constructor to either `'vertical'` or `'horizontal'`. See the similarly named property in the {@link finbarOptions} object.
     *
     * Useful values are `'vertical'` (the default) or `'horizontal'`.
     *
     * Setting this property resets `this.oh` and `this.deltaProp` and changes the class names so as to reposition the scrollbar as per the CSS rules for the new orientation.
     */
    // set orientation(orientation: Scroller.Orientation) {
    //     if (orientation === this._orientation) {
    //         return;
    //     }

    //     this._orientation = orientation;

    //     this._orientationHash = orientationHashes[this._orientation];

    //     if (!this._orientationHash) {
    //         error('Invalid value for `options._orientation.');
    //     }

    //     this._deltaProp = this._orientationHash.delta;

    //     this.bar.className = this.bar.className.replace(/(vertical|horizontal)/g, orientation);

    //     if (this.bar.style.cssText !== BAR_STYLE || this._thumb.style.cssText !== THUMB_STYLE) {
    //         this.bar.setAttribute('style', BAR_STYLE);
    //         this._thumb.setAttribute('style', THUMB_STYLE);
    //         this.resize();
    //     }
    // }

    // get orientation() {
    //     return this._orientation;
    // }

    /**
     * @name style
     * @summary Additional scrollbar styles.
     * @desc See type definition for more details. These styles are applied directly to the scrollbar's `bar` element.
     *
     * Values are adjusted as follows before being applied to the element:
     * 1. Included "pseudo-property" names from the scrollbar's orientation hash, {@link Scroller#_axisProperties|oh}, are translated to actual property names before being applied.
     * 2. When there are margins, percentages are translated to absolute pixel values because CSS ignores margins in its percentage calculations.
     * 3. If you give a value without a unit (a raw number), "px" unit is appended.
     *
     * General notes:
     * 1. It is always preferable to specify styles via a stylesheet. Only set this property when you need to specifically override (a) stylesheet value(s).
     * 2. Can be set directly or via calls to the {@link Scroller#resize|resize} method.
     * 3. Should only be set after the scrollbar has been inserted into the DOM.
     * 4. Before applying these new values to the element, _all_ in-line style values are reset (by removing the element's `style` attribute), exposing inherited values (from stylesheets).
     * 5. Empty object has no effect.
     * 6. Falsey value in place of object has no effect.
     *
     * > CAVEAT: Do not attempt to treat the object you assign to this property as if it were `this.bar.style`. Specifically, changing this object after assigning it will have no effect on the scrollbar. You must assign it again if you want it to have an effect.
     *
     * @see {@link Scroller#barStyles|barStyles}
     */
    // set style(styles: Scroller.BarStyles) {
    //     styles = extend({}, styles, this._spaceAccomodatedScrollerVisibilityStyles)
    //     const keys = Object.keys(styles);

    //     if (keys.length) {
    //         const bar = this.bar;
    //         const barRect = bar.getBoundingClientRect();
    //         const container = /*this.container ||*/ bar.parentElement;
    //         if (container === null) {
    //             throw new AssertError('F23334');
    //         } else {
    //             const containerRect = container.getBoundingClientRect();
    //             const oh = this._orientationHash;

    //             // Before applying new styles, revert all styles to values inherited from stylesheets
    //             bar.setAttribute('style', BAR_STYLE);

    //             keys.forEach((key) => {
    //                 let val = styles[key];

    //                 if (key in oh) {
    //                     key = oh[key as keyof OrientationHash];
    //                 }

    //                 if (!isNaN(Number(val))) {
    //                     val = (val || 0) + 'px';
    //                 } else if (/%$/.test(val)) {
    //                     // When bar size given as percentage of container, if bar has margins, restate size in pixels less margins.
    //                     // (If left as percentage, CSS's calculation will not exclude margins.)
    //                     const oriented = axis[key as keyof typeof axis];
    //                     const margins = barRect[(oriented.marginLeading)] + barRect[(oriented.marginTrailing)];
    //                     if (margins) {
    //                         val = parseInt(val, 10) / 100 * containerRect[oriented.size] - margins + 'px';
    //                     }
    //                 }

    //                 bar.style.setProperty(key, val);
    //             });
    //         }
    //     }
    // }

    /**
     * @summary Index value of the scrollbar.
     * @desc This is the position of the scroll thumb.
     *
     * Setting this value clamps it to {@link Scroller#min|min}..{@link Scroller#max|max}, scroll the content, and moves thumb.
     *
     * Getting this value returns the current index. The returned value will be in the range `min`..`max`. It is intentionally not rounded.
     *
     * Use this value as an alternative to (or in addition to) using the {@link Scroller#onchange|onchange} callback function.
     *
     * @see {@link Scroller#setThumbPosition|_setScroll}
     */
    set index(idx: number | undefined) {
        if (idx !== undefined) {
            idx = Math.min(this._scrollDimension.finish, Math.max(this._scrollDimension.start, idx)); // clamp it
            this.setThumbPosition(idx);
        // this._setThumbSize();
        }
    }
    get index() {
        return this._scrollDimension.viewportStart;
    }

    get hidden() {
        return this.bar.style.visibility === 'hidden'
    }

    get thickness() {
        return this.bar[this._axisProperties.thickness];
    }

    get insideOverlap() {
        const crossLeadingPropertyKey = this._axisProperties.crossLeading;
        const crossOffsetLeadingPropertyKey = this._axisProperties.crossOffsetLeading;
        const thicknessPropertyKey = this._axisProperties.thickness;
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

    private applySettings() {
        this._thumb.style.backgroundColor = this._gridSettings.scrollerThumbColor;
        this._thumb.style.opacity = this._gridSettings.scrollerThumbReducedVisibilityOpacity.toString(10);
    }


    // scrollBy(delta: number) {
    //     const viewportStart = this._scrollDimension.viewportStart;
    //     if (viewportStart !== undefined) {
    //         // make sure does not go beyond end edge
    //         let newViewportStart = viewportStart + delta;
    //         if (newViewportStart < this._scrollDimension.start) {
    //             newViewportStart = this._scrollDimension.start;
    //         } else {
    //             const viewportNext = newViewportStart + this._scrollDimension.viewportSize;
    //             if (viewportNext > this._scrollDimension.after) {
    //                 newViewportStart = this._scrollDimension.after - this._scrollDimension.viewportSize;
    //             }
    //         }
    //         this.setThumbPosition(newViewportStart);
    //     }
    // }

    // scrollIndexBy(delta: number) {
    //     const viewportStart = this._scrollDimension.viewportStart;
    //     if (viewportStart !== undefined) {
    //         // same as scroll(). Separate call for VScroller. Remove when VScroller uses Viewport
    //         this.index = viewportStart + delta;
    //     }
    // }

    /**
     * @summary Move the thumb.
     * @desc Also displays the index value in the test panel and invokes the callback.
     * @param viewportStart - The new scroll index, a value in the range `min`..`max`.
     * @param barPosition - The new thumb position in pixels and scaled relative to the containing {@link Scroller#bar|bar} element, i.e., a proportional number in the range `0`..`thumbMax`.
     */
    private setThumbPosition(viewportStart: number | undefined) {
        if (this._scrollDimension.scrollable && viewportStart !== undefined) {
            // Move the thumb
            let thumbPosition: number;
            if (this._indexMode) {
                thumbPosition = (viewportStart - this._scrollDimension.start) / (this._scrollDimension.finish - this._scrollDimension.start) * this._thumbMax;
            } else {
                thumbPosition = (viewportStart - this._scrollDimension.start) * this._thumbScaling;
            }
            this._thumb.style[this._axisProperties.leading] = thumbPosition.toString(10) + 'px';
            // this._currentThumbPosition = thumbPosition;
        }
    }

    /**
     * @summary Sets the proportional thumb size and hides thumb when 100%.
     * @desc The thumb size has an absolute minimum of 20 (pixels).
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
            this._thumbScaling = barSize / this._scrollDimension.size;
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

    private handleThumbClickEvent(evt: MouseEvent) {
        evt.stopPropagation();
    }

    private handleHostWheelEvent(evt: WheelEvent) {
        const index = this.index;
        if (index !== undefined) {
            this.index = index + evt[this._deltaProp] * this.getDeltaPropFactor() /* * this.normal */;
            evt.stopPropagation();
            evt.preventDefault();
        }
    }

    private getDeltaPropFactor() {
        switch (this._deltaProp) {
            case 'deltaX': return this.deltaXFactor;
            case 'deltaY': return this.deltaYFactor;
            case 'deltaZ': return this.deltaXFactor;
            default:
                throw new UnreachableCaseError('SGDPF23330', this._deltaProp);
        }
    }

    private handleBarClickEvent(evt: MouseEvent) {
        if (this._pointerScrollingState === Scroller.PointerScrollingState.ClickWaiting) {
            this.updatePointerScrolling(Scroller.PointerScrollingState.Inactive, undefined);
        } else {
            const index = this.index;
            if (index !== undefined) {
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

    private handleThumbPointerEnterEvent() {
        this._thumb.classList.add('hover');
        this._pointerOverThumb = true;
        this.updateThumbVisibility();
    }

    private handleThumbPointerLeaveEvent() {
        this._thumb.classList.remove('hover');
        this._pointerOverThumb = false;
        this.updateThumbVisibility();
    }

    private handleThumbTransitionEndEvent() {
        if (this._thumbVisibilityState === ThumbVisibilityState.ToFullTransitioning) {
            this._thumbVisibilityState = ThumbVisibilityState.Full;
            this.updateThumbVisibility();
        }
    }

    private handleBarPointerDownEvent(event: PointerEvent) {
        this.updatePointerScrolling(Scroller.PointerScrollingState.Armed, event);

        event.stopPropagation();
        event.preventDefault();
    }

    private handleBarPointerMoveEvent(evt: PointerEvent) {
        this.updatePointerScrolling(Scroller.PointerScrollingState.Active, evt);

        // if (!(evt.buttons & 1)) {
        //     // mouse button may have been released without `onmouseup` triggering (see
        //     window.dispatchEvent(new MouseEvent('mouseup', evt));
        //     return;
        // }

        let thumbPosition: number | undefined;
        let possiblyFractionalViewportStart: number;

        if (this._indexMode) {
            thumbPosition = Math.min(this._thumbMax, Math.max(0, evt[this._axisProperties.page] - this._pinOffset));
            possiblyFractionalViewportStart = thumbPosition / this._thumbMax * (this._scrollDimension.finish - this._scrollDimension.start) + this._scrollDimension.start;
        } else {
            thumbPosition = evt[this._axisProperties.page] - this._pinOffset;
            if (thumbPosition < 0) {
                // make sure does not go beyond start edge
                thumbPosition = 0;
            } else {
                if (thumbPosition > this._thumbMax) {
                    thumbPosition = this._thumbMax;
                }
            }
            possiblyFractionalViewportStart = thumbPosition / this._thumbScaling + this._scrollDimension.start;

            // // make sure does not go beyond end edge
            // const viewportNext = viewportStart + this._scrollDimension.viewportSize;
            // if (viewportNext > this._scrollDimension.after) {
            //     viewportStart = this._scrollDimension.after - this._scrollDimension.viewportSize;
            //     barPosition = undefined;
            // }
        }

        const viewportStart = Math.round(possiblyFractionalViewportStart);
        // if (viewportStart === this._scrollDimension.viewportStart) {
        //     if (thumbPosition < this._currentThumbPosition) {
        //         viewportStart--;
        //     } else {
        //         if (viewportStart > this._currentThumbPosition) {
        //             viewportStart++;
        //         }
        //     }
        // }
        // this._currentThumbPosition = thumbPosition;

        this.setThumbPosition(viewportStart);

        const action: Scroller.Action = {
            type: Scroller.Action.TypeEnum.newViewportStart,
            viewportStart,
        };

        this.actionEventer(action);

        // this._setScroll(viewportStart, barPosition, true);

        evt.stopPropagation();
        evt.preventDefault();
    }

    private handleBarPointerUpCancelEvent(event: PointerEvent) {
        this.updatePointerScrolling(Scroller.PointerScrollingState.Inactive, event)

        event.stopPropagation();
        event.preventDefault();
    }

    private resize() {
        const leadingTrailing = this.calculateLeadingTrailingForSpaceAccomodatedScroller();
        for (const key in leadingTrailing) {
            const value = leadingTrailing[key];
            if (value !== undefined) {
                this.bar.style.setProperty(key, value);
            }
        }

        if (this._indexMode) {
            const index = this.index;
            this.index = index; // re-clamp
        } else {
            this.setThumbSize();
            this.setThumbPosition(this._scrollDimension.viewportStart);
        }
    }

    private calculateLeadingTrailingForSpaceAccomodatedScroller(): LeadingTrailing {
        const leadingTrailing: LeadingTrailing = {};
        const leadingKey = this._axisProperties['leading'];
        const trailingKey = this._axisProperties['trailing'];
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
                        this._pointerScrollingState = Scroller.PointerScrollingState.Armed;
                        if (event === undefined) {
                            throw new AssertError('SUPSIA50521')
                        } else {
                            this.armPointerScrolling(event);
                        }
                        this._pointerScrollingState = Scroller.PointerScrollingState.Active;
                        this.activatePointerScrolling();
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
                        this._pointerScrollingState = Scroller.PointerScrollingState.Active;
                        this.activatePointerScrolling();
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
                            this.activatePointerScrolling();
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

    private armPointerScrolling(event: PointerEvent) {
        const thumbBox = this._thumb.getBoundingClientRect();
        this._pinOffset = event[this._axisProperties.page] - thumbBox[this._axisProperties.leading] + this.bar.getBoundingClientRect()[this._axisProperties.leading] + this._thumbMarginLeading;
        document.documentElement.style.cursor = 'default';

        this._barPointerMoveListener = (moveEvent) => this.handleBarPointerMoveEvent(moveEvent);
        this.bar.addEventListener('pointermove', this._barPointerMoveListener);
        this._barPointerUpListener = (upEvent: PointerEvent) => this.handleBarPointerUpCancelEvent(upEvent)
        this.bar.addEventListener('pointerup', this._barPointerUpListener);
        this._barPointerCancelListener = (cancelEvent: PointerEvent) => this.handleBarPointerUpCancelEvent(cancelEvent)
        this.bar.addEventListener('pointercancel', this._barPointerCancelListener);
        this.bar.setPointerCapture(event.pointerId);

        this.updateThumbVisibility();
    }

    activatePointerScrolling() {
        this._viewLayout.beginUiControlTracking();
        this._viewLayoutTrackingActive = true;
        this.updateThumbVisibility();
    }

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

        this.bar.releasePointerCapture(event.pointerId);

        if (this._viewLayoutTrackingActive) {
            this._viewLayout.endUiControlTracking();
            this._viewLayoutTrackingActive = false;
        }

        document.documentElement.style.cursor = 'auto';

        this.updateThumbVisibility();
        this.setThumbPosition(this._scrollDimension.viewportStart);
    }

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
                            () => this.handleTemporaryThumbFullVisibilityTimeout(),
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

    private wantThumbFullVisibility() {
        return (
            this._pointerOverThumb ||
            this._pointerScrollingState === Scroller.PointerScrollingState.Armed ||
            this._pointerScrollingState === Scroller.PointerScrollingState.Active ||
            this._temporaryThumbFullVisibilityTimePeriod !== undefined
        );
    }

    private isThumbVisibilityTransitionSpecified() {
        return this._thumb.style.transition.includes('opacity');
    }

    private handleTemporaryThumbFullVisibilityTimeout() {
        this._temporaryThumbFullVisibilityTimePeriod = undefined;
        this.updateThumbVisibility();
    }

    private cancelTemporaryThumbFullVisibilityTimeout() {
        if (this._temporaryThumbFullVisibilityTimeoutId !== undefined) {
            clearTimeout(this._temporaryThumbFullVisibilityTimeoutId);
            this._temporaryThumbFullVisibilityTimeoutId = undefined;
        }
    }
}

/** @public */
export namespace Scroller {
    export const barCssClassBase = 'scroller';
    export const thumbCssClass = 'thumb';
    export const barElementIdBase = 'scroller-bar';
    export const thumbElementIdBase = 'scroller-thumb';

    export const defaultInsideOffset = 3;

    export interface Action {
        readonly type: Action.TypeEnum;
        readonly viewportStart: number | undefined;
    }

    export namespace Action {
        export const enum TypeEnum {
            StepForward,
            StepBack,
            PageForward,
            PageBack,
            newViewportStart,
        }
    }

    export interface Options {
        indexMode?: boolean;
        deltaProp?: DeltaProp;
        deltaXFactor?: number;
        deltaYFactor?: number;
        deltaZFactor?: number;
        classPrefix?: string;
    }

    export const enum DeltaPropEnum {
        deltaX = 'deltaX',
        deltaY = 'deltaY',
        deltaZ = 'deltaZ',
    }
    export type DeltaProp = keyof typeof DeltaPropEnum;

    export type ActionEventer = (this: void, action: Scroller.Action) => void;
    export type VisibilityChangedEventer = (this: void) => void;
    export type PointerEventListener = (event: PointerEvent) => void;

    export const enum PointerScrollingState {
        Inactive,
        Armed,
        Active,
        ClickWaiting,
    }
}

// function extend(obj: Record<string, string>, styles: Record<string, string> | undefined, auxStyles: Record<string, string> | undefined) {
//     if (styles !== undefined) {
//         for (const key in styles) {
//             obj[key] = styles[key];
//         }
//     }
//     if (auxStyles !== undefined) {
//         for (const key in auxStyles) {
//             obj[key] = auxStyles[key];
//         }
//     }
//     return obj;
// }

/**
 * Table of wheel normals to webkit.
 *
 * This object is a dictionary of platform dictionaries, keyed by:
 * * `mac` — macOS
 * * `win` — Window
 *
 * Each platform dictionary is keyed by:
 * * `webkit` — Chrome, Opera, Safari
 * * `moz` — Firefox
 * * `ms` — IE 11 _(Windows only)_
 * * `edge` — Edge _(Windows only)_
 *
 * @todo add `linux` platform
 */

// interface Browser {
//     [browser: string]: number;
//     webkit: number;
//     moz: number;
//     edge?: number;
// }
// interface Normals {
//     [browser: string]: Browser;
//     mac: Browser;
//     win: Browser;
// }

// const defaultNormal = 1.0;

// const normals: Normals = {
//     mac: {
//         webkit: 1.0,
//         moz: 35
//     },
//     win: {
//         webkit: 2.6,
//         moz: 85,
//         edge: 2
//     }
// };

// function getNormal() {
//     const nav = window.navigator;
//     const ua = nav.userAgent;
//     const platform = nav.platform.substr(0, 3).toLowerCase();
//     const browser: keyof Browser = /Edge/.test(ua) ? 'edge' :
//         /Opera|OPR|Chrome|Safari/.test(ua) ? 'webkit' :
//             /Firefox/.test(ua) ? 'moz' :
//                 undefined;
//     const platformDictionary = normals[platform];
//     if (platformDictionary === undefined) {
//         return defaultNormal;
//     } else {
//         const normalVersion = platformDictionary[browser];
//         if (normalVersion === undefined) {
//             return defaultNormal;
//         } else {
//             return normalVersion;
//         }
//     }
// }

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
    thickness: 'offsetWidth' | 'offsetHeight';
    delta: Scroller.DeltaProp;
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
        thickness:          'offsetWidth',
        delta:              'deltaY'
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
        thickness:          'offsetHeight',
        delta:              'deltaX'
    }
};

// const axis = {
//     top:    orientationHashes.vertical,
//     bottom: orientationHashes.vertical,
//     height: orientationHashes.vertical,
//     left:   orientationHashes.horizontal,
//     right:  orientationHashes.horizontal,
//     width:  orientationHashes.horizontal
// };

const enum LeadingTrailingKey {
    left,
    top,
    right,
    bottom,
}

type LeadingTrailing = {
    -readonly [key in keyof typeof LeadingTrailingKey]?: string;
}

export const enum ThumbVisibilityState {
    Reduced,
    ToFullTransitioning,
    Full,
}
