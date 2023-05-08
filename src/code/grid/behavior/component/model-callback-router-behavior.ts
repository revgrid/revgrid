import { ColumnsManager } from '../../components/column/columns-manager';
import { Focus } from '../../components/focus/focus';
import { ModelCallbackRouter } from '../../components/model-callback-router/model-callback-router';
import { ReindexStashManager } from '../../components/model-callback-router/reindex-stash-manager';
import { Renderer } from '../../components/renderer/renderer';
import { Selection } from '../../components/selection/selection';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { DataModel } from '../../interfaces/data-model';

export class ModelCallbackRouterBehavior {
    private _mainDataModel: DataModel;

    constructor(
        private readonly _columnsManager: ColumnsManager,
        private readonly _subgridsManager: SubgridsManager,
        private readonly _renderer: Renderer,
        private readonly _focus: Focus,
        private readonly _selection: Selection,
        private readonly _router: ModelCallbackRouter,
        private readonly _reindexStashManager: ReindexStashManager,
        private readonly _behaviorShapeChangedEventer: ModelCallbackRouterBehavior.BehaviorShapeChangedEventer,
    ) {
        this._mainDataModel = this._subgridsManager.mainSubgrid.dataModel;

        const router = this._router;

        router.beginSchemaChangeEvent = () => this.beginSchemaChange();
        router.endSchemaChangeEvent = () => this.endSchemaChange();
        router.beginDataChangeEvent = () => this.beginDataChange();
        router.endDataChangeEvent = () => this.endDataChange();

        router.columnsInsertedEvent = (index, count) => {
            this.beginSchemaChange();
            try {
                this._renderer.modelUpdated();
                this._columnsManager.schemaColumnsInserted(index, count);
                // Currently cannot calculate active Column Index of added columns so cannot advise SelectionModel of change
                // or advise Renderer of column index
                this._renderer.renderColumnsInserted(-1, -1);
            } finally {
                this.endSchemaChange();
            }

            // this.tryNotifyUndefinedDetailedModelEvent('rev-schema-loaded');
        }

        router.columnsDeletedEvent = (index, count) => {
            this.beginSchemaChange();
            try {
                this._renderer.modelUpdated();
                this._columnsManager.schemaColumnsDeleted(index, count);
                const nextRange = index + count;
                for (let i = index; i < nextRange; i++) {
                    // In the future, should consolidate into activeIndex ranges instead of doing individually
                    const activeIndex = this._columnsManager.getActiveColumnIndexByAllIndex(i);
                    if (activeIndex >= 0) {
                        this._focus.adjustForColumnsDeleted(activeIndex, 1);
                        this._selection.adjustForColumnsDeleted(activeIndex, 1);
                        this._renderer.renderColumnsDeleted(activeIndex, 1);
                    }
                }
            } finally {
                this.endSchemaChange();
            }

            // this.tryNotifyUndefinedDetailedModelEvent('rev-schema-loaded');
        }

        router.allColumnsDeletedEvent = () => {
            this.beginSchemaChange();
            try {
                this._renderer.modelUpdated();
                this._columnsManager.allSchemaColumnsDeleted();
                this._focus.clear();
                this._selection.clear();
                this._renderer.renderAllColumnsDeleted();
            } finally {
                this.endSchemaChange();
            }

            // this.tryNotifyUndefinedDetailedModelEvent('rev-schema-loaded');
        }

        router.schemaChangedEvent = () => {
            this.beginSchemaChange();
            try {
                this._renderer.modelUpdated();
                this._columnsManager.schemaColumnsChanged();
                this._focus.clear();
                this._selection.clear();
                this._renderer.renderColumnsChanged();
            } finally {
                this.endSchemaChange();
            }

            // this.tryNotifyUndefinedDetailedModelEvent('rev-schema-loaded');
        };

        router.getActiveSchemaColumnsEvent = () => {
            return this._columnsManager.activeColumns.map((column) => column.schemaColumn);
        };

        router.rowsInsertedEvent = (dataModel, index, count) => {
            this.beginDataChange();
            try {
                this._renderer.modelUpdated();
                this._focus.adjustForRowsInserted(index, count, dataModel);
                this._selection.adjustForRowsInserted(index, count, dataModel);
                this._renderer.renderRowsInserted(index, count);
            } finally {
                this.endDataChange();
            }

            // this.tryNotifyUndefinedDetailedModelEvent('rev-data-row-count-changed');
        }

        router.rowsDeletedEvent = (dataModel, index, count) => {
            this.beginDataChange();
            try {
                this._renderer.modelUpdated();
                this._focus.adjustForRowsDeleted(index, count, dataModel);
                this._selection.adjustForRowsDeleted(index, count, dataModel);
                this._renderer.renderRowsDeleted(index, count);
            } finally {
                this.endDataChange();
            }

            // this.tryNotifyUndefinedDetailedModelEvent('rev-data-row-count-changed');
        }

        router.allRowsDeletedEvent = (dataModel) => {
            this.beginDataChange();
            try {
                this._renderer.modelUpdated();
                if (dataModel === this._mainDataModel) {
                    this._focus.clear();
                    this._selection.clear();
                }
                this._renderer.renderAllRowsDeleted();
            } finally {
                this.endDataChange();
            }

            // this.tryNotifyUndefinedDetailedModelEvent('rev-data-row-count-changed');
        }

        router.rowsMovedEvent = (dataModel, oldRowIndex, newRowIndex, rowCount) => {
            this.beginDataChange();
            try {
                this._renderer.modelUpdated();
                this._focus.adjustForRowsMoved(oldRowIndex, newRowIndex, rowCount, dataModel);
                this._selection.adjustForRowsMoved(oldRowIndex, newRowIndex, rowCount, dataModel);
                this._renderer.renderRowsMoved(oldRowIndex, newRowIndex, rowCount);
            } finally {
                this.endDataChange();
            }

            // this.tryNotifyUndefinedDetailedModelEvent('rev-data-rows-moved');
        }

        router.rowsLoadedEvent = (dataModel) => {
            this.beginDataChange();
            try {
                this._renderer.modelUpdated();
                if (dataModel === this._mainDataModel) {
                    this._focus.clear();
                    this._selection.clear();
                }
                this._renderer.renderRowsLoaded();
            } finally {
                this.endDataChange();
            }

            // this.tryNotifyUndefinedDetailedModelEvent('rev-data-row-count-changed');
        };

        router.invalidateAllEvent = () => {
            this._renderer.modelUpdated();
            this._renderer.invalidateAll();

            // this.tryNotifyUndefinedDetailedModelEvent('rev-data-all-invalidated');
        }

        router.invalidateRowsEvent = (rowIndex: number, count: number) => {
            this._renderer.modelUpdated();
            this._renderer.invalidateRows(rowIndex, count);

            // if (this._gridProperties.emitModelEvents) {
            //     const detail: EventDetail.RowsDataInvalidated = {
            //         time: Date.now(),
            //         rowIndex,
            //         count,
            //     }
            //     this.gridEvent('rev-data-rows-invalidated', detail);
            // }
        }

        router.invalidateRowEvent = (rowIndex: number) => {
            this._renderer.modelUpdated();
            this._renderer.invalidateRow(rowIndex);

            // if (this._gridProperties.emitModelEvents) {
            //     const detail: EventDetail.RowsDataInvalidated = {
            //         time: Date.now(),
            //         rowIndex,
            //         count: 1,
            //     }
            //     this.gridEvent('rev-data-rows-invalidated', detail);
            // }
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        router.invalidateRowColumnsEvent = (rowIndex: number, allColumnIndex: number, columnCount: number) => {
            this._renderer.modelUpdated();
            this._renderer.invalidateRow(rowIndex); // this should be improved to use this._renderer.invalidateRowColumns()

            // if (this._gridProperties.emitModelEvents) {
            //     const detail: EventDetail.RowColumnsDataInvalidated = {
            //         time: Date.now(),
            //         rowIndex,
            //         schemaColumnIndex,
            //         columnCount,
            //     }
            //     this.gridEvent('rev-data-row-columns-invalidated', detail);
            // }
        }

        router.invalidateRowCellsEvent = (rowIndex: number, allIndexes: number[]) => {
            this._renderer.modelUpdated();
            this._renderer.invalidateRowCells(rowIndex, allIndexes);

            // if (this._gridProperties.emitModelEvents) {
            //     const detail: EventDetail.RowCellsDataInvalidated = {
            //         time: Date.now(),
            //         rowIndex,
            //         schemaColumnIndexes,
            //     }
            //     this.gridEvent('rev-data-row-cells-invalidated', detail);
            // }
        }

        router.invalidateCellEvent = (allIndex: number, rowIndex: number) => {
            this._renderer.modelUpdated();
            this._renderer.invalidateCell(allIndex, rowIndex);

            // if (this._gridProperties.emitModelEvents) {
            //     const detail: EventDetail.CellDataInvalidated = {
            //         time: Date.now(),
            //         schemaColumnIndex,
            //         rowIndex,
            //     }
            //     this.gridEvent('rev-data-cell-invalidated', detail);
            // }
        }

        router.preReindexEvent = () => {
            this._reindexStashManager.stash();
            this._renderer.modelUpdated();

            // this.tryNotifyUndefinedDetailedModelEvent('rev-data-prereindex');
        }

        router.postReindexEvent = () => {
            this._reindexStashManager.unstash();
            this._behaviorShapeChangedEventer();
            this._renderer.modelUpdated();

            // this.tryNotifyUndefinedDetailedModelEvent('rev-data-postreindex');
        }

        this.registerDataModels();
    }

    registerDataModels() {

        this._router.clearRegisteredDataModels();
        const subgrids = this._subgridsManager.subgrids;
        for (const subgrid of subgrids) {
            this._router.registerDataModel(subgrid.dataModel);
        }
    }

    private beginSchemaChange() {
        this._columnsManager.beginSchemaChange();
        this._selection.beginChange();
        this._renderer.beginChange();
    }

    private endSchemaChange() {
        this._columnsManager.endSchemaChange();
        this._selection.endChange();
        this._renderer.endChange();
    }

    private beginDataChange() {
        this._selection.beginChange();
        this._renderer.beginChange();
    }

    private endDataChange() {
        this._selection.endChange();
        this._renderer.endChange();
    }

    // private tryNotifyUndefinedDetailedModelEvent<T extends EventName>(eventName: T) {
    //     if (this._gridProperties.emitModelEvents) {
    //         this.modelEventer(eventName, undefined);
    //     }
    // }
}

export namespace ModelCallbackRouterBehavior {
    export type BehaviorShapeChangedEventer = (this: void) => void;
}
