
import { DataServer, DatalessViewCell, IndexSignatureHack, Rectangle, Revgrid, SchemaField } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardCellPainter } from './standard-cell-painter';

/**
 * The default cell rendering function for a button cell.
 * @public
 */
export class StandardCheckboxCellPainter<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SF extends SchemaField
> extends StandardCellPainter<BGS, BCS, SF> {

    constructor(
        grid: Revgrid<BGS, BCS, SF>,
        dataServer: DataServer<SF>,
        private readonly _editable: boolean,
    ) {
        super(grid, dataServer);
    }

    override paint(cell: DatalessViewCell<BCS, SF>, prefillColor: string | undefined): number | undefined {
        const columnSettings = cell.columnSettings;
        // const config = this.config; // remove this

        const bounds = cell.bounds;

        const boundsX = bounds.x;
        const boundsY = bounds.y;
        const boundsHeight = bounds.height;

        const sumOfResolvedLeftRightPadding = this.calculateSumOfResolvedLeftRightPadding(cell.columnSettings);

        const {
            maxBoxBoundsWidth,
            maxBoxBoundsHeight,
            maxBoxSideLength,
            maxBoxWidth,
            boxSideLength,
            boxLineWidth,
            idealBoxSideLength,
        } = this.calculateBox(bounds.width, boundsHeight, sumOfResolvedLeftRightPadding);

        if (maxBoxSideLength < StandardCheckboxCellPainter.minimumBoxSideLength) {
            this.saveUndefinedFingerprint(cell);
        } else {
            const pixelCenterBoundsX = boundsX + maxBoxBoundsWidth / 2; // since maxBoxBoundsWidth is always odd, this will always be at center of pixel
            const pixelCenterBoundsY = boundsY + maxBoxBoundsHeight / 2; // since maxBoxBoundsHeight is always odd, this will always be at center of pixel
            const pixelCenterBoxSizeLength = boxSideLength - boxLineWidth; // when drawing, length is between center of lines
            const pixelCenterHalfBoxSizeLength = pixelCenterBoxSizeLength / 2;
            const pixelCenterBoxLeftX = pixelCenterBoundsX - pixelCenterHalfBoxSizeLength;
            const pixelCenterBoxTopY = pixelCenterBoundsY - pixelCenterHalfBoxSizeLength;

            const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;
            const viewLayoutColumn = cell.viewLayoutColumn;
            const booleanValue = this.calculateBooleanValue(viewLayoutColumn.column.field, subgridRowIndex);
            const backgroundColor = prefillColor !== undefined ? prefillColor : columnSettings.backgroundColor;
            let borderColor = columnSettings.cellFocusedBorderColor;
            if (borderColor !== undefined) {
                const subgrid = cell.subgrid;
                if (subgrid.isMain) {
                    const activeColumnIndex = viewLayoutColumn.activeColumnIndex;
                    const cellFocused = this._grid.focus.isMainSubgridGridPointFocused(activeColumnIndex, subgridRowIndex);
                    if (!cellFocused) {
                        borderColor = undefined;
                    }
                }
            }

            const color = columnSettings.color;
            const gc = this._renderingContext;

            if (booleanValue === undefined) {
                const paintFingerprint: StandardCheckboxCellPainter.PaintFingerprint = {
                    value: booleanValue,
                    backgroundColor,
                    borderColor,
                    color,
                    boxLineWidth,
                    boxSideLength,
                    errorFont: undefined,
                };
                if (!this.checkSameAndAlwaysSavePaintFingerprint(cell, paintFingerprint)) {
                    this.tryPaintBorder(bounds, borderColor, true);
                    // draw box
                    gc.cache.strokeStyle = color;
                    gc.cache.lineWidth = boxLineWidth;
                    gc.strokeRect(pixelCenterBoxLeftX, pixelCenterBoxTopY, pixelCenterBoxSizeLength, pixelCenterBoxSizeLength);

                    // draw dash
                    gc.cache.lineWidth = 1;
                    gc.beginPath();
                    gc.moveTo(pixelCenterBoundsX - pixelCenterHalfBoxSizeLength, pixelCenterBoundsY);
                    gc.lineTo(pixelCenterBoundsX + pixelCenterHalfBoxSizeLength, pixelCenterBoundsY);
                    gc.stroke();
                }
            } else {
                const pixelCenterBoxRightX = pixelCenterBoundsX + pixelCenterHalfBoxSizeLength;
                const pixelCenterBoxBottomY = pixelCenterBoundsY + pixelCenterHalfBoxSizeLength;

                if (typeof booleanValue === null) {
                    const font = columnSettings.font;
                    gc.cache.font = font;
                    const charWidth = Math.ceil(gc.getCharWidth(StandardCheckboxCellPainter.valueNotBooleanChar));
                    const charTextHeight = gc.getTextHeight(StandardCheckboxCellPainter.valueNotBooleanChar);
                    const ascent = charTextHeight.ascent;
                    const halfBoundsHeight = boundsHeight / 2;
                    const descent = charTextHeight.descent;
                    if (charWidth > maxBoxWidth || ascent > halfBoundsHeight || descent > halfBoundsHeight) { // make sure it fits
                        this.saveUndefinedFingerprint(cell);
                    } else {
                        const charTopY = pixelCenterBoundsY + ascent;
                        const lineTopY = Math.min(pixelCenterBoxTopY, charTopY);
                        const lineBottomY = Math.max(pixelCenterBoxBottomY, pixelCenterBoundsY - descent);

                        let verticalBoxLength: number | undefined;
                        if (boxSideLength <= charWidth + 2) {
                            // No room to draw box. Just draw the character
                            verticalBoxLength = undefined; // flag only character drawn
                        }

                        const paintFingerprint: StandardCheckboxCellPainter.PaintFingerprint = {
                            value: booleanValue,
                            backgroundColor,
                            borderColor,
                            color,
                            boxLineWidth,
                            boxSideLength: verticalBoxLength,
                            errorFont: font,
                        };
                        if (!this.checkSameAndAlwaysSavePaintFingerprint(cell, paintFingerprint)) {
                            // Draw a char representing error
                            gc.cache.strokeStyle = color;
                            gc.cache.textBaseline = 'middle';
                            gc.cache.textAlign = 'center';
                            gc.fillText(StandardCheckboxCellPainter.valueNotBooleanChar, pixelCenterBoundsX, pixelCenterBoundsY);

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
                        }
                    }
                } else {
                    const paintFingerprint: StandardCheckboxCellPainter.PaintFingerprint = {
                        value: booleanValue,
                        backgroundColor,
                        borderColor,
                        color,
                        boxLineWidth,
                        boxSideLength,
                        errorFont: undefined,
                    };
                    if (!this.checkSameAndAlwaysSavePaintFingerprint(cell, paintFingerprint)) {
                        this.tryPaintBorder(bounds, borderColor, true);
                        // draw box
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
                    }
                }
            }
        }

        return idealBoxSideLength + sumOfResolvedLeftRightPadding;
    }

    calculateClickBox(cell: DatalessViewCell<BCS, SF>): Rectangle | undefined {
        const columnSettings = cell.columnSettings;
        const sumOfResolvedLeftRightPadding = this.calculateSumOfResolvedLeftRightPadding(columnSettings);

        const bounds = cell.bounds;
        const {
            maxBoxBoundsWidth,
            maxBoxBoundsHeight,
            maxBoxSideLength,
            maxBoxWidth,
            boxSideLength,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            boxLineWidth,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            idealBoxSideLength,
        } = this.calculateBox(bounds.width, bounds.height, sumOfResolvedLeftRightPadding);

        if (maxBoxSideLength < StandardCheckboxCellPainter.minimumBoxSideLength) {
            return undefined;
        } else {
            const booleanValue = this.calculateBooleanValue(cell.viewLayoutColumn.column.field, cell.viewLayoutRow.subgridRowIndex);
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
                if (typeof booleanValue === null) {
                    const gc = this._renderingContext;
                    const font = columnSettings.font;
                    gc.cache.font = font;
                    const charWidth = Math.ceil(gc.getCharWidth(StandardCheckboxCellPainter.valueNotBooleanChar));
                    const charTextHeight = gc.getTextHeight(StandardCheckboxCellPainter.valueNotBooleanChar);
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

    private calculateBox(boundsWidth: number, boundsHeight: number, sumOfResolvedLeftRightPadding: number): BoxDetails {
        let maxBoxBoundsWidth = boundsWidth;
        if (maxBoxBoundsWidth % 2 === 0) {
            maxBoxBoundsWidth--; // make sure odd width
        }
        let maxBoxBoundsHeight = boundsHeight;
        if (maxBoxBoundsHeight % 2 === 0) {
            maxBoxBoundsHeight--; // make sure odd height
        }

        const maxBoxWidth = maxBoxBoundsWidth - sumOfResolvedLeftRightPadding;
        const maxBoxHeight = maxBoxBoundsHeight - 2;
        const maxBoxSideLength = Math.min(maxBoxWidth, maxBoxHeight);

        const emWidth = this._renderingContext.getEmWidth();
        let idealNonEditableBoxSideLength = Math.ceil(0.7 * emWidth);
        if (idealNonEditableBoxSideLength % 2 === 0) {
            idealNonEditableBoxSideLength++; // make sure odd length
        }
        if (idealNonEditableBoxSideLength < StandardCheckboxCellPainter.minimumBoxSideLength) {
            idealNonEditableBoxSideLength = StandardCheckboxCellPainter.minimumBoxSideLength;
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
            maxBoxBoundsWidth,
            maxBoxBoundsHeight,
            maxBoxSideLength,
            maxBoxWidth,
            boxSideLength,
            boxLineWidth,
            idealBoxSideLength,
        }
    }

    private calculateSumOfResolvedLeftRightPadding(columnSettings: StandardBehavioredColumnSettings) {
        const settingsCellPadding = columnSettings.cellPadding;
        const resolvedCellPadding = settingsCellPadding === 0 ? 1 : settingsCellPadding;
        return 2 * resolvedCellPadding;
    }

    private calculateBooleanValue(schemaField: SF, subgridRowIndex: number) {
        const viewValue = this._dataServer.getViewValue(schemaField, subgridRowIndex);
        return this.convertViewValueToBoolean(viewValue);
    }
    private convertViewValueToBoolean(value: unknown) {
        switch (typeof value) {
            case 'string': {
                if (value === '') {
                    return undefined;
                } else {
                    const trimmedLowerCaseBoolStr = value.trim().toLowerCase();
                    if (
                        trimmedLowerCaseBoolStr === 'true' ||
                        trimmedLowerCaseBoolStr === '1' ||
                        trimmedLowerCaseBoolStr === 'yes'
                    ) {
                        return true;
                    } else {
                        if (
                            trimmedLowerCaseBoolStr === 'false' ||
                            trimmedLowerCaseBoolStr === '0' ||
                            trimmedLowerCaseBoolStr === 'no'
                        ) {
                            return false;
                        } else {
                            return null;
                        }
                    }
                }
            }
            case 'number':
            case 'bigint':
                if (value === 0) {
                    return false;
                } else {
                    if (value === 1) {
                        return true;
                    } else {
                        return null;
                    }
                }
            case 'boolean':
                return value;
            case 'symbol':
                return null;
            case 'undefined':
                return undefined;
            case 'object':
                return value === null ? undefined : null;
            case 'function':
                return null;
            default:
                // typeof value satisfies never
                return null;
        }
    }

    private saveUndefinedFingerprint(cell: DatalessViewCell<BCS, SF>) {
        cell.paintFingerprint = undefined;
    }

    private checkSameAndAlwaysSavePaintFingerprint(cell: DatalessViewCell<BCS, SF>, fingerprint: StandardCheckboxCellPainter.PaintFingerprint) {
        const oldFingerprint = cell.paintFingerprint as StandardCheckboxCellPainter.PaintFingerprint | undefined;
        let same: boolean;
        if (oldFingerprint === undefined) {
            same = false;
        } else {
            same = StandardCheckboxCellPainter.PaintFingerprint.same(oldFingerprint, fingerprint);
        }
        cell.paintFingerprint = fingerprint;
        return same;
    }
}

/** @public */
export namespace StandardCheckboxCellPainter {
    export const typeName = 'Checkbox';
    export const minimumBoxSideLength = 5; // pixels
    export const valueNotBooleanChar = '!';

    export interface PaintFingerprintInterface {
        readonly value: boolean | undefined |null;
        readonly backgroundColor: string;
        readonly color: string;
        readonly borderColor: string | undefined;
        readonly boxLineWidth: number;
        readonly boxSideLength: number | undefined;
        readonly errorFont: string | undefined;
    }

    export type PaintFingerprint = IndexSignatureHack<PaintFingerprintInterface>;

    export namespace PaintFingerprint {
        export function same(left: PaintFingerprint, right: PaintFingerprint) {
            return (
                left.value === right.value &&
                left.backgroundColor === right.backgroundColor &&
                left.color === right.color &&
                left.borderColor === right.borderColor &&
                left.boxLineWidth === right.boxLineWidth &&
                left.boxSideLength === right.boxSideLength &&
                left.errorFont === right.errorFont
            );
        }
    }

    export interface Config {
        value: boolean;
        bounds: Rectangle;
        backgroundColor: string;
        foregroundColor: string;
    }
}

interface BoxDetails {
    maxBoxBoundsWidth: number,
    maxBoxBoundsHeight: number,
    maxBoxSideLength: number,
    maxBoxWidth: number,
    boxSideLength: number,
    boxLineWidth: number,
    idealBoxSideLength: number,
}
