import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { CachedCanvasRenderingContext2D } from '../../types-utils/cached-canvas-rendering-context-2d';
import { CssTypes } from '../../types-utils/css-types';
import { Point } from '../../types-utils/point';
import { Rectangle } from '../../types-utils/rectangle';
import { RevAssertError, RevUnreachableCaseError } from '../../types-utils/revgrid-error';
import { RevgridObject } from '../../types-utils/revgrid-object';

/** @public */
export class Canvas<BGS extends BehavioredGridSettings> implements RevgridObject {
    readonly element: HTMLCanvasElement;
    readonly gc: CachedCanvasRenderingContext2D;

    /** @internal */
    resizedEventerForViewLayout: Canvas.ResizedEventer;
    /** @internal */
    resizedEventerForEventBehavior: Canvas.ResizedEventer;

    /** @internal */
    repaintEventer: Canvas.RepaintEventer;

    /** @internal */
    focusEventer: Canvas.FocusEventer;
    /** @internal */
    blurEventer: Canvas.FocusEventer;

    /** @internal */
    keyDownEventer: Canvas.KeyEventer;
    /** @internal */
    keyUpEventer: Canvas.KeyEventer;

    /** @internal */
    pointerEnterEventer: Canvas.PointerEventer;
    /** @internal */
    pointerDownEventer: Canvas.PointerEventer;
    /** @internal */
    pointerMoveEventer: Canvas.PointerEventer;
    /** @internal */
    pointerUpCancelEventer: Canvas.PointerEventer;
    /** @internal */
    pointerLeaveOutEventer: Canvas.PointerEventer;
    /** @internal */
    pointerDragStartEventer: Canvas.PointerDragStartEventer;
    /** @internal */
    pointerDragEventer: Canvas.PointerDragEventer;
    /** @internal */
    pointerDragEndEventer: Canvas.PointerDragEventer;
    /** @internal */
    wheelMoveEventer: Canvas.WheelEventer;
    /** @internal */
    clickEventer: Canvas.MouseEventer;
    /** @internal */
    dblClickEventer: Canvas.MouseEventer;
    /** @internal */
    contextMenuEventer: Canvas.MouseEventer;

    /** @internal */
    touchStartEventer: Canvas.TouchEventer;
    /** @internal */
    touchMoveEventer: Canvas.TouchEventer;
    /** @internal */
    touchEndEventer: Canvas.TouchEventer;

    /** @internal */
    copyEventer: Canvas.ClipboardEventer;

    /** @internal */
    dragStartEventer: Canvas.DragEventer;

    /** @internal */
    private _pointerEntered = false;
    /** @internal */
    private _pointerDownState: Canvas.PointerDownState = Canvas.PointerDownState.NotDown;
    /** @internal */
    private _pointerDragInternal: boolean;

