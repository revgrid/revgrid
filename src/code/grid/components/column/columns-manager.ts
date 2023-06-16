import { Column, ColumnWidth } from '../../interfaces/schema/column';
import { SchemaServer } from '../../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { ColumnSettings } from '../../interfaces/settings/column-settings';
import { AssertError } from '../../types-utils/revgrid-error';
import { ColumnFieldNameAndWidth, ListChangedEventHandler as ListChangedEventer, ListChangedTypeId, UiableListChangedEventHandler as UiableListChangedEventer } from '../../types-utils/types';
import { ColumnImplementation } from './column-implementation';

/** @public */
export class ColumnsManager<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> {
    /** @internal */
    activeColumnWidthOrOrderChangedEventer: ColumnsManager.ActiveColumnWidthOrOrderChangedEventer;

    /** @internal */
    invalidateHorizontalViewLayoutEventer: ColumnsManager.InvalidateHorizontalViewLayoutEventer;
    /** @internal */
    allColumnListChangedEventer: ListChangedEventer;
    /** @internal */
    activeColumnListChangedEventer: UiableListChangedEventer;
    /** @internal */
    columnsWidthChangedEventer: ColumnsManager.ColumnsWidthChangedEventer<BCS, SF>;
    /** @internal */
    private readonly _activeColumns = new Array<Column<BCS, SF>>();
    /** @internal */
    private readonly _allColumns = new Array<Column<BCS, SF>>(); // always in same order as Schema

    /** @internal */
    private _beginSchemaChangeCount = 0;
    /** @internal */
    private _schemaChanged = false;

    /** @internal */
    private _beforeCreateColumnsListeners = new Array<ColumnsManager.BeforeCreateColumnsListener>();

    /** @internal */
    constructor(
        readonly schemaServer: SchemaServer<BCS, SF>,
        private readonly _gridSettings: BGS,
    ) {
    }

    get allColumnCount() { return this._allColumns.length; }
    get activeColumnCount() { return this._activeColumns.length; }

    /** @internal */
    addBeforeCreateColumnsListener(listener: ColumnsManager.BeforeCreateColumnsListener) {
        this._beforeCreateColumnsListeners.push(listener);
    }

    /** @internal */
    removeBeforeCreateColumnsListener(listener: ColumnsManager.BeforeCreateColumnsListener) {
        const index = this._beforeCreateColumnsListeners.indexOf(listener);
        if (index < 0) {
            throw new AssertError('CMRBCCL72009');
        } else {
            this._beforeCreateColumnsListeners.splice(index, 1);
        }
    }

    /** @internal */
    getSchema() {
        return this.schemaServer.getFields();
    }

    /** @internal */
    beginSchemaChange() {
        this._beginSchemaChangeCount++;
    }

    /** @internal */
    endSchemaChange() {
        // In future, advise ColumnsManager of all schema changes and let ColumnManager figure out if schema changed
        this._beginSchemaChangeCount--;
        if (this._beginSchemaChangeCount === 0) {
            if ( this._schemaChanged) {
                this._schemaChanged = false;
                this.createColumns();
            }
        } else {
            if (this._beginSchemaChangeCount < 0) {
                throw new AssertError('RAEC91004', 'Mismatched ColumnsManager beginSchema/endSchemaChange callback');
            }
        }
    }

    /** @internal */
    schemaColumnsInserted(_index: number, count: number) {
        this.beginSchemaChange();
        try {
            if (count > 0) {
                this._schemaChanged = true;
            }
        } finally {
            this.endSchemaChange();
        }
    }

    /** @internal */
    schemaColumnsDeleted(_index: number, count: number) {
        this.beginSchemaChange();
        try {
            if (count > 0) {
                this._schemaChanged = true;
            }
        } finally {
            this.endSchemaChange();
        }
    }

    /** @internal */
    allSchemaColumnsDeleted() {
        this.beginSchemaChange();
        try {
            this._schemaChanged = true;
        } finally {
            this.endSchemaChange();
        }
    }

    /** @internal */
    schemaColumnsChanged() {
        this.beginSchemaChange();
        try {
            this._schemaChanged = true;
        } finally {
            this.endSchemaChange();
        }
    }

    /** @internal */
    clearColumns() {
        // As part of Typescript conversion, schema is now readonly.
        // Need to find other way of getting non default name and header to tree and row number columns
        //
        // const schema = this.mainDataModel.getSchema();

        this._activeColumns.length = 0;
        this._allColumns.length = 0;

        // this.columns[tc].properties.propClassLayers = this.columns[rc].properties.propClassLayers = this.grid.properties.propClassLayersMap.NO_ROWS;

        // Signal the renderer to size the now-reset handle column before next render
        // this.grid.renderer.resetRowHeaderColumnWidth();
    }

