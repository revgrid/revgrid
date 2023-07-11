import { CellPropertiesBehavior } from './behavior/cell-properties-behavior';
import { BehaviorManager } from './behavior/component-behavior-manager';
import { DataExtractBehavior } from './behavior/data-extract-behavior';
import { EventBehavior } from './behavior/event-behavior';
import { FocusScrollBehavior } from './behavior/focus-scroll-behavior';
import { FocusSelectBehavior } from './behavior/focus-select-behavior';
import { RowPropertiesBehavior } from './behavior/row-properties-behavior';
import { CanvasManager } from './components/canvas/canvas-manager';
import { ColumnsManager } from './components/column/columns-manager';
import { ComponentsManager } from './components/components-manager';
import { Focus } from './components/focus/focus';
import { Mouse } from './components/mouse/mouse';
import { GridPainter } from './components/renderer/grid-painter/grid-painter';
import { Renderer } from './components/renderer/renderer';
import { Scroller } from './components/scroller/scroller';
import { Selection } from './components/selection/selection';
import { SubgridsManager } from './components/subgrid/subgrids-manager';
import { ViewLayout } from './components/view/view-layout';
import { CellMetaSettings } from './interfaces/data/cell-meta-settings';
import { DataServer } from './interfaces/data/data-server';
import { LinedHoverCell } from './interfaces/data/hover-cell';
import { MainSubgrid } from './interfaces/data/main-subgrid';
import { MetaModel } from './interfaces/data/meta-model';
import { Subgrid } from './interfaces/data/subgrid';
import { ViewCell } from './interfaces/data/view-cell';
import { Column, ColumnAutoSizeableWidth } from './interfaces/dataless/column';
import { SchemaField } from './interfaces/schema/schema-field';
import { SchemaServer } from './interfaces/schema/schema-server';
import { BehavioredColumnSettings } from './interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from './interfaces/settings/behaviored-grid-settings';
import { ColumnSettings } from './interfaces/settings/column-settings';
import { CssClassName } from './types-utils/html-types';
import { Point } from './types-utils/point';
import { Rectangle } from './types-utils/rectangle';
import { ApiError, AssertError } from './types-utils/revgrid-error';
import { ListChangedTypeId, SelectionAreaType } from './types-utils/types';
import { UiController } from './ui/controller/ui-controller';
import { UiManager } from './ui/ui-controller-manager';

/** @public */
export class Revgrid<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> {
    readonly hostElement: HTMLElement;

    readonly mouse: Mouse<BGS, BCS, SF>;
    readonly selection: Selection<BCS, SF>;
    readonly focus: Focus<BGS, BCS, SF>;
    readonly canvasManager: CanvasManager<BGS>;
    readonly columnsManager: ColumnsManager<BCS, SF>;
    readonly subgridsManager: SubgridsManager<BCS, SF>;
    readonly viewLayout: ViewLayout<BGS, BCS, SF>;

    readonly schemaServer: SchemaServer<SF>;
    readonly mainSubgrid: MainSubgrid<BCS, SF>;
    readonly mainDataServer: DataServer<SF>;

    /** @internal */
    private readonly _componentsManager: ComponentsManager<BGS, BCS, SF>;
    /** @internal */
    private readonly _behaviorManager: BehaviorManager<BGS, BCS, SF>;
    /** @internal */
    private readonly _uiManager: UiManager<BGS, BCS, SF>;

    /** @internal */
    private readonly _renderer: Renderer<BGS, BCS, SF>;
    /** @internal */
    private readonly _horizontalScroller: Scroller<BGS>;
    /** @internal */
    private readonly _verticalScroller: Scroller<BGS>;

    /** @internal */
    private readonly _focusScrollBehavior: FocusScrollBehavior<BGS, BCS, SF>;
    /** @internal */
    private readonly _focusSelectBehavior: FocusSelectBehavior<BGS, BCS, SF>;
    /** @internal */
    private readonly _rowPropertiesBehavior: RowPropertiesBehavior<BGS, BCS, SF>;
    /** @internal */
    private readonly _cellPropertiesBehavior: CellPropertiesBehavior<BGS, BCS, SF>;
    /** @internal */
    private readonly _dataExtractBehavior: DataExtractBehavior<BCS, SF>;

    private _destroyed = false;

    get fieldColumns(): readonly Column<BCS, SF>[] { return this.columnsManager.fieldColumns; }
    get activeColumns(): readonly Column<BCS, SF>[] { return this.columnsManager.activeColumns; }

    getSelectedRowCount() { return this.selection.getRowCount(); }
    getSelectedRowIndices() { return this.selection.getRowIndices(); }
    getSelectedColumnIndices() { return this.selection.getColumnIndices(); }
    getSelectedRectangles() { return this.selection.rectangleList.rectangles; }

    get destroyed() { return this._destroyed; }

    /**
     * The index of the active column which is first in view (either on left or right depending on Grid alignment)
     */
    get columnScrollAnchorIndex() { return this.viewLayout.columnScrollAnchorIndex; }
    /**
     * The number of pixels that the scroll anchored column is offset.
     * Changes to allow smooth scrolling
     */
    get columnScrollAnchorOffset() { return this.viewLayout.columnScrollAnchorOffset; }
    get fixedColumnsViewWidth() { return this.viewLayout.fixedColumnsViewWidth; }
    get nonFixedColumnsViewWidth() { return this.viewLayout.scrollableColumnsViewWidth; }
    get activeColumnsViewWidth() { return this.viewLayout.columnsViewWidth; }

    constructor(
        hostElement: string | HTMLElement | undefined,
        definition: Revgrid.Definition<BCS, SF>,
        readonly settings: BGS,
        getSettingsForNewColumnEventer: Revgrid.GetSettingsForNewColumnEventer<BCS, SF>,
        options?: Revgrid.Options<BGS, BCS, SF>
    ) {
        options = options ?? {};

        //Set up the host for a grid instance
        this.hostElement = this.prepareHost(hostElement);

        let schemaServer = definition.schemaServer;
        if (typeof schemaServer === 'function') {
            schemaServer = new schemaServer();
        }

        this.schemaServer = schemaServer;

        this._componentsManager = new ComponentsManager(
            settings,
            this.hostElement,
            schemaServer,
            definition.subgrids,
            options.canvasRenderingContext2DSettings,
            getSettingsForNewColumnEventer,
        );

        this.focus = this._componentsManager.focus;
        this.selection = this._componentsManager.selection;
        this.canvasManager = this._componentsManager.canvasManager;
        this.mouse = this._componentsManager.mouse;
        this.columnsManager = this._componentsManager.columnsManager;
        this.subgridsManager = this._componentsManager.subgridsManager;
        this.viewLayout = this._componentsManager.viewLayout;
        this._renderer = this._componentsManager.renderer;
        this._horizontalScroller = this._componentsManager.horizontalScroller;
        this._verticalScroller = this._componentsManager.verticalScroller;

        this.mainSubgrid = this.subgridsManager.mainSubgrid;
        this.mainDataServer = this.mainSubgrid.dataServer;

        const descendantEventer = this.createDescendantEventer();

        this._behaviorManager = new BehaviorManager(
            this.settings,
            this.canvasManager,
            this.columnsManager,
            this.subgridsManager,
            this.viewLayout,
            this.focus,
            this.selection,
            this.mouse,
            this._renderer,
            this._horizontalScroller,
            this._verticalScroller,
            descendantEventer,
        );

        this._focusScrollBehavior = this._behaviorManager.focusScrollBehavior;
        this._focusSelectBehavior = this._behaviorManager.focusSelectBehavior;
        this._rowPropertiesBehavior = this._behaviorManager.rowPropertiesBehavior;
        this._cellPropertiesBehavior = this._behaviorManager.cellPropertiesBehavior;
        this._dataExtractBehavior = this._behaviorManager.dataExtractBehavior;

        this._uiManager = new UiManager(
            this.hostElement,
            this.settings,
            this.canvasManager,
            this.focus,
            this.selection,
            this.columnsManager,
            this.subgridsManager,
            this.viewLayout,
            this._renderer,
            this.mouse,
            this._horizontalScroller,
            this._verticalScroller,
            this._focusScrollBehavior,
            this._focusSelectBehavior,
            this._rowPropertiesBehavior,
            this._cellPropertiesBehavior,
            this._dataExtractBehavior,
            this._behaviorManager.reindexBehavior,
            this._behaviorManager.eventBehavior,
            options.customUiControllerDefinitions,
        );

        this.canvasManager.start();
        this._renderer.start();

        this.canvasManager.resize(false); // Will invalidate all and cause a repaint
    }

    get active() { return this._behaviorManager.active; }
    set active(value: boolean) {
        this._behaviorManager.active = value;
        if (value){
            this._uiManager.enable();
        } else {
            this._uiManager.disable();
        }
        this.viewLayout.invalidateAll(true);
    }

    get canvasBounds() { return this.canvasManager.bounds; }

    /**
     * Be a responsible citizen and call this function on instance disposal!
     * If multiple grids are used in an application (simultaneously or not), then {@link (Hypgrid:class).destroy} must be called otherwise
     * canvase paint loop will continue to run
     */
    destroy() {
        this._behaviorManager.destroy();

        const hostElement = this.hostElement;
        let firstChild = hostElement.firstChild;
        while (firstChild !== null) {
            hostElement.removeChild(firstChild);
            firstChild = hostElement.firstChild;
        }

        this._destroyed = true;
    }

    activate() {
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }

    setAttribute(attribute: string, value: string) {
        this.hostElement.setAttribute(attribute, value);
    }

    removeAttribute(attribute: string) {
        this.hostElement.removeAttribute(attribute);
    }

    /** @internal */
    createColumns() {
        // used by Behavior.addState()
        this.columnsManager.createColumns();
    }

    /**
     * @desc Clear out all state settings, data (rows), and schema (columns) of a grid instance.
     * @param options
     * @param options.subgrids - Consumed by {@link BehaviorManager#reset}.
     * If omitted, previously established subgrids list is reused.
     */
    reset() {
        this._componentsManager.reset();
        this.canvasManager.resize(false); // Will invalidate all and cause a repaint
    }

