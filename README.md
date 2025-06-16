# Revgrid

[![NPM version](https://img.shields.io/npm/v/revgrid)](https://www.npmjs.com/package/revgrid) [![License](https://img.shields.io/github/license/revgrid)](https://img.shields.io/github/license/revgrid/revgrid)

Revgrid is a canvas based virtual grid focusing on realtime data display and performance. Data is injected into the grid using server interfaces.

Its main features are:

* Speed
* Virtual (supporting display of very large data sets)
* Event driven (low CPU usage)
* Multiple selections (rectangle, row and column)
* Focus
* Smooth horizontal scrolling
* Multiple subgrids (header, main, footer)
* Fixed rows and columns
* Plug in cell painters
* Plug in cell editors
* Plug in UI controllers

Note that it is necessary to create a set of server interfaces in order to display data with Revgrid. The library contains 4 pre-built server interface sets and the test programs also demonstrate how to create server sets.

An example of Revgrid is available at [Record Test App](/Examples/Record_Test/).  This app is used to test the [`Record`](/record) module.

More examples are available in the [Examples](/Examples/) documentation section.
