import { Canvas } from '../canvas/canvas';
import { dispatchGridEvent } from '../canvas/dispatch-grid-event';
import { Column } from '../column/column';
import { ColumnProperties } from '../column/column-properties';
import { Feature } from '../feature/feature';
import { featureFactory } from '../feature/feature-factory';
import { assignOrDelete } from '../lib/assign-or-delete';
import { Hooks } from '../lib/hooks';
import { AssertError } from '../lib/hypegrid-error';
import { Point } from '../lib/point';
import { LocalHeaderDataModel } from '../local/local-header-data-model';
import { LocalMainDataModel } from '../local/local-main-data-model';
import { DataModel } from '../model/data-model';
import { SchemaModel } from '../model/schema-model';
import { CellEvent } from '../renderer/cell-event';
import { CellInfo } from '../renderer/cell-info';
import { GridProperties } from './grid-properties';
import { Hypegrid } from './hypegrid';
import { Subgrid, SubgridArray } from './subgrid';



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
 * @param {Hypegrid} grid
 * @param {object} [options] - _(Passed to {@link Behavior#reset reset})._
 * @param {DataModel} [options.dataModel] - _Per {@link Behavior#reset reset}._
 * @param {object} [options.metadata] - _Per {@link Behavior#reset reset}._
 * @param {function} [options.DataModel=require('datasaur-local')] - _Per {@link Behavior#reset reset}._
 * @param {function|object[]} [options.data] - _Per {@link Behavior#setData setData}._
 * @param {function|menuItem[]} [options.schema] - _Per {@link Behavior#setData setData}._
 * @param {subgridSpec[]} [options.subgrids=this.grid.properties.subgrids] - _Per {@link Behavior#setData setData}._
 * @param {boolean} [options.apply=true] - _Per {@link Behavior#setData setData}._
 * @abstract
 */
export class Behavior {
    /** @internal */
    grid: Hypegrid;
    /** @internal */
    featureChain: Feature;
    /** @internal */
    private _featureMap = new Map<string, Feature>();
    /** @internal */
    columnsCreated: boolean;
    /** @internal */
    private _scrollPositionY: number;
    /** @internal */
    private _activeColumns: Behavior.ColumnArray;
    /** @internal */
    private _allColumns: Column[];
    /** @internal */
    private _rowPropertiesPrototype: DataModel.RowPropertiesPrototype;

    /** @internal */
    private _hooks: Hooks;

    // Start Subgrids mixin
    /** @internal */
    private _subgrids: SubgridArray = new SubgridArray();
    // End Subgrids mixin

    // Start RowProperties Mixin
    /** @internal */
    private _height: number;
    defaultRowHeight: number;
    // End RowProperties Mixin

    // Start DataModel Mixin
    schemaModel: SchemaModel;
    mainDataModel: DataModel;
    mainSubgrid: Subgrid;
    // allColumns: Behavior.ColumnArray;
    // End DataModel Mixin

    // Start RowProperties Mixin
    get height() {
        return this._height || this.defaultRowHeight;
    }
    set height(height: number) {
        height = Math.max(5, Math.ceil(height));
        if (isNaN(height)) {
            height = undefined;
        }
        if (height !== this._height) {
            this._height = height; // previously set as not enumerable
            this.grid.behaviorStateChanged();
        }
    }
    // End RowProperties Mixin

    constructor(grid: Hypegrid) {
        this.grid = grid;

        this.initializeFeatureChain();

        // this.grid.behavior = this;
        // this.reset(options);
    }

    /**
     * @desc Create the feature chain - this is the [chain of responsibility](http://c2.com/cgi/wiki?ChainOfResponsibilityPattern) pattern.
     * @internal
     */
    initializeFeatureChain() {
        /**
         * @summary Controller chain of command.
         * @desc Each feature is linked to the next feature.
         */
        this.featureChain = undefined;

        /**
         * @summary Hash of instantiated features by class names.
         * @desc Built here but otherwise not in use.
         */

        const featureNames = this.grid.properties.features;
        if (featureNames !== undefined) {
            const maxCount = featureNames.length;
            const features = new Array<Feature>(maxCount);
            let count = 0;
            for (let i = 0; i < maxCount; i++) {
                const name = featureNames[i];
                const feature = featureFactory.create(name);
                if (feature === undefined) {
                    console.warn(`Hypergrid feature not registered: ${name}`);
                } else {
                    features[count++] = feature;
                }
            }

            features.forEach(
                (feature, i) => {
                    this._featureMap.set(feature.typeName, feature);

                    if (i > 0) {
                        this.featureChain.setNext(feature);
                    } else {
                        this.featureChain = feature;
                    }
                }
            )
        }

        if (this.featureChain) {
            this.featureChain.initializeOn(this.grid);
        }
    }

    /** @internal */
    dispose() {
        this.disposeSubgrids();
    }

    /** @internal */
    private disposeSubgrids() {
        const count = this._subgrids.length;
        for (let i = count - 1; i > 0; i--) {
            const subgrid = this._subgrids[i];
            subgrid.dispose();
        }
        this._subgrids.length = 0;
    }

    // features: []; // override in implementing class; or provide feature names in grid.properties.features; else no features

    /**
     * Reset the behavior.
     * @param {object} [options] - _Same as constructor's `options`._<br>
     * _Passed to {@link Behavior#resetDataModel resetDataModel} and {@link Behavior#setData setData} (both of which see)._
     * @internal
     */
    reset(options?: Hypegrid.Options) {

        if (options !== undefined && options.model !== undefined) {
            let schemaModel = options.model.schema;
            if (typeof schemaModel === 'function') {
                schemaModel = new schemaModel();
            }
            this.schemaModel = schemaModel;

            if  (options.model.subgrids.length > 0) {
                this.setSubgrids(options.model.subgrids);
            }
        } else {
            if (this.subgrids) {
                // do nothing and keep existing
            } else {
                const gridPropertiesSubgrids = this.grid.properties.subgrids;
                if (gridPropertiesSubgrids !== undefined && gridPropertiesSubgrids.length > 0) {
                    this.setSubgrids(gridPropertiesSubgrids);
                } else {
                    this.setSubgrids([Subgrid.RoleEnum.main]);
                }
            }
        }
        // this.checkLoadDataModelMetadata(options);
        // const dataModelChanged = this.resetMainDataModel(options);

        this._scrollPositionY = 0;

        this._rowPropertiesPrototype = DefaultRowProperties;

        this.clearColumns();
        this.createColumns();

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

        this.setData(options.data);
    }

    /** @internal */
    setHooks(value: Hooks | undefined) {
        this._hooks = value;
        this._subgrids.forEach(
            (subgrid) => subgrid.setHooks(this._hooks)
        );
    }

    /**
     * @description Set the header labels.
     * @param headers - The header labels. One of:
     * * _If an array:_ Must contain all headers in column order.
     * * _If a hash:_ May contain any headers, keyed by field name, in any order.
     */
    setHeaders(headers: string[] | Record<string, string>) {
        if (headers instanceof Array) {
            // Reset all headers
            const allColumns = this._allColumns;
            headers.forEach((header, index) => {
                allColumns[index].header = header; // setter updates header in both column and data source objects
            });
        } else if (typeof headers === 'object') {
            // Adjust just the headers in the hash
            this._allColumns.forEach((column) => {
                if (headers[column.name]) {
                    column.header = headers[column.name];
                }
            });
        }
    }

    /**
     * @summary Set grid data.
     * @desc Fails silently if `dataRows` and `options.data` are both undefined.
     *
     * @param {function|object[]} [data=options.data] - Array of uniform data row objects or function returning same.
     *
     * @param {object} [options] - _(Promoted to first argument position when `dataRows` omitted.)_
     *
     * @param {function|object[]} [options.data] - The data when `dataRows` undefined.
     *
     * @param {function|menuItem[]} [options.schema] - May be:
     * * A schema array
     * * A function returning same. Called at filter reset time with behavior as context.
     * * Omit to allow the data model to generate a basic schema from its data.
     *
     * @param options.apply if true, apply data transformations to the new data.
     * @internal
     */
    setData(options: Hypegrid.Options): void;
    setData(data: Hypegrid.Options.Data, options?: Hypegrid.Options): void;
    setData(dataOrOptions: Hypegrid.Options.Data | Hypegrid.Options, options?: Hypegrid.Options): void {
        if (this.mainSubgrid === undefined) {
            this.setSubgrids([Subgrid.RoleEnum.main]); // Create local DataModel if none defined
            this.schemaModel = this.mainDataModel as LocalMainDataModel;
        }

        let data: Hypegrid.Options.Data;
        if (Array.isArray(dataOrOptions) || typeof dataOrOptions === 'function') {
            data = dataOrOptions;
        } else {
            options = dataOrOptions as Hypegrid.Options;
            data = options?.data;
        }

        if (data === undefined) {
            return;
        } else {
            const dataRows = typeof data === 'function' ? data() : data;

            if (!Array.isArray(dataRows)) {
                throw 'Expected data to be an array (of data row objects).';
            }

            // const schemaOrFunction = options?.schema;
            // const schema = typeof schemaOrFunction === 'function' ? schemaOrFunction() : schemaOrFunction;

            // Inform interested subgrids of data.
            if (this.mainDataModel instanceof LocalMainDataModel) {
                this.mainDataModel.setData(dataRows);
            } else {
                throw new Hypegrid('setData can only be used with LocalMainDataModel');
            }

            // The following should be moved to DataModel notfication
            if (this.grid.cellEditor) {
                this.grid.cellEditor.cancelEditing();
            }

            if (options?.apply === undefined || options.apply) { // default is `true`
                this.reindex();
            }

            this.grid.allowEvents(this.getRowCount() > 0);
        }
    }

    get renderedColumnCount() {
        return this.grid.renderer.visibleColumns.length;
    }

    get renderedRowCount() {
        return this.grid.renderer.visibleRows.length;
    }

    /**
     * @this BehaviorType
     */
    clearColumns() {
        // As part of Typescript conversion, schema is now readonly.
        // Need to find other way of getting non default name and header to tree and row number columns
        //
        // const schema = this.mainDataModel.getSchema();
        this.columnsCreated = false;

        this._activeColumns = new Behavior.ColumnArray();
        this._allColumns = new Array<Column>();

        // this.columns[tc].properties.propClassLayers = this.columns[rc].properties.propClassLayers = this.grid.properties.propClassLayersMap.NO_ROWS;

        // Signal the renderer to size the now-reset handle column before next render
        // this.grid.renderer.resetRowHeaderColumnWidth();
    }

    getActiveColumn(x: number) {
        return this._activeColumns[x];
    }

    /**
     * The "grid index" of an active column given a "data index" (number), column name (string), or column object
     * @returns The grid index of the column or undefined if column not in grid.
     */
    getActiveColumnIndex(columnOrIndexOrName: Column | number | string) {
        const indexOrName = columnOrIndexOrName instanceof Column ? columnOrIndexOrName.index : columnOrIndexOrName;
        const key = typeof indexOrName === 'number' ? 'index' : 'name';

        return this._activeColumns.findIndex((column) => { return column[key] === indexOrName; });
    }

    /** @internal */
    private getAllColumn(allX: number) {
        return this._allColumns[allX];
    }

    /** @internal */
    newColumn(schemaColumn: SchemaModel.Column, index: number) {
        return new Column(this, schemaColumn, index);
    }

    /** @internal */
    addColumn(schemaColumn: SchemaModel.Column, index?: number) {
        if (index === undefined) {
            index = this._activeColumns.length;
        }
        const column = this.newColumn(schemaColumn, index);
        // const arrayDecorator = new ArrayDecorator;
        // const synonyms = arrayDecorator.getSynonyms(column.name);

        this._activeColumns.push(column);
        this._allColumns.push(column);
        // arrayDecorator.decorateObject(this.columns, synonyms, column);

        return column;
    }

    /** @internal */
    createColumns() {
        const schema = this.schemaModel.getSchema();
        // fields.decorateSchema(schema);
        // fields.decorateColumnSchema(schema, this.grid.properties.headerify);

        this.clearColumns();

        schema.forEach((columnSchema) => {
            this.addColumn(columnSchema);
        });

        this.columnsCreated = true;

        this.changed();

        dispatchGridEvent(this.grid, 'fin-hypergrid-columns-created', false, undefined);
    }

    /** @internal */
    getColumnWidth(x: number) {
        const column = this.getActiveColumn(x);
        return column ? column.getWidth() : 0;
    }

    /**
     * @param columnOrIndex - The column or active column index.
     * @internal
     */
    setColumnWidth(columnOrIndex: Column | number, width: number) {
        let column: Column
        if (typeof columnOrIndex === 'number') {
            if (columnOrIndex >= -2) {
                column = this.getActiveColumn(columnOrIndex);
            } else {
                throw new Error(`Behavior.setColumnWidth: Invalid column number ${columnOrIndex}`);
            }
        } else {
            column = columnOrIndex;
        }
        const changed = column.setWidth(width);
        if (changed) {
            this.stateChanged();
            return column;
        } else {
            return undefined;
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
                obj.hasOwnProperty(key) && (
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
        const copy = JSON.parse(JSON.stringify(this.grid.properties));
        this.clearObjectProperties(copy.columnProperties, false);
        return copy;
    }
    /**
     * @desc clear all table state
     */
    clearState() {
        this.grid.clearState();
        this.createColumns();
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
            this.clearState();
        }

        const gridProps = this.grid.properties as GridProperties; // this may not work

        gridProps.settingState = settingState;
        assignOrDelete(gridProps, properties);
        delete gridProps.settingState;

        this.reindex();
    }

    /**
     * @summary Sets properties for active columns.
     * @desc Sets multiple columns' properties from elements of given array or collection. Keys may be column indexes or column names. The properties collection is cleared first. Falsy elements are ignored.
     * @param columnsHash - If undefined, this call is a no-op.
     */
    setAllColumnProperties(columnsHash?: ColumnProperties[] | Record<string, ColumnProperties>) {
        this.addAllColumnProperties(columnsHash, true);
    }

    /**
     * @summary Adds properties for multiple columns.
     * @desc Adds . The properties collection is optionally cleared first. Falsy elements are ignored.
     * @param columnsHash - If undefined, this call is a no-op.
     * @param settingState - Clear columns' properties objects before copying properties.
     */
    addAllColumnProperties(columnsHash?: Partial<ColumnProperties>[] | Record<string, Partial<ColumnProperties>>, settingState?: boolean) {
        if (columnsHash === undefined) {
            return;
        }

        const columns = this.grid.behavior.getAllColumns();

        if (Array.isArray(columnsHash)) {
            const columnCount = columns.length;
            for (let i = 0; i < columnCount; i++) {
                const column = columns[i];
                if (settingState === true) {
                    // column.clearProperties(); // needs to be implemented
                }

                column.addProperties(columnsHash[i]);
            }
        } else {
            Object.keys(columnsHash).forEach((key) => {
                const index = this._allColumns.findIndex((column) => column.name === key)

                if (index >= 0) {
                    const column = columns[index];
                    if (column) {
                        if (settingState === true) {
                            // column.clearProperties(); // needs to be implemented
                        }

                        column.addProperties(columnsHash[key]);
                    }
                }
            });
        }
    }

    setColumnOrder(allColumnIndexes: number[]) {
        const activeColumns = this._activeColumns;
        const allColumns = this._allColumns;
        // const arrayDecorator = new ArrayDecorator;

        // avoid recreating the `columns` array object to keep refs valid; just empty it
        activeColumns.length = 0;
        Object.keys(activeColumns).forEach((key) => {
            delete activeColumns[key];
        });

        allColumnIndexes.forEach((index) => {
            activeColumns.push(allColumns[index]);
        });
    }

    setColumnOrderByName(allColumnNames: string[]) {
        const allColumns = this._allColumns;
        this.setColumnOrder(allColumnNames.map((name) => { return allColumns[name].index; }));
    }

    /**
     * @desc Rebuild the column order indexes
     * @param - list of column indexes
     * @param silent - whether to trigger column changed event
     */
    setColumnIndexes(columnIndexes: number[], silent = false) {
        this.grid.properties.columnIndexes = columnIndexes;
        if (!silent) {
            this.grid.fireSyntheticOnColumnsChangedEvent();
        }
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
     * _This required parameter is promoted left one arg position when `isActiveColumnIndexes` omitted._
     *
     * @param referenceIndex - Insertion point, _i.e.,_ the element to insert before. A negative values skips the reinsert. Default is to insert new columns at end of active column list.
     *
     * _Promoted left one arg position when `isActiveColumnIndexes` omitted._
     *
     * @param allowDuplicateColumns - Unless true, already visible columns are removed first.
     *
     * _Promoted left one arg position when `isActiveColumnIndexes` omitted + one position when `referenceIndex` omitted._
     *
     */
    showColumns(columnIndexes: number | number[], referenceIndex?: number, allowDuplicateColumns?: boolean): void;
    showColumns(isActiveColumnIndexes: boolean, columnIndexes?: number | number[], referenceIndex?: number, allowDuplicateColumns?: boolean): void;
    showColumns(
        columnIndexesOrIsActiveColumnIndexes: boolean | number | number[],
        referenceIndexOrColumnIndexes?: number | number[],
        allowDuplicateColumnsOrReferenceIndex?: boolean | number,
        allowDuplicateColumns = false
    ): void {
        let isActiveColumnIndexes: boolean;
        let columnIndexes: number | number[] | undefined;
        let referenceIndex: number | undefined;

        // Promote args when isActiveColumnIndexes omitted
        if (typeof columnIndexesOrIsActiveColumnIndexes === 'number' || Array.isArray(columnIndexesOrIsActiveColumnIndexes)) {
            isActiveColumnIndexes = false;
            columnIndexes = columnIndexesOrIsActiveColumnIndexes;
            referenceIndex = referenceIndexOrColumnIndexes as number;
            allowDuplicateColumns = allowDuplicateColumnsOrReferenceIndex as boolean;
        } else {
            isActiveColumnIndexes = columnIndexesOrIsActiveColumnIndexes;
            columnIndexes = referenceIndexOrColumnIndexes;
            referenceIndex = allowDuplicateColumnsOrReferenceIndex as number;
        }

        const activeColumns = this._activeColumns;
        const sourceColumnList = isActiveColumnIndexes ? activeColumns : this._allColumns;

        // Nest scalar index
        if (typeof columnIndexes === 'number') {
            columnIndexes = [columnIndexes];
        }

        const newColumns = columnIndexes
            .map(function(index) { return sourceColumnList[index]; }) // Look up columns using provided indexes
            .filter(function(column) { return column; }); // Remove any undefined columns

        // Default insertion point is end (i.e., before (last+1)th element)
        if (typeof referenceIndex !== 'number') {
            allowDuplicateColumns = referenceIndex; // assume reference index was omitted when not a number
            referenceIndex = activeColumns.length;
        }

        // Remove already visible columns and adjust insertion point
        if (!allowDuplicateColumns) {
            newColumns.forEach(
                (column) => {
                    const i = activeColumns.indexOf(column);
                    if (i >= 0) {
                        activeColumns.splice(i, 1);
                        if (referenceIndex > i) {
                            --referenceIndex;
                        }
                    }
                }
            );
        }

        // Insert the new columns at the insertion point
        if (referenceIndex >= 0) {
            activeColumns.splice(referenceIndex, 0, ...newColumns);
        }

        this.grid.properties.columnIndexes = activeColumns.map(function(column) { return column.index; });
    }

    /**
     * @summary Hide active column(s).
     * @desc Removes one or several columns from the "active" column list.
     * @param columnIndexes - Column index(es) into list as determined by `isActiveColumnIndexes`. One of:
     * * **Scalar column index** - Adds single column at insertion point.
     * * **Array of column indexes** - Adds multiple consecutive columns at insertion point.
     *
     * _This required parameter is promoted left one arg position when `isActiveColumnIndexes` omitted._
     */
    hideColumns(columnIndexes: number | number[]) {
        this.showColumns(columnIndexes, -1);
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

    /** @internal */
    lookupFeature(key: string) {
        return this._featureMap.get(key);
    }

    /**
     * @return The width of the fixed column area in the hypergrid.
     * @internal
     */
    getFixedColumnsWidth() {
        const count = this.getFixedColumnCount();
        if (count === 0) {
            return 0;
        } else {
            const gridProps = this.grid.properties;
            const gridLinesVWidth = gridProps.gridLinesVWidth;
            let total = 0;

            for (let i = 0; i < count; i++) {
                const columnWidth = this.getColumnWidth(i);
                if (columnWidth) {
                    total += (columnWidth + gridLinesVWidth);
                }
            }

            // add in fixed rule thickness excess
            if (gridProps.fixedLinesVWidth !== undefined) {
                total += gridProps.fixedLinesHWidth - gridLinesVWidth;
            }

            return total;
        }
    }

    /**
     * @desc delegate setting the cursor up the feature chain of responsibility
     * @internal
     */
    setCursor(grid: Hypegrid) {
        grid.updateCursor();
        this.featureChain.setCursor(grid);
    }

    /**
     * @desc delegate handling mouse move to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    onMouseMove(grid: Hypegrid, event: CellEvent | undefined) {
        if (this.featureChain) {
            this.featureChain.handleMouseMove(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling tap to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    onClick(grid: Hypegrid, event: CellEvent) {
        if (this.featureChain) {
            this.featureChain.handleClick(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling tap to the feature chain of responsibility
     * @internal
     */
    onContextMenu(grid: Hypegrid, event: CellEvent) {
        if (this.featureChain) {
            this.featureChain.handleContextMenu(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling wheel moved to the feature chain of responsibility
     * @internal
     */
    onWheelMoved(grid: Hypegrid, event: CellEvent) {
        if (this.featureChain) {
            this.featureChain.handleWheelMoved(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling mouse up to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    onMouseUp(grid: Hypegrid, event: CellEvent) {
        if (this.featureChain) {
            this.featureChain.handleMouseUp(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling mouse drag to the feature chain of responsibility
     * @internal
     */
    onMouseDrag(grid: Hypegrid, event: CellEvent) {
        if (this.featureChain) {
            this.featureChain.handleMouseDrag(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling key down to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    onKeyDown(grid: Hypegrid, event: Canvas.KeyboardSyntheticEvent) {
        if (this.featureChain) {
            this.featureChain.handleKeyDown(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling key up to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    onKeyUp(grid: Hypegrid, event: Canvas.KeyboardSyntheticEvent) {
        if (this.featureChain) {
            this.featureChain.handleKeyUp(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling double click to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    onDoubleClick(grid: Hypegrid, event: CellEvent) {
        if (this.featureChain) {
            this.featureChain.handleDoubleClick(grid, event);
            this.setCursor(grid);
        }
    }
    /**
     * @desc delegate handling mouse down to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    handleMouseDown(grid: Hypegrid, event: CellEvent) {
        if (this.featureChain) {
            this.featureChain.handleMouseDown(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling mouse exit to the feature chain of responsibility
     * @internal
     */
    handleMouseExit(grid: Hypegrid, event: CellEvent) {
        if (this.featureChain) {
            this.featureChain.handleMouseExit(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc Delegate handling touchstart to the feature chain of responsibility.
     * @internal
     */
    onTouchStart(grid: Hypegrid, event: Canvas.TouchSyntheticEvent) {
        if (this.featureChain) {
            this.featureChain.handleTouchStart(grid, event);
        }
    }

    /**
     * @desc Delegate handling touchmove to the feature chain of responsibility.
     * @internal
     */
    onTouchMove(grid: Hypegrid, event: Canvas.TouchSyntheticEvent) {
        if (this.featureChain) {
            this.featureChain.handleTouchMove(grid, event);
        }
    }

    /**
     * @desc Delegate handling touchend to the feature chain of responsibility.
     * @internal
     */
    onTouchEnd(grid: Hypegrid, event: Canvas.TouchSyntheticEvent) {
        if (this.featureChain) {
            this.featureChain.handleTouchEnd(grid, event);
        }
    }

    /**
     * @desc I've been notified that the behavior has changed.
     * @internal
     */
    changed() { this.grid.behaviorChanged(); }

    /**
     * @desc The dimensions of the grid data have changed. You've been notified.
     * @internal
     */
    shapeChanged() { this.grid.behaviorShapeChanged(); }

    /**
     * @desc The dimensions of the grid data have changed. You've been notified.
     * @internal
     */
    stateChanged() { this.grid.behaviorStateChanged(); }

    /**
     * @param allX - Data x coordinate.
     * @return The properties for a specific column.
     * @internal
     */
    getColumnProperties(allX: number): ColumnProperties | undefined {
        const column = this.getAllColumn(allX);
        return column?.properties;
    }

    /**
     * @param allX - Data x coordinate.
     * @return The properties for a specific column.
     * @internal
     */
    setColumnProperties(allX: number, properties: ColumnProperties): ColumnProperties {
        const column = this.getAllColumn(allX);
        if (column === undefined) {
            throw 'Expected column.';
        }

        // column.clearProperties(); // needs implementation
        column.properties.merge(properties);
        this.changed();
        return column.properties;
    }

    /**
     * Clears all cell properties of given column or of all columns.
     * @param allX - Omit for all columns.
     * @internal
     */
    clearAllCellProperties(allX?: number) {
        let X: number;

        if (allX === undefined) {
            allX = 0;
            X = this._allColumns.length;
        } else {
            X = allX + 1;
        }

        while (allX < X) {
            const column = this.getAllColumn(allX);
            if (column) {
                column.clearAllCellProperties();
            }
            allX++
        }
    }

    /**
     * @return All the currently hidden column header labels.
     */
    getHiddenColumnDescriptors() {
        const tableState = this.grid.properties;
        const indexes = tableState.columnIndexes;
        const labels = [];
        const columnCount = this.getActiveColumnCount();
        for (let i = 0; i < columnCount; i++) {
            if (indexes.indexOf(i) === -1) {
                const column = this.getActiveColumn(i);
                labels.push({
                    id: i,
                    header: column.header,
                    field: column.name
                });
            }
        }
        return labels;
    }

    /**
     * @return The number of fixed columns.
     * @internal
     */
    getFixedColumnCount() {
        return this.grid.properties.fixedColumnCount;
    }

    /**
     * @desc set the number of fixed columns
     * @param n - the integer count of how many columns to be fixed
     */
    setFixedColumnCount(n: number) {
        this.grid.properties.fixedColumnCount = n;
    }

    /**
     * @summary The number of "fixed rows."
     * @desc The number of (non-scrollable) rows preceding the (scrollable) data subgrid.
     * @return The sum of:
     * 1. All rows of all subgrids preceding the data subgrid.
     * 2. The first `fixedRowCount` rows of the data subgrid.
     * @internal
     */
    getFixedRowCount() {
        return (
            this.getHeaderRowCount() +
            this.grid.properties.fixedRowCount
        );
    }

    /**
     * @desc Set the number of fixed rows, which includes (top to bottom order):
     * 1. The header rows
     *    1. The header labels row (optional)
     *    2. The filter row (optional)
     *    3. The top total rows (0 or more)
     * 2. The non-scrolling rows (externally called "the fixed rows")
     *
     * @param n - The number of rows.
     */
    setFixedRowCount(n: number) {
        this.grid.properties.fixedRowCount = n;
    }

    /**
     * @desc a dnd column has just been dropped, we've been notified
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    endDragColumnNotification() {

    }

    /**
     * @return the cursor at a specific x,y coordinate
     * @param x - the x coordinate
     * @param y - the y coordinate
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getCursorAt(x: number, y: number) {
        return null;
    }

    /**
     * Number of _visible_ columns.
     * @return The total number of columns.
     * @internal
     */
    getActiveColumnCount() {
        return this._activeColumns.length;
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
     * @desc Quietly set the vertical scroll position.
     * @param y - The new position in pixels.
     */
    setScrollPositionY(y: number) {
        this._scrollPositionY = y;
    }

    getScrollPositionY() {
        return this._scrollPositionY;
    }

    /**
     * @return The cell editor for the cell at the given coordinates.
     * @param editPoint - The grid cell coordinates.
     * @internal
     */
    getCellEditorAt(event: CellEvent) {
        return event.isDataColumn && event.column.getCellEditorAt(event);
    }

    /**
     * @return `true` if we should highlight on hover
     * @param isColumnHovered - the column is hovered or not
     * @param isRowHovered - the row is hovered or not
     */
    highlightCellOnHover(isColumnHovered: boolean, isRowHovered: boolean): boolean {
        return isColumnHovered && isRowHovered;
    }

    /**
     * @desc swap source and target columns
     * @param source - column index
     * @param target - column index
     */
    swapColumns(source: number, target: number) {
        const columns = this._activeColumns;
        const sourceColumn = columns[source];
        if (sourceColumn === undefined) {
            return;
        }
        const targetColumn = columns[target];
        columns[source] = targetColumn;
        if (sourceColumn === undefined) {
            return;
        }
        columns[target] = sourceColumn;
        this.changed();
    }

    convertViewPointToDataPoint(unscrolled: Point) {
        return Point.create(
            this.getActiveColumn(unscrolled.x).index,
            unscrolled.y
        );
    }

    // getSelectionMatrixFunction(selectedRows) {
    //     return function() {
    //         return null;
    //     };
    // }

    autosizeAllColumns() {
        this.checkColumnAutosizing(true);
        this.changed();
    }

    checkColumnAutosizing(force?: boolean) {
        let autoSized = false;

        this._activeColumns.find((column) => {
            autoSized = column.checkColumnAutosizing(force) || autoSized;
        });

        return autoSized;
    }

    getAllColumns() {
        return this._allColumns;
    }

    getActiveColumns() {
        return this._activeColumns;
    }

    getHiddenColumns() {
        // this does not look right
        const visible = this._activeColumns;
        const all = this._allColumns;
        const hidden = new Array<Column>();
        for (let i = 0; i < all.length; i++) {
            if (visible.indexOf(all[i]) === -1) {
                hidden.push(all[i]);
            }
        }
        hidden.sort((a, b) => {
            return a.header < b.header ? 1 : 0;
        });
        return hidden;
    }

    getSelectedRows() {
        return this.grid.selectionModel.getSelectedRows();
    }

    getSelectedColumns() {
        return this.grid.selectionModel.getSelectedColumns();
    }

    getSelections() {
        return this.grid.selectionModel.getSelections();
    }

    // Begin Subgrids Mixin
    setSubgrids(subgridSpecs: Subgrid.Spec[]) {
        this._subgrids.clear();

        let mainSubgrid: Subgrid | undefined;
        const subgrids = this._subgrids;
        subgridSpecs.forEach(
            (spec) => {
                if (spec !== undefined) {
                    const subgrid = this.createSubgridFromSpec(spec);
                    subgrids.push(subgrid);
                    if (subgrid.role === Subgrid.RoleEnum.main) {
                        mainSubgrid = subgrid;
                    }
                }
            }
        );

        if (mainSubgrid === undefined) {
            throw new AssertError('BSS98224', 'Subgrid Specs does not include main');
        } else {
            this.mainSubgrid = mainSubgrid;
            this.mainDataModel = mainSubgrid.dataModel;
            this.shapeChanged();
        }
    }

    get subgrids() {
        return this._subgrids;
    }

    /**
     * @summary Resolves a `subgridSpec` to a Subgrid (and its DataModel).
     * @desc The spec may describe either an existing data model, or a constructor for a new data model.
     */
    createSubgridFromSpec(spec: Subgrid.Spec) {
        let subgrid: Subgrid;

        if (spec === Subgrid.RoleEnum.main && this.mainSubgrid !== undefined) {
            subgrid = this.mainSubgrid;
        } else {
            // if (spec instanceof Array) {
            //     if (spec.length >= 1) {
            //         const constructor = spec[0];
            //         let role: Subgrid.RoleEnum;
            //         let variableArgArray: unknown[];
            //         if (spec.length === 1) {
            //             role = Subgrid.RoleEnum.Main;
            //             variableArgArray = [];
            //         } else {
            //             role  = spec[1];
            //             variableArgArray = spec.slice(2);
            //         }
            //         subgrid = new constructor(this.grid, role, ...variableArgArray);
            //         this.prepareDataModel(subgrid)
            //     }
            // } else {
                if (typeof spec === 'object') {
                    let dataModel = spec.dataModel;
                    if (typeof dataModel === 'function') {
                        dataModel = new dataModel();
                    }
                    subgrid = this.createSubgrid(dataModel, spec.role ?? Subgrid.RoleEnum.main); // Spec is a DataModel
                } else {
                    const dataModel = this.createLocalDataModel(spec);
                    subgrid = this.createSubgrid(dataModel, spec); // Spec is a DataModel
                }
            // }
        }

        return subgrid;
    }

    private createSubgrid(dataModel: DataModel, role: Subgrid.Role) {
        const subgrid = new Subgrid(
            this.schemaModel,
            dataModel,
            role,
            this.grid,
            this._hooks,
            (eventName, eventDetail) => this.handleDataModelEventDispatch(eventName, eventDetail),
            () => this.handleDataLoaded(),
            () => this.handleDataPostreindex(),
            () => this.handleDataPrereindex(),
            () => this.handleDataShapeChanged(),
            () => this.handleSchemaLoaded(),
        );

        return subgrid;
    }

    /**
     * @summary Gets the number of "header rows".
     * @desc Defined as the sum of all rows in all subgrids before the (first) data subgrid. Rework to return row count of header subgrid
     */
    getHeaderRowCount() {
        let result = 0;

        this.subgrids.find((subgrid) => {
            if (subgrid.isData) {
                return true; // stop
            }
            result += subgrid.dataModel.getRowCount();
            return undefined;
        });

        return result;
    }

    /**
     * @summary Gets the number of "footer rows".
     * @desc Defined as the sum of all rows in all subgrids after the (last) data subgrid.  Rework to return row count of footer subgrid
     */
    getFooterRowCount() {
        let gotData = false;
        return this.subgrids.reduce(
            (rows, subgrid) => {
                if (gotData && !subgrid.isData) {
                    rows += subgrid.dataModel.getRowCount();
                } else {
                    gotData = subgrid.isData;
                }
                return rows;
            },
            0
        );
    }

    /**
     * @summary Gets the total number of logical rows.
     * @desc Defined as the sum of all rows in all subgrids.
     */
    getLogicalRowCount() {
        const count = this.subgrids.reduce(
            (rows, subgrid) => {
                return (rows += subgrid.dataModel.getRowCount());
            },
            0
        );
        return count;
    }

    // End Subgrids Mixin

    // Start RowProperties Mixin
    /**
     * @summary The total height of the "fixed rows."
     * @desc The total height of all (non-scrollable) rows preceding the (scrollable) data subgrid.
     * @return The height in pixels of the fixed rows area of the hypergrid, the total height of:
     * 1. All rows of all subgrids preceding the data subgrid.
     * 2. The first `fixedRowCount` rows of the data subgrid.
     */
    getFixedRowsHeight() {
        const subgrids = this.subgrids;
        const gridProps = this.grid.properties;
        const gridLinesHWidth = gridProps.gridLinesHWidth;
        let isData = false;
        let height = 0;

        for (let i = 0; i < subgrids.length && !isData; ++i) {
            const subgrid = subgrids[i];
            isData = subgrid.isData;
            const R = isData ? gridProps.fixedRowCount : subgrid.dataModel.getRowCount();
            for (let r = 0; r < R; ++r) {
                height += this.getRowHeight(r, subgrid);
                height += gridLinesHWidth;
            }
            // add in fixed rule thickness excess
            if (isData && gridProps.fixedLinesHWidth) {
                height += gridProps.fixedLinesHWidth - gridLinesHWidth;
            }
        }

        return height;
    }

    /**
     * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param rowPropertiesPrototype - Prototype for a new properties object when one does not already exist. If you don't define this and one does not already exist, this call will return `undefined`.
     * Typical defined value is `null`, which creates a plain object with no prototype, or `Object.prototype` for a more "natural" object.
     * _(Required when 3rd param provided.)_
     * @param subgrid- This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     * @returns The row properties object which will be one of:
     * * object - existing row properties object or new row properties object created from `prototype`; else
     * * `false` - row found but no existing row properties object and `prototype` was not defined; else
     * * `undefined` - no such row or DataModel does not support row properties
     */
    getRowPropertiesUsingCellEvent(cellInfo: CellInfo, rowPropertiesPrototype?: DataModel.RowPropertiesPrototype): DataModel.RowProperties | false | undefined {
        return this.getRowProperties(cellInfo.dataCell.y, rowPropertiesPrototype, cellInfo.subgrid);
    }
    // getRowProperties(yOrCellEvent: number | CellEvent,
    //     rowPropertiesPrototype?: DataModel.RowPropertiesPrototype,
    //     subgrid?: Subgrid): DataModel.RowProperties | false | undefined;
    // getRowProperties(y: number,
    //     rowPropertiesPrototype?: DataModel.RowPropertiesPrototype,
    //     subgrid?: Subgrid): DataModel.RowProperties | false | undefined;
    getRowProperties(y: number,
        rowPropertiesPrototype?: DataModel.RowPropertiesPrototype,
        subgrid?: Subgrid): DataModel.RowProperties | false | undefined {

        // if (typeof yOrCellEvent === 'object') {
        //     subgrid = yOrCellEvent.subgrid;
        //     yOrCellEvent = yOrCellEvent.dataCell.y;
        // }

        subgrid ??= this.mainSubgrid;
        const rowMetadataPrototype: DataModel.RowMetadataPrototype = rowPropertiesPrototype === undefined ? undefined : null;
        const metadata = subgrid.getRowMetadata(y, rowMetadataPrototype);
        return metadata && (metadata.__ROW ?? (rowPropertiesPrototype !== undefined && (metadata.__ROW = Object.create(rowPropertiesPrototype))));
    }

    /**
     * Reset the row properties in its entirety to the given row properties object.
     * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param properties - The new row properties object. If `undefined`, this call is a no-op.
     * @param subgrid - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */
    setRowPropertiesUsingCellEvent(cellInfo: CellInfo, properties: DataModel.RowProperties | undefined) {
        // Do we need this?
        // if (subgrid === undefined) {
        //     subgrid = this.mainSubgrid;
        // }

        this.setRowProperties(cellInfo.dataCell.y, properties, cellInfo.subgrid)
    }
    setRowProperties(y: number, properties: DataModel.RowProperties | undefined, subgrid: Subgrid): void {
        if (!properties) {
            return;
        }

        const metadata = subgrid.getRowMetadata(y, null);
        if (metadata) {
            metadata.__ROW = Object.create(this._rowPropertiesPrototype);
            this.addRowProperties(y, properties, subgrid, metadata.__ROW);
            this.stateChanged();
        }
    }

    /**
     * Sets a single row property on a specific individual row.
     * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param key - The property name.
     * @param value - The new property value.
     * @param dataModel - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */

    setRowPropertyUsingCellEvent(cellEvent: CellEvent, key: string, value: unknown) {
        this.setRowProperty(cellEvent.dataCell.y, key, value, cellEvent.subgrid);
    }

    setRowProperty(y: number, key: string, value: unknown, subgrid?: Subgrid) {
        let rowProps: DataModel.RowProperties | false | undefined;
        const isHeight = (key === 'height');

        if (value !== undefined) {
            rowProps = this.getRowProperties(y, this._rowPropertiesPrototype, subgrid);
            if (rowProps) {
                rowProps[key] = value;
            }
        } else {
            // only try to undefine key if row props object exists; no point in creating it just to delete a non-existant key
            rowProps = this.getRowProperties(y, undefined, subgrid);
            if (rowProps) {
                delete rowProps[isHeight ? '_height' : key];
            }
        }

        if (isHeight) {
            this.shapeChanged();
        } else {
            this.stateChanged();
        }
    }

    addRowPropertiesUsingCellEvent(cellEvent: CellEvent, properties: DataModel.RowProperties | undefined, rowProps?: DataModel.RowProperties) {
        this.addRowProperties(cellEvent.dataCell.y, properties, cellEvent.subgrid, rowProps);
    }

    /**
     * Add all the properties in the given row properties object to the row properties.
     * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param properties - An object containing new property values(s) to assign to the row properties. If `undefined`, this call is a no-op.
     * @param subgrid - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */

    addRowProperties(y: number, properties: DataModel.RowProperties | undefined, subgrid: Subgrid, rowProps?: DataModel.RowProperties | false) {
        if (!properties) {
            return;
        }

        let isHeight: boolean;
        let hasHeight: boolean;

        let resolvedRowProps: DataModel.RowProperties | false | undefined;
        if (rowProps) {
            resolvedRowProps = rowProps;
        } else {
            resolvedRowProps = this.getRowProperties(y, this._rowPropertiesPrototype, subgrid);
        }

        if (rowProps) {
            Object.keys(properties).forEach(function(key) {
                const value = properties[key];
                if (value !== undefined) {
                    resolvedRowProps[key] = value;
                } else {
                    isHeight = key === 'height';
                    delete resolvedRowProps[isHeight ? '_height' : key];
                    hasHeight = hasHeight || isHeight;
                }
            });

            if (hasHeight) {
                this.shapeChanged();
            } else {
                this.stateChanged();
            }
        }
    }

    /**
     * @param yOrCellEvent - Data row index local to `dataModel`.
     * @returns The row height in pixels.
     */
    getRowHeight(y: number, subgrid?: Subgrid) {
        const rowProps = this.getRowProperties(y, undefined, subgrid);
        return rowProps && rowProps.height || this.grid.properties.defaultRowHeight;
    }

    /**
     * @desc set the pixel height of a specific row
     * @param yOrCellEvent - Data row index local to dataModel.
     * @param height - pixel height
     */
    setRowHeight(yOrCellEvent: number, height: number, subgrid?: Subgrid) {
        this.setRowProperty(yOrCellEvent, 'height', height, subgrid);
    }
    // End RowProperties Mixin

    // Start GridCellProperties Mixin
    /**
     * @summary Get the cell's own properties object.
     * @desc May be undefined because cells only have their own properties object when at lest one own property has been set.
     * @param allXOrCellEvent - Data x coordinate or cell event.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @returns The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `undefined`.
     */
    getCellOwnProperties(allXOrCellEvent: number | CellEvent, y?: number, subgrid?: Subgrid) {
        if (typeof allXOrCellEvent === 'object') {
            // xOrCellEvent is cellEvent
            return allXOrCellEvent.column.getCellOwnProperties(allXOrCellEvent.dataCell.y, allXOrCellEvent.subgrid);
        } else {
            // xOrCellEvent is x
            return this.getAllColumn(allXOrCellEvent).getCellOwnProperties(y, subgrid);
        }
    }

    /**
     * @summary Get the properties object for cell.
     * @desc This is the cell's own properties object if found else the column object.
     *
     * If you are seeking a single specific property, consider calling {@link Behavior#getCellProperty} instead.
     * @param xOrCellEvent - Data x coordinate or CellEvent.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @return The properties of the cell at x,y in the grid.
     */
    getCellPropertiesUsingCellEvent(cellEvent: CellEvent): DataModel.CellOwnProperties {
        return cellEvent.cellOwnProperties;
    }

    getCellProperties(allX: number, y: number, subgrid: Subgrid): DataModel.CellOwnProperties {
        return this.getAllColumn(allX).getCellProperties(y, subgrid);
    }

    /**
     * @summary Return a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     * @param xOrCellEvent - Data x coordinate.
     * @param y - Grid row coordinate._ Omit when `xOrCellEvent` is a `CellEvent`._
     * @param key - Name of property to get. _When `y` omitted, this param promoted to 2nd arg._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @return The specified property for the cell at x,y in the grid.
     */
    getCellPropertyUsingCellEvent(cellEvent: CellEvent, key: string): DataModel.CellOwnProperty {
        return cellEvent.cellOwnProperties[key];
    }
    getCellProperty(allX: number, y: number, key: string, subgrid: Subgrid): DataModel.CellOwnProperty {
        return this.getAllColumn(allX).getCellProperty(y, key, subgrid);
    }

    /**
     * @desc update the data at point x, y with value
     * @param xOrCellEvent - Data x coordinate.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param properties - Hash of cell properties. _When `y` omitted, this param promoted to 2nd arg._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     */
    setCellPropertiesUsingCellEvent(cellEvent: CellEvent, properties: DataModel.CellOwnProperties): DataModel.CellOwnProperties {
        return cellEvent.column.setCellProperties(cellEvent.dataCell.y, properties, cellEvent.subgrid);
    }
    setCellProperties(allX: number, y: number, properties: DataModel.CellOwnProperties, subgrid: Subgrid): DataModel.CellOwnProperties {
        return this.getAllColumn(allX).setCellProperties(y, properties, subgrid);
    }

    /**
     * @desc update the data at point x, y with value
     * @param xOrCellEvent - Data x coordinate.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param properties - Hash of cell properties. _When `y` omitted, this param promoted to 2nd arg._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     */
    addCellPropertiesUsingCellEvent(cellEvent: CellEvent, properties: DataModel.CellOwnProperties): DataModel.CellOwnProperties {
        return cellEvent.column.addCellProperties(cellEvent.dataCell.y, properties, cellEvent.subgrid);
    }
    addCellProperties(allX: number, y: number, properties: DataModel.CellOwnProperties, subgrid?: Subgrid): DataModel.CellOwnProperties {
        return this.getAllColumn(allX).addCellProperties(y, properties, subgrid);
    }

    /**
     * @summary Set a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     *
     * NOTE: For performance reasons, renderer's cell event objects cache their respective cell properties objects. This method accepts a `CellEvent` overload. Whenever possible, use the `CellEvent` from the renderer's cell event pool. Doing so will reset the cell properties object cache.
     *
     * If you use some other `CellEvent`, the renderer's `CellEvent` properties cache will not be automatically reset until the whole cell event pool is reset on the next call to {@link Renderer#computeCellBoundaries}. If necessary, you can "manually" reset it by calling {@link Renderer#resetCellPropertiesCache|resetCellPropertiesCache(yourCellEvent)} which searches the cell event pool for one with matching coordinates and resets the cache.
     *
     * The raw coordinates overload calls the `resetCellPropertiesCache(x, y)` overload for you.
     * @param xOrCellEvent - `CellEvent` or data x coordinate.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param key - Name of property to get. _When `y` omitted, this param promoted to 2nd arg._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     */
    setCellProperty(cellEvent: CellEvent, key: string | number, value: DataModel.CellOwnProperty): DataModel.CellOwnProperties;
    setCellProperty(allX: number, y: number, key: string | number, value: DataModel.CellOwnProperty, subgrid: Subgrid): DataModel.CellOwnProperties;
    setCellProperty(
        allXOrCellEvent: CellEvent | number,
        yOrKey: string | number,
        keyOrValue: string | number | DataModel.CellOwnProperty,
        valueOrDataModel?: DataModel.CellOwnProperty | DataModel,
        subgrid?: Subgrid
    ): DataModel.CellOwnProperties {
        let cellOwnProperties: DataModel.CellOwnProperties;
        if (typeof allXOrCellEvent === 'object') {
            const key = yOrKey as string;
            const value = keyOrValue;
            cellOwnProperties = allXOrCellEvent.setCellProperty(key, value);
        } else {
            const y = yOrKey as number;
            const key = keyOrValue as string;
            const value = valueOrDataModel;
            cellOwnProperties = this.getAllColumn(allXOrCellEvent).setCellProperty(y, key, value, subgrid);
            this.grid.renderer.resetCellPropertiesCache(allXOrCellEvent, y, subgrid);
        }
        return cellOwnProperties;
    }
    // End GridCellProperties Mixin

    // Start DataModel Mixin
    // getSchema() {
    //     return this.schemaModel;
    // }

    // setSchema(newSchema) {
    //     this.mainDataModel.setSchema(newSchema);
    // }

    /**
     * @summary Gets the number of rows in the data subgrid.
     * {@link https://fin-hypergrid.github.io/doc/DataModel.html#getRowCount|getRowCount}
     */
    getRowCount() {
        return this.mainDataModel.getRowCount();
    }

    /**
     * @summary Get the value at cell (x,y).
     * @desc When the last parameter (see `dataModel` below) is omitted, this method:
     * * Is backwards compatible to the v2 version.
     * * Does _not_ default to the data subgrid — although you can provide it explicitly (`this.behavior.dataModel`).
     * @param x - The horizontal grid coordinate
     * @param y - The vertical coordinate.
     * @param subgrid - `x` and `y` are _data cell coordinates_ in the given subgrid data model. If If omitted, `x` and `y` are _grid cell coordinates._
     * @returns The raw cell data.
     */
    getValue(schemaColumn: SchemaModel.Column, x: number, y: number, subgrid?: Subgrid) {
        if (subgrid !== undefined) {
            return subgrid.dataModel.getValue(schemaColumn, y);
        } else {
            const cellEvent = new CellEvent(this.grid);
            const visible = cellEvent.resetDataXY(x, y, subgrid);
            if (visible) {
                return cellEvent.value;
            }
        }
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
        if (subgrid !== undefined) {
            subgrid.dataModel.setValue(schemaColumn, y, value);
        } else {
            const cellEvent = new CellEvent(this.grid);
            const visible = cellEvent.resetDataXY(x, y, subgrid);
            if (visible) {
                cellEvent.value = value;
            }
        }
    }

    /**
     * @summary Calls `apply()` on the data model.
     * {@link https://fin-hypergrid.github.io/doc/DataModel.html#reindex|reindex}
     */
    reindex() {
        const apply = this.mainDataModel.apply;
        if (apply !== undefined) {
            apply();
        }
    }

    /**
     * Retrieve a data row from the data model.
     * {@link https://fin-hypergrid.github.io/doc/DataModel.html#getRow|getRow}
     * @return The data row object at y index.
     * @param y - the row index of interest
     */
    getRow(y: number) {
        return this.mainSubgrid.getRow(y);
    }

    /**
     * Retrieve all data rows from the data model.
     * > Use with caution!
     * {@link https://fin-hypergrid.github.io/doc/DataModel.html#getData|getData}
     */
    getData() {
        return this.mainDataModel.getData();
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

    private createLocalDataModel(role: Subgrid.Role) {
        switch (role) {
            case Subgrid.RoleEnum.main: return new LocalMainDataModel();
            case Subgrid.RoleEnum.header: return new LocalHeaderDataModel(this.grid);
            default:
                throw new Error('Unsupported role for local DataModel: ' + role);
        }
    }

    private handleDataModelEventDispatch(eventName: DataModel.EventName | SchemaModel.EventName, eventDetail: SchemaModel.EventDetail | DataModel.EventDetail) {
        return dispatchGridEvent(this.grid, eventName, false, eventDetail);
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

    /**
     * _See the data model API page for event semantics (link below)._
     * @returns Result of re-emitted event or `undefined` if event not re-emitted.
     * {@link DataModel#event:hypegrid-schema-loaded}
     */
    private handleSchemaLoaded(): boolean | undefined {
        this.grid.behavior.createColumns();
        return undefined;
    }

    /**
     * _See the data model API page for event semantics (link below)._
     * @returns Result of re-emitted event or `undefined` if event not re-emitted.
     * {@link DataModel#event:hypegrid-data-loaded}
     */
    private handleDataLoaded(): boolean | undefined {
        this.grid.repaint();
        return undefined;
    }

    /**
     * _See the data model API page for event semantics (link below)._
     * @returns Result of re-emitted event or `undefined` if event not re-emitted.
     * {@link DataModel#event:hypegrid-data-shape-changed}
     */
    private handleDataShapeChanged(): boolean | undefined {
        this.grid.behaviorShapeChanged();
        return undefined;
    }

    /**
     * _See the data model API page for event semantics (link below)._
     * @returns Result of re-emitted event or `undefined` if event not re-emitted.
     * {@link DataModel#event:hypegrid-data-prereindex}
     */
    private handleDataPrereindex(): boolean | undefined {
        this.grid.stashRowSelections();
        this.grid.stashColumnSelections();
        return undefined;
    }

    /**
     * _See the data model API page for event semantics (link below)._
     * @returns Result of re-emitted event or `undefined` if event not re-emitted.
     * {@link DataModel#event:hypegrid-data-postreindex}
     */
    private handleDataPostreindex(): boolean | undefined {
        const grid = this.grid;
        grid.selectionModel.reset();
        grid.unstashRowSelections();
        grid.unstashColumnSelections();
        grid.behaviorShapeChanged();
        return undefined;
    }

    cellClicked(event: CellEvent) {
        const toggleRow = this.mainDataModel.toggleRow;
        if (toggleRow === undefined) {
            return undefined;
        } else {
            return this.mainDataModel.toggleRow(event.dataCell.y, event.dataCell.x);
        }
    }

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


export namespace Behavior {
    export class ColumnArray extends Array<Column> {

    }
}

// Begin RowProperties Mixin

export class DefaultRowProperties implements DataModel.RowProperties {
    private _height: number | undefined;

    constructor(private grid: Hypegrid) {

    }
    get height() {
        return this._height || this.grid.properties.defaultRowHeight;
    }

    set height(height) {
        height = Math.max(5, Math.ceil(height));
        if (isNaN(height)) {
            height = undefined;
        }
        if (height !== this._height) {
            if (!height) {
                delete this._height;
            } else {
                // Define `_height` as non-enumerable so won't be included in output of saveState.
                // (Instead the `height` getter is explicitly invoked and the result is included.)
                Object.defineProperty(this, '_height', { value: height, configurable: true });
            }
            this.grid.behaviorStateChanged();
        }
    }
}

// End RowProperties Mixin
