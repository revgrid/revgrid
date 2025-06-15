
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevCellPainter, RevViewCell } from '../../client';
import { RevRectangle, RevSchemaField } from '../../common';
import { RevStandardCellPainter } from './standard-cell-painter';

/**
 * Renders a slider button.
 * Currently however the user cannot interact with it.
 * @public
 */
export class RevStandardSliderCellPainter<
    BGS extends RevBehavioredGridSettings,
    BCS extends RevBehavioredColumnSettings,
    SF extends RevSchemaField
> extends RevStandardCellPainter<BGS, BCS, SF> {
    config: RevStandardSliderCellPainter.Config;

    override paint(_cell: RevViewCell<BCS, SF>, _prefillColor: string | undefined): number | undefined {
        const gc = this._renderingContext;
        const config = this.config;

        const x = config.bounds.x;
        const y = config.bounds.y;
        const width = config.bounds.width;
        const height = config.bounds.height;
        gc.cache.strokeStyle = 'white';
        const val = config.value;
        const radius = height / 2;
        const offset = width * val;
        const bgColor = config.isSelected ? config.backgroundColor : '#333333';
        const btnGradient = gc.createLinearGradient(x, y, x, y + height);
        btnGradient.addColorStop(0, bgColor);
        btnGradient.addColorStop(1, '#666666');
        const arcGradient = gc.createLinearGradient(x, y, x, y + height);
        arcGradient.addColorStop(0, '#aaaaaa');
        arcGradient.addColorStop(1, '#777777');
        gc.cache.fillStyle = btnGradient;
        RevCellPainter.roundRect(gc, x, y, width, height, radius, true);
        if (val < 1.0) {
            gc.cache.fillStyle = arcGradient;
        } else {
            gc.cache.fillStyle = '#eeeeee';
        }
        gc.beginPath();
        gc.arc(x + Math.max(offset - radius, radius), y + radius, radius, 0, 2 * Math.PI);
        gc.fill();
        gc.closePath();
        return 100;
    }
}

/** @public */
export namespace RevStandardSliderCellPainter {
    export const typeName = 'Slider';

    export interface Config {
        value: number;
        bounds: RevRectangle;
        backgroundColor: string;
        isSelected: boolean;
    }
}
