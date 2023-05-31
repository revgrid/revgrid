
import {
    IndexSignatureHack,
    Rectangle
} from '../grid/grid-public-api';
import { TextCellPainter } from './text-cell-painter';

/**
 * @constructor
 * @summary A cell renderer for a text cell.
 * @desc Great care has been taken in crafting this function as it needs to perform extremely fast.
 *
 * Use `gc.cache` instead which we have implemented to cache the graphics context properties. Reads on the graphics context (`gc`) properties are expensive but not quite as expensive as writes. On read of a `gc.cache` prop, the actual `gc` prop is read into the cache once and from then on only the cache is referenced for that property. On write, the actual prop is only written to when the new value differs from the cached value.
 *
 * Clipping bounds are not set here as this is also an expensive operation. Instead, we employ a number of strategies to truncate overflowing text and content.
 * @public
 */
export class AlphaTextCellPainter extends TextCellPainter {

    override paint(prefillColor: string | undefined): number | undefined {
        const grid = this._grid;
        const cell = this._cell;

        this._settingsAccessor.setColumn(cell.viewLayoutColumn.column, cell.isHeader, cell.isFilter);
        const settings = this._settingsAccessor;

        const gc = this._renderingContext;
        const selection = grid.selection;
        const activeColumnIndex = cell.viewLayoutColumn.activeColumnIndex;
        const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;

        // setting gc properties are expensive, let's not do it needlessly

        // Note: vf == 0 is fastest equivalent of vf === 0 || vf === false which excludes NaN, null, undefined


        const subgrid = cell.subgrid;
        const {
            rowSelected: isRowSelected,
            columnSelected: isColumnSelected,
            cellSelected: isCellSelected
        } = selection.getCellSelectedAreaTypes(activeColumnIndex, subgridRowIndex, subgrid);
        const isSelected = isCellSelected || isRowSelected || isColumnSelected;

        const textFont = isSelected ? settings.foregroundSelectionFont : settings.font;

        const textColor = gc.cache.strokeStyle = isSelected
            ? settings.foregroundSelectionColor
            : settings.color;

        const value = this._dataServer.getValue(cell.viewLayoutColumn.column.schemaColumn, subgridRowIndex);
        const valText = value as string;

        const fingerprint = cell.paintFingerprint as PaintFingerprint | undefined;
        let fingerprintColorsLength: number;
        let same: boolean;
        if (fingerprint === undefined) {
            fingerprintColorsLength = 0;
            same = false;
        } else {
            fingerprintColorsLength = fingerprint.layerColors.length;
            const partialRender = prefillColor === undefined; // signifies abort before rendering if same
            same = partialRender &&
                valText === fingerprint.value &&
                textFont === fingerprint.textFont &&
                textColor === fingerprint.textColor;
        }

        const isMainSubgrid = subgrid.isMain;

        // Since this painter supports colors with alpha, we need to layer colors so that they blend
        // fill background only if our bgColor is populated or we are a selected cell
        const layerColors: string[] = [];
        let layerColorIndex = 0;

        let hoverColor: string | undefined;
        const hoverCell = this._grid.mouse.hoverCell;
        const columnHovered =
            (hoverCell !== undefined) &&
            (hoverCell.viewLayoutColumn.activeColumnIndex === activeColumnIndex);
        const rowHovered =
            cell.isMain &&
            (hoverCell !== undefined) &&
            (hoverCell.viewLayoutRow.index === cell.viewLayoutRow.index);
        const cellHovered = rowHovered && columnHovered;

        if (cellHovered && settings.cellHoverBackgroundColor !== undefined) {
            hoverColor = settings.cellHoverBackgroundColor;
        } else {
            const rowHoverBackgroundColor = settings.rowHoverBackgroundColor;
            if (rowHovered && rowHoverBackgroundColor !== undefined) {
                hoverColor = rowHoverBackgroundColor;
            } else {
                const columnHoverBackgroundColors = settings.columnHoverBackgroundColors;
                const columnHoverBackgroundColor = columnHoverBackgroundColors.headerColor !== undefined ?
                    columnHoverBackgroundColors.headerColor :
                    columnHoverBackgroundColors.color;
                if (columnHovered && columnHoverBackgroundColor !== undefined) {
                    hoverColor = columnHoverBackgroundColor;
                } else {
                    hoverColor = undefined;
                }
            }
        }

        let firstColorIsFill = false;
        if (gc.alpha(hoverColor) < 1) {
            let selectColor: string | undefined;
            if (isSelected) {
                selectColor = settings.backgroundSelectionColor;
            }

            if (gc.alpha(selectColor) < 1) {
                const inheritsBackgroundColor = (settings.backgroundColor === prefillColor);
                if (!inheritsBackgroundColor) {
                    firstColorIsFill = true;
                    layerColors.push(settings.backgroundColor);
                    same = same &&
                        fingerprint !== undefined &&
                        firstColorIsFill === fingerprint.firstColorIsFill && settings.backgroundColor === fingerprint.layerColors[layerColorIndex++];
                }
            }

            if (selectColor !== undefined) {
                layerColors.push(selectColor);
                same = same &&
                    fingerprint !== undefined &&
                    selectColor === fingerprint.layerColors[layerColorIndex++];
            }
        }
        if (hoverColor !== undefined) {
            layerColors.push(hoverColor);
            same = same && fingerprint !== undefined && hoverColor === fingerprint.layerColors[layerColorIndex++];
        }

        const cellFocused = isMainSubgrid && grid.focus.isMainSubgridGridPointFocused(activeColumnIndex, subgridRowIndex);
        let borderColor: string | undefined;
        if (cellFocused) {
            borderColor = settings.focusedCellBorderColor;
        } else {
            borderColor = undefined;
        }
        same &&= fingerprint !== undefined && fingerprint.borderColor === borderColor;

        // return a fingerprint to save in View cell for future comparisons by partial renderer
        const newFingerprint: PaintFingerprint = {
            value: valText,
            textColor,
            textFont,
            borderColor,
            firstColorIsFill,
            layerColors,
        };
        cell.paintFingerprint = newFingerprint; // supports partial render

        if (same && layerColorIndex === fingerprintColorsLength) {
            return undefined;
        } else {
            const bounds = cell.bounds;
            const leftPadding = settings.cellPadding;
            const rightPadding = settings.cellPadding;

            this.paintLayerColors(bounds, layerColors, firstColorIsFill);
            this.checkPaintBorder(bounds, borderColor);
            // draw text
            gc.cache.fillStyle = textColor;
            gc.cache.font = textFont;
            return this.renderSingleLineText(bounds, valText, leftPadding, rightPadding);
        }
    }

    private paintLayerColors(bounds: Rectangle, colors: string[], firstColorIsFill: boolean) {
        const gc = this._renderingContext;
        for (let i = 0; i < colors.length; i++) {
            if (firstColorIsFill && i === 0) {
                gc.clearFillBounds(bounds, colors[i]);
            } else {
                gc.cache.fillStyle = colors[i];
                gc.fillBounds(bounds);
            }
        }
    }

}

export interface PaintFingerprintInterface {
    readonly value: string;
    readonly textColor: string;
    readonly textFont: string;
    readonly borderColor: string | undefined;
    readonly firstColorIsFill: boolean;
    readonly layerColors: string[];
}

export type PaintFingerprint = IndexSignatureHack<PaintFingerprintInterface>;
