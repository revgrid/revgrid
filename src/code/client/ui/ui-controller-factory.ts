
import { RevRegistry, RevSchemaField } from '../../common';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../settings';
import { RevUiControllerServices } from './controller/common';
import { RevUiController } from './controller/ui-controller';

/** @internal */
export class RevUiControllerFactory<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    private readonly _registry = new RevRegistry<RevUiController.Constructor<BGS, BCS, SF>>;

    registerDefinition(typeName: string, constructor: RevUiController.Constructor<BGS, BCS, SF>) {
        this._registry.register(typeName, constructor);
    }

    create(name: string, services: RevUiControllerServices<BGS, BCS, SF>) {
        const constructor = this._registry.get(name);
        if (constructor === undefined) {
            return undefined;
        } else {
            return new constructor(services);
        }
    }
}
