import { RevCachedCanvasRenderingContext2D, RevRectangle, RevUnreachableCaseError } from '../../client/internal-api';
import { RevHorizontalAlign, RevHorizontalAlignId, RevTextTruncateTypeId } from '../../text/internal-api';

/** @public */
export class RevStandardTextPainter {
    protected _columnSettings: RevStandardTextPainter.ColumnSettings;

    constructor(private readonly _renderingContext: RevCachedCanvasRenderingContext2D) {

    }

    setColumnSettings(value: RevStandardTextPainter.ColumnSettings) {
        this._columnSettings = value;
    }

    renderMultiLineText(
        bounds: RevRectangle,
        text: string,
        leftPadding: number,
        rightPadding: number,
        horizontalAlignId: RevHorizontalAlignId,
        font: string,
    ) {
        const columnSettings = this._columnSettings;
        const gc = this._renderingContext;
        const x = bounds.x;
        const y = bounds.y;
        const width = bounds.width;
        const height = bounds.height;
        const cleanText = text.trim().replace(RevStandardTextPainter.Whitespace, ' '); // trim and squeeze whitespace
        const lines = this.findLines(cleanText.split(' '), width);

        if (lines.length === 1) {
            return this.renderSingleLineText(bounds, cleanText, leftPadding, rightPadding, horizontalAlignId);
        } else {
            let halignOffset = leftPadding;
            let valignOffset = columnSettings.verticalOffset;
            const textHeight = gc.getTextHeight(font).height;

            switch (horizontalAlignId) {
                case RevHorizontalAlignId.Right:
                    halignOffset = width - rightPadding;
                    break;
                case RevHorizontalAlignId.Center:
                    halignOffset = width / 2;
                    break;
            }

            const hMin = 0;
            const vMin = Math.ceil(textHeight / 2);

            valignOffset += Math.ceil((height - (lines.length - 1) * textHeight) / 2);

            halignOffset = Math.max(hMin, halignOffset);
            valignOffset = Math.max(vMin, valignOffset);

            gc.cache.save(); // define a clipping region for cell
            gc.beginPath();
            gc.rect(x, y, width, height);
            gc.clip();

            gc.cache.textAlign = RevHorizontalAlign.idToCanvasTextAlign(horizontalAlignId);
            gc.cache.textBaseline = 'middle';

            for (let i = 0; i < lines.length; i++) {
                gc.fillText(lines[i], x + halignOffset, y + valignOffset + (i * textHeight));
            }

            gc.cache.restore(); // discard clipping region

            return leftPadding + width + rightPadding;
        }
    }

    /**
     * Renders single line text.
     * @param text - The text to render in the cell.
     */
    renderSingleLineText(
        bounds: RevRectangle,
        text: string,
        leftPadding: number,
        rightPadding: number,
        horizontalAlignId: RevHorizontalAlignId,
    ) {
        if (text === '') {
            return leftPadding + rightPadding
        } else {
            const gc = this._renderingContext;
            const columnSettings = this._columnSettings;
            let x = bounds.x;
            let y = bounds.y;
            const width = bounds.width;
            let halignOffset = leftPadding;
            let minWidth: number;

            const rightHaligned = horizontalAlignId === RevHorizontalAlignId.Right;
            const truncateWidth = width - rightPadding - leftPadding;
            if (columnSettings.defaultColumnAutoSizing) {
                const truncatedMeasure = this.measureAndTruncateText(gc, text, truncateWidth, columnSettings.textTruncateTypeId, false, rightHaligned);
                minWidth = truncatedMeasure.width;
                text = truncatedMeasure.text ?? text;
                if (horizontalAlignId === RevHorizontalAlignId.Center) {
                    halignOffset = (width - truncatedMeasure.width) / 2;
                }
            } else {
                const truncatedResult = this.measureAndTruncateText(gc, text, truncateWidth, columnSettings.textTruncateTypeId, true, rightHaligned);
                minWidth = 0;
                if (truncatedResult.text !== undefined) {
                    // not enough space to show the extire text, the text is truncated to fit for the width
                    text = truncatedResult.text;
                } else {
                    // enought space to show the entire text
                    if (horizontalAlignId === RevHorizontalAlignId.Center) {
                        halignOffset = (width - truncatedResult.width) / 2;
                    }
                }
            }

            if (text !== null) {
                // the position for x need to be relocated.
                // for canvas to print text, when textAlign is 'end' or 'right'
                // it will start with position x and print the text on the left
                // so the exact position for x need to increase by the acutal width - rightPadding
                x += horizontalAlignId === RevHorizontalAlignId.Right
                    ? width - rightPadding
                    : Math.max(leftPadding, halignOffset);
                y += Math.floor(bounds.height / 2);

                this.decorateText();

                gc.cache.textAlign = horizontalAlignId === RevHorizontalAlignId.Right
                    ? 'right'
                    : 'left';
                gc.cache.textBaseline = 'middle';
                gc.fillText(text, x, y);
            }

            return leftPadding + minWidth + rightPadding;
        }
    }

