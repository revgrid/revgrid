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

import { GridSettings } from '../../interfaces/grid-settings';
import { CssClassName } from '../../lib/html-types';
import { Point } from '../../lib/point';
import { Rectangle } from '../../lib/rectangle';
import { AssertError } from '../../lib/revgrid-error';
import { Writable } from '../../lib/types';
import { CanvasRenderingContext2DEx } from './canvas-rendering-context-2d-ex';

/** @public */
export class CanvasEx {
    // focuser = null; // does not seem to be implemented
    // buffer = null;
    // ctx = null;

    repaintEventer: CanvasEx.RepaintEventer;

    focusEventer: CanvasEx.FocusEventer;
    blurEventer: CanvasEx.FocusEventer;

    keyDownEventer: CanvasEx.KeyEventer;
    keyUpEventer: CanvasEx.KeyEventer;

    mouseClickEventer: CanvasEx.MouseEventer;
    mouseDblClickEventer: CanvasEx.MouseEventer;
    mouseDownEventer: CanvasEx.MouseEventer;
    mouseUpEventer: CanvasEx.MouseEventer;
    mouseMoveEventer: CanvasEx.MouseEventer;
    mouseDragStartEventer: CanvasEx.MouseEventer;
    mouseDragEventer: CanvasEx.MouseEventer;
    mouseDragEndEventer: CanvasEx.MouseEventer;
    mouseOutEventer: CanvasEx.MouseEventer;
    wheelMoveEventer: CanvasEx.WheelEventer;
    contextMenuEventer: CanvasEx.MouseEventer;

    touchStartEventer: CanvasEx.TouchEventer;
    touchMoveEventer: CanvasEx.TouchEventer;
    touchEndEventer: CanvasEx.TouchEventer;

    copyEventer: CanvasEx.ClipboardEventer;

    mouseLocation = Point.create(-1, -1);
    dragstart = Point.create(-1, -1);
    // origin = null;
    mousedown = false;
    dragging = false;
    repeatKeyCount = 0;
    repeatKey: string | undefined;
    repeatKeyStartTime = 0;
    hasMouse = false;
    dragEndtime = Date.now();

    eventsEnabled = true;

    readonly canvasElement: HTMLCanvasElement;
    /** @internal */
    readonly gc: CanvasRenderingContext2DEx;
    width: number;
    height: number;
    // bodyZoomFactor: number;
    private _bounds = new Rectangle(0, 0, 0, 0);
    private _devicePixelRatio: number;
    private _containerWidth: number;
    private _containerHeight: number;

    private eventlistenerInfos = new Map<string, CanvasEx.ListenerInfo[]>();

    private _resizeObserver = new ResizeObserver(() => this.resize());

    private documentMouseMoveEventListener = (e: MouseEvent) => {
        if ((this.hasMouse || this.isDragging()) && this.eventsEnabled) {
            if (!this.isDragging() && this.mousedown) {
                this.beDragging();
                this.mouseDragStartEventer(e);
                this.dragstart = Point.create(this.mouseLocation.x, this.mouseLocation.y);
            }
            this.mouseLocation = this.getOffsetPoint(e);
            if (this.isDragging()) {
                this.mouseDragEventer(e);
            }
            if (this._bounds.containsPoint(this.mouseLocation)) {
                this.mouseMoveEventer(e);
            }
        }
    }
    private documentMouseUpEventListener = (e: MouseEvent) => {
        if (this.mousedown  && this.eventsEnabled) {
            // ignore document:mouseup unless preceded by a canvas:mousedown
            if (this.isDragging()) {
                this.mouseDragEndEventer(e);
                this.beNotDragging();
                this.dragEndtime = Date.now();
            }
            this.mousedown = false;
            this.mouseUpEventer(e);
        }
    };
    private documentWheelEventListener = (e: WheelEvent) => {
        if (!this.isDragging() && this.hasMouse && this.eventsEnabled) {
            this.wheelMoveEventer(e);
        }
    };

