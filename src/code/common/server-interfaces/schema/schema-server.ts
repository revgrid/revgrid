import { RevSchemaField } from './schema-field';

/**
 * Interface representing a schema server.
 *
 * @typeParam SF - The type of schema field used to specify the field columns.
 *
 * Client grid uses this interface to retrieve the schema fields which are the field columns in the grid.  It also uses
 * it to get notified about changes to the schema.
 *
 * @see [Schema Server Interface Documentation](../../../../../Architecture/Common/Server_Interfaces/Schema/)
 * @public
 */
export interface RevSchemaServer<SF extends RevSchemaField> {
    subscribeSchemaNotifications(client: RevSchemaServer.NotificationsClient<SF>): void;
    unsubscribeSchemaNotifications?(client: RevSchemaServer.NotificationsClient<SF>): void;

    /**
     * Get list of fields.
     *
     * The order of these fields defines the orders of field columns in Columns Manager.
     */
    getFields(): readonly SF[];
}

/** @public */
export namespace RevSchemaServer {
    export interface NotificationsClient<SF extends RevSchemaField> {
        beginChange: (this: void) => void;
        endChange: (this: void) => void;
        /** Notifies that one or more fields have been inserted into the schema */
        fieldsInserted: (this: void, fieldIndex: number, fieldCount: number) => void;
        /** Notifies that one or more fields have been deleted from the schema */
        fieldsDeleted: (this: void, fieldIndex: number, fieldCount: number) => void;
        allFieldsDeleted: (this: void) => void;
        /**
         * Notifies schema has changed.
         * @remarks
         * Try to use {@link fieldsInserted}, {@link fieldsDeleted}, {@link allFieldsDeleted} callbacks instead of `schemaChanged` callback. These provide better optimisations and control of selection.
         */
        schemaChanged: (this: void) => void;
        getActiveSchemaFields: (this: void) => readonly SF[];
    }

    export type Constructor<SF extends RevSchemaField> = new() => RevSchemaServer<SF>;

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
export type RevServerNotificationId = number; // also applies to DataModel
/** @public */
export const revLowestValidServerNotificationId = 0;
/** @public */
export const revInvalidServerNotificationId = -1;
