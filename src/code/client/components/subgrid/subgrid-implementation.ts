import { RevAssertError, RevDataServer, RevMetaServer, RevSchemaField, RevSchemaServer } from '../../../common';
import { RevColumn } from '../../interfaces/column';
import { RevSubgrid } from '../../interfaces/subgrid';
import { RevBehavioredColumnSettings, RevGridSettings } from '../../settings';
import { RevColumnsManager } from '../column/columns-manager';

/** @internal */
export class RevSubgridImplementation<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevSubgrid<BCS, SF> {
    readonly isMain: boolean = false;
    readonly isHeader: boolean = false;
    readonly isFilter: boolean = false;
    readonly isSummary: boolean = false;
    readonly isFooter: boolean = false;

    firstViewRowIndex = -1; // only valid if viewRowCount > 0
    firstViewableSubgridRowIndex = -1; // only valid if viewRowCount > 0
    viewRowCount = 0;

    /** @internal */
    protected _destroyed = false;

    /** @internal */
    /** @internal */
    private _viewDataRowProxy: RevSubgridImplementation.ViewDataRowProxy<SF>; // used if RevDataServer.getRowProperties not implemented
    /** @internal */
    private readonly _rowPropertiesPrototype: RevMetaServer.RowPropertiesPrototype | null;

    private _dataNotificationsClient: RevDataServer.NotificationsClient;

    /** @internal */
    constructor(
        /** @internal */
        protected readonly _gridSettings: RevGridSettings,
        /** @internal */
        protected readonly _columnsManager: RevColumnsManager<BCS, SF>,
        /** @internal */
        readonly handle: RevSubgridImplementation.Handle,
        readonly role: RevSubgrid.Role,
        readonly schemaServer: RevSchemaServer<SF>,
        readonly dataServer: RevDataServer<SF>,
        readonly metaServer: RevMetaServer | undefined,
        readonly selectable: boolean,
        readonly definitionDefaultRowHeight: number | undefined,
        readonly rowHeightsCanDiffer: boolean,
        rowPropertiesPrototype: RevMetaServer.RowPropertiesPrototype | undefined,
        public getCellPainterEventer: RevSubgrid.GetCellPainterEventer<BCS, SF>,
    ) {
        switch (role) {
            case 'main':
                this.isMain = true;
                break;
            case 'header':
                this.isHeader = true;
                break;
            case 'footer':
                this.isFooter = true;
                break;
            case 'filter':
                this.isFilter = true;
                break;
            case 'summary':
                this.isSummary = true;
                break;
            default: {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const never: never = role
            }
        }

        this._viewDataRowProxy = new RevSubgridImplementation.ViewDataRowProxy<SF>(this.schemaServer, this.dataServer);

        if (rowPropertiesPrototype === undefined) {
            this._rowPropertiesPrototype = null;
        } else {
            this._rowPropertiesPrototype = rowPropertiesPrototype;
        }

        this._columnsManager.addBeforeCreateColumnsListener(this._columnsManagerBeforeCreateColumnsListener); // put in a behavior
    }

    // eslint-disable-next-line @typescript-eslint/class-literal-property-style
    get fixedRowCount() { return 0; } // is overridden

    /** @internal */
    destroy() {
        this._columnsManager.removeBeforeCreateColumnsListener(this._columnsManagerBeforeCreateColumnsListener);
        this._destroyed = true;
    }

    /** @internal */
    setDataNotificationsClient(client: RevDataServer.NotificationsClient) {
        this._dataNotificationsClient = client;
    }

    /** @internal */
    trySubscribeDataNotifications() {
        this.dataServer.subscribeDataNotifications(this._dataNotificationsClient);
    }

    /** @internal */
    tryUnsubscribeDataNotifications() {
        if (this.dataServer.unsubscribeDataNotifications !== undefined) {
            this.dataServer.unsubscribeDataNotifications(this._dataNotificationsClient);
        }
    }

    isRowFixed(_rowIndex: number): boolean {
        return false;
    }

    getViewValue(column: RevColumn<BCS, SF>, subgridRowIndex: number): RevDataServer.ViewValue {
        return this.dataServer.getViewValue(column.field, subgridRowIndex);
    }

    /**
     * Since this may return RowProxy, can only have one of these rows active at any time
     */
    getSingletonViewDataRow(subgridRowIndex: number) {
        if (this.dataServer.getViewRow !== undefined) {
            return this.dataServer.getViewRow(subgridRowIndex);
        } else {
            this._viewDataRowProxy.____rowIndex = subgridRowIndex;
            return this._viewDataRowProxy;
        }
    }

    getViewValueFromDataRowAtColumn(dataRow: RevDataServer.ViewRow, column: RevColumn<BCS, SF>) {
        if (Array.isArray(dataRow)) {
            return dataRow[column.field.index];
        } else {
            return dataRow[column.field.name];
        }
    }

