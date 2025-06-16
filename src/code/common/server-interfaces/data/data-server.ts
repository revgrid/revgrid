import { RevRectangle } from '../../types-utils/internal-api';
import { RevSchemaField } from '../schema/internal-api';

/** Interface used by client to get data from a server */
export interface RevDataServer<
    /** Type used to specify a field the rows of data */
    SF extends RevSchemaField
> {
    /**
     * Subscribe to data notifications from the server.
     * @param client - An interface with callbacks used to notify the grid of changes to data.
     */
    subscribeDataNotifications(client: RevDataServer.NotificationsClient): void;

    /**
     * Unsubscribe from data notifications.
     * @remarks
     * Unsubscribe is optional as it is not required when the client and server are closely bound together and destroyed at the same time.
     * @param client - A reference to the handler originally provided to {@link RevDataServer#subscribeDataNotifications}.
     */
    unsubscribeDataNotifications?(client: RevDataServer.NotificationsClient): void;

    /**
     * @hidden
     * Used to Prefetch data
     * @remarks
     * Tells dataModel what cells will be needed by subsequent calls to {@link RevDataServer#getViewValue}. This helps remote or virtualized data models fetch and cache data. If your data model doesn't need to know this, don't implement it.
     * @param rectangles - Unordered list of rectangular regions of cells to fetch in a single (atomic) operation.
     * @param callback - Optional callback. If provided, implementation calls it with `false` on success (requested data fully fetched) or `true` on failure.
     */
    fetchViewData?(rectangles: readonly RevRectangle[], callback?: (failure: boolean) => void): void;

    /**
     * _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * All grid data.
     * @param metadataFieldName - If provided, the output will include the row metadata object in a "hidden" field with this name.
     * @returns All the grid's data rows.
     */
    getViewData?(metadataFieldName?: string): readonly RevDataServer.ViewRow[];

    /**
     * _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Get a row of data.
     *
     * The injected default implementation is an object of lazy getters.
     * @returns {number} The data row corresponding to the given `rowIndex`. If row does not exist, then throw error.
     */
    getViewRow?(rowIndex: number): RevDataServer.ViewRow;

    /**
     * The current count of rows data in the server.
     * @returns Number of data rows.
     */
    getRowCount(): number;

    /**
     * _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Only called by Hypergrid when it receives the `data-prereindex` or `data-postreindex` events.
     * These events are typically triggered before and after data model remaps the rows (in its `apply` method).
     * #### Parameters:
     * @param rowIndex - Grid row index.
     * @returns Unique Id of row specified by rowIndex.
     */
    getRowIdFromIndex?(rowIndex: number): unknown;
    getRowIndexFromId?(rowId: unknown): number | undefined;

    /**
     * Get a field's value at the specified row in a format suitable for display.
     * @remarks
     * The core of the client does not need to know the type of the return value.  {@link getViewValue}() is called by the `Cell Painter` associated with the cell/subgrid.
     * The cell painter expects a certain type of view value and casts the result accordingly.
     * @returns The value of the field at the specified row.
     */
    getViewValue(
        /** The field from which to get the value */
        field: SF,
        /** The index of the row from which to get the value */
        rowIndex: number
    ): RevDataServer.ViewValue;

    /**
     * Get a field's value at the specified row in a format suitable for editing.
     * @remarks
     * This function only needs to be implemented if cells can be edited.  See RevCellEditor for more information about editing data.
     * The core of the client does not need to know the type of the return value.  {@link getEditValue}() is called by the `Cell Editor` associated with the cell.
     * A cell editor expects a certain type of view value and casts the result accordingly.
     * @returns The value of the field at the specified row.
     */
    getEditValue?(
        /** The field from which to get the value */
        field: SF,
        /** The index of the row from which to get the value */
        rowIndex: number
    ): RevDataServer.EditValue;
    /**
     * _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Set a cell's value given its column schema & row indexes and a new value.
     */
    setEditValue?(field: SF, rowIndex: number, value: RevDataServer.EditValue): void;

    /**
     * _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * @param data - An array of congruent raw data objects.
     * @param schema - Ordered array of column schema.
     */
    // setData?(data: RevDataServer.DataRowObject[], columnSchema: RevDataServer.RawColumnSchema[]): void;

    /**
     * _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Update a row in place, without deleting the row (and without affecting succeeding rows' indexes).
     * @param dataRow - Updated row value
     */
    setViewRow?(rowIndex: number, dataRow: RevDataServer.ViewRow): void;

    /** Cursor to be displayed when mouse hovers over cell containing data point */
    getCursorName?(field: SF, rowIndex: number): string;

    /** Title text to be displayed when mouse hovers over cell containing data point */
    getTitleText?(field: SF, rowIndex: number): string;
}

export namespace RevDataServer {

    export type ViewValue = unknown; // Value displayed in grid
    export type EditValue = unknown; // Value passed to or received from editor

    /**
     * A data row representation using an object.
     * The properties of this object are the data fields.
     * The property keys are the column names
     * All row objects should be congruent, meaning that each data row should have the same property keys.
     */
    export type ObjectViewRow = Record<string, ViewValue>;
    export type ArrayViewRow = ViewValue[];
    export type ViewRow = ArrayViewRow | ObjectViewRow;

    export type Constructor<SF extends RevSchemaField> = new () => RevDataServer<SF>;

    /**
     * Interface specifying callbacks from server which are used to advise client that server data has changed
     */
    export interface NotificationsClient {
        beginChange: (this: void) => void;
        endChange: (this: void) => void;
        rowsInserted: (this: void, rowIndex: number, rowCount: number) => void;
        rowsDeleted: (this: void, rowIndex: number, rowCount: number) => void;
        allRowsDeleted: (this: void) => void;
        rowsMoved: (this: void, oldRowIndex: number, newRowIndex: number, rowCount: number) => void;
        rowsLoaded: (this: void) => void;
        invalidateAll: (this: void) => void;
        invalidateRows: (this: void, rowIndex: number, count: number) => void;
        invalidateRow: (this: void, rowIndex: number) => void;
        invalidateRowColumns: (this: void, rowIndex: number, fieldIndex: number, columnCount: number) => void;
        invalidateRowCells: (this: void, rowIndex: number, fieldIndexes: number[]) => void;
        invalidateCell: (this: void, fieldIndex: number, rowIndex: number) => void;

        /**
         * Notifies that ordering of data rows in server is about to change.
         * @remarks
         * When client receives this notification, it saves focus and selection to a temporary location.
         * Typically this notification is called before rows are sorted or filtered on the server.
         * This callback will always be followed by the {@link postReindex} callback.
         */
        preReindex: (this: void) => void;
        /**
         * Notifies that ordering of data rows in server is has changed.
         * @remarks
         * This callback always be follows by the {@link preReindex} callback.
         * When client receives this notification, it restores the focus and selection from the stash of these saved to a temporary location.
         * Typically this notification is called after rows are sorted or filtered on the server.
         */
        postReindex: (
            this: void,
            /** True if all rows are kept (eg. rows were not discarded due to server filtering) */
            allRowsKept: boolean
        ) => void;
    }
}
