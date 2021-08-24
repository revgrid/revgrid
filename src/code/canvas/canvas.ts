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

import { CanvasRenderingContext2DEx } from '../canvas/canvas-rendering-context-2d-ex';
import { CellEditor } from '../cell-editor/cell-editor';
import { Hypegrid } from '../grid/hypegrid';
import { Point } from '../lib/point';
import { Rectangle } from '../lib/rectangular';
import { numberToPixels } from '../lib/utils';
import { Renderer } from '../renderer/renderer';

/** @internal */
const RESIZE_POLLING_INTERVAL = 200;
/** @internal */
const paintables: Canvas[] = [];
/** @internal */
const resizables: Canvas[] = [];
/** @internal */
let paintRequestAnimationFrameHandle: number;
/** @internal */
let resizeSetIntervalHandle: ReturnType<typeof setInterval> | undefined;

/** @public */
export class Canvas {
    // focuser = null; // does not seem to be implemented
    // buffer = null;
    // ctx = null;
    mouseLocation = Point.create(-1, -1);
    dragstart = Point.create(-1, -1);
    // origin = null;
    bounds = new Rectangle(0, 0, 0, 0);
    dirty = false;
    size: Canvas.Box = null;
    mousedown = false;
    dragging = false;
    repeatKeyCount = 0;
    repeatKey: string = null;
    repeatKeyStartTime = 0;
    currentKeys: string[] = [];
    hasMouse = false;
    dragEndTime = 0;
    lastRepaintTime = 0;
    currentPaintCount = 0;
    currentFPS = 0;
    lastFPSComputeTime = 0;
    dragEndtime = Date.now();

    canvas: HTMLCanvasElement;
    private readonly infoDiv: HTMLDivElement;
    private readonly gc: CanvasRenderingContext2DEx;
    width: number;
    private height: number;
    bodyZoomFactor: number;
    private _devicePixelRatio: number;

    private documentMouseMoveEventListener = (e: MouseEvent) => {
        if (this.hasMouse || this.isDragging()) {
            this.finmousemove(e);
        }
    }
    private documentMouseUpEventListener = (e: MouseEvent) => this.finmouseup(e);
    private documentWheelEventListener = (e: WheelEvent) => this.finwheelmoved(e);
    private documentKeyDownEventListener = (e: KeyboardEvent) => this.finkeydown(e);
    private documentKeyUpEventListener = (e: KeyboardEvent) => this.finkeyup(e);

    private canvasFocusEventListener = (e: FocusEvent) => this.finfocusgained(e);
    private canvasBlurEventListener = (e: FocusEvent) => this.finfocuslost(e);
    private canvasMouseOverEventListener = () => { this.hasMouse = true; }
    private canvasMouseDownEventListener = (e: MouseEvent) => this.finmousedown(e);
    private canvasMouseOutEventListener = (e: MouseEvent) => {
        this.hasMouse = false;
        this.finmouseout(e);
    }
    private canvasClickEventListener = (e: MouseEvent) => this.finclick(e);
    private canvasDblClickEventListener = (e: MouseEvent) => this.findblclick(e);
    private canvasContextMenuEventListener = (e: MouseEvent) => {
        this.fincontextmenu(e);
        e.preventDefault();
        return false;
    }
    private canvasTouchStartEventListener = (e: TouchEvent) => this.fintouchstart(e);
    private canvasTouchMoveEventListener = (e: TouchEvent) => this.fintouchmove(e);
    private canvasTouchEndEventListener = (e: TouchEvent) => this.fintouchend(e);

    get devicePixelRatio() { return this._devicePixelRatio; }


