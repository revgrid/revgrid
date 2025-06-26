import { AssertInternalError, CorrectnessState, Integer, LockOpenListItem, MultiEvent, Ok, Result } from '@pbkware/js-utils';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevClientGrid, RevGridDefinition, RevGridOptions } from '../../../client';
import { RevColumnLayout, RevColumnLayoutOrReference, RevColumnLayoutOrReferenceDefinition, RevReferenceableColumnLayouts } from '../../../column-layout';
import { RevApiError } from '../../../common';
import { RevRecordGrid, RevRecordRowOrderDefinition } from '../../../record';
import { RevAllowedRecordSourcedFieldsColumnLayoutDefinition, RevRecordSourcedField, RevRecordSourcedFieldGrid } from '../record';
import {
    RevDataSource,
    RevDataSourceOrReference,
    RevDataSourceOrReferenceDefinition,
    RevReferenceableDataSources,
    RevTable,
    RevTableFieldSourceDefinitionCachingFactory,
    RevTableRecordDefinition,
    RevTableRecordSource,
    RevTableRecordSourceDefinition,
    RevTableRecordSourceDefinitionFromJsonFactory,
    RevTableRecordSourceFactory,
    RevTableRecordStore,
} from './server';

/** @public */
export class RevTableGrid<
    Badness,
    TableRecordSourceDefinitionTypeId,
    TableFieldSourceDefinitionTypeId,
    TextFormattableValueTypeId,
    TextFormattableValueAttributeTypeId,
    BGS extends RevBehavioredGridSettings,
    BCS extends RevBehavioredColumnSettings
> extends RevRecordSourcedFieldGrid<
    TextFormattableValueTypeId,
    TextFormattableValueAttributeTypeId,
    BGS,
    BCS,
    RevRecordSourcedField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>
> {
    declare readonly recordStore: RevTableRecordStore<
        Badness,
        TableRecordSourceDefinitionTypeId,
        TableFieldSourceDefinitionTypeId,
        TextFormattableValueTypeId,
        TextFormattableValueAttributeTypeId
    >;

    opener: LockOpenListItem.Opener;
    keepPreviousLayoutIfPossible = false;
    keptColumnLayoutOrReferenceDefinition: RevColumnLayoutOrReferenceDefinition | undefined;

    openedEventer: RevTableGrid.OpenedEventer | undefined;
    columnLayoutSetEventer: RevTableGrid.ColumnLayoutSetEventer | undefined;

    private _lockedDataSourceOrReference: RevDataSourceOrReference<
        Badness,
        TableRecordSourceDefinitionTypeId,
        TableFieldSourceDefinitionTypeId,
        TextFormattableValueTypeId,
        TextFormattableValueAttributeTypeId
    > | undefined;
    private _openedDataSource: RevDataSource<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> | undefined;
    private _openedTable: RevTable<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> | undefined;

    private _keptRowOrderDefinition: RevRecordRowOrderDefinition | undefined;
    private _keptGridRowAnchor: RevRecordGrid.ViewAnchor | undefined;

    private _autoSizeAllColumnWidthsOnFirstUsable: boolean;

    private _tableFieldsChangedSubscriptionId: MultiEvent.SubscriptionId;
    private _tableFirstUsableSubscriptionId: MultiEvent.SubscriptionId;
    private _dataSourceColumnLayoutSetSubscriptionId: MultiEvent.SubscriptionId;

    constructor(
        private readonly _referenceableColumnLayouts: RevReferenceableColumnLayouts | undefined,
        readonly tableFieldSourceDefinitionCachingFactory: RevTableFieldSourceDefinitionCachingFactory<
            TableFieldSourceDefinitionTypeId,
            TextFormattableValueTypeId,
            TextFormattableValueAttributeTypeId
        >,
        readonly tableRecordSourceDefinitionFromJsonFactory: RevTableRecordSourceDefinitionFromJsonFactory<
            TableRecordSourceDefinitionTypeId,
            TableFieldSourceDefinitionTypeId,
            TextFormattableValueTypeId,
            TextFormattableValueAttributeTypeId
        >,
        private readonly _referenceableDataSources: RevReferenceableDataSources<
            Badness,
            TableRecordSourceDefinitionTypeId,
            TableFieldSourceDefinitionTypeId,
            TextFormattableValueTypeId,
            TextFormattableValueAttributeTypeId
        > | undefined,
        private readonly _tableRecordSourceFactory: RevTableRecordSourceFactory<
            Badness,
            TableRecordSourceDefinitionTypeId,
            TableFieldSourceDefinitionTypeId,
            TextFormattableValueTypeId,
            TextFormattableValueAttributeTypeId
        >,
        gridHostElement: HTMLElement,
        definition: RevGridDefinition<BCS, RevRecordSourcedField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>>,
        settings: BGS,
        getSettingsForNewColumnEventer: RevClientGrid.GetSettingsForNewColumnEventer<BCS, RevRecordSourcedField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>>,
        options?: RevGridOptions<BGS, BCS, RevRecordSourcedField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>>,
    ) {
        super(gridHostElement, definition, settings, getSettingsForNewColumnEventer, options);

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
    get openedRecordSource(): RevTableRecordSource<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
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
        definition: RevDataSourceOrReferenceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
        keepView: boolean
    ): Promise<
        Result<
            RevDataSourceOrReference<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
            RevDataSourceOrReference.LockErrorIdPlusTryError
        >
    > {
        // Replace with Promise.withResolvers when available in TypeScript (ES2023)
        let resolve: (value: Result<
            RevDataSourceOrReference<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
            RevDataSourceOrReference.LockErrorIdPlusTryError
        >) => void;
        const resultPromise = new Promise<
            Result<
                RevDataSourceOrReference<
                    Badness,
                    TableRecordSourceDefinitionTypeId,
                    TableFieldSourceDefinitionTypeId,
                    TextFormattableValueTypeId,
                    TextFormattableValueAttributeTypeId
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
        const dataSourceOrReference = new RevDataSourceOrReference<
            Badness,
            TableRecordSourceDefinitionTypeId,
            TableFieldSourceDefinitionTypeId,
            TextFormattableValueTypeId,
            TextFormattableValueAttributeTypeId
        >(
            this._referenceableColumnLayouts,
            this._referenceableDataSources,
            this.tableFieldSourceDefinitionCachingFactory.definitionFactory,
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
            (reason: unknown) => { throw AssertInternalError.createIfNotError(reason, 'TGTOGS35791'); }
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

    createDataSourceOrReferenceDefinition(): RevDataSourceOrReferenceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
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

    createTableRecordSourceDefinition(): RevTableRecordSourceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
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

    override createAllowedSourcedFieldsColumnLayoutDefinition(): RevAllowedRecordSourcedFieldsColumnLayoutDefinition<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
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
