import {
    DataModel, RevRecordField, RevRecordValueRecentChangeTypeId
} from '..';
import { RecordStore } from './record-store';

export abstract class GridField implements RevRecordField {
    constructor(readonly name: string, public heading: string) {}
    abstract getValue(record: RecordStore.Record): DataModel.DataValue;
    abstract modifyValue(record: RecordStore.Record): RevRecordValueRecentChangeTypeId | undefined;
}

export class RecordIndexGridField extends GridField {
    constructor() {
        super('RecIndex', 'Index');
    }

    getValue(record: RecordStore.Record): DataModel.DataValue {
        return record.index;
    }

    override modifyValue(): RevRecordValueRecentChangeTypeId | undefined {
        return undefined;
    }
}

export class IntValGridField extends GridField {
    constructor() {
        super('IntVal', 'Int');
    }

    getValue(record: RecordStore.Record): DataModel.DataValue {
        return record.data[RecordStore.Record.Data.intValIndex];
    }

    compare(left: RecordStore.Record, right: RecordStore.Record): number {
        const index = RecordStore.Record.Data.intValIndex;
        return right.data[index] - left.data[index];
    }

    compareDesc(left: RecordStore.Record, right: RecordStore.Record): number {
        const index = RecordStore.Record.Data.intValIndex;
        return left.data[index] - right.data[index];
    }

    override modifyValue(record: RecordStore.Record): RevRecordValueRecentChangeTypeId | undefined {
        const oldValue = record.data[RecordStore.Record.Data.intValIndex];
        const newValue = Math.floor(Math.random() * 200);
        const valueRecentChangeTypeId = calculateNumberValueRecentChangeId(oldValue, newValue);
        if (valueRecentChangeTypeId !== undefined) {
            record.data[RecordStore.Record.Data.intValIndex] = newValue;
        }
        return valueRecentChangeTypeId;
    }
}

export class StrValGridField extends GridField {
    constructor() {
        super('fiStrVal', 'Str');
    }

    getValue(record: RecordStore.Record): DataModel.DataValue {
        return record.data[RecordStore.Record.Data.strValIndex];
    }

    compare(left: RecordStore.Record, right: RecordStore.Record): number {
        const index = RecordStore.Record.Data.strValIndex;
        return right.data[index].localeCompare(left.data[index]);
    }

    compareDesc(left: RecordStore.Record, right: RecordStore.Record): number {
        const index = RecordStore.Record.Data.strValIndex;
        return left.data[index].localeCompare(right.data[index]);
    }

    override modifyValue(record: RecordStore.Record): RevRecordValueRecentChangeTypeId | undefined {
        const newValue = 'Mod' + generateRandomString();
        const valueRecentChangeTypeId = calculateStringValueRecentChangeId(record.data[RecordStore.Record.Data.strValIndex], newValue);
        if (valueRecentChangeTypeId !== undefined) {
            record.data[RecordStore.Record.Data.strValIndex] = newValue;
        }
        return valueRecentChangeTypeId;
    }
}

export class NumberValGridField extends GridField {
    constructor() {
        super('fiDblVal', 'Number');
    }

    getValue(record: RecordStore.Record): DataModel.DataValue {
        return record.data[RecordStore.Record.Data.numberValIndex];
    }

    compare(left: RecordStore.Record, right: RecordStore.Record): number {
        const index = RecordStore.Record.Data.numberValIndex;
        return right.data[index] - left.data[index];
    }

    compareDesc(left: RecordStore.Record, right: RecordStore.Record): number {
        const index = RecordStore.Record.Data.numberValIndex;
        return left.data[index] - right.data[index];
    }

    override modifyValue(record: RecordStore.Record): RevRecordValueRecentChangeTypeId | undefined {
        const oldValue = record.data[RecordStore.Record.Data.numberValIndex];
        const newValue = Math.random() * 10000 / 300.0;
        const valueRecentChangeTypeId = calculateNumberValueRecentChangeId(oldValue, newValue);
        if (valueRecentChangeTypeId !== undefined) {
            record.data[RecordStore.Record.Data.numberValIndex] = newValue;
        }
        return valueRecentChangeTypeId;
}
}

