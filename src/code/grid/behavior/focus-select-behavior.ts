import { Focus } from '../components/focus/focus';
import { Selection } from '../components/selection/selection';
import { ViewLayout } from '../components/view/view-layout';
import { Subgrid } from '../interfaces/data/subgrid';
import { SchemaField } from '../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../interfaces/settings/behaviored-grid-settings';
import { GridSettings } from '../interfaces/settings/grid-settings';
import { AssertError } from '../types-utils/revgrid-error';
import { RevgridObject } from '../types-utils/revgrid-object';
import { SelectionAreaTypeId } from '../types-utils/selection-area-type';
import { StartLength } from '../types-utils/start-length';
import { EventBehavior } from './event-behavior';

export class FocusSelectBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> implements RevgridObject {
    constructor(
        readonly revgridId: string,
        readonly internalParent: RevgridObject,
        private readonly _gridSettings: GridSettings,
        private readonly _selection: Selection<BCS, SF>,
        private readonly _focus: Focus<BGS, BCS, SF>,
        private readonly _viewLayout: ViewLayout<BGS, BCS, SF>,
        private readonly _checkFocusEventer: FocusSelectBehavior.CheckFocusEventer<BCS, SF>,
    ) {
    }

    selectColumn(activeColumnIndex: number) {
        this.selectColumns(activeColumnIndex, 1);
    }

    selectColumns(activeColumnIndex: number, count: number) {
        const rowIndex = this._focus.currentY ?? this._gridSettings.fixedRowCount;
        this._selection.selectColumns(activeColumnIndex, rowIndex, count, 1, this._focus.subgrid);
    }

    clearSelectColumn(activeColumnIndex: number) {
        this.clearSelectColumns(activeColumnIndex, 1);
    }

    clearSelectColumns(activeColumnIndex: number, count: number) {
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

    selectRow(subgridRowIndex: number, subgrid: Subgrid<BCS, SF>) {
        this.selectRows(subgridRowIndex, 1, subgrid)
    }

    selectRows(subgridRowIndex: number, count: number, subgrid: Subgrid<BCS, SF>) {
        const columnIndex = this._focus.currentX ?? this._gridSettings.fixedColumnCount;
        this._selection.selectRows(columnIndex, subgridRowIndex, 1, count, subgrid);
    }

    selectAllRows(subgrid: Subgrid<BCS, SF>) {
        const columnIndex = this._focus.currentX ?? this._gridSettings.fixedColumnCount;
        this._selection.selectAllRows(columnIndex, 1, subgrid);
    }

    clearSelectRow(subgridRowIndex: number, subgrid: Subgrid<BCS, SF>) {
        this.clearSelectRows(subgridRowIndex, 1, subgrid)
    }

    clearSelectRows(subgridRowIndex: number, count: number, subgrid: Subgrid<BCS, SF>) {
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

    toggleSelectRow(subgridRowIndex: number, subgrid: Subgrid<BCS, SF>) {
        const columnIndex = this._focus.currentX ?? this._gridSettings.fixedColumnCount;
        this._selection.toggleSelectRow(columnIndex, subgridRowIndex, subgrid);
    }

    focusClearSelectRectangle(inexclusiveX: number, inexclusiveY: number, width: number, height: number, subgrid: Subgrid<BCS, SF>) {
        const area = this._selection.selectRectangle(inexclusiveX, inexclusiveY, width, height, subgrid);
        const focusPoint = area.inclusiveFirst;
        this._checkFocusEventer(focusPoint.x, focusPoint.y, subgrid);
    }

    focusClearSelectCell(activeColumnIndex: number, subgridRowIndex: number, subgrid: Subgrid<BCS, SF>) {
        this._selection.clearSelectCell(activeColumnIndex, subgridRowIndex, subgrid);
        this._checkFocusEventer(activeColumnIndex, subgridRowIndex, subgrid);
    }

    clearSelectViewCell(viewLayoutColumnIndex: number, viewLayoutRowIndex: number) {
        const viewLayoutColumns = this._viewLayout.columns;
        if (viewLayoutColumnIndex < viewLayoutColumns.length) {
            const vc = this._viewLayout.columns[viewLayoutColumnIndex]
            const viewLayoutRows = this._viewLayout.rows;
            if (viewLayoutRowIndex < viewLayoutRows.length) {
                const vr = this._viewLayout.rows[viewLayoutRowIndex];
                this.focusClearSelectCell(vc.activeColumnIndex, vr.subgridRowIndex, vr.subgrid);
            }
        }
    }

    focusSelectCell(x: number, y: number, subgrid: Subgrid<BCS, SF>) {
        this._selection.selectCell(x, y, subgrid);

        if (subgrid === this._focus.subgrid) {
            this._checkFocusEventer(x, y, subgrid);
        }
    }

    focusToggleSelectCell(originX: number, originY: number, subgrid: Subgrid<BCS, SF>): boolean {
        const selected = this._selection.toggleSelectCell(originX, originY, subgrid);
        if (selected) {
            this._checkFocusEventer(originX, originY, subgrid);
        }
        return selected;
    }

    tryClearSelectFocusedCell() {
        const focusPoint = this._focus.current;
        if (focusPoint === undefined) {
            return false;
        } else {
            const focusX = focusPoint.x;
            const focusY = focusPoint.y;
            this._selection.clearSelectCell(focusX, focusY, this._focus.subgrid);
            return true;
        }
    }

    focusReplaceLastArea(areaTypeId: SelectionAreaTypeId, inexclusiveX: number, inexclusiveY: number, width: number, height: number, subgrid: Subgrid<BCS, SF>) {
        const area = this._selection.replaceLastArea(areaTypeId, inexclusiveX, inexclusiveY, width, height, subgrid);
        if (area !== undefined) {
            const focusPoint = area.inclusiveFirst;
            this._checkFocusEventer(focusPoint.x, focusPoint.y, subgrid);
        }
    }

    focusReplaceLastAreaWithRectangle(inexclusiveX: number, inexclusiveY: number, width: number, height: number, subgrid: Subgrid<BCS, SF>) {
        const area = this._selection.replaceLastAreaWithRectangle(inexclusiveX, inexclusiveY, width, height, subgrid);
        const focusPoint = area.inclusiveFirst;
        this._checkFocusEventer(focusPoint.x, focusPoint.y, subgrid);
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
                        throw new AssertError('SUBMSS33398');
                    } else {
                        newLastX = limitedNewX;
                        newLastY = limitedNewY;
                    }
                }

                const firstPoint = lastArea.inclusiveFirst;
                const xExclusiveStartLength = StartLength.createExclusiveFromFirstLast(firstPoint.x, newLastX);
                const yExclusiveStartLength = StartLength.createExclusiveFromFirstLast(firstPoint.y, newLastY);
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
        return !EventBehavior.isSecondaryMouseButton(event) && this._gridSettings.mouseAddToggleExtendSelectionAreaEnabled;
    }
}

export namespace FocusSelectBehavior {
    export type CheckFocusEventer<
        BCS extends BehavioredColumnSettings,
        SF extends SchemaField
    > = (this: void, activeColumnIndex: number, subgridRowIndex: number, subgrid: Subgrid<BCS, SF>) => void;
}
