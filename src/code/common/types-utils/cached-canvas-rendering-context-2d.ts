import { RevRectangle } from './rectangle';
import { RevAssertError } from './revgrid-error';

/**
 * A wrapper around CanvasRenderingContext2D which accesses values from CanvasRenderingContext2D from a cache.
 * @remarks
 * Supports saving and restoring by pushing and popping cached values onto/from a stack.
 * Cache also stores the width and height of strings so that these widths and heights can be re-used without needing to be constantly recalculated
 */
export class RevCachedCanvasRenderingContext2D {
    /** Cache of CanvasRenderingContext2D values*/
    readonly cache: RevCachedCanvasRenderingContext2D.Cache;

    /** @internal */
    private readonly _conditionalsStack: RevCachedCanvasRenderingContext2D.ConditionalsStack = [];
    /**
     * A map of a map of character widths (value) for fonts (key)
     * @internal
     */
    private _fontTextWidthMap: RevCachedCanvasRenderingContext2D.FontTextWidthMap = new Map<string, RevCachedCanvasRenderingContext2D.TextWidthMap>;
    /**
     * A map of a map of character heights (value) for fonts (key)
     * @internal
     */
    private _fontTextHeightDefaultAndMap: RevCachedCanvasRenderingContext2D.FontTextHeightMap = new Map<string, RevCachedCanvasRenderingContext2D.TextHeightDefaultAndMap>;

    /** @internal */
    constructor(private readonly canvasRenderingContext2D: CanvasRenderingContext2D) {
        this.cache = new RevCachedCanvasRenderingContext2D.Cache(canvasRenderingContext2D);
    }

    clearRect(x: number, y: number, width: number, height: number) {
        this.canvasRenderingContext2D.clearRect(x, y, width, height);
    }

    clearBounds(bounds: RevRectangle) {
        this.canvasRenderingContext2D.clearRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    fillRect(x: number, y: number, width: number, height: number) {
        this.canvasRenderingContext2D.fillRect(x, y, width, height);
    }

    fillBounds(bounds: RevRectangle) {
        this.canvasRenderingContext2D.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    measureText(value: string) {
        return this.canvasRenderingContext2D.measureText(value);
    }

    beginPath() {
        this.canvasRenderingContext2D.beginPath();
    }

    rect(x: number, y: number, width: number, height: number) {
        this.canvasRenderingContext2D.rect(x, y, width, height);
    }

    clip() {
        this.canvasRenderingContext2D.clip();
    }

    createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
        return this.canvasRenderingContext2D.createLinearGradient(x0, y0, x1, y1);
    }

    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean) {
        this.canvasRenderingContext2D.arc(x, y, radius, startAngle, endAngle, anticlockwise);
    }

    stroke() {
        this.canvasRenderingContext2D.stroke();
    }

    strokeRect(x: number, y: number, width: number, height: number) {
        this.canvasRenderingContext2D.strokeRect(x, y, width, height);
    }

    fill() {
        this.canvasRenderingContext2D.fill();
    }

    fillText(text: string, x: number, y: number, maxWidth?: number) {
        this.canvasRenderingContext2D.fillText(text, x, y, maxWidth);
    }

    closePath() {
        this.canvasRenderingContext2D.closePath();
    }

    lineTo(x: number, y: number) {
        this.canvasRenderingContext2D.lineTo(x, y);
    }

    moveTo(x: number, y: number) {
        this.canvasRenderingContext2D.moveTo(x, y);
    }

    drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number) {
        this.canvasRenderingContext2D.drawImage(image, dx, dy, dw, dh);
    }

    scale(x: number, y: number) {
        this.canvasRenderingContext2D.scale(x, y);
    }

    getImageData(sx: number, sy: number, sw: number, sh: number) {
        return this.canvasRenderingContext2D.getImageData(sx, sy, sw, sh);
    }

    putImageData(imageData: ImageData, sx: number, sy: number) {
        this.canvasRenderingContext2D.putImageData(imageData, sx, sy);
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
        this.canvasRenderingContext2D.quadraticCurveTo(cpx, cpy, x, y);
    }

    clearFillRect(x: number, y: number, width: number, height: number, color: string) {
        const a = this.alpha(color);
        if (a < 1) {
            // If background is translucent, we must clear the rect before the fillRect
            // below to prevent mixing with previous frame's render of this cell.
            this.clearRect(x, y, width, height);
        }
        if (a > 0) {
            this.cache.fillStyle = color;
            this.fillRect(x, y, width, height);
        }
    }

    clearFillBounds(bounds: RevRectangle, color: string) {
        this.clearFillRect(bounds.x, bounds.y, bounds.width, bounds.height, color)
    }

    // Tried using an `alphaCache` here but it didn't make a measurable difference.
    alpha(cssColorSpec: string | undefined) {
        let matches: RegExpMatchArray | null;
        let result: number;

        if (cssColorSpec === undefined) {
            // undefined so not visible; treat as transparent
            result = 0;
        } else if ((matches = cssColorSpec.match(RevCachedCanvasRenderingContext2D.ALPHA_REGEX)) === null) {
            // an opaque color (a color spec with no alpha channel)
            result = 1;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (matches[4] === undefined) {
            // cssColorSpec must have been 'transparent'
            result = 0;
        } else {
            result = Number(matches[4]);
        }

        return result;
    }

    /**
     * Gets a map of the width (value) of characters (key) for a particular font
     * @param font - the name of the font
    */
    getTextWidthMap(font: string) {
        let textWidthMap = this._fontTextWidthMap.get(font);
        if (textWidthMap === undefined) {
            textWidthMap = new Map<string, number>();
            this._fontTextWidthMap.set(font, textWidthMap);
        }
        return textWidthMap;
    }

    /**
     * Gets the width of a string using the current font.
     * @remarks
     * Calculates the width of a string in pixels by adding the widths of each character in the string.  The widths of each character is either obtained from a map or (if not in map) calculated using
     * `measureText()` and stored in map.
     *
     * NOTE: There is a minor measuring error when taking the sum of the pixel widths of individual characters that make up a string vs. the pixel width of the string taken as a whole.
     * This is possibly due to kerning or rounding. The error is typically about 0.1%.
     * @param text - Text to measure.
     * @returns Width of string in pixels.
     */
    getTextWidth(text: string) {
        const font = this.cache.font;
        const textWidthMap = this.getTextWidthMap(font);

        const charCount = text.length
        let textWidth = 0;
        for (let i = 0; i < charCount; i++) {
            const char = text[i];

            let charWidth = textWidthMap.get(char);
            if (charWidth === undefined) {
                charWidth = this.measureText(char).width;
                textWidthMap.set(char, charWidth);
            }
            textWidth += charWidth;
        }

        return textWidth;
    }

    /**
     * Gets the width in pixels of a character using the current font.
     * @remarks
     * @param char - Character whose width is wanted.
     * @returns Width of character in pixels.
     */
    getCharWidth(char: string) {
        const font = this.cache.font;
        const textWidthMap = this.getTextWidthMap(font);

        let charWidth = textWidthMap.get(char);
        if (charWidth === undefined) {
            charWidth = this.measureText(char).width;
            textWidthMap.set(char, charWidth);
        }

        return charWidth;
    }

    /**
     * Gets the width in pixels of the character `m` using the current font.
     * @remarks
     * @returns Width of `m` in pixels.
     */
    getEmWidth() {
        let emWidth = this.cache.emWidth;
        if (emWidth === undefined) {
            emWidth = this.getCharWidth('m');
            this.cache.emWidth = emWidth;
        }
        return emWidth;
    }

    /**
     * Gets the height, ascent and descent in pixels of a text string using the current font.
     * @param text - string whose height is to be obtained.
     * @returns A TextHeight interface with height, ascent and descent of string.
     */
    getTextHeight(text: string): RevCachedCanvasRenderingContext2D.TextHeight {
        const textHeightDefaultAndMap = this.getCurrentFontTextHeightDefaultAndMap();

        const map = textHeightDefaultAndMap.map;
        let textHeight = map.get(text);
        if (textHeight === undefined) {
            const textMetrics = this.measureText(text);
            const ascent = textMetrics.actualBoundingBoxAscent;
            const descent = textMetrics.actualBoundingBoxDescent;
            textHeight = {
                ascent,
                descent,
                height: ascent + descent,
            }
            map.set(text, textHeight);
        }

        return textHeight;
    }

    /**
     * Gets the height, ascent and descent in pixels of the current font.
     * @returns A TextHeight interface with height, ascent and descent encompassing the main characters in the font.
     */
    getFontHeight() {
        const textHeightDefaultAndMap = this.getCurrentFontTextHeightDefaultAndMap();
        return textHeightDefaultAndMap.default;
    }

    /**
     * Conditionally clip a region
     * @remarks
     * The conditional paramater indicates whether a region is to be clipped.  If so, then the cache is saved to the stack.
     * Always call a matching {@link clipRestore} to unwind this `clipSave` even if conditional was false
     * @param conditional - if true, save cache to stack and clip region
     * @param x - left of region
     * @param y - top of region
     * @param width - width of region
     * @param height - height of region
     */
    clipSave(conditional: boolean, x: number, y: number, width: number, height: number) {
        this._conditionalsStack.push(conditional);
        if (conditional) {
            this.cache.save();
            this.beginPath();
            this.rect(x, y, width, height);
            this.clip();
        }
    }

    /**
     * Unwind a previous {@link clipSave} and pop cache stack if necessary
     */
    clipRestore() {
        if (this._conditionalsStack.pop()) {
            this.cache.restore(); // Remove clip region
        }
    }

    /** @internal */
    private getCurrentFontTextHeightDefaultAndMap() {
        const font = this.cache.font;
        let textHeightDefaultAndMap = this._fontTextHeightDefaultAndMap.get(font);
        if (textHeightDefaultAndMap === undefined) {
            const map = new Map<string, RevCachedCanvasRenderingContext2D.TextHeight>();
            textHeightDefaultAndMap = {
                default: this.calculateTextHeight(RevCachedCanvasRenderingContext2D.fontMainCharacters),
                map,
            }
            this._fontTextHeightDefaultAndMap.set(font, textHeightDefaultAndMap);
        }
        return textHeightDefaultAndMap;
    }

    /** @internal */
    private calculateTextHeight(text: string): RevCachedCanvasRenderingContext2D.TextHeight {
        const textMetrics = this.measureText(text);
        const ascent = textMetrics.actualBoundingBoxAscent;
        const descent = textMetrics.actualBoundingBoxDescent;
        return {
            ascent,
            descent,
            height: ascent + descent,
        }
    }
}

