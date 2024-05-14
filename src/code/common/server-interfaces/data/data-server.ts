import { RevRectangle } from '../../types-utils/internal-api';
import { RevSchemaField } from '../schema/internal-api';
// import { Hypergrid } from '../Hypergrid';

/**
 * Hypergrid 3 data models have a minimal required interface, as outlined on the [Data Model API](https://github.com/fin-hypergrid/core/wiki/Data-Model-API) wiki page.
 *
 * #### TL;DR
 * The minimum interface is an object with just three methods: {@link RevDataServer#getRowCount getRowCount()} {@link RevDataServer#getSchema getSchema()} and {@link RevDataServer#getViewValue getValue(x, y)}.
 */

 /** @public */
export interface RevDataServer<SF extends RevSchemaField> {
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
     * Removed dispatchEvent! Does not make sense for DataModel to receive these events - just emit them. Maybe this was for some type of chaining.  Needs to be revisited in this case
     * @remarks _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link RevDataServer#addListener addListener}, {@link RevDataServer#removeListener removeListener}, and {@link RevDataServer#removeAllListeners removeAllListeners}, because they all work together and you don't want to mix native implementations with polyfills.
     *
     * If `addListener` is not implemented, Hypergrid falls back to a simpler approach, injecting its own implementation of `dispatchEvent`, bound to the grid instance, into the data model. If the data model already has such an implementation, the assumption is that it was injected by another grid instance using the same data model. The newly injected implementation will call the original injected implementation, thus creating a chain. This is an inferior approach because grids cannot easily unsubscribe themselves. Applications can remove all subscribers in the chain by deleting the implementation of `dispatchEvent` (the end of the chain) from the data model.
     */
    // dispatchEvent?(nameOrEvent: RevDataServer.EventName | RevDataServer.Event): void;
    /**
     * Characters that can be used to construct cell values representing drill downs in a tree structure.
     *
     * A specialized cell renderer is often employed to produce better results using graphics instead of characters.
     */
    // drillDownCharMap?: RevDataServer.DrillDownCharMap;

    /**
     * Prefetch data
     * @remarks _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Tells dataModel what cells will be needed by subsequent calls to {@link RevDataServer#getViewValue getValue()}. This helps remote or virtualized data models fetch and cache data. If your data model doesn't need to know this, don't implement it.
     * #### Parameters:
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
     * @returns The number of data rows currently contained in the model.
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
     * Get a cell's value given its column & row indexes.
     * @returns The member with the given schema field from the data row with the given `rowIndex`.
     */
    getViewValue(field: SF, rowIndex: number): RevDataServer.ViewValue;

    getEditValue?(field: SF, rowIndex: number): RevDataServer.EditValue;
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
     * Update or blank a row in place, without deleting the row (and without affecting succeeding rows' indexes).
     * @param dataRow - if omitted or otherwise falsy, row renders as blank
     */
    setViewRow?(rowIndex: number, dataRow?: RevDataServer.ViewRow): void;

    /** Cursor to be displayed when mouse hovers over cell containing data point */
    getCursorName?(field: SF, rowIndex: number): string;

    /** Title text to be displayed when mouse hovers over cell containing data point */
    getTitleText?(field: SF, rowIndex: number): string;
}


/** @public */
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