export class DateValGridField extends GridField {
    constructor() {
        super('fiDateVal', 'Date');
    }

    getValue(record: RecordStore.Record): DataModel.DataValue {
        return record.data[RecordStore.Record.Data.dateValIndex];
    }

    compare(left: RecordStore.Record, right: RecordStore.Record): number {
        const index = RecordStore.Record.Data.dateValIndex;
        return right.data[index].getTime() - left.data[index].getTime();
    }

    compareDesc(left: RecordStore.Record, right: RecordStore.Record): number {
        const index = RecordStore.Record.Data.dateValIndex;
        return left.data[index].getTime() - right.data[index].getTime();
    }

    override modifyValue(record: RecordStore.Record): RevRecordValueRecentChangeTypeId | undefined {
        const oldValue = record.data[RecordStore.Record.Data.dateValIndex];
        const newValue = new Date(2018, 5, Math.floor(Math.random() * 12));
        const valueRecentChangeTypeId = calculateNumberValueRecentChangeId(oldValue.getTime(), newValue.getTime());
        if (valueRecentChangeTypeId !== undefined) {
            record.data[RecordStore.Record.Data.dateValIndex] = newValue;
        }
        return valueRecentChangeTypeId;
    }
}

export class StatusIdValGridField extends GridField {
    constructor() {
        super('fiStatusIdVal', 'StatusId');
    }

    getValue(record: RecordStore.Record): DataModel.DataValue {
        return record.data[RecordStore.Record.Data.statusIdIndex];
    }

    compare(left: RecordStore.Record, right: RecordStore.Record): number {
        const index = RecordStore.Record.Data.statusIdIndex;
        return right.data[index] - left.data[index];
    }

    compareDesc(left: RecordStore.Record, right: RecordStore.Record): number {
        const index = RecordStore.Record.Data.statusIdIndex;
        return left.data[index] - right.data[index];
    }

    override modifyValue(record: RecordStore.Record): RevRecordValueRecentChangeTypeId | undefined {
        const newValue = Math.floor(Math.random() * 5) as RecordStore.TDataItemStatusId;
        const valueRecentChangeTypeId = RevRecordValueRecentChangeTypeId.Update;
        if (valueRecentChangeTypeId !== undefined) {
            record.data[RecordStore.Record.Data.statusIdIndex] = newValue;
        }
        return valueRecentChangeTypeId;
    }
}

export class HiddenStrValGridField extends GridField {
    constructor() {
        super('fiHidden', 'Hidden');
    }

    getValue(record: RecordStore.Record): DataModel.DataValue {
        return record.data[RecordStore.Record.Data.strValIndex];
    }

    compare(left: RecordStore.Record, right: RecordStore.Record): number {
        const index = RecordStore.Record.Data.strValIndex;
        return right.data[index].localeCompare(left.data[index]);
    }

    compareDesc(left: RecordStore.Record, right: RecordStore.Record): number {
        const index = RecordStore.Record.Data.strValIndex;
        return left.data[index].localeCompare(right.data[index]);
    }

    override modifyValue(): RevRecordValueRecentChangeTypeId | undefined {
        return undefined;
    }
}

function calculateNumberValueRecentChangeId(oldValue: number, newValue: number) {
    if (newValue === oldValue) {
        return undefined;
    } else {
        return newValue > oldValue ? RevRecordValueRecentChangeTypeId.Increase : RevRecordValueRecentChangeTypeId.Decrease;
    }
}

function calculateStringValueRecentChangeId(oldValue: string, newValue: string) {
    if (newValue === oldValue) {
        return undefined;
    } else {
        return newValue > oldValue ? RevRecordValueRecentChangeTypeId.Increase : RevRecordValueRecentChangeTypeId.Decrease;
    }
}

function generateRandomString(): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let result = '';
    for (let i = 0; i < 5; i++) {
        result += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return result;
}
