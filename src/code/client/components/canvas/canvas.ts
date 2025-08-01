import { RevAssertError, RevCachedCanvasRenderingContext2D, RevClientObject, RevCssTypes, RevPoint, RevRectangle, RevUnreachableCaseError } from '../../../common';
import { RevBehavioredGridSettings } from '../../settings';

/** @public */
export class RevCanvas<BGS extends RevBehavioredGridSettings> implements RevClientObject {
    readonly element: HTMLCanvasElement;
    readonly gc: RevCachedCanvasRenderingContext2D;

    /** @internal */
    resizedEventerForViewLayout: RevCanvas.ResizedEventer;
    /** @internal */
    resizedEventerForEventBehavior: RevCanvas.ResizedEventer;

    /** @internal */
    repaintEventer: RevCanvas.RepaintEventer;

    /** @internal */
    focusEventer: RevCanvas.FocusEventer;
    /** @internal */
    blurEventer: RevCanvas.FocusEventer;

    /** @internal */
    keyDownEventer: RevCanvas.KeyEventer;
    /** @internal */
    keyUpEventer: RevCanvas.KeyEventer;

    /** @internal */
    pointerEnterEventer: RevCanvas.PointerEventer;
    /** @internal */
    pointerDownEventer: RevCanvas.PointerEventer;
    /** @internal */
    pointerMoveEventer: RevCanvas.PointerEventer;
    /** @internal */
    pointerUpCancelEventer: RevCanvas.PointerEventer;
    /** @internal */
    pointerLeaveOutEventer: RevCanvas.PointerEventer;
    /** @internal */
    pointerDragStartEventer: RevCanvas.PointerDragStartEventer;
    /** @internal */
    pointerDragEventer: RevCanvas.PointerDragEventer;
    /** @internal */
    pointerDragEndEventer: RevCanvas.PointerDragEventer;
    /** @internal */
    wheelMoveEventer: RevCanvas.WheelEventer;
    /** @internal */
    clickEventer: RevCanvas.MouseEventer;
    /** @internal */
    dblClickEventer: RevCanvas.MouseEventer;
    /** @internal */
    contextMenuEventer: RevCanvas.MouseEventer;

    /** @internal */
    touchStartEventer: RevCanvas.TouchEventer;
    /** @internal */
    touchMoveEventer: RevCanvas.TouchEventer;
    /** @internal */
    touchEndEventer: RevCanvas.TouchEventer;

    /** @internal */
    copyEventer: RevCanvas.ClipboardEventer;

    /** @internal */
    dragStartEventer: RevCanvas.DragEventer;

