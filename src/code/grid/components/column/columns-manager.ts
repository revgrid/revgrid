import { Column, ColumnWidth } from '../../interfaces/schema/column';
import { SchemaServer } from '../../interfaces/schema/schema-server';
import { ColumnSettings } from '../../interfaces/settings/column-settings';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { AssertError } from '../../types-utils/revgrid-error';
import { ColumnNameWidth, ListChangedEventHandler as ListChangedEventer, ListChangedTypeId, UiableListChangedEventHandler as UiableListChangedEventer } from '../../types-utils/types';
import { ColumnImplementation } from './column-implementation';

/** @public */
export class ColumnsManager {
    /** @internal */
    activeColumnWidthOrOrderChangedEventer: ColumnsManager.ActiveColumnWidthOrOrderChangedEventer;

    /** @internal */
    invalidateViewEventer: ColumnsManager.InvalidateViewEventer;
    /** @internal */
    allColumnListChangedEventer: ListChangedEventer;
    /** @internal */
    activeColumnListChangedEventer: UiableListChangedEventer;
    /** @internal */
    columnsWidthChangedEventer: ColumnsManager.ColumnsWidthChangedEventer;
    /** @internal */
    private _activeColumns = new Array<Column>();
    /** @internal */
    private _allColumns = new Array<Column>(); // always in same order as Schema

    /** @internal */
    private _beginSchemaChangeCount = 0;
    /** @internal */
    private _schemaChanged = false;

    /** @internal */
    private _beforeCreateColumnsListeners = new Array<ColumnsManager.BeforeCreateColumnsListener>();

