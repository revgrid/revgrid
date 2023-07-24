import { ColumnsManager } from '../components/column/columns-manager';
import { Focus } from '../components/focus/focus';
import { Renderer } from '../components/renderer/renderer';
import { Selection } from '../components/selection/selection';
import { SubgridImplementation } from '../components/subgrid/subgrid-implementation';
import { SubgridsManager } from '../components/subgrid/subgrids-manager';
import { ViewLayout } from '../components/view/view-layout';
import { DataServer } from '../interfaces/data/data-server';
import { SchemaField } from '../interfaces/schema/schema-field';
import { SchemaServer } from '../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../interfaces/settings/behaviored-grid-settings';
import { RevgridObject } from '../types-utils/revgrid-object';
import { ReindexBehavior } from './reindex-behavior';

export class ServerNotificationBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> implements RevgridObject {
    private readonly _schemaServer: SchemaServer<SF>;
    private readonly _subgrids: SubgridImplementation<BCS, SF>[];
    private readonly _mainDataServer: DataServer<SF>;

    private _destroyed = false;
    private _notificationsEnabled = false;
    private _schemaNotificationsSubscribed = false;

    /** @internal */
    private readonly schemaServerNotificationsClient: SchemaServer.NotificationsClient<SF> = {
        beginChange: () => this.handleBeginSchemaChange(),
        endChange: () => this.handleEndSchemaChange(),
        fieldsInserted: (fieldIndex, fieldCount) => this.handleFieldsInserted(fieldIndex, fieldCount),
        fieldsDeleted: (fieldIndex, fieldCount) => this.handleFieldsDeleted(fieldIndex, fieldCount),
        allFieldsDeleted: () => this.handleAllFieldsDeleted(),
        schemaChanged: () => this.handleSchemaChanged(),
        getActiveSchemaFields: () => this.handleGetActiveSchemaFields(),
    }

    constructor(
        readonly revgridId: string,
        readonly internalParent: RevgridObject,
        private readonly _columnsManager: ColumnsManager<BCS, SF>,
        private readonly _subgridsManager: SubgridsManager<BCS, SF>,
        private readonly _viewLayout: ViewLayout<BGS, BCS, SF>,
        private readonly _focus: Focus<BGS, BCS, SF>,
        private readonly _selection: Selection<BCS, SF>,
        private readonly _renderer: Renderer<BGS, BCS, SF>,
        private readonly _reindexStashManager: ReindexBehavior<BGS, BCS, SF>,
    ) {
        this._schemaServer = this._columnsManager.schemaServer;
        this._subgrids = this._subgridsManager.subgridImplementations;
        this._mainDataServer = this._subgridsManager.mainSubgrid.dataServer;

        const subgrids = this._subgrids;
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
                postReindex: (allRowsKept) => this.handleDataPostReindex(allRowsKept),
            };

            subgrid.setDataNotificationsClient(notificationsClient);

