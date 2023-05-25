import { CanvasManager } from '../../components/canvas/canvas-manager';
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
import { ViewLayout } from '../../components/view/view-layout';
import { DataModel } from '../../interfaces/data-model';
import { GridSettings } from '../../interfaces/grid-settings';
import { MetaModel } from '../../interfaces/meta-model';
import { SchemaModel } from '../../interfaces/schema-model';
import { AssertError } from '../../lib/revgrid-error';
import { assignOrDelete } from '../../lib/utils';
import { GridSettingsAccessor } from '../../settings-accessors/grid-settings-accessor';
import { AdapterSetConfig } from './adapter-set-config';
import { CellPropertiesBehavior } from './cell-properties-behavior';
import { DataExtractBehavior } from './data-extract-behavior';
import { EventBehavior } from './event-behavior';
import { FocusScrollBehavior } from './focus-scroll-behavior';
import { FocusSelectBehavior } from './focus-select-behavior';
import { ModelCallbackRouterBehavior } from './model-callback-router-behavior';
import { RowPropertiesBehavior } from './row-properties-behavior';

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
    readonly canvasManager: CanvasManager;
    readonly focus: Focus;
    readonly selection: Selection;
    readonly reindexStashManager: ReindexStashManager;
    readonly columnsManager: ColumnsManager;
    readonly subgridsManager: SubgridsManager;
    readonly viewLayout: ViewLayout;
    readonly renderer: Renderer;
    readonly mouse: Mouse;

    readonly focusScrollBehavior: FocusScrollBehavior;
    readonly focusSelectBehavior: FocusSelectBehavior;
    readonly eventBehavior: EventBehavior;
    readonly rowPropertiesBehavior: RowPropertiesBehavior;
    readonly cellPropertiesBehavior: CellPropertiesBehavior;
    readonly dataExtractBehavior: DataExtractBehavior;

    private readonly _horizontalScroller: Scroller;
    private readonly _verticalScroller: Scroller;
    private readonly _modelCallbackRouter: ModelCallbackRouter;

    private readonly _modelCallbackRouterBehavior: ModelCallbackRouterBehavior;

    private _destroyed = false;
    private _mainSubgrid: Subgrid;
    private _mainDataModel: DataModel;

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
        adapterSetConfig: AdapterSetConfig,
        loadBuiltinFinbarStylesheet: boolean,
        descendantEventer: EventBehavior.DescendantEventer,
    ) {
        this.gridSettings = new GridSettingsAccessor();
        this.gridSettings.loadDefaults();
        if (optionedGridProperties !== undefined) {
            this.gridSettings.merge(optionedGridProperties);
        }

        this.canvasManager = new CanvasManager(
            containerHtmlElement,
            canvasContextAttributes,
            this.gridSettings,
            () => this.processCanvasResizedEvent(),
        );

        let schemaModel = adapterSetConfig.schemaModel;
        if (typeof schemaModel === 'function') {
            schemaModel = new schemaModel();
        }

        this.columnsManager = new ColumnsManager(
            schemaModel,
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

            this._mainSubgrid = this.subgridsManager.mainSubgrid;
            this._mainDataModel = this._mainSubgrid.dataModel;

            this.viewLayout = new ViewLayout(
                this.gridSettings,
                this.canvasManager,
                this.columnsManager,
                this.subgridsManager,
            );

            this.focus = new Focus(
                this.gridSettings,
                this._mainSubgrid,
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

            this._verticalScroller = new Scroller(
                this.viewLayout.verticalScrollDimension,
                false, // remove when vertical scrollbar is updated to use viewport
                'vertical',
                true,
                1,
                this.gridSettings.wheelVFactor,
                this.gridSettings.vScrollbarClassPrefix,
                loadBuiltinFinbarStylesheet,
                containerHtmlElement,
                undefined,
            );
            containerHtmlElement.appendChild(this._verticalScroller.bar);

            this._horizontalScroller = new Scroller(
                this.viewLayout.horizontalScrollDimension,
                false,
                'horizontal',
                true,
                this.gridSettings.wheelHFactor,
                1,
                this.gridSettings.hScrollbarClassPrefix,
                loadBuiltinFinbarStylesheet,
                containerHtmlElement,
                this._verticalScroller,
            );
            containerHtmlElement.appendChild(this._horizontalScroller.bar);

            // Set up model callback handling

            this._modelCallbackRouter = new ModelCallbackRouter(this.columnsManager.schemaModel);
            this.reindexStashManager = new ReindexStashManager(this.focus, this.selection);

            // Set up behaviors

            this.eventBehavior = new EventBehavior(
                this.canvasManager,
                this.columnsManager,
                this.viewLayout,
                this.selection,
                this._horizontalScroller,
                this._verticalScroller,
                descendantEventer,
                (event) => this.canvasManager.dispatchEvent(event),
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

            this._modelCallbackRouterBehavior = new ModelCallbackRouterBehavior(
                this.columnsManager,
                this.subgridsManager,
                this.viewLayout,
                this.renderer,
                this.focus,
                this.selection,
                this._modelCallbackRouter,
                this.reindexStashManager,
            );

            this.dataExtractBehavior = new DataExtractBehavior(
                this.selection,
                this.columnsManager
            );

            this.viewLayout.invalidateAll(true);
        }
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
        this.viewLayout.reset();
        this.focus.reset();
        this.mouse.reset();

        this.columnsManager.clearColumns();

        // this._columnsManager.createColumns();
        // if (options?.data !== undefined) {
        //     this.setData(options.data);
        // }

        this.canvasManager.resize();
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
        this._destroyed = true;
        this.renderer.stop();
        this.canvasManager.stop();
        this._modelCallbackRouter.destroy();
        this.eventBehavior.destroy();
        // this.focusScrollBehavior.destroy();
        this._horizontalScroller.destroy();
        this._verticalScroller.destroy();
        this.renderer.destroy();
        this.selection.destroy();
        this.subgridsManager.destroy();
    }

    allowEvents(allow: boolean){
        if (allow){
            this._modelCallbackRouter.enable();
        } else {
            this._modelCallbackRouter.disable();
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
        this._horizontalScroller.resize();
        this._verticalScroller.resize();
        this.viewLayout.invalidateAll(true);
        this.eventBehavior.processCanvasResizedEvent();
    }

    private invalidateHorizontalAll(scrollablePlaneDimensionAsWell: boolean) {
        this.viewLayout.invalidateHorizontalAll(scrollablePlaneDimensionAsWell);
    }

    private invalidateViewCellRender(cell: ViewCell) {
        this.renderer.invalidateViewCellRender(cell);
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