    /** @internal */
    constructor(
        readonly schemaServer: SchemaServer,
        private readonly _gridSettings: GridSettings,
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
        return this.schemaServer.getSchema();
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
    getActiveColumn(x: number) {
        return this._activeColumns[x];
    }

    /**
     * The "grid index" of an active column given a column name
     * @returns The grid index of the column or -1 if column not in grid (hidden).
     * @internal
     */
    getActiveColumnIndexByName(name: string) {
        return this._activeColumns.findIndex((column) => { return column.name === name; });
    }

    /**
     * The "grid index" of an active column given a column index (or schemaColumn index)
     * @returns The grid index of the column or -1 if column not in grid (hidden).
     * @internal
     */
    getActiveColumnIndexByAllIndex(allIndex: number) {
        return this._activeColumns.findIndex((column) => { return column.index === allIndex; });
    }

    /** @internal */
    getAllColumn(allX: number) {
        return this._allColumns[allX];
    }

    /** @internal */
    newColumn(schemaColumn: SchemaServer.Column) {
        return new ColumnImplementation(this._gridSettings, schemaColumn);
    }

    /** @internal */
    createColumns() {
        this._beforeCreateColumnsListeners.forEach((listener) => listener());

        const schema = this.schemaServer.getSchema();
        // fields.decorateSchema(schema);
        // fields.decorateColumnSchema(schema, this.grid.properties.headerify);

        this.clearColumns();

        const count = schema.length;
        this._activeColumns.length = count;
        this._allColumns.length = count;

        for (let i = 0; i < count; i++) {
            const schemaColumn = schema[i];
            const column = this.newColumn(schemaColumn);
            this._activeColumns[i] = column;
            const allIndex = column.index;
            if (this._allColumns[allIndex] !== undefined) {
                throw new Error(`ColumnsManager.createColumns: Duplicate column index ${allIndex}`);
            } else {
                this._allColumns[allIndex] = column;
            }
        }

        this.invalidateViewEventer(true);
        this.activeColumnListChangedEventer(ListChangedTypeId.Set, 0, count, undefined, false);
        this.allColumnListChangedEventer(ListChangedTypeId.Set, 0, count, undefined);
    }

    /** @internal */
    createDummyColumn() {
        const schemaColumn: SchemaServer.Column = {
            index: -1,
            name: '',
            initialSettings: undefined,
        }
        return new ColumnImplementation(this._gridSettings, schemaColumn);
    }

    /** @internal */
    getActiveColumnWidth(x: number) {
        const column = this.getActiveColumn(x);
        return column !== undefined ? column.getWidth() : 0;
    }

    /** @internal */
    getActiveColumnRoundedWidth(x: number) {
        const column = this.getActiveColumn(x);
        return column !== undefined ? Math.round(column.getWidth()) : 0;
    }

    /** @internal */
    getActiveColumnCeilWidth(x: number) {
        const column = this.getActiveColumn(x);
        return column !== undefined ? Math.ceil(column.getWidth()) : 0;
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
    setActiveColumnWidth(columnOrIndex: Column | number, width: number | undefined, ui: boolean) {
        let column: Column
        if (typeof columnOrIndex === 'number') {
            if (columnOrIndex >= 0) {
                column = this.getActiveColumn(columnOrIndex);
            } else {
                throw new Error(`Behavior.setColumnWidth: Invalid column number ${columnOrIndex}`);
            }
        } else {
            column = columnOrIndex;
        }
        const changed = column.setWidth(width);
        if (changed) {
            this.invalidateViewEventer(true);
            this.columnsWidthChangedEventer([column], ui);
            return column;
        } else {
            return undefined;
        }
    }

    /** @internal */
    setColumnWidths(columnWidths: ColumnWidth[], ui: boolean) {
        const changedColumns = new Array<Column>(columnWidths.length);
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
            this.invalidateViewEventer(true);
            this.columnsWidthChangedEventer(changedColumns, ui);
            return true;
        }
    }

    /** @internal */
    setColumnWidthsByName(columnNameWidths: ColumnNameWidth[], ui: boolean) {
        const changedColumns = new Array<Column>(columnNameWidths.length);
        let changedColumnsCount = 0;
        for (const columnNameWidth of columnNameWidths) {
            const { name, width } = columnNameWidth;
            const column = this._allColumns.find((aColumn) => aColumn.name === name)
            if (column === undefined) {
                throw new Error(`Behavior.setColumnWidthsByName: Column name not found: ${name}`);
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
            this.invalidateViewEventer(true);
            this.columnsWidthChangedEventer(changedColumns, ui);
            return true;
        }
    }

    /**
     * @summary Sets properties for active columns.
     * @desc Sets multiple columns' properties from elements of given array or collection. Keys may be column indexes or column names. The properties collection is cleared first. Falsy elements are ignored.
     * @param columnsHash - If undefined, this call is a no-op.
     * @internal
     */
    setAllColumnProperties(columnsHash?: ColumnSettings[] | Record<string, ColumnSettings>) {
        this.addAllColumnProperties(columnsHash, true);
    }

    /**
     * @summary Adds properties for multiple columns.
     * @desc Adds . The properties collection is optionally cleared first. Falsy elements are ignored.
     * @param columnsHash - If undefined, this call is a no-op.
     * @param settingState - Clear columns' properties objects before copying properties.
     * @internal
     */
    addAllColumnProperties(columnsHash?: Partial<ColumnSettings>[] | Record<string, Partial<ColumnSettings>>, settingState?: boolean) {
        if (columnsHash === undefined) {
            return;
        }

        const allColumns = this._allColumns;

        if (Array.isArray(columnsHash)) {
            const columnCount = allColumns.length;
            for (let i = 0; i < columnCount; i++) {
                const column = allColumns[i];
                if (settingState === true) {
                    // column.clearProperties(); // needs to be implemented
                }

                column.addProperties(columnsHash[i]);
            }
        } else {
            Object.keys(columnsHash).forEach((key) => {
                const index = this._allColumns.findIndex((column) => column.name === key)

                if (index >= 0) {
                    const column = allColumns[index];
                    if (column) {
                        if (settingState === true) {
                            // column.clearProperties(); // needs to be implemented
                        }

                        column.addProperties(columnsHash[key]);
                    }
                }
            });
        }
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

        let newColumns: Column[];
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

        this._gridSettings.columnIndexes = activeColumns.map((column) => column.index );
    }

    setActiveColumnsAndWidthsByName(columnNameWidths: ColumnNameWidth[], ui: boolean) {
        const activeColumns = this._activeColumns;
        const count = columnNameWidths.length;
        activeColumns.length = count;
        for (let i = 0; i < count; i++) {
            const { name, width } = columnNameWidths[i];
            const column = this._allColumns.find((aColumn) => aColumn.name === name)
            if (column === undefined) {
                throw new Error(`Behavior.setActiveColumnsAndWidthsByName: Column name not found: ${name}`);
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
    setActiveColumns(columnNameOrAllIndexArray: readonly (Column | string | number)[]) {
        const newActiveCount = columnNameOrAllIndexArray.length;
        const newActiveColumns = new Array<Column>(newActiveCount);
        for (let i = 0; i < newActiveCount; i++) {
            const columnNameOrAllIndex = columnNameOrAllIndexArray[i];
            let column: Column;
            if (typeof columnNameOrAllIndex === 'number') {
                column = this._allColumns[columnNameOrAllIndex];
            } else {
                if (typeof columnNameOrAllIndex === 'string') {
                    const foundColumn = this._allColumns.find((aColumn) => aColumn.name === columnNameOrAllIndex);
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

        this.invalidateViewEventer(true);
    }

    /**
     * @param activeColumnIndex - Data x coordinate.
     * @return The properties for a specific column.
     * @internal
     */
    getActiveColumnProperties(activeColumnIndex: number): ColumnSettings | undefined {
        const column = this.getActiveColumn(activeColumnIndex);
        return column?.settings;
    }

    /**
     * @param allX - Data x coordinate.
     * @return The properties for a specific column.
     * @internal
     */
    setColumnProperties(allX: number, properties: ColumnSettings): ColumnSettings {
        const column = this.getAllColumn(allX);
        if (column === undefined) {
            throw 'Expected column.';
        }

        // column.clearProperties(); // needs implementation
        column.settings.merge(properties);
        this.invalidateViewEventer(true); // true in case width affected
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
        this.invalidateViewEventer(true); // true in case swapped with fixed column
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
    autosizeAllColumns() {
        this.checkColumnAutosizing(true);
    }

    /** @internal */
    checkColumnAutosizing(force: boolean, withinAnimationFrame = false) {
        let autoSized = false;

        for (const column of this._activeColumns) {
            if (column.checkColumnAutosizing(force)) {
                autoSized = true;
            }
        }

        if (autoSized) {
            if (withinAnimationFrame) {
                setTimeout(() => this.invalidateViewEventer(true), 0);
            } else {
                this.invalidateViewEventer(true);
            }
        }
        return autoSized;
    }

    /** @internal */
    get allColumns(): readonly Column[] {
        return this._allColumns;
    }

    /** @internal */
    get activeColumns(): readonly Column[] {
        return this._activeColumns;
    }

    /** @internal */
    getHiddenColumns() {
        // this does not look right
        const visible = this._activeColumns;
        const all = this._allColumns;
        const hidden = new Array<Column>();
        for (let i = 0; i < all.length; i++) {
            if (visible.indexOf(all[i]) === -1) {
                hidden.push(all[i]);
            }
        }
        hidden.sort((a, b) => {
            return a.name < b.name ? 1 : 0; // previously was header
        });
        return hidden;
    }
}

/** @public */
export namespace ColumnsManager {
    export type InvalidateViewEventer = (this: void, scrollDimensionAsWell: boolean) => void;
    export type ActiveColumnWidthOrOrderChangedEventer = (this: void) => void;
    export type ColumnsWidthChangedEventer = (this: void, columns: Column[], ui: boolean) => void;

    export type BeforeCreateColumnsListener = (this: void) => void;
}
