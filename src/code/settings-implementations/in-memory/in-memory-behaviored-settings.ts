import {
    AssertError,
    GridSettingChangeInvalidateType,
    GridSettingChangeInvalidateTypeId,
    GridSettingsBehavior,
    UnreachableCaseError
} from '../../grid/grid-public-api';

/** @public */
export class InMemoryBehavioredSettings {
    viewRenderInvalidatedEventer: GridSettingsBehavior.ViewRenderInvalidatedEventer;
    viewLayoutInvalidatedEventer: GridSettingsBehavior.ViewLayoutInvalidatedEventer;
    horizontalViewLayoutInvalidatedEventer: GridSettingsBehavior.ViewLayoutInvalidatedEventer;
    verticalViewLayoutInvalidatedEventer: GridSettingsBehavior.ViewLayoutInvalidatedEventer;
    resizeEventer: GridSettingsBehavior.ResizeEventer;

    private _beginChangeCount = 0;
    private _beginChangeInvalidateType: GridSettingChangeInvalidateTypeId | undefined;

    beginChange() {
        if (this._beginChangeCount++ === 0) {
            this._beginChangeInvalidateType = undefined;
        }
    }

    endChange() {
        if (--this._beginChangeCount === 0) {
            if (this._beginChangeInvalidateType !== undefined) {
                this.invalidateByType(this._beginChangeInvalidateType);
                this._beginChangeInvalidateType = undefined;
            }
        } else {
            if (this._beginChangeCount < 0) {
                throw new AssertError('IMDBSEC65997');
            }
        }
    }

    protected invalidateViewRender() {
        this.invalidateByType(GridSettingChangeInvalidateTypeId.ViewRender);
    }

    protected invalidateByType(invalidateType: GridSettingChangeInvalidateTypeId) {
        if (this._beginChangeCount === 0) {
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
