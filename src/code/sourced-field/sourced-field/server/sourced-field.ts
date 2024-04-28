// (c) 2024 Xilytix Pty Ltd / Paul Klink

import {
    EnumInfoOutOfOrderError
} from '@xilytix/sysutils';
import { RevSchemaField } from '../../../client/internal-api';
import { RevHorizontalAlignEnum } from '../../../standard/internal-api';
import { RevSourcedFieldDefinition } from './definition/internal-api';
import { RevSourcedFieldCustomHeadingsService } from './sourced-field-custom-headings-service';

/** @public */
export interface RevSourcedField extends RevSchemaField {
    readonly definition: RevSourcedFieldDefinition;
    readonly name: string;
    heading: string;
}

/** @public */
export namespace RevSourcedField {
    export const enum FieldId {
        Name,
        Heading,
        SourceName,
        DefaultHeading,
        DefaultTextAlign,
        DefaultWidth,
    }

    export namespace Field {
        export type Id = FieldId;

        interface Info {
            readonly id: Id;
            readonly name: string;
            readonly horizontalAlign: RevHorizontalAlignEnum;
        }

        type InfosObject = { [id in keyof typeof FieldId]: Info };

        const infosObject: InfosObject = {
            Name: {
                id: FieldId.Name,
                name: 'Name',
                horizontalAlign: RevHorizontalAlignEnum.left,
            },
            Heading: {
                id: FieldId.Heading,
                name: 'Heading',
                horizontalAlign: RevHorizontalAlignEnum.left,
            },
            SourceName: {
                id: FieldId.SourceName,
                name: 'SourceName',
                horizontalAlign: RevHorizontalAlignEnum.left,
            },
            DefaultHeading: {
                id: FieldId.DefaultHeading,
                name: 'DefaultHeading',
                horizontalAlign: RevHorizontalAlignEnum.left,
            },
            DefaultTextAlign: {
                id: FieldId.DefaultTextAlign,
                name: 'DefaultTextAlign',
                horizontalAlign: RevHorizontalAlignEnum.left,
            },
            DefaultWidth: {
                id: FieldId.DefaultWidth,
                name: 'DefaultWidth',
                horizontalAlign: RevHorizontalAlignEnum.right,
            },
        } as const;

        const infos = Object.values(infosObject);
        export const idCount = infos.length;

        export function checkOrder() {
            for (let i = 0; i < idCount; i++) {
                const info = infos[i];
                if (info.id !== i as FieldId) {
                    throw new EnumInfoOutOfOrderError('RevField.FieldId', i, idToName(i));
                }
            }
        }

        checkOrder();

        export function idToName(id: Id) {
            return infos[id].name;
        }

        export function idToHorizontalAlign(id: Id) {
            return infos[id].horizontalAlign;
        }
    }

    export function generateHeading(customHeadingsService: RevSourcedFieldCustomHeadingsService, fieldDefinition: RevSourcedFieldDefinition) {
        const customHeading = customHeadingsService.tryGetFieldHeading(fieldDefinition.name, fieldDefinition.sourcelessName);
        if (customHeading !== undefined) {
            return customHeading;
        } else {
            return fieldDefinition.defaultHeading;
        }
    }
}
