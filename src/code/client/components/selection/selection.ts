
import { RevAssertError, RevClientObject, RevDataServer, RevRectangle, RevSchemaField, RevSelectionAreaType, RevSelectionAreaTypeId, RevSelectionAreaTypeSpecifierId, RevUnreachableCaseError } from '../../../common';
import { RevSubgrid } from '../../interfaces';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../../settings';
import { RevColumnsManager } from '../column/columns-manager';
import { RevFocus } from '../focus/focus';
import { RevContiguousIndexRange } from './contiguous-index-range';
import { RevFirstCornerArea } from './first-corner-area';
import { RevLastSelectionArea } from './last-selection-area';
import { RevSelectionArea } from './selection-area';
import { RevSelectionRangeList } from './selection-range-list';
import { RevSelectionRectangle } from './selection-rectangle';
import { RevSelectionRectangleList } from './selection-rectangle-list';

/**
 * Manages the selection state for a grid, supporting selection of rows, columns, rectangles, and the entire grid.
 *
 * @typeParam BGS - Type of the grid settings.
 * @typeParam BCS - Type of the column settings.
 * @typeParam SF - Type of the schema field.
 *
 * @see [Selection Component Documentation](../../../../../Architecture/Client/Components/Selection/)
 * @public
 */
export class RevSelection<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    /** @internal */
    changedEventerForRenderer: RevSelection.ChangedEventer;
    /** @internal */
    changedEventerForEventBehavior: RevSelection.ChangedEventer;

    /** @internal */
    private readonly _rows = new RevSelectionRangeList();
    /** @internal */
    private readonly _columns = new RevSelectionRangeList();
    /** @internal */
    private readonly _rectangleList = new RevSelectionRectangleList();

    /** @internal */
    private _subgrid: RevSubgrid<BCS, SF> | undefined;
    /** @internal */
    private _lastArea: RevLastSelectionArea | undefined;
    /** @internal */
    private _allAuto = false;

    /** @internal */
    private _focusLinked = false;

    /** @internal */
    private _beginChangeCount = 0;
    /** @internal */
    private _changed = false;
    /** @internal */
    private _silentlyChanged = false;

    /** @internal */
    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        /** @internal */
        private readonly _gridSettings: RevGridSettings,
        /** @internal */
        private readonly _columnsManager: RevColumnsManager<BCS, SF>,
        /** @internal */
        private readonly _focus: RevFocus<BGS, BCS, SF>,
    ) {
        this._focus.currentCellChangedForSelectionEventer = () => {
            if (this._focusLinked) {
                this._focusLinked = false;
                this.clear();
            }
        }
    }

    get subgrid(): RevSubgrid<BCS, SF> | undefined { return this._subgrid; }

    get areaCount(): number { return this._rectangleList.areaCount + this._rows.areaCount + this._columns.areaCount; }
    get lastArea(): RevLastSelectionArea | undefined { return this._lastArea; }

    get allAuto(): boolean { return this._allAuto; }
    set allAuto(value: boolean) {
        if (value !== this._allAuto) {
            this.beginChange();
            try {
                const changed = value !== this._allAuto;
                if (changed) {
                    this._allAuto = value;
                    this._changed = true;
                    if (this._lastArea !== undefined && this._lastArea.areaTypeId === RevSelectionAreaTypeId.all && !value) {
                        this._lastArea = undefined;
                    }
                }
            } finally {
                this.endChange();
            }
        }
    }

    get rectangles(): readonly RevSelectionRectangle[] { return this._rectangleList.rectangles; }

    /** @internal */
    destroy(): void {
        //
    }

    /** Call before multiple selection changes to consolidate RevSelection Change events.
     * Pair with endChange().
     */
    beginChange(): void {
        ++this._beginChangeCount;
    }

    /** Call after multiple selection changes to consolidate SelectionChange events.
     * Pair with beginSelectionChange().
     */
    endChange(): void {
        if (--this._beginChangeCount === 0) {
            if (this._changed) {
                this._changed = false;
                const silentlyChanged = this._silentlyChanged;
                this._silentlyChanged = false;

                if (!silentlyChanged) {
                    this.changedEventerForRenderer();
                    this.changedEventerForEventBehavior();
                }
            }
        } else {
            if (this._beginChangeCount < 0) {
                throw new RevAssertError('SMEC91004', 'Mismatched SelectionModel begin/endChange callback');
            }
        }
    }

    /**
     * Creates a stash object representing the current selection in a format which is not affected by sorting, filtering or reordering.
     */
    createStash(): RevSelection.Stash<BCS, SF> {
        const lastRectangleFirstCell = this.createLastRectangleFirstCellStash();
        const rowIds = this.createRowsStash();
        const columnNames = this.createColumnsStash();

        return {
            subgrid: this._subgrid,
            allAuto: this._allAuto,
            lastRectangleFirstCell,
            rowIds,
            columnNames,
        };
    }

    /**
     * Restores the selection state from a given stash object.
     *
     * This method begins a change transaction, clears the current selection,
     * and restores the subgrid, auto-selection state, last rectangle's first cell,
     * selected rows, and selected columns from the provided stash.
     *
     * @param stash - The stash object containing the selection state to restore.
     * @param allRowsKept - Indicates whether all rows are kept during restoration. If true, an exception is thrown if the stash contains rows that are not present in the current subgrid.
     */
    restoreStash(stash: RevSelection.Stash<BCS, SF>, allRowsKept: boolean): void {
        this.beginChange();
        try {
            this.clear();
            this._subgrid = stash.subgrid;
            this._allAuto = stash.allAuto;
            this.restoreLastRectangleFirstCellStash(stash.lastRectangleFirstCell, allRowsKept);
            this.restoreRowsStash(stash.rowIds);
            this.restoreColumnsStash(stash.columnNames);
        } finally {
            this.endChange();
        }
    }

    getLastRectangle(): RevSelectionRectangle | undefined {
        return this._rectangleList.getLastRectangle();
    }

    /**
     * Clears the selection
     */
    clear(): void {
        this.beginChange();
        try {
            let changed = false;
            if (this._allAuto) {
                this._allAuto = false;
                changed = true;
            }

            if (this._rectangleList.has) {
                this._rectangleList.clear();
                changed = true;
            }

            if (this._columns.hasIndices()) {
                this._columns.clear();
                changed = true;
            }

            if (this._rows.hasIndices()) {
                this._rows.clear();
                changed = true;
            }

            this._lastArea = undefined;

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }
    }

    /** @internal */
    focusLinkableOnlySelectCell(x: number, y: number, subgrid: RevSubgrid<BCS, SF>, focusLinked: boolean) {
        this.beginChange();
        try {
            const area = this.onlySelectCell(x, y, subgrid);
            this._focusLinked = focusLinked;
            return area;
        } finally {
            this.endChange();
        }
    }

    /**
     * Selects only the specified cell in the given subgrid, clearing any previous selection.
     *
     * @param activeColumnIndex - The column index of the cell to select.
     * @param subgridRowIndex - The row index of the cell to select.
     * @param subgrid - The subgrid containing the cell to select.
     * @returns The last selection area after selecting the cell.
     */
    onlySelectCell(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): RevLastSelectionArea {
        this.beginChange();
        try {
            this.clear();
            return this.selectCell(activeColumnIndex, subgridRowIndex, subgrid);
        } finally {
            this.endChange();
        }
    }

    /**
     * Create a selection area for a single cell and add the new area to the selection. If the subgrid is not the same as the active subgrid or multiple selection areas
     * are not allowed, clear the selection before adding the new selection area.
     *
     * @param activeColumnIndex - The index of the active column of the cell.
     * @param subgridRowIndex - The index of the row of the cell within the subgrid.
     * @param subgrid - The subgrid containing the cell.
     * @returns The selection area representing the selected cell.
     */
    selectCell(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): RevLastSelectionArea {
        return this.selectRectangle(activeColumnIndex, subgridRowIndex, 1, 1, subgrid);
    }

    deselectCell(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): void {
        const rectangle: RevRectangle = {
            x: activeColumnIndex,
            y: subgridRowIndex,
            width: 1,
            height: 1,
        }
        this.deselectRectangle(rectangle, subgrid);
    }

    selectArea(areaTypeId: RevSelectionAreaTypeId, leftOrExRightActiveColumnIndex: number, topOrBottomSubgridRowIndex: number, width: number, height: number, subgrid: RevSubgrid<BCS, SF>): RevSelectionArea | undefined {
        this.beginChange();
        try {
            let area: RevSelectionArea | undefined;
            switch (areaTypeId) {
                case RevSelectionAreaTypeId.all: {
                    this.allAuto = true;
                    area = this.createAreaFromAll();
                    break;
                }
                case RevSelectionAreaTypeId.rectangle: {
                    area = this.selectRectangle(leftOrExRightActiveColumnIndex, topOrBottomSubgridRowIndex, width, height, subgrid,);
                    break;
                }
                case RevSelectionAreaTypeId.column: {
                    area = this.selectColumns(leftOrExRightActiveColumnIndex, topOrBottomSubgridRowIndex, width, height, subgrid);
                    break;
                }
                case RevSelectionAreaTypeId.row: {
                    area = this.selectRows(leftOrExRightActiveColumnIndex, topOrBottomSubgridRowIndex, width, height, subgrid);
                    break;
                }
                default:
                    throw new RevUnreachableCaseError('SSA34499', areaTypeId)
            }

            return area;
        } finally {
            this.endChange();
        }
    }

    deselectLastArea(): void {
        const lastArea = this._lastArea;
        this._lastArea = undefined;
        if (lastArea !== undefined) {
            const subgrid = this._subgrid;
            if (subgrid === undefined) {
                throw new RevAssertError('SDLA13690');
            } else {
                switch (lastArea.areaTypeId) {
                    case RevSelectionAreaTypeId.all: {
                        this.allAuto = false;
                        break;
                    }
                    case RevSelectionAreaTypeId.rectangle: {
                        this.deselectRectangle(lastArea, subgrid);
                        break;
                    }
                    case RevSelectionAreaTypeId.column: {
                        this.deselectColumns(lastArea.x, lastArea.width);
                        break;
                    }
                    case RevSelectionAreaTypeId.row: {
                        this.deselectRows(lastArea.y, lastArea.height, subgrid);
                        break;
                    }
                    default:
                        throw new RevUnreachableCaseError('SDLA34499', lastArea.areaTypeId)
                }
            }
        }
    }

    onlySelectRectangle(leftOrExRightActiveColumnIndex: number, topOrExBottomSubgridRowIndex: number, width: number, height: number, subgrid: RevSubgrid<BCS, SF>): RevLastSelectionArea {
        this.beginChange();
        try {
            this.clear();
            return this.selectRectangle(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid);
        } finally {
            this.endChange();
        }
    }

    selectRectangle(leftOrExRightActiveColumnIndex: number, topOrExBottomSubgridRowIndex: number, width: number, height: number, subgrid: RevSubgrid<BCS, SF>, silent = false): RevLastSelectionArea {
        this.beginChange();
        try {
            const switchNewRectangleSelectionToRowOrColumn = this._gridSettings.switchNewRectangleSelectionToRowOrColumn;
            if (switchNewRectangleSelectionToRowOrColumn !== undefined) {
                switch (switchNewRectangleSelectionToRowOrColumn) {
                    case 'row': return this.selectRows(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid);
                    case 'column': return this.selectColumns(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid);
                    default: throw new RevUnreachableCaseError('SSR50591', switchNewRectangleSelectionToRowOrColumn);
                }
            } else {
                if (subgrid !== this._subgrid) {
                    this.clear();
                    this._subgrid = subgrid;
                }

                if (!this._gridSettings.multipleSelectionAreas) {
                    this.clear();
                }

                const rectangle = new RevSelectionRectangle(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height);
                this._rectangleList.push(rectangle);
                this._lastArea = new RevLastSelectionArea(RevSelectionAreaTypeId.rectangle, leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height);

                this.flagChanged(silent);
            }

        } finally {
            this.endChange()
        }

        return this._lastArea;
    }

    deselectRectangle(rectangle: RevRectangle, subgrid: RevSubgrid<BCS, SF>) {
        if (subgrid === this._subgrid) {
            const index = this._rectangleList.findIndex(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
            if (index >= 0) {
                this.beginChange();
                const lastArea = this._lastArea;
                if (lastArea !== undefined && RevRectangle.isEqual(lastArea, rectangle)) {
                    this._lastArea = undefined;
                }
                this._rectangleList.removeAt(index)
                this.flagChanged(false);
                this.endChange();
            }
        }
    }

    /**
     * Create a row selection area and add the new area to the selection. If the subgrid is not the same as the active subgrid or multiple selection areas
     * are not allowed, clear the selection before adding the new selection area.
     *
     * While the leftOrExRightActiveColumnIndex and width parameters are needed to specify the rows, they are needed to create a selection area.  Normally they are set to specify all columns in the subgrid.
     *
     * @param leftOrExRightActiveColumnIndex - The starting index of the range of active column indices to include if `width` is positive, or the exclusive end index if `width` is negative.
     * @param topOrExclusiveBottomSubgridRowIndex - The starting index of the range of subgrid row index to include if `height` is positive, or the exclusive end index if `height` is negative.
     * @param width - The number of active columns to include in the new selection area.
     * @param height - The number of subgrid rows to include in the new selection area.
     * @param subgrid - The subgrid in which the new selection area is made.
     * @returns The last selection area representing the selected rows.
     */
    selectRows(leftOrExRightActiveColumnIndex: number, topOrExclusiveBottomSubgridRowIndex: number, width: number, height: number, subgrid: RevSubgrid<BCS, SF>): RevLastSelectionArea {
        this.beginChange();
        try {
            if (subgrid !== this._subgrid) {
                this.clear();
                this._subgrid = subgrid;
            }

            if (!this._gridSettings.multipleSelectionAreas) {
                this.clear();
            }

            const changed = this._rows.add(topOrExclusiveBottomSubgridRowIndex, height);
            const lastArea = new RevLastSelectionArea(RevSelectionAreaTypeId.row, leftOrExRightActiveColumnIndex, topOrExclusiveBottomSubgridRowIndex, width, height);
            if (changed) {
                this._lastArea = lastArea;
                this.flagChanged(false);
            }

            return lastArea;
        } finally {
            this.endChange();
        }
    }

    /**
     * Selects all rows within the specified subgrid.
     *
     * The leftOrExRightActiveColumnIndex and width parameters are needed to create a selection area.  Normally they are set to specify all columns in the subgrid.
     *
     * Note that while this selects all cells in the subgrid, it differs from {@link allAuto} in that this selection area will not include new rows subsequently added to the subgrid.
     *
     * @param leftOrExRightActiveColumnIndex - The starting index of the range of active column indices to include if `width` is positive, or the exclusive end index if `width` is negative.
     * @param width - The number of active columns to include in the new selection area.
     * @param subgrid - The subgrid instance containing the rows to be selected.
     */
    selectAllRows(leftOrExRightActiveColumnIndex: number, width: number, subgrid: RevSubgrid<BCS, SF>): void {
        const subgridRowCount = subgrid.getRowCount();
        if (subgridRowCount > 0) {
            this.selectRows(leftOrExRightActiveColumnIndex, 0, width, subgridRowCount, subgrid);
        }
    }

    deselectRows(topOrExBottomSubgridRowIndex: number, count: number, subgrid: RevSubgrid<BCS, SF>) {
        if (subgrid === this._subgrid) {
            const changed = this._rows.delete(topOrExBottomSubgridRowIndex, count);
            if (changed) {
                this.beginChange();
                const lastArea = this._lastArea;
                if (lastArea !== undefined && lastArea.areaTypeId === RevSelectionAreaTypeId.row) {
                    const oldFirst = lastArea.exclusiveFirst;
                    const oldLast = lastArea.exclusiveLast;
                    const oldStart = oldFirst.y;
                    const oldLength = oldLast.y - oldStart;
                    const overlapRange = this._rows.calculateOverlapRange(oldStart, oldLength);
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

                        this._lastArea = new RevLastSelectionArea(RevSelectionAreaTypeId.row, lastX, lastExclusiveY, lastWidth, lastHeight);
                    }
                }
                this.flagChanged(false);
                this.endChange();
            }
        }
    }

    toggleSelectRow(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): void {
        if (this._rows.includesIndex(subgridRowIndex)) {
            this.deselectRows(subgridRowIndex, 1, subgrid);
        } else {
            this.selectRows(activeColumnIndex, subgridRowIndex, 1, 1, subgrid);
        }
    }

    selectColumns(inexclusiveX: number, y: number, width: number, height: number, subgrid: RevSubgrid<BCS, SF>): RevLastSelectionArea {
        this.beginChange();

        if (subgrid !== this._subgrid) {
            this.clear();
            this._subgrid = subgrid;
        }

        if (!this._gridSettings.multipleSelectionAreas) {
            this.clear();
        }

        const changed = this._columns.add(inexclusiveX, width);
        const lastArea = new RevLastSelectionArea(RevSelectionAreaTypeId.column, inexclusiveX, y, width, height);
        if (changed) {
            this._lastArea = lastArea;
            this.flagChanged(false);
        }
        this.endChange();

        return lastArea;
    }

    deselectColumns(activeColumnIndex: number, count: number): void {
        const changed = this._columns.delete(activeColumnIndex, count);
        if (changed) {
            this.beginChange();
            const lastArea = this._lastArea;
            if (lastArea !== undefined && lastArea.areaTypeId === RevSelectionAreaTypeId.column) {
                const oldFirst = lastArea.exclusiveFirst;
                const oldLast = lastArea.exclusiveLast;
                const oldStart = oldFirst.x;
                const oldLength = oldLast.x - oldStart;
                const overlapRange = this._columns.calculateOverlapRange(oldStart, oldLength);
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

                    this._lastArea = new RevLastSelectionArea(RevSelectionAreaTypeId.column, lastInexclusiveX, lastY, lastWidth, lastHeight);
                }
            }
            this.flagChanged(false);
            this.endChange();
        }
    }

    toggleSelectColumn(activeColumnIndex: number, y: number, subgrid: RevSubgrid<BCS, SF>): void {
        if (this._columns.includesIndex(activeColumnIndex)) {
            this.deselectColumns(activeColumnIndex, 1);
        } else {
            this.selectColumns(activeColumnIndex, y, 1, 1, subgrid);
        }
    }

    replaceLastArea(areaTypeId: RevSelectionAreaTypeId, inexclusiveX: number, inexclusiveY: number, width: number, height: number, subgrid: RevSubgrid<BCS, SF>): RevSelectionArea | undefined {
        this.beginChange();
        try {
            this.deselectLastArea();
            return this.selectArea(areaTypeId, inexclusiveX, inexclusiveY, width, height, subgrid);
        } finally {
            this.endChange();
        }
    }

    replaceLastAreaWithRectangle(inexclusiveX: number, inexclusiveY: number, width: number, height: number, subgrid: RevSubgrid<BCS, SF>) {
        this.beginChange();
        try {
            this.deselectLastArea();
            return this.selectRectangle(inexclusiveX, inexclusiveY, width, height, subgrid);
        } finally {
            this.endChange();
        }
    }

    replaceLastAreaWithColumns(inexclusiveX: number, y: number, width: number, height: number, subgrid: RevSubgrid<BCS, SF>) {
        this.beginChange();
        try {
            this.deselectLastArea();
            return this.selectColumns(inexclusiveX, y, width, height, subgrid);
        } finally {
            this.endChange();
        }
    }

    replaceLastAreaWithRows(x: number, inexclusiveY: number, width: number, height: number, subgrid: RevSubgrid<BCS, SF>) {
        this.beginChange();
        try {
            this.deselectLastArea();
            return this.selectRows(x, inexclusiveY, width, height, subgrid);
        } finally {
            this.endChange();
        }
    }

    toggleSelectCell(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): boolean {
        const cellCoveringSelectionAreas = this.getAreasCoveringCell(activeColumnIndex, subgridRowIndex, subgrid);
        const priorityCoveringArea = RevSelectionArea.getTogglePriorityCellCoveringSelectionArea(cellCoveringSelectionAreas);
        if (priorityCoveringArea === undefined) {
            this.selectCell(activeColumnIndex, subgridRowIndex, subgrid);
            return true;
        } else {
            this.beginChange();
            try {
                const priorityCoveringAreaType = priorityCoveringArea.areaTypeId;
                switch (priorityCoveringAreaType) {
                    case RevSelectionAreaTypeId.all: {
                        this.allAuto = false;
                        break;
                    }
                    case RevSelectionAreaTypeId.rectangle: {
                        this.deselectRectangle(priorityCoveringArea, subgrid);
                        break;
                    }
                    case RevSelectionAreaTypeId.column: {
                        this.deselectColumns(activeColumnIndex, 1);
                        break;
                    }
                    case RevSelectionAreaTypeId.row: {
                        this.deselectRows(subgridRowIndex, 1, subgrid);
                        break;
                    }
                }
            } finally {
                this.endChange();
            }
            return false;
        }
    }

    flagFocusLinked() {
        this._focusLinked = true;
    }

    isColumnSelected(activeColumnIndex: number) {
        return this._columns.includesIndex(activeColumnIndex);
    }

    isCellSelected(x: number, y: number, subgrid: RevSubgrid<BCS, SF>): boolean {
        return this.getOneCellSelectionAreaTypeId(x, y, subgrid) !== undefined;
    }

    /** Returns undefined if not selected, false if selected with others, true if the only cell selected */
    isOnlyThisCellSelected(x: number, y: number, subgrid: RevSubgrid<BCS, SF>): boolean | undefined {
        const selectedType = this.getOneCellSelectionAreaTypeId(x, y, subgrid);
        if (selectedType === undefined) {
            return undefined;
        } else {
            return this.isSelectedCellTheOnlySelectedCell(x, y, subgrid, selectedType)
        }
    }

    getOneCellSelectionAreaTypeId(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): RevSelectionAreaTypeId | undefined {
        if (subgrid !== this._subgrid) {
            return undefined;
        } else {
            if (this._allAuto) {
                return RevSelectionAreaTypeId.all;
            } else {
                if (this._rows.includesIndex(subgridRowIndex)) {
                    return RevSelectionAreaTypeId.row;
                } else {
                    if (this._columns.includesIndex(activeColumnIndex)) {
                        return RevSelectionAreaTypeId.column;
                    } else {
                        if (this._rectangleList.containsPoint(activeColumnIndex, subgridRowIndex)) {
                            return RevSelectionAreaTypeId.rectangle;
                        } else {
                            return undefined;
                        }
                    }
                }
            }
        }
    }

    getAllCellSelectionAreaTypeIds(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): RevSelectionAreaTypeId[] {
        if (subgrid !== this._subgrid) {
            return [];
        } else {
            const selectedTypes: RevSelectionAreaTypeId[] = [];
            if (this._allAuto) {
                selectedTypes.push(RevSelectionAreaTypeId.all);
            }
            if (this._rows.includesIndex(subgridRowIndex)) {
                selectedTypes.push(RevSelectionAreaTypeId.row);
            }
            if (this._columns.includesIndex(activeColumnIndex)) {
                selectedTypes.push(RevSelectionAreaTypeId.column);
            }
            if (this._rectangleList.containsPoint(activeColumnIndex, subgridRowIndex)) {
                selectedTypes.push(RevSelectionAreaTypeId.rectangle);
            }
            return selectedTypes;
        }
    }

    isSelectedCellTheOnlySelectedCell(
        activeColumnIndex: number,
        subgridRowIndex: number,
        subgrid: RevSubgrid<BCS, SF>, // assume this was previously checked by getCellSelectedType
        selectedTypeId: RevSelectionAreaTypeId
    ) {
        const activeColumnCount = this._columnsManager.activeColumnCount;
        const subgridRowCount = subgrid.getRowCount();
        switch (selectedTypeId) {
            case RevSelectionAreaTypeId.all:
                return activeColumnCount <= 1 && subgridRowCount <= 1;
            case RevSelectionAreaTypeId.row:
                return (
                    subgridRowCount <= 1 &&
                    !this._columns.hasMoreThanOneIndex() &&
                    (this._rows.isEmpty() || (activeColumnCount <= 1)) &&
                    !this._rectangleList.hasPointOtherThan(activeColumnIndex, subgridRowIndex)
                );
            case RevSelectionAreaTypeId.column:
                return (
                    activeColumnCount <= 1 &&
                    !this._rows.hasMoreThanOneIndex() &&
                    (this._columns.isEmpty() || (subgridRowCount <= 1)) &&
                    !this._rectangleList.hasPointOtherThan(activeColumnIndex, subgridRowIndex)
                );
            case RevSelectionAreaTypeId.rectangle:
                return (
                    !this._rectangleList.hasMoreThanOnePoint() &&
                    (this._rows.isEmpty() || activeColumnCount <= 1) &&
                    (this._columns.isEmpty() || subgridRowCount <= 1)
                );
            default:
                throw new RevUnreachableCaseError('SISCTOSD30134', selectedTypeId);
        }
    }

    hasColumnsOrRows(includeAllAuto: boolean) {
        if (this._columns.hasIndices() || this._rows.hasIndices()) {
            return true;
        } else {
            if (!includeAllAuto || !this._allAuto) {
                return false;
            } else {
                if (this._columnsManager.activeColumnCount > 0) {
                    return true;
                } else {
                    if (this._subgrid === undefined) {
                        throw new RevAssertError('SHR66698');
                    } else {
                        return this._subgrid.getRowCount() > 0;
                    }
                }
            }
        }
    }

    hasRows(includeAllAuto: boolean) {
        if (this._rows.hasIndices()) {
            return true;
        } else {
            if (!includeAllAuto || !this._allAuto) {
                return false;
            } else {
                if (this._subgrid === undefined) {
                    throw new RevAssertError('SHR66698');
                } else {
                    return this._subgrid.getRowCount() > 0;
                }
            }
        }
    }

    getRowCount(includeAllAuto: boolean) {
        if (includeAllAuto && this._allAuto) {
            return this.getAllAutoRowCount();
        } else {
            return this._rows.getIndexCount();
        }
    }

    getAllAutoRowCount() {
        if (!this._allAuto) {
            return 0;
        } else {
            if (this._subgrid === undefined) {
                throw new RevAssertError('SGARC66698');
            } else {
                return this._subgrid.getRowCount();
            }
        }
    }

    getRowIndices(includeAllAuto: boolean) {
        if (includeAllAuto && this._allAuto) {
            return this.getAllAutoRowIndices();
        } else {
            return this._rows.getIndices();
        }
    }

    getAllAutoRowIndices() {
        if (!this._allAuto) {
            return [];
        } else {
            if (this._subgrid === undefined) {
                throw new RevAssertError('SGARI66698');
            } else {
                const rowCount = this._subgrid.getRowCount();
                const result = new Array<number>(rowCount);
                for (let i = 0; i < rowCount; i++) {
                    result[i] = i;
                }
                return result;
            }
        }
    }

    /**
     * Determines whether selection includes any column selection areas.
     *
     * @param includeAllAuto - If `true`, considers then any active columns are considered as column selection areas.
     * @returns `true` if selection contains one or more column selection areas, otherwise `false`.
     */
    hasColumns(includeAllAuto: boolean): boolean {
        if (this._columns.hasIndices()) {
            return true;
        } else {
            if (!includeAllAuto || !this._allAuto) {
                return false;
            } else {
                return this._columnsManager.activeColumnCount > 0;
            }
        }
    }

    getColumnIndices(includeAllAuto: boolean): number[] {
        if (includeAllAuto && this._allAuto) {
            return this.getAllAutoColumnIndices();
        } else {
            return this._columns.getIndices();
        }
    }

    getAllAutoColumnIndices(): number[] {
        if (!this._allAuto) {
            return [];
        } else {
            const columnCount = this._columnsManager.activeColumnCount;
            const result = new Array<number>(columnCount);
            for (let i = 0; i < columnCount; i++) {
                result[i] = i;
            }
            return result;
        }
    }

    // getRectangleFlattenedYs() {
    //     this.rectangleList.getFlattenedYs();
    // }

    getAreasCoveringCell(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF> | undefined): RevSelectionArea[] {
        let result: RevSelectionArea[];
        if (subgrid !== undefined && subgrid !== this._subgrid) {
            result = [];
        } else {
            if (this._allAuto) {
                const area = this.createAreaFromAll();
                if (area === undefined) {
                    result = [];
                } else {
                    result = [area];
                }
            } else {
                const range = this._rows.findRangeWithIndex(subgridRowIndex);
                if (range === undefined) {
                    result = [];
                } else {
                    const area = this.createAreaFromRowRange(range);
                    result = [area];
                }
            }

            const columnRange = this._columns.findRangeWithIndex(activeColumnIndex);
            if (columnRange !== undefined) {
                const area = this.createAreaFromColumnRange(columnRange);
                result.push(area);
            }

            const rectangles =  this._rectangleList.getRectanglesContainingPoint(activeColumnIndex, subgridRowIndex);
            for (const rectangle of rectangles) {
                result.push(rectangle);
            }

        }

        return result;
    }

    /**
     * Determines whether the specified cell, identified by its column and row indices,
     * is within the bounds of the last selection area.
     *
     * @param activeColumnIndex - The index of the column to check.
     * @param subgridRowIndex - The index of the row within the subgrid to check.
     * @returns `true` if the cell is within the last selection area; otherwise, `false`.
     */
    isPointInLastArea(activeColumnIndex: number, subgridRowIndex: number): boolean {
        const lastArea = this._lastArea;
        if (lastArea === undefined) {
            return false;
        } else {
            return lastArea.containsXY(activeColumnIndex, subgridRowIndex);
        }
    }

    /** @internal */
    calculateAreaTypeFromSpecifier(specifier: RevSelectionAreaTypeSpecifierId): RevSelectionAreaTypeId {
        switch (specifier) {
            case RevSelectionAreaTypeSpecifierId.Primary: return RevSelectionAreaType.toId(this._gridSettings.primarySelectionAreaType);
            case RevSelectionAreaTypeSpecifierId.Secondary: return RevSelectionAreaType.toId(this._gridSettings.secondarySelectionAreaType);
            case RevSelectionAreaTypeSpecifierId.Rectangle: return RevSelectionAreaTypeId.rectangle;
            case RevSelectionAreaTypeSpecifierId.Row: return RevSelectionAreaTypeId.row;
            case RevSelectionAreaTypeSpecifierId.Column: return RevSelectionAreaTypeId.column;
            case RevSelectionAreaTypeSpecifierId.LastOrPrimary: {
                const lastArea = this._lastArea;
                if (lastArea === undefined) {
                    return this.calculateAreaTypeFromSpecifier(RevSelectionAreaTypeSpecifierId.Primary);
                } else {
                    return lastArea.areaTypeId;
                }
            }
            default:
                throw new RevUnreachableCaseError('SCAT60711', specifier);
        }
    }

    /** @internal */
    calculateMouseMainSelectAllowedAreaTypeId() {
        const areaTypeId = this.calculateMouseMainSelectAreaTypeId();
        switch (areaTypeId) {
            case RevSelectionAreaTypeId.all: throw new RevAssertError('SCMMSAATI39113');
            case RevSelectionAreaTypeId.rectangle: return areaTypeId;
            case RevSelectionAreaTypeId.row: return this._gridSettings.mouseRowSelectionEnabled ? areaTypeId : undefined;
            case RevSelectionAreaTypeId.column: return this._gridSettings.mouseColumnSelectionEnabled ? areaTypeId : undefined;
            default:
                throw new RevUnreachableCaseError('SCMMSAATI30987', areaTypeId);
        }
    }

    /** @internal */
    adjustForRowsInserted(rowIndex: number, rowCount: number, dataServer: RevDataServer<SF>) {
        const subgrid = this._subgrid;
        if (subgrid !== undefined && dataServer === subgrid.dataServer) {
            this.beginChange();
            try {
                const lastArea = this._lastArea;
                if (lastArea !== undefined) {
                    lastArea.adjustForYRangeInserted(rowIndex, rowCount);
                }

                let changed = this._rectangleList.adjustForYRangeInserted(rowIndex, rowCount);
                if (this._rows.adjustForInserted(rowIndex, rowCount)) {
                    changed = true;
                }

                if (changed) {
                    this.flagChanged(false);
                }
            } finally {
                this.endChange();
            }
        }
    }

    /** @internal */
    adjustForRowsDeleted(rowIndex: number, rowCount: number, dataServer: RevDataServer<SF>) {
        const subgrid = this._subgrid;
        if (subgrid !== undefined && dataServer === subgrid.dataServer) {
            this.beginChange();
            try {
                const lastArea = this._lastArea;
                if (lastArea !== undefined) {
                    if (lastArea.adjustForYRangeDeleted(rowIndex, rowCount) === null) {
                        this._lastArea = undefined;
                    }
                }

                let changed = this._rectangleList.adjustForYRangeDeleted(rowIndex, rowCount);
                if (this._rows.adjustForDeleted(rowIndex, rowCount)) {
                    changed = true;
                }

                if (changed) {
                    this.flagChanged(false);
                }
            } finally {
                this.endChange();
            }
        }
    }

    /** @internal */
    adjustForRowsMoved(oldRowIndex: number, newRowIndex: number, count: number, dataServer: RevDataServer<SF>) {
        const subgrid = this._subgrid;
        if (subgrid !== undefined && dataServer === subgrid.dataServer) {
            this.beginChange();
            try {
                const lastArea = this._lastArea;
                if (lastArea !== undefined) {
                    lastArea.adjustForYRangeMoved(oldRowIndex, newRowIndex, count);
                }

                let changed = this._rectangleList.adjustForYRangeMoved(oldRowIndex, newRowIndex, count);
                if (this._rows.adjustForMoved(oldRowIndex, newRowIndex, count)) {
                    changed = true;
                }

                if (changed) {
                    this.flagChanged(false);
                }
            } finally {
                this.endChange();
            }
        }
    }

    /** @internal */
    adjustForColumnsInserted(columnIndex: number, columnCount: number) {
        this.beginChange();
        try {
            const lastArea = this._lastArea;
            if (lastArea !== undefined) {
                lastArea.adjustForXRangeInserted(columnIndex, columnCount);
            }

            let changed = this._rectangleList.adjustForXRangeInserted(columnIndex, columnCount);
            if (this._columns.adjustForInserted(columnIndex, columnCount)) {
                changed = true;
            }

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }
    }

    /** @internal */
    adjustForActiveColumnsDeleted(columnIndex: number, columnCount: number) {
        this.beginChange();
        try {
            const lastArea = this._lastArea;
            if (lastArea !== undefined) {
                if (lastArea.adjustForXRangeDeleted(columnIndex, columnCount) === null) {
                    this._lastArea = undefined;
                }
            }

            let changed = this._rectangleList.adjustForXRangeDeleted(columnIndex, columnCount);
            if (this._columns.adjustForDeleted(columnIndex, columnCount)) {
                changed = true;
            }

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }
    }

    /** @internal */
    adjustForColumnsMoved(oldColumnIndex: number, newColumnIndex: number, count: number) {
        this.beginChange();
        try {
            const lastArea = this._lastArea;
            if (lastArea !== undefined) {
                lastArea.adjustForXRangeMoved(oldColumnIndex, newColumnIndex, count);
            }

            let changed = false; // this.rectangleList.adjustForColumnsMoved(oldColumnIndex, newColumnIndex, count); // not yet implemented
            if (this._columns.adjustForMoved(oldColumnIndex, newColumnIndex, count)) {
                changed = true;
            }

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }
    }

    /** @internal */
    private flagChanged(silently: boolean) {
        this._focusLinked = false;

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

    /** @internal */
    private createAreaFromAll(): RevSelectionArea | undefined {
        const subgrid = this._subgrid;
        if (subgrid === undefined) {
            throw new RevAssertError('SCAFAR34454');
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
                    areaTypeId: RevSelectionAreaTypeId.all,
                    topLeft: { x, y },
                    inclusiveFirst: { x, y },
                    exclusiveBottomRight: { x: activeColumnCount, y: rowCount },
                    firstCorner: RevFirstCornerArea.CornerId.TopLeft,
                    size: activeColumnCount * rowCount,
                };
            }
        }
    }

    /** @internal */
    private createAreaFromRowRange(range: RevContiguousIndexRange): RevSelectionArea {
        const activeColumnCount = this._columnsManager.activeColumnCount;
        const x = 0;
        const y = range.start;
        const height = range.length;
        return {
            x,
            y,
            width: activeColumnCount,
            height,
            areaTypeId: RevSelectionAreaTypeId.row,
            topLeft: { x, y },
            inclusiveFirst: { x, y },
            exclusiveBottomRight: { x: activeColumnCount, y: range.after },
            firstCorner: RevFirstCornerArea.CornerId.TopLeft,
            size: activeColumnCount * height,
        };
    }

    /** @internal */
    private createAreaFromColumnRange(range: RevContiguousIndexRange): RevSelectionArea {
        const subgrid = this._subgrid;
        if (subgrid === undefined) {
            throw new RevAssertError('SCAFAR34454');
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
                areaTypeId: RevSelectionAreaTypeId.column,
                topLeft: { x, y },
                inclusiveFirst: { x, y },
                exclusiveBottomRight: { x: range.after, y: rowCount },
                firstCorner: RevFirstCornerArea.CornerId.TopLeft,
                size: width * rowCount,
            };
        }
    }

    /** @internal */
    private calculateMouseMainSelectAreaTypeId() {
        const switchNewRectangleSelectionToRowOrColumn = this._gridSettings.switchNewRectangleSelectionToRowOrColumn;
        switch (switchNewRectangleSelectionToRowOrColumn) {
            case undefined: return this.calculateAreaTypeFromSpecifier(RevSelectionAreaTypeSpecifierId.Primary);
            case 'row': return RevSelectionAreaTypeId.row;
            case 'column': return RevSelectionAreaTypeId.column;
            default:
                throw new RevUnreachableCaseError('SCMMSATI30987', switchNewRectangleSelectionToRowOrColumn);
        }
    }

    /** @internal */
    private createLastRectangleFirstCellStash(): RevSelection.LastRectangleFirstCellStash | undefined {
        const subgrid = this._subgrid;
        if (subgrid === undefined) {
            return undefined;
        } else {
            const rectangle = this._rectangleList.getLastRectangle();
            if (rectangle === undefined) {
                return undefined;
            } else {
                const cellPoint = rectangle.inclusiveFirst;

                const dataServer = subgrid.dataServer;
                if (dataServer.getRowIdFromIndex === undefined) {
                    return undefined;
                } else {
                    const activeColumnIndex = cellPoint.x;
                    const subgridRowIndex = cellPoint.y;
                    return {
                        fieldName: this._columnsManager.getActiveColumn(activeColumnIndex).field.name,
                        rowId: dataServer.getRowIdFromIndex(subgridRowIndex),
                    };
                }
            }
        }
    }

    /** @internal */
    private restoreLastRectangleFirstCellStash(lastRectangleFirstCellStash: RevSelection.LastRectangleFirstCellStash | undefined, allRowsKept: boolean) {
        if (lastRectangleFirstCellStash !== undefined) {
            const subgrid = this._subgrid;
            if (subgrid === undefined) {
                throw new RevAssertError('SRLRFC10987');
            } else {
                const { fieldName, rowId: stashedRowId } = lastRectangleFirstCellStash;

                const activeColumnIndex = this._columnsManager.getActiveColumnIndexByFieldName(fieldName);
                if (activeColumnIndex >= 0) {
                    const dataServer = subgrid.dataServer;
                    if (dataServer.getRowIndexFromId !== undefined) {
                        const subgridRowIndex = dataServer.getRowIndexFromId(stashedRowId);
                        if (subgridRowIndex !== undefined) {
                            this.selectRectangle(activeColumnIndex, subgridRowIndex, 1, 1, subgrid, true);
                        } else {
                            if (allRowsKept) {
                                throw new RevAssertError('SRLRFCS31071');
                            }
                        }
                    } else {
                        if (dataServer.getRowIdFromIndex !== undefined) {
                            const rowCount = subgrid.getRowCount();
                            for (let subgridRowIndex = 0; subgridRowIndex < rowCount; subgridRowIndex++) {
                                const rowId = dataServer.getRowIdFromIndex(subgridRowIndex);
                                if (rowId === stashedRowId) {
                                    this.selectRectangle(activeColumnIndex, subgridRowIndex, 1, 1, subgrid, true);
                                    return;
                                }
                            }
                            if (allRowsKept) {
                                throw new RevAssertError('SRLRFCS31071');
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Save underlying data row indexes backing current grid row selections in `grid.selectedDataRowIndexes`.
     *
     * This call should be paired with a subsequent call to `reselectRowsByUnderlyingIndexes`.
     * @returns Number of selected rows or `undefined` if `restoreRowSelections` is falsy.
     * @internal
     */
    private createRowsStash() {
        const subgrid = this._subgrid;
        if (subgrid === undefined) {
            return undefined;
        } else {
            const dataServer = subgrid.dataServer;
            if (dataServer.getRowIdFromIndex === undefined) {
                return undefined;
            } else {
                const boundGetRowIdFromIndexFtn = dataServer.getRowIdFromIndex.bind(dataServer);
                const selectedRowIndices = this._rows.getIndices();
                return selectedRowIndices.map( (selectedRowIndex) => boundGetRowIdFromIndexFtn(selectedRowIndex) );
            }
        }
    }

    /** @internal */
    private restoreRowsStash(rowIds: unknown[] | undefined) {
        if (rowIds !== undefined) {
            const subgrid = this._subgrid;
            if (subgrid === undefined) {
                throw new RevAssertError('SRRS10987');
            } else {
                const rowIdCount = rowIds.length;
                if (rowIdCount > 0) {
                    const rowCount = subgrid.getRowCount();
                    const dataServer = subgrid.dataServer;

                    let rowIndexValues: number[] | undefined;
                    let rowIndexValueCount = 0;
                    if (dataServer.getRowIndexFromId !== undefined) {
                        rowIndexValues = new Array<number>(rowIdCount);
                        for (let i = 0; i < rowIdCount; i++) {
                            const rowId = rowIds[i];
                            const rowIndex = dataServer.getRowIndexFromId(rowId);
                            if (rowIndex !== undefined) {
                                rowIndexValues[rowIndexValueCount++] = rowIndex;
                            }
                        }
                    } else {
                        if (dataServer.getRowIdFromIndex !== undefined) {
                            rowIndexValues = new Array<number>(rowIdCount);
                            for (let rowIndex = 0; rowIndex < rowCount; ++rowIndex) {
                                const rowId = dataServer.getRowIdFromIndex(rowIndex);
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
                                    this._rows.add(startValue, previousValuePlus1 - startValue);
                                    startValue = value;
                                }
                                previousValue = value;
                                previousValuePlus1 = previousValue + 1;
                            }
                        }
                        this._rows.add(startValue, previousValuePlus1 - startValue);
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
     * @internal
     */
    private createColumnsStash() {
        const selectedColumns = this.getColumnIndices(false);
        return selectedColumns.map( (selectedColumnIndex) => this._columnsManager.getActiveColumn(selectedColumnIndex).field.name );
    }

    /** @internal */
    private restoreColumnsStash(fieldNames: string[] | undefined) {
        if (fieldNames !== undefined) {
            const fieldNameCount = fieldNames.length;
            if (fieldNameCount > 0) {
                const columnsManager = this._columnsManager;

                const indexValues = new Array<number>(fieldNameCount);
                let indexValueCount = 0;
                for (const fieldName of fieldNames) {
                    const activeColumnIndex = columnsManager.getActiveColumnIndexByFieldName(fieldName);
                    if (activeColumnIndex >= 0) {
                        indexValues[indexValueCount++] = activeColumnIndex;
                    }
                }

                if (indexValueCount > 0) {
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
                                this._columns.add(startValue, previousValuePlus1 - startValue);
                                startValue = value;
                            }
                            previousValue = value;
                            previousValuePlus1 = previousValue + 1;
                        }
                    }
                    this._columns.add(startValue, previousValuePlus1 - startValue);
                }
            }
        }
    }
}

/** @public */
export namespace RevSelection {
    /** @internal */
    export type ChangedEventer = (this: void) => void;

    export interface Stash<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
        readonly subgrid: RevSubgrid<BCS, SF> | undefined;
        readonly allAuto: boolean,
        readonly lastRectangleFirstCell: LastRectangleFirstCellStash | undefined;
        readonly rowIds: unknown[] | undefined,
        readonly columnNames: string[] | undefined,
    }

    export interface LastRectangleFirstCellStash {
        fieldName: string;
        rowId: unknown;
    }
}
