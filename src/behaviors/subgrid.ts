import { cellEditorFactory } from '../cell-editor/cell-editor-factory';
import { CellPainter } from '../cell-painter/cell-painter';
import { Hypergrid } from '../grid/hypergrid';
import { CellEvent } from '../lib/cell-event';
import { DataModel } from '../lib/data-model';
import { Hooks } from '../lib/hooks';
import { HypergridError } from '../lib/hypergrid-error';

export class Subgrid {
    isData = false;
    isHeader = false;
    isFilter = false;
    isSummary = false;

    private rowProxy: DataModel.DataRowProxy; // used if DataModel.getRowProperties not implemented
    private rowMetadata: DataModel.RowMetadata[] = [];

    private readonly dataModelEventListener: DataModel.EventListener = (nameOrEvent) => this.handleDataModelEvent(nameOrEvent)
    private readonly dataModelEventListenerAdded: boolean;

    private readonly dataModelEventMap: DataModel.EventMap = {
        "fin-hypergrid-data-loaded": this.handleFinHypergridDataLoaded,
        "fin-hypergrid-data-postreindex": this.handleFinHypergridDataPostreindex,
        "fin-hypergrid-data-prereindex": this.handleFinHypergridDataPrereindex,
        "fin-hypergrid-data-shape-changed": this.handleFinHypergridDataShapeChanged,
        "fin-hypergrid-schema-loaded": this.handleFinHypergridSchemaLoaded,
    }

    constructor(
        public readonly dataModel: DataModel,
        public readonly role: Subgrid.Role,
        private readonly _grid: Hypergrid,
        private readonly _hooks: Hooks | undefined,
        private readonly _dataModelEventDispatchHandler: (eventName: DataModel.EventName, event: DataModel.Event) => undefined | boolean,
        private readonly _dataLoadedEventHandler: Subgrid.DataModelEventHandler,
        private readonly _dataPostreindexEventHandler: Subgrid.DataModelEventHandler,
        private readonly _dataPrereindexEventHandler: Subgrid.DataModelEventHandler,
        private readonly _dataShapeChangedEventHandler: Subgrid.DataModelEventHandler,
        private readonly _schemaLoadedEventHandler: Subgrid.DataModelEventHandler,
    ) {
        switch (role) {
            case 'main':
                this.isData = true;
                break;
            case 'header':
                this.isHeader = true;
                break;
            case 'footer':
                break;
            case 'filter':
                this.isFilter = true;
                break;
            case 'summary':
                this.isSummary = true;
                break;
            default:
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const never: never = role
        }

        if (dataModel.addListener !== undefined) {
            dataModel.addListener(this.dataModelEventListener);
            this.dataModelEventListenerAdded = true;
        } else {
            this.dataModelEventListenerAdded = false;
        }

        this.updateRowProxy();
    }

    dispose() {
        if (this.dataModelEventListenerAdded) {
            const removeListenerFunction = this.dataModel.removeListener;
            if (removeListenerFunction !== undefined) {
                removeListenerFunction(this.dataModelEventListener);
            } else {
                console.warn(`Hypegrid: Subgrid "${this.role}". Could not dispose listener. DataModel.removeListener() not implemented`);
            }
        }
    }

    getRow(rowIndex: number) {
        if (this.dataModel.getRow !== undefined) {
            return this.dataModel.getRow(rowIndex);
        } else {
            this.rowProxy.rowIndex = rowIndex;
            return this.rowProxy;
        }
    }

    updateRowProxy() {
        this.rowProxy = new DataModel.DataRowProxy(this.dataModel);
    }

    getRowMetadata(rowIndex: number, prototype?: DataModel.RowMetadataPrototype): undefined | false | DataModel.RowMetadata {
        if (this.dataModel.getRowMetadata !== undefined) {
            return this.dataModel.getRowMetadata(rowIndex, prototype);
        } else {
            return this.rowMetadata[rowIndex];
        }
    }

    setRowMetadata(rowIndex: number, newMetadata?: DataModel.RowMetadata) {
        if (this.dataModel.setRowMetadata !== undefined) {
            this.dataModel.setRowMetadata(rowIndex, newMetadata);
        } else {
            this.rowMetadata[rowIndex] = newMetadata;
        }
    }