    /** @internal */
    private _pointerEntered = false;
    /** @internal */
    private _pointerDownState: RevCanvas.PointerDownStateId = RevCanvas.PointerDownStateId.NotDown;
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
    private _flooredBounds: RevRectangle = {
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
    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        readonly hostElement: HTMLElement,
        canvasOverflowOverride: RevCssTypes.Overflow | undefined,
        canvasRenderingContext2DSettings: CanvasRenderingContext2DSettings | undefined,
        /** @internal */
        private readonly _gridSettings: BGS,
    ) {
        // create and append the canvas
        this.element = document.createElement('canvas');
        this.element.id = `${clientId}-${RevCanvas.canvasCssSuffix}`;
        this.element.draggable = true;
        this.element.tabIndex = 0;
        this.element.style.display = RevCssTypes.Display.block;
        this.element.style.outline = 'none';
        this.element.style.margin = '0';
        this.element.style.padding = '0';
        this.element.style.overflow = canvasOverflowOverride === undefined ? RevCssTypes.Overflow.clip : canvasOverflowOverride;
        this.element.classList.add(`${RevCssTypes.libraryName}-${RevCanvas.canvasCssSuffix}`);

        this.gc = this.createCachedContext(this.element, canvasRenderingContext2DSettings);

        this.hostElement.appendChild(this.element);

        this._emptyImage = document.createElement('img');
        this._emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        this.element.addEventListener('pointerdown', (event) => {
            // event.preventDefault(); // no mouse event

            switch (this._pointerDownState) {
                case RevCanvas.PointerDownStateId.NotDown:
                    this.setPointerDownState(RevCanvas.PointerDownStateId.NotDragging, event);
                    this.pointerDownEventer(event);
                    break;
                case RevCanvas.PointerDownStateId.NotDragging:
                    // must have lost a pointer up event
                    this.pointerDownEventer(event);
                    break;
                case RevCanvas.PointerDownStateId.IgnoreClickAfterDrag:
                    // must have lost a click event
                    this.pointerDownEventer(event);
                    break;
                case RevCanvas.PointerDownStateId.DragStarting:
                case RevCanvas.PointerDownStateId.Dragging:
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
                case RevCanvas.PointerDownStateId.NotDown:
                case RevCanvas.PointerDownStateId.NotDragging:
                case RevCanvas.PointerDownStateId.IgnoreClickAfterDrag:
                    this.pointerMoveEventer(event);
                    break;
                case RevCanvas.PointerDownStateId.DragStarting: {
                    this.pointerMoveEventer(event);
                    this.setPointerDownState(RevCanvas.PointerDownStateId.Dragging, event);
                    this.pointerDragEventer(event, this._pointerDragInternal);
                    break;
                }
                case RevCanvas.PointerDownStateId.Dragging:
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
            if (pointerDownState !== RevCanvas.PointerDownStateId.Dragging) {
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
                    this._pointerDownState !== RevCanvas.PointerDownStateId.NotDragging &&
                    this._pointerDownState !== RevCanvas.PointerDownStateId.NotDown && // Debugger can cause this unexpected state
                    this._pointerDownState !== RevCanvas.PointerDownStateId.IgnoreClickAfterDrag // Debugger can cause this unexpected state
                ) {
                    throw new RevAssertError('CMCAELDS1220');
                } else {
                    const pointerDragInternal = this.pointerDragStartEventer(event);
                    if (pointerDragInternal !== undefined) {
                        this._pointerDragInternal = pointerDragInternal;
                        this.setPointerDownState(RevCanvas.PointerDownStateId.DragStarting, undefined);
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
    getOffsetPoint(mouseEventOrTouch: MouseEvent|Touch) {
        const rect = this.getCanvasBoundingClientRect();

        const offsetPoint = RevPoint.create(
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
    private pointerUpCancelEventListener = (event: PointerEvent) => {
        // event.preventDefault(); // no mouse event

        switch (this._pointerDownState) {
            case RevCanvas.PointerDownStateId.NotDown:
                break;
            case RevCanvas.PointerDownStateId.NotDragging:
                this.setPointerDownState(RevCanvas.PointerDownStateId.NotDown, event);
                break;
            case RevCanvas.PointerDownStateId.DragStarting:
                this.pointerUpCancelEventer(event);
                this.setPointerDownState(RevCanvas.PointerDownStateId.NotDown, event);
                break;
            case RevCanvas.PointerDownStateId.Dragging:
                this.pointerDragEndEventer(event, this._pointerDragInternal);
                this.pointerUpCancelEventer(event);
                this.setPointerDownState(RevCanvas.PointerDownStateId.IgnoreClickAfterDrag, event);
                break;
            case RevCanvas.PointerDownStateId.IgnoreClickAfterDrag:
                this.setPointerDownState(RevCanvas.PointerDownStateId.NotDown, event);
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
        if (this._pointerDownState === RevCanvas.PointerDownStateId.IgnoreClickAfterDrag) {
            this.setPointerDownState(RevCanvas.PointerDownStateId.NotDown, undefined);
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
    private createCachedContext(
        canvasElement: HTMLCanvasElement,
        canvasRenderingContext2DSettings: CanvasRenderingContext2DSettings | undefined // lookup getContextAttributes for more info
    ) {
        const canvasRenderingContext2D = canvasElement.getContext('2d', canvasRenderingContext2DSettings);

        if (canvasRenderingContext2D === null) {
            throw new RevAssertError('CGCC74443');
        } else {
            const gc = new RevCachedCanvasRenderingContext2D(canvasRenderingContext2D);
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
    private setPointerDownState(state: RevCanvas.PointerDownStateId, event: PointerEvent | undefined) {
        switch (state) {
            case RevCanvas.PointerDownStateId.NotDown:
            case RevCanvas.PointerDownStateId.NotDragging:
            case RevCanvas.PointerDownStateId.IgnoreClickAfterDrag:
                document.body.style.userSelect = '';
                if (event !== undefined) {
                    this.element.releasePointerCapture(event.pointerId);
                } else {
                    if (this._pointerDownState !== RevCanvas.PointerDownStateId.IgnoreClickAfterDrag) {
                        throw new RevAssertError('CMSPDSN68201');
                    }
                }
                break;
            case RevCanvas.PointerDownStateId.DragStarting:
                document.body.style.userSelect = 'none';
                break;
            case RevCanvas.PointerDownStateId.Dragging:
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
export namespace RevCanvas {
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
    export const enum PointerDownStateId {
        NotDown,
        NotDragging,
        DragStarting,
        Dragging,
        IgnoreClickAfterDrag,
    }

    export const canvasCssSuffix = 'canvas';
}