    /** @internal */
    getActiveColumn(index: number) {
        return this._activeColumns[index];
    }

    /**
     * The "grid index" of an active column given a column name
     * @returns The grid index of the column or -1 if column not in grid (hidden).
     * @internal
     */
    getActiveColumnIndexByFieldName(name: string) {
        return this._activeColumns.findIndex((column) => { return column.field.name === name; });
    }

    /**
     * The "grid index" of an active column given a column index (or schemaColumn index)
     * @returns The grid index of the column or -1 if column not in grid (hidden).
     * @internal
     */
    getActiveColumnIndexByFieldIndex(fieldIndex: number) {
        return this._activeColumns.findIndex((column) => { return column.field.index === fieldIndex; });
    }

    /** @internal */
    getAllColumn(allX: number) {
        return this._allColumns[allX];
    }

    /** @internal */
    newColumn(field: SF, columnSettings: BCS): Column<BCS, SF> {
        return new ColumnImplementation(
            field,
            columnSettings,
            () => this.invalidateHorizontalViewLayoutEventer(true),
        );
    }

    /** @internal */
    createColumns() {
        this._beforeCreateColumnsListeners.forEach((listener) => listener());

        const fields = this.schemaServer.getFields();

        this.clearColumns();

        const count = fields.length;
        this._activeColumns.length = count;
        this._allColumns.length = count;

        for (let i = 0; i < count; i++) {
            const field = fields[i];
            const columnSettings = this.schemaServer.getFieldColumnSettings(field);
            const column = this.newColumn(field, columnSettings);
            this._activeColumns[i] = column;
            const fieldIndex = field.index;
            if (this._allColumns[fieldIndex] !== undefined) {
                throw new Error(`ColumnsManager.createColumns: Duplicate column index ${fieldIndex}`);
            } else {
                this._allColumns[fieldIndex] = column;
            }
        }

        this.invalidateHorizontalViewLayoutEventer(true);
        this.activeColumnListChangedEventer(ListChangedTypeId.Set, 0, count, undefined, false);
        this.allColumnListChangedEventer(ListChangedTypeId.Set, 0, count, undefined);
    }

    /** @internal */
    createDummyColumn(): Column<BCS, SF> {
        const dummyColumnSettings: BCS = {} as BCS;
        const field: SF = {
            name: '',
            index: -1,
        } as SF;
        return new ColumnImplementation(
            field,
            dummyColumnSettings,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            () => {},
        );
    }

    /** @internal */
    getActiveColumnWidth(index: number) {
        const column = this._activeColumns[index];
        return column !== undefined ? column.width : 0;
    }

    /** @internal */
    getActiveColumnRoundedWidth(index: number) {
        const column = this._activeColumns[index];
        return column !== undefined ? Math.round(column.width) : 0;
    }

    /** @internal */
    getActiveColumnCeilWidth(index: number) {
        const column = this._activeColumns[index];
        return column !== undefined ? Math.ceil(column.width) : 0;
    }

    /**
     * @returns The total width of all the fixed columns.
     */
    calculateFixedColumnsWidth(): number {
        const count = this.getFixedColumnCount();
        if (count === 0) {
            return 0;
        } else {
            let total = 0;

            for (let i = 0; i < count; i++) {
                const columnWidth = this.getActiveColumnRoundedWidth(i);
                total += columnWidth;
            }

            total += (count - 1) * this._gridSettings.gridLinesVWidth;

            return total;
        }
    }

    /**
     * @param columnOrIndex - The column or active column index.
     * @internal
     */
    setActiveColumnWidth(columnOrIndex: Column<BCS, SF> | number, width: number | undefined, ui: boolean) {
        let column: Column<BCS, SF>
        if (typeof columnOrIndex === 'number') {
            if (columnOrIndex >= 0) {
                column = this._activeColumns[columnOrIndex];
            } else {
                throw new Error(`Behavior.setColumnWidth: Invalid column number ${columnOrIndex}`);
            }
        } else {
            column = columnOrIndex;
        }
        const changed = column.setWidth(width);
        if (changed) {
            this.invalidateHorizontalViewLayoutEventer(true);
            this.columnsWidthChangedEventer([column], ui);
            return column;
        } else {
            return undefined;
        }
    }