export namespace RevCachedCanvasRenderingContext2D {
    export const ALPHA_REGEX = /^(transparent|((RGB|HSL)A\(.*,\s*([\d.]+)\)))$/i
    export const fontMainCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

    export type TextWidthMap = Map<string, number>;
    export type FontTextWidthMap = Map<string, TextWidthMap>;

    export interface TextHeight {
        ascent: number;
        height: number;
        descent: number;
    }
    export type TextHeightMap = Map<string, TextHeight>;
    export interface TextHeightDefaultAndMap {
        default: TextHeight;
        map: TextHeightMap;
    }
    export type FontTextHeightMap = Map<string, TextHeightDefaultAndMap>;

    export interface TruncatedTextWidth {
        /** `undefined` if it fits; truncated version of provided `string` if it does not. */
        text: string | undefined,
        /** Width of provided `text` if it fits; width of truncated string if it does not. */
        textWidth: number
    }

    export type ConditionalsStack = boolean[];

    export class Cache implements Cache.Values {
        values: Cache.Values = {} as Cache.Values;
        valuesStack = new Array<Cache.Values>();

        /** @internal */
        constructor(
            /** @internal */
            private readonly _canvasRenderingContext2D: CanvasRenderingContext2D) {
        }

        get lineDash() {
            let value = this.values.lineDash;
            if (value === undefined) {
                value = [];
            }
            return value;
        }
        set lineDash(value: number[]) {
            if (value !== this.lineDash) {
                this._canvasRenderingContext2D.setLineDash(value);
                this.values.lineDash = value;
            }
        }

