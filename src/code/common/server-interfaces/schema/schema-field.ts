/**
 * A field in the schema obtained from the server to which one or more grid columns can be bound.
 * @remarks
 * All columns are bound to a {@link RevSchemaField} when they are created.  The field is used to access data on the {@link RevDataServer:interface server}.  The index of fields are also used
 * to {@link RevDataServer.NotificationsClient notify the client} when data on the {@link RevDataServer:interface server} has changed.
 *
 * Note that while it is possible to bind more than one column to a {@link RevSchemaField}, this usage scenario would not be typical.
 * @public
 */
export interface RevSchemaField {
    /** Identifies a field in the schema.  Will be unique within a schema (ie grid). */
    readonly name: string;
    /**
     * Used by servers to index data.  Will be used by client to access data in circumstances when a {@link RevDataServer.getViewRow complete row of data is retrieved} from
     * the {@link RevDataServer:interface server}.
     */
    index: number;
}
