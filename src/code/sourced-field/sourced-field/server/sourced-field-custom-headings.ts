// (c) 2024 Xilytix Pty Ltd / Paul Klink

/** @public */
export interface RevSourcedFieldCustomHeadings {
    tryGetFieldHeading(sourceName: string, fieldName: string): string | undefined;
}
