// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { AssertInternalError, CorrectnessState, Integer, LockOpenListItem, MultiEvent, Ok, Result } from '@xilytix/sysutils';
import { BehavioredColumnSettings, BehavioredGridSettings, RevApiError, RevClientGrid, RevGridDefinition, RevGridOptions } from '../../../client/internal-api';
import { RevColumnLayout, RevColumnLayoutOrReference, RevColumnLayoutOrReferenceDefinition, RevReferenceableColumnLayoutsService } from '../../../column-layout/internal-api';
import { RevRecordGrid, RevRecordRowOrderDefinition } from '../../../record/internal-api';
import { RevSourcedFieldCustomHeadingsService } from '../../sourced-field/internal-api';
import { RevAllowedRecordSourcedFieldsColumnLayoutDefinition, RevRecordSourcedField, RevRecordSourcedFieldGrid } from '../record/internal-api';
import {
    RevDataSource,
    RevDataSourceOrReference,
    RevDataSourceOrReferenceDefinition,
    RevReferenceableDataSourcesService,
    RevTable,
    RevTableFieldSourceDefinitionCachingFactoryService,
    RevTableRecordDefinition,
    RevTableRecordSource,
    RevTableRecordSourceDefinition,
    RevTableRecordSourceDefinitionFromJsonFactory,
    RevTableRecordSourceFactory,
    RevTableRecordStore,
} from './server/internal-api';

/** @public */
export class RevTableGrid<
    Badness,
    TableRecordSourceDefinitionTypeId,
    TableFieldSourceDefinitionTypeId,
    RenderValueTypeId,
    RenderAttributeTypeId,
    BGS extends BehavioredGridSettings,
    BCS extends BehavioredColumnSettings
