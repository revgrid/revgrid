import { RevAssertError, RevClientObject, RevEnsureFullyInView, RevEnsureFullyInViewEnum, RevSchemaField, RevSelectionAreaTypeId, RevStartLength } from '../../common';
import { RevColumnsManager } from '../components/column';
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
        private readonly _columnsManager: RevColumnsManager<BCS, SF>,
        private readonly _selection: RevSelection<BGS, BCS, SF>,
        private readonly _focus: RevFocus<BGS, BCS, SF>,
        private readonly _viewLayout: RevViewLayout<BGS, BCS, SF>,
    ) {
    }

    selectColumn(activeColumnIndex: number): void {
        this.selectColumns(activeColumnIndex, 1);
    }

    selectColumns(activeColumnIndex: number, count: number): void {
        this._selection.selectColumns(activeColumnIndex, count);
    }

    onlySelectColumn(activeColumnIndex: number): void {
        this.onlySelectColumns(activeColumnIndex, 1);
    }

    onlySelectColumns(activeColumnIndex: number, count: number): void {
        const selection = this._selection;
        selection.beginChange();
        try {
            selection.clear();
            selection.selectColumns(activeColumnIndex, count);
        } finally {
            selection.endChange();
        }
    }

    toggleSelectColumn(activeColumnIndex: number): void {
        this._selection.toggleSelectColumn(activeColumnIndex);
    }

    selectRow(subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): void {
        this.selectRows(subgridRowIndex, 1, subgrid)
    }

    selectRows(subgridRowIndex: number, count: number, subgrid: RevSubgrid<BCS, SF>): void {
        this._selection.selectRows(0, subgridRowIndex, this._columnsManager.activeColumnCount, count, subgrid);
    }

    selectAllRows(subgrid: RevSubgrid<BCS, SF>): void {
        this._selection.selectAllRows(0, this._columnsManager.activeColumnCount, subgrid);
    }

    onlySelectRow(subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): void {
        this.onlySelectRows(subgridRowIndex, 1, subgrid)
    }

    onlySelectRows(subgridRowIndex: number, count: number, subgrid: RevSubgrid<BCS, SF>): void {
        const selection = this._selection;
        selection.beginChange();
        try {
            selection.clear();
            selection.selectRows(0, subgridRowIndex, this._columnsManager.activeColumnCount, count, subgrid);
        } finally {
            selection.endChange();
        }
    }

    toggleSelectRow(subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): void {
        this._selection.toggleSelectRow(0, subgridRowIndex, this._columnsManager.activeColumnCount, subgrid);
    }

    focusOnlySelectRectangle(
        leftOrExRightActiveColumnIndex: number,
        topOrExBottomSubgridRowIndex: number,
        width: number,
        height: number,
        subgrid: RevSubgrid<BCS, SF>,
        ensureFullyInView: RevEnsureFullyInView,
    ): void {
        this._selection.beginChange();
        const area = this._selection.selectRectangle(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid);
        const focusSubgridPoint = area.inclusiveFirst;
        const focused = this._focus.setPointOrClear(focusSubgridPoint, subgrid, undefined, undefined);
        if (focused) {
            if (ensureFullyInView !== RevEnsureFullyInViewEnum.Never) {
                this._viewLayout.ensureColumnRowAreInView(focusSubgridPoint.x, focusSubgridPoint.y, ensureFullyInView === RevEnsureFullyInViewEnum.Always);
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
        const focused = this._focus.setColumnRowOrClear(activeColumnIndex, subgridRowIndex, subgrid, undefined, undefined, undefined);
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

    focusSelectCell(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>, ensureFullyInView: RevEnsureFullyInView): void {
        this._selection.beginChange();
        const focused = this._focus.setColumnRowOrClear(activeColumnIndex, subgridRowIndex, subgrid, undefined, undefined, undefined);
        this._selection.selectCell(activeColumnIndex, subgridRowIndex, subgrid);
        if (focused) {
            if (ensureFullyInView !== RevEnsureFullyInViewEnum.Never) {
                this._viewLayout.ensureColumnRowAreInView(activeColumnIndex, subgridRowIndex, ensureFullyInView === RevEnsureFullyInViewEnum.Always);
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
            const focused = this._focus.setColumnRowOrClear(activeColumnIndex, subgridRowIndex, subgrid, undefined, undefined, undefined);
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
            const activeColumnIndex = focusPoint.x;
            const subgridRowIndex = focusPoint.y;
            const subgrid = focusPoint.subgrid;
            this._selection.beginChange();
            this._selection.onlySelectCell(activeColumnIndex, subgridRowIndex, subgrid);
            this._selection.flagFocusLinked();
            this._selection.endChange();
            return true;
        }
    }

    focusReplaceLastArea(
        areaTypeId: RevSelectionAreaTypeId,
        leftOrExRightActiveColumnIndex: number,
        topOrExBottomSubgridRowIndex: number,
        width: number,
        height: number,
        subgrid: RevSubgrid<BCS, SF>,
        ensureFullyInView: RevEnsureFullyInView,
    ): void {
        this._selection.beginChange();
        const area = this._selection.replaceLastArea(areaTypeId, leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid);
        if (area !== undefined) {
            const focusPoint = area.inclusiveFirst;
            const focused = this._focus.setPointOrClear(focusPoint, subgrid, undefined, undefined);
            if (focused) {
                if (ensureFullyInView !== RevEnsureFullyInViewEnum.Never) {
                    this._viewLayout.ensureColumnRowAreInView(focusPoint.x, focusPoint.y, ensureFullyInView === RevEnsureFullyInViewEnum.Always);
                }

                this._selection.flagFocusLinked();
            }
        }
        this._selection.endChange();
    }

    focusReplaceLastAreaWithRectangle(
        leftOrExRightActiveColumnIndex: number,
        topOrExBottomSubgridRowIndex: number,
        width: number,
        height: number,
        subgrid: RevSubgrid<BCS, SF>,
        ensureFullyInView: RevEnsureFullyInView
    ): void {
        this._selection.beginChange();
        const area = this._selection.replaceLastAreaWithRectangle(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid);
        const focusPoint = area.inclusiveFirst;
        const focused = this._focus.setPointOrClear(focusPoint, subgrid, undefined, undefined);
        if (focused) {
            if (ensureFullyInView !== RevEnsureFullyInViewEnum.Never) {
                this._viewLayout.ensureColumnRowAreInView(focusPoint.x, focusPoint.y, ensureFullyInView === RevEnsureFullyInViewEnum.Always);
            }

            this._selection.flagFocusLinked();
        }
        this._selection.endChange();
    }

    tryExtendLastSelectionAreaAsCloseAsPossibleToFocus(): boolean {
        const currentFocusPoint = this._focus.current;
        if (currentFocusPoint === undefined) {
            return false;
        } else {
            const lastArea = this._selection.lastArea;
            if (lastArea === undefined) {
                return false;
            } else {
                const focusSubgrid = currentFocusPoint.subgrid;
                if (focusSubgrid !== lastArea.subgrid) {
                    return false;
                } else {
                    let newActiveColumnIndex = currentFocusPoint.x;
                    let newSubgridRowIndex = currentFocusPoint.y;

                    if (focusSubgrid.scrollable && !this._gridSettings.scrollingEnabled) {
                        const limitedActiveColumnIndex = this._viewLayout.limitActiveColumnIndexToView(newActiveColumnIndex);
                        const limitedSubgridRowIndex = this._viewLayout.limitRowIndexToView(newSubgridRowIndex);
                        if (limitedActiveColumnIndex === undefined || limitedSubgridRowIndex === undefined) {
                            throw new RevAssertError('SUBMSS33398');
                        } else {
                            newActiveColumnIndex = limitedActiveColumnIndex;
                            newSubgridRowIndex = limitedSubgridRowIndex;
                        }
                    }

                    const firstPoint = lastArea.inclusiveFirst;
                    const xStartLength = RevStartLength.createFromInclusiveFirstLast(firstPoint.x, newActiveColumnIndex);
                    const yStartLength = RevStartLength.createFromInclusiveFirstLast(firstPoint.y, newSubgridRowIndex);
                    this._selection.replaceLastAreaWithRectangle(
                        xStartLength.start,
                        yStartLength.start,
                        xStartLength.length,
                        yStartLength.length,
                        focusSubgrid
                    );

                    this._viewLayout.ensureColumnRowAreInView(newActiveColumnIndex, newSubgridRowIndex, true);
                    return true;
                }
            }
        }
    }

    isMouseAddToggleExtendSelectionAreaAllowed(event: MouseEvent): boolean {
        return !RevEventBehavior.isSecondaryMouseButton(event) && this._gridSettings.mouseAddToggleExtendSelectionAreaEnabled;
    }
}

export namespace RevFocusSelectBehavior {
    export type FocusAndEnsureInViewEventer<
        BCS extends RevBehavioredColumnSettings,
        SF extends RevSchemaField
    > = (this: void, activeColumnIndex: number, subgridRowIndex: number, cell: RevViewCell<BCS, SF> | undefined) => void;
}
