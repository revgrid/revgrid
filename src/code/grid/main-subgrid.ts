import { ColumnsManager } from './column/columns-manager';
import { CellModel } from './model/cell-model';
import { MainDataModel } from './model/main-data-model';
import { MetaModel } from './model/meta-model';
import { ModelCallbackRouter } from './model/model-callback-router';
import { SchemaModel } from './model/schema-model';
import { Revgrid } from './revgrid';
import { Subgrid } from './subgrid';

/** @public */
export class MainSubgrid extends Subgrid {
    // More Hypegrid and behavior logic should be moved into here

    /** @internal */
    constructor(
        /** @internal */
        grid: Revgrid,
        columnsManager: ColumnsManager,
        modelCallbackManager: ModelCallbackRouter,
        role: Subgrid.Role,
        schemaModel: SchemaModel,
        public override readonly dataModel: MainDataModel,
        metaModel: MetaModel | undefined,
        cellModel: CellModel | undefined,
    ) {
        super(grid, columnsManager, role, schemaModel, dataModel, metaModel, cellModel);

        modelCallbackManager.preReindexEvent = () => this.handleDataPreReindexEvent();
        modelCallbackManager.postReindexEvent = () => this.handleDataPostReindexEvent();
    }

    /** @internal */
    private handleDataPreReindexEvent() {
        this.requestStashSelection();
        this._grid.renderer.modelUpdated();
    }

    /** @internal */
    private handleDataPostReindexEvent() {
        const grid = this._grid;
        this.requestUnstashSelection();
        grid.behaviorShapeChanged();
        grid.renderer.modelUpdated();
    }
}
