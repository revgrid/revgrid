
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { Registry } from '../../types-utils/registry';
import { UiBehavior } from './ui-behavior';
import { UiBehaviorServices } from './ui-behavior-services';

/** @internal */
export class UiBehaviorFactory<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings> {
    private readonly _registry = new Registry<UiBehavior.Constructor<BGS, BCS>>;

    registerDefinition(typeName: string, constructor: UiBehavior.Constructor<BGS, BCS>) {
        this._registry.register(typeName, constructor);
    }

    create(name: string, services: UiBehaviorServices<BGS, BCS>) {
        const constructor = this._registry.get(name);
        if (constructor === undefined) {
            return undefined;
        } else {
            return new constructor(services);
        }
    }
}
