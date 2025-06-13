import { RevSchemaField } from '../../../common/internal-api';

/** @public */
export interface RevMultiHeadingField extends RevSchemaField {
    headings: string[];
}