    /** pluginSpec
     * @desc One of:
     * * simple API - a plain object with an `install` method
     * * object API - an object constructor
     * * array:
     *    * first element is an optional name for the API or the newly instantiated object
     *    * next element (or first element when not a string) is the simple or object API
     *    * remaining arguments are optional arguments for the object constructor
     * * falsy value such as `undefined` - ignored
     *
     * The API may have a `name` or `$$CLASS_NAME` property.
     */
    /**
     * @summary Install plugins.
     * @desc Plugin installation:
     * * Each simple API is installed by calling it's `install` method with `this` as first arg + any additional args listed in the `pluginSpec` (when it is an array).
     * * Each object API is installed by instantiating it's constructor with `this` as first arg + any additional args listed in the `pluginSpec` (when it is an array).
     *
     * The resulting plain object or instantiated objects may be named by (in priority order):
     * 1. if `pluginSpec` contains an array and first element is a string
     * 2. object has a `name` property
     * 3. object has a `$$CLASS_NAME` property
     *
     * If named, a reference to each object is saved in `this.plugins`. If the plug-in is unnamed, no reference is kept.
     *
     * There are two types of plugin installations:
     * * Preinstalled plugins which are installed on the prototype. These are simple API plugins with a `preinstall` method called with the `installPlugins` calling context as the first argument. Preinstallations are automatically performed whenever a grid is instantiated (at the beginning of the constructor), by calling `installPlugins` with `Hypergrid.prototype` as the calling context.
     * * Regular plugins which are installed on the instance. These are simple API plugins with an `install` method, as well as all object API plugins (constructors), called with the `installPlugins` calling context as the first argument. These installations are automatically performed whenever a grid is instantiated (at the end of the constructor), called with the new grid instance as the calling context.
     *
     * The "`installPlugins` calling context" means either the grid instance or its prototype, depending on how this method is called.
     *
     * Plugins may have both `preinstall` _and_ `install` methods, in which case both will be called. However, note that in any case, `install` methods on object API plugins are ignored.
     * @param {pluginSpec|pluginSpec[]} [plugins] - The plugins to install. If omitted, the call is a no-op.
     */
    // installPlugins(plugins) {
    //     var shared = this === Hypergrid.prototype; // Do shared ("preinstalled") plugins (if any)

    //     if (!plugins) {
    //         return;
    //     } else if (!Array.isArray(plugins)) {
    //         plugins = [plugins];
    //     }

    //     plugins.forEach(function(plugin) {
    //         var name, args, hash;

    //         if (!plugin) {
    //             return; // ignore falsy plugin spec
    //         }

    //         // set first arg of constructor to `this` (the grid instance)
    //         // set first arg of `install` method to `this` (the grid instance)
    //         // set first two args of `preinstall` method to `this` (the Hypergrid prototype) and the Behavior prototype
    //         args = [this];
    //         if (shared) {
    //             args.push(Behavior);
    //         }

    //         if (Array.isArray(plugin)) {
    //             if (!plugin.length) {
    //                 plugin = undefined;
    //             } else if (typeof plugin[0] !== 'string') {
    //                 args = args.concat(plugin.slice(1));
    //                 plugin = plugin[0];
    //             } else if (plugin.length >= 2) {
    //                 args = args.concat(plugin.slice(2));
    //                 name = plugin[0];
    //                 plugin = plugin[1];
    //             } else {
    //                 plugin = undefined;
    //             }
    //         }

    //         if (!plugin) {
    //             return; // ignore empty array or array with single string element
    //         }

    //         // Derive API name if not given in pluginSpec
    //         name = name || plugin.name || plugin.$$CLASS_NAME;
    //         if (name) {
    //             // Translate first character to lower case
    //             name = name.substr(0, 1).toLowerCase() + name.substr(1);
    //         }

    //         if (shared) {
    //             // Execute the `preinstall` method
    //             hash = this.constructor.plugins;
    //             if (plugin.preinstall && !hash[name]) {
    //                 plugin.preinstall.apply(plugin, args);
    //             }
    //         } else { // instance plug-ins:
    //             hash = this.plugins;
    //             if (typeof plugin === 'function') {
    //                 // Install "object API" by instantiating
    //                 plugin = this.createApply(plugin, args);
    //             } else if (plugin.install) {
    //                 // Install "simple API" by calling its `install` method
    //                 plugin.install.apply(plugin, args);
    //             } else if (!plugin.preinstall) {
    //                 throw new Base.HypergridError('Expected plugin (a constructor; or an API with a `preinstall` method and/or an `install` method).');
    //             }
    //         }

    //         if (name) {
    //             hash[name] = plugin;
    //         }

    //     }, this);
    // }

    /**
     * @summary Uninstall all uninstallable plugins or just named plugins.
     * @desc Calls `uninstall` on plugins that define such a method.
     *
     * To uninstall "preinstalled" plugins, call with `Hypergrid.prototype` as context.
     *
     * For convenience, the following args are passed to the call:
     * * `this` - the plugin to be uninstalled
     * * `grid` - the hypergrid object
     * * `key` - name of the plugin to be uninstalled (_i.e.,_ key in `plugins`)
     * * `plugins` - the plugins hash (a.k.a. `grid.plugins`)
     * @param {string|string[]} [pluginNames] If provided, limit uninstall to the named plugin (string) or plugins (string[]).
     */
    // uninstallPlugins(pluginNames) {
    //     if (!pluginNames) {
    //         pluginNames = [];
    //     } else if (!Array.isArray(pluginNames)) {
    //         pluginNames = [pluginNames];
    //     }
    //     _(this.plugins).each(function(plugin, key, plugins) {
    //         if (
    //             plugins.hasOwnProperty(key) &&
    //             pluginNames.indexOf(key) >= 0 &&
    //             plugin.uninstall
    //         ) {
    //             plugin.uninstall(this, key, plugins);
    //         }
    //     }, this);
    // }

    registerGridPainter(key: string, constructor: GridPainter.Constructor<BGS, BCS, SF>) {
        this._renderer.registerGridPainter(key, constructor)
    }

    /**
     * @returns We have focus.
     */
    hasFocus() {
        return this.canvasManager.hasFocus();
    }

    /**
     * @summary Set the Behavior object for this grid control.
     * @desc Called when `options.Behavior` from:
     * * Hypergrid constructor
     * * `setData` when not called explicitly before then
     * @param options - _Per {@link BehaviorManager#setData}._
     * @param options.Behavior - The behavior (model) is a constructor.
     * @param options.dataModel - A fully instantiated data model object.
     * @param options.dataModelConstructor - Data model will be instantiated from this constructor unless `options.dataModel` was given.
     * @param options.metadata - Value to be passed to `setMetadataStore` if the data model has changed.
     * @param options.data - _Per {@link constructor#setData}._
     * @param options.schema - _Per {@link constructor#setData}.
     */
    // setBehavior(options: Hypergrid.Options) {
    //     const constructor = (options?.behaviorConstructor) ?? Behavior;
    //     this.behavior = new constructor(this, options);
    //     this.initScrollbars();
    //     this.refreshProperties();
    //     this.behavior.reindex();
    // }

    get activeColumnCount() { return this.columnsManager.activeColumnCount; }

    /**
     * @summary Gets the number of rows in the main subgrid.
     * @returns The number of rows.
     */
    getSubgridRowCount(subgrid: Subgrid<BCS, SF>) {
        return subgrid.getRowCount();
    }

    calculateRowCount() {
        return this.subgridsManager.calculateRowCount();
    }

    /**
     * Retrieve a data row from the main data model.
     * @return The data row object at y index.
     * @param y - the row index of interest
     */
    getSingletonViewDataRow(y: number, subgrid?: Subgrid<BCS, SF>): DataServer.ViewRow {
        if (subgrid === undefined) {
            return this.mainSubgrid.getSingletonViewDataRow(y);
        } else {
            return subgrid.getSingletonViewDataRow(y);
        }
    }

    /**
     * Retrieve all data rows from the data model.
     * > Use with caution!
     */
    getViewData(): readonly DataServer.ViewRow[] {
        const mainDataServer = this.mainDataServer;
        if (mainDataServer.getViewData === undefined) {
            return [];
        } else {
            return mainDataServer.getViewData();
        }
    }

    getViewValue(x: number, y: number, subgrid?: Subgrid<BCS, SF>) {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        return this._componentsManager.getViewValue(x, y, subgrid);
    }

    setValue(x: number, y: number, value: number, subgrid?: Subgrid<BCS, SF>) {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        this._componentsManager.setValue(x, y, value, subgrid);
    }

    /** Promise resolves when last model update is rendered. Columns and rows will then reflect last model update */
    waitModelRendered() {
        return this._renderer.waitModelRendered();
    }

    private prepareHost(hostElement: string | HTMLElement | undefined): HTMLElement {
        let resolvedHostElement: HTMLElement;
        if (hostElement === undefined) {
            let foundOrCreatedElement = document.getElementById(CssClassName.gridHostElementCssIdBase);

            if (foundOrCreatedElement === null || foundOrCreatedElement.childElementCount > 0) {
                // is not found or being used.  Create a new host
                foundOrCreatedElement = document.createElement('div');
                document.body.appendChild(foundOrCreatedElement);
            }
            resolvedHostElement = foundOrCreatedElement;
        } else {
            if (typeof hostElement === 'string') {
                const queriedHostElement = document.querySelector(hostElement);
                if (queriedHostElement === null) {
                    throw new AssertError('RIC55998', `Host element not found: ${hostElement}`);
                } else {
                    resolvedHostElement = queriedHostElement as HTMLElement;
                }
            } else {
                resolvedHostElement = hostElement;
            }
        }

        // Default Position and height to ensure DnD works
        if (!resolvedHostElement.style.position) {
            resolvedHostElement.style.position = ''; // revert to stylesheet value
        }

        if (resolvedHostElement.clientHeight < 1) {
            resolvedHostElement.style.height = ''; // revert to stylesheet value
        }

        resolvedHostElement.removeAttribute('tabindex');

        resolvedHostElement.classList.add(CssClassName.gridHostElementCssClass);
        resolvedHostElement.id = resolvedHostElement.id || CssClassName.gridHostElementCssIdBase + (document.querySelectorAll('.' + CssClassName.gridHostElementCssClass).length - 1 || '');

        return resolvedHostElement;
    }

