import { ServerlessViewLayoutColumn } from '../serverless/serverless-view-layout-column';
import { Column } from './column';

export interface ViewLayoutColumn extends ServerlessViewLayoutColumn {
    column: Column;
}
