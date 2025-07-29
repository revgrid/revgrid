import { RevSchemaField } from '../schema';

/** Interface used by client to get data from a server or update values */
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
     *
     * Optional as it is not required when the client and server are closely bound together and destroyed at the same time.
     * @param client - A reference to the handler originally provided to {@link subscribeDataNotifications}.
     */
    unsubscribeDataNotifications?(client: RevDataServer.NotificationsClient): void;

    /**
     * Get all data from the server as a readonly array of {@link RevDataServer.ViewRow}.
     *
     * If not implemented, all data can still obtain by retrieving one row at a time using {@link getViewRow} or
     * one cell at a time using {@link getViewValue}.
     */
    getViewData?(): readonly RevDataServer.ViewRow[];

    /**
     * Get a row of data from the server.
     *
     * If this method is implemented, it allows the client to retrieve an entire row of data from the server instead of having to
     * retrieve the value each cell in the row individually.  Used by `RevSubgridImplementation.getSingletonViewDataRow`.
     * @param subgridRowIndex - Subgrid row index.
     */
    getViewRow?(subgridRowIndex: number): RevDataServer.ViewRow;

    /**
     * Gets current count of rows in the associated subgrid at the server.
     */
    getRowCount(): number;

    /**
     * Gets a unique identifier for a row which is not affected by sorting, filtering or reordering.
     *
     * This optional method needs to be implemented for selection and focus to be preserved across row sorting, filtering and reordering.
     * @param subgridRowIndex - Subgrid row index.
     */
    getRowIdFromIndex?(subgridRowIndex: number): unknown;
    /**
     * Gets the current subgrid row index of a row from a row identifier.
     *
     * This optional method does not need to be implemented for selection and focus to be preserved row across sorting, filtering and reordering
     * however, if implemented, it will make restoring focus and selection more efficient.
     * @param rowId - Id previously obtained from {@link getRowIdFromIndex}.
     */
    getRowIndexFromId?(rowId: unknown): number | undefined;

    /**
     * Get a field's value at the specified row in a format suitable for display.
     *
     * The core of the client does not need to know the type of the return value.  `getViewValue()` is called by the `Cell Painter` associated with the cell/subgrid.
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
     *
     * This function only needs to be implemented if cells can be edited.  See RevCellEditor for more information about editing data.
     * The core of the client does not need to know the type of the return value.  `getEditValue()` is called by the `Cell Editor` associated with the cell.
     * A cell editor expects a certain type of view value and casts the result accordingly.
     */
    getEditValue?(
        /** The field from which to get the value */
        field: SF,
        /** The index of the row from which to get the value */
        rowIndex: number
    ): RevDataServer.EditValue;
    /**
     * Set a cell's value given its column schema & row indexes and a new value.
     *
     * If not implemented, the cell cannot be edited.
     */
    setEditValue?(field: SF, rowIndex: number, value: RevDataServer.EditValue): void;

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
