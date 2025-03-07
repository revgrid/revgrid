
import { IndexSignatureHack } from '@pbkware/js-utils';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevClientGrid, RevColumnSettings, RevGridSettings, RevViewCell } from '../../client/internal-api';
import { RevDataServer, RevRectangle, RevSchemaField, revSafeConvertUnknownToBoolean } from '../../common/internal-api';
import { RevStandardCheckboxPainter } from '../painters/internal-api';
import { RevStandardCellPainter } from './standard-cell-painter';

/** @public */
export class RevStandardCheckboxCellPainter<
    BGS extends RevBehavioredGridSettings,
    BCS extends RevStandardCheckboxCellPainter.BehavioredColumnSettings,
    SF extends RevSchemaField
> extends RevStandardCellPainter<BGS, BCS, SF
> {
    private readonly _checkboxPainter: RevStandardCheckboxPainter;

    constructor(
        grid: RevClientGrid<BGS, BCS, SF>,
        dataServer: RevDataServer<SF>,
        private readonly _editable: boolean,
    ) {
        super(grid, dataServer);
        this._checkboxPainter = new RevStandardCheckboxPainter(
            this._editable,
            this._renderingContext,
        );
    }

    override paint(cell: RevViewCell<BCS, SF>, prefillColor: string | undefined): number | undefined {
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

        const newFingerprint: Partial<RevStandardCheckboxCellPainter.PaintFingerprint> = {
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
            booleanValue = revSafeConvertUnknownToBoolean(editValue);
        }

        // write rest of newFingerprint
        checkboxPainter.writeFingerprintOrCheckPaint(newFingerprint, bounds, booleanValue, boxDetails, columnSettings.color, columnSettings.font);

        let oldFingerprint: Partial<RevStandardCheckboxCellPainter.PaintFingerprint> | undefined;
        if (prefillColor === undefined) {
            oldFingerprint = cell.paintFingerprint as RevStandardCheckboxCellPainter.PaintFingerprint | undefined;
        } else {
            oldFingerprint = {
                backgroundColor: prefillColor,
                borderColor: undefined,
            };
            checkboxPainter.writeUndefinedFingerprint(oldFingerprint);
        }

        if (
            oldFingerprint !== undefined &&
            RevStandardCheckboxCellPainter.PaintFingerprint.same(
                newFingerprint as RevStandardCheckboxCellPainter.PaintFingerprint,
                oldFingerprint as RevStandardCheckboxCellPainter.PaintFingerprint
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

    calculateClickBox(cell: RevViewCell<BCS, SF>): RevRectangle | undefined {
        const columnSettings = cell.columnSettings;
        const bounds = cell.bounds;

        const field = cell.viewLayoutColumn.column.field;
        const subgridRowIndex = cell.viewLayoutRow.subgridRowIndex;

        const viewValue = this._dataServer.getViewValue(field, subgridRowIndex);
        const booleanValue = revSafeConvertUnknownToBoolean(viewValue);

        return this._checkboxPainter.calculateClickBox(bounds, booleanValue, columnSettings.cellPadding, columnSettings.font);
    }
}

/** @public */
export namespace RevStandardCheckboxCellPainter {
    export const typeName = 'Checkbox';

    export interface PaintFingerprintInterface extends RevStandardCheckboxPainter.PaintFingerprintInterface {
        readonly backgroundColor: RevGridSettings.Color;
        readonly borderColor: string | undefined;
    }

    export type PaintFingerprint = IndexSignatureHack<PaintFingerprintInterface>;

    export namespace PaintFingerprint {
        export function same(left: PaintFingerprint, right: PaintFingerprint) {
            return (
                left.backgroundColor === right.backgroundColor &&
                left.borderColor === right.borderColor &&
                RevStandardCheckboxPainter.PaintFingerprint.same(left, right)
            );
        }
    }

    export interface OnlyColumnSettings {
        cellPadding: number;
        font: string;
        cellFocusedBorderColor: RevGridSettings.Color | undefined;
    }

    export interface ColumnSettings extends OnlyColumnSettings, RevColumnSettings {
    }

    export interface BehavioredColumnSettings extends ColumnSettings, RevBehavioredColumnSettings {
        merge(settings: Partial<ColumnSettings>): boolean;
        clone(): BehavioredColumnSettings;
    }
}
