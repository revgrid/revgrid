import { Focus } from '../../components/focus/focus';
import { Selection } from '../../components/selection/selection';
import { ViewLayout } from '../../components/view/view-layout';
import { SubgridInterface } from '../../interfaces/subgrid-interface';
import { SelectionArea } from '../../lib/selection-area';

export class FocusSelectBehavior {
    constructor(
        private readonly _selection: Selection,
        private readonly _focus: Focus,
        private readonly _viewLayout: ViewLayout,
        private readonly _checkFocusEventer: FocusSelectBehavior.CheckFocusEventer,
    ) {
    }

    destroy() {
        //
    }

    selectOnlyColumn(activeColumnIndex: number) {
        const selection = this._selection;
        const rowIndex = this._focus.currentSubgridX ?? 0;
        selection.beginChange();
        try {
            selection.clear();
            selection.selectColumns(activeColumnIndex, rowIndex, 1, 1, this._focus.subgrid);
        } finally {
            selection.endChange();
        }
    }

    selectAddColumn(activeColumnIndex: number) {
        const rowIndex = this._focus.currentSubgridX ?? 0;
        this._selection.selectColumns(activeColumnIndex, rowIndex, 1, 1, this._focus.subgrid);
    }

    selectOnlyRow(subgridRowIndex: number, subgrid: SubgridInterface) {
        const selection = this._selection;
        const columnIndex = this._focus.currentSubgridX ?? 0;
        selection.beginChange();
        try {
            selection.clear();
            selection.selectRows(columnIndex, subgridRowIndex, 1, 1, subgrid);
        } finally {
            selection.endChange();
        }
    }

    selectAddRow(subgridRowIndex: number, subgrid: SubgridInterface) {
        const columnIndex = this._focus.currentSubgridX ?? 0;
        this._selection.selectRows(columnIndex, subgridRowIndex, 1, 1, subgrid);
    }

    focusSelectOnlyRectangle(exclusiveX: number, exclusiveY: number, width: number, height: number, subgrid: SubgridInterface) {
        const area = this._selection.selectRectangle(exclusiveX, exclusiveY, width, height, subgrid);
        const focusPoint = area.inclusiveFirst;
        this._checkFocusEventer(focusPoint.x, focusPoint.y, subgrid);
    }

    focusSelectOnlyCell(activeColumnIndex: number, subgridRowIndex: number, subgrid: SubgridInterface, areaType: SelectionArea.Type) {
        this._selection.selectOnlyCell(activeColumnIndex, subgridRowIndex, subgrid, areaType);
        this._checkFocusEventer(activeColumnIndex, subgridRowIndex, subgrid);
    }

    selectOnlyViewCell(viewLayoutColumnIndex: number, viewLayoutRowIndex: number, areaType: SelectionArea.Type) {
        const viewLayoutColumns = this._viewLayout.columns;
        if (viewLayoutColumnIndex < viewLayoutColumns.length) {
            const vc = this._viewLayout.columns[viewLayoutColumnIndex]
            const viewLayoutRows = this._viewLayout.rows;
            if (viewLayoutRowIndex < viewLayoutRows.length) {
                const vr = this._viewLayout.rows[viewLayoutRowIndex];
                this.focusSelectOnlyCell(vc.activeColumnIndex, vr.subgridRowIndex, vr.subgrid, areaType);
            }
        }
    }

    focusReplaceLastArea(exclusiveX: number, exclusiveY: number, width: number, height: number, subgrid: SubgridInterface, areaType: SelectionArea.Type) {
        const area = this._selection.replaceLastArea(exclusiveX, exclusiveY, width, height, subgrid, areaType);
        const focusPoint = area.inclusiveFirst;
        this._checkFocusEventer(focusPoint.x, focusPoint.y, subgrid);
    }

    focusReplaceLastAreaWithRectangle(exclusiveX: number, exclusiveY: number, width: number, height: number, subgrid: SubgridInterface) {
        const area = this._selection.replaceLastAreaWithRectangle(exclusiveX, exclusiveY, width, height, subgrid);
        const focusPoint = area.inclusiveFirst;
        this._checkFocusEventer(focusPoint.x, focusPoint.y, subgrid);
    }

    focusSelectAddCell(x: number, y: number, subgrid: SubgridInterface, areaType: SelectionArea.Type) {
        this._selection.selectCell(x, y, subgrid, areaType);

        if (subgrid === this._focus.subgrid) {
            this._checkFocusEventer(x, y, subgrid);
        }
    }

    focusSelectToggleCell(originX: number, originY: number, subgrid: SubgridInterface, areaType: SelectionArea.Type): boolean {
        const added = this._selection.selectToggleCell(originX, originY, subgrid, areaType);
        if (added) {
            this._checkFocusEventer(originX, originY, subgrid);
        }
        return added;
    }

    selectOnlyFocusedCell(areaType: SelectionArea.Type) {
        const focusPoint = this._focus.currentSubgridPoint;
        if (focusPoint !== undefined) {
            const focusX = focusPoint.x;
            const focusY = focusPoint.y;
            const selection = this._selection;
            selection.beginChange();
            try {
                selection.clear();
                this.focusSelectOnlyCell(focusX, focusY, this._focus.subgrid, areaType);
            } finally {
                selection.endChange();
            }
        }
    }
}

export namespace FocusSelectBehavior {
    export type CheckFocusEventer = (this: void, activeColumnIndex: number, subgridRowIndex: number, subgrid: SubgridInterface) => void;
}