> extends RevRecordSourcedFieldGrid<RenderValueTypeId, RenderAttributeTypeId, BGS, BCS, RevRecordSourcedField<RenderValueTypeId, RenderAttributeTypeId>> {
    declare readonly recordStore: RevTableRecordStore<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>;

    opener: LockOpenListItem.Opener;
    keepPreviousLayoutIfPossible = false;
    keptColumnLayoutOrReferenceDefinition: RevColumnLayoutOrReferenceDefinition | undefined;

    openedEventer: RevTableGrid.OpenedEventer | undefined;
    columnLayoutSetEventer: RevTableGrid.ColumnLayoutSetEventer | undefined;

    private _lockedDataSourceOrReference: RevDataSourceOrReference<
        Badness,
        TableRecordSourceDefinitionTypeId,
        TableFieldSourceDefinitionTypeId,
        RenderValueTypeId,
        RenderAttributeTypeId
    > | undefined;
    private _openedDataSource: RevDataSource<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> | undefined;
    private _openedTable: RevTable<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> | undefined;

    private _keptRowOrderDefinition: RevRecordRowOrderDefinition | undefined;
    private _keptGridRowAnchor: RevRecordGrid.ViewAnchor | undefined;

    private _autoSizeAllColumnWidthsOnFirstUsable: boolean;

    private _tableFieldsChangedSubscriptionId: MultiEvent.SubscriptionId;
    private _tableFirstUsableSubscriptionId: MultiEvent.SubscriptionId;
    private _dataSourceColumnLayoutSetSubscriptionId: MultiEvent.SubscriptionId;

    constructor(
        readonly gridFieldCustomHeadingsService: RevSourcedFieldCustomHeadingsService,
        private readonly _referenceableColumnLayoutsService: RevReferenceableColumnLayoutsService | undefined,
        readonly tableFieldSourceDefinitionCachingFactoryService: RevTableFieldSourceDefinitionCachingFactoryService<TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        readonly tableRecordSourceDefinitionFactoryService: RevTableRecordSourceDefinitionFromJsonFactory<
            TableRecordSourceDefinitionTypeId,
            TableFieldSourceDefinitionTypeId,
            RenderValueTypeId,
            RenderAttributeTypeId
        >,
        private readonly _referenceableDataSourcesService: RevReferenceableDataSourcesService<
            Badness,
            TableRecordSourceDefinitionTypeId,
            TableFieldSourceDefinitionTypeId,
            RenderValueTypeId,
            RenderAttributeTypeId
        > | undefined,
        private readonly _tableRecordSourceFactory: RevTableRecordSourceFactory<
            Badness,
            TableRecordSourceDefinitionTypeId,
            TableFieldSourceDefinitionTypeId,
            RenderValueTypeId,
            RenderAttributeTypeId
        >,
        gridHostElement: HTMLElement,
        definition: RevGridDefinition<BCS, RevRecordSourcedField<RenderValueTypeId, RenderAttributeTypeId>>,
        settings: BGS,
        customiseSettingsForNewColumnEventer: RevClientGrid.GetSettingsForNewColumnEventer<BCS, RevRecordSourcedField<RenderValueTypeId, RenderAttributeTypeId>>,
        options?: RevGridOptions<BGS, BCS, RevRecordSourcedField<RenderValueTypeId, RenderAttributeTypeId>>,
    ) {
        super(gridHostElement, definition, settings, customiseSettingsForNewColumnEventer, options);

        if (!(this.recordStore instanceof RevTableRecordStore)) {
            throw new RevApiError('TGC50112', 'RecordStore is not a subtype of RevTableRecordStore');
        }
    }

    get recordCount(): Integer { return this._openedTable === undefined ? 0 : this._openedTable.recordCount; }
    get opened(): boolean { return this._openedTable !== undefined; }
    get openedTable() {
        if (this._openedTable === undefined) {
            throw new AssertInternalError('RTGGOT32072');
        } else {
            return this._openedTable;
        }
    }
    get openedRecordSource(): RevTableRecordSource<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
        if (this._openedTable === undefined) {
            throw new AssertInternalError('RTGGORS32072');
        } else {
            return this._openedTable.recordSource;
        }
    }
    get badness(): Badness {
        if (this._openedTable === undefined) {
            throw new AssertInternalError('RTGGG32072');
        } else {
            return this._openedTable.badness;
        }
    }

    tryOpenDataSource(
        definition: RevDataSourceOrReferenceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
        keepView: boolean
    ): Promise<
        Result<
            RevDataSourceOrReference<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
            RevDataSourceOrReference.LockErrorIdPlusTryError
        >
    > {
        // Replace with Promise.withResolvers when available in TypeScript (ES2023)
        let resolve: (value: Result<
            RevDataSourceOrReference<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>,
            RevDataSourceOrReference.LockErrorIdPlusTryError
        >) => void;
        const resultPromise = new Promise<
            Result<
                RevDataSourceOrReference<
                    Badness,
                    TableRecordSourceDefinitionTypeId,
                    TableFieldSourceDefinitionTypeId,
                    RenderValueTypeId,
                    RenderAttributeTypeId
                >,
                RevDataSourceOrReference.LockErrorIdPlusTryError
            >
        >(
            (res) => {
                resolve = res;
            }
        );

        this.closeDataSource(keepView);

        if (definition.canUpdateColumnLayoutDefinitionOrReference() &&
            this.keepPreviousLayoutIfPossible &&
            this.keptColumnLayoutOrReferenceDefinition !== undefined
        ) {
            definition.updateColumnLayoutDefinitionOrReference(this.keptColumnLayoutOrReferenceDefinition);
        }
        const dataSourceOrReference = new RevDataSourceOrReference<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId>(
            this._referenceableColumnLayoutsService,
            this._referenceableDataSourcesService,
            this.tableFieldSourceDefinitionCachingFactoryService.definitionFactory,
            this._tableRecordSourceFactory,
            definition
        );

        const dataSourceOrReferenceLockPromise = dataSourceOrReference.tryLock(this.opener);
        dataSourceOrReferenceLockPromise.then(
            (lockResult) => {
                if (lockResult.isErr()) {
                    resolve(lockResult.createType());
                } else {
                    const dataSource = dataSourceOrReference.lockedDataSource;
                    if (dataSource === undefined) {
                        throw new AssertInternalError('GSFOGSL22209');
                    } else {
                        dataSource.openLocked(this.opener);
                        const table = dataSource.table;
                        if (table === undefined) {
                            throw new AssertInternalError('GSFOGSTA22209');
                        } else {
                            const layout = dataSource.lockedColumnLayout;
                            if (layout === undefined) {
                                throw new AssertInternalError('GSFOGSGL22209');
                            } else {
                                this._lockedDataSourceOrReference = dataSourceOrReference;
                                this._openedDataSource = dataSource;
                                this._openedTable = table;

                                this.notifyOpened(/*dataSourceOrReference*/);

                                this._dataSourceColumnLayoutSetSubscriptionId = this._openedDataSource.subscribeColumnLayoutSetEvent(
                                    () => this.handleDataSourceColumnLayoutSetEvent()
                                );

                                this.recordStore.setTable(table);
                                this._tableFieldsChangedSubscriptionId = table.subscribeFieldsChangedEvent(
                                    () => super.updateAllowedFields(table.fields)
                                );

                                super.initialiseAllowedFields(table.fields);

                                if (table.beenUsable) {
                                    this.applyFirstUsableFromLayout(layout);
                                } else {
                                    this._tableFirstUsableSubscriptionId = table.subscribeFirstUsableEvent(() => {
                                        table.unsubscribeFirstUsableEvent(this._tableFirstUsableSubscriptionId);
                                        this.applyFirstUsableFromLayout(layout);
                                    });
                                }

                                this.notifyColumnLayoutSet(layout);

                                resolve(new Ok(dataSourceOrReference));
                            }
                        }
                    }
                }
            },
            (reason) => { throw AssertInternalError.createIfNotError(reason, 'TGTOGS35791'); }
        );

        return resultPromise;
    }

    closeDataSource(keepView: boolean) {
        if (this._lockedDataSourceOrReference !== undefined) {
            const openedTable = this._openedTable;
            if (openedTable === undefined || this._openedDataSource === undefined) {
                throw new AssertInternalError('GSF22209');
            } else {
                openedTable.unsubscribeFieldsChangedEvent(this._tableFieldsChangedSubscriptionId);
                this._tableFieldsChangedSubscriptionId = undefined;
                openedTable.unsubscribeFirstUsableEvent(this._tableFirstUsableSubscriptionId); // may not be subscribed
                this._tableFirstUsableSubscriptionId = undefined;
                this._tableFieldsChangedSubscriptionId = undefined;
                this._openedDataSource.unsubscribeColumnLayoutSetEvent(this._dataSourceColumnLayoutSetSubscriptionId);
                this._dataSourceColumnLayoutSetSubscriptionId = undefined;
                if (this.keepPreviousLayoutIfPossible) {
                    this.keptColumnLayoutOrReferenceDefinition = this.createColumnLayoutOrReferenceDefinition();
                } else {
                    this.keptColumnLayoutOrReferenceDefinition = undefined;
                }
                if (keepView) {
                    this._keptRowOrderDefinition = super.getRowOrderDefinition();
                    this._keptGridRowAnchor = super.getViewAnchor();
                } else {
                    this._keptRowOrderDefinition = undefined;
                    this._keptGridRowAnchor = undefined;
                }
                const opener = this.opener;
                this._openedDataSource.closeLocked(opener);
                this._lockedDataSourceOrReference.unlock(opener);
                this._lockedDataSourceOrReference = undefined;
                this._openedTable = undefined;
            }

            super.setActiveColumns([]);
        }
    }

    createDataSourceOrReferenceDefinition(): RevDataSourceOrReferenceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
        if (this._lockedDataSourceOrReference === undefined) {
            throw new AssertInternalError('GSFCGSONRD22209');
        } else {
            const rowOrderDefinition = super.getRowOrderDefinition();
            return this._lockedDataSourceOrReference.createDefinition(rowOrderDefinition);
        }
    }

    createColumnLayoutOrReferenceDefinition() {
        if (this._openedDataSource === undefined) {
            throw new AssertInternalError('GSFCCGLONRD22209');
        } else {
            return this._openedDataSource.createColumnLayoutOrReferenceDefinition();
        }
    }

    createTableRecordSourceDefinition(): RevTableRecordSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, RenderValueTypeId, RenderAttributeTypeId> {
        if (this._openedDataSource === undefined) {
            throw new AssertInternalError('GSFCGSONRD22209');
        } else {
            return this._openedDataSource.createTableRecordSourceDefinition();
        }
    }

    tryOpenColumnLayoutOrReferenceDefinition(columnLayoutOrReferenceDefinition: RevColumnLayoutOrReferenceDefinition): Promise<Result<void, RevColumnLayoutOrReference.LockErrorIdPlusTryError>> {
        if (this._openedDataSource === undefined) {
            throw new AssertInternalError('GSFOGLONRD22209');
        } else {
            return this._openedDataSource.tryOpenColumnLayoutOrReferenceDefinition(columnLayoutOrReferenceDefinition, this.opener);
        }
    }

    applyColumnLayoutOrReferenceDefinition(definition: RevColumnLayoutOrReferenceDefinition) {
        if (this._openedDataSource === undefined) {
            throw new AssertInternalError('GSFAGLD22209');
        } else {
            const promise = this._openedDataSource.tryOpenColumnLayoutOrReferenceDefinition(definition, this.opener);
            AssertInternalError.throwErrorIfPromiseRejected(promise, 'GSFIG81190', this.opener.lockerName);
        }
    }

    createRecordDefinition(index: Integer): RevTableRecordDefinition<TableFieldSourceDefinitionTypeId> {
        if (this._openedTable === undefined) {
            throw new AssertInternalError('GSFCRD89981');
        } else {
            return this._openedTable.createRecordDefinition(index);
        }
    }

    canCreateAllowedSourcedFieldsColumnLayoutDefinition() {
        return this._openedTable !== undefined;
    }

    clearRendering() {
        if (this._openedTable !== undefined) {
            this._openedTable.clearRendering();
        }
    }

    subscribeBadnessChangedEvent(handler: CorrectnessState.BadnessChangedEventHandler) {
        if (this._openedTable === undefined) {
            throw new AssertInternalError('TGSBCE35791');
        } else {
            return this._openedTable.subscribeBadnessChangedEvent(handler);
        }
    }

    unsubscribeBadnessChangedEvent(subscriptionId: MultiEvent.SubscriptionId) {
        if (this._openedTable === undefined) {
            throw new AssertInternalError('TGUBCE35791');
        } else {
            this._openedTable.unsubscribeBadnessChangedEvent(subscriptionId);
        }
    }

    override createAllowedSourcedFieldsColumnLayoutDefinition(): RevAllowedRecordSourcedFieldsColumnLayoutDefinition<RenderValueTypeId, RenderAttributeTypeId> {
        if (this._openedTable === undefined) {
            throw new AssertInternalError('GSFCAFALD56678');
        } else {
            const allowedFields = this._openedTable.createAllowedFields();
            return super.createAllowedSourcedFieldsColumnLayoutDefinition(allowedFields);
        }
    }

    private applyFirstUsableFromLayout(layout: RevColumnLayout) {
        let rowOrderDefinition = this._keptRowOrderDefinition;
        this._keptRowOrderDefinition = undefined;
        if (rowOrderDefinition === undefined) {
            if (this._openedDataSource === undefined) {
                throw new AssertInternalError('GSFAFU22209');
            } else {
                rowOrderDefinition = this._openedDataSource.initialRowOrderDefinition;
            }
        }
        const viewAnchor = this._keptGridRowAnchor;
        this._keptGridRowAnchor = undefined;
        super.applyFirstUsable(rowOrderDefinition, viewAnchor, layout);
    }

    private handleDataSourceColumnLayoutSetEvent() {
        if (this._openedDataSource === undefined) {
            throw new AssertInternalError('GSFHGSGLSE22209');
        } else {
            const newLayout = this._openedDataSource.lockedColumnLayout;
            if (newLayout === undefined) {
                throw new AssertInternalError('GSFHGSGLCE22202');
            } else {
                super.updateColumnLayout(newLayout);
                this.notifyColumnLayoutSet(newLayout);
            }
        }
    }

    private notifyOpened() {
        if (this.openedEventer !== undefined) {
            this.openedEventer();
        }
    }

    private notifyColumnLayoutSet(layout: RevColumnLayout) {
        if (this.columnLayoutSetEventer !== undefined) {
            this.columnLayoutSetEventer(layout);
        }
    }
}

/** @public */
export namespace RevTableGrid {
    export type OpenedEventer = (this: void) => void;
    export type ColumnLayoutSetEventer = (this: void, layout: RevColumnLayout) => void;
}
