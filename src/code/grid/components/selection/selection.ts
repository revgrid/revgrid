
import { DataModel } from '../../interfaces/data-model';
import { GridSettings } from '../../interfaces/grid-settings';
import { SubgridInterface } from '../../interfaces/subgrid-interface';
import { ContiguousIndexRange } from '../../lib/contiguous-index-range';
import { Corner } from '../../lib/corner';
import { RectangleInterface } from '../../lib/rectangle-interface';
import { AssertError, UnreachableCaseError } from '../../lib/revgrid-error';
import { SelectionArea } from '../../lib/selection-area';
import { calculateNumberArrayUniqueCount } from '../../lib/utils';
import { ColumnsManager } from '../column/columns-manager';
import { LastSelectionArea } from './last-selection-area';
import { SelectionRangeList } from './selection-range-list';
import { SelectionRectangle } from './selection-rectangle';
import { SelectionRectangleList } from './selection-rectangle-list';

/**
 *
 * @desc We represent selections as a list of rectangles because large areas can be represented and tested against quickly with a minimal amount of memory usage. Also we need to maintain the selection rectangles flattened counter parts so we can test for single dimension contains. This is how we know to highlight the fixed regions on the edges of the grid.
 */

export class Selection {
    changedEventerForRenderer: Selection.ChangedEventer;
    changedEventerForEventBehavior: Selection.ChangedEventer;

    readonly rows = new SelectionRangeList();
    readonly columns = new SelectionRangeList();
    readonly rectangleList = new SelectionRectangleList();

    private _subgrid: SubgridInterface | undefined;
    private _lastArea: LastSelectionArea | undefined;
    private _allRowsSelected = false;

    private _beginChangeCount = 0;
    private _changed = false;
    private _silentlyChanged = false;

    private _snapshot: Selection | undefined;

    constructor(
        private readonly _gridSettings: GridSettings,
        private readonly _columnsManager: ColumnsManager,
    ) {
    }

    get subgrid() { return this._subgrid; }

    get areaCount(): number { return this.rectangleList.areaCount + this.rows.areaCount + this.columns.areaCount; }
    get lastArea() { return this._lastArea; }

    get allRowsSelected() { return this._allRowsSelected; }

    destroy() {
        //
    }

    /** Call before multiple selection changes to consolidate Selection Change events.
     * Pair with endChange().
     */
    beginChange() {
        ++this._beginChangeCount;
    }

    /** Call after multiple selection changes to consolidate SelectionChange events.
     * Pair with beginSelectionChange().
     */
    endChange() {
        if (--this._beginChangeCount === 0) {
            if (this._changed) {
                this._changed = false;
                const silentlyChanged = this._silentlyChanged;
                this._silentlyChanged = false;

                // const gridProps = this._gridProperties;

                // if (!gridProps.checkboxOnlyRowSelections && gridProps.autoSelectRows) {
                //     // Project the cell selection into the rows
                //     this.selectRowsFromCellsOrLastRectangle();
                // }

                // if (gridProps.autoSelectColumns) {
                //     // Project the cell selection into the columns
                //     this.selectColumnsFromRectangles();
                // }

                if (!silentlyChanged) {
                    this.changedEventerForRenderer();
                    this.changedEventerForEventBehavior();
                }
            }
        } else {
            if (this._beginChangeCount < 0) {
                throw new AssertError('SMEC91004', 'Mismatched SelectionModel begin/endChange callback');
            }
        }
    }

    assign(other: Selection) {
        this.rectangleList.assign(other.rectangleList);
        this.rows.assign(other.rows);
        this.columns.assign(other.columns);
        this._allRowsSelected = other._allRowsSelected;
        this._subgrid = other._subgrid;
    }

    createStash(): Selection.Stash {
        const rowIds = this.createRowsStash();
        const columnNames = this.createColumnsStash();

        return {
            subgrid: this._subgrid,
            allRowsSelected: this.allRowsSelected,
            rowIds,
            columnNames,
        };
    }

    restoreStash(stash: Selection.Stash) {
        this.beginChange();
        try {
            this.clear();
            this._subgrid = stash.subgrid;
            this._allRowsSelected = stash.allRowsSelected;
            this.restoreRowsStash(stash.rowIds);
            this.restoreColumnsStash(stash.columnNames);
        } finally {
            this.endChange();
        }
    }

    saveSnapshot() {
        this._snapshot = new Selection(
            this._gridSettings,
            this._columnsManager,
        );
        this._snapshot.assign(this);
    }

    restoreSavedSnapshot() {
        const snapshot = this._snapshot;
        if (snapshot === undefined) {
            throw new AssertError('SRSS50012');
        } else {
            this.assign(snapshot);
        }
        this._snapshot = undefined;
    }

    deleteSavedSnapshot() {
        this._snapshot = undefined;
    }

