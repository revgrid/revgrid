import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { UnreachableCaseError } from '../../types-utils/revgrid-error';
import { numberToPixels } from '../../types-utils/utils';
import { ScrollDimension } from '../view/scroll-dimension';

// Following is the sole style requirement for bar and thumb elements.
// Maintained in code so not dependent being in stylesheet.
// const BAR_STYLE = 'position: absolute;';

/** @public */
export class Scroller<BGS extends BehavioredGridSettings> {
    readonly bar: HTMLDivElement;

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

    private readonly _classPrefix: string;

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
    private _dragging = false;
    private _dragged = false;
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
    private readonly _barPointerMoveListener = (event: PointerEvent) => this.handleBarPointerMoveEvent(event);
    private readonly _barPointerUpListener = (event: PointerEvent) => this.handleBarPointerUpEvent(event);

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
        private readonly _gridSettings: BGS,
        private readonly _hostElement: HTMLElement, // Revgrid host element
        private readonly _scrollDimension: ScrollDimension<BGS>,
        instanceId: number,
        private readonly _indexMode: boolean, // legacy - remove when vertical scrollbar is updated to use viewport
        private readonly axis: ScrollDimension.Axis,
        private _trailing: boolean, // true: right/bottom of canvas, false: otherwise left/top of canvas
        deltaXFactor: number,
        deltaYFactor: number,
        classPrefix: string | undefined,
        private readonly _spaceAccomodatedScroller: Scroller<BGS> | undefined,
    ) {
        this._axisProperties = axesProperties[this.axis];

        const thumb = document.createElement('div');
        this._thumb = thumb;
        thumb.id = axis + Scroller.thumbElementIdBase + instanceId.toString(10);
        thumb.style.position = 'absolute';

        thumb.classList.add('thumb');
        thumb.addEventListener('click', this._thumbClickListener);
        thumb.addEventListener('pointerenter', this._thumbPointerEnterListener);
        thumb.addEventListener('pointerleave', this._thumbPointerLeaveListener);
        thumb.addEventListener('transitionend', this._thumbTransitionEndListener);

        const bar = document.createElement('div');
        this.bar = bar;
        bar.id = axis + Scroller.barElementIdBase + instanceId.toString();
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
        if (classPrefix === undefined || classPrefix === '') {
            this._classPrefix = Scroller.defaultClassPrefix;
        } else {
            this._classPrefix = classPrefix;
        }
        bar.classList.add(`${this._classPrefix}-${axis}`);
        this._deltaProp = this._axisProperties.delta;
        this.increment = 1;
        this._deltaProp = (this.axis === 'vertical' ? Scroller.DeltaPropEnum.deltaY : Scroller.DeltaPropEnum.deltaX);
        this.deltaXFactor = deltaXFactor;
        this.deltaYFactor = deltaYFactor;
        this.deltaZFactor = 1;

        this._gridSettings.subscribeChangedEvent(this._settingsChangedListener);

        this._scrollDimension.changedEventer = () => {
            this.resize();

            if (this._indexMode) {
                const index = this.index;
                this.index = index; // re-clamp
            } else {
                this.setThumbSize();
            }
        }

        this._scrollDimension.scrollerTargettedViewportStartChangedEventer = () => this.setThumbPositionFromViewportSize();

        if (this._spaceAccomodatedScroller !== undefined) {
            this._spaceAccomodatedScroller.visibilityChangedEventer = () => this.adjustLeadingTrailingForSpaceAccomodatedScroller();
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
            // Must be trailing
            return this.bar.offsetParent[thicknessPropertyKey] - this.bar[crossOffsetLeadingPropertyKey];
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

    // scrollRealContent(idx: number) {
    //     const containerRect = this.content.parentElement.getBoundingClientRect();
    //     const sizeProp = this.oh.size;
    //     const maxScroll = Math.max(0, this.content[sizeProp] - containerRect[sizeProp]);
    //     //scroll = Math.min(idx, maxScroll);
    //     const scroll = (idx - this._min) / (this._max - this._min) * maxScroll;
    //     //console.log('scroll: ' + scroll);
    //     this.content.style[this.oh.leading] = -scroll + 'px';
    // }

    /**
     * @summary Recalculate thumb position.
     *
     * @desc This method recalculates the thumb size and position. Call it once after inserting your scrollbar into the DOM, and repeatedly while resizing the scrollbar (which typically happens when the scrollbar's parent is resized by user.
     *
     * > This function shifts args if first arg omitted.
     *
     * @param {number} [increment=this.increment] - Resets {@link FooBar#increment|increment} (see).
     *
     * @param {finbarStyles} [barStyles=this.barStyles] - (See type definition for details.) Scrollbar styles to be applied to the bar element.
     *
     * Only specify a `barStyles` object when you need to override stylesheet values. If provided, becomes the new default (`this.barStyles`), for use as a default on subsequent calls.
     *
     * It is generally the case that the scrollbar's new position is sufficiently described by the current styles. Therefore, it is unusual to need to provide a `barStyles` object on every call to `resize`.
     *
     * @returns Self for chaining.
     */
    private resize() {
        // const bar = this.bar;

        // if (!bar.parentNode) {
        //     return undefined; // not in DOM yet so nothing to do
        // }

        // const container = /* this.container ||*/ bar.parentElement;
        // const containerRect = container.getBoundingClientRect();

        // shift args if if 1st arg omitted
        // let increment: number | undefined;
        // if (typeof incrementOrBarStyles === 'object') {
        //     barStyles = incrementOrBarStyles;
        //     increment = undefined;
        // } else {
        //     increment = incrementOrBarStyles;
        // }

        // this.barStyles = (barStyles ?? this.barStyles);
        // this.style = this.barStyles;
        // this.style = {}; // update height/width from any shorten

        // Bound to real content: Content was given but no onchange handler.
        // Set up .onchange, .containerSize, and .increment.
        // Note this only makes sense if your index unit is pixels.
        // if (this.content) {
        //     if (!this.onchange) {
        //         this.onchange = this.scrollRealContent;
        //         this.contentSize = this.content[this.oh.size];
        //         this._min = 0;
        //         this._max = this.contentSize - 1;
        //     }
        // }
        // if (this.onchange === this.scrollRealContent) {
        //     this.containerSize = containerRect[this.oh.size];
        //     this.increment = this.containerSize / (this.contentSize - this.containerSize) * (this._max - this._min);
        // } else {
            // this._scrollDimension.viewportSize = 1;
            // this.increment = increment || this.increment;
        // }

        // if (this._indexMode) {
        //     this._scrollDimension.viewportSize = 1;
        // }

        this.adjustLeadingTrailingForSpaceAccomodatedScroller();
        const index = this.index;
        this.setThumbSize();
        if (this._indexMode) {
            this.index = index;
        }
    }

    private setThumbPositionFromViewportSize() {
        const viewportStart = this._scrollDimension.viewportStart;
        this.setThumbPosition(viewportStart);
    }

    /**
     * @summary Move the thumb.
     * @desc Also displays the index value in the test panel and invokes the callback.
     * @param viewportStart - The new scroll index, a value in the range `min`..`max`.
     * @param barPosition - The new thumb position in pixels and scaled relative to the containing {@link Scroller#bar|bar} element, i.e., a proportional number in the range `0`..`thumbMax`.
     */
    private setThumbPosition(viewportStart: number | undefined) {
        if (viewportStart !== undefined) {
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
        if (this._scrollDimension.overflowed === true) {
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
            this.index = index + evt[this._deltaProp] * this[this._deltaProp + 'Factor'] /* * this.normal */;
            evt.stopPropagation();
            evt.preventDefault();
        }
    }

    private handleBarClickEvent(evt: MouseEvent) {
        if (!this._dragged) {
            this._dragged = false;
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
        const thumbBox = this._thumb.getBoundingClientRect();
        this._pinOffset = event[this._axisProperties.page] - thumbBox[this._axisProperties.leading] + this.bar.getBoundingClientRect()[this._axisProperties.leading] + this._thumbMarginLeading;
        document.documentElement.style.cursor = 'default';

        this.bar.addEventListener('pointermove', this._barPointerMoveListener);
        this.bar.addEventListener('pointerup', this._barPointerUpListener);
        this.bar.setPointerCapture(event.pointerId);

        this._dragging = false;
        this._dragged = false;
        this.updateThumbVisibility();

        event.stopPropagation();
        event.preventDefault();
    }

    private handleBarPointerMoveEvent(evt: PointerEvent) {
        this._dragging = true;
        this.updateThumbVisibility();

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

        const action: Scroller.Action = {
            type: Scroller.Action.TypeEnum.newViewportStart,
            viewportStart,
        };

        this.actionEventer(action);

        // this._setScroll(viewportStart, barPosition, true);

        evt.stopPropagation();
        evt.preventDefault();
    }

    private handleBarPointerUpEvent(event: PointerEvent) {
        this.bar.removeEventListener('pointermove', this._barPointerMoveListener);
        this.bar.removeEventListener('pointerup', this._barPointerUpListener);
        this.bar.releasePointerCapture(event.pointerId);

        if (this._dragging) {
            this._dragging = false;
            this._dragged = true;
            this.updateThumbVisibility();
        }

        document.documentElement.style.cursor = 'auto';

        const thumbBox = this._thumb.getBoundingClientRect();
        if (
            thumbBox.left <= event.clientX && event.clientX <= thumbBox.right &&
            thumbBox.top <= event.clientY && event.clientY <= thumbBox.bottom
        ) {
            // this.handleThumbPointerEnterEvent();
        } else {
            // this.handleThumbPointerLeaveEvent();
        }

        event.stopPropagation();
        event.preventDefault();
    }

    private adjustLeadingTrailingForSpaceAccomodatedScroller() {
        const leadingTrailing = this.calculateLeadingTrailingForSpaceAccomodatedScroller();
        for (const key in leadingTrailing) {
            this.bar.style.setProperty(key, leadingTrailing[key]);
        }
        this.setThumbSize();
        this.setThumbPositionFromViewportSize();
    }

    private calculateLeadingTrailingForSpaceAccomodatedScroller(): LeadingTrailing {
        const leadingTrailing: LeadingTrailing = {};
        const spaceAccomodatedScroller = this._spaceAccomodatedScroller;
        if (spaceAccomodatedScroller === undefined) {
            return leadingTrailing;
        } else {
            if (spaceAccomodatedScroller.hidden) {
                return leadingTrailing;
            } else {
                const insideOverlap = spaceAccomodatedScroller.insideOverlap;
                const leadingKey = this._axisProperties['leading'];
                const trailingKey = this._axisProperties['trailing'];
                if (spaceAccomodatedScroller.trailing) {
                    leadingTrailing[leadingKey] = '0';
                    leadingTrailing[trailingKey] = numberToPixels(insideOverlap);
                } else {
                    leadingTrailing[leadingKey] = numberToPixels(insideOverlap);
                    leadingTrailing[trailingKey] = '0';
                }
                return leadingTrailing;
            }
        }
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
            this._dragging ||
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
    export const defaultClassPrefix = 'revgrid';
    export const barElementIdBase = '-revgrid-scroller-bar-';
    export const thumbElementIdBase = '-revgrid-scroller-thumb-';

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

interface LeadingTrailing {
    leading?: string; // left/top as pixel string
    trailing?: string; // right/bottom as pixel string
}

export const enum ThumbVisibilityState {
    Reduced,
    ToFullTransitioning,
    Full,
}
