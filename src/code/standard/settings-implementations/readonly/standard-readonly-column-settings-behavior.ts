/* eslint-disable @typescript-eslint/no-empty-function */

import { readonlyColumnSettingsBehavior } from '../../../settings-implementations/settings-implementations-public-api';
import { StandardColumnSettingsBehavior } from '../../settings/standard-settings-public-api';

/** @public */
export const standardReadonlyColumnSettingsBehavior: StandardColumnSettingsBehavior = {
    ...readonlyColumnSettingsBehavior,
    load: () => {},
}
