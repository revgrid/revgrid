
import { DataServer, DatalessViewCell, Rectangle, Revgrid, SchemaServer } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardCellPainter } from './standard-cell-painter';

/**
 * The default cell rendering function for a button cell.
 * @public
 */
export class StandardCheckboxCellPainter<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SC extends SchemaServer.Column<BCS>
> extends StandardCellPainter<BGS, BCS, SC> {

    private _boxBounds: Rectangle | undefined;

    constructor(
        grid: Revgrid<BGS, BCS, SC>,
        dataServer: DataServer<BCS>,
        private readonly _editable: boolean,
    ) {
        super(grid, dataServer);
    }

    get boxBounds() { return this._boxBounds; }

    override paint(cell: DatalessViewCell<BCS, SC>, _prefillColor: string | undefined): number | undefined {
        const columnSettings = cell.columnSettings;
        // const config = this.config; // remove this

        const bounds = cell.bounds;
        const boundsX = bounds.x;
        const boundsY = bounds.y;
        const boundsWidth = bounds.width;
        const boundsHeight = bounds.height;

        const settingsCellPadding = columnSettings.cellPadding;
        const resolvedCellPadding = settingsCellPadding === 0 ? 1 : settingsCellPadding;
        const maxWidth = boundsWidth - 2 * resolvedCellPadding;
        const maxHeight = boundsHeight - 2;
        const minMaxWidthHeight = Math.min(maxWidth, maxHeight);

        if (minMaxWidthHeight < StandardCheckboxCellPainter.minimumBoxSideLength) {
            this._boxBounds = undefined;
            return undefined;
        } else {
            const gc = this._renderingContext;

            const emWidth = gc.getEmWidth();
            let idealBoxSideLength = Math.ceil(emWidth);
            if (StandardCheckboxCellPainter.badlyRenderedCrossEvenBoxSideLengths.includes(idealBoxSideLength)) {
                // avoid small even side lengths as not enough resolution to get a nice cross
                idealBoxSideLength++;
            }
            if (idealBoxSideLength < StandardCheckboxCellPainter.minimumBoxSideLength) {
                idealBoxSideLength = StandardCheckboxCellPainter.minimumBoxSideLength;
            }

            const editable = this._editable;
            let boxSizeLength: number | undefined;
            let emphasizableLineWidth = 1;
            if (editable) {
                const editableIdealBoxSideLength = idealBoxSideLength + 2;
                if (editableIdealBoxSideLength <= minMaxWidthHeight) {
                    boxSizeLength = editableIdealBoxSideLength;
                    emphasizableLineWidth = 2;
                }
            }

            if (boxSizeLength === undefined) {
                // either did not want emphasize or emphasize did not fit
                if (idealBoxSideLength <= minMaxWidthHeight) {
                    boxSizeLength = idealBoxSideLength;
                } else {
                    boxSizeLength = minMaxWidthHeight;
                }
            }

            const centerX = boundsX + boundsWidth / 2;
            const centerY = boundsY + boundsHeight / 2;
            const halfBoxSizeLength = boxSizeLength / 2;
            const leftX = centerX - halfBoxSizeLength;
            const topY = centerY - halfBoxSizeLength;
            gc.cache.strokeStyle = columnSettings.color;
            gc.cache.lineWidth = emphasizableLineWidth;

            const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;
            const value = this._dataServer.getViewValue(cell.viewLayoutColumn.column.schemaColumn, subgridRowIndex);
            if (value === undefined) {
                // draw box
                gc.strokeRect(leftX, topY, boxSizeLength, boxSizeLength);

                // draw dash
                gc.cache.lineWidth = 1;
                gc.beginPath();
                gc.moveTo(centerX - halfBoxSizeLength, centerY);
                gc.lineTo(centerX + halfBoxSizeLength, centerY);
                gc.stroke();

                this._boxBounds = {
                    x: leftX,
                    y: topY,
                    width: boxSizeLength,
                    height: boxSizeLength,
                }

                return boxSizeLength;
            } else {
                const rightX = centerX + halfBoxSizeLength;
                const bottomY = centerY + halfBoxSizeLength;
                if (typeof value !== 'boolean') {
                    // Draw a char representing error
                    const charWidth = Math.ceil(gc.getCharWidth(StandardCheckboxCellPainter.valueNotBooleanChar));
                    const charTextHeight = gc.getTextHeight(StandardCheckboxCellPainter.valueNotBooleanChar);
                    const ascent = charTextHeight.ascent;
                    const halfMaxHeight = maxHeight / 2;
                    const descent = charTextHeight.descent;
                    if (charWidth > maxWidth || ascent > halfMaxHeight || descent > halfMaxHeight) { // make sure it fits
                        this._boxBounds = undefined;
                        return undefined;
                    } else {
                        gc.cache.font = columnSettings.font;
                        gc.cache.textBaseline = 'middle';
                        gc.cache.textAlign = 'center';
                        gc.fillText(StandardCheckboxCellPainter.valueNotBooleanChar, centerX, centerY);

                        const halfCharWidth = charWidth / 2;
                        const charLeftX = centerX - halfCharWidth;
                        const charTopY = centerY + ascent;
                        const charHeight = charTextHeight.height;

                        // If room, draw 2 vertical lines either side of character in the same place that the vertical lines in the box would be
                        if (boxSizeLength <= charWidth + 2) {
                            this._boxBounds = {
                                x: charLeftX,
                                y: charTopY,
                                width: charWidth,
                                height: charHeight,
                            }

                            return charWidth;
                        } else {
                            const boxBoundsTopY = Math.min(topY, charTopY);
                            const boxBoundsBottomY = Math.max(bottomY, centerY - descent);


                            gc.cache.lineWidth = emphasizableLineWidth;
                            gc.cache.strokeStyle = columnSettings.color;
                            gc.beginPath();
                            gc.moveTo(leftX, boxBoundsTopY);
                            gc.lineTo(leftX, boxBoundsBottomY);
                            gc.stroke();
                            gc.beginPath();
                            gc.moveTo(rightX, boxBoundsTopY);
                            gc.lineTo(rightX, boxBoundsBottomY);
                            gc.stroke();

                            this._boxBounds = {
                                x: leftX,
                                y: topY,
                                width: boxSizeLength,
                                height: boxBoundsBottomY - boxBoundsTopY,
                            }

                            return boxSizeLength;
                        }
                    }
                } else {
                    // draw box
                    gc.strokeRect(leftX, topY, boxSizeLength, boxSizeLength);
                    if (value) {
                        // draw cross
                        gc.cache.lineWidth = 1;
                        gc.beginPath();
                        gc.moveTo(leftX, topY);
                        gc.lineTo(rightX, bottomY);
                        gc.stroke();
                        gc.beginPath();
                        gc.moveTo(leftX, topY);
                        gc.lineTo(rightX, bottomY);
                        gc.stroke();
                    }

                    this._boxBounds = {
                        x: leftX,
                        y: topY,
                        width: boxSizeLength,
                        height: boxSizeLength,
                    }

                    return boxSizeLength;
                }
            }
        }
    }
}

/** @public */
export namespace StandardCheckboxCellPainter {
    export const typeName = 'Checkbox';
    export const minimumBoxSideLength = 5; // pixels
    export const badlyRenderedCrossEvenBoxSideLengths = [6];
    export const valueNotBooleanChar = '!';

    export interface Config {
        value: boolean;
        bounds: Rectangle;
        backgroundColor: string;
        foregroundColor: string;
    }
}
