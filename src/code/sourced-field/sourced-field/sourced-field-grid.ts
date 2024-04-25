// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { BehavioredColumnSettings, BehavioredGridSettings, RevIClientGrid } from '../../client/internal-api';
import { RevAllowedSourcedFieldsColumnLayoutDefinition, RevSourcedField } from './server/internal-api';

/** @public */
export interface RevSourcedFieldGrid<
    BGS extends BehavioredGridSettings,
    BCS extends BehavioredColumnSettings,
    SF extends RevSourcedField
> extends RevIClientGrid<BGS, BCS, SF> {
    readonly allowedFields: readonly SF[] | undefined;
    createAllowedSourcedFieldsColumnLayoutDefinition(allowedFields: readonly SF[]): RevAllowedSourcedFieldsColumnLayoutDefinition;
}
