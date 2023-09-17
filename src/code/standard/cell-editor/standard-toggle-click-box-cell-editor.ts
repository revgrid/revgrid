import { BehavioredColumnSettings, BehavioredGridSettings, CellEditor, ClickBoxCellPainter, DatalessViewCell, Rectangle, SchemaField } from '../../grid/grid-public-api';
import { StandardPaintCellEditor } from './standard-paint-cell-editor';

/** @public */
export class StandardToggleClickBoxCellEditor<
    BGS extends BehavioredGridSettings,
    BCS extends BehavioredColumnSettings,
    SF extends SchemaField
> extends StandardPaintCellEditor<BGS, BCS, SF> {
    declare protected _painter: ClickBoxCellPainter<BCS, SF>;

    override tryOpenCell(cell: DatalessViewCell<BCS, SF>, openingKeyDownEvent: KeyboardEvent | undefined, openingClickEvent: MouseEvent | undefined) {
        const dataServer = this._dataServer;
        if (dataServer.getEditValue === undefined || this.readonly) {
            return false;
        } else {
            if (openingKeyDownEvent !== undefined) {
                // Trying to be opened by key down.  Allow open if key is consumed
                return this.processGridKeyDownEvent(openingKeyDownEvent, false, cell.viewLayoutColumn.column.field, cell.viewLayoutRow.subgridRowIndex);
            } else {
                if (openingClickEvent !== undefined) {
                    // Trying to be opened by click.  Allow open if click is consumed
                    return this.processGridClickEvent(openingClickEvent, cell);
                } else {
                    return true;
                }
            }
        }
    }

    override closeCell(_schemaColumn: SF, _subgridRowIndex: number, _cancel: boolean) {
        // nothing to do
    }

    override processGridKeyDownEvent(event: KeyboardEvent, _fromEditor: boolean, field: SF, subgridRowIndex: number) {
        const key = event.key;
        if (!this.isToggleKey(key)) {
            return false;
        } else {
            this.tryToggleBoolenValue(field, subgridRowIndex);
            return true;
        }
    }

    processGridClickEvent(event: MouseEvent, viewCell: DatalessViewCell<BCS, SF>) {
        const boxBounds = this._painter.calculateClickBox(viewCell);
        if (boxBounds === undefined) {
            return false;
        } else {
            if (!Rectangle.containsXY(boxBounds, event.offsetX, event.offsetY)) {
                return false;
            } else {
                const column = viewCell.viewLayoutColumn.column;
                this.tryToggleBoolenValue(column.field, viewCell.viewLayoutRow.subgridRowIndex);
                this._grid.renderer.animateImmediatelyIfRequired();
                return true;
            }
        }
    }

    processGridPointerMoveEvent(event: PointerEvent, viewCell: DatalessViewCell<BCS, SF>): CellEditor.PointerLocationInfo | undefined {
        const boxBounds = this._painter.calculateClickBox(viewCell);
        if (boxBounds === undefined) {
            return undefined;
        } else {
            if (!Rectangle.containsXY(boxBounds, event.offsetX, event.offsetY)) {
                return undefined;
            } else {
                return {
                    locationCursorName: viewCell.viewLayoutColumn.column.settings.editorClickableCursorName,
                    locationTitleText: undefined,
                };
            }
        }
    }
}
