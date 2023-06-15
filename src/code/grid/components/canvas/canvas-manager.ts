// if (typeof window.CustomEvent !== 'function') {
//     // @ts-ignore
//     window.CustomEvent = function(event, params) {
//         params = params || { bubbles: false, cancelable: false, detail: undefined };
//         var evt = document.createEvent('CustomEvent');
//         evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
//         return evt;
//     };

//     // @ts-ignore
//     window.CustomEvent.prototype = window.Event.prototype;
// }

import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { CachedCanvasRenderingContext2D } from '../../types-utils/cached-canvas-rendering-context-2d';
import { CssClassName } from '../../types-utils/html-types';
import { InexclusiveRectangle } from '../../types-utils/inexclusive-rectangle';
import { Point } from '../../types-utils/point';
import { AssertError, UnreachableCaseError } from '../../types-utils/revgrid-error';

/** @public */
export class CanvasManager<BGS extends BehavioredGridSettings> {
    resizedEventerForViewLayout: CanvasManager.ResizedEventer;
    resizedEventerForEventBehavior: CanvasManager.ResizedEventer;

    repaintEventer: CanvasManager.RepaintEventer;

    focusEventer: CanvasManager.FocusEventer;
    blurEventer: CanvasManager.FocusEventer;

    keyDownEventer: CanvasManager.KeyEventer;
    keyUpEventer: CanvasManager.KeyEventer;

    pointerEnterEventer: CanvasManager.PointerEventer;
    pointerDownEventer: CanvasManager.PointerEventer;
    pointerMoveEventer: CanvasManager.PointerEventer;
    pointerUpCancelEventer: CanvasManager.PointerEventer;
    pointerLeaveOutEventer: CanvasManager.PointerEventer;
    pointerDragStartEventer: CanvasManager.PointerDragStartEventer;
    pointerDragEventer: CanvasManager.PointerDragEventer;
    pointerDragEndEventer: CanvasManager.PointerDragEventer;
    wheelMoveEventer: CanvasManager.WheelEventer;
    clickEventer: CanvasManager.MouseEventer;
    dblClickEventer: CanvasManager.MouseEventer;
    contextMenuEventer: CanvasManager.MouseEventer;

    touchStartEventer: CanvasManager.TouchEventer;
    touchMoveEventer: CanvasManager.TouchEventer;
    touchEndEventer: CanvasManager.TouchEventer;

    copyEventer: CanvasManager.ClipboardEventer;

    dragStartEventer: CanvasManager.DragEventer;

    private _mouseLocation = Point.create(-1, -1);
    // origin = null;
    private _pointerEntered = false;
    private _pointerDownState: CanvasManager.PointerDownState = CanvasManager.PointerDownState.NotDown;
    private _pointerDragInternal: boolean;

    // private _repeatKeyCount = 0;
    // private _repeatKey: string | undefined;
    // private _repeatKeyStartTime = 0;

    readonly instanceId = getNextInstanceId();
    readonly canvasContainerElement: HTMLElement;
    readonly canvasElement: HTMLCanvasElement;
    /** @internal */
    readonly gc: CachedCanvasRenderingContext2D;
    /** @internal */
    private _started = false;
    /** @internal */
    private _flooredContainerWidth: number;
    /** @internal */
    private _flooredContainerHeight: number;
    // bodyZoomFactor: number;
    /** @internal */
    private _bounds = new InexclusiveRectangle(0, 0, 0, 0);
    /** @internal */
    private _devicePixelRatio = 1;
    /** @internal */
    private _containerWidth: number;
    /** @internal */
    private _containerHeight: number;

    /** @internal
     * Used in dragging when no drag image is wanted
     */
    private _emptyImage: HTMLImageElement;

    /** @internal */
    private _resizeTimeoutId: ReturnType<typeof setTimeout> | undefined;

    /** @internal */
    private _resizeObserver = new ResizeObserver(() => {
        setTimeout(() => this.resize(true), 0); // do not process within observer callback
    })

