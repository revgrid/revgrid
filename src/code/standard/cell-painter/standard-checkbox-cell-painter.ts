
import { IndexSignatureHack } from '@xilytix/sysutils';
import { DataServer, DatalessViewCell, GridSettings, Rectangle, Revgrid, SchemaField, safeConvertUnknownToBoolean } from '../../grid/grid-public-api';
import { StandardCheckboxPainter } from '../painters/standard-painters-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardCellPainter } from './standard-cell-painter';

/** @public */
export class StandardCheckboxCellPainter<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SF extends SchemaField
> extends StandardCellPainter<BGS, BCS, SF
> {
    private readonly _checkboxPainter: StandardCheckboxPainter;

    constructor(
        grid: Revgrid<BGS, BCS, SF>,
        dataServer: DataServer<SF>,
        private readonly _editable: boolean,
    ) {
        super(grid, dataServer);
        this._checkboxPainter = new StandardCheckboxPainter(
            this._editable,
            this._renderingContext,
        );
    }

    override paint(cell: DatalessViewCell<BCS, SF>, prefillColor: string | undefined): number | undefined {
        const columnSettings = cell.columnSettings;
        const bounds = cell.bounds;
        const field = cell.viewLayoutColumn.column.field;

        const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;
        const viewLayoutColumn = cell.viewLayoutColumn;

        const backgroundColor = columnSettings.backgroundColor;

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

        const newFingerprint: Partial<StandardCheckboxCellPainter.PaintFingerprint> = {
            backgroundColor,
            borderColor,
        }

        const checkboxPainter = this._checkboxPainter;
        const boxDetails = checkboxPainter.calculateBoxDetails(bounds, columnSettings.cellPadding);
        let booleanValue: boolean | undefined | null;
        if (this._dataServer.getEditValue === undefined) {
            booleanValue = null;
        } else {
            const editValue = this._dataServer.getEditValue(field, subgridRowIndex);
            booleanValue = safeConvertUnknownToBoolean(editValue);
        }

        // write rest of newFingerprint
        checkboxPainter.writeFingerprintOrCheckPaint(newFingerprint, bounds, booleanValue, boxDetails, columnSettings.color, columnSettings.font);

        let oldFingerprint: Partial<StandardCheckboxCellPainter.PaintFingerprint> | undefined;
        if (prefillColor === undefined) {
            oldFingerprint = cell.paintFingerprint as StandardCheckboxCellPainter.PaintFingerprint | undefined;
        } else {
            oldFingerprint = {
                backgroundColor: prefillColor,
                borderColor: undefined,
            };
            checkboxPainter.writeUndefinedFingerprint(oldFingerprint);
        }

        if (
            oldFingerprint !== undefined &&
            StandardCheckboxCellPainter.PaintFingerprint.same(
                newFingerprint as StandardCheckboxCellPainter.PaintFingerprint,
                oldFingerprint as StandardCheckboxCellPainter.PaintFingerprint
            )
        ) {
            return undefined;
        } else {
            cell.paintFingerprint = newFingerprint;

            if (backgroundColor !== prefillColor) {
                this.paintBackground(bounds, backgroundColor);
            }

            if (borderColor !== undefined) {
                this.paintBorder(bounds, borderColor, false);
            }

            return this._checkboxPainter.writeFingerprintOrCheckPaint(undefined, bounds, booleanValue, boxDetails, columnSettings.color, columnSettings.font);
        }
    }

    calculateClickBox(cell: DatalessViewCell<BCS, SF>): Rectangle | undefined {
        const columnSettings = cell.columnSettings;
        const bounds = cell.bounds;

        const field = cell.viewLayoutColumn.column.field;
        const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;

        const viewValue = this._dataServer.getViewValue(field, subgridRowIndex);
        const booleanValue = safeConvertUnknownToBoolean(viewValue);

        return this._checkboxPainter.calculateClickBox(bounds, booleanValue, columnSettings.cellPadding, columnSettings.font);
    }
}

/** @public */
export namespace StandardCheckboxCellPainter {
    export const typeName = 'Checkbox';

    export interface PaintFingerprintInterface extends StandardCheckboxPainter.PaintFingerprintInterface {
        readonly backgroundColor: GridSettings.Color;
        readonly borderColor: string | undefined;
    }

    export type PaintFingerprint = IndexSignatureHack<PaintFingerprintInterface>;

    export namespace PaintFingerprint {
        export function same(left: PaintFingerprint, right: PaintFingerprint) {
            return (
                left.backgroundColor === right.backgroundColor &&
                left.borderColor === right.borderColor &&
                StandardCheckboxPainter.PaintFingerprint.same(left, right)
            );
        }
    }
}
