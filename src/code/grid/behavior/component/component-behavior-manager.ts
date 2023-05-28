import { CanvasManager } from '../../components/canvas/canvas-manager';
import { ViewCell } from '../../components/cell/view-cell';
import { ColumnsManager } from '../../components/column/columns-manager';
import { Focus } from '../../components/focus/focus';
import { Mouse } from '../../components/mouse/mouse';
import { Renderer } from '../../components/renderer/renderer';
import { Scroller } from '../../components/scroller/scroller';
import { Selection } from '../../components/selection/selection';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../components/view/view-layout';
import { DataServer } from '../../interfaces/server/data-server';
import { MainSubgrid } from '../../interfaces/server/main-subgrid';
import { MetaModel } from '../../interfaces/server/meta-model';
import { SchemaServer } from '../../interfaces/server/schema-server';
import { Subgrid } from '../../interfaces/server/subgrid';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { GridSettingsAccessor } from '../../settings-accessors/grid-settings-accessor';
import { AssertError } from '../../types-utils/revgrid-error';
import { assignOrDelete } from '../../types-utils/utils';
import { AdapterSetConfig } from './adapter-set-config';
import { CellPropertiesBehavior } from './cell-properties-behavior';
import { DataExtractBehavior } from './data-extract-behavior';
import { EventBehavior } from './event-behavior';
import { FocusScrollBehavior } from './focus-scroll-behavior';
import { FocusSelectBehavior } from './focus-select-behavior';
import { ReindexBehavior } from './reindex-behavior';
import { RowPropertiesBehavior } from './row-properties-behavior';
import { ServerNotificationBehavior } from './server-notification-behavior';

const noExportProperties = [
    'columnHeader',
    'columnHeaderColumnSelection',
    'filterProperties',
    'rowHeader',
    'rowHeaderRowSelection',
];

/**
 * @mixes cellProperties.behaviorMixin
 * @mixes rowProperties.mixin
 * @mixes subgrids.mixin
 * @mixes dataModel.mixin
 * @constructor
 * @desc A controller for the data model.
 * > This constructor (actually `initialize`) will be called upon instantiation of this class or of any class that extends from this class. See {@link https://github.com/joneit/extend-me|extend-me} for more info.
 * @param {Revgrid} grid
 * @param {object} [options] - _(Passed to {@link Behavior#reset reset})._
 * @param {DataServer} [options.dataModel] - _Per {@link BehaviorManager#reset reset}._
 * @param {object} [options.metadata] - _Per {@link BehaviorManager#reset reset}._
 * @param {function} [options.DataModel=require('datasaur-local')] - _Per {@link BehaviorManager#reset reset}._
 * @param {function|object[]} [options.data] - _Per {@link BehaviorManager#setData setData}._
 * @param {function|menuItem[]} [options.schema] - _Per {@link BehaviorManager#setData setData}._
 * @param {subgridSpec[]} [options.subgrids=this.grid.properties.subgrids] - _Per {@link BehaviorManager#setData setData}._
 * @param {boolean} [options.apply=true] - _Per {@link BehaviorManager#setData setData}._
 * @abstract
 */
/** @internal */
export class ComponentBehaviorManager {
    readonly gridSettings: GridSettingsAccessor;
    readonly canvasManager: CanvasManager;
    readonly focus: Focus;
    readonly selection: Selection;
    readonly reindexBehavior: ReindexBehavior;
    readonly columnsManager: ColumnsManager;
    readonly subgridsManager: SubgridsManager;
    readonly viewLayout: ViewLayout;
    readonly renderer: Renderer;
    readonly mouse: Mouse;

    readonly mainSubgrid: MainSubgrid;
    readonly mainDataServer: DataServer;

    readonly horizontalScroller: Scroller;
    readonly verticalScroller: Scroller;

    readonly focusScrollBehavior: FocusScrollBehavior;
    readonly focusSelectBehavior: FocusSelectBehavior;
    readonly eventBehavior: EventBehavior;
    readonly rowPropertiesBehavior: RowPropertiesBehavior;
    readonly cellPropertiesBehavior: CellPropertiesBehavior;
    readonly dataExtractBehavior: DataExtractBehavior;

