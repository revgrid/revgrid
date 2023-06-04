import { Subgrid } from '../../interfaces/data/subgrid';
import { SchemaServer } from '../../interfaces/schema/schema-server';
import { MergableColumnSettings } from '../../interfaces/settings/mergable-column-settings';

/** @public */
export interface GridDefinition<MCS extends MergableColumnSettings> {
    schemaServer: (SchemaServer<MCS> | SchemaServer.Constructor<MCS>),
    subgrids: Subgrid.Definition<MCS>[],
}
