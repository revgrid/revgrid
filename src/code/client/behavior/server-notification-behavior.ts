import { RevApiError, RevClientObject, RevDataServer, RevSchemaField, RevSchemaServer } from '../../common';
import { RevColumnsManager } from '../components/column/columns-manager';
import { RevFocus } from '../components/focus/focus';
import { RevRenderer } from '../components/renderer/renderer';
import { RevSelection } from '../components/selection/selection';
import { RevSubgridImplementation } from '../components/subgrid/subgrid-implementation';
import { RevSubgridsManager } from '../components/subgrid/subgrids-manager';
import { RevViewLayout } from '../components/view/view-layout';
import { RevSubgrid } from '../interfaces';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../settings';
import { RevEventBehavior } from './event-behavior';
import { RevReindexBehavior } from './reindex-behavior';

export class RevServerNotificationBehavior<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    private readonly _schemaServer: RevSchemaServer<SF>;
    private readonly _subgrids: RevSubgridImplementation<BCS, SF>[];
    private readonly _mainDataServer: RevDataServer<SF>;
    private readonly _rowListChangedDataServers: RevDataServer<SF>[];

    private _destroyed = false;
    private _notificationsEnabled = false;
    private _schemaNotificationsSubscribed = false;

    private _beginDataChangeCount = 0;
    private _rowListChangedDataServerCount = 0;

    /** @internal */
    private readonly schemaServerNotificationsClient: RevSchemaServer.NotificationsClient<SF> = {
        beginChange: () => { this.handleBeginSchemaChange(); },
        endChange: () => { this.handleEndSchemaChange(); },
        fieldsInserted: (fieldIndex, fieldCount) => { this.handleFieldsInserted(fieldIndex, fieldCount); },
        fieldsDeleted: (fieldIndex, fieldCount) => { this.handleFieldsDeleted(fieldIndex, fieldCount); },
        allFieldsDeleted: () => { this.handleAllFieldsDeleted(); },
        schemaChanged: () => { this.handleSchemaChanged(); },
        getActiveSchemaFields: () => this.handleGetActiveSchemaFields(),
    }

    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        private readonly _columnsManager: RevColumnsManager<BCS, SF>,
        private readonly _subgridsManager: RevSubgridsManager<BCS, SF>,
        private readonly _viewLayout: RevViewLayout<BGS, BCS, SF>,
        private readonly _focus: RevFocus<BGS, BCS, SF>,
        private readonly _selection: RevSelection<BGS, BCS, SF>,
        private readonly _renderer: RevRenderer<BGS, BCS, SF>,
        private readonly _eventBehavior: RevEventBehavior<BGS, BCS, SF>,
        private readonly _reindexStashManager: RevReindexBehavior<BGS, BCS, SF>,
    ) {
        this._schemaServer = this._columnsManager.schemaServer;
        this._subgrids = this._subgridsManager.subgridImplementations;
        const subgrids = this._subgrids;
        const subgridCount = subgrids.length;
        this._rowListChangedDataServers = new Array<RevDataServer<SF>>(subgridCount);
        this._mainDataServer = this._subgridsManager.mainSubgrid.dataServer;

        for (let i = 0; i < subgridCount; i++) {
            const subgrid = subgrids[i];
            const dataServer = subgrid.dataServer;
            const notificationsClient: RevDataServer.NotificationsClient = {
                beginChange: () => { this.handleBeginDataChange(); },
                endChange: () => { this.handleEndDataChange(); },
                rowsInserted: (subgridRowIndex, rowCount) => { this.handleRowsInserted(subgrid, subgridRowIndex, rowCount); },
                rowsDeleted: (subgridRowIndex, rowCount) => { this.handleRowsDeleted(subgrid, subgridRowIndex, rowCount); },
                allRowsDeleted: () => { this.handleAllRowsDeleted(dataServer); },
                rowsMoved: (
                    oldSubgridRowIndex,
                    newSubgridRowIndex,
                    rowCount
                ) => { this.handleRowsMoved(subgrid, oldSubgridRowIndex, newSubgridRowIndex, rowCount); },
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
                postReindex: (allRowsKept) => { this.handleDataPostReindex(dataServer, allRowsKept); },
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
        if (this._schemaNotificationsSubscribed) {
            throw new RevApiError('SNBESN44998', 'Schema notifications already enabled');
        } else {
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
                // or advise RevRenderer of column index
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
    private handleInvalidateAll(dataServer: RevDataServer<SF>) {
        if (!this._destroyed) {
            this._renderer.serverNotified();
            const subgrid = this._subgridsManager.getSubgridWithDataServer(dataServer);
            this._renderer.invalidateSubgrid(subgrid);
            this._focus.invalidateSubgrid(subgrid);
        }
    }

    /** @internal */
    private handleInvalidateRows(dataServer: RevDataServer<SF>, subgridRowIndex: number, count: number) {
        if (!this._destroyed) {
            this._renderer.serverNotified();
            const subgrid = this._subgridsManager.getSubgridWithDataServer(dataServer);
            this._renderer.invalidateSubgridRows(subgrid, subgridRowIndex, count);
            this._focus.invalidateSubgridRows(subgrid, subgridRowIndex, count);
        }
    }

    /** @internal */
    private handleInvalidateRow(dataServer: RevDataServer<SF>, subgridRowIndex: number) {
        if (!this._destroyed) {
            this._renderer.serverNotified();
            const subgrid = this._subgridsManager.getSubgridImplementationWithDataServer(dataServer);
            this._renderer.invalidateSubgridRow(subgrid, subgridRowIndex);
            this._focus.invalidateSubgridRow(subgrid, subgridRowIndex);
        }
    }

    /** @internal */
    private handleInvalidateRowColumns(dataServer: RevDataServer<SF>, subgridRowIndex: number, schemaColumnIndex: number, columnCount: number) {
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
    private handleInvalidateRowCells(dataServer: RevDataServer<SF>, subgridRowIndex: number, schemaColumnIndexes: number[]) {
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
    private handleInvalidateCell(dataServer: RevDataServer<SF>, schemaColumnIndex: number, subgridRowIndex: number) {
        if (!this._destroyed) {
            this._renderer.serverNotified();
            const subgrid = this._subgridsManager.getSubgridImplementationWithDataServer(dataServer);
            const activeColumnIndex = this._columnsManager.getActiveColumnIndexByFieldIndex(schemaColumnIndex);
            this._renderer.invalidateSubgridCell(subgrid, activeColumnIndex, subgridRowIndex);
            this._focus.invalidateSubgridCell(subgrid, activeColumnIndex, subgridRowIndex);
        }
    }

    /** @internal */
    private handleRowsInserted(subgrid: RevSubgrid<BCS, SF>, subgridRowIndex: number, count: number) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.serverNotified();
                this._focus.adjustForRowsInserted(subgridRowIndex, count, subgrid.dataServer);
                this._selection.adjustForRowsInserted(subgridRowIndex, count, subgrid);
                this._viewLayout.invalidateDataRowsInserted(subgridRowIndex, count);
                this.includeDataServerInRowListChanged(subgrid.dataServer);
            } finally {
                this.endDataChange();
            }
        }
    }

    /** @internal */
    private handleRowsDeleted(subgrid: RevSubgrid<BCS, SF>, subgridRowIndex: number, count: number) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.serverNotified();
                this._focus.adjustForRowsDeleted(subgridRowIndex, count, subgrid.dataServer);
                this._selection.adjustForRowsDeleted(subgridRowIndex, count, subgrid);
                this._viewLayout.invalidateDataRowsDeleted(subgridRowIndex, count);
                this.includeDataServerInRowListChanged(subgrid.dataServer);
            } finally {
                this.endDataChange();
            }
        }
    }

    /** @internal */
    private handleAllRowsDeleted(dataServer: RevDataServer<SF>) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.serverNotified();
                if (dataServer === this._mainDataServer) {
                    this._focus.clear();
                    this._selection.clear();
                }
                this._viewLayout.invalidateAllDataRowsDeleted();
                this.includeDataServerInRowListChanged(dataServer);
            } finally {
                this.endDataChange();
            }
        }
    }

    /** @internal */
    private handleRowsMoved(subgrid: RevSubgrid<BCS, SF>, oldSubgridRowIndex: number, newSubgridRowIndex: number, rowCount: number) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.serverNotified();
                this._focus.adjustForRowsMoved(oldSubgridRowIndex, newSubgridRowIndex, rowCount, subgrid.dataServer);
                this._selection.adjustForRowsMoved(oldSubgridRowIndex, newSubgridRowIndex, rowCount, subgrid);
                this._viewLayout.invalidateDataRowsMoved(oldSubgridRowIndex, newSubgridRowIndex, rowCount);
                this.includeDataServerInRowListChanged(subgrid.dataServer);
            } finally {
                this.endDataChange();
            }
        }
    }

    /** @internal */
    private handleRowsLoaded(dataServer: RevDataServer<SF>) {
        if (!this._destroyed) {
            this.beginDataChange();
            try {
                this._renderer.serverNotified();
                if (dataServer === this._mainDataServer) {
                    this._focus.clear();
                    this._selection.clear();
                }
                this._viewLayout.invalidateDataRowsLoaded();
                this.includeDataServerInRowListChanged(dataServer);
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
    private handleDataPostReindex(dataServer: RevDataServer<SF>, allRowsKept: boolean) {
        if (!this._destroyed) {
            this._reindexStashManager.unstash(allRowsKept);
            this._viewLayout.invalidateVerticalAll(false);
            this._renderer.serverNotified();
            this.includeDataServerInRowListChanged(dataServer);
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
        this._beginDataChangeCount++;
        this._selection.beginChange();
        this._renderer.beginChange();
    }

    private endDataChange() {
        this._selection.endChange();
        this._renderer.endChange();
        if (--this._beginDataChangeCount === 0) {
            if (this._rowListChangedDataServerCount > 0) {
                const dataServers = this._rowListChangedDataServers.slice(0, this._rowListChangedDataServerCount);
                this._eventBehavior.processDataServersRowListChanged(dataServers);
                this._rowListChangedDataServerCount = 0;
            }
        }
    }

    private includeDataServerInRowListChanged(dataServer: RevDataServer<SF>) {
        const rowListChangedDataServers = this._rowListChangedDataServers;
        const rowListChangedDataServerCount = this._rowListChangedDataServerCount;
        for (let i = 0; i < rowListChangedDataServerCount; i++) {
            if (dataServer === rowListChangedDataServers[i]) {
                return;
            }
        }
        rowListChangedDataServers[rowListChangedDataServerCount] = dataServer;
        this._rowListChangedDataServerCount++;
    }
}
