import { moveElementInArray } from '@pbkware/js-utils';
import { RevApiError, RevAssertError, RevClientObject, RevListChangedEventer, RevListChangedTypeId, RevSchemaField, RevSchemaServer, RevUiableListChangedEventHandler as UiableListChangedEventer } from '../../../common';
import { RevColumn, RevColumnAutoSizeableWidth } from '../../interfaces/column';
import { RevBehavioredColumnSettings, RevColumnSettings, RevGridSettings } from '../../settings';
import { RevColumnImplementation } from './column-implementation';

/** @public */
export class RevColumnsManager<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    /** @internal */
    invalidateHorizontalViewLayoutEventer: RevColumnsManager.InvalidateHorizontalViewLayoutEventer;
    /** @internal */
    fieldColumnListChangedEventer: RevListChangedEventer;
    /** @internal */
    activeColumnListChangedEventer: UiableListChangedEventer;
    /** @internal */
    columnsWidthChangedEventer: RevColumnsManager.ColumnsWidthChangedEventer<BCS, SF>;
    /** @internal */
    private readonly _activeColumns = new Array<RevColumn<BCS, SF>>();
    /** @internal */
    private readonly _fieldColumns = new Array<RevColumn<BCS, SF>>(); // always in same order as Schema

    /** @internal */
    private _beginSchemaChangeCount = 0;
    /** @internal */
    private _schemaChanged = false;

    /** @internal */
    private _beforeCreateColumnsListeners = new Array<RevColumnsManager.BeforeCreateColumnsListener>();

    /** @internal */
    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        readonly schemaServer: RevSchemaServer<SF>,
        readonly gridSettings: RevGridSettings,
        public getSettingsForNewColumnEventer: RevColumnsManager.GetSettingsForNewColumnEventer<BCS, SF>,
    ) {
    }

    get fieldColumnCount() { return this._fieldColumns.length; }
    get activeColumnCount() { return this._activeColumns.length; }

    get fieldColumns(): readonly RevColumn<BCS, SF>[] {
        return this._fieldColumns;
    }

    get activeColumns(): readonly RevColumn<BCS, SF>[] {
        return this._activeColumns;
    }

    getSchema() {
        return this.schemaServer.getFields();
    }

    /** @internal */
    addBeforeCreateColumnsListener(listener: RevColumnsManager.BeforeCreateColumnsListener) {
        this._beforeCreateColumnsListeners.push(listener);
    }

    /** @internal */
    removeBeforeCreateColumnsListener(listener: RevColumnsManager.BeforeCreateColumnsListener) {
        const index = this._beforeCreateColumnsListeners.indexOf(listener);
        if (index < 0) {
            throw new RevAssertError('CMRBCCL72009');
        } else {
            this._beforeCreateColumnsListeners.splice(index, 1);
        }
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
                throw new RevAssertError('RAEC91004', 'Mismatched ColumnsManager beginSchema/endSchemaChange callback');
            }
        }
    }

    /** @internal */
    schemaFieldsInserted(_index: number, count: number) {
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
    schemaFieldsDeleted(_index: number, count: number) {
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
        this._activeColumns.length = 0;
        this._fieldColumns.length = 0;
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
    getFieldColumn(fieldIndex: number) {
        return this._fieldColumns[fieldIndex];
    }

    /** @internal */
    createDummyColumn(): RevColumn<BCS, SF> {
        const field: SF = {
            name: '',
            index: -1,
        } as SF;
        return new RevColumnImplementation(
            field,
            {
                defaultColumnWidth: 50,
                defaultColumnAutoSizing: true,
            } as BCS,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            () => {},
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            () => {},
        );
    }

    /** @internal */
    getActiveColumnWidth(index: number) {
        const column = this._activeColumns[index];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        return column !== undefined ? column.width : 0;
    }

    /** @internal */
    getActiveColumnRoundedWidth(index: number) {
        const column = this._activeColumns[index];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        return column !== undefined ? Math.round(column.width) : 0;
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

            total += (count - 1) * this.gridSettings.verticalGridLinesWidth;

            return total;
        }
    }

    /** @internal */
    setColumnWidths(columnWidths: RevColumnAutoSizeableWidth<BCS, SF>[], ui: boolean) {
        const changedColumns = new Array<RevColumn<BCS, SF>>(columnWidths.length);
        let changedColumnsCount = 0;
        for (const columnWidth of columnWidths) {
            const column = columnWidth.column as RevColumnImplementation<BCS, SF>;
            const width = columnWidth.width;
            if (width === undefined) {
                column.setAutoWidthSizing(true);
            } else {
                // do not flag UI change when setting column as these changes will be aggregated below
                if (column.setWidthAndPossiblyNotify(width, ui, false)) {
                    changedColumns[changedColumnsCount++] = column;
                }
            }
        }
        if (changedColumnsCount === 0) {
            return false;
        } else {
            changedColumns.length = changedColumnsCount;
            this.notifyColumnsWidthChanged(changedColumns, ui);
            return true;
        }
    }

    /** @internal */
    setColumnWidthsByFieldName(fieldNameAndWidths: RevColumnsManager.FieldNameAndAutoSizableWidth[], ui: boolean) {
        const changedColumns = new Array<RevColumn<BCS, SF>>(fieldNameAndWidths.length);
        let changedColumnsCount = 0;
        for (const fieldNameAndWidth of fieldNameAndWidths) {
            const { name, autoSizableWidth } = fieldNameAndWidth;
            const column = this._fieldColumns.find((aColumn) => aColumn.field.name === name) as RevColumnImplementation<BCS, SF> | undefined;
            if (column === undefined) {
                throw new RevApiError('CMSCWBFN20251', `Behavior.setColumnWidthsByName: Column name not found: ${name}`);
            } else {
                if (autoSizableWidth === undefined) {
                    column.setAutoWidthSizing(true);
                } else {
                    if (column.setWidthAndPossiblyNotify(autoSizableWidth, ui, false)) {
                        changedColumns[changedColumnsCount++] = column;
                    }
                }
            }
        }
        if (changedColumnsCount === 0) {
            return false;
        } else {
            changedColumns.length = changedColumnsCount;
            this.notifyColumnsWidthChanged(changedColumns, ui);
            return true;
        }
    }

    setActiveColumnsAndWidthsByFieldName(fieldNameAndWidths: RevColumnsManager.FieldNameAndAutoSizableWidth[], ui: boolean) {
        const activeColumns = this._activeColumns;
        const newActiveColumnCount = fieldNameAndWidths.length;
        activeColumns.length = newActiveColumnCount;
        const changedColumns = new Array<RevColumn<BCS, SF>>(newActiveColumnCount);
        let changedColumnsCount = 0;
        for (let i = 0; i < newActiveColumnCount; i++) {
            const { name, autoSizableWidth } = fieldNameAndWidths[i];
            const column = this._fieldColumns.find((aColumn) => aColumn.field.name === name) as RevColumnImplementation<BCS, SF> | undefined;
            if (column === undefined) {
                throw new RevApiError('CMSACAWBFN01098', `Behavior.setActiveColumnsAndWidthsByName: Column name not found: ${name}`);
            } else {
                activeColumns[i] = column;
                if (autoSizableWidth === undefined) {
                    column.setAutoWidthSizing(true);
                } else {
                    if (column.setWidthAndPossiblyNotify(autoSizableWidth, ui, false)) {
                        changedColumns[changedColumnsCount++] = column;
                    }
                }
            }
        }

        this.notifyActiveColumnListChanged(RevListChangedTypeId.Set, 0, newActiveColumnCount, undefined, ui);

        if (changedColumnsCount > 0) {
            changedColumns.length = changedColumnsCount;
            this.notifyColumnsWidthChanged(changedColumns, ui);
        }
    }

    /**
     * Sets properties for active columns.
     * @remarks Sets multiple columns' properties from elements of given array or collection. Keys may be column indexes or column names. The properties collection is cleared first. Falsy elements are ignored.
     * @param settings - If undefined, this call is a no-op.
     * @internal
     */
    loadAllColumnSettings(settings: BCS) {
        const fieldColumns = this._fieldColumns;
        const columnCount = fieldColumns.length;
        for (let i = 0; i < columnCount; i++) {
            const column = fieldColumns[i];
            column.loadSettings(settings);
        }
    }

    /**
     * Adds properties for multiple columns.
     * @remarks Adds . The properties collection is optionally cleared first. Falsy elements are ignored.
     * @param settings - If undefined, this call is a no-op.
     * @param settingState - Clear columns' properties objects before copying properties.
     * @internal
     */
    mergeAllColumnSettings(settings: Partial<RevColumnSettings>[] | Record<string, Partial<RevColumnSettings>>, settingState?: boolean) {
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

    showHideColumns(
        /** If true, then column indices specify active column indices.  Otherwise field column indices */
        indexesAreActive: boolean,
        /** A column index or array of indices.  If undefined then all of the columns as per isActiveColumnIndexes */
        columnIndexOrIndices: number | number[] | undefined,
        /** Set to undefined to add new active columns at end of list.  Set to -1 to hide specified columns */
        insertIndex: number | undefined,
        /** If true, then if an existing column is already visible, it will not be removed and duplicates of that column will be present */
        allowDuplicateColumns: boolean,
        /** Whether this was instigated by a UI action */
        ui: boolean,
    ): void {
        const activeColumns = this._activeColumns;
        const sourceColumnList = indexesAreActive ? activeColumns : this._fieldColumns;

        let newColumns: RevColumn<BCS, SF>[];
        if (columnIndexOrIndices === undefined) {
            newColumns = sourceColumnList;
        } else {
            const columnIndexes = (typeof columnIndexOrIndices === 'number') ? [columnIndexOrIndices] : columnIndexOrIndices;
            newColumns = columnIndexes
                .map((index) => sourceColumnList[index]) // Look up columns using provided indexes
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                .filter(column => column !== undefined); // Remove any undefined columns

        }

        // Default insertion point is end (i.e., before (last+1)th element)
        if (insertIndex === undefined) {
            insertIndex = activeColumns.length;
        }

        let changed = false;

        // Remove already visible columns and adjust insertion point
        if (!allowDuplicateColumns) {
            for (const newColumn of newColumns) {
                const i = activeColumns.indexOf(newColumn);
                if (i >= 0) {
                    activeColumns.splice(i, 1);
                    if (insertIndex > i) {
                        --insertIndex;
                    }
                    changed = true;
                }
            }
        }

        // Insert the new columns at the insertion point
        if (insertIndex >= 0) {
            activeColumns.splice(insertIndex, 0, ...newColumns);
            changed = true;
        }

        if (changed) {
            this.notifyActiveColumnListChanged(RevListChangedTypeId.Set, 0, activeColumns.length, undefined, ui);
        }
    }

    hideColumns(indexesAreActive: boolean, columnIndexOrIndices: number | number[] | undefined, ui: boolean) {
        this.showHideColumns(indexesAreActive, columnIndexOrIndices, -1, false, ui);
    }

    hideActiveColumn(activeColumnIndex: number, ui: boolean) {
        this._activeColumns.splice(activeColumnIndex, 1);
        this.notifyActiveColumnListChanged(RevListChangedTypeId.Remove, activeColumnIndex, 1, undefined, ui)
    }

    setActiveColumns(columnArray: readonly RevColumn<BCS, SF>[]) {
        const oldActiveCount = this._activeColumns.length;
        this._activeColumns.splice(0, oldActiveCount, ...columnArray);
        this.notifyActiveColumnListChanged(RevListChangedTypeId.Set, 0, columnArray.length, undefined, false);
    }

    /**
     * @param fieldIndex - Data x coordinate.
     * @returns The properties for a specific column.
     * @internal
     */
    mergeFieldColumnSettings(fieldIndex: number, settings: Partial<BCS>, overrideGrid: boolean) {
        const column = this.getFieldColumn(fieldIndex);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (column === undefined) {
            throw new RevAssertError('CMMFCS50399', fieldIndex.toString());
        }

        // column.clearProperties(); // needs implementation
        return column.settings.merge(settings, overrideGrid);
    }

    /**
     * @returns The number of fixed columns.
     */
    getFixedColumnCount(): number {
        return this.gridSettings.fixedColumnCount;
    }

    isColumnFixed(activeColumnIndex: number) {
        return activeColumnIndex < this.gridSettings.fixedColumnCount;
    }

    /**
     * swap source and target columns
     * @param source - column index
     * @param target - column index
     */
    swapActiveColumns(source: number, target: number) {
        const columns = this._activeColumns;
        const sourceColumn = columns[source];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (sourceColumn === undefined) {
            return;
        }
        const targetColumn = columns[target];
        columns[source] = targetColumn;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (sourceColumn === undefined) {
            return;
        }
        columns[target] = sourceColumn;
        this.invalidateHorizontalViewLayoutEventer(true); // true in case swapped with fixed column
    }

    moveActiveColumn(fromIndex: number, toIndex: number, ui: boolean) {
        if (toIndex !== fromIndex) {
            moveElementInArray(this._activeColumns, fromIndex, toIndex)
            this.notifyActiveColumnListChanged(RevListChangedTypeId.Move, fromIndex, 1, toIndex, ui);
        }
    }

    autoSizeActiveColumnWidths(widenOnly: boolean) {
        for (const column of this._activeColumns) {
            column.autoSizeWidth(widenOnly);
        }
    }

    setActiveColumnsAutoWidthSizing(value: boolean) {
        for (const column of this._activeColumns) {
            column.setAutoWidthSizing(value);
        }
    }

    /** @internal */
    checkAutoWidenAllColumnsWithoutInvalidation() {
        let autoWidened = false;

        for (const column of this._activeColumns) {
            if ((column as RevColumnImplementation<BCS, SF>).checkAutoWidthSizingWithoutInvalidation(true)) {
                autoWidened = true;
            }
        }
        return autoWidened;
    }

    /** @internal */
    getHiddenColumns() {
        // this does not look right
        const visible = this._activeColumns;
        const all = this._fieldColumns;
        const hidden = new Array<RevColumn<BCS, SF>>();
        for (let i = 0; i < all.length; i++) {
            if (!visible.includes(all[i])) {
                hidden.push(all[i]);
            }
        }
        hidden.sort((a, b) => {
            return a.field.name < b.field.name ? 1 : 0;
        });
        return hidden;
    }

    private notifyActiveColumnListChanged(typeId: RevListChangedTypeId, index: number, count: number, targetIndex: number | undefined, ui: boolean) {
        this.activeColumnListChangedEventer(typeId, index, count, targetIndex, ui);
        this.invalidateHorizontalViewLayoutEventer(true);
    }

    private notifyColumnsWidthChanged(columns: RevColumn<BCS, SF>[], ui: boolean) {
        this.columnsWidthChangedEventer(columns, ui);
        this.invalidateHorizontalViewLayoutEventer(true);
    }

    /** @internal */
    private newColumn(field: SF): RevColumn<BCS, SF> {
        const columnSettings = this.getSettingsForNewColumnEventer(field);
        return new RevColumnImplementation(
            field,
            columnSettings,
            (column, ui) => { this.notifyColumnsWidthChanged([column], ui); },
            () => { this.invalidateHorizontalViewLayoutEventer(true); },
        );
    }

    /** @internal */
    private createColumns() {
        this._beforeCreateColumnsListeners.forEach((listener) => { listener(); });

        const fields = this.schemaServer.getFields();

        this.clearColumns();

        const count = fields.length;
        this._activeColumns.length = count;
        this._fieldColumns.length = count;

        for (let i = 0; i < count; i++) {
            const field = fields[i];
            const column = this.newColumn(field);
            this._activeColumns[i] = column;
            const fieldIndex = field.index;
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (this._fieldColumns[fieldIndex] !== undefined) {
                throw new RevApiError('CMCC10197', `RevColumnsManager.createColumns: Duplicate column index ${fieldIndex}`);
            } else {
                this._fieldColumns[fieldIndex] = column;
            }
        }

        this.notifyActiveColumnListChanged(RevListChangedTypeId.Set, 0, count, undefined, false);
        this.fieldColumnListChangedEventer(RevListChangedTypeId.Set, 0, count, undefined);
    }
}

/** @public */
export namespace RevColumnsManager {
    export type GetSettingsForNewColumnEventer<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = (this: void, field: SF) => BCS;
    /** @internal */
    export type InvalidateHorizontalViewLayoutEventer = (this: void, scrollDimensionAsWell: boolean) => void;
    /** @internal */
    export type ColumnsWidthChangedEventer<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = (this: void, columns: RevColumn<BCS, SF>[], ui: boolean) => void;
    /** @internal */
    export type BeforeCreateColumnsListener = (this: void) => void;

    export interface FieldNameAndAutoSizableWidth {
        name: string;
        autoSizableWidth: number | undefined;
    }
}