    private pointerUpCancelEventListener = (event: PointerEvent) => {
        // event.preventDefault(); // no mouse event

        switch (this._pointerDownState) {
            case CanvasManager.PointerDownState.NotDown:
                break;
            case CanvasManager.PointerDownState.NotDragging:
                this.setPointerDownState(CanvasManager.PointerDownState.NotDown, event);
                break;
            case CanvasManager.PointerDownState.DragStarting:
                this.pointerUpCancelEventer(event);
                this.setPointerDownState(CanvasManager.PointerDownState.NotDown, event);
                break;
            case CanvasManager.PointerDownState.Dragging:
                this.pointerDragEndEventer(event, this._pointerDragInternal);
                this.pointerUpCancelEventer(event);
                this.setPointerDownState(CanvasManager.PointerDownState.IgnoreClickAfterDrag, event);
                break;
            case CanvasManager.PointerDownState.IgnoreClickAfterDrag:
                this.setPointerDownState(CanvasManager.PointerDownState.NotDown, event);
                break;
            default:
                throw new UnreachableCaseError('CMPUCEL34440', this._pointerDownState);
        }
    };

    private pointerLeaveOutListener = (event: PointerEvent) => {
        // event.preventDefault(); // no mouse event

        if (this._pointerEntered) {
            this.pointerLeaveOutEventer(event);
            this._pointerEntered = false;
        }
    }

