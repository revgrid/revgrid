import { AssertError } from '../../types-utils/revgrid-error';
import { EventDetail } from '../event/event-detail';
import { ScrollDimension } from '../view/scroll-dimension';
import { cssInjector } from './css-injector';

// Following is the sole style requirement for bar and thumb elements.
// Maintained in code so not dependent being in stylesheet.
// const BAR_STYLE = 'position: absolute;';

export class Scroller {
    /**
     * @name bar
     * @summary The generated scrollbar element.
     * @desc The caller inserts this element into the DOM (typically into the content container) and then calls its {@link Scroller#resize|resize()} method.
     *
     * Thus the node tree is typically:
     * * A **content container** element, which contains:
     *   * The content element(s)
     *   * This **scrollbar element**, which in turn contains:
     *     * The **thumb element**
     */
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
    private readonly _orientationHash: OrientationHash;
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
    // private _currentThumbPosition: number;
    // private container: HTMLElement;
    // private content: HTMLElement;

    private _dragging: boolean;
    /**
     * Wheel metric normalization, applied equally to all three axes.
     *
     * This value is overridden with a platform- and browser-specific wheel factor when available in {@link Scroller.normals}.
     *
     * To suppress, delete `FinBar.normals` before instantiation or override this instance variable (with `1.0`) after instantiation.
     */
    // normal: number;

