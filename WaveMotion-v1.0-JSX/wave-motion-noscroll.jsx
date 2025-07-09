/**
 * wave-motion.jsx
 *
 * @description A dockable After Effects ScriptUI panel for applying custom easing presets,
 * importing project elements, and performing other animation utilities.
 *
 * @author jon elliot
 * @version 1.0
 * @date 2025-07-02
 */

(function waveMotionPanel(thisObj) {
    // -----------------------------------------------------------------------------
    // CONFIGURATION
    // -----------------------------------------------------------------------------

    var SCRIPT_CONFIG = {
        name: "Wave Motion",
        version: "1.0",

        undo: {
            importAction: "Import & Place Comp",
            clickAnim: "Apply Click Animation",
            backIn: "Apply Back In Ease",
            backOut: "Apply Back Out Ease",
            backInOut: "Apply Back In/Out Ease",
            easePwr1: "Apply Ease Power 1",
            easePwr2: "Apply Ease Power 2",
            easePwr3: "Apply Ease Power 3",
            swatch: "Apply Color Swatch"
        },
        alert: {
            noComp: "Please select or open a composition first.",
            noLayer: "Please select at least one layer.",
            noKeys: "Please select the appropriate keyframes.",
            aepNotFound: "The asset file 'wave-elements.aep' was not found in the script folder.",
            compNotFound: "Could not find a comp named “%s” in the imported project."
        }
    };

    var EASE_CONFIGS = {
        backIn:    { offset: 0.5, strength: 0.1, pos: [{inVal: 88, outVal: 88}, {inVal: 35, outVal: 60}, {inVal: 90, outVal: 90}], scale: [{inVal: 88, outVal: 88}, {inVal: 35, outVal: 60}, {inVal: 90, outVal: 90}] },
        backOut:   { offset: 0.5, strength: 0.1, pos: [{inVal: 88, outVal: 88}, {inVal: 35, outVal: 20}, {inVal: 75, outVal: 75}], scale: [{inVal: 88, outVal: 88}, {inVal: 35, outVal: 20}, {inVal: 75, outVal: 75}] },
        backInOut: { offset: 0.3, strength: 0.1, pos: [{inVal: 75, outVal: 75}, {inVal: 35, outVal: 75}, {inVal: 75, outVal: 35}, {inVal: 75, outVal: 75}], scale: [{inVal: 75, outVal: 75}, {inVal: 35, outVal: 75}, {inVal: 75, outVal: 35}, {inVal: 75, outVal: 75}] },
        easeInOutPwr1: { pos: [{inVal: 33, outVal: 33}], scale: [{inVal: 33, outVal: 33}] },
        easeInOutPwr2: { pos: [{inVal: 66, outVal: 66}], scale: [{inVal: 66, outVal: 66}] },
        easeInOutPwr3: { pos: [{inVal: 88, outVal: 88}], scale: [{inVal: 88, outVal: 88}] }
    };

    var COMP_DEFS = [
        { name: "cursor",        anchor: [32, 19],   collapse: true },
        { name: "button-pill",   anchor: [200, 75],  collapse: true },
        { name: "button-square", anchor: [238, 75],  collapse: true },
        { name: "click-pulse",   anchor: [100, 100], collapse: true }, // Example: This comp will NOT have collapse transformations applied.
        { name: "grad-stroke",   anchor: [525, 315], collapse: true },
        { name: "status-flip",   anchor: [300, 300], collapse: false} 
    ];

    var SWATCH_COLORS = [
        [0/255,  27/255, 102/255], [0/255,  64/255, 255/255], [50/255, 143/255, 248/255],
        [118/255,195/255,252/255], [250/255,244/255,241/255], [243/255,167/255,255/255],
        [143/255, 74/255, 226/255], [253/255,194/255, 55/255], [253/255,111/255, 0/255],
        [0/255, 130/255, 56/255], [12/255, 69/255, 39/255]
    ];


    // -----------------------------------------------------------------------------
    // MAIN LOGIC
    // -----------------------------------------------------------------------------

   function importAndPlaceComp(compName, anchorPoint, collapse) {
        var activeComp = app.project.activeItem;
        if (!(activeComp instanceof CompItem)) {
            alert(SCRIPT_CONFIG.alert.noComp);
            return;
        }

        // ADDED: Get the current playhead time before doing anything else.
        var currentTime = activeComp.time;

        app.beginUndoGroup(SCRIPT_CONFIG.undo.importAction + " “" + compName + "”");

        var scriptFile = new File($.fileName);
        var aepFile = new File(scriptFile.parent.fullName + "/wave-elements.aep");

        if (!aepFile.exists) {
            alert(SCRIPT_CONFIG.alert.aepNotFound);
            app.endUndoGroup();
            return;
        }

        var importOpts = new ImportOptions(aepFile);
        importOpts.importAs = ImportAsType.PROJECT;
        var importedProjectFolder = app.project.importFile(importOpts);

        var targetComp = null;
        for (var i = 1; i <= importedProjectFolder.numItems; i++) {
            var item = importedProjectFolder.item(i);
            if (item instanceof CompItem && item.name === compName) {
                targetComp = item;
                break;
            }
        }

        if (!targetComp) {
            alert(SCRIPT_CONFIG.alert.compNotFound.replace("%s", compName));
            importedProjectFolder.remove();
            app.endUndoGroup();
            return;
        }

        targetComp.parentFolder = app.project.rootFolder;
        importedProjectFolder.remove();

        var newLayer = activeComp.layers.add(targetComp);
        
        // ADDED: Set the start time of the new layer to the playhead's position.
        newLayer.startTime = currentTime;
        
        newLayer.anchorPoint.setValue(anchorPoint);

        var shouldCollapse = (collapse === undefined) ? true : collapse;
        newLayer.collapseTransformation = shouldCollapse;

        app.endUndoGroup();
    }

   function applyClickAnimation() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert(SCRIPT_CONFIG.alert.noComp);
        return;
    }
    if (comp.selectedLayers.length === 0) {
        alert(SCRIPT_CONFIG.alert.noLayer);
        return;
    }

    app.beginUndoGroup(SCRIPT_CONFIG.undo.clickAnim);

    var layer = comp.selectedLayers[0];
    var scaleProp = layer.property("Scale");
    var originalScale = scaleProp.value;
    var clickedScale = [originalScale[0] * 0.9, originalScale[1] * 0.9];
    
    var t0 = comp.time;
    var frameDuration = comp.frameDuration;
    var times = [t0, t0 + frameDuration * 4, t0 + frameDuration * 8];
    var values = [originalScale, clickedScale, originalScale];
    
    scaleProp.setValuesAtTimes(times, values);

    var inInfluence = 66, outInfluence = 66;
    for (var i = 0; i < times.length; i++) {
        var keyIndex = scaleProp.nearestKeyIndex(times[i]);
        scaleProp.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
        
        // --- FIX STARTS HERE ---
        // Dynamically determine the number of dimensions for the scale property.
        var dimCount = Array.isArray(scaleProp.keyValue(keyIndex)) ? scaleProp.keyValue(keyIndex).length : 1;
        var inEaseArray = [];
        var outEaseArray = [];
        
        // Create an array of KeyframeEase objects that matches the property's dimension count.
        for (var d = 0; d < dimCount; d++) {
            inEaseArray.push(new KeyframeEase(0, inInfluence));
            outEaseArray.push(new KeyframeEase(0, outInfluence));
        }
        
        // Apply the correctly-sized ease arrays.
        scaleProp.setTemporalEaseAtKey(keyIndex, inEaseArray, outEaseArray);
        // --- FIX ENDS HERE ---
    }

    app.endUndoGroup();
}


    function findKeyframeSelections(comp, propNames, requiredKeyCount) {
        var selections = [];
        requiredKeyCount = requiredKeyCount || 0;

        var selectedLayers = comp.selectedLayers;
        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            var selectedProps = layer.selectedProperties;
            for (var j = 0; j < selectedProps.length; j++) {
                var prop = selectedProps[j];
                var isValidProperty = prop.propertyType === PropertyType.PROPERTY && propNames.indexOf(prop.name) > -1;

                if (isValidProperty) {
                    var selectedKeys = [];
                    for (var k = 1; k <= prop.numKeys; k++) {
                        if (prop.keySelected(k)) {
                            selectedKeys.push(k);
                        }
                    }
                    if (selectedKeys.length > 0 && (requiredKeyCount === 0 || selectedKeys.length === requiredKeyCount)) {
                        selections.push({ property: prop, keys: selectedKeys });
                    }
                }
            }
        }
        return selections;
    }

    function calculateOvershoot(currentValue, boundaryValue, strength) {
        if (Array.isArray(currentValue)) {
            return currentValue.map(function(val, i) {
                return val + (val - boundaryValue[i]) * strength;
            });
        }
        return currentValue + (currentValue - boundaryValue) * strength;
    }

    function applyTemporalEase(prop, times, easeKey) {
        var easeConfig = EASE_CONFIGS[easeKey];
        var specs = (prop.name === 'Scale') ? easeConfig.scale : easeConfig.pos;
        
        if (specs.length !== times.length) {
            var baseSpec = specs[0];
            specs = [];
            for (var i = 0; i < times.length; i++) specs.push(baseSpec);
        }

        for (var i = 0; i < times.length; i++) {
            var keyIndex = prop.nearestKeyIndex(times[i]);
            prop.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
            
            var spec = specs[i];
            var inInfluence = Math.max(spec.inVal, 1);
            var outInfluence = Math.max(spec.outVal, 1);
            
            if (prop.name === 'Scale') {
                var dimCount = Array.isArray(prop.keyValue(keyIndex)) ? prop.keyValue(keyIndex).length : 1;
                var inEaseArray = [], outEaseArray = [];
                for (var d = 0; d < dimCount; d++) {
                    inEaseArray.push(new KeyframeEase(0, inInfluence));
                    outEaseArray.push(new KeyframeEase(0, outInfluence));
                }
                prop.setTemporalEaseAtKey(keyIndex, inEaseArray, outEaseArray);
            } else {
                var easeIn = [new KeyframeEase(0, inInfluence)];
                var easeOut = [new KeyframeEase(0, outInfluence)];
                prop.setTemporalEaseAtKey(keyIndex, easeIn, easeOut);
            }
        }
    }

    function bakeOvershoot(prop, key1, key2, easeKey) {
        var easeConfig = EASE_CONFIGS[easeKey];
        var t1 = prop.keyTime(key1), t2 = prop.keyTime(key2);
        var v1 = prop.keyValue(key1), v2 = prop.keyValue(key2);
        
        var times = [], values = [];
        var offset = easeConfig.offset, strength = easeConfig.strength;

        if (easeKey === 'backIn') {
            var tOvershoot = t1 + (t2 - t1) * offset;
            times = [t1, tOvershoot, t2];
            values = [v1, calculateOvershoot(v1, v2, strength), v2];
        } else if (easeKey === 'backOut') {
            var tOvershoot = t2 - (t2 - t1) * offset;
            times = [t1, tOvershoot, t2];
            values = [v1, calculateOvershoot(v2, v1, strength), v2];
        } else if (easeKey === 'backInOut') {
            var tOvershoot1 = t1 + (t2 - t1) * offset;
            var tOvershoot2 = t2 - (t2 - t1) * offset;
            times = [t1, tOvershoot1, tOvershoot2, t2];
            values = [v1, calculateOvershoot(v1, v2, strength), calculateOvershoot(v2, v1, strength), v2];
        }

        prop.removeKey(key2);
        prop.removeKey(key1);
        
        for (var i = 0; i < times.length; i++) {
            prop.setValueAtTime(times[i], values[i]);
        }
        
        applyTemporalEase(prop, times, easeKey);
    }

    function createEaseHandler(easeKey, undoName) {
        return function() {
            var comp = app.project.activeItem;
            if (!(comp instanceof CompItem)) {
                alert(SCRIPT_CONFIG.alert.noComp);
                return;
            }

            var isBackEase = easeKey.indexOf('back') === 0;
            var requiredKeys = isBackEase ? 2 : 0;
            var propNames = ["Position", "Scale", "Rotation"];
            var selections = findKeyframeSelections(comp, propNames, requiredKeys);

            if (selections.length === 0) {
                alert(SCRIPT_CONFIG.alert.noKeys);
                return;
            }

            app.beginUndoGroup(undoName);

            for (var i = 0; i < selections.length; i++) {
                var item = selections[i];
                if (isBackEase) {
                    bakeOvershoot(item.property, item.keys[0], item.keys[1], easeKey);
                } else {
                    var times = item.keys.map(function(keyIndex) {
                        return item.property.keyTime(keyIndex);
                    });
                    applyTemporalEase(item.property, times, easeKey);
                }
            }

            app.endUndoGroup();
        };
    }


