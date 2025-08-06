
import { addToArrayUniquely, doesArrayContainArray, subtractArrays } from '@pbkware/js-utils';
import { RevAssertError, RevClientObject, RevRectangle, RevSchemaField, RevSelectionAreaType, RevSelectionAreaTypeId, RevSelectionAreaTypeSpecifierId, RevUnreachableCaseError } from '../../../common';
import { RevSubgrid } from '../../interfaces';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../../settings';
import { RevColumnsManager } from '../column';
import { RevFocus } from '../focus';
import { RevSubgridsManager } from '../subgrid';
import { RevContiguousIndexRange } from './contiguous-index-range';
import { RevFirstCornerArea } from './first-corner-area';
import { RevLastSelectionArea } from './last-selection-area';
import { RevSelectionArea } from './selection-area';
import { RevSelectionRangeList } from './selection-range-list';
import { RevSelectionRectangle } from './selection-rectangle';
import { RevSelectionRectangleList } from './selection-rectangle-list';
import { RevSelectionRows } from './selection-rows';

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
    private readonly _rows = new RevSelectionRows<BCS, SF>();
    /** @internal */
    private readonly _columns = new RevSelectionRangeList();
    /** @internal */
    private readonly _rectangleList = new RevSelectionRectangleList<BCS, SF>();
    /** @internal */
    private readonly _dynamicAllSubgrids = new Array<RevSubgrid<BCS, SF>>();

    /** @internal */
    private _lastArea: RevLastSelectionArea<BCS, SF> | undefined;

    /** @internal */
    private _clearOnNextFocusChange = false;

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
        private readonly _subgridsManager: RevSubgridsManager<BCS, SF>,
        /** @internal */
        private readonly _focus: RevFocus<BGS, BCS, SF>,
    ) {
        this._focus.currentCellChangedForSelectionEventer = () => {
            if (this._clearOnNextFocusChange) {
                this._clearOnNextFocusChange = false;
                this.clear();
            }
        }
    }

    /**
     * Gets the most recently selection area added to the selection.
     */
    get lastArea(): RevLastSelectionArea<BCS, SF> | undefined { return this._lastArea; }

    /**
     * Gets the all the subgrids for which dynamic all selection is active.
     */
    get dynamicAllSubgrids(): readonly RevSubgrid<BCS, SF>[] { return this._dynamicAllSubgrids; }

    /** Determines whether the selection will be cleared on the next focus change. */
    get clearOnNextFocusChange(): boolean { return this._clearOnNextFocusChange; }
    set clearOnNextFocusChange(value: boolean) { this._clearOnNextFocusChange = value; }

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
        const rows = this.createRowsStash();
        const columns = this.createColumnsStash();

        return {
            dynamicAll: this._dynamicAllSubgrids.slice(),
            lastRectangleFirstCell,
            rows,
            columns,
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
            this._dynamicAllSubgrids.splice(0, 0, ...stash.dynamicAll);
            this.restoreLastRectangleFirstCellStash(stash.lastRectangleFirstCell, allRowsKept);
            this.restoreRowsStash(stash.rows);
            this.restoreColumnsStash(stash.columns);
        } finally {
            this.endChange();
        }
    }

    hasRectangles(subgrid: RevSubgrid<BCS, SF> | undefined): boolean {
        return this._rectangleList.has(subgrid);
    }

    /**
     * Retrieves the list of selection rectangles for the specified subgrid.
     *
     * @param subgrid - The subgrid for which to get the selection rectangles. If undefined, returns rectangles for all subgrids.
     * @returns A readonly array of `RevSelectionRectangle` objects representing the current selection rectangles from either the given subgrid or all subgrids.
     */
    getRectangles(subgrid: RevSubgrid<BCS, SF> | undefined): readonly RevSelectionRectangle<BCS, SF>[] {
        return this._rectangleList.getRectangles(subgrid);
    }

    /**
     * Get the last rectangle added to the selection.
     */
    getLastRectangle(): RevSelectionRectangle<BCS, SF> | undefined {
        return this._rectangleList.getLastRectangle();
    }

    /**
     * Clears the selection
     */
    clear(): void {
        this.beginChange();
        try {
            let changed = false;
            if (this.deselectDynamicAll(undefined)) {
                changed = true;
            }

            if (this._rectangleList.has(undefined)) {
                this._rectangleList.clear();
                changed = true;
            }

            if (this._columns.hasIndices()) {
                this._columns.clear();
                changed = true;
            }

            if (this._rows.hasIndices(undefined)) {
                this._rows.clear();
                changed = true;
            }

            this._lastArea = undefined;
            this._clearOnNextFocusChange = false;

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
            this._clearOnNextFocusChange = focusLinked;
            return area;
        } finally {
            this.endChange();
        }
    }

    /**
     * Selects all rows, columns or cells in either all subgrids or a specific subgrid.
     *
     * If `subgrid` is `undefined`, selects all rows in all subgrids (unless already selected).
     * If a specific `subgrid` is provided, selects all rows in that subgrid (unless already selected).
     *
     * This selection area(s) will be dynamically adjusted if rows or columns are added or removed in a subgrid.
     *
     * @param subgrid - The specific subgrid to select all rows in, or `undefined` to select all rows in all subgrids.
     * @returns The last selection area created by this operation, or `undefined` if the selection was already present. Since a selection area can cover only one subgrid,
     * if `subgrid` is `undefined`, the last area will be created using the main subgrid.
     */
    selectDynamicAll(subgrid: RevSubgrid<BCS, SF> | undefined): RevLastSelectionArea<BCS, SF> | undefined {
        this.beginChange();
        try {
            if (subgrid === undefined) {
                if (doesArrayContainArray(this._dynamicAllSubgrids, this._subgridsManager.subgrids)) {
                    return undefined; // already selected all subgrids
                } else {
                    addToArrayUniquely(this._dynamicAllSubgrids, this._subgridsManager.subgrids)
                    const lastArea = this.createLastSelectionAreaFromAll(this._subgridsManager.mainSubgrid); // use main subgrid as area can only cover one subgrid
                    this._lastArea = lastArea;
                    this.flagChanged(false);
                    return lastArea;
                }
            } else {
                const index = this._dynamicAllSubgrids.indexOf(subgrid);
                if (this._dynamicAllSubgrids.includes(subgrid)) {
                    return undefined; // already selected this subgrid
                } else {
                    this._dynamicAllSubgrids.push(subgrid);
                    const lastArea = this.createLastSelectionAreaFromAll(subgrid);
                    this._lastArea = lastArea;
                    this.flagChanged(false);
                    return lastArea;
                }
            }
        } finally {
            this.endChange();
        }
    }

    /**
     * Deselects the "dynamic all" selection for either all subgrids or a specific subgrid.
     *
     * If no subgrid is specified, this method removes the dynamic all selection areas for all subgrids.
     * If a specific subgrid is provided, only that subgrid's "dynamic all" selection is removed.
     *
     * The method returns `true` if any selection was actually changed, or `false` if there was nothing to deselect.
     *
     * @param subgrid - The specific subgrid to deselect, or `undefined` to deselect all subgrids.
     * @returns `true` if a deselection occurred, `false` otherwise.
     */
    deselectDynamicAll(subgrid: RevSubgrid<BCS, SF> | undefined): boolean {
        this.beginChange();
        try {
            if (subgrid === undefined) {
                if (this._dynamicAllSubgrids.length === 0) {
                    return false; // all subgrids are not selected
                } else {
                    this._dynamicAllSubgrids.length = 0;
                    const lastArea = this._lastArea;
                    if (lastArea !== undefined && lastArea.areaTypeId === RevSelectionAreaTypeId.dynamicAll) {
                        this._lastArea = undefined;
                    }
                    this.flagChanged(false);
                    return true;
                }
            } else {
                const index = this._dynamicAllSubgrids.indexOf(subgrid);
                if (index === -1) {
                    return false; // subgrid is not selected
                } else {
                    this._dynamicAllSubgrids.splice(index, 1);
                    const lastArea = this._lastArea;
                    if (lastArea !== undefined && lastArea.areaTypeId === RevSelectionAreaTypeId.dynamicAll && lastArea.subgrid === subgrid) {
                        this._lastArea = undefined;
                    }
                    this.flagChanged(false);
                    return true;
                }
            }
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
    onlySelectCell(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): RevLastSelectionArea<BCS, SF> {
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
     * If multiple selection areas
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
    selectCell(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): RevLastSelectionArea<BCS, SF> {
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
     * If multiple selection areas
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
     */
    selectArea(
        areaTypeId: RevSelectionAreaTypeId,
        leftOrExRightActiveColumnIndex: number,
        topOrBottomSubgridRowIndex: number,
        width: number,
        height: number,
        subgrid: RevSubgrid<BCS, SF> | undefined,
    ): RevLastSelectionArea<BCS, SF> | undefined {
        this.beginChange();
        try {
            let area: RevLastSelectionArea<BCS, SF> | undefined;
            switch (areaTypeId) {
                case RevSelectionAreaTypeId.dynamicAll: {
                    area = this.selectDynamicAll(subgrid);
                    break;
                }
                case RevSelectionAreaTypeId.rectangle: {
                    if (width === 0 || height === 0 || subgrid === undefined) {
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
                        area = this.selectColumns(leftOrExRightActiveColumnIndex, width);
                    }
                    break;
                }
                case RevSelectionAreaTypeId.row: {
                    if (height === 0 || subgrid === undefined) {
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
                case RevSelectionAreaTypeId.dynamicAll: {
                    this.deselectDynamicAll(lastArea.subgrid);
                    break;
                }
                case RevSelectionAreaTypeId.rectangle: {
                    const subgrid = lastArea.subgrid;
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
                    const subgrid = lastArea.subgrid;
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
    onlySelectRectangle(leftOrExRightActiveColumnIndex: number, topOrExBottomSubgridRowIndex: number, width: number, height: number, subgrid: RevSubgrid<BCS, SF>): RevLastSelectionArea<BCS, SF> {
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
     * If multiple selection areas
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
    selectRectangle(leftOrExRightActiveColumnIndex: number, topOrExBottomSubgridRowIndex: number, width: number, height: number, subgrid: RevSubgrid<BCS, SF>, silent = false): RevLastSelectionArea<BCS, SF> {
        this.beginChange();
        try {
            const switchNewRectangleSelectionToRowOrColumn = this._gridSettings.switchNewRectangleSelectionToRowOrColumn;
            if (switchNewRectangleSelectionToRowOrColumn !== undefined) {
                switch (switchNewRectangleSelectionToRowOrColumn) {
                    case 'row': return this.selectRows(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid);
                    case 'column': return this.selectColumns(leftOrExRightActiveColumnIndex, width);
                    default: throw new RevUnreachableCaseError('SSR50591', switchNewRectangleSelectionToRowOrColumn);
                }
            } else {
                if (!this._gridSettings.multipleSelectionAreas) {
                    this.clear();
                }

                const rectangle = new RevSelectionRectangle(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid);
                this._rectangleList.push(rectangle);
                this._lastArea = new RevLastSelectionArea(RevSelectionAreaTypeId.rectangle, leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid);

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
     * @param rectangle - The rectangle area to deselect.
     * @param subgrid - The subgrid in which the rectangle selection exists.
     */
    deleteRectangleArea(rectangle: RevRectangle, subgrid: RevSubgrid<BCS, SF>): void {
        const index = this._rectangleList.findIndex(subgrid, rectangle.x, rectangle.y, rectangle.width, rectangle.height);
        if (index >= 0) {
            this.beginChange();
            const lastArea = this._lastArea;
            if (lastArea !== undefined && RevRectangle.isEqual(lastArea, rectangle)) {
                this._lastArea = undefined;
            }
            this._rectangleList.removeAt(subgrid, index)
            this.flagChanged(false);
            this.endChange();
        }
    }

    /**
     * Create a row selection area and add the new area to the selection.
     *
     * If multiple selection areas
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
    selectRows(leftOrExRightActiveColumnIndex: number, topOrExBottomSubgridRowIndex: number, width: number, count: number, subgrid: RevSubgrid<BCS, SF>): RevLastSelectionArea<BCS, SF> {
        this.beginChange();
        try {
            if (!this._gridSettings.multipleSelectionAreas) {
                this.clear();
            }

            const changed = this._rows.add(subgrid, topOrExBottomSubgridRowIndex, count);
            const lastArea = new RevLastSelectionArea(RevSelectionAreaTypeId.row, leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, count, subgrid);
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
     * If multiple selection areas
     * are not allowed ({@link RevGridSettings.multipleSelectionAreas} is false), the selection is cleared before adding all the rows to the selection.
     *
     * The leftOrExRightActiveColumnIndex and width values are needed to create a selection area.  Normally they are set to specify all columns in the subgrid.
     *
     * Note that while this selects all cells in the subgrid, it differs from {@link selectDynamicAll} in that this selection area will not include new rows subsequently added to the subgrid.
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
     * @param topOrExBottomSubgridRowIndex - The start index of the range of subgrid rows to deselect if `count` is positive, or the exclusive end index if `count` is negative.
     * @param count - The number of rows to deselect. If negative, count is in reverse direction from the exclusive bottom active row index.
     * @param subgrid - The subgrid from which rows should be deselected.
     */
    deselectRows(topOrExBottomSubgridRowIndex: number, count: number, subgrid: RevSubgrid<BCS, SF>): void {
        const changed = this._rows.delete(subgrid, topOrExBottomSubgridRowIndex, count);
        if (changed) {
            this.beginChange();
            const lastArea = this._lastArea;
            if (lastArea !== undefined && lastArea.areaTypeId === RevSelectionAreaTypeId.row) {
                const oldFirst = lastArea.exclusiveFirst;
                const oldLast = lastArea.exclusiveLast;
                const oldStart = oldFirst.y;
                const oldLength = oldLast.y - oldStart;
                const overlapRange = this._rows.calculateOverlapRange(subgrid, oldStart, oldLength);
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

                    this._lastArea = new RevLastSelectionArea(RevSelectionAreaTypeId.row, lastX, lastExclusiveY, lastWidth, lastHeight, subgrid);
                }
            }
            this.flagChanged(false);
            this.endChange();
        }
    }

    /**
     * Adds the specified row to the selection if it is not already included, otherwise removes it from the selection.
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
        if (this._rows.includesIndex(subgrid, subgridRowIndex)) {
            this.deselectRows(subgridRowIndex, 1, subgrid);
        } else {
            this.selectRows(leftOrExRightActiveColumnIndex, subgridRowIndex, width, 1, subgrid);
        }
    }

    /**
     * Create a column selection area and add the new area to the selection.
     *
     * If multiple selection areas are not allowed ({@link RevGridSettings.multipleSelectionAreas} is false), the selection is cleared before proceeding.
     *
     * Recommend use `RevFocusSelectBehavior.selectColumns()` instead.
     *
     * @param leftOrExRightActiveColumnIndex - The start index of the range of active columns to select if `count` is positive, or the exclusive end index if `count` is negative.
     * @param count - The number of active columns to include in the new selection area. If negative, `count` is in reverse direction from the exclusive end index.
     * @returns The last selection area which contains the selected columns.
     */
    selectColumns(leftOrExRightActiveColumnIndex: number, count: number): RevLastSelectionArea<BCS, SF> {
        this.beginChange();

        if (!this._gridSettings.multipleSelectionAreas) {
            this.clear();
        }

        const changed = this._columns.add(leftOrExRightActiveColumnIndex, count);
        const lastArea = new RevLastSelectionArea<BCS, SF>(RevSelectionAreaTypeId.column, leftOrExRightActiveColumnIndex, 0, count, 0, undefined);
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

                    this._lastArea = new RevLastSelectionArea<BCS, SF>(RevSelectionAreaTypeId.column, lastLeftOrExRightActiveColumnIndex, lastY, lastWidth, lastHeight, undefined);
                }
            }
            this.flagChanged(false);
            this.endChange();
        }
    }

    /**
     * Adds the specified column to the selection if it is not already included, otherwise removes it from the selection.
     *
     * Recommend use `RevFocusSelectBehavior.toggleSelectColumn()` instead.
     *
     * @param activeColumnIndex - The index of the column to toggle selection for.
     */
    toggleSelectColumn(activeColumnIndex: number): void {
        if (this._columns.includesIndex(activeColumnIndex)) {
            this.deselectColumns(activeColumnIndex, 1);
        } else {
            this.selectColumns(activeColumnIndex, 1);
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
    ): RevLastSelectionArea<BCS, SF> | undefined {
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
     * If multiple selection areas are not allowed ({@link RevGridSettings.multipleSelectionAreas} is false), clear the selection before adding the new selection area.
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
    ): RevLastSelectionArea<BCS, SF> {
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
     * @param leftOrExRightActiveColumnIndex - The start index of the range of active columns to select if `count` is positive, or the exclusive end index if `count` is negative.
     * @param count - The number of active columns to include in the new selection area. If negative, `count` is in reverse direction from the exclusive end index.
     * @returns The newly created {@link RevLastSelectionArea | selection area}.
     */
    replaceLastAreaWithColumns(leftOrExRightActiveColumnIndex: number, count: number): RevLastSelectionArea<BCS, SF> {
        this.beginChange();
        try {
            this.deleteLastArea();
            return this.selectColumns(leftOrExRightActiveColumnIndex, count);
        } finally {
            this.endChange();
        }
    }

    /**
     * Deletes the current last selection area (if it exists) and select a range of rows which becomes the new last selection area.
     *
     * If multiple selection areas are not allowed ({@link RevGridSettings.multipleSelectionAreas} is false), clear the selection before adding the new selection area.
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
    replaceLastAreaWithRows(leftOrExRightActiveColumnIndex: number, topOrExBottomSubgridRowIndex: number, width: number, count: number, subgrid: RevSubgrid<BCS, SF>): RevLastSelectionArea<BCS, SF> {
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
                    case RevSelectionAreaTypeId.dynamicAll: {
                        this.deselectDynamicAll(subgrid);
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

    isDynamicAllSelected(subgrid: RevSubgrid<BCS, SF> | undefined): boolean {
        if (subgrid === undefined) {
            return doesArrayContainArray(this._dynamicAllSubgrids, this._subgridsManager.subgrids);
        } else {
            return this._dynamicAllSubgrids.includes(subgrid);
        }
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
        if (this.isDynamicAllSelected(subgrid)) {
            return RevSelectionAreaTypeId.dynamicAll;
        } else {
            if (this._rows.includesIndex(subgrid, subgridRowIndex)) {
                return RevSelectionAreaTypeId.row;
            } else {
                if (this._columns.includesIndex(activeColumnIndex)) {
                    return RevSelectionAreaTypeId.column;
                } else {
                    if (this._rectangleList.containsPoint(subgrid, activeColumnIndex, subgridRowIndex)) {
                        return RevSelectionAreaTypeId.rectangle;
                    } else {
                        return undefined;
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
        const selectedTypes: RevSelectionAreaTypeId[] = [];
        if (this.isDynamicAllSelected(subgrid)) {
            selectedTypes.push(RevSelectionAreaTypeId.dynamicAll);
        }
        if (this._rows.includesIndex(subgrid, subgridRowIndex)) {
            selectedTypes.push(RevSelectionAreaTypeId.row);
        }
        if (this._columns.includesIndex(activeColumnIndex)) {
            selectedTypes.push(RevSelectionAreaTypeId.column);
        }
        if (this._rectangleList.containsPoint(subgrid, activeColumnIndex, subgridRowIndex)) {
            selectedTypes.push(RevSelectionAreaTypeId.rectangle);
        }
        return selectedTypes;
    }

    /**
     * Determines whether a selected cell is the only cell selected in the grid.
     *
     * @param activeColumnIndex - The column index of the cell.
     * @param subgridRowIndex - The row index of the cell within the subgrid.
     * @param subgrid - The subgrid instance containing the cell.
     * @param selectedTypeId - The type of selection area used to select the cell.
     * @returns `true` if the active cell is the only selected cell, otherwise `false`.
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
            case RevSelectionAreaTypeId.dynamicAll:
                return activeColumnCount <= 1 && subgridRowCount <= 1;
            case RevSelectionAreaTypeId.row:
                return (
                    subgridRowCount <= 1 &&
                    !this._columns.hasMoreThanOneIndex() &&
                    (this._rows.isEmpty() || (activeColumnCount <= 1)) &&
                    !this._rectangleList.hasPointOtherThan(subgrid, activeColumnIndex, subgridRowIndex)
                );
            case RevSelectionAreaTypeId.column:
                return (
                    activeColumnCount <= 1 &&
                    !this._rows.hasMoreThanOneIndex() &&
                    (this._columns.isEmpty() || (subgridRowCount <= 1)) &&
                    !this._rectangleList.hasPointOtherThan(subgrid, activeColumnIndex, subgridRowIndex)
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
     * Determines whether any rows or columns are selected.
     *
     * @param includeDynamicAll - If `true`, then test includes rows and columns selected with {@link RevSelectionAreaTypeId.dynamicAll | dynamicAll}; otherwise
     * rows and columns only selected with this selection area type are excluded.
     * @returns `true` if any rows or columns are selected; otherwise, `false`.
     */
    hasColumnsOrRows(includeDynamicAll: boolean): boolean {
        if (this._columns.hasIndices() || this._rows.hasIndices(undefined)) {
            return true;
        } else {
            if (!includeDynamicAll || this._dynamicAllSubgrids.length === 0) {
                return false;
            } else {
                if (this._columnsManager.activeColumnCount > 0) {
                    return true;
                } else {
                    const subgrids = this._dynamicAllSubgrids;
                    const subgridCount = subgrids.length;
                    for (let i = 0; i < subgridCount; i++) {
                        const subgrid = subgrids[i];
                        if (subgrid.getRowCount() > 0) {
                            return true;
                        }
                    }
                    return false;
                }
            }
        }
    }

    /**
     * Determines whether any rows are selected.
     *
     * @param includeDynamicAll - If `true`, then test includes rows selected with {@link RevSelectionAreaTypeId.dynamicAll | dynamicAll}; otherwise
     * rows only selected with this selection area type are excluded.
     * @returns `true` if any rows are selected; otherwise, `false`.
     */
    hasRows(subgrid: RevSubgrid<BCS, SF> | undefined, includeDynamicAll: boolean): boolean {
        if (this._rows.hasIndices(subgrid)) {
            return true;
        } else {
            if (!includeDynamicAll || this._dynamicAllSubgrids.length === 0) {
                return false;
            } else {
                if (subgrid === undefined) {
                    const subgrids = this._dynamicAllSubgrids;
                    const subgridCount = subgrids.length;
                    for (let i = 0; i < subgridCount; i++) {
                        const subgrid = subgrids[i];
                        if (subgrid.getRowCount() > 0) {
                            return true;
                        }
                    }
                    return false;
                } else {
                    return subgrid.getRowCount() > 0;
                }
            }
        }
    }

    /**
     * Gets the count of selected rows.
     *
     * @param subgrid - The subgrid in which to count selected rows. If `undefined`, counts across all subgrids.
     * @param includeDynamicAll - If `true`, then count includes all rows selected with {@link RevSelectionAreaTypeId.dynamicAll | dynamicAll}; otherwise
     * rows only selected with this selection area type are excluded from the count.
     * @returns The count of selected rows.
     */
    getRowCount(subgrid: RevSubgrid<BCS, SF> | undefined, includeDynamicAll: boolean): number {
        if (!includeDynamicAll || this._dynamicAllSubgrids.length === 0) {
            return this._rows.getIndexCount(subgrid);
        } else {
            if (subgrid === undefined) {
                let result = this.getDynamicAllRowCount();

                const notDynamicAllSubgrids = subtractArrays(this._subgridsManager.subgrids, this._dynamicAllSubgrids);
                const notDynamicAllSubgridCount = notDynamicAllSubgrids.length;
                for (let i = 0; i < notDynamicAllSubgridCount; i++) {
                    const subgrid = notDynamicAllSubgrids[i];
                    const count = this._rows.getIndexCount(subgrid);
                    result += count;
                }

                return result;
            } else {
                if (this.isDynamicAllSelected(subgrid)) {
                    return subgrid.getRowCount();
                } else {
                    return this._rows.getIndexCount(subgrid);
                }
            }
        }
    }

    /**
     * Gets the count of rows included in {@link RevSelectionAreaTypeId.dynamicAll | dynamicAll} selection areas across all subgrids.
     *
     * @returns The count of selected rows.
     */
    getDynamicAllRowCount(): number {
        const dynamicAllSubgrids = this._dynamicAllSubgrids;
        const dynamicAllSubgridCount = dynamicAllSubgrids.length;
        if (dynamicAllSubgridCount === 0) {
            return 0;
        } else {
            let count = 0;
            for (let i = 0; i < dynamicAllSubgridCount; i++) {
                const subgrid = dynamicAllSubgrids[i];
                count += subgrid.getRowCount();
            }
            return count;
        }
    }

    /**
     * Gets all the selected row indices.
     *
     * Since indices are not unique across subgrids, the result returns separate arrays of row indices for each subgrid containing selected rows.
     *
     * @param includeDynamicAll - If `true`, then includes indices of all rows selected with {@link RevSelectionAreaTypeId.dynamicAll | dynamicAll}; otherwise
     * indices of rows only selected with this selection area type are excluded.
     * @returns An array of objects, where each object contains a subgrid and an array of row indices for that subgrid.
     */
    getRowIndices(includeDynamicAll: boolean): RevSelectionRows.SubgridIndices<BCS, SF>[] {
        if (!includeDynamicAll || this._dynamicAllSubgrids.length === 0) {
            return this._rows.getIndices();
        } else {
            const result = this.getDynamicAllRowIndices();

            const notDynamicAllSubgrids = subtractArrays(this._subgridsManager.subgrids, this._dynamicAllSubgrids);
            const notDynamicAllSubgridCount = notDynamicAllSubgrids.length;
            result.length += notDynamicAllSubgridCount;
            for (let i = 0; i < notDynamicAllSubgridCount; i++) {
                const subgrid = notDynamicAllSubgrids[i];
                const indices = this._rows.getSubgridIndices(subgrid);
                result[i + 1] = { subgrid, indices };
            }
            return result;
        }
    }

    /**
     * Gets all the selected row indices in a subgrid.
     *
     * @returns An array of row indices.
     */
    getSubgridRowIndices(subgrid: RevSubgrid<BCS, SF>): number[] {
        return this._rows.getSubgridIndices(subgrid);
    }

    /**
     * Gets all selected row indices included in {@link RevSelectionAreaTypeId.dynamicAll | dynamicAll} selection areas across all subgrids.
     *
     * Since indices are not unique across subgrids, the result returns separate arrays of row indices for each subgrid
     * included in {@link dynamicAllSubgrids} containing one or more rows.
     *
     * @returns An array of objects, where each object contains a subgrid and an array of row indices for that subgrid.
     */
    getDynamicAllRowIndices(): RevSelectionRows.SubgridIndices<BCS, SF>[] {
        const dynamicAllSubgrids = this._dynamicAllSubgrids;
        const dynamicAllSubgridCount = dynamicAllSubgrids.length;
        if (dynamicAllSubgridCount === 0) {
            return [];
        } else {
            const result = new Array<RevSelectionRows.SubgridIndices<BCS, SF>>(dynamicAllSubgridCount);
            for (let i = 0; i < dynamicAllSubgridCount; i++) {
                const subgrid = dynamicAllSubgrids[i];
                const indices = subgrid.generateAllRowIndicesArray();
                result[i] = {
                    subgrid,
                    indices
                };
            }
            return result;
        }
    }

    /**
     * Gets all row indices in a subgrid if it is selected with {@link RevSelectionAreaTypeId.dynamicAll | dynamicAll} selection area.
     *
     * That is, the subgrid must be included in {@link dynamicAllSubgrids}.
     *
     * @returns An array of row indices.
     */
    getSubgridDynamicAllRowIndices(subgrid: RevSubgrid<BCS, SF>): number[] {
        if (!this.isDynamicAllSelected(subgrid)) {
            return [];
        } else {
            return subgrid.generateAllRowIndicesArray();
        }
    }

    /**
     * Determines whether any columns are selected.
     *
     * @param includeDynamicAll - If `true`, then test includes any columns if there are one or more {@link RevSelectionAreaTypeId.dynamicAll | dynamicAll} type selection areas; otherwise
     * this selection area type is ignored.
     * @returns `true` if selection contains one or more column selection areas, otherwise `false`.
     */
    hasColumns(includeDynamicAll: boolean): boolean {
        if (this._columns.hasIndices()) {
            return true;
        } else {
            if (!includeDynamicAll || this._dynamicAllSubgrids.length === 0) {
                return false;
            } else {
                return this._columnsManager.activeColumnCount > 0;
            }
        }
    }

    /**
     * Gets all the selected column indices.
     *
     * @param includeDynamicAll - If `true`, then result includes all column indices if there are one or more {@link RevSelectionAreaTypeId.dynamicAll | dynamicAll} type selection areas; otherwise
     * this selection area type is ignored.
     * @returns An array of column indices.
     */
    getColumnIndices(includeDynamicAll: boolean): number[] {
        if (includeDynamicAll && this._dynamicAllSubgrids.length > 0) {
            return this.getDynamicAllColumnIndices();
        } else {
            return this._columns.getIndices();
        }
    }

    /**
     * Gets all column indices if there are one or more {@link RevSelectionAreaTypeId.dynamicAll | dynamicAll} type selection areas.
     *
     * @returns An array of column indices.
     */
    getDynamicAllColumnIndices(): number[] {
        if (this._dynamicAllSubgrids.length === 0) {
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


    /**
     * Returns an array of selection areas that cover the specified cell.
     *
     * @param activeColumnIndex - The index of the active column containing the cell.
     * @param subgridRowIndex - The row index within the subgrid.
     * @param subgrid - The subgrid instance containing the cell.
     * @returns An array of `RevSelectionArea` objects that cover the specified cell.
     */
    getAreasCoveringCell(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): RevSelectionArea<BCS, SF>[] {
        let result: RevSelectionArea<BCS, SF>[];
        if (!this.isDynamicAllSelected(subgrid)) {
            result = [];
        } else {
            const area = this.createLastSelectionAreaFromAll(subgrid);
            if (area === undefined) {
                result = [];
            } else {
                result = [area];
            }
        }

        const range = this._rows.findRangeWithIndex(subgrid, subgridRowIndex);
        if (range !== undefined) {
            const area = this.createAreaFromRowRange(range, subgrid);
            result.push(area);
        }

        const columnRange = this._columns.findRangeWithIndex(activeColumnIndex);
        if (columnRange !== undefined) {
            const area = this.createAreaFromColumnRange(columnRange);
            result.push(area);
        }

        const rectangles =  this._rectangleList.getRectanglesContainingPoint(subgrid, activeColumnIndex, subgridRowIndex);
        for (const rectangle of rectangles) {
            result.push(rectangle);
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
    isPointInLastArea(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): boolean {
        const lastArea = this._lastArea;
        if (lastArea === undefined) {
            return false;
        } else {
            return lastArea.containsSubgridCell(activeColumnIndex, subgridRowIndex, subgrid);
        }
    }

    /**
     * Calculates the total number of selection areas, including dynamicAll, rectangles, rows, and columns.
     */
    calculateAreaCount(): number {
        return this._dynamicAllSubgrids.length + this._rectangleList.areaCount + this._rows.calculateAreaCount() + this._columns.areaCount;
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
    calculateMouseSelectAllowedAreaTypeId() {
        const areaTypeId = this.calculateMouseSelectAreaTypeId();
        switch (areaTypeId) {
            case RevSelectionAreaTypeId.dynamicAll: throw new RevAssertError('SCMMSAATI39113');
            case RevSelectionAreaTypeId.rectangle: return areaTypeId;
            case RevSelectionAreaTypeId.row: return this._gridSettings.mouseRowSelectionEnabled ? areaTypeId : undefined;
            case RevSelectionAreaTypeId.column: return this._gridSettings.mouseColumnSelectionEnabled ? areaTypeId : undefined;
            default:
                throw new RevUnreachableCaseError('SCMMSAATI30987', areaTypeId);
        }
    }

    /** @internal */
    adjustForRowsInserted(subgridRowIndex: number, rowCount: number, subgrid: RevSubgrid<BCS, SF>) {
        this.beginChange();
        try {
            const lastArea = this._lastArea;
            if (lastArea !== undefined) {
                lastArea.checkAdjustForYRangeInserted(subgrid, subgridRowIndex, rowCount);
            }

            let changed = this._rectangleList.adjustForYRangeInserted(subgrid, subgridRowIndex, rowCount);
            if (this._rows.adjustForInserted(subgrid, subgridRowIndex, rowCount)) {
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
    adjustForRowsDeleted(rowIndex: number, rowCount: number, subgrid: RevSubgrid<BCS, SF>) {
        this.beginChange();
        try {
            const lastArea = this._lastArea;
            if (lastArea !== undefined) {
                if (lastArea.checkAdjustForYRangeDeleted(subgrid, rowIndex, rowCount) === null) {
                    this._lastArea = undefined;
                }
            }

            let changed = this._rectangleList.adjustForYRangeDeleted(subgrid, rowIndex, rowCount);
            if (this._rows.adjustForDeleted(subgrid, rowIndex, rowCount)) {
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
    adjustForRowsMoved(oldRowIndex: number, newRowIndex: number, count: number, subgrid: RevSubgrid<BCS, SF>) {
        this.beginChange();
        try {
            const lastArea = this._lastArea;
            if (lastArea !== undefined) {
                lastArea.checkAdjustForYRangeMoved(subgrid, oldRowIndex, newRowIndex, count);
            }

            let changed = this._rectangleList.adjustForYRangeMoved(subgrid, oldRowIndex, newRowIndex, count);
            if (this._rows.adjustForMoved(subgrid, oldRowIndex, newRowIndex, count)) {
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
        this._clearOnNextFocusChange = false;

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
    private createLastSelectionAreaFromAll(subgrid: RevSubgrid<BCS, SF>): RevLastSelectionArea<BCS, SF> | undefined {
        const rowCount = subgrid.getRowCount();
        const activeColumnCount = this._columnsManager.activeColumnCount;
        if (rowCount === 0 || activeColumnCount === 0) {
            return undefined;
        } else {
            const x = 0;
            const y = 0;
            const lastSelectionArea = new RevLastSelectionArea(
                RevSelectionAreaTypeId.dynamicAll,
                x,
                y,
                activeColumnCount,
                rowCount,
                subgrid,
            );
            return lastSelectionArea;
        }
    }

    /** @internal */
    private createAreaFromRowRange(range: RevContiguousIndexRange, subgrid: RevSubgrid<BCS, SF>): RevSelectionArea<BCS, SF> {
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
            subgrid,
            topLeft: { x, y },
            inclusiveFirst: { x, y },
            exclusiveBottomRight: { x: activeColumnCount, y: range.after },
            firstCorner: RevFirstCornerArea.CornerId.TopLeft,
            size: activeColumnCount * height,
        };
    }

    /** @internal */
    private createAreaFromColumnRange(range: RevContiguousIndexRange): RevSelectionArea<BCS, SF> {
        const rowCount = this._subgridsManager.calculateRowCount();
        const x = range.start;
        const y = 0;
        const width = range.length;
        return {
            x,
            y,
            width,
            height: rowCount,
            subgrid: undefined, // No subgrid for column selection
            areaTypeId: RevSelectionAreaTypeId.column,
            topLeft: { x, y },
            inclusiveFirst: { x, y },
            exclusiveBottomRight: { x: range.after, y: rowCount },
            firstCorner: RevFirstCornerArea.CornerId.TopLeft,
            size: width * rowCount,
        };
    }

    /** @internal */
    private calculateMouseSelectAreaTypeId() {
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
    private createLastRectangleFirstCellStash(): RevSelection.Stash.LastRectangleFirstCell<BCS, SF> | undefined {
        const rectangle = this._rectangleList.getLastRectangle();
        if (rectangle === undefined) {
            return undefined;
        } else {
            const cellPoint = rectangle.inclusiveFirst;

            const subgrid = rectangle.subgrid;
            const dataServer = subgrid.dataServer;
            if (dataServer.getRowIdFromIndex === undefined) {
                return undefined;
            } else {
                const activeColumnIndex = cellPoint.x;
                const subgridRowIndex = cellPoint.y;
                return {
                    subgrid,
                    fieldName: this._columnsManager.getActiveColumn(activeColumnIndex).field.name,
                    rowId: dataServer.getRowIdFromIndex(subgridRowIndex),
                };
            }
        }
    }

    /** @internal */
    private restoreLastRectangleFirstCellStash(lastRectangleFirstCellStash: RevSelection.Stash.LastRectangleFirstCell<BCS, SF> | undefined, allRowsKept: boolean) {
        if (lastRectangleFirstCellStash !== undefined) {
            const { subgrid, fieldName, rowId: stashedRowId } = lastRectangleFirstCellStash;

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

    /**
     * @internal
     */
    private createRowsStash(): RevSelection.Stash.SubgridRowIds<BCS, SF>[] {
        const subgridIndicesArray = this._rows.getIndices();
        const maxCount = subgridIndicesArray.length;
        const result: RevSelection.Stash.SubgridRowIds<BCS, SF>[] = new Array<RevSelection.Stash.SubgridRowIds<BCS, SF>>(maxCount);
        let count = 0;
        for (let i = 0; i < maxCount; i++) {
            const { subgrid, indices } = subgridIndicesArray[i];
            if (indices.length > 0) {
                const dataServer = subgrid.dataServer;
                if (dataServer.getRowIdFromIndex !== undefined) {
                    const boundGetRowIdFromIndexFtn = dataServer.getRowIdFromIndex.bind(dataServer);
                    const rowIds= indices.map((index) => boundGetRowIdFromIndexFtn(index));
                    const subgridRowIds: RevSelection.Stash.SubgridRowIds<BCS, SF> = { subgrid, rowIds };
                    result[count++] = subgridRowIds;
                }
            }
        }
        result.length = count; // Trim the array to the actual count of subgrids with selected rows
        return result;
    }

    /** @internal */
    private restoreRowsStash(subgridRowIdsArray: readonly RevSelection.Stash.SubgridRowIds<BCS, SF>[]) {
        const count = subgridRowIdsArray.length;
        for (let i = 0; i < count; i++) {
            const { subgrid, rowIds } = subgridRowIdsArray[i];
            this.restoreSubgridRowsStash(subgrid, rowIds);
        }
    }

    /** @internal */
    private restoreSubgridRowsStash(subgrid: RevSubgrid<BCS, SF>, rowIds: unknown[]) {
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
                            this._rows.add(subgrid, startValue, previousValuePlus1 - startValue);
                            startValue = value;
                        }
                        previousValue = value;
                        previousValuePlus1 = previousValue + 1;
                    }
                }
                this._rows.add(subgrid, startValue, previousValuePlus1 - startValue);
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
    private restoreColumnsStash(fieldNames: readonly string[] | undefined) {
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
        readonly dynamicAll: readonly RevSubgrid<BCS, SF>[];
        readonly lastRectangleFirstCell: Stash.LastRectangleFirstCell<BCS, SF> | undefined;
        readonly rows: readonly Stash.SubgridRowIds<BCS, SF>[];
        readonly columns: readonly string[] | undefined;
    }

    export namespace Stash {
        export interface LastRectangleFirstCell<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
            subgrid: RevSubgrid<BCS, SF>;
            fieldName: string;
            rowId: unknown;
        }

        export interface SubgridRowIds<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
            subgrid: RevSubgrid<BCS, SF>;
            rowIds: unknown[];
        }
    }

}
