import { SchemaField } from './schema-field';


/** @public */
export interface SchemaServer<SF extends SchemaField> {
    subscribeSchemaNotifications(client: SchemaServer.NotificationsClient<SF>): void;
    unsubscribeSchemaNotifications?(client: SchemaServer.NotificationsClient<SF>): void;

    /**
     * Get list of columns. The order of the columns in the list defines the column indexes.
     *
     * On initial call and again whenever the schema changes, the data model must dispatch the `hypegrid-schema-loaded` event, which tells Hypergrid to {@link module:schema.decorate decorate} the schema and recreate the column objects.
     */
    getFields(): readonly SF[];
}

/** @public */
export namespace SchemaServer {
    export interface NotificationsClient<SF extends SchemaField> {
        beginChange: (this: void) => void;
        endChange: (this: void) => void;
        /**
         * The data models should trigger this event on a schema change, typically from setSchema, or wherever schema is initialized. Hypergrid responds by normalizing and decorating the schema object and recreating the grid's column objects — before triggering a grid event using the same event string, which applications can listen for using {@link Hypergrid#addEventListener addEventListener}:
         * ```js
         * grid.addEventListener('rev-schema-loaded', myHandlerFunction);
         * ```
         * This event is not cancelable.
         */
        fieldsInserted: (this: void, fieldIndex: number, fieldCount: number) => void;
        fieldsDeleted: (this: void, fieldIndex: number, fieldCount: number) => void;
        allFieldsDeleted: (this: void) => void;
        /** Try to use columnsInserted, columnsDeleted, allColumnsDeleted instead of schemaChanged. These provide better optimisations and control of selection. */
        schemaChanged: (this: void) => void;
        getActiveSchemaFields: (this: void) => readonly SF[];
    }

    export type Constructor<SF extends SchemaField> = new() => SchemaServer<SF>;

    // /**
    //  * Generates an array of columns (proper schema) from an array of Column and string.
    //  */
    // export function normalizeColumns(columns: (Column | string)[]): Column[] {
    //     const count = columns.length;

    //     // extract the indices explicitly specified in the array of columns
    //     const explicitIndices = new Array<number>(count);
    //     let indicesCount = 0;
    //     columns.forEach((column) => {
    //         if (typeof column === 'object') {
    //             const index = column.index;
    //             if (index !== undefined) {
    //                 explicitIndices[indicesCount++] = index;
    //             }
    //         }
    //     });

    //     // Make sure each element of `schema` is a Column object.
    //     const result = new Array<Column>(count);

    //     let nextIndex = 0;
    //     columns.forEach( (column, i) => {
    //         if (typeof column === 'string') {
    //             nextIndex = calculateUnusedNextIndex(nextIndex, explicitIndices);
    //             result[i] = {
    //                 name: column,
    //                 index: nextIndex,
    //                 settings: undefined,
    //             }
    //         } else {
    //             result[i] = column;
    //         }
    //     });

    //     // sort by indices
    //     result.sort((a, b) => {
    //         return a.index - b.index;
    //     })

    //     // Remove all meta data columns from schema and index fields
    //     for (let i = result.length - 1; i >= 0; i--) {
    //         const columnSchema = result[i];
    //         if (REGEXP_META_PREFIX.test(columnSchema.name)) {
    //             result.splice(i, 1);
    //         }
    //     }

    //     return result;
    // }

    // /** @internal */
    // function calculateUnusedNextIndex(nextIndex: number, usedIndices: number[]) {
    //     while (usedIndices.includes(nextIndex)) {
    //         nextIndex++;
    //     }
    //     return nextIndex;
    // }

    // /** @internal */
    // const REGEXP_META_PREFIX = /^__/; // starts with double underscore
}

/** @public */
export type ServerNotificationId = number; // also applies to DataModel
/** @public */
export const lowestValidServerNotificationId = 0;
/** @public */
export const invalidServerNotificationId = -1;
