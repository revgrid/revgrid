
import {
    CachedCanvasRenderingContext2D,
    GridSettings,
    IndexSignatureHack,
    Rectangle
} from '../../grid/grid-public-api';

/** @public */
export class StandardCheckboxPainter {
    constructor(
        private readonly _editable: boolean,
        private readonly _renderingContext: CachedCanvasRenderingContext2D
    ) {
    }

    writeFingerprintOrCheckPaint(
        fingerprint: Partial<StandardCheckboxPainter.PaintFingerprint | undefined>,
        bounds: Rectangle,
        booleanValue: boolean | undefined | null,
        boxDetails: StandardCheckboxPainter.BoxDetails,
        color: string,
        font: string,
    ): number | undefined {
        const idealBoundsWidth = boxDetails.idealBoxSideLength + boxDetails.sumOfResolvedLeftRightPadding;

        if (boxDetails.maxBoxSideLength < StandardCheckboxPainter.minimumBoxSideLength) {
            if (fingerprint !== undefined) {
                this.writeUndefinedFingerprint(fingerprint);
                return undefined;
            } else {
                return idealBoundsWidth;
            }
        } else {
            const boundsX = bounds.x;
            const boundsY = bounds.y;
            const boundsHeight = bounds.height;

            const boxSideLength = boxDetails.boxSideLength;
            const boxLineWidth = boxDetails.boxLineWidth;

            const pixelCenterBoundsX = boundsX + boxDetails.maxBoxBoundsWidth / 2; // since maxBoxBoundsWidth is always odd, this will always be at center of pixel
            const pixelCenterBoundsY = boundsY + boxDetails.maxBoxBoundsHeight / 2; // since maxBoxBoundsHeight is always odd, this will always be at center of pixel
            const pixelCenterBoxSizeLength = boxSideLength - boxLineWidth; // when drawing, length is between center of lines
            const pixelCenterHalfBoxSizeLength = pixelCenterBoxSizeLength / 2;
            const pixelCenterBoxLeftX = pixelCenterBoundsX - pixelCenterHalfBoxSizeLength;
            const pixelCenterBoxTopY = pixelCenterBoundsY - pixelCenterHalfBoxSizeLength;

            if (booleanValue === undefined) {
                if (fingerprint !== undefined) {
                    this.writeFingerprint(fingerprint, booleanValue, boxLineWidth, boxSideLength, color, undefined);
                    return undefined;
                } else {
                    const gc = this._renderingContext;

                    gc.cache.strokeStyle = color;
                    gc.cache.lineWidth = boxLineWidth;
                    gc.strokeRect(pixelCenterBoxLeftX, pixelCenterBoxTopY, pixelCenterBoxSizeLength, pixelCenterBoxSizeLength);

                    // draw dash
                    gc.cache.lineWidth = 1;
                    gc.beginPath();
                    gc.moveTo(pixelCenterBoundsX - pixelCenterHalfBoxSizeLength, pixelCenterBoundsY);
                    gc.lineTo(pixelCenterBoundsX + pixelCenterHalfBoxSizeLength, pixelCenterBoundsY);
                    gc.stroke();

                    return idealBoundsWidth;
                }
            } else {
                const pixelCenterBoxRightX = pixelCenterBoundsX + pixelCenterHalfBoxSizeLength;
                const pixelCenterBoxBottomY = pixelCenterBoundsY + pixelCenterHalfBoxSizeLength;

                if (booleanValue === null) {
                    const gc = this._renderingContext;
                    gc.cache.font = font;
                    const charWidth = Math.ceil(gc.getCharWidth(StandardCheckboxPainter.valueNotBooleanChar));
                    const charTextHeight = gc.getTextHeight(StandardCheckboxPainter.valueNotBooleanChar);
                    const ascent = charTextHeight.ascent;
                    const descent = charTextHeight.descent;
                    if (charWidth > boxDetails.maxBoxWidth || ascent + descent > boundsHeight) { // make sure it fits
                        if (fingerprint !== undefined) {
                            this.writeUndefinedFingerprint(fingerprint);
                            return undefined;
                        } else {
                            return idealBoundsWidth;
                        }
                    } else {
                        const charTopY = pixelCenterBoundsY + ascent;
                        const lineTopY = Math.min(pixelCenterBoxTopY, charTopY);
                        const lineBottomY = Math.max(pixelCenterBoxBottomY, pixelCenterBoundsY - descent);

                        let verticalBoxLength: number | undefined;
                        if (boxSideLength <= charWidth + 2) {
                            // No room to draw box. Just draw the character
                            verticalBoxLength = undefined; // flag only character drawn
                        } else {
                            verticalBoxLength = lineBottomY - lineTopY + 1;
                        }

                        if (fingerprint !== undefined) {
                            this.writeFingerprint(fingerprint, booleanValue, boxLineWidth, verticalBoxLength, color, font);
                            return undefined;
                        } else {
                            // Draw a char representing error
                            gc.cache.strokeStyle = color;
                            gc.cache.textBaseline = 'middle';
                            gc.cache.textAlign = 'center';
                            gc.fillText(StandardCheckboxPainter.valueNotBooleanChar, pixelCenterBoundsX, pixelCenterBoundsY);

                            if (verticalBoxLength !== undefined) {
                                // Draw 2 vertical lines either side of character in the same place that the vertical lines in the box would be
                                gc.cache.lineWidth = boxLineWidth;
                                gc.beginPath();
                                gc.moveTo(pixelCenterBoxLeftX, lineTopY);
                                gc.lineTo(pixelCenterBoxLeftX, lineBottomY);
                                gc.stroke();
                                gc.beginPath();
                                gc.moveTo(pixelCenterBoxRightX, lineTopY);
                                gc.lineTo(pixelCenterBoxRightX, lineBottomY);
                                gc.stroke();
                            }
                            return idealBoundsWidth;
                        }
                    }
                } else {
                    if (fingerprint !== undefined) {
                        this.writeFingerprint(fingerprint, booleanValue, boxLineWidth, boxSideLength, color, undefined);
                        return undefined;
                    } else {
                        // draw box
                        const gc = this._renderingContext;
                        gc.cache.strokeStyle = color;
                        gc.cache.lineWidth = boxLineWidth;
                        gc.strokeRect(pixelCenterBoxLeftX, pixelCenterBoxTopY, pixelCenterBoxSizeLength, pixelCenterBoxSizeLength);
                        if (booleanValue) {
                            // draw cross
                            gc.cache.lineWidth = 1;
                            gc.beginPath();
                            gc.moveTo(pixelCenterBoxLeftX, pixelCenterBoxTopY);
                            gc.lineTo(pixelCenterBoxRightX, pixelCenterBoxBottomY);
                            gc.stroke();
                            gc.beginPath();
                            gc.moveTo(pixelCenterBoxRightX, pixelCenterBoxTopY);
                            gc.lineTo(pixelCenterBoxLeftX, pixelCenterBoxBottomY);
                            gc.stroke();
                        }

                        return idealBoundsWidth;
                    }
                }
            }
        }
    }