    // div is the containing <div>...</div>
    constructor(public div: HTMLElement,
        readonly component: Renderer,
        contextAttributes: CanvasRenderingContext2DSettings | undefined
    ) {

        this.component = component;

        // create and append the info <div>...</div> (to be displayed when there are no data rows)
        this.infoDiv = document.createElement('div');
        this.infoDiv.className = 'info';
        this.infoDiv.style.flex = '0 0 auto';
        this.div.appendChild(this.infoDiv);

        // create and append the canvas
        this.canvas = document.createElement('canvas');
        this.gc = getCachedContext(this.canvas, contextAttributes);

        this.canvas.style.flex = '1 1 0';
        this.div.appendChild(this.canvas);

        this.canvas.style.outline = 'none';

        //this.origin = new rectangular.Point(0, 0);

        document.addEventListener('mousemove', this.documentMouseMoveEventListener);
        document.addEventListener('mouseup', this.documentMouseUpEventListener);
        document.addEventListener('wheel', this.documentWheelEventListener);
        document.addEventListener('keydown', this.documentKeyDownEventListener);
        document.addEventListener('keyup', this.documentKeyUpEventListener);

        this.canvas.addEventListener('focus', this.canvasFocusEventListener);
        this.canvas.addEventListener('blur', this.canvasBlurEventListener);
        this.canvas.addEventListener('mouseover', this.canvasMouseOverEventListener);
        this.canvas.addEventListener('mousedown', this.canvasMouseDownEventListener);
        this.canvas.addEventListener('mouseout', this.canvasMouseOutEventListener);
        this.canvas.addEventListener('click', this.canvasClickEventListener);
        this.canvas.addEventListener('dblclick', this.canvasDblClickEventListener);
        this.canvas.addEventListener('contextmenu', this.canvasContextMenuEventListener);
        this.canvas.addEventListener('touchstart', this.canvasTouchStartEventListener);
        this.canvas.addEventListener('touchmove', this.canvasTouchMoveEventListener);
        this.canvas.addEventListener('touchend', this.canvasTouchEndEventListener);

        this.canvas.setAttribute('tabindex', '0');

        this.resetZoom();

        this.resize();

        this.beginResizing();
        this.beginPainting();
    }


    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    addEventListener(name: string, listener: EventListener) {
        this.canvas.addEventListener(name, listener);
    }

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    removeEventListener(name: string, listener: EventListener) {
        this.canvas.removeEventListener(name, listener);
    }

    // stopPaintLoop: stopPaintLoop,
    // restartPaintLoop: restartPaintLoop,

    // stopResizeLoop: stopResizeLoop,
    // restartResizeLoop: restartResizeLoop,

    detached() {
        this.stopPainting();
        this.stopResizing();
    }

    getCurrentFPS() {
        return this.currentFPS;
    }

    tickPaint(now: number) {
        const isContinuousRepaint = this.component.properties.enableContinuousRepaint;
        const fps = this.component.properties.repaintIntervalRate;
        if (fps === 0) {
            return;
        }
        const interval = 1000 / fps;

        const elapsed = now - this.lastRepaintTime;
        if (elapsed > interval && (isContinuousRepaint || this.dirty)) {
            this.paintNow();
            this.lastRepaintTime = now;
            /* - (elapsed % interval);*/
            if (isContinuousRepaint) {
                this.currentPaintCount++;
                if (now - this.lastFPSComputeTime >= 1000) {
                    this.currentFPS = (this.currentPaintCount * 1000) / (now - this.lastFPSComputeTime);
                    this.currentPaintCount = 0;
                    this.lastFPSComputeTime = now;
                }
            }
        }
    }

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    beginPainting() {
        this.requestRepaint();
        paintables.push(this);
    }

    tickPainter(now: number) {
        this.tickPaint(now)
    }

    stopPainting() {
        paintables.splice(paintables.indexOf(this), 1);
    }

    beginResizing() {
        resizables.push(this);
    }

    tickResizer() {
        this.checksize();
    }


    stopResizing() {
        resizables.splice(resizables.indexOf(this), 1);
    }

    start() {
        this.beginPainting();
        this.beginResizing();
    }

