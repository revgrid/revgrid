
import {
    IndexSignatureHack, SchemaServer
} from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardTextCellPainter } from './standard-text-cell-painter';

/**
 * @constructor
 * @summary A cell painter with features typically needed by header cells
 * @desc Great care has been taken in crafting this function as it needs to perform extremely fast.
 *
 * Use `gc.cache` instead which we have implemented to cache the graphics context properties. Reads on the graphics context (`gc`) properties are expensive but not quite as expensive as writes. On read of a `gc.cache` prop, the actual `gc` prop is read into the cache once and from then on only the cache is referenced for that property. On write, the actual prop is only written to when the new value differs from the cached value.
 *
 * Clipping bounds are not set here as this is also an expensive operation. Instead, we employ a number of strategies to truncate overflowing text and content.
 * @public
 */
export class StandardHeaderTextCellPainter<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SC extends SchemaServer.Column<BCS>
> extends StandardTextCellPainter<BGS, BCS, SC> {
    textWrapping = false;

    override paint(prefillColor: string | undefined): number | undefined {
        const grid = this._grid;
        const cell = this._cell;

        const columnSettings = this._columnSettings;

        const gc = this._renderingContext;
        const selection = grid.selection;
        const activeColumnIndex = cell.viewLayoutColumn.activeColumnIndex;
        const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;

        const value = this._dataServer.getValue(cell.viewLayoutColumn.column.schemaColumn, subgridRowIndex);
        const valText = value as string;

        const subgrid = cell.subgrid;
        const {
            rowSelected: isRowSelected,
            columnSelected: isColumnSelected,
            cellSelected: isCellSelected
        } = selection.getCellSelectedAreaTypes(activeColumnIndex, subgridRowIndex, subgrid);
        const isSelected = isCellSelected || isRowSelected || isColumnSelected;

        const textFont = isColumnSelected ? columnSettings.columnHeaderSelectionFont : columnSettings.columnHeaderFont;

        const textColor = gc.cache.strokeStyle = isSelected
            ? columnSettings.columnHeaderSelectionForegroundColor
            : columnSettings.columnHeaderForegroundColor;

        const backgroundColor = columnSettings.backgroundColor;

        const fingerprint = cell.paintFingerprint as PaintFingerprint | undefined;

        // return a fingerprint to save in View cell for future comparisons by partial renderer
        const newFingerprint: PaintFingerprint = {
            value: valText,
            backgroundColor,
            textColor,
            textFont,
        };
        cell.paintFingerprint = newFingerprint; // supports partial render

        if (fingerprint !== undefined && PaintFingerprint.same(newFingerprint, fingerprint)) {
            return undefined;
        } else {
            const bounds = cell.bounds;
            const leftPadding = columnSettings.cellPadding;
            const rightPadding = columnSettings.cellPadding;

            // background
            gc.cache.fillStyle = backgroundColor;
            gc.fillBounds(bounds);

            // draw text
            gc.cache.fillStyle = textColor;
            gc.cache.font = textFont;
            return this.textWrapping
                ? this.renderMultiLineText(bounds, valText, leftPadding, rightPadding)
                : this.renderSingleLineText(bounds, valText, leftPadding, rightPadding);
        }
    }
}

/* [SIZE NOTE] (11/1/2018): Always call `drawImage` with explicit width and height overload.
 * Possible browser bug: Although 3rd and 4th parameters to `drawImage` are optional,
 * when image data derived from SVG source, some browsers (e.g., Chrome 70) implementation
 * of `drawImage` only respects _implicit_ `width` x `height` specified in the root <svg>
 * element `width` & `height` attributes. Otherwise, image is copied into canvas using its
 * `naturalWidth` x `naturalHeight`. That is, _explict_ settings of `width` & `height`
 * (i.e, via property assignment, calling setAttribute, or in `new Image` call) have no
 * effect on `drawImage` in the case of SVGs on these browsers.
 */

export interface PaintFingerprintInterface {
    readonly value: string;
    readonly backgroundColor: string;
    readonly textColor: string;
    readonly textFont: string;
}

export type PaintFingerprint = IndexSignatureHack<PaintFingerprintInterface>;
export namespace PaintFingerprint {
    export function same(left: PaintFingerprint, right: PaintFingerprint) {
        return (
            left.value === right.value &&
            left.backgroundColor === right.backgroundColor &&
            left.textColor === right.textColor &&
            left.textFont === right.textFont
        );
    }
}