        get fillStyle() {
            let value = this.values.fillStyle;
            if (value === undefined) {
                value = this.values.fillStyle = this._canvasRenderingContext2D.fillStyle as string | CanvasGradient;
            }
            return value;
        }
        set fillStyle(value: string | CanvasGradient /* | CanvasPattern*/) {
            if (value !== this.fillStyle) {
                this._canvasRenderingContext2D.fillStyle = value;
                this.values.fillStyle = value;
            }
        }
        get font() {
            let value = this.values.font;
            if (value === undefined) {
                value = this.values.font = this._canvasRenderingContext2D.font;
            }
            return value;
        }
        set font(value: string) {
            if (value !== this.font) {
                this._canvasRenderingContext2D.font = value;
                this.values.font = value;
                this.values.emWidth = undefined;
            }
        }
        get globalAlpha() {
            let value = this.values.globalAlpha;
            if (value === undefined) {
                value = this.values.globalAlpha = this._canvasRenderingContext2D.globalAlpha;
            }
            return value;
        }
        set globalAlpha(value: number) {
            if (value !== this.globalAlpha) {
                this._canvasRenderingContext2D.globalAlpha = value;
                this.values.globalAlpha = value;
            }
        }
        get globalCompositeOperation() {
            let value = this.values.globalCompositeOperation;
            if (value === undefined) {
                value = this.values.globalCompositeOperation = this._canvasRenderingContext2D.globalCompositeOperation;
            }
            return value;
        }
        set globalCompositeOperation(value: GlobalCompositeOperation) {
            if (value !== this.globalCompositeOperation) {
                this._canvasRenderingContext2D.globalCompositeOperation = value;
                this.values.globalCompositeOperation = value;
            }
        }
        get imageSmoothingEnabled() {
            let value = this.values.imageSmoothingEnabled;
            if (value === undefined) {
                value = this.values.imageSmoothingEnabled = this._canvasRenderingContext2D.imageSmoothingEnabled;
            }
            return value;
        }
        set imageSmoothingEnabled(value: boolean) {
            if (value !== this.imageSmoothingEnabled) {
                this._canvasRenderingContext2D.imageSmoothingEnabled = value;
                this.values.imageSmoothingEnabled = value;
            }
        }
        get lineCap() {
            let value = this.values.lineCap;
            if (value === undefined) {
                value = this.values.lineCap = this._canvasRenderingContext2D.lineCap;
            }
            return value;
        }
        set lineCap(value: CanvasLineCap) {
            if (value !== this.lineCap) {
                this._canvasRenderingContext2D.lineCap = value;
                this.values.lineCap = value;
            }
        }
        get lineDashOffset() {
            let value = this.values.lineDashOffset;
            if (value === undefined) {
                value = this.values.lineDashOffset = this._canvasRenderingContext2D.lineDashOffset;
            }
            return value;
        }
        set lineDashOffset(value: number) {
            if (value !== this.lineDashOffset) {
                this._canvasRenderingContext2D.lineDashOffset = value;
                this.values.lineDashOffset = value;
            }
        }
        get lineJoin() {
            let value = this.values.lineJoin;
            if (value === undefined) {
                value = this.values.lineJoin = this._canvasRenderingContext2D.lineJoin;
            }
            return value;
        }
        set lineJoin(value: CanvasLineJoin) {
            if (value !== this.lineJoin) {
                this._canvasRenderingContext2D.lineJoin = value;
                this.values.lineJoin = value;
            }
        }
        get lineWidth() {
            let value = this.values.lineWidth;
            if (value === undefined) {
                value = this.values.lineWidth = this._canvasRenderingContext2D.lineWidth;
            }
            return value;
        }
        set lineWidth(value: number) {
            if (value !== this.lineWidth) {
                this._canvasRenderingContext2D.lineWidth = value;
                this.values.lineWidth = value;
            }
        }
        get miterLimit() {
            let value = this.values.miterLimit;
            if (value === undefined) {
                value = this.values.miterLimit = this._canvasRenderingContext2D.miterLimit;
            }
            return value;
        }
        set miterLimit(value: number) {
            if (value !== this.miterLimit) {
                this._canvasRenderingContext2D.miterLimit = value;
                this.values.miterLimit = value;
            }
        }
        // get mozImageSmoothingEnabled() {
        //     let value = this.values.mozImageSmoothingEnabled;
        //     if (value === undefined) {
        //         value = this.values.mozImageSmoothingEnabled = this._canvasRenderingContext2D.mozImageSmoothingEnabled;
        //     }
        //     return value;
        // }
        // set mozImageSmoothingEnabled(value: boolean) {
        //     if (value !== this.mozImageSmoothingEnabled) {
        //         this._canvasRenderingContext2D.mozImageSmoothingEnabled = value;
        //         this.values.mozImageSmoothingEnabled = value;
        //     }
        // }
        // get msFillRule() {
        //     let value = this.values.msFillRule;
        //     if (value === undefined) {
        //         value = this.values.msFillRule = this._canvasRenderingContext2D.msFillRule;
        //     }
        //     return value;
        // }
        // set msFillRule(value: CanvasFillRule) {
        //     if (value !== this.msFillRule) {
        //         this._canvasRenderingContext2D.msFillRule = value;
        //         this.values.msFillRule = value;
        //     }
        // }
        // get oImageSmoothingEnabled() {
        //     let value = this.values.oImageSmoothingEnabled;
        //     if (value === undefined) {
        //         value = this.values.oImageSmoothingEnabled = this._canvasRenderingContext2D.oImageSmoothingEnabled;
        //     }
        //     return value;
        // }
        // set oImageSmoothingEnabled(value: boolean) {
        //     if (value !== this.oImageSmoothingEnabled) {
        //         this._canvasRenderingContext2D.oImageSmoothingEnabled = value;
        //         this.values.oImageSmoothingEnabled = value;
        //     }
        // }
        get shadowBlur() {
            let value = this.values.shadowBlur;
            if (value === undefined) {
                value = this.values.shadowBlur = this._canvasRenderingContext2D.shadowBlur;
            }
            return value;
        }
        set shadowBlur(value: number) {
            if (value !== this.shadowBlur) {
                this._canvasRenderingContext2D.shadowBlur = value;
                this.values.shadowBlur = value;
            }
        }
        get shadowColor() {
            let value = this.values.shadowColor;
            if (value === undefined) {
                value = this.values.shadowColor = this._canvasRenderingContext2D.shadowColor;
            }
            return value;
        }
        set shadowColor(value: string) {
            if (value !== this.shadowColor) {
                this._canvasRenderingContext2D.shadowColor = value;
                this.values.shadowColor = value;
            }
        }
        get shadowOffsetX() {
            let value = this.values.shadowOffsetX;
            if (value === undefined) {
                value = this.values.shadowOffsetX = this._canvasRenderingContext2D.shadowOffsetX;
            }
            return value;
        }
        set shadowOffsetX(value: number) {
            if (value !== this.shadowOffsetX) {
                this._canvasRenderingContext2D.shadowOffsetX = value;
                this.values.shadowOffsetX = value;
            }
        }
        get shadowOffsetY() {
            let value = this.values.shadowOffsetY;
            if (value === undefined) {
                value = this.values.shadowOffsetY = this._canvasRenderingContext2D.shadowOffsetY;
            }
            return value;
        }
        set shadowOffsetY(value: number) {
            if (value !== this.shadowOffsetY) {
                this._canvasRenderingContext2D.shadowOffsetY = value;
                this.values.shadowOffsetY = value;
            }
        }
        get strokeStyle() {
            let value = this.values.strokeStyle;
            if (value === undefined) {
                value = this.values.strokeStyle = this._canvasRenderingContext2D.strokeStyle as string;
            }
            return value;
        }
        set strokeStyle(value: string /*| CanvasGradient | CanvasPattern*/) {
            if (value !== this.strokeStyle) {
                this._canvasRenderingContext2D.strokeStyle = value;
                this.values.strokeStyle = value;
            }
        }
        get textAlign() {
            let value = this.values.textAlign;
            if (value === undefined) {
                value = this.values.textAlign = this._canvasRenderingContext2D.textAlign;
            }
            return value;
        }
        set textAlign(value: CanvasTextAlign) {
            if (value !== this.textAlign) {
                this._canvasRenderingContext2D.textAlign = value;
                this.values.textAlign = value;
            }
        }
        get textBaseline() {
            let value = this.values.textBaseline;
            if (value === undefined) {
                value = this.values.textBaseline = this._canvasRenderingContext2D.textBaseline;
            }
            return value;
        }
        set textBaseline(value: CanvasTextBaseline) {
            if (value !== this.textBaseline) {
                this._canvasRenderingContext2D.textBaseline = value;
                this.values.textBaseline = value;
            }
        }
        get emWidth() { return this.values.emWidth; }
        set emWidth(value: number | undefined) {
            this.values.emWidth = value;
        }


