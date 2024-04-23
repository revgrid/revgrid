import { Canvas } from '../components/canvas/canvas';
import { ColumnsManager } from '../components/column/columns-manager';
import { Focus } from '../components/focus/focus';
import { Mouse } from '../components/mouse/mouse';
import { Renderer } from '../components/renderer/renderer';
import { Scroller } from '../components/scroller/scroller';
import { Selection } from '../components/selection/selection';
import { SubgridsManager } from '../components/subgrid/subgrids-manager';
import { ViewLayout } from '../components/view/view-layout';
import { SchemaField } from '../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../interfaces/settings/behaviored-grid-settings';
import { RevgridObject } from '../types-utils/revgrid-object';
import { CellPropertiesBehavior } from './cell-properties-behavior';
import { DataExtractBehavior } from './data-extract-behavior';
import { EventBehavior } from './event-behavior';
import { FocusScrollBehavior } from './focus-scroll-behavior';
import { FocusSelectBehavior } from './focus-select-behavior';
import { ReindexBehavior } from './reindex-behavior';
import { RowPropertiesBehavior } from './row-properties-behavior';
import { ServerNotificationBehavior } from './server-notification-behavior';

/** @internal */
export class BehaviorManager<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> implements RevgridObject {
    readonly focusScrollBehavior: FocusScrollBehavior<BGS, BCS, SF>;
    readonly focusSelectBehavior: FocusSelectBehavior<BGS, BCS, SF>;
    readonly eventBehavior: EventBehavior<BGS, BCS, SF>;
    readonly reindexBehavior: ReindexBehavior<BGS, BCS, SF>;
    readonly rowPropertiesBehavior: RowPropertiesBehavior<BGS, BCS, SF>;
    readonly cellPropertiesBehavior: CellPropertiesBehavior<BGS, BCS, SF>;
    readonly dataExtractBehavior: DataExtractBehavior<BGS, BCS, SF>;

    private readonly _serverNotificationBehavior: ServerNotificationBehavior<BGS, BCS, SF>;

    constructor(
        readonly revgridId: string,
        readonly internalParent: RevgridObject,
        gridSettings: BGS,
        canvas: Canvas<BGS>,
        columnsManager: ColumnsManager<BCS, SF>,
        subgridsManager: SubgridsManager<BCS, SF>,
        viewLayout: ViewLayout<BGS, BCS, SF>,
        focus: Focus<BGS, BCS, SF>,
        selection: Selection<BGS, BCS, SF>,
        mouse: Mouse<BGS, BCS, SF>,
        renderer: Renderer<BGS, BCS, SF>,
        horizontalScroller: Scroller<BGS, BCS, SF>,
        verticalScroller: Scroller<BGS, BCS, SF>,
        descendantEventer: EventBehavior.DescendantEventer<BCS, SF>,
    ) {
        this.eventBehavior = new EventBehavior(
            this.revgridId,
            this,
            gridSettings.eventDispatchEnabled,
            canvas,
            columnsManager,
            viewLayout,
            focus,
            selection,
            mouse,
            renderer,
            horizontalScroller,
            verticalScroller,
            descendantEventer,
            (event) => canvas.dispatchEvent(event),
        );

        this.reindexBehavior = new ReindexBehavior(
            this.revgridId,
            this,
            focus,
            selection
        );

        this._serverNotificationBehavior = new ServerNotificationBehavior(
            this.revgridId,
            this,
            columnsManager,
            subgridsManager,
            viewLayout,
            focus,
            selection,
            renderer,
            this.eventBehavior,
            this.reindexBehavior,
        );

        this.focusScrollBehavior = new FocusScrollBehavior(
            this.revgridId,
            this,
            gridSettings,
            columnsManager,
            subgridsManager,
            viewLayout,
            focus,
        );

        this.focusSelectBehavior = new FocusSelectBehavior(
            this.revgridId,
            this,
            gridSettings,
            selection,
            focus,
            viewLayout,
        );

        this.rowPropertiesBehavior = new RowPropertiesBehavior(
            this.revgridId,
            this,
            viewLayout,
        );

        this.cellPropertiesBehavior = new CellPropertiesBehavior(
            this.revgridId,
            this,
            columnsManager,
            subgridsManager,
            viewLayout,
        );

        this.dataExtractBehavior = new DataExtractBehavior(
            this.revgridId,
            this,
            selection,
            columnsManager
        );
    }

    get active() { return this._serverNotificationBehavior.notificationsEnabled; }
    set active(value: boolean){
        if (value){
            this._serverNotificationBehavior.enableNotifications();
        } else {
            this._serverNotificationBehavior.disableNotifications();
        }
    }

    destroy() {
        this._serverNotificationBehavior.destroy();
        this.eventBehavior.destroy();
    }
}
