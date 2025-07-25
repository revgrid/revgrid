import { AssertInternalError, Err, Guid, LockOpenListItem, Ok, Result } from '@pbkware/js-utils';
import { RevApiError } from '../../common';
import { RevColumnLayout } from './column-layout';
import {
    RevColumnLayoutDefinition,
    RevColumnLayoutOrReferenceDefinition
} from './definition';
import { RevReferenceableColumnLayout } from './referenceable-column-layout';
import { RevReferenceableColumnLayouts } from './referenceable-grid-columns';

/** @public */
export class RevColumnLayoutOrReference {
    private readonly _referenceId: Guid | undefined;
    private readonly _columnLayoutDefinition: RevColumnLayoutDefinition | undefined;

    private _lockedColumnLayout: RevColumnLayout | undefined;
    private _lockedReferenceableColumnLayout: RevReferenceableColumnLayout | undefined;

    constructor(
        private readonly _referenceableColumnLayouts: RevReferenceableColumnLayouts | undefined,
        definition: RevColumnLayoutOrReferenceDefinition,
    ) {
        if (definition.referenceId !== undefined) {
            this._referenceId = definition.referenceId;
        } else {
            if (definition.columnLayoutDefinition !== undefined ) {
                this._columnLayoutDefinition = definition.columnLayoutDefinition;
            } else {
                throw new AssertInternalError('GLONRC59923');
            }
        }
    }

    get lockedColumnLayout() { return this._lockedColumnLayout; }
    get lockedReferenceableColumnLayout() { return this._lockedReferenceableColumnLayout; }

    createDefinition() {
        if (this._lockedReferenceableColumnLayout !== undefined) {
            return new RevColumnLayoutOrReferenceDefinition(this._lockedReferenceableColumnLayout.id);
        } else {
            if (this.lockedColumnLayout !== undefined) {
                const dataSourceDefinition = this.lockedColumnLayout.createDefinition();
                return new RevColumnLayoutOrReferenceDefinition(dataSourceDefinition);
            } else {
                throw new AssertInternalError('GLONRCDU59923');
            }
        }
    }

    tryLock(locker: LockOpenListItem.Locker): Promise<Result<void, RevColumnLayoutOrReference.LockErrorIdPlusTryError>> {
        // Replace with Promise.withResolvers when available in TypeScript (ES2023)
        let resolve: (value: Result<void, RevColumnLayoutOrReference.LockErrorIdPlusTryError>) => void;
        const resultPromise = new Promise<Result<void, RevColumnLayoutOrReference.LockErrorIdPlusTryError>>((res) => {
            resolve = res;
        });

        if (this._columnLayoutDefinition !== undefined) {
            const columnLayout = new RevColumnLayout(this._columnLayoutDefinition);
            const lockPromise = columnLayout.tryLock(locker);
            lockPromise.then(
                (lockResult) => {
                    if (lockResult.isErr()) {
                        const err = new Err({ errorId: RevColumnLayoutOrReference.LockErrorId.DefinitionTry, tryError: lockResult.error });
                        resolve(err);
                    } else {
                        this._lockedColumnLayout = columnLayout;
                        this._lockedReferenceableColumnLayout = undefined;
                        resolve(new Ok(undefined));
                    }
                },
                (reason: unknown) => { throw AssertInternalError.createIfNotError(reason, 'RGLORTL54441'); }
            );
        } else {
            if (this._referenceId !== undefined) {
                const referenceableColumnLayoutsService = this._referenceableColumnLayouts;
                if (referenceableColumnLayoutsService === undefined) {
                    throw new RevApiError('RCLORTL50113', 'Undefined referenceableColumnLayoutsService');
                } else {
                    const lockPromise = referenceableColumnLayoutsService.tryLockItemByKey(this._referenceId, locker);
                    lockPromise.then(
                        (lockResult) => {
                            if (lockResult.isErr()) {
                                const err = new Err({ errorId: RevColumnLayoutOrReference.LockErrorId.ReferenceTry, tryError: lockResult.error });
                                resolve(err);
                            } else {
                                const referenceableColumnLayout = lockResult.value;
                                if (referenceableColumnLayout === undefined) {
                                    const err = new Err({ errorId: RevColumnLayoutOrReference.LockErrorId.ReferenceNotFound, tryError: undefined });
                                    resolve(err);
                                } else {
                                    this._lockedReferenceableColumnLayout = referenceableColumnLayout;
                                    this._lockedColumnLayout = referenceableColumnLayout;
                                    resolve(new Ok(undefined));
                                }
                            }
                        },
                        (reason: unknown) => { throw AssertInternalError.createIfNotError(reason, 'RGLORTL54441'); }
                    );
                }
            } else {
                throw new AssertInternalError('GLDONRTLU24498');
            }
        }

        return resultPromise;
    }

    unlock(locker: LockOpenListItem.Locker) {
        if (this._lockedColumnLayout === undefined) {
            throw new AssertInternalError('RCLORUL23366');
        } else {
            this._lockedColumnLayout = undefined;
            if (this._lockedReferenceableColumnLayout !== undefined) {
                const referenceableColumnLayoutsService = this._referenceableColumnLayouts;
                if (referenceableColumnLayoutsService === undefined) {
                    throw new RevApiError('RCLORUS50113', 'Undefined referenceableColumnLayoutsService');
                } else {
                    referenceableColumnLayoutsService.unlockItem(this._lockedReferenceableColumnLayout, locker);
                    this._lockedReferenceableColumnLayout = undefined;
                }
            }
        }
    }
}

/** @public */
export namespace RevColumnLayoutOrReference {
    export const enum LockErrorId {
        DefinitionTry,
        ReferenceTry,
        ReferenceNotFound,
    }

    export interface LockErrorIdPlusTryError {
        errorId: LockErrorId,
        tryError: string | undefined;
    }
}
