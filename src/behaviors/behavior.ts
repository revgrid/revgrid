import { Point } from '../dependencies/point';
import { Feature } from '../feature/feature';
import { featureFactory } from '../feature/feature-factory';
import { Hypergrid } from '../grid/hypergrid';
import { HypergridProperties } from '../grid/hypergrid-properties';
import { assignOrDelete } from '../lib/assign-or-delete';
import { Canvas } from '../lib/canvas';
import { CellEvent } from '../lib/cell-event';
import { CellInfo } from '../lib/cell-info';
import { DataModel } from '../lib/data-model';
import { dispatchGridEvent } from '../lib/dispatch-grid-event';
import { HypergridError } from '../lib/hypergrid-error';
import { Renderer } from '../renderer/renderer';
import { Column } from './column';
import { ColumnProperties } from './column-properties';
import { LocalHeaderDataModel } from './local/local-header-data-model';
import { LocalMainDataModel } from './local/local-main-data-model';
import { Subgrid, SubgridArray } from './subgrid';



const noExportProperties = [
    'columnHeader',
    'columnHeaderColumnSelection',
    'filterProperties',
    'rowHeader',
    'rowHeaderRowSelection',
    'rowNumbersProperties',
    'treeColumnProperties',
    'treeColumnPropertiesColumnSelection',
];

