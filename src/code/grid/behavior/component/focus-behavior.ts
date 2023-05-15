import { ViewCell } from '../../components/cell/view-cell';
import { ColumnsManager } from '../../components/column/columns-manager';
import { Focus } from '../../components/focus/focus';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../components/view/view-layout';
import { GridSettings } from '../../interfaces/grid-settings';
import { SubgridInterface } from '../../interfaces/subgrid-interface';
import { ViewLayoutColumn } from '../../interfaces/view-layout-column';
import { ViewLayoutRow } from '../../interfaces/view-layout-row';
import { Point } from '../../lib/point';

export class FocusBehavior {
    constructor(
        private readonly _gridProperties: GridSettings,
        private readonly _mainSubgrid: SubgridInterface,
        private readonly _columnsManager: ColumnsManager,
        private readonly _subgridsManager: SubgridsManager,
        private readonly _viewLayout: ViewLayout,
        private readonly _focus: Focus,
    ) {

    }

    focusPointAndEnsureInView(point: Point) {
        this._viewLayout.ensureColumnRowAreInView(point.x, point.y, true)
        this._focus.set(point);
    }

    focusXYAndEnsureInView(x: number, y: number) {
        this._viewLayout.ensureColumnRowAreInView(x, y, true)
        this._focus.setXY(x, y);
    }

    focusXAndEnsureInView(x: number) {
        this._viewLayout.ensureColumnIsInView(x, true)
        this._focus.setX(x);
    }

    focusYAndEnsureInView(y: number) {
        this._viewLayout.ensureRowIsInView(y, true)
        this._focus.setY(y);
    }

    tryMoveFocusLeft() {
        const currentFocusPoint = this._focus.currentSubgridPoint;
        if (currentFocusPoint !== undefined) {
            const newX = currentFocusPoint.x - 1;
            if (this.isXScrollabe(newX)) {
                this.focusXAndEnsureInView(newX);
            }
        }
    }

    tryMoveFocusRight() {
        const currentFocusPoint = this._focus.currentSubgridPoint;
        if (currentFocusPoint !== undefined) {
            const newX = currentFocusPoint.x + 1;
            if (this.isXScrollabe(newX)) {
                this.focusXAndEnsureInView(newX);
            }
        }
    }

    tryMoveFocusUp() {
        const currentFocusPoint = this._focus.currentSubgridPoint;
        if (currentFocusPoint !== undefined) {
            const newY = currentFocusPoint.y - 1;
            if (this.isYScrollabe(newY)) {
                this.focusYAndEnsureInView(newY);
            }
        }
    }

    tryMoveFocusDown() {
        const currentFocusPoint = this._focus.currentSubgridPoint;
        if (currentFocusPoint !== undefined) {
            const newY = currentFocusPoint.y + 1;
            if (this.isYScrollabe(newY)) {
                this.focusYAndEnsureInView(newY);
            }
        }
    }

    tryMoveFocusFirstColumn() {
        const newX = this._gridProperties.fixedColumnCount;
        if (this.isXScrollabe(newX)) {
            this.focusYAndEnsureInView(newX);
        }
    }

    tryMoveFocusLastColumn() {
        const newX = this._columnsManager.activeColumnCount - 1;
        if (this.isXScrollabe(newX)) {
            this.focusYAndEnsureInView(newX);
        }
    }

    tryMoveFocusTop() {
        const newY = this._gridProperties.fixedRowCount;
        if (this.isYScrollabe(newY)) {
            this.focusYAndEnsureInView(newY);
        }
    }

    tryMoveFocusBottom() {
        const newY = this._mainSubgrid.getRowCount() - 1;
        if (this.isYScrollabe(newY)) {
            this.focusYAndEnsureInView(newY);
        }
    }

    tryPageFocusLeft() {
        const anchor = this._viewLayout.calculatePageLeftColumnAnchor();
        if (anchor !== undefined) {
            const activeColumnIndex = anchor.index;
            this._viewLayout.setColumnScrollAnchor(activeColumnIndex, anchor.offset);
            this._focus.setX(activeColumnIndex);
        }
    }

    tryPageFocusRight() {
        const anchor = this._viewLayout.calculatePageRightColumnAnchor();
        if (anchor !== undefined) {
            const activeColumnIndex = anchor.index;
            this._viewLayout.setColumnScrollAnchor(activeColumnIndex, anchor.offset);
            this._focus.setX(activeColumnIndex);
        }
    }

    tryPageFocusUp() {
        const anchor = this._viewLayout.calculatePageUpRowAnchor();
        if (anchor !== undefined) {
            const rowIndex = anchor.index;
            this._viewLayout.setRowScrollAnchor(rowIndex, anchor.offset);
            this._focus.setY(rowIndex);
        }
    }

    tryPageFocusDown() {
        const anchor = this._viewLayout.calculatePageDownRowAnchor();
        if (anchor !== undefined) {
            const rowIndex = anchor.index;
            this._viewLayout.setRowScrollAnchor(anchor.index, anchor.offset);
            this._focus.setY(rowIndex);
        }
    }

    getFocusedViewCell(useAllCells: boolean) {
        const focusedPoint = this._focus.currentSubgridPoint;
        if (focusedPoint === undefined) {
            return undefined;
        } else {
            const gridX = focusedPoint.x;
            const dataY = focusedPoint.y;
            if (useAllCells) {
                // When expanding selections larger than the view, the origin/corner
                // points may not be rendered and would normally fail to reset cell's position.
                // Mock column and row objects for this.reset() to use:
                const vc: ViewLayoutColumn = {
                    column: this._columnsManager.getAllColumn(gridX), // pick any valid column (gridX will always index a valid column)
                    activeColumnIndex: gridX,
                    index: -1,
                    left: -1,
                    rightPlus1: -1,
                    width: -1,
                };
                const vr: ViewLayoutRow = {
                    subgridRowIndex: dataY,
                    index: -1,
                    subgrid: this._subgridsManager.mainSubgrid,
                    top: -1,
                    bottom: -1,
                    height: -1,
                };
                const cellEvent = new ViewCell(this._columnsManager);
                cellEvent.reset(vc, vr);
                return cellEvent;
            } else {
                const vc = this._viewLayout.tryGetColumnWithActiveIndex(gridX);
                if (vc === undefined) {
                    return undefined;
                } else {
                    const vr = this._viewLayout.getVisibleDataRow(dataY, this._subgridsManager.mainSubgrid);
                    if (vr === undefined) {
                        return undefined;
                    } else {
                        const cellEvent = new ViewCell(this._columnsManager);
                        cellEvent.reset(vc, vr);
                        return cellEvent;
                    }
                }
            }
        }
    }

    private isXScrollabe(x: number) {
        return (
            x >= this._gridProperties.fixedColumnCount &&
            x < this._columnsManager.activeColumnCount
        );
    }

    private isYScrollabe(y: number) {
        return (
            y > this._gridProperties.fixedRowCount &&
            y < this._mainSubgrid.getRowCount()
        );
    }
}

export namespace FocusBehavior {
    export type ScrollXToMakeVisibleEventer = (this: void, x: number) => void;
    export type ScrollYToMakeVisibleEventer = (this: void, y: number) => void;
    export type ScrollXYToMakeVisibleEventer = (this: void, x: number, y: number) => void;
}