    private _bound: Scroller.Bound = {
        shortStop: (event: MouseEvent) => this.shortStop(event),
        onwheel: (event: WheelEvent) => this.onwheel(event),
        onclick: (event: MouseEvent) => this.onclick(event),
        onmouseover: () => this.onmouseover(),
        onmouseout: () => this.onmouseout(),
        onmousedown: (event: MouseEvent) => this.onmousedown(event),
        onmousemove: (event: MouseEvent) => this.onmousemove(event),
        onmouseup: (event: MouseEvent) => this.onmouseup(event),
    }

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
     * @name barStyles
     * @summary Scrollbar styles to be applied by {@link Scroller#resize|resize()}.
     * @desc Set by the constructor. See the similarly named property in the {@link finbarOptions} object.
     *
     * This is a value to be assigned to {@link Scroller#styles|styles} on each call to {@link Scroller#resize|resize()}. That is, a hash of values to be copied to the scrollbar element's style object on resize; or `null` for none.
     *
     * @see {@link Scroller#style|style}
     */
    private barStyles: Scroller.BarStyles | null;

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
        private readonly _scrollDimension: ScrollDimension,
        instanceId: number,
        private readonly _indexMode: boolean, // legacy - remove when vertical scrollbar is updated to use viewport
        private readonly orientation: Scroller.Orientation,
        private _trailing: boolean, // true: right/bottom of canvas, false: otherwise left/top of canvas
        deltaXFactor: number,
        deltaYFactor: number,
        classPrefix: string | undefined,
        loadBuiltinCssStylesheet: boolean,
        cssStylesheetReferenceElement: HTMLElement,
        private readonly _spaceAccomodatedScroller: Scroller | undefined,
    ) {
        // make bound versions of all the mouse event handler
        const bound = this._bound;
        this._thumb = document.createElement('div');
        const thumb = this._thumb;
        thumb.id = orientation + Scroller.thumbElementIdBase + instanceId.toString();
        thumb.classList.add('thumb');
        thumb.style.position = 'absolute';
        thumb.onclick = bound.shortStop;
        thumb.onmouseover = bound.onmouseover;
        thumb.onmouseout = bound.onmouseout;

        this.bar = document.createElement('div');
        const bar = this.bar;
        bar.id = orientation + Scroller.barElementIdBase + instanceId.toString();
        bar.style.position = 'absolute';
        bar.onmousedown = bound.onmousedown;
        bar.onclick = bound.onclick;
        bar.appendChild(thumb);
        bar.addEventListener('wheel', bound.onwheel);

        // presets
        this.orientation = orientation;
        if (classPrefix === undefined || classPrefix === '') {
            this._classPrefix = Scroller.defaultClassPrefix;
        } else {
            this._classPrefix = classPrefix;
        }
        this._orientationHash = orientationHashes[this.orientation];
        bar.classList.add(`${this._classPrefix}-${orientation}`);
        this._deltaProp = this._orientationHash.delta;
        this.increment = 1;
        this.barStyles = null;
        this._deltaProp = (this.orientation === 'vertical' ? Scroller.DeltaPropEnum.deltaY : Scroller.DeltaPropEnum.deltaX);
        this.deltaXFactor = deltaXFactor;
        this.deltaYFactor = deltaYFactor;
        this.deltaZFactor = 1;
        // this.container = options.container;
        // this.content = options.content;

        // this.normal = getNormal();

        if (loadBuiltinCssStylesheet) {
            cssInjector(cssFinBars, 'finbar-base', cssStylesheetReferenceElement);
        }

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
     * 1. Included "pseudo-property" names from the scrollbar's orientation hash, {@link Scroller#_orientationHash|oh}, are translated to actual property names before being applied.
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
        const computedStyle = window.getComputedStyle(this.bar);
        return computedStyle[this._orientationHash.thickness];
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
     * @summary Remove the scrollbar.
     * @desc Unhooks all the event handlers and then removes the element from the DOM. Always call this method prior to disposing of the scrollbar object.
     */
    destroy() {
        this.bar.onmousedown = null;
        this.removeEventListener('mousemove');
        this.removeEventListener('mouseup');

        const parentElement = this.bar.parentElement;
        if (parentElement === null) {
            throw new AssertError('F11122');
        } else {
            parentElement.removeEventListener('wheel', this._bound.onwheel);

            this.bar.onclick = null;
            this._thumb.onclick = null;
            this._thumb.onmouseover = null;
            this._thumb.ontransitionend = null;
            this._thumb.onmouseout = null;

            this.bar.remove();
        }
    }

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
            this._thumb.style[this._orientationHash.leading] = thumbPosition + 'px';
            // this._currentThumbPosition = thumbPosition;
        }
    }

    /**
     * @summary Sets the proportional thumb size and hides thumb when 100%.
     * @desc The thumb size has an absolute minimum of 20 (pixels).
     */
    private setThumbSize() {
        const oh = this._orientationHash;
        const thumbComp = window.getComputedStyle(this._thumb);
        const thumbMarginLeading = parseInt(thumbComp[oh.marginLeading]);
        const thumbMarginTrailing = parseInt(thumbComp[oh.marginTrailing]);
        const thumbMargins = thumbMarginLeading + thumbMarginTrailing;
        const barSize = this.bar.getBoundingClientRect()[oh.size];

        const oldHidden = this.hidden;
        if (this._scrollDimension.overflowed === true) {
            this._thumbScaling = barSize / this._scrollDimension.size;
            const thumbSize = Math.max(20, barSize * this._scrollDimension.viewportSize / this._scrollDimension.size);
            this._thumb.style[oh.size] = thumbSize + 'px';
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


        this._thumbMarginLeading = thumbMarginLeading; // used in mousedown
    }

    private addEventListener(evtName: string) {
        window.addEventListener(evtName, this._bound['on' + evtName]);
    }

    private removeEventListener(evtName: string) {
        window.removeEventListener(evtName, this._bound['on' + evtName]);
    }

    private shortStop(evt: MouseEvent) {
        evt.stopPropagation();
    }

    private onwheel(evt: WheelEvent) {
        const index = this.index;
        if (index !== undefined) {
            this.index = index + evt[this._deltaProp] * this[this._deltaProp + 'Factor'] /* * this.normal */;
            evt.stopPropagation();
            evt.preventDefault();
        }
    }

    private onclick(evt: MouseEvent) {
        const index = this.index;
        if (index !== undefined) {
            const thumbBox = this._thumb.getBoundingClientRect();
            const goingUp = evt[this._orientationHash.coordinate] < thumbBox[this._orientationHash.leading];


            let actionType: EventDetail.ScrollerAction.Type;
            if (goingUp) {
                if (evt.altKey) {
                    actionType = EventDetail.ScrollerAction.Type.StepBack;
                } else {
                    actionType = EventDetail.ScrollerAction.Type.PageBack;
                }
            } else {
                if (evt.altKey) {
                    actionType = EventDetail.ScrollerAction.Type.StepForward;
                } else {
                    actionType = EventDetail.ScrollerAction.Type.PageForward;
                }
            }
            const action: EventDetail.ScrollerAction = {
                type: actionType,
                viewportStart: undefined,
            };

            this.actionEventer(action);

            // make the thumb glow momentarily
            this._thumb.classList.add('hover');
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const self = this;
            this._thumb.addEventListener('transitionend', function waitForIt() {
                this.removeEventListener('transitionend', waitForIt);
                self._bound.onmouseup(evt);
            });

            evt.stopPropagation();
        }
    }

    private onmouseover() {
        this._thumb.classList.add('hover');
    }

    private onmouseout() {
        if (!this._dragging) {
            this._thumb.classList.remove('hover');
        }
    }

    private onmousedown(evt: MouseEvent) {
        const thumbBox = this._thumb.getBoundingClientRect();
        this._pinOffset = evt[this._orientationHash.axis] - thumbBox[this._orientationHash.leading] + this.bar.getBoundingClientRect()[this._orientationHash.leading] + this._thumbMarginLeading;
        document.documentElement.style.cursor = 'default';

        this._dragging = true;

        this.addEventListener('mousemove');
        this.addEventListener('mouseup');

        evt.stopPropagation();
        evt.preventDefault();
    }

    private onmousemove(evt: MouseEvent) {
        if (!(evt.buttons & 1)) {
            // mouse button may have been released without `onmouseup` triggering (see
            window.dispatchEvent(new MouseEvent('mouseup', evt));
            return;
        }

        let thumbPosition: number | undefined;
        let possiblyFractionalViewportStart: number;

        if (this._indexMode) {
            thumbPosition = Math.min(this._thumbMax, Math.max(0, evt[this._orientationHash.axis] - this._pinOffset));
            possiblyFractionalViewportStart = thumbPosition / this._thumbMax * (this._scrollDimension.finish - this._scrollDimension.start) + this._scrollDimension.start;
        } else {
            thumbPosition = evt[this._orientationHash.axis] - this._pinOffset;
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

        const action: EventDetail.ScrollerAction = {
            type: EventDetail.ScrollerAction.Type.newViewportStart,
            viewportStart,
        };

        this.actionEventer(action);

        // this._setScroll(viewportStart, barPosition, true);

        evt.stopPropagation();
        evt.preventDefault();
    }

    private onmouseup(evt: MouseEvent) {
        this.removeEventListener('mousemove');
        this.removeEventListener('mouseup');

        this._dragging = false;

        document.documentElement.style.cursor = 'auto';

        const thumbBox = this._thumb.getBoundingClientRect();
        if (
            thumbBox.left <= evt.clientX && evt.clientX <= thumbBox.right &&
            thumbBox.top <= evt.clientY && evt.clientY <= thumbBox.bottom
        ) {
            this._bound.onmouseover(evt);
        } else {
            this._bound.onmouseout(evt);
        }

        evt.stopPropagation();
        evt.preventDefault();
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
                const thickness = spaceAccomodatedScroller.thickness;
                const leadingKey = this._orientationHash['leading'];
                const trailingKey = this._orientationHash['trailing'];
                if (spaceAccomodatedScroller.trailing) {
                    leadingTrailing[leadingKey] = '';
                    leadingTrailing[trailingKey] = thickness;
                } else {
                    leadingTrailing[leadingKey] = thickness;
                    leadingTrailing[trailingKey] = '';
                }
                return leadingTrailing;
            }
        }
    }
}

export namespace Scroller {
    export const defaultClassPrefix = 'finbar';
    export const barElementIdBase = '-revgrid-scroller-bar-';
    export const thumbElementIdBase = '-revgrid-scroller-thumb-';