    calculateClickBox(
        bounds: Rectangle,
        booleanValue: boolean | undefined | null,
        cellPadding: number,
        font: string,
    ): Rectangle | undefined{
        const {
            maxBoxBoundsWidth,
            maxBoxBoundsHeight,
            maxBoxSideLength,
            maxBoxWidth,
            boxSideLength,
        } = this.calculateBoxDetails(bounds, cellPadding);

        if (maxBoxSideLength < StandardCheckboxPainter.minimumBoxSideLength) {
            return undefined;
        } else {
            const centerBoundsX = bounds.x + maxBoxBoundsWidth / 2;
            const centerBoundsY = bounds.y + maxBoxBoundsHeight / 2;
            const halfBoxSideLength = boxSideLength / 2;
            const boxLeftX = centerBoundsX - halfBoxSideLength;
            const boxTopY = centerBoundsY - halfBoxSideLength;
            if (booleanValue === undefined) {
                return {
                    x: boxLeftX,
                    y: boxTopY,
                    width: boxSideLength,
                    height: boxSideLength,
                }
            } else {
                if (booleanValue === null) {
                    const gc = this._renderingContext;
                    gc.cache.font = font;
                    const charWidth = Math.ceil(gc.getCharWidth(StandardCheckboxPainter.valueNotBooleanChar));
                    const charTextHeight = gc.getTextHeight(StandardCheckboxPainter.valueNotBooleanChar);
                    const ascent = charTextHeight.ascent;
                    const halfBoundsHeight = bounds.height / 2;
                    const descent = charTextHeight.descent;
                    if (charWidth > maxBoxWidth || ascent > halfBoundsHeight || descent > halfBoundsHeight) { // make sure it fits
                        return undefined;
                    } else {
                        const charTopY = centerBoundsY + ascent;
                        if (boxSideLength <= charWidth + 2) {
                            // No room for box - can only click on character
                            const halfCharWidth = charWidth / 2;
                            const charLeftX = centerBoundsX - halfCharWidth;
                            const charHeight = ascent + descent;
                            return {
                                x: charLeftX,
                                y: charTopY,
                                width: charWidth,
                                height: charHeight,
                            }
                        } else {
                            const topY = Math.min(boxTopY, charTopY);
                            const maxDescent = Math.max(halfBoxSideLength, descent);
                            const height = centerBoundsY + maxDescent - topY;
                            return {
                                x: boxLeftX,
                                y: topY,
                                width: boxSideLength,
                                height: height,
                            };
                        }
                    }
                } else {
                    return {
                        x: boxLeftX,
                        y: boxTopY,
                        width: boxSideLength,
                        height: boxSideLength,
                    };
                }
            }
        }
    }

