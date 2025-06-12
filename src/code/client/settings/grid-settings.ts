import { deepExtendValue } from '@pbkware/js-utils';
import { RevModifierKey, RevSelectionAreaTypeSpecifierId } from '../../common/internal-api';
import { RevOnlyGridSettings } from './only-grid-settings';

/** @public */
export type RevGridSettings = RevOnlyGridSettings;

/** @public */
export namespace RevGridSettings {
    export type Color = RevOnlyGridSettings.Color;

    export function assign(source: Partial<RevGridSettings>, target: RevGridSettings): boolean {
        const sourceKeys = Object.keys(source) as (keyof RevGridSettings)[];
        if (sourceKeys.length === 0) {
            return false;
        } else {
            for (const key of sourceKeys) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    const typedValue = source[key];
                    const value = deepExtendValue({}, typedValue);
                    (target[key] as unknown) = value;
                }
            }
            return true;
        }
    }

    export function isAddToggleSelectionAreaModifierKeyDownInEvent(gridSettings: RevGridSettings, event: MouseEvent | KeyboardEvent) {
        return RevModifierKey.isDownInEvent(gridSettings.addToggleSelectionAreaModifierKey, event);
    }

    export function isExtendLastSelectionAreaModifierKeyDownInEvent(gridSettings: RevGridSettings, event: MouseEvent | KeyboardEvent) {
        return RevModifierKey.isDownInEvent(gridSettings.extendLastSelectionAreaModifierKey, event);
    }

    export function isSecondarySelectionAreaTypeSpecifierModifierKeyDownInEvent(gridSettings: RevGridSettings, event: MouseEvent | KeyboardEvent) {
        return RevModifierKey.isDownInEvent(gridSettings.secondarySelectionAreaTypeSpecifierModifierKey, event);
    }

    export function isShowScrollerThumbOnMouseMoveModifierKeyDownInEvent(gridSettings: RevGridSettings, event: MouseEvent | KeyboardEvent) {
        return RevModifierKey.isDownInEvent(gridSettings.showScrollerThumbOnMouseMoveModifierKey, event);
    }

    export function getSelectionAreaTypeFromEvent(gridSettings: RevGridSettings, event: MouseEvent | KeyboardEvent) {
        if (RevModifierKey.isDownInEvent(gridSettings.secondarySelectionAreaTypeSpecifierModifierKey, event)) {
            return gridSettings.secondarySelectionAreaType;
        } else {
            return gridSettings.primarySelectionAreaType;
        }
    }

    export function getSelectionAreaTypeSpecifierFromEvent(gridSettings: RevGridSettings, event: MouseEvent | KeyboardEvent) {
        if (RevGridSettings.isSecondarySelectionAreaTypeSpecifierModifierKeyDownInEvent(gridSettings, event)) {
            return RevSelectionAreaTypeSpecifierId.Secondary;
        } else {
            return RevSelectionAreaTypeSpecifierId.Primary;
        }
    }
}
