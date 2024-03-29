
import { DataServer } from '../../interfaces/data/data-server';
import { Subgrid } from '../../interfaces/data/subgrid';
import { DatalessSubgrid } from '../../interfaces/dataless/dataless-subgrid';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { Rectangle } from '../../types-utils/rectangle';
import { AssertError, UnreachableCaseError } from '../../types-utils/revgrid-error';
import { RevgridObject } from '../../types-utils/revgrid-object';
import { SelectionAreaType, SelectionAreaTypeId } from '../../types-utils/selection-area-type';
import { SelectionAreaTypeSpecifier } from '../../types-utils/types';
import { ColumnsManager } from '../column/columns-manager';
import { ContiguousIndexRange } from './contiguous-index-range';
import { FirstCornerArea } from './first-corner-area';
import { LastSelectionArea } from './last-selection-area';
import { SelectionArea } from './selection-area';
import { SelectionRangeList } from './selection-range-list';
import { SelectionRectangle } from './selection-rectangle';
import { SelectionRectangleList } from './selection-rectangle-list';

/**
 *
 * @desc We represent selections as a list of rectangles because large areas can be represented and tested against quickly with a minimal amount of memory usage. Also we need to maintain the selection rectangles flattened counter parts so we can test for single dimension contains. This is how we know to highlight the fixed regions on the edges of the grid.
 * @public
 */

export class Selection<BCS extends BehavioredColumnSettings, SF extends SchemaField> implements RevgridObject {
    /** @internal */
    changedEventerForRenderer: Selection.ChangedEventer;
    /** @internal */
    changedEventerForEventBehavior: Selection.ChangedEventer;

    /** @internal */
    private readonly _rows = new SelectionRangeList();
    /** @internal */
    private readonly _columns = new SelectionRangeList();
    /** @internal */
    private readonly _rectangleList = new SelectionRectangleList();

    /** @internal */
    private _subgrid: Subgrid<BCS, SF> | undefined;
    /** @internal */
    private _lastArea: LastSelectionArea | undefined;
    /** @internal */
    private _allSelected = false;

    /** @internal */
    private _beginChangeCount = 0;
    /** @internal */
    private _changed = false;
    /** @internal */
    private _silentlyChanged = false;

    /** @internal */
    constructor(
        readonly revgridId: string,
        readonly internalParent: RevgridObject,
        /** @internal */
        private readonly _gridSettings: GridSettings,
        /** @internal */
        private readonly _columnsManager: ColumnsManager<BCS, SF>,
    ) {
    }

    get subgrid() { return this._subgrid; }

    get areaCount(): number { return this._rectangleList.areaCount + this._rows.areaCount + this._columns.areaCount; }
    get lastArea() { return this._lastArea; }

    get allSelected() { return this._allSelected; }

    get rectangles(): readonly SelectionRectangle[] { return this._rectangleList.rectangles; }

    /** @internal */
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

    createStash(): Selection.Stash<BCS, SF> {
        const lastRectangleFirstCell = this.createLastRectangleFirstCellStash();
        const rowIds = this.createRowsStash();
        const columnNames = this.createColumnsStash();

        return {
            subgrid: this._subgrid,
            allSelected: this._allSelected,
            lastRectangleFirstCell,
            rowIds,
            columnNames,
        };
    }

    restoreStash(stash: Selection.Stash<BCS, SF>, allRowsKept: boolean) {
        this.beginChange();
        try {
            this.clear();
            this._subgrid = stash.subgrid;
            this._allSelected = stash.allSelected;
            this.restoreLastRectangleFirstCellStash(stash.lastRectangleFirstCell, allRowsKept);
            this.restoreRowsStash(stash.rowIds);
            this.restoreColumnsStash(stash.columnNames);
        } finally {
            this.endChange();
        }
    }

    getLastRectangle() {
        return this._rectangleList.getLastRectangle();
    }

