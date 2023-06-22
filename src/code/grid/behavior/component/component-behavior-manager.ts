import { CanvasManager } from '../../components/canvas/canvas-manager';
import { ColumnsManager } from '../../components/column/columns-manager';
import { Focus } from '../../components/focus/focus';
import { Mouse } from '../../components/mouse/mouse';
import { Renderer } from '../../components/renderer/renderer';
import { Scroller } from '../../components/scroller/scroller';
import { Selection } from '../../components/selection/selection';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../components/view/view-layout';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { CellPropertiesBehavior } from './cell-properties-behavior';
import { DataExtractBehavior } from './data-extract-behavior';
import { EventBehavior } from './event-behavior';
import { FocusScrollBehavior } from './focus-scroll-behavior';
import { FocusSelectBehavior } from './focus-select-behavior';
import { ReindexBehavior } from './reindex-behavior';
import { RowPropertiesBehavior } from './row-properties-behavior';
import { ServerNotificationBehavior } from './server-notification-behavior';

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
export class ComponentBehaviorManager<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField<BCS>> {
    readonly focusScrollBehavior: FocusScrollBehavior<BGS, BCS, SF>;
    readonly focusSelectBehavior: FocusSelectBehavior<BGS, BCS, SF>;
    readonly eventBehavior: EventBehavior<BGS, BCS, SF>;
    readonly reindexBehavior: ReindexBehavior<BGS, BCS, SF>;
    readonly rowPropertiesBehavior: RowPropertiesBehavior<BGS, BCS, SF>;
    readonly cellPropertiesBehavior: CellPropertiesBehavior<BGS, BCS, SF>;
    readonly dataExtractBehavior: DataExtractBehavior<BCS, SF>;

    private readonly _serverNotificationBehavior: ServerNotificationBehavior<BGS, BCS, SF>;

    constructor(
        gridSettings: BGS,
        canvasManager: CanvasManager<BGS>,
        columnsManager: ColumnsManager<BCS, SF>,
        subgridsManager: SubgridsManager<BCS, SF>,
        viewLayout: ViewLayout<BGS, BCS, SF>,
        focus: Focus<BGS, BCS, SF>,
        selection: Selection<BCS, SF>,
        mouse: Mouse<BGS, BCS, SF>,
        renderer: Renderer<BGS, BCS, SF>,
        horizontalScroller: Scroller<BGS>,
        verticalScroller: Scroller<BGS>,
        descendantEventer: EventBehavior.DescendantEventer<BCS, SF>,
    ) {
        this.eventBehavior = new EventBehavior(
            gridSettings.eventDispatchEnabled,
            canvasManager,
            columnsManager,
            viewLayout,
            focus,
            selection,
            mouse,
            renderer,
            horizontalScroller,
            verticalScroller,
            descendantEventer,
            (event) => canvasManager.dispatchEvent(event),
        );

        this.reindexBehavior = new ReindexBehavior(
            focus,
            selection
        );

        this._serverNotificationBehavior = new ServerNotificationBehavior(
            columnsManager,
            subgridsManager,
            viewLayout,
            focus,
            selection,
            renderer,
            this.reindexBehavior,
        );

        this.focusScrollBehavior = new FocusScrollBehavior(
            gridSettings,
            columnsManager,
            subgridsManager,
            viewLayout,
            focus,
        );

        this.focusSelectBehavior = new FocusSelectBehavior(
            gridSettings,
            selection,
            focus,
            viewLayout,
            (x, y, subgrid) => {
                // if (subgrid === this._focus.subgrid && x >= this.gridSettings.fixedColumnCount && y >= this.gridSettings.fixedRowCount) {
                //     this.focusBehavior.focusXYAndEnsureInView(x, y)
                // }
            },
        );

        this.rowPropertiesBehavior = new RowPropertiesBehavior(
            viewLayout,
        );

        this.cellPropertiesBehavior = new CellPropertiesBehavior(
            columnsManager,
            subgridsManager,
            viewLayout,
        );

        this.dataExtractBehavior = new DataExtractBehavior(
            selection,
            columnsManager
        );
    }

    destroy() {
        this._serverNotificationBehavior.destroy();
        this.eventBehavior.destroy();
    }

    allowEvents(allow: boolean){
        if (allow){
            this._serverNotificationBehavior.enableNotifications();
        } else {
            this._serverNotificationBehavior.disableNotifications();
        }
    }
}
