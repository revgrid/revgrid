
import { Hypergrid } from '../grid/hypergrid';
import { Canvas } from '../lib/canvas';
import { CellEvent } from '../lib/cell-event';
import { Feature } from './feature';

/**
 * @constructor
 */
export class Filters extends Feature {

    readonly typeName = Filters.typeName;

    /**
     * Navigate away from the filter cell when:
     * 1. Coming from a cell editor (`event.detail.editor` defined).
     * 2. The cell editor was for a filter cell.
     * 3. The key (`event.detail.char) maps (through {@link module:defaults.navKeyMap|navKeyMap}) to one of:
     *    * `'UP'` or `'DOWN'` - Selects first visible data cell under filter cell.
     *    * `'LEFT'` - Opens filter cell editor in previous filterable column; if nonesuch, selects first visible data cell under filter cell.
     *    * `'RIGHT'` - Opens filter cell editor in next filterable column; if nonesuch, selects first visible data cell under filter cell.
     */
    override handleKeyDown(grid: Hypergrid, event: Canvas.KeyboardSyntheticEvent) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const detail = event.detail;
        const handled = false;

        // This is not correct. detail.editor does not exist
        if (/*detail.editor*/ false) {
            // const cellEvent = detail.editor.event;
            // if (cellEvent.isFilterCell) {
            //     const mappedNavKey = cellEvent.properties.mappedNavKey(detail.char);
            //     const handler: ((grid: Hypergrid, cellEvent: CellEvent) => void) = this['handle' + mappedNavKey];
            //     handler(grid, cellEvent);
            //     handled = true;
            // }
        }

        if (!handled) {
            if (this.next) {
                this.next.handleKeyDown(grid, event);
            }
        }
    }

    handleLEFT(grid: Hypergrid, cellEvent: CellEvent) {
        moveLaterally(grid, cellEvent, -1);
    }

    handleRIGHT(grid: Hypergrid, cellEvent: CellEvent) {
        moveLaterally(grid, cellEvent, +1);
    }

    handleUP = moveDown;
    handleDOWN = moveDown;

    override handleDoubleClick(grid: Hypergrid, event: CellEvent) {
        if (event.isFilterCell) {
            grid.onEditorActivate(event);
        } else if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    }

    override handleClick(grid: Hypergrid, event: CellEvent) {
        if (event.isFilterCell) {
            grid.onEditorActivate(event);
        } else if (this.next) {
            this.next.handleClick(grid, event);
        }
    }
}

function moveLaterally(grid: Hypergrid, /*detail: Canvas.SyntheticEventDetail.Keyboard,*/ cellEvent: CellEvent, deltaX: number) {
    // const cellEvent = detail.editor.event; // previously detail was passed in
    let gridX = cellEvent.visibleColumn.index;
    const gridY = cellEvent.visibleRow.index;
    const originX = gridX;
    const C = grid.renderer.visibleColumns.length;

    const moveDownCellEvent = new CellEvent(grid); // redefine so we don't reset the original below

    while (
        (gridX = (gridX + deltaX + C) % C) !== originX &&
        moveDownCellEvent.resetGridXY(gridX, gridY)
    ) {
        if (moveDownCellEvent.columnProperties.filterable) {
            // Select previous or next filterable column's filter cell
            grid.editAt(moveDownCellEvent);
            return;
        }
    }

    moveDown(grid, moveDownCellEvent);
}

function moveDown(grid: Hypergrid, /*detail: Canvas.SyntheticEventDetail.Keyboard,*/ cellEvent: CellEvent) {
    // const cellEvent = detail.editor.event; // previously detail was passed in
    const gridX = cellEvent.visibleColumn.index;

    // Select first visible grid cell of this column
    grid.selectViewportCell(gridX, 0);
    grid.takeFocus();
}

export namespace Filters {
    export const typeName = 'filters';
}
