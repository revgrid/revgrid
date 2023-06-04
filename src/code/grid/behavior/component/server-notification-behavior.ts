import { ColumnsManager } from '../../components/column/columns-manager';
import { EventName } from '../../components/event/event-name';
import { Focus } from '../../components/focus/focus';
import { Renderer } from '../../components/renderer/renderer';
import { Selection } from '../../components/selection/selection';
import { SubgridImplementation } from '../../components/subgrid/subgrid-implementation';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../components/view/view-layout';
import { DataServer } from '../../interfaces/data/data-server';
import { SchemaServer } from '../../interfaces/schema/schema-server';
import { MergableColumnSettings } from '../../interfaces/settings/mergable-column-settings';
import { MergableGridSettings } from '../../interfaces/settings/mergable-grid-settings';
import { ReindexBehavior } from './reindex-behavior';

export class ServerNotificationBehavior<MGS extends MergableGridSettings, MCS extends MergableColumnSettings> {
    private readonly _schemaServer: SchemaServer<MCS>;
    private readonly _subgrids: SubgridImplementation<MGS, MCS>[];
    private readonly _mainDataServer: DataServer<MCS>;

    private _destroyed = false;
    private _notificationsEnabled = false;
    private _schemaNotificationsSubscribed = false;

    /** @internal */
    private readonly schemaServerNotificationsClient: SchemaServer.NotificationsClient<MCS> = {
        beginChange: () => this.handleBeginSchemaChange(),
        endChange: () => this.handleEndSchemaChange(),
        columnsInserted: (columnIndex, columnCount) => this.handleColumnsInserted(columnIndex, columnCount),
        columnsDeleted: (columnIndex, columnCount) => this.handleColumnsDeleted(columnIndex, columnCount),
        allColumnsDeleted: () => this.handleAllColumnsDeleted(),
        schemaChanged: () => this.handleSchemaChanged(),
        getActiveSchemaColumns: () => this.handleGetActiveSchemaColumns(),
    }

    constructor(
        private readonly _columnsManager: ColumnsManager<MGS, MCS>,
        private readonly _subgridsManager: SubgridsManager<MGS, MCS>,
        private readonly _viewLayout: ViewLayout<MGS, MCS>,
        private readonly _focus: Focus<MGS, MCS>,
        private readonly _selection: Selection<MGS, MCS>,
        private readonly _renderer: Renderer<MGS, MCS>,
        private readonly _reindexStashManager: ReindexBehavior<MGS, MCS>,
    ) {
        this._schemaServer = this._columnsManager.schemaServer;
        this._subgrids = this._subgridsManager.subgrids;
        this._mainDataServer = this._subgridsManager.mainSubgrid.dataServer;

        const subgrids = this._subgridsManager.subgrids;
        for (const subgrid of subgrids) {
            const dataServer = subgrid.dataServer;
            const notificationsClient: DataServer.NotificationsClient = {
                beginChange: () => this.handleBeginDataChange(),
                endChange: () => this.handleEndDataChange(),
                rowsInserted: (rowIndex, rowCount) => this.handleRowsInserted(dataServer, rowIndex, rowCount),
                rowsDeleted: (rowIndex, rowCount) => this.handleRowsDeleted(dataServer, rowIndex, rowCount),
                allRowsDeleted: () => this.handleAllRowsDeleted(dataServer),
                rowsMoved: (oldRowIndex, newRowIndex, rowCount) => this.handleRowsMoved(dataServer, oldRowIndex, newRowIndex, rowCount),
                rowsLoaded: () => this.handleRowsLoaded(dataServer),
                invalidateAll: () => this.handleInvalidateAll(dataServer),
                invalidateRows: (rowIndex, count) => this.handleInvalidateRows(dataServer, rowIndex, count),
                invalidateRow: (rowIndex) => this.handleInvalidateRow(dataServer, rowIndex),
                invalidateRowColumns: (rowIndex, schemaColumnIndex, columnCount) =>
                    this.handleInvalidateRowColumns(dataServer, rowIndex, schemaColumnIndex, columnCount),
                invalidateRowCells: (rowIndex, schemaColumnIndexes) => this.handleInvalidateRowCells(dataServer, rowIndex, schemaColumnIndexes),
                invalidateCell: (schemaColumnIndex, rowIndex) => this.handleInvalidateCell(dataServer, schemaColumnIndex, rowIndex),
                preReindex:  () => this.handleDataPreReindex(),
                postReindex: () => this.handleDataPostReindex(),
            };

            subgrid.setDataNotificationsClient(notificationsClient);

            // if (this._notificationsEnabled && dataServer.subscribeNotifications !== undefined) {
            //     dataServer.subscribeNotifications(notificationsClient);
            // }

        }
    }

