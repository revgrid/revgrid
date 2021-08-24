import { CellEditor } from '../cell-editor/cell-editor';
import { cellEditorFactory } from '../cell-editor/cell-editor-factory';
import { CellPainter } from '../cell-painter/cell-painter';
import { Hooks } from '../lib/hooks';
import { DataModel } from '../model/data-model';
import { SchemaModel } from '../model/schema-model';
import { CellEvent } from '../renderer/cell-event';
import { CellPaintConfig } from '../renderer/cell-paint-config';
import { CellPaintConfigAccessor } from '../renderer/cell-paint-config-accessor';
import { RenderCell } from '../renderer/render-cell';
import { Hypegrid } from './hypegrid';

/** @public */
export class Subgrid {
    readonly isData: boolean = false;
    readonly isHeader: boolean = false;
    readonly isFilter: boolean = false;
    readonly isSummary: boolean = false;

    /** @internal */
    private rowProxy: Subgrid.DataRowProxy; // used if DataModel.getRowProperties not implemented
    /** @internal */
    private rowMetadata: DataModel.RowMetadata[] = [];

    /** @internal */
    private readonly schemaModelCallbackListenerAdded: boolean;
    /** @internal */
    private readonly dataModelCallbackListenerAdded: boolean;

    /** @internal */
    private readonly schemaModelCallbackListener: SchemaModel.CallbackListener = {
        schemaLoaded: () => this.notifySchemaLoaded(),
        getSchemaColumn: (columnIndex) => this.notifyGetSchemaColumn(columnIndex),
        getSchemaColumns: () => this.notifyGetSchemaColumns(),
        headerChanged: (schemaColumn) => this.notifyHeaderChanged(schemaColumn),
    }

    /** @internal */
    private readonly dataModelCallbackListener: DataModel.CallbackListener = {
        dataLoaded: () => this.notifyDataLoaded(),
        dataShapeChanged: () => this.notifyDataShapeChanged(),
        dataPrereindex: () => this.notifyDataPrereindex(),
        dataPostreindex: () => this.notifyDataPostreindex(),
        invalidateAll: () => this.notifyInvalidateAll(),
    }

    /** @internal */
    constructor(
        public readonly schemaModel: SchemaModel,
        public readonly dataModel: DataModel,
        public readonly role: Subgrid.Role,
        /** @internal */
        private readonly _grid: Hypegrid,
        /** @internal */
        private _hooks: Hooks | undefined,
        /** @internal */
        private readonly _dataModelEventDispatchHandler:
            (eventName: DataModel.EventName | SchemaModel.EventName, eventDetail: SchemaModel.EventDetail | DataModel.EventDetail) => undefined | boolean,
        /** @internal */
        private readonly _dataLoadedEventHandler: Subgrid.DataModelEventHandler,
        /** @internal */
        private readonly _dataPostreindexEventHandler: Subgrid.DataModelEventHandler,
        /** @internal */
        private readonly _dataPrereindexEventHandler: Subgrid.DataModelEventHandler,
        /** @internal */
        private readonly _dataShapeChangedEventHandler: Subgrid.DataModelEventHandler,
        /** @internal */
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

        if (schemaModel.addSchemaCallbackListener !== undefined) {
            this.schemaModel.addSchemaCallbackListener(this.schemaModelCallbackListener);
            this.schemaModelCallbackListenerAdded = true;
        } else {
            this.schemaModelCallbackListenerAdded = false;
        }

        if (dataModel.addDataCallbackListener !== undefined) {
            this.dataModel.addDataCallbackListener(this.dataModelCallbackListener);
            this.dataModelCallbackListenerAdded = true;
        } else {
            this.dataModelCallbackListenerAdded = false;
        }

        this.rowProxy = new Subgrid.DataRowProxy(this.schemaModel, this.dataModel);
    }

    /** @internal */
    dispose() {
        if (this.schemaModelCallbackListenerAdded) {
            if (this.schemaModel.removeSchemaCallbackListener !== undefined) {
                this.schemaModel.removeSchemaCallbackListener(this.schemaModelCallbackListener);
            } else {
                console.warn(`Hypegrid: Subgrid "${this.role}". Could not dispose SchemaModel callback listener. SchemaModel.removeSchemaCallbackListener() not implemented`);
            }
        }

        if (this.dataModelCallbackListenerAdded) {
            if (this.dataModel.removeDataCallbackListener !== undefined) {
                this.dataModel.removeDataCallbackListener(this.dataModelCallbackListener);
            } else {
                console.warn(`Hypegrid: Subgrid "${this.role}". Could not dispose DataModel callback listener. DataModel.removeDataCallbackListener() not implemented`);
            }
        }
    }

