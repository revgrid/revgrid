
import { ViewCell } from '../../components/cell/view-cell';
import { EventDetail } from '../../components/event/event-detail';
import { SelectionArea } from '../../lib/selection-area';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class FiltersUiBehavior extends UiBehavior {

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
    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
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
                this.next.handleKeyDown(eventDetail);
            }
        }
    }

    handleLEFT(cellEvent: ViewCell) {
        this.moveLaterally(cellEvent, -1);
    }

    handleRIGHT(cellEvent: ViewCell) {
        this.moveLaterally(cellEvent, +1);
    }

    handleUP = this.moveDown;
    handleDOWN = this.moveDown;

    override handleDblClick(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewCellFromMouseEvent(event);
        }
        if (cell !== null && cell.isFilterCell) {
            // this.grid.onEditorActivate(cell);
            return cell;
        } else {
            return super.handleDblClick(event, cell);
        }
    }

    override handleClick(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewCellFromMouseEvent(event);
        }
        if (cell !== null && cell.isFilterCell) {
            // this.grid.onEditorActivate(cell);
            return cell;
        } else {
            return super.handleClick(event, cell);
        }
    }

    private moveLaterally(/*detail: Canvas.SyntheticEventDetail.Keyboard,*/ cellEvent: ViewCell, deltaX: number) {
        // const cellEvent = detail.editor.event; // previously detail was passed in
        let gridX = cellEvent.visibleColumn.index;
        const gridY = cellEvent.visibleRow.index;
        const originX = gridX;
        const C = this.viewLayout.columns.length;

        const moveDownCellEvent = new ViewCell(this.columnsManager); // redefine so we don't reset the original below

        while (
            (gridX = (gridX + deltaX + C) % C) !== originX &&
            moveDownCellEvent.resetGridXY(this.viewLayout.columns[gridX], this.viewLayout.getVisibleRow(gridY))
        ) {
            if (moveDownCellEvent.columnProperties.filterable) {
                // Select previous or next filterable column's filter cell
                // grid.editAt(moveDownCellEvent);
                return;
            }
        }

        this.moveDown(moveDownCellEvent);
    }

    private moveDown(/*detail: Canvas.SyntheticEventDetail.Keyboard,*/ cellEvent: ViewCell) {
        // const cellEvent = detail.editor.event; // previously detail was passed in
        const gridX = cellEvent.visibleColumn.index;

        // Select first visible grid cell of this column
        this.selectionBehavior.selectOnlyViewCell(gridX, this.subgridsManager.calculateHeaderRowCount(), SelectionArea.TypeSpecifier.Primary);
        this.canvasEx.takeFocus();
    }

}

/** @internal */
export namespace FiltersUiBehavior {
    export const typeName = 'filters';
}