    /** @internal */
    setColumnWidths(columnWidths: ColumnWidth<BCS, SF>[], ui: boolean) {
        const changedColumns = new Array<Column<BCS, SF>>(columnWidths.length);
        let changedColumnsCount = 0;
        for (const columnWidth of columnWidths) {
            const { column, width } = columnWidth;
            if (column.setWidth(width)) {
                changedColumns[changedColumnsCount++] = column;
            }
        }
        if (changedColumnsCount === 0) {
            return false;
        } else {
            changedColumns.length = changedColumnsCount;
            this.columnsWidthChangedEventer(changedColumns, ui);
            return true;
        }
    }

    /** @internal */
    setColumnWidthsByFieldName(columnFieldNameAndWidths: ColumnFieldNameAndWidth[], ui: boolean) {
        const changedColumns = new Array<Column<BCS, SF>>(columnFieldNameAndWidths.length);
        let changedColumnsCount = 0;
        for (const fieldNameAndWidth of columnFieldNameAndWidths) {
            const { fieldName, width } = fieldNameAndWidth;
            const column = this._allColumns.find((aColumn) => aColumn.field.name === fieldName)
            if (column === undefined) {
                throw new Error(`Behavior.setColumnWidthsByName: Column name not found: ${fieldName}`);
            } else {
                if (column.setWidth(width)) {
                    changedColumns[changedColumnsCount++] = column;
                }
            }
        }
        if (changedColumnsCount === 0) {
            return false;
        } else {
            changedColumns.length = changedColumnsCount;
            this.columnsWidthChangedEventer(changedColumns, ui);
            return true;
        }
    }

    /**
     * @summary Sets properties for active columns.
     * @desc Sets multiple columns' properties from elements of given array or collection. Keys may be column indexes or column names. The properties collection is cleared first. Falsy elements are ignored.
     * @param settings - If undefined, this call is a no-op.
     * @internal
     */
    loadAllColumnSettings(settings: ColumnSettings) {
        const allColumns = this._allColumns;
        const columnCount = allColumns.length;
        for (let i = 0; i < columnCount; i++) {
            const column = allColumns[i];
            column.loadSettings(settings);
        }
    }

    /**
     * @summary Adds properties for multiple columns.
     * @desc Adds . The properties collection is optionally cleared first. Falsy elements are ignored.
     * @param settings - If undefined, this call is a no-op.
     * @param settingState - Clear columns' properties objects before copying properties.
     * @internal
     */
    mergeAllColumnSettings(settings: Partial<ColumnSettings>[] | Record<string, Partial<ColumnSettings>>, settingState?: boolean) {
        // looks weird - needs fixing
        // const allColumns = this._allColumns;

        // if (Array.isArray(settings)) {
        //     const columnCount = allColumns.length;
        //     for (let i = 0; i < columnCount; i++) {
        //         const column = allColumns[i];
        //         if (settingState === true) {
        //             // column.clearProperties(); // needs to be implemented
        //         }

        //         column.loadSettings(settings[i]);
        //     }
        // } else {
        //     Object.keys(settings).forEach((key) => {
        //         const index = this._allColumns.findIndex((column) => column.name === key)

        //         if (index >= 0) {
        //             const column = allColumns[index];
        //             if (column) {
        //                 if (settingState === true) {
        //                     // column.clearProperties(); // needs to be implemented
        //                 }

        //                 column.loadSettings(settings[key]);
        //             }
        //         }
        //     });
        // }
    }