    // selectRowsFromCellsOrLastRectangle() {
    //     if (!this._gridProperties.singleRowSelectionMode) {
    //         this.selectRowsFromRectangles(0, true);
    //     } else {
    //         const last = this.getLastRectangle();
    //         if (last !== undefined) {
    //             this.clearRowSelection();
    //             const columnIndex = last.first.x
    //             const start = last.origin.y;
    //             const stop = last.corner.y;
    //             this.selectRows(start, stop, undefined, columnIndex);
    //         } else {
    //             this.clearRowSelection();
    //         }
    //     }
    //     this.changedEventer();
    // }

    getLastRectangle() {
        return this.rectangleList.getLastRectangle();
    }

    /**
     * @desc empty out all our state
     */
    clear() {
        this.beginChange();
        try {
            let changed = false;
            if (this.rectangleList.has) {
                this.rectangleList.clear();
                changed = true;
            }

            if (!this.columns.isEmpty()) {
                this.columns.clear();
                changed = true;
            }

            if (!this.rows.isEmpty() || this._allRowsSelected) {
                this.rows.clear();
                this._allRowsSelected = false;
                changed = true;
            }

            this._lastArea = undefined;

            if (changed) {
                this.flagChanged(false); // was previously not flagged as changed
            }
        } finally {
            this.endChange();
        }
    }

    selectOnlyCell(x: number, y: number, subgrid: SubgridInterface, areaType: SelectionArea.Type) {
        this.beginChange();
        try {
            this.clear();
            this.selectCell(x, y, subgrid, areaType);
        } finally {
            this.endChange();
        }
    }

    selectCell(x: number, y: number, subgrid: SubgridInterface, areaType: SelectionArea.Type) {
        this.beginChange();
        try {
            if (subgrid !== this._subgrid) {
                this.clear();
                this._subgrid = subgrid;
            }
            this.selectArea(x, y, 1, 1, subgrid, areaType);
        } finally {
            this.endChange();
        }
    }

    deselectCellArea(x: number, y: number, subgrid: SubgridInterface) {
        const rectangle: RectangleInterface = {
            x,
            y,
            width: 1,
            height: 1,
        }
        this.deselectRectangle(rectangle, subgrid);
    }

    selectArea(firstInexclusiveX: number, firstExclusiveY: number, width: number, height: number, subgrid: SubgridInterface, areaType: SelectionArea.Type) {
        this.beginChange();
        try {
            let area: SelectionArea;
            switch (areaType) {
                case SelectionArea.Type.Rectangle: {
                    area = this.selectRectangle(firstInexclusiveX, firstExclusiveY, width, height, subgrid,);
                    break;
                }
                case SelectionArea.Type.Column: {
                    area = this.selectColumns(firstInexclusiveX, firstExclusiveY, width, height, subgrid);
                    break;
                }
                case SelectionArea.Type.Row: {
                    area = this.selectRows(firstInexclusiveX, firstExclusiveY, width, height, subgrid);
                    break;
                }
                default:
                    throw new UnreachableCaseError('SSA34499', areaType)
            }

            return area;
        } finally {
            this.endChange();
        }
    }

    deselectLastArea() {
        const lastArea = this._lastArea;
        this._lastArea = undefined;
        if (lastArea !== undefined) {
            const subgrid = this._subgrid;
            if (subgrid === undefined) {
                throw new AssertError('SDLA13690');
            } else {
                switch (lastArea.areaType) {
                    case SelectionArea.Type.Rectangle: {
                        this.deselectRectangle(lastArea, subgrid);
                        break;
                    }
                    case SelectionArea.Type.Column: {
                        this.deselectColumns(lastArea.x, lastArea.width, subgrid);
                        break;
                    }
                    case SelectionArea.Type.Row: {
                        this.deselectRows(lastArea.y, lastArea.height, subgrid);
                        break;
                    }
                    default:
                        throw new UnreachableCaseError('SDLA34499', lastArea.areaType)
                }
            }
        }
    }

    selectOnlyRectangle(firstInexclusiveX: number, firstInexclusiveY: number, width: number, height: number, subgrid: SubgridInterface) {
        this.beginChange();
        try {
            this.clear();
            return this.selectRectangle(firstInexclusiveX, firstInexclusiveY, width, height, subgrid);
        } finally {
            this.endChange();
        }
    }

