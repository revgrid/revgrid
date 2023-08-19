
import {
    DataServer,
    DatalessViewCell,
    IndexSignatureHack,
    Rectangle,
    Revgrid,
    SchemaField
} from '../../grid/grid-public-api';
import { StandardTextPainter } from '../painters/standard-painters-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardCellPainter } from './standard-cell-painter';

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
export class StandardAlphaTextCellPainter<
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

    override paint(cell: DatalessViewCell<BCS, SF>, prefillColor: string | undefined): number | undefined {
        const grid = this._grid;

        const gridSettings = this._gridSettings;
        const columnSettings = cell.columnSettings;
        this._textPainter.setColumnSettings(columnSettings);

        const gc = this._renderingContext;
        const selection = grid.selection;
        const activeColumnIndex = cell.viewLayoutColumn.activeColumnIndex;
        const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;

        // setting gc properties are expensive, let's not do it needlessly

        // Note: vf == 0 is fastest equivalent of vf === 0 || vf === false which excludes NaN, null, undefined


        const subgrid = cell.subgrid;
        const isSelected = selection.isCellSelected(activeColumnIndex, subgridRowIndex, subgrid);

        const textFont = isSelected ? gridSettings.selectionFont : columnSettings.font;

        const textColor = gc.cache.strokeStyle = isSelected
            ? gridSettings.selectionForegroundColor
            : columnSettings.color;

        const value = this._dataServer.getViewValue(cell.viewLayoutColumn.column.field, subgridRowIndex);
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

        if (cellHovered && columnSettings.columnHoverBackgroundColor !== undefined) {
            hoverColor = gridSettings.cellHoverBackgroundColor;
        } else {
            const rowHoverBackgroundColor = gridSettings.rowHoverBackgroundColor;
            if (rowHovered && rowHoverBackgroundColor !== undefined) {
                hoverColor = rowHoverBackgroundColor;
            } else {
                const columnHoverBackgroundColor = columnSettings.columnHoverBackgroundColor;
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
                selectColor = gridSettings.selectionBackgroundColor;
            }

            if (gc.alpha(selectColor) < 1) {
                const inheritsBackgroundColor = (columnSettings.backgroundColor === prefillColor);
                if (!inheritsBackgroundColor) {
                    firstColorIsFill = true;
                    layerColors.push(columnSettings.backgroundColor);
                    same = same &&
                        fingerprint !== undefined &&
                        firstColorIsFill === fingerprint.firstColorIsFill && columnSettings.backgroundColor === fingerprint.layerColors[layerColorIndex++];
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

        let borderColor = columnSettings.cellFocusedBorderColor;
        if (borderColor !== undefined) {
            const cellFocused = isMainSubgrid && grid.focus.isMainSubgridGridPointFocused(activeColumnIndex, subgridRowIndex);
            if (!cellFocused) {
                borderColor = undefined;
            }
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
            const cellPadding = columnSettings.cellPadding;
            const horizontalAlign = columnSettings.columnHeaderHorizontalAlign;

            this.paintLayerColors(bounds, layerColors, firstColorIsFill);
            if (borderColor !== undefined) {
                this.tryPaintBorder(bounds, borderColor, true);
            }
            // draw text
            gc.cache.fillStyle = textColor;
            gc.cache.font = textFont;
            return this._textPainter.renderSingleLineText(bounds, valText, cellPadding, cellPadding, horizontalAlign);
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