    /** @internal */
    setHooks(value: Hooks | undefined) {
        this._hooks = value;
    }

    /** @internal */
    getRow(rowIndex: number) {
        if (this.dataModel.getRow !== undefined) {
            return this.dataModel.getRow(rowIndex);
        } else {
            this.rowProxy.____rowIndex = rowIndex;
            return this.rowProxy;
        }
    }

    /** @internal */
    getRowMetadata(rowIndex: number, prototype?: DataModel.RowMetadataPrototype): undefined | false | DataModel.RowMetadata {
        if (this.dataModel.getRowMetadata !== undefined) {
            return this.dataModel.getRowMetadata(rowIndex, prototype);
        } else {
            return this.rowMetadata[rowIndex];
        }
    }

    /** @internal */
    setRowMetadata(rowIndex: number, newMetadata?: DataModel.RowMetadata) {
        if (this.dataModel.setRowMetadata !== undefined) {
            this.dataModel.setRowMetadata(rowIndex, newMetadata);
        } else {
            this.rowMetadata[rowIndex] = newMetadata;
        }
    }

    /** @internal */
    // private handleDataModelEvent(nameOrEvent: DataModel.EventName | DataModel.Event) {
    //     let type: DataModel.EventName;
    //     let dataModelEvent: DataModel.Event;
    //     switch (typeof nameOrEvent) {
    //         case 'string':
    //             type = nameOrEvent as DataModel.EventName;
    //             dataModelEvent = { type };
    //             break;
    //         case 'object':
    //             if ('type' in nameOrEvent) {
    //                 type = nameOrEvent.type;
    //                 break;
    //             } else {
    //                 throw new HypergridError('Expected data model event to be: (string | {type:string})');
    //             }
    //         default:
    //             throw new HypergridError('Expected data model event to be: (string | {type:string})');
    //     }

    //     if (!DataModel.REGEX_DATA_EVENT_STRING.test(type)) {
    //         throw new HypergridError('Expected data model event type "' + type + '" to match ' + DataModel.REGEX_DATA_EVENT_STRING + '.');
    //     }

    //     const nativeHandler = this.dataModelEventMap[type];
    //     let dispatched: boolean | undefined;
    //     if (nativeHandler) {
    //         dispatched = nativeHandler(dataModelEvent);
    //     }

    //     return dispatched !== undefined ? dispatched : this._dataModelEventDispatchHandler(type, dataModelEvent);
    // }

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

    // /** @internal */
    // private handleFinHypergridSchemaLoaded(): boolean | undefined {
    //     this.rowProxy.updateSchema();
    //     return this._schemaLoadedEventHandler();
    // }

    // /** @internal */
    // private handleFinHypergridDataLoaded(): boolean | undefined {
    //     return this._dataLoadedEventHandler();
    // }

    // /** @internal */
    // private handleFinHypergridDataShapeChanged(): boolean | undefined {
    //     return this._dataShapeChangedEventHandler();
    // }

    // /** @internal */
    // private handleFinHypergridDataPrereindex(): boolean | undefined {
    //     return this._dataPrereindexEventHandler();
    // }

    // private handleFinHypergridDataPostreindex(): boolean | undefined {
    //     return this._dataPostreindexEventHandler();
    // }

    // Same events as above except using notifier

    /** @internal */
    private notifySchemaLoaded(eventDetail?: SchemaModel.EventDetail) {
        this.rowProxy.updateSchema();
        const dispatched = this._schemaLoadedEventHandler();
        return dispatched !== undefined ? dispatched : this._dataModelEventDispatchHandler('hypegrid-schema-loaded', eventDetail);
    }

    /** @internal */
    private notifyDataLoaded(eventDetail?: DataModel.EventDetail) {
        const dispatched = this._dataLoadedEventHandler();
        return dispatched !== undefined ? dispatched : this._dataModelEventDispatchHandler('hypegrid-data-loaded', eventDetail);
    }

    /** @internal */
    private notifyDataShapeChanged(eventDetail?: DataModel.EventDetail) {
        const dispatched = this._dataShapeChangedEventHandler();
        return dispatched !== undefined ? dispatched : this._dataModelEventDispatchHandler('hypegrid-data-shape-changed', eventDetail);
    }

    /** @internal */
    private notifyDataPrereindex(eventDetail?: DataModel.EventDetail) {
        const dispatched = this._dataPrereindexEventHandler();
        return dispatched !== undefined ? dispatched : this._dataModelEventDispatchHandler('hypegrid-data-prereindex', eventDetail);
    }

