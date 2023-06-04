
import { MergableColumnSettings } from '../../interfaces/settings/mergable-column-settings';
import { MergableGridSettings } from '../../interfaces/settings/mergable-grid-settings';
import { Registry } from '../../types-utils/registry';
import { UiBehavior } from './ui-behavior';
import { UiBehaviorServices } from './ui-behavior-services';

/** @internal */
export class UiBehaviorFactory<MGS extends MergableGridSettings, MCS extends MergableColumnSettings> {
    private readonly _registry = new Registry<UiBehavior.Constructor<MGS, MCS>>;

    registerDefinition(typeName: string, constructor: UiBehavior.Constructor<MGS, MCS>) {
        this._registry.register(typeName, constructor);
    }

    create(name: string, services: UiBehaviorServices<MGS, MCS>) {
        const constructor = this._registry.get(name);
        if (constructor === undefined) {
            return undefined;
        } else {
            return new constructor(services);
        }
    }
}
