import { Behavior } from '../behaviors/behavior';
import { Column } from '../behaviors/column';
import { ColumnProperties } from '../behaviors/column-properties';
import { Subgrid } from '../behaviors/subgrid';
import { CellEditor } from '../cell-editor/cell-editor';
import { cellEditorFactory } from '../cell-editor/cell-editor-factory';
import { ButtonCellPainter } from '../cell-painter/button-cell-painter';
import { cellPainterRepository } from '../cell-painter/cell-painter-repository';
import { FinBar } from '../dependencies/finbar';
import { Point, WritablePoint } from '../dependencies/point';
import { Rectangle, RectangleInterface } from '../dependencies/rectangular';
import { ColumnSorting } from '../feature/column-sorting';
import { Canvas } from '../lib/canvas';
import { CellEvent } from '../lib/cell-event';
import { DataModel } from '../lib/data-model';
import { dispatchGridEvent } from '../lib/dispatch-grid-event';
import { DateFormatter, Localization, NumberFormatter } from '../lib/localization';
import { SelectionDetailAccessor } from '../lib/selection-detail-accessor';
import { SelectionModel } from '../lib/selection-model';
import { SelectionRectangle } from '../lib/selection-rectangle';
import { Renderer } from '../renderer/renderer';
import { HypergridProperties } from './hypergrid-properties';
import { HypergridPropertiesAccessor } from './hypergrid-properties-accessor';

/** @public */
export class Hypergrid {
    options: Hypergrid.Options;
    readonly rawProperties: HypergridProperties;
    readonly properties: HypergridPropertiesAccessor;
    canvas: Canvas;
    allowEventHandlers = true;
    numRows = 0;
    numColumns = 0;
    renderer: Renderer;

    localization: Localization;

    containerHtmlElement: HTMLElement;
    canvasDiv: HTMLDivElement;

    needsReindex = false;
    needsShapeChanged = false;
    needsStateChanged = false;

    mouseDownState: CellEvent;
    dragging = false;
    columnDragAutoScrolling: boolean; // I dont think this does anything

    selectedDataRowIndexes: number[];
    selectedColumnNames: string[];

    cellPainterRepository = cellPainterRepository;
    cellEditorFactory = cellEditorFactory;

    // Begin Events mixin
    eventlistenerInfos = new Map<string, Hypergrid.ListenerInfo[]>();
    // End Events mixin

    // Begin Selection mixin
    get rows() { return this.getSelectedRows(); }
    get columns() { return this.getSelectedColumns(); }
    get selections() { return this.selectionModel.getSelections(); }
    // End Selection mixin

    // Begin Themes mixin
    //_theme: Theme;
    // End Themes mixin

    // Begin Scrolling mixin
    /**
     * A float value between 0.0 - 1.0 of the vertical scroll position.
     */
    vScrollValue = 0;

    /**
     * A float value between 0.0 - 1.0 of the horizontal scroll position.
     */
    hScrollValue = 0;

    /**
     * The verticl scroll bar model/controller.
     * @memberOf Hypergrid#
     */
    sbVScroller: FinBar = null;

    /**
     * The horizontal scroll bar model/controller.
     * @memberOf Hypergrid#
     */
    sbHScroller: FinBar = null;

    /**
     * The previous value of sbVScrollVal.
     * @type {number}
     * @memberOf Hypergrid#
     */
    sbPrevVScrollValue: number = null;

    /**
     * The previous value of sbHScrollValue.
     * @type {number}
     * @memberOf Hypergrid#
     */
    sbPrevHScrollValue: number = null;

    scrollingNow = false;
    // End Scrolling mixin

    private mouseCatcher = () => this.abortEditing();

/**
 * @mixes scrolling.mixin
 * @mixes events.mixin
 * @mixes selection.mixin
 * @mixes themes.mixin
 * @mixes themes.sharedMixin
 * @constructor
 * @classdesc An object representing a Hypergrid.
 * @desc The first parameter, `container`, is optional. If omitted, the `options` parameter is promoted to first position. (Note that the container can also be given in `options.container.`)
 * @param {string|Element} [container] - CSS selector or Element. If omitted (and `options.container` also omitted), Hypergrid first looks for an _empty_ element with an ID of `hypergrid`. If not found, it will create a new element. In either case, the container element has the class name `hypergrid-container` added to its class name list. Finally, if the there is more than one such element with that class name, the element's ID attribute is set to `hypergrid` + _n_ where n is an ordinal one less than the number of such elements.
 * @param {object} [options] - If `options.data` provided, passed to {@link Hypergrid#setData setData}; else if `options.Behavior` provided, passed to {@link Hypergrid#setBehavior setBehavior}.
 * @param {function} [options.Behavior=Local] - _Per {@link Behavior#setData}._
 * @param {DataModel} [options.dataModel] - _Passed to behavior {@link Behavior constructor}._
 * @param {function} [options.DataModel=require('datasaur-local')] - _Passed to behavior {@link Behavior constructor}._
 * @param {function|object[]} [options.data] - _Passed to behavior {@link Behavior constructor}._
 * @param {function|menuItem[]} [options.schema] - _Passed to behavior {@link Behavior constructor}._
 * @param {object} [options.metadata] - _Passed to behavior {@link Behavior constructor}._
 * @param {subgridSpec[]} [options.subgrids=this.properties.subgrids] - _Per {@link Behavior#setData}._
 * @param {pluginSpec|pluginSpec[]} [options.plugins]
 * @param {object} [options.state]
 *
 * @param {string|Element} [options.container] - Alternative to providing `container` (first) parameter above.
 *
 * @param {object} [options.contextAttributes={ alpha: true }] - Passed to [`HTMLCanvasElement.getContext`](https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement/getContext). Although the MDN docs say setting this to `{alpha: false}` (opaque canvas) can "can speed up drawing of transparent content and images," our testing (with Chrome v63) failed to show any measurable performance gain.
 *
 * _An opaque canvas does have an important advantage, however!_ It permits the graphics context to use [sub-pixel rendering](https://en.wikipedia.org/wiki/Subpixel_rendering) for sharper text as viewed on LCD or LED screens, especially black text on white backgrounds, and especially when viewed on a high-pixel-density display such as an [Apple retina display](https://en.wikipedia.org/wiki/Retina_Display).
 *
 * Zoom in on the following samples images to see the difference in rendering.
 *
 * Value | Sample
 * :---: | :----:
 * `{ alpha: true }`<br>Transparent canvas,<br>renders text using<br>_regular anti-aliasing_ | ![regular.png](https://cdn-pro.dprcdn.net/files/acc_645730/ZqurK3)
 * `{ alpha: false }`<br>Opaque canvas,<br>renders text using<br>_sub-pixel rendering_ | ![sub-pixel.png](https://cdn-std.dprcdn.net/files/acc_645730/bf3VXh).
 *
 * Use with caution, however. In particular, if the canvas is set to "opaque" (`{alpha: false}`), do _not_ also specify a transparent or translucent color for `grid.properties.backGround` because content may then be drawn with corrupt anti-aliasing (at lest as of Chrome v67).
 *
 * To clarify, the default setting (`{ alpha: true }`) is a transparent canvas, meaning that elements rendered underneath the `<canvas>` element can be seen through any non-opaque pixels (pixels with alpha channel < 1.0). Hypergrids that set their background color to non-opaque can see this effect.
 *
 * Note: An opaque canvas can still be made _to appear_ translucent using the CSS `opacity` property. But that is a different effect entirely, setting the entire rendered canvas to translucent, not just so all pixels become translucent.
 * @param {string} [options.localization=Hypergrid.localization]
 * @param {string|string[]} [options.localization.locale=Hypergrid.localization.locale] - The default locale to use when an explicit `locale` is omitted from localizer constructor calls. Passed to `Intl.NumberFomrat` and `Intl.DateFomrat`. See {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation|Locale identification and negotiation} for more information.
 * @param {string} [options.localization.numberOptions=Hypergrid.localization.numberOptions] - Options passed to [`Intl.NumberFormat`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat) for creating the basic "number" localizer.
 * @param {string} [options.localization.dateOptions=Hypergrid.localization.dateOptions] - Options passed to [`Intl.DateTimeFormat`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat) for creating the basic "date" localizer.
 *
 * @param {object} [options.margin] - Optional canvas "margins" applied to containing div as .left, .top, .right, .bottom. (Default values actually derive from 'grid' stylesheet's `.hypergrid-container` rule.)
 * @param {string} [options.margin.top='0px']
 * @param {string} [options.margin.right='0px']
 * @param {string} [options.margin.bottom='0px']
 * @param {string} [options.margin.left='0px']
 *
 * @param {object} [options.boundingRect] - Optional grid container size & position. (Default values actually derive from 'grid' stylesheet's `.hypergrid-container > div:first-child` rule.)
 * @param {string} [options.boundingRect.height='500px']
 * @param {string} [options.boundingRect.width='auto']
 * @param {string} [options.boundingRect.left='auto']
 * @param {string} [options.boundingRect.top='auto']
 * @param {string} [options.boundingRect.right='auto']
 * @param {string} [options.boundingRect.bottom='auto']
 * @param {string} [options.boundingRect.position='relative']
 *
 */
    constructor(options?: Hypergrid.Options);
    constructor(container: string | HTMLElement, options?: Hypergrid.Options);
    constructor(containerOrOptions: string | HTMLElement | Hypergrid.Options, options?: Hypergrid.Options) {
        //Optional container argument
        let container: string | HTMLElement;
        if ((typeof containerOrOptions === 'string') || (containerOrOptions instanceof HTMLElement)) {
            container = containerOrOptions;
        } else {
            container = null;
            options = containerOrOptions;
        }

        options = options ?? {};

        this.rawProperties = {} as HypergridProperties;
        this.properties = new HypergridPropertiesAccessor(this);
        this.clearState();

        //Set up the container for a grid instance
        this.setContainer(
            container ??
            options.container ??
            this.findOrCreateContainer(options.boundingRect)
        );

        // Install shared plug-ins (those with a `preinstall` method)
        // Hypergrid.prototype.installPlugins(options.plugins);

        this.lastEdgeSelection = [0, 0];
        this.isWebkit = navigator.userAgent.toLowerCase().indexOf('webkit') > -1;
        this.selectionModel = new SelectionModel(this);
        this.clearMouseDown();
        this.setFormatter(options.localization);

        this.initCanvas(options);

        if (options.data) {
            this.setData(options.data, options); // if no behavior has yet been set, `setData` sets a default behavior
        } else {
            if (options.behaviorConstructor || options.dataModel || options.dataModelConstructorOrArray) {
                this.setBehavior(options); // also sets options.data
            }
        }

        if (options.state) {
            this.loadState(options.state);
        }

        // /**
        //  * @name plugins
        //  * @summary Dictionary of named instance plug-ins.
        //  * @desc See examples for how to reference (albeit there is normally no need to reference plugins directly).
        //  *
        //  * For the dictionary of _shared_ plugins, see {@link Hypergrid.plugins|plugins} (a property of the constructor).
        //  * @example
        //  * var instancePlugins = myGrid.plugins;
        //  * var instancePlugins = this.plugins; // internal use
        //  * var myInstancePlugin = myGrid.plugins.myInstancePlugin;
        //  * @type {object}
        //  * @memberOf Hypergrid#
        //  */
        // // this.plugins = {};

        // // Install instance plug-ins (those that are constructors OR have an `install` method)
        // this.installPlugins(options.plugins);

        // Listen for propagated mouseclicks. Used for aborting edit mode.
        document.addEventListener('mousedown',  this.mouseCatcher);

        setTimeout(() => this.repaint());

        Hypergrid.grids.push(this);

        this.resetGridBorder('Top');
        this.resetGridBorder('Right');
        this.resetGridBorder('Bottom');
        this.resetGridBorder('Left');
    }

    /**
     * Be a responsible citizen and call this function on instance disposal!
     * @memberOf Hypergrid#
     */
    terminate() {
        document.removeEventListener('mousedown', this.mouseCatcher);
        this.behavior.dispose();
        this.removeAllEventListeners(true);
        this.canvas.stop();

        const div = this.containerHtmlElement;
        while (div.hasChildNodes()) { div.removeChild(div.firstChild); }

        Hypergrid.grids.splice(Hypergrid.grids.indexOf(this), 1);

        delete this.containerHtmlElement;
        delete this.canvas.div;
        delete this.canvas.canvas;
        delete this.sbVScroller;
        delete this.sbHScroller;
    }

    resetGridBorder(edge?: string) {
        edge = edge ?? '';

        const propName = 'gridBorder' + edge;
        const styleName = 'border' + edge;
        const props = this.properties;
        const border = props[propName];

        let styleValue: string;

        switch (border) {
            case true:
                styleValue = props.lineWidth + 'px solid ' + props.lineColor;
                break;
            case false:
                styleValue = null;
                break;
        }
        this.canvas.canvas.style[styleName] = styleValue;
    }

    /**
     * A null object behavior serves as a place holder.
     */
    behavior: Behavior | null;

    /**
     * Cached result of webkit test.
     */
    isWebkit = true;

    /**
     * We do not support IE 11; we do NOT support older versions of IE.
     * (We do NOT officially support Edge.)
     * @see https://stackoverflow.com/questions/21825157/internet-explorer-11-detection#answer-21825207
     */
    // isIE11: !!(globalThis.MSInputMethodContext && document.documentMode);

    /**
     * The pixel location of an initial mousedown click, either for editing a cell or for dragging a selection.
     */
    mouseDown = new Array<Point>(); // [];

    /**
     * The extent from the mousedown point during a drag operation.
     */
    dragExtent: Point | null;

    /**
     * The instance of the grid's selection model.
     * May or may not contain any cell, row, and/or column selections.
     */
    selectionModel: SelectionModel | null;

    /**
     * The instance of the currently active cell editor.
     * Will be `null` when not editing.
     */
    cellEditor: CellEditor | null;

    /**
     * Non-`null` members represent additional things to render, after rendering the grid, such as the column being dragged.
     */
    renderOverridesCache = Hypergrid.RenderOverridesCache.empty; // : {};

    /**
     * The pixel location of the current hovered cell.
     * @todo Need to detect hovering over bottom totals.
     */
    hoverCell: CellEvent | undefined;
    hoverGridCell: Point | undefined;

    lastEdgeSelection: [x: number, y: number] = [0, 0]; // 1st element is x, 2nd element is y

    setAttribute(attribute: string, value: string) {
        this.containerHtmlElement.setAttribute(attribute, value);
    }

