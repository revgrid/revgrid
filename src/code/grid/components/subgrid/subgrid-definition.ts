import { DataServer } from '../../interfaces/server/data-server';
import { MetaModel } from '../../interfaces/server/meta-model';
import { Subgrid } from '../../interfaces/server/subgrid';
import { CellEditor } from '../../interfaces/serverless/cell-editor';
import { CellPainter } from '../cell/cell-painter';
import { ViewCell } from '../cell/view-cell';

/** @public */
export interface SubgridDefinition {
    /** defaults to main */
    role?: Subgrid.Role;
    dataServer: DataServer | DataServer.Constructor;
    metaModel?: MetaModel | MetaModel.Constructor;
    getCellPainterEventer: SubgridDefinition.GetCellPainterEventer;
    selectable?: boolean;
    defaultRowHeight?: number;
    rowPropertiesCanSpecifyRowHeight?: boolean;
    rowPropertiesPrototype?: MetaModel.RowPropertiesPrototype;
}

/** @public */
export namespace SubgridDefinition {
    export type GetCellPainterEventer = (
        this: void,
        viewCell: ViewCell,
        cellEditorPainter: CellEditor.Painter | undefined
    ) => CellPainter;
}
