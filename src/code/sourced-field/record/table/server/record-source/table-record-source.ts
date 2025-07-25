import {
    AssertInternalError,
    CorrectnessState,
    Integer,
    MultiEvent,
    NamedLocker,
    NamedOpener,
    Ok,
    Result,
    UsableListChangeTypeId,
} from '@pbkware/js-utils';
import { RevTextFormatter } from '../../../../../cell-content/server';
import { RevSourcedFieldCustomHeadings } from '../../../../sourced-field/server';
import { RevAllowedRecordSourcedField } from '../../../record/server';
import { RevTableField } from '../field';
import { RevTableFieldSource, RevTableFieldSourceDefinitionCachingFactory } from '../field-source';
import { RevTableRecord } from '../record';
import { RevTableRecordDefinition } from '../record-definition';
import { RevTableRecordSourceDefinition } from './definition';

/** @public */
export abstract class RevTableRecordSource<Badness, TypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> implements CorrectnessState<Badness> {
    private _activeFieldSources: readonly RevTableFieldSource<TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[] = [];
    private _fields: readonly RevTableField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[] = [];

    private _opened = false;

    private _listChangeMultiEvent = new MultiEvent<RevTableRecordSource.ListChangeEventHandler>();
    private _beforeRecDefinitionChangeMultiEvent = new MultiEvent<RevTableRecordSource.RecDefinitionChangeEventHandler>();
    private _afterRecDefinitionChangeMultiEvent = new MultiEvent<RevTableRecordSource.RecDefinitionChangeEventHandler>();

    constructor(
        readonly textFormatter: RevTextFormatter<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
        readonly customHeadings: RevSourcedFieldCustomHeadings | undefined,
        readonly tableFieldSourceDefinitionCachingFactory: RevTableFieldSourceDefinitionCachingFactory<
            TableFieldSourceDefinitionTypeId,
            TextFormattableValueTypeId,
            TextFormattableValueAttributeTypeId
        >,
        protected readonly _correctnessState: CorrectnessState<Badness>,
        protected readonly _definition: RevTableRecordSourceDefinition<TypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
        readonly allowedFieldSourceDefinitionTypeIds: readonly TableFieldSourceDefinitionTypeId[],
    ) {
    }

    get usable() { return this._correctnessState.usable; }
    get badness() { return this._correctnessState.badness; }
    get opened(): boolean { return this._opened; }

    get activeFieldSources() { return this._activeFieldSources; }
    get fields() { return this._fields; }

    get count(): Integer { return this.getCount(); }
    get AsArray(): RevTableRecordDefinition<TableFieldSourceDefinitionTypeId>[] { return this.getAsArray(); }

    finalise() {
        // descendants can override
    }

    tryLock(_locker: NamedLocker): Promise<Result<void>> {
        return Ok.createResolvedPromise(undefined);
    }

    unlock(_locker: NamedLocker) {
        // descendants can override
    }

    openLocked(_opener: NamedOpener) {
        this._opened = true;
    }

    closeLocked(_opener: NamedOpener) {
        // TableRecordDefinitionList can no longer be used after it is deactivated
        this._opened = false;
    }

    setUsable(badness: Badness) {
        this._correctnessState.setUsable(badness);
    }

    setUnusable(badness: Badness) {
        this._correctnessState.setUnusable(badness);
    }

    checkSetUnusable(badness: Badness) {
        this._correctnessState.checkSetUnusable(badness);
    }

    createAllowedFields(): readonly RevAllowedRecordSourcedField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[] {
        return this._definition.createAllowedFields();
    }

    // get changeDefinitionOrderAllowed(): boolean { return this._changeDefinitionOrderAllowed; }
    // get addDeleteDefinitionsAllowed(): boolean { return this.getAddDeleteDefinitionsAllowed(); }

    setActiveFieldSources(fieldSourceTypeIds: readonly TableFieldSourceDefinitionTypeId[]) {
        // The following could be improved.  Faster if work out differences and then subtract and add
        if (fieldSourceTypeIds.length === 0) {
            this._activeFieldSources = [];
            this._fields = [];
        } else {
            this._activeFieldSources = this.createActiveSources(fieldSourceTypeIds);
            this._fields = this.createFields();
        }
    }

    indexOf(value: RevTableRecordDefinition<TableFieldSourceDefinitionTypeId>): Integer {
        for (let i = 0; i < this.count; i++) {
            const definition = this.createRecordDefinition(i);
            if (RevTableRecordDefinition.same(definition, value)) {
                return i;
            }
        }

        return -1;
    }

    subscribeUsableChangedEvent(handler: CorrectnessState.UsableChangedEventHandler) {
        return this._correctnessState.subscribeUsableChangedEvent(handler);
    }

    unsubscribeUsableChangedEvent(subscriptionId: MultiEvent.SubscriptionId) {
        this._correctnessState.unsubscribeUsableChangedEvent(subscriptionId);
    }

    subscribeBadnessChangedEvent(handler: CorrectnessState.BadnessChangedEventHandler) {
        return this._correctnessState.subscribeBadnessChangedEvent(handler);
    }

    unsubscribeBadnessChangedEvent(subscriptionId: MultiEvent.SubscriptionId) {
        this._correctnessState.unsubscribeBadnessChangedEvent(subscriptionId);
    }

    subscribeListChangeEvent(handler: RevTableRecordSource.ListChangeEventHandler) {
        return this._listChangeMultiEvent.subscribe(handler);
    }

    unsubscribeListChangeEvent(subscriptionId: MultiEvent.SubscriptionId) {
        this._listChangeMultiEvent.unsubscribe(subscriptionId);
    }

