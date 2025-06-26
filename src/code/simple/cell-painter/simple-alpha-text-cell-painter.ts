import { IndexSignatureHack, isArrayEqual } from '@pbkware/js-utils';
import { RevClientGrid, RevViewCell } from '../../client';
import { RevDataServer, RevRectangle, RevSchemaField } from '../../common';
import { RevStandardCellPainter, RevStandardTextPainter } from '../../standard';
import { RevSimpleBehavioredColumnSettings, RevSimpleBehavioredGridSettings } from '../settings';

/**
 * A cell renderer for a text cell.
 * @remarks Great care has been taken in crafting this function as it needs to perform extremely fast.
 *
 * Use `gc.cache` instead which we have implemented to cache the graphics context properties. Reads on the graphics context (`gc`) properties are expensive but not quite as expensive as writes. On read of a `gc.cache` prop, the actual `gc` prop is read into the cache once and from then on only the cache is referenced for that property. On write, the actual prop is only written to when the new value differs from the cached value.
 *
 * Clipping bounds are not set here as this is also an expensive operation. Instead, we employ a number of strategies to truncate overflowing text and content.
 * @public
 */
export class RevSimpleAlphaTextCellPainter<
    BGS extends RevSimpleBehavioredGridSettings,
    BCS extends RevSimpleBehavioredColumnSettings,
    SF extends RevSchemaField
> extends RevStandardCellPainter<BGS, BCS, SF> {
    private readonly _textPainter: RevStandardTextPainter;

    constructor(
        grid: RevClientGrid<BGS, BCS, SF>,
        dataServer: RevDataServer<SF>,
    ) {
        super(grid, dataServer);

        this._textPainter = new RevStandardTextPainter(this._renderingContext);
    }

    override paint(cell: RevViewCell<BCS, SF>, prefillColor: string | undefined): number | undefined {
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

        let textFont: string;
        if (isSelected && gridSettings.selectionFont !== undefined) {
            textFont = gridSettings.selectionFont;
        } else {
            textFont = columnSettings.font;
        }

        let textColor: string;
        if (isSelected && gridSettings.selectionForegroundColor !== undefined) {
            textColor = gridSettings.selectionForegroundColor;
        } else {
            textColor = gridSettings.color;
        }
        gc.cache.strokeStyle = textColor;

        const value = this._dataServer.getViewValue(cell.viewLayoutColumn.column.field, subgridRowIndex);
        const valText = value as string;

        const fingerprint = cell.paintFingerprint as RevSimpleAlphaTextCellPainter.RevPaintFingerprint | undefined;
        let same: boolean;
        if (fingerprint === undefined) {
            same = false;
        } else {
            same =
                valText === fingerprint.value &&
                textFont === fingerprint.textFont &&
                textColor === fingerprint.textColor;
        }

        const isMainSubgrid = subgrid.isMain;

        let hoverColor: string | undefined;
        const hoverCell = grid.mouse.hoverCell;
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

        // Since this painter supports colors with alpha, we need to layer colors so that they blend
        // fill background only if our bgColor is populated or we are a selected cell
        const layerColors: string[] = [];

        let firstColorIsFill = true;
        let hoverColorOpaque: boolean | undefined;
        if (hoverColor === undefined) {
            hoverColorOpaque = false;
        } else {
            hoverColorOpaque = gc.alpha(hoverColor) === 1;
            if (hoverColorOpaque) {
                layerColors.push(hoverColor);
            }
        }

        if (!hoverColorOpaque) {
            let selectColorOpaque: boolean;
            let selectColor: string | undefined;
            if (!isSelected) {
                selectColorOpaque = false;
            } else {
                selectColor = gridSettings.selectionBackgroundColor;
                if (selectColor === undefined) {
                    selectColorOpaque = false;
                } else {
                    selectColorOpaque = gc.alpha(hoverColor) === 1;
                    if (selectColorOpaque) {
                        layerColors.push(selectColor);
                        if (hoverColor !== undefined) {
                            layerColors.push(hoverColor);
                        }
                    }
                }
            }

            if (!selectColorOpaque) {
                if (prefillColor !== undefined) {
                    firstColorIsFill = false;
                } else {
                    layerColors.push(columnSettings.backgroundColor);
                }
                if (selectColor !== undefined) {
                    layerColors.push(selectColor);
                }
                if (hoverColor !== undefined) {
                    layerColors.push(hoverColor);
                }
            }
        }

        same &&= !firstColorIsFill && fingerprint !== undefined && isArrayEqual(layerColors, fingerprint.layerColors);

        let borderColor = columnSettings.cellFocusedBorderColor;
        if (borderColor !== undefined) {
            const cellFocused = isMainSubgrid && grid.focus.isMainSubgridGridPointFocused(activeColumnIndex, subgridRowIndex);
            if (!cellFocused) {
                borderColor = undefined;
            }
        }
        same &&= fingerprint !== undefined && fingerprint.borderColor === borderColor;

        // return a fingerprint to save in View cell for future comparisons by partial renderer
        const newFingerprint: RevSimpleAlphaTextCellPainter.RevPaintFingerprint = {
            value: valText,
            textColor,
            textFont,
            borderColor,
            firstColorIsFill,
            layerColors,
        };
        cell.paintFingerprint = newFingerprint; // supports partial render

        if (same) {
            return undefined;
        } else {
            const bounds = cell.bounds;
            const cellPadding = columnSettings.cellPadding;
            const columnHeaderHorizontalAlignId = columnSettings.columnHeaderHorizontalAlignId;
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            const horizontalAlignId = columnHeaderHorizontalAlignId === undefined ? columnSettings.horizontalAlignId : columnHeaderHorizontalAlignId;

            this.paintLayerColors(bounds, layerColors, firstColorIsFill);
            if (borderColor !== undefined) {
                this.paintBorder(bounds, borderColor, true);
            }
            // draw text
            gc.cache.fillStyle = textColor;
            gc.cache.font = textFont;
            return this._textPainter.renderSingleLineText(bounds, valText, cellPadding, cellPadding, horizontalAlignId);
        }
    }

    private paintLayerColors(bounds: RevRectangle, colors: string[], firstColorIsFill: boolean) {
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

/** @public */
export namespace RevSimpleAlphaTextCellPainter {
    export interface RevPaintFingerprintInterface {
        readonly value: string;
        readonly textColor: string;
        readonly textFont: string;
        readonly borderColor: string | undefined;
        readonly firstColorIsFill: boolean;
        readonly layerColors: string[];
    }

    export type RevPaintFingerprint = IndexSignatureHack<RevPaintFingerprintInterface>;
}