    /** @internal */
    private _started = false;
    /** @internal */
    private _flooredWidth: number;
    /** @internal */
    private _flooredHeight: number;
    // bodyZoomFactor: number;
    /** @internal */
    private _flooredBounds: Rectangle = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    } as const;
    /** @internal */
    private _hasBounds = false;
    /** @internal */
    private _devicePixelRatio = 1;
    /** @internal */
    private _hostWidth: number;
    /** @internal */
    private _hostHeight: number;

    /** @internal
     * Used in dragging when no drag image is wanted
     */
    /** @internal */
    private _emptyImage: HTMLImageElement;

    /** @internal */
    private _resizeTimeoutId: ReturnType<typeof setTimeout> | undefined;

    /** @internal */
    private _resizeObserver = new ResizeObserver(() => {
        setTimeout(() => { this.resize(true); }, 0); // do not process within observer callback
    })

    /** @internal */
    private pointerUpCancelEventListener = (event: PointerEvent) => {
        // event.preventDefault(); // no mouse event

        switch (this._pointerDownState) {
            case Canvas.PointerDownState.NotDown:
                break;
            case Canvas.PointerDownState.NotDragging:
                this.setPointerDownState(Canvas.PointerDownState.NotDown, event);
                break;
            case Canvas.PointerDownState.DragStarting:
                this.pointerUpCancelEventer(event);
                this.setPointerDownState(Canvas.PointerDownState.NotDown, event);
                break;
            case Canvas.PointerDownState.Dragging:
                this.pointerDragEndEventer(event, this._pointerDragInternal);
                this.pointerUpCancelEventer(event);
                this.setPointerDownState(Canvas.PointerDownState.IgnoreClickAfterDrag, event);
                break;
            case Canvas.PointerDownState.IgnoreClickAfterDrag:
                this.setPointerDownState(Canvas.PointerDownState.NotDown, event);
                break;
            default:
                throw new RevUnreachableCaseError('CMPUCEL34440', this._pointerDownState);
        }
    };

    /** @internal */
    private pointerLeaveOutListener = (event: PointerEvent) => {
        // event.preventDefault(); // no mouse event

        if (this._pointerEntered) {
            this.pointerLeaveOutEventer(event);
            this._pointerEntered = false;
        }
    }

    /** @internal */
    private keyDownEventListener = (e: KeyboardEvent) => {
        if (this.isActiveDocumentElement()) {
            this.checkPreventDefault(e);

            // const key = e.key;

            // if (e.repeat) {
            //     if (this._repeatKey === key) {
            //         this._repeatKeyCount++;
            //     } else {
            //         this._repeatKey = key;
            //         this._repeatKeyStartTime = Date.now();
            //     }
            // } else {
            //     this._repeatKey = undefined;
            //     this._repeatKeyCount = 0;
            //     this._repeatKeyStartTime = 0;
            // }

            // const eventDetail = this.createKeyboardEventDetail(e);
            this.keyDownEventer(e);
        }
    }

    /** @internal */
    private keyUpEventListener = (e: KeyboardEvent) => {
        if (this.isActiveDocumentElement()) {
            this.checkPreventDefault(e);

            // this._repeatKeyCount = 0;
            // this._repeatKey = undefined;
            // this._repeatKeyStartTime = 0;

            // const eventDetail = this.createKeyboardEventDetail(e);
            this.keyUpEventer(e);
        }
    }

    /** @internal */
    private focusEventListener = (e: FocusEvent) => {
        this.focusEventer(e);
    }

    /** @internal */
    private blurEventListener = (e: FocusEvent) => {
        this.blurEventer(e);
    }

    /** @internal */
    private clickEventListener = (e: MouseEvent) => {
        if (this._pointerDownState === Canvas.PointerDownState.IgnoreClickAfterDrag) {
            this.setPointerDownState(Canvas.PointerDownState.NotDown, undefined);
        } else {
            this.clickEventer(e);
        }
    };
    /** @internal */
    private dblClickEventListener = (e: MouseEvent) => {
        this.dblClickEventer(e);
    };
    /** @internal */
    private contextMenuEventListener = (e: MouseEvent) => {
        this.contextMenuEventer(e);
    };

    /** @internal */
    private touchStartEventListener = (e: TouchEvent) => {
        this.touchStartEventer(e);
    }
    /** @internal */
    private touchMoveEventListener = (e: TouchEvent) => {
        this.touchMoveEventer(e);
    }
    /** @internal */
    private touchEndEventListener = (e: TouchEvent) => {
        this.touchEndEventer(e);
    }

    /** @internal */
    private copyEventListener = (e: ClipboardEvent) => {
        if (this.isActiveDocumentElement()) {
            this.copyEventer(e);
        }
    }

    /** @internal */
    constructor(
        readonly revgridId: string,
        readonly internalParent: RevgridObject,
        readonly hostElement: HTMLElement,
        canvasOverflowOverride: CssTypes.Overflow | undefined,
        canvasRenderingContext2DSettings: CanvasRenderingContext2DSettings | undefined,
        /** @internal */
        private readonly _gridSettings: BGS,
    ) {
        // create and append the canvas
        this.element = document.createElement('canvas');
        this.element.id = `${revgridId}-${Canvas.canvasCssSuffix}`;
        this.element.draggable = true;
        this.element.tabIndex = 0;
        this.element.style.display = CssTypes.Display.block;
        this.element.style.outline = 'none';
        this.element.style.margin = '0';
        this.element.style.padding = '0';
        this.element.style.overflow = canvasOverflowOverride === undefined ? CssTypes.Overflow.clip : canvasOverflowOverride;
        this.element.classList.add(`${CssTypes.libraryName}-${Canvas.canvasCssSuffix}`);

        this.gc = this.createCachedContext(this.element, canvasRenderingContext2DSettings);

        this.hostElement.appendChild(this.element);

        this._emptyImage = document.createElement('img');
        this._emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        this.element.addEventListener('pointerdown', (event) => {
            // event.preventDefault(); // no mouse event

            switch (this._pointerDownState) {
                case Canvas.PointerDownState.NotDown:
                    this.setPointerDownState(Canvas.PointerDownState.NotDragging, event);
                    this.pointerDownEventer(event);
                    break;
                case Canvas.PointerDownState.NotDragging:
                    // must have lost a pointer up event
                    this.pointerDownEventer(event);
                    break;
                case Canvas.PointerDownState.IgnoreClickAfterDrag:
                    // must have lost a click event
                    this.pointerDownEventer(event);
                    break;
                case Canvas.PointerDownState.DragStarting:
                case Canvas.PointerDownState.Dragging:
                    // Should normally never occur but debugger can trigger this transition
                    this.pointerUpCancelEventListener(event); // pretend pointer went up
                    this.pointerDownEventer(event);
                    break;

                default:
                    throw new RevUnreachableCaseError('CMCAELPDU34440', this._pointerDownState);
            }
        });
        this.element.addEventListener('pointermove', (event) => {
            // event.preventDefault(); // no mouse event

            switch (this._pointerDownState) {
                case Canvas.PointerDownState.NotDown:
                case Canvas.PointerDownState.NotDragging:
                case Canvas.PointerDownState.IgnoreClickAfterDrag:
                    this.pointerMoveEventer(event);
                    break;
                case Canvas.PointerDownState.DragStarting: {
                    this.pointerMoveEventer(event);
                    this.setPointerDownState(Canvas.PointerDownState.Dragging, event);
                    this.pointerDragEventer(event, this._pointerDragInternal);
                    break;
                }
                case Canvas.PointerDownState.Dragging:
                    this.pointerMoveEventer(event);
                    this.pointerDragEventer(event, this._pointerDragInternal);
                    break;
                default:
                    throw new RevUnreachableCaseError('CMCAELPMU34440', this._pointerDownState);
            }

        });
        this.element.addEventListener('pointerenter', (event) => {
            // event.preventDefault(); // no mouse event

            this._pointerEntered = true;
            this.pointerEnterEventer(event);
        });
        this.element.addEventListener('pointerleave', (event) => {
            if (this._pointerEntered) {
                this.pointerLeaveOutEventer(event);
                this._pointerEntered = false;
            }
        });
        this.element.addEventListener('pointerout', (event) => {
            if (this._pointerEntered) {
                this.pointerLeaveOutEventer(event);
                this._pointerEntered = false;
            }
        });
        this.element.addEventListener('pointerup', this.pointerUpCancelEventListener);
        this.element.addEventListener('pointercancel', this.pointerUpCancelEventListener);
        this.element.addEventListener('wheel', (event) => {
            const pointerDownState = this._pointerDownState;
            if (pointerDownState !== Canvas.PointerDownState.Dragging) {
                this.wheelMoveEventer(event);
            }
        });
        this.element.addEventListener('keydown', this.keyDownEventListener);
        this.element.addEventListener('keyup', this.keyUpEventListener);
        this.element.addEventListener('focus', this.focusEventListener);
        this.element.addEventListener('blur', this.blurEventListener);
        this.element.addEventListener('click', this.clickEventListener);
        this.element.addEventListener('dblclick', this.dblClickEventListener);
        this.element.addEventListener('contextmenu', this.contextMenuEventListener);
        this.element.addEventListener('touchstart', this.touchStartEventListener);
        this.element.addEventListener('touchmove', this.touchMoveEventListener);
        this.element.addEventListener('touchend', this.touchEndEventListener);
        this.element.addEventListener('copy', this.copyEventListener);

        this.element.addEventListener('dragstart', (event) => {
            this.dragStartEventer(event);
            const dataTransfer = event.dataTransfer;
            if (dataTransfer === null || dataTransfer.items.length === 0) {
                event.preventDefault();

                if (
                    this._pointerDownState !== Canvas.PointerDownState.NotDragging &&
                    this._pointerDownState !== Canvas.PointerDownState.NotDown && // Debugger can cause this unexpected state
                    this._pointerDownState !== Canvas.PointerDownState.IgnoreClickAfterDrag // Debugger can cause this unexpected state
                ) {
                    throw new RevAssertError('CMCAELDS1220');
                } else {
                    const pointerDragInternal = this.pointerDragStartEventer(event);
                    if (pointerDragInternal !== undefined) {
                        this._pointerDragInternal = pointerDragInternal;
                        this.setPointerDownState(Canvas.PointerDownState.DragStarting, undefined);
                    }
                }
            }
        });
    }

    get hasBounds() { return this._hasBounds; }
    get flooredBounds() { return this._flooredBounds; }
    get flooredWidth() { return this._flooredWidth; }
    get flooredHeight() { return this._flooredHeight; }
    get devicePixelRatio() { return this._devicePixelRatio; }
    get emptyImage() { return this._emptyImage; } // may use for dragging in future

    addExternalEventListener(eventName: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        this.element.addEventListener(eventName, listener, options);
    }

    removeExternalEventListener(eventName: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
        this.element.removeEventListener(eventName, listener, options);
    }

    /** @internal */
    start() {
        this._gridSettings.resizeEventer = () => { this.resize(false); };
        this._resizeObserver.observe(this.hostElement);
        this._started = true;
    }

    /** @internal */
    stop() {
        this._resizeObserver.disconnect();
        this._gridSettings.resizeEventer = undefined;
        this.checkClearResizeTimeout();
        this._started = true;
    }

    checksize() {
        const hostRect = this.getHostBoundingClientRect();
        if (hostRect.width !== this._hostWidth || hostRect.height !== this._hostHeight) {
            this.resize(true, hostRect);
        }
    }

    resize(debounceEvent: boolean, hostRect?: DOMRect) {
        if (hostRect === undefined) {
            hostRect = this.getHostBoundingClientRect();
        }

        const oldWidth = this._flooredBounds.width;
        const oldHeight = this._flooredBounds.height;
        let imageData: ImageData | undefined;
        if (oldWidth > 0 && oldHeight > 0) {
           imageData = this.gc.getImageData(0, 0, oldWidth * this._devicePixelRatio, oldHeight * this._devicePixelRatio);
        }

        this._hostWidth = hostRect.width;
        this._hostHeight = hostRect.height;

        const flooredWidth = Math.floor(this._hostWidth);
        const flooredHeight = Math.floor(this._hostHeight);

        this._flooredWidth = flooredWidth;
        this._flooredHeight = flooredHeight;

        // http://www.html5rocks.com/en/tutorials/canvas/hidpi/
        const ratio = this._gridSettings.useHiDPI ? window.devicePixelRatio : 1;

        const ratioChanged = ratio !== this._devicePixelRatio;
        this._devicePixelRatio = ratio;
        // this._devicePixelRatio = ratio *= this.bodyZoomFactor;

        this.element.width = Math.floor(flooredWidth * ratio);
        this.element.height = Math.floor(flooredHeight * ratio);

        this.element.style.width = flooredWidth.toString(10) + 'px';
        this.element.style.height = flooredHeight.toString(10) + 'px';

        if (imageData !== undefined && !ratioChanged) {
            this.gc.putImageData(imageData, 0, 0);
        }

        this.gc.scale(ratio, ratio);

        this._flooredBounds = {
            x: 0,
            y: 0,
            width: flooredWidth,
            height: flooredHeight
        } as const;
        this._hasBounds = flooredWidth > 0 && flooredHeight > 0;

        if (this._started) {
            this.checkFireResizedEvents(debounceEvent);
        }
    }

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672}
     * @this CanvasType
     */
    // resetZoom() {
    //     let factor = 1;

    //     // IE11 bug: must use getPropertyValue because zoom is omitted from returned object
    //     const zoomProp = getComputedStyle(document.body).getPropertyValue('zoom');

    //     if (zoomProp) {
    //         // IE11: always returns percentage + percent sign (others return factor)
    //         const m = zoomProp.match(/^(.+?)(%)?$/);
    //         if (m) {
    //             let zoom = Number(m[1]);
    //             if (m[2]) {
    //                 zoom /= 100;
    //             }
    //             zoom = Number(zoom || 1);
    //             factor *= zoom;
    //         }
    //     }

    //     this.bodyZoomFactor = factor;

    //     this.resize();
    // }

    /** @internal */
    getOffsetPoint<T extends MouseEvent|Touch>(mouseEventOrTouch: T) {
        const rect = this.getCanvasBoundingClientRect();

        const offsetPoint = Point.create(
            mouseEventOrTouch.clientX /* / this.bodyZoomFactor*/ - rect.left,
            mouseEventOrTouch.clientY /* / this.bodyZoomFactor*/ - rect.top
        );

        return offsetPoint;
    }

    /** @internal */
    isActiveDocumentElement() {
        return document.activeElement === this.element;
    }

    /** @internal */
    takeFocus() {
        if (!this.isActiveDocumentElement()) {
            setTimeout(() => {
                this.element.focus();
            }, 10);
        }
    }

    /** @internal */
    dispatchEvent(e: Event) {
        return this.element.dispatchEvent(e);
    }

    /** @internal */
    setCursor(cursorName: string | undefined) {
        if (cursorName === undefined) {
            this.element.style.cursor = '';
        } else {
            this.element.style.cursor = cursorName;
        }
    }

    /** @internal */
    setTitleText(titleText: string) {
        this.element.title = titleText;
    }

    /** @internal */
    private createCachedContext(
        canvasElement: HTMLCanvasElement,
        canvasRenderingContext2DSettings: CanvasRenderingContext2DSettings | undefined // lookup getContextAttributes for more info
    ) {
        const canvasRenderingContext2D = canvasElement.getContext('2d', canvasRenderingContext2DSettings);

        if (canvasRenderingContext2D === null) {
            throw new RevAssertError('CGCC74443');
        } else {
            const gc = new CachedCanvasRenderingContext2D(canvasRenderingContext2D);
            return gc;
        }
    }

    /** @internal */
    private checkFireResizedEvents(debounce: boolean): void {
        if (!debounce) {
            this.checkClearResizeTimeout();
            this.fireResizedEvents();
        } else {
            if (this._gridSettings.resizedEventDebounceExtendedWhenPossible) {
                this.checkClearResizeTimeout();
            }

            if (this._resizeTimeoutId === undefined) {
                this._resizeTimeoutId = setTimeout(
                    () => {
                        this._resizeTimeoutId = undefined;
                        this.fireResizedEvents();
                    },
                    this._gridSettings.resizedEventDebounceInterval,
                );
            }
        }
    }

    /** @internal */
    private fireResizedEvents() {
        this.resizedEventerForViewLayout();
        this.resizedEventerForEventBehavior();
    }

    /** @internal */
    private checkClearResizeTimeout() {
        if (this._resizeTimeoutId !== undefined) {
            clearTimeout(this._resizeTimeoutId);
            this._resizeTimeoutId = undefined;
        }
    }

    /** @internal */
    private setPointerDownState(state: Canvas.PointerDownState, event: PointerEvent | undefined) {
        switch (state) {
            case Canvas.PointerDownState.NotDown:
            case Canvas.PointerDownState.NotDragging:
            case Canvas.PointerDownState.IgnoreClickAfterDrag:
                document.body.style.userSelect = '';
                if (event !== undefined) {
                    this.element.releasePointerCapture(event.pointerId);
                } else {
                    if (this._pointerDownState !== Canvas.PointerDownState.IgnoreClickAfterDrag) {
                        throw new RevAssertError('CMSPDSN68201');
                    }
                }
                break;
            case Canvas.PointerDownState.DragStarting:
                document.body.style.userSelect = 'none';
                break;
            case Canvas.PointerDownState.Dragging:
                document.body.style.userSelect = 'none';
                if (event === undefined) {
                    throw new RevAssertError('CMSPDSR68201');
                } else {
                    this.element.setPointerCapture(event.pointerId);
                }
                break;
            default:
                throw new RevUnreachableCaseError('CMSPDS87732', state);
        }

        this._pointerDownState = state;
    }

    /** @internal */
    private checkPreventDefault(e: KeyboardEvent) {
        // prevent TAB from moving focus off the canvas element
        switch (e.key) {
            case 'TAB':
            case 'TABSHIFT':
            case 'Tab':
                e.preventDefault();
        }
    }

    /** @internal */
    private getHostBoundingClientRect() {
        return this.hostElement.getBoundingClientRect();
    }

    /** @internal */
    private getCanvasBoundingClientRect() {
        return this.element.getBoundingClientRect();
    }
}

