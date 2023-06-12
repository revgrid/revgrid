import { CellEditor, DataServer, DatalessViewCell, Rectangle, Revgrid, SchemaServer } from '../../grid/grid-public-api';
import { StandardCheckboxCellPainter } from '../cell-painters/standard-cell-painters-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardPaintCellEditor } from './standard-paint-cell-editor';

/** @public */
export class StandardCheckboxCellEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SC extends SchemaServer.Column<BCS>
> extends StandardPaintCellEditor<BGS, BCS, SC> {
    declare _painter: StandardCheckboxCellPainter<BGS, BCS, SC>;

    constructor(grid: Revgrid<BGS, BCS, SC>, dataServer: DataServer<BCS>) {
        const painter = new StandardCheckboxCellPainter(grid, dataServer, true);
        super(grid, dataServer, painter);
    }

    override tryOpen(cell: DatalessViewCell<BCS, SC>, openingKeyDownEvent: KeyboardEvent | undefined, openingClickEvent: MouseEvent | undefined) {
        const dataServer = this._dataServer;
        if (dataServer.getEditValue === undefined) {
            return false;
        } else {
            if (openingKeyDownEvent !== undefined) {
                // Trying to be opened by key down.  Allow open if key is consumed
                return this.processKeyDownEvent(openingKeyDownEvent, false, cell.viewLayoutColumn.column.schemaColumn, cell.viewLayoutRow.subgridRowIndex);
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

    override close(_schemaColumn: SC, _subgridRowIndex: number, _cancel: boolean) {
        // nothing to do
    }

    override processKeyDownEvent(event: KeyboardEvent, _fromEditor: boolean, schemaColumn: SC, subgridRowIndex: number) {
        const key = event.key;
        if (!this.isToggleKey(key)) {
            return false;
        } else {
            this.tryToggleBoolenValue(schemaColumn, subgridRowIndex);
            return true;
        }
    }

    processClickEvent(event: MouseEvent, viewCell: DatalessViewCell<BCS, SC>) {
        const boxBounds = this._painter.boxBounds;
        if (boxBounds === undefined) {
            return false;
        } else {
            if (!Rectangle.containsXY(boxBounds, event.offsetX, event.offsetY)) {
                return false;
            } else {
                const column = viewCell.viewLayoutColumn.column;
                this.tryToggleBoolenValue(column.schemaColumn, viewCell.viewLayoutRow.subgridRowIndex);
                return true;
            }
        }
    }

    processPointerMoveEvent(event: PointerEvent, viewCell: DatalessViewCell<BCS, SC>): CellEditor.PointerLocationInfo | undefined {
        const boxBounds = this._painter.boxBounds;
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
