import { DataModel } from './data-model';

/** @public */
export interface SchemaModel {
    addSchemaCallbackListener?(listener: SchemaModel.CallbackListener): void;
    removeSchemaCallbackListener?(listener: SchemaModel.CallbackListener): void;

    /**
     * @desc Get list of columns. The order of the columns in the list defines the column indexes.
     *
     * On initial call and again whenever the schema changes, the data model must dispatch the `hypegrid-schema-loaded` event, which tells Hypergrid to {@link module:schema.decorate decorate} the schema and recreate the column objects.
     */
    getSchema(): readonly SchemaModel.Column[];
}

/** @public */
export namespace SchemaModel {
    export interface Column {
        name: string;
        header?: string;
        type?: string; // | null;
        calculator?: Column.Calculator;
        comparator?: Column.Comparator;
    }

    export namespace Column {
        export type CalculateFunction = (this: void, dataRow: DataModel.DataRowObject, columnName: string) => unknown;
        export type Calculator = CalculateFunction | string;

        export interface Comparator {
            // eslint-disable-next-line @typescript-eslint/ban-types
            asc: Function;
            // eslint-disable-next-line @typescript-eslint/ban-types
            desc: Function;
        }
    }

    export interface CallbackListener {
        /**
         * @desc The data models should trigger this event on a schema change, typically from setSchema, or wherever schema is initialized. Hypergrid responds by normalizing and decorating the schema object and recreating the grid's column objects — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
         * ```js
         * grid.addEventListener('hypegrid-schema-loaded', myHandlerFunction);
         * ```
         * This event is not cancelable.
         */
        schemaLoaded: (this: void) => void;
        getSchemaColumn: (this: void, columnIndex: number) => SchemaModel.Column;
        getSchemaColumns: (this: void) => SchemaModel.Column[];
        headerChanged: (this: void, column: SchemaModel.Column) => void;
    }

    export type EventDetail = Record<string, unknown> | undefined;

    export interface EventMap {
        'hypegrid-schema-loaded': EventDetail;
    }

    export type EventName = keyof EventMap;

    export type Constructor = new() => SchemaModel;

    /**
     * Column schema may be expressed as a string primitive on input to {@link DataModel#setData setData}.
     */
    export type RawColumn = Column | string;

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
     * Called from {@link Behavior#createColumns createColumns} (called on receipt of the `hypegrid-schema-loaded` event (dispatched by data model implementation of `setSchema`)).
     */
    export function normalizeColumns(columns: (Column | RawColumn)[]): Column[] {
        const count = columns.length;

        // extract the indices explicitly specified in the array of columns
        // const explicitIndices = new Array<number>(count);
        // let indicesCount = 0;
        // schema.forEach((columnSchema) => {
        //     if (typeof columnSchema === 'object') {
        //         const index = columnSchema.index;
        //         if (index !== undefined) {
        //             explicitIndices[indicesCount++] = index;
        //         }
        //     }
        // });

        // Make sure each element of `schema` is an object with a `name` property.
        const result = new Array<Column>(count);

        columns.forEach( (column, i) => {
            if (typeof column === 'string') {
                result[i] = {
                    name: column,
                }
            } else {
                result[i] = column;
            }
        });

        // Remove all meta data columns from schema and index fields
        for (let i = result.length - 1; i >= 0; i--) {
            const column = result[i];
            if (REGEXP_META_PREFIX.test(column.name)) {
                result.splice(i, 1);
            }
        }

        return result;
    }

    /** @internal */
    const REGEXP_META_PREFIX = /^__/; // starts with double underscore
}