function findAndPaintFirstColor(group, color) {
        for (var i = 1; i <= group.numProperties; i++) {
            var prop = group.property(i);
            if (!prop.enabled) continue; // Skip disabled properties and groups

            var matchName = prop.matchName;

            // If we find an enabled Fill or Stroke, paint it and stop searching.
            if (matchName === "ADBE Vector Graphic - Fill" || matchName === "ADBE Vector Graphic - Stroke") {
                try {
                    prop.property("Color").setValue(color);
                    return true; // Success, color was painted.
                } catch (e) { /* ignore if color property doesn't exist */ }
            
            // If we find a group, search inside it recursively.
            } else if (matchName === "ADBE Vector Group") {
                if (findAndPaintFirstColor(prop.property("Contents"), color)) {
                    return true; // If the recursive call found a color, bubble up the success.
                }
            }
        }
        return false; // No enabled color was found in this group.
    }


   function applySwatchColor(rgbColor) {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            alert(SCRIPT_CONFIG.alert.noComp);
            return;
        }

        app.beginUndoGroup(SCRIPT_CONFIG.undo.swatch);
        var painted = 0;

        // --- PRIORITY 1: Change explicitly selected color properties ---
        var selectedProps = comp.selectedProperties;
        if (selectedProps && selectedProps.length > 0) {
            var targetMatchNames = [
                "ADBE Vector Fill Color", 
                "ADBE Vector Stroke Color", 
                "ADBE Text Fill Color", 
                "ADBE Text Stroke Color"
            ];
            for (var i = 0; i < selectedProps.length; i++) {
                var prop = selectedProps[i];
                // Check if the property's matchName is in our target list
                if (targetMatchNames.indexOf(prop.matchName) > -1) {
                    prop.setValue(rgbColor);
                    painted++;
                }
            }
        }

        // If we painted an explicitly selected property, our job is done.
        if (painted > 0) {
            app.endUndoGroup();
            return;
        }

        // --- PRIORITY 2: Intelligently change color on selected layers ---
        var selectedLayers = comp.selectedLayers;
        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];

            // Handle Text Layers
            if (layer instanceof TextLayer) {
                try {
                    // Target the main Fill Color property of the text
                    layer.property("Source Text").property("Fill Color").setValue(rgbColor);
                    painted++;
                } catch (e) { /* property might not exist */ }
            
            // Handle Shape Layers
            } else if (layer.matchName === "ADBE Vector Layer") {
                // Find and paint the first enabled Fill or Stroke and then stop.
                if (findAndPaintFirstColor(layer.property("Contents"), rgbColor)) {
                    painted++;
                }
            }
        }

        app.endUndoGroup();
    }
    
    // -----------------------------------------------------------------------------
    // UI INITIALIZATION
    // -----------------------------------------------------------------------------
    
    var win = createMainWindow();
    if (!win) return;

    if (!win._initialized) {
        // CORRECTED: Main container group enables scrolling in docked panels.
        win.orientation = 'column';
        win.alignChildren = ['fill', 'fill'];
        win.spacing = 10;

        var mainGroup = win.add('group');
        mainGroup.orientation = 'column';
        mainGroup.alignChildren = ['fill', 'top'];
        mainGroup.spacing = 10;
        mainGroup.margins = 15;

        // CORRECTED: Header layout for robust logo alignment.
        var header = mainGroup.add("group");
        header.orientation = "row";
        header.alignChildren = ["right", "center"];
        header.add("statictext", undefined, SCRIPT_CONFIG.name + " v" + SCRIPT_CONFIG.version);
        var spacer = header.add('group');
        spacer.alignment = 'fill';
        var logoFile = loadIcon("wave");
        if (logoFile) {
            header.add("image", undefined, logoFile);
        }

        addSection(mainGroup, "Back Easing", "position-icon");
        addButtonRow(mainGroup, 
            ["Back In", "Back Out", "Back InOut"], 
            [
                createEaseHandler("backIn", SCRIPT_CONFIG.undo.backIn),
                createEaseHandler("backOut", SCRIPT_CONFIG.undo.backOut),
                createEaseHandler("backInOut", SCRIPT_CONFIG.undo.backInOut)
            ]
        );

        addSpacer(mainGroup, 3);
        
        addSection(mainGroup, "Generic Eases", "generic-icon");
        addButtonRow(mainGroup, 
            ["InOut Pwr3", "InOut Pwr2", "InOut Pwr1"],
            [
                createEaseHandler("easeInOutPwr3", SCRIPT_CONFIG.undo.easePwr3),
                createEaseHandler("easeInOutPwr2", SCRIPT_CONFIG.undo.easePwr2),
                createEaseHandler("easeInOutPwr1", SCRIPT_CONFIG.undo.easePwr1)
            ]
        );

        addSpacer(mainGroup, 3);

        addSection(mainGroup, "Import", "import-icon");
        addWrappedImportButtons(mainGroup, COMP_DEFS, 3);



        addSection(mainGroup, "Utilities", "click-icon");
        var clickBtn = mainGroup.add("button", undefined, "Apply Click Animation");
        clickBtn.alignment = "fill";
        clickBtn.onClick = applyClickAnimation;

        addSection(mainGroup, "Color Swatches", "");
        
        // CORRECTED: Container for responsive swatches.
        var swatchContainer = mainGroup.add('group');
        swatchContainer.orientation = 'column';
        swatchContainer.alignChildren = ['left', 'top'];
        swatchContainer.spacing = 8;
        swatchContainer.alignment = 'fill';

        function redrawSwatches() {
            // Clear existing swatches before redrawing
            while (swatchContainer.children.length > 0) {
                swatchContainer.remove(swatchContainer.children[0]);
            }

            var availableWidth = swatchContainer.size.width > 0 ? swatchContainer.size.width : win.size.width - 30;
            var swatchSize = 31;
            var swatchSpacing = 8;
            var itemsPerRow = Math.max(1, Math.floor(availableWidth / (swatchSize + swatchSpacing)));
            
            var row;
            for (var i = 0; i < SWATCH_COLORS.length; i++) {
                if (i % itemsPerRow === 0) {
                    row = swatchContainer.add('group');
                    row.orientation = 'row';
                    row.spacing = swatchSpacing;
                    row.alignChildren = ['left', 'top'];
                }
                
                (function(color) {
                    var swatch = row.add("panel");
                    swatch.minimumSize = swatch.maximumSize = [swatchSize, swatchSize];
                    swatch.graphics.backgroundColor = swatch.graphics.newBrush(swatch.graphics.BrushType.SOLID_COLOR, color);
                    swatch.helpTip = "RGB: " + Math.round(color[0]*255) + ", " + Math.round(color[1]*255) + ", " + Math.round(color[2]*255);
                    swatch.addEventListener("click", function() {
                        applySwatchColor(color);
                    });
                })(SWATCH_COLORS[i]);
            }
            win.layout.layout(true);
        }

     

        win.onResize = win.onResizing = function () {
            if (this.layout) {
                this.layout.resize();
                redrawSwatches();
            }
        };
        
        win.layout.layout(true);
        redrawSwatches(); // Initial draw
        win._initialized = true;
    }

    if (win instanceof Window) {
        win.center();
        win.show();
    }

})(this);
