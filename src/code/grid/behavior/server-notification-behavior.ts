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
        beginChange: () => { this.handleBeginSchemaChange(); },
        endChange: () => { this.handleEndSchemaChange(); },
        fieldsInserted: (fieldIndex, fieldCount) => { this.handleFieldsInserted(fieldIndex, fieldCount); },
        fieldsDeleted: (fieldIndex, fieldCount) => { this.handleFieldsDeleted(fieldIndex, fieldCount); },
        allFieldsDeleted: () => { this.handleAllFieldsDeleted(); },
        schemaChanged: () => { this.handleSchemaChanged(); },
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
                beginChange: () => { this.handleBeginDataChange(); },
                endChange: () => { this.handleEndDataChange(); },
                rowsInserted: (subgridRowIndex, rowCount) => { this.handleRowsInserted(dataServer, subgridRowIndex, rowCount); },
                rowsDeleted: (subgridRowIndex, rowCount) => { this.handleRowsDeleted(dataServer, subgridRowIndex, rowCount); },
                allRowsDeleted: () => { this.handleAllRowsDeleted(dataServer); },
                rowsMoved: (
                    oldSubgridRowIndex,
                    newSubgridRowIndex,
                    rowCount
                ) => { this.handleRowsMoved(dataServer, oldSubgridRowIndex, newSubgridRowIndex, rowCount); },
                rowsLoaded: () => { this.handleRowsLoaded(dataServer); },
                invalidateAll: () => { this.handleInvalidateAll(dataServer); },
                invalidateRows: (subgridRowIndex, count) => { this.handleInvalidateRows(dataServer, subgridRowIndex, count); },
                invalidateRow: (subgridRowIndex) => { this.handleInvalidateRow(dataServer, subgridRowIndex); },
                invalidateRowColumns: (subgridRowIndex, schemaColumnIndex, columnCount) => {
                    this.handleInvalidateRowColumns(dataServer, subgridRowIndex, schemaColumnIndex, columnCount);
                },
                invalidateRowCells: (
                    subgridRowIndex,
                    schemaColumnIndexes
                ) => { this.handleInvalidateRowCells(dataServer, subgridRowIndex, schemaColumnIndexes); },
                invalidateCell: (
                    schemaColumnIndex,
                    subgridRowIndex
                ) => { this.handleInvalidateCell(dataServer, schemaColumnIndex, subgridRowIndex); },
                preReindex:  () => { this.handleDataPreReindex(); },
                postReindex: (allRowsKept) => { this.handleDataPostReindex(allRowsKept); },
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
                for (let fieldIndex = index; fieldIndex < nextRange; fieldIndex++) {
                    // In the future, should consolidate into activeIndex ranges instead of doing individually
                    const activeIndex = this._columnsManager.getActiveColumnIndexByFieldIndex(fieldIndex);
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
            const subgrid = this._subgridsManager.getSubgridWithDataServer(dataServer);
            this._renderer.invalidateSubgrid(subgrid);
            this._focus.invalidateSubgrid(subgrid);
        }
    }

    /** @internal */
    private handleInvalidateRows(dataServer: DataServer<SF>, subgridRowIndex: number, count: number) {
        if (!this._destroyed) {
            this._renderer.serverNotified();
            const subgrid = this._subgridsManager.getSubgridWithDataServer(dataServer);
            this._renderer.invalidateSubgridRows(subgrid, subgridRowIndex, count);
            this._focus.invalidateSubgridRows(subgrid, subgridRowIndex, count);
        }
    }

    /** @internal */
    private handleInvalidateRow(dataServer: DataServer<SF>, subgridRowIndex: number) {
        if (!this._destroyed) {
            this._renderer.serverNotified();
            const subgrid = this._subgridsManager.getSubgridImplementationWithDataServer(dataServer);
            this._renderer.invalidateSubgridRow(subgrid, subgridRowIndex);
            this._focus.invalidateSubgridRow(subgrid, subgridRowIndex);
        }
    }

    /** @internal */
    private handleInvalidateRowColumns(dataServer: DataServer<SF>, subgridRowIndex: number, schemaColumnIndex: number, columnCount: number) {
        if (!this._destroyed) {
            this._renderer.serverNotified();
            const subgrid = this._subgridsManager.getSubgridImplementationWithDataServer(dataServer);
            const activeColumnIndices = new Array<number>(columnCount);
            const afterSchemaColumnIndex = schemaColumnIndex + columnCount;
            for (let fieldIndex = schemaColumnIndex; fieldIndex < afterSchemaColumnIndex; fieldIndex++) {
                activeColumnIndices[fieldIndex] = this._columnsManager.getActiveColumnIndexByFieldIndex(fieldIndex);
            }
            this._renderer.invalidateSubgridRowCells(subgrid, subgridRowIndex, activeColumnIndices);
            this._focus.invalidateSubgridRowCells(subgrid, subgridRowIndex, activeColumnIndices);
        }
    }

    /** @internal */
    private handleInvalidateRowCells(dataServer: DataServer<SF>, subgridRowIndex: number, schemaColumnIndexes: number[]) {
        if (!this._destroyed) {
            this._renderer.serverNotified();
            const subgrid = this._subgridsManager.getSubgridImplementationWithDataServer(dataServer);
            const columnCount = schemaColumnIndexes.length;
            const activeColumnIndices = new Array<number>(columnCount);
            for (let i = 0; i < columnCount; i++) {
                activeColumnIndices[i] = this._columnsManager.getActiveColumnIndexByFieldIndex(schemaColumnIndexes[i]);
            }
            this._renderer.invalidateSubgridRowCells(subgrid, subgridRowIndex, activeColumnIndices);
            this._focus.invalidateSubgridRowCells(subgrid, subgridRowIndex, activeColumnIndices);
        }
    }

    /** @internal */
    private handleInvalidateCell(dataServer: DataServer<SF>, schemaColumnIndex: number, subgridRowIndex: number) {
        if (!this._destroyed) {
            this._renderer.serverNotified();
            const subgrid = this._subgridsManager.getSubgridImplementationWithDataServer(dataServer);
            const activeColumnIndex = this._columnsManager.getActiveColumnIndexByFieldIndex(schemaColumnIndex);
            this._renderer.invalidateSubgridCell(subgrid, activeColumnIndex, subgridRowIndex);
            this._focus.invalidateSubgridCell(subgrid, activeColumnIndex, subgridRowIndex);
        }
    }

    /** @internal */
    private handleRowsInserted(dataServer: DataServer<SF>, subgridRowIndex: number, count: number) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.serverNotified();
                this._focus.adjustForRowsInserted(subgridRowIndex, count, dataServer);
                this._selection.adjustForRowsInserted(subgridRowIndex, count, dataServer);
                this._viewLayout.invalidateDataRowsInserted(subgridRowIndex, count);
            } finally {
                this.endDataChange();
            }
        }
    }

    /** @internal */
    private handleRowsDeleted(dataServer: DataServer<SF>, subgridRowIndex: number, count: number) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.serverNotified();
                this._focus.adjustForRowsDeleted(subgridRowIndex, count, dataServer);
                this._selection.adjustForRowsDeleted(subgridRowIndex, count, dataServer);
                this._viewLayout.invalidateDataRowsDeleted(subgridRowIndex, count);
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
    private handleRowsMoved(dataServer: DataServer<SF>, oldSubgridRowIndex: number, newSubgridRowIndex: number, rowCount: number) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.serverNotified();
                this._focus.adjustForRowsMoved(oldSubgridRowIndex, newSubgridRowIndex, rowCount, dataServer);
                this._selection.adjustForRowsMoved(oldSubgridRowIndex, newSubgridRowIndex, rowCount, dataServer);
                this._viewLayout.invalidateDataRowsMoved(oldSubgridRowIndex, newSubgridRowIndex, rowCount);
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