    /**
     * @param activeIndex - The column index in question.
     * @returns The given column is fully visible.
     */
    isColumnVisible(activeIndex: number) {
        return this.viewLayout.isActiveColumnVisible(activeIndex);
    }

    /**
     * @summary Get the visibility of the row matching the provided data row index.
     * @desc Requested row may not be visible due to being scrolled out of view.
     * @summary Determines visibility of a row.
     * @param rowIndex - The data row index.
     * @returns The given row is visible.
     */
    isDataRowVisible(r: number, subgrid?: Subgrid<BCS, SF>) {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }

        return this.viewLayout.isDataRowVisible(r, subgrid);
    }

    /**
     * @param c - The column index in question.
     * @param rn - The grid row index in question.
     * @returns The given cell is fully is visible.
     */
    isDataVisible(c: number, rn: number) {
        return this.isDataRowVisible(rn) && this.isColumnVisible(c);
    }

    /**
     * @summary Answer which data cell is under a pixel value mouse point.
     * @param mouse - The mouse point to interrogate.
     */
    getGridCellFromMousePoint(mouse: Point) {
        return this.viewLayout.findLinedHoverCellAtCanvasOffset(mouse.x, mouse.y);
    }

    /**
     * @param gridCell - The pixel location of the mouse in physical grid coordinates.
     * @returns The pixel based bounds rectangle given a data cell point.
     */
    getBoundsOfCell(gridCell: Point): Rectangle {
        return this.viewLayout.getBoundsOfCell(gridCell.x, gridCell.y);
    }

    getSchema(): readonly SchemaField[] {
        return this.columnsManager.getSchema();
    }

    getAllColumn(allX: number) {
        return this.columnsManager.getFieldColumn(allX);
    }

    /**
     * @returns A copy of the all columns array by passing the params to `Array.prototype.slice`.
     */
    getFieldColumnRange(begin?: number, end?: number): Column<BCS, SF>[] {
        const columns = this.columnsManager.fieldColumns;
        return columns.slice(begin, end);
    }

    /**
     * @returns A copy of the active columns array by passing the params to `Array.prototype.slice`.
     */
    getActiveColumns(begin?: number, end?: number): Column<BCS, SF>[] {
        const columns = this.columnsManager.activeColumns;
        return columns.slice(begin, end);
    }

    getHiddenColumns() {
        //A non in-memory behavior will be more troublesome
        return this.columnsManager.getHiddenColumns();
    }

    setActiveColumnsAndWidthsByName(columnNameWidths: ColumnsManager.FieldNameAndAutoSizableWidth[]) {
        this.columnsManager.setActiveColumnsAndWidthsByFieldName(columnNameWidths, false);
    }

    /**
     * @summary Show inactive column(s) or move active column(s).
     *
     * @desc Adds one or several columns to the "active" column list.
     *
     * @param isActiveColumnIndexes - Which list `columnIndexes` refers to:
     * * `true` - The active column list. This can only move columns around within the active column list; it cannot add inactive columns (because it can only refer to columns in the active column list).
     * * `false` - The full column list (as per column schema array). This inserts columns from the "inactive" column list, moving columns that are already active.
     *
     * @param columnIndexes - Column index(es) into list as determined by `isActiveColumnIndexes`. One of:
     * * **Scalar column index** - Adds single column at insertion point.
     * * **Array of column indexes** - Adds multiple consecutive columns at insertion point.
     *
     * This required parameter is promoted left one arg position when `isActiveColumnIndexes` omitted in which case it will be allColumnIndexes
     *
     * @param insertIndex - Insertion point, _i.e.,_ the element to insert before. A negative values skips the reinsert. Default is to insert new columns at end of active column list.
     *
     * _Promoted left one arg position when `isActiveColumnIndexes` omitted._
     *
     * @param allowDuplicateColumns - Unless true, already visible columns are removed first.
     *
     * _Promoted left one arg position when `isActiveColumnIndexes` omitted + one position when `referenceIndex` omitted._
     */
    showHideColumns(
        /** A column index or array of field indices which are to be shown or hidden */
        fieldColumnIndexes: number | number[],
        /** Set to undefined to add new active columns at end of list.  Set to -1 to hide specified columns */
        insertIndex?: number,
        /** If true, then if an existing column is already visible, it will not be removed and duplicates of that column will be present. Default: false */
        allowDuplicateColumns?: boolean,
        /** Whether this was instigated by a UI action. Default: true */
        ui?: boolean): void;
    showHideColumns(
        /** If true, then column indices specify active column indices.  Otherwise field column indices */
        indexesAreActive: boolean,
        /** A column index or array of indices.  If undefined then all of the columns as per isActiveColumnIndexes */
        columnIndexes?: number | number[],
        /** Set to undefined to add new active columns at end of list.  Set to -1 to hide specified columns */
        insertIndex?: number,
        /** If true, then if an existing column is already visible, it will not be removed and duplicates of that column will be present. Default: false */
        allowDuplicateColumns?: boolean,
        /** Whether this was instigated by a UI action. Default: true */
        ui?: boolean,
    ): void;
    showHideColumns(
        fieldColumnIndexesOrIndexesAreActive: boolean | number | number[],
        insertIndexOrColumnIndexes?: number | number[],
        allowDuplicateColumnsOrInsertIndex?: boolean | number,
        uiOrAllowDuplicateColumns?: boolean,
        ui = true
    ): void {
        let indexesAreActive: boolean;
        let columnIndexOrIndices: number | number[] | undefined;
        let insertIndex: number | undefined;
        let allowDuplicateColumns: boolean;

        // Promote args when indexesAreActive omitted
        if (typeof fieldColumnIndexesOrIndexesAreActive === 'number' || Array.isArray(fieldColumnIndexesOrIndexesAreActive)) {
            indexesAreActive = false;
            columnIndexOrIndices = fieldColumnIndexesOrIndexesAreActive;
            insertIndex = insertIndexOrColumnIndexes as number | undefined;
            allowDuplicateColumns = allowDuplicateColumnsOrInsertIndex as boolean;
            ui = uiOrAllowDuplicateColumns ?? true;
        } else {
            indexesAreActive = fieldColumnIndexesOrIndexesAreActive;
            columnIndexOrIndices = insertIndexOrColumnIndexes;
            insertIndex = allowDuplicateColumnsOrInsertIndex as number | undefined;
            allowDuplicateColumns = uiOrAllowDuplicateColumns ?? false;
        }

        this.columnsManager.showHideColumns(indexesAreActive, columnIndexOrIndices, insertIndex, allowDuplicateColumns, ui);
    }

    hideActiveColumn(activeColumnIndex: number, ui = true) {
        this.columnsManager.hideActiveColumn(activeColumnIndex, ui);
    }

    clearColumns() {
        this.columnsManager.clearColumns();
    }

    moveColumnBefore(sourceIndex: number, targetIndex: number, ui: boolean) {
        this.columnsManager.moveColumnBefore(sourceIndex, targetIndex, ui);
    }

    moveColumnAfter(sourceIndex: number, targetIndex: number, ui: boolean) {
        this.columnsManager.moveColumnAfter(sourceIndex, targetIndex, ui);
    }

    setActiveColumns(columnFieldNameOrFieldIndexArray: readonly (Column<BCS, SF> | string | number)[]) {
        const fieldColumns = this.columnsManager.fieldColumns;
        const newActiveCount = columnFieldNameOrFieldIndexArray.length;
        const newActiveColumns = new Array<Column<BCS, SF>>(newActiveCount);
        for (let i = 0; i < newActiveCount; i++) {
            const columnFieldNameOrFieldIndex = columnFieldNameOrFieldIndexArray[i];
            let column: Column<BCS, SF>;
            if (typeof columnFieldNameOrFieldIndex === 'number') {
                column = fieldColumns[columnFieldNameOrFieldIndex];
            } else {
                if (typeof columnFieldNameOrFieldIndex === 'string') {
                    const foundColumn = fieldColumns.find((aColumn) => aColumn.field.name === columnFieldNameOrFieldIndex);
                    if (foundColumn === undefined) {
                        throw new ApiError('RSAC20009', `ColumnsManager.setActiveColumns: Column with name not found: ${columnFieldNameOrFieldIndex}`);
                    } else {
                        column = foundColumn;
                    }
                } else {
                    column = columnFieldNameOrFieldIndex;
                }
            }

            newActiveColumns[i] = column;
        }
        this.columnsManager.setActiveColumns(newActiveColumns);
    }

    autoSizeActiveColumnWidths(widenOnly: boolean) {
        this.columnsManager.autoSizeActiveColumnWidths(widenOnly);
    }

    setActiveColumnsAutoWidthSizing(widenOnly: boolean) {
        this.columnsManager.setActiveColumnsAutoWidthSizing(widenOnly);
    }

    autoSizeFieldColumnWidth(fieldNameOrIndex: string | number, widenOnly: boolean) {
        const fieldColumns = this.columnsManager.fieldColumns;
        let column: Column<BCS, SF>;
        if (typeof fieldNameOrIndex === 'number') {
            column = fieldColumns[fieldNameOrIndex];
        } else {
            const foundColumn = fieldColumns.find((aColumn) => aColumn.field.name === fieldNameOrIndex);
            if (foundColumn === undefined) {
                throw new ApiError('RASFC29752', `ColumnsManager.setActiveColumns: Column with name not found: ${fieldNameOrIndex}`);
            } else {
                column = foundColumn;
            }
        }
        column.autoSizeWidth(widenOnly);
    }

    setColumnScrollAnchor(index: number, offset: number) {
        return this.viewLayout.setColumnScrollAnchor(index, offset);
    }

    calculateActiveColumnsWidth() {
        const lineWidth = this.settings.verticalGridLinesWidth;
        const columnsManager = this.columnsManager;
        const activeColumnCount = columnsManager.activeColumnCount;
        const fixedColumnCount = this.columnsManager.getFixedColumnCount();

        let width = 0;
        for (let i = 0; i < activeColumnCount; i++) {
            width += columnsManager.getActiveColumnWidth(i);

            if (i > 0) {
                if (i === fixedColumnCount && i !== 0) {
                    const fixedLineWidth = this.settings.verticalFixedLineWidth ?? lineWidth;
                    width += fixedLineWidth;
                } else {
                    width += lineWidth;
                }
            }
        }

        return width;
    }

    calculateActiveNonFixedColumnsWidth() {
        const gridLinesVWidth = this.settings.verticalGridLinesWidth;
        const columnCount = this.activeColumnCount;
        const fixedColumnCount = this.columnsManager.getFixedColumnCount();
        let result = 0;
        for (let i = fixedColumnCount; i < columnCount; i++) {
            result += this.getActiveColumnWidth(i);
        }

        if (gridLinesVWidth > 0) {
            const scrollableColumnCount = columnCount - fixedColumnCount;
            if (scrollableColumnCount > 1) {
                result += (scrollableColumnCount - 1) * gridLinesVWidth;
            }
        }

        return result;
    }

    calculateColumnScrollContentSizeAndAnchorLimits(
        contentStart: number, // Fixed columns width + fixed gridline width
        viewportSize: number,
        gridRightAligned: boolean,
        columnCount: number,
        fixedColumnCount: number,
    ): ViewLayout.ScrollContentSizeAndAnchorLimits {
        let contentSize = this.calculateActiveNonFixedColumnsWidth();
        let anchorLimits: ViewLayout.ScrollAnchorLimits;

        const contentOverflowed = contentSize > viewportSize && columnCount > fixedColumnCount
        if (contentOverflowed) {
            let leftAnchorLimitIndex: number;
            let leftAnchorLimitOffset: number;
            let rightAnchorLimitIndex: number;
            let rightAnchorLimitOffset: number;

            const gridLinesVWidth = this.settings.verticalGridLinesWidth;
            if (gridRightAligned) {
                rightAnchorLimitIndex = columnCount - 1;
                rightAnchorLimitOffset = 0;
                let prevColumnGridLineFinish = contentStart - 1;
                const lowestViewportFinish = prevColumnGridLineFinish + viewportSize;
                let lowestViewportStartColumnIndex = fixedColumnCount;
                let lowestViewportStartColumnFinish = prevColumnGridLineFinish + this.getActiveColumnWidth(lowestViewportStartColumnIndex);
                while (lowestViewportStartColumnFinish <= lowestViewportFinish) {
                    prevColumnGridLineFinish = lowestViewportStartColumnFinish;
                    lowestViewportStartColumnIndex++;
                    lowestViewportStartColumnFinish = prevColumnGridLineFinish + (this.getActiveColumnWidth(lowestViewportStartColumnIndex) + gridLinesVWidth);
                }
                leftAnchorLimitIndex = lowestViewportStartColumnIndex;
                leftAnchorLimitOffset = lowestViewportStartColumnFinish - lowestViewportFinish;
                if (!this.settings.scrollHorizontallySmoothly) {
                    // Since we cannot show a partial column on right, this may prevent leftmost columns from being displayed in viewport
                    // Extend scrollable size (content size) so that the previous column can be shown on end when viewport is at start of content.
                    contentSize += (lowestViewportFinish - prevColumnGridLineFinish);
                    if (leftAnchorLimitOffset !== 0) {
                        leftAnchorLimitOffset = 0;
                        if (leftAnchorLimitIndex > fixedColumnCount) {
                            leftAnchorLimitIndex--;
                        }
                    }
                }
            } else {
                leftAnchorLimitIndex = fixedColumnCount;
                leftAnchorLimitOffset = 0;
                const highestViewportStart = contentSize - viewportSize;
                let nextColumnLeft = contentSize;
                let highestViewportStartColumnIndex = columnCount - 1;
                let highestViewportStartColumnLeft = nextColumnLeft - this.getActiveColumnWidth(highestViewportStartColumnIndex);
                while (highestViewportStartColumnLeft > highestViewportStart) {
                    nextColumnLeft = highestViewportStartColumnLeft;
                    highestViewportStartColumnIndex--;
                    highestViewportStartColumnLeft = nextColumnLeft - (this.getActiveColumnWidth(highestViewportStartColumnIndex) + gridLinesVWidth);
                }
                rightAnchorLimitIndex = highestViewportStartColumnIndex;
                rightAnchorLimitOffset = highestViewportStart - highestViewportStartColumnLeft;
                if (!this.settings.scrollHorizontallySmoothly) {
                    // Since we cannot show a partial column on left, this may prevent rightmost columns from being displayed in viewport
                    // Extend scrollable size (content size) so that the subsequent column can be shown on start when viewport is at end of content.
                    contentSize += (nextColumnLeft - highestViewportStart);
                    if (rightAnchorLimitOffset !== 0) {
                        rightAnchorLimitOffset = 0;
                        if (rightAnchorLimitIndex < columnCount - 1) {
                            rightAnchorLimitIndex++;
                        }
                    }
                }
            }

            anchorLimits = {
                startAnchorLimitIndex: leftAnchorLimitIndex,
                startAnchorLimitOffset: leftAnchorLimitOffset,
                finishAnchorLimitIndex: rightAnchorLimitIndex,
                finishAnchorLimitOffset: rightAnchorLimitOffset,
            }
        } else {
            anchorLimits = this.calculateColumnScrollInactiveAnchorLimits(gridRightAligned, columnCount, fixedColumnCount);
        }

        return {
            contentSize,
            contentOverflowed,
            anchorLimits,
        };
    }

    calculateColumnScrollInactiveAnchorLimits(
        gridRightAligned: boolean,
        columnCount: number,
        fixedColumnCount: number
    ): ViewLayout.ScrollAnchorLimits {
        let startAnchorLimitIndex: number;
        let finishAnchorLimitIndex: number;
        if (gridRightAligned) {
            finishAnchorLimitIndex = columnCount - 1;
            startAnchorLimitIndex = finishAnchorLimitIndex;
        } else {
            startAnchorLimitIndex = fixedColumnCount;
            finishAnchorLimitIndex = startAnchorLimitIndex;
        }
        return {
            startAnchorLimitIndex,
            startAnchorLimitOffset: 0,
            finishAnchorLimitIndex,
            finishAnchorLimitOffset: 0,
        };
    }

    getColumnScrollableLeft(activeIndex: number) {
        const fixedColumnCount = this.columnsManager.getFixedColumnCount();
        if (activeIndex < fixedColumnCount) {
            throw new AssertError('HGCSL89933');
        } else {
            const gridLinesVWidth = this.settings.verticalGridLinesWidth;
            let result = 0;
            for (let i = fixedColumnCount; i < activeIndex; i++) {
                result += this.getActiveColumnWidth(i);
            }

            if (gridLinesVWidth > 0) {
                const scrollableColumnCount = activeIndex - fixedColumnCount;
                if (scrollableColumnCount > 1) {
                    result += (scrollableColumnCount - 1) * gridLinesVWidth;
                }
            }

            return result;
        }
    }

    getActiveColumn(activeIndex: number) {
        return this.columnsManager.getActiveColumn(activeIndex);
    }

    getActiveColumnIndexByFieldIndex(fieldIndex: number) {
        return this.columnsManager.getActiveColumnIndexByFieldIndex(fieldIndex);
    }

    /**
     * @returns The width of the given column.
     * @param activeIndex - The untranslated column index.
     */
    getActiveColumnWidth(activeIndex: number) {
        return this.columnsManager.getActiveColumnWidth(activeIndex);
    }

    /**
     * @desc Set the width of the given column.
     * @param columnIndex - The untranslated column index.
     * @param width - The width in pixels.
     * @return column if width changed otherwise undefined
     */
    setActiveColumnWidth(columnOrIndex: number | Column<BCS, SF>, width: number, ui: boolean) {
        let column: Column<BCS, SF>
        if (typeof columnOrIndex === 'number') {
            if (columnOrIndex >= 0) {
                column = this.columnsManager.getActiveColumn(columnOrIndex);
            } else {
                throw new ApiError('RSACW93109', `Behavior.setColumnWidth: Invalid column number ${columnOrIndex}`);
            }
        } else {
            column = columnOrIndex;
        }

        column.setWidth(width, ui);
    }

    setColumnWidths(columnWidths: ColumnAutoSizeableWidth<BCS, SF>[]) {
        return this.columnsManager.setColumnWidths(columnWidths, false);
    }

    setColumnWidthsByName(columnNameWidths: ColumnsManager.FieldNameAndAutoSizableWidth[]) {
        return this.columnsManager.setColumnWidthsByFieldName(columnNameWidths, false);
    }

    /**
     * @returns The height of the given row
     * @param rowIndex - The untranslated fixed column index.
     */
    getRowHeight(rowIndex: number, subgrid?: Subgrid<BCS, SF>) {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        return subgrid.getRowHeight(rowIndex);
    }

    /**
     * @desc Set the height of the given row.
     * @param rowIndex - The row index.
     * @param rowHeight - The width in pixels.
     */
    setRowHeight(rowIndex: number, rowHeight: number, subgrid?: Subgrid<BCS, SF>) {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        this._rowPropertiesBehavior.setRowHeight(rowIndex, rowHeight, subgrid);
    }

    /**
     * @summary The top left area has been clicked on
     * @desc Delegates to the behavior.
     * @param {event} mouse - The event details.
     */
    // topLeftClicked(mouse) {
    //     this.behavior.topLeftClicked(this, mouse); // not implemented
    // }

    /**
     * @summary A fixed row has been clicked.
     * @desc Delegates to the behavior.
     * @param {event} event - The event details.
     */
    // rowHeaderClicked(mouse) {
    //     this.behavior.rowHeaderClicked(this, mouse); // not implemented
    // }

    /**
     * @summary A fixed column has been clicked.
     * @desc Delegates to the behavior.
     * @param {event} event - The event details.
     */
    // columnHeaderClicked(mouse) {
    //     this.behavior.columnHeaderClicked(this, mouse); // not implemented
    // }

    /**
     * @returns The HiDPI ratio.
     */
    getHiDPI() {
        return this.canvasManager.devicePixelRatio;
    }

    /**
     * @returns The width of the given (recently rendered) column.
     * @param colIndex - The column index.
     */
    getRenderedWidth(colIndex: number): number {
        return this.viewLayout.getRenderedWidth(colIndex);
    }

    /**
     * @returns The height of the given (recently rendered) row.
     * @param rowIndex - The row index.
     */
    getRenderedHeight(rowIndex: number): number {
        return this.viewLayout.getRenderedHeight(rowIndex);
    }

    /**
     * @desc Repaint the given cell.
     * @param {number} x - The horizontal coordinate.
     * @param {number} y - The vertical coordinate.
     */
    // repaintCell(x: number, y: number) {
    //     this.renderer.repaintCell(x, y); // not implemented
    // }

    /**
     * @returns The user is currently dragging a column to reorder it.
     */
    // isDraggingColumn(): boolean {
    //     return !!this.renderOverridesCache.dragger;
    // }

    /**
     * @returns Objects with the values that were just rendered.
     */
    getRenderedData() {
        return this.viewLayout.getVisibleCellMatrix();
    }

    /**
     * @desc Reset zoom factor used by mouse tracking and placement
     * of cell editors on top of canvas.
     *
     * Call this after resetting `document.body.style.zoom`.
     * (Do not set `zoom` style on canvas or any other ancestor thereof.)
     *
     * **NOTE THE FOLLOWING:**
     * 1. `zoom` is non-standard (unsupported by FireFox)
     * 2. The alternative suggested on MDN, `transform`, is ignored
     * here as it is not a practical replacement for `zoom`.
     * @see https://developer.mozilla.org/en-US/docs/Web/CSS/zoom
     *
     * @todo Scrollbars need to be repositioned when `canvas.style.zoom` !== 1. (May need update to finbars.)
     */
    // resetZoom() {
    //     this.abortEditing();
    //     this.canvas.resetZoom();
    // }

    // getBodyZoomFactor() {
    //     return this.canvas.bodyZoomFactor;
    // }

    /**
     * @desc Enable/disable if this component can receive the focus.
     */
    // setFocusable(canReceiveFocus: boolean) {
    //     this.canvas.setFocusable(canReceiveFocus);
    // }

    /**
     * @returns The number of columns that were just rendered
     */
    getVisibleColumnsCount() {
        return this.viewLayout.getColumnsCount();
    }

    /**
     * @returns The number of rows that were just rendered
     */
    getVisibleRowsCount() {
        return this.viewLayout.getRowsCount();
    }

    /**
     * @desc Update the size of a grid instance.
     */
    updateSize() {
        this.canvasManager.checksize();
    }


    swapColumns(source: number, target: number) {
        //Turns out this is called during dragged 'i.e' when the floater column is reshuffled
        //by the currently dragged column. The column positions are constantly reshuffled
        this.columnsManager.swapColumns(source, target);
    }

    /**
     * @param activeColumnIndex - Data x coordinate.
     * @return The properties for a specific column.
     */
    getActiveColumnSettings(activeColumnIndex: number): BCS {
        const column = this.columnsManager.getActiveColumn(activeColumnIndex);
        if (column === undefined) {
            throw new ApiError('RGACS50008', `activeColumnIndex is not a valid index: ${activeColumnIndex}`);
        } else {
            return column.settings;
        }
    }

    mergeFieldColumnSettings(fieldIndex: number, settings: Partial<BCS>) {
        return this.columnsManager.mergeFieldColumnSettings(fieldIndex, settings);
    }

    setFieldColumnSettings(fieldIndex: number, settings: BCS) {
        return this.columnsManager.mergeFieldColumnSettings(fieldIndex, settings);
    }

    /**
     * Clears all cell properties of given column or of all columns.
     * @param x - Omit for all columns.
     */
    clearAllCellProperties(x?: number) {
        const column = x === undefined ? undefined : this.columnsManager.getFieldColumn(x);
        this._cellPropertiesBehavior.clearAllCellProperties(column)
    }

    // decorateColumnArray(array) {
    //     if (!this.columnArrayDecorations) {
    //         var grid = this;
    //         this.columnArrayDecorations = {
    //             findWithNeg: {
    //                 // Like the Array.prototype version except searches the negative indexes as well.
    //                 value: function(iteratee, context) {
    //                     for (var i = grid.behavior.leftMostColIndex; i < 0; i++) {
    //                         if (!this[i]) {
    //                             continue;
    //                         }
    //                         if (iteratee.call(context, this[i], i, this)) {
    //                             return this[i];
    //                         }
    //                     }
    //                     return this.find(iteratee, context);
    //                 }
    //             },
    //             forEachWithNeg: {
    //                 // Like the Array.prototype version except it iterates the negative indexes as well.
    //                 value: function(iteratee, context) {
    //                     for (var i = grid.behavior.leftMostColIndex; i < 0; i++) {
    //                         if (!this[i]) {
    //                             continue;
    //                         }
    //                         iteratee.call(context, this[i], i, this);
    //                     }
    //                     return this.forEach(iteratee, context);
    //                 }

    //             }
    //         };
    //     }
    //     return Object.defineProperties(array || [], this.columnArrayDecorations);
    // }


    // Begin Events Mixin
    /**
     * @summary Add an event listener to me.
     * @desc Listeners added by this method should only be removed by {@link Revgrid#removeEventListener|grid.removeEventListener} (or {@link Revgrid#removeAllEventListeners|grid.removeAllEventListeners}).
     * @param eventName - The type of event we are interested in.
     * @param listener - The event handler.
     */
    addEventListener(eventName: string, listener: CanvasManager.EventListener) {
        this.canvasManager.addExternalEventListener(eventName, listener);
    }

    /**
     * @summary Remove an event listeners.
     * @desc Removes the event listener with matching name and function that was added by {@link Revgrid#addEventListener|grid.addEventListener}.
     *
     * NOTE: This method cannot remove event listeners added by other means.
     */

    removeEventListener(eventName: string, listener: CanvasManager.EventListener) {
        this.canvasManager.removeExternalEventListener(eventName, listener);
    }

    protected descendantProcessCellFocusChanged(_newPoint: Point | undefined, _oldPoint: Point | undefined) {
        // for descendants
    }

    protected descendantProcessRowFocusChanged(_newSubgridRowIndex: number | undefined, _oldSubgridRowIndex: number | undefined) {
        // for descendants
    }

    protected descendantProcessSelectionChanged() {
        // for descendants
    }

    protected descendantProcessFieldColumnListChanged(_typeId: ListChangedTypeId, _index: number, _count: number, _targetIndex: number | undefined) {
        // for descendants
    }

    protected descendantProcessActiveColumnListChanged(_typeId: ListChangedTypeId, _index: number, _count: number, _targetIndex: number | undefined, _ui: boolean) {
        // for descendants
    }

    protected descendantProcessColumnsWidthChanged(_columns: Column<BCS, SF>[], _ui: boolean) {
        // for descendants
    }

    protected descendantProcessColumnsViewWidthsChanged(_changeds: ViewLayout.ColumnsViewWidthChangeds) {
        // for descendants
    }

    protected descendantProcessColumnSort(_event: MouseEvent, _headerOrFixedRowCell: ViewCell<BCS, SF>) {
        // for descendants
    }

    protected descendantEventerFocus() {
        // for descendants
    }

    protected descendantEventerBlur() {
        // for descendants
    }

    protected descendantProcessKeyDown(_event: KeyboardEvent, _fromEditor: boolean) {
        // for descendants
    }

    protected descendantProcessKeyUp(_event: KeyboardEvent) {
        // for descendants
    }

    protected descendantProcessClick(_event: MouseEvent, _hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    protected descendantProcessDblClick(_event: MouseEvent, _hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    protected descendantProcessPointerEnter(_event: MouseEvent, _hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    protected descendantProcessPointerDown(_event: MouseEvent, _hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    protected descendantProcessPointerUpCancel(_event: MouseEvent, _hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    protected descendantProcessPointerMove(_event: MouseEvent, _hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    protected descendantProcessPointerLeaveOut(_event: MouseEvent, _hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    protected descendantProcessWheelMove(_event: MouseEvent, _hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    protected descendantProcessDragStart(_event: DragEvent) {
        // for descendants
    }

    protected descendantProcessContextMenu(_event: MouseEvent, _hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    /**
     * Uses DragEvent as this has original Mouse location.  Do not change DragEvent or call any of its methods
     * Return true if drag operation is to be started.
     */
    protected descendantProcessPointerDragStart(_event: DragEvent, _hoverCell: LinedHoverCell<BCS, SF> | null | undefined): boolean {
        return false;
    }

    protected descendantProcessPointerDrag(_event: PointerEvent) {
        // for descendants
    }

    protected descendantProcessPointerDragEnd(_event: PointerEvent) {
        // for descendants
    }

    protected descendantProcessRendered() {
        // for descendants
    }

    protected descendantProcessMouseEnteredCell(_cell: ViewCell<BCS, SF>) {
        // for descendants
    }

    protected descendantProcessMouseExitedCell(_cell: ViewCell<BCS, SF>) {
        // for descendants
    }

    protected descendantProcessTouchStart(_event: TouchEvent) {
        // for descendants
    }

    protected descendantProcessTouchMove(_event: TouchEvent) {
        // for descendants
    }

    protected descendantProcessTouchEnd(_event: TouchEvent) {
        // for descendants
    }

    protected descendantProcessCopy(_event: ClipboardEvent) {
        // for descendants
    }

    protected descendantProcessResized() {
        // for descendants
    }

    protected descendantProcessHorizontalScrollViewportStartChanged() {
        // for descendants
    }

    protected descendantProcessVerticalScrollViewportStartChanged() {
        // for descendants
    }

    protected descendantProcessHorizontalScrollerAction(_event: Scroller.Action) {
        // for descendants
    }

    protected descendantProcessVerticalScrollerAction(_event: Scroller.Action) {
        // for descendants
    }

    /**
     * @summary Get the cell's own properties object.
     * @desc May be undefined because cells only have their own properties object when at lest one own property has been set.
     * @param allXOrRenderedCell - Data x coordinate or cell event.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @returns The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `undefined`.
     */
    getCellOwnProperties(allXOrRenderedCell: number | ViewCell<BCS, SF>, y?: number, subgrid?: Subgrid<BCS, SF>) {
        if (typeof allXOrRenderedCell === 'object') {
            // xOrCellEvent is cellEvent
            const column = allXOrRenderedCell.viewLayoutColumn.column;
            y = allXOrRenderedCell.viewLayoutRow.subgridRowIndex;
            subgrid = allXOrRenderedCell.subgrid;
            return this._cellPropertiesBehavior.getCellOwnProperties(column, y, subgrid);
        } else {
            // xOrCellEvent is x
            if (y !== undefined && subgrid !== undefined) {
                const column = this.columnsManager.getFieldColumn(allXOrRenderedCell);
                return this._cellPropertiesBehavior.getCellOwnProperties(column, y, subgrid);
            } else {
                return undefined;
            }
        }
    }

    /**
     * @summary Get the properties object for cell.
     * @desc This is the cell's own properties object if found else the column object.
     *
     * If you are seeking a single specific property, consider calling {@link BehaviorManager#getCellProperty} instead.
     * @param xOrCellEvent - Data x coordinate or CellEvent.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @return The properties of the cell at x,y in the grid or falsy if not available.
     */
    getCellOwnPropertiesFromRenderedCell(renderedCell: ViewCell<BCS, SF>): MetaModel.CellOwnProperties | false | null | undefined{
        return this._cellPropertiesBehavior.getCellOwnPropertiesFromRenderedCell(renderedCell);
    }

    getCellProperties(allX: number, y: number, subgrid: Subgrid<BCS, SF>): CellMetaSettings {
        const column = this.columnsManager.getFieldColumn(allX);
        return this._cellPropertiesBehavior.getCellPropertiesAccessor(column, y, subgrid);
    }

    getCellOwnPropertyFromRenderedCell(renderedCell: ViewCell<BCS, SF>, key: string): MetaModel.CellOwnProperty | undefined {
        return this._cellPropertiesBehavior.getCellOwnPropertyFromRenderedCell(renderedCell, key);
    }

    /**
     * @summary Return a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     * @param allX - Data x coordinate.
     * @param y - Subgrid row coordinate.
     * @param key - Name of property to get.
     * @param subgrid - Subgrid in which contains cell
     * @return The specified property for the cell at x,y in the grid.
     */
    getCellProperty(allX: number, y: number, key: string | number, subgrid: Subgrid<BCS, SF>): MetaModel.CellOwnProperty;
    getCellProperty<T extends keyof ColumnSettings>(allX: number, y: number, key: T, subgrid: Subgrid<BCS, SF>): ColumnSettings[T];
    getCellProperty<T extends keyof ColumnSettings>(
        allX: number,
        y: number,
        key: string | T,
        subgrid: Subgrid<BCS, SF>
    ): MetaModel.CellOwnProperty | ColumnSettings[T] {
        const column = this.columnsManager.getFieldColumn(allX);
        return this._cellPropertiesBehavior.getCellProperty(column, y, key, subgrid);
    }

    /**
     * @desc update the data at point x, y with value
     * @param xOrCellEvent - Data x coordinate.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param properties - Hash of cell properties. _When `y` omitted, this param promoted to 2nd arg._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     */
    setCellOwnPropertiesUsingCellEvent(cell: ViewCell<BCS, SF>, properties: MetaModel.CellOwnProperties) {
        const column = cell.viewLayoutColumn.column;
        return this._cellPropertiesBehavior.setCellOwnProperties(column, cell.viewLayoutRow.subgridRowIndex, properties, cell.subgrid);
    }
    setCellOwnProperties(allX: number, y: number, properties: MetaModel.CellOwnProperties, subgrid: Subgrid<BCS, SF>) {
        const column = this.columnsManager.getFieldColumn(allX);
        return this._cellPropertiesBehavior.setCellOwnProperties(column, y, properties, subgrid);
    }

    /**
     * @desc update the data at point x, y with value
     * @param xOrCellEvent - Data x coordinate.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param properties - Hash of cell properties. _When `y` omitted, this param promoted to 2nd arg._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     */
    addCellOwnPropertiesUsingCellEvent(cell: ViewCell<BCS, SF>, properties: MetaModel.CellOwnProperties) {
        const column = cell.viewLayoutColumn.column;
        return this._cellPropertiesBehavior.addCellOwnProperties(column, cell.viewLayoutRow.subgridRowIndex, properties, cell.subgrid);
    }
    addCellOwnProperties(allX: number, y: number, properties: MetaModel.CellOwnProperties, subgrid: Subgrid<BCS, SF>) {
        const column = this.columnsManager.getFieldColumn(allX);
        return this._cellPropertiesBehavior.addCellOwnProperties(column, y, properties, subgrid);
    }

    /**
     * @summary Set a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     *
     * NOTE: For performance reasons, renderer's cell event objects cache their respective cell properties objects. This method accepts a `CellEvent` overload. Whenever possible, use the `CellEvent` from the renderer's cell event pool. Doing so will reset the cell properties object cache.
     *
     * If you use some other `CellEvent`, the renderer's `CellEvent` properties cache will not be automatically reset until the whole cell event pool is reset on the next call to {@link ViewLayout#computeCellBoundaries}. If necessary, you can "manually" reset it by calling {@link ViewLayout#resetCellPropertiesCache|resetCellPropertiesCache(yourCellEvent)} which searches the cell event pool for one with matching coordinates and resets the cache.
     *
     * The raw coordinates overload calls the `resetCellPropertiesCache(x, y)` overload for you.
     * @param xOrCellEvent - `CellEvent` or data x coordinate.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param key - Name of property to get. _When `y` omitted, this param promoted to 2nd arg._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     */
    setCellProperty(cell: ViewCell<BCS, SF>, key: string, value: MetaModel.CellOwnProperty): MetaModel.CellOwnProperties | undefined;
    setCellProperty(allX: number, dataY: number, key: string, value: MetaModel.CellOwnProperty, subgrid: Subgrid<BCS, SF>): MetaModel.CellOwnProperties | undefined;
    setCellProperty(
        allXOrCell: ViewCell<BCS, SF> | number,
        yOrKey: string | number,
        keyOrValue: string | MetaModel.CellOwnProperty,
        value?: MetaModel.CellOwnProperty,
        subgrid?: Subgrid<BCS, SF>
    ): MetaModel.CellOwnProperties | undefined {
        let optionalCell: ViewCell<BCS, SF> | undefined;
        let column: Column<BCS, SF>;
        let dataY: number;
        let key: string;
        if (typeof allXOrCell === 'object') {
            optionalCell = allXOrCell;
            column = allXOrCell.viewLayoutColumn.column,
            dataY = allXOrCell.viewLayoutRow.subgridRowIndex;
            key = yOrKey as string;
            value = keyOrValue;
        } else {
            optionalCell = undefined;
            column = this.columnsManager.getFieldColumn(allXOrCell);
            dataY = yOrKey as number;
            key = keyOrValue as string;
        }

        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }

        return this._cellPropertiesBehavior.setCellProperty(column, dataY, key, value, subgrid, optionalCell);
    }

    // End GridCellProperties Mixin

    // Begin Selection Mixin

    /** Call before multiple selection changes to consolidate SelectionChange events.
     * Pair with endSelectionChange().
     */
    beginSelectionChange() {
        this.selection.beginChange();
    }

    /** Call after multiple selection changes to consolidate SelectionChange events.
     * Pair with beginSelectionChange().
     */
    endSelectionChange() {
        this.selection.endChange();
    }

    /**
     * @desc Clear all the selections.
     */
    clearSelection() {
        return this.selection.clear();
        // const keepRowSelections = this.properties.checkboxOnlyRowSelections;
        // this.selection.clear(keepRowSelections);
        // this._userInterfaceInputBehavior.clearMouseDown();
    }

    /**
     * @returns Given point is selected.
     * @param x - The horizontal coordinate.
     * @param y - The vertical coordinate.
     */
    isPointSelected(x: number, y: number, subgrid?: Subgrid<BCS, SF>): boolean {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        return this.selection.isCellSelected(x, y, subgrid);
    }

    isColumnOrRowSelected() {
        return this.selection.isColumnOrRowSelected();
    }

    selectRectangle(inexclusiveX: number, inexclusiveY: number, width: number, height: number, subgrid?: Subgrid<BCS, SF>) {
        if (subgrid === undefined) {
            subgrid = this.focus.subgrid;
        }
        this._focusSelectBehavior.focusSelectOnlyRectangle(inexclusiveX, inexclusiveY, width, height, subgrid as Subgrid<BCS, SF>);
    }

    selectViewCell(viewportColumnIndex: number, viewportRowIndex: number, areaType = SelectionAreaType.Rectangle) {
        this._focusSelectBehavior.selectOnlyViewCell(viewportColumnIndex, viewportRowIndex, areaType);
    }

    selectOnlyCell(x: number, y: number, subgrid?: Subgrid<BCS, SF>, areaType = SelectionAreaType.Rectangle) {
        if (subgrid === undefined) {
            subgrid = this.focus.subgrid;
        }

        this._focusSelectBehavior.focusSelectOnlyCell(x, y, subgrid as Subgrid<BCS, SF>, areaType);
    }

    selectOnlyRow(subgridRowIndex: number, subgrid: Subgrid<BCS, SF>) {
        this._focusSelectBehavior.selectOnlyRow(subgridRowIndex, subgrid as Subgrid<BCS, SF>);
    }

    selectAllRows() {
        this.selection.selectAllRows(this.mainSubgrid);
    }

    // toggleSelectAllRows(forceClearRows = true) {
    //     this._focusSelectionBehavior.toggleSelectAllRows(forceClearRows);
    // }

    // selectColumns(x1: number, x2: number) {
    //     this._focusSelectionBehavior.focusSelectColumns(x1, x2);
    // }

    // toggleSelectRow(y: number, shiftKeyDown: boolean, subgrid: Subgrid | undefined) {
    //     this._focusSelectionBehavior.toggleSelectRow(y, shiftKeyDown, subgrid);
    // }

    // toggleSelectColumn(x: number, shiftKeyDown: boolean, ctrlKeyDown: boolean) {
    //     this._focusSelectionBehavior.toggleSelectColumn(x, shiftKeyDown, ctrlKeyDown);
    // }

    /** @summary Extend cell selection by offset.
     * @desc Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
     * @param offsetX - x coordinate to start at
     * @param offsetY - y coordinate to start at
     */
    // extendRectangleSelect(offsetX: number, offsetY: number) {
    //     const selection = this.selection;
    //     const subgrid = selection.focusedSubgrid;
    //     let maxColumns = this.activeColumnCount - 1;
    //     let maxRows = subgrid.getRowCount() - 1;

    //     const maxViewableColumns = this.renderer.visibleColumns.length - 1;
    //     const maxViewableRows = this.renderer.visibleRows.length - 1;

    //     const origin = this._userInterfaceInputBehavior.getMouseDown();
    //     const extent = this._userInterfaceInputBehavior.getDragExtent();

    //     if (origin === undefined || extent === undefined) {
    //         throw new AssertError('RGES01034');
    //     } else {
    //         let newX = extent.x + offsetX;
    //         let newY = extent.y + offsetY;

    //         if (!this.properties.scrollingEnabled) {
    //             maxColumns = Math.min(maxColumns, maxViewableColumns);
    //             maxRows = Math.min(maxRows, maxViewableRows);
    //         }

    //         newX = Math.min(maxColumns - origin.x, Math.max(-origin.x, newX));
    //         newY = Math.min(maxRows - origin.y, Math.max(-origin.y, newY));

    //         selection.beginChange();
    //         try {
    //             this.clearMostRecentRectangleSelection();
    //             selection.selectRectangle(origin.x, origin.y, newX, newY, subgrid);
    //         } finally {
    //             selection.endChange();
    //         }
    //         this._userInterfaceInputBehavior.setDragExtent(Point.create(newX, newY));

    //         const colScrolled = this.ensureModelColIsVisible(newX + origin.x, offsetX);
    //         const rowScrolled = this.ensureModelRowIsVisible(newY + origin.y, offsetY, subgrid);

    //         this.repaint();

    //         return colScrolled || rowScrolled;
    //     }
    // }

    /**
     * @param useAllCells - Search in all rows and columns instead of only rendered ones.
     */
    getFocusedViewCell(useAllCells: boolean) {
        return this._focusScrollBehavior.getFocusedViewCell(useAllCells);
    }


    // end Selection mixin

    // Begin Themes mixin

    // /**
    //  * @summary Get currently active theme.
    //  * @desc May return a theme name or a theme object.
    //  * @returns {string|undefined|object} One of:
    //  * * **string:** Theme name (registered theme).
    //  * * **object:** Theme object (unregistered anonymous theme).
    //  * * **undefined:** No theme (i.e., the default theme).
    //  */
    // get theme() {
    //     const themeLayer = this._theme;
    //     const themeName = themeLayer.themeName;
    //     return themeName === 'default' || !Object.getOwnPropertyNames(themeLayer).length
    //         ? undefined // default theme or no theme
    //         : themeName in registry
    //             ? themeName // registered theme name
    //             : themeLayer; // unregistered theme object
    // }

    // /**
    //  * @summary Apply a grid theme.
    //  * @desc Apply props from the given theme object to the grid instance,
    //  * the instance's `myGrid.themeLayer` layer in the properties hierarchy.
    //  * @this {Hypergrid}
    //  * @param {object|string} [theme] - One of:
    //  * * **string:** A registered theme name.
    //  * * **object:** An anonymous (unregistered) theme object. Empty object removes grid theme, exposing global theme.
    //  * * _falsy value:_ Also removes grid theme (like empty object).
    //  * @param {string|undefined} [theme.themeName=undefined]
    //  */
    // set theme(value) {
    //     applyTheme(value);
    // }

    // End Themes Mixin

    // Begin Shared Themes Mixin
    // /**
    //  * @param {string} [name] - A registry name for the new theme. May be omitted if the theme has an embedded name (in `theme.themeName`).
    //  * _If omitted, the 2nd parameter (`theme`) is promoted to first position._
    //  * @param {HypergridThemeObject} [theme]
    //  * To build a Hypergrid theme object from a loaded {@link https://polymerthemes.com Polymer Theme} CSS stylesheet:
    //  * ```javascript
    //  * var myTheme = require('rev-hypergrid-themes').buildTheme();
    //  * ```
    //  * If omitted, unregister the theme named in the first parameter.
    //  *
    //  * Grid instances that have previously applied the named theme are unaffected by this action (whether re-registering or unregistering).
    //  */
    // static registerTheme(name: string, theme: Theme) {
    //     if (typeof name === 'object') {
    //         theme = name;
    //         name = theme.themeName;
    //     }

    //     if (!name) {
    //         throw new HypergridError('Cannot register an anonymous theme.');
    //     }

    //     if (name === 'default') {
    //         throw new HypergridError('Cannot register or unregister the "default" theme.');
    //     }

    //     if (theme) {
    //         theme.themeName = name;
    //         registry[name] = theme;
    //     } else {
    //         delete registry[name];
    //     }
    // }

    // /**
    //  * App developers are free to add in additional themes, such as those in {@link https://github.com/fin-hypergrid/themes/tree/master/js}:
    //  * ```javascript
    //  * Hypergrind.registerThemes(require('rev-hypergrid-themes'));
    //  * ```
    //  * @param {object} themeCollection
    //  */
    // static registerThemes(themeCollection) {
    //     if (themeCollection) {
    //         _(themeCollection).each(function(theme, name) {
    //             this.registerTheme(name, theme);
    //         }, this);
    //     } else {
    //         Object.keys(registry).forEach(function(themeName) {
    //             this.registerTheme(themeName);
    //         }, this);
    //     }
    // }

    // /**
    //  * @summary Apply global theme.
    //  * @desc Apply props from the given theme object to the global theme object,
    //  * the `defaults` layer at the bottom of the properties hierarchy.
    //  * @param {object|string} [theme=registry.default] - One of:
    //  * * **string:** A registered theme name.
    //  * * **object:** A theme object. Empty object removes global them, restoring defaults.
    //  * * _falsy value:_ Also restores defaults.
    //  * @param {string|undefined} [theme.themeName=undefined]
    //  */
    // static applyTheme(theme: Theme) {
    //     var themeObject = applyTheme.call(this, theme);
    //     images.setTheme(themeObject);
    // }

    // /**
    //  * @summary Theme registration and global theme support.
    //  * @desc Shared properties of `Hypergrid` "class" (_i.e.,_ "static" properties of constructor function) for registering themes and setting a global theme.
    //  *
    //  * All members are documented on the {@link Hypergrid} page (annotated as "(static)").
    //  * @mixin themes.sharedMixin
    //  */
    // static get theme() { return defaults; }
    // static set theme(theme: Theme) { Hypergrid.applyTheme(theme) }

    // // End Shared Mixin



    // Begin Scrolling Mixin

    /**
     * @summary Scroll horizontally by the provided offset.
     * @param offset - Scroll in the x direction this much.
     * @returns true if scrolled
     */
    scrollColumnsBy(offset: number) {
        return this.viewLayout.scrollColumnsBy(offset);
    }

    scrollViewHorizontallyBy(delta: number) {
        this.viewLayout.scrollHorizontalViewportBy(delta);
    }

    focusCell(activeColumnIndex: number, mainSubgridRowIndex: number, selectionAreaType = SelectionAreaType.Rectangle) {
        this._focusSelectBehavior.focusSelectOnlyCell(activeColumnIndex, mainSubgridRowIndex, this.focus.subgrid, selectionAreaType);
    }

    /**
     * @desc Scroll up one full page.
     */
    scrollPageUp() {
        this._focusScrollBehavior.tryPageFocusUp();
    }

    /**
     * @desc Scroll down one full page.
     */
    pageDown() {
        this._focusScrollBehavior.tryPageFocusDown();
    }

    /**
     * @desc Not yet implemented.
     */
    pageLeft() {
        this._focusScrollBehavior.tryPageFocusLeft();
    }

    /**
     * @desc Not yet implemented.
     */
    pageRight() {
        this._focusScrollBehavior.tryPageFocusRight();
    }

    /** @internal */
    private createDescendantEventer(): EventBehavior.DescendantEventer<BCS, SF> {
        return {
            fieldColumnListChanged: (typeId, index, count, targetIndex) => this.descendantProcessFieldColumnListChanged(typeId, index, count, targetIndex),
            activeColumnListChanged: (typeId, index, count, targetIndex, ui) => this.descendantProcessActiveColumnListChanged(typeId, index, count, targetIndex, ui),
            columnsWidthChanged: (columns, ui) => this.descendantProcessColumnsWidthChanged(columns, ui),
            columnsViewWidthsChanged: (changeds) => this.descendantProcessColumnsViewWidthsChanged(changeds),
            columnSort: (event, headerOrFixedRowCell) => this.descendantProcessColumnSort(event, headerOrFixedRowCell),
            cellFocusChanged: (newPoint, oldPoint) => this.descendantProcessCellFocusChanged(newPoint, oldPoint),
            rowFocusChanged: (newSubgridRowIndex, oldSubgridRowIndex) => this.descendantProcessRowFocusChanged(newSubgridRowIndex, oldSubgridRowIndex),
            selectionChanged: () => this.descendantProcessSelectionChanged(),
            focus: () => this.descendantEventerFocus(),
            blur: () => this.descendantEventerBlur(),
            keyDown: (event, fromEditor) => this.descendantProcessKeyDown(event, fromEditor),
            keyUp: (event) => this.descendantProcessKeyUp(event),
            click: (event, cell) => this.descendantProcessClick(event, cell),
            dblClick: (event, cell) => this.descendantProcessDblClick(event, cell),
            pointerEnter: (event, cell) => this.descendantProcessPointerEnter(event, cell),
            pointerDown: (event, cell) => this.descendantProcessPointerDown(event, cell),
            pointerUpCancel: (event, cell) => this.descendantProcessPointerUpCancel(event, cell),
            pointerMove: (event, cell) => this.descendantProcessPointerMove(event, cell),
            pointerLeaveOut: (event, cell) => this.descendantProcessPointerLeaveOut(event, cell),
            wheelMove: (event, cell) => this.descendantProcessWheelMove(event, cell),
            dragStart: (event) => this.descendantProcessDragStart(event),
            contextMenu: (event, cell) => this.descendantProcessContextMenu(event, cell),
            pointerDragStart: (event, cell) => this.descendantProcessPointerDragStart(event, cell),
            pointerDrag: (event) => this.descendantProcessPointerDrag(event),
            pointerDragEnd: (event) => this.descendantProcessPointerDragEnd(event),
            rendered: () => this.descendantProcessRendered(),
            mouseEnteredCell: (cell) => this.descendantProcessMouseEnteredCell(cell),
            mouseExitedCell: (cell) => this.descendantProcessMouseExitedCell(cell),
            touchStart: (event) => this.descendantProcessTouchStart(event),
            touchMove: (event) => this.descendantProcessTouchMove(event),
            touchEnd: (event) => this.descendantProcessTouchEnd(event),
            copy: (event) => this.descendantProcessCopy(event),
            resized: () => this.descendantProcessResized(),
            horizontalScrollViewportStartChanged: () => this.descendantProcessHorizontalScrollViewportStartChanged(),
            verticalScrollViewportStartChanged: () => this.descendantProcessVerticalScrollViewportStartChanged(),
            horizontalScrollerAction: (action) => this.descendantProcessHorizontalScrollerAction(action),
            verticalScrollerAction: (action) => this.descendantProcessVerticalScrollerAction(action),
        }
    }
}


/**
 * @name plugins
 * @type {object}
 * @summary Hash of references to shared plug-ins.
 * @desc Dictionary of shared (pre-installed) plug-ins. Used internally, primarily to avoid reinstallations. See examples for how to reference (albeit there is normally no need to reference plugins directly).
 *
 * For the dictionary of _instance_ plugins, see {@link Revgrid#plugins|plugins} (defined in the {@link Revgrid#intialize|Hypergrid constructor}).
 *
 * To force reinstallation of a shared plugin delete it first:
 * ```javascript
 * delete Hypergrid.plugins.mySharedPlugin;
 * ```
 * To force reinstallation of all shared plugins:
 * ```javascript
 * Hypergrid.plugins = {};
 * ```
 * @example
 * var allSharedPlugins = Hypergrid.plugins;
 * var mySharedPlugin = Hypergrid.plugins.mySharedPlugin;
 */
// Hypergrid.plugins = {};


// mix in the mixins

// Hypergrid.mixIn = Hypergrid.prototype.mixIn;
// Hypergrid.mixIn(require('./themes').sharedMixin);

// Hypergrid.prototype.mixIn(require('./themes').mixin);
// Hypergrid.prototype.mixIn(require('./events').mixin);
// Hypergrid.prototype.mixIn(require('./selection').mixin);
// Hypergrid.prototype.mixIn(require('./stash-selections').mixin);
// Hypergrid.prototype.mixIn(require('./scrolling').mixin);


// deprecated module access

// function pleaseUse(requireString, module) {
//     if (!pleaseUse.warned[requireString]) {
//         var key = requireString.match(/\w+$/)[0];
//         console.warn('Reference to ' + key + ' external module using' +
//             ' `Hypergrid.' + key + '.` has been deprecated as of v3.0.0 in favor of' +
//             ' `require(\'' + requireString + '\')` from within a Hypergrid Client Module' +
//             ' (otherwise use `Hypergrid.require(...)`) and will be removed in a future release.' +
//             ' See https://github.com/fin-hypergrid/core/wiki/Client-Modules#internal-modules.');
//         pleaseUse.warned[requireString] = true;
//     }
//     return module;
// }
// pleaseUse.warned = {};


// Object.defineProperties(Hypergrid, {
//     Base: { get: function() { return pleaseUse('rev-hypergrid/src/Base', require('../Base').default); } },
//     images: { get: function() { return pleaseUse('rev-hypergrid/images', require('../../images')); } }
// });


/**
 * @summary List of grid instances.
 * @desc Added in {@link Revgrid constructor}; removed in {@link Revgrid#terminate terminate()}.
 * Used in themes.js.
 * @type {Revgrid[]}
 */


/** @name defaults
 * @type {object}
 * @summary The `defaults` layer of the Hypergrid properties hierarchy.
 * @desc Default values for all Hypergrid properties, including grid-level properties and column property defaults.
 *
 * Synonym: `properties`
 * Properties are divided broadly into two categories:
 * * Style (a.k.a. "lnf" for "look'n'feel") properties
 * * All other properties.
 */
// Hypergrid.defaults = Hypergrid.properties = defaults;


/** @public */
export namespace Revgrid {
    export interface Definition<BCS extends BehavioredColumnSettings, SF extends SchemaField> {
        schemaServer: (SchemaServer<SF> | SchemaServer.Constructor<SF>),
        subgrids: Subgrid.Definition<BCS, SF>[],
    }

    export type GetSettingsForNewColumnEventer<BCS extends BehavioredColumnSettings, SF extends SchemaField> = ColumnsManager.GetSettingsForNewColumnEventer<BCS, SF>;

    export interface Options<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> {
        /** Set alpha to false to speed up rendering if no colors use alpha channel */
		canvasRenderingContext2DSettings?: CanvasRenderingContext2DSettings;
        customUiControllerDefinitions?: UiController.Definition<BGS, BCS, SF>[];
	}
}

// Begin Selection functions
// End Selection functions

// Begin Themes

// const styles = [
//     'BackgroundColor',
//     'Color',
//     'Font'
// ];

// const stylesWithHalign = styles.concat([
//     'Halign'
// ]);

// const dataCellStyles = stylesWithHalign.concat([
//     'cellPadding',
//     'iconPadding'
// ]);

// const stylers = [
//     { prefix: '',                                props: dataCellStyles },
//     { prefix: 'foregroundSelection',             props: styles },
//     { prefix: 'columnHeader',                    props: stylesWithHalign },
//     { prefix: 'columnHeaderForegroundSelection', props: styles },
//     { prefix: 'rowHeader',                       props: styles },
//     { prefix: 'rowHeaderForegroundSelection',    props: styles }
// ];

// const dynamicCosmetics = {
//     rowHeaderCheckboxes: defaults.rowHeaderCheckboxes,
//     rowHeaderNumbers: defaults.rowHeaderNumbers,
//     gridBorder: defaults.gridBorder,
//     gridBorderTop: defaults.gridBorderTop,
//     gridBorderRight: defaults.gridBorderRight,
//     gridBorderBottom: defaults.gridBorderBottom,
//     gridBorderLeft: defaults.gridBorderLeft,
//     gridRenderer: defaults.gridRenderer
// };

// // Create the `defaultTheme` theme by copying over the theme props,
// // which is a subset of all the props defined in defaults.js, beginning with
// // they dynamic cosmetics and `themeName`...
// const defaultTheme = Object.assign({}, dynamicCosmetics, {
//     themeName: defaults.themeName
// });

// // ...and then adding non-dynamic cosmetics into `defaultTheme`, by combining the above
// // prefixes with their styles to get prop names and then copy those props from `defaults`.
// stylers.reduce((theme, styler) => {
//     return styler.props.reduce(function(theme, prop) {
//         prop = styler.prefix + prop;
//         prop = prop.replace('ForegroundSelectionBackground', 'BackgroundSelection'); // unfortunate!
//         prop = prop[0].toLowerCase() + prop.substr(1);
//         theme[prop] = defaults[prop];
//         return theme;
//     }, theme);
// }, defaultTheme);

// /**
//  * @summary The Hypergrid theme registry.
//  * @desc The standard registry consists of a single theme, `default`, built from values in defaults.js.
//  */
// const registry = Object.create(null, {
//     default: { value: defaultTheme }
// });

// function applyTheme(theme) {
//     var themeLayer, grids, props, themeObject;

//     if (theme && typeof theme === 'object' && !Object.getOwnPropertyNames(theme).length) {
//         theme = null;
//     }

//     if (this._theme) {
//         grids = [this];
//         themeLayer = this._theme;
//         props = this.properties;

//         // If removing theme, reset props to defaults
//         if (!theme) {
//             // Delete (non-dynamic) grid props named in this theme, revealing defaults
//             Object.keys(themeLayer).forEach(function(key) {
//                 if (!(key in dynamicPropertyDescriptors)) {
//                     delete props[key];
//                 }
//             });

//             // Reset dynamic cosmetic props to defaults
//             Object.keys(dynamicCosmetics).forEach(function(key) {
//                 props.var[key] = defaults[key];
//             });
//         }

//         // Delete all own props from this grid instance's theme layer (defined by an eariler call)
//         Object.keys(themeLayer).forEach(function(key) {
//             delete themeLayer[key];
//         });
//     } else {
//         grids = this.grids;
//         themeLayer = defaults; // global theme layer
//         theme = theme || 'default';
//     }

//     if (typeof theme === 'object') {
//         themeObject = theme;
//     } else if (!registry[theme]) {
//         throw new HypergridError('Unknown theme "' + theme + '"');
//     } else {
//         themeObject = registry[theme];
//     }

//     if (themeObject) {
//         // When no theme name, set it to explicit `undefined` (to mask defaults.themeName).
//         if (!themeObject.themeName) {
//             themeObject.themeName = undefined;
//         }

//         Object.keys(themeObject).forEach(function(key) {
//             if (key in dynamicPropertyDescriptors) {
//                 if (key in dynamicCosmetics) {
//                     grids.forEach(function(grid) {
//                         grid.properties[key] = themeObject[key];
//                     });
//                 } else {
//                     // Dynamic properties are defined on properties layer; defining these
//                     // r-values on the theme layer is ineffective so let's not allow it.
//                     switch (key) {
//                         case 'lineColor':
//                             themeObject.gridLinesHColor = themeObject.gridLinesVColor = themeObject[key];
//                             break;
//                         default:
//                             console.warn('Ignoring unexpected dynamic property ' + key + ' from theme object.');
//                     }
//                     // delete themeObject[key];
//                 }
//             }
//         });

//         // No .assign() because themeName is read-only in defaults layer
//         Object.defineProperties(themeLayer, Object.getOwnPropertyDescriptors(themeObject));
//     }

//     grids.forEach(function(grid) {
//         grid.repaint();
//     });

//     return themeObject;
// }

// End Themes
