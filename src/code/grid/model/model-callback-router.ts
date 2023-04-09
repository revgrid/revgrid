import { EventName } from '../event/event-name';
import { GridProperties } from '../grid-properties';
import { DataModel } from './data-model';
import { ModelUpdateId, SchemaModel } from './schema-model';

export class ModelCallbackRouter {
    getLastModelUpdateIdEvent: ModelCallbackRouter.GetLastModelUpdateIdEvent;
    // updateModelIdEvent: ModelChangeConsolidator.UpdateModelIdEvent;

    beginSchemaChangeEvent: ModelCallbackRouter.BeginSchemaChangeEvent;
    endSchemaChangeEvent: ModelCallbackRouter.EndSchemaChangeEvent;

    columnsInsertedEvent: ModelCallbackRouter.ColumnsInsertedEvent;
    columnsDeletedEvent: ModelCallbackRouter.ColumnsDeletedEvent;
    allColumnsDeletedEvent: ModelCallbackRouter.AllColumnsDeletedEvent;
    schemaChangedEvent: ModelCallbackRouter.SchemaChangedEvent;
    getActiveSchemaColumnsEvent: ModelCallbackRouter.GetActiveSchemaColumnsEvent;

    beginDataChangeEvent: ModelCallbackRouter.BeginDataChangeEvent;
    endDataChangeEvent: ModelCallbackRouter.EndDataChangeEvent;

    rowsInsertedEvent: ModelCallbackRouter.RowsInsertedEvent;
    rowsDeletedEvent: ModelCallbackRouter.RowsDeletedEvent;
    allRowsDeletedEvent: ModelCallbackRouter.AllRowsDeletedEvent;
    rowsLoadedEvent: ModelCallbackRouter.RowsLoadedEvent;
    rowsMovedEvent: ModelCallbackRouter.RowsMovedEvent;
    invalidateAllEvent: ModelCallbackRouter.InvalidateAllEvent;
    invalidateRowsEvent: ModelCallbackRouter.InvalidateRowsEvent;
    invalidateRowEvent: ModelCallbackRouter.InvalidateRowEvent;
    invalidateRowColumnsEvent: ModelCallbackRouter.InvalidateRowColumnsEvent;
    invalidateRowCellsEvent: ModelCallbackRouter.InvalidateRowCellsEvent;
    invalidateCellEvent: ModelCallbackRouter.InvalidateCellEvent;
    preReindexEvent: ModelCallbackRouter.PreReindexEvent;
    postReindexEvent: ModelCallbackRouter.PostReindexEvent;

    private _destroyed = false;
    private _enabled = false;
    private _schemaModel: SchemaModel | undefined;
    private _schemaCallbackListenerAdded = false;
    private _registeredDataModels = new Array<ModelCallbackRouter.RegisteredDataModel>();

    /** @internal */
    private readonly schemaModelCallbackListener: SchemaModel.CallbackListener = {
        beginChange: () => this.handleBeginSchemaChange(),
        endChange: () => this.handleEndSchemaChange(),
        columnsInserted: (columnIndex, columnCount) => this.handleColumnsInserted(columnIndex, columnCount),
        columnsDeleted: (columnIndex, columnCount) => this.handleColumnsDeleted(columnIndex, columnCount),
        allColumnsDeleted: () => this.handleAllColumnsDeleted(),
        schemaChanged: () => this.handleSchemaChanged(),
        getActiveSchemaColumns: () => this.handleGetActiveSchemaColumns(),
    }

    get enabled() { return this._enabled; }

    constructor(private readonly _gridProperties: GridProperties) {
    }

    destroy() {
        this.disable();
        this._destroyed = true;
    }

    reset() {
        this.disable();
        this._schemaModel = undefined;
        this._registeredDataModels.length = 0;
    }

    enable() {
        if (!this._enabled) {
            this._enabled = true;
            this.enableSchemaCallbacks();
            this.enableDataCallbacks();
        }
    }

    disable() {
        if (this._enabled) {
            this.disableDataCallbacks();
            this.disableSchemaCallbacks();
            this._enabled = false;
        }
    }

    setSchemaModel(schemaModel: SchemaModel) {
        this._schemaModel = schemaModel;
        if (this._enabled) {
            this.enableSchemaCallbacks();
        }
    }

    clearRegisteredDataModels() {
        this._registeredDataModels.length = 0;
    }