    private readonly _serverNotificationBehavior: ServerNotificationBehavior;

    constructor(
        containerHtmlElement: HTMLElement,
        canvasContextAttributes: CanvasRenderingContext2DSettings | undefined,
        optionedGridSettings: Partial<GridSettings> | undefined,
        adapterSetConfig: AdapterSetConfig,
        loadBuiltinFinbarStylesheet: boolean,
        descendantEventer: EventBehavior.DescendantEventer,
    ) {
        this.gridSettings = new GridSettingsAccessor();
        this.gridSettings.loadDefaults();
        if (optionedGridSettings !== undefined) {
            this.gridSettings.merge(optionedGridSettings);
        }

        this.canvasManager = new CanvasManager(
            containerHtmlElement,
            canvasContextAttributes,
            this.gridSettings,
            () => this.processCanvasResizedEvent(),
        );

        let schemaServer = adapterSetConfig.schemaServer;
        if (typeof schemaServer === 'function') {
            schemaServer = new schemaServer();
        }

        this.columnsManager = new ColumnsManager(
            schemaServer,
            this.gridSettings,
            () => this.invalidateHorizontalAll(true),
        );

        const subgridDefinitions = adapterSetConfig.subgrids;
        if  (subgridDefinitions.length === 0) {
            throw new AssertError('CBM43330', 'Adapter set missing Subgrid specs');
        } else {
            const defaultRowPropertiesPrototype = new ComponentBehaviorManager.DefaultRowProperties(
                this.gridSettings,
                () => this.invalidateHorizontalAll(true),
            );

            this.subgridsManager = new SubgridsManager(
                this.gridSettings,
                this.columnsManager,
                subgridDefinitions,
                defaultRowPropertiesPrototype,
            );

            this.mainSubgrid = this.subgridsManager.mainSubgrid;
            this.mainDataServer = this.mainSubgrid.dataServer;

            this.viewLayout = new ViewLayout(
                this.gridSettings,
                this.canvasManager,
                this.columnsManager,
                this.subgridsManager,
            );

            this.focus = new Focus(
                this.gridSettings,
                this.mainSubgrid,
                this.columnsManager,
                this.viewLayout,
                (cell) => this.invalidateViewCellRender(cell),
            );

            this.selection = new Selection(
                this.gridSettings,
                this.columnsManager,
            );

            this.renderer = new Renderer(
                this.gridSettings,
                this.mouse,
                this.canvasManager,
                this.columnsManager,
                this.subgridsManager,
                this.viewLayout,
                this.focus,
                this.selection,
                () => this.processRenderedEvent(),
            );

            // Set up UI controls

            this.mouse = new Mouse(
                this.canvasManager,
                this.viewLayout,
                (cell, invalidateViewCellRender) => this.processMouseEnteredCellEvent(cell, invalidateViewCellRender),
                (cell, invalidateViewCellRender) => this.processMouseExitedCellEvent(cell, invalidateViewCellRender),
            );

            this.verticalScroller = new Scroller(
                this.viewLayout.verticalScrollDimension,
                this.canvasManager.instanceId,
                false,
                'vertical',
                true,
                1,
                this.gridSettings.wheelVFactor,
                this.gridSettings.vScrollbarClassPrefix,
                loadBuiltinFinbarStylesheet,
                containerHtmlElement,
                undefined,
            );
            containerHtmlElement.appendChild(this.verticalScroller.bar);

            this.horizontalScroller = new Scroller(
                this.viewLayout.horizontalScrollDimension,
                this.canvasManager.instanceId,
                false,
                'horizontal',
                true,
                this.gridSettings.wheelHFactor,
                1,
                this.gridSettings.hScrollbarClassPrefix,
                loadBuiltinFinbarStylesheet,
                containerHtmlElement,
                this.verticalScroller,
            );
            containerHtmlElement.appendChild(this.horizontalScroller.bar);

            // Set up model callback handling

            // Set up behaviors

            this.eventBehavior = new EventBehavior(
                this.canvasManager,
                this.columnsManager,
                this.viewLayout,
                this.selection,
                this.horizontalScroller,
                this.verticalScroller,
                descendantEventer,
                (event) => this.canvasManager.dispatchEvent(event),
            );

            this.reindexBehavior = new ReindexBehavior(
                this.focus,
                this.selection
            );

            this._serverNotificationBehavior = new ServerNotificationBehavior(
                this.columnsManager,
                this.subgridsManager,
                this.viewLayout,
                this.focus,
                this.selection,
                this.renderer,
                this.reindexBehavior,
            );

            this.focusScrollBehavior = new FocusScrollBehavior(
                this.gridSettings,
                this.mainSubgrid,
                this.columnsManager,
                this.subgridsManager,
                this.viewLayout,
                this.focus,
            );

            this.focusSelectBehavior = new FocusSelectBehavior(
                this.gridSettings,
                this.selection,
                this.focus,
                this.viewLayout,
                (x, y, subgrid) => {
                    // if (subgrid === this._focus.subgrid && x >= this.gridSettings.fixedColumnCount && y >= this.gridSettings.fixedRowCount) {
                    //     this.focusBehavior.focusXYAndEnsureInView(x, y)
                    // }
                },
            );

            this.rowPropertiesBehavior = new RowPropertiesBehavior(
                this.viewLayout,
            );

            this.cellPropertiesBehavior = new CellPropertiesBehavior(
                this.columnsManager,
                this.subgridsManager,
                this.viewLayout,
            );

            this.dataExtractBehavior = new DataExtractBehavior(
                this.selection,
                this.columnsManager
            );
        }
    }