    getRowCount() {
        return this.dataServer.getRowCount();
    }

    getRowMetadata(subgridRowIndex: number) {
        if (this.metaServer === undefined) {
            return undefined;
        } else {
            if (this.metaServer.getRowMetadata === undefined) {
                return undefined;
            } else {
                const metadata = this.metaServer.getRowMetadata(subgridRowIndex);
                if (metadata === null) {
                    throw new RevAssertError('SGRMN99441'); // Row itself does not exist
                } else {
                    if (metadata === undefined) {
                        return undefined;
                    } else {
                        return metadata;
                    }
                }
            }
        }
    }

    setRowMetadata(subgridRowIndex: number, newMetadata: RevMetaServer.RowMetadata | undefined) {
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (this.metaServer !== undefined && this.metaServer.setRowMetadata !== undefined) {
            this.metaServer.setRowMetadata(subgridRowIndex, newMetadata);
        }
    }

    /**
     * @param subgridRowIndex - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param rowPropertiesPrototype - Prototype for a new properties object when one does not already exist. If you don't define this and one does not already exist, this call will return `undefined`.
     * Typical defined value is `null`, which creates a plain object with no prototype, or `Object.prototype` for a more "natural" object.
     * _(Required when 3rd param provided.)_
     * @returns The row properties object which will be one of:
     * * object - existing row properties object or new row properties object created from `prototype`; else
     * * `false` - RevMetaServer get function not set up; else
     * * `null` - row does not exist
     * * `undefined` - row exists but does not have any properties
     */
    getRowProperties(subgridRowIndex: number): RevMetaServer.RowProperties | undefined {
        const metadata = this.getRowMetadata(subgridRowIndex);
        if (metadata === undefined) {
            return undefined;
        } else {
            return metadata.__ROW;
        }
    }

    setRowProperties(subgridRowIndex: number, properties: RevMetaServer.RowProperties | undefined) {
        const metadata = this.getRowMetadata(subgridRowIndex);
        return this.setRowMetadataRowProperties(subgridRowIndex, metadata, properties);
        // if (metadata) {
        //     metadata.__ROW = Object.create(this._rowPropertiesPrototype);
        // }
    }

    getRowProperty(subgridRowIndex: number, key: string) {
        // undefined return means there is no row properties object OR no such row property `[key]`
        const rowProps = this.getRowProperties(subgridRowIndex);
        if (rowProps === undefined) {
            return undefined;
        } else {
            return rowProps[key as keyof RevMetaServer.RowProperties];
        }
    }

    /**
     * @param subgridRowIndex - Data row index local to `dataModel`.
     * @returns The row height in pixels.
     */
    getRowHeight(subgridRowIndex: number) {
        let rowHeight: number | undefined;
        if (this.rowHeightsCanDiffer) {
            const rowProps = this.getRowProperties(subgridRowIndex);
            if (rowProps !== undefined) {
                rowHeight = rowProps.height;
                if (rowHeight !== undefined) {
                    return rowHeight;
                }
            }
        }

        return this.getDefaultRowHeight();
    }

    getDefaultRowHeight() {
        const definitionDefaultRowHeight = this.definitionDefaultRowHeight;
        if (definitionDefaultRowHeight !== undefined) {
            return definitionDefaultRowHeight;
        } else {
            return this._gridSettings.defaultRowHeight;
        }
    }

    calculateHeight() {
        let height: number;
        const rowCount = this.getRowCount();
        if (rowCount === 0) {
            return 0;
        } else {
            if (this.rowHeightsCanDiffer) {
                height = 0;
                for (let i = 0; i < rowCount; i++) {
                    height += this.getRowHeight(i);
                }
            } else {
                height = rowCount * this.getDefaultRowHeight();
            }

            height += (rowCount - 1) * this._gridSettings.horizontalGridLinesWidth;
            return height;
        }
    }

    calculateRowCountAndHeight(): RevSubgridImplementation.CountAndHeight {
        let height: number;
        const count = this.getRowCount();
        if (count === 0) {
            return {
                count: 0,
                height: 0,
            };
        } else {
            if (this.rowHeightsCanDiffer) {
                height = 0;
                for (let i = 0; i < count; i++) {
                    height += this.getRowHeight(i);
                }
            } else {
                height = count * this.getDefaultRowHeight();
            }

            height += (count - 1) * this._gridSettings.horizontalGridLinesWidth;
            return {
                count,
                height,
            };
        }
    }