    private documentKeyDownEventListener = (e: KeyboardEvent) => {
        if (this.hasFocus() && this.eventsEnabled) {
            this.checkPreventDefault(e);

            const key = e.key;

            if (e.repeat) {
                if (this.repeatKey === key) {
                    this.repeatKeyCount++;
                } else {
                    this.repeatKey = key;
                    this.repeatKeyStartTime = Date.now();
                }
            } else {
                this.repeatKey = undefined;
                this.repeatKeyCount = 0;
                this.repeatKeyStartTime = 0;
            }

            const eventDetail = this.createKeyboardEventDetail(e);
            this.keyDownEventer(eventDetail);
        }
    }
    private documentKeyUpEventListener = (e: KeyboardEvent) => {
        if (this.hasFocus() && this.eventsEnabled) {
            this.checkPreventDefault(e);

            this.repeatKeyCount = 0;
            this.repeatKey = undefined;
            this.repeatKeyStartTime = 0;

            const eventDetail = this.createKeyboardEventDetail(e);
            this.keyUpEventer(eventDetail);
        }
    }

    private canvasFocusEventListener = (e: FocusEvent) => {
        if (this.eventsEnabled) {
            this.focusEventer(e);
        }
    }
    private canvasBlurEventListener = (e: FocusEvent) => {
        if (this.eventsEnabled) {
            this.blurEventer(e);
        }
    }

    private canvasMouseOverEventListener = () => { this.hasMouse = true; }
    private canvasMouseDownEventListener = (e: MouseEvent) => {
        this.mousedown = true;
        if (this.eventsEnabled) {
            this.mouseDownEventer(e);
        }
    }
    private canvasMouseOutEventListener = (e: MouseEvent) => {
        this.hasMouse = false;
        if (this.eventsEnabled) {
            this.mouseOutEventer(e);
        }
    }
    private canvasClickEventListener = (e: MouseEvent) => {
        if (this.eventsEnabled) {
            this.mouseClickEventer(e);
        }
    };
    private canvasDblClickEventListener = (e: MouseEvent) => {
        if (this.eventsEnabled) {
            this.mouseDblClickEventer(e);
        }
    };
    private canvasContextMenuEventListener = (e: MouseEvent) => {
        if (this.eventsEnabled) {
            this.contextMenuEventer(e);
        }
    };

    private canvasTouchStartEventListener = (e: TouchEvent) => {
        if (this.eventsEnabled) {
            this.touchStartEventer(e);
        }
    }
    private canvasTouchMoveEventListener = (e: TouchEvent) => {
        if (this.eventsEnabled) {
            this.touchMoveEventer(e);
        }
    }
    private canvasTouchEndEventListener = (e: TouchEvent) => {
        if (this.eventsEnabled) {
            this.touchEndEventer(e);
        }
    }

    private canvasCopyEventListener = (e: ClipboardEvent) => {
        if (this.hasFocus() && this.eventsEnabled) {
            this.copyEventer(e);
        }
    }

    constructor(
        private readonly _containerElement: HTMLElement,
        contextAttributes: CanvasRenderingContext2DSettings | undefined,
        private readonly _gridSettings: GridSettings,
        private readonly _resizedEventer: CanvasEx.ResizedEventer,
    ) {
        // create and append the canvas
        this.canvasElement = document.createElement('canvas');
        this.gc = getCachedContext(this.canvasElement, contextAttributes);

        this._containerElement.appendChild(this.canvasElement);

        document.addEventListener('mousemove', this.documentMouseMoveEventListener);
        document.addEventListener('mouseup', this.documentMouseUpEventListener);
        document.addEventListener('wheel', this.documentWheelEventListener);
        document.addEventListener('keydown', this.documentKeyDownEventListener);
        document.addEventListener('keyup', this.documentKeyUpEventListener);

        this.canvasElement.addEventListener('focus', this.canvasFocusEventListener);
        this.canvasElement.addEventListener('blur', this.canvasBlurEventListener);
        this.canvasElement.addEventListener('mouseover', this.canvasMouseOverEventListener);
        this.canvasElement.addEventListener('mousedown', this.canvasMouseDownEventListener);
        this.canvasElement.addEventListener('mouseout', this.canvasMouseOutEventListener);
        this.canvasElement.addEventListener('click', this.canvasClickEventListener);
        this.canvasElement.addEventListener('dblclick', this.canvasDblClickEventListener);
        this.canvasElement.addEventListener('contextmenu', this.canvasContextMenuEventListener);
        this.canvasElement.addEventListener('touchstart', this.canvasTouchStartEventListener);
        this.canvasElement.addEventListener('touchmove', this.canvasTouchMoveEventListener);
        this.canvasElement.addEventListener('touchend', this.canvasTouchEndEventListener);
        this.canvasElement.addEventListener('copy', this.canvasCopyEventListener);

        this.canvasElement.setAttribute('tabindex', '0');
        this.canvasElement.style.outline = 'none';

        this.canvasElement.classList.add(CssClassName.gridElementCssClass);
    }