    /**
     * Reset the behavior.
     * @param {object} [options] - _Same as constructor's `options`._<br>
     * _Passed to {@link BehaviorManager#resetDataModel resetDataModel} and {@link BehaviorManager#setData setData} (both of which see)._
     * @internal
     */
    reset() {
        this.viewLayout.reset();
        this.focus.reset();
        this.mouse.reset();

        this.columnsManager.clearColumns();

        // this._columnsManager.createColumns();
        // if (options?.data !== undefined) {
        //     this.setData(options.data);
        // }

        this.canvasManager.resize(false);
        // this.behaviorChanged();

        this.viewLayout.invalidateAll(true);
        // this.behavior.defaultRowHeight = null;
        // this._columnsManager.autosizeAllColumns();

        // this.checkLoadDataModelMetadata(options);
        // const dataModelChanged = this.resetMainDataModel(options);

        // this._rowPropertiesPrototype = DefaultRowProperties;


        // /**
        //  * Ordered list of subgrids to render.
        //  * @type {subgridSpec[]}
        //  */
        // if (options !== undefined && options.subgrids !== undefined && options.subgrids.length > 0) {
        //     this.setSubgrids(options.subgrids);
        // } else {
        //     if (!dataModelChanged && this.subgrids) {
        //         // do nothing and keep existing
        //     } else {
        //         const gridPropertiesSubgrids = this.grid.properties.subgrids;
        //         if (gridPropertiesSubgrids !== undefined && gridPropertiesSubgrids.length > 0) {
        //             this.setSubgrids(gridPropertiesSubgrids);
        //         } else {
        //             this.setSubgrids([Subgrid.RoleEnum.main]);
        //         }
        //     }
        // }
    }

    /**
     * @description Set the header labels.
     * @param headers - The header labels. One of:
     * * _If an array:_ Must contain all headers in column order.
     * * _If a hash:_ May contain any headers, keyed by field name, in any order.
     */
    // setHeaders(headers: string[] | Record<string, string>) {
    //     if (headers instanceof Array) {
    //         // Reset all headers
    //         const allColumns = this._allColumns;
    //         headers.forEach((header, index) => {
    //             allColumns[index].header = header; // setter updates header in both column and data source objects
    //         });
    //     } else if (typeof headers === 'object') {
    //         // Adjust just the headers in the hash
    //         this._allColumns.forEach((column) => {
    //             if (headers[column.name]) {
    //                 column.header = headers[column.name];
    //             }
    //         });
    //     }
    // }