    stop() {
        this.stopPainting();
        this.stopResizing();
    }

    getBoundingClientRect(el: HTMLElement) {
        const rect = el.getBoundingClientRect();
        return rect;
    }

    getDivBoundingClientRect(): Canvas.Box {
        // Make sure our canvas has integral dimensions
        const rect = this.getBoundingClientRect(this.div);
        const top = Math.floor(rect.top);
        const left = Math.floor(rect.left);
        const width = Math.ceil(rect.width);
        const height = Math.ceil(rect.height);

        return {
            top: top,
            right: left + width,
            bottom: top + height,
            left: left,
            width: width,
            height: height,
            x: rect.x,
            y: rect.y
        };
    }

    checksize() {
        const sizeNow = this.getDivBoundingClientRect();
        if (sizeNow.width !== this.size.width || sizeNow.height !== this.size.height) {
            this.resize(sizeNow);
        }
    }

    resize(box?: Canvas.Box) {
        box = this.size = box || this.getDivBoundingClientRect();

        this.width = box.width;
        this.height = box.height;

        // http://www.html5rocks.com/en/tutorials/canvas/hidpi/
        const isHIDPI = window.devicePixelRatio && this.component.properties.useHiDPI;
        let ratio = isHIDPI && window.devicePixelRatio || 1;

        this._devicePixelRatio = ratio *= this.bodyZoomFactor;

        this.canvas.width = Math.round(this.width * ratio);
        this.canvas.height = Math.round(this.height * ratio);

        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';

        this.gc.scale(ratio, ratio);

        this.bounds = new Rectangle(0, 0, this.width, this.height);
        this.component.setBounds(this.bounds);
        this.resizeNotification();
        this.paintNow();
    }

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    resizeNotification() {
        const detail: Canvas.SyntheticEventDetail.Resize = {
            primitiveEvent: undefined,
            width: this.width,
            height: this.height
        };
        this.dispatchNewEvent(undefined, 'fin-canvas-resized', detail);
    }

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    resetZoom() {
        let factor = 1;

        // IE11 bug: must use getPropertyValue because zoom is omitted from returned object
        const zoomProp = getComputedStyle(document.body).getPropertyValue('zoom');

        if (zoomProp) {
            // IE11: always returns percentage + percent sign (others return factor)
            const m = zoomProp.match(/^(.+?)(%)?$/);
            if (m) {
                let zoom = Number(m[1]);
                if (m[2]) {
                    zoom /= 100;
                }
                zoom = Number(zoom || 1);
                factor *= zoom;
            }
        }

        this.bodyZoomFactor = factor;

        this.resize();
    }

    getBounds() {
        return this.bounds;
    }

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    paintNow() {
        try {
            this.gc.cache.save();
            this.dirty = false;
            this.component.paint(this.gc);
        } catch (e) {
            console.error(e);
        } finally {
            this.gc.cache.restore();
        }
    }

    // flushBuffer deprecated in 3.3.0
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    flushBuffer() {}

    newEvent<T extends Canvas.SyntheticEventDetail.Any, U extends UIEvent | undefined>(primitiveEvent: U, name: string, detail: T | undefined) {
        const eventInit: CustomEventInit<T> = {
            detail,
        };

        const event = new CustomEvent<T>(name, eventInit) as Canvas.SyntheticEvent<T, U>;

        return event;
    }

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    dispatchNewEvent<T extends Canvas.SyntheticEventDetail.Any, U extends UIEvent | undefined>(primitiveEvent: U, name: string, detail?: T) {
        const event = this.newEvent(primitiveEvent, name, detail);
        return this.canvas.dispatchEvent(event);
    }

    dispatchNewTouchEvent(event: TouchEvent, name: string) {
        const touches = Array.from(event.changedTouches);
        const localPoints = touches.map((touch) => this.getLocal(touch));

        const detail: Canvas.SyntheticEventDetail.Touch = {
            primitiveEvent: event,
            touches: localPoints,
        };

        return this.dispatchNewEvent(event, name, detail);
    }

