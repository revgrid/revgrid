import { ColumnsManager } from '../column/columns-manager';
import { SubgridInterface } from '../common/subgrid-interface';
import { Focus } from '../focus';
import { GridProperties } from '../grid-properties';
import { AssertError, UnreachableCaseError } from '../lib/revgrid-error';
import { SelectionArea } from '../lib/selection-area';
import { Renderer } from '../renderer/renderer';
import { Selection } from '../selection/selection';
import { Subgrid } from '../subgrid/subgrid';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { Mouse } from '../user-interface-input/mouse';

export class FocusSelectionBehavior {
    private readonly _focusSubgridChangedListener: Focus.SubgridChangeEventHandler;

    constructor(
        private readonly _selection: Selection,
        private readonly _focus: Focus,
        private readonly _gridProperties: GridProperties,
        private readonly _columnsManager: ColumnsManager,
        private readonly _subgridsManager: SubgridsManager,
        private readonly _renderer: Renderer,
        private readonly _mouse: Mouse,
        private readonly _repaintEventer: SelectionBehavior.RepaintEventer,
        private readonly _selectionChangedEventer: SelectionBehavior.SelectionChangedEventer,
        private readonly _scrollToMakeVisibleEventer: SelectionBehavior.ScrollToMakeVisibleEventer,
    ) {
        this._focusSubgridChangedListener = () => this._selection.clear();
        this._focus.subscribeSubgridChangedEvent(this._focusSubgridChangedListener);
        this._selection.changedEventer = () => this._selectionChangedEventer();
    }

    destroy() {
        this._focus.unsubscribeSubgridChangedEvent(this._focusSubgridChangedListener);
    }

    /** Call before multiple selection changes to consolidate SelectionChange events.
     * Pair with endSelectionChange().
     */
    beginChange() {
        this._selection.beginChange();
    }

    /** Call after multiple selection changes to consolidate SelectionChange events.
     * Pair with beginSelectionChange().
     */
    endChange() {
        this._selection.endChange();
    }

    isCellSelectedInAnyAreaType(x: number, y: number, subgrid: SubgridInterface): boolean {
        return this._selection.isCellSelectedInAnyAreaType(x, y, subgrid);
    }

    /**
     * @desc Clear all the selections.
     */
    clearSelection() {
        this._selection.clear();
        this._mouse.clearMouseDown();
    }

    focusSelectColumns(start: number, stop: number, focusRowIndex: number | undefined, subgrid: SubgridInterface | undefined) {
        this.beginChange();
        try {
            let rowIndex: number;
            if (focusRowIndex === undefined) {
                this._focus.setXCoordinate(start);
                rowIndex = this._focus.x ?? 0;
            } else {
                if (subgrid === undefined) {
                    subgrid = this._focus.subgrid;
                }
                this._focus.setXYCoordinatesAndSubgrid(start, focusRowIndex, subgrid);
                rowIndex = focusRowIndex;
            }

            this._selection.selectColumns(start, rowIndex, stop - start + 1, 1);
        } finally {
            this.endChange();
        }
    }

    focusSelectRows(start: number, stop: number, subgrid: SubgridInterface | undefined, focusColumnIndex: number | undefined) {
        if (subgrid === undefined) {
            subgrid = this._focus.subgrid;
        }

        this.beginChange();
        try {
            let columnIndex: number;
            if (focusColumnIndex === undefined) {
                this._focus.setYCoordinateAndSubgrid(start, subgrid);
                columnIndex = this._focus.x ?? 0;
            } else {
                this._focus.setXYCoordinatesAndSubgrid(focusColumnIndex, start, subgrid);
                columnIndex = focusColumnIndex;
            }

            this._selection.selectRows(columnIndex, start, 1, stop - start + 1);
        } finally {
            this.endChange();
        }
    }

    selectAllRows() {
        this._selection.selectAllRows();
    }

    selectRectangle(ox: number, oy: number, ex: number, ey: number, subgrid: Subgrid | undefined) {
        this._selection.selectRectangle(ox, oy, ex, ey, subgrid);
    }

    focusSelectOnlyCell(originX: number, originY: number, subgrid: SubgridInterface, areaTypeSpecifier: SelectionArea.TypeSpecifier) {
        const selection = this._selection;

        this.beginChange();
        try {
            selection.clear();
            this._focus.setXYCoordinatesAndSubgrid(originX, originY, subgrid);
            selection.selectCell(originX, originY, subgrid, areaTypeSpecifier);
        } finally {
            this.endChange();
        }

        this._scrollToMakeVisibleEventer(originX, originY, subgrid);

        this._repaintEventer();
    }

    focusSelectOnlyViewportCell(x: number, y: number, areaTypeSpecifier: SelectionArea.TypeSpecifier) {
        const visibleColumns = this._renderer.visibleColumns;
        if (x < visibleColumns.length) {
            const vc = this._renderer.visibleColumns[x]
            const visibleRows = this._renderer.visibleRows;
            if (y < visibleRows.length) {
                const vr = this._renderer.visibleRows[y];
                x = vc.activeColumnIndex;
                y = vr.rowIndex;
                const subgrid = vr.subgrid;
                this.focusSelectOnlyCell(x, y, subgrid, areaTypeSpecifier);
            }
        }
    }

    replaceLastAreaFromFocus(extentX: number, extentY: number, areaTypeSpecifier: SelectionArea.TypeSpecifier) {

    }

