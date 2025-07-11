import { AssertInternalError, Err, Guid, LockOpenListItem, Ok, Result, UnreachableCaseError } from '@pbkware/js-utils';
import { RevReferenceableColumnLayouts } from '../../../../../column-layout/server';
import { RevApiError } from '../../../../../common';
import { RevRecordRowOrderDefinition } from '../../../../../record/server';
import { RevTableFieldSourceDefinitionFactory } from '../field-source';
import { RevTableRecordSourceFactory } from '../record-source';
import { RevDataSource } from './data-source';
import { RevDataSourceDefinition, RevDataSourceOrReferenceDefinition } from './definition';
import { RevReferenceableDataSource } from './referenceable-data-source';
import { RevReferenceableDataSources } from './referenceable-data-sources';

/** @public */
export class RevDataSourceOrReference<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
    private readonly _referenceId: Guid | undefined;
    private readonly _dataSourceDefinition: RevDataSourceDefinition<
        TableRecordSourceDefinitionTypeId,
        TableFieldSourceDefinitionTypeId,
        TextFormattableValueTypeId,
        TextFormattableValueAttributeTypeId
    > | undefined;

    private _lockedDataSource: RevDataSource<
        Badness,
        TableRecordSourceDefinitionTypeId,
        TableFieldSourceDefinitionTypeId,
        TextFormattableValueTypeId,
        TextFormattableValueAttributeTypeId
    > | undefined;
    private _lockedReferenceableDataSource: RevReferenceableDataSource<
        Badness,
        TableRecordSourceDefinitionTypeId,
        TableFieldSourceDefinitionTypeId,
        TextFormattableValueTypeId,
        TextFormattableValueAttributeTypeId
    > | undefined;

    constructor(
        private readonly _referenceableColumnLayouts: RevReferenceableColumnLayouts | undefined,
        private readonly _referenceableDataSources: RevReferenceableDataSources<
            Badness,
            TableRecordSourceDefinitionTypeId,
            TableFieldSourceDefinitionTypeId,
            TextFormattableValueTypeId,
            TextFormattableValueAttributeTypeId
        > | undefined,
        private readonly _tableFieldSourceDefinitionFactory: RevTableFieldSourceDefinitionFactory<
            TableFieldSourceDefinitionTypeId,
            TextFormattableValueTypeId,
            TextFormattableValueAttributeTypeId
        >,
        private readonly _tableRecordSourceFactory: RevTableRecordSourceFactory<
            Badness,
            TableRecordSourceDefinitionTypeId,
            TableFieldSourceDefinitionTypeId,
            TextFormattableValueTypeId,
            TextFormattableValueAttributeTypeId
        >,
        definition: RevDataSourceOrReferenceDefinition<TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>
    ) {
        if (definition.referenceId !== undefined ) {
            this._referenceId = definition.referenceId;
        } else {
            if (definition.dataSourceDefinition !== undefined ) {
                this._dataSourceDefinition = definition.dataSourceDefinition;
            } else {
                throw new AssertInternalError('GSONRC59923');
            }
        }
    }

    get lockedDataSource() { return this._lockedDataSource;}
    get lockedReferenceableDataSource() { return this._lockedReferenceableDataSource;}

    createDefinition(rowOrderDefinition: RevRecordRowOrderDefinition | undefined) {
        if (this._lockedReferenceableDataSource !== undefined) {
            return new RevDataSourceOrReferenceDefinition<
                TableRecordSourceDefinitionTypeId,
                TableFieldSourceDefinitionTypeId,
                TextFormattableValueTypeId,
                TextFormattableValueAttributeTypeId>(this._lockedReferenceableDataSource.id);
        } else {
            if (this.lockedDataSource !== undefined) {
                const dataSourceDefinition = this.lockedDataSource.createDefinition(rowOrderDefinition);
                return new RevDataSourceOrReferenceDefinition<
                    TableRecordSourceDefinitionTypeId,
                    TableFieldSourceDefinitionTypeId,
                    TextFormattableValueTypeId,
                    TextFormattableValueAttributeTypeId>(dataSourceDefinition);
            } else {
                throw new AssertInternalError('GSONRCDU59923');
            }
        }
    }

    async tryLock(locker: LockOpenListItem.Locker): Promise<Result<void, RevDataSourceOrReference.LockErrorIdPlusTryError>> {
        if (this._dataSourceDefinition !== undefined) {
            const dataSource = new RevDataSource<Badness, TableRecordSourceDefinitionTypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>(
                this._referenceableColumnLayouts,
                this._tableFieldSourceDefinitionFactory,
                this._tableRecordSourceFactory,
                this._dataSourceDefinition
            );
            const dataSourceLockResult = await dataSource.tryLock(locker);
            if (dataSourceLockResult.isErr()) {
                const lockErrorIdPlusTryError = dataSourceLockResult.error;
                const errorId = RevDataSourceOrReference.LockError.fromRevDataSource(lockErrorIdPlusTryError.errorId, false);
                return new Err({ errorId, tryError: lockErrorIdPlusTryError.tryError });
            } else {
                this._lockedDataSource = dataSource;
                this._lockedReferenceableDataSource = undefined;
                return new Ok(undefined);
            }
        } else {
            if (this._referenceId !== undefined) {
                const referenceableDataSourcesService = this._referenceableDataSources;
                if (referenceableDataSourcesService === undefined) {
                    throw new RevApiError('RDSORTL50721', 'Undefined ReferenceableDataSourcesService');
                } else {
                    const lockResult = await referenceableDataSourcesService.tryLockItemByKey(this._referenceId, locker);
                    if (lockResult.isErr()) {
                        const lockErrorIdPlusTryError = lockResult.error;
                        const errorId = RevDataSourceOrReference.LockError.fromRevDataSource(lockErrorIdPlusTryError.errorId, true);
                        return new Err({ errorId, tryError: lockErrorIdPlusTryError.tryError });
                    } else {
                        const referenceableDataSource = lockResult.value;
                        if (referenceableDataSource === undefined) {
                            return new Err({ errorId: RevDataSourceOrReference.LockErrorId.ReferenceableNotFound, tryError: undefined});
                        } else {
                            this._lockedReferenceableDataSource = referenceableDataSource;
                            this._lockedDataSource = referenceableDataSource;
                            return new Ok(undefined);
                        }
                    }
                }
            } else {
                throw new AssertInternalError('GSDONRTLU24498');
            }
        }
    }

    unlock(locker: LockOpenListItem.Locker) {
        if (this._lockedReferenceableDataSource !== undefined) {
            const referenceableDataSourcesService = this._referenceableDataSources;
            if (referenceableDataSourcesService === undefined) {
                throw new RevApiError('RDSORU50721', 'Undefined ReferenceableDataSourcesService');
            } else {
                referenceableDataSourcesService.unlockItem(this._lockedReferenceableDataSource, locker);
                this._lockedReferenceableDataSource = undefined;
            }
        } else {
            if (this._lockedDataSource !== undefined) {
                this._lockedDataSource.unlock(locker);
            } else {
                throw new AssertInternalError('GSDONRUU23366');
            }
        }
        this._lockedDataSource = undefined;
    }
}

