
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { Registry } from '../../types-utils/registry';
import { UiBehavior } from './ui-behavior';
import { UiBehaviorServices } from './ui-behavior-services';

/** @internal */
export class UiBehaviorFactory<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField<BCS>> {
    private readonly _registry = new Registry<UiBehavior.Constructor<BGS, BCS, SF>>;

    registerDefinition(typeName: string, constructor: UiBehavior.Constructor<BGS, BCS, SF>) {
        this._registry.register(typeName, constructor);
    }

    create(name: string, services: UiBehaviorServices<BGS, BCS, SF>) {
        const constructor = this._registry.get(name);
        if (constructor === undefined) {
            return undefined;
        } else {
            return new constructor(services);
        }
    }
}
