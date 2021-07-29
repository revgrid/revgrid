import { CellEditor } from '../cell-editor/cell-editor';
import { Point, WritablePoint } from '../dependencies/point';
import { ColumnSorting } from '../feature/column-sorting';
import { Hypergrid } from '../grid/hypergrid';
import { Canvas } from './canvas';
import { CellEvent } from './cell-event';
import { DataModel } from './data-model';
import { SelectionDetailAccessor } from './selection-detail-accessor';

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
    grid: Hypergrid,
    eventName: string,
    cancelable: boolean,
    event:
        | Canvas.AnySyntheticEvent
        | Canvas.SyntheticEventDetail.Keyboard
        | CellEditor.Event
        | ColumnSorting.ColumnSortEvent
        | SelectionDetailAccessor
        | Hypergrid.GridEvent
        | Hypergrid.ScrollEvent
        | CellEvent
        | DataModel.Event
        | undefined,
    primitiveEvent?: CellEvent | MouseEvent | KeyboardEvent | Point
): undefined | boolean {
    if (!grid.canvas) {
        return false;
    }

    let eventInitDictOrDetail: DispatchGridEvent.EventInitDictOrDetail;
    if (event === undefined) {
        eventInitDictOrDetail = {};
    } else {
        if (event instanceof CustomEvent) {
            eventInitDictOrDetail = Object({});
        } else {
            eventInitDictOrDetail = event;
        }
    }

    if (!("type" in eventInitDictOrDetail)) {
        (eventInitDictOrDetail as DispatchGridEvent.Detail).type = eventName;
    }

    let eventInitDict: CustomEventInit<DispatchGridEvent.Detail>;

    if (!("detail" in eventInitDictOrDetail)) {
        eventInitDict = {
            detail: eventInitDictOrDetail as DispatchGridEvent.Detail,
        };
    } else {
        eventInitDict = eventInitDictOrDetail as CustomEventInit<DispatchGridEvent.Detail>;
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

    export interface Detail {
        type: string;
        grid: Hypergrid;
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
        | Canvas.AnySyntheticEvent
        | Canvas.SyntheticEventDetail.Keyboard
        | CellEditor.Event
        | ColumnSorting.ColumnSortEvent
        | SelectionDetailAccessor
        | Hypergrid.GridEvent
        | Hypergrid.ScrollEvent
        | CellEvent
        | DataModel.Event;

    export type EventInitDictOrDetail = UntypedEventInitDictOrDetail | Detail;
}