    removeAttribute(attribute: string) {
        this.containerHtmlElement.removeAttribute(attribute);
    }

    clearState() {
        /**
         * @name properties
         * @type {object}
         * @summary Object containing the properties of the grid.
         * @desc Grid properties objects have the following structure:
         * 1. User-configured properties and dynamic properties are in the "own" layer.
         * 2. Extends from the theme object.
         * 3. The theme object in turn extends from the {@link module:defaults|defaults} object.
         *
         * Note: Any changes the application developer may wish to make to the {@link module:defaults|defaults}
         * object should be made _before_ reaching this point (_i.e.,_ prior to any grid instantiations).
         */
        this.properties.loadDefaults();

        // Done in constructor
        // For all default props of object type, if a dynamic prop, invoke setter; else deep clone it so changes
        // made to inner props won't go to object on theme or defaults layers which are shared by other instances.
        // Object.keys(defaults).forEach(function(key) {
        //     var value = defaults[key];
        //     if (typeof value === 'object') {
        //         if (dynamicPropertyDescriptors[key]) {
        //             this[key] = value; // invoke dynamic prop setter
        //         } else {
        //             this[key] = deepClone(value); // just a plain object
        //         }
        //     }
        // }, this.properties);
    }

    /**
     * @desc Clear out all state settings, data (rows), and schema (columns) of a grid instance.
     * @param options
     * @param options.subgrids - Consumed by {@link Behavior#reset}.
     * If omitted, previously established subgrids list is reused.
     */
    reset(options?: Hypergrid.Options) {
        this.clearState();

        this.removeAllEventListeners();

        this.lastEdgeSelection = [0, 0];
        this.selectionModel.reset();
        this.renderOverridesCache = Hypergrid.RenderOverridesCache.empty; //{};
        this.clearMouseDown();
        this.dragExtent = Point.create(0, 0);

        this.numRows = 0;
        this.numColumns = 0;

        this.vScrollValue = 0;
        this.hScrollValue = 0;

        this.cancelEditing();

        this.sbPrevVScrollValue = null;
        this.sbPrevHScrollValue = null;

        this.setHoverCell(undefined);
        this.scrollingNow = false;
        this.lastEdgeSelection = [0, 0];

        this.behavior.reset({
            subgrids: options && options.subgrids
        });

        this.renderer.reset();
        this.canvas.resize();
        this.behaviorChanged();

        this.refreshProperties();
    }

    /** @typedef {object|function|Array} pluginSpec
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
     * @memberOf Hypergrid#
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
     * @memberOf Hypergrid#
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

    computeCellsBounds() {
        this.renderer.computeCellsBounds();
    }

    setFormatter(options?: Hypergrid.LocalizationOptions) {
        options = options ?? {};
        this.localization = new Localization(
            options.locale || Hypergrid.defaultLocalizationOptions.locale,
            options.numberOptions || Hypergrid.defaultLocalizationOptions.numberOptions,
            options.dateOptions || Hypergrid.defaultLocalizationOptions.dateOptions
        );
    }

    getFormatter(localizerName: string) {
        return this.localization.get(localizerName).format;
    }

    formatValue(localizerName: string, value: unknown) {
        const formatter = this.getFormatter(localizerName);
        return formatter(value);
    }


    /**
     * @desc Set the cell under the cursor.
     */
    processHoverCell(cellEvent: CellEvent | undefined) {
        const existingHoverCell = this.hoverCell;
        if (cellEvent === undefined) {
            if (existingHoverCell !== undefined) {
                this.setHoverCell(undefined);
                this.fireSyntheticOnCellExitEvent(existingHoverCell);
                this.repaint();
            }
        } else {
            if (existingHoverCell === undefined) {
                this.setHoverCell(cellEvent);
                this.fireSyntheticOnCellEnterEvent(cellEvent);
                this.repaint();
            } else {
                if (!Point.isEqual(existingHoverCell.gridCell, cellEvent.gridCell)) {
                    this.setHoverCell(undefined);
                    this.fireSyntheticOnCellExitEvent(existingHoverCell);
                    this.setHoverCell(cellEvent);
                    this.fireSyntheticOnCellEnterEvent(cellEvent);
                    this.repaint();
                }
            }
        }
    }

    private setHoverCell(cellEvent: CellEvent | undefined) {
        this.hoverCell = cellEvent;
        this.hoverGridCell = cellEvent?.gridCell;
    }

    /**
     * @desc Amend properties for this hypergrid only.
     * @param properties - A simple properties hash.
     */
    addProperties(properties: HypergridProperties) {
        Object.assign(this.properties, properties);
        this.refreshProperties();
    }

    /**
     * @todo deprecate this in favor of making properties dynamic instead (for those that need to be)
     * @desc Utility function to push out properties if we change them.
     */
    refreshProperties() {
        this.behaviorShapeChanged();
        this.behavior.defaultRowHeight = null;
        this.behavior.autosizeAllColumns();
    }

    /**
     * @desc Set the state object to return to the given user configuration; then re-render the grid.
     * @param state - A grid state object.
     * {@link http://en.wikipedia.org/wiki/Memento_pattern|Memento pattern}
     */
    setState(state: HypergridProperties) {
        this.addState(state, true);
    }

    /**
     * @desc Add to the state object; then re-render the grid.
     * @param state - A grid state object.
     * @param settingState - Clear state first (_i.e.,_ perform a set state operation).
     */
    addState(state: Record<string, unknown>, settingState = false) {
        this.behavior.addState(state, settingState);
        this.refreshProperties();
        this.behaviorChanged();
    }

    getState() {
        return this.behavior.getState();
    }

    loadState(state: Record<string, unknown>) {
        this.behavior.setState(state);
    }

    // /**
    //  * @todo Only output values when they differ from defaults (deep compare needed).
    //  * @param {object} [options]
    //  * @param {string[]} [options.blacklist] - List of grid properties to exclude. Pertains to grid own properties only.
    //  * @param {boolean} [options.compact] - Run garbage collection first. The only property this current affects is `properties.calculators` (removes unused calculators).
    //  * @param {number|string} [options.space='\t'] - For no space, give `0`. (See {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Local/stringify|JSON.stringify}'s `space` param other options.)
    //  * @param {function} [options.headerify] - If your headers were generated by a function (taking column name as a parameter), give a reference to that function here to avoid persisting headers that match the generated string.
    //  * @memberOf Hypergrid#
    //  * @this {Hypergrid}
    //  */
    // saveState(options: Hypergrid.Options) {
    //     options = options || {};

    //     const space = options.space === undefined ? '\t' : options.space;
    //     const properties = this.properties;
    //     const calculators = properties.calculators;
    //     const blacklist = options.blacklist = options.blacklist || [];

    //     blacklist.push('columnProperties'); // Never output this synonym of 'columns'

    //     if (calculators) {
    //         if (options.compact) {
    //             var columns = this.behavior.getColumns();
    //             Object.keys(calculators).forEach(function(key) {
    //                 if (!columns.find(function(column) {
    //                         return column.properties.calculator === calculators[key];
    //                     })) {
    //                     delete calculators[key];
    //                 }
    //             });
    //         }
    //         calculators.toJSON = stringifyFunctions;
    //     }

    //     // Temporarily copy the given headerify function for access by columns getter
    //     this.headerify = options.headerify;

    //     var json = JSON.stringify(properties, function(key, value) {
    //         if (this === properties && options.blacklist.indexOf(key) >= 0) {
    //             value = undefined; // JSON.stringify ignores undefined props
    //         } else if (key === 'calculator') {
    //             if (calculators) {
    //                 // convert function reference to registry key
    //                 value = Object.keys(calculators).find(function(key) {
    //                     return calculators[key] === value;
    //                 });
    //             } else {
    //                 // registry may not exist if Column.calculator setter was used directly so just save as is
    //                 value = value.toString();
    //             }
    //         }
    //         return value;
    //     }, space);

    //     // Remove the temporary copy
    //     delete this.headerify;

    //     return json;
    // }

    /**
     * @returns The initial mouse position on a mouse down event for cell editing or a drag operation.
     */
    getMouseDown() {
        if (this.mouseDown.length > 0) {
            return this.mouseDown[this.mouseDown.length - 1];
        } else {
            return undefined;
        }
    }

    /**
     * @desc Remove the last item from the mouse down stack.
     */
    popMouseDown() {
        let result: Point | undefined;
        if (this.mouseDown.length > 0) {
            result = this.mouseDown.pop();
        }
        return result;
    }

    /**
     * @desc Empty out the mouse down stack.
     */
    clearMouseDown() {
        this.mouseDown = [Point.create(-1, -1)];
        this.dragExtent = null;
    }

    /**
     * Set the mouse point that initiated a cell edit or drag operation.
     */
    setMouseDown(point: Point) {
        this.mouseDown.push(point);
    }

    /**
     * @returns The extent point of the current drag selection rectangle.
     */
    getDragExtent() {
        return this.dragExtent;
    }

    /**
     * @summary Set the extent point of the current drag selection operation.
     */
    setDragExtent(point: Point) {
        this.dragExtent = point;
    }

    /**
     * @desc This function is a callback from the HypergridRenderer sub-component. It is called after each paint of the canvas.
     */
    gridRenderedNotification() {
        if (this.cellEditor) {
            this.cellEditor.gridRenderedNotification();
        }

        // Grid render also calculates mix width for each column.
        // Check here to see if there was a change and if so immediately re-render
        // before end-of-thread so user sees only the results of the 2nd render.
        // Mostly important on first render after setData. Note that stack overflow
        // will not happen because this will only be called once per data change.
        if (this.checkColumnAutosizing()) {
            this.paintNow();
        }

        this.fireSyntheticGridRenderedEvent();
    }

    tickNotification() {
        this.fireSyntheticTickEvent();
    }

    /**
     * @desc The grid has just been rendered, make sure the column widths are optimal.
     */
    checkColumnAutosizing() {
        const autoSized = this.behavior.checkColumnAutosizing(false);
        if (autoSized) {
            this.behaviorShapeChanged();
        }
        return autoSized;
    }

    /**
     * @summary Conditionally copy to clipboard.
     * @desc If we have focus, copy our current selection data to the system clipboard.
     * @param event - The copy system event.
     */
    checkClipboardCopy(event: ClipboardEvent) {
        if (this.hasFocus()) {
            event.preventDefault();
            const csvData = this.getSelectionAsTSV();
            event.clipboardData.setData('text/plain', csvData);
        }
    }

    /**
     * @returns We have focus.
     */
    hasFocus() {
        return this.canvas.hasFocus();
    }

    /**
     * @summary Set the Behavior object for this grid control.
     * @desc Called when `options.Behavior` from:
     * * Hypergrid constructor
     * * `setData` when not called explicitly before then
     * @param options - _Per {@link Behavior#setData}._
     * @param options.Behavior - The behavior (model) is a constructor.
     * @param options.dataModel - A fully instantiated data model object.
     * @param options.dataModelConstructor - Data model will be instantiated from this constructor unless `options.dataModel` was given.
     * @param options.metadata - Value to be passed to `setMetadataStore` if the data model has changed.
     * @param options.data - _Per {@link constructor#setData}._
     * @param options.schema - _Per {@link constructor#setData}.
     */
    setBehavior(options: Hypergrid.Options) {
        const constructor = (options?.behaviorConstructor) ?? Behavior;
        this.behavior = new constructor(this, options);
        this.initScrollbars();
        this.refreshProperties();
        this.behavior.reindex();
    }

    /**
     * Number of _visible_ columns.
     * @returns The number of columns.
     */
    getColumnCount() {
        return this.behavior.getActiveColumnCount();
    }

    /**
     * @returns The number of rows.
     */
    getRowCount() {
        return this.behavior.getRowCount();
    }

    getRow(y: number) {
        return this.behavior.getRow(y);
    }

    getValue(x: number, y: number, subgrid?: Subgrid) {
        return this.behavior.getValue(x, y, subgrid);
    }

    /**
     * {@link Behavior#setValue}
     */
    setValue(x: number, y: number, value: number, subgrid?: Subgrid) {
        this.behavior.setValue(x, y, value, subgrid);
    }

    /**
     * @memberOf Hypergrid#
     * @summary Set the underlying datasource.
     * @desc This can be done dynamically.
     * @param {function|object[]} data - May be:
     * * An array of congruent raw data objects.
     * * A function returning same.
     * @param {object} [options] - _(See also {@link Behavior#setData} for additional options.)_
     * @param {Behavior} [options.Behavior=Local] - The behavior (model) can be either a constructor or an instance.
     * @param {DataModel} [options.dataModel] - _Passed to behavior {@link Behavior constructor} (when `options.Behavior` given)._
     * @param {function} [options.DataModel=require('datasaur-local')] - _Passed to behavior {@link Behavior constructor} (when `options.Behavior` given)._
     * @param {object} [options.metadata] - _Passed to behavior {@link Behavior constructor} (when `options.Behavior` given)._
     * @param {dataRowObject[]} [options.data] - _Passed to behavior {@link Behavior constructor} (when `options.Behavior` given)._
     * @param {function|menuItem[]} [options.schema] - _Passed to behavior {@link Behavior constructor} (when `options.Behavior` given)._
     */
    setData(data: Hypergrid.Options.Data, options: Hypergrid.Options) {
        if (!this.behavior) {
            this.setBehavior(options);
        }
        this.behavior.setData(data, options);
        this.setInfo(data.length ? '' : this.properties.noDataMessage);
        this.behavior.shapeChanged();
    }

    setInfo(messages: string) {
        this.renderer.setInfo(messages);
    }

    reindex() {
        if (this.paintLoopRunning()) {
            this.needsReindex = true;
        } else {
            this.behavior.reindex();
        }
        this.behaviorShapeChanged();
    }

    /**
     * @desc I've been notified that the behavior has changed.
     */
    behaviorChanged() {
        if (this.canvasDiv) {
            if (this.numColumns !== this.getColumnCount() || this.numRows !== this.getRowCount()) {
                this.numColumns = this.getColumnCount();
                this.numRows = this.getRowCount();
                this.behaviorShapeChanged();
            } else {
                this.behaviorStateChanged();
            }
        }
    }

