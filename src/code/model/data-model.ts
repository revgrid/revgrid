import { Rectangle } from '../lib/rectangular';
import { SchemaModel } from './schema-model';
// import { Hypergrid } from '../Hypergrid';

/**
 * @desc Hypergrid 3 data models have a minimal required interface, as outlined on the [Data Model API](https://github.com/fin-hypergrid/core/wiki/Data-Model-API) wiki page.

 #### TL;DR
 The minimum interface is an object with just three methods: {@link DataModel#getRowCount getRowCount()} {@link DataModel#getSchema getSchema()} and {@link DataModel#getValue getValue(x, y)}.
 */

 /** @public */
export interface DataModel {
    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link DataModel#dispatchEvent dispatchEvent}, {@link DataModel#removeListener removeListener}, and {@link DataModel#removeAllListeners removeAllListeners}, because they all work together and you don't want to mix native implementations with polyfills.
     *
     * Hypergrid calls this method subscribe to data model events. The data model calls its own implementation of `dispatchEvent` to publish events to subscribers.
     *
     * Both the `addListener` polyfill as well as `datasaur-base`'s implementation service multiple listeners for the use case of multiple grid instances all using the same data model instance. To support this use case, your data model should service multiple listeners as well. (Doing so also lets the application add its own listener(s) to the data model.)
     *
     * @param listener - A reference to a function bound to a grid instance. The function is called whenever the data model calls its {@link DataModel#dispatchEvent} method. The handler thus receives all data model events (in `event.type).
     */
    // addListener?(listener: DataModel.EventListener): void;
    addDataCallbackListener?(listener: DataModel.CallbackListener): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Transforms the data. All the rows are subject to change, including the row count.
     */
    apply?(): void;

    /**
     * Removed dispatchEvent! Does not make sense for DataModel to receive these events - just emit them. Maybe this was for some type of chaining.  Needs to be revisited in this case
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link DataModel#addListener addListener}, {@link DataModel#removeListener removeListener}, and {@link DataModel#removeAllListeners removeAllListeners}, because they all work together and you don't want to mix native implementations with polyfills.
     *
     * If `addListener` is not implemented, Hypergrid falls back to a simpler approach, injecting its own implementation of `dispatchEvent`, bound to the grid instance, into the data model. If the data model already has such an implementation, the assumption is that it was injected by another grid instance using the same data model. The newly injected implementation will call the original injected implementation, thus creating a chain. This is an inferior approach because grids cannot easily unsubscribe themselves. Applications can remove all subscribers in the chain by deleting the implementation of `dispatchEvent` (the end of the chain) from the data model.
     */
    // dispatchEvent?(nameOrEvent: DataModel.EventName | DataModel.Event): void;
    /**
     * @desc Characters that can be used to construct cell values representing drill downs in a tree structure.
     *
     * A specialized cell renderer is often employed to produce better results using graphics instead of characters.
     */
    // drillDownCharMap?: DataModel.DrillDownCharMap;

    /**
     * @Summary Prefetch data
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Tells dataModel what cells will be needed by subsequent calls to {@link DataModel#getValue getValue()}. This helps remote or virtualized data models fetch and cache data. If your data model doesn't need to know this, don't implement it.
     * #### Parameters:
     * @param rectangles - Unordered list of rectangular regions of cells to fetch in a single (atomic) operation.
     * @param callback - Optional callback. If provided, implementation calls it with `false` on success (requested data fully fetched) or `true` on failure.
     */
    fetchData?(rectangles: Rectangle[], callback?: (failure: boolean) => void): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * All grid data.
     * @param metadataFieldName - If provided, the output will include the row metadata object in a "hidden" field with this name.
     * @returns All the grid's data rows.
     */
    getData?(metadataFieldName?: string): DataModel.DataRowObject[];

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Synonym for getRowIndex.
     * @param rowIndex - Transformed data row index.
     * @returns Untransformed data row index.
     */
    getDataIndex?(rowIndex: number): number;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Get the metadata store. The precise type of this object is implementation-dependent so not defined here.
     *
     * `datasaur-base` supplies fallback implementations of this method as well as {@link DataModel#setMetadataStore} which merely get and set `this.metadata` in support of {@link DataModel#getRowMetadata} and {@link DataModel#setRowMetadata}.
     *
     * Custom data models are not required to implement them if they don't need them.
     *
     * Hypergrid never calls `getMetadataStore` itself. If implemented, Hypergrid does make a single call to `setMetadataStore` when data model is reset (see {@link Local#resetDataModel}) with no arguments.
     *
     * @returns Metadata store object.
     */
    getMetadataStore?(): DataModel.RowMetadata[];

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Get a row of data.
     *
     * The injected default implementation is an object of lazy getters.
     * @returns {number|undefined} The data row corresponding to the given `rowIndex`; or `undefined` if no such row.
     */
    getRow?(rowIndex: number): DataModel.DataRowObject | undefined;

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
     * @param rowIndex - Transformed data row index.
     * @returns Untransformed data row index.
     */
    getUnderlyingRowIndex?(rowIndex: number): number;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Get the row's metadata object, which is a hash of cell properties objects, for those cells that have property overrides, keyed by column name; plus a row properties object with key `__ROW` when there are row properties.
     *
     * The default implementations of `getRowMetadata` and `setRowMetadata` store the metadata in an in-memory table. If this is not appropriate, override these methods to store the meta somewhere else (_e.g.,_ with the data in a hidden column, in another database table, in local storage, _etc._).
     *
     * @param rowIndex - Row index.
     * @param prototype - When row found but no metadata found, set the row's metadata to new object created from this object when defined.
     * Typical defined value is `null`, which creates a plain object with no prototype, or `Object.prototype` for a more "natural" object.
     * @returns One of:
     * * object - existing metadata object or new metadata object created from `prototype`; else
     * * `false` - row found but no existing metadata and `prototype` was not defined; else
     * * `undefined`  - no such row
     */
    getRowMetadata?(rowIndex: number, prototype?: DataModel.RowMetadataPrototype): undefined | false | DataModel.RowMetadata;

    /**
     * @desc Get list of columns. The order of the columns in the list defines the column indexes.
     *
     * On initial call and again whenever the schema changes, the data model must dispatch the `hypegrid-schema-loaded` event, which tells Hypergrid to {@link module:schema.decorate decorate} the schema and recreate the column objects.
     */
    // getSchema(): readonly DataModel.ColumnSchema[];

    /**
     * @desc Get a cell's value given its column & row indexes.
     * @returns The member with the given schema field from the data row with the given `rowIndex`.
     */
    getValue(schema: SchemaModel.Column, rowIndex: number): unknown;

    // gotData?(rectangles: Rectangle[]): boolean;

    install?(api: unknown, options: unknown): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL. It is only required for data models that support tree views._
     * @returns The grid view is a tree (presumably has a tree column).
     */
    // isTree?(): boolean;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL. It is only required for data models that support tree views._
     * @param columnIndex
     * @returns This column is the tree column (displays tree structure; may or may not be an interactive drill-down control).
     */
    // isTreeCol?(columnIndex: number): boolean;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link DataModel#addListener addListener}, {@link DataModel#dispatchEvent dispatchEvent}, and {@link DataModel#removeListener removeListener}, because they all work together and you don't want to mix native implementations with polyfills.
     *
     * Removes all data model event handlers, detaching the data model from all grid instances.
     *
     * This method is not called by Hypergrid but might be useful to applications for resetting a data model instance.
     */
    // removeAllListeners?(): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link DataModel#addListener addListener}, {@link DataModel#dispatchEvent dispatchEvent}, and {@link DataModel#removeAllListeners removeAllListeners}, because they all work together and you don't want to mix native implementations with polyfills.
     *
     * Detaches the data model from a particular grid instance.
     *
     * This method is called by {@link Hypergrid#desctruct} to clean up memory.
     * Note: `destruct` is not called automatically by Hypergrid; applications must call it explicitly when disposing of a grid.
     *
     * @param listener - A reference to the handler originally provided to {@link DataModel#addListener}.
     */
    // removeListener?(listener: DataModel.EventListener): void;
    removeDataCallbackListener?(listener: DataModel.CallbackListener): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * @param data - An array of congruent raw data objects.
     * @param schema - Ordered array of column schema.
     */
    // setData?(data: DataModel.DataRowObject[], columnSchema: DataModel.RawColumnSchema[]): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Set the metadata store. The precise type of this object is implementation-dependent, so not defined here.
     *
     * `datasaur-base` supplies fallback implementations of this method as well as {@link DataModel#getMetadataStore} which merely set and get `this.metadata` in support of {@link DataModel#setRowMetadata} and {@link DataModel#getRowMetadata}.
     *
     * Custom data models are not required to implement them if they don't need them.
     *
     * If implemented, Hypergrid makes a single call to `setMetadataStore` when data model is reset (see {@link Local#resetDataModel}) with no arguments. Therefore this method needs to expect a no-arg overload and handle it appropriately.
     *
     * Hypergrid never calls `getMetadataStore`.
     * @param [newMetadataStore] - New metadata store object. Omitted on data model reset.
     */
    setMetadataStore?(metadataStore?: DataModel.RowMetadata[]): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Update or blank a row in place, without deleting the row (and without affecting succeeding rows' indexes).
     * @param dataRow - if omitted or otherwise falsy, row renders as blank
     */
    setRow?(rowIndex: number, dataRow?: DataModel.DataRowObject): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Set the row's metadata object, which is a hash of cell properties objects, for those cells that have property overrides, keyed by column name; plus a row properties object with key `__ROW` when there are row properties.
     *
     * The default implementations of `getRowMetadata` and `setRowMetadata` store the metadata in an in-memory table. If this is not appropriate, override these methods to store the meta somewhere else (_e.g.,_ with the data in a hidden column, in another database table, in local storage, _etc._).
     *
     * @param rowIndex - Row index.
     * @param newMetadata - When omitted, delete the row's metadata.
     */
    setRowMetadata?(rowIndex: number, newMetadata?: DataModel.RowMetadata): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Define column indexes. May include `header`, `type`, and `calculator` properties for each column.
     *
     * When the schema changes, the data model should dispatch the `hypegrid-schema-loaded` event, which tells Hypergrid to {@link module:schema.decorate decorate} the schema and recreate the column objects.
     *
     * It is not necessary to call on every data update when you expect to reuse the existing schema.
     * @param newSchema - String elements are immediately converted (by {@link module:schema.decorate decorate}) to columnSchema objects.
     */
    // setSchema?(schema?: (DataModel.RawColumnSchema | DataModel.ColumnSchema)[]): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Set a cell's value given its column schema & row indexes and a new value.
     */
    setValue?(schema: SchemaModel.Column, rowIndex: number, newValue: unknown): void;

    /**
     * @summary Mouse was clicked on a grid row.
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Hypergrid calls this method from one place, {@link Local#cellClicked behavior.cellClicked}, which is called from src/features/CellClick when user clicks on a tree or data cell.
     *
     * The data model may consume or ignore the click.
     *
     * If the data model consumes the click by modifying some data in the existing data set, it should dispatch the 'hypegrid-data-loaded` data event to the grid, which causes a grid "repaint" (which re-renders rows and columns in place).
     *
     * If the data model consumes the click by transforming the data, it should dispatch the following data events to the grid:
     *    * 'hypegrid-data-prereindex' before transforming the data
     *    * 'hypegrid-data-postreindex' after transforming the data
     *
     * This causes Hypergrid to save the current row and/or column selections before and then attempt to restore them after, before a "shape change" (which recalculates row and column bounding rects and then re-renders them).
     *
     * "Transforming the data" means altering the data set (by adding/removing rows, _etc._). The typical use case for this is a click on a cell containing a drill-down control.
     *
     * After rerendering, Hypergrid dispatches a DOM event with the same _type_ (same event string) to the grid's `<canvas>` element for the benefit of any application listeners.
     *
     * #### Parameters:
     *
     * @param rowIndex
     *
     * @param columnIndex - For the drill-down control use case, implementations should call `this.isTreeCol(columnIndex)` if they want to restrict the response to clicks in the tree column (rather than any column). Although defined in Hypergrid's call, implementations should not depend on it, which may be useful for testing purposes.
     *
     * @param toggle - One of:
     * * `undefined` (or omitted) - Toggle row.
     * * `true` - Expand row iff currently collapsed.
     * * `false` - Collapse row iff currently expanded.
     * > NOTE: Implementation of this parameter is optional. It may be useful for testing purposes but Hypergrid does not define actual parameter in its call in {@link Hypergrid#cellClicked}.
     *
     * @returns If click was consumed by the data model:
     * * `undefined` Not consumed: Row had no drill-down control.
     * * `true` Consumed: Row had a drill-down control which was toggled.
     * * `false` Not consumed: Row had a drill-down control but it was already in requested state.
     * > NOTE: Implementation of a return value is optional as of version v3.0.0. It may be useful for testing purposes but {@link Hypergrid#cellClicked} no longer uses the return value (depending instead on the implementation dispatching data events), so implementations no longer need to support it. Therefore, in general, applications should no depend on a return value. For particular requirements, however, an applications may make a private contract with a data model implementation for a return value (that may or may not follow the above definition. Regardless of the implementation, the return value of this method is propagated through the return values of {@link Local#cellClicked} -> {@link Hypergrid#cellClicked} -> the application.
     */
    toggleRow?(rowIndex: number, columnIndex?: number, toggle?: boolean): boolean | undefined;
}


/** @public */
export namespace DataModel {

    export type DataValue = unknown;

    export type Constructor = new (dataModel?: DataModel) => DataModel;

    /**
     * @desc A data row representation.
     * The properties of this object are the data fields.
     * The property keys are the column names
     * All row objects should be congruent, meaning that each data row should have the same property keys.
     */
    export interface DataRowObject {
        [columnName: string]: DataValue;
    }

    export interface RowProperties {
        height?: number; // will use default height if undefined
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    export type RowPropertiesPrototype = object;

    export type CellOwnProperty = unknown;
    export type CellOwnProperties = Record<string, CellOwnProperty>;

    export interface CellOwnPropertiesRowMetadata {
        [columnName: string]: CellOwnProperties;
    }

    export interface RowPropertiesRowMetadata {
        __ROW?: RowProperties;
    }

    export type RowMetadata = CellOwnPropertiesRowMetadata | RowPropertiesRowMetadata;

    export type RowMetadataPrototype = null;


    /**
     * Besides `type`, your event object can contain other event details.
     *
     * After calling the internal handler found in [src/behaviors/Local/events.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/events.js) matching the event name, Hypergrid then creates a {@link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent `CustomEvent`} with the same name, sets its `detail` property to this object, and dispatches to the `<canvas>` element — to be picked up by any listeners previously attached with {@link Hypergrid#addEventListener}.
     * @param event.type - Event string (name).
     */

    export interface DrillDownCharMap {
        true: string;
        false: string;
        undefined: string;
        null: string;
        OPEN: string;
        CLOSE: string;
        INDENT: string;
    }

    export type EventDetail = Record<string, unknown> | undefined;

    export interface EventMap {
        'hypegrid-data-loaded': EventDetail;
        'hypegrid-data-shape-changed': EventDetail;
        'hypegrid-data-prereindex': EventDetail;
        'hypegrid-data-postreindex': EventDetail;
    }

    export type EventName = keyof EventMap;

    export interface CallbackListener {
        /**
         * @desc The data model should trigger this event when it changes the data on its own.
         * Hypergrid responds by calling {@link Hypergrid#repaint grid.repaint()} — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
         * ```js
         * grid.addEventListener('hypegrid-data-loaded', myHandlerFunction);
         * ```
         * This event is not cancelable.
         */
        dataLoaded: (this: void) => void;
        /**
         * @desc The data model should trigger this event when it changes the data rows (count, order, _etc._) on its own.
         * Hypergrid responds by calling {@link Hypergrid#behaviorChanged grid.behaviorChanged()} — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
         * ```js
         * grid.addEventListener('hypegrid-data-shape-changed', myHandlerFunction);
         * ``
         * This event is not cancelable.
         */
        dataShapeChanged: (this: void) => void;
        /**
         * @desc The data models should trigger this event immediately before data model remaps the rows.
         * Hypergrid responds by saving the underlying row indices of currently selected rows — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
         * ```js
         * grid.addEventListener('hypegrid-data-prereindex', myHandlerFunction);
         * ```
         * This event is not cancelable.
         */
        dataPrereindex: (this: void) => void;
        /**
         * @desc The data models should trigger this event immediately after data model remaps the rows.
         * Hypergrid responds by reselecting the remaining rows matching the indices previously saved in the `data-prereindex` event, and then calling {@link Hypergrid#behaviorShapeChanged grid.behaviorShapeChanged()} — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
         * ```js
         * grid.addEventListener('hypegrid-data-postreindex', myHandlerFunction);
         * ```
         * This event is not cancelable.
         */
        dataPostreindex: (this: void) => void;
        invalidateAll: (this: void) => void;
    }
}