    private keyDownEventListener = (e: KeyboardEvent) => {
        if (this.hasFocus()) {
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
    private keyUpEventListener = (e: KeyboardEvent) => {
        if (this.hasFocus()) {
            this.checkPreventDefault(e);

            // this._repeatKeyCount = 0;
            // this._repeatKey = undefined;
            // this._repeatKeyStartTime = 0;

            // const eventDetail = this.createKeyboardEventDetail(e);
            this.keyUpEventer(e);
        }
    }

    private focusEventListener = (e: FocusEvent) => {
        this.focusEventer(e);
    }
    private blurEventListener = (e: FocusEvent) => {
        this.blurEventer(e);
    }

    private clickEventListener = (e: MouseEvent) => {
        if (this._pointerDownState === CanvasManager.PointerDownState.IgnoreClickAfterDrag) {
            this.setPointerDownState(CanvasManager.PointerDownState.NotDown, undefined);
        } else {
            this.clickEventer(e);
        }
    };
    private dblClickEventListener = (e: MouseEvent) => {
        this.dblClickEventer(e);
    };
    private contextMenuEventListener = (e: MouseEvent) => {
        this.contextMenuEventer(e);
    };

    private touchStartEventListener = (e: TouchEvent) => {
        this.touchStartEventer(e);
    }
    private touchMoveEventListener = (e: TouchEvent) => {
        this.touchMoveEventer(e);
    }
    private touchEndEventListener = (e: TouchEvent) => {
        this.touchEndEventer(e);
    }

    private copyEventListener = (e: ClipboardEvent) => {
        if (this.hasFocus()) {
            this.copyEventer(e);
        }
    }

    constructor(
        readonly containerElement: HTMLElement,
        canvasRenderingContext2DSettings: CanvasRenderingContext2DSettings | undefined,
        private readonly _gridSettings: BGS,
    ) {
        // create and append the canvas
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.id = CanvasManager.canvasElementIdBase + this.instanceId.toString();
        this.canvasElement.draggable = true;
        this.canvasElement.tabIndex = 0;
        this.canvasElement.style.outline = 'none';
        this.canvasElement.classList.add(CssClassName.gridElementCssClass);

        this.gc = createCachedContext(this.canvasElement, canvasRenderingContext2DSettings);

        this.containerElement.appendChild(this.canvasElement);

        this._emptyImage = document.createElement('img');
        this._emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        this.canvasElement.addEventListener('pointerdown', (event) => {
            // event.preventDefault(); // no mouse event

            switch (this._pointerDownState) {
                case CanvasManager.PointerDownState.NotDown:
                    this.setPointerDownState(CanvasManager.PointerDownState.NotDragging, event);
                    this.pointerDownEventer(event);
                    break;
                case CanvasManager.PointerDownState.NotDragging:
                    // must have lost a pointer up event
                    this.pointerDownEventer(event);
                    break;
                case CanvasManager.PointerDownState.IgnoreClickAfterDrag:
                    // must have lost a click event
                    this.pointerDownEventer(event);
                    break;
                case CanvasManager.PointerDownState.DragStarting:
                case CanvasManager.PointerDownState.Dragging:
                    // Should normally never occur but debugger can trigger this transition
                    this.pointerUpCancelEventListener(event); // pretend pointer went up
                    this.pointerDownEventer(event);
                    break;

                default:
                    throw new UnreachableCaseError('CMCAELPDU34440', this._pointerDownState);
            }
        });
        this.canvasElement.addEventListener('pointermove', (event) => {
            // event.preventDefault(); // no mouse event

            switch (this._pointerDownState) {
                case CanvasManager.PointerDownState.NotDown:
                case CanvasManager.PointerDownState.NotDragging:
                case CanvasManager.PointerDownState.IgnoreClickAfterDrag:
                    this.pointerMoveEventer(event);
                    break;
                case CanvasManager.PointerDownState.DragStarting: {
                    this.pointerMoveEventer(event);
                    this.setPointerDownState(CanvasManager.PointerDownState.Dragging, event);
                    this.pointerDragEventer(event, this._pointerDragInternal);
                    break;
                }
                case CanvasManager.PointerDownState.Dragging:
                    this.pointerMoveEventer(event);
                    this.pointerDragEventer(event, this._pointerDragInternal);
                    break;
                default:
                    throw new UnreachableCaseError('CMCAELPMU34440', this._pointerDownState);
            }

        });
        this.canvasElement.addEventListener('pointerenter', (event) => {
            // event.preventDefault(); // no mouse event

            this._pointerEntered = true;
            this.pointerEnterEventer(event);
        });
        this.canvasElement.addEventListener('pointerleave', (event) => {
            if (this._pointerEntered) {
                this.pointerLeaveOutEventer(event);
                this._pointerEntered = false;
            }
        });
        this.canvasElement.addEventListener('pointerout', (event) => {
            if (this._pointerEntered) {
                this.pointerLeaveOutEventer(event);
                this._pointerEntered = false;
            }
        });
        this.canvasElement.addEventListener('pointerup', this.pointerUpCancelEventListener);
        this.canvasElement.addEventListener('pointercancel', this.pointerUpCancelEventListener);
        this.canvasElement.addEventListener('wheel', (event) => {
            const pointerDownState = this._pointerDownState;
            if (pointerDownState !== CanvasManager.PointerDownState.Dragging) {
                this.wheelMoveEventer(event);
            }
        });
        this.canvasElement.addEventListener('keydown', this.keyDownEventListener);
        this.canvasElement.addEventListener('keyup', this.keyUpEventListener);
        this.canvasElement.addEventListener('focus', this.focusEventListener);
        this.canvasElement.addEventListener('blur', this.blurEventListener);
        this.canvasElement.addEventListener('click', this.clickEventListener);
        this.canvasElement.addEventListener('dblclick', this.dblClickEventListener);
        this.canvasElement.addEventListener('contextmenu', this.contextMenuEventListener);
        this.canvasElement.addEventListener('touchstart', this.touchStartEventListener);
        this.canvasElement.addEventListener('touchmove', this.touchMoveEventListener);
        this.canvasElement.addEventListener('touchend', this.touchEndEventListener);
        this.canvasElement.addEventListener('copy', this.copyEventListener);

        this.canvasElement.addEventListener('dragstart', (event) => {
            this.dragStartEventer(event);
            const dataTransfer = event.dataTransfer;
            if (dataTransfer === null || dataTransfer.items.length === 0) {
                event.preventDefault();

                if (
                    this._pointerDownState !== CanvasManager.PointerDownState.NotDragging &&
                    this._pointerDownState !== CanvasManager.PointerDownState.NotDown // Debugger can cause this unexpected state
                ) {
                    throw new AssertError('CMCAELDS1220');
                } else {
                    const pointerDragInternal = this.pointerDragStartEventer(event);
                    if (pointerDragInternal !== undefined) {
                        this._pointerDragInternal = pointerDragInternal;
                        this.setPointerDownState(CanvasManager.PointerDownState.DragStarting, undefined);
                    }
                }
            }
        });
    }

    get bounds() { return this._bounds; }
    get devicePixelRatio() { return this._devicePixelRatio; }
    get flooredContainerWidth() { return this._flooredContainerWidth; }
    get flooredContainerHeight() { return this._flooredContainerHeight; }
    get emptyImage() { return this._emptyImage; }

    addExternalEventListener(eventName: string, listener: CanvasManager.EventListener) {
        this.canvasElement.addEventListener(eventName, listener as EventListener);
    }

    removeExternalEventListener(eventName: string, listener: CanvasManager.EventListener) {
        this.canvasElement.removeEventListener(eventName, listener);
    }

    start() {
        this._gridSettings.resizeEventer = () => this.resize(false);
        this._resizeObserver.observe(this.containerElement);
        this._started = true;
    }

    stop() {
        this._resizeObserver.disconnect();
        this._gridSettings.resizeEventer = undefined;
        this.checkClearResizeTimeout();
        this._started = true;
    }

    checksize() {
        const containerRect = this.getContainerBoundingClientRect();
        if (containerRect.width !== this._containerWidth || containerRect.height !== this._containerHeight) {
            this.resize(true, containerRect);
        }
    }

    resize(debounceEvent: boolean, containerRect?: DOMRect) {
        if (containerRect === undefined) {
            containerRect = this.getContainerBoundingClientRect();
        }

        const oldWidth = this._bounds.width;
        const oldHeight = this._bounds.height;
        let imageData: ImageData | undefined;
        if (oldWidth > 0 && oldHeight > 0) {
           imageData = this.gc.getImageData(0, 0, oldWidth * this._devicePixelRatio, oldHeight * this._devicePixelRatio);
        }

        this._containerWidth = containerRect.width;
        this._containerHeight = containerRect.height;

        const width = Math.floor(this._containerWidth);
        const height = Math.floor(this._containerHeight);

        this._flooredContainerWidth = width;
        this._flooredContainerHeight = height;

        // http://www.html5rocks.com/en/tutorials/canvas/hidpi/
        const ratio = (this._gridSettings.useHiDPI && window.devicePixelRatio !== undefined) ? window.devicePixelRatio : 1;

        const ratioChanged = ratio !== this._devicePixelRatio;
        this._devicePixelRatio = ratio;
        // this._devicePixelRatio = ratio *= this.bodyZoomFactor;

        this.canvasElement.width = Math.floor(width * ratio);
        this.canvasElement.height = Math.floor(height * ratio);

        this.canvasElement.style.width = width + 'px';
        this.canvasElement.style.height = height + 'px';

        if (imageData !== undefined && !ratioChanged) {
            this.gc.putImageData(imageData, 0, 0);
        }

        this.gc.scale(ratio, ratio);

        this._bounds = new InexclusiveRectangle(0, 0, width, height);

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

    getBounds() {
        return this._bounds;
    }

    // /**
    //  * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672}
    //  * @this CanvasType
    //  */
    // private dispatchNewEvent<T extends EventName>(eventName: T, detail?: EventName.DetailMap[T]) {
    //     const event = newEvent(eventName, detail);
    //     return this.canvas.dispatchEvent(event);
    // }

    // finkeydown(e: KeyboardEvent) {
    //     if (!this.hasFocus()) {
    //         return;
    //     }

    //     this.checkPreventDefault(e);

    //     const key = e.key;

    //     if (e.repeat) {
    //         if (this.repeatKey === key) {
    //             this.repeatKeyCount++;
    //         } else {
    //             this.repeatKey = key;
    //             this.repeatKeyStartTime = Date.now();
    //         }
    //     } else {
    //         this.repeatKey = undefined;
    //         this.repeatKeyCount = 0;
    //         this.repeatKeyStartTime = 0;
    //     }


    //     const keyboardDetail = e as CanvasEx.WritableEventDetailKeyboard;
    //     keyboardDetail.revgrid_nowTime = Date.now();
    //     keyboardDetail.revgrid_repeatCount = this.repeatKeyCount;
    //     keyboardDetail.revgrid_repeatStartTime = this.repeatKeyStartTime;

    //     this.dispatchNewEvent('rev-canvas-keydown', keyboardDetail);
    // }

    // finkeyup(e: KeyboardEvent) {
    //     if (!this.hasFocus()) {
    //         return;
    //     }

    //     this.checkPreventDefault(e);

    //     this.repeatKeyCount = 0;
    //     this.repeatKey = undefined;
    //     this.repeatKeyStartTime = 0;

    //     const keyboardDetail: EventDetail.Keyboard = /*this.defKeysProp(e, 'currentKeys',*/ {
    //         time: Date.now(),
    //         primitiveEvent: e,
    //         // legacyChar: e.legacyKey,
    //         // code: e.charCode,
    //         // key: e.keyCode,
    //         repeat: this.repeatKeyCount,
    //         repeatStartTime: this.repeatKeyStartTime,
    //     };

    //     this.dispatchNewEvent('rev-canvas-keyup', keyboardDetail);
    // }

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672}
     * @this CanvasType
     */
    getOffsetPoint<T extends MouseEvent|Touch>(mouseEventOrTouch: T) {
        const rect = this.getCanvasBoundingClientRect();

        const offsetPoint = Point.create(
            mouseEventOrTouch.clientX /* / this.bodyZoomFactor*/ - rect.left,
            mouseEventOrTouch.clientY /* / this.bodyZoomFactor*/ - rect.top
        );

        return offsetPoint;
    }

    hasFocus() {
        return document.activeElement === this.canvasElement;
    }

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672}
     * @this CanvasType
     */
    takeFocus() {
        if (!this.hasFocus()) {
            setTimeout(() => {
                this.canvasElement.focus();
            }, 10);
        }
    }

    dispatchEvent(e: Event) {
        return this.canvasElement.dispatchEvent(e);
    }

    setCursor(cursorName: string | undefined) {
        if (cursorName === undefined) {
            this.canvasElement.style.cursor = '';
        } else {
            this.canvasElement.style.cursor = cursorName;
        }
    }

    setTitleText(titleText: string) {
        this.canvasElement.title = titleText;
    }

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

    private fireResizedEvents() {
        this.resizedEventerForViewLayout();
        this.resizedEventerForEventBehavior();
    }

    private checkClearResizeTimeout() {
        if (this._resizeTimeoutId !== undefined) {
            clearTimeout(this._resizeTimeoutId);
            this._resizeTimeoutId = undefined;
        }
    }

    private setPointerDownState(state: CanvasManager.PointerDownState, event: PointerEvent | undefined) {
        switch (state) {
            case CanvasManager.PointerDownState.NotDown:
            case CanvasManager.PointerDownState.NotDragging:
            case CanvasManager.PointerDownState.IgnoreClickAfterDrag:
                document.body.style.userSelect = '';
                if (event !== undefined) {
                    this.canvasElement.releasePointerCapture(event.pointerId);
                } else {
                    if (this._pointerDownState !== CanvasManager.PointerDownState.IgnoreClickAfterDrag) {
                        throw new AssertError('CMSPDSN68201');
                    }
                }
                break;
            case CanvasManager.PointerDownState.DragStarting:
                document.body.style.userSelect = 'none';
                break;
            case CanvasManager.PointerDownState.Dragging:
                document.body.style.userSelect = 'none';
                if (event === undefined) {
                    throw new AssertError('CMSPDSR68201');
                } else {
                    this.canvasElement.setPointerCapture(event.pointerId);
                }
                break;
            default:
                throw new UnreachableCaseError('CMSPDS87732', state);
        }

        this._pointerDownState = state;
    }

    private checkPreventDefault(e: KeyboardEvent) {
        // prevent TAB from moving focus off the canvas element
        switch (e.key) {
            case 'TAB':
            case 'TABSHIFT':
            case 'Tab':
                e.preventDefault();
        }
    }

    private getContainerBoundingClientRect() {
        return this.containerElement.getBoundingClientRect();
    }

    private getCanvasBoundingClientRect() {
        return this.canvasElement.getBoundingClientRect();
    }

    // private createKeyboardEventDetail(e: KeyboardEvent): CanvasManager.RevgridKeyboardEvent {
    //     const keyboardDetail = e as CanvasManager.WritableEventDetailKeyboard;
    //     keyboardDetail.revgrid_nowTime = Date.now();
    //     keyboardDetail.revgrid_repeatCount = this._repeatKeyCount;
    //     keyboardDetail.revgrid_repeatStartTime = this._repeatKeyStartTime;

    //     keyboardDetail.revgrid_navigateKey = this.createKeyboardNavigateKey(e.key);

    //     return keyboardDetail;
    // }

    // private createKeyboardNavigateKey(code: string) {
    //     switch (code) {
    //         case 'ArrowLeft': return CanvasManager.Keyboard.NavigateKey.left;
    //         case 'ArrowRight': return CanvasManager.Keyboard.NavigateKey.right;
    //         case 'ArrowUp': return CanvasManager.Keyboard.NavigateKey.up;
    //         case 'ArrowDown': return CanvasManager.Keyboard.NavigateKey.down;
    //         case 'PageUp': return CanvasManager.Keyboard.NavigateKey.pageUp;
    //         case 'PageDown': return CanvasManager.Keyboard.NavigateKey.pageDown;
    //         case 'Home': return CanvasManager.Keyboard.NavigateKey.home;
    //         case 'End': return CanvasManager.Keyboard.NavigateKey.end;
    //         default:
    //             return undefined;
    //     }
    // }
}
    // fixCurrentKeys(keyChar: string, keydown: boolean) {
    //     const index = this.currentKeys.indexOf(keyChar);