    finmousemove(e: MouseEvent) {
        if (!this.isDragging() && this.mousedown) {
            this.beDragging();
            const detail: Canvas.SyntheticEventDetail.Mouse = {
                primitiveEvent: e,
                mouse: this.mouseLocation,
                keys: this.currentKeys,
                isRightClick: this.isRightClick(e),
                dragstart: this.dragstart,
            };
            this.dispatchNewEvent(e, 'fin-canvas-dragstart', detail);
            this.dragstart = Point.create(this.mouseLocation.x, this.mouseLocation.y);
        }
        this.mouseLocation = this.getLocal(e);
        if (this.isDragging()) {
            const detail: Canvas.SyntheticEventDetail.Mouse = {
                primitiveEvent: e,
                mouse: this.mouseLocation,
                keys: this.currentKeys,
                dragstart: this.dragstart,
                isRightClick: this.isRightClick(e),
            };
            this.dispatchNewEvent(e, 'fin-canvas-drag', detail);
        }
        if (this.bounds.contains(this.mouseLocation)) {
            const detail: Canvas.SyntheticEventDetail.Mouse = {
                primitiveEvent: e,
                mouse: this.mouseLocation,
                keys: this.currentKeys,
            };
            this.dispatchNewEvent(e, 'fin-canvas-mousemove', detail);
        }
    }

    finmousedown(e: MouseEvent) {
        // this.mouseLocation = this.mouseDownLocation = this.getLocal(e);
        this.mouseLocation = this.getLocal(e);
        this.mousedown = true;

        const detail: Canvas.SyntheticEventDetail.Mouse = {
            primitiveEvent: e,
            mouse: this.mouseLocation,
            keys: this.currentKeys,
            isRightClick: this.isRightClick(e)
        };
        this.dispatchNewEvent(e, 'fin-canvas-mousedown', detail);
    }

    finmouseup(e: MouseEvent) {
        if (!this.mousedown) {
            // ignore document:mouseup unless preceded by a canvas:mousedown
            return;
        }
        if (this.isDragging()) {
            const detail: Canvas.SyntheticEventDetail.Mouse = {
                primitiveEvent: e,
                mouse: this.mouseLocation,
                keys: this.currentKeys,
                dragstart: this.dragstart,
                isRightClick: this.isRightClick(e)
            };
            this.dispatchNewEvent(e, 'fin-canvas-dragend', detail);
            this.beNotDragging();
            this.dragEndtime = Date.now();
        }
        this.mousedown = false;
        const detail: Canvas.SyntheticEventDetail.Mouse = {
            primitiveEvent: e,
            mouse: this.mouseLocation,
            keys: this.currentKeys,
            dragstart: this.dragstart,
            isRightClick: this.isRightClick(e)
        };
        this.dispatchNewEvent(e, 'fin-canvas-mouseup', detail);
        //this.mouseLocation = new rectangular.Point(-1, -1);
    }

    finmouseout(e: MouseEvent) {
        if (!this.mousedown) {
            this.mouseLocation = Point.create(-1, -1);
        }
        this.repaint();
        const detail: Canvas.SyntheticEventDetail.Mouse = {
            primitiveEvent: e,
            mouse: this.mouseLocation,
            keys: this.currentKeys,
            dragstart: this.dragstart
        };
        this.dispatchNewEvent(e, 'fin-canvas-mouseout', detail);
    }

    finwheelmoved(e: WheelEvent) {
        if (this.isDragging() || !this.hasFocus()) {
            return;
        }
        e.preventDefault();
        const detail: Canvas.SyntheticEventDetail.Mouse = {
            primitiveEvent: e,
            mouse: this.mouseLocation,
            keys: this.currentKeys,
            isRightClick: this.isRightClick(e)
        };
        this.dispatchNewEvent(e, 'fin-canvas-wheelmoved', detail);
    }