    registerDataModel(dataModel: DataModel) {
        const index = this._registeredDataModels.length;

        let callbackListener: DataModel.CallbackListener | undefined;
        if (dataModel.addDataCallbackListener !== undefined) {
            callbackListener = {
                beginChange: () => this.handleBeginDataChange(),
                endChange: () => this.handleEndDataChange(),
                rowsInserted: (rowIndex, rowCount) => this.handleRowsInserted(dataModel, rowIndex, rowCount),
                rowsDeleted: (rowIndex, rowCount) => this.handleRowsDeleted(dataModel, rowIndex, rowCount),
                allRowsDeleted: () => this.handleAllRowsDeleted(dataModel),
                rowsMoved: (oldRowIndex, newRowIndex, rowCount) => this.handleRowsMoved(dataModel, oldRowIndex, newRowIndex, rowCount),
                rowsLoaded: () => this.handleRowsLoaded(dataModel),
                invalidateAll: () => this.handleInvalidateAll(),
                invalidateRows: (rowIndex, count) => this.handleInvalidateRows(rowIndex, count),
                invalidateRow: (rowIndex) => this.handleInvalidateRow(rowIndex),
                invalidateRowColumns: (rowIndex, schemaColumnIndex, columnCount) =>
                    this.handleInvalidateRowColumns(rowIndex, schemaColumnIndex, columnCount),
                invalidateRowCells: (rowIndex, schemaColumnIndexes) => this.handleInvalidateRowCells(rowIndex, schemaColumnIndexes),
                invalidateCell: (schemaColumnIndex, rowIndex) => this.handleInvalidateCell(schemaColumnIndex, rowIndex),
                preReindex:  () => this.handleDataPreReindex(),
                postReindex: () => this.handleDataPostReindex(),
            }

            if (this._enabled && dataModel.addDataCallbackListener !== undefined) {
                dataModel.addDataCallbackListener(callbackListener);
            }
        }

        const registeredDataModel: ModelCallbackRouter.RegisteredDataModel = {
            dataModel,
            callbackListener,
        }
        this._registeredDataModels.push(registeredDataModel);

        return index;
    }

    private enableSchemaCallbacks() {
        if (this._schemaModel !== undefined) {
            if (this._schemaModel.addSchemaCallbackListener !== undefined) {
                this._schemaCallbackListenerAdded = true;
                this._schemaModel.addSchemaCallbackListener(this.schemaModelCallbackListener);
            }
        }
    }

    private disableSchemaCallbacks() {
        if (this._schemaModel !== undefined) {
            if (this._schemaCallbackListenerAdded && this._schemaModel.removeSchemaCallbackListener !== undefined) {
                this._schemaModel.removeSchemaCallbackListener(this.schemaModelCallbackListener);
                this._schemaCallbackListenerAdded = false;
            }
        }
    }

    private enableDataCallbacks() {
        for (const registeredDataModel of this._registeredDataModels) {
            const callbackListener = registeredDataModel.callbackListener;
            if (callbackListener !== undefined) {
                const dataModel = registeredDataModel.dataModel;
                if (dataModel.addDataCallbackListener !== undefined) {
                    dataModel.addDataCallbackListener(callbackListener);
                }
            }
        }
    }

    private disableDataCallbacks() {
        for (const registeredDataModel of this._registeredDataModels) {
            const callbackListener = registeredDataModel.callbackListener;
            if (callbackListener !== undefined) {
                const dataModel = registeredDataModel.dataModel;
                if (dataModel.removeDataCallbackListener !== undefined) {
                    dataModel.removeDataCallbackListener(callbackListener);
                }
            }
        }
    }

    getDataCallbackListener(index: number) {
        return this._registeredDataModels[index].callbackListener;
    }

    /** @internal */
    private handleBeginSchemaChange() {
        if (!this._destroyed) {
            this.beginSchemaChangeEvent();
        }
    }

    /** @internal */
    private handleEndSchemaChange() {
        if (!this._destroyed) {
            this.endSchemaChangeEvent();
        }
    }

    /** @internal */
    private handleColumnsInserted(columnIndex: number, columnCount: number) {
        if (!this._destroyed) {
            this.columnsInsertedEvent(columnIndex, columnCount);
        }
    }

    /** @internal */
    private handleColumnsDeleted(columnIndex: number, columnCount: number) {
        if (!this._destroyed) {
            this.columnsDeletedEvent(columnIndex, columnCount);
        }
    }

    /** @internal */
    private handleAllColumnsDeleted() {
        if (!this._destroyed) {
            this.allColumnsDeletedEvent();
        }
    }

    /** @internal */
    private handleSchemaChanged() {
        if (!this._destroyed) {
            this.schemaChangedEvent();
        }
    }

    /** @internal */
    private handleGetActiveSchemaColumns() {
        if (this._destroyed) {
            return [];
        } else {
            return this.getActiveSchemaColumnsEvent();
        }
    }

    /** @internal */
    private handleBeginDataChange() {
        if (!this._destroyed) {
            this.beginDataChangeEvent();
        }
    }

    /** @internal */
    private handleEndDataChange() {
        if (!this._destroyed) {
            this.endDataChangeEvent();
        }
    }

    /** @internal */
    private handleInvalidateAll() {
        if (!this._destroyed) {
            this.invalidateAllEvent();
        }
    }

    /** @internal */
    private handleInvalidateRows(rowIndex: number, count: number) {
        if (!this._destroyed) {
            this.invalidateRowsEvent(rowIndex, count);
        }
    }

