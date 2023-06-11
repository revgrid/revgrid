import { BehavioredColumnSettings, ColumnSettings, gridSettingChangeInvalidateTypeIds } from '../../grid/grid-public-api';
import { InMemoryBehavioredSettings } from './in-memory-behaviored-settings';

/** @public */
export class InMemoryBehavioredColumnSettings extends InMemoryBehavioredSettings implements BehavioredColumnSettings {
    private _backgroundColor: string;
    private _color: string;
    private _columnAutosizingMax: number | undefined;
    private _columnClip: boolean | undefined;
    private _defaultColumnAutosizing: boolean;
    private _defaultColumnWidth: number;
    private _editable: boolean;
    private _editOnClick: boolean;
    private _editOnDoubleClick: boolean;
    private _editOnFocusCell: boolean;
    private _editOnKeydown: boolean;
    private _filterable: boolean;
    private _maximumColumnWidth: number | undefined;
    private _minimumColumnWidth: number;
    private _resizeColumnInPlace: boolean;
    private _mouseSortOnDoubleClick: boolean;
    private _mouseSortable: boolean;

    get backgroundColor() { return this._backgroundColor; }
    set backgroundColor(value: string) {
        if (value !== this._backgroundColor) {
            this.beginChange();
            this._backgroundColor = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.backgroundColor;
            this.invalidateByType(invalidateType);
            this.endChange();
        }
    }

    get color() { return this._color; }
    set color(value: string) {
        if (value !== this._color) {
            this.beginChange();
            this._color = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.color;
            this.invalidateByType(invalidateType);
            this.endChange();
        }
    }

    get columnAutosizingMax() { return this._columnAutosizingMax; }
    set columnAutosizingMax(value: number | undefined) {
        if (value !== this._columnAutosizingMax) {
            this.beginChange();
            this._columnAutosizingMax = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnAutosizingMax;
            this.invalidateByType(invalidateType);
            this.endChange();
        }
    }

    get columnClip() { return this._columnClip; }
    set columnClip(value: boolean | undefined) {
        if (value !== this._columnClip) {
            this.beginChange();
            this._columnClip = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.columnClip;
            this.invalidateByType(invalidateType);
            this.endChange();
        }
    }

    get defaultColumnAutosizing() { return this._defaultColumnAutosizing; }
    set defaultColumnAutosizing(value: boolean) {
        if (value !== this._defaultColumnAutosizing) {
            this.beginChange();
            this._defaultColumnAutosizing = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.defaultColumnAutosizing;
            this.invalidateByType(invalidateType);
            this.endChange();
        }
    }

    get defaultColumnWidth() { return this._defaultColumnWidth; }
    set defaultColumnWidth(value: number) {
        if (value !== this._defaultColumnWidth) {
            this.beginChange();
            this._defaultColumnWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.defaultColumnWidth;
            this.invalidateByType(invalidateType);
            this.endChange();
        }
    }

    get editable() { return this._editable; }
    set editable(value: boolean) {
        if (value !== this._editable) {
            this.beginChange();
            this._editable = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editable;
            this.invalidateByType(invalidateType);
            this.endChange();
        }
    }

    get editOnClick() { return this._editOnClick; }
    set editOnClick(value: boolean) {
        if (value !== this._editOnClick) {
            this.beginChange();
            this._editOnClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnClick;
            this.invalidateByType(invalidateType);
            this.endChange();
        }
    }

    get editOnDoubleClick() { return this._editOnDoubleClick; }
    set editOnDoubleClick(value: boolean) {
        if (value !== this._editOnDoubleClick) {
            this.beginChange();
            this._editOnDoubleClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnDoubleClick;
            this.invalidateByType(invalidateType);
            this.endChange();
        }
    }

    get editOnFocusCell() { return this._editOnFocusCell; }
    set editOnFocusCell(value: boolean) {
        if (value !== this._editOnFocusCell) {
            this.beginChange();
            this._editOnFocusCell = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnFocusCell;
            this.invalidateByType(invalidateType);
            this.endChange();
        }
    }

    get editOnKeyDown() { return this._editOnKeydown; }
    set editOnKeyDown(value: boolean) {
        if (value !== this._editOnKeydown) {
            this.beginChange();
            this._editOnKeydown = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.editOnKeyDown;
            this.invalidateByType(invalidateType);
            this.endChange();
        }
    }

