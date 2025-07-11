import {
    EnumInfoOutOfOrderError
} from '@pbkware/js-utils';
import { RevHorizontalAlignId } from '../../../cell-content/client';
import { RevSchemaField } from '../../../common';
import { RevSourcedFieldDefinition } from './definition';
import { RevSourcedFieldCustomHeadings } from './sourced-field-custom-headings';

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
            readonly horizontalAlignId: RevHorizontalAlignId;
        }

        type InfosObject = { [id in keyof typeof FieldId]: Info };

        const infosObject: InfosObject = {
            Name: {
                id: FieldId.Name,
                name: 'Name',
                horizontalAlignId: RevHorizontalAlignId.Left,
            },
            Heading: {
                id: FieldId.Heading,
                name: 'Heading',
                horizontalAlignId: RevHorizontalAlignId.Left,
            },
            SourceName: {
                id: FieldId.SourceName,
                name: 'SourceName',
                horizontalAlignId: RevHorizontalAlignId.Left,
            },
            DefaultHeading: {
                id: FieldId.DefaultHeading,
                name: 'DefaultHeading',
                horizontalAlignId: RevHorizontalAlignId.Left,
            },
            DefaultTextAlign: {
                id: FieldId.DefaultTextAlign,
                name: 'DefaultTextAlign',
                horizontalAlignId: RevHorizontalAlignId.Left,
            },
            DefaultWidth: {
                id: FieldId.DefaultWidth,
                name: 'DefaultWidth',
                horizontalAlignId: RevHorizontalAlignId.Right,
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

        export function idToHorizontalAlignId(id: Id) {
            return infos[id].horizontalAlignId;
        }
    }

    export function generateHeading(customHeadings: RevSourcedFieldCustomHeadings | undefined, fieldDefinition: RevSourcedFieldDefinition) {
        if (customHeadings === undefined) {
            return fieldDefinition.defaultHeading;
        } else {
            const customHeading = customHeadings.tryGetFieldHeading(fieldDefinition.name, fieldDefinition.sourcelessName);
            if (customHeading !== undefined) {
                return customHeading;
            } else {
                return fieldDefinition.defaultHeading;
            }
        }
    }
}
