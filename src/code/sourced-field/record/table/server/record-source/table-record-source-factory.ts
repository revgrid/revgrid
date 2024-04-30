// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { CorrectnessState } from '@xilytix/sysutils';
import { RevTableRecordSourceDefinition } from './definition/internal-api';
import { RevTableRecordSource } from './table-record-source';

/** @public */
export interface RevTableRecordSourceFactory<Badness, TypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
    create(
        definition: RevTableRecordSourceDefinition<TypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>
    ): RevTableRecordSource<Badness, TypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;

    createCorrectnessState(): CorrectnessState<Badness>;
}
