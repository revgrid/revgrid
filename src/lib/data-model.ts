import { Rectangle } from '../dependencies/rectangular';
// import { Hypergrid } from '../Hypergrid';

/**
 * @desc Hypergrid 3 data models have a minimal required interface, as outlined on the [Data Model API](https://github.com/fin-hypergrid/core/wiki/Data-Model-API) wiki page.

 #### TL;DR
 The minimum interface is an object with just three methods: {@link DataModel#getRowCount getRowCount()} {@link DataModel#getSchema getSchema()} and {@link DataModel#getValue getValue(x, y)}.
 */

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
    addListener?(listener: DataModel.EventListener): void;

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
    drillDownCharMap?: DataModel.DrillDownCharMap;

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
     * @desc Same as `getSchema().length`.
     * @returns Number of columns in the schema.
     */
    getColumnCount?(): number;

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
    getRowIndex?(rowIndex: number): number;

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
     * On initial call and again whenever the schema changes, the data model must dispatch the `fin-hypergrid-schema-loaded` event, which tells Hypergrid to {@link module:schema.decorate decorate} the schema and recreate the column objects.
     */
    getSchema(): readonly DataModel.ColumnSchema[];

    /**
     * @desc Get a cell's value given its column & row indexes.
     * @returns The member with the given `columnIndex` from the data row with the given `rowIndex`.
     */
    getValue(columnIndex: number, rowIndex: number): unknown;

    // gotData?(rectangles: Rectangle[]): boolean;

    install?(api: unknown, options: unknown): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL. It is only required for data models that support tree views._
     * @returns The grid view is a tree (presumably has a tree column).
     */
    isTree?(): boolean;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL. It is only required for data models that support tree views._
     * @param columnIndex
     * @returns This column is the tree column (displays tree structure; may or may not be an interactive drill-down control).
     */
    isTreeCol?(columnIndex: number): boolean;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link DataModel#addListener addListener}, {@link DataModel#dispatchEvent dispatchEvent}, and {@link DataModel#removeListener removeListener}, because they all work together and you don't want to mix native implementations with polyfills.
     *
     * Removes all data model event handlers, detaching the data model from all grid instances.
     *
     * This method is not called by Hypergrid but might be useful to applications for resetting a data model instance.
     */
    removeAllListeners?(): void;

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
    removeListener?(listener: DataModel.EventListener): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * @param data - An array of congruent raw data objects.
     * @param schema - Ordered array of column schema.
     */
    setData?(data: DataModel.DataRowObject[], columnSchema: DataModel.RawColumnSchema[]): void;

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
     * When the schema changes, the data model should dispatch the `fin-hypergrid-schema-loaded` event, which tells Hypergrid to {@link module:schema.decorate decorate} the schema and recreate the column objects.
     *
     * It is not necessary to call on every data update when you expect to reuse the existing schema.
     * @param newSchema - String elements are immediately converted (by {@link module:schema.decorate decorate}) to columnSchema objects.
     */
    setSchema?(schema?: (DataModel.RawColumnSchema | DataModel.ColumnSchema)[]): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Set a cell's value given its column & row indexes and a new value.
     */
    setValue?(columnIndex: number, rowIndex: number, newValue: unknown): void;

    /**
     * @summary Mouse was clicked on a grid row.
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Hypergrid calls this method from one place, {@link Local#cellClicked behavior.cellClicked}, which is called from src/features/CellClick when user clicks on a tree or data cell.
     *
     * The data model may consume or ignore the click.
     *
     * If the data model consumes the click by modifying some data in the existing data set, it should dispatch the 'fin-hypergrid-data-loaded` data event to the grid, which causes a grid "repaint" (which re-renders rows and columns in place).
     *
     * If the data model consumes the click by transforming the data, it should dispatch the following data events to the grid:
     *    * 'fin-hypergrid-data-prereindex' before transforming the data
     *    * 'fin-hypergrid-data-postreindex' after transforming the data
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


export namespace DataModel {

    export type DataValue = unknown;

    /**
     * @desc A data row representation.
     * The properties of this object are the data fields.
     * The property keys are the column names
     * All row objects should be congruent, meaning that each data row should have the same property keys.
     */
    export interface DataRowObject {
        [columnName: string]: DataValue;
        __META?: RowMetadata;
    }


    export interface ColumnSchema {
        name: string;
        header?: string;
        type?: string; // | null;
        calculator?: ColumnSchema.Calculator;
        comparator?: ColumnSchema.Comparator;
    }

    export namespace ColumnSchema {
        export type CalculateFunction = (this: void, dataRow: DataRowObject, columnName: string) => unknown;
        export type Calculator = CalculateFunction | string;

        export interface Comparator {
            // eslint-disable-next-line @typescript-eslint/ban-types
            asc: Function;
            // eslint-disable-next-line @typescript-eslint/ban-types
            desc: Function;
        }
    }

    /**
     * Column schema may be expressed as a string primitive on input to {@link DataModel#setData setData}.
     */
    export type RawColumnSchema = ColumnSchema | string;

    export interface RowProperties {
        height?: number; // will use default height if undefined
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    export type RowPropertiesPrototype = object;

    export type CellOwnProperty = unknown;
    export type CellOwnProperties = Record<string, CellOwnProperty>;

    export interface RowMetadata {
        [columnName: string]: CellOwnProperties | RowProperties; // include RowProperties to allow it to compile
        __ROW?: RowProperties;
    }

    export type RowMetadataPrototype = null;

    export class DataRowProxy implements DataRowObject {
        [columnName: string]: DataValue;

        rowIndex: number;

        constructor(public dataModel: DataModel) {
            this.updateSchema(); // is this necessary? If we do not always get the "fin-hypergrid-schema-loaded" event then it is necessary
        }

        updateSchema() {
            const schema = this.dataModel.getSchema();
            const count = schema.length;
            for (let i = 0; i < count; i++) {
                const x = i; // variable for closure
                const columnSchema = schema[i];
                const columnName = columnSchema.name;
                Object.defineProperty(this, columnName, {
                    // enumerable: true, // is a real data field
                    get: () => { return this.dataModel.getValue(x, this.rowIndex); },
                    set: (value: DataValue) => { return this.dataModel.setValue(x, this.rowIndex, value); }
                });
            }
        }
    }


    /**
     * Besides `type`, your event object can contain other event details.
     *
     * After calling the internal handler found in [src/behaviors/Local/events.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/events.js) matching the event name, Hypergrid then creates a {@link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent `CustomEvent`} with the same name, sets its `detail` property to this object, and dispatches to the `<canvas>` element — to be picked up by any listeners previously attached with {@link Hypergrid#addEventListener}.
     * @param event.type - Event string (name).
     */
    export interface Event {
        /** Event name. */
        type: EventName;
        detail?: unknown;
    }

        export type EventListener = (this: void, nameOrEvent: EventName | DataModel.Event) => boolean | undefined;

    export interface DrillDownCharMap {
        true: string;
        false: string;
        undefined: string;
        null: string;
        OPEN: string;
        CLOSE: string;
        INDENT: string;
    }

    export interface EventMap {
        /**
         * @desc The data models should trigger this event on a schema change, typically from setSchema, or wherever schema is initialized. Hypergrid responds by normalizing and decorating the schema object and recreating the grid's column objects — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
         * ```js
         * grid.addEventListener('fin-hypergrid-schema-loaded', myHandlerFunction);
         * ```
         * This event is not cancelable.
         * {@link module:fields.normalizeSchema normalizeSchema}
         * {@link module:fields.decorateSchema decorateSchema}
         * {@link (module:fields).decorateColumnSchema decorateColumnSchema}
         */
        'fin-hypergrid-schema-loaded': EventListener;
        /**
         * @desc The data model should trigger this event when it changes the data on its own.
         * Hypergrid responds by calling {@link Hypergrid#repaint grid.repaint()} — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
         * ```js
         * grid.addEventListener('fin-hypergrid-data-loaded', myHandlerFunction);
         * ```
         * This event is not cancelable.
         */
        'fin-hypergrid-data-loaded': EventListener;
        /**
         * @desc The data model should trigger this event when it changes the data rows (count, order, _etc._) on its own.
         * Hypergrid responds by calling {@link Hypergrid#behaviorChanged grid.behaviorChanged()} — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
         * ```js
         * grid.addEventListener('fin-hypergrid-data-shape-changed', myHandlerFunction);
         * ``
         * This event is not cancelable.
         */
        'fin-hypergrid-data-shape-changed': EventListener;
        /**
         * @desc The data models should trigger this event immediately before data model remaps the rows.
         * Hypergrid responds by saving the underlying row indices of currently selected rows — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
         * ```js
         * grid.addEventListener('fin-hypergrid-data-prereindex', myHandlerFunction);
         * ```
         * This event is not cancelable.
         */
        'fin-hypergrid-data-prereindex': EventListener;
        /**
         * @desc The data models should trigger this event immediately after data model remaps the rows.
         * Hypergrid responds by reselecting the remaining rows matching the indices previously saved in the `data-prereindex` event, and then calling {@link Hypergrid#behaviorShapeChanged grid.behaviorShapeChanged()} — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
         * ```js
         * grid.addEventListener('fin-hypergrid-data-postreindex', myHandlerFunction);
         * ```
         * This event is not cancelable.
         */
        'fin-hypergrid-data-postreindex': EventListener;
    }

    export type EventName = keyof EventMap;

    export const REGEX_DATA_EVENT_STRING = /^fin-hypergrid-(data|schema)(-[a-z]+)+$/;

    export interface LegacyColumnSchema {
        name: string;
        index: number;
        header?: string;
        type?: string; // | null;
        calculator?: ColumnSchema.Calculator;
        comparator?: ColumnSchema.Comparator;
    }

    interface IndexedColumnSchema extends ColumnSchema {
        index: number;
    }

    /**
     * @summary Normalizes and returns given schema array.
     * @desc For each "column schema" (element of schema array):
     *
     * 1. Objectify column schemata<br>
     * Ensures each column schema is an object with a `name` property.
     * 2. Index schema schemata<br>
     * Adds an `index` property to each column schema element.
     * 3. Decorates schema<br>
     * Decorates the schema array object itself with column names and column name synonyms. This is helpful for looking up column schema by column name rather than by index. To get the index of a column when you know the name:
     * ```javascript
     * var schema = dataModel.getSchema();
     * var columnName = 'foo';
     * var columnIndex = schema[columnName].index;
     * ```
     * 4. Adds missing headers.
     *
     * This function is safe to call repeatedly.
     *
     * Called from {@link Behavior#createColumns createColumns} (called on receipt of the `fin-hypergrid-schema-loaded` event (dispatched by data model implementation of `setSchema`)).
     */
    export function normalizeSchema(schema: (ColumnSchema | RawColumnSchema | LegacyColumnSchema)[]): ColumnSchema[] {
        const count = schema.length;

        // extract the indices explicitly specified in the array of columns
        const explicitIndices = new Array<number>(count);
        let indicesCount = 0;
        schema.forEach((columnSchema) => {
            if (typeof columnSchema === 'object') {
                const legacyColumnSchema = columnSchema as LegacyColumnSchema; // assume this
                const index = legacyColumnSchema['index'];
                if (index !== undefined) {
                    explicitIndices[indicesCount++] = index;
                }
            }
        });

        // Make sure each element of `schema` is an object with a `name` property and a unique index.
        const result = new Array<IndexedColumnSchema>(count);

        let nextIndex = 0;
        schema.forEach( (columnSchema, i) => {
            if (typeof columnSchema === 'string') {
                nextIndex = calculateUnusedNextIndex(nextIndex, explicitIndices);
                result[i] = {
                    name: columnSchema,
                    index: nextIndex,
                }
            } else {
                const indexedColumnSchema = columnSchema as IndexedColumnSchema;
                let index = indexedColumnSchema['index'];
                if (index === undefined) {
                    nextIndex = calculateUnusedNextIndex(nextIndex, explicitIndices);
                    index = nextIndex;
                }
                result[i] = {
                    ...columnSchema,
                    index,
                }
            }
        });

        // sort by indices
        result.sort((a, b) => {
            return a.index - b.index;
        })

        // Remove all meta data columns from schema and index fields
        for (let i = result.length - 1; i >= 0; i--) {
            const columnSchema = result[i];
            if (REGEXP_META_PREFIX.test(columnSchema.name)) {
                result.splice(i, 1);
            }

            delete columnSchema.index;
        }

        return result as ColumnSchema[];
    }

    function calculateUnusedNextIndex(nextIndex: number, usedIndices: number[]) {
        while (usedIndices.includes(nextIndex)) {
            nextIndex++;
        }
        return nextIndex;
    }

    const REGEXP_META_PREFIX = /^__/; // starts with double underscore
}
