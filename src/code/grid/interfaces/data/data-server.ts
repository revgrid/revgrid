import { Rectangle } from '../../types-utils/rectangle';
import { SchemaServer } from '../schema/schema-server';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
// import { Hypergrid } from '../Hypergrid';

/**
 * @desc Hypergrid 3 data models have a minimal required interface, as outlined on the [Data Model API](https://github.com/fin-hypergrid/core/wiki/Data-Model-API) wiki page.
 *
 * #### TL;DR
 * The minimum interface is an object with just three methods: {@link DataServer#getRowCount getRowCount()} {@link DataServer#getSchema getSchema()} and {@link DataServer#getValue getValue(x, y)}.
 */

 /** @public */
export interface DataServer<BCS extends BehavioredColumnSettings> {
    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link DataServer#dispatchEvent dispatchEvent}, {@link DataServer#removeListener removeListener}, and {@link DataServer#removeAllListeners removeAllListeners}, because they all work together and you don't want to mix native implementations with polyfills.
     *
     * Hypergrid calls this method subscribe to data model events. The data model calls its own implementation of `dispatchEvent` to publish events to subscribers.
     *
     * Both the `addListener` polyfill as well as `datasaur-base`'s implementation service multiple listeners for the use case of multiple grid instances all using the same data model instance. To support this use case, your data model should service multiple listeners as well. (Doing so also lets the application add its own listener(s) to the data model.)
     *
     * Function is called addDataCallbackListener instead of addCallBackListener so that one class can implement both DataModel and SchemaServer.
     *
     * @param client - A reference to a function bound to a grid instance. The function is called whenever the data model calls its {@link DataServer#dispatchEvent} method. The handler thus receives all data model events (in `event.type).
     */
    subscribeDataNotifications(client: DataServer.NotificationsClient): void;

    /**
     * Removed dispatchEvent! Does not make sense for DataModel to receive these events - just emit them. Maybe this was for some type of chaining.  Needs to be revisited in this case
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link DataServer#addListener addListener}, {@link DataServer#removeListener removeListener}, and {@link DataServer#removeAllListeners removeAllListeners}, because they all work together and you don't want to mix native implementations with polyfills.
     *
     * If `addListener` is not implemented, Hypergrid falls back to a simpler approach, injecting its own implementation of `dispatchEvent`, bound to the grid instance, into the data model. If the data model already has such an implementation, the assumption is that it was injected by another grid instance using the same data model. The newly injected implementation will call the original injected implementation, thus creating a chain. This is an inferior approach because grids cannot easily unsubscribe themselves. Applications can remove all subscribers in the chain by deleting the implementation of `dispatchEvent` (the end of the chain) from the data model.
     */
    // dispatchEvent?(nameOrEvent: DataServer.EventName | DataServer.Event): void;
    /**
     * @desc Characters that can be used to construct cell values representing drill downs in a tree structure.
     *
     * A specialized cell renderer is often employed to produce better results using graphics instead of characters.
     */
    // drillDownCharMap?: DataServer.DrillDownCharMap;

    /**
     * @Summary Prefetch data
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Tells dataModel what cells will be needed by subsequent calls to {@link DataServer#getValue getValue()}. This helps remote or virtualized data models fetch and cache data. If your data model doesn't need to know this, don't implement it.
     * #### Parameters:
     * @param rectangles - Unordered list of rectangular regions of cells to fetch in a single (atomic) operation.
     * @param callback - Optional callback. If provided, implementation calls it with `false` on success (requested data fully fetched) or `true` on failure.
     */
    fetchData?(rectangles: readonly Rectangle[], callback?: (failure: boolean) => void): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * All grid data.
     * @param metadataFieldName - If provided, the output will include the row metadata object in a "hidden" field with this name.
     * @returns All the grid's data rows.
     */
    getData?(metadataFieldName?: string): readonly DataServer.DataRow[];

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Get a row of data.
     *
     * The injected default implementation is an object of lazy getters.
     * @returns {number} The data row corresponding to the given `rowIndex`. If row does not exist, then throw error.
     */
    getRow?(rowIndex: number): DataServer.DataRow;

    /**
     * @returns The number of data rows currently contained in the model.
     */
    getRowCount(): number;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
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
     * @desc Get a cell's value given its column & row indexes.
     * @returns The member with the given schema field from the data row with the given `rowIndex`.
     */
    getValue(schema: SchemaServer.Column<BCS>, rowIndex: number): DataServer.DataValue;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link DataServer#addListener addListener}, {@link DataServer#dispatchEvent dispatchEvent}, and {@link DataServer#removeAllListeners removeAllListeners}, because they all work together and you don't want to mix native implementations with polyfills.
     *
     * Detaches the data model from a particular grid instance.
     *
     * This method is called by {@link Hypergrid#desctruct} to clean up memory.
     * Note: `destruct` is not called automatically by Hypergrid; applications must call it explicitly when disposing of a grid.
     *
     * @param client - A reference to the handler originally provided to {@link DataServer#addListener}.
     */
    // removeListener?(listener: DataServer.EventListener): void;
    unsubscribeDataNotifications?(client: DataServer.NotificationsClient): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * @param data - An array of congruent raw data objects.
     * @param schema - Ordered array of column schema.
     */
    // setData?(data: DataServer.DataRowObject[], columnSchema: DataServer.RawColumnSchema[]): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Update or blank a row in place, without deleting the row (and without affecting succeeding rows' indexes).
     * @param dataRow - if omitted or otherwise falsy, row renders as blank
     */
    setRow?(rowIndex: number, dataRow?: DataServer.DataRow): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Set a cell's value given its column schema & row indexes and a new value.
     */
    setValue?(schema: SchemaServer.Column<BCS>, rowIndex: number, newValue: unknown): void;

    /** Cursor to be displayed when mouse hovers over cell containing data point */
    getCursorName?(schema: SchemaServer.Column<BCS>, rowIndex: number): string;

    /** Title text to be displayed when mouse hovers over cell containing data point */
    getTitleText?(schema: SchemaServer.Column<BCS>, rowIndex: number): string;
}


/** @public */
export namespace DataServer {

    export type DataValue = unknown;

    /**
     * @desc A data row representation using an object.
     * The properties of this object are the data fields.
     * The property keys are the column names
     * All row objects should be congruent, meaning that each data row should have the same property keys.
     */
    export interface ObjectDataRow {
        [columnName: string]: DataValue;
    }
    export type ArrayDataRow = DataValue[];
    export type DataRow = ArrayDataRow | ObjectDataRow;

    export type Constructor<BCS extends BehavioredColumnSettings> = new () => DataServer<BCS>;

    /**
     * Besides `type`, your event object can contain other event details.
     *
     * After calling the internal handler found in [src/behaviors/Local/events.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/events.js) matching the event name, Hypergrid then creates a {@link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent `CustomEvent`} with the same name, sets its `detail` property to this object, and dispatches to the `<canvas>` element — to be picked up by any listeners previously attached with {@link Hypergrid#addEventListener}.
     * @param event.type - Event string (name).
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
        invalidateRowColumns: (this: void, rowIndex: number, schemaColumnIndex: number, columnCount: number) => void;
        invalidateRowCells: (this: void, rowIndex: number, schemaColumnIndexes: number[]) => void;
        invalidateCell: (this: void, schemaColumnIndex: number, rowIndex: number) => void;

        /**
         * @desc The data models should trigger this event immediately before data model remaps the rows.
         * Hypergrid responds by saving the underlying row indices of currently selected rows — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
         * ```js
         * grid.addEventListener('rev-data-prereindex', myHandlerFunction);
         * ```
         * This event is not cancelable.
         */
        preReindex: (this: void) => void;
        /**
         * @desc The data models should trigger this event immediately after data model remaps the rows.
         * Hypergrid responds by reselecting the remaining rows matching the indices previously saved in the `data-prereindex` event, and then calling {@link Hypergrid#behaviorShapeChanged grid.behaviorShapeChanged()} — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
         * ```js
         * grid.addEventListener('rev-data-postreindex', myHandlerFunction);
         * ```
         * This event is not cancelable.
         */
        postReindex: (this: void) => void;
    }
}