    finclick(e: MouseEvent) {
        this.mouseLocation = this.getLocal(e);
        const detail: Canvas.SyntheticEventDetail.Mouse = {
            primitiveEvent: e,
            mouse: this.mouseLocation,
            keys: this.currentKeys,
            isRightClick: this.isRightClick(e)
        };
        this.dispatchNewEvent(e, 'fin-canvas-click', detail);
    }

    findblclick(e: MouseEvent) {
        this.mouseLocation = this.getLocal(e);
        const detail: Canvas.SyntheticEventDetail.Mouse = {
            primitiveEvent: e,
            mouse: this.mouseLocation,
            keys: this.currentKeys,
            isRightClick: this.isRightClick(e)
        };
        this.dispatchNewEvent(e, 'fin-canvas-dblclick', detail);
    }

    getCharMap() {
        return Canvas.charMap;
    }

    getKeyChar(e: KeyboardEvent) {
        return e.key;
        // const keyCode = e.keyCode;
        // const shift = e.shiftKey;
        // const key = e.key;

        // e.legacyKey = charMap[keyCode] && charMap[keyCode][shift ? 1 : 0];

        // if (typeof key === 'string' && key.length === 1) {
        //     return key;
        // }

        // return (
        //     e.legacyKey || // legacy unprintable char string
        //     key // modern unprintable char string when no such legacy string
        // );
    }

    finkeydown(e: KeyboardEvent) {
        if (!this.hasFocus()) {
            return;
        }

        const keyChar = this.updateCurrentKeys(e, true);

        if (e.repeat) {
            if (this.repeatKey === keyChar) {
                this.repeatKeyCount++;
            } else {
                this.repeatKey = keyChar;
                this.repeatKeyStartTime = Date.now();
            }
        } else {
            this.repeatKey = null;
            this.repeatKeyCount = 0;
            this.repeatKeyStartTime = 0;
        }
        this.fixCurrentKeysFromEvent(e);

        const keyboardDetail: Canvas.SyntheticEventDetail.Keyboard = /*this.defKeysProp(e, 'currentKeys',*/ {
            primitiveEvent: e,
            alt: e.altKey,
            ctrl: e.ctrlKey,
            char: keyChar,
            // legacyChar: e.legacyKey,
            // code: e.charCode,
            // key: e.keyCode,
            meta: e.metaKey,
            repeatCount: this.repeatKeyCount,
            repeatStartTime: this.repeatKeyStartTime,
            shift: e.shiftKey,
            identifier: e.key,
            currentKeys: this.currentKeys.slice(0)
        };

        this.dispatchNewEvent(e, 'fin-canvas-keydown', keyboardDetail);
    }

    finkeyup(e: KeyboardEvent) {
        if (!this.hasFocus()) {
            return;
        }

        const keyChar = this.updateCurrentKeys(e, false);

        this.repeatKeyCount = 0;
        this.repeatKey = null;
        this.repeatKeyStartTime = 0;
        this.fixCurrentKeysFromEvent(e);

        const keyboardDetail: Canvas.SyntheticEventDetail.Keyboard = /*this.defKeysProp(e, 'currentKeys',*/ {
            primitiveEvent: e,
            alt: e.altKey,
            ctrl: e.ctrlKey,
            char: keyChar,
            // legacyChar: e.legacyKey,
            // code: e.charCode,
            // key: e.keyCode,
            meta: e.metaKey,
            repeat: this.repeatKeyCount,
            repeatStartTime: this.repeatKeyStartTime,
            shift: e.shiftKey,
            identifier: e.key,
            currentKeys: this.currentKeys.slice(0)
        };

        this.dispatchNewEvent(e, 'fin-canvas-keyup', keyboardDetail);
    }