    showColumns(
        allColumnIndexesOrIsActiveColumnIndexes: boolean | number | number[],
        referenceIndexOrColumnIndexes?: number | number[],
        allowDuplicateColumnsOrReferenceIndex?: boolean | number,
        allowDuplicateColumns = false
    ): void {
        let isActiveColumnIndexes: boolean;
        let columnIndexOrIndices: number | number[] | undefined;
        let referenceIndex: number;

        // Promote args when isActiveColumnIndexes omitted
        if (typeof allColumnIndexesOrIsActiveColumnIndexes === 'number' || Array.isArray(allColumnIndexesOrIsActiveColumnIndexes)) {
            isActiveColumnIndexes = false;
            columnIndexOrIndices = allColumnIndexesOrIsActiveColumnIndexes;
            referenceIndex = referenceIndexOrColumnIndexes as number;
            allowDuplicateColumns = allowDuplicateColumnsOrReferenceIndex as boolean;
        } else {
            isActiveColumnIndexes = allColumnIndexesOrIsActiveColumnIndexes;
            columnIndexOrIndices = referenceIndexOrColumnIndexes;
            referenceIndex = allowDuplicateColumnsOrReferenceIndex as number;
        }

        const activeColumns = this._activeColumns;
        const sourceColumnList = isActiveColumnIndexes ? activeColumns : this._allColumns;

        let newColumns: Column<BCS, SF>[];
        if (columnIndexOrIndices === undefined) {
            newColumns = sourceColumnList;
        } else {
            const columnIndexes = (typeof columnIndexOrIndices === 'number') ? [columnIndexOrIndices] : columnIndexOrIndices;
            newColumns = columnIndexes
                .map((index) => sourceColumnList[index]) // Look up columns using provided indexes
                .filter(column => column); // Remove any undefined columns

        }

        // Default insertion point is end (i.e., before (last+1)th element)
        if (referenceIndex === undefined) {
            referenceIndex = activeColumns.length;
        }

        // Remove already visible columns and adjust insertion point
        if (!allowDuplicateColumns) {
            newColumns.forEach(
                (column) => {
                    const i = activeColumns.indexOf(column);
                    if (i >= 0) {
                        activeColumns.splice(i, 1);
                        if (referenceIndex > i) {
                            --referenceIndex;
                        }
                    }
                }
            );
        }

        // Insert the new columns at the insertion point
        if (referenceIndex >= 0) {
            activeColumns.splice(referenceIndex, 0, ...newColumns);
        }
    }

    setActiveColumnsAndWidthsByFieldName(columnFieldNameAndWidths: ColumnFieldNameAndWidth[], ui: boolean) {
        const activeColumns = this._activeColumns;
        const count = columnFieldNameAndWidths.length;
        activeColumns.length = count;
        for (let i = 0; i < count; i++) {
            const { fieldName, width } = columnFieldNameAndWidths[i];
            const column = this._allColumns.find((aColumn) => aColumn.field.name === fieldName)
            if (column === undefined) {
                throw new Error(`Behavior.setActiveColumnsAndWidthsByName: Column name not found: ${fieldName}`);
            } else {
                activeColumns[i] = column;
                column.setWidth(width);
            }
        }
        this.activeColumnListChangedEventer(ListChangedTypeId.Set, 0, count, undefined, ui);
    }

    /**
     * @summary Hide active column(s).
     * @desc Removes one or several columns from the "active" column list.
     * @param allColumnIndexes - Column index(es) to be removed. The columns are specified by the column index (not active index).
     * @internal
     */
    hideColumns(allColumnIndexes: number | number[]) {
        this.showColumns(allColumnIndexes, -1);
    }

    /** @internal */
    hideActiveColumn(columnIndex: number) {
        this._activeColumns.splice(columnIndex, 1);
        this.activeColumnWidthOrOrderChangedEventer();
    }

    /** @internal */
    setActiveColumns(columnFieldNameOrAllIndexArray: readonly (Column<BCS, SF> | string | number)[]) {
        const newActiveCount = columnFieldNameOrAllIndexArray.length;
        const newActiveColumns = new Array<Column<BCS, SF>>(newActiveCount);
        for (let i = 0; i < newActiveCount; i++) {
            const columnNameOrAllIndex = columnFieldNameOrAllIndexArray[i];
            let column: Column<BCS, SF>;
            if (typeof columnNameOrAllIndex === 'number') {
                column = this._allColumns[columnNameOrAllIndex];
            } else {
                if (typeof columnNameOrAllIndex === 'string') {
                    const foundColumn = this._allColumns.find((aColumn) => aColumn.field.name === columnNameOrAllIndex);
                    if (foundColumn === undefined) {
                        throw new Error(`ColumnsManager.setActiveColumns: Column with name not found: ${columnNameOrAllIndex}`);
                    } else {
                        column = foundColumn;
                    }
                } else {
                    column = columnNameOrAllIndex;
                }
            }

            newActiveColumns[i] = column;
        }

        const oldActiveCount = this._activeColumns.length;
        this._activeColumns.splice(0, oldActiveCount, ...newActiveColumns);

        this.invalidateHorizontalViewLayoutEventer(true);
    }

    /**
     * @param activeColumnIndex - Data x coordinate.
     * @return The properties for a specific column.
     * @internal
     */
    getActiveColumnSettings(activeColumnIndex: number): ColumnSettings | undefined {
        const column = this._activeColumns[activeColumnIndex];
        return column?.settings;
    }

