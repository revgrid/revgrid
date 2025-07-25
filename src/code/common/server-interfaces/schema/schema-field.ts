/**
 * A field in the schema obtained from the server to which one or more grid columns can be bound.
 *
 * All columns are bound to a {@link RevSchemaField} when they are created.  The field is used to access data on the `RevDataServer` server.  The index of fields are also used
 * to notify the client when data on the server has changed.
 *
 * Note that while it is possible to bind more than one column to a {@link RevSchemaField}, this usage scenario would not be typical.
 *
 * @see {@link common/server-interfaces/schema/schema-server!RevSchemaServer RevSchemaServer}
 * @see {@link common/server-interfaces/data/data-server!RevDataServer RevDataServer}
 * @see {@link common/server-interfaces/data/data-server!RevDataServer.NotificationsClient NotificationsClient}
 * @public
 */
export interface RevSchemaField {
    /** Identifies a field in the schema.  Will be unique within a schema (ie grid). */
    readonly name: string;
    /**
     * Used by servers to index data.  Will be used by client to access data in circumstances when a complete row of data is retrieved with RevDataServer.getViewRow from
     * the server.
     */
    index: number;
}