    get bounds() { return this._bounds; }
    get devicePixelRatio() { return this._devicePixelRatio; }

    addExternalEventListener(eventName: string, listener: CanvasEx.EventListener) {
        let alreadyAttached: boolean;
        let listenerInfos = this.eventlistenerInfos.get(eventName);
        if (listenerInfos === undefined) {
            listenerInfos = [];
            alreadyAttached = false;
        } else {
            const listenerInfo = listenerInfos.find((info) => info.listener === listener);
            alreadyAttached = listenerInfo !== undefined;
        }

        if (!alreadyAttached) {
            const info: CanvasEx.ListenerInfo = {
                listener,
                decorator: (e: Event) => {
                    if (this.eventsEnabled) {
                        listener(e);
                    }
                }
            };
            listenerInfos.push(info);
            this.eventlistenerInfos.set(eventName, listenerInfos);

            this.canvasElement.addEventListener(eventName, listener as EventListener);
        }
    }

    removeExternalEventListener(eventName: string, listener: CanvasEx.EventListener) {
        const listenerInfos = this.eventlistenerInfos.get(eventName);

        if (listenerInfos !== undefined) {
            listenerInfos.find(
                (info, index) => {
                    if (info.listener === listener) {
                        if (listenerInfos.length === 1) {
                            this.eventlistenerInfos.delete(eventName);
                        } else {
                            listenerInfos.splice(index, 1); // remove it from the list
                        }
                        this.canvasElement.removeEventListener(eventName, info.decorator as EventListener);
                        return true;
                    } else {
                        return false;
                    }
                }
            )
        }
    }

    removeAllExternalEventListeners() {
        for (const [key, value] of this.eventlistenerInfos) {
            value.forEach(
                (info) => {
                    const eventName = key;
                    this.removeExternalEventListener(eventName, info.listener); // use base class so declare type as never
                }
            )
        }
    }

    start() {
        this.resize();
        this._resizeObserver.observe(this._containerElement);
    }

    stop() {
        this._resizeObserver.disconnect();
    }

    checksize() {
        const containerRect = this.getContainerBoundingClientRect();
        if (containerRect.width !== this._containerWidth || containerRect.height !== this._containerHeight) {
            this.resize(containerRect);
        }
    }