    /**
     * @param allX - Data x coordinate.
     * @return The properties for a specific column.
     * @internal
     */
    setColumnSettings(allX: number, settings: ColumnSettings): ColumnSettings {
        const column = this.getAllColumn(allX);
        if (column === undefined) {
            throw 'Expected column.';
        }

        // column.clearProperties(); // needs implementation
        column.settings.load(settings);
        return column.settings;
    }

    /**
     * @returns The number of fixed columns.
     */
    getFixedColumnCount(): number {
        return this._gridSettings.fixedColumnCount;
    }

    isColumnFixed(activeColumnIndex: number) {
        return activeColumnIndex < this._gridSettings.fixedColumnCount;
    }

    /**
     * @desc swap source and target columns
     * @param source - column index
     * @param target - column index
     * @internal
     */
    swapColumns(source: number, target: number) {
        const columns = this._activeColumns;
        const sourceColumn = columns[source];
        if (sourceColumn === undefined) {
            return;
        }
        const targetColumn = columns[target];
        columns[source] = targetColumn;
        if (sourceColumn === undefined) {
            return;
        }
        columns[target] = sourceColumn;
        this.invalidateHorizontalViewLayoutEventer(true); // true in case swapped with fixed column
    }

    /** @internal */
    moveColumnBefore(sourceIndex: number, targetIndex: number, ui: boolean) {
        const columns = this._activeColumns;
        const sourceColumn = columns[sourceIndex];
        if (sourceColumn === undefined) {
            return;
        }
        const targetColumn = columns[targetIndex];
        if (targetColumn === undefined) {
            return;
        }
        this.moveActive(columns, sourceIndex, targetIndex, ui);

        this.activeColumnWidthOrOrderChangedEventer();
    }

    /** @internal */
    moveColumnAfter(sourceIndex: number, targetIndex: number, ui: boolean) {
        const columns = this._activeColumns;
        const sourceColumn = columns[sourceIndex];
        if (sourceColumn === undefined) {
            return;
        }
        const targetColumn = columns[targetIndex];
        if (targetColumn === undefined) {
            return;
        }
        this.moveActive(columns, sourceIndex, targetIndex + 1, ui);

        this.activeColumnWidthOrOrderChangedEventer();
    }

    /** @internal */
    private moveActive<T>(arr: T[], oldIndex: number, newIndex: number, ui: boolean) {
        const old = arr[oldIndex];
        arr.splice(oldIndex, 1);
        arr.splice(newIndex > oldIndex ? newIndex - 1 : newIndex, 0, old);
        this.activeColumnListChangedEventer(ListChangedTypeId.Move, oldIndex, 1, newIndex, ui);
        return arr;
    }

    /** @internal */
    autosizeAllColumns(widenOnly: boolean) {
        this.checkColumnAutosizing(widenOnly, false);
    }

    /** @internal */
    checkColumnAutosizing(widenOnly: boolean, withinAnimationFrame: boolean) {
        let autoSized = false;

        for (const column of this._activeColumns) {
            if (column.checkColumnAutosizing(widenOnly)) {
                autoSized = true;
            }
        }

        if (autoSized) {
            if (withinAnimationFrame) {
                setTimeout(() => this.invalidateHorizontalViewLayoutEventer(true), 0);
            } else {
                this.invalidateHorizontalViewLayoutEventer(true);
            }
        }
        return autoSized;
    }

    /** @internal */
    get allColumns(): readonly Column<BCS, SF>[] {
        return this._allColumns;
    }

    /** @internal */
    get activeColumns(): readonly Column<BCS, SF>[] {
        return this._activeColumns;
    }

    /** @internal */
    getHiddenColumns() {
        // this does not look right
        const visible = this._activeColumns;
        const all = this._allColumns;
        const hidden = new Array<Column<BCS, SF>>();
        for (let i = 0; i < all.length; i++) {
            if (visible.indexOf(all[i]) === -1) {
                hidden.push(all[i]);
            }
        }
        hidden.sort((a, b) => {
            return a.field.name < b.field.name ? 1 : 0;
        });
        return hidden;
    }
}

/** @public */
export namespace ColumnsManager {
    export type InvalidateHorizontalViewLayoutEventer = (this: void, scrollDimensionAsWell: boolean) => void;
    export type ActiveColumnWidthOrOrderChangedEventer = (this: void) => void;
    export type ColumnsWidthChangedEventer<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> = (this: void, columns: Column<BCS, SF>[], ui: boolean) => void;

    export type BeforeCreateColumnsListener = (this: void) => void;
}
