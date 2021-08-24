import { CellEditor } from '../cell-editor/cell-editor';
import { Hypegrid } from '../grid/hypegrid';
import { Point, WritablePoint } from '../lib/point';
import { DataModel } from '../model/data-model';
import { SchemaModel } from '../model/schema-model';
import { CellEvent } from '../renderer/cell-event';
import { SelectionDetail } from '../selection/selection-detail';
import { Canvas } from './canvas';

const wantedDetailFields = [
    'gridCell',
    'dataCell',
    'mousePoint',
    'gridPoint',
    'clientPoint',
    'pagePoint',
    'keys',
    'row'
];

/**
 * @param cancelable - Event implements `preventDefault()`.
 */
export function dispatchGridEvent(
    grid: Hypegrid,
    eventName: DispatchGridEvent.EventName,
    cancelable: boolean,
    eventDetail:
        | Canvas.SyntheticEventDetail.Resize
        | Canvas.SyntheticEventDetail.Keyboard
        | Canvas.SyntheticEventDetail.Touch
        | CellEditor.EventDetail
        | Hypegrid.ColumnSortEventDetail
        | SelectionDetail
        | Hypegrid.GridEventDetail
        | Hypegrid.ScrollEventDetail
        | CellEvent
        | SchemaModel.EventDetail
        | DataModel.EventDetail
        | undefined,
    primitiveEvent?: CellEvent | MouseEvent | KeyboardEvent | Point
): undefined | boolean {
    if (!grid.canvas) {
        return false;
    }

    let eventInitDictOrDetail: DispatchGridEvent.EventInitDictOrDetail;
    if (eventDetail === undefined) {
        eventInitDictOrDetail = {};
    } else {
        if (eventDetail instanceof CustomEvent) {
            eventInitDictOrDetail = Object({});
            throw new Error('dispatchGridEvent should not be passed CustomEvents anymore [1]');
        } else {
            eventInitDictOrDetail = eventDetail;
        }
    }

    if (!("type" in eventInitDictOrDetail)) {
        (eventInitDictOrDetail as DispatchGridEvent.ExtraDetail).type = eventName;
    }

    let eventInitDict: CustomEventInit<DispatchGridEvent.ExtraDetail>;

    if (!("detail" in eventInitDictOrDetail)) {
        eventInitDict = {
            detail: eventInitDictOrDetail as DispatchGridEvent.ExtraDetail,
        };
    } else {
        eventInitDict = eventInitDictOrDetail as CustomEventInit<DispatchGridEvent.ExtraDetail>;
        throw new Error('dispatchGridEvent should not be passed CustomEvents anymore [2]');
    }

    const detail = eventInitDict.detail;

    if (!detail.grid) {
        // CellEvent objects already have a (read-only) `grid` prop
        detail.grid = grid;
    }

    detail.time = Date.now();

    if (primitiveEvent !== undefined) {
        if (!detail.primitiveEvent) {
            detail.primitiveEvent = primitiveEvent;
        }
        wantedDetailFields.forEach((key) => {
            if (key in primitiveEvent && !(key in detail)) {
                detail[key] = primitiveEvent[key] as unknown;
            }
        });
        if ("dataRow" in primitiveEvent) {
            // reference (without invoking) cellEvent's `dataRow` getter when available
            Object.defineProperty(detail, "row", {
                get: function () {
                    return primitiveEvent.dataRow;
                },
            });
        }
    }

    eventInitDict.cancelable = cancelable;

    return grid.canvas.dispatchEvent(new CustomEvent(eventName, eventInitDict));
}

export namespace DispatchGridEvent {

    export type EventName = Canvas.EventName | Hypegrid.EventName | SchemaModel.EventName | DataModel.EventName;

    // Extra properties added to Event Detail
    export interface ExtraDetail {
        type: string;
        grid: Hypegrid;
        time: number;
        primitiveEvent: CellEvent | MouseEvent | KeyboardEvent | Point;

        gridCell: WritablePoint,
        dataCell: WritablePoint,
        mousePoint: Point,
        gridPoint: Point,
        clientPoint: Point,
        pagePoint: Point,
        keys: string[],
        row: unknown,
    }

    export type UntypedEventInitDictOrDetail =
        | CustomEventInit
        | Canvas.SyntheticEventDetail.Resize
        | Canvas.SyntheticEventDetail.Keyboard
        | Canvas.SyntheticEventDetail.Touch
        | CellEditor.EventDetail
        | Hypegrid.ColumnSortEventDetail
        | SelectionDetail
        | Hypegrid.GridEventDetail
        | Hypegrid.ScrollEventDetail
        | CellEvent
        | SchemaModel.EventDetail
        | DataModel.EventDetail;

    export type EventInitDictOrDetail = UntypedEventInitDictOrDetail | ExtraDetail;
}
