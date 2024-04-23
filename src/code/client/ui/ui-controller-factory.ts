
import { SchemaField } from '../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../interfaces/settings/behaviored-grid-settings';
import { Registry } from '../types-utils/registry';
import { UiControllerServices } from './controller/common/ui-controller-services';
import { UiController } from './controller/ui-controller';

/** @internal */
export class UiControllerFactory<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> {
    private readonly _registry = new Registry<UiController.Constructor<BGS, BCS, SF>>;

    registerDefinition(typeName: string, constructor: UiController.Constructor<BGS, BCS, SF>) {
        this._registry.register(typeName, constructor);
    }

    create(name: string, services: UiControllerServices<BGS, BCS, SF>) {
        const constructor = this._registry.get(name);
        if (constructor === undefined) {
            return undefined;
        } else {
            return new constructor(services);
        }
    }
}