    private handleDataModelEvent(nameOrEvent: DataModel.EventName | DataModel.Event) {
        let type: DataModel.EventName;
        let dataModelEvent: DataModel.Event;
        switch (typeof nameOrEvent) {
            case 'string':
                type = nameOrEvent as DataModel.EventName;
                dataModelEvent = { type };
                break;
            case 'object':
                if ('type' in nameOrEvent) {
                    type = nameOrEvent.type;
                    break;
                } else {
                    throw new HypergridError('Expected data model event to be: (string | {type:string})');
                }
            default:
                throw new HypergridError('Expected data model event to be: (string | {type:string})');
        }

        if (!DataModel.REGEX_DATA_EVENT_STRING.test(type)) {
            throw new HypergridError('Expected data model event type "' + type + '" to match ' + DataModel.REGEX_DATA_EVENT_STRING + '.');
        }

        const nativeHandler = this.dataModelEventMap[type];
        let dispatched: boolean | undefined;
        if (nativeHandler) {
            dispatched = nativeHandler(dataModelEvent);
        }

        return dispatched !== undefined ? dispatched : this._dataModelEventDispatchHandler(type, dataModelEvent);
    }

    /**
     * @desc These handlers are called by {@link dispatchDataModelEvent dataModel.dispatchEvent} to perform Hypergrid housekeeping tasks.
     *
     * (Hypergrid registers itself with the data model by calling `dataModel.addListener`. Both `addListener` and `dispatchEvent` are optional API. If the data model lacks `addListener`, Hypergrid inserts a bound version of `dispatchEvent` directly into the data model.)
     *
     * #### Coding pattern
     * If there are no housekeeping tasks to be performed, do not define a handler here.
     *
     * Otherwise, the typical coding pattern is for our handler to perform the housekeeping tasks, returning `undefined` to the caller ({@link DispatchDataModelEvent}) which then re-emits the event as a Hypergrid event (_i.e.,_ as a DOM event to the `<canvas>` element).
     *
     * Alternatively, our handler can re-emit the event itself by calling the grid event handler and propagating its boolean return value value to the caller which signals the caller _not_ to re-emit on our behalf. This is useful when tasks need to be performed _after_ the Hypergrid event handler is called (or before _and_ after).
     *
     * The pattern, in general:
     * ```js
     * exports['fin-hypergrid-data-myevent'] = function(event) {
     *     var notCanceled;
     *
     *     PerformHousekeepingTasks();
     *
     *     // optionally re-emit the event as a grid event
     *     import { dispatchGridEvent } from '../../lib/dispatchGridEvent.js';
     *     notCanceled = dispatchGridEvent.call(this, event.type, isCancelable, event);
     *
     *     if (!notCanceled) {
     *         PerformAdditionalHousekeepingTasks()
     *     }
     *
     *     return notCanceled;
     * }
     * Re-emitting the event is optional; if `notCanceled` is never defined, the caller will take care of it. If your handler does choose to re-emit the event itself by calling `dispatchGridEvent`, you should propagate its return value (the result of its internal call to [`dispatchEvent`](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent), which is either `false` if the event was canceled or `true` if it was not).
     *
     */

    private handleFinHypergridSchemaLoaded(): boolean | undefined {
        this.rowProxy.updateSchema();
        return this._schemaLoadedEventHandler();
    }

    private handleFinHypergridDataLoaded(): boolean | undefined {
        return this._dataLoadedEventHandler();
    }

    private handleFinHypergridDataShapeChanged(): boolean | undefined {
        return this._dataShapeChangedEventHandler();
    }

    private handleFinHypergridDataPrereindex(): boolean | undefined {
        return this._dataPrereindexEventHandler();
    }

    private handleFinHypergridDataPostreindex(): boolean | undefined {
        return this._dataPostreindexEventHandler();
    }


    // abstract getRowCount(): number;
    // abstract getValue(columnIndex: number, rowIndex: number): unknown;
    // abstract getSchema(): (RawColumnSchema | ColumnSchema)[];



    // // Fallbacks

    // // eslint-disable-next-line @typescript-eslint/no-empty-function
    // apply() {

    // }

    // isTree() {
    //     return false;
    // }

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // isTreeCol(columnIndex: number) {
    //     return false;
    // }

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // toggleRow(rowIndex: number, columnIndex?: number, toggle?: boolean) {
    //     return undefined;
    // }

    // getColumnCount() {
    //     return this.getSchema().length;
    // }

    // getRow(y: number): DataRowObject {
    //     this.$rowProxy$.$y$ = y;
    //     return this.$rowProxy$;
    // }