    focusSelectAddCell(originX: number, originY: number, subgrid: SubgridInterface, areaTypeSpecifier: SelectionArea.TypeSpecifier) {

    }

    focusToggleSelectCell(originX: number, originY: number, subgrid: SubgridInterface, areaTypeSpecifier: SelectionArea.TypeSpecifier) {
        const cellCoveringSelectionAreas = this.getSelectionAreasCoveringCell(originX, originY, subgrid);
        const priorityCoveringArea = this.getPriorityCellCoveringSelectionArea(cellCoveringSelectionAreas);
        if (priorityCoveringArea === undefined) {
            this.focusSelectAddCell(originX, originY, subgrid, areaTypeSpecifier)
        } else {
            this.beginChange();
            try {
                this._focus.setXYCoordinatesAndSubgrid(originX, originY, subgrid);
                const priorityCoveringAreaType = priorityCoveringArea.areaType;
                switch (priorityCoveringAreaType) {
                    case SelectionArea.Type.Rectangle: {
                        this._selection.deselectRectangleArea(priorityCoveringArea);
                        break;
                    }
                    case SelectionArea.Type.Column: {
                        this._selection.deselectColumns(originX, originX);
                        break;
                    }
                    case SelectionArea.Type.Row: {
                        this._selection.deselectRows(originY, 1);
                        break;
                    }
                }
            } finally {
                this.endChange();
            }
        }
    }

    deselectSingleCellArea() {

    }


    moveCellFocus(offsetX: number, offsetY: number, areaTypeSpecifier: SelectionArea.TypeSpecifier) {
        const focusPoint = this._focus.point;
        if (focusPoint === undefined) {
            throw new AssertError('SBMCF41087');
        } else {
            const focusX = focusPoint.x;
            const focusY = focusPoint.y;
            this.focusSelectOnlyCell(focusX + offsetX, focusY + offsetY, this._focus.subgrid, areaTypeSpecifier);
        }
    }

    getSelectionAreasCoveringCell(x: number, y: number, subgrid: SubgridInterface): SelectionArea[] {
        if (this._selection.focusedSubgrid !== subgrid) {
            return [];
        } else {
            this._selection.getAreasCoveringCell(x, y);
        }
    }

    /** @summary Extend cell selection by offset.
     * @desc Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
     * @param offsetX - x coordinate to start at
     * @param offsetY - y coordinate to start at
     */
    extendLastArea(offsetX: number, offsetY: number) {
        // const selection = this._selection;

        // const area = getLastArea
        // let maxColumns = this.getActiveColumnCount() - 1;
        // let maxRows = this.getSubgridRowCount(subgrid) - 1;

        // const maxViewableColumns = this.renderer.visibleColumns.length - 1;
        // const maxViewableRows = this.renderer.visibleRows.length - 1;

        // const origin = this._userInterfaceInputBehavior.getMouseDown();
        // const extent = this._userInterfaceInputBehavior.getDragExtent();

        // if (origin === undefined || extent === undefined) {
        //     throw new AssertError('RGES01034');
        // } else {
        //     let newX = extent.x + offsetX;
        //     let newY = extent.y + offsetY;

        //     if (!this.properties.scrollingEnabled) {
        //         maxColumns = Math.min(maxColumns, maxViewableColumns);
        //         maxRows = Math.min(maxRows, maxViewableRows);
        //     }

        //     newX = Math.min(maxColumns - origin.x, Math.max(-origin.x, newX));
        //     newY = Math.min(maxRows - origin.y, Math.max(-origin.y, newY));

        //     selection.beginChange();
        //     try {
        //         this.clearMostRecentRectangleSelection();
        //         selection.selectRectangle(origin.x, origin.y, newX, newY, subgrid);
        //     } finally {
        //         selection.endChange();
        //     }
        //     this._userInterfaceInputBehavior.setDragExtent(Point.create(newX, newY));

        //     const colScrolled = this.ensureModelColIsVisible(newX + origin.x, offsetX);
        //     const rowScrolled = this.ensureModelRowIsVisible(newY + origin.y, offsetY, subgrid);

        //     this.repaint();

        //     return colScrolled || rowScrolled;
        // }
    }

    private getPriorityCellCoveringSelectionArea(areas: SelectionArea[]) {
        const areaCount = areas.length;
        switch (areaCount) {
            case 0: return undefined;
            case 1: return areas[0];
            default: {
                let priorityArea = areas[0];
                for (let i = 0; i < areaCount; i++) {
                    const area = areas[i];
                    if (this.isCellCoveringSelectionAreaHigherPriority(area, priorityArea)) {
                        priorityArea = area;
                    }
                }
                return priorityArea;
            }
        }
    }

    private isCellCoveringSelectionAreaHigherPriority(area: SelectionArea, referenceArea: SelectionArea) {
        const type = area.areaType;
        switch (type) {
            case SelectionArea.Type.Rectangle: return (referenceArea.areaType === SelectionArea.Type.Rectangle) && (referenceArea.size !== 1);
            case SelectionArea.Type.Column: return referenceArea.areaType !== SelectionArea.Type.Row;
            case SelectionArea.Type.Row: return true;
            default:
                throw new UnreachableCaseError('SFICCSAHP35500', type);
        }
    }
}

export namespace SelectionBehavior {
    export type RepaintEventer = (this: void) => void;
    export type SelectionChangedEventer = (this: void) => void;
    export type ScrollToMakeVisibleEventer = (this: void, x: number, y: number, subgrid: SubgridInterface) => void;
}