    /** @internal */
    private handleInvalidateRow(rowIndex: number) {
        if (!this._destroyed) {
            this.invalidateRowEvent(rowIndex);
        }
    }

    /** @internal */
    private handleInvalidateRowColumns(rowIndex: number, schemaColumnIndex: number, columnCount: number) {
        if (!this._destroyed) {
            this.invalidateRowColumnsEvent(rowIndex, schemaColumnIndex, columnCount);
        }
    }

    /** @internal */
    private handleInvalidateRowCells(rowIndex: number, schemaColumnIndexes: number[]) {
        if (!this._destroyed) {
            this.invalidateRowCellsEvent(rowIndex, schemaColumnIndexes);
        }
    }

    /** @internal */
    private handleInvalidateCell(schemaColumnIndex: number, rowIndex: number) {
        if (!this._destroyed) {
            this.invalidateCellEvent(schemaColumnIndex, rowIndex);
        }
    }

    /** @internal */
    private handleRowsInserted(dataModel: DataModel, rowIndex: number, rowCount: number) {
        if (!this._destroyed) {
            this.rowsInsertedEvent(dataModel, rowIndex, rowCount);
        }
    }

    /** @internal */
    private handleRowsDeleted(dataModel: DataModel, rowIndex: number, rowCount: number) {
        if (!this._destroyed) {
            this.rowsDeletedEvent(dataModel, rowIndex, rowCount);
        }
    }

    /** @internal */
    private handleAllRowsDeleted(dataModel: DataModel) {
        if (!this._destroyed) {
            this.allRowsDeletedEvent(dataModel);
        }
    }

    /** @internal */
    private handleRowsMoved(dataModel: DataModel, oldRowIndex: number, newRowIndex: number, rowCount: number) {
        if (!this._destroyed) {
            this.rowsMovedEvent(dataModel, oldRowIndex, newRowIndex, rowCount);
        }
    }

    /** @internal */
    private handleRowsLoaded(dataModel: DataModel) {
        if (!this._destroyed) {
            this.rowsLoadedEvent(dataModel);
        }
    }

    /** @internal */
    private handleDataPreReindex() {
        if (!this._destroyed) {
            this.preReindexEvent();
        }
    }

    /** @internal */
    private handleDataPostReindex() {
        if (!this._destroyed) {
            this.postReindexEvent();
        }
    }
}

export namespace ModelCallbackRouter {
    export interface RegisteredDataModel {
        dataModel: DataModel;
        callbackListener: DataModel.CallbackListener | undefined;
    }

    export type GetLastModelUpdateIdEvent = (this: void) => ModelUpdateId;

    export type BeginSchemaChangeEvent = (this: void) => void;
    export type EndSchemaChangeEvent = (this: void) => void;

    export type ColumnsInsertedEvent = (this: void, columnIndex: number, columnCount: number) => void;
    export type ColumnsDeletedEvent = (this: void, columnIndex: number, columnCount: number) => void;
    export type AllColumnsDeletedEvent = () => void;
    export type SchemaChangedEvent = (this: void) => void;
    export type GetSchemaColumnEvent = (this: void, index: number) => SchemaModel.Column;
    export type GetActiveSchemaColumnsEvent = (this: void) => SchemaModel.Column[];

    export type BeginDataChangeEvent = (this: void) => void;
    export type EndDataChangeEvent = (this: void) => void;

    export type RowsInsertedEvent = (this: void, dataModel: DataModel, rowIndex: number, rowCount: number) => void;
    export type RowsDeletedEvent = (this: void, dataModel: DataModel, rowIndex: number, rowCount: number) => void;
    export type AllRowsDeletedEvent = (this: void, dataModel: DataModel) => void;
    export type RowsLoadedEvent = (this: void, dataModel: DataModel) => void;
    export type RowsMovedEvent = (this: void, dataModel: DataModel, oldRowIndex: number, newRowIndex: number, rowCount: number) => void;
    export type InvalidateAllEvent = (this: void) => void;
    export type InvalidateRowsEvent = (this: void, rowIndex: number, count: number) => void;
    export type InvalidateRowEvent = (this: void, rowIndex: number) => void;
    export type InvalidateRowColumnsEvent = (this: void, rowIndex: number, schemaColumnIndex: number, columnCount: number) => void;
    export type InvalidateRowCellsEvent = (this: void, rowIndex: number, schemaColumnIndexes: number[]) => void;
    export type InvalidateCellEvent = (this: void, schemaColumnIndex: number, rowIndex: number) => void;
    export type PreReindexEvent = (this: void) => void;
    export type PostReindexEvent = (this: void) => void;
    export type GridEvent = <T extends EventName>(this: void, eventName: T, eventDetail: EventName.DetailMap[T] | undefined) => void;

    export type SchemaUpdatedListener = (this: void) => void;
}
