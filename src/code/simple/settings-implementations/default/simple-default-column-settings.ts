import { revDefaultColumnSettings } from '../../../settings-implementations/internal-api';
import { RevSimpleColumnSettings } from '../../settings/internal-api';
import { revSimpleDefaultOnlyColumnSettings } from './simple-default-only-column-settings';

/** @public */
export const revSimpleDefaultColumnSettings: RevSimpleColumnSettings = {
    ...revDefaultColumnSettings,
    ...revSimpleDefaultOnlyColumnSettings,
} as const;