    destroy() {
        this.disableNotifications();
        this._destroyed = true;
    }

    reset() {
        this.disableNotifications();
    }

    enableNotifications() {
        if (!this._notificationsEnabled) {
            this._notificationsEnabled = true;
            this.enableSchemaNotifications();
            this.enableDataNotifications();
        }
    }

    disableNotifications() {
        if (this._notificationsEnabled) {
            this.disableDataNotifications();
            this.disableSchemaNotifications();
            this._notificationsEnabled = false;
        }
    }

    private enableSchemaNotifications() {
        if (this._schemaServer.subscribeSchemaNotifications !== undefined) {
            this._schemaNotificationsSubscribed = true;
            this._schemaServer.subscribeSchemaNotifications(this.schemaServerNotificationsClient);
        }
    }

    private disableSchemaNotifications() {
        if (this._schemaNotificationsSubscribed && this._schemaServer.unsubscribeSchemaNotifications !== undefined) {
            this._schemaServer.unsubscribeSchemaNotifications(this.schemaServerNotificationsClient);
            this._schemaNotificationsSubscribed = false;
        }
    }

    private enableDataNotifications() {
        for (const subgrid of this._subgrids) {
            subgrid.trySubscribeDataNotifications();
        }
    }

    private disableDataNotifications() {
        for (const subgrid of this._subgrids) {
            subgrid.tryUnsubscribeDataNotifications();
        }
    }

    /** @internal */
    private handleBeginSchemaChange() {
        if (!this._destroyed) {
            this.beginSchemaChange();
        }
    }

    /** @internal */
    private handleEndSchemaChange() {
        if (!this._destroyed) {
            this.endSchemaChange();
        }
    }

    /** @internal */
    private handleColumnsInserted(index: number, count: number) {
        if (!this._destroyed) {
            this.beginSchemaChange();
            try {
                this._renderer.modelUpdated();
                this._columnsManager.schemaColumnsInserted(index, count);
                // Currently cannot calculate active Column Index of added columns so cannot advise SelectionModel of change
                // or advise Renderer of column index
                this._viewLayout.invalidateColumnsInserted(index, count);
            } finally {
                this.endSchemaChange();
            }
        }
    }