/** @public */
export namespace Canvas {
    /** @internal */
    export type ResizedEventer = (this: void) => void;
    /** @internal */
    export type RepaintEventer = (this: void) => void;

    /** @internal */
    export type FocusEventer = (this: void, event: FocusEvent) => void;
    /** @internal */
    export type MouseEventer = (this: void, event: MouseEvent) => void;
    /** @internal */
    export type PointerEventer = (this: void, event: PointerEvent) => void;
    /** @internal */
    export type PointerDragStartEventer = (this: void, event: DragEvent) => boolean | undefined; // internal (true), external (false), not started (undefined)
    /** @internal */
    export type PointerDragEventer = (this: void, event: PointerEvent, internal: boolean) => void;
    /** @internal */
    export type WheelEventer = (this: void, event: WheelEvent) => void;
    /** @internal */
    export type KeyEventer = (this: void, event: KeyboardEvent) => void;
    /** @internal */
    export type TouchEventer = (this: void, event: TouchEvent) => void;
    /** @internal */
    export type ClipboardEventer = (this: void, event: ClipboardEvent) => void;
    /** @internal */
    export type DragEventer = (this: void, event: DragEvent) => void;

    /** @internal */
    export const enum PointerDownState {
        NotDown,
        NotDragging,
        DragStarting,
        Dragging,
        IgnoreClickAfterDrag,
    }

    export const canvasCssSuffix = 'canvas';
}