            // if (this._notificationsEnabled && dataServer.subscribeNotifications !== undefined) {
            //     dataServer.subscribeNotifications(notificationsClient);
            // }

        }
    }

    get notificationsEnabled() { return this._notificationsEnabled; }

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
    private handleFieldsInserted(index: number, count: number) {
        if (!this._destroyed) {
            this.beginSchemaChange();
            try {
                this._renderer.serverNotified();
                this._columnsManager.schemaFieldsInserted(index, count);
                // Currently cannot calculate active Column Index of added columns so cannot advise SelectionModel of change
                // or advise Renderer of column index
                this._viewLayout.invalidateFieldsInserted(index, count);
            } finally {
                this.endSchemaChange();
            }
        }
    }

    /** @internal */
    private handleFieldsDeleted(index: number, count: number) {
        if (!this._destroyed) {
            this.beginSchemaChange();
            try {
                this._renderer.serverNotified();
                this._columnsManager.schemaFieldsDeleted(index, count);
                const nextRange = index + count;
                for (let i = index; i < nextRange; i++) {
                    // In the future, should consolidate into activeIndex ranges instead of doing individually
                    const activeIndex = this._columnsManager.getActiveColumnIndexByFieldIndex(i);
                    if (activeIndex >= 0) {
                        this._focus.adjustForActiveColumnsDeleted(activeIndex, 1);
                        this._selection.adjustForActiveColumnsDeleted(activeIndex, 1);
                        this._viewLayout.invalidateActiveColumnsDeleted(activeIndex, 1);
                    }
                }
            } finally {
                this.endSchemaChange();
            }
        }
    }

    /** @internal */
    private handleAllFieldsDeleted() {
        if (!this._destroyed) {
            this.beginSchemaChange();
            try {
                this._renderer.serverNotified();
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
                this._renderer.serverNotified();
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
    private handleGetActiveSchemaFields() {
        if (this._destroyed) {
            return [];
        } else {
            return this._columnsManager.activeColumns.map((column) => column.field);
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
    private handleInvalidateAll(dataServer: DataServer<SF>) {
        if (!this._destroyed) {
            this._renderer.serverNotified();
            this._renderer.invalidateAllData();
        }
    }

    /** @internal */
    private handleInvalidateRows(_dataServer: DataServer<SF>, rowIndex: number, count: number) {
        if (!this._destroyed) {
            this._renderer.serverNotified();
            this._renderer.invalidateDataRows(rowIndex, count);
        }
    }

    /** @internal */
    private handleInvalidateRow(_dataServer: DataServer<SF>, rowIndex: number) {
        if (!this._destroyed) {
            this._renderer.serverNotified();
            this._renderer.invalidateDataRow(rowIndex);
        }
    }

    /** @internal */
    private handleInvalidateRowColumns(_dataServer: DataServer<SF>, rowIndex: number, _schemaColumnIndex: number, _columnCount: number) {
        if (!this._destroyed) {
            this._renderer.serverNotified();
            this._renderer.invalidateDataRow(rowIndex); // this should be improved to use tshis._renderer.invalidateRowColumns()
        }
    }

    /** @internal */
    private handleInvalidateRowCells(_dataServer: DataServer<SF>, rowIndex: number, schemaColumnIndexes: number[]) {
        if (!this._destroyed) {
            this._renderer.serverNotified();
            this._renderer.invalidateDataRowCells(rowIndex, schemaColumnIndexes);
        }
    }

    /** @internal */
    private handleInvalidateCell(_dataServer: DataServer<SF>, schemaColumnIndex: number, rowIndex: number) {
        if (!this._destroyed) {
            this._renderer.serverNotified();
            this._renderer.invalidateDataCell(schemaColumnIndex, rowIndex);
        }
    }

    /** @internal */
    private handleRowsInserted(dataServer: DataServer<SF>, index: number, count: number) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.serverNotified();
                this._focus.adjustForRowsInserted(index, count, dataServer);
                this._selection.adjustForRowsInserted(index, count, dataServer);
                this._viewLayout.invalidateDataRowsInserted(index, count);
            } finally {
                this.endDataChange();
            }
        }
    }

    /** @internal */
    private handleRowsDeleted(dataServer: DataServer<SF>, index: number, count: number) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.serverNotified();
                this._focus.adjustForRowsDeleted(index, count, dataServer);
                this._selection.adjustForRowsDeleted(index, count, dataServer);
                this._viewLayout.invalidateDataRowsDeleted(index, count);
            } finally {
                this.endDataChange();
            }
        }
    }

    /** @internal */
    private handleAllRowsDeleted(dataServer: DataServer<SF>) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.serverNotified();
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
    private handleRowsMoved(dataServer: DataServer<SF>, oldRowIndex: number, newRowIndex: number, rowCount: number) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.serverNotified();
                this._focus.adjustForRowsMoved(oldRowIndex, newRowIndex, rowCount, dataServer);
                this._selection.adjustForRowsMoved(oldRowIndex, newRowIndex, rowCount, dataServer);
                this._viewLayout.invalidateDataRowsMoved(oldRowIndex, newRowIndex, rowCount);
            } finally {
                this.endDataChange();
            }
        }
    }

    /** @internal */
    private handleRowsLoaded(dataServer: DataServer<SF>) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.serverNotified();
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
            this._renderer.serverNotified();
        }
    }

    /** @internal */
    private handleDataPostReindex(allRowsKept: boolean) {
        if (!this._destroyed) {
            this._reindexStashManager.unstash(allRowsKept);
            this._viewLayout.invalidateVerticalAll(false);
            this._renderer.serverNotified();
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