    selectRectangle(firstInexclusiveX: number, firstInexclusiveY: number, width: number, height: number, subgrid: SubgridInterface, silent = false) {
        this.beginChange();
        try {
            if (this.areaCount > 0) {
                this.saveSnapshot(); // may not want this anymore
            }

            if (subgrid !== this._subgrid) {
                this.clear();
                this._subgrid = subgrid;
            }

            if (!this._gridSettings.multipleSelectionAreas) {
                this.clear();
            }

            const rectangle = new SelectionRectangle(firstInexclusiveX, firstInexclusiveY, width, height);
            this.rectangleList.push(rectangle);
            this._lastArea = new LastSelectionArea(SelectionArea.Type.Rectangle, firstInexclusiveX, firstInexclusiveY, width, height);

            this.flagChanged(silent);

        } finally {
            this.endChange()
        }

        return this._lastArea;
    }

    deselectRectangle(rectangle: RectangleInterface, subgrid: SubgridInterface) {
        if (subgrid === this._subgrid) {
            const index = this.rectangleList.findIndex(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
            if (index >= 0) {
                const lastArea = this._lastArea;
                if (lastArea !== undefined && RectangleInterface.isEqual(lastArea, rectangle)) {
                    this._lastArea = undefined;
                }
                this.rectangleList.removeAt(index)
            }
        }
    }

    selectOnlyAllRows(subgrid: SubgridInterface) {
        this.beginChange();
        if (subgrid !== this._subgrid || !this._allRowsSelected) {
            this._changed = true;
        }
        this.clear();
        if (this._changed) {
            this._subgrid = subgrid;
            this._allRowsSelected = true;
        }
        this.endChange();
    }

    selectAllRows(subgrid: SubgridInterface) {
        this.beginChange();
        if (!this._allRowsSelected) {
            this._changed = true;
        }
        if (subgrid !== this._subgrid) {
            this.clear();
            this._subgrid = subgrid;
            this._changed = true;
        }
        this._allRowsSelected = true;
        this.endChange();
    }

    deselectAllRows() {
        if (this._allRowsSelected) {
            this.beginChange();
            this._allRowsSelected = false;
            this._changed = true;
            this.endChange();
        }
    }

    setAllRowsSelected(value: boolean) {
        if (value !== this._allRowsSelected) {
            this.beginChange();
            this._allRowsSelected = value;
            this._changed = true;
            this.endChange();
        }
    }

    /** Parameters specify a rectangle in Data, the rows of which will be selected */
    selectRows(x: number, inexclusiveY: number, width: number, height: number, subgrid: SubgridInterface) {
        this.beginChange();
        try {
            if (subgrid !== this._subgrid) {
                this.clear();
                this._subgrid = subgrid;
            }

            if (!this._gridSettings.multipleSelectionAreas) {
                this.clear();
            }

            const changed = this.rows.add(inexclusiveY, height);
            const lastArea = new LastSelectionArea(SelectionArea.Type.Row, x, inexclusiveY, width, height);
            if (changed) {
                this._lastArea = lastArea;
                this.flagChanged(false);
            }

            return lastArea;
        } finally {
            this.endChange();
        }
    }

    deselectRows(y: number, count: number, subgrid: SubgridInterface) {
        if (subgrid === this._subgrid) {
            const changed = this.rows.delete(y, count);
            if (changed) {
                const lastArea = this._lastArea;
                if (lastArea !== undefined && lastArea.areaType === SelectionArea.Type.Row) {
                    const oldFirst = lastArea.exclusiveFirst;
                    const oldLast = lastArea.exclusiveLast;
                    const oldStart = oldFirst.y;
                    const oldLength = oldLast.y - oldStart;
                    const overlapRange = this.rows.calculateOverlapRange(oldStart, oldLength);
                    if (overlapRange === undefined) {
                        this._lastArea = undefined;
                    } else {
                        const lastX = oldFirst.x;
                        const lastWidth = oldLast.x - lastX;
                        const overlapStart = overlapRange.start;
                        const overlapLength = overlapRange.length;
                        let lastExclusiveY: number;
                        let lastHeight: number;
                        // set lastY and lastHeight so that last area still specifies the same corner
                        if (oldLength >= 0) {
                            lastExclusiveY = overlapStart;
                            lastHeight = overlapLength;
                        } else {
                            lastExclusiveY = overlapStart + overlapLength;
                            lastHeight = -overlapLength;
                        }

                        this._lastArea = new LastSelectionArea(SelectionArea.Type.Row, lastX, lastExclusiveY, lastWidth, lastHeight);
                    }
                }
            }
        }
    }

    selectToggleRow(x: number, inexclusiveY: number, subgrid: SubgridInterface) {
        this.selectRows(x, inexclusiveY, 1, 1, subgrid); // implement properly in future
    }

    selectColumns(inexclusiveX: number, y: number, width: number, height: number, subgrid: SubgridInterface) {
        this.beginChange();

        if (subgrid !== this._subgrid) {
            this.clear();
            this._subgrid = subgrid;
        }

        if (!this._gridSettings.multipleSelectionAreas) {
            this.clear();
        }

        const changed = this.columns.add(inexclusiveX, width);
        const lastArea = new LastSelectionArea(SelectionArea.Type.Column, inexclusiveX, y, width, height);
        if (changed) {
            this._lastArea = lastArea;
            this.flagChanged(false);
        }
        this.endChange();

        return lastArea;
    }

    deselectColumns(x: number, count: number, subgrid: SubgridInterface) {
        if (subgrid === this._subgrid) {
            const changed = this.columns.delete(x, count);
            if (changed) {
                const lastArea = this._lastArea;
                if (lastArea !== undefined && lastArea.areaType === SelectionArea.Type.Column) {
                    const oldFirst = lastArea.exclusiveFirst;
                    const oldLast = lastArea.exclusiveLast;
                    const oldStart = oldFirst.x;
                    const oldLength = oldLast.x - oldStart;
                    const overlapRange = this.columns.calculateOverlapRange(oldStart, oldLength);
                    if (overlapRange === undefined) {
                        this._lastArea = undefined;
                    } else {
                        const lastY = oldFirst.y;
                        const lastHeight = oldLast.y - lastY;
                        const overlapStart = overlapRange.start;
                        const overlapLength = overlapRange.length;
                        let lastInexclusiveX: number;
                        let lastWidth: number;
                        // set lastX and lastWidth so that last area still specifies the same corner
                        if (oldLength >= 0) {
                            lastInexclusiveX = overlapStart;
                            lastWidth = overlapLength;
                        } else {
                            lastInexclusiveX = overlapStart + overlapLength;
                            lastWidth = -overlapLength;
                        }

                        this._lastArea = new LastSelectionArea(SelectionArea.Type.Column, lastInexclusiveX, lastY, lastWidth, lastHeight);
                    }
                }
            }
        }
    }

    selectToggleColumn(inexclusiveX: number, y: number, subgrid: SubgridInterface) {
        this.selectColumns(inexclusiveX, y, 1, 1, subgrid); // implement properly in future
    }

    replaceLastArea(inexclusiveX: number, inexclusiveY: number, width: number, height: number, subgrid: SubgridInterface, areaType: SelectionArea.Type) {
        this.beginChange();
        try {
            this.deselectLastArea();
            return this.selectArea(inexclusiveX, inexclusiveY, width, height, subgrid, areaType);
        } finally {
            this.endChange();
        }
    }

    replaceLastAreaWithRectangle(inexclusiveX: number, inexclusiveY: number, width: number, height: number, subgrid: SubgridInterface) {
        this.beginChange();
        try {
            this.deselectLastArea();
            return this.selectRectangle(inexclusiveX, inexclusiveY, width, height, subgrid);
        } finally {
            this.endChange();
        }
    }

    replaceLastAreaWithColumns(inexclusiveX: number, y: number, width: number, height: number, subgrid: SubgridInterface) {
        this.beginChange();
        try {
            this.deselectLastArea();
            return this.selectColumns(inexclusiveX, y, width, height, subgrid);
        } finally {
            this.endChange();
        }
    }

    replaceLastAreaWithRows(x: number, inexclusiveY: number, width: number, height: number, subgrid: SubgridInterface) {
        this.beginChange();
        try {
            this.deselectLastArea();
            return this.selectRows(x, inexclusiveY, width, height, subgrid);
        } finally {
            this.endChange();
        }
    }

    selectToggleCell(originX: number, originY: number, subgrid: SubgridInterface, areaType: SelectionArea.Type): boolean {
        const cellCoveringSelectionAreas = this.getAreasCoveringCell(originX, originY, subgrid);
        const priorityCoveringArea = SelectionArea.getPriorityCellCoveringSelectionArea(cellCoveringSelectionAreas);
        if (priorityCoveringArea === undefined) {
            this.selectCell(originX, originY, subgrid, areaType);
            return true;
        } else {
            this.beginChange();
            try {
                const priorityCoveringAreaType = priorityCoveringArea.areaType;
                switch (priorityCoveringAreaType) {
                    case SelectionArea.Type.Rectangle: {
                        this.deselectRectangle(priorityCoveringArea, subgrid);
                        break;
                    }
                    case SelectionArea.Type.Column: {
                        this.deselectColumns(originX, originX, subgrid);
                        break;
                    }
                    case SelectionArea.Type.Row: {
                        this.deselectRows(originY, 1, subgrid);
                        break;
                    }
                }
            } finally {
                this.endChange();
            }
            return false;
        }
    }

    // /**
    //  * @desc Remove the last selection that was created.
    //  */
    // clearMostRecentRectangleSelection() {
    //     this.beginChange();
    //     try {
    //         console.debug('clearmostrecent');
    //         const keepRowSelections = this._gridProperties.checkboxOnlyRowSelections;
    //         if (!keepRowSelections) {
    //             this.allRowsSelected = false;
    //         }
    //         const changed = this.rectangleList.removeLast();
    //         this.setLastSelectionType(SelectionArea.Type.Rectangle, !this.rectangleList.has);

    //         if (changed) {
    //             this.flagChanged(false);
    //         }
    //     } finally {
    //         this.endChange();
    //     }
    // }

    // restorePreviousColumnSelection() {
    //     this.columns.restorePreviousSelection();
    //     this.setLastSelectionType(SelectionArea.Type.Column, !this.columns.ranges.length);
    // }

    // restorePreviousRowSelection() {
    //     this.rows.restorePreviousSelection();
    //     this.setLastSelectionType(SelectionArea.Type.Row, !this.rows.ranges.length);
    // }

    // clearRowSelection() {
    //     this.beginChange();
    //     this.allRowsSelected = false;
    //     this.rows.clear();
    //     this.setLastSelectionType(SelectionArea.Type.Row, !this.rows.ranges.length);
    //     this.endChange();
    // }

    // hasRowSelections() {
    //     return !this.rows.isEmpty();
    // }

    // hasColumnSelections() {
    //     return !this.columns.isEmpty();
    // }

    /**
     * @summary Selection query function.
     * @returns The given cell is selected (part of an active selection).
     */
    isCellSelectedInAnyAreaType(x: number, y: number, subgrid: SubgridInterface): boolean {
        const { rowSelected, columnSelected, cellSelected } = this.getCellSelectedAreaTypes(x, y, subgrid);
        return (rowSelected || columnSelected || cellSelected);
    }

    // isRowSelected(y: number, subgrid: Subgrid | undefined) {
    //     const selected =
    //         (subgrid === undefined || subgrid === this.focusedSubgrid)
    //         &&
    //         (this._allRowsSelected || this.rows.includesIndex(y));
    //     return selected;
    // }

    getCellSelectedAreaTypes(x: number, y: number, subgrid: SubgridInterface): Selection.CellSelectedAreaTypes {
        if (subgrid === this._subgrid) {
            return {
                rowSelected: this._allRowsSelected || this.rows.includesIndex(y),
                columnSelected: this.columns.includesIndex(x),
                cellSelected: this.rectangleList.anyContainPoint(x, y),
            };
        } else {
            return {
                rowSelected: false,
                columnSelected: false,
                cellSelected: false,
            };
        }
    }

    getRowCount() {
        if (this.allRowsSelected) {
            if (this._subgrid === undefined) {
                throw new AssertError('SGRC66698');
            } else {
                return this._subgrid.getRowCount();
            }
        } else {
            if (this.rows.isEmpty()) {
                return this.rectangleList.getUniqueXIndices();
            } else {
                if (this.rectangleList.isEmpty()) {
                    return this.rows.getIndexCount();
                } else {
                    const rangeIndices = this.rows.getIndices();
                    const rectangleIndices = this.rectangleList.getNonUniqueXIndices();
                    const allIndices = [...rangeIndices, ...rectangleIndices];
                    return calculateNumberArrayUniqueCount(allIndices);
                }
            }
        }
    }

    getRowIndices() {
        if (this.allRowsSelected) {
            if (this._subgrid === undefined) {
                throw new AssertError('SGRI66698');
            } else {
                const rowCount = this._subgrid.getRowCount();
                const result = new Array<number>(rowCount);
                for (let i = 0; i < rowCount; i++) {
                    result[i] = i;
                }
                return result;
            }
        } else {
            return this.rows.getIndices();
        }
    }

    getColumnIndices() {
        return this.columns.getIndices();
    }

    isColumnOrRowSelected() {
        return !this.columns.isEmpty() || !this.rows.isEmpty();
    }

    // getRectangleFlattenedYs() {
    //     this.rectangleList.getFlattenedYs();
    // }

    getAreasCoveringCell(x: number, y: number, subgrid: SubgridInterface | undefined) {
        let result: SelectionArea[];
        if (subgrid !== undefined && subgrid !== this._subgrid) {
            result = [];
        } else {
            if (this._allRowsSelected) {
                const area = this.createAreaFromAllRows();
                if (area === undefined) {
                    result = [];
                } else {
                    result = [area];
                }
            } else {
                const range = this.rows.findRangeWithIndex(y);
                if (range === undefined) {
                    result = [];
                } else {
                    const area = this.createAreaFromRowRange(range);
                    result = [area];
                }
            }

            const columnRange = this.columns.findRangeWithIndex(x);
            if (columnRange !== undefined) {
                const area = this.createAreaFromColumnRange(columnRange);
                result.push(area);
            }

            const rectangles =  this.rectangleList.getRectanglesContainingPoint(x, y);
            for (const rectangle of rectangles) {
                result.push(rectangle);
            }

        }

        return result;
    }

    isPointInLastArea(x: number, y: number) {
        const lastArea = this._lastArea;
        if (lastArea === undefined) {
            return false;
        } else {
            return lastArea.containsXY(x, y);
        }
    }

    calculateAreaTypeFromSpecifier(specifier: SelectionArea.TypeSpecifier): SelectionArea.Type {
        switch (specifier) {
            case SelectionArea.TypeSpecifier.Primary: return this._gridSettings.primarySelectionAreaType;
            case SelectionArea.TypeSpecifier.Secondary: return this._gridSettings.secondarySelectionAreaType;
            case SelectionArea.TypeSpecifier.Rectangle: return SelectionArea.Type.Rectangle;
            case SelectionArea.TypeSpecifier.Row: return SelectionArea.Type.Row;
            case SelectionArea.TypeSpecifier.Column: return SelectionArea.Type.Column;
            case SelectionArea.TypeSpecifier.LastOrPrimary: {
                const lastArea = this._lastArea;
                if (lastArea === undefined) {
                    return this.calculateAreaTypeFromSpecifier(SelectionArea.TypeSpecifier.Primary);
                } else {
                    return lastArea.areaType;
                }
            }
            default:
                throw new UnreachableCaseError('SCAT60711', specifier);
        }
    }

    adjustForRowsInserted(rowIndex: number, rowCount: number, dataModel: DataModel) {
        const subgrid = this._subgrid;
        if (subgrid !== undefined && dataModel === subgrid.dataModel) {
            this.beginChange();
            try {
                const lastArea = this._lastArea;
                if (lastArea !== undefined) {
                    lastArea.adjustForYRangeInserted(rowIndex, rowCount);
                }

                let changed = this.rectangleList.adjustForYRangeInserted(rowIndex, rowCount);
                if (this.rows.adjustForInserted(rowIndex, rowCount)) {
                    changed = true;
                }

                if (changed) {
                    this.flagChanged(false);
                }
            } finally {
                this.endChange();
            }

            const snapshot = this._snapshot;
            if (snapshot !== undefined) {
                snapshot.adjustForRowsInserted(rowIndex, rowCount, dataModel);
            }
        }
    }

    adjustForRowsDeleted(rowIndex: number, rowCount: number, dataModel: DataModel) {
        const subgrid = this._subgrid;
        if (subgrid !== undefined && dataModel === subgrid.dataModel) {
            this.beginChange();
            try {
                const lastArea = this._lastArea;
                if (lastArea !== undefined) {
                    lastArea.adjustForYRangeDeleted(rowIndex, rowCount);
                }

                let changed = this.rectangleList.adjustForYRangeDeleted(rowIndex, rowCount);
                if (this.rows.adjustForDeleted(rowIndex, rowCount)) {
                    changed = true;
                }

                if (changed) {
                    this.flagChanged(false);
                }
            } finally {
                this.endChange();
            }

            const snapshot = this._snapshot;
            if (snapshot !== undefined) {
                snapshot.adjustForRowsDeleted(rowIndex, rowCount, dataModel);
            }
        }
    }

    adjustForRowsMoved(oldRowIndex: number, newRowIndex: number, count: number, dataModel: DataModel) {
        const subgrid = this._subgrid;
        if (subgrid !== undefined && dataModel === subgrid.dataModel) {
            this.beginChange();
            try {
                const lastArea = this._lastArea;
                if (lastArea !== undefined) {
                    lastArea.adjustForYRangeMoved(oldRowIndex, newRowIndex, count);
                }

                let changed = this.rectangleList.adjustForYRangeMoved(oldRowIndex, newRowIndex, count);
                if (this.rows.adjustForMoved(oldRowIndex, newRowIndex, count)) {
                    changed = true;
                }

                if (changed) {
                    this.flagChanged(false);
                }
            } finally {
                this.endChange();
            }

            const snapshot = this._snapshot;
            if (snapshot !== undefined) {
                snapshot.adjustForRowsMoved(oldRowIndex, newRowIndex, count, dataModel);
            }
        }
    }

    adjustForColumnsInserted(columnIndex: number, columnCount: number) {
        this.beginChange();
        try {
            const lastArea = this._lastArea;
            if (lastArea !== undefined) {
                lastArea.adjustForXRangeInserted(columnIndex, columnCount);
            }

            let changed = this.rectangleList.adjustForXRangeInserted(columnIndex, columnCount);
            if (this.columns.adjustForInserted(columnIndex, columnCount)) {
                changed = true;
            }

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }

        const snapshot = this._snapshot;
        if (snapshot !== undefined) {
            snapshot.adjustForColumnsInserted(columnIndex, columnCount);
        }
    }

    adjustForColumnsDeleted(columnIndex: number, columnCount: number) {
        this.beginChange();
        try {
            const lastArea = this._lastArea;
            if (lastArea !== undefined) {
                lastArea.adjustForXRangeDeleted(columnIndex, columnCount);
            }

            let changed = this.rectangleList.adjustForXRangeDeleted(columnIndex, columnCount);
            if (this.columns.adjustForDeleted(columnIndex, columnCount)) {
                changed = true;
            }

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }

        const snapshot = this._snapshot;
        if (snapshot !== undefined) {
            snapshot.adjustForColumnsDeleted(columnIndex, columnCount);
        }
    }

    adjustForColumnsMoved(oldColumnIndex: number, newColumnIndex: number, count: number) {
        this.beginChange();
        try {
            const lastArea = this._lastArea;
            if (lastArea !== undefined) {
                lastArea.adjustForXRangeMoved(oldColumnIndex, newColumnIndex, count);
            }

            let changed = false; // this.rectangleList.adjustForColumnsMoved(oldColumnIndex, newColumnIndex, count); // not yet implemented
            if (this.columns.adjustForMoved(oldColumnIndex, newColumnIndex, count)) {
                changed = true;
            }

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }

        const snapshot = this._snapshot;
        if (snapshot !== undefined) {
            snapshot.adjustForColumnsMoved(oldColumnIndex, newColumnIndex, count);
        }
    }

    private flagChanged(silently: boolean) {
        if (silently) {
            // Can only flag as silently if no other change was silent
            if (!this._changed) {
                this._silentlyChanged = true;
            } else {
                this._silentlyChanged = false;
            }
        }
        this._changed = true;
    }

    private createAreaFromAllRows(): SelectionArea | undefined {
        const subgrid = this._subgrid;
        if (subgrid === undefined) {
            throw new AssertError('SCAFAR34454');
        } else {
            const rowCount = subgrid.getRowCount();
            const activeColumnCount = this._columnsManager.activeColumnCount;
            if (rowCount === 0 || activeColumnCount === 0) {
                return undefined;
            } else {
                const x = 0;
                const y = 0;
                return {
                    x,
                    y,
                    width: activeColumnCount,
                    height: rowCount,
                    areaType: SelectionArea.Type.Row,
                    topLeft: { x, y },
                    inclusiveFirst: { x, y },
                    exclusiveBottomRight: { x: activeColumnCount, y: rowCount },
                    firstCorner: Corner.TopLeft,
                    size: activeColumnCount * rowCount,
                };
            }
        }
    }

    private createAreaFromRowRange(range: ContiguousIndexRange): SelectionArea {
        const activeColumnCount = this._columnsManager.activeColumnCount;
        const x = 0;
        const y = range.start;
        const height = range.length;
        return {
            x,
            y,
            width: activeColumnCount,
            height,
            areaType: SelectionArea.Type.Row,
            topLeft: { x, y },
            inclusiveFirst: { x, y },
            exclusiveBottomRight: { x: activeColumnCount, y: range.after },
            firstCorner: Corner.TopLeft,
            size: activeColumnCount * height,
        };
    }

    private createAreaFromColumnRange(range: ContiguousIndexRange): SelectionArea {
        const subgrid = this._subgrid;
        if (subgrid === undefined) {
            throw new AssertError('SCAFAR34454');
        } else {
            const rowCount = subgrid.getRowCount();
            const x = range.start;
            const y = 0;
            const width = range.length;
            return {
                x,
                y,
                width,
                height: rowCount,
                areaType: SelectionArea.Type.Column,
                topLeft: { x, y },
                inclusiveFirst: { x, y },
                exclusiveBottomRight: { x: range.after, y: rowCount },
                firstCorner: Corner.TopLeft,
                size: width * rowCount,
            };
        }
    }

    /**
     * Save underlying data row indexes backing current grid row selections in `grid.selectedDataRowIndexes`.
     *
     * This call should be paired with a subsequent call to `reselectRowsByUnderlyingIndexes`.
     * @returns Number of selected rows or `undefined` if `restoreRowSelections` is falsy.
     */
    private createRowsStash() {
        if (!this._gridSettings.restoreRowSelections) {
            return undefined;
        } else {
            const subgrid = this._subgrid;
            if (subgrid === undefined) {
                return undefined;
            } else {
                const dataModel = subgrid.dataModel;
                const getRowIdFromIndexFtn = dataModel.getRowIdFromIndex;
                if (getRowIdFromIndexFtn === undefined) {
                    return undefined;
                } else {
                    const boundGetRowIdFromIndexFtn = getRowIdFromIndexFtn.bind(dataModel);
                    const selectedRowIndices = this.getRowIndices();
                    return selectedRowIndices.map( (selectedRowIndex) => boundGetRowIdFromIndexFtn(selectedRowIndex) );
                }
            }
        }
    }

    private restoreRowsStash(rowIds: unknown[] | undefined) {
        if (rowIds !== undefined) {
            const subgrid = this._subgrid;
            if (subgrid === undefined) {
                throw new AssertError('SRRS10987');
            } else {
                const rowIdCount = rowIds.length;
                if (rowIdCount > 0) {
                    const rowCount = subgrid.getRowCount();
                    const dataModel = subgrid.dataModel;

                    let rowIndexValues: number[] | undefined;
                    let rowIndexValueCount = 0;
                    if (dataModel.getRowIndexFromId !== undefined) {
                        rowIndexValues = new Array<number>(rowIdCount);
                        for (let i = 0; i < rowIdCount; i++) {
                            const rowId = rowIds[i];
                            const rowIndex = dataModel.getRowIndexFromId(rowId);
                            if (rowIndex !== undefined) {
                                rowIndexValues[rowIndexValueCount++] = rowIndex;
                            }
                        }
                    } else {
                        if (dataModel.getRowIdFromIndex !== undefined) {
                            rowIndexValues = new Array<number>(rowIdCount);
                            for (let rowIndex = 0; rowIndex < rowCount; ++rowIndex) {
                                const rowId = dataModel.getRowIdFromIndex(rowIndex);
                                const rowIdIndex = rowIds.indexOf(rowId);
                                if (rowIdIndex >= 0) {
                                    rowIndexValues[rowIndexValueCount++] = rowIndex;
                                    rowIds.splice(rowIdIndex, 1);
                                    if (rowIds.length === 0) {
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    if (rowIndexValues !== undefined && rowIndexValueCount > 0) {
                        // Sort selected row indices so that sequential indices can be selected in ranges
                        rowIndexValues.length = rowIndexValueCount;
                        rowIndexValues.sort((left, right) => left - right);
                        let startValue = rowIndexValues[0];
                        let previousValue = startValue;
                        let previousValuePlus1 = previousValue + 1;
                        for (let i = 1; i < rowIndexValueCount; i++) {
                            const value = rowIndexValues[i];
                            if (value !== previousValue) {
                                if (value !== previousValuePlus1) {
                                    this.rows.add(startValue, previousValuePlus1 - startValue);
                                    startValue = value;
                                }
                                previousValue = value;
                                previousValuePlus1 = previousValue + 1;
                            }
                        }
                        this.rows.add(startValue, previousValuePlus1 - startValue);
                    }
                }
            }
        }
    }

    /**
     * Save data column names of current column selections in `grid.selectedColumnNames`.
     *
     * This call should be paired with a subsequent call to `reselectColumnsByNames`.
     * @returns Number of selected columns or `undefined` if `restoreColumnSelections` is falsy.
     */
    private createColumnsStash() {
        if (!this._gridSettings.restoreColumnSelections) {
            return undefined;
        } else {
            const selectedColumns = this.getColumnIndices();
            return selectedColumns.map( (selectedColumnIndex) => this._columnsManager.getActiveColumn(selectedColumnIndex).name );
        }
    }

    private restoreColumnsStash(columnNames: string[] | undefined) {
        if (columnNames !== undefined) {
            const columnNamesCount = columnNames.length;
            if (columnNamesCount > 0) {
                const columnsManager = this._columnsManager;

                const indexValues = new Array<number>(columnNamesCount);
                let indexValueCount = 0;
                for (const columnName in columnNames) {
                    const activeColumnIndex = columnsManager.getActiveColumnIndexByName(columnName);
                    if (activeColumnIndex >= 0) {
                        indexValues[indexValueCount++] = activeColumnIndex;
                    }
                }

                if (indexValues !== undefined && indexValueCount > 0) {
                    // Sort selected column indices so that sequential indices can be selected in ranges
                    indexValues.length = indexValueCount;
                    indexValues.sort((left, right) => left - right);
                    let startValue = indexValues[0];
                    let previousValue = startValue;
                    let previousValuePlus1 = previousValue + 1;
                    for (let i = 1; i < indexValueCount; i++) {
                        const value = indexValues[i];
                        if (value !== previousValue) {
                            if (value !== previousValuePlus1) {
                                this.columns.add(startValue, previousValuePlus1 - startValue);
                                startValue = value;
                            }
                            previousValue = value;
                            previousValuePlus1 = previousValue + 1;
                        }
                    }
                    this.columns.add(startValue, previousValuePlus1 - startValue);
                }
            }
        }
    }
}

/** @public */
export namespace Selection {
    export type ChangedEventer = (this: void) => void;

    export interface CellSelectedAreaTypes {
        rowSelected: boolean;
        columnSelected: boolean;
        cellSelected: boolean;
    }

    export interface Stash {
        readonly subgrid: SubgridInterface | undefined;
        readonly allRowsSelected: boolean,
        readonly rowIds: unknown[] | undefined,
        readonly columnNames: string[] | undefined,
    }
}
