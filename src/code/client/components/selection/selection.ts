
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
    private _allAreaActive = false;

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

    /**
     * Gets the active subgrid for the selection.
     *
     * @returns The active subgrid, or `undefined` if no subgrid is set.
     */
    get subgrid(): RevSubgrid<BCS, SF> | undefined { return this._subgrid; }

    /**
     * Gets the total number of selection areas, including rectangles, rows, and columns.
     */
    get areaCount(): number { return this._rectangleList.areaCount + this._rows.areaCount + this._columns.areaCount; }
    /**
     * Gets the most recently selection area added to the selection.
     */
    get lastArea(): RevLastSelectionArea | undefined { return this._lastArea; }

    /**
     * Indicates whether the `all` selection area is active.
     *
     * When set to `true`, the all selection area is added to the selection and it will include all cells in the active subgrid - including
     * new rows and columns subsequently added to the subgrid.
     *
     */
    get allAreaActive(): boolean { return this._allAreaActive; }
    set allAreaActive(value: boolean) {
        if (value !== this._allAreaActive) {
            this.beginChange();
            try {
                const changed = value !== this._allAreaActive;
                if (changed) {
                    this._allAreaActive = value;
                    this._changed = true;
                    if (value) {
                        this._lastArea = this.createLastSelectionAreaFromAll();
                    } else {
                        if (this._lastArea !== undefined && this._lastArea.areaTypeId === RevSelectionAreaTypeId.all) {
                            this._lastArea = undefined;
                        }
                    }
                }
            } finally {
                this.endChange();
            }
        }
    }

    /**
     * Gets a readonly array of the rectangles which make up the rectangle selection areas included in the selection.
     */
    get rectangles(): readonly RevSelectionRectangle[] { return this._rectangleList.rectangles; }

    /** Gets whether the focus is linked to the selection. If it is linked, then selection will be cleared when focus changes. */
    get focusLinked(): boolean { return this._focusLinked; }

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
            allAreaActive: this._allAreaActive,
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
            this._allAreaActive = stash.allAreaActive;
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
            if (this._allAreaActive) {
                this._allAreaActive = false;
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
            this._subgrid = undefined;

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }
    }

    /** @internal */
    focusLinkableOnlySelectCell(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>, focusLinked: boolean) {
        this.beginChange();
        try {
            const area = this.onlySelectCell(activeColumnIndex, subgridRowIndex, subgrid);
            this._focusLinked = focusLinked;
            return area;
        } finally {
            this.endChange();
        }
    }

    /**
     * Selects only the specified cell in the given subgrid, clearing any previous selection.
     *
     * Use `RevFocusSelectBehavior.focusOnlySelectCell()` instead to both focus and select only the cell.
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
     * Create a selection area for a single cell and add the new area to the selection.
     *
     * If the subgrid is not the same as the active subgrid or multiple selection areas
     * are not allowed ({@link RevGridSettings.multipleSelectionAreas} is false), clear the selection before adding the new selection area.
     *
     * if {@link RevGridSettings.switchNewRectangleSelectionToRowOrColumn} is defined ('row' or 'column'), the new selection area will be made
     * as a row or column selection area instead of a rectangle.
     *
     * Use `RevFocusSelectBehavior.focusSelectCell()` instead to both focus and select the cell.
     *
     * @param activeColumnIndex - The index of the active column of the cell.
     * @param subgridRowIndex - The index of the row of the cell within the subgrid.
     * @param subgrid - The subgrid containing the cell.
     * @returns The selection area representing the selected cell.
     */
    selectCell(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): RevLastSelectionArea {
        return this.selectRectangle(activeColumnIndex, subgridRowIndex, 1, 1, subgrid);
    }

    /**
     * Deletes a cell (rectangle selection area) from the selection.
     *
     * @param activeColumnIndex - The column index of the cell to deselect.
     * @param subgridRowIndex - The row index within the subgrid of the cell to deselect.
     * @param subgrid - The subgrid containing the cell.
     */
    deleteCellArea(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): void {
        const rectangle: RevRectangle = {
            x: activeColumnIndex,
            y: subgridRowIndex,
            width: 1,
            height: 1,
        }
        this.deleteRectangleArea(rectangle, subgrid);
    }

    /**
     * Adds a selection area within the grid based on the specified area type and dimensions.
     *
     * If the subgrid is not the same as the active subgrid or multiple selection areas
     * are not allowed ({@link RevGridSettings.multipleSelectionAreas} is false), clear the selection before adding the new selection area.
     *
     * if `areaTypeId` is `rectangle` and {@link RevGridSettings.switchNewRectangleSelectionToRowOrColumn} is defined ('row' or 'column'), the new selection area will be made
     * as a row or column selection area instead of a rectangle.
     *
     * @param areaTypeId - The type of selection area to create (e.g., all, rectangle, column, row).
     * @param leftOrExRightActiveColumnIndex - The left active column index of the selection area if `width` is positive, or the exclusive right index if `width` is negative.
     * @param topOrBottomSubgridRowIndex - The top subgrid row index of the selection area if `height` is positive, or the exclusive bottom index if `height` is negative.
     * @param width - The number of columns in the selection area. If negative, `width` is in reverse direction from the exclusive right index.
     * @param height - The number of rows in the selection area. If negative, `height` is in reverse direction from the exclusive bottom index.
     * @param subgrid - The subgrid context in which the selection is being made.
     * @returns The created {@link RevLastSelectionArea} if a valid area is selected; otherwise, `undefined`.
     * @throws {@link RevUnreachableCaseError} If an unknown area type is provided.
     */
    selectArea(
        areaTypeId: RevSelectionAreaTypeId,
        leftOrExRightActiveColumnIndex: number,
        topOrBottomSubgridRowIndex: number,
        width: number,
        height: number,
        subgrid: RevSubgrid<BCS, SF>
    ): RevLastSelectionArea | undefined {
        this.beginChange();
        try {
            let area: RevLastSelectionArea | undefined;
            switch (areaTypeId) {
                case RevSelectionAreaTypeId.all: {
                    this.allAreaActive = true;
                    area = this.createLastSelectionAreaFromAll();
                    break;
                }
                case RevSelectionAreaTypeId.rectangle: {
                    if (width === 0 || height === 0) {
                        area = undefined;
                    } else {
                        area = this.selectRectangle(leftOrExRightActiveColumnIndex, topOrBottomSubgridRowIndex, width, height, subgrid);
                    }
                    break;
                }
                case RevSelectionAreaTypeId.column: {
                    if (width === 0) {
                        area = undefined;
                    } else {
                        area = this.selectColumns(leftOrExRightActiveColumnIndex, topOrBottomSubgridRowIndex, width, height);
                    }
                    break;
                }
                case RevSelectionAreaTypeId.row: {
                    if (height === 0) {
                        area = undefined;
                    } else {
                        area = this.selectRows(leftOrExRightActiveColumnIndex, topOrBottomSubgridRowIndex, width, height, subgrid);
                    }
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

    /**
     * Deletes the last selected area from the selection.
     */
    deleteLastArea(): void {
        const lastArea = this._lastArea;
        this._lastArea = undefined;
        if (lastArea !== undefined) {
            switch (lastArea.areaTypeId) {
                case RevSelectionAreaTypeId.all: {
                    this.allAreaActive = false;
                    break;
                }
                case RevSelectionAreaTypeId.rectangle: {
                    const subgrid = this._subgrid;
                    if (subgrid === undefined) {
                        throw new RevAssertError('SDLA13690');
                    } else {
                        this.deleteRectangleArea(lastArea, subgrid);
                    }
                    break;
                }
                case RevSelectionAreaTypeId.column: {
                    this.deselectColumns(lastArea.x, lastArea.width);
                    break;
                }
                case RevSelectionAreaTypeId.row: {
                    const subgrid = this._subgrid;
                    if (subgrid === undefined) {
                        throw new RevAssertError('SDLA13690');
                    } else {
                        this.deselectRows(lastArea.y, lastArea.height, subgrid);
                    }
                    break;
                }
                default:
                    throw new RevUnreachableCaseError('SDLA34499', lastArea.areaTypeId)
            }
        }
    }

    /**
     * Clears the current selection and adds a new rectangular selection area.
     *
     * if {@link RevGridSettings.switchNewRectangleSelectionToRowOrColumn} is defined ('row' or 'column'), the new selection area will be made as a row or column selection area instead of a rectangle.
     *
     * @param leftOrExRightActiveColumnIndex - The left active column index of the rectangle if `width` is positive, or the exclusive right index if `width` is negative.
     * @param topOrExBottomSubgridRowIndex - The top subgrid row index of the rectangle if `height` is positive, or the exclusive bottom index if `height` is negative.
     * @param width - The number of columns in the rectangle. If negative, `width` is in reverse direction from the exclusive right index.
     * @param height - The number of rows in the rectangle. If negative, `height` is in reverse direction from the exclusive bottom index.
     * @param subgrid - The subgrid in which the rectangle is to be made.
     * @returns The (rectangle) selection area added to the selection.
     */
    onlySelectRectangle(leftOrExRightActiveColumnIndex: number, topOrExBottomSubgridRowIndex: number, width: number, height: number, subgrid: RevSubgrid<BCS, SF>): RevLastSelectionArea {
        this.beginChange();
        try {
            this.clear();
            return this.selectRectangle(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid);
        } finally {
            this.endChange();
        }
    }

    /**
     * Add a new rectangular selection area to the selection.
     *
     * If the subgrid is not the same as the active subgrid or multiple selection areas
     * are not allowed ({@link RevGridSettings.multipleSelectionAreas} is false), clear the selection before adding the new selection area.
     *
     * if {@link RevGridSettings.switchNewRectangleSelectionToRowOrColumn} is defined ('row' or 'column'), the new selection area will be made as a row or column selection area instead of a rectangle.
     *
     * @param leftOrExRightActiveColumnIndex - The left active column index of the rectangle if `width` is positive, or the exclusive right index if `width` is negative.
     * @param topOrExBottomSubgridRowIndex - The top subgrid row index of the rectangle if `height` is positive, or the exclusive bottom index if `height` is negative.
     * @param width - The number of columns in the rectangle. If negative, `width` is in reverse direction from the exclusive right index.
     * @param height - The number of rows in the rectangle. If negative, `height` is in reverse direction from the exclusive bottom index.
     * @param subgrid - The subgrid in which the rectangle is to be made.
     * @param silent - If true, suppresses any change notifications.
     * @returns The (rectangle) selection area added to the selection.
     */
    selectRectangle(leftOrExRightActiveColumnIndex: number, topOrExBottomSubgridRowIndex: number, width: number, height: number, subgrid: RevSubgrid<BCS, SF>, silent = false): RevLastSelectionArea {
        this.beginChange();
        try {
            const switchNewRectangleSelectionToRowOrColumn = this._gridSettings.switchNewRectangleSelectionToRowOrColumn;
            if (switchNewRectangleSelectionToRowOrColumn !== undefined) {
                switch (switchNewRectangleSelectionToRowOrColumn) {
                    case 'row': return this.selectRows(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid);
                    case 'column': return this.selectColumns(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height);
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

    /**
     * Deletes a rectangular selection area from the selection.
     *
     * If the subgrid specified is not the same as the current active subgrid, the selection is cleared.
     *
     * @param rectangle - The rectangle area to deselect.
     * @param subgrid - The subgrid in which the rectangle selection exists.
     */
    deleteRectangleArea(rectangle: RevRectangle, subgrid: RevSubgrid<BCS, SF>): void {
        if (subgrid !== this._subgrid) {
            this.clear();
            this._subgrid = subgrid;
        } else {
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
     * Create a row selection area and add the new area to the selection.
     *
     * If the subgrid is not the same as the active subgrid or multiple selection areas
     * are not allowed ({@link RevGridSettings.multipleSelectionAreas} is false), clear the selection before adding the new selection area.
     *
     * While the leftOrExRightActiveColumnIndex and width values are not needed to specify the rows, they are needed to create a
     * selection area.  Normally they are set to specify all active columns.
     *
     * Recommend use `RevFocusSelectBehavior.selectRows()` instead.
     *
     * @param leftOrExRightActiveColumnIndex - The start index of the range of active columns to include in last area if `width` is positive, or the exclusive end index if `width` is negative.
     * @param topOrExBottomSubgridRowIndex - The start index of the range of subgrid rows to select if `count` is positive, or the exclusive end index if `count` is negative.
     * @param width - The number of active columns to include in the last area. If negative, `width` is in reverse direction from the exclusive end index.
     * @param count - The number of subgrid rows to include in the new selection area. If negative, `count` is in reverse direction from the exclusive bottom subgrid row index.
     * @param subgrid - The subgrid in which the new selection area is made.
     * @returns The last selection area which contains the selected rows.
     */
    selectRows(leftOrExRightActiveColumnIndex: number, topOrExBottomSubgridRowIndex: number, width: number, count: number, subgrid: RevSubgrid<BCS, SF>): RevLastSelectionArea {
        this.beginChange();
        try {
            if (subgrid !== this._subgrid) {
                this.clear();
                this._subgrid = subgrid;
            }

            if (!this._gridSettings.multipleSelectionAreas) {
                this.clear();
            }

            const changed = this._rows.add(topOrExBottomSubgridRowIndex, count);
            const lastArea = new RevLastSelectionArea(RevSelectionAreaTypeId.row, leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, count);
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
     * If the subgrid is not the same as the active subgrid or multiple selection areas
     * are not allowed ({@link RevGridSettings.multipleSelectionAreas} is false), the selection is cleared before adding all the rows to the selection.
     *
     * The leftOrExRightActiveColumnIndex and width values are needed to create a selection area.  Normally they are set to specify all columns in the subgrid.
     *
     * Note that while this selects all cells in the subgrid, it differs from {@link allAreaActive} in that this selection area will not include new rows subsequently added to the subgrid.
     *
     * Recommend use `RevFocusSelectBehavior.selectAllRows()` instead.
     *
     * @param leftOrExRightActiveColumnIndex - The start index of the range of active columns to include if `width` is positive, or the exclusive end index if `width` is negative.
     * @param width - The number of active columns to include in the new selection area. If negative, width is in reverse direction from the exclusive end index.
     * @param subgrid - The subgrid instance containing the rows to be selected.
     */
    selectAllRows(leftOrExRightActiveColumnIndex: number, width: number, subgrid: RevSubgrid<BCS, SF>): void {
        const subgridRowCount = subgrid.getRowCount();
        this.selectRows(leftOrExRightActiveColumnIndex, 0, width, subgridRowCount, subgrid);
    }

    /**
     * Removes a range of rows from the selection.
     *
     * The list of row selection areas will be updated to reflect the necessary deletion, splitting or resizing required.
     *
     * If the subgrid specified is not the same as the current active subgrid, the selection is cleared.
     *
     * @param topOrExBottomSubgridRowIndex - The start index of the range of subgrid rows to deselect if `count` is positive, or the exclusive end index if `count` is negative.
     * @param count - The number of rows to deselect. If negative, count is in reverse direction from the exclusive bottom active row index.
     * @param subgrid - The subgrid from which rows should be deselected.
     */
    deselectRows(topOrExBottomSubgridRowIndex: number, count: number, subgrid: RevSubgrid<BCS, SF>): void {
        if (subgrid !== this._subgrid) {
            this.clear();
            this._subgrid = subgrid;
        } else {
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

    /**
     * Adds the specified row to the selection if it is not already included, otherwise removes it from the selection.
     *
     * If subgrid is different from the current active subgrid, the selection is cleared before adding the row.
     *
     * While the leftOrExRightActiveColumnIndex and width values are not needed to toggle the row, they are needed to create a
     * selection area.  Normally they are set to specify all active columns.
     *
     * Recommend use `RevFocusSelectBehavior.toggleSelectRow()` instead.
     *
     * @param leftOrExRightActiveColumnIndex - The start index of the range of active columns to include in last area if `width` is positive, or the exclusive end index if `width` is negative.
     * @param subgridRowIndex - The index of the row within the subgrid to toggle selection.
     * @param width - The number of active columns to include in the last area. If negative, `width` is in reverse direction from the exclusive end index.
     * @param subgrid - The subgrid instance containing the row.
     */
    toggleSelectRow(leftOrExRightActiveColumnIndex: number, subgridRowIndex: number, width: number, subgrid: RevSubgrid<BCS, SF>): void {
        if (subgrid !== this._subgrid) {
            this.selectRows(leftOrExRightActiveColumnIndex, subgridRowIndex, width, 1, subgrid); // will clear selection then add the row to selection
        } else {
            if (this._rows.includesIndex(subgridRowIndex)) {
                this.deselectRows(subgridRowIndex, 1, subgrid);
            } else {
                this.selectRows(leftOrExRightActiveColumnIndex, subgridRowIndex, width, 1, subgrid);
            }
        }
    }

    /**
     * Create a column selection area and add the new area to the selection.
     *
     * If multiple selection areas are not allowed ({@link RevGridSettings.multipleSelectionAreas} is false), the selection is cleared before proceeding.
     *
     * While the topOrExBottomSubgridRowIndex and height values are not needed to specify the rows, they are needed to create a
     * selection area.  Normally they are set to specify all rows in the subgrid.
     *
     * Recommend use `RevFocusSelectBehavior.selectColumns()` instead.
     *
     * @param leftOrExRightActiveColumnIndex - The start index of the range of active columns to select if `count` is positive, or the exclusive end index if `count` is negative.
     * @param topOrExBottomSubgridRowIndex - The start index of the range of subgrid rows to include in last area if `height` is positive, or the exclusive end index if `height` is negative.
     * @param count - The number of active columns to include in the new selection area. If negative, `count` is in reverse direction from the exclusive end index.
     * @param height - The number of subgrid rows to include in the last area. If negative, `height` is in reverse direction from the exclusive bottom subgrid row index.
     * @returns The last selection area which contains the selected columns.
     */
    selectColumns(leftOrExRightActiveColumnIndex: number, topOrExBottomSubgridRowIndex: number, count: number, height: number): RevLastSelectionArea {
        this.beginChange();

        if (!this._gridSettings.multipleSelectionAreas) {
            this.clear();
        }

        const changed = this._columns.add(leftOrExRightActiveColumnIndex, count);
        const lastArea = new RevLastSelectionArea(RevSelectionAreaTypeId.column, leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, count, height);
        if (changed) {
            this._lastArea = lastArea;
            this.flagChanged(false);
        }
        this.endChange();

        return lastArea;
    }

    /**
     * Removes a range of columns from the selection.
     *
     * The list of column selection areas will be updated to reflect the necessary deletion, splitting or resizing required.
     *
     * @param leftOrExRightActiveColumnIndex - The start index of the range of active columns to deselect if `count` is positive, or the exclusive end index if `count` is negative.
     * @param count - The number of columns to deselect. If negative, `count` is in reverse direction from the exclusive end index.
     */
    deselectColumns(leftOrExRightActiveColumnIndex: number, count: number): void {
        const changed = this._columns.delete(leftOrExRightActiveColumnIndex, count);
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
                    let lastLeftOrExRightActiveColumnIndex: number;
                    let lastWidth: number;
                    // set lastX and lastWidth so that last area still specifies the same corner
                    if (oldLength >= 0) {
                        lastLeftOrExRightActiveColumnIndex = overlapStart;
                        lastWidth = overlapLength;
                    } else {
                        lastLeftOrExRightActiveColumnIndex = overlapStart + overlapLength;
                        lastWidth = -overlapLength;
                    }

                    this._lastArea = new RevLastSelectionArea(RevSelectionAreaTypeId.column, lastLeftOrExRightActiveColumnIndex, lastY, lastWidth, lastHeight);
                }
            }
            this.flagChanged(false);
            this.endChange();
        }
    }

    /**
     * Adds the specified column to the selection if it is not already included, otherwise removes it from the selection.
     *
     * While the topOrExBottomSubgridRowIndex and height values are not needed to specify the rows, they are needed to create a
     * selection area.  Normally they are set to specify all rows in the subgrid.
     *
     * Recommend use `RevFocusSelectBehavior.toggleSelectColumn()` instead.
     *
     * @param activeColumnIndex - The index of the column to toggle selection for.
     * @param topOrExBottomSubgridRowIndex - The row index used for selection context (e.g., top or bottom subgrid row).
     * @param height - The height of the selection range.
     */
    toggleSelectColumn(activeColumnIndex: number, topOrExBottomSubgridRowIndex: number, height: number): void {
        if (this._columns.includesIndex(activeColumnIndex)) {
            this.deselectColumns(activeColumnIndex, 1);
        } else {
            this.selectColumns(activeColumnIndex, topOrExBottomSubgridRowIndex, 1, height);
        }
    }

    /**
     * Deletes the current last selection area (if it exists) and add a new selection area which becomes the new last selection area.
     *
     * @param areaTypeId - The type identifier for the selection area.
     * @param leftOrExRightActiveColumnIndex - The left active column index of the selection area if `width` is positive, or the exclusive right index if `width` is negative.
     * @param topOrExBottomSubgridRowIndex - The top subgrid row index of the selection area if `height` is positive, or the exclusive bottom index if `height` is negative.
     * @param width - The number of columns in the selection area. If negative, `width` is in reverse direction from the exclusive right index.
     * @param height - The number of rows in the selection area. If negative, `height` is in reverse direction from the exclusive bottom index.
     * @param subgrid - The subgrid in which the selection area is defined.
     * @returns The newly created {@link RevLastSelectionArea}, or `undefined` if the specified area could not be created.
     */
    replaceLastArea(
        areaTypeId: RevSelectionAreaTypeId,
        leftOrExRightActiveColumnIndex: number,
        topOrExBottomSubgridRowIndex: number,
        width: number,
        height: number,
        subgrid: RevSubgrid<BCS, SF>
    ): RevLastSelectionArea | undefined {
        this.beginChange();
        try {
            this.deleteLastArea();
            return this.selectArea(areaTypeId, leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid);
        } finally {
            this.endChange();
        }
    }

    /**
     * Deletes the current last selection area (if it exists) and add a new rectangular selection area which becomes the new last selection area.
     *
     * If the subgrid is not the same as the active subgrid or multiple selection areas
     * are not allowed ({@link RevGridSettings.multipleSelectionAreas} is false), clear the selection before adding the new selection area.
     *
     * @param leftOrExRightActiveColumnIndex - The left active column index of the selection area if `width` is positive, or the exclusive right index if `width` is negative.
     * @param topOrExBottomSubgridRowIndex - The top subgrid row index of the selection area if `height` is positive, or the exclusive bottom index if `height` is negative.
     * @param width - The number of columns in the selection area. If negative, `width` is in reverse direction from the exclusive right index.
     * @param height - The number of rows in the selection area. If negative, `height` is in reverse direction from the exclusive bottom index.
     * @param subgrid - The subgrid in which the rectangle selection area is defined.
     * @returns The newly created {@link RevLastSelectionArea | selection area}, or `undefined` if the specified area could not be created.
     */
    replaceLastAreaWithRectangle(
        leftOrExRightActiveColumnIndex: number,
        topOrExBottomSubgridRowIndex: number,
        width: number,
        height: number,
        subgrid: RevSubgrid<BCS, SF>
    ): RevLastSelectionArea {
        this.beginChange();
        try {
            this.deleteLastArea();
            return this.selectRectangle(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid);
        } finally {
            this.endChange();
        }
    }

    /**
     * Deletes the current last selection area (if it exists) and select a range of columns which becomes the new last selection area.
     *
     * If multiple selection areas are not allowed ({@link RevGridSettings.multipleSelectionAreas} is false), the selection is cleared before proceeding.
     *
     * While the topOrExBottomSubgridRowIndex and height values are not needed to specify the rows, they are needed to create a
     * selection area.  Normally they are set to specify all rows in the subgrid.
     *
     * @param leftOrExRightActiveColumnIndex - The start index of the range of active columns to select if `count` is positive, or the exclusive end index if `count` is negative.
     * @param topOrExBottomSubgridRowIndex - The start index of the range of subgrid rows to include in last area if `height` is positive, or the exclusive end index if `height` is negative.
     * @param count - The number of active columns to include in the new selection area. If negative, `count` is in reverse direction from the exclusive end index.
     * @param height - The number of subgrid rows to include in the last area. If negative, `height` is in reverse direction from the exclusive bottom subgrid row index.
     * @returns The newly created {@link RevLastSelectionArea | selection area}.
     */
    replaceLastAreaWithColumns(leftOrExRightActiveColumnIndex: number, topOrExBottomSubgridRowIndex: number, count: number, height: number): RevLastSelectionArea {
        this.beginChange();
        try {
            this.deleteLastArea();
            return this.selectColumns(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, count, height);
        } finally {
            this.endChange();
        }
    }

    /**
     * Deletes the current last selection area (if it exists) and select a range of rows which becomes the new last selection area.
     *
     * If the subgrid is not the same as the active subgrid or multiple selection areas
     * are not allowed ({@link RevGridSettings.multipleSelectionAreas} is false), clear the selection before adding the new selection area.
     *
     * While the leftOrExRightActiveColumnIndex and width values are not needed to specify the rows, they are needed to create a
     * selection area.  Normally they are set to specify all active columns.
     *
     * @param leftOrExRightActiveColumnIndex - The start index of the range of active columns to include in last area if `width` is positive, or the exclusive end index if `width` is negative.
     * @param topOrExBottomSubgridRowIndex - The start index of the range of subgrid rows to select if `count` is positive, or the exclusive end index if `count` is negative.
     * @param width - The number of active columns to include in the last area. If negative, `width` is in reverse direction from the exclusive end index.
     * @param count - The number of subgrid rows to include in the new selection area. If negative, `count` is in reverse direction from the exclusive bottom subgrid row index.
     * @param subgrid - The subgrid in which the selection is made.
     * @returns The newly created {@link RevLastSelectionArea | selection area}.
     */
    replaceLastAreaWithRows(leftOrExRightActiveColumnIndex: number, topOrExBottomSubgridRowIndex: number, width: number, count: number, subgrid: RevSubgrid<BCS, SF>): RevLastSelectionArea {
        this.beginChange();
        try {
            this.deleteLastArea();
            return this.selectRows(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, count, subgrid);
        } finally {
            this.endChange();
        }
    }

    /**
     * Selects the cell if it not covered by any existing selection area, or removes/deselects the highest priority selection area covering the cell.
     *
     * @param activeColumnIndex - The index of the column containing the cell to toggle.
     * @param subgridRowIndex - The row index within the subgrid containing the cell to toggle.
     * @param subgrid - The subgrid instance in which the cell resides.
     * @returns `true` if the cell was selected; `false` if the a selection area covering the cell was removed/deselected.
     */
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
                        this.allAreaActive = false;
                        break;
                    }
                    case RevSelectionAreaTypeId.rectangle: {
                        this.deleteRectangleArea(priorityCoveringArea, subgrid);
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

    /**
     * Indicates that the selection is linked to focus and should be cleared when focus changes.
     */
    flagFocusLinked(): void {
        this._focusLinked = true;
    }

    /**
     * Determines whether the specified column index is currently selected.
     *
     * @param activeColumnIndex - The index of the column to check for selection.
     * @returns `true` if the column at the given index is selected; otherwise, `false`.
     */
    isColumnSelected(activeColumnIndex: number): boolean {
        return this._columns.includesIndex(activeColumnIndex);
    }

    /**
     * Determines whether a specific cell is selected within the grid.
     *
     * @param activeColumnIndex - The index of the column for the cell to check.
     * @param subgridRowIndex - The row index within the subgrid for the cell to check.
     * @param subgrid - The subgrid instance containing the cell.
     * @returns `true` if the cell is selected; otherwise, `false`.
     */
    isCellSelected(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): boolean {
        return this.getOneCellSelectionAreaTypeId(activeColumnIndex, subgridRowIndex, subgrid) !== undefined;
    }

    /**
     * Determines if the specified cell is the only selected cell in the given subgrid.
     *
     * @param activeColumnIndex - The column index of the cell to check.
     * @param subgridRowIndex - The row index of the cell to check within the subgrid.
     * @param subgrid - The subgrid instance containing the cell.
     * @returns `undefined` if not selected, `false` if selected with others, `true` if the only cell selected.
     */
    isOnlyThisCellSelected(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): boolean | undefined {
        const selectedType = this.getOneCellSelectionAreaTypeId(activeColumnIndex, subgridRowIndex, subgrid);
        if (selectedType === undefined) {
            return undefined;
        } else {
            return this.isSelectedCellTheOnlySelectedCell(activeColumnIndex, subgridRowIndex, subgrid, selectedType)
        }
    }

    /**
     * Gets a selection area type for a single cell.
     *
     * @param activeColumnIndex - The column index of the cell.
     * @param subgridRowIndex - The row index of the cell within the subgrid.
     * @param subgrid - The subgrid instance containing the cell.
     * @returns The selection area type ID (`RevSelectionAreaTypeId`) if the cell is part of a selection area,
     *          or `undefined` if the cell is not selected or the subgrid does not match.
     *
     * The method checks, in order:
     * - If the provided subgrid matches the current selection's subgrid.
     * - If the entire area is active (`all`).
     * - If the row is included in the selection (`row`).
     * - If the column is included in the selection (`column`).
     * - If the cell is within any selected rectangle (`rectangle`).
     * - Returns `undefined` if none of the above conditions are met.
     */
    getOneCellSelectionAreaTypeId(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): RevSelectionAreaTypeId | undefined {
        if (subgrid !== this._subgrid) {
            return undefined;
        } else {
            if (this._allAreaActive) {
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

    /**
     * Returns an array of all {@link RevSelectionAreaTypeId | selection area type IDs} that apply to the specified cell.
     *
     * @param activeColumnIndex - The column index of the cell.
     * @param subgridRowIndex - The row index of the cell within the subgrid.
     * @param subgrid - The subgrid instance containing the cell.
     * @returns An array of `RevSelectionAreaTypeId` values indicating which selection areas
     *          the specified cell belongs to. Returns an empty array if the subgrid does not match.
     */
    getAllCellSelectionAreaTypeIds(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): RevSelectionAreaTypeId[] {
        if (subgrid !== this._subgrid) {
            return [];
        } else {
            const selectedTypes: RevSelectionAreaTypeId[] = [];
            if (this._allAreaActive) {
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

    /**
     * Determines whether a selected cell is the only cell selected in the grid.
     *
     * @param activeColumnIndex - The column index of the cell.
     * @param subgridRowIndex - The row index of the cell within the subgrid.
     * @param subgrid - The subgrid instance containing the cell.
     * @param selectedTypeId - The type of selection area used to select the cell.
     * @returns `true` if the active cell is the only selected cell, otherwise `false`.
     * @throws `RevUnreachableCaseError` If an unknown `selectedTypeId` is provided.
     */
    isSelectedCellTheOnlySelectedCell(
        activeColumnIndex: number,
        subgridRowIndex: number,
        subgrid: RevSubgrid<BCS, SF>, // assume this was previously checked by getCellSelectedType
        selectedTypeId: RevSelectionAreaTypeId
    ): boolean {
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

    /**
     * Determines whether the selection contains any column or row selection areas.
     *
     * @param includeAllAreaIfActive - If `true`, and {@link allAreaActive} is `true`, then considers all active columns, and rows in the subgrid, to be selected.
     * @returns `true` if there are any selected columns or rows, or if the "all area" mode is active and there are columns or rows available; otherwise, `false`.
     * @throws RevAssertError If the subgrid is undefined when checking for row count in "all area" mode.
     */
    hasColumnsOrRows(includeAllAreaIfActive: boolean): boolean {
        if (this._columns.hasIndices() || this._rows.hasIndices()) {
            return true;
        } else {
            if (!includeAllAreaIfActive || !this._allAreaActive) {
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

    hasRows(includeAllAreaIfActive: boolean) {
        if (this._rows.hasIndices()) {
            return true;
        } else {
            if (!includeAllAreaIfActive || !this._allAreaActive) {
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

    getRowCount(includeAllAreaIfActive: boolean) {
        if (includeAllAreaIfActive && this._allAreaActive) {
            return this.getAllAreaRowCount();
        } else {
            return this._rows.getIndexCount();
        }
    }

    getAllAreaRowCount() {
        if (!this._allAreaActive) {
            return 0;
        } else {
            if (this._subgrid === undefined) {
                throw new RevAssertError('SGARC66698');
            } else {
                return this._subgrid.getRowCount();
            }
        }
    }

    getRowIndices(includeAllAreaIfActive: boolean) {
        if (includeAllAreaIfActive && this._allAreaActive) {
            return this.getAllAreaRowIndices();
        } else {
            return this._rows.getIndices();
        }
    }

    getAllAreaRowIndices() {
        if (!this._allAreaActive) {
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
     * @param includeAllAreaIfActive - If `true`, considers then any active columns are considered as column selection areas.
     * @returns `true` if selection contains one or more column selection areas, otherwise `false`.
     */
    hasColumns(includeAllAreaIfActive: boolean): boolean {
        if (this._columns.hasIndices()) {
            return true;
        } else {
            if (!includeAllAreaIfActive || !this._allAreaActive) {
                return false;
            } else {
                return this._columnsManager.activeColumnCount > 0;
            }
        }
    }

    getColumnIndices(includeAllAreaIfActive: boolean): number[] {
        if (includeAllAreaIfActive && this._allAreaActive) {
            return this.getAllAreaColumnIndices();
        } else {
            return this._columns.getIndices();
        }
    }

    getAllAreaColumnIndices(): number[] {
        if (!this._allAreaActive) {
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
            if (this._allAreaActive) {
                const area = this.createLastSelectionAreaFromAll();
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
    private createLastSelectionAreaFromAll(): RevLastSelectionArea | undefined {
        const subgrid = this._subgrid;
        if (subgrid === undefined) {
            return undefined;
        } else {
            const rowCount = subgrid.getRowCount();
            const activeColumnCount = this._columnsManager.activeColumnCount;
            if (rowCount === 0 || activeColumnCount === 0) {
                return undefined;
            } else {
                const x = 0;
                const y = 0;
                const lastSelectionArea = new RevLastSelectionArea(
                    RevSelectionAreaTypeId.all,
                    x,
                    y,
                    activeColumnCount,
                    rowCount
                );
                return lastSelectionArea;
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
        readonly allAreaActive: boolean,
        readonly lastRectangleFirstCell: LastRectangleFirstCellStash | undefined;
        readonly rowIds: unknown[] | undefined,
        readonly columnNames: string[] | undefined,
    }

    export interface LastRectangleFirstCellStash {
        fieldName: string;
        rowId: unknown;
    }
}