    calculateBoxDetails(
        bounds: Rectangle,
        cellPadding: number,
    ): StandardCheckboxPainter.BoxDetails {
        let maxBoxBoundsWidth = bounds.width;
        if (maxBoxBoundsWidth % 2 === 0) {
            maxBoxBoundsWidth--; // make sure odd width
        }
        let maxBoxBoundsHeight = bounds.height;
        if (maxBoxBoundsHeight % 2 === 0) {
            maxBoxBoundsHeight--; // make sure odd height
        }

        const resolvedCellPadding = cellPadding === 0 ? 1 : cellPadding;
        const sumOfResolvedLeftRightPadding = 2 * resolvedCellPadding;

        const maxBoxWidth = maxBoxBoundsWidth - sumOfResolvedLeftRightPadding;
        const maxBoxHeight = maxBoxBoundsHeight - 2;
        const maxBoxSideLength = Math.min(maxBoxWidth, maxBoxHeight);

        const emWidth = this._renderingContext.getEmWidth();
        let idealNonEditableBoxSideLength = Math.ceil(0.7 * emWidth);
        if (idealNonEditableBoxSideLength % 2 === 0) {
            idealNonEditableBoxSideLength++; // make sure odd length
        }
        if (idealNonEditableBoxSideLength < StandardCheckboxPainter.minimumBoxSideLength) {
            idealNonEditableBoxSideLength = StandardCheckboxPainter.minimumBoxSideLength;
        }

        const editable = this._editable;
        let idealBoxSideLength: number; // this is the preferred content width
        let boxSideLength: number | undefined;
        let boxLineWidth = 1;
        if (editable) {
            idealBoxSideLength = idealNonEditableBoxSideLength + 2;
            if (idealBoxSideLength <= maxBoxSideLength) {
                boxSideLength = idealBoxSideLength;
                boxLineWidth = 2;
            }
        } else {
            idealBoxSideLength = idealNonEditableBoxSideLength;
        }

        if (boxSideLength === undefined) {
            // either did not want emphasize or emphasize did not fit
            if (idealNonEditableBoxSideLength <= maxBoxSideLength) {
                boxSideLength = idealNonEditableBoxSideLength;
            } else {
                boxSideLength = maxBoxSideLength;
            }
        }

        return {
            sumOfResolvedLeftRightPadding,
            maxBoxBoundsWidth,
            maxBoxBoundsHeight,
            maxBoxSideLength,
            maxBoxWidth,
            boxSideLength,
            boxLineWidth,
            idealBoxSideLength,
        }
    }

    writeUndefinedFingerprint(fingerprint: Partial<StandardCheckboxPainter.PaintFingerprint>) {
        this.writeFingerprint(fingerprint, null, 0, 0, '', '');
    }

    private writeFingerprint(
        fingerprint: Partial<StandardCheckboxPainter.PaintFingerprint>,
        value: boolean | undefined | null,
        boxLineWidth: number,
        boxSideLength: number | undefined,
        color: GridSettings.Color,
        errorFont: string | undefined,
    ) {
        fingerprint.value = value;
        fingerprint.boxLineWidth = boxLineWidth;
        fingerprint.boxSideLength = boxSideLength;
        fingerprint.color = color;
        fingerprint.errorFont = errorFont;
    }
}

/** @public */
export namespace StandardCheckboxPainter {
    export const minimumBoxSideLength = 5; // pixels
    export const valueNotBooleanChar = '!';

    export interface BoxDetails {
        sumOfResolvedLeftRightPadding: number;
        maxBoxBoundsWidth: number,
        maxBoxBoundsHeight: number,
        maxBoxSideLength: number,
        maxBoxWidth: number,
        boxSideLength: number,
        boxLineWidth: number,
        idealBoxSideLength: number,
    }

    export interface PaintFingerprintInterface {
        value: boolean | undefined |null;
        boxLineWidth: number;
        boxSideLength: number | undefined;
        color: GridSettings.Color;
        errorFont: string | undefined;
    }

    export type PaintFingerprint = IndexSignatureHack<PaintFingerprintInterface>;

    export namespace PaintFingerprint {
        export function same(left: PaintFingerprint, right: PaintFingerprint) {
            return (
                left.value === right.value &&
                left.boxLineWidth === right.boxLineWidth &&
                left.boxSideLength === right.boxSideLength &&
                left.color === right.color &&
                left.errorFont === right.errorFont
            );
        }
    }
}