    /** @internal */
    private handleColumnsDeleted(index: number, count: number) {
        if (!this._destroyed) {
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
                        this._viewLayout.invalidateActiveColumnsDeleted(activeIndex, 1);
                    }
                }
            } finally {
                this.endSchemaChange();
            }
        }
    }

    /** @internal */
    private handleAllColumnsDeleted() {
        if (!this._destroyed) {
            this.beginSchemaChange();
            try {
                this._renderer.modelUpdated();
                this._columnsManager.allSchemaColumnsDeleted();
                this._focus.clear();
                this._selection.clear();
                this._viewLayout.invalidateAllColumnsDeleted();
            } finally {
                this.endSchemaChange();
            }
        }
    }

    /** @internal */
    private handleSchemaChanged() {
        if (!this._destroyed) {
            this.beginSchemaChange();
            try {
                this._renderer.modelUpdated();
                this._columnsManager.schemaColumnsChanged();
                this._focus.clear();
                this._selection.clear();
                this._viewLayout.invalidateColumnsChanged();
            } finally {
                this.endSchemaChange();
            }
        }
    }

    /** @internal */
    private handleGetActiveSchemaColumns() {
        if (this._destroyed) {
            return [];
        } else {
            return this._columnsManager.activeColumns.map((column) => column.schemaColumn);
        }
    }

    /** @internal */
    private handleBeginDataChange() {
        if (!this._destroyed) {
            this.beginDataChange();
        }
    }

    /** @internal */
    private handleEndDataChange() {
        if (!this._destroyed) {
            this.endDataChange();
        }
    }

    /** @internal */
    private handleInvalidateAll(dataServer: DataServer<MCS>) {
        if (!this._destroyed) {
            this._renderer.modelUpdated();
            this._renderer.invalidateAllData();
        }
    }

    /** @internal */
    private handleInvalidateRows(_dataServer: DataServer<MCS>, rowIndex: number, count: number) {
        if (!this._destroyed) {
            this._renderer.modelUpdated();
            this._renderer.invalidateDataRows(rowIndex, count);
        }
    }

    /** @internal */
    private handleInvalidateRow(_dataServer: DataServer<MCS>, rowIndex: number) {
        if (!this._destroyed) {
            this._renderer.modelUpdated();
            this._renderer.invalidateDataRow(rowIndex);
        }
    }

    /** @internal */
    private handleInvalidateRowColumns(_dataServer: DataServer<MCS>, rowIndex: number, _schemaColumnIndex: number, _columnCount: number) {
        if (!this._destroyed) {
            this._renderer.modelUpdated();
            this._renderer.invalidateDataRow(rowIndex); // this should be improved to use this._renderer.invalidateRowColumns()
        }
    }

    /** @internal */
    private handleInvalidateRowCells(_dataServer: DataServer<MCS>, rowIndex: number, schemaColumnIndexes: number[]) {
        if (!this._destroyed) {
            this._renderer.modelUpdated();
            this._renderer.invalidateDataRowCells(rowIndex, schemaColumnIndexes);
        }
    }

    /** @internal */
    private handleInvalidateCell(_dataServer: DataServer<MCS>, schemaColumnIndex: number, rowIndex: number) {
        if (!this._destroyed) {
            this._renderer.modelUpdated();
            this._renderer.invalidateDataCell(schemaColumnIndex, rowIndex);
        }
    }

    /** @internal */
    private handleRowsInserted(dataServer: DataServer<MCS>, index: number, count: number) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.modelUpdated();
                this._focus.adjustForRowsInserted(index, count, dataServer);
                this._selection.adjustForRowsInserted(index, count, dataServer);
                this._viewLayout.invalidateDataRowsInserted(index, count);
            } finally {
                this.endDataChange();
            }
        }
    }

    /** @internal */
    private handleRowsDeleted(dataServer: DataServer<MCS>, index: number, count: number) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.modelUpdated();
                this._focus.adjustForRowsDeleted(index, count, dataServer);
                this._selection.adjustForRowsDeleted(index, count, dataServer);
                this._viewLayout.invalidateDataRowsDeleted(index, count);
            } finally {
                this.endDataChange();
            }
        }
    }

    /** @internal */
    private handleAllRowsDeleted(dataServer: DataServer<MCS>) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.modelUpdated();
                if (dataServer === this._mainDataServer) {
                    this._focus.clear();
                    this._selection.clear();
                }
                this._viewLayout.invalidateAllDataRowsDeleted();
            } finally {
                this.endDataChange();
            }
        }
    }

    /** @internal */
    private handleRowsMoved(dataServer: DataServer<MCS>, oldRowIndex: number, newRowIndex: number, rowCount: number) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.modelUpdated();
                this._focus.adjustForRowsMoved(oldRowIndex, newRowIndex, rowCount, dataServer);
                this._selection.adjustForRowsMoved(oldRowIndex, newRowIndex, rowCount, dataServer);
                this._viewLayout.invalidateDataRowsMoved(oldRowIndex, newRowIndex, rowCount);
            } finally {
                this.endDataChange();
            }
        }
    }

    /** @internal */
    private handleRowsLoaded(dataServer: DataServer<MCS>) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.modelUpdated();
                if (dataServer === this._mainDataServer) {
                    this._focus.clear();
                    this._selection.clear();
                }
                this._viewLayout.invalidateDataRowsLoaded();
            } finally {
                this.endDataChange();
            }
        }
    }

    /** @internal */
    private handleDataPreReindex() {
        if (!this._destroyed) {
            this._reindexStashManager.stash();
            this._renderer.modelUpdated();
        }
    }

    /** @internal */
    private handleDataPostReindex() {
        if (!this._destroyed) {
            this._reindexStashManager.unstash();
            this._viewLayout.invalidateVerticalAll(false);
            this._renderer.modelUpdated();
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

}

export namespace ServerNotificationBehavior {
    export type BeginSchemaChangeEvent = (this: void) => void;
    export type EndSchemaChangeEvent = (this: void) => void;

    export type ColumnsInsertedEvent = (this: void, columnIndex: number, columnCount: number) => void;
    export type ColumnsDeletedEvent = (this: void, columnIndex: number, columnCount: number) => void;
    export type AllColumnsDeletedEvent = () => void;
    export type SchemaChangedEvent = (this: void) => void;
    export type GetSchemaColumnEvent<MCS extends MergableColumnSettings> = (this: void, index: number) => SchemaServer.Column<MCS>;
    export type GetActiveSchemaColumnsEvent<MCS extends MergableColumnSettings> = (this: void) => SchemaServer.Column<MCS>[];

    export type BeginDataChangeEvent = (this: void) => void;
    export type EndDataChangeEvent = (this: void) => void;

    export type RowsInsertedEvent<MCS extends MergableColumnSettings> = (this: void, dataModel: DataServer<MCS>, rowIndex: number, rowCount: number) => void;
    export type RowsDeletedEvent<MCS extends MergableColumnSettings> = (this: void, dataModel: DataServer<MCS>, rowIndex: number, rowCount: number) => void;
    export type AllRowsDeletedEvent<MCS extends MergableColumnSettings> = (this: void, dataModel: DataServer<MCS>) => void;
    export type RowsLoadedEvent<MCS extends MergableColumnSettings> = (this: void, dataModel: DataServer<MCS>) => void;
    export type RowsMovedEvent<MCS extends MergableColumnSettings> = (this: void, dataModel: DataServer<MCS>, oldRowIndex: number, newRowIndex: number, rowCount: number) => void;
    export type InvalidateAllEvent = (this: void) => void;
    export type InvalidateRowsEvent = (this: void, rowIndex: number, count: number) => void;
    export type InvalidateRowEvent = (this: void, rowIndex: number) => void;
    export type InvalidateRowColumnsEvent = (this: void, rowIndex: number, schemaColumnIndex: number, columnCount: number) => void;
    export type InvalidateRowCellsEvent = (this: void, rowIndex: number, schemaColumnIndexes: number[]) => void;
    export type InvalidateCellEvent = (this: void, schemaColumnIndex: number, rowIndex: number) => void;
    export type PreReindexEvent = (this: void) => void;
    export type PostReindexEvent = (this: void) => void;
    export type GridEvent<MCS extends MergableColumnSettings> = <T extends EventName<MCS>>(this: void, eventName: T, eventDetail: EventName.DetailMap<MCS>[T] | undefined) => void;

    export type SchemaUpdatedListener = (this: void) => void;
}
