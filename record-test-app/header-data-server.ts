import { RevRecordHeaderDataServer, StandardBehavioredColumnSettings } from '..';
import { GridField } from './grid-field';

export class HeaderDataServer extends RevRecordHeaderDataServer<StandardBehavioredColumnSettings, GridField> {
    override getViewValue(field: GridField): string {
        return field.heading;
    }
}
