import { Focus } from '../../components/focus/focus';
import { Selection } from '../../components/selection/selection';
import { ViewLayout } from '../../components/view/view-layout';
import { Subgrid } from '../../interfaces/data/subgrid';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { AssertError } from '../../types-utils/revgrid-error';
import { StartLength } from '../../types-utils/start-length';
import { SelectionAreaType } from '../../types-utils/types';

export class FocusSelectBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> {
    constructor(
        private readonly _gridSettings: GridSettings,
        private readonly _selection: Selection<BCS, SF>,
        private readonly _focus: Focus<BGS, BCS, SF>,
        private readonly _viewLayout: ViewLayout<BGS, BCS, SF>,
        private readonly _checkFocusEventer: FocusSelectBehavior.CheckFocusEventer<BCS, SF>,
    ) {
    }

    selectOnlyColumn(activeColumnIndex: number) {
        const selection = this._selection;
        const rowIndex = this._focus.currentY ?? this._gridSettings.fixedRowCount;
        selection.beginChange();
        try {
            selection.clear();
            selection.selectColumns(activeColumnIndex, rowIndex, 1, 1, this._focus.subgrid);
        } finally {
            selection.endChange();
        }
    }

    selectToggleColumn(activeColumnIndex: number) {
        const rowIndex = this._focus.currentY ?? this._gridSettings.fixedRowCount;
        this._selection.selectToggleColumn(activeColumnIndex, rowIndex, this._focus.subgrid);
    }

    selectAddColumn(activeColumnIndex: number) {
        const rowIndex = this._focus.currentY ?? this._gridSettings.fixedRowCount;
        this._selection.selectColumns(activeColumnIndex, rowIndex, 1, 1, this._focus.subgrid);
    }

    selectOnlyRow(subgridRowIndex: number, subgrid: Subgrid<BCS, SF>) {
        const selection = this._selection;
        const columnIndex = this._focus.currentX ?? this._gridSettings.fixedColumnCount;
        selection.beginChange();
        try {
            selection.clear();
            selection.selectRows(columnIndex, subgridRowIndex, 1, 1, subgrid);
        } finally {
            selection.endChange();
        }
    }

    selectToggleRow(subgridRowIndex: number, subgrid: Subgrid<BCS, SF>) {
        const columnIndex = this._focus.currentX ?? this._gridSettings.fixedColumnCount;
        this._selection.selectToggleRow(columnIndex, subgridRowIndex, subgrid);
    }

    selectAddRow(subgridRowIndex: number, subgrid: Subgrid<BCS, SF>) {
        const columnIndex = this._focus.currentX ?? this._gridSettings.fixedColumnCount;
        this._selection.selectRows(columnIndex, subgridRowIndex, 1, 1, subgrid);
    }

    focusSelectOnlyRectangle(inexclusiveX: number, inexclusiveY: number, width: number, height: number, subgrid: Subgrid<BCS, SF>) {
        const area = this._selection.selectRectangle(inexclusiveX, inexclusiveY, width, height, subgrid);
        const focusPoint = area.inclusiveFirst;
        this._checkFocusEventer(focusPoint.x, focusPoint.y, subgrid);
    }

    focusSelectOnlyCell(activeColumnIndex: number, subgridRowIndex: number, subgrid: Subgrid<BCS, SF>, areaType: SelectionAreaType) {
        this._selection.selectOnlyCell(activeColumnIndex, subgridRowIndex, subgrid, areaType);
        this._checkFocusEventer(activeColumnIndex, subgridRowIndex, subgrid);
    }

    selectOnlyViewCell(viewLayoutColumnIndex: number, viewLayoutRowIndex: number, areaType: SelectionAreaType) {
        const viewLayoutColumns = this._viewLayout.columns;
        if (viewLayoutColumnIndex < viewLayoutColumns.length) {
            const vc = this._viewLayout.columns[viewLayoutColumnIndex]
            const viewLayoutRows = this._viewLayout.rows;
            if (viewLayoutRowIndex < viewLayoutRows.length) {
                const vr = this._viewLayout.rows[viewLayoutRowIndex];
                this.focusSelectOnlyCell(vc.activeColumnIndex, vr.subgridRowIndex, vr.subgrid as Subgrid<BCS, SF>, areaType);
            }
        }
    }

    focusReplaceLastArea(inexclusiveX: number, inexclusiveY: number, width: number, height: number, subgrid: Subgrid<BCS, SF>, areaType: SelectionAreaType) {
        const area = this._selection.replaceLastArea(inexclusiveX, inexclusiveY, width, height, subgrid, areaType);
        const focusPoint = area.inclusiveFirst;
        this._checkFocusEventer(focusPoint.x, focusPoint.y, subgrid);
    }

    focusReplaceLastAreaWithRectangle(inexclusiveX: number, inexclusiveY: number, width: number, height: number, subgrid: Subgrid<BCS, SF>) {
        const area = this._selection.replaceLastAreaWithRectangle(inexclusiveX, inexclusiveY, width, height, subgrid);
        const focusPoint = area.inclusiveFirst;
        this._checkFocusEventer(focusPoint.x, focusPoint.y, subgrid);
    }

    focusSelectAddCell(x: number, y: number, subgrid: Subgrid<BCS, SF>, areaType: SelectionAreaType) {
        this._selection.selectCell(x, y, subgrid, areaType);

        if (subgrid === this._focus.subgrid) {
            this._checkFocusEventer(x, y, subgrid);
        }
    }

    focusSelectToggleCell(originX: number, originY: number, subgrid: Subgrid<BCS, SF>, areaType: SelectionAreaType): boolean {
        const added = this._selection.selectToggleCell(originX, originY, subgrid, areaType);
        if (added) {
            this._checkFocusEventer(originX, originY, subgrid);
        }
        return added;
    }

    selectOnlyFocusedCell(areaType: SelectionAreaType) {
        const focusPoint = this._focus.current;
        if (focusPoint !== undefined) {
            const focusX = focusPoint.x;
            const focusY = focusPoint.y;
            this._selection.selectOnlyCell(focusX, focusY, this._focus.subgrid, areaType);
        }
    }

    extendLastSelectionAreaAsCloseAsPossibleToFocus() {
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

}

export namespace FocusSelectBehavior {
    export type CheckFocusEventer<
        BCS extends BehavioredColumnSettings,
        SF extends SchemaField
    > = (this: void, activeColumnIndex: number, subgridRowIndex: number, subgrid: Subgrid<BCS, SF>) => void;
}
