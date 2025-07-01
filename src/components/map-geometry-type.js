// Explicit import of leaflet to avoid issues with the Leaflet.heat plugin
import L from "npm:leaflet";


if (L === undefined) console.error("L is undefined");

// Leaflet.heat: https://github.com/Leaflet/Leaflet.heat/
import "../plugins/leaflet-heat.js";
import { addBaseSommarioniBgLayersToMap, displayOnlyOneValueAfterComma, getColorFromGradePointsArray } from "./common.js";

let gradePointsColors = [
    [0.9, '#800026'],
    [0.8, '#BD0026'],
    [0.7, '#E31A1C'],
    [0.6, '#FC4E2A'],
    [0.5, '#FD8D3C'],
    [0.4 , '#FEB24C'],
    [0.3, '#FED976'],
    [0, '#FFEDA0']
];

function style(feature) {
    return {
        fillColor: getColorFromGradePointsArray(feature.properties.geotype_percentage, gradePointsColors, '#FFEDA0'),
        weight: 0,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}

const WHITE = '#FFFFFF';
const ORANGE = '#FF8C00';
const PINK = '#FF69B4';
const LIGHTBLUE = '#ADD8E6';
const BEIGE = '#F5F5DC';
const BLACK = '#000000';

let geometryTypeToColor = {
    'building': PINK,
    'water': LIGHTBLUE,
    'sottoportico': ORANGE,
    'street': BEIGE,
    'courtyard': WHITE,
}

function cartographicStyle(feature) {
    let fillColor = geometryTypeToColor[feature.properties.geometry_type] || BLACK; // Default to black if the type is not recognized
    return {
        fillColor: fillColor,
        weight: 0,
        opacity: 1,
        color: fillColor,
        fillOpacity: 0.7
    };
}

export function createGeometryTypeColoredMap(mapContainer, parcelData) {
     const map = L.map(mapContainer, {minZoom: 0, maxZoom:18}).setView([45.4382745, 12.3433387 ], 14);

    const layerControl = L.control.layers().addTo(map);

    // Add all default layers to the map.
    addBaseSommarioniBgLayersToMap(layerControl, map);

    let mapLayerGroups = {};

    function onEachFeature(feature, featureLayer) {
        let value = feature.properties.geometry_type;
        var lg = mapLayerGroups[value];
        if (lg === undefined) {
            lg = new L.layerGroup();
            //add the layer to the map
            lg.addTo(map);
            //store layer
            mapLayerGroups[value] = lg;
        }
        featureLayer.setStyle(cartographicStyle(feature));
        lg.addLayer(featureLayer);    
    }

    parcelData.features = parcelData.features.filter(feature => feature.properties.geometry_type !== undefined && feature.properties.geometry_type !== null);
    const geoJsonLayer = L.geoJSON(parcelData, {
            onEachFeature: onEachFeature,
        }).addTo(map);
    for (const [key, value] of Object.entries(mapLayerGroups)) {
        layerControl.addOverlay(value, key);
    }

    // Return the the map instance, the layer group, and the mapping
    return { map, layerControl, geoJsonLayer, mapLayerGroups };
}

export function createParishGeometryTypeMap(map, originalParcelData, originalParishData, geometryType) {
    // filtering from geometryType below might overwrite original data if don't clone it beforehand. 
    const parcelData = structuredClone(originalParcelData);
    const parishData = structuredClone(originalParishData);
    // Crate a control to switch between layers
    const layerControl = L.control.layers().addTo(map);
    addBaseSommarioniBgLayersToMap(layerControl, map);


    //filtering the data to keep only geometries referenced related to the type selected. 
    parcelData.features = parcelData.features.filter(feature => feature.properties.geometry_type === geometryType);
    let parishGroup = Object.groupBy(parcelData.features, v => v.properties.parish_standardised);
    let tableParishGeoType = Object.entries(parishGroup).map(([key, value]) => {
        return {
            name: key,
            surface: value.reduce((acc, curr) => acc + curr.properties.area, 0)
        };
    });
    let parishSurfaceMap = new Map();
    tableParishGeoType.forEach(parish => {
        parishSurfaceMap.set(parish.name, parish.surface);
    });

    parishData.features = parishData.features.map(feature => {
        const parishName = feature.properties.NAME;
        let geotypeSurface = (parishSurfaceMap.get(parishName) || 0)
        feature.properties['geotype_surface'] = geotypeSurface;
        feature.properties['geotype_percentage'] = geotypeSurface / feature.properties.area;
        return feature;
    }).filter(feature => feature.properties.geotype_surface > 0);

    // define the geoJsonLayer variable outside the function
    // so that it can be accessed in the resetHighlight function
    // and the resetHighlight function can be called from the onEachFeature function
    let geoJsonLayerParish = null;
    let tableData = structuredClone(parishData).features.map(feature => {
        return {
            name: feature.properties.NAME,
            geotype_percentage: feature.properties.geotype_percentage
        };
    });
    
    function resetHighlight(e) {
        geoJsonLayerParish.resetStyle(e.target);
    }
    function highlightFeature(e) {
        // so that highlight set by the row from the table ranking also gets resetted.
        geoJsonLayerParish.resetStyle();
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

    geoJsonLayerParish = L.geoJSON(parishData, {style: style, onEachFeature: (feature, featureLayer) => {
        featureLayer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight // still necessary to avoid the parish still being highlighted when the mouse is out of the map
        })
        parishNameLayerMap.set(feature.properties.NAME, featureLayer);
        // Add a popup to the feature layerr
        featureLayer.bindPopup("<div>"+feature.properties.NAME+"</div>", {'maxWidth':'500','maxHeight':'350','minWidth':'50'});
        featureLayer.bindTooltip("<div class='popup'>"+displayOnlyOneValueAfterComma(100*feature.properties.geotype_percentage)+"%</div>");
    }}).addTo(map);


    let legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {
        let div = L.DomUtil.create('div', 'info legend');
        let grades = gradePointsColors.map(color => color[0]).reverse();

        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            let gradeI = grades[i]*100;
            let gradeIPlusOne = grades[i + 1] ? grades[i + 1] * 100 : '';
            div.innerHTML +=
            '<i style="background:' + getColorFromGradePointsArray(grades[i]+0.01, gradePointsColors, '#FFEDA0') + '"></i> ' +
            gradeI + (gradeIPlusOne ? '&ndash;' + gradeIPlusOne + '%<br>' : '%+');
        }

        return div;
    };
    legend.addTo(map);

    // Return the the map instance, the layer group, and the mapping
    return { map, layerControl, geoJsonLayerParish, tableData, parishNameLayerMap, totalSurface: parishData.features.reduce((acc, curr) => acc + curr.properties.area, 0) };
}