    export interface Options {
        indexMode?: boolean;
        orientation?: Orientation;
        increment?: number;
        paging?: boolean | Paging;
        barStyles?: BarStyles;
        deltaProp?: DeltaProp;
        deltaXFactor?: number;
        deltaYFactor?: number;
        deltaZFactor?: number;
        classPrefix?: string;
        // container?: HTMLElement;
        // content?: HTMLElement;
        /** Specifies whether to load builtin FinBar stylesheet. Default: true */
        loadBuiltinCssStylesheet?: boolean;
        cssStylesheetReferenceElement?: null | Element | string;
    }

    export type Orientation = keyof OrientationHashes;

    export const enum DeltaPropEnum {
        deltaX = 'deltaX',
        deltaY = 'deltaY',
        deltaZ = 'deltaZ',
    }
    export type DeltaProp = keyof typeof DeltaPropEnum;

    export interface ContentRange {
        start: number;
        finish: number;
    }

    export const defaultContentRange: ContentRange = {
        start: 0,
        finish: 100
    }

    export interface Paging {
        up: (this: void, index: number) => number | undefined;
        down: (this: void, index: number) => number | undefined;
    }

    export interface TestPanelItem {
        mousedown: Element;
        mousemove: Element;
        mouseup: Element;
        index: Element;
    }