    // getData(metadataFieldName: string) {
    //     const Y = this.getRowCount();
    //     const rows = new Array(Y);

    //     for (let y = 0; y < Y; y++) {
    //         const row = this.getRow(y);
    //         if (row !== undefined) {
    //             rows[y] = Object.assign({}, row);
    //             if (metadataFieldName) {
    //                 const metadata = this.getRowMetadata(y);
    //                 if (metadata) {
    //                     rows[y][metadataFieldName] = metadata;
    //                 }
    //             }
    //         }
    //     }

    //     return rows;
    // }

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // setData(data: DataRowObject[], schema: RawColumnSchema[]) {
    //     // fail silently because Local.js::setData currently calls this for every subgrid
    // }

    // setValue(x: number, y: number, value: unknown) {
    //     console.warn('dataModel.setValue(' + x + ', ' + y + ', "' + value + '") called but no implementation. Data not saved.');
    // }

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // setSchema(schema: ColumnSchema[]) {
    //     console.warn('dataModel.setSchema(schema) called but no implementation. Schema not updated.');
    // }

    // getRowIndex(y: number) {
    //     return y;
    // }

    // /** @implements DataModel#getRowMetadata */
    // getRowMetadata(y: number, prototype?: null): undefined | RowMetadata {
    //     return this.metadata[y] || prototype !== undefined && (this.metadata[y] = Object.create(prototype));
    // }

    // getMetadataStore() {
    //     return this.metadata;
    // }

    // setRowMetadata(y: number, metadata: RowMetadata) {
    //     if (metadata !== undefined) {
    //         this.metadata[y] = metadata;
    //     } else {
    //         delete this.metadata[y];
    //     }
    //     return !!metadata;
    // }

    // setMetadataStore(newMetadataStore: RowMetadata[] | undefined) {
    //     this.metadata = newMetadataStore ?? [];
    // }

    // Hooks
    getCell(config: CellPainter.Config, rendererName: string) {
        const hooks = this._hooks;
        if (hooks === undefined) {
            return this._grid.cellPainterRepository.get(rendererName);
        } else {
            const hooksGetCellFunction = hooks.getCell;
            if (hooksGetCellFunction !== undefined) {
                return hooksGetCellFunction(this.dataModel, config, rendererName);
            } else {
                return this._grid.cellPainterRepository.get(rendererName);
            }
        }
    }

    getCellEditorAt(columnIndex: number, rowIndex: number, editorName: string, cellEvent: CellEvent) {
        const hooks = this._hooks;
        if (hooks === undefined) {
            return cellEditorFactory.create(this._grid, editorName);
        } else {
            const hooksGetCellEditorAtFunction = hooks.getCellEditorAt;
            if (hooksGetCellEditorAtFunction !== undefined) {
                return hooksGetCellEditorAtFunction(this.dataModel, columnIndex, rowIndex, editorName, cellEvent);
            } else {
                return cellEditorFactory.create(this._grid, editorName);
            }
        }
    }

    // // FriendlierDrillDownMapKeys
    // get drillDownCharMap() {
    //     return Subgrid.drillDownCharMap;
    // }

}

export namespace Subgrid {
    export const enum RoleEnum {
        main = 'main',
        header = 'header',
        footer = 'footer',
        filter = 'filter',
        summary = 'summary',
    }

    export type Role = keyof typeof RoleEnum;

    export interface FullSpec {
        dataModel: DataModel // | DataModel.Constructor,
        role?: Role, // defaults to main
    }

    export type Spec = Role | FullSpec;

    export const drillDownCharMap: DataModel.DrillDownCharMap = {
        true: '\u25bc', // BLACK DOWN-POINTING TRIANGLE aka '▼'
        false: '\u25b6', // BLACK RIGHT-POINTING TRIANGLE aka '▶'
        undefined: '', // leaf rows have no control glyph
        null: '   ', // indent
        OPEN: '\u25bc', // friendlier alias
        CLOSE: '\u25b6', // friendlier alias
        INDENT: '   ', // friendlier alias
    };

    export type DataModelEventHandler = (this: void) => boolean | undefined;
}

export class SubgridArray extends Array<Subgrid> {
    lookup = new Map<string, Subgrid>();

    override push(value: Subgrid) {
        const result = super.push(value);
        this.lookup.set(value.role, value);
        return result;
    }

    clear() {
        this.length = 0;
        this.lookup.clear();
    }
}
