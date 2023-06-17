import { Rectangle, SchemaServer } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardCellPainter } from './standard-cell-painter';

/** @public */
export abstract class StandardTextCellPainter<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SF extends SchemaServer.Field
> extends StandardCellPainter<BGS, BCS, SF> {
    protected _columnSettings: BCS;

    setColumnSettings(value: BCS) {
        this._columnSettings = value;
    }

/**
 * @summary Renders single line text.
 * @param val - The text to render in the cell.
 */
    protected renderMultiLineText(
        bounds: Rectangle,
        val: string,
        leftPadding: number,
        rightPadding: number,
    ) {
        const columnSettings = this._columnSettings;
        const gc = this._renderingContext;
        const x = bounds.x;
        const y = bounds.y;
        const width = bounds.width;
        const height = bounds.height;
        const cleanVal = (val + '').trim().replace(WHITESPACE, ' '); // trim and squeeze whitespace
        const lines = this.findLines(cleanVal.split(' '), width);

        if (lines.length === 1) {
            return this.renderSingleLineText(bounds, cleanVal, leftPadding, rightPadding);
        } else {
            let halignOffset = leftPadding;
            let valignOffset = columnSettings.verticalOffset;
            const halign = columnSettings.horizontalAlign;
            const textHeight = gc.getTextHeight(columnSettings.font).height;

            switch (halign) {
                case 'right':
                    halignOffset = width - rightPadding;
                    break;
                case 'center':
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

            gc.cache.textAlign = halign;
            gc.cache.textBaseline = 'middle';

            for (let i = 0; i < lines.length; i++) {
                gc.fillText(lines[i], x + halignOffset, y + valignOffset + (i * textHeight));
            }

            gc.cache.restore(); // discard clipping region

            return leftPadding + width + rightPadding;
        }
    }

    /**
     * @summary Renders single line text.
     * @param val - The text to render in the cell.
     */
    protected renderSingleLineText(
        bounds: Rectangle,
        val: string,
        leftPadding: number,
        rightPadding: number,
    ) {
        const gc = this._renderingContext;
        const settings = this._columnSettings;
        let x = bounds.x;
        let y = bounds.y;
        const width = bounds.width;
        let halignOffset = leftPadding;
        const halign = settings.horizontalAlign;
        let minWidth: number;

        const rightHaligned = halign === 'right';
        const truncateWidth = width - rightPadding - leftPadding;
        if (settings.defaultColumnAutosizing) {
            const truncatedResult = gc.getTextWidthTruncated(val, truncateWidth, settings.textTruncateType, false, rightHaligned);
            minWidth = truncatedResult.textWidth;
            val = truncatedResult.text ?? val;
            if (halign === 'center') {
                halignOffset = (width - truncatedResult.textWidth) / 2;
            }
        } else {
            const truncatedResult = gc.getTextWidthTruncated(val, truncateWidth, settings.textTruncateType, true, rightHaligned);
            minWidth = 0;
            if (truncatedResult.text !== undefined) {
                // not enough space to show the extire text, the text is truncated to fit for the width
                val = truncatedResult.text;
            } else {
                // enought space to show the entire text
                if (halign === 'center') {
                    halignOffset = (width - truncatedResult.textWidth) / 2;
                }
            }
        }

        if (val !== null) {
            // the position for x need to be relocated.
            // for canvas to print text, when textAlign is 'end' or 'right'
            // it will start with position x and print the text on the left
            // so the exact position for x need to increase by the acutal width - rightPadding
            x += halign === 'right'
                ? width - rightPadding
                : Math.max(leftPadding, halignOffset);
            y += Math.floor(bounds.height / 2);

            this.decorateText();

            gc.cache.textAlign = halign === 'right'
                ? 'right'
                : 'left';
            gc.cache.textBaseline = 'middle';
            gc.fillText(val, x, y);
        }

        return leftPadding + minWidth + rightPadding;
    }

    protected findLines(words: string[], width: number) {
        if (words.length <= 1) {
            return words;
        } else {
            const gc = this._renderingContext;
            // starting with just the first word...
            let stillFits: boolean;
            let line = [words.shift() as string];
            while (
                // so lone as line still fits within current column...
                (stillFits = gc.getTextWidth(line.join(' ')) < width)
                // ...AND there are more words available...
                && words.length > 0
            ) {
                // ...add another word to end of line and retest
                line.push(words.shift() as string);
            }

            if (
                !stillFits && // if line is now too long...
                line.length > 1 // ...AND is multiple words...
            ) {
                words.unshift(line.pop() as string); // ...back off by (i.e., remove) one word
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

    protected underline(text: string, x: number, y: number, thickness: number) {
        const gc = this._renderingContext;
        const settings = this._columnSettings;
        const textHeight = gc.getTextHeight(settings.font).height;
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
}

const WHITESPACE = /\s\s+/g;
