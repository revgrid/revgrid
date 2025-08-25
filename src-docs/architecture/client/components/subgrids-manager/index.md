---
title: Subgrids Manager
---

# Subgrids Manager Component

Defines the {@link client/components/subgrid/subgrids-manager!RevSubgridsManager:class | RevSubgridsManager} class, which manages all subgrids within the grid component. It centralizes the logic for handling multiple subgrids in a grid, supporting complex layouts and sectioning (such as headers, summaries, and footers) while maintaining integration with data and meta servers.

## Main Responsibilities

* **Subgrid Creation and Management**: Instantiates and organizes subgrids (main, header, filter, summary, footer) based on provided definitions, ensuring each is properly configured and accessible.
* **Role Assignment**: Identifies and assigns special roles (main, header, footer, etc.) to subgrids for specialized grid behavior.
* **Row and Height Calculations**: Provides methods to calculate row counts and pixel heights for different grid sections (pre-main, post-main, fixed rows, summaries, footers, etc.), including handling of grid lines between subgrids.
* **Data Server Integration**: Associates each subgrid with its data server and allows lookup of subgrids by their data server.
* **Destruction/Cleanup**: Cleans up all subgrid instances when the manager is destroyed.
* **Utility Methods**: Offers helper methods for retrieving subgrids, calculating combined heights/counts, and resolving subgrid definitions.

## Row Height
The default row height is specified in the {@link client/settings/only-grid-settings!RevOnlyGridSettings#defaultRowHeight | defaultRowHeight} setting. Individual rows within a subgrid can have different heights if {@link client/interfaces/subgrid!RevSubgrid | RevSubgrid}.{@link client/interfaces/subgrid!RevSubgrid#rowHeightsCanDiffer | rowHeightsCanDiffer} is true. This property is set to true if a subgrid's {@link client/interfaces/subgrid!RevSubgrid.Definition | definition}'s optional {@link client/interfaces/subgrid!RevSubgrid.Definition#rowPropertiesCanSpecifyRowHeight | rowPropertiesCanSpecifyRowHeight} is set to true. Currently this is not supported as it requires [Meta Server](../../../servers/meta/index.md) to be completed and other changes to how the [view](../view-layout/index.md) is calculated.

## Settings used
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#fixedRowCount | fixedRowCount}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#defaultRowHeight | defaultRowHeight}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#horizontalGridLinesWidth | horizontalGridLinesWidth}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#horizontalFixedLineWidth | horizontalFixedLineWidth}
