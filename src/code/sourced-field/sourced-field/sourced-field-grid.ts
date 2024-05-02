// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../../client/internal-api';
import { RevIColumnLayoutGrid } from '../../column-layout/internal-api';
import { RevAllowedSourcedFieldsColumnLayoutDefinition, RevSourcedField } from './server/internal-api';

/** @public */
export interface RevSourcedFieldGrid<
    BGS extends RevBehavioredGridSettings,
    BCS extends RevBehavioredColumnSettings,
    SF extends RevSourcedField
> extends RevIColumnLayoutGrid<BGS, BCS, SF> {
    readonly allowedFields: readonly SF[] | undefined;
    createAllowedSourcedFieldsColumnLayoutDefinition(allowedFields: readonly SF[]): RevAllowedSourcedFieldsColumnLayoutDefinition;
}