    get filterable() { return this._filterable; }
    set filterable(value: boolean) {
        if (value !== this._filterable) {
            this.beginChange();
            this._filterable = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.filterable;
            this.invalidateByType(invalidateType);
            this.endChange();
        }
    }

    get maximumColumnWidth() { return this._maximumColumnWidth; }
    set maximumColumnWidth(value: number | undefined) {
        if (value !== this._maximumColumnWidth) {
            this.beginChange();
            this._maximumColumnWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.maximumColumnWidth;
            this.invalidateByType(invalidateType);
            this.endChange();
        }
    }

    get minimumColumnWidth() { return this._minimumColumnWidth; }
    set minimumColumnWidth(value: number) {
        if (value !== this._minimumColumnWidth) {
            this.beginChange();
            this._minimumColumnWidth = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.minimumColumnWidth;
            this.invalidateByType(invalidateType);
            this.endChange();
        }
    }

    get resizeColumnInPlace() { return this._resizeColumnInPlace; }
    set resizeColumnInPlace(value: boolean) {
        if (value !== this._resizeColumnInPlace) {
            this.beginChange();
            this._resizeColumnInPlace = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.resizeColumnInPlace;
            this.invalidateByType(invalidateType);
            this.endChange();
        }
    }

    get mouseSortOnDoubleClick() { return this._mouseSortOnDoubleClick; }
    set mouseSortOnDoubleClick(value: boolean) {
        if (value !== this._mouseSortOnDoubleClick) {
            this.beginChange();
            this._mouseSortOnDoubleClick = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.mouseSortOnDoubleClick;
            this.invalidateByType(invalidateType);
            this.endChange();
        }
    }

    get mouseSortable() { return this._mouseSortable; }
    set mouseSortable(value: boolean) {
        if (value !== this._mouseSortable) {
            this.beginChange();
            this._mouseSortable = value;
            const invalidateType = gridSettingChangeInvalidateTypeIds.mouseSortable;
            this.invalidateByType(invalidateType);
            this.endChange();
        }
    }

    load(settings: ColumnSettings) {
        this.beginChange();

        for (const key in settings) {
            // Use loop so that compiler will report error if any setting missing
            const columnSettingsKey = key as keyof ColumnSettings;
            switch (columnSettingsKey) {
                case 'backgroundColor':
                    this._backgroundColor = settings.backgroundColor;
                    break;
                case 'color':
                    this._color = settings.color;
                    break;
                case 'columnAutosizingMax':
                    this._columnAutosizingMax = settings.columnAutosizingMax;
                    break;
                case 'columnClip':
                    this._columnClip = settings.columnClip;
                    break;
                case 'defaultColumnAutosizing':
                    this._defaultColumnAutosizing = settings.defaultColumnAutosizing;
                    break;
                case 'defaultColumnWidth':
                    this._defaultColumnWidth = settings.defaultColumnWidth;
                    break;
                case 'editable':
                    this._editable = settings.editable;
                    break;
                case 'editOnClick':
                    this._editOnClick = settings.editOnClick;
                    break;
                case 'editOnDoubleClick':
                    this._editOnDoubleClick = settings.editOnDoubleClick;
                    break;
                case 'editOnFocusCell':
                    this._editOnFocusCell = settings.editOnFocusCell;
                    break;
                case 'editOnKeyDown':
                    this._editOnKeydown = settings.editOnKeyDown;
                    break;
                case 'filterable':
                    this._filterable = settings.filterable;
                    break;
                case 'maximumColumnWidth':
                    this._maximumColumnWidth = settings.maximumColumnWidth;
                    break;
                case 'minimumColumnWidth':
                    this._minimumColumnWidth = settings.minimumColumnWidth;
                    break;
                case 'resizeColumnInPlace':
                    this._resizeColumnInPlace = settings.resizeColumnInPlace;
                    break;
                case 'mouseSortOnDoubleClick':
                    this._mouseSortOnDoubleClick = settings.mouseSortOnDoubleClick;
                    break;
                case 'mouseSortable':
                    this._mouseSortable = settings.mouseSortable;
                    break;

                default: {
                    columnSettingsKey satisfies never;
                }
            }
        }

        this.endChange();
    }
}
