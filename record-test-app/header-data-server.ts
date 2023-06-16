import { RevRecordHeaderDataServer, StandardInMemoryBehavioredColumnSettings } from '../dist/types/public-api';
import { GridField } from './grid-field';

export class HeaderDataServer extends RevRecordHeaderDataServer<StandardInMemoryBehavioredColumnSettings, GridField> {
    override getViewValue(field: GridField): string {
        return field.heading;
    }
}
