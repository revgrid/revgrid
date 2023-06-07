import { AssertError, BehavioredColumnSettings, SchemaServer } from '../../grid/grid-public-api';

/** @public */
export class RevSimpleSchemaServer<BCS extends BehavioredColumnSettings> implements SchemaServer<BCS, RevSimpleSchemaServer.Column<BCS>> {
    private _schemaCallbackListeners: SchemaServer.NotificationsClient<BCS>[] = [];
    private _columns = new Array<RevSimpleSchemaServer.Column<BCS>>();

    subscribeSchemaNotifications(listener: SchemaServer.NotificationsClient<BCS>) {
        this._schemaCallbackListeners.push(listener)
    }

    unsubscribeSchemaNotifications(listener: SchemaServer.NotificationsClient<BCS>) {
        const idx = this._schemaCallbackListeners.findIndex((element) => element === listener);
        if (idx < 0) {
            throw new AssertError('LMDMRSCL91364', 'LocalMainSchemaModel: SchemaCallbackListener not found');
        } else {
            this._schemaCallbackListeners.splice(idx, 1);
        }
    }

    reset(schema?: RevSimpleSchemaServer.Column<BCS>[]) {
        if (schema !== undefined) {
            this._columns = schema;
        }
        this._schemaCallbackListeners.forEach((listener) => listener.schemaChanged());
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getSchema}
     */
    getSchema(): readonly RevSimpleSchemaServer.Column<BCS>[] {
        return this._columns;
    }

    setSchema(schema: RevSimpleSchemaServer.Column<BCS>[]) {
        this._columns = schema;
        this._schemaCallbackListeners.forEach((listener) => listener.schemaChanged());
    }
}

/** @public */
export namespace RevSimpleSchemaServer {
    export interface Column<BCS extends BehavioredColumnSettings> extends SchemaServer.Column<BCS> {
        headers: string[];
    }
}
