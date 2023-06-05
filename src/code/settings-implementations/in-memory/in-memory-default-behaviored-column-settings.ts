import { AssertError, BehavioredColumnSettings, ColumnSettingsBehavior, GridSettingChangeInvalidateType } from '../../grid/grid-public-api';

/** @public */
export class InMemoryDefaultBehavioredColumnSettings implements BehavioredColumnSettings {
    viewRenderInvalidatedEventer: ColumnSettingsBehavior.ViewRenderInvalidatedEventer;

    private _backgroundColor: string;
    private _color: string;
    private _columnAutosizingMax: number;
    private _columnClip: boolean;
    private _defaultColumnAutosizing: boolean;
    private _defaultColumnWidth: number;
    private _editable: boolean;
    private _editOnKeydown: boolean;
    private _editOnFocusCell: boolean;
    private _editOnDoubleClick: boolean;
    private _filterable: boolean;
    private _maximumColumnWidth: number;
    private _minimumColumnWidth: number;
    private _resizeColumnInPlace: boolean;
    private _mouseSortOnDoubleClick: boolean;
    private _mouseSortable: boolean;



    private invalidateByType(invalidateType: GridSettingChangeInvalidateType) {
        switch (invalidateType) {
            case GridSettingChangeInvalidateType.None:
                break;
            case GridSettingChangeInvalidateType.ViewRender:
                this.viewRenderInvalidatedEventer();
                break;
            default:
                throw new AssertError('IMDBCSIBT23333', invalidateType.toString());
        }
    }

}
