import {
    AssertError,
    GridSettingChangeInvalidateType,
    GridSettingChangeInvalidateTypeId,
    GridSettings,
    GridSettingsBehavior,
    UnreachableCaseError
} from '../../grid/grid-public-api';

/** @public */
export abstract class InMemoryBehavioredSettings implements GridSettingsBehavior {
    /** @internal */
    viewRenderInvalidatedEventer: GridSettingsBehavior.ViewRenderInvalidatedEventer;
    /** @internal */
    viewLayoutInvalidatedEventer: GridSettingsBehavior.ViewLayoutInvalidatedEventer;
    /** @internal */
    horizontalViewLayoutInvalidatedEventer: GridSettingsBehavior.ViewLayoutInvalidatedEventer;
    /** @internal */
    verticalViewLayoutInvalidatedEventer: GridSettingsBehavior.ViewLayoutInvalidatedEventer;
    /** @internal */
    resizeEventer: GridSettingsBehavior.ResizeEventer;

    /** @internal */
    private _beginChangeCount = 0;
    /** @internal */
    private _beginChangeInvalidateType: GridSettingChangeInvalidateTypeId | undefined;
    /** @internal */
    private _changedEventHandlers =  new Array<GridSettingsBehavior.ChangedEventHandler>();


    beginChange() {
        if (this._beginChangeCount++ === 0) {
            this._beginChangeInvalidateType = undefined;
        }
    }

    endChange() {
        if (--this._beginChangeCount === 0) {
            if (this._beginChangeInvalidateType !== undefined) {
                this.notifyChanged(this._beginChangeInvalidateType);
                this._beginChangeInvalidateType = undefined;
            }
        } else {
            if (this._beginChangeCount < 0) {
                throw new AssertError('IMDBSEC65997');
            }
        }
    }

    subscribeChangedEvent(handler: GridSettingsBehavior.ChangedEventHandler) {
        this._changedEventHandlers.push(handler);
    }

    unsubscribeChangedEvent(handler: GridSettingsBehavior.ChangedEventHandler) {
        const index = this._changedEventHandlers.indexOf(handler);
        if (index < 0) {
            throw new AssertError('IMBSUCE23445');
        } else {
            this._changedEventHandlers.splice(index, 1);
        }
    }

    abstract load(settings: GridSettings): void;

    /** @internal */
    protected notifyChangedViewRender() {
        this.notifyChanged(GridSettingChangeInvalidateTypeId.ViewRender);
    }

    /** @internal */
    protected notifyChanged(invalidateType: GridSettingChangeInvalidateTypeId) {
        if (this._beginChangeCount === 0) {
            for (const handler of this._changedEventHandlers) {
                handler();
            }

            switch (invalidateType) {
                case GridSettingChangeInvalidateTypeId.None:
                    break;
                case GridSettingChangeInvalidateTypeId.ViewRender:
                    this.viewRenderInvalidatedEventer();
                    break;
                case GridSettingChangeInvalidateTypeId.HorizontalViewLayout:
                    this.horizontalViewLayoutInvalidatedEventer(false);
                    break;
                case GridSettingChangeInvalidateTypeId.VerticalViewLayout:
                    this.verticalViewLayoutInvalidatedEventer(false);
                    break;
                case GridSettingChangeInvalidateTypeId.ViewLayout:
                    this.viewLayoutInvalidatedEventer(false);
                    break;
                case GridSettingChangeInvalidateTypeId.HorizontalViewLayoutAndScrollDimension:
                    this.horizontalViewLayoutInvalidatedEventer(true);
                    break;
                case GridSettingChangeInvalidateTypeId.VerticalViewLayoutAndScrollDimension:
                    this.verticalViewLayoutInvalidatedEventer(true);
                    break;
                case GridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension:
                    this.viewLayoutInvalidatedEventer(true);
                    break;
                case GridSettingChangeInvalidateTypeId.Resize:
                    this.resizeEventer();
                    break;
                default:
                    throw new UnreachableCaseError('IMDMGSIBT43332', invalidateType);
            }
        } else {
            if (this._beginChangeInvalidateType === undefined) {
                this._beginChangeInvalidateType = invalidateType;
            } else {
                this._beginChangeInvalidateType = GridSettingChangeInvalidateType.getHigherPriority(invalidateType, this._beginChangeInvalidateType);
            }
        }
    }
}