    /** @internal */
    private notifyDataPostreindex(eventDetail?: DataModel.EventDetail) {
        const dispatched = this._dataPostreindexEventHandler();
        return dispatched !== undefined ? dispatched : this._dataModelEventDispatchHandler('hypegrid-data-postreindex', eventDetail);
    }

    /** @internal */
    private notifyGetSchemaColumn(columnIndex: number) {
        return this._grid.behavior.getActiveColumns()[columnIndex].schemaColumn;
    }

    /** @internal */
    private notifyGetSchemaColumns() {
        return this._grid.behavior.getActiveColumns().map((column) => column.schemaColumn);
    }

    /** @internal */
    private notifyInvalidateAll() {
        this._grid.repaint();
    }

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private notifyHeaderChanged(schemaColumn: SchemaModel.Column) {
        // TODO
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
    /** @internal */
    getCellPaintConfig(renderCell: RenderCell): CellPaintConfig {
        let config: CellPaintConfig;
        const hooks = this._hooks;
        if (hooks !== undefined) {
            if (hooks.getCellPaintConfig !== undefined) {
                config = hooks.getCellPaintConfig(this.dataModel, renderCell);
            }
        }

        if (config === undefined) {
            return new CellPaintConfigAccessor(renderCell);
        } else {
            return config;
        }
    }

    /** @internal */
    getCellPainter(cellPaintConfig: CellPaintConfig, gridPainterKey: string): CellPainter {
        const hooks = this._hooks;
        let painter: CellPainter;
        if (hooks !== undefined) {
            if (hooks.getCellPainter !== undefined) {
                painter = hooks.getCellPainter(this.dataModel, cellPaintConfig, gridPainterKey);
            }
        }

        if (painter === undefined) {
            return this._grid.renderer.cellPainterRepository.get(gridPainterKey);
        } else {
            return painter;
        }
    }

    /** @internal */
    getCellEditorAt(columnIndex: number, rowIndex: number, editorName: string, cellEvent: CellEvent): CellEditor {
        const hooks = this._hooks;
        let editor: CellEditor;

        if (hooks !== undefined) {
            if (hooks.getCellEditorAt !== undefined) {
                editor = hooks.getCellEditorAt(this.dataModel, columnIndex, rowIndex, editorName, cellEvent);
            }
        }

        if (editor === undefined) {
            return cellEditorFactory.create(this._grid, editorName);
        } else {
            return editor;
        }
    }

    // // FriendlierDrillDownMapKeys
    // get drillDownCharMap() {
    //     return Subgrid.drillDownCharMap;
    // }

}

/** @public */
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
        dataModel: DataModel | DataModel.Constructor,
        role?: Role, // defaults to main
    }

    export type Spec = Role | FullSpec;

    /** @internal */
    export const drillDownCharMap: DataModel.DrillDownCharMap = {
        true: '\u25bc', // BLACK DOWN-POINTING TRIANGLE aka '▼'
        false: '\u25b6', // BLACK RIGHT-POINTING TRIANGLE aka '▶'
        undefined: '', // leaf rows have no control glyph
        null: '   ', // indent
        OPEN: '\u25bc', // friendlier alias
        CLOSE: '\u25b6', // friendlier alias
        INDENT: '   ', // friendlier alias
    };

    /** @internal */
    export type DataModelEventHandler = (this: void) => boolean | undefined;

    /** @internal */
    export class DataRowProxy implements DataModel.DataRowObject {
        [columnName: string]: DataModel.DataValue;

        ____rowIndex: number;
        ____columnNames: string[] = [];

        constructor(public schemaModel: SchemaModel, public dataModel: DataModel) {
            this.updateSchema(); // is this necessary? If we do not always get the "hypegrid-schema-loaded" event then it is necessary
        }

        updateSchema() {
            const existingCount = this.____columnNames.length;
            for (let i = 0; i < existingCount; i++) {
                const columnName = this.____columnNames[i];
                delete this[columnName];
            }
            this.____columnNames.length = 0;
            const schema = this.schemaModel.getSchema();
            const newCount = schema.length;
            for (let i = 0; i < newCount; i++) {
                const schemaColumn = schema[i]; // variable for closure
                const columnName = schemaColumn.name;
                this.____columnNames.push(columnName)
                Object.defineProperty(this, columnName, {
                    // enumerable: true, // is a real data field
                    configurable: true,
                    get: () => { return this.dataModel.getValue(schemaColumn, this.____rowIndex); },
                    set: (value: DataModel.DataValue) => { return this.dataModel.setValue(schemaColumn, this.____rowIndex, value); }
                });
            }
        }
    }

}

/** @public */
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
