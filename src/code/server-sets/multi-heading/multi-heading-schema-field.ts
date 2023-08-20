import { SchemaField } from '../../grid/grid-public-api';

/** @public */
export interface MultiHeadingSchemaField extends SchemaField {
    headings: string[];
}