    finfocusgained(e: FocusEvent) {
        this.dispatchNewEvent(e, 'fin-canvas-focus-gained');
    }

    finfocuslost(e: FocusEvent) {
        this.dispatchNewEvent(e, 'fin-canvas-focus-lost');
    }

    fincontextmenu(e: MouseEvent) {
        if (e.ctrlKey && this.currentKeys.indexOf('CTRL') === -1) {
            this.currentKeys.push('CTRL');
        }

        const detail: Canvas.SyntheticEventDetail.Mouse = {
            primitiveEvent: e,
            mouse: this.mouseLocation,
            isRightClick: this.isRightClick(e),
            keys: this.currentKeys,
        };
        this.dispatchNewEvent(e, 'fin-canvas-context-menu', detail);
    }

    fintouchstart(e: TouchEvent) {
        this.dispatchNewTouchEvent(e, 'fin-canvas-touchstart');
    }

    fintouchmove(e: TouchEvent) {
        this.dispatchNewTouchEvent(e, 'fin-canvas-touchmove');
    }

    fintouchend(e: TouchEvent) {
        this.dispatchNewTouchEvent(e, 'fin-canvas-touchend');
    }

    paintLoopRunning() {
        return !!paintRequestAnimationFrameHandle;
    }

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    requestRepaint() {
        this.dirty = true;
    }

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    repaint() {
        this.requestRepaint();
        if (!paintRequestAnimationFrameHandle || this.component.properties.repaintIntervalRate === 0) {
            this.paintNow();
        }
    }

    getMouseLocation() {
        return this.mouseLocation;
    }

    getOrigin() {
        const rect = this.getBoundingClientRect(this.canvas);
        const p = Point.create(rect.left, rect.top);
        return p;
    }

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    getLocal<T extends MouseEvent|Touch>(e: T) {
        const rect = this.getBoundingClientRect(this.canvas);

        const p = Point.create(
            e.clientX / this.bodyZoomFactor - rect.left,
            e.clientY / this.bodyZoomFactor - rect.top
        );

        return p;
    }

    hasFocus() {
        return document.activeElement === this.canvas;
    }

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    takeFocus() {
        if (!this.hasFocus()) {
            setTimeout(() => {
                this.canvas.focus();
            }, 10);
        }
    }

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    beDragging() {
        this.dragging = true;
        this.disableDocumentElementSelection();
    }

    /**
     * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
     * @this CanvasType
     */
    beNotDragging() {
        this.dragging = false;
        this.enableDocumentElementSelection();
    }

    isDragging() {
        return this.dragging;
    }

    disableDocumentElementSelection() {
        const style = document.body.style;
        style.cssText = style.cssText + '-webkit-user-select: none';
    }

    enableDocumentElementSelection() {
        const style = document.body.style;
        style.cssText = style.cssText.replace('-webkit-user-select: none', '');
    }

    // setFocusable(truthy: boolean) {
    //     this.focuser.style.display = truthy ? '' : 'none';
    // }

    isRightClick(e: MouseEvent) {
        return e.button === 2;
    }

    dispatchEvent(e: Event) {
        return this.canvas.dispatchEvent(e);
    }

    setInfo(message: string, width?: number) {
        if (message) {
            if (width !== undefined) {
                const widthPixels = width === 0 ? '0' : numberToPixels(width);
                this.infoDiv.style.width = widthPixels;
            }

            if (message.indexOf('<')) {
                this.infoDiv.innerHTML = message;
            } else {
                this.infoDiv.innerText = message;
            }
        }

        this.infoDiv.style.display = message ? 'block' : 'none';
    }

    updateCurrentKeys(e: KeyboardEvent, keydown: boolean) {
        const keyChar = this.getKeyChar(e);

        // prevent TAB from moving focus off the canvas element
        switch (keyChar) {
            case 'TAB':
            case 'TABSHIFT':
            case 'Tab':
                e.preventDefault();
        }

        this.fixCurrentKeys(keyChar, keydown);

        return keyChar;
    }