        save() {
            this._canvasRenderingContext2D.save();
            this.valuesStack.push(this.values);
            this.values = {} as Cache.Values;
        }

        restore() {
            this._canvasRenderingContext2D.restore();
            const values = this.valuesStack.pop();
            if (values === undefined) {
                throw new RevAssertError('CRC2ECR56660');
            } else {
                this.values = values;
            }
        }
    }

    export namespace Cache {
        export interface Values {
            lineDash: number[] | undefined;
            fillStyle: string | CanvasGradient | undefined /* | CanvasPattern*/;
            font: string | undefined;
            globalAlpha: number | undefined;
            globalCompositeOperation: GlobalCompositeOperation | undefined;
            imageSmoothingEnabled: boolean | undefined;
            lineCap: CanvasLineCap | undefined;
            lineDashOffset: number | undefined;
            lineJoin: CanvasLineJoin | undefined;
            lineWidth: number | undefined;
            miterLimit: number | undefined;
            shadowBlur: number | undefined;
            shadowColor: string | undefined;
            shadowOffsetX: number | undefined;
            shadowOffsetY: number | undefined;
            strokeStyle: string | undefined /*| CanvasGradient | CanvasPattern*/;
            textAlign: CanvasTextAlign | undefined;
            textBaseline: CanvasTextBaseline | undefined;
            emWidth: number | undefined;
        }
    }
}
