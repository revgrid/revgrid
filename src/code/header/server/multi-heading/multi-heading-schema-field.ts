// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { SchemaField } from '../../../client/internal-api';

/** @public */
export interface MultiHeadingSchemaField extends SchemaField {
    headings: string[];
}