    /**
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    behaviorShapeChanged() {
        if (this.paintLoopRunning()) {
            this.needsShapeChanged = true;
            this.canvas.requestRepaint();
        } else if (this.canvasDiv) {
            this.synchronizeScrollingBoundaries(); // calls computeCellsBounds
            this.repaint();
        }
    }

    /**
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    behaviorStateChanged() {
        if (this.paintLoopRunning()) {
            this.needsStateChanged = true;
            this.canvas.requestRepaint();
        } else if (this.canvasDiv) {
            this.computeCellsBounds();
            this.repaint();
        }
    }

    /**
     * Called from renderer/index.js
     */
    deferredBehaviorChange() {
        if (this.needsReindex) {
            this.behavior.reindex();
            this.needsReindex = false;
        }

        if (this.needsShapeChanged) {
            if (this.canvasDiv) {
                this.synchronizeScrollingBoundaries(); // calls computeCellsBounds
            }
        } else if (this.needsStateChanged) {
            if (this.canvasDiv) {
                this.computeCellsBounds();
            }
        }

        this.needsShapeChanged = this.needsStateChanged = false;
    }

    /**
     * @returns My bounds.
     */
    getBounds() {
        return this.renderer.getBounds();
    }

    repaint() {
        const canvas = this.canvas;
        if (canvas) {
            if (this.properties.repaintImmediately) {
                this.paintNow();
            } else {
                canvas.repaint();
            }
        }
    }

    /**
     * @desc Paint immediately in this microtask.
     */
    paintNow() {
        if (this.behavior.columnsCreated) {
            this.canvas.paintNow();
        }
    }

    /**
     * @summary Set the container for a grid instance
     */
    private setContainer(div: string | HTMLElement) {
        this.initContainer(div);
        this.initRenderer();
        // injectGridElements.call(this);
    }

    /**
     * @summary Initialize container
     */
    private initContainer(div: string | HTMLElement) {
        if (typeof div === 'string') {
            div = document.querySelector(div) as HTMLElement;
        }

        //Default Position and height to ensure DnD works
        if (!div.style.position) {
            div.style.position = null; // revert to stylesheet value
        }

        if (div.clientHeight < 1) {
            div.style.height = null; // revert to stylesheet value
        }

        // injectStylesheetTemplate(this, true, 'grid');

        //prevent the default context menu for appearing
        div.oncontextmenu = (event) => {
            event.stopPropagation();
            event.preventDefault();
            return false;
        };

        div.removeAttribute('tabindex');

        div.classList.add('hypergrid-container');
        div.id = div.id || 'hypergrid' + (document.querySelectorAll('.hypergrid-container').length - 1 || '');

        this.containerHtmlElement = div;
    }

    /**
     * @memberOf Hypergrid#
     * @summary Initialize drawing surface.
     * @param {object} [options]
     * @param {object} [options.margin] - Optional canvas "margins" applied to containing div as .left, .top, .right, .bottom. (Default values actually derive from 'grid' stylesheet's `.hypergrid-container` rule.)
     * @param {string} [options.margin.top='0px']
     * @param {string} [options.margin.right='0px']
     * @param {string} [options.margin.bottom='0px']
     * @param {string} [options.margin.left='0px']
     * @param {any} [options.contextAttributes] TODO
     * @param {any} [options.canvasContextAttributes] TODO
     * @this {Hypergrid}
     * @private
     */
    initCanvas(options?: Hypergrid.Options) {
        if (!this.canvasDiv) {
            const canvasDiv = document.createElement('div');

            canvasDiv.style.height = '100%';
            canvasDiv.style.display = 'flex';
            canvasDiv.style.flexDirection = 'column';
            this.setStyles(canvasDiv, options?.margin, Hypergrid.edgeStyleKeys);

            this.containerHtmlElement.appendChild(canvasDiv);

            const contextAttributes = options?.canvasContextAttributes;
            const canvas = new Canvas(canvasDiv, this.renderer, contextAttributes);
            canvas.canvas.classList.add('hypergrid');

            this.canvasDiv = canvasDiv;
            this.canvas = canvas;

            this.delegateCanvasEvents();
        }
    }

    convertViewPointToDataPoint(unscrolled: Point) {
        return this.behavior.convertViewPointToDataPoint(unscrolled);
    }

    // convertDataPointToViewPoint(dataPoint: Point) {
    //     return this.behavior.convertDataPointToViewPoint(dataPoint); // not implemented
    // }

    /**
     * @desc Switch the cursor for a grid instance.
     * @param cursorName - A well know cursor name.
     * {@link http://www.javascripter.net/faq/stylesc.htm|cursor names}
     */
    beCursor(cursorName: string) {
        this.containerHtmlElement.style.cursor = cursorName;
    }

    createCellEditor(name: string) {
        return cellEditorFactory.tryCreate(this, name);
    }

    /**
     * @summary Shut down the current cell editor and save the edited value.
     * @returns One of:
     * * `false` - Editing BUT could not abort.
     * * `true` - Not editing OR was editing AND abort was successful.
     */
    stopEditing() {
        return !this.cellEditor || this.cellEditor.stopEditing();
    }

    /**
     * @summary Shut down the current cell editor without saving the edited val
     * @returns One of:
     * * `false` - Editing BUT could not abort.
     * * `true` - Not editing OR was editing AND abort was successful.
     */
    cancelEditing() {
        return !this.cellEditor || this.cellEditor.cancelEditing();
    }

    /**
     * @summary Give cell editor opportunity to cancel (or something) instead of stop .
     * @returns One of:
     * * `false` - Editing BUT could not abort.
     * * `true` - Not editing OR was editing AND abort was successful.
     */
    abortEditing() {
        return !this.cellEditor || this.cellEditor.stopEditing();
    }

    /**
     * @returns The pixel coordinates of just the center 'main" data area.
     */
    getDataBounds() {
        const b = this.canvas.bounds;
        return new Rectangle(0, 0, b.origin.x + b.extent.x, b.origin.y + b.extent.y);
    }

    /**
     * @summary Open the cell-editor for the cell at the given coordinates.
     * @param cellEvent - Coordinates of "edit point" (gridCell.x, dataCell.y).
     * @return The cellEditor determined from the cell's render properties, which may be modified by logic added by overriding {@link DataModel#getCellEditorAt|getCellEditorAt}.
     */
    editAt(cellEvent: CellEvent): CellEditor | undefined {
        let cellEditor: CellEditor;

        this.abortEditing(); // if another editor is open, close it first

        if (
            cellEvent.isDataColumn &&
            cellEvent.columnProperties[cellEvent.isDataRow ? 'editable' : 'filterable'] &&
            (cellEditor = this.getCellEditorAt(cellEvent))
        ) {
            cellEditor.beginEditing();
        }

        return cellEditor;
    }

    /**
     * @param columnIndex - The column index in question.
     * @returns The given column is fully visible.
     */
    isColumnVisible(columnIndex: number) {
        return this.renderer.isColumnVisible(columnIndex);
    }

