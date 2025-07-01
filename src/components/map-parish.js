// Explicit import of leaflet to avoid issues with the Leaflet.heat plugin
import L from "npm:leaflet";


if (L === undefined) console.error("L is undefined");

// Leaflet.heat: https://github.com/Leaflet/Leaflet.heat/
import "../plugins/leaflet-heat.js";
import { geometryRegistryMap, addBaseSommarioniBgLayersToMap, displayOnlyOneValueAfterComma, getColorFromGradePointsArray } from "./common.js";

let gradePointsColors = [
    // [2000, ''],
    [1000,'#FFEDA0'],
    [500, '#FED976'],
    [400, '#FEB24C'],
    [300, '#FD8D3C'],
    [200, '#FC4E2A'],
    [100 , '#E31A1C'],
    [0, '#BD0026']
];

function style(feature) {
    return {
        fillColor: getColorFromGradePointsArray(feature.properties.average_surface, gradePointsColors, '#800026'),
        weight: 0,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}

function average(l) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < l.length; i++) {
        if (l[i] > 0) {
            sum += l[i];
            count++;
        }
    }
    return count > 0 ? sum / count : 0;
}

function median(l) {
    if (l.length === 0) {
        return 0;
    }
    l.sort((a, b) => a - b);
    const mid = Math.floor(l.length / 2);
    if (l.length % 2 === 0) {
        return (l[mid - 1] + l[mid]) / 2;
    } else {
        return l[mid];
    }
}


// Create Map and Layer - Runs Once
export function createParishCasaAverageSurfaceHeatMap(mapContainer, parcelData, registryData, parishData) {
    const map = L.map(mapContainer, {minZoom: 0, maxZoom:18}).setView([45.4382745, 12.3433387 ], 14);

    // Crate a control to switch between layers
    const layerControl = L.control.layers().addTo(map);
    addBaseSommarioniBgLayersToMap(layerControl, map);

    let registryMap = geometryRegistryMap(registryData);
    //filtering the data to keep only geometries referenced in the registry (i.e. the ones having a geometry_id value)
    let feats = parcelData.features.filter(feature => feature.properties.geometry_id);

    // then fetching the surface of all the geometries referenced in the registry and adding them to the properties of the features
    parcelData.features = feats.filter(feature => {
        const geometry_id = String(feature.properties.geometry_id);
        const registryEntries = registryMap.get(geometry_id);
        let isCasa = false;
        if (registryEntries) {
            registryEntries.forEach(entry => {
                if (entry["qualities"]) {
                    let vals = entry["qualities"];
                    for (let i = 0; i < vals.length; i++) {
                        let value = vals[i];
                        if (value == 'CASA') {
                           isCasa = true; 
                        }
                    }
                }
            });
        }
        return isCasa;
    });


    parishData.features = parishData.features.map(feature => {
        const parishName = feature.properties.NAME;
        const parcelWithParish = parcelData.features.filter(parcel => parcel.properties.parish_standardised === parishName);
        // groupby all the parcelData with the same greometry_id, summing all the area, and then doing the average and median
        const parcelGroups = Object.groupBy(parcelWithParish, parcel => parcel.properties.geometry_id);
        const parcelsArea = Object.values(parcelGroups).map(group => {return group.reduce((acc, parcel) => acc + parcel.properties.area, 0.0)});
        const averageSurface = average(parcelsArea);
        const medianSurface = median(parcelsArea);
        feature.properties['average_surface'] = averageSurface;
        feature.properties['median_surface'] = medianSurface;
        return feature;
    });

    parishData.features = parishData.features.filter(feature =>  feature.properties.average_surface > 0);

    // define the geoJsonLayer variable outside the function
    // so that it can be accessed in the resetHighlight function
    // and the resetHighlight function can be called from the onEachFeature function
    let geoJsonLayerAverage = null;
    let tableData = structuredClone(parishData).features.map(feature => {
        return {
            name: feature.properties.NAME,
            average_surface: feature.properties.average_surface,
            median_surface: feature.properties.median_surface
        };
    });
    
    function resetHighlight(e) {
        geoJsonLayerAverage.resetStyle(e.target);
    }
    function highlightFeature(e) {
        // so that highlight set by the row from the table ranking also gets resetted.
        geoJsonLayerAverage.resetStyle();
        let layer = e.target;
        layer.setStyle({
            weight: 5,
            color: '#FFF',
            dashArray: '',
            fillOpacity: 0.7
        });

        layer.bringToFront();
    }
    
    let parishNameLayerMap = new Map();

    geoJsonLayerAverage = L.geoJSON(parishData, {style: style, onEachFeature: (feature, featureLayer) => {
        featureLayer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight // still necessary to avoid the parish still being highlighted when the mouse is out of the map
        })
        parishNameLayerMap.set(feature.properties.NAME, featureLayer);
        // Add a popup to the feature layerr
        featureLayer.bindPopup("<div>"+feature.properties.NAME+"</div>", {'maxWidth':'500','maxHeight':'350','minWidth':'50'});
        featureLayer.bindTooltip("<div class='popup'>"+displayOnlyOneValueAfterComma(feature.properties.average_surface)+"m2</div>");
    }}).addTo(map);


    let legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {
        let div = L.DomUtil.create('div', 'info legend'),
            grades = gradePointsColors.map(color => color[0]).reverse();

        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
            '<i style="background:' + getColorFromGradePointsArray(grades[i] + 1, gradePointsColors, '#FFEDA0') + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }

        return div;
    };
    legend.addTo(map);

    // Return the the map instance, the layer group, and the mapping
    return { map, layerControl, geoJsonLayerAverage, tableData, parishNameLayerMap }
}
