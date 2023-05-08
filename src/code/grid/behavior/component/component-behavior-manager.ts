import { CanvasEx } from '../../components/canvas-ex/canvas-ex';
import { ViewCell } from '../../components/cell/view-cell';
import { ColumnsManager } from '../../components/column/columns-manager';
import { Focus } from '../../components/focus/focus';
import { ModelCallbackRouter } from '../../components/model-callback-router/model-callback-router';
import { ReindexStashManager } from '../../components/model-callback-router/reindex-stash-manager';
import { Mouse } from '../../components/mouse/mouse';
import { Renderer } from '../../components/renderer/renderer';
import { Scroller } from '../../components/scroller/scroller';
import { Selection } from '../../components/selection/selection';
import { Subgrid } from '../../components/subgrid/subgrid';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ScrollablePlane } from '../../components/view/scrollable-plane';
import { ViewLayout } from '../../components/view/view-layout';
import { ColumnInterface } from '../../interfaces/column-interface';
import { DataModel } from '../../interfaces/data-model';
import { GridSettings } from '../../interfaces/grid-settings';
import { MetaModel } from '../../interfaces/meta-model';
import { SchemaModel } from '../../interfaces/schema-model';
import { AssertError } from '../../lib/revgrid-error';
import { ListChangedTypeId } from '../../lib/types';
import { assignOrDelete } from '../../lib/utils';
import { GridSettingsAccessor } from '../../settings-accessors/grid-settings-accessor';
import { AdapterSetConfig } from './adapter-set-config';
import { CellPropertiesBehavior } from './cell-properties-behavior';
import { DataExtractBehavior } from './data-extract-behavior';
import { EventBehavior } from './event-behavior';
import { FocusBehavior } from './focus-behavior';
import { ModelCallbackRouterBehavior } from './model-callback-router-behavior';
import { RowPropertiesBehavior } from './row-properties-behavior';
import { ScrollBehavior } from './scroll-behaviour';
import { SelectionBehavior } from './selection-behavior';

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
 * @param {DataModel} [options.dataModel] - _Per {@link BehaviorManager#reset reset}._
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
    readonly canvasEx: CanvasEx;
    readonly mouse: Mouse;
    readonly focus: Focus;
    readonly selection: Selection;
    readonly reindexStashManager: ReindexStashManager;
    readonly columnsManager: ColumnsManager;
    readonly subgridsManager: SubgridsManager;
    readonly viewLayout: ViewLayout; // make private in future
    readonly renderer: Renderer; // make private in future

    readonly scrollBehavior: ScrollBehavior;
    readonly focusBehavior: FocusBehavior;
    readonly selectionBehavior: SelectionBehavior;
    readonly eventBehavior: EventBehavior;
    readonly rowPropertiesBehavior: RowPropertiesBehavior;
    readonly cellPropertiesBehavior: CellPropertiesBehavior;
    readonly dataExtractBehavior: DataExtractBehavior;

    private readonly _modelCallbackRouter: ModelCallbackRouter;
    private readonly _scrollablePlane: ScrollablePlane;
    private readonly _horizontalScroller: Scroller;
    private readonly _verticalScroller: Scroller;

    private readonly _modelCallbackRouterBehavior: ModelCallbackRouterBehavior;

    private _destroyed = false;
    private _mainSubgrid: Subgrid;
    private _mainDataModel: DataModel;
    private _behaviorChangeCheckRowCount = 0;
    private _behaviorChangeCheckColumnCount = 0;
    private _needsShapeChanged = false;

    // Start RowProperties Mixin
    /** @internal */
    // private _height: number;
    // defaultRowHeight: number;
    // End RowProperties Mixin

    // Start DataModel Mixin
    // allColumns: Behavior.ColumnArray;
    // End DataModel Mixin

    // Start RowProperties Mixin
    // get height() {
    //     return this._height || this.defaultRowHeight;
    // }
    // set height(height: number) {
    //     height = Math.max(5, Math.ceil(height));
    //     if (isNaN(height)) {
    //         height = undefined;
    //     }
    //     if (height !== this._height) {
    //         this._height = height; // previously set as not enumerable
    //         this.grid.behaviorStateChanged();
    //     }
    // }
    // End RowProperties Mixin

    constructor(
        containerHtmlElement: HTMLElement,
        canvasContextAttributes: CanvasRenderingContext2DSettings | undefined,
        optionedGridProperties: Partial<GridSettings> | undefined,
        rowPropertiesPrototype: MetaModel.RowPropertiesPrototype | undefined,
        adapterSetConfig: AdapterSetConfig,
        loadBuiltinFinbarStylesheet: boolean,
        descendantEventer: EventBehavior.DescendantEventer,
    ) {
        this.gridSettings = new GridSettingsAccessor();
        this.gridSettings.loadDefaults();
        if (optionedGridProperties !== undefined) {
            this.gridSettings.merge(optionedGridProperties);
        }

        rowPropertiesPrototype ??= new ComponentBehaviorManager.DefaultRowProperties(
            this.gridSettings,
            () => this.behaviorStateChanged(),
        )

        this.canvasEx = new CanvasEx(
            containerHtmlElement,
            canvasContextAttributes,
            this.gridSettings,
            () => this.processCanvasResizedEvent(),
        );

        this.columnsManager = new ColumnsManager(
            this.gridSettings,
            () => this.behaviorChanged(),
            () => this.updateHorizontalScroll(),
            (typeId, index, count, targetIndex) => this.processAllColumnListChanged(typeId, index, count, targetIndex),
            (typeId, index, count, targetIndex, ui) => this.processActiveColumnListChanged(typeId, index, count, targetIndex, ui),
            (columns, ui) => this.processColumnsWidthChanged(columns, ui),
        );

        this.subgridsManager = new SubgridsManager(
            this.gridSettings,
            this.columnsManager,
        );

        this._modelCallbackRouter = new ModelCallbackRouter(this.columnsManager.schemaModel);

        this._scrollablePlane = new ScrollablePlane(
            this.gridSettings,
            this.columnsManager,
        );

        this.viewLayout = new ViewLayout(
            this.gridSettings,
            this.canvasEx,
            this.columnsManager,
            this.subgridsManager,
            this.selection,
            (y, subgrid) => this.rowPropertiesBehavior.getRowHeight(y, subgrid === undefined ? this.subgridsManager.mainSubgrid : subgrid),
            () => this.processCheckNeedsShapeChanged(),
            (changedColumnsViewWidths) => this.processColumnsViewWidthsChanged(changedColumnsViewWidths),
        );

        this.renderer = new Renderer(
            this.gridSettings,
            this.mouse,
            this.canvasEx,
            this.columnsManager,
            this.subgridsManager,
            this.viewLayout,
            this.focus,
            this.selection,
            () => this.behaviorShapeChanged(),
            () => this.processRenderedEvent(),
        );

        this._horizontalScroller = this.createHorizontalScrollbar(containerHtmlElement, loadBuiltinFinbarStylesheet);
        containerHtmlElement.appendChild(this._horizontalScroller.bar);
        this._verticalScroller = this.createVerticalScrollbar(containerHtmlElement, loadBuiltinFinbarStylesheet);
        containerHtmlElement.appendChild(this._verticalScroller.bar);

        this.loadAdapterSet(adapterSetConfig);

        this.mouse = new Mouse(
            this.canvasEx,
            (cell) => this.processMouseEnteredCellEvent(cell),
            (cell) => this.processMouseExitedCellEvent(cell),
        );
        this.focus = new Focus(
            this._mainSubgrid,
            this.columnsManager,
            (x, y, maximally) => this.handleScrollToMakeVisibleEvent(x, y, maximally)
        );
        this.selection = new Selection(this.gridSettings, this.columnsManager, this.focus, this._mainSubgrid);

        this.reindexStashManager = new ReindexStashManager(this.focus, this.selection);

        this.eventBehavior = new EventBehavior(
            this.canvasEx,
            this.selection,
            this.viewLayout,
            descendantEventer,
            (event) => this.canvasEx.dispatchEvent(event),
        );

        this.scrollBehavior = new ScrollBehavior(
            this.gridSettings,
            this.canvasEx,
            this.columnsManager,
            this.subgridsManager,
            this.viewLayout,
            this._horizontalScroller,
            this._verticalScroller,
            () => this.handleBehaviorChangedEvent(),
            (isX, newValue, index, offset) => this.eventBehavior.processScrollEvent(isX, newValue, index, offset),
            (y, subgrid) => this.getRowHeight(y, subgrid),
        );

        this.focusBehavior = new FocusBehavior(
            this.gridSettings,
            this.mainSubgrid,
            this.columnsManager,
            this.subgridsManager,
            this.viewLayout,
            this.focus,
            (x) => this.scrollBehavior.scrollXToMakeVisible(x, true),
            (y) => this.scrollBehavior.scrollYToMakeVisible(y, true),
            (x, y) => this.scrollBehavior.scrollXYToMakeVisible(x, y, true),
        );

        this.selectionBehavior = new SelectionBehavior(
            this.selection,
            this.focus,
            this.viewLayout,
            this.mouse,
            () => this.renderer.repaint(),
            () => this.eventBehavior.processSelectionChangedEvent(),
            (x, y) => this.focusBehavior.focusXY(x, y),
        );

        this.rowPropertiesBehavior = new RowPropertiesBehavior(
            this.gridSettings,
            rowPropertiesPrototype,
            () => this.behaviorStateChanged(),
            () => this.behaviorShapeChanged(),
        );

        this.cellPropertiesBehavior = new CellPropertiesBehavior(
            this.columnsManager,
            this.subgridsManager,
            this.viewLayout,
        );

        this._modelCallbackRouterBehavior = new ModelCallbackRouterBehavior(
            this.columnsManager,
            this.subgridsManager,
            this.renderer,
            this.focus,
            this.selection,
            this._modelCallbackRouter,
            this.reindexStashManager,
            () => this.behaviorShapeChanged(),
        );

        this.dataExtractBehavior = new DataExtractBehavior(
            this.selection,
            this.columnsManager
        );
    }

    get mainSubgrid() { return this._mainSubgrid; }
    get mainDataModel() { return this._mainDataModel; }

    /**
     * Reset the behavior.
     * @param {object} [options] - _Same as constructor's `options`._<br>
     * _Passed to {@link BehaviorManager#resetDataModel resetDataModel} and {@link BehaviorManager#setData setData} (both of which see)._
     * @internal
     */
    reset() {
        this._behaviorChangeCheckRowCount = 0;
        this._behaviorChangeCheckColumnCount = 0;
        this.mouse.reset();
        this.mouse.clearMouseDown();
        this.viewLayout.reset();
        this.scrollBehavior.reset();

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
        this._destroyed = true;
        this._modelCallbackRouter.destroy();
        this.eventBehavior.destroy();
        this.scrollBehavior.destroy();
        this.selectionBehavior.destroy();
        this.subgridsManager.destroy();
        this.selection.destroy();
        this.renderer.stop();
        this.canvasEx.stop();
        this.renderer.destroy();
    }

    allowEvents(allow: boolean){
        this.canvasEx.eventsEnabled = allow;

        if (allow){
            this._modelCallbackRouter.enable();
        } else {
            this._modelCallbackRouter.disable();
        }

        this.behaviorChanged();
    }

    behaviorShapeChanged() {
        if (this.paintLoopRunning()) {
            this._needsShapeChanged = true;
            this.renderer.requestPaint();
        } else if (!this._destroyed) {
            this.scrollBehavior.synchronizeScrollingBoundaries(); // calls computeCellsBounds
            this.renderer.repaint();
        }
    }

    /**
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    behaviorStateChanged() {
        if (this.paintLoopRunning()) {
            this.viewLayout.invalidate();
            this.renderer.requestPaint();
        } else {
            if (!this._destroyed) {
                this.viewLayout.compute(false);
                this.renderer.repaint();
            }
        }
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
     * @param properties - assignable grid properties
     * @param settingState - Clear properties object before assignments.
     */
    addState(properties: Record<string, unknown>, settingState: boolean) {
        if (settingState) {
            // clear all table state
            this.gridSettings.loadDefaults();
            this.columnsManager.createColumns();
        }

        const gridSettings = this.gridSettings as GridSettings; // this may not work

        gridSettings.settingState = settingState;
        assignOrDelete(gridSettings, properties);
        delete gridSettings.settingState;
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

    // getSelectionMatrixFunction(selectedRows) {
    //     return function() {
    //         return null;
    //     };
    // }


    // Start DataModel Mixin
    // getSchema() {
    //     return this.schemaModel;
    // }

    // setSchema(newSchema) {
    //     this.mainDataModel.setSchema(newSchema);
    // }

    getValue(x: number, y: number, subgrid: Subgrid | undefined) {
        const column = this.columnsManager.getActiveColumn(x);
        const schemaColumn = column.schemaColumn;
        const dataModel = subgrid === undefined ? this._mainDataModel : subgrid.dataModel;
        return dataModel.getValue(schemaColumn, y);
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
    setValue(schemaColumn: SchemaModel.Column, x: number, y: number, value: unknown, subgrid?: Subgrid) {
        const dataModel = subgrid === undefined ? this._mainDataModel : subgrid.dataModel;
        if (dataModel.setValue === undefined) {
            throw new AssertError('BSV32220');
        } else {
            dataModel.setValue(schemaColumn, y, value);
        }
    }

    behaviorChanged() {
        this.handleBehaviorChangedEvent();
    }

    private handleBehaviorChangedEvent() {
        if (!this._destroyed) {
            const columnCount = this.columnsManager.allColumnCount;
            const rowCount = this._mainSubgrid.getRowCount();
            if (columnCount !== this._behaviorChangeCheckColumnCount || rowCount !== this._behaviorChangeCheckRowCount) {
                this._behaviorChangeCheckColumnCount = columnCount;
                this._behaviorChangeCheckRowCount = rowCount;
                this.behaviorShapeChanged();
            } else {
                this.behaviorStateChanged();
            }
        }
    }

    private handleScrollToMakeVisibleEvent(x: number, y: number, maximally: boolean) {
        this.scrollBehavior.scrollXYToMakeVisible(x, y, maximally);
    }

    private loadAdapterSet(adapterSetConfig: AdapterSetConfig) {
        let schemaModel = adapterSetConfig.schemaModel;
        if (typeof schemaModel === 'function') {
            schemaModel = new schemaModel();
        }
        this.columnsManager.schemaModel = schemaModel;

        const subgridDefinitions = adapterSetConfig.subgrids;
        if  (subgridDefinitions.length === 0) {
            throw new AssertError('BLAS43330', 'Adapter set missing Subgrid specs');
        } else {
            this.subgridsManager.loadSubgrids(subgridDefinitions);
            // This is the only place where mainSubgrid is set. Update caches of mainSubgrid and mainDataModel directly instead of via events
            // to avoid circular use loop between subsgridsManager and Focus
            const mainSubgrid = this.subgridsManager.mainSubgrid;
            const mainDataModel = mainSubgrid.dataModel;
            this._mainSubgrid = mainSubgrid;
            this._mainDataModel = mainDataModel;
            this.viewLayout.updateMainSubgrid();
        }
    }

    private getRowHeight(y: number, subgrid: Subgrid) {
        return this.rowPropertiesBehavior.getRowHeight(y, subgrid);
    }

    private processCheckNeedsShapeChanged() {
        if (this._needsShapeChanged) {
            this.scrollBehavior.synchronizeScrollingBoundaries(); // calls computeCellsBounds
        }
    }

    private processAllColumnListChanged(typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined) {
        this.eventBehavior.processAllColumnListChangedEvent(typeId, index, count, targetIndex);
        this.behaviorChanged();
    }

    private processActiveColumnListChanged(typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined, ui: boolean) {
        this.eventBehavior.processActiveColumnListChangedEvent(typeId, index, count, targetIndex, ui);
        this.behaviorChanged();
    }

    private processColumnsWidthChanged(columns: ColumnInterface[], ui: boolean) {
        this.eventBehavior.processColumnsWidthChangedEvent(columns, ui);
        this.behaviorStateChanged();
    }

    private processColumnsViewWidthsChanged(changedColumnsViewWidths: ViewLayout.ChangedColumnsViewWidths) {
        this.eventBehavior.processColumnsViewWidthsChanged(changedColumnsViewWidths);
    }

    private processRenderedEvent() {
        this.eventBehavior.processRenderedEvent();
    }

    private processMouseEnteredCellEvent(cell: ViewCell) {
        this.eventBehavior.processMouseEnteredCellEvent(cell);
    }

    private processMouseExitedCellEvent(cell: ViewCell) {
        this.eventBehavior.processMouseExitedCellEvent(cell);
    }

    private processCanvasResizedEvent() {
        this.behaviorShapeChanged();
        this.eventBehavior.processCanvasResizedEvent();
    }

    private createHorizontalScrollbar(containerHtmlElement: HTMLElement, loadBuiltinFinbarCssStylesheet: boolean) {
        const horzBar = new Scroller(
            this._scrollablePlane.horizontalDimension,
            {
                orientation: Scroller.OrientationEnum.horizontal,
                deltaXFactor: this.gridSettings.wheelHFactor,
                loadBuiltinCssStylesheet: loadBuiltinFinbarCssStylesheet,
                cssStylesheetReferenceElement: containerHtmlElement
            }
        );

        const hPrefix = this.gridSettings.hScrollbarClassPrefix;

        if (hPrefix && hPrefix !== '') {
            horzBar.classPrefix = hPrefix;
        }

        return horzBar;
    }

    private createVerticalScrollbar(containerHtmlElement: HTMLElement, loadBuiltinFinbarCssStylesheet: boolean) {
        const vertBar = new Scroller(
            this._scrollablePlane.verticalDimension,
            {
                indexMode: true, // remove when vertical scrollbar is updated to use viewport
                orientation: Scroller.OrientationEnum.vertical,
                deltaYFactor: this.gridSettings.wheelVFactor,
                loadBuiltinCssStylesheet: loadBuiltinFinbarCssStylesheet,
                cssStylesheetReferenceElement: containerHtmlElement,
            }
        );

        const vPrefix = this.gridSettings.vScrollbarClassPrefix;

        if (vPrefix && vPrefix !== '') {
            vertBar.classPrefix = vPrefix;
        }

        return vertBar;
    }

    private updateHorizontalScroll() {
        this.scrollBehavior.updateHorizontalScroll(true)
        this.behaviorChanged(); // this probably is not required
    }

    /** @internal */
    private paintLoopRunning() {
        return !this.gridSettings.repaintImmediately && this.renderer.painting;
    }

    // End DataModel Mixin

    // Begin Local

    // protected abstract readonly schema: ColumnSchema[];
    // protected abstract createDataRowProxy(): void;
    // protected abstract resetMainDataModel(options?: Hypergrid.Options): boolean;
    // abstract charMap: DataModel.DrillDownCharMap;
    // abstract cellClicked(event: CellEvent): boolean | undefined;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // hasTreeColumn(columnIndex?: number) {
    //     return false;
    // }
    // abstract createLocalDataModel(subgridRole: Subgrid.Role): DataModel;
    // boundDispatchEvent: DataModel.EventListener;

    /**
     * @summary Attach a data model object to the grid.
     * @desc Installs data model events, fallbacks, and hooks.
     *
     * Called from {@link Behavior#reset}.
     * @param options
     * @param options.dataModel - A fully instantiated data model object.
     * @param options.dataModelConstructorOrArray - Data model will be instantiated from this constructor unless `options.dataModel` was given.
     * @param options.metadata - Passed to {@link DataModel#setMetadataStore setMetadataStore}.
     * @returns `true` if the data model has changed.
     */
    // private resetMainDataModel(options?: Hypergrid.Options) {
    //     const newDataModel = this.getNewMainDataModel(options);
    //     const changed = newDataModel !== undefined && newDataModel !== this.mainDataModel;

    //     if (changed) {
    //         this.mainDataModel = newDataModel;
    //         this.mainSubgrid = this.createSubgrid(newDataModel, Subgrid.RoleEnum.main);
    //         // decorators.addDeprecationWarnings.call(this);
    //         // decorators.addFriendlierDrillDownMapKeys.call(this);
    //         this.checkLoadDataModelMetadata(newDataModel, options?.metadata);
    //     }

    //     return changed;
    // }

    // private checkLoadDataModelMetadata(options: Hypergrid.Options | undefined) {
    //     const metadata = options?.metadata
    //     if (metadata !== undefined) {
    //         if (this.mainDataModel.setMetadataStore) {
    //             this.mainDataModel.setMetadataStore(metadata);
    //         } else {
    //             throw new HypergridError('Metadata specified in options but no DataModel does not support setMetadataStore');
    //         }
    //     }
    // }

    /**
     * Create a new data model
     * @param options.dataModel - A fully instantiated data model object.
     */
    // private getNewMainDataModel(options?: Hypergrid.Options) {
    //     let dataModel: DataModel;

    //     options = options ?? {};

    //     if (options.dataModel !== undefined) {
    //         dataModel = options.dataModel;
    //     } else {
    //         const dataModelConstructorOrArray = options.dataModelConstructorOrArray;
    //         if (dataModelConstructorOrArray !== undefined) {
    //             dataModel = this.createLocalDataModel(Subgrid.RoleEnum.main);
    //             this.checkLoadDataModelMetadata(dataModel);
    //         } else {
    //             if (!Array.isArray(dataModelConstructorOrArray)) {
    //                 dataModel = new dataModelConstructorOrArray();
    //             } else {
    //                 if (dataModelConstructorOrArray.length === 0) {
    //                     dataModel = new LocalMainDataModel();
    //                 } else {
    //                     dataModelConstructorOrArray.forEach((constructor) => {
    //                         dataModel = new constructor(dataModel);
    //                     });
    //                 }
    //             }
    //         }
    //     }

    //     return dataModel;
    // }

    // End Local
}


// function warnBehaviorFeaturesDeprecation() {
//     var featureNames = [], unregisteredFeatures = [], n = 0;

//     this.features.forEach(function(FeatureConstructor) {
//         var className = FeatureConstructor.prototype.$$CLASS_NAME || FeatureConstructor.name,
//             featureName = className || 'feature' + n++;

//         // build list of feature names
//         featureNames.push(featureName);

//         // build list of unregistered features
//         if (!this.featureRegistry.get(featureName, true)) {
//             var constructorName = FeatureConstructor.name || FeatureConstructor.prototype.$$CLASS_NAME || 'FeatureConstructor' + n,
//                 params = [];
//             if (!className) {
//                 params.push('\'' + featureName + '\'');
//             }
//             params.push(constructorName);
//             unregisteredFeatures.push(params.join(', '));
//         }
//     }, this);

//     if (featureNames.length) {
//         var sampleCode = 'Hypergrid.defaults.features = [\n' + join('\t\'', featureNames, '\',\n') + '];';

//         if (unregisteredFeatures.length) {
//             sampleCode += '\n\nThe following custom features are unregistered and will need to be registered prior to behavior instantiation:\n\n' +
//                 join('Features.add(', unregisteredFeatures, ');\n');
//         }

//         if (n) {
//             sampleCode += '\n\n(You should provide meaningful names for your custom features rather than the generated names above.)';
//         }

//         console.warn('`grid.behavior.features` (array of feature constructors) has been deprecated as of version 2.1.0 in favor of `grid.properties.features` (array of feature names). Remove `features` array from your behavior and add `features` property to your grid state object (or Hypergrid.defaults), e.g.:\n\n' + sampleCode);
//     }


// }

// function join(prefix, array, suffix) {
//     return prefix + array.join(suffix + prefix) + suffix;
// }


export namespace ComponentBehaviorManager {
    export class DefaultRowProperties implements MetaModel.HeightRowProperties {
        private _height: number | undefined;

        constructor(
            private readonly _gridProperties: GridSettings,
            private readonly _behaviourStateChangedEventer: RowPropertiesBehavior.BehaviouStateChangedEventer,
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
                this._behaviourStateChangedEventer();
            }
        }
    }
}
