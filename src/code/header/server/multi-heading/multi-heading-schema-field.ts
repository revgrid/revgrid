// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevSchemaField } from '../../../client/internal-api';

/** @public */
export interface RevMultiHeadingSchemaField extends RevSchemaField {
    headings: string[];
}
