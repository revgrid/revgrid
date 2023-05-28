import { AssertError, SchemaServer } from '../../grid/grid-public-api';

/** @public */
export class RevSimpleSchemaAdapter implements SchemaServer {
    private _schemaCallbackListeners: SchemaServer.NotificationsClient[] = [];
    private _columns = new Array<RevSimpleSchemaAdapter.Column>();

    subscribeSchemaNotifications(listener: SchemaServer.NotificationsClient) {
        this._schemaCallbackListeners.push(listener)
    }

    unsubscribeSchemaNotifications(listener: SchemaServer.NotificationsClient) {
        const idx = this._schemaCallbackListeners.findIndex((element) => element === listener);
        if (idx < 0) {
            throw new AssertError('LMDMRSCL91364', 'LocalMainSchemaModel: SchemaCallbackListener not found');
        } else {
            this._schemaCallbackListeners.splice(idx, 1);
        }
    }

    reset(schema?: RevSimpleSchemaAdapter.Column[]) {
        if (schema !== undefined) {
            this._columns = schema;
        }
        this._schemaCallbackListeners.forEach((listener) => listener.schemaChanged());
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getSchema}
     */
    getSchema(): readonly RevSimpleSchemaAdapter.Column[] {
        return this._columns;
    }

    setSchema(schema: RevSimpleSchemaAdapter.Column[]) {
        this._columns = schema;
        this._schemaCallbackListeners.forEach((listener) => listener.schemaChanged());
    }
}

/** @public */
export namespace RevSimpleSchemaAdapter {
    export interface Column extends SchemaServer.Column {
        headers: string[];
    }
}