    fixCurrentKeys(keyChar: string, keydown: boolean) {
        const index = this.currentKeys.indexOf(keyChar);

        if (!keydown && index >= 0) {
            this.currentKeys.splice(index, 1);
        }

        if (keyChar === 'SHIFT') {
            // on keydown, replace unshifted keys with shifted keys
            // on keyup, vice-versa
            this.currentKeys.forEach((key, index, currentKeys) => {
                const foundPair = Canvas.charMap.find((pair) => {
                    return pair[keydown ? 0 : 1] === key;
                });
                if (foundPair) {
                    currentKeys[index] = foundPair[keydown ? 1 : 0];
                }
            });
        }

        if (keydown && index < 0) {
            this.currentKeys.push(keyChar);
        }
    }

    private fixCurrentKeysFromEvent(event: KeyboardEvent) {
        let shiftKey: boolean;
        if ('shiftKey' in event) {
            shiftKey = event.shiftKey;
            this.fixCurrentKeys('SHIFT', shiftKey);
        } else {
            shiftKey = this.currentKeys.indexOf('SHIFT') >= 0;
        }
        const SHIFT = shiftKey ? 'SHIFT' : '';
        if ('ctrlKey' in event) {
            this.fixCurrentKeys('CTRL' + SHIFT, event.ctrlKey);
        }
        if ('altKey' in event) {
            this.fixCurrentKeys('ALT' + SHIFT, event.altKey);
        }
    }
}

