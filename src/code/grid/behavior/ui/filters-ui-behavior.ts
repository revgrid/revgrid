
import { ViewCellImplementation } from '../../components/view/view-cell-implementation';
import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { ViewCell } from '../../interfaces/data/view-cell';
import { SchemaServer } from '../../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class FiltersUiBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> extends UiBehavior<BGS, BCS, SC> {

    readonly typeName = FiltersUiBehavior.typeName;

    /**
     * Navigate away from the filter cell when:
     * 1. Coming from a cell editor (`event.detail.editor` defined).
     * 2. The cell editor was for a filter cell.
     * 3. The key (`event.detail.char) maps (through {@link module:defaults.navKeyMap|navKeyMap}) to one of:
     *    * `'UP'` or `'DOWN'` - Selects first visible data cell under filter cell.
     *    * `'LEFT'` - Opens filter cell editor in previous filterable column; if nonesuch, selects first visible data cell under filter cell.
     *    * `'RIGHT'` - Opens filter cell editor in next filterable column; if nonesuch, selects first visible data cell under filter cell.
     */
    override handleKeyDown(event: KeyboardEvent, fromEditor: boolean) {
        const handled = false;

        // if (eventDetail.editor !== undefined) {
        //     const cellEvent = eventDetail.editor.viewCell;
        //     if (cellEvent.isFilterCell) {
        //         const navKey = this.grid.generateNavKey(eventDetail.primitiveEvent);
        //         const handler = this[('handle' + navKey) as keyof FiltersUiBehavior] as ((CellEvent: CellEvent) => void);
        //         if (handler !== undefined) {
        //             handler.call(this, cellEvent);
        //             handled = true;
        //         }
        //     }
        // }

        if (!handled) {
            if (this.next) {
                this.next.handleKeyDown(event, fromEditor);
            }
        }
    }

    handleLEFT(cellEvent: ViewCell<BCS, SC>) {
        this.moveLaterally(cellEvent, -1);
    }

    handleRIGHT(cellEvent: ViewCell<BCS, SC>) {
        this.moveLaterally(cellEvent, +1);
    }

    handleUP = this.moveDown;
    handleDOWN = this.moveDown;

    override handleDblClick(event: MouseEvent, hoverCell: LinedHoverCell<BCS, SC> | null | undefined) {
        if (hoverCell === undefined) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (hoverCell !== null && hoverCell.viewCell.isFilter) {
            // this.grid.onEditorActivate(cell);
            return hoverCell;
        } else {
            return super.handleDblClick(event, hoverCell);
        }
    }

    override handleClick(event: MouseEvent, cell: LinedHoverCell<BCS, SC> | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (cell !== null && cell.viewCell.isFilter) {
            // this.grid.onEditorActivate(cell);
            return cell;
        } else {
            return super.handleClick(event, cell);
        }
    }

    private moveLaterally(/*detail: Canvas.SyntheticEventDetail.Keyboard,*/ cellEvent: ViewCell<BCS, SC>, deltaX: number) {
        // const cellEvent = detail.editor.event; // previously detail was passed in
        let gridX = cellEvent.viewLayoutColumn.index;
        const gridY = cellEvent.viewLayoutRow.index;
        const originX = gridX;
        const C = this.viewLayout.columns.length;

        const moveDownCellEvent = new ViewCellImplementation(this.columnsManager); // redefine so we don't reset the original below

        while (
            (gridX = (gridX + deltaX + C) % C) !== originX &&
            moveDownCellEvent.resetGridXY(this.viewLayout.columns[gridX], this.viewLayout.getVisibleRow(gridY))
        ) {
            if (moveDownCellEvent.columnSettings.filterable) {
                // Select previous or next filterable column's filter cell
                // grid.editAt(moveDownCellEvent);
                return;
            }
        }

        this.moveDown(moveDownCellEvent);
    }

    private moveDown(/*detail: Canvas.SyntheticEventDetail.Keyboard,*/ cellEvent: ViewCell<BCS, SC>) {
        // const cellEvent = detail.editor.event; // previously detail was passed in
        const gridX = cellEvent.viewLayoutColumn.index;

        // Select first visible grid cell of this column
        this.focusSelectBehavior.selectOnlyViewCell(gridX, this.subgridsManager.calculatePreMainRowCount(), this.gridSettings.primarySelectionAreaType);
        this.canvasManager.takeFocus();
    }

}

/** @internal */
export namespace FiltersUiBehavior {
    export const typeName = 'filters';
}
