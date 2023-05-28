import { ServerlessColumn } from '../serverless/serverless-column';
import { SchemaServer } from './schema-server';

/** @public */
export interface Column extends ServerlessColumn {
    readonly schemaColumn: SchemaServer.Column;
}

/** @public */
export interface ColumnWidth {
    column: Column;
    width: number | undefined;
}
