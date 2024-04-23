
import { ViewCellImplementation } from '../../components/view/view-cell-implementation';
import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { ViewCell } from '../../interfaces/data/view-cell';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { UiController } from './ui-controller';

// Currently not used - kept in case this feature is re-instated in future

/** @internal */
export class FiltersUiController<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> extends UiController<BGS, BCS, SF> {

    readonly typeName = FiltersUiController.typeName;

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
        //         const handler = this[('handle' + navKey) as keyof FiltersUiController] as ((CellEvent: CellEvent) => void);
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

    handleLEFT(cellEvent: ViewCell<BCS, SF>) {
        this.moveLaterally(cellEvent, -1);
    }

    handleRIGHT(cellEvent: ViewCell<BCS, SF>) {
        this.moveLaterally(cellEvent, +1);
    }

    handleUP(cellEvent: ViewCell<BCS, SF>) {
        this.moveDown(cellEvent);
    }
    handleDOWN(cellEvent: ViewCell<BCS, SF>) {
        this.moveDown(cellEvent);
    }

    override handleDblClick(event: MouseEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (hoverCell !== undefined && hoverCell.viewCell.isFilter) {
            // this.grid.onEditorActivate(cell);
            return hoverCell;
        } else {
            return super.handleDblClick(event, hoverCell);
        }
    }

    override handleClick(event: MouseEvent, cell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (cell === null) {
            cell = this.tryGetHoverCellFromMouseEvent(event);
        }
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (cell !== undefined && cell.viewCell.isFilter) {
            // this.grid.onEditorActivate(cell);
            return cell;
        } else {
            return super.handleClick(event, cell);
        }
    }

    private moveLaterally(/*detail: Canvas.SyntheticEventDetail.Keyboard,*/ cellEvent: ViewCell<BCS, SF>, deltaX: number) {
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

    private moveDown(/*detail: Canvas.SyntheticEventDetail.Keyboard,*/ cellEvent: ViewCell<BCS, SF>) {
        // const cellEvent = detail.editor.event; // previously detail was passed in
        const gridX = cellEvent.viewLayoutColumn.index;

        // Select first visible grid cell of this column
        this.focusSelectBehavior.onlySelectViewCell(gridX, this.subgridsManager.calculatePreMainRowCount());
        this.canvas.takeFocus();
    }

}

/** @internal */
export namespace FiltersUiController {
    export const typeName = 'filters';
}
