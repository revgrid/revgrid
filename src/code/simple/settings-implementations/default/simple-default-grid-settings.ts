import { revDefaultGridSettings } from '../../../settings-implementations';
import { RevSimpleGridSettings } from '../../settings';
import { revSimpleDefaultOnlyGridSettings } from './simple-default-only-grid-settings';

/** @public */
export const revSimpleDefaultGridSettings: RevSimpleGridSettings = {
    ...revDefaultGridSettings,
    ...revSimpleDefaultOnlyGridSettings,
} as const;
