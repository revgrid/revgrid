import { SubgridInterface } from '../common/subgrid-interface';
import { Focus } from '../focus';
import { UnreachableCaseError } from '../lib/revgrid-error';
import { SelectionArea } from '../lib/selection-area';
import { Viewport } from '../renderer/viewport';
import { Selection } from '../selection/selection';
import { Mouse } from '../user-interface-input/mouse';

export class SelectionBehavior {
    constructor(
        private readonly _selection: Selection,
        private readonly _focus: Focus,
        private readonly _viewport: Viewport,
        private readonly _mouse: Mouse,
        private readonly _repaintEventer: FocusSelectionBehavior.RepaintEventer,
        private readonly _selectionChangedEventer: FocusSelectionBehavior.SelectionChangedEventer,
        private readonly _focusEventer: FocusSelectionBehavior.FocusEventer,
    ) {
        this._selection.changedEventer = () => {
            this._selectionChangedEventer();
            this._repaintEventer();
        }
    }

    destroy() {
        //
    }

    /** Call before multiple selection changes to consolidate SelectionChange events.
     * Pair with endSelectionChange().
     */
    beginSelectionChange() {
        this._selection.beginChange();
    }

    /** Call after multiple selection changes to consolidate SelectionChange events.
     * Pair with beginSelectionChange().
     */
    endSelectionChange() {
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

    selectOnlyColumn(activeColumnIndex: number) {
        const selection = this._selection;
        const rowIndex = this._focus.x ?? 0;
        selection.beginChange();
        try {
            selection.clear();
            selection.selectColumns(activeColumnIndex, rowIndex, 1, 1, this._focus.subgrid);
        } finally {
            selection.endChange();
        }
    }

    selectOnlyRow(subgridRowIndex: number, subgrid: SubgridInterface) {
        const selection = this._selection;
        const columnIndex = this._focus.x ?? 0;
        selection.beginChange();
        try {
            selection.clear();
            this._selection.selectRows(columnIndex, subgridRowIndex, 1, 1, subgrid);
        } finally {
            selection.endChange();
        }
    }

    selectAllRows() {
        this._selection.selectAllRows();
    }

    selectOnlyRectangle(exclusiveX: number, exclusiveY: number, width: number, height: number, subgrid: SubgridInterface) {
        const selection = this._selection;
        let area: SelectionArea;
        selection.beginChange();
        try {
            selection.clear();
            area = this._selection.selectRectangle(exclusiveX, exclusiveY, width, height, subgrid);
        } finally {
            selection.endChange();
        }

        if (subgrid === this._focus.subgrid) {
            const focusPoint = area.inclusiveFirst;
            this._focusEventer(focusPoint.x, focusPoint.y);
        }
    }

    selectOnlyCell(activeColumnIndex: number, subgridRowIndex: number, subgrid: SubgridInterface, areaTypeSpecifier: SelectionArea.TypeSpecifier) {
        const selection = this._selection;

        if (subgrid === this._focus.subgrid) {
            this._focusEventer(activeColumnIndex, subgridRowIndex);
        }

        selection.beginChange();
        try {
            selection.clear();
            selection.selectOnlyCell(activeColumnIndex, subgridRowIndex, subgrid, areaTypeSpecifier);
        } finally {
            selection.endChange();
        }
    }

    selectOnlyViewportCell(viewportColumnIndex: number, viewportRowIndex: number, areaTypeSpecifier: SelectionArea.TypeSpecifier) {
        const viewportColumns = this._viewport.columns;
        if (viewportColumnIndex < viewportColumns.length) {
            const vc = this._viewport.columns[viewportColumnIndex]
            const viewportRows = this._viewport.rows;
            if (viewportRowIndex < viewportRows.length) {
                const vr = this._viewport.rows[viewportRowIndex];
                this.selectOnlyCell(vc.activeColumnIndex, vr.subgridRowIndex, vr.subgrid, areaTypeSpecifier);
            }
        }
    }

    replaceLastArea(exclusiveX: number, exclusiveY: number, width: number, height: number, subgrid: SubgridInterface, areaTypeSpecifier: SelectionArea.TypeSpecifier) {
        this._selection.beginChange();
        try {
            this._selection.deselectLastArea();
            const area = this._selection.selectArea(exclusiveX, exclusiveY, width, height, subgrid, areaTypeSpecifier);
            if (subgrid === this._focus.subgrid) {
                const focusPoint = area.inclusiveFirst;
                this._focusEventer(focusPoint.x, focusPoint.y);
            }
        } finally {
            this._selection.endChange();
        }
    }

    replaceLastAreaWithRectangle(exclusiveX: number, exclusiveY: number, width: number, height: number, subgrid: SubgridInterface) {
        this._selection.beginChange();
        try {
            this._selection.deselectLastArea();
            const area = this._selection.selectRectangle(exclusiveX, exclusiveY, width, height, subgrid);
            if (subgrid === this._focus.subgrid) {
                const focusPoint = area.inclusiveFirst;
                this._focusEventer(focusPoint.x, focusPoint.y);
            }
        } finally {
            this._selection.endChange();
        }
    }

    replaceLastAreaWithColumns(exclusiveX: number, y: number, width: number, height: number, subgrid: SubgridInterface) {
        this._selection.beginChange();
        try {
            this._selection.deselectLastArea();
            this._selection.selectColumns(exclusiveX, y, width, height, subgrid);
        } finally {
            this._selection.endChange();
        }
    }

    replaceLastAreaWithRows(exclusiveX: number, y: number, width: number, height: number, subgrid: SubgridInterface) {
        this._selection.beginChange();
        try {
            this._selection.deselectLastArea();
            this._selection.selectRows(exclusiveX, y, width, height, subgrid);
        } finally {
            this._selection.endChange();
        }
    }

    selectAddCell(x: number, y: number, subgrid: SubgridInterface, areaTypeSpecifier: SelectionArea.TypeSpecifier) {
        this._selection.selectCell(x, y, subgrid, areaTypeSpecifier);

        if (subgrid === this._focus.subgrid) {
            this._focusEventer(x, y);
        }
    }

    selectToggleCell(originX: number, originY: number, subgrid: SubgridInterface, areaTypeSpecifier: SelectionArea.TypeSpecifier): boolean {
        const cellCoveringSelectionAreas = this._selection.getAreasCoveringCell(originX, originY, this._focus.subgrid);
        const priorityCoveringArea = this.getPriorityCellCoveringSelectionArea(cellCoveringSelectionAreas);
        if (priorityCoveringArea === undefined) {
            this.selectAddCell(originX, originY, subgrid, areaTypeSpecifier);
            return true;
        } else {
            const selection  = this._selection;
            selection.beginChange();
            try {
                if (subgrid === this._focus.subgrid) {
                    this._focusEventer(originX, originY);
                }

                const priorityCoveringAreaType = priorityCoveringArea.areaType;
                switch (priorityCoveringAreaType) {
                    case SelectionArea.Type.Rectangle: {
                        selection.deselectRectangle(priorityCoveringArea);
                        break;
                    }
                    case SelectionArea.Type.Column: {
                        selection.deselectColumns(originX, originX);
                        break;
                    }
                    case SelectionArea.Type.Row: {
                        selection.deselectRows(originY, 1);
                        break;
                    }
                }
            } finally {
                this.endSelectionChange();
            }
            return false;
        }
    }

    selectRemoveCellArea(x: number, y: number) {
        this._selection.deselectCellArea(x, y);
    }


    selectOnlyFocusedCell(areaTypeSpecifier: SelectionArea.TypeSpecifier) {
        const focusPoint = this._focus.current;
        if (focusPoint !== undefined) {
            const focusX = focusPoint.x;
            const focusY = focusPoint.y;
            const selection = this._selection;
            selection.beginChange();
            try {
                selection.clear();
                this.selectOnlyCell(focusX, focusY, this._focus.subgrid, areaTypeSpecifier);
            } finally {
                selection.endChange();
            }
        }
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

export namespace FocusSelectionBehavior {
    export type RepaintEventer = (this: void) => void;
    export type SelectionChangedEventer = (this: void) => void;
    export type FocusEventer = (this: void, activeColumnIndex: number, subgridRowIndex: number) => void;
}
