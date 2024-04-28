import { Integer } from '@xilytix/sysutils';
import { RevApiError, RevAssertError, RevSchemaField, RevSchemaServer } from '../../client/internal-api';

/** @public */
export class RevDataRowArraySchemaServer<SF extends RevSchemaField> implements RevSchemaServer<SF> {
    private _schemaCallbackListeners: RevSchemaServer.NotificationsClient<SF>[] = [];
    private _fields = new Array<SF>();

    get fieldCount() { return this._fields.length; }

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

    getField(fieldIndex: Integer): SF {
        return this._fields[fieldIndex];
    }

    getFieldByName(fieldName: string): SF {
        const result = this.tryGetFieldByName(fieldName);
        if (result === undefined) {
            throw new RevApiError('DRASSGFBN', `FieldName not found: ${fieldName}`);
        } else {
            return result;
        }
    }

    tryGetFieldByName(fieldName: string): SF | undefined {
        const fields = this._fields;
        const count = fields.length;
        for (let i = 0; i < count; i++) {
            const field = fields[i];
            if (field.name === fieldName) {
                return field;
            }
        }
        return undefined;
    }

}