    destroy() {
        this.renderer.stop();
        this.canvasManager.stop();
        this._serverNotificationBehavior.destroy();
        this.eventBehavior.destroy();
        // this.focusScrollBehavior.destroy();
        this.horizontalScroller.destroy();
        this.verticalScroller.destroy();
        this.renderer.destroy();
        this.selection.destroy();
        this.subgridsManager.destroy();
    }

    allowEvents(allow: boolean){
        if (allow){
            this._serverNotificationBehavior.enableNotifications();
        } else {
            this._serverNotificationBehavior.disableNotifications();
        }

        this.viewLayout.invalidateAll(true);
    }

    addSettings(settings: Partial<GridSettings>) {
        const result = this.gridSettings.merge(settings);
        if (result) {
            this.viewLayout.invalidateAll(true);
        }
        return result;
    }

    /**
     * @desc utility function to empty an object of its members
     * @param obj - the object to empty
     * @param exportProps
     * * `undefined` (omitted) - delete *all* properties
     * * **falsy** - delete *only* the export properties
     * * **truthy** - delete all properties *except* the export properties
     * @internal
     */
    clearObjectProperties(obj: Record<string, unknown>, exportProps?: boolean) {
        for (const key in obj) {
            if (
                Object.prototype.hasOwnProperty.call(obj, key) && (
                    exportProps === undefined ||
                    !exportProps && noExportProperties.indexOf(key) >= 0 ||
                    exportProps && noExportProperties.indexOf(key) < 0
                )
            ) {
                delete obj[key];
            }
        }
    }

    //this is effectively a clone, with certain things removed....
    /** @internal */
    getState() {
        // copy.columnProperties does not exist. Not sure what this is doing.
        const copy = JSON.parse(JSON.stringify(this.gridSettings));
        this.clearObjectProperties(copy.columnProperties, false);
        return copy;
    }

    /**
     * @desc Restore this table to a previous state.
     * See the [memento pattern](http://c2.com/cgi/wiki?MementoPattern).
     * @param properties - assignable grid properties
     */
    setState(properties: Record<string, unknown>) {
        this.addState(properties, true);
    }

    /**
     * @param settings - assignable grid properties
     * @param fromDefault - Clear properties object before assignments.
     */
    addState(settings: Record<string, unknown>, fromDefault: boolean) {
        if (fromDefault) {
            // clear all table state
            this.gridSettings.loadDefaults();
            this.columnsManager.createColumns();
        }

        const gridSettings = this.gridSettings as GridSettings; // this may not work

        gridSettings.settingState = fromDefault;
        assignOrDelete(gridSettings, settings);
        delete gridSettings.settingState;

        this.viewLayout.invalidateAll(true);
    }

    /**
     * @desc fetch the value for a property key
     * @returns The value of the given property.
     * @param key - a property name
     */
    // resolveProperty(key) {
    //     // todo: remove when we remove the deprecated grid.resolveProperty
    //     return this.grid.resolveProperty(key);
    // }

    /**
     * @desc a dnd column has just been dropped, we've been notified
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    endDragColumnNotification() {

    }

    /**
     * @summary Column alignment of given grid column.
     * @desc One of:
     * * `'left'`
     * * `'center'`
     * * `'right'`
     *
     * Cascades to grid.
     * @desc Quietly set the horizontal scroll position.
     * @param x - The new position in pixels.
     */
    // setScrollPositionX(x: number) {
    //     this.scrollPositionX = x;
    // }

    /**
     * @return The cell editor for the cell at the given coordinates.
     * @param editPoint - The grid cell coordinates.
     * @internal
     */
    getCellEditorAt(event: ViewCell) {
        return undefined;
        // return event.column.getCellEditorAt(event);
    }

    /**
     * @return `true` if we should highlight on hover
     * @param isColumnHovered - the column is hovered or not
     * @param isRowHovered - the row is hovered or not
     */
    highlightCellOnHover(isColumnHovered: boolean, isRowHovered: boolean): boolean {
        return isColumnHovered && isRowHovered;
    }

    getValue(x: number, y: number, subgrid: Subgrid | undefined) {
        const column = this.columnsManager.getActiveColumn(x);
        const schemaColumn = column.schemaColumn;
        const dataServer = subgrid === undefined ? this.mainDataServer : subgrid.dataServer;
        return dataServer.getValue(schemaColumn, y);
    }