    //     if (!keydown && index >= 0) {
    //         this.currentKeys.splice(index, 1);
    //     }

    //     if (keyChar === 'SHIFT') {
    //         // on keydown, replace unshifted keys with shifted keys
    //         // on keyup, vice-versa
    //         this.currentKeys.forEach((key, index, currentKeys) => {
    //             const foundPair = Canvas.charMap.find((pair) => {
    //                 return pair[keydown ? 0 : 1] === key;
    //             });
    //             if (foundPair) {
    //                 currentKeys[index] = foundPair[keydown ? 1 : 0];
    //             }
    //         });
    //     }

    //     if (keydown && index < 0) {
    //         this.currentKeys.push(keyChar);
    //     }
    // }

    // private fixCurrentKeysFromEvent(event: KeyboardEvent) {
    //     let shiftKey: boolean;
    //     if ('shiftKey' in event) {
    //         shiftKey = event.shiftKey;
    //         this.fixCurrentKeys('SHIFT', shiftKey);
    //     } else {
    //         shiftKey = this.currentKeys.indexOf('SHIFT') >= 0;
    //     }
    //     const SHIFT = shiftKey ? 'SHIFT' : '';
    //     if ('ctrlKey' in event) {
    //         this.fixCurrentKeys('CTRL' + SHIFT, event.ctrlKey);
    //     }
    //     if ('altKey' in event) {
    //         this.fixCurrentKeys('ALT' + SHIFT, event.altKey);
    //     }
    // }
// }

// function paintLoopFunction(now: number) {
//     if (paintRequestAnimationFrameHandle !== undefined) {
//         paintables.forEach(
//             (paintable) => {
//                 try {
//                     paintable.tickPainter(now);
//                 } catch (e) {
//                     console.error(e);
//                 }

//                 if (paintable.component.tickNotification) {
//                     paintable.component.tickNotification();
//                 }
//             }
//         );
//         paintRequestAnimationFrameHandle = requestAnimationFrame(paintLoopFunction);
//     }
// }
// function restartPaintLoop() {
//     if (paintRequestAnimationFrameHandle === undefined) {
//         paintRequestAnimationFrameHandle = requestAnimationFrame(paintLoopFunction);
//     }
// }

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// function stopPaintLoop() {
//     if (paintRequestAnimationFrameHandle !== undefined) {
//         cancelAnimationFrame(paintRequestAnimationFrameHandle);
//         paintRequestAnimationFrameHandle = undefined;
//     }
// }
// restartPaintLoop();

// function resizablesLoopFunction() {
//     if (resizeSetIntervalHandle !== undefined) {
//         for (let i = 0; i < resizables.length; i++) {
//             try {
//                 resizables[i].tickResizer();
//             } catch (e) {
//                 console.error(e);
//             }
//         }
//     }
// }
// function restartResizeLoop() {
//     if (resizeSetIntervalHandle === undefined) {
//         resizeSetIntervalHandle = setInterval(resizablesLoopFunction, RESIZE_POLLING_INTERVAL);
//     }
// }

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// function stopResizeLoop() {
//     if (resizeSetIntervalHandle !== undefined) {
//         clearInterval(resizeSetIntervalHandle);
//         resizeSetIntervalHandle = undefined;
//     }
// }
// restartResizeLoop();

function createCachedContext(
    canvasElement: HTMLCanvasElement,
    canvasRenderingContext2DSettings: CanvasRenderingContext2DSettings | undefined // lookup getContextAttributes for more info
) {
    const canvasRenderingContext2D = canvasElement.getContext('2d', canvasRenderingContext2DSettings);
    // const props = {};
    // let values = {};

    // // Stub out all the prototype members of the canvas 2D graphics context:
    // Object.keys(Object.getPrototypeOf(canvasRenderingContext2D)).forEach(makeStub);

    // // Some older browsers (e.g., Chrome 40) did not have all members of canvas
    // // 2D graphics context in the prototype so we make this additional call:
    // Object.keys(canvasRenderingContext2D).forEach(makeStub);

    // function makeStub(key: string) {
    //     if (
    //         !(key in props) &&
    //         !/^(webkit|moz|ms|o)[A-Z]/.test(key) &&
    //         typeof canvasRenderingContext2D[key] !== 'function'
    //     ) {
    //         Object.defineProperty(props, key, {
    //             get: function() {
    //                 return (values[key] = values[key] || canvasRenderingContext2D[key]);
    //             },
    //             set: function(value) {
    //                 if (value !== values[key]) {
    //                     canvasRenderingContext2D[key] = values[key] = value;
    //                 }
    //             }
    //         });
    //     }
    // }

    if (canvasRenderingContext2D === null) {
        throw new AssertError('CGCC74443');
    } else {
        const gc = new CachedCanvasRenderingContext2D(canvasRenderingContext2D);

        // Object.getOwnPropertyNames(Canvas.graphicsContextAliases).forEach(function(alias) {
        //     gc[alias] = gc[Canvas.graphicsContextAliases[alias]];
        // });

        return gc;
    }
}

// Canvas.graphicsContextAliases = {
//     simpleText: 'fillText'
// };

/** @public */
export namespace CanvasManager {
    export type EventListener = (this: void, event: Event) => void;

