tab-data-firefox
================

[![Build Status](https://travis-ci.org/bobbyrne01/tab-data-firefox.svg?branch=master)](https://travis-ci.org/bobbyrne01/tab-data-firefox)
[![devDependency Status](https://david-dm.org/bobbyrne01/tab-data-firefox/dev-status.svg)](https://david-dm.org/bobbyrne01/tab-data-firefox#info=devDependencies)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

Provides user with tab related stats/data

### Features

* How many tabs are currently open
* How many tabs have been opened during this Firefox session
* How many tabs have been opened since addon installed
* Preference to toggle tab memory usage on/off
* Memory usage displayed on panel UI (JSON or Plain)
* Preference to include url on memory usage panel UI
* Prepend, append or disable tab memory usage in title
* Change tab title color if memory exceeds specified threshold
* Preference to set interval between memory usage collection
* Top 5 memory consumers drawn on graph
* Graph types include: Line, Bar, Radar and PolarArea
* Perform a garbage collection
* Resize panel UI

### Monitoring memory 

The addon uses the [nsIMemoryReporterManager](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIMemoryReporterManager) interface to extract memory statistics from `Firefox`, specifically the `getReports()` method.

For each process, data is parsed from the `explicit` tree (which represents all the memory allocated via explicit calls to allocation functions). More specifically, from the `explicit/window-objects/` and `explicit/add-ons/*/window-objects/` tree paths (which represents all JavaScript `window` objects) only if the leaf node contains an `id` and a `url` matching a currently open tab, otherwise the node is disregarded.

Measurements use bytes as their unit and the value of each leaf node is the sum of all its children, therefore the value displayed in a tab title corresponds to a child of `explicit/window-objects/` or `explicit/add-ons/*/window-objects/`.

### Locale support

* bg
* cs-CZ
* de-DE
* en-GB
* en-US
* es-ES
* fr-FR
* it-IT
* ja-JP
* ko-KR
* pl-PL
* pt-PT
* ru-RU
* sv-SE
* uk-UA
* zh-CN

### Development

    npm install
    bower install
    grunt
    
### Run

    rob@work:~/git/tab-data-firefox$ cd addon/
    rob@work:~/git/tab-data-firefox/addon$ ~/apps/addon-sdk-1.17/bin/cfx run

### Package

    rob@work:~/git/tab-data-firefox/addon$ ~/apps/addon-sdk-1.17/bin/cfx xpi

### Attribution

Charts are drawn using [Chart.js](https://github.com/nnnick/Chart.js)