    subscribeBeforeRecDefinitionChangeEvent(handler: RevTableRecordSource.RecDefinitionChangeEventHandler) {
        return this._beforeRecDefinitionChangeMultiEvent.subscribe(handler);
    }

    unsubscribeBeforeRecDefinitionChangeEvent(subscriptionId: MultiEvent.SubscriptionId) {
        this._beforeRecDefinitionChangeMultiEvent.unsubscribe(subscriptionId);
    }

    subscribeAfterRecDefinitionChangeEvent(handler: RevTableRecordSource.RecDefinitionChangeEventHandler) {
        return this._afterRecDefinitionChangeMultiEvent.subscribe(handler);
    }

    unsubscribeAfterRecDefinitionChangeEvent(subscriptionId: MultiEvent.SubscriptionId) {
        this._afterRecDefinitionChangeMultiEvent.unsubscribe(subscriptionId);
    }

    protected notifyListChange(listChangeTypeId: UsableListChangeTypeId, recIdx: Integer, recCount: Integer) {
        const handlers = this._listChangeMultiEvent.copyHandlers();
        for (let i = 0; i < handlers.length; i++) {
            handlers[i](listChangeTypeId, recIdx, recCount);
        }
    }

    protected checkUsableNotifyListChange(listChangeTypeId: UsableListChangeTypeId, recIdx: Integer, recCount: Integer) {
        if (this._correctnessState.usable) {
            this.notifyListChange(listChangeTypeId, recIdx, recCount);
        }
    }

    protected notifyBeforeRecDefinitionChange(recIdx: Integer) {
        const handlers = this._beforeRecDefinitionChangeMultiEvent.copyHandlers();
        for (let i = 0; i < handlers.length; i++) {
            handlers[i](recIdx);
        }
    }

    protected notifyAfterRecDefinitionChange(recIdx: Integer) {
        const handlers = this._afterRecDefinitionChangeMultiEvent.copyHandlers();
        for (let i = 0; i < handlers.length; i++) {
            handlers[i](recIdx);
        }
    }

    protected createFields(): RevTableField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[] {
        let result: RevTableField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[] = [];
        for (const source of this._activeFieldSources) {
            const sourceFields = source.createTableFields();

            result = [...result, ...sourceFields];
        }
        return result;
    }

    protected getAsArray(): RevTableRecordDefinition<TableFieldSourceDefinitionTypeId>[] {
        const result: RevTableRecordDefinition<TableFieldSourceDefinitionTypeId>[] = [];
        for (let i = 0; i < this.getCount(); i++) {
            result.push(this.createRecordDefinition(i));
        }
        return result;
    }

    private createActiveSources(
        fieldSourceTypeIds: readonly TableFieldSourceDefinitionTypeId[]
    ): readonly RevTableFieldSource<TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[] {
        const maxCount = this.allowedFieldSourceDefinitionTypeIds.length;
        if (fieldSourceTypeIds.length > maxCount) {
            throw new AssertInternalError('TRSCFSC34424');
        } else {
            const sources = new Array<RevTableFieldSource<TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>>(maxCount);
            let sourceCount = 0;
            let fieldCount = 0;
            for (const fieldSourceTypeId of fieldSourceTypeIds) {
                if (!this.allowedFieldSourceDefinitionTypeIds.includes(fieldSourceTypeId)) {
                    throw new AssertInternalError('TRSCFSA34424');
                } else {
                    const source = this.createFieldSource(fieldSourceTypeId, fieldCount);
                    sources[sourceCount++] = source;

                    fieldCount += source.fieldCount;
                }
            }
            sources.length = sourceCount;

            return sources;
        }
    }

    private createFieldSource(
        fieldSourceTypeId: TableFieldSourceDefinitionTypeId,
        fieldCount: Integer
    ): RevTableFieldSource<TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
        const definition = this.tableFieldSourceDefinitionCachingFactory.get(fieldSourceTypeId);
        const source = new RevTableFieldSource(this.textFormatter, this.customHeadings, definition, '');
        source.fieldIndexOffset = fieldCount;
        source.nextFieldIndexOffset = source.fieldIndexOffset + source.fieldCount;
        return source;
    }

    abstract createDefinition(): RevTableRecordSourceDefinition<TypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;
    abstract createTableRecord(recordIndex: Integer, eventHandlers: RevTableRecord.EventHandlers): RevTableRecord<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;
    abstract createRecordDefinition(recordIdx: Integer): RevTableRecordDefinition<TableFieldSourceDefinitionTypeId>;

    protected abstract getCount(): Integer;
    protected abstract getDefaultFieldSourceDefinitionTypeIds(): TableFieldSourceDefinitionTypeId[];

}

/** @public */
export namespace RevTableRecordSource {
    export type FactoryClosure<Badness, TypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> = (
        this: void,
        definition: RevTableRecordSourceDefinition<TypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>
    ) => RevTableRecordSource<Badness, TypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;

    export type ListChangeEventHandler = (
        this: void,
        listChangeTypeId: UsableListChangeTypeId,
        itemIdx: Integer,
        itemCount: Integer
    ) => void;
    export type RecDefinitionChangeEventHandler = (this: void, itemIdx: Integer) => void;
    export type badnessChangedEventHandler = (this: void) => void;
    export type ModifiedEventHandler<Badness, TypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> = (
        this: void,
        list: RevTableRecordSource<Badness, TypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>
    ) => void;
    export type RequestIsGroupSaveEnabledEventHandler = (this: void) => boolean;

}
