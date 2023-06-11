import { CellPainter, DataServer, DatalessViewCell, Rectangle, Revgrid, SchemaServer } from '../../grid/grid-public-api';
import { StandardCheckboxCellPainter } from '../cell-painters/standard-cell-painters-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardPaintCellEditor } from './standard-paint-cell-editor';

export class StandardCheckboxCellEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SC extends SchemaServer.Column<BCS>
> extends StandardPaintCellEditor<BGS, BCS, SC> implements CellPainter<BCS, SC> {
    declare _painter: StandardCheckboxCellPainter<BGS, BCS, SC>;

    constructor(grid: Revgrid<BGS, BCS, SC>, dataServer: DataServer<BCS>) {
        const painter = new StandardCheckboxCellPainter(grid, dataServer, true);
        super(grid, dataServer, painter);
    }

    override tryOpen(cell: DatalessViewCell<BCS, SC>, keyDownEvent: KeyboardEvent | undefined, clickEvent: MouseEvent | undefined) {
        const dataServer = this._dataServer;
        if (dataServer.getEditValue === undefined) {
            return false;
        } else {
            if (keyDownEvent !== undefined) {
                // was opened by key down
                const keyConsumed = this.checkConsumeKeyDownEvent(keyDownEvent, false, cell.viewLayoutColumn.column.schemaColumn, cell.viewLayoutRow.subgridRowIndex);
                if (!keyConsumed) {
                    return false;
                }
            } else {
                if (clickEvent !== undefined) {
                    // was opened by mouse click

                }
            }
        }
    }

    override checkConsumeKeyDownEvent(event: KeyboardEvent, _fromEditor: boolean, schemaColumn: SC, subgridRowIndex: number) {
        const key = event.key;
        if (!this.isToggleKey(key)) {
            return false;
        } else {
            this.tryToggleBoolenValue(schemaColumn, subgridRowIndex);
            return true;
        }
    }

    checkConsumeClickEvent(event: MouseEvent, viewCell: DatalessViewCell<BCS, SC>) {
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
}