    setRowProperty(subgridRowIndex: number, key: string, isHeight: boolean, value: unknown) {
        let metadata = this.getRowMetadata(subgridRowIndex);
        if (metadata === undefined) {
            metadata = Object.create(this._rowPropertiesPrototype) as RevMetaServer.RowMetadata;
        }
        let properties: RevMetaServer.RowProperties | undefined = metadata.__ROW;

        if (value !== undefined) {
            if (properties === undefined) {
                const createdProperties = Object.create(this._rowPropertiesPrototype) as RevMetaServer.RowProperties | null;
                if (createdProperties === null) {
                    throw new RevAssertError('RPBSRP99441');
                } else {
                    properties = createdProperties;
                }
            }
            properties[key as keyof RevMetaServer.RowProperties] = value;
        } else {
            if (properties !== undefined) {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete properties[(isHeight ? '_height' : key) as keyof RevMetaServer.RowProperties]; // If we keep this code, should not use dynamic delete
            }
        }

        return this.setRowMetadataRowProperties(subgridRowIndex, metadata, properties);
    }

    /** @internal */
    private _columnsManagerBeforeCreateColumnsListener = () => { this._viewDataRowProxy.updateSchema(); };

    private setRowMetadataRowProperties(y: number, existingMetadata: RevMetaServer.RowMetadata | undefined, properties: RevMetaServer.RowProperties | undefined) {
        if (existingMetadata === undefined) {
            // Row exists but does not yet have any Metadata
            if (properties !== undefined) {
                existingMetadata = {
                    __ROW: properties,
                }
                this.setRowMetadata(y, existingMetadata);
                return true;
            } else {
                return false;
            }
        } else {
            // Row exists and has Metadata. Just update __ROW
            existingMetadata.__ROW = properties;
            this.setRowMetadata(y, existingMetadata);
            return true;
        }
    }

    /** @internal */
    // getCellEditorAt(columnIndex: number, rowIndex: number, editorName: string, cellEvent: CellEvent): RevCellEditor {
    //     let editor: RevCellEditor | undefined;

    //     const cellModel = this.cellModel;
    //     if (cellModel !== undefined) {
    //         if (cellModel.getCellEditorAt !== undefined) {
    //             editor = cellModel.getCellEditorAt(columnIndex, rowIndex, editorName, cellEvent);
    //         }
    //     }

    //     if (editor === undefined) {
    //         return this._cellEditorFactory.create(this._grid, editorName, cellEvent);
    //     } else {
    //         return editor;
    //     }
    // }

    /** @internal */
    // private handleDataModelEvent(nameOrEvent: RevDataServer.EventName | RevDataServer.Event) {
    //     let type: RevDataServer.EventName;
    //     let dataModelEvent: RevDataServer.Event;
    //     switch (typeof nameOrEvent) {
    //         case 'string':
    //             type = nameOrEvent as RevDataServer.EventName;
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

    //     if (!RevDataServer.REGEX_DATA_EVENT_STRING.test(type)) {
    //         throw new HypergridError('Expected data model event type "' + type + '" to match ' + RevDataServer.REGEX_DATA_EVENT_STRING + '.');
    //     }

    //     const nativeHandler = this.dataModelEventMap[type];
    //     let dispatched: boolean | undefined;
    //     if (nativeHandler) {
    //         dispatched = nativeHandler(dataModelEvent);
    //     }

    //     return dispatched !== undefined ? dispatched : this._dataModelEventDispatchHandler(type, dataModelEvent);
    // }

    /**
     * These handlers are called by {@link dispatchDataModelEvent dataModel.dispatchEvent} to perform Hypergrid housekeeping tasks.
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
     * exports['rev-hypergrid-data-myevent'] = function(event) {
     *     var notCanceled;
     *
     *     PerformHousekeepingTasks();
     *
     *     // optionally re-emit the event as a grid event
     *     import { dispatchGridEvent } from '../../types-utils/dispatchGridEvent.js';
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

}

/** @internal */
export namespace RevSubgridImplementation {
    export interface CountAndHeight {
        count: number; // number of rows
        height: number; // height of all rows in pixels
    }

    export type Handle = number;

    /** @internal */
    export class ViewDataRowProxy<SF extends RevSchemaField> {
        [fieldName: string]: RevDataServer.ViewValue;

        ____rowIndex: number;
        ____fieldNames: string[] = [];

        constructor(readonly schemaServer: RevSchemaServer<SF>, readonly dataServer: RevDataServer<SF>) {
            this.updateSchema(); // is this necessary? If we do not always get the "rev-schema-loaded" event then it is necessary
        }

        updateSchema() {
            const existingCount = this.____fieldNames.length;
            for (let i = 0; i < existingCount; i++) {
                const fieldName = this.____fieldNames[i];
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete this[fieldName];
            }
            const fields = this.schemaServer.getFields();
            const newCount = fields.length;
            this.____fieldNames.length = newCount;
            for (let i = 0; i < newCount; i++) {
                const field = fields[i]; // variable for closure
                const fieldName = field.name;
                this.____fieldNames[i] = fieldName;
                Object.defineProperty(this, fieldName, {
                    // enumerable: true, // is a real data field
                    configurable: true,
                    get: () => { return this.dataServer.getViewValue(field, this.____rowIndex); },
                });
            }
        }
    }

}
