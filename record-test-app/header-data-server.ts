import { RevRecordHeaderDataServer } from '../dist/types/public-api';
import { GridField } from './grid-field';

export class HeaderDataServer extends RevRecordHeaderDataServer<GridField> {
    override getViewValue(field: GridField): string {
        return field.heading;
    }
}