    /**
     * @param r - The raw row index in question.
     * @returns The given row is fully visible.
     */
    isDataRowVisible(r: number) {
        return this.renderer.isDataRowVisible(r);
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
     * @summary Scroll in the `offsetX` direction if column index `colIndex` is not visible.
     * @param colIndex - The column index in question.
     * @param offsetX - The direction and magnitude to scroll if we need to.
     * @return Column is visible.
     */
    insureModelColIsVisible(colIndex: number, offsetX: number) {
        const maxCols = this.getColumnCount() - 1; // -1 excludes partially visible columns
        const indexToCheck = colIndex + Math.sign(offsetX);
        const visible = !this.isColumnVisible(indexToCheck) || colIndex === maxCols;

        if (visible) {
            //the scroll position is the leftmost column
            this.scrollBy(offsetX, 0);
        }

        return visible;
    }

    /**
     * @summary Scroll in the `offsetY` direction if column index c is not visible.
     * @param rowIndex - The column index in question.
     * @param offsetX - The direction and magnitude to scroll if we need to.
     * @return Row is visible.
     */
    insureModelRowIsVisible(rowIndex: number, offsetY: number) {
        const maxRows = this.getRowCount() - 1; // -1 excludes partially visible rows
        const scrollOffset = (offsetY > -1) ? 1 : 0; // 1 to keep one blank line below active cell, 0 to keep zero lines above active cell
        const indexToCheck = rowIndex + scrollOffset;
        const visible = !this.isDataRowVisible(indexToCheck) || rowIndex === maxRows;

        if (visible) {
            //the scroll position is the topmost row
            this.scrollBy(0, offsetY);
        }

        return visible;
    }

    /**
     * @summary Answer which data cell is under a pixel value mouse point.
     * @param mouse - The mouse point to interrogate.
     */
    getGridCellFromMousePoint(mouse: Point) {
        return this.renderer.getGridCellFromMousePoint(mouse);
    }

    /**
     * @param gridCell - The pixel location of the mouse in physical grid coordinates.
     * @returns The pixel based bounds rectangle given a data cell point.
     */
    getBoundsOfCell(gridCell: Point): RectangleInterface {
        const {x, y, width, height} = this.renderer.getBoundsOfCell(gridCell.x, gridCell.y);

        //convert to a proper rectangle
        return new Rectangle(x, y, width, height);
    }

    /**
     * @desc This is called by the fin-canvas when a resize occurs.
     */
    resized() {
        this.behaviorShapeChanged();
    }

    /**
     * @desc Determine the cell and delegate to the behavior (model).
     * {@link Local#cellClicked}
     * @param event - The cell event to interrogate.
     * {@link DataModel#toggleRow}'s return value which may or may not be implemented.
     */
    cellClicked(event: CellEvent): boolean | undefined {
        return this.behavior.cellClicked(event);
    }

    /**
     * To intercept link clicks, override this method (either on the prototype to apply to all grid instances or on an instance to apply to a specific grid instance).
     */
    windowOpen(url: string, name: string, features?: string, replace?: boolean) {
        return window.open(url, name, features, replace);
    }

    /**
     * @returns A copy of the all columns array by passing the params to `Array.prototype.slice`.
     */
    getColumns(begin?: number, end?: number): Column[] {
        const columns = this.behavior.getColumns();
        return columns.slice(begin, end);
    }

    /**
     * @returns A copy of the active columns array by passing the params to `Array.prototype.slice`.
     */
    getActiveColumns(begin?: number, end?: number): Column[] {
        const columns = this.behavior.getActiveColumns();
        return columns.slice(begin, end);
    }

    getHiddenColumns() {
        //A non in-memory behavior will be more troublesome
        return this.behavior.getHiddenColumns();
    }

    /**
     * @desc Request input focus.
     */
    takeFocus() {
        const wasCellEditor = this.cellEditor;
        this.stopEditing();
        if (!wasCellEditor) {
            this.canvas.takeFocus();
        }
    }

    /**
     * @desc Request focus for our cell editor.
     */
    editorTakeFocus() {
        if (this.cellEditor) {
            return this.cellEditor.takeFocus();
        }
    }

    /**
     * @desc Note that "viewable rows" includes any partially viewable rows.
     * @returns {number} The number of viewable rows.
     */
    // getVisibleRows() {
    //     return this.renderer.getVisibleRows(); // not implemented
    // }

    /**
     * @desc Note that "viewable columns" includes any partially viewable columns.
     * @returns The number of viewable columns.
     */
    // getVisibleColumns() {
    //     return this.renderer.getVisibleColumns(); // not implemented
    // }

    /**
     * @summary Initialize the renderer sub-component.
     */
    initRenderer() {
        if (this.renderer === undefined) {
            this.renderer = new Renderer(this);
        }
    }

    /**
     * @returns The width of the given column.
     * @param columnIndex - The untranslated column index.
     */
    getColumnWidth(columnIndex: number) {
        return this.behavior.getColumnWidth(columnIndex);
    }

    /**
     * @desc Set the width of the given column.
     * @param columnIndex - The untranslated column index.
     * @param columnWidth - The width in pixels.
     */
    setColumnWidth(columnIndex: number, columnWidth: number) {
        if (this.abortEditing()) {
            this.behavior.setColumnWidth(columnIndex, columnWidth);
        }
    }

    /**
     * @returns The total width of all the fixed columns.
     */
    getFixedColumnsWidth(): number {
        return this.behavior.getFixedColumnsWidth();
    }

    /**
     * @returns The height of the given row
     * @param rowIndex - The untranslated fixed column index.
     */
    getRowHeight(rowIndex: number, subgrid?: Subgrid) {
        return this.behavior.getRowHeight(rowIndex, subgrid);
    }

    /**
     * @desc Set the height of the given row.
     * @param rowIndex - The row index.
     * @param rowHeight - The width in pixels.
     */
    setRowHeight(rowIndex: number, rowHeight: number, subgrid: Subgrid) {
        if (this.abortEditing()) {
            this.behavior.setRowHeight(rowIndex, rowHeight, subgrid);
        }
    }

    /**
     * @returns The total fixed rows height
     */
    getFixedRowsHeight(): number {
        return this.behavior.getFixedRowsHeight();
    }

    /**
     * @returns The number of fixed columns.
     */
    getFixedColumnCount(): number {
        return this.behavior.getFixedColumnCount();
    }

    /**
     * @returns The number of fixed rows.
     */
    getFixedRowCount() {
        return this.behavior.getFixedRowCount();
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
     * @memberOf Hypergrid#
     * @summary A fixed row has been clicked.
     * @desc Delegates to the behavior.
     * @param {event} event - The event details.
     */
    // rowHeaderClicked(mouse) {
    //     this.behavior.rowHeaderClicked(this, mouse); // not implemented
    // }

    /**
     * @memberOf Hypergrid#
     * @summary A fixed column has been clicked.
     * @desc Delegates to the behavior.
     * @param {event} event - The event details.
     */
    // columnHeaderClicked(mouse) {
    //     this.behavior.columnHeaderClicked(this, mouse); // not implemented
    // }

    /**
     * @desc An edit event has occurred. Activate the editor at the coordinates specified by the event.
     * @param event - The horizontal coordinate.
     * @returns The editor object or `undefined` if no editor or editor already open.
     */
    onEditorActivate(event: CellEvent) {
        return this.editAt(event);
    }

    /**
     * @summary Get the cell editor.
     * @desc Delegates to the behavior.
     * @returns The cell editor at the given coordinates.
     */
    getCellEditorAt(event: CellEvent) {
        return this.behavior.getCellEditorAt(event);
    }

    /**
     * @summary Toggle HiDPI support.
     * @desc HiDPI support is now *on* by default.
     * > There used to be a bug in Chrome that caused severe slow down on bit blit of large images, so this HiDPI needed to be optional.
     */
    toggleHiDPI() {
        if (this.properties.useHiDPI) {
            this.removeAttribute('hidpi');
        } else {
            this.setAttribute('hidpi', null);
        }
        this.canvas.resize();
    }

    /**
     * @returns The HiDPI ratio.
     */
    getHiDPI() {
        return this.canvas.devicePixelRatio;
    }

    /**
     * @returns The width of the given (recently rendered) column.
     * @param colIndex - The column index.
     */
    getRenderedWidth(colIndex: number): number {
        return this.renderer.getRenderedWidth(colIndex);
    }

    /**
     * @returns The height of the given (recently rendered) row.
     * @param rowIndex - The row index.
     */
    getRenderedHeight(rowIndex: number): number {
        return this.renderer.getRenderedHeight(rowIndex);
    }

    /**
     * @desc Update the cursor under the hover cell.
     */
    updateCursor() {
        let cursor = this.behavior.getCursorAt(-1, -1);
        const hoverGridCell = this.hoverGridCell;
        if (
            hoverGridCell &&
            hoverGridCell.x > -1 &&
            hoverGridCell.y > -1
        ) {
            const x = hoverGridCell.x + this.getHScrollValue();
            cursor = this.behavior.getCursorAt(x, hoverGridCell.y + this.getVScrollValue());
        }
        this.beCursor(cursor);
    }

    /**
     * @memberOf Hypergrid#
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
    isDraggingColumn(): boolean {
        return !!this.renderOverridesCache.dragger;
    }

    /**
     * @returns Objects with the values that were just rendered.
     */
    getRenderedData(): Array<Array<unknown>> {
        return this.renderer.getVisibleCellMatrix();
    }

    /**
     * @summary Autosize a column for best fit.
     * @param {Column|number} columnOrIndex - The column or active column index.
     */
    autosizeColumn(columnOrIndex: Column | number) {
        let column: Column;
        if (typeof columnOrIndex === 'number') {
            if (columnOrIndex >= 2) {
                column = this.behavior.getActiveColumn(columnOrIndex);
            } else {
                throw new Error('Column index must be >= -2');
            }
        } else {
            column = columnOrIndex;
        }
        column.checkColumnAutosizing(true);
        this.computeCellsBounds();
    }

    /**
     * @memberOf Hypergrid#
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
    resetZoom() {
        this.abortEditing();
        this.canvas.resetZoom();
    }

    getBodyZoomFactor() {
        return this.canvas.bodyZoomFactor;
    }

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
        return this.renderer.getVisibleColumnsCount();
    }

    /**
     * @returns The number of rows that were just rendered
     */
    getVisibleRowsCount() {
        return this.renderer.getVisibleRowsCount();
    }

    /**
     * @desc Update the size of a grid instance.
     */
    updateSize() {
        this.canvas.checksize();
    }


    /**
     * @desc Stop the global repainting flag thread.
     */
    // stopPaintThread() {
    //     this.canvas.stopPaintThread(); // not implemented
    // }

    /**
     * @desc Stop the global resize check flag thread.
     */
    // stopResizeThread() {
    //     this.canvas.stopResizeThread(); // not implemented
    // }

    /**
     * @desc Restart the global resize check flag thread.
     */
    // restartResizeThread() {
    //     this.canvas.restartResizeThread(); // not implemented
    // }

    /**
     * @desc Restart the global repainting check flag thread.
     */
    // restartPaintThread() {
    //     this.canvas.restartPaintThread(); // not implemented
    // }

    swapColumns(source: number, target: number) {
        //Turns out this is called during dragged 'i.e' when the floater column is reshuffled
        //by the currently dragged column. The column positions are constantly reshuffled
        this.behavior.swapColumns(source, target);
    }

    endDragColumnNotification() {
        this.behavior.endDragColumnNotification();
    }

    getFixedColumnsMaxWidth() {
        return this.behavior.getFixedColumnsMaxWidth();
    }

    isMouseDownInHeaderArea() {
        const headerRowCount = this.getHeaderRowCount();
        const mouseDown = this.getMouseDown();
        return mouseDown.x < 0 || mouseDown.y < headerRowCount;
    }

    /**
     * @param x - Data x coordinate.
     * @return The properties for a specific column.
     */
    getColumnProperties(x: number): ColumnProperties | undefined {
        return this.behavior.getColumnProperties(x);
    }

    /**
     * @param x - Data x coordinate.
     * @return The properties for a specific column.
     * @memberOf Hypergrid#
     */
    setColumnProperties(x: number, properties: ColumnProperties) {
        this.behavior.setColumnProperties(x, properties);
    }

    /**
     * Clears all cell properties of given column or of all columns.
     * @param x - Omit for all columns.
     */
    clearAllCellProperties(x: number) {
        this.behavior.clearAllCellProperties(x);
        this.renderer.resetAllCellPropertiesCaches();
    }

    isGridRow(y: number) {
        return new CellEvent(this, 0, y).isDataRow;
    }

    /**
     * @returns The total number of rows of all subgrids preceding the data subgrid.
     */
    getHeaderRowCount() {
        return this.behavior.getHeaderRowCount();
    }

    /**
     * @returns The total number of rows of all subgrids following the data subgrid.
     */
    getFooterRowCount() {
        return this.behavior.getFooterRowCount();
    }

    /**
     * @returns The total number of logical rows of all subgrids.
     */
    getLogicalRowCount() {
        return this.behavior.getLogicalRowCount();
    }

    hasTreeColumn() {
        return this.behavior.hasTreeColumn();
    }
    lookupFeature(key: string) {
        return this.behavior.lookupFeature(key);
    }

    newPoint(x: number, y: number) {
        return Point.create(x, y);
    }
    newRectangle(x: number, y: number, width: number, height: number) {
        return new Rectangle(x, y, width, height);
    }

    get charMap() {
        return this.behavior.charMap;
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
     * @desc Listeners added by this method should only be removed by {@link Hypergrid#removeEventListener|grid.removeEventListener} (or {@link Hypergrid#removeAllEventListeners|grid.removeAllEventListeners}).
     * @param eventName - The type of event we are interested in.
     * @param listener - The event handler.
     * @param internal - Used by {@link Hypergrid#addInternalEventListener|grid.addInternalEventListener} (see).
     */
    addEventListener<T extends keyof Canvas.EventMap>(eventName: T, listener: (e: Canvas.EventMap[T]) => void, internal?: boolean): void;
    addEventListener(eventName: string, listener: EventListener, internal?: boolean): void {
        let alreadyAttached: boolean;
        let listenerInfos = this.eventlistenerInfos.get(eventName);
        if (listenerInfos === undefined) {
            listenerInfos = [];
            alreadyAttached = false;
        } else {
            const listenerInfo = listenerInfos.find((info) => info.listener === listener);
            alreadyAttached = listenerInfo !== undefined;
        }

        if (!alreadyAttached) {
            const info: Hypergrid.ListenerInfo = {
                internal: internal === true,
                listener,
                decorator: (e) => {
                    if (this.allowEventHandlers) {
                        listener(e);
                    }
                }
            };
            listenerInfos.push(info);
            this.eventlistenerInfos.set(eventName, listenerInfos);
            this.canvas.addEventListener(eventName, info.decorator);
        }
    }

    /**
     * @summary Add an internal event listener to me.
     * @desc The new listener is flagged as "internal." Internal listeners are removed as usual by {@link Hypergrid#removeEventListener|grid.removeEventListener}. However, they are ignored by {@link Hypergrid#removeAllEventListeners|grid.removeAllEventListeners()} (as called by {@link Hypergrid#reset|reset}). (But see {@link Hypergrid#removeAllEventListeners|grid.removeAllEventListeners(true)}.)
     *
     * Listeners added by this method should only be removed by {@link Hypergrid#removeEventListener|grid.removeEventListener} (or {@link Hypergrid#removeAllEventListeners|grid.removeAllEventListeners(true)}).
     * @param eventName - The type of event we are interested in.
     * @param listener - The event handler.
     * @memberOf Hypergrid#
     */
    addInternalEventListener<T extends keyof Canvas.EventMap>(eventName: T, listener: (e: Canvas.EventMap[T]) => void) {
    // addInternalEventListener(eventName: string, listener: Canvas.Listener) {
        this.addEventListener(eventName, listener, true);
    }

    /**
     * @summary Remove an event listeners.
     * @desc Removes the event listener with matching name and function that was added by {@link Hypergrid#addEventListener|grid.addEventListener}.
     *
     * NOTE: This method cannot remove event listeners added by other means.
     */
    removeEventListener(eventName: string, listener: EventListener) {
        const listenerInfos = this.eventlistenerInfos.get(eventName);

        if (listenerInfos !== undefined) {
            listenerInfos.find(
                (info, index) => {
                    if (info.listener === listener) {
                        if (listenerInfos.length === 1) {
                            this.eventlistenerInfos.delete(eventName);
                        } else {
                            listenerInfos.splice(index, 1); // remove it from the list
                        }
                        this.canvas.removeEventListener(eventName, info.decorator);
                        return true;
                    } else {
                        return false;
                    }
                }
            )
        }
    }

    /**
     * @summary Remove all event listeners.
     * @desc Removes all event listeners added with {@link Hypergrid#addEventListener|grid.addEventListener} except those added as "internal."
     * @param includeInternal - Include internal listeners.
     */
    removeAllEventListeners(includeInternal = false) {
        for (const [key, value] of this.eventlistenerInfos) {
            value.forEach(
                (info) => {
                    if (includeInternal || !info.internal) {
                        this.removeEventListener(key, info.listener);
                    }
                }
            )
        }
    }

    /**
     * @param allow
     */
    allowEvents(allow: boolean){
        this.allowEventHandlers = !!allow;

        if (this.behavior.featureChain) {
            if (allow){
                this.behavior.featureChain.attachChain();
            } else {
                this.behavior.featureChain.detachChain();
            }
        }

        this.behavior.changed();
    }

    /**
     * @param c - grid column index.
     * @desc Synthesize and fire a `fin-column-sort` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticColumnSortEvent(c: number, keys: string[]): boolean {
        const event: ColumnSorting.ColumnSortEvent = {
            column: c,
            keys: keys
        }
        return dispatchGridEvent(this, 'fin-column-sort', false, event);
    }

    /**
     * @desc Synthesize and fire a `fin-editor-keyup` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticEditorKeyUpEvent(inputControl: CellEditor, keyEvent: KeyboardEvent) {
        const event: CellEditor.KeyEvent = {
            input: inputControl,
            keyEvent: keyEvent,
        }
        return dispatchGridEvent(this, 'fin-editor-keyup', false, event);
    }

    /**
     * @desc Synthesize and fire a `fin-editor-keydown` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticEditorKeyDownEvent(inputControl: CellEditor, keyEvent: KeyboardEvent) {
        const event: CellEditor.KeyEvent = {
            input: inputControl,
            keyEvent: keyEvent,
        }
        return dispatchGridEvent(this, 'fin-editor-keydown', false, event);
    }

    /**
     * @desc Synthesize and fire a `fin-editor-keypress` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticEditorKeyPressEvent(inputControl: CellEditor, keyEvent: KeyboardEvent) {
        const event: CellEditor.KeyEvent = {
            input: inputControl,
            keyEvent: keyEvent,
        }
        return dispatchGridEvent(this, 'fin-editor-keypress', false, event);
    }

    /**
     * @desc Synthesize and fire a `fin-editor-data-change` event.
     *
     * This event is cancelable.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticEditorDataChangeEvent(inputControl: CellEditor, oldValue: unknown, newValue: unknown) {
        const event: CellEditor.DataChangeEvent = {
            input: inputControl,
            oldValue: oldValue,
            newValue: newValue
        };

        return dispatchGridEvent(this, 'fin-editor-data-change', true, event);
    }

    fireSyntheticRowHeaderClickedEvent(event: CellEvent) {
        return dispatchGridEvent(this, 'fin-row-header-clicked', true, undefined, event);
    }

    /**
     * @desc Synthesize and fire a `fin-row-selection-changed` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticRowSelectionChangedEvent() {
        const selectionDetailGetters = new SelectionDetailAccessor(this);
        return dispatchGridEvent(this, 'fin-row-selection-changed', false, selectionDetailGetters);
    }

    /**
     * @desc Synthesize and fire a `fin-column-selection-changed` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticColumnSelectionChangedEvent() {
        const selectionDetailGetters = new SelectionDetailAccessor(this);
        return dispatchGridEvent(this, 'fin-column-selection-changed', false, selectionDetailGetters);
    }

    /**
     * @desc Synthesize and fire a `fin-context-menu` event
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticContextMenuEvent(event: CellEvent) {
        return dispatchGridEvent(this, 'fin-context-menu', false, undefined, event);
    }

    /**
     * @desc Synthesize and fire a `fin-mouseup` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticMouseUpEvent(event: CellEvent) {
        return dispatchGridEvent(this, 'fin-mouseup', false, undefined, event);
    }

    /**
     * @desc Synthesize and fire a `fin-mousedown` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticMouseDownEvent(event: CellEvent) {
        return dispatchGridEvent(this, 'fin-mousedown', false, undefined, event);
    }

    /**
     * @desc Synthesize and fire a `fin-mousemove` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticMouseMoveEvent(event: CellEvent | undefined) {
        return dispatchGridEvent(this, 'fin-mousemove', false, undefined, event);
    }

    /**
     * @desc Synthesize and fire a `fin-button-pressed` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticButtonPressedEvent(event: CellEvent) {
        if (event.cellRenderer instanceof ButtonCellPainter) { // Button or subclass thereof?
            // if (event.value && event.value.subrows) {
            //     var y = event.primitiveEvent.detail.mouse.y - event.bounds.y,
            //         subheight = event.bounds.height / event.value.subrows;
            //     event.subrow = Math.floor(y / subheight);
            // }
            return dispatchGridEvent(this, 'fin-button-pressed', false, undefined, event);
        } else {
            return undefined;
        }
    }

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-column-drag-start` event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticOnColumnsChangedEvent() {
        return dispatchGridEvent(this, 'fin-column-changed-event', false, undefined);
    }

    /**
     * @desc Synthesize and fire a `fin-keydown` event.
     * @param event - The canvas event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticKeydownEvent(keyEvent: Canvas.KeyboardSyntheticEvent) {
        return dispatchGridEvent(this, 'fin-keydown', false, keyEvent.detail);
    }

    /**
     * @desc Synthesize and fire a `fin-keyup` event.
     * @param event - The canvas event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticKeyupEvent(keyEvent: Canvas.KeyboardSyntheticEvent) {
        return dispatchGridEvent(this, 'fin-keyup', false, keyEvent.detail);
    }

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a fin-filter-applied event.
     * @returns {boolean} Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticFilterAppliedEvent() {
        return dispatchGridEvent(this, 'fin-filter-applied', false, undefined);
    }

    /**
     * @desc Synthesize and fire a `fin-cell-enter` event
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticOnCellEnterEvent(cellEvent: CellEvent) {
        return dispatchGridEvent(this, 'fin-cell-enter', false, cellEvent);
    }

    /**
     * @desc Synthesize and fire a `fin-cell-exit` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticOnCellExitEvent(cellEvent: CellEvent) {
        return dispatchGridEvent(this, 'fin-cell-exit', false, cellEvent);
    }

    /**
     * @desc Synthesize and fire a `fin-cell-click` event.
     * @param event - The system mouse event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticClickEvent(cellEvent: CellEvent) {
        return dispatchGridEvent(this, 'fin-click', false, undefined, cellEvent);
    }

    /**
     * @desc Synthesize and fire a `fin-double-click` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticDoubleClickEvent(cellEvent: CellEvent) {
        if (!this.abortEditing()) { return undefined; }

        return dispatchGridEvent(this, 'fin-double-click', false, undefined, cellEvent);
    }

    /**
     * @desc Synthesize and fire a fin-grid-rendered event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticGridRenderedEvent() {
        const event: Hypergrid.GridEvent = {
            source: this,
        }
        return dispatchGridEvent(this, 'fin-grid-rendered', false, event);
    }

    /**
     * @desc Synthesize and fire a fin-tick event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticTickEvent() {
        const event: Hypergrid.GridEvent = {
            source: this,
        }
        return dispatchGridEvent(this, 'fin-tick', false, event);
    }

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a fin-grid-resized event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticGridResizedEvent(e: Canvas.ResizeSyntheticEvent) {
        return dispatchGridEvent(this, 'fin-grid-resized', false, e);
    }

    /**
     * @desc Synthesize and fire a `fin-touchstart` event.
     * @param e - The canvas event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticTouchStartEvent(e: Canvas.TouchSyntheticEvent) {
        return dispatchGridEvent(this, 'fin-touchstart', false, e);
    }

    /**
     * @desc Synthesize and fire a `fin-touchmove` event.
     * @param e - The canvas event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticTouchMoveEvent(e: Canvas.TouchSyntheticEvent) {
        return dispatchGridEvent(this, 'fin-touchmove', false, e);
    }

    /**
     * @desc Synthesize and fire a `fin-touchend` event.
     * @param e - The canvas event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticTouchEndEvent(e: Canvas.TouchSyntheticEvent) {
        return dispatchGridEvent(this, 'fin-touchend', false, e);
    }

    /**
     * @desc Synthesize and fire a scroll event.
     * @param type - Should be either `fin-scroll-x` or `fin-scroll-y`.
     * @param oldValue - The old scroll value.
     * @param newValue - The new scroll value.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireScrollEvent(eventName: string, oldValue: number, newValue: number) {
        const event: Hypergrid.ScrollEvent = {
            oldValue: oldValue,
            value: newValue
        };
        return dispatchGridEvent(this, eventName, false, event);
    }

    /**
     * @desc Synthesize and fire a fin-request-cell-edit event.
     *
     * This event is cancelable.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireRequestCellEdit(input: CellEditor, cellEvent: CellEvent, value: unknown) {
        const event: CellEditor.RequestCellEdit = {
            input,
            value,
        }
        return dispatchGridEvent(this, 'fin-request-cell-edit', true, event, cellEvent);
    }

    /**
     * @desc Synthesize and fire a fin-before-cell-edit event.
     *
     * This event is cancelable.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireBeforeCellEdit(point: WritablePoint, oldValue: unknown, newValue: unknown, control: CellEditor) {
        const event: CellEditor.DataChangeEvent = {
            input: control,
            oldValue: oldValue,
            newValue: newValue
        };
        return dispatchGridEvent(this, 'fin-before-cell-edit', true, event, point);
    }

    /**
     * @param point - The x,y coordinates.
     * @param oldValue - The old value.
     * @param newValue - The new value.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireAfterCellEdit(point: WritablePoint, oldValue: unknown, newValue: unknown, control: CellEditor) {
        const event: CellEditor.DataChangeEvent = {
            input: control,
            oldValue: oldValue,
            newValue: newValue
        };

        return dispatchGridEvent(this, 'fin-after-cell-edit', false, event, point);
    }

    delegateCanvasEvents() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const grid = this;

        function handleMouseEvent(syntheticEvent: Canvas.MouseSyntheticEvent, cb: ((cellEvent: CellEvent | undefined) => void)) {
            if (grid.getLogicalRowCount() === 0) {
                return;
            }

            const syntheticDetail = syntheticEvent.detail;
            const c = grid.getGridCellFromMousePoint(syntheticDetail.mouse);
            let cellEvent: CellEvent | undefined;

            // No events on the whitespace of the grid unless they're drag events
            if (!c.fake || syntheticDetail.dragstart) {
                cellEvent = c.cellInfo as CellEvent; // CellEvents are really RenderCells. All conversions occur here.
            } else {
                cellEvent = undefined;
            }

            if (cellEvent !== undefined) {
                cellEvent.primitiveEvent = syntheticEvent;

                // add some interesting mouse offsets
                // let detail = cellEvent.primitiveEvent.detail;
                if (syntheticDetail !== undefined) { // test should not be necessary
                    cellEvent.gridPoint = syntheticDetail.mouse;
                    const uiEvent = syntheticEvent.primitiveEvent as MouseEvent;
                    if (uiEvent !== undefined) {
                        cellEvent.clientPoint = Point.create(uiEvent.clientX, uiEvent.clientY);
                        cellEvent.pagePoint = Point.create(uiEvent.clientX + window.scrollX, uiEvent.clientY + window.scrollY);
                    }
                }

            }

            cb(cellEvent);
        }

        this.addInternalEventListener('fin-canvas-resized', (e) => {
            grid.resized();
            grid.fireSyntheticGridResizedEvent(e);
        });

        this.addInternalEventListener('fin-canvas-mousemove', (e) => {
            if (grid.properties.readOnly) {
                return;
            } else {
                handleMouseEvent(e, (cellEvent) => {
                    this.delegateMouseMove(cellEvent);
                    this.fireSyntheticMouseMoveEvent(cellEvent);
                });
            }
        });

        this.addInternalEventListener('fin-canvas-mousedown', (e) => {
            if (grid.properties.readOnly) {
                return;
            }
            if (!grid.abortEditing()) {
                e.stopPropagation();
                return;
            }

            handleMouseEvent(e,
                (cellEvent) => {
                    if (cellEvent !== undefined) {
                        this.mouseDownState = cellEvent;
                        this.delegateMouseDown(cellEvent);
                        this.fireSyntheticMouseDownEvent(cellEvent);
                        this.repaint();
                    }
                }
            );
        });

        this.addInternalEventListener('fin-canvas-click', (e) => {
            if (grid.properties.readOnly) {
                return;
            }
            handleMouseEvent(e,
                (cellEvent) => {
                    if (cellEvent !== undefined) {
                        const isMouseDownCell = this.mouseDownState !== undefined && Point.isEqual(this.mouseDownState.gridCell, cellEvent.gridCell);
                        if (isMouseDownCell && cellEvent.mousePointInClickRect) {
                            // cellEvent.keys = e.detail.keys; // todo: this was in fin-tap but wasn't here
                            if (this.mouseDownState !== undefined) {
                                this.fireSyntheticButtonPressedEvent(this.mouseDownState);
                            }
                            this.fireSyntheticClickEvent(cellEvent);
                            this.delegateClick(cellEvent);
                        }
                        this.mouseDownState = null;
                    }
                }
            );
        });

        this.addInternalEventListener('fin-canvas-mouseup', (e) => {
            if (grid.properties.readOnly) {
                return;
            }
            grid.dragging = false;
            if (grid.isScrollingNow()) {
                grid.setScrollingNow(false);
            }
            if (grid.columnDragAutoScrolling) {
                grid.columnDragAutoScrolling = false;
            }
            handleMouseEvent(e,
                (cellEvent) => {
                    if (cellEvent !== undefined) {
                        this.delegateMouseUp(cellEvent);
                        this.fireSyntheticMouseUpEvent(cellEvent);
                    }
                }
            );
        });

        this.addInternalEventListener('fin-canvas-dblclick', (e) => {
            if (grid.properties.readOnly) {
                return;
            }
            handleMouseEvent(e,
                (cellEvent) => {
                    if (cellEvent !== undefined) {
                        this.fireSyntheticDoubleClickEvent(cellEvent);
                        this.delegateDoubleClick(cellEvent);
                    }
                }
            );
        });

        this.addInternalEventListener('fin-canvas-drag', (e) => {
            if (grid.properties.readOnly) {
                return;
            }
            grid.dragging = true;
            handleMouseEvent(e,
                (cellEvent) => {
                    if (cellEvent !== undefined) {
                        grid.delegateMouseDrag(cellEvent);
                    }
                }
            );
        });

        this.addInternalEventListener('fin-canvas-keydown', (e) => {
            if (grid.properties.readOnly) {
                return;
            }
            grid.fireSyntheticKeydownEvent(e);
            grid.delegateKeyDown(e);
        });

        this.addInternalEventListener('fin-canvas-keyup', (e) => {
            if (grid.properties.readOnly) {
                return;
            }
            grid.fireSyntheticKeyupEvent(e);
            grid.delegateKeyUp(e);
        });

        this.addInternalEventListener('fin-canvas-wheelmoved', (e) => {
            handleMouseEvent(e,
                (cellEvent) => {
                    if (cellEvent !== undefined) {
                        grid.delegateWheelMoved(cellEvent);
                    }
                }
            );
        });

        this.addInternalEventListener('fin-canvas-mouseout', (e) => {
            if (grid.properties.readOnly) {
                return;
            }
            handleMouseEvent(e,
                (cellEvent) => {
                    if (cellEvent !== undefined) {
                        grid.delegateMouseExit(cellEvent);
                    }
                }
            );
        });

        this.addInternalEventListener('fin-canvas-context-menu', (e) => {
            handleMouseEvent(e,
                (cellEvent) => {
                    if (cellEvent !== undefined) {
                        grid.delegateContextMenu(cellEvent);
                        grid.fireSyntheticContextMenuEvent(cellEvent);
                    }
                }
            );
        });

        this.addInternalEventListener('fin-canvas-touchstart', (e) => {
            grid.delegateTouchStart(e);
            grid.fireSyntheticTouchStartEvent(e);
        });

        this.addInternalEventListener('fin-canvas-touchmove', (e) => {
            grid.delegateTouchMove(e);
            grid.fireSyntheticTouchMoveEvent(e);
        });

        this.addInternalEventListener('fin-canvas-touchend', (e) => {
            grid.delegateTouchEnd(e);
            grid.fireSyntheticTouchEndEvent(e);
        });

        //Register a listener for the copy event so we can copy our selected region to the pastebuffer if conditions are right.
        document.body.addEventListener('copy', (evt) => {
            grid.checkClipboardCopy(evt);
        });
    }

    /**
     * @desc Delegate the wheel moved event to the behavior.
     * @param event - The pertinent event.
     */
    delegateWheelMoved(event: CellEvent) {
        this.behavior.onWheelMoved(this, event);
    }

    /**
     * @desc Delegate MouseExit to the behavior (model).
     * @param event - The pertinent event.
     */
    delegateMouseExit(event: CellEvent) {
        this.behavior.handleMouseExit(this, event);
    }

    /**
     * @desc Delegate MouseExit to the behavior (model).
     * @param event - The pertinent event.
     */
    delegateContextMenu(event: CellEvent) {
        this.behavior.onContextMenu(this, event);
    }

    /**
     * @memberOf Hypergrid#
     * @desc Delegate MouseMove to the behavior (model).
     * @param cellEvent - An enriched mouse event from fin-canvas.
     */
    delegateMouseMove(cellEvent: CellEvent | undefined) {
        this.behavior.onMouseMove(this, cellEvent);
    }

    /**
     * @memberOf Hypergrid#
     * @desc Delegate mousedown to the behavior (model).
     * @param cellEvent - An enriched mouse event from fin-canvas.
     */
    delegateMouseDown(cellEvent: CellEvent) {
        this.behavior.handleMouseDown(this, cellEvent);
    }

    /**
     * @desc Delegate mouseup to the behavior (model).
     * @param cellEvent - An enriched mouse event from fin-canvas.
     */
    delegateMouseUp(cellEvent: CellEvent) {
        this.behavior.onMouseUp(this, cellEvent);
    }

    /**
     * @desc Delegate click to the behavior (model).
     * @param cellEvent - An enriched mouse event from fin-canvas.
     */
    delegateClick(cellEvent: CellEvent) {
        this.behavior.onClick(this, cellEvent);
    }

    /**
     * @desc Delegate mouseDrag to the behavior (model).
     * @param cellEvent - An enriched mouse event from fin-canvas.
     */
    delegateMouseDrag(cellEvent: CellEvent) {
        this.behavior.onMouseDrag(this, cellEvent);
    }

    /**
     * @desc We've been doubleclicked on. Delegate through the behavior (model).
     * @param cellEvent - An enriched mouse event from fin-canvas.
     */
    delegateDoubleClick(cellEvent: CellEvent) {
        this.behavior.onDoubleClick(this, cellEvent);
    }

    /**
     * @memberOf Hypergrid#
     * @summary Generate a function name and call it on self.
     * @desc This should also be delegated through Behavior keeping the default implementation here though.
     * @param {event} event - The pertinent event.
     */
    delegateKeyDown(event: Canvas.KeyboardSyntheticEvent) {
        this.behavior.onKeyDown(this, event);
    }

    /**
     * @summary Generate a function name and call it on self.
     * @desc This should also be delegated through Behavior keeping the default implementation here though.
     * @param event - The pertinent event.
     */
    delegateKeyUp(event: Canvas.KeyboardSyntheticEvent) {
        this.behavior.onKeyUp(this, event);
    }

    /**
     * @desc Delegate touchstart to the Behavior model.
     * @param event - The pertinent event.
     */
    delegateTouchStart(event: Canvas.TouchSyntheticEvent) {
        this.behavior.onTouchStart(this, event);
    }

    /**
     * @desc Delegate touchmove to the Behavior model.
     * @param event - The pertinent event.
     */
    delegateTouchMove(event: Canvas.TouchSyntheticEvent) {
        this.behavior.onTouchMove(this, event);
    }

    /**
     * @desc Delegate touchend to the Behavior model.
     * @param event - The pertinent event.
     */
    delegateTouchEnd(event: Canvas.TouchSyntheticEvent) {
        this.behavior.onTouchEnd(this, event);
    }
    // End Events Mixin

    // Begin Selection Mixin
    /**
     * Additions to `Hypergrid.prototype` for modeling cell, row, and column selections.
     *
     * All members are documented on the {@link Hypergrid} page.
     * @mixin selection.mixin
     */

    /**
     * @returns We have any selections.
     */
    hasSelections() {
        // if (!this.getSelectionModel) { // set in constructor
        //     return; // were not fully initialized yet
        // }
        return this.selectionModel.hasSelections();
    }

    /**
     * @returns Tab separated value string from the selection and our data.
     */
    getSelectionAsTSV(): string {
        switch (this.selectionModel.getLastSelectionType()) {
            case 'cell':
                const selectionMatrix = this.getSelectionMatrix();
                const selections = selectionMatrix[selectionMatrix.length - 1];
                return this.getMatrixSelectionAsTSV(selections);
            case 'row':
                return this.getMatrixSelectionAsTSV(this.getRowSelectionMatrix());
            case 'column':
                return this.getMatrixSelectionAsTSV(this.getColumnSelectionMatrix());
            default:
                return '';
        }
    }

    getMatrixSelectionAsTSV(selections: Array<Array<DataModel.DataValue>>) {
        let result = '';

        //only use the data from the last selection
        if (selections.length) {
            const width = selections.length;
            const height = selections[0].length;
            const area = width * height;
            const lastCol = width - 1;
                //Whitespace will only be added on non-singular rows, selections
            const whiteSpaceDelimiterForRow = (height > 1 ? '\n' : '');

            //disallow if selection is too big
            if (area > 20000) {
                alert('selection size is too big to copy to the paste buffer'); // eslint-disable-line no-alert
                return '';
            }

            for (let h = 0; h < height; h++) {
                for (let w = 0; w < width; w++) {
                    result += selections[w][h] + (w < lastCol ? '\t' : whiteSpaceDelimiterForRow);
                }
            }
        }

        return result;
    }

    /**
     * @desc Clear all the selections.
     */
    clearSelections() {
        const keepRowSelections = this.properties.checkboxOnlyRowSelections;
        this.selectionModel.clear(keepRowSelections);
        this.clearMouseDown();
    }

    /**
     * @desc Clear the most recent selection.
     */
    clearMostRecentSelection() {
        const keepRowSelections = this.properties.checkboxOnlyRowSelections;
        this.selectionModel.clearMostRecentSelection(keepRowSelections);
    }

    /**
     * @desc Clear the most recent column selection.
     */
    clearMostRecentColumnSelection() {
        this.selectionModel.clearMostRecentColumnSelection();
    }

    /**
     * @desc Clear the most recent row selection.
     */
    clearMostRecentRowSelection() {
        //this.selectionModel.clearMostRecentRowSelection(); // commented off as per GRID-112
    }

    clearRowSelection() {
        this.selectionModel.clearRowSelection();
    }

    /**
     * @summary Select given region.
     * @param ox - origin x
     * @param oy - origin y
     * @param ex - extent x
     * @param ex - extent y
     */
    select(ox: number, oy: number, ex: number, ey: number) {
        if (ox < 0 || oy < 0) {
            //we don't select negative area
            //also this means there is no origin mouse down for a selection rect
            return;
        }
        this.selectionModel.select(ox, oy, ex, ey);
    }

    /**
     * @returns Given point is selected.
     * @param x - The horizontal coordinate.
     * @param y - The vertical coordinate.
     */
    isSelected(x: number, y: number): boolean {
        return this.selectionModel.isSelected(x, y);
    }

    /**
     * @returns The given column is selected anywhere in the entire table.
     * @param y - The row index.
     */
    isCellSelectedInRow(y: number): boolean {
        return this.selectionModel.isCellSelectedInRow(y);
    }

    /**
     * @returns The given row is selected anywhere in the entire table.
     * @param x - The column index.
     */
    isCellSelectedInColumn(x: number): boolean {
        return this.selectionModel.isCellSelectedInColumn(x);
    }

    getRowSelection(hiddenColumns: boolean | number[] | string[]): DataModel.DataRowObject {
        const subgrid = this.behavior.mainSubgrid;
        const selectedRowIndexes = this.selectionModel.getSelectedRows();
        const columns = this.getActiveAllOrSpecifiedColumns(hiddenColumns);
        const result: DataModel.DataRowObject = {};

        for (let c = 0, C = columns.length; c < C; c++) {
            const column = columns[c];
            const rows = result[column.name] = new Array(selectedRowIndexes.length);
            selectedRowIndexes.forEach( (selectedRowIndex, j) => {
                const dataRow = subgrid.getRow(selectedRowIndex);
                rows[j] = this.valOrFunc(dataRow, column);
            });
        }

        return result;
    }

    getRowSelectionMatrix(hiddenColumns?: boolean | number[] | string[]): Array<Array<DataModel.DataValue>> {
        const subgrid = this.behavior.mainSubgrid;
        const selectedRowIndexes = this.selectionModel.getSelectedRows();
        const columns = this.getActiveAllOrSpecifiedColumns(hiddenColumns);
        const result = new Array<Array<DataModel.DataValue>>(columns.length);

        for (let c = 0, C = columns.length; c < C; c++) {
            const column = columns[c];
            result[c] = new Array<DataModel.DataValue>(selectedRowIndexes.length);
            selectedRowIndexes.forEach(
                (selectedRowIndex, r) => {
                    const dataRow = subgrid.getRow(selectedRowIndex);
                    result[c][r] = this.valOrFunc(dataRow, column);
                }
            );
        }

        return result;
    }

    getColumnSelectionMatrix(): DataModel.DataValue[][] {
        const behavior = this.behavior;
        const subgrid = behavior.mainSubgrid;
        const headerRowCount = this.getHeaderRowCount();
        const selectedColumnIndexes = this.getSelectedColumns();
        const numRows = this.getRowCount();
        const result = new Array<Array<DataModel.DataValue>>(selectedColumnIndexes.length);

        selectedColumnIndexes.forEach((selectedColumnIndex, c) => {
            const column = behavior.getActiveColumn(selectedColumnIndex);
            const values = result[c] = new Array<DataModel.DataValue>(numRows);

            for (let r = headerRowCount; r < numRows; r++) {
                const dataRow = subgrid.getRow(r);
                values[r] = this.valOrFunc(dataRow, column);
            }
        });

        return result;
    }

    getColumnSelection() {
        const behavior = this.behavior;
        const subgrid = behavior.mainSubgrid;
        const headerRowCount = this.getHeaderRowCount();
        const selectedColumnIndexes = this.getSelectedColumns();
        const result: Hypergrid.ColumnsDataValuesObject = {};
        const rowCount = this.getRowCount();

        selectedColumnIndexes.forEach((selectedColumnIndex) => {
            const column = behavior.getActiveColumn(selectedColumnIndex);
            const values = result[column.name] = new Array<DataModel.DataValue>(rowCount);

            for (let r = headerRowCount; r < rowCount; r++) {
                const dataRow = subgrid.getRow(r);
                values[r] = this.valOrFunc(dataRow, column);
            }
        });

        return result;
    }

    getSelection(): Hypergrid.ColumnsDataValuesObject[] {
        const behavior = this.behavior;
        const subgrid = behavior.mainSubgrid;
        const selections = this.getSelections();
        const rects = new Array<Hypergrid.ColumnsDataValuesObject>(selections.length);

        selections.forEach(
            (selectionRect, i) => {
                const rect = this.normalizeRect(selectionRect);
                const colCount = rect.width;
                const rowCount = rect.height;
                const columns: Hypergrid.ColumnsDataValuesObject = {};

                for (let c = 0, x = rect.origin.x; c < colCount; c++, x++) {
                    const column = behavior.getActiveColumn(x);
                    const values = columns[column.name] = new Array<DataModel.DataValue>(rowCount);

                    for (let r = 0, y = rect.origin.y; r < rowCount; r++, y++) {
                        const dataRow = subgrid.getRow(y);
                        values[r] = this.valOrFunc(dataRow, column);
                    }
                }

                rects[i] = columns;
            }
        );

        return rects;
    }

    getSelectionMatrix(): DataModel.DataValue[][][] {
        const behavior = this.behavior;
        const subgrid = behavior.mainSubgrid;
        const selections = this.getSelections();
        const rects = new Array<Array<Array<DataModel.DataValue>>>(selections.length);

        selections.forEach(
            (selectionRect, i) => {
                const rect = this.normalizeRect(selectionRect);
                const colCount = rect.width;
                const rowCount = rect.height;
                const rows = new Array<Array<DataModel.DataValue>>();

                for (let c = 0, x = rect.origin.x; c < colCount; c++, x++) {
                    const values = rows[c] = new Array<DataModel.DataValue>(rowCount);
                    const column = behavior.getActiveColumn(x);

                    for (let r = 0, y = rect.origin.y; r < rowCount; r++, y++) {
                        const dataRow = subgrid.getRow(y);
                        values[r] = this.valOrFunc(dataRow, column);
                    }
                }

                rects[i] = rows;
            }
        );

        return rects;
    }

    selectCell(x: number, y: number, silent?: boolean) {
        const keepRowSelections = this.properties.checkboxOnlyRowSelections;
        this.selectionModel.clear(keepRowSelections);
        this.selectionModel.select(x, y, 0, 0, silent);
    }

    toggleSelectColumn(x: number, keys?: string[]) {
        keys = keys ?? [];
        const model = this.selectionModel;
        const alreadySelected = model.isColumnSelected(x);
        const hasCTRL = keys.indexOf('CTRL') > -1;
        const hasSHIFT = keys.indexOf('SHIFT') > -1;
        if (!hasCTRL && !hasSHIFT) {
            model.clear();
            if (!alreadySelected) {
                model.selectColumn(x);
            }
        } else {
            if (hasCTRL) {
                if (alreadySelected) {
                    model.deselectColumn(x);
                } else {
                    model.selectColumn(x);
                }
            }
            if (hasSHIFT) {
                model.clear();
                model.selectColumn(this.lastEdgeSelection[0], x);
            }
        }
        if (!alreadySelected && !hasSHIFT) {
            this.lastEdgeSelection[0] = x;
        }
        this.repaint();
        this.fireSyntheticColumnSelectionChangedEvent();
    }

    toggleSelectRow(y: number, keys?: string[]) {
        //we can select the totals rows if they exist, but not rows above that
        keys = keys || [];

        const sm = this.selectionModel;
        const alreadySelected = sm.isRowSelected(y);
        const hasSHIFT = keys.indexOf('SHIFT') >= 0;

        if (alreadySelected) {
            sm.deselectRow(y);
        } else {
            this.singleSelect();
            sm.selectRow(y);
        }

        if (hasSHIFT) {
            sm.clear();
            sm.selectRow(this.lastEdgeSelection[1], y);
        }

        if (!alreadySelected && !hasSHIFT) {
            this.lastEdgeSelection[1] = y;
        }

        this.repaint();
    }

    singleSelect() {
        const result = this.properties.singleRowSelectionMode;

        if (result) {
            this.selectionModel.clearRowSelection();
        }

        return result;
    }

    selectViewportCell(x: number, y: number) {
        let vc: Renderer.VisibleColumn
        let vr: Renderer.VisibleRow;
        if (
            this.getRowCount() &&
            (vc = this.renderer.visibleColumns[x]) &&
            (vr = this.renderer.visibleRows[y + this.getHeaderRowCount()])
        ) {
            x = vc.columnIndex;
            y = vr.rowIndex;
            this.clearSelections();
            this.select(x, y, 0, 0);
            this.setMouseDown(this.newPoint(x, y));
            this.setDragExtent(this.newPoint(0, 0));
            this.repaint();
        }
    }

    selectToViewportCell(x: number, y: number) {
        let selections: Rectangle[];
        let vc: Renderer.VisibleColumn;
        let vr: Renderer.VisibleRow;
        if (
            (selections = this.getSelections()) && selections.length &&
            (vc = this.renderer.visibleColumns[x]) &&
            (vr = this.renderer.visibleRows[y + this.getHeaderRowCount()])
        ) {
            const origin = selections[0].origin;
            x = vc.columnIndex;
            y = vr.rowIndex;
            this.setDragExtent(this.newPoint(x - origin.x, y - origin.y));
            this.select(origin.x, origin.y, x - origin.x, y - origin.y);
            this.repaint();
        }
    }

    selectToFinalCellOfCurrentRow() {
        this.selectFinalCellOfCurrentRow(true);
    }

    selectFinalCellOfCurrentRow(to?: boolean) {
        if (!this.getRowCount()) {
            return;
        }
        const selections = this.getSelections();
        if (selections && selections.length) {
            const selection = selections[0];
            const origin = selection.origin;
            const extent = selection.extent;
            const columnCount = this.getColumnCount();

            this.scrollBy(columnCount, 0);

            this.clearSelections();
            if (to) {
                this.select(origin.x, origin.y, columnCount - origin.x - 1, extent.y);
            } else {
                this.select(columnCount - 1, origin.y, 0, 0);
            }

            this.repaint();
        }
    }

    selectToFirstCellOfCurrentRow() {
        this.selectFirstCellOfCurrentRow(true);
    }

    selectFirstCellOfCurrentRow(to?: boolean) {
        if (!this.getRowCount()) {
            return;
        }
        const selections = this.getSelections();
        if (selections && selections.length) {
            const selection = selections[0];
            const origin = selection.origin;
            const extent = selection.extent;

            this.clearSelections();
            if (to) {
                this.select(origin.x, origin.y, -origin.x, extent.y);
            } else {
                this.select(0, origin.y, 0, 0);
            }

            this.setHScrollValue(0);
            this.repaint();
        }
    }

    selectFinalCell() {
        if (!this.getRowCount()) {
            return;
        }
        this.selectCellAndScrollToMakeVisible(this.getColumnCount() - 1, this.getRowCount() - 1);
        this.repaint();
    }

    selectToFinalCell() {
        if (!this.getRowCount()) {
            return;
        }
        const selections = this.getSelections();
        if (selections && selections.length) {
            const selection = selections[0];
            const origin = selection.origin;
            const columnCount = this.getColumnCount();
            const rowCount = this.getRowCount();

            this.clearSelections();
            this.select(origin.x, origin.y, columnCount - origin.x - 1, rowCount - origin.y - 1);
            // this.scrollBy(columnCount, rowCount);
            this.repaint();
        }
    }

    /**
     * @returns An object that represents the currently selection row.
     */
    getSelectedRow() {
        const sels = this.selectionModel.getSelections();
        if (sels.length) {
            const behavior = this.behavior;
            const colCount = this.getColumnCount();
            const topRow = sels[0].origin.y;
            const row = {
                    //hierarchy: behavior.getFixedColumnValue(0, topRow)
                };

            for (let c = 0; c < colCount; c++) {
                row[behavior.getActiveColumn(c).header] = behavior.getValue(c, topRow);
            }

            return row;
        } else {
            return undefined;
        }
    }

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and dispatch a `fin-selection-changed` event.
     */
    selectionChanged(silent?: boolean) {
        // Project the cell selection into the rows
        this.selectRowsFromCells();

        // Project the cell selection into the columns
        this.selectColumnsFromCells();

        if (!silent) {
            this.canvas.dispatchEvent(new CustomEvent('fin-selection-changed', {
                detail: new SelectionDetailAccessor(this),
            }));
        }
    }

    isColumnOrRowSelected() {
        return this.selectionModel.isColumnOrRowSelected();
    }

    selectColumn(x1: number, x2?: number) {
        this.selectionModel.selectColumn(x1, x2);
    }

    selectRow(y1: number, y2: number) {
        const sm = this.selectionModel;

        if (this.singleSelect()) {
            y1 = y2;
        } else if (y2 === undefined) {
            y2 = y1;
        }

        sm.selectRow(Math.min(y1, y2), Math.max(y1, y2));
    }

    selectRowsFromCells() {
        if (!this.properties.checkboxOnlyRowSelections && this.properties.autoSelectRows) {
            let last: Rectangle;

            if (!this.properties.singleRowSelectionMode) {
                this.selectionModel.selectRowsFromCells(0, true);
            } else if ((last = this.selectionModel.getLastSelection())) {
                this.selectRow(null, last.corner.y);
            } else {
                this.clearRowSelection();
            }
            this.fireSyntheticRowSelectionChangedEvent();
        }
    }

    selectColumnsFromCells() {
        if (this.properties.autoSelectColumns) {
            this.selectionModel.selectColumnsFromCells();
        }
    }

    getSelectedRows() {
        return this.behavior.getSelectedRows();
    }

    getSelectedColumns() {
        return this.behavior.getSelectedColumns();
    }

    getSelections() {
        return this.behavior.getSelections();
    }

    getLastSelectionType(n?: number) {
        return this.selectionModel.getLastSelectionType(n);
    }

    isInCurrentSelectionRectangle(x: number, y: number) {
        return this.selectionModel.isInCurrentSelectionRectangle(x, y);
    }

    selectAllRows() {
        this.selectionModel.selectAllRows();
    }

    areAllRowsSelected() {
        return this.selectionModel.areAllRowsSelected();
    }

    toggleSelectAllRows() {
        if (this.areAllRowsSelected()) {
            this.selectionModel.clear();
        } else {
            this.selectAllRows();
        }
        this.repaint();
    }

    /**
     * @summary Move cell selection by offset.
     * @desc Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
     * @param offsetX - x offset
     * @param offsetY - y offset
     */
    moveSingleSelect(offsetX: number, offsetY: number) {
        const mouseCorner = Point.plus(this.getMouseDown(), this.getDragExtent());
        this.moveToSingleSelect(
            mouseCorner.x + offsetX,
            mouseCorner.y + offsetY
        );
    }

    /**
     * @summary Move cell selection by offset.
     * @desc Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
     * @param newX - x coordinate to start at
     * @param newY - y coordinate to start at
     */
    moveToSingleSelect(newX: number, newY: number) {
        let maxColumns = this.getColumnCount() - 1;
        let maxRows = this.getRowCount() - 1;

        const maxViewableColumns = this.getVisibleColumnsCount() - 1;
        const maxViewableRows = this.getVisibleRowsCount() - 1;

        if (!this.properties.scrollingEnabled) {
            maxColumns = Math.min(maxColumns, maxViewableColumns);
            maxRows = Math.min(maxRows, maxViewableRows);
        }

        newX = Math.min(maxColumns, Math.max(0, newX));
        newY = Math.min(maxRows, Math.max(0, newY));

        this.clearSelections();
        this.select(newX, newY, 0, 0);
        this.setMouseDown(this.newPoint(newX, newY));
        this.setDragExtent(this.newPoint(0, 0));

        this.selectCellAndScrollToMakeVisible(newX, newY);

        this.repaint();
    }

    /** @summary Extend cell selection by offset.
     * @desc Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
     * @param offsetX - x coordinate to start at
     * @param offsetY - y coordinate to start at
     */
    extendSelect(offsetX: number, offsetY: number) {
        let maxColumns = this.getColumnCount() - 1;
        let maxRows = this.getRowCount() - 1;

        const maxViewableColumns = this.renderer.visibleColumns.length - 1;
        const maxViewableRows = this.renderer.visibleRows.length - 1;

        const origin = this.getMouseDown();
        const extent = this.getDragExtent();

        let newX = extent.x + offsetX;
        let newY = extent.y + offsetY;

        if (!this.properties.scrollingEnabled) {
            maxColumns = Math.min(maxColumns, maxViewableColumns);
            maxRows = Math.min(maxRows, maxViewableRows);
        }

        newX = Math.min(maxColumns - origin.x, Math.max(-origin.x, newX));
        newY = Math.min(maxRows - origin.y, Math.max(-origin.y, newY));

        this.clearMostRecentSelection();

        this.select(origin.x, origin.y, newX, newY);
        this.setDragExtent(this.newPoint(newX, newY));

        const colScrolled = this.insureModelColIsVisible(newX + origin.x, offsetX);
        const rowScrolled = this.insureModelRowIsVisible(newY + origin.y, offsetY);

        this.repaint();

        return colScrolled || rowScrolled;
    }

    /**
     * @param useAllCells - Search in all rows and columns instead of only rendered ones.
     */
    getGridCellFromLastSelection(useAllCells: boolean) {
        const sel = this.selectionModel.getLastSelection();
        if (sel === undefined) {
            return undefined;
        } else {
            const cellEvent = new CellEvent(this);
            cellEvent.resetGridXDataY(sel.origin.x, sel.origin.y, null, useAllCells);
            return cellEvent;
        }
    }


    /**
     * @param hiddenColumns - One of:
     * `false` - Active column list
     * `true` - All column list
     * `Array` - Active column list with listed columns prefixed as needed (when not already in the list). Each item in the array may be either:
     * * `number` - index into all column list
     * * `string` - name of a column from the all column list
     */
    private getActiveAllOrSpecifiedColumns(hiddenColumns: boolean | number[] | string[]): Column[] {
        let columns: Column[];
        const allColumns = this.behavior.getColumns();
        const activeColumns = this.behavior.getActiveColumns();

        if (Array.isArray(hiddenColumns)) {
            columns = [];
            hiddenColumns.forEach((index: number | string) => {
                const key = typeof index === 'number' ? 'index' : 'name';
                const column = allColumns.find((column) => { return column[key] === index; });
                if (activeColumns.indexOf(column) < 0) {
                    columns.push(column);
                }
            });
            columns = columns.concat(activeColumns);
        } else {
            columns = hiddenColumns ? allColumns : activeColumns;
        }

        return columns;
    }

    private normalizeRect(rect: Rectangle) {
        const o = rect.origin;
        const c = rect.corner;

        const ox = Math.min(o.x, c.x);
        const oy = Math.min(o.y, c.y);

        const cx = Math.max(o.x, c.x);
        const cy = Math.max(o.y, c.y);

        return new SelectionRectangle(ox, oy, cx - ox, cy - oy);
    }

    /**
     * @returns '' if data value is undefined
     */
    private valOrFunc(dataRow: DataModel.DataRowObject, column: Column): (DataModel.DataValue | '') {
        let result: DataModel.DataValue;
        if (dataRow) {
            result = dataRow[column.name];
            const calculator = (((typeof result)[0] === 'f' && result) || column.calculator) as DataModel.ColumnSchema.CalculateFunction;
            if (calculator) {
                result = calculator(dataRow, column.name);
            }
        }
        return result || result === 0 || result === false ? result : '';
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
    //  * @memberOf Hypergrid#
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
    //  * @memberOf Hypergrid#
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
    //  * var myTheme = require('fin-hypergrid-themes').buildTheme();
    //  * ```
    //  * If omitted, unregister the theme named in the first parameter.
    //  *
    //  * Grid instances that have previously applied the named theme are unaffected by this action (whether re-registering or unregistering).
    //  * @memberOf Hypergrid.
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
    //  * Hypergrind.registerThemes(require('fin-hypergrid-themes'));
    //  * ```
    //  * @param {object} themeCollection
    //  * @memberOf Hypergrid.
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
    //  * @memberOf Hypergrid.
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

    setScrollingNow(isItNow: boolean) {
        this.scrollingNow = isItNow;
    }

    /**
     * @returns The `scrollingNow` field.
     */
    isScrollingNow() {
        return this.scrollingNow;
    }

    /**
     * @summary Scroll horizontal and vertically by the provided offsets.
     * @param offsetX - Scroll in the x direction this much.
     * @param offsetY - Scroll in the y direction this much.
     */
    scrollBy(offsetX: number, offsetY: number) {
        this.scrollHBy(offsetX);
        this.scrollVBy(offsetY);
    }

    /**
     * @summary Scroll vertically by the provided offset.
     * @param offsetY - Scroll in the y direction this much.
     */
    scrollVBy(offsetY: number) {
        const max = this.sbVScroller.range.max;
        const oldValue = this.getVScrollValue();
        const newValue = Math.min(max, Math.max(0, oldValue + offsetY));
        if (newValue !== oldValue) {
            this.setVScrollValue(newValue);
        }
    }

    /**
     * @summary Scroll horizontally by the provided offset.
     * @param offsetX - Scroll in the x direction this much.
     */
    scrollHBy(offsetX: number) {
        const max = this.sbHScroller.range.max;
        const oldValue = this.getHScrollValue();
        const newValue = Math.min(max, Math.max(0, oldValue + offsetX));
        if (newValue !== oldValue) {
            this.setHScrollValue(newValue);
        }
    }

    scrollToMakeVisible(c: number, r: number) {
        let delta: number;
        const dw = this.renderer.dataWindow;
        const fixedColumnCount = this.properties.fixedColumnCount;
        const fixedRowCount = this.properties.fixedRowCount;

        // scroll only if target not in fixed columns
        if (c >= fixedColumnCount) {
            // target is to left of scrollable columns; negative delta scrolls left
            if ((delta = c - dw.origin.x) < 0) {
                this.sbHScroller.index += delta;

                // target is to right of scrollable columns; positive delta scrolls right
                // Note: The +1 forces right-most column to scroll left (just in case it was only partially in view)
            } else if ((c - dw.corner.x) > 0) {
                this.sbHScroller.index = this.renderer.getMinimumLeftPositionToShowColumn(c);
            }
        }

        if (
            r >= fixedRowCount && // scroll only if target not in fixed rows
            (
                // target is above scrollable rows; negative delta scrolls up
                (delta = r - dw.origin.y - 1) < 0 ||

                // target is below scrollable rows; positive delta scrolls down
                (delta = r - dw.corner.y) > 0
            )
        ) {
            this.sbVScroller.index += delta;
        }
    }

    selectCellAndScrollToMakeVisible(c: number, r: number) {
        this.scrollToMakeVisible(c, r);
        this.selectCell(c, r, true);
    }

    /**
     * @desc Set the vertical scroll value.
     * @param newValue - The new scroll value.
     */
    setVScrollValue(y: number) {
        y = Math.min(this.sbVScroller.range.max, Math.max(0, Math.round(y)));
        if (y !== this.vScrollValue) {
            this.behavior.setScrollPositionY(y);
            this.behavior.changed();
            const oldY = this.vScrollValue;
            this.vScrollValue = y;
            this.scrollValueChangedNotification();
            setTimeout(() => {
                // self.sbVRangeAdapter.subjectChanged();
                this.fireScrollEvent('fin-scroll-y', oldY, y);
            });
        }
    }

    /**
     * @return The vertical scroll value.
     */
    getVScrollValue(): number {
        return this.vScrollValue;
    }

    /**
     * @desc Set the horizontal scroll value.
     * @param x - The new scroll value.
     */
    setHScrollValue(x: number) {
        x = Math.min(this.sbHScroller.range.max, Math.max(0, Math.round(x)));
        if (x !== this.hScrollValue) {
            this.behavior.setScrollPositionX(x);
            this.behavior.changed();
            const oldX = this.hScrollValue;
            this.hScrollValue = x;
            this.scrollValueChangedNotification();
            setTimeout(() => {
                //self.sbHRangeAdapter.subjectChanged();
                this.fireScrollEvent('fin-scroll-x', oldX, x);
                //self.synchronizeScrollingBoundries(); // todo: Commented off to prevent the grid from bouncing back, but there may be repercussions...
            });
        }
    }

    /**
     * @returns The vertical scroll value.
     */
    getHScrollValue() {
        return this.hScrollValue;
    }

    /**
     * @desc Initialize the scroll bars.
     */
    initScrollbars() {
        if (this.sbHScroller && this.sbVScroller){
            return;
        }

        const horzBar = new FinBar({
            orientation: FinBar.OrientationEnum.horizontal,
            deltaXFactor: this.properties.wheelHFactor,
            onchange: (index) => this.setHScrollValue(index),
            cssStylesheetReferenceElement: this.containerHtmlElement
        });

        const vertBar = new FinBar({
            orientation: FinBar.OrientationEnum.vertical,
            deltaYFactor: this.properties.wheelVFactor,
            onchange: (index) => this.setVScrollValue(index),
            cssStylesheetReferenceElement: this.containerHtmlElement,
            paging: {
                up: () => this.pageUp(),
                down: () => this.pageDown()
            }
        });

        this.sbHScroller = horzBar;
        this.sbVScroller = vertBar;

        const hPrefix = this.properties.hScrollbarClassPrefix;
        const vPrefix = this.properties.vScrollbarClassPrefix;

        if (hPrefix && hPrefix !== '') {
            this.sbHScroller.classPrefix = hPrefix;
        }

        if (vPrefix && vPrefix !== '') {
            this.sbVScroller.classPrefix = vPrefix;
        }

        this.containerHtmlElement.appendChild(horzBar.bar);
        this.containerHtmlElement.appendChild(vertBar.bar);

        this.resizeScrollbars();
    }

    resizeScrollbars() {
        this.sbHScroller.shortenBy(this.sbVScroller).resize();
        //this.sbVScroller.shortenBy(this.sbHScroller);
        this.sbVScroller.resize();
    }

    /**
     * @desc Scroll values have changed, we've been notified.
     */
    setVScrollbarValues(max: number) {
        this.sbVScroller.range = {
            min: 0,
            max: max
        };
    }

    setHScrollbarValues(max: number) {
        this.sbHScroller.range = {
            min: 0,
            max: max
        };
    }

    scrollValueChangedNotification() {
        if (
            this.hScrollValue !== this.sbPrevHScrollValue ||
            this.vScrollValue !== this.sbPrevVScrollValue
        ) {
            this.sbPrevHScrollValue = this.hScrollValue;
            this.sbPrevVScrollValue = this.vScrollValue;

            if (this.cellEditor) {
                this.cellEditor.scrollValueChangedNotification();
            }

            this.computeCellsBounds();
        }
    }

    /**
     * @desc The data dimensions have changed, or our pixel boundaries have changed.
     * Adjust the scrollbar properties as necessary.
     */
    synchronizeScrollingBoundaries() {
        const bounds = this.getBounds();
        if (!bounds) {
            return;
        }

        const numFixedColumns = this.getFixedColumnCount();
        const numColumns = this.getColumnCount();
        const numRows = this.getRowCount();
        const scrollableWidth = bounds.width - this.behavior.getFixedColumnsMaxWidth();
        const gridProps = this.properties;
        const borderBox = gridProps.boxSizing === 'border-box';
        let lineGap = borderBox ? 0 : gridProps.gridLinesVWidth;
        let columnsWidth = 0;
        let lastPageColumnCount = 0;

        while (lastPageColumnCount < numColumns && columnsWidth < scrollableWidth) {
            columnsWidth += this.getColumnWidth(numColumns - lastPageColumnCount - 1) + lineGap;
            lastPageColumnCount++;
        }
        if (columnsWidth > scrollableWidth) {
            lastPageColumnCount--;
        }

        const scrollableHeight = this.renderer.getVisibleScrollHeight();
        lineGap = borderBox ? 0 : gridProps.gridLinesHWidth;
        let rowsHeight = 0;
        let lastPageRowCount = 0;

        while (lastPageRowCount < numRows && rowsHeight < scrollableHeight) {
            rowsHeight += this.getRowHeight(numRows - lastPageRowCount - 1) + lineGap;
            lastPageRowCount++;
        }
        if (rowsHeight > scrollableHeight) {
            lastPageRowCount--;
        }

        // inform scroll bars
        if (this.sbHScroller) {
            const hMax = Math.max(0, numColumns - numFixedColumns - lastPageColumnCount);
            this.setHScrollbarValues(hMax);
            this.setHScrollValue(Math.min(this.getHScrollValue(), hMax));
        }
        if (this.sbVScroller) {
            const vMax = Math.max(0, numRows - gridProps.fixedRowCount - lastPageRowCount);
            this.setVScrollbarValues(vMax);
            this.setVScrollValue(Math.min(this.getVScrollValue(), vMax));
        }

        this.computeCellsBounds();

        // schedule to happen *after* the repaint
        setTimeout(() => this.resizeScrollbars());
    }

    /**
     * @desc Scroll up one full page.
     */
    pageUp() {
        const rowNum = this.renderer.getPageUpRow();
        this.setVScrollValue(rowNum);
        return rowNum;
    }

    /**
     * @desc Scroll down one full page.
     */
    pageDown() {
        const rowNum = this.renderer.getPageDownRow();
        this.setVScrollValue(rowNum);
        return rowNum;
    }

    /**
     * @desc Not yet implemented.
     */
    pageLeft() {
        throw 'page left not yet implemented';
    }

    /**
     * @desc Not yet implemented.
     */
    pageRight() {
        throw 'page right not yet implemented';
    }
    // End Scrolling mixin

    // Begin StashSelections mixin

    /**
     * Save underlying data row indexes backing current grid row selections in `grid.selectedDataRowIndexes`.
     *
     * This call should be paired with a subsequent call to `reselectRowsByUnderlyingIndexes`.
     * @returns Number of selected rows or `undefined` if `restoreRowSelections` is falsy.
     */
    stashRowSelections() {
        if (this.properties.restoreRowSelections) {
            const dataModel = this.behavior.mainDataModel;

            this.selectedDataRowIndexes = this.getSelectedRows().map(
                (selectedRowIndex) => {
                    return dataModel.getRowIndex(selectedRowIndex);
                }
            );

            return this.selectedDataRowIndexes.length;
        } else {
            return undefined;
        }
    }

    /**
     * Re-establish grid row selections based on underlying data row indexes saved by `getSelectedDataRowIndexes` which should be called first.
     *
     * Note that not all previously selected rows will necessarily be available after a data transformation. Even if they appear to be available, if they are not from the same data set, restoring the selections may not make sense. When this is the case, the application should set the `restoreRowSelections` property to `false`.
     * @returns Number of rows reselected or `undefined` if there were no previously selected rows.
     */
    unstashRowSelections() {
        const dataRowIndexes = this.selectedDataRowIndexes;
        if (dataRowIndexes) {
            delete this.selectedDataRowIndexes;

            const dataModel = this.behavior.mainDataModel;
            const rowCount = this.getRowCount();
            let selectedRowCount = dataRowIndexes.length;
            const gridRowIndexes = [];
            const selectionModel = this.selectionModel;

            for (let r = 0; selectedRowCount && r < rowCount; ++r) {
                const i = dataRowIndexes.indexOf(dataModel.getRowIndex(r));
                if (i >= 0) {
                    gridRowIndexes.push(r);
                    delete dataRowIndexes[i]; // might make indexOf increasingly faster as deleted elements are not enumerable
                    selectedRowCount--; // count down so we can bail early if all found
                }
            }

            gridRowIndexes.forEach(function(gridRowIndex) {
                selectionModel.selectRow(gridRowIndex);
            });

            return gridRowIndexes.length;
        } else {
            return undefined;
        }
    }

    /**
     * Save data column names of current column selections in `grid.selectedColumnNames`.
     *
     * This call should be paired with a subsequent call to `reselectColumnsByNames`.
     * @returns Number of selected columns or `undefined` if `restoreColumnSelections` is falsy.
     */
    stashColumnSelections(): number | undefined {
        if (this.properties.restoreColumnSelections) {
            const behavior = this.behavior;

            this.selectedColumnNames = this.getSelectedColumns().map(
                (selectedColumnIndex) => {
                    return behavior.getActiveColumn(selectedColumnIndex).name;
                }
            );

            return this.selectedColumnNames.length;
        } else {
            return undefined;
        }
    }

    /**
     * Re-establish columns selections based on column names saved by `getSelectedColumnNames` which should be called first.
     *
     * Note that not all preveiously selected columns wil necessarily be available after a data transformation. Even if they appear to be available, if they are not from the same data set, restoring the selections may not make sense. When this is the case, the application should set the `restoreRowSelections` property to `false`.
     * @returns Number of rows reselected or `undefined` if there were no previously selected columns.
     */
    unstashColumnSelections(): number | undefined {
        const selectedColumnNames = this.selectedColumnNames;
        if (selectedColumnNames) {
            delete this.selectedColumnNames;

            const behavior = this.behavior;
            const selectionModel = this.selectionModel;

            return selectedColumnNames.reduce( (reselectedCount, columnName) => {
                const activeColumnIndex = behavior.getActiveColumnIndex(columnName);
                if (activeColumnIndex) {
                    selectionModel.selectColumn(activeColumnIndex);
                    reselectedCount++;
                }
                return reselectedCount;
            }, 0);
        } else {
            return undefined;
        }
    }

    // End StashSelections mixin

    private paintLoopRunning() {
        return !this.properties.repaintImmediately && this.canvas.paintLoopRunning();
    }

    private findOrCreateContainer(boundingRect: Hypergrid.BoundingRectStyleValues) {
        const div = document.getElementById('hypergrid');
        const used = div && !div.firstElementChild;

        if (!used) {
            const div = document.createElement('div');
            this.setStyles(div, boundingRect, Hypergrid.boundingRectStyleKeys);
            document.body.appendChild(div);
        }

        return div;
    }

    private setStyles<T extends Hypergrid.EdgeStyleValues | Hypergrid.BoundingRectStyleValues>(el: HTMLElement, style: T, keys: string[]) {
        if (style !== undefined) {
            const elStyle = el.style;
            keys.forEach((key) => {
                if (style[key] !== undefined) {
                    elStyle[key] = style[key];
                }
            });
        }
    }

    // private stringifyFunctions() {
    //     const self = this;
    //     return Object.keys(this).reduce(function(obj, key) {
    //         if (key !== 'toJSON') {
    //             obj[key] = /^function /.test(key)
    //                 ? null // anon func: no point in saving because key itself is already the stringified function
    //                 : self[key].toString() // stringify the function
    //                     .replace(/^function anonymous\(/, 'function(') // clean up Chromium artifact
    //                     .replace('\n/*``*/)', ')'); // clean up Chromium artifact
    //         }
    //         return obj;
    //     }, {});
    // }

}


/**
 * @name plugins
 * @memberOf Hypergrid
 * @type {object}
 * @summary Hash of references to shared plug-ins.
 * @desc Dictionary of shared (pre-installed) plug-ins. Used internally, primarily to avoid reinstallations. See examples for how to reference (albeit there is normally no need to reference plugins directly).
 *
 * For the dictionary of _instance_ plugins, see {@link Hypergrid#plugins|plugins} (defined in the {@link Hypergrid#intialize|Hypergrid constructor}).
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
//     Base: { get: function() { return pleaseUse('fin-hypergrid/src/Base', require('../Base').default); } },
//     images: { get: function() { return pleaseUse('fin-hypergrid/images', require('../../images')); } }
// });


/**
 * @summary List of grid instances.
 * @desc Added in {@link Hypergrid constructor}; removed in {@link Hypergrid#terminate terminate()}.
 * Used in themes.js.
 * @type {Hypergrid[]}
 */


/** @name defaults
 * @memberOf Hypergrid
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
export namespace Hypergrid {
	export interface Options {
		// api?: object | string[];
		behaviorConstructor?: Options.BehaviorConstructor;
		boundingRect?: BoundingRectStyleValues;
		canvasContextAttributes?: CanvasRenderingContext2DSettings;
		container?: string | HTMLElement;
		dataModel?: DataModel;
		dataModelConstructorOrArray?: Options.DataModelConstructorOrArray;
		force?: boolean;
		inject?: boolean;
		localization?: LocalizationOptions;
		margin?: EdgeStyleValues;
		state?: Record<string, unknown>;
        data?: Options.Data;
        schema?: Options.Schema;
        apply?: boolean;
		metadata?: DataModel.RowMetadata[];
		subgrids?: Subgrid.Role[];
	}

    export namespace Options {
        export type Data = DataModel.DataRowObject[] | ((this: void) => DataModel.DataRowObject[]);
        export type Schema = DataModel.RawColumnSchema[] | ((this: void) => DataModel.RawColumnSchema[]);
        export type DataModelConstructor = new (dataModel?: DataModel) => DataModel;
        export type DataModelConstructorOrArray = DataModelConstructor | DataModelConstructor[];
        export type BehaviorConstructor = new () => Behavior;
    }

    export interface ListenerInfo {
        internal: boolean;
        listener: EventListener;
        decorator: EventListener;
    }

    export interface LocalizationOptions {
        locale?: string;
        numberOptions?: NumberFormatter.Options;
        dateOptions?: DateFormatter.Options;
    }

    /**
     * @name localization
     * @summary Shared localization defaults for all grid instances.
     * @desc These property values are overridden by those supplied in the `Hypergrid` constructor's `options.localization`.
     * @property locale - The default locale to use when an explicit `locale` is omitted from localizer constructor calls. Passed to Intl.NumberFormat` and `Intl.DateFormat`. See {@see https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation|Locale identification and negotiation} for more information. Omitting will use the runtime's local language and region.
     * @property numberOptions - Options passed to `Intl.NumberFormat` for creating the basic "number" localizer.
     * @property dateOptions - Options passed to `Intl.DateFormat` for creating the basic "date" localizer.
     */
    export const defaultLocalizationOptions: LocalizationOptions = {
        locale: 'en-US',
        numberOptions: { maximumFractionDigits: 0 }
    };

    export interface GridEvent {
        source: Hypergrid;
    }

    export interface ScrollEvent {
        oldValue: number,
        value: number,
    }

    export interface RenderOverridesCache {
        floater: RenderOverridesCache.Floater | null;
        dragger: RenderOverridesCache.Dragger | null;
    }

    export namespace RenderOverridesCache {
        export type Key = keyof RenderOverridesCache;

        export interface Floater {
            columnIndex: number;
            ctx: CanvasRenderingContext2D;
            startX: number;
            width: number;
            height: number;
            hdpiratio: number;
        }

        export interface Dragger {
            columnIndex: number;
            startIndex: number;
            ctx: CanvasRenderingContext2D;
            startX: number;
            width: number;
            height: number;
            hdpiratio: number;
        }

        export const empty: RenderOverridesCache = {
            floater: null,
            dragger: null,
        }
    }

    export interface EdgeStyleValues {
		top?: string;
		right?: string;
		bottom?: string;
		left?: string;
    }

    export const edgeStyleKeys: Array<keyof EdgeStyleValues> = ['top', 'bottom', 'left', 'right'];

	export interface BoundingRectStyleValues extends EdgeStyleValues
	{
		width?: string;
		height?: string;
		position?: string;
	}

    export const boundingRectStyleKeys: Array<keyof BoundingRectStyleValues> = [ ...edgeStyleKeys, 'width', 'height', 'position'];

    export interface ColumnsDataValuesObject {
        [columnName: string]: DataModel.DataValue[];
    }

    export const grids = Array<Hypergrid>();
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