    resize(containerRect?: DOMRect) {
        if (containerRect === undefined) {
            containerRect = this.getContainerBoundingClientRect();
        }
        this._containerWidth = containerRect.width;
        this._containerHeight = containerRect.height;

        const width = Math.floor(this._containerWidth);
        const height = Math.floor(this._containerHeight);

        this.width = width;
        this.height = height;

        // http://www.html5rocks.com/en/tutorials/canvas/hidpi/
        const ratio = (this._gridSettings.useHiDPI && window.devicePixelRatio !== undefined) ? window.devicePixelRatio : 1;

        this._devicePixelRatio = ratio;
        // this._devicePixelRatio = ratio *= this.bodyZoomFactor;

        this.canvasElement.width = Math.floor(width * ratio);
        this.canvasElement.height = Math.floor(height * ratio);

        this.canvasElement.style.width = width + 'px';
        this.canvasElement.style.height = height + 'px';

        this.gc.scale(ratio, ratio);

        this._bounds = new Rectangle(0, 0, width, height);
        this._resizedEventer();
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
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
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
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
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

    setCursorAndTitleText(cursorName: string | undefined, titleText: string) {
        if (cursorName === undefined) {
            this.canvasElement.style.cursor = '';
        } else {
            this.canvasElement.style.cursor = cursorName;
        }

        this.canvasElement.title = titleText;
    }

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    private beDragging() {
        this.dragging = true;
        this.disableDocumentElementSelection();
    }

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    private beNotDragging() {
        this.dragging = false;
        this.enableDocumentElementSelection();
    }

    private isDragging() {
        return this.dragging;
    }

    private disableDocumentElementSelection() {
        const style = document.body.style;
        style.cssText = style.cssText + ' user-select: none';
    }

    private enableDocumentElementSelection() {
        const style = document.body.style;
        style.cssText = style.cssText.replace(' user-select: none', '');
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
        return this._containerElement.getBoundingClientRect();
    }

    private getCanvasBoundingClientRect() {
        return this.canvasElement.getBoundingClientRect();
    }

    private createKeyboardEventDetail(e: KeyboardEvent): CanvasEx.RevgridKeyboardEvent {
        const keyboardDetail = e as CanvasEx.WritableEventDetailKeyboard;
        keyboardDetail.revgrid_nowTime = Date.now();
        keyboardDetail.revgrid_repeatCount = this.repeatKeyCount;
        keyboardDetail.revgrid_repeatStartTime = this.repeatKeyStartTime;

        keyboardDetail.revgrid_navigateKey = this.createKeyboardNavigateKey(e.code);

        return keyboardDetail;
    }

    private createKeyboardNavigateKey(code: string) {
        switch (code) {
            case 'ArrowLeft': return CanvasEx.Keyboard.NavigateKey.left;
            case 'ArrowRight': return CanvasEx.Keyboard.NavigateKey.right;
            case 'ArrowUp': return CanvasEx.Keyboard.NavigateKey.up;
            case 'ArrowDown': return CanvasEx.Keyboard.NavigateKey.down;
            case 'PageUp': return CanvasEx.Keyboard.NavigateKey.pageUp;
            case 'PageDown': return CanvasEx.Keyboard.NavigateKey.pageDown;
            case 'Home': return CanvasEx.Keyboard.NavigateKey.home;
            case 'End': return CanvasEx.Keyboard.NavigateKey.end;
            default:
                return undefined;
        }
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
}

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

function getCachedContext(canvasElement: HTMLCanvasElement, contextAttributes: CanvasRenderingContext2DSettings | undefined) {
    const canvasRenderingContext2D = canvasElement.getContext('2d', contextAttributes);
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
        const gc = new CanvasRenderingContext2DEx(canvasRenderingContext2D);

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
export namespace CanvasEx {
    export type EventListener = (this: void, event: Event) => void;

    export type ResizedEventer = (this: void) => void;
    export type RepaintEventer = (this: void) => void;

    export type FocusEventer = (this: void, event: FocusEvent) => void;
    export type MouseEventer = (this: void, event: MouseEvent) => void;
    export type WheelEventer = (this: void, event: WheelEvent) => void;
    export type KeyEventer = (this: void, event: RevgridKeyboardEvent) => void;
    export type TouchEventer = (this: void, event: TouchEvent) => void;
    export type ClipboardEventer = (this: void, event: ClipboardEvent) => void;

    export type WritableEventDetailKeyboard = Writable<RevgridKeyboardEvent>;

    export interface RevgridKeyboardEvent extends KeyboardEvent {
        readonly revgrid_nowTime: number;
        readonly revgrid_repeatCount: number;
        readonly revgrid_repeatStartTime: number;
        readonly revgrid_navigateKey: Keyboard.NavigateKey | undefined;
    }

    export namespace Keyboard {
        export const enum NavigateKey {
            left,
            right,
            up,
            down,
            pageUp,
            pageDown,
            home,
            end,
        }
    }

    export interface Box {
        top: number;
        right: number;
        bottom: number;
        left: number;
        width: number;
        height: number;
        x: number;
        y: number;
    }

    export abstract class ListenerInfo {
        abstract listener: CanvasEx.EventListener;
        abstract decorator: CanvasEx.EventListener;
    }

    export type CharShiftPair = [down: string, up: string];
    export const charMap: CharShiftPair[] = makeCharMap();

    function makeCharMap() {
        const map = Array<CharShiftPair>();

        const empty: CharShiftPair = ['', ''];

        for (let i = 0; i < 256; i++) {
            map[i] = empty;
        }

        map[27] = ['ESC', 'ESCSHIFT'];
        map[192] = ['`', '~'];
        map[49] = ['1', '!'];
        map[50] = ['2', '@'];
        map[51] = ['3', '#'];
        map[52] = ['4', '$'];
        map[53] = ['5', '%'];
        map[54] = ['6', '^'];
        map[55] = ['7', '&'];
        map[56] = ['8', '*'];
        map[57] = ['9', '('];
        map[48] = ['0', ')'];
        map[189] = ['-', '_'];
        map[187] = ['=', '+'];
        map[8] = ['BACKSPACE', 'BACKSPACESHIFT'];
        map[46] = ['DELETE', 'DELETESHIFT'];
        map[9] = ['TAB', 'TABSHIFT'];
        map[81] = ['q', 'Q'];
        map[87] = ['w', 'W'];
        map[69] = ['e', 'E'];
        map[82] = ['r', 'R'];
        map[84] = ['t', 'T'];
        map[89] = ['y', 'Y'];
        map[85] = ['u', 'U'];
        map[73] = ['i', 'I'];
        map[79] = ['o', 'O'];
        map[80] = ['p', 'P'];
        map[219] = ['[', '{'];
        map[221] = [']', '}'];
        map[220] = ['\\', '|'];
        map[220] = ['CAPSLOCK', 'CAPSLOCKSHIFT'];
        map[65] = ['a', 'A'];
        map[83] = ['s', 'S'];
        map[68] = ['d', 'D'];
        map[70] = ['f', 'F'];
        map[71] = ['g', 'G'];
        map[72] = ['h', 'H'];
        map[74] = ['j', 'J'];
        map[75] = ['k', 'K'];
        map[76] = ['l', 'L'];
        map[186] = [';', ':'];
        map[222] = ['\'', '|'];
        map[13] = ['RETURN', 'RETURNSHIFT'];
        map[16] = ['SHIFT', 'SHIFT'];
        map[90] = ['z', 'Z'];
        map[88] = ['x', 'X'];
        map[67] = ['c', 'C'];
        map[86] = ['v', 'V'];
        map[66] = ['b', 'B'];
        map[78] = ['n', 'N'];
        map[77] = ['m', 'M'];
        map[188] = [',', '<'];
        map[190] = ['.', '>'];
        map[191] = ['/', '?'];
        map[16] = ['SHIFT', 'SHIFT'];
        map[17] = ['CTRL', 'CTRLSHIFT'];
        map[18] = ['ALT', 'ALTSHIFT'];
        map[91] = ['COMMANDLEFT', 'COMMANDLEFTSHIFT'];
        map[32] = ['SPACE', 'SPACESHIFT'];
        map[93] = ['COMMANDRIGHT', 'COMMANDRIGHTSHIFT'];
        map[18] = ['ALT', 'ALTSHIFT'];
        map[38] = ['UP', 'UPSHIFT'];
        map[37] = ['LEFT', 'LEFTSHIFT'];
        map[40] = ['DOWN', 'DOWNSHIFT'];
        map[39] = ['RIGHT', 'RIGHTSHIFT'];

        map[33] = ['PAGEUP', 'PAGEUPSHIFT'];
        map[34] = ['PAGEDOWN', 'PAGEDOWNSHIFT'];
        map[35] = ['PAGERIGHT', 'PAGERIGHTSHIFT']; // END
        map[36] = ['PAGELEFT', 'PAGELEFTSHIFT']; // HOME

        map[112] = ['F1', 'F1SHIFT'];
        map[113] = ['F2', 'F2SHIFT'];
        map[114] = ['F3', 'F3SHIFT'];
        map[115] = ['F4', 'F4SHIFT'];
        map[116] = ['F5', 'F5SHIFT'];
        map[117] = ['F6', 'F6SHIFT'];
        map[118] = ['F7', 'F7SHIFT'];
        map[119] = ['F8', 'F8SHIFT'];
        map[120] = ['F9', 'F9SHIFT'];
        map[121] = ['F10', 'F10SHIFT'];
        map[122] = ['F11', 'F11SHIFT'];
        map[123] = ['F12', 'F12SHIFT'];

        return map;
    }
}