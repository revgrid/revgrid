import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevCellEditor, RevClickBoxCellPainter, RevDatalessViewCell, RevRectangle, RevSchemaField } from '../../client/internal-api';
import { RevStandardPaintCellEditor } from './standard-paint-cell-editor';

/** @public */
export class RevStandardToggleClickBoxCellEditor<
    BGS extends RevBehavioredGridSettings,
    BCS extends RevBehavioredColumnSettings,
    SF extends RevSchemaField
> extends RevStandardPaintCellEditor<BGS, BCS, SF> {
    declare protected _painter: RevClickBoxCellPainter<BCS, SF>;

    override tryOpenCell(cell: RevDatalessViewCell<BCS, SF>, openingKeyDownEvent: KeyboardEvent | undefined, openingClickEvent: MouseEvent | undefined) {
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

    processGridClickEvent(event: MouseEvent, viewCell: RevDatalessViewCell<BCS, SF>) {
        const boxBounds = this._painter.calculateClickBox(viewCell);
        if (boxBounds === undefined) {
            return false;
        } else {
            if (!RevRectangle.containsXY(boxBounds, event.offsetX, event.offsetY)) {
                return false;
            } else {
                const column = viewCell.viewLayoutColumn.column;
                this.tryToggleBoolenValue(column.field, viewCell.viewLayoutRow.subgridRowIndex);
                this._grid.renderer.animateImmediatelyIfRequired();
                return true;
            }
        }
    }

    processGridPointerMoveEvent(event: PointerEvent, viewCell: RevDatalessViewCell<BCS, SF>): RevCellEditor.PointerLocationInfo | undefined {
        const boxBounds = this._painter.calculateClickBox(viewCell);
        if (boxBounds === undefined) {
            return undefined;
        } else {
            if (!RevRectangle.containsXY(boxBounds, event.offsetX, event.offsetY)) {
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