function paintLoopFunction(now: number) {
    if (paintRequestAnimationFrameHandle !== undefined) {
        paintables.forEach(
            (paintable) => {
                try {
                    paintable.tickPainter(now);
                } catch (e) {
                    console.error(e);
                }

                if (paintable.component.tickNotification) {
                    paintable.component.tickNotification();
                }
            }
        );
        paintRequestAnimationFrameHandle = requestAnimationFrame(paintLoopFunction);
    }
}
function restartPaintLoop() {
    if (paintRequestAnimationFrameHandle === undefined) {
        paintRequestAnimationFrameHandle = requestAnimationFrame(paintLoopFunction);
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function stopPaintLoop() {
    if (paintRequestAnimationFrameHandle !== undefined) {
        cancelAnimationFrame(paintRequestAnimationFrameHandle);
        paintRequestAnimationFrameHandle = undefined;
    }
}
restartPaintLoop();

function resizablesLoopFunction() {
    if (resizeSetIntervalHandle !== undefined) {
        for (let i = 0; i < resizables.length; i++) {
            try {
                resizables[i].tickResizer();
            } catch (e) {
                console.error(e);
            }
        }
    }
}
function restartResizeLoop() {
    if (resizeSetIntervalHandle === undefined) {
        resizeSetIntervalHandle = setInterval(resizablesLoopFunction, RESIZE_POLLING_INTERVAL);
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function stopResizeLoop() {
    if (resizeSetIntervalHandle !== undefined) {
        clearInterval(resizeSetIntervalHandle);
        resizeSetIntervalHandle = undefined;
    }
}
restartResizeLoop();

function getCachedContext(canvasElement: HTMLCanvasElement, contextAttributes: CanvasRenderingContext2DSettings | undefined) {
    const canvasRenderingContext2D: CanvasRenderingContext2D = canvasElement.getContext('2d', contextAttributes);
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

    const gc = new CanvasRenderingContext2DEx(canvasRenderingContext2D);

    // Object.getOwnPropertyNames(Canvas.graphicsContextAliases).forEach(function(alias) {
    //     gc[alias] = gc[Canvas.graphicsContextAliases[alias]];
    // });

    return gc;
}

// Canvas.graphicsContextAliases = {
//     simpleText: 'fillText'
// };

/** @public */
export namespace Canvas {
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

    export namespace SyntheticEventDetail {
        export interface Base<U extends UIEvent | undefined> {
            primitiveEvent: U;
        }

        export type BaseOnly = Base<undefined>;

        export interface Resize extends Base<undefined> {
            readonly width: number,
            readonly height: number,
        }

        export interface Mouse extends Base<MouseEvent> {
            readonly mouse: Point; // mouse location
            readonly keys: string[];
            readonly dragstart?: Point;
            readonly isRightClick?: boolean;
        }

        export interface Keyboard extends Base<KeyboardEvent> {
            readonly alt: boolean,
            readonly ctrl: boolean,
            readonly char: string,
            // readonly legacyChar: e.legacyKey,
            // readonly code: number,
            // readonly key: number,
            readonly meta: boolean,
            readonly repeat?: number,
            readonly repeatCount?: number,
            readonly repeatStartTime?: number,
            readonly shift: boolean,
            readonly identifier: string,
            readonly currentKeys?: string[];
        }

        export interface EditorKeyboard extends Keyboard {
            grid: Hypegrid,
            editor: CellEditor,
        }

        export interface Touch extends Base<TouchEvent> {
            touches: Array<Point>;
        }

        export type Any =
            BaseOnly |
            Resize | // Resize
            Touch | // Touch
            Mouse | // Mouse
            Keyboard | // Keyboard
            EditorKeyboard;

    }

    export interface AnySyntheticEvent extends CustomEvent<SyntheticEventDetail.Any> {
        primitiveEvent: UIEvent | undefined;
    }

    export interface SyntheticEvent<T extends SyntheticEventDetail.Any, U extends UIEvent | undefined> extends CustomEvent<T> {
        primitiveEvent: U;
    }

    export type BaseOnlySyntheticEvent = SyntheticEvent<SyntheticEventDetail.BaseOnly, undefined>;
    export type ResizeSyntheticEvent = SyntheticEvent<SyntheticEventDetail.Resize, UIEvent>;
    export type MouseSyntheticEvent = SyntheticEvent<SyntheticEventDetail.Mouse, MouseEvent>;
    export type KeyboardSyntheticEvent = SyntheticEvent<SyntheticEventDetail.Keyboard, KeyboardEvent>;
    export type EditorKeyboardSyntheticEvent = SyntheticEvent<SyntheticEventDetail.EditorKeyboard, KeyboardEvent>;
    export type TouchSyntheticEvent = SyntheticEvent<SyntheticEventDetail.Touch, TouchEvent>;

    export interface EventMap {
        "fin-canvas-resized": ResizeSyntheticEvent;
        "fin-canvas-click": MouseSyntheticEvent;
        "fin-canvas-dragstart": MouseSyntheticEvent;
        "fin-canvas-drag": MouseSyntheticEvent;
        "fin-canvas-mousemove": MouseSyntheticEvent;
        "fin-canvas-mousedown": MouseSyntheticEvent;
        "fin-canvas-dragend": MouseSyntheticEvent;
        "fin-canvas-mouseup": MouseSyntheticEvent;
        "fin-canvas-mouseout": MouseSyntheticEvent;
        "fin-canvas-wheelmoved": MouseSyntheticEvent;
        "fin-canvas-dblclick": MouseSyntheticEvent;
        "fin-canvas-context-menu": MouseSyntheticEvent;
        "fin-canvas-keydown": KeyboardSyntheticEvent;
        "fin-canvas-keyup": KeyboardSyntheticEvent;
        "fin-canvas-focus-gained": BaseOnlySyntheticEvent;
        "fin-canvas-focus-lost": BaseOnlySyntheticEvent;
        "fin-canvas-touchstart": TouchSyntheticEvent;
        "fin-canvas-touchmove": TouchSyntheticEvent;
        "fin-canvas-touchend": TouchSyntheticEvent;
    }

    export type EventName = keyof EventMap;

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