/**
 * @mixes cellProperties.behaviorMixin
 * @mixes rowProperties.mixin
 * @mixes subgrids.mixin
 * @mixes dataModel.mixin
 * @constructor
 * @desc A controller for the data model.
 * > This constructor (actually `initialize`) will be called upon instantiation of this class or of any class that extends from this class. See {@link https://github.com/joneit/extend-me|extend-me} for more info.
 * @param {Hypergrid} grid
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
    readonly treeColumnIndex = -1;
    readonly rowColumnIndex = -2;

    treeColumnNameDefault = 'Tree';
    treeColumnHeaderDefault = 'Tree';
    rowColumnNameDefault = 'RowHeader';

    grid: Hypergrid;
    featureChain: Feature;
    featureMap = new Map<string, Feature>();
    columnsCreated: boolean;
    scrollPositionX: number;
    scrollPositionY: number;
    columns: Behavior.ColumnArray;
    rowPropertiesPrototype: DataModel.RowPropertiesPrototype;

    // Start Subgrids mixin
    _subgrids: SubgridArray = new SubgridArray();
    // End Subgrids mixin

    // Start RowProperties Mixin
    private _height: number;
    defaultRowHeight: number;
    // End RowProperties Mixin

    // Start DataModel Mixin
    mainDataModel: DataModel;
    mainSubgrid: Subgrid;
    allColumns: Behavior.ColumnArray;
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

    constructor(grid: Hypergrid, options?: Hypergrid.Options) {
        this.grid = grid;

        this.initializeFeatureChain();

        this.grid.behavior = this;
        this.reset(options);
    }

    /**
     * @desc Create the feature chain - this is the [chain of responsibility](http://c2.com/cgi/wiki?ChainOfResponsibilityPattern) pattern.
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
                    this.featureMap.set(feature.typeName, feature);

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

    dispose() {
        this.disposeSubgrids();
    }

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
     */
    reset(options?: Hypergrid.Options) {
        const dataModelChanged = this.resetMainDataModel(options);

        this.scrollPositionX = this.scrollPositionY = 0;

        this.rowPropertiesPrototype = DefaultRowProperties;

        this.clearColumns();
        this.createColumns();

        /**
         * Ordered list of subgrids to render.
         * @type {subgridSpec[]}
         * @memberOf Hypergrid#
         */
        if (options !== undefined && options.subgrids !== undefined && options.subgrids.length > 0) {
            this.setSubgrids(options.subgrids);
        } else {
            if (!dataModelChanged && this.subgrids) {
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

        this.setData(options.data);
    }

    /**
     * @memberOf Local#
     * @description Set the header labels.
     * @param headers - The header labels. One of:
     * * _If an array:_ Must contain all headers in column order.
     * * _If a hash:_ May contain any headers, keyed by field name, in any order.
     */
    setHeaders(headers: string[] | Record<string, string>) {
        if (headers instanceof Array) {
            // Reset all headers
            const allColumns = this.allColumns;
            headers.forEach((header, index) => {
                allColumns[index].header = header; // setter updates header in both column and data source objects
            });
        } else if (typeof headers === 'object') {
            // Adjust just the headers in the hash
            this.allColumns.forEach((column) => {
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
     */
    setData(options: Hypergrid.Options): void;
    setData(data: Hypergrid.Options.Data, options?: Hypergrid.Options): void;
    setData(dataOrOptions: Hypergrid.Options.Data | Hypergrid.Options, options?: Hypergrid.Options): void {
        let data: Hypergrid.Options.Data;
        if (Array.isArray(dataOrOptions) || typeof dataOrOptions === 'function') {
            data = dataOrOptions;
        } else {
            options = dataOrOptions as Hypergrid.Options;
            data = options?.data;
        }

        if (data === undefined) {
            return;
        } else {
            const dataRows = typeof data === 'function' ? data() : data;

            if (!Array.isArray(dataRows)) {
                throw 'Expected data to be an array (of data row objects).';
            }

            const schemaOrFunction = options?.schema;
            const schema = typeof schemaOrFunction === 'function' ? schemaOrFunction() : schemaOrFunction;

            // Inform interested subgrids of data.
            this.subgrids.forEach((subgrid) => {
                subgrid.dataModel.setData(dataRows, schema);
            });

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

    get leftMostColIndex() {
        const showRowNumbers = this.grid.properties.showRowNumbers;
        return showRowNumbers ? this.rowColumnIndex : (this.hasTreeColumn() ? this.treeColumnIndex : 0);
    }

    /**
     * @this BehaviorType
     */
    clearColumns() {
        // As part of Typescript conversion, schema is now readonly.
        // Need to find other way of getting non default name and header to tree and row number columns
        //
        // const schema = this.mainDataModel.getSchema();
        const tc = this.treeColumnIndex;
        const rc = this.rowColumnIndex;

        this.columnsCreated = false;

        // const existingTreeColumnSchema = schema[tc];
        const newTreeColumnSchema: DataModel.ColumnSchema = {
            // index: tc,
            name: /* existingTreeColumnSchema?.name ??*/ this.treeColumnNameDefault,
            header: /* existingTreeColumnSchema?.header ??*/ this.treeColumnHeaderDefault,
        }
        // schema[tc] = newTreeColumnSchema;

        // const existingRowColumnSchema = schema[rc];
        const newRowColumnSchema: DataModel.ColumnSchema = {
            // index: tc,
            name: /*existingRowColumnSchema?.name ??*/ this.rowColumnNameDefault,
            header: /* existingRowColumnSchema?.header ??*/ '',
        }
        // schema[rc] = newRowColumnSchema;

        this.columns = new Behavior.ColumnArray(this.grid);
        this.allColumns = new Behavior.ColumnArray(this.grid);

        this.allColumns[tc] = this.columns[tc] = this.newColumn(newTreeColumnSchema, tc);
        this.allColumns[rc] = this.columns[rc] = this.newColumn(newRowColumnSchema, rc);

        // this.columns[tc].properties.propClassLayers = this.columns[rc].properties.propClassLayers = this.grid.properties.propClassLayersMap.NO_ROWS;

        // Signal the renderer to size the now-reset handle column before next render
        this.grid.renderer.resetRowHeaderColumnWidth();
    }

    getActiveColumn(x: number) {
        return this.columns[x];
    }

    /**
     * The "grid index" of an active column given a "data index" (number), column name (string), or column object
     * @returns The grid index of the column or undefined if column not in grid.
     */
    getActiveColumnIndex(columnOrIndexOrName: Column | number | string) {
        const indexOrName = columnOrIndexOrName instanceof Column ? columnOrIndexOrName.index : columnOrIndexOrName;
        const key = typeof indexOrName === 'number' ? 'index' : 'name';

        return this.columns.findIndex((column) => { return column[key] === indexOrName; });
    }

    getColumn(x: number) {
        return this.allColumns[x];
    }

    newColumn(columnSchema: DataModel.ColumnSchema, index: number) {
        return new Column(this, columnSchema, index);
    }

    addColumn(columnSchema: DataModel.ColumnSchema, index?: number) {
        if (index === undefined) {
            index = this.columns.length;
        }
        const column = this.newColumn(columnSchema, index);
        // const arrayDecorator = new ArrayDecorator;
        // const synonyms = arrayDecorator.getSynonyms(column.name);

        this.columns.push(column);
        // arrayDecorator.decorateObject(this.columns, synonyms, column);

        this.allColumns.push(column);
        // arrayDecorator.decorateObject(this.allColumns, synonyms, column);

        return column;
    }

    /**
     * @this Hypergrid
     */
    createColumns() {
        const schema = this.mainDataModel.getSchema();
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

    getColumnWidth(x: number) {
        const column = (x !== this.treeColumnIndex || this.hasTreeColumn()) && this.getActiveColumn(x);
        return column ? column.getWidth() : 0;
    }

    /**
     * @param columnOrIndex - The column or active column index.
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
        column.setWidth(width);
        this.stateChanged();
    }

    /**
     * @memberOf Behavior#
     * @desc utility function to empty an object of its members
     * @param obj - the object to empty
     * @param exportProps
     * * `undefined` (omitted) - delete *all* properties
     * * **falsy** - delete *only* the export properties
     * * **truthy** - delete all properties *except* the export properties
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
    getState() {
        // copy.columnProperties does not exist. Not sure what this is doing.
        const copy = JSON.parse(JSON.stringify(this.grid.properties));
        this.clearObjectProperties(copy.columnProperties, false);
        return copy;
    }
    /**
     * @memberOf Behavior#
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

        const gridProps = this.grid.properties as HypergridProperties; // this may not work

        gridProps.settingState = settingState;
        assignOrDelete(gridProps, properties);
        delete gridProps.settingState;

        this.reindex();
    }

    /**
     * @summary Sets properties for active columns.
     * @desc Sets multiple columns' properties from elements of given array or collection. Keys may be column indexes or column names. The properties collection is cleared first. Falsy elements are ignored.
     * @param {object[]|undefined} columnsHash - If undefined, this call is a no-op.
     */
    setAllColumnProperties(columnsHash) {
        this.addAllColumnProperties(columnsHash, true);
    }

    /**
     * @summary Adds properties for multiple columns.
     * @desc Adds . The properties collection is optionally cleared first. Falsy elements are ignored.
     * @param {object[]|undefined} columnsHash - If undefined, this call is a no-op.
     * @param {boolean} [settingState] - Clear columns' properties objects before copying properties.
     */
    addAllColumnProperties(columnsHash, settingState: boolean) {
        if (!columnsHash) {
            return;
        }

        const columns = this.grid.behavior.getColumns();

        Object.keys(columnsHash).forEach(function(key) {
            const column = columns[key];
            if (column) {
                column.addProperties(columnsHash[key], settingState);
            }
        });
    }

    setColumnOrder(columnIndexes) {
        if (Array.isArray(columnIndexes)){
            const columns = this.columns;
            const allColumns = this.allColumns;
            // const arrayDecorator = new ArrayDecorator;

            // avoid recreating the `columns` array object to keep refs valid; just empty it
            columns.length = 0;
            const tc = this.treeColumnIndex.toString(), rc = this.rowColumnIndex.toString();
            Object.keys(columns).forEach((key) => {
                switch (key) {
                    case tc:
                    case rc:
                        break;
                    default:
                        delete columns[key];
                }
            });

            columnIndexes.forEach((index) => {
                columns.push(allColumns[index]);
            });

            // arrayDecorator.decorateArray(columns);
        }
    }

    setColumnOrderByName(columnNames) {
        if (Array.isArray(columnNames)) {
            const allColumns = this.allColumns;
            this.setColumnOrder(columnNames.map((name) => { return allColumns[name].index; }));
        }
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
     * @param {boolean} [isActiveColumnIndexes=false] - Which list `columnIndexes` refers to:
     * * `true` - The active column list. This can only move columns around within the active column list; it cannot add inactive columns (because it can only refer to columns in the active column list).
     * * `false` - The full column list (as per column schema array). This inserts columns from the "inactive" column list, moving columns that are already active.
     *
     * @param {number|number[]} [columnIndexes] - Column index(es) into list as determined by `isActiveColumnIndexes`. One of:
     * * **Scalar column index** - Adds single column at insertion point.
     * * **Array of column indexes** - Adds multiple consecutive columns at insertion point.
     *
     * _This required parameter is promoted left one arg position when `isActiveColumnIndexes` omitted._
     *
     * @param {number} [referenceIndex=this.columns.length] - Insertion point, _i.e.,_ the element to insert before. A negative values skips the reinsert. Default is to insert new columns at end of active column list.
     *
     * _Promoted left one arg position when `isActiveColumnIndexes` omitted._
     *
     * @param {boolean} [allowDuplicateColumns=false] - Unless true, already visible columns are removed first.
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

        const activeColumns = this.columns;
        const sourceColumnList = isActiveColumnIndexes ? activeColumns : this.allColumns;

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
     * @param {boolean} [isActiveColumnIndexes=false] - Which list `columnIndexes` refers to:
     * * `true` - The active column list.
     * * `false` - The full column list (as per column schema array).
     * @param {number|number[]} [columnIndexes] - Column index(es) into list as determined by `isActiveColumnIndexes`. One of:
     * * **Scalar column index** - Adds single column at insertion point.
     * * **Array of column indexes** - Adds multiple consecutive columns at insertion point.
     *
     * _This required parameter is promoted left one arg position when `isActiveColumnIndexes` omitted._
     * @memberOf Behavior#
     */
    hideColumns(isActiveColumnIndexes: boolean, columnIndexes: number | number[]) {
        this.showColumns(isActiveColumnIndexes, columnIndexes, -1);
    }

    /**
     * @memberOf Behavior#
     * @desc fetch the value for a property key
     * @returns {*} The value of the given property.
     * @param {string} key - a property name
     */
    // resolveProperty(key) {
    //     // todo: remove when we remove the deprecated grid.resolveProperty
    //     return this.grid.resolveProperty(key);
    // }

    lookupFeature(key: string) {
        return this.featureMap.get(key);
    }

    /**
     * @memberOf Behavior#
     * @return The width of the fixed column area in the hypergrid.
     */
    getFixedColumnsWidth() {
        const count = this.getFixedColumnCount();
        let i = this.leftMostColIndex;
        const gridProps = this.grid.properties;
        const contentBox = gridProps.boxSizing !== 'border-box';
        const gridLinesVWidth = gridProps.gridLinesVWidth;
        let total = 0;

        for (; i < count; i++) {
            const columnWidth = this.getColumnWidth(i);
            if (columnWidth) {
                total += columnWidth;
                if (contentBox) {
                    total += gridLinesVWidth;
                }
            }
        }

        // add in fixed rule thickness excess
        if (gridProps.fixedLinesVWidth) {
            total += gridProps.fixedLinesHWidth - gridLinesVWidth;
        }

        return total;
    }

    /**
     * @memberOf Behavior#
     * @desc This exists to support "floating" columns.
     * @return {number} The total width of the fixed columns area.
     */
    getFixedColumnsMaxWidth() {
        return this.getFixedColumnsWidth();
    }

    /**
     * @desc delegate setting the cursor up the feature chain of responsibility
     */
    setCursor(grid: Hypergrid) {
        grid.updateCursor();
        this.featureChain.setCursor(grid);
    }

    /**
     * @memberOf Behavior#
     * @desc delegate handling mouse move to the feature chain of responsibility
     * @param event - the event details
     */
    onMouseMove(grid: Hypergrid, event: CellEvent | undefined) {
        if (this.featureChain) {
            this.featureChain.handleMouseMove(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling tap to the feature chain of responsibility
     * @param event - the event details
     */
    onClick(grid: Hypergrid, event: CellEvent) {
        if (this.featureChain) {
            this.featureChain.handleClick(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling tap to the feature chain of responsibility
     */
    onContextMenu(grid: Hypergrid, event: CellEvent) {
        if (this.featureChain) {
            this.featureChain.handleContextMenu(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling wheel moved to the feature chain of responsibility
     */
    onWheelMoved(grid: Hypergrid, event: CellEvent) {
        if (this.featureChain) {
            this.featureChain.handleWheelMoved(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling mouse up to the feature chain of responsibility
     * @param event - the event details
     */
    onMouseUp(grid: Hypergrid, event: CellEvent) {
        if (this.featureChain) {
            this.featureChain.handleMouseUp(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling mouse drag to the feature chain of responsibility
     */
    onMouseDrag(grid: Hypergrid, event: CellEvent) {
        if (this.featureChain) {
            this.featureChain.handleMouseDrag(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling key down to the feature chain of responsibility
     * @param event - the event details
     */
    onKeyDown(grid: Hypergrid, event: Canvas.KeyboardSyntheticEvent) {
        if (this.featureChain) {
            this.featureChain.handleKeyDown(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling key up to the feature chain of responsibility
     * @param event - the event details
     */
    onKeyUp(grid: Hypergrid, event: Canvas.KeyboardSyntheticEvent) {
        if (this.featureChain) {
            this.featureChain.handleKeyUp(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling double click to the feature chain of responsibility
     * @param event - the event details
     */
    onDoubleClick(grid: Hypergrid, event: CellEvent) {
        if (this.featureChain) {
            this.featureChain.handleDoubleClick(grid, event);
            this.setCursor(grid);
        }
    }
    /**
     * @memberOf Behavior#
     * @desc delegate handling mouse down to the feature chain of responsibility
     * @param event - the event details
     */
    handleMouseDown(grid: Hypergrid, event: CellEvent) {
        if (this.featureChain) {
            this.featureChain.handleMouseDown(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc delegate handling mouse exit to the feature chain of responsibility
     */
    handleMouseExit(grid: Hypergrid, event: CellEvent) {
        if (this.featureChain) {
            this.featureChain.handleMouseExit(grid, event);
            this.setCursor(grid);
        }
    }

    /**
     * @desc Delegate handling touchstart to the feature chain of responsibility.
     */
    onTouchStart(grid: Hypergrid, event: Canvas.TouchSyntheticEvent) {
        if (this.featureChain) {
            this.featureChain.handleTouchStart(grid, event);
        }
    }

    /**
     * @desc Delegate handling touchmove to the feature chain of responsibility.
     */
    onTouchMove(grid: Hypergrid, event: Canvas.TouchSyntheticEvent) {
        if (this.featureChain) {
            this.featureChain.handleTouchMove(grid, event);
        }
    }

    /**
     * @desc Delegate handling touchend to the feature chain of responsibility.
     */
    onTouchEnd(grid: Hypergrid, event: Canvas.TouchSyntheticEvent) {
        if (this.featureChain) {
            this.featureChain.handleTouchEnd(grid, event);
        }
    }

    /**
     * @memberOf Behavior#
     * @desc I've been notified that the behavior has changed.
     */
    changed() { this.grid.behaviorChanged(); }

    /**
     * @memberOf Behavior#
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    shapeChanged() { this.grid.behaviorShapeChanged(); }

    /**
     * @memberOf Behavior#
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    stateChanged() { this.grid.behaviorStateChanged(); }

    /**
     * @param x - Data x coordinate.
     * @return The properties for a specific column.
     */
    getColumnProperties(x: number): ColumnProperties | undefined {
        const column = (x !== this.treeColumnIndex || this.hasTreeColumn()) && this.getColumn(x);
        return column?.properties;
    }

    /**
     * @param x - Data x coordinate.
     * @return The properties for a specific column.
     * @memberOf Behavior#
     */
    setColumnProperties(x: number, properties): ColumnProperties {
        const column = this.getColumn(x);
        if (column === undefined) {
            throw 'Expected column.';
        }
        const result = Object.assign(column.properties, properties);
        this.changed();
        return result;
    }

    /**
     * Clears all cell properties of given column or of all columns.
     * @param {number} [x] - Omit for all columns.
     * @memberOf Behavior#
     */
    clearAllCellProperties(x?: number) {
        let X: number;

        if (x === undefined) {
            x = 0;
            X = this.columns.length;
        } else {
            X = x + 1;
        }

        while (x < X) {
            const column = this.getColumn(x);
            if (column) {
                column.clearAllCellProperties();
            }
            x++
        }
    }

    /**
     * @memberOf Behavior#
     * @return {any[]} All the currently hidden column header labels.
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
     * @memberOf Behavior#
     * @return {number} The number of fixed columns.
     */
    getFixedColumnCount() {
        return this.grid.properties.fixedColumnCount;
    }

    /**
     * @memberOf Behavior#
     * @desc set the number of fixed columns
     * @param {number} n - the integer count of how many columns to be fixed
     */
    setFixedColumnCount(n) {
        this.grid.properties.fixedColumnCount = n;
    }

    /**
     * @summary The number of "fixed rows."
     * @desc The number of (non-scrollable) rows preceding the (scrollable) data subgrid.
     * @memberOf Behavior#
     * @return {number} The sum of:
     * 1. All rows of all subgrids preceding the data subgrid.
     * 2. The first `fixedRowCount` rows of the data subgrid.
     */
    getFixedRowCount() {
        return (
            this.getHeaderRowCount() +
            this.grid.properties.fixedRowCount
        );
    }

    /**
     * @memberOf Behavior#
     * @desc Set the number of fixed rows, which includes (top to bottom order):
     * 1. The header rows
     *    1. The header labels row (optional)
     *    2. The filter row (optional)
     *    3. The top total rows (0 or more)
     * 2. The non-scrolling rows (externally called "the fixed rows")
     *
     * @returns {void} Sum of the above or 0 if none of the above are in use.
     *
     * @param {number} The number of rows.
     */
    setFixedRowCount(n) {
        this.grid.properties.fixedRowCount = n;
    }

    /**
     * @memberOf Behavior#
     * @desc a dnd column has just been dropped, we've been notified
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    endDragColumnNotification() {

    }

    /**
     * @memberOf Behavior#
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
     * @memberOf Behavior#
     * @return {number} The total number of columns.
     */
    getActiveColumnCount() {
        return this.columns.length;
    }

    /**
     * @summary Column alignment of given grid column.
     * @desc One of:
     * * `'left'`
     * * `'center'`
     * * `'right'`
     *
     * Cascades to grid.
     * @memberOf Behavior#
     * @desc Quietly set the horizontal scroll position.
     * @param {number} x - The new position in pixels.
     */
    setScrollPositionX(x) {
        /**
         * @memberOf Behavior#
         * @type {number}
         */
        this.scrollPositionX = x;
    }

    getScrollPositionX() {
        return this.scrollPositionX;
    }

    /**
     * @memberOf Behavior#
     * @desc Quietly set the vertical scroll position.
     * @param {number} y - The new position in pixels.
     */
    setScrollPositionY(y) {
        /**
         * @memberOf Behavior#
         * @type {number}
         */
        this.scrollPositionY = y;
    }

    getScrollPositionY() {
        return this.scrollPositionY;
    }

    /**
     * @memberOf Behavior#
     * @return The cell editor for the cell at the given coordinates.
     * @param editPoint - The grid cell coordinates.
     */
    getCellEditorAt(event: CellEvent) {
        return event.isDataColumn && event.column.getCellEditorAt(event);
    }

    /**
     * @memberOf Behavior#
     * @return {boolean} `true` if we should highlight on hover
     * @param {boolean} isColumnHovered - the column is hovered or not
     * @param {boolean} isRowHovered - the row is hovered or not
     */
    highlightCellOnHover(isColumnHovered, isRowHovered) {
        return isColumnHovered && isRowHovered;
    }

    /**
     * @memberOf Behavior#
     * @desc this function is a hook and is called just before the painting of a cell occurs
     * @param {Point} cell
     */
    set cellPropertiesPrePaintNotification(cell: Point) {
        throw new HypergridError('cellPropertiesPrePaintNotification has been deprecated as of v3.0.0. Code to inspect or mutate the render config object should be moved to the getCell hook.');
    }

    /**
     * @desc swap source and target columns
     * @param source - column index
     * @param target - column index
     */
    swapColumns(source: number, target: number) {
        const columns = this.columns;
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

    getRowHeaderColumn() {
        return this.allColumns[this.rowColumnIndex];
    }

    getTreeColumn() {
        return this.allColumns[this.treeColumnIndex];
    }

    autosizeAllColumns() {
        this.checkColumnAutosizing(true);
        this.changed();
    }

    checkColumnAutosizing(force?: boolean) {
        let autoSized = this.autoSizeRowNumberColumn(force) || this.autoSizeTreeColumn(force);

        this.allColumns.findWithNeg(function(column) {
            autoSized = column.checkColumnAutosizing(force) || autoSized;
        });

        return autoSized;
    }

    autoSizeRowNumberColumn(force?: boolean) {
        if (this.grid.properties.showRowNumbers && this.grid.properties.rowNumberAutosizing) {
            return this.getRowHeaderColumn().checkColumnAutosizing(force);
        } else {
            return false;
        }
    }

    autoSizeTreeColumn(force?: boolean) {
        if (this.grid.properties.showTreeColumn && this.grid.properties.treeColumnAutosizing) {
            return this.getTreeColumn().checkColumnAutosizing(force);
        } else {
            return false;
        }
    }

    getColumns() {
        return this.allColumns;
    }

    getActiveColumns() {
        return this.columns;
    }

    getHiddenColumns() {
        const visible = this.columns;
        const all = this.allColumns;
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

        const subgrids = this._subgrids;
        subgridSpecs.forEach(
            (spec) => {
                if (spec !== undefined) {
                    subgrids.push(this.createSubgridFromSpec(spec));
                }
            }
        );

        this.shapeChanged();
    }

    get subgrids() {
        return this._subgrids;
    }

    /**
     * @summary Resolves a `subgridSpec` to a Subgrid (and its DataModel).
     * @desc The spec may describe either an existing data model, or a constructor for a new data model.
     * @param {subgridSpec} spec
     * @returns A data model.
     * @memberOf Behavior#
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
                    subgrid = this.createSubgrid(spec.dataModel, spec.role ?? Subgrid.RoleEnum.main); // Spec is a DataModel
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
            dataModel,
            role,
            this.grid,
            undefined, // fix up when Grid can supply hooks
            this.handleDataModelEventDispatch,
            this.handleFinHypergridDataLoaded,
            this.handleFinHypergridDataPostreindex,
            this.handleFinHypergridDataPrereindex,
            this.handleFinHypergridDataShapeChanged,
            this.handleFinHypergridSchemaLoaded,
        );

        return subgrid;
    }

    /**
     * @summary Gets the number of "header rows".
     * @desc Defined as the sum of all rows in all subgrids before the (first) data subgrid.
     * @memberOf Local.prototype
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
     * @desc Defined as the sum of all rows in all subgrids after the (last) data subgrid.
     * @memberOf Local.prototype
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
     * @memberOf Local.prototype
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
     * @memberOf Behavior#
     * @return The height in pixels of the fixed rows area of the hypergrid, the total height of:
     * 1. All rows of all subgrids preceding the data subgrid.
     * 2. The first `fixedRowCount` rows of the data subgrid.
     */
    getFixedRowsHeight() {
        const subgrids = this.subgrids;
        const gridProps = this.grid.properties;
        const contentBox = gridProps.boxSizing !== 'border-box';
        const gridLinesHWidth = gridProps.gridLinesHWidth;
        let isData = false;
        let height = 0;

        for (let i = 0; i < subgrids.length && !isData; ++i) {
            const subgrid = subgrids[i];
            isData = subgrid.isData;
            const R = isData ? gridProps.fixedRowCount : subgrid.dataModel.getRowCount();
            for (let r = 0; r < R; ++r) {
                height += this.getRowHeight(r, subgrid);
                if (contentBox) {
                    height += gridLinesHWidth;
                }
            }
            // add in fixed rule thickness excess
            if (isData && gridProps.fixedLinesHWidth) {
                height += gridProps.fixedLinesHWidth - gridLinesHWidth;
            }
        }

        return height;
    }

    /**
     * @memberOf Behavior#
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
            metadata.__ROW = Object.create(this.rowPropertiesPrototype);
            this.addRowProperties(y, properties, subgrid, metadata.__ROW);
            this.stateChanged();
        }
    }

    /**
     * Sets a single row property on a specific individual row.
     * @memberOf Behavior#
     * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param key - The property name.
     * @param value - The new property value.
     * @param dataModel - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */

    setRowPropertyUsingCellEvent(cellEvent: CellEvent, key: string, value: unknown) {
        this.setRowProperty(cellEvent.dataCell.y, key, value, cellEvent.subgrid);
    }

    setRowProperty(y: number, key: string, value: unknown, subgrid: Subgrid) {
        let rowProps: DataModel.RowProperties | false | undefined;
        const isHeight = (key === 'height');

        if (value !== undefined) {
            rowProps = this.getRowProperties(y, this.rowPropertiesPrototype, subgrid);
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

    /**
     * Add all the properties in the given row properties object to the row properties.
     * @memberOf Behavior#
     * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param properties - An object containing new property values(s) to assign to the row properties. If `undefined`, this call is a no-op.
     * @param {DataModel} [dataModel=this.dataModel] - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */

    addRowPropertiesUsingCellEvent(cellEvent: CellEvent, properties: DataModel.RowProperties | undefined, rowProps?: DataModel.RowProperties) {
        this.addRowProperties(cellEvent.dataCell.y, properties, cellEvent.subgrid, rowProps);
    }

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
            resolvedRowProps = this.getRowProperties(y, this.rowPropertiesPrototype, subgrid);
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
    getRowHeight(y: number, subgrid: Subgrid) {
        const rowProps = this.getRowProperties(y, undefined, subgrid);
        return rowProps && rowProps.height || this.grid.properties.defaultRowHeight;
    }

    /**
     * @desc set the pixel height of a specific row
     * @param yOrCellEvent - Data row index local to dataModel.
     * @param height - pixel height
     */
    setRowHeight(yOrCellEvent: number, height: number, subgrid: Subgrid) {
        this.setRowProperty(yOrCellEvent, 'height', height, subgrid);
    }
    // End RowProperties Mixin

    // Start GridCellProperties Mixin
    /**
     * @summary Get the cell's own properties object.
     * @desc May be undefined because cells only have their own properties object when at lest one own property has been set.
     * @param xOrCellEvent - Data x coordinate or cell event.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @returns {undefined|object} The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `undefined`.
     * @memberOf Behavior#
     */
    getCellOwnProperties(xOrCellEvent: number | CellEvent, y?: number, subgrid?: Subgrid) {
        if (typeof xOrCellEvent === 'object') {
            // xOrCellEvent is cellEvent
            return xOrCellEvent.column.getCellOwnProperties(xOrCellEvent.dataCell.y, xOrCellEvent.subgrid);
        } else {
            // xOrCellEvent is x
            return this.getColumn(xOrCellEvent).getCellOwnProperties(y, subgrid);
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

    getCellProperties(x: number, y: number, subgrid: Subgrid): DataModel.CellOwnProperties {
        return this.getColumn(x).getCellProperties(y, subgrid);
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
    getCellProperty(x: number, y: number, key: string, subgrid: Subgrid): DataModel.CellOwnProperty {
        return this.getColumn(x).getCellProperty(y, key, subgrid);
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
    setCellProperties(x: number, y: number, properties: DataModel.CellOwnProperties, subgrid: Subgrid): DataModel.CellOwnProperties {
        return this.getColumn(x).setCellProperties(y, properties, subgrid);
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
    addCellProperties(x: number, y: number, properties: DataModel.CellOwnProperties, subgrid?: Subgrid): DataModel.CellOwnProperties {
        return this.getColumn(x).addCellProperties(y, properties, subgrid);
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
    setCellProperty(x: number, y: number, key: string | number, value: DataModel.CellOwnProperty, subgrid: Subgrid): DataModel.CellOwnProperties;
    setCellProperty(
        xOrCellEvent: CellEvent | number,
        yOrKey: string | number,
        keyOrValue: string | number | DataModel.CellOwnProperty,
        valueOrDataModel?: DataModel.CellOwnProperty | DataModel,
        subgrid?: Subgrid
    ): DataModel.CellOwnProperties {
        let cellOwnProperties: DataModel.CellOwnProperties;
        if (typeof xOrCellEvent === 'object') {
            const key = yOrKey as string;
            const value = keyOrValue;
            cellOwnProperties = xOrCellEvent.setCellProperty(key, value);
        } else {
            const y = yOrKey as number;
            const key = keyOrValue as string;
            const value = valueOrDataModel;
            cellOwnProperties = this.getColumn(xOrCellEvent).setCellProperty(y, key, value, subgrid);
            this.grid.renderer.resetCellPropertiesCache(xOrCellEvent, y, subgrid);
        }
        return cellOwnProperties;
    }
    // End GridCellProperties Mixin

    // Start DataModel Mixin
    getSchema() {
        return this.mainDataModel.getSchema();
    }

    setSchema(newSchema) {
        this.mainDataModel.setSchema(newSchema);
    }

    /**
     * @summary Gets the number of rows in the data subgrid.
     * {@link https://fin-hypergrid.github.io/doc/DataModel.html#getRowCount|getRowCount}
     * @memberOf Behavior#
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
    getValue(x: number, y: number, subgrid?: Subgrid) {
        if (subgrid !== undefined) {
            return subgrid.dataModel.getValue(x, y);
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
    setValue(x: number, y: number, value: unknown, subgrid?: Subgrid) {
        if (subgrid !== undefined) {
            subgrid.dataModel.setValue(x, y, value);
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
     * @memberOf Behavior#
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
     * @memberOf Behavior#
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
    private resetMainDataModel(options?: Hypergrid.Options) {
        const newDataModel = this.getNewMainDataModel(options);
        const changed = newDataModel !== undefined && newDataModel !== this.mainDataModel;

        if (changed) {
            this.mainDataModel = newDataModel;
            this.mainSubgrid = this.createSubgrid(newDataModel, Subgrid.RoleEnum.main);
            // decorators.addDeprecationWarnings.call(this);
            // decorators.addFriendlierDrillDownMapKeys.call(this);
            this.checkLoadDataModelMetadata(newDataModel, options?.metadata);
        }

        return changed;
    }

    private checkLoadDataModelMetadata(dataModel: DataModel, metadata?: DataModel.RowMetadata[] | undefined) {
        if (metadata !== undefined) {
            if (dataModel.setMetadataStore) {
                dataModel.setMetadataStore(metadata);
            } else {
                throw new Error('Metadata specified in options but no DataModel does not support setMetadataStore');
            }
        }
    }

    /**
     * Create a new data model
     * @param options.dataModel - A fully instantiated data model object.
     */
    private getNewMainDataModel(options?: Hypergrid.Options) {
        let dataModel: DataModel;

        options = options ?? {};

        if (options.dataModel !== undefined) {
            dataModel = options.dataModel;
        } else {
            const dataModelConstructorOrArray = options.dataModelConstructorOrArray;
            if (dataModelConstructorOrArray !== undefined) {
                dataModel = this.createLocalDataModel(Subgrid.RoleEnum.main);
                this.checkLoadDataModelMetadata(dataModel);
            } else {
                if (!Array.isArray(dataModelConstructorOrArray)) {
                    dataModel = new dataModelConstructorOrArray();
                } else {
                    if (dataModelConstructorOrArray.length === 0) {
                        dataModel = new LocalMainDataModel();
                    } else {
                        dataModelConstructorOrArray.forEach((constructor) => {
                            dataModel = new constructor(dataModel);
                        });
                    }
                }
            }
        }

        return dataModel;
    }

    private createLocalDataModel(role: Subgrid.Role) {
        switch (role) {
            case Subgrid.RoleEnum.main: return new LocalMainDataModel();
            case Subgrid.RoleEnum.header: return new LocalHeaderDataModel(this.grid);
            default:
                throw new Error('Unsupported role for local DataModel: ' + role);
        }
    }

    private handleDataModelEventDispatch(eventName: DataModel.EventName, event: DataModel.Event) {
        return dispatchGridEvent(this.grid, eventName, false, event);
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
     * {@link DataModel#event:fin-hypergrid-schema-loaded}
     */
    private handleFinHypergridSchemaLoaded(): boolean | undefined {
        this.grid.behavior.createColumns();
        return undefined;
    }

    /**
     * _See the data model API page for event semantics (link below)._
     * @returns Result of re-emitted event or `undefined` if event not re-emitted.
     * {@link DataModel#event:fin-hypergrid-data-loaded}
     */
    private handleFinHypergridDataLoaded(): boolean | undefined {
        this.grid.repaint();
        return undefined;
    }

    /**
     * _See the data model API page for event semantics (link below)._
     * @returns Result of re-emitted event or `undefined` if event not re-emitted.
     * {@link DataModel#event:fin-hypergrid-data-shape-changed}
     */
    private handleFinHypergridDataShapeChanged(): boolean | undefined {
        this.grid.behaviorShapeChanged();
        return undefined;
    }

    /**
     * _See the data model API page for event semantics (link below)._
     * @returns Result of re-emitted event or `undefined` if event not re-emitted.
     * {@link DataModel#event:fin-hypergrid-data-prereindex}
     */
    private handleFinHypergridDataPrereindex(): boolean | undefined {
        this.grid.stashRowSelections();
        this.grid.stashColumnSelections();
        return undefined;
    }

    /**
     * _See the data model API page for event semantics (link below)._
     * @returns Result of re-emitted event or `undefined` if event not re-emitted.
     * {@link DataModel#event:fin-hypergrid-data-postreindex}
     */
    private handleFinHypergridDataPostreindex(): boolean | undefined {
        const grid = this.grid;
        grid.selectionModel.reset();
        grid.unstashRowSelections();
        grid.unstashColumnSelections();
        grid.behaviorShapeChanged();
        return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hasTreeColumn(columnIndex?: number) {
        const isTreeFunction = this.mainDataModel.isTree;
        return isTreeFunction !== undefined && isTreeFunction() && this.grid.properties.showTreeColumn;
    }

    cellClicked(event: CellEvent) {
        const toggleRow = this.mainDataModel.toggleRow;
        if (toggleRow === undefined) {
            return undefined;
        } else {
            return this.mainDataModel.toggleRow(event.dataCell.y, event.dataCell.x);
        }
    }

    get charMap() {
        return this.mainDataModel.drillDownCharMap;
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


// synonyms

/**
 * Synonym of {@link Behavior#reindex}.
 * @name applyAnalytics
 * @deprecated
 * @memberOf Behavior#
 */
// Behavior.prototype.applyAnalytics = Behavior.prototype.reindex;


export namespace Behavior {
    export class ColumnArray extends Renderer.NegArray<Column> {

    }
}

// Begin RowProperties Mixin

export class DefaultRowProperties implements DataModel.RowProperties {
    private _height: number | undefined;

    constructor(private grid: Hypergrid) {

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
