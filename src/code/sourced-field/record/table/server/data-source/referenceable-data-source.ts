import { IndexedRecord, LockOpenListItem } from '@pbkware/js-utils';
import { RevReferenceableColumnLayouts } from '../../../../../column-layout/server';
import { RevRecordRowOrderDefinition } from '../../../../../record/server';
import { RevTableFieldSourceDefinitionFactory } from '../field-source';
import { RevTableRecordSourceFactory } from '../record-source';
import { RevDataSource } from './data-source';
import { RevReferenceableDataSourceDefinition } from './definition';

/** @public */
export class RevReferenceableDataSource<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>
    extends RevDataSource<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>
    implements
        LockOpenListItem<
            RevReferenceableDataSource<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
            RevDataSource.LockErrorIdPlusTryError
        >,
        IndexedRecord {

    readonly name: string;
    readonly upperCaseName: string;

    constructor(
        referenceableColumnLayouts: RevReferenceableColumnLayouts | undefined,
        tableFieldSourceDefinitionFactory: RevTableFieldSourceDefinitionFactory<TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
        tableRecordSourceFactory: RevTableRecordSourceFactory<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
        lockedDefinition: RevReferenceableDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
        index: number,
    ) {
        const id = lockedDefinition.id;
        super(referenceableColumnLayouts, tableFieldSourceDefinitionFactory, tableRecordSourceFactory, lockedDefinition, id, id);

        this.name = lockedDefinition.name;
        this.upperCaseName = this.name.toUpperCase();
    }

    override createDefinition(
        rowOrderDefinition: RevRecordRowOrderDefinition
    ): RevReferenceableDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
        const tableRecordSourceDefinition = this.createTableRecordSourceDefinition();
        const columnLayoutOrReferenceDefinition = this.createColumnLayoutOrReferenceDefinition();

        return new RevReferenceableDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>(
            this.id,
            this.name,
            tableRecordSourceDefinition,
            columnLayoutOrReferenceDefinition,
            rowOrderDefinition,
        );
    }
}
