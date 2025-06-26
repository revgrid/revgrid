import { Integer } from '@pbkware/js-utils';
import { RevColumnLayout } from './column-layout';
import { RevReferenceableColumnLayoutDefinition } from './definition';

/** @public */
export class RevReferenceableColumnLayout extends RevColumnLayout {
    readonly name: string;
    readonly upperCaseName: string;

    constructor(
        definition: RevReferenceableColumnLayoutDefinition,
        index: Integer,
    ) {
        const id = definition.id;
        super(definition, id, id);

        this.name = definition.name;
        this.upperCaseName = this.name.toUpperCase();
        this.index = index;
    }

    override createDefinition(): RevReferenceableColumnLayoutDefinition {
        const definitionColumns = this.createDefinitionColumns();
        return new RevReferenceableColumnLayoutDefinition(this.id, this.name, definitionColumns, 0);
    }
}
