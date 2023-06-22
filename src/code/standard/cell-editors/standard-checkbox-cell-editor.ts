import { CellEditor, DataServer, DatalessViewCell, Rectangle, Revgrid, SchemaField } from '../../grid/grid-public-api';
import { StandardCheckboxCellPainter } from '../cell-painters/standard-cell-painters-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardPaintCellEditor } from './standard-paint-cell-editor';

/** @public */
export class StandardCheckboxCellEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SF extends SchemaField
> extends StandardPaintCellEditor<BGS, BCS, SF> {
    declare _painter: StandardCheckboxCellPainter<BGS, BCS, SF>;

    constructor(grid: Revgrid<BGS, BCS, SF>, dataServer: DataServer<SF>) {
        const painter = new StandardCheckboxCellPainter(grid, dataServer, true);
        super(grid, dataServer, painter);
    }

    override tryOpen(cell: DatalessViewCell<BCS, SF>, openingKeyDownEvent: KeyboardEvent | undefined, openingClickEvent: MouseEvent | undefined) {
        const dataServer = this._dataServer;
        if (dataServer.getEditValue === undefined) {
            return false;
        } else {
            if (openingKeyDownEvent !== undefined) {
                // Trying to be opened by key down.  Allow open if key is consumed
                return this.processKeyDownEvent(openingKeyDownEvent, false, cell.viewLayoutColumn.column.field, cell.viewLayoutRow.subgridRowIndex);
            } else {
                if (openingClickEvent !== undefined) {
                    // Trying to be opened by click.  Allow open if click is consumed
                    return this.processClickEvent(openingClickEvent, cell);
                } else {
                    return true;
                }
            }
        }
    }

    override close(_schemaColumn: SF, _subgridRowIndex: number, _cancel: boolean) {
        // nothing to do
    }

    override processKeyDownEvent(event: KeyboardEvent, _fromEditor: boolean, field: SF, subgridRowIndex: number) {
        const key = event.key;
        if (!this.isToggleKey(key)) {
            return false;
        } else {
            this.tryToggleBoolenValue(field, subgridRowIndex);
            return true;
        }
    }

    processClickEvent(event: MouseEvent, viewCell: DatalessViewCell<BCS, SF>) {
        const boxBounds = this._painter.calculateClickBox(viewCell);
        if (boxBounds === undefined) {
            return false;
        } else {
            if (!Rectangle.containsXY(boxBounds, event.offsetX, event.offsetY)) {
                return false;
            } else {
                const column = viewCell.viewLayoutColumn.column;
                this.tryToggleBoolenValue(column.field, viewCell.viewLayoutRow.subgridRowIndex);
                return true;
            }
        }
    }

    processPointerMoveEvent(event: PointerEvent, viewCell: DatalessViewCell<BCS, SF>): CellEditor.PointerLocationInfo | undefined {
        const boxBounds = this._painter.calculateClickBox(viewCell);
        if (boxBounds === undefined) {
            return undefined;
        } else {
            if (!Rectangle.containsXY(boxBounds, event.offsetX, event.offsetY)) {
                return undefined;
            } else {
                return {
                    locationCursorName: viewCell.viewLayoutColumn.column.settings.editorClickCursorName,
                    locationTitleText: undefined,
                };
            }
        }
    }
}