    /**
     * @desc empty out all our state
     */
    clear() {
        this.beginChange();
        try {
            let changed = false;
            if (this._allSelected) {
                this._allSelected = false;
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

    clearSelectCell(x: number, y: number, subgrid: Subgrid<BCS, SF>) {
        this.beginChange();
        try {
            this.clear();
            return this.selectCell(x, y, subgrid);
        } finally {
            this.endChange();
        }
    }

    selectCell(x: number, y: number, subgrid: Subgrid<BCS, SF>) {
        return this.selectRectangle(x, y, 1, 1, subgrid);
    }

    deselectCell(x: number, y: number, subgrid: Subgrid<BCS, SF>) {
        const rectangle: Rectangle = {
            x,
            y,
            width: 1,
            height: 1,
        }
        this.deselectRectangle(rectangle, subgrid);
    }

    selectArea(areaTypeId: SelectionAreaTypeId, firstInexclusiveX: number, firstExclusiveY: number, width: number, height: number, subgrid: Subgrid<BCS, SF>) {
        this.beginChange();
        try {
            let area: SelectionArea | undefined;
            switch (areaTypeId) {
                case SelectionAreaTypeId.all: {
                    this.selectAll(subgrid);
                    area = this.createAreaFromAll();
                    break;
                }
                case SelectionAreaTypeId.rectangle: {
                    area = this.selectRectangle(firstInexclusiveX, firstExclusiveY, width, height, subgrid,);
                    break;
                }
                case SelectionAreaTypeId.column: {
                    area = this.selectColumns(firstInexclusiveX, firstExclusiveY, width, height, subgrid);
                    break;
                }
                case SelectionAreaTypeId.row: {
                    area = this.selectRows(firstInexclusiveX, firstExclusiveY, width, height, subgrid);
                    break;
                }
                default:
                    throw new UnreachableCaseError('SSA34499', areaTypeId)
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
                switch (lastArea.areaTypeId) {
                    case SelectionAreaTypeId.all: {
                        this.deselectAll(subgrid);
                        break;
                    }
                    case SelectionAreaTypeId.rectangle: {
                        this.deselectRectangle(lastArea, subgrid);
                        break;
                    }
                    case SelectionAreaTypeId.column: {
                        this.deselectColumns(lastArea.x, lastArea.width, subgrid);
                        break;
                    }
                    case SelectionAreaTypeId.row: {
                        this.deselectRows(lastArea.y, lastArea.height, subgrid);
                        break;
                    }
                    default:
                        throw new UnreachableCaseError('SDLA34499', lastArea.areaTypeId)
                }
            }
        }
    }

    clearSelectRectangle(firstInexclusiveX: number, firstInexclusiveY: number, width: number, height: number, subgrid: Subgrid<BCS, SF>) {
        this.beginChange();
        try {
            this.clear();
            return this.selectRectangle(firstInexclusiveX, firstInexclusiveY, width, height, subgrid);
        } finally {
            this.endChange();
        }
    }

    selectRectangle(firstInexclusiveX: number, firstInexclusiveY: number, width: number, height: number, subgrid: Subgrid<BCS, SF>, silent = false) {
        this.beginChange();
        try {
            const switchNewRectangleSelectionToRowOrColumn = this._gridSettings.switchNewRectangleSelectionToRowOrColumn;
            if (switchNewRectangleSelectionToRowOrColumn !== undefined) {
                switch (switchNewRectangleSelectionToRowOrColumn) {
                    case 'row': return this.selectRows(firstInexclusiveX, firstInexclusiveY, width, height, subgrid);
                    case 'column': return this.selectColumns(firstInexclusiveX, firstInexclusiveY, width, height, subgrid);
                    default: throw new UnreachableCaseError('SSR50591', switchNewRectangleSelectionToRowOrColumn);
                }
            } else {
                if (subgrid !== this._subgrid) {
                    this.clear();
                    this._subgrid = subgrid;
                }

                if (!this._gridSettings.multipleSelectionAreas) {
                    this.clear();
                }

                const rectangle = new SelectionRectangle(firstInexclusiveX, firstInexclusiveY, width, height);
                this._rectangleList.push(rectangle);
                this._lastArea = new LastSelectionArea(SelectionAreaTypeId.rectangle, firstInexclusiveX, firstInexclusiveY, width, height);

                this.flagChanged(silent);
            }

        } finally {
            this.endChange()
        }

        return this._lastArea;
    }

    deselectRectangle(rectangle: Rectangle, subgrid: Subgrid<BCS, SF>) {
        if (subgrid === this._subgrid) {
            const index = this._rectangleList.findIndex(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
            if (index >= 0) {
                this.beginChange();
                const lastArea = this._lastArea;
                if (lastArea !== undefined && Rectangle.isEqual(lastArea, rectangle)) {
                    this._lastArea = undefined;
                }
                this._rectangleList.removeAt(index)
                this.flagChanged(false);
                this.endChange();
            }
        }
    }

    clearSelectAll(subgrid: Subgrid<BCS, SF>) {
        this.beginChange();
        if (subgrid !== this._subgrid || !this._allSelected) {
            this._changed = true;
        }
        this.clear();
        if (this._changed) {
            this._subgrid = subgrid;
            this._allSelected = true;
        }
        this.endChange();
    }

    selectAll(subgrid: Subgrid<BCS, SF>) {
        this.setAllSelected(false, subgrid);
    }

    deselectAll(subgrid: Subgrid<BCS, SF>) {
        this.setAllSelected(false, subgrid);
    }

    setAllSelected(value: boolean, subgrid: Subgrid<BCS, SF>) {
        if (value !== this._allSelected) {
            this.beginChange();
            try {
                if (subgrid !== this._subgrid) {
                    if (!value) {
                        return; // only deselect if active subgrid is specified
                    } else {
                        this.clear();
                        this._subgrid = subgrid;
                    }
                }
                this._allSelected = value;
                this._changed = true;
                if (this._lastArea !== undefined && this._lastArea.areaTypeId === SelectionAreaTypeId.all && !value) {
                    this._lastArea = undefined;
                }
            } finally {
                this.endChange();
            }
        }
    }

    /** Parameters specify a rectangle in Data, the rows of which will be selected */
    selectRows(x: number, inexclusiveY: number, width: number, height: number, subgrid: Subgrid<BCS, SF>) {
        this.beginChange();
        try {
            if (subgrid !== this._subgrid) {
                this.clear();
                this._subgrid = subgrid;
            }

            if (!this._gridSettings.multipleSelectionAreas) {
                this.clear();
            }

            const changed = this._rows.add(inexclusiveY, height);
            const lastArea = new LastSelectionArea(SelectionAreaTypeId.row, x, inexclusiveY, width, height);
            if (changed) {
                this._lastArea = lastArea;
                this.flagChanged(false);
            }

            return lastArea;
        } finally {
            this.endChange();
        }
    }

    selectAllRows(x: number, width: number, subgrid: Subgrid<BCS, SF>) {
        const subgridRowCount = subgrid.getRowCount();
        if (subgridRowCount > 0) {
            this.selectRows(x, 0, width, subgridRowCount, subgrid);
        }
    }

    deselectRows(y: number, count: number, subgrid: Subgrid<BCS, SF>) {
        if (subgrid === this._subgrid) {
            const changed = this._rows.delete(y, count);
            if (changed) {
                this.beginChange();
                const lastArea = this._lastArea;
                if (lastArea !== undefined && lastArea.areaTypeId === SelectionAreaTypeId.row) {
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

                        this._lastArea = new LastSelectionArea(SelectionAreaTypeId.row, lastX, lastExclusiveY, lastWidth, lastHeight);
                    }
                }
                this.flagChanged(false);
                this.endChange();
            }
        }
    }

    toggleSelectRow(x: number, y: number, subgrid: Subgrid<BCS, SF>) {
        if (this._rows.includesIndex(y)) {
            this.deselectRows(y, 1, subgrid);
        } else {
            this.selectRows(x, y, 1, 1, subgrid);
        }
    }

    selectColumns(inexclusiveX: number, y: number, width: number, height: number, subgrid: Subgrid<BCS, SF>) {
        this.beginChange();

        if (subgrid !== this._subgrid) {
            this.clear();
            this._subgrid = subgrid;
        }

        if (!this._gridSettings.multipleSelectionAreas) {
            this.clear();
        }

        const changed = this._columns.add(inexclusiveX, width);
        const lastArea = new LastSelectionArea(SelectionAreaTypeId.column, inexclusiveX, y, width, height);
        if (changed) {
            this._lastArea = lastArea;
            this.flagChanged(false);
        }
        this.endChange();

        return lastArea;
    }

    deselectColumns(x: number, count: number, subgrid: Subgrid<BCS, SF>) {
        if (subgrid === this._subgrid) {
            const changed = this._columns.delete(x, count);
            if (changed) {
                this.beginChange();
                const lastArea = this._lastArea;
                if (lastArea !== undefined && lastArea.areaTypeId === SelectionAreaTypeId.column) {
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

                        this._lastArea = new LastSelectionArea(SelectionAreaTypeId.column, lastInexclusiveX, lastY, lastWidth, lastHeight);
                    }
                }
                this.flagChanged(false);
                this.endChange();
            }
        }
    }

    toggleSelectColumn(x: number, y: number, subgrid: Subgrid<BCS, SF>) {
        if (this._columns.includesIndex(x)) {
            this.deselectColumns(x, 1, subgrid);
        } else {
            this.selectColumns(x, y, 1, 1, subgrid);
        }
    }

    replaceLastArea(areaTypeId: SelectionAreaTypeId, inexclusiveX: number, inexclusiveY: number, width: number, height: number, subgrid: Subgrid<BCS, SF>) {
        this.beginChange();
        try {
            this.deselectLastArea();
            return this.selectArea(areaTypeId, inexclusiveX, inexclusiveY, width, height, subgrid);
        } finally {
            this.endChange();
        }
    }

    replaceLastAreaWithRectangle(inexclusiveX: number, inexclusiveY: number, width: number, height: number, subgrid: Subgrid<BCS, SF>) {
        this.beginChange();
        try {
            this.deselectLastArea();
            return this.selectRectangle(inexclusiveX, inexclusiveY, width, height, subgrid);
        } finally {
            this.endChange();
        }
    }

    replaceLastAreaWithColumns(inexclusiveX: number, y: number, width: number, height: number, subgrid: Subgrid<BCS, SF>) {
        this.beginChange();
        try {
            this.deselectLastArea();
            return this.selectColumns(inexclusiveX, y, width, height, subgrid);
        } finally {
            this.endChange();
        }
    }

    replaceLastAreaWithRows(x: number, inexclusiveY: number, width: number, height: number, subgrid: Subgrid<BCS, SF>) {
        this.beginChange();
        try {
            this.deselectLastArea();
            return this.selectRows(x, inexclusiveY, width, height, subgrid);
        } finally {
            this.endChange();
        }
    }

    toggleSelectCell(originX: number, originY: number, subgrid: Subgrid<BCS, SF>): boolean {
        const cellCoveringSelectionAreas = this.getAreasCoveringCell(originX, originY, subgrid);
        const priorityCoveringArea = SelectionArea.getTogglePriorityCellCoveringSelectionArea(cellCoveringSelectionAreas);
        if (priorityCoveringArea === undefined) {
            this.selectCell(originX, originY, subgrid);
            return true;
        } else {
            this.beginChange();
            try {
                const priorityCoveringAreaType = priorityCoveringArea.areaTypeId;
                switch (priorityCoveringAreaType) {
                    case SelectionAreaTypeId.all: {
                        this.deselectAll(subgrid);
                        break;
                    }
                    case SelectionAreaTypeId.rectangle: {
                        this.deselectRectangle(priorityCoveringArea, subgrid);
                        break;
                    }
                    case SelectionAreaTypeId.column: {
                        this.deselectColumns(originX, originX, subgrid);
                        break;
                    }
                    case SelectionAreaTypeId.row: {
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

    isColumnSelected(activeColumnIndex: number) {
        return this._columns.includesIndex(activeColumnIndex);
    }

    isCellSelected(x: number, y: number, subgrid: DatalessSubgrid): boolean {
        return this.getOneCellSelectionAreaTypeId(x, y, subgrid) !== undefined;
    }

    /** Returns undefined if not selected, false if selected with others, true if the only cell selected */
    isOnlyThisCellSelected(x: number, y: number, subgrid: DatalessSubgrid): boolean | undefined {
        const selectedType = this.getOneCellSelectionAreaTypeId(x, y, subgrid);
        if (selectedType === undefined) {
            return undefined;
        } else {
            return this.isSelectedCellTheOnlySelectedCell(x, y, subgrid, selectedType)
        }
    }

    getOneCellSelectionAreaTypeId(activeColumnIndex: number, subgridRowIndex: number, subgrid: DatalessSubgrid): SelectionAreaTypeId | undefined {
        if (subgrid !== this._subgrid) {
            return undefined;
        } else {
            if (this._allSelected) {
                return SelectionAreaTypeId.all;
            } else {
                if (this._rows.includesIndex(subgridRowIndex)) {
                    return SelectionAreaTypeId.row;
                } else {
                    if (this._columns.includesIndex(activeColumnIndex)) {
                        return SelectionAreaTypeId.column;
                    } else {
                        if (this._rectangleList.containsPoint(activeColumnIndex, subgridRowIndex)) {
                            return SelectionAreaTypeId.rectangle;
                        } else {
                            return undefined;
                        }
                    }
                }
            }
        }
    }

    getAllCellSelectionAreaTypeIds(activeColumnIndex: number, subgridRowIndex: number, subgrid: DatalessSubgrid): SelectionAreaTypeId[] {
        if (subgrid !== this._subgrid) {
            return [];
        } else {
            const selectedTypes: SelectionAreaTypeId[] = [];
            if (this._allSelected) {
                selectedTypes.push(SelectionAreaTypeId.all);
            }
            if (this._rows.includesIndex(subgridRowIndex)) {
                selectedTypes.push(SelectionAreaTypeId.row);
            }
            if (this._columns.includesIndex(activeColumnIndex)) {
                selectedTypes.push(SelectionAreaTypeId.column);
            }
            if (this._rectangleList.containsPoint(activeColumnIndex, subgridRowIndex)) {
                selectedTypes.push(SelectionAreaTypeId.rectangle);
            }
            return selectedTypes;
        }
    }

    isSelectedCellTheOnlySelectedCell(
        activeColumnIndex: number,
        subgridRowIndex: number,
        datalessSubgrid: DatalessSubgrid,
        selectedTypeId: SelectionAreaTypeId
    ) {
        const activeColumnCount = this._columnsManager.activeColumnCount;
        const subgrid = datalessSubgrid as Subgrid<BCS, SF>; // assume this was previously checked by getCellSelectedType
        const subgridRowCount = subgrid.getRowCount();
        switch (selectedTypeId) {
            case SelectionAreaTypeId.all:
                return activeColumnCount <= 1 && subgridRowCount <= 1;
            case SelectionAreaTypeId.row:
                return (
                    subgridRowCount <= 1 &&
                    !this._columns.hasMoreThanOneIndex() &&
                    (this._rows.isEmpty() || (activeColumnCount <= 1)) &&
                    !this._rectangleList.hasPointOtherThan(activeColumnIndex, subgridRowIndex)
                );
            case SelectionAreaTypeId.column:
                return (
                    activeColumnCount <= 1 &&
                    !this._rows.hasMoreThanOneIndex() &&
                    (this._columns.isEmpty() || (subgridRowCount <= 1)) &&
                    !this._rectangleList.hasPointOtherThan(activeColumnIndex, subgridRowIndex)
                );
            case SelectionAreaTypeId.rectangle:
                return (
                    !this._rectangleList.hasMoreThanOnePoint() &&
                    (this._rows.isEmpty() || activeColumnCount <= 1) &&
                    (this._columns.isEmpty() || subgridRowCount <= 1)
                );
            default:
                throw new UnreachableCaseError('SISCTOSD30134', selectedTypeId);
        }
    }

    isColumnOrRowSelected() {
        return this._columns.hasIndices() || this._rows.hasIndices();
    }

    getRowCount(includeAll: boolean) {
        if (includeAll && this._allSelected) {
            return this.getAllRowCount();
        } else {
            return this._rows.getIndexCount();
        }
    }

    getAllRowCount() {
        if (this._subgrid === undefined) {
            throw new AssertError('SGARC66698');
        } else {
            return this._subgrid.getRowCount();
        }
    }

    getRowIndices(includeAll: boolean) {
        if (includeAll && this._allSelected) {
            return this.getAllRowIndices();
        } else {
            return this._rows.getIndices();
        }
    }

    getAllRowIndices() {
        if (this._subgrid === undefined) {
            throw new AssertError('SGARI66698');
        } else {
            const rowCount = this._subgrid.getRowCount();
            const result = new Array<number>(rowCount);
            for (let i = 0; i < rowCount; i++) {
                result[i] = i;
            }
            return result;
        }
}

    getColumnIndices() {
        return this._columns.getIndices();
    }

    // getRectangleFlattenedYs() {
    //     this.rectangleList.getFlattenedYs();
    // }

    getAreasCoveringCell(x: number, y: number, subgrid: Subgrid<BCS, SF> | undefined) {
        let result: SelectionArea[];
        if (subgrid !== undefined && subgrid !== this._subgrid) {
            result = [];
        } else {
            if (this._allSelected) {
                const area = this.createAreaFromAll();
                if (area === undefined) {
                    result = [];
                } else {
                    result = [area];
                }
            } else {
                const range = this._rows.findRangeWithIndex(y);
                if (range === undefined) {
                    result = [];
                } else {
                    const area = this.createAreaFromRowRange(range);
                    result = [area];
                }
            }

            const columnRange = this._columns.findRangeWithIndex(x);
            if (columnRange !== undefined) {
                const area = this.createAreaFromColumnRange(columnRange);
                result.push(area);
            }

            const rectangles =  this._rectangleList.getRectanglesContainingPoint(x, y);
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

    /** @internal */
    calculateAreaTypeFromSpecifier(specifier: SelectionAreaTypeSpecifier): SelectionAreaTypeId {
        switch (specifier) {
            case SelectionAreaTypeSpecifier.Primary: return SelectionAreaType.toId(this._gridSettings.primarySelectionAreaType);
            case SelectionAreaTypeSpecifier.Secondary: return SelectionAreaType.toId(this._gridSettings.secondarySelectionAreaType);
            case SelectionAreaTypeSpecifier.Rectangle: return SelectionAreaTypeId.rectangle;
            case SelectionAreaTypeSpecifier.Row: return SelectionAreaTypeId.row;
            case SelectionAreaTypeSpecifier.Column: return SelectionAreaTypeId.column;
            case SelectionAreaTypeSpecifier.LastOrPrimary: {
                const lastArea = this._lastArea;
                if (lastArea === undefined) {
                    return this.calculateAreaTypeFromSpecifier(SelectionAreaTypeSpecifier.Primary);
                } else {
                    return lastArea.areaTypeId;
                }
            }
            default:
                throw new UnreachableCaseError('SCAT60711', specifier);
        }
    }

    /** @internal */
    calculateMouseMainSelectAllowedAreaTypeId() {
        const areaTypeId = this.calculateMouseMainSelectAreaTypeId();
        switch (areaTypeId) {
            case SelectionAreaTypeId.all: throw new AssertError('SCMMSAATI39113');
            case SelectionAreaTypeId.rectangle: return areaTypeId;
            case SelectionAreaTypeId.row: return this._gridSettings.mouseRowSelectionEnabled ? areaTypeId : undefined;
            case SelectionAreaTypeId.column: return this._gridSettings.mouseColumnSelectionEnabled ? areaTypeId : undefined;
            default:
                throw new UnreachableCaseError('SCMMSAATI30987', areaTypeId);
        }
    }

    /** @internal */
    adjustForRowsInserted(rowIndex: number, rowCount: number, dataServer: DataServer<SF>) {
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
    adjustForRowsDeleted(rowIndex: number, rowCount: number, dataServer: DataServer<SF>) {
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
    adjustForRowsMoved(oldRowIndex: number, newRowIndex: number, count: number, dataServer: DataServer<SF>) {
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
    private createAreaFromAll(): SelectionArea | undefined {
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
                    areaTypeId: SelectionAreaTypeId.all,
                    topLeft: { x, y },
                    inclusiveFirst: { x, y },
                    exclusiveBottomRight: { x: activeColumnCount, y: rowCount },
                    firstCorner: FirstCornerArea.Corner.TopLeft,
                    size: activeColumnCount * rowCount,
                };
            }
        }
    }

    /** @internal */
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
            areaTypeId: SelectionAreaTypeId.row,
            topLeft: { x, y },
            inclusiveFirst: { x, y },
            exclusiveBottomRight: { x: activeColumnCount, y: range.after },
            firstCorner: FirstCornerArea.Corner.TopLeft,
            size: activeColumnCount * height,
        };
    }

    /** @internal */
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
                areaTypeId: SelectionAreaTypeId.column,
                topLeft: { x, y },
                inclusiveFirst: { x, y },
                exclusiveBottomRight: { x: range.after, y: rowCount },
                firstCorner: FirstCornerArea.Corner.TopLeft,
                size: width * rowCount,
            };
        }
    }

    /** @internal */
    private calculateMouseMainSelectAreaTypeId() {
        const switchNewRectangleSelectionToRowOrColumn = this._gridSettings.switchNewRectangleSelectionToRowOrColumn;
        switch (switchNewRectangleSelectionToRowOrColumn) {
            case undefined: return this.calculateAreaTypeFromSpecifier(SelectionAreaTypeSpecifier.Primary);
            case 'row': return SelectionAreaTypeId.row;
            case 'column': return SelectionAreaTypeId.column;
            default:
                throw new UnreachableCaseError('SCMMSATI30987', switchNewRectangleSelectionToRowOrColumn);
        }
    }

    /** @internal */
    private createLastRectangleFirstCellStash(): Selection.LastRectangleFirstCellStash | undefined {
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
    private restoreLastRectangleFirstCellStash(lastRectangleFirstCellStash: Selection.LastRectangleFirstCellStash | undefined, allRowsKept: boolean) {
        if (lastRectangleFirstCellStash !== undefined) {
            const subgrid = this._subgrid;
            if (subgrid === undefined) {
                throw new AssertError('SRLRFC10987');
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
                                throw new AssertError('SRLRFCS31071');
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
                                throw new AssertError('SRLRFCS31071');
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
                throw new AssertError('SRRS10987');
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
        const selectedColumns = this.getColumnIndices();
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
export namespace Selection {
    /** @internal */
    export type ChangedEventer = (this: void) => void;

    export interface Stash<BCS extends BehavioredColumnSettings, SF extends SchemaField> {
        readonly subgrid: Subgrid<BCS, SF> | undefined;
        readonly allSelected: boolean,
        readonly lastRectangleFirstCell: LastRectangleFirstCellStash | undefined;
        readonly rowIds: unknown[] | undefined,
        readonly columnNames: string[] | undefined,
    }

    export interface LastRectangleFirstCellStash {
        fieldName: string;
        rowId: unknown;
    }
}
