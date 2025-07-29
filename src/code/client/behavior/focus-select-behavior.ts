import { RevAssertError, RevClientObject, RevEnsureFullyInView, RevEnsureFullyInViewEnum, RevSchemaField, RevSelectionAreaTypeId, RevStartLength } from '../../common';
import { RevFocus } from '../components/focus/focus';
import { RevSelection } from '../components/selection/selection';
import { RevViewLayout } from '../components/view/view-layout';
import { RevSubgrid } from '../interfaces/subgrid';
import { RevViewCell } from '../interfaces/view-cell';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../settings';
import { RevEventBehavior } from './event-behavior';

export class RevFocusSelectBehavior<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        private readonly _gridSettings: RevGridSettings,
        private readonly _selection: RevSelection<BGS, BCS, SF>,
        private readonly _focus: RevFocus<BGS, BCS, SF>,
        private readonly _viewLayout: RevViewLayout<BGS, BCS, SF>,
    ) {
    }

    selectColumn(activeColumnIndex: number) {
        this.selectColumns(activeColumnIndex, 1);
    }

    selectColumns(activeColumnIndex: number, count: number) {
        const rowIndex = this._focus.currentY ?? this._gridSettings.fixedRowCount;
        this._selection.selectColumns(activeColumnIndex, rowIndex, count, 1, this._focus.subgrid);
    }

    onlySelectColumn(activeColumnIndex: number) {
        this.onlySelectColumns(activeColumnIndex, 1);
    }

    onlySelectColumns(activeColumnIndex: number, count: number) {
        const selection = this._selection;
        const rowIndex = this._focus.currentY ?? this._gridSettings.fixedRowCount;
        selection.beginChange();
        try {
            selection.clear();
            selection.selectColumns(activeColumnIndex, rowIndex, count, 1, this._focus.subgrid);
        } finally {
            selection.endChange();
        }
    }

    toggleSelectColumn(activeColumnIndex: number) {
        const rowIndex = this._focus.currentY ?? this._gridSettings.fixedRowCount;
        this._selection.toggleSelectColumn(activeColumnIndex, rowIndex, this._focus.subgrid);
    }

    selectRow(subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>) {
        this.selectRows(subgridRowIndex, 1, subgrid)
    }

    selectRows(subgridRowIndex: number, count: number, subgrid: RevSubgrid<BCS, SF>) {
        const columnIndex = this._focus.currentX ?? this._gridSettings.fixedColumnCount;
        this._selection.selectRows(columnIndex, subgridRowIndex, 1, count, subgrid);
    }

    selectAllRows(subgrid: RevSubgrid<BCS, SF>) {
        const columnIndex = this._focus.currentX ?? this._gridSettings.fixedColumnCount;
        this._selection.selectAllRows(columnIndex, 1, subgrid);
    }

    onlySelectRow(subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>) {
        this.onlySelectRows(subgridRowIndex, 1, subgrid)
    }

    onlySelectRows(subgridRowIndex: number, count: number, subgrid: RevSubgrid<BCS, SF>) {
        const selection = this._selection;
        const columnIndex = this._focus.currentX ?? this._gridSettings.fixedColumnCount;
        selection.beginChange();
        try {
            selection.clear();
            selection.selectRows(columnIndex, subgridRowIndex, 1, count, subgrid);
        } finally {
            selection.endChange();
        }
    }

    toggleSelectRow(subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>) {
        const columnIndex = this._focus.currentX ?? this._gridSettings.fixedColumnCount;
        this._selection.toggleSelectRow(columnIndex, subgridRowIndex, subgrid);
    }

    focusOnlySelectRectangle(
        leftOrExRightActiveColumnIndex: number,
        topOrExBottomSubgridRowIndex: number,
        width: number,
        height: number,
        subgrid: RevSubgrid<BCS, SF>,
        ensureFullyInView: RevEnsureFullyInView,
    ) {
        this._selection.beginChange();
        const area = this._selection.selectRectangle(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid);
        const focusPoint = area.inclusiveFirst;
        const focused = this._focus.trySet(focusPoint, subgrid, undefined, undefined);
        if (focused) {
            if (ensureFullyInView !== RevEnsureFullyInViewEnum.Never) {
                this._viewLayout.ensureColumnRowAreInView(focusPoint.x, focusPoint.y, ensureFullyInView === RevEnsureFullyInViewEnum.Always);
            }

            this._selection.flagFocusLinked();
        }
        this._selection.endChange();
    }

    /** Select only a single cell and try to focus it. If focused, ensure it is in view. */
    focusOnlySelectCell(
        activeColumnIndex: number,
        subgridRowIndex: number,
        subgrid: RevSubgrid<BCS, SF>,
        ensureFullyInView: RevEnsureFullyInView,
    ): void {
        this._selection.beginChange();
        const focused = this._focus.trySetXY(activeColumnIndex, subgridRowIndex, subgrid, undefined, undefined, undefined);
        this._selection.onlySelectCell(activeColumnIndex, subgridRowIndex, subgrid);
        if (focused) {
            if (ensureFullyInView !== RevEnsureFullyInViewEnum.Never) {
                this._viewLayout.ensureColumnRowAreInView(activeColumnIndex, subgridRowIndex, ensureFullyInView === RevEnsureFullyInViewEnum.Always);
            }

            this._selection.flagFocusLinked();
        }
        this._selection.endChange();
    }

    onlySelectViewCell(viewLayoutColumnIndex: number, viewLayoutRowIndex: number): void {
        const viewLayoutColumns = this._viewLayout.columns;
        if (viewLayoutColumnIndex < viewLayoutColumns.length) {
            const vc = this._viewLayout.columns[viewLayoutColumnIndex]
            const viewLayoutRows = this._viewLayout.rows;
            if (viewLayoutRowIndex < viewLayoutRows.length) {
                const vr = this._viewLayout.rows[viewLayoutRowIndex];
                this.focusOnlySelectCell(vc.activeColumnIndex, vr.subgridRowIndex, vr.subgrid, RevEnsureFullyInViewEnum.Never);
            }
        }
    }

    focusSelectCell(x: number, y: number, subgrid: RevSubgrid<BCS, SF>, ensureFullyInView: RevEnsureFullyInView): void {
        this._selection.beginChange();
        const focused = this._focus.trySetXY(x, y, subgrid, undefined, undefined, undefined);
        this._selection.selectCell(x, y, subgrid);
        if (focused) {
            if (ensureFullyInView !== RevEnsureFullyInViewEnum.Never) {
                this._viewLayout.ensureColumnRowAreInView(x, y, ensureFullyInView === RevEnsureFullyInViewEnum.Always);
            }

            this._selection.flagFocusLinked();
        }
        this._selection.endChange();
    }

    /**
     * Toggles the selection state of a cell at the specified coordinates and attempts to set focus to it.
     * If the cell becomes selected and focus is successfully set, optionally ensures the cell is fully visible in the view.
     * Also flags the selection as focus-linked if focus is set.
     *
     * @param activeColumnIndex - The active column index of the cell.
     * @param subgridRowIndex - The row index within the subgrid of the cell.
     * @param subgrid - The subgrid containing the cell.
     * @param ensureFullyInView - Specifies whether to scroll to ensure the cell is visible in the view.
     * @returns `true` if the cell is selected after toggling; otherwise, `false`.
     */
    focusToggleSelectCell(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>, ensureFullyInView: RevEnsureFullyInView): boolean {
        this._selection.beginChange();
        const selected = this._selection.toggleSelectCell(activeColumnIndex, subgridRowIndex, subgrid);
        if (selected) {
            const focused = this._focus.trySetXY(activeColumnIndex, subgridRowIndex, subgrid, undefined, undefined, undefined);
            if (focused) {
                if (ensureFullyInView !== RevEnsureFullyInViewEnum.Never) {
                    this._viewLayout.ensureColumnRowAreInView(activeColumnIndex, subgridRowIndex, ensureFullyInView === RevEnsureFullyInViewEnum.Always);
                }

                this._selection.flagFocusLinked();
            }
        }
        this._selection.endChange();
        return selected;
    }

    tryOnlySelectFocusedCell(): boolean {
        const focusPoint = this._focus.current;
        if (focusPoint === undefined) {
            return false;
        } else {
            const focusX = focusPoint.x;
            const focusY = focusPoint.y;
            this._selection.beginChange();
            this._selection.onlySelectCell(focusX, focusY, this._focus.subgrid);
            this._selection.flagFocusLinked();
            this._selection.endChange();
            return true;
        }
    }

    focusReplaceLastArea(
        areaTypeId: RevSelectionAreaTypeId,
        inexclusiveX: number,
        inexclusiveY: number,
        width: number,
        height: number,
        subgrid: RevSubgrid<BCS, SF>,
        ensureFullyInView: RevEnsureFullyInView,
    ) {
        this._selection.beginChange();
        const area = this._selection.replaceLastArea(areaTypeId, inexclusiveX, inexclusiveY, width, height, subgrid);
        if (area !== undefined) {
            const focusPoint = area.inclusiveFirst;
            const focused = this._focus.trySet(focusPoint, subgrid, undefined, undefined);
            if (focused) {
                if (ensureFullyInView !== RevEnsureFullyInViewEnum.Never) {
                    this._viewLayout.ensureColumnRowAreInView(focusPoint.x, focusPoint.y, ensureFullyInView === RevEnsureFullyInViewEnum.Always);
                }

                this._selection.flagFocusLinked();
            }
        }
        this._selection.endChange();
    }

    focusReplaceLastAreaWithRectangle(inexclusiveX: number, inexclusiveY: number, width: number, height: number, subgrid: RevSubgrid<BCS, SF>, ensureFullyInView: RevEnsureFullyInView) {
        this._selection.beginChange();
        const area = this._selection.replaceLastAreaWithRectangle(inexclusiveX, inexclusiveY, width, height, subgrid);
        const focusPoint = area.inclusiveFirst;
        const focused = this._focus.trySet(focusPoint, subgrid, undefined, undefined);
        if (focused) {
            if (ensureFullyInView !== RevEnsureFullyInViewEnum.Never) {
                this._viewLayout.ensureColumnRowAreInView(focusPoint.x, focusPoint.y, ensureFullyInView === RevEnsureFullyInViewEnum.Always);
            }

            this._selection.flagFocusLinked();
        }
        this._selection.endChange();
    }

    tryExtendLastSelectionAreaAsCloseAsPossibleToFocus() {
        const focusPoint = this._focus.current;
        if (focusPoint === undefined) {
            return false;
        } else {
            const lastArea = this._selection.lastArea;
            if (lastArea === undefined) {
                return false;
            } else {
                let newLastX = focusPoint.x;
                let newLastY = focusPoint.y;

                if (!this._gridSettings.scrollingEnabled) {
                    const limitedNewX = this._viewLayout.limitActiveColumnIndexToView(newLastX);
                    const limitedNewY = this._viewLayout.limitRowIndexToView(newLastY);
                    if (limitedNewX === undefined || limitedNewY === undefined) {
                        throw new RevAssertError('SUBMSS33398');
                    } else {
                        newLastX = limitedNewX;
                        newLastY = limitedNewY;
                    }
                }

                const firstPoint = lastArea.inclusiveFirst;
                const xExclusiveStartLength = RevStartLength.createExclusiveFromFirstLast(firstPoint.x, newLastX);
                const yExclusiveStartLength = RevStartLength.createExclusiveFromFirstLast(firstPoint.y, newLastY);
                this._selection.replaceLastAreaWithRectangle(
                    xExclusiveStartLength.start,
                    yExclusiveStartLength.start,
                    xExclusiveStartLength.length,
                    yExclusiveStartLength.length,
                    this._focus.subgrid
                );

                this._viewLayout.ensureColumnRowAreInView(newLastX, newLastY, true);
                return true;
            }
        }
    }

    isMouseAddToggleExtendSelectionAreaAllowed(event: MouseEvent) {
        return !RevEventBehavior.isSecondaryMouseButton(event) && this._gridSettings.mouseAddToggleExtendSelectionAreaEnabled;
    }
}

export namespace RevFocusSelectBehavior {
    export type FocusAndEnsureInViewEventer<
        BCS extends RevBehavioredColumnSettings,
        SF extends RevSchemaField
    > = (this: void, activeColumnIndex: number, subgridRowIndex: number, cell: RevViewCell<BCS, SF> | undefined) => void;
}
