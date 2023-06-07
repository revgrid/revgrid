
import { SchemaServer } from '../../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { Registry } from '../../types-utils/registry';
import { UiBehavior } from './ui-behavior';
import { UiBehaviorServices } from './ui-behavior-services';

/** @internal */
export class UiBehaviorFactory<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> {
    private readonly _registry = new Registry<UiBehavior.Constructor<BGS, BCS, SC>>;

    registerDefinition(typeName: string, constructor: UiBehavior.Constructor<BGS, BCS, SC>) {
        this._registry.register(typeName, constructor);
    }

    create(name: string, services: UiBehaviorServices<BGS, BCS, SC>) {
        const constructor = this._registry.get(name);
        if (constructor === undefined) {
            return undefined;
        } else {
            return new constructor(services);
        }
    }
}
