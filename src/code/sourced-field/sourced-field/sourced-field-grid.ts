// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevAllowedSourcedFieldsColumnLayoutDefinition, RevSourcedField } from './server/internal-api';

/** @public */
export interface RevSourcedFieldGrid<SF extends RevSourcedField> {
    readonly allowedFields: readonly SF[] | undefined;
    createAllowedSourcedFieldsColumnLayoutDefinition(allowedFields: readonly SF[]): RevAllowedSourcedFieldsColumnLayoutDefinition;
}
