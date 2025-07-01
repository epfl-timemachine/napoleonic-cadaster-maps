export function randomCssColor(seed) {
    // get numeric hash from the seed
    const hash = seed.split("").reduce((acc, char) => {
        return acc + char.charCodeAt(0);
    }, 0);
    // Use the hash to generate a random number
    const randomNum = Math.abs(Math.sin(hash)) * 1000;
    // Generate a random color based on the seed
    const r = Math.floor((Math.sin(randomNum) + 1) * 127.5);
    const g = Math.floor((Math.sin(randomNum + 1) + 1) * 127.5);
    const b = Math.floor((Math.sin(randomNum + 2) + 1) * 127.5);
    return `rgb(${r}, ${g}, ${b})`;
}

export function cleanStdVal(str) {
    let val = str.toLowerCase();
    if (val && val.length > 0) {
        val = val.charAt(0).toUpperCase() + val.slice(1);
    }
    val = val.replace(/_/g, ' ');
    return val;
}

export function displayOnlyOneValueAfterComma(value) {
    if (value) {
        let str = value.toString();
        let index = str.indexOf(".");
        if (index !== -1) {
            return str.substring(0, index + 2);
        }
    }
    return value;
}

export function getColorFromGradePointsArray(d, gradePointsColors, defaultColor) {
    for (let i = 0; i < gradePointsColors.length; i++) {
        if (d > gradePointsColors[i][0]) {
            return gradePointsColors[i][1];
        }
    }
    return defaultColor;
}

// merge the two list of objects using the "geometry_id" field:
export function geometryRegistryMap(registryData) {
    const geometryRegistryMap = new Map();
    registryData.forEach(entry => {
        const geometry_id = String(entry.geometry_id);
        if (!geometryRegistryMap.has(geometry_id)) {
            geometryRegistryMap.set(geometry_id, []);
        }
        geometryRegistryMap.get(geometry_id).push(entry);
    });
    return geometryRegistryMap;
}

export function generateSpectralColorMap(valueList) {
    // Generate a spectral color map based on the valueList
    // return it as a map from the value to the color
    const colorMap = new Map();
    const N = valueList.length;
    for (let i = 0; i < N; i++) {
        // Evenly distribute hues around the color wheel (0-360)
        const hue = Math.round((i * 360) / N);
        // Use full saturation and 50% lightness for vivid colors
        const color = `hsl(${hue}, 100%, 50%)`;
        colorMap.set(valueList[i], color);
    }
    return colorMap;
}

export function addBaseSommarioniBgLayersToMap(layerControl, map) {
    const noLayer = L.tileLayer("", {
        attribution: ''
    });
    const osmLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    const cartoLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    const sommarioniBoardLayerGray = L.tileLayer("https://geo-timemachine.epfl.ch/geoserver/www/tilesets/venice/sommarioni/{z}/{x}/{y}.png",{
            attribution: '&copy; <a href="https://timeatlas.eu/">Time Atlas@EPFL</a>',
            className: "grayscale-map"
    });


    const sommarioniBoardLayerColor = L.tileLayer("https://geo-timemachine.epfl.ch/geoserver/www/tilesets/venice/sommarioni/{z}/{x}/{y}.png",{
            attribution: '&copy; <a href="https://timeatlas.eu/">Time Atlas@EPFL</a>'
    });

    const bgLayerList = {
        "No background": noLayer,
        "OpenStreetMap": osmLayer,
        "Carto": cartoLayer,
        "Cadastral Board (BW)": sommarioniBoardLayerGray,
        "Cadastral Board": sommarioniBoardLayerColor
    };

    for( let [key, value] of Object.entries(bgLayerList)){
        layerControl.addBaseLayer(value, key);
    } 
    bgLayerList["Cadastral Board (BW)"].addTo(map);
}

function formatRegistryEntryToHTML(entry, excludeCols) {
    let html = "";
    for (const [key, value] of Object.entries(entry)) {
        if (!excludeCols.includes(key) && value !== null) {    
            html += `<dt>${key}</dt> <dd>${value}</dd>`;
        } 
    }
    return html;
}


export function registryListToHTML(allRegistryEntries, whichColsToExclude = 'it') {
    const operationCols = ["geometry_id", "unique_id"];
    const excludeStdCols = [
        "ownership_types",
        "qualities",
        "owner_type",
        "owner_right_of_use",
        "old_religious_entity_type",
        "old_owner_type"
    ]
    // left here in case we want to do italian version of the standard types map. 
    const excludeStdColsEn = excludeStdCols.map(col => col + "_en");
    let excludeCols = null;
    if(whichColsToExclude === 'en'){
        excludeCols = operationCols + excludeStdColsEn;
    }else{
        excludeCols = operationCols + excludeStdCols;
    }
    
    let html = ""
    if (allRegistryEntries === undefined || allRegistryEntries === null || allRegistryEntries.length === 0) {
        html = "<p>No registry entries found.</p>";
        return html;
    }else if ( allRegistryEntries.length > 1) {
        html = `<h3>${allRegistryEntries.length} entries concerned by the selection:</h2>`;
    }
    html += "<dl class='registry-list'>";
    if (allRegistryEntries && allRegistryEntries.length > 0) {
        for (let i = 0; i < allRegistryEntries.length; i++) {
            if(allRegistryEntries.length > 1){
                html += `<dt><h3>Registry Entry #${i+1}</h3></dt><dd></dd>`;
            }
            html += formatRegistryEntryToHTML(allRegistryEntries[i], excludeCols);
        }
    }
    html += "</dl>";
    return html;
}

export function pythonListStringToList(pythonListString) {
    if (typeof pythonListString !== 'string') {
        return [];
    }
    // Remove the leading and trailing brackets
    pythonListString = pythonListString.trim().slice(1, -1);
    // remove all whitespaces
    pythonListString = pythonListString.replace(/\s+/g, '');
    // Split the string by commas
    // Use a regex to split by commas
    const regex = /(?<!\w),(?!\w)/;
    const items = pythonListString.split(regex);
    // Remove leading and trailing whitespace from each item
    const cleanedItems = items.map(item => item.trim().replace(/^\s+|\s+$/g, ''));
    // Remove leading and trailing quotes from each item
    const finalItems = cleanedItems.map(item => {
        if (item.startsWith("'") && item.endsWith("'")) {
            return item.slice(1, -1);
        } else if (item.startsWith('"') && item.endsWith('"')) {
            return item.slice(1, -1);
        }
        return item;
    });
    return finalItems;
}