    protected findLines(words: string[], width: number) {
        if (words.length <= 1) {
            return words;
        } else {
            const gc = this._renderingContext;
            // starting with just the first word...
            let stillFits: boolean;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            let line = [words.shift()!];
            while (
                // so lone as line still fits within current column...
                (stillFits = gc.getTextWidth(line.join(' ')) < width)
                // ...AND there are more words available...
                && words.length > 0
            ) {
                // ...add another word to end of line and retest
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                line.push(words.shift()!);
            }

            if (
                !stillFits && // if line is now too long...
                line.length > 1 // ...AND is multiple words...
            ) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                words.unshift(line.pop()!); // ...back off by (i.e., remove) one word
            }

            line = [line.join(' ')];

            if (words.length) {
                // if there's anything left...
                line = line.concat(this.findLines(words, width)); // ...break it up as well
            }

            return line;
        }
    }

    protected strikeThrough(text: string, x: number, y: number, thickness: number) {
        const gc = this._renderingContext;
        const textWidth = gc.getTextWidth(text);

        switch (gc.cache.textAlign) {
            case 'center':
                x -= textWidth / 2;
                break;
            case 'right':
                x -= textWidth;
                break;
        }

        y = Math.round(y) + 0.5;

        gc.cache.lineWidth = thickness;
        gc.moveTo(x - 1, y);
        gc.lineTo(x + textWidth + 1, y);
    }

    protected underline(text: string, font: string, x: number, y: number, thickness: number) {
        const gc = this._renderingContext;
        const textHeight = gc.getTextHeight(font).height;
        const textWidth = gc.getTextWidth(text);

        switch (gc.cache.textAlign) {
            case 'center':
                x -= textWidth / 2;
                break;
            case 'right':
                x -= textWidth;
                break;
        }

        y = Math.ceil(y) + Math.round(textHeight / 2) - 0.5;

        //gc.beginPath();
        gc.cache.lineWidth = thickness;
        gc.moveTo(x, y);
        gc.lineTo(x + textWidth, y);
    }

    protected decorateText() {
        // if (isMainSubgrid) {
        //     if (settings.link) {
        //         if (cellHovered || !settings.linkOnHover) {
        //             if (settings.linkColor) {
        //                 gc.cache.strokeStyle = settings.linkColor;
        //             }
        //             gc.beginPath();
        //             this.underline(val, x, y, 1);
        //             gc.stroke();
        //             gc.closePath();
        //         }
        //         if (settings.linkColor && (cellHovered || !settings.linkColorOnHover)) {
        //             gc.cache.fillStyle = settings.linkColor;
        //         }
        //     }

        //     if (settings.strikeThrough === true) {
        //         gc.beginPath();
        //         this.strikeThrough(val, x, y, 1);
        //         gc.stroke();
        //         gc.closePath();
        //     }
        // }
    }

    /**
     * Similar to `getTextWidth` except:
     * 1. Aborts accumulating when sum exceeds given `width`.
     * 2. Returns an object containing both the truncated string and the sum (rather than a number primitive containing the sum alone).
     * @param text - Text to measure.
     * @param width - Width of target cell; overflow point.
     * @param truncateType - _Per {@link module:defaults.truncateTextWithEllipsis}._
     * @param abort - Abort measuring upon overflow. Returned `width` sum will reflect truncated string rather than untruncated string. Note that returned `string` is truncated in either case.
     * @param truncateFromStart - by default it will truncate the string from the position 0
     */
    private measureAndTruncateText(
        gc: RevCachedCanvasRenderingContext2D,
        text: string,
        width: number,
        truncateType: RevTextTruncateTypeId | undefined,
        abort: boolean,
        truncateFromEnd: boolean
    ): RevStandardTextPainter.TruncatedTextWidth {
        const truncating = truncateType !== undefined;
        let truncString: string | undefined; //, truncWidth, truncAt;

        const font = gc.cache.font;
        const textWidthMap = gc.getTextWidthMap(font);
        let ellipsisWidth: number | undefined;
        ellipsisWidth = textWidthMap.get(RevStandardTextPainter.Ellipsis);
        if (ellipsisWidth === undefined) {
            ellipsisWidth = gc.measureText(RevStandardTextPainter.Ellipsis).width;
            textWidthMap.set(RevStandardTextPainter.Ellipsis, ellipsisWidth);
        }

        text += ''; // convert to string
        // width += truncateType === TextTruncateType.BeforeLastPartiallyVisibleCharacter ? 2 : -1; // fudge for inequality
        const textLength = text.length;
        const textCharWidths = new Array<number>(textLength);
        let sum = 0;
        if (truncateFromEnd) {
            for (let i = textLength - 1; i >= 0; --i) {
                const char = text[i];
                let charWidth = textWidthMap.get(char);
                if (charWidth === undefined) {
                    charWidth = gc.measureText(char).width;
                    textWidthMap.set(char, charWidth);
                }
                textCharWidths[i] = charWidth;
                sum += charWidth;
                if (truncating && sum > width && truncString === undefined) {
                    switch (truncateType) {
                        case RevTextTruncateTypeId.WithEllipsis: { // truncate sufficient characters to fit ellipsis if possible
                            let truncWidth = sum - charWidth + ellipsisWidth;
                            let truncAt = i + 1;
                            while (truncAt < textLength && truncWidth > width) {
                                truncWidth -= textCharWidths[truncAt++];
                            }
                            truncString = truncWidth > width
                                ? '' // not enough room even for ellipsis
                                : truncString = RevStandardTextPainter.Ellipsis + text.substring(truncAt);
                            break;
                        }
                        case RevTextTruncateTypeId.BeforeLastPartiallyVisibleCharacter: { // truncate *before* last partially visible character
                            truncString = text.substring(i + 1);
                            break;
                        }
                        case RevTextTruncateTypeId.AfterLastPartiallyVisibleCharacter: { // truncate *after* partially visible character
                            truncString = text.substring(i);
                            break;
                        }
                        default:
                            throw new RevUnreachableCaseError('CRC2EGTWT98832', truncateType);
                    }
                    if (abort) {
                        break;
                    }
                }
            }
        } else {
            for (let i = 0, len = textLength; i < len; ++i) {
                const char = text[i];
                let charWidth = textWidthMap.get(char);
                if (charWidth === undefined) {
                    charWidth = gc.measureText(char).width;
                    textWidthMap.set(char, charWidth);
                }
                textCharWidths[i] = charWidth;
                sum += charWidth;
                if (truncating && sum > width && truncString === undefined) {
                    switch (truncateType) {
                        case RevTextTruncateTypeId.WithEllipsis: { // truncate sufficient characters to fit ellipsis if possible
                            let truncWidth = sum - charWidth + ellipsisWidth;
                            let truncAt = i;
                            while (truncAt && truncWidth > width) {
                                truncWidth -= textCharWidths[--truncAt];
                            }
                            truncString = truncWidth > width
                                ? '' // not enough room even for ellipsis
                                : truncString = text.substring(0, truncAt) + RevStandardTextPainter.Ellipsis;
                            break;
                        }
                        case RevTextTruncateTypeId.BeforeLastPartiallyVisibleCharacter: { // truncate *before* last partially visible character
                            truncString = text.substring(0, i);
                            break;
                        }
                        case RevTextTruncateTypeId.AfterLastPartiallyVisibleCharacter: { // truncate *after* partially visible character
                            const truncAt = i + 1;
                            if (truncAt < text.length) {
                                truncString = text.substring(0, truncAt);
                            }
                            break;
                        }
                        default:
                            throw new RevUnreachableCaseError('CRC2EGTWT98832', truncateType);
                    }
                    if (abort) {
                        break;
                    }
                }
            }
        }

        if (truncString === undefined) {
            truncString = text;
        }

        return {
            text: truncString,
            width: sum
        };
    }
}

/** @public */
export namespace RevStandardTextPainter {
    export const Whitespace = /\s\s+/g;
    export const Ellipsis = '\u2026' // The "…" (dot-dot-dot) character

    export interface TruncatedTextWidth {
        /** `undefined` if it fits; truncated version of provided `string` if it does not. */
        text: string | undefined,
        /** Width of provided `text` if it fits; width of truncated string if it does not. */
        width: number
    }

    export interface ClientColumnSettings {
        defaultColumnAutoSizing: boolean;
    }

    export interface OnlyColumnSettings {
        verticalOffset: number;
        textTruncateTypeId: RevTextTruncateTypeId | undefined;
        textStrikeThrough: boolean;
    }

    export interface ColumnSettings extends ClientColumnSettings, OnlyColumnSettings {
    }
}
