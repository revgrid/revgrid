import { RevAssertError, SchemaField, RevSchemaServer } from '../../grid/grid-public-api';

/** @public */
export class DataRowArraySchemaServer<SF extends SchemaField> implements SchemaServer<SF> {
    private _schemaCallbackListeners: RevSchemaServer.NotificationsClient<SF>[] = [];
    private _fields = new Array<SF>();

    subscribeSchemaNotifications(listener: RevSchemaServer.NotificationsClient<SF>) {
        this._schemaCallbackListeners.push(listener)
    }

    unsubscribeSchemaNotifications(listener: RevSchemaServer.NotificationsClient<SF>) {
        const idx = this._schemaCallbackListeners.findIndex((element) => element === listener);
        if (idx < 0) {
            throw new RevAssertError('LMDMRSCL91364', 'LocalMainSchemaModel: SchemaCallbackListener not found');
        } else {
            this._schemaCallbackListeners.splice(idx, 1);
        }
    }

    reset(schema?: SF[]) {
        if (schema !== undefined) {
            this._fields = schema;
        }
        this._schemaCallbackListeners.forEach((listener) => { listener.schemaChanged(); });
    }

    getFields(): readonly SF[] {
        return this._fields;
    }

    setSchema(schema: SF[]) {
        this._fields = schema;
        this._schemaCallbackListeners.forEach((listener) => { listener.schemaChanged(); });
    }
}