    /**
     * @summary Update the value at cell (x,y) with the given value.
     * @desc When the last parameter (see `dataModel` below) is omitted, this method:
     * * Is backwards compatible to the v2 version.
     * * Does _not_ default to the data subgrid — although you can provide it explicitly (`this.behavior.dataModel`).
     * @param x - The horizontal coordinate.
     * @param y - The vertical coordinate.
     * @param value - New cell data.
     * @param subgrid - `x` and `y` are _data cell coordinates_ in the given subgrid data model. If If omitted, `x` and `y` are _grid cell coordinates._
     */
    setValue(schemaColumn: SchemaServer.Column, x: number, y: number, value: unknown, subgrid?: Subgrid) {
        const dataServer = subgrid === undefined ? this.mainDataServer : subgrid.dataServer;
        if (dataServer.setValue === undefined) {
            throw new AssertError('BSV32220');
        } else {
            dataServer.setValue(schemaColumn, y, value);
        }
    }

    // private handleBehaviorChangedEvent() {
    //     if (!this._destroyed) {
    //         const columnCount = this.columnsManager.allColumnCount;
    //         const rowCount = this._mainSubgrid.getRowCount();
    //         if (columnCount !== this._behaviorChangeCheckColumnCount || rowCount !== this._behaviorChangeCheckRowCount) {
    //             this._behaviorChangeCheckColumnCount = columnCount;
    //             this._behaviorChangeCheckRowCount = rowCount;
    //             this.behaviorShapeChanged();
    //         } else {
    //             this.behaviorStateChanged();
    //         }
    //     }
    // }

    private processRenderedEvent() {
        this.eventBehavior.processRenderedEvent();
    }

    private processMouseEnteredCellEvent(cell: ViewCell, invalidateViewCellRender: boolean) {
        if (invalidateViewCellRender) {
            this.renderer.invalidateViewCellRender(cell)
        }
        this.eventBehavior.processMouseEnteredCellEvent(cell);
    }

    private processMouseExitedCellEvent(cell: ViewCell, invalidateViewCellRender: boolean) {
        if (invalidateViewCellRender) {
            this.renderer.invalidateViewCellRender(cell)
        }
        this.eventBehavior.processMouseExitedCellEvent(cell);
    }

    private processCanvasResizedEvent() {
        this.horizontalScroller.resize();
        this.verticalScroller.resize();
        this.viewLayout.invalidateAll(true);
        this.eventBehavior.processCanvasResizedEvent();
    }

    private invalidateHorizontalAll(scrollablePlaneDimensionAsWell: boolean) {
        this.viewLayout.invalidateHorizontalAll(scrollablePlaneDimensionAsWell);
    }

    private invalidateViewCellRender(cell: ViewCell) {
        this.renderer.invalidateViewCellRender(cell);
    }
}

export namespace ComponentBehaviorManager {
    export class DefaultRowProperties implements MetaModel.HeightRowProperties {
        private _height: number | undefined;

        constructor(
            private readonly _gridProperties: GridSettings,
            private readonly _invalidateScrollDimensionRequiredEventer: DefaultRowProperties.InvalidateScrollDimensionRequiredEventer,
        ) {
        }

        get height() {
            return this._height ?? this._gridProperties.defaultRowHeight;
        }

        set height(height: number | undefined) {
            if (typeof height !== 'number' || isNaN(height)) {
                height = undefined;
            }
            if (height !== this._height) {
                if (height === undefined) {
                    delete this._height;
                } else {
                    height = Math.max(5, Math.ceil(height));
                    // Define `_height` as non-enumerable so won't be included in output of saveState.
                    // (Instead the `height` getter is explicitly invoked and the result is included.)
                    Object.defineProperty(this, '_height', { value: height, configurable: true });
                }
                this._invalidateScrollDimensionRequiredEventer();
            }
        }
    }

    export namespace DefaultRowProperties {
        export type InvalidateScrollDimensionRequiredEventer = (this: void) => void;
    }
}