    export type ResizedEventer = (this: void) => void;
    export type RepaintEventer = (this: void) => void;

    export type FocusEventer = (this: void, event: FocusEvent) => void;
    export type MouseEventer = (this: void, event: MouseEvent) => void;
    export type PointerEventer = (this: void, event: PointerEvent) => void;
    export type PointerDragStartEventer = (this: void, event: DragEvent) => boolean | undefined; // internal (true), external (false), not started (undefined)
    export type PointerDragEventer = (this: void, event: PointerEvent, internal: boolean) => void;
    export type WheelEventer = (this: void, event: WheelEvent) => void;
    export type KeyEventer = (this: void, event: KeyboardEvent) => void;
    export type TouchEventer = (this: void, event: TouchEvent) => void;
    export type ClipboardEventer = (this: void, event: ClipboardEvent) => void;
    export type DragEventer = (this: void, event: DragEvent) => void;

    export const enum PointerDownState {
        NotDown,
        NotDragging,
        DragStarting,
        Dragging,
        IgnoreClickAfterDrag,
    }
    // export type WritableEventDetailKeyboard = Writable<RevgridKeyboardEvent>;

    // export interface RevgridKeyboardEvent extends KeyboardEvent {
    //     readonly revgrid_nowTime: number;
    //     readonly revgrid_repeatCount: number;
    //     readonly revgrid_repeatStartTime: number;
    //     readonly revgrid_navigateKey: Keyboard.NavigateKey | undefined;
    // }

    // export namespace Keyboard {
    //     export const enum NavigateKey {
    //         left,
    //         right,
    //         up,
    //         down,
    //         pageUp,
    //         pageDown,
    //         home,
    //         end,
    //     }
    // }

    export const canvasElementIdBase = 'revgrid-canvas-';
}

let instanceId = 0;

function getNextInstanceId() {
    return ++instanceId;
}
