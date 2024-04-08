
import { IndexSignatureHack } from '@xilytix/sysutils';
import {
    DataServer,
    DatalessViewCell,
    Revgrid,
    SchemaField
} from '../../grid/grid-public-api';
import { StandardTextPainter } from '../painters/standard-painters-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardCellPainter } from './standard-cell-painter';

/**
 * A cell painter with features typically needed by header cells
 * @remarks Great care has been taken in crafting this function as it needs to perform extremely fast.
 *
 * Use `gc.cache` instead which we have implemented to cache the graphics context properties. Reads on the graphics context (`gc`) properties are expensive but not quite as expensive as writes. On read of a `gc.cache` prop, the actual `gc` prop is read into the cache once and from then on only the cache is referenced for that property. On write, the actual prop is only written to when the new value differs from the cached value.
 *
 * Clipping bounds are not set here as this is also an expensive operation. Instead, we employ a number of strategies to truncate overflowing text and content.
 * @public
 */
export class StandardHeaderTextCellPainter<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SF extends SchemaField
> extends StandardCellPainter<BGS, BCS, SF> {
    private readonly _textPainter: StandardTextPainter;

    constructor(
        grid: Revgrid<BGS, BCS, SF>,
        dataServer: DataServer<SF>,
    ) {
        super(grid, dataServer);

        this._textPainter = new StandardTextPainter(this._renderingContext);
    }


    override paint(cell: DatalessViewCell<BCS, SF>, _prefillColor: string | undefined): number | undefined {
        const grid = this._grid;

        const columnSettings = cell.columnSettings;
        this._textPainter.setColumnSettings(columnSettings);

        const gc = this._renderingContext;
        const selection = grid.selection;
        const activeColumnIndex = cell.viewLayoutColumn.activeColumnIndex;
        const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;

        const value = this._dataServer.getViewValue(cell.viewLayoutColumn.column.field, subgridRowIndex);
        const valText = value as string;

        const subgrid = cell.subgrid;
        const cellAllSelectionAreaTypeIds = selection.getAllCellSelectionAreaTypeIds(activeColumnIndex, subgridRowIndex, subgrid);
        const isSelected = cellAllSelectionAreaTypeIds.length > 0;

        let textFont: string;
        if (isSelected && columnSettings.columnHeaderSelectionFont !== undefined) {
            textFont = columnSettings.columnHeaderSelectionFont;
        } else {
            const columnHeaderFont = columnSettings.columnHeaderFont;
            if (columnHeaderFont !== undefined) {
                textFont = columnHeaderFont;
            } else {
                textFont = columnSettings.font;
            }
        }

        let textColor: string;
        if (isSelected && columnSettings.columnHeaderSelectionForegroundColor !== undefined) {
            textColor = columnSettings.columnHeaderSelectionForegroundColor;
        } else {
            const columnHeaderForegroundColor = columnSettings.columnHeaderForegroundColor;
            if (columnHeaderForegroundColor !== undefined) {
                textColor = columnHeaderForegroundColor;
            } else {
                textColor = columnSettings.color;
            }
        }

        gc.cache.strokeStyle = textColor;

        const columnHeaderBackgroundColor = columnSettings.columnHeaderBackgroundColor;
        const backgroundColor = columnHeaderBackgroundColor === undefined ? columnSettings.backgroundColor : columnHeaderBackgroundColor;

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
            const cellPadding = columnSettings.cellPadding;
            const columnHeaderHorizontalAlign = columnSettings.columnHeaderHorizontalAlign;
            const horizontalAlign = columnHeaderHorizontalAlign === undefined ? columnSettings.horizontalAlign : columnHeaderHorizontalAlign;

            // background
            gc.cache.fillStyle = backgroundColor;
            gc.fillBounds(bounds);

            // draw text
            gc.cache.fillStyle = textColor;
            gc.cache.font = textFont;
            return this._textPainter.renderSingleLineText(bounds, valText, cellPadding, cellPadding, horizontalAlign);
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

