import { RevClientObject, RevSchemaField } from '../../common';
import { RevCanvas } from '../components/canvas/canvas';
import { RevColumnsManager } from '../components/column/columns-manager';
import { RevFocus } from '../components/focus/focus';
import { RevMouse } from '../components/mouse/mouse';
import { RevRenderer } from '../components/renderer/renderer';
import { RevScroller } from '../components/scroller/scroller';
import { RevSelection } from '../components/selection/selection';
import { RevSubgridsManager } from '../components/subgrid/subgrids-manager';
import { RevViewLayout } from '../components/view/view-layout';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../settings';
import { RevCellPropertiesBehavior } from './cell-properties-behavior';
import { RevDataExtractBehavior } from './data-extract-behavior';
import { RevEventBehavior } from './event-behavior';
import { RevFocusScrollBehavior } from './focus-scroll-behavior';
import { RevFocusSelectBehavior } from './focus-select-behavior';
import { RevReindexBehavior } from './reindex-behavior';
import { RevRowPropertiesBehavior } from './row-properties-behavior';
import { RevServerNotificationBehavior } from './server-notification-behavior';

/** @internal */
export class RevBehaviorManager<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    readonly focusScrollBehavior: RevFocusScrollBehavior<BGS, BCS, SF>;
    readonly focusSelectBehavior: RevFocusSelectBehavior<BGS, BCS, SF>;
    readonly eventBehavior: RevEventBehavior<BGS, BCS, SF>;
    readonly reindexBehavior: RevReindexBehavior<BGS, BCS, SF>;
    readonly rowPropertiesBehavior: RevRowPropertiesBehavior<BGS, BCS, SF>;
    readonly cellPropertiesBehavior: RevCellPropertiesBehavior<BGS, BCS, SF>;
    readonly dataExtractBehavior: RevDataExtractBehavior<BGS, BCS, SF>;

    private readonly _serverNotificationBehavior: RevServerNotificationBehavior<BGS, BCS, SF>;

    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        gridSettings: BGS,
        canvas: RevCanvas<BGS>,
        columnsManager: RevColumnsManager<BCS, SF>,
        subgridsManager: RevSubgridsManager<BCS, SF>,
        viewLayout: RevViewLayout<BGS, BCS, SF>,
        focus: RevFocus<BGS, BCS, SF>,
        selection: RevSelection<BGS, BCS, SF>,
        mouse: RevMouse<BGS, BCS, SF>,
        renderer: RevRenderer<BGS, BCS, SF>,
        horizontalScroller: RevScroller<BGS, BCS, SF>,
        verticalScroller: RevScroller<BGS, BCS, SF>,
        descendantEventer: RevEventBehavior.DescendantEventer<BCS, SF>,
    ) {
        this.eventBehavior = new RevEventBehavior(
            this.clientId,
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

        this.reindexBehavior = new RevReindexBehavior(
            this.clientId,
            this,
            focus,
            selection
        );

        this._serverNotificationBehavior = new RevServerNotificationBehavior(
            this.clientId,
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

        this.focusScrollBehavior = new RevFocusScrollBehavior(
            this.clientId,
            this,
            gridSettings,
            columnsManager,
            subgridsManager,
            viewLayout,
            focus,
        );

        this.focusSelectBehavior = new RevFocusSelectBehavior(
            this.clientId,
            this,
            gridSettings,
            columnsManager,
            selection,
            focus,
            viewLayout,
        );

        this.rowPropertiesBehavior = new RevRowPropertiesBehavior(
            this.clientId,
            this,
            viewLayout,
        );

        this.cellPropertiesBehavior = new RevCellPropertiesBehavior(
            this.clientId,
            this,
            columnsManager,
            subgridsManager,
            viewLayout,
        );

        this.dataExtractBehavior = new RevDataExtractBehavior(
            this.clientId,
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
