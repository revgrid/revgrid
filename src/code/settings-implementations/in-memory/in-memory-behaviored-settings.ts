import {
    AssertError,
    BehavioredSettings,
    GridSettingChangeInvalidateType,
    GridSettingChangeInvalidateTypeId,
    UnreachableCaseError
} from '../../grid/grid-public-api';

/** @public */
export abstract class InMemoryBehavioredSettings implements BehavioredSettings {
    /** @internal */
    viewRenderInvalidatedEventer: BehavioredSettings.ViewRenderInvalidatedEventer | undefined;
    /** @internal */
    viewLayoutInvalidatedEventer: BehavioredSettings.ViewLayoutInvalidatedEventer | undefined;
    /** @internal */
    horizontalViewLayoutInvalidatedEventer: BehavioredSettings.ViewLayoutInvalidatedEventer | undefined;
    /** @internal */
    verticalViewLayoutInvalidatedEventer: BehavioredSettings.ViewLayoutInvalidatedEventer | undefined;
    /** @internal */
    resizeEventer: BehavioredSettings.ResizeEventer | undefined;

    /** @internal */
    private _beginChangeCount = 0;
    /** @internal */
    private _beginChangeInvalidateType: GridSettingChangeInvalidateTypeId | undefined;
    /** @internal */
    private _changedEventHandlers =  new Array<BehavioredSettings.ChangedEventHandler>();


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

    subscribeChangedEvent(handler: BehavioredSettings.ChangedEventHandler) {
        this._changedEventHandlers.push(handler);
    }

    unsubscribeChangedEvent(handler: BehavioredSettings.ChangedEventHandler) {
        const index = this._changedEventHandlers.indexOf(handler);
        if (index < 0) {
            throw new AssertError('IMBSUCE23445');
        } else {
            this._changedEventHandlers.splice(index, 1);
        }
    }

    protected notifyChangedViewRender() {
        this.notifyChanged(GridSettingChangeInvalidateTypeId.ViewRender);
    }

    protected notifyChanged(invalidateType: GridSettingChangeInvalidateTypeId) {
        if (this._beginChangeCount === 0) {
            for (const handler of this._changedEventHandlers) {
                handler();
            }

            switch (invalidateType) {
                case GridSettingChangeInvalidateTypeId.None:
                    break;
                case GridSettingChangeInvalidateTypeId.ViewRender:
                    if (this.viewRenderInvalidatedEventer !== undefined) {
                        this.viewRenderInvalidatedEventer();
                    }
                    break;
                case GridSettingChangeInvalidateTypeId.HorizontalViewLayout:
                    if (this.horizontalViewLayoutInvalidatedEventer !== undefined) {
                        this.horizontalViewLayoutInvalidatedEventer(false);
                    }
                    break;
                case GridSettingChangeInvalidateTypeId.VerticalViewLayout:
                    if (this.verticalViewLayoutInvalidatedEventer !== undefined) {
                        this.verticalViewLayoutInvalidatedEventer(false);
                    }
                    break;
                case GridSettingChangeInvalidateTypeId.ViewLayout:
                    if (this.viewLayoutInvalidatedEventer !== undefined) {
                        this.viewLayoutInvalidatedEventer(false);
                    }
                    break;
                case GridSettingChangeInvalidateTypeId.HorizontalViewLayoutAndScrollDimension:
                    if (this.horizontalViewLayoutInvalidatedEventer !== undefined) {
                        this.horizontalViewLayoutInvalidatedEventer(true);
                    }
                    break;
                case GridSettingChangeInvalidateTypeId.VerticalViewLayoutAndScrollDimension:
                    if (this.verticalViewLayoutInvalidatedEventer !== undefined) {
                        this.verticalViewLayoutInvalidatedEventer(true);
                    }
                    break;
                case GridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension:
                    if (this.viewLayoutInvalidatedEventer !== undefined) {
                        this.viewLayoutInvalidatedEventer(true);
                    }
                    break;
                case GridSettingChangeInvalidateTypeId.Resize:
                    if (this.resizeEventer !== undefined) {
                        this.resizeEventer();
                    }
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
