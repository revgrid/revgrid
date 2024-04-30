// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { IndexedRecord, LockOpenListItem } from '@xilytix/sysutils';
import { RevReferenceableColumnLayoutsService } from '../../../../../column-layout/server/internal-api';
import { RevRecordRowOrderDefinition } from '../../../../../record/server/internal-api';
import { RevTableFieldSourceDefinitionFactory } from '../field-source/internal-api';
import { RevTableRecordSourceFactory } from '../record-source/internal-api';
import { RevDataSource } from './data-source';
import { RevReferenceableDataSourceDefinition } from './definition/internal-api';

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
        referenceableColumnLayoutsService: RevReferenceableColumnLayoutsService | undefined,
        tableFieldSourceDefinitionFactory: RevTableFieldSourceDefinitionFactory<TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
        tableRecordSourceFactory: RevTableRecordSourceFactory<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
        lockedDefinition: RevReferenceableDataSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
        index: number,
    ) {
        const id = lockedDefinition.id;
        super(referenceableColumnLayoutsService, tableFieldSourceDefinitionFactory, tableRecordSourceFactory, lockedDefinition, id, id);

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