    export interface Bound {
        shortStop: (this: void, evt: MouseEvent) => void;
        onwheel: (this: void, evt: WheelEvent) => void;
        onclick: (this: void, evt: MouseEvent) => void;
        onmouseover: (this: void, evt: MouseEvent) => void;
        onmouseout: (this: void, evt: MouseEvent) => void;
        onmousedown: (this: void, evt: MouseEvent) => void;
        onmousemove: (this: void, evt: MouseEvent) => void;
        onmouseup: (this: void, evt: MouseEvent) => void;
    }

    export type BarStyles = Record<string, string>;

    export type ActionEventer = (this: void, action: EventDetail.ScrollerAction) => void;
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

interface OrientationHash {
    coordinate: 'clientX' | 'clientY';
    axis: 'pageX' | 'pageY';
    size: 'width' | 'height';
    outside: 'bottom' | 'right';
    inside: 'top' | 'left';
    leading: 'left' | 'top';
    trailing: 'right' | 'bottom';
    marginLeading: 'marginLeft' | 'marginTop';
    marginTrailing: 'marginRight' | 'marginBottom';
    thickness: 'height' | 'width';
    delta: Scroller.DeltaProp;
}

interface OrientationHashes {
    vertical: OrientationHash;
    horizontal: OrientationHash;
}

const orientationHashes: OrientationHashes = {
    vertical: {
        coordinate:     'clientY',
        axis:           'pageY',
        size:           'height',
        outside:        'right',
        inside:         'left',
        leading:        'top',
        trailing:       'bottom',
        marginLeading:  'marginTop',
        marginTrailing: 'marginBottom',
        thickness:      'width',
        delta:          'deltaY'
    },
    horizontal: {
        coordinate:     'clientX',
        axis:           'pageX',
        size:           'width',
        outside:        'bottom',
        inside:         'top',
        leading:        'left',
        trailing:       'right',
        marginLeading:  'marginLeft',
        marginTrailing: 'marginRight',
        thickness:      'height',
        delta:          'deltaX'
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

// definition inserted by gulpfile between following comments
/* inject:css */
const cssFinBars = 'div.finbar-horizontal,div.finbar-vertical{margin:3px}div.finbar-horizontal>.thumb,div.finbar-vertical>.thumb{background-color:#d3d3d3;-webkit-box-shadow:0 0 1px #000;-moz-box-shadow:0 0 1px #000;box-shadow:0 0 1px #000;border-radius:4px;margin:2px;opacity:.4;transition:opacity .5s}div.finbar-horizontal>.thumb.hover,div.finbar-vertical>.thumb.hover{opacity:1;transition:opacity .5s}div.finbar-vertical{top:0;bottom:0;right:0;width:11px}div.finbar-vertical>.thumb{top:0;right:0;width:7px}div.finbar-horizontal{left:0;right:0;bottom:0;height:11px}div.finbar-horizontal>.thumb{left:0;bottom:0;height:7px}';
/* endinject */