/** @public */
export namespace RevDataSourceOrReference {
    export const enum LockErrorId {
        TableRecordSourceTry,
        LayoutDefinitionTry,
        LayoutReferenceTry,
        LayoutReferenceNotFound,
        ReferenceableTableRecordSourceTry,
        ReferenceableLayoutDefinitionTry,
        ReferenceableLayoutReferenceTry,
        ReferenceableLayoutReferenceNotFound,
        ReferenceableNotFound
    }

    export namespace LockError {
        export function fromRevDataSource(lockErrorId:  RevDataSource.LockErrorId, referenceable: boolean): LockErrorId {
            switch (lockErrorId) {
                case RevDataSource.LockErrorId.TableRecordSourceTry:
                    return referenceable ? LockErrorId.ReferenceableTableRecordSourceTry : LockErrorId.TableRecordSourceTry;
                case RevDataSource.LockErrorId.LayoutDefinitionTry:
                    return referenceable ? LockErrorId.ReferenceableLayoutDefinitionTry : LockErrorId.LayoutDefinitionTry;
                case RevDataSource.LockErrorId.LayoutReferenceTry:
                    return referenceable ? LockErrorId.ReferenceableLayoutReferenceTry : LockErrorId.LayoutReferenceTry;
                case RevDataSource.LockErrorId.LayoutReferenceNotFound:
                    return referenceable ? LockErrorId.ReferenceableLayoutReferenceNotFound : LockErrorId.LayoutReferenceNotFound;
                default:
                    throw new UnreachableCaseError('RDSORLEFRGLOR66643', lockErrorId);
            }
        }
    }

    export interface LockErrorIdPlusTryError {
        errorId: LockErrorId,
        tryError: string | undefined;
    }
}
