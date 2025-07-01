// Explicit import of leaflet to avoid issues with the Leaflet.heat plugin
import L from "npm:leaflet";


if (L === undefined) console.error("L is undefined");

// Leaflet.heat: https://github.com/Leaflet/Leaflet.heat/
import "../plugins/leaflet-heat.js";
import { html } from "htl";
import { geometryRegistryMap, addBaseSommarioniBgLayersToMap, displayOnlyOneValueAfterComma, getColorFromGradePointsArray, cleanStdVal } from "./common.js";


function addExpropriationDataOnParcelFeatures(feature, registryMap) {
    const publicEntity = "venezia_entities";
    const geometry_id = String(feature.properties.geometry_id);
    const registryEntries = registryMap.get(geometry_id);
    let expropriations = [];
    if (registryEntries) {
        registryEntries.forEach(entry => {
            if (entry["owner_standardised_class"] === publicEntity 
                && entry["old_entity_standardised_class"] !== publicEntity 
                && entry["old_entity_standardised_class"] !== ""
                && entry["old_entity_standardised_class"] !== null) {
                expropriations.push(entry);
            }
        });
    }
    feature.properties["expropriations"] = expropriations;
    return feature;
}


let gradePointsColors = [
    [0.1, '#800026'],
    [0.09, '#BD0026'],
    [0.075, '#E31A1C'],
    [0.06, '#FC4E2A'],
    [0.045, '#FD8D3C'],
    [0.03 , '#FEB24C'],
    [0.015, '#FED976'],
    [0, '#FFEDA0']
];

function style(feature) {
    return {
        fillColor: getColorFromGradePointsArray(feature.properties.expropriation_percentage, gradePointsColors, '#FFEDA0'),
        weight: 0,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}

export function createExpropriationParishMap(mapContainer, parcelData, registryData, parishData) {

        const map = L.map(mapContainer, {minZoom: 0, maxZoom:18}).setView([45.4382745, 12.3433387 ], 14);
    
        // Crate a control to switch between layers
        const layerControl = L.control.layers().addTo(map);
        addBaseSommarioniBgLayersToMap(layerControl, map);
    
        let registryMap = geometryRegistryMap(registryData);
        //filtering the data to keep only geometries referenced in the registry (i.e. the ones having a geometry_id value)
        let feats = parcelData.features.filter(feature => feature.properties.geometry_id);
        // we still need to single out the expropriations from the parcels. 
        parcelData.features = feats.map(feature => {
            return addExpropriationDataOnParcelFeatures(feature, registryMap);
        }).filter(feature => feature.properties.expropriations.length > 0);

        let parishGroup = Object.groupBy(parcelData.features, v => v.properties.parish_standardised);
        let tableParishStolen = Object.entries(parishGroup).map(([key, value]) => {
            return {
                name: key,
                surface: value.reduce((acc, curr) => acc + curr.properties.area, 0)
            };
        });
        let parishSurfaceMap = new Map();
        tableParishStolen.forEach(parish => {
            parishSurfaceMap.set(parish.name, parish.surface);
        });

        parishData.features = parishData.features.map(feature => {
            const parishName = feature.properties.NAME;
            let expropriationSurface = (parishSurfaceMap.get(parishName) || 0)
            feature.properties['expropriation_surface'] = expropriationSurface;
            feature.properties['expropriation_percentage'] = expropriationSurface / feature.properties.area;
            return feature;
        }).filter(feature => feature.properties.expropriation_surface > 0);
    
        // define the geoJsonLayer variable outside the function
        // so that it can be accessed in the resetHighlight function
        // and the resetHighlight function can be called from the onEachFeature function
        let geoJsonLayerParish = null;
        let tableData = structuredClone(parishData).features.map(feature => {
            return {
                name: feature.properties.NAME,
                expropriation_percentage: feature.properties.expropriation_percentage
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
            featureLayer.bindTooltip("<div class='popup'>"+displayOnlyOneValueAfterComma(100*feature.properties.expropriation_percentage)+"%</div>");
        }}).addTo(map);
    
    
        let legend = L.control({position: 'bottomright'});
    
        legend.onAdd = function (map) {
            let div = L.DomUtil.create('div', 'info legend'),
                grades = gradePointsColors.map(color => color[0]).reverse();
    
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
        return { map, layerControl, geoJsonLayerParish, tableData, parishNameLayerMap }
    
}

export function formatNameGeometryIdStringIntoHref(val) {
    let [name, geometryId] = val.split('|');
    let geometryIds = geometryId.split(',').map(v => Number(v.trim()));
    return html`<a class="hover-line table-row-padding" onclick=window.highlightExpropriationFeatures([${geometryIds}]);>${name}</a>`;
}

export function returnBoundExtentOfGeometryList(geometryList) {
    if (geometryList.length === 0) {
        return [[0, 0], [0, 0]];
    }
    let bounds = geometryList.map(geometry => {
        return geometry.getBounds();
    });
    let minLat = Math.min(...bounds.map(b => b.getSouthWest().lat));
    let maxLat = Math.max(...bounds.map(b => b.getNorthEast().lat));
    let minLng = Math.min(...bounds.map(b => b.getSouthWest().lng));
    let maxLng = Math.max(...bounds.map(b => b.getNorthEast().lng));
    return {lat: (minLat+maxLat)/2, lon: (minLng+maxLng)/2}
}

export function createExpropriationParcelMap(mapContainer, parcelData, registryData) {
    const map = L.map(mapContainer, {minZoom: 0, maxZoom:18}).setView([45.4382745, 12.3433387 ], 14);

    // Crate a control to switch between layers
    const layerControl = L.control.layers().addTo(map);
    addBaseSommarioniBgLayersToMap(layerControl, map);

    let registryMap = geometryRegistryMap(registryData);
    //filtering the data to keep only geometries referenced in the registry (i.e. the ones having a geometry_id value)
    let feats = parcelData.features.filter(feature => feature.properties.geometry_id);

    // then fetching the surface of all the geometries referenced in the registry and adding them to the properties of the features
    parcelData.features = feats.map(feature => {
        return addExpropriationDataOnParcelFeatures(feature, registryMap);
    }).filter(feature => feature.properties.expropriations.length > 0);

    let mapLayerGroups = {};

    let geometryIdFeatureMap = new Map();
    function onEachFeature(feature, featureLayer) {
        let values = feature.properties["expropriations"];
        for (let i = 0; i < values.length; i++) {
            let value = values[i].old_entity_standardised_class;
            var lg = mapLayerGroups[value];
            if (lg === undefined) {
                lg = new L.layerGroup();
                mapLayerGroups[value] = lg;
            }

            lg.addTo(map);
            lg.addLayer(featureLayer);
        }    

        geometryIdFeatureMap.set(String(feature.properties.geometry_id), featureLayer);

        let allRegistryEntries = registryMap.get(feature.properties.geometry_id);
        allRegistryEntries = allRegistryEntries.filter(entry => entry["old_entity_standardised"] !== null)
        let html = `<dl class="registry-list">`;
        const entryFormatting = (old_owner, new_owner) => `<dt>Previous owner:</dt><dd>${old_owner}</dd><dt>Owner in 1808:</dt> <dd>${new_owner}</dd>`
        for(let i = 0; i < allRegistryEntries.length; i++) {
            const entry = allRegistryEntries[i];
            if(allRegistryEntries.length > 1){
                html += `<dt><h3>Registry Entry #${i+1}</h3></dt><dd></dd>`;
            }
            html += entryFormatting(entry.old_entity_standardised, entry.owner_standardised)
        }
        html += "</dl>";
        // Add a popup to the feature layer
        featureLayer.bindPopup(html, {'maxWidth':'500','maxHeight':'350','minWidth':'350'});
    }

    
    let expropriationStats = structuredClone(parcelData).features.map(feature => {
        return feature.properties.expropriations.map(expropriation => {
            return {
                geometry_id : feature.properties.geometry_id,
                previous_owner_name: expropriation.old_entity_standardised.trim(),
                owner_name: expropriation.owner_standardised.trim(),
                surface: feature.properties.area,
                group: expropriation.old_entity_standardised_class.trim()
            };
        });
    }).flat();

    let tableDataStolen = Object.groupBy(expropriationStats, v => v.previous_owner_name);
    tableDataStolen = Object.entries(tableDataStolen).map(([key, value]) => {
        let totalSurface = value.reduce((acc, curr) => acc + curr.surface, 0);
        let allGeometryIds = value.map(v => v.geometry_id);
        return {
            name: key + '|' + String(allGeometryIds),
            surface: totalSurface
        };
    });
    tableDataStolen = tableDataStolen.sort((a, b) => b.surface - a.surface);

    let tableGroupStolen = Object.groupBy(expropriationStats, v => v.group);
    tableGroupStolen = Object.entries(tableGroupStolen).map(([key, value]) => {
        let totalSurface = value.reduce((acc, curr) => acc + curr.surface, 0);
        return {
            name: cleanStdVal(key),
            surface: totalSurface
        };
    });
    tableGroupStolen = tableGroupStolen.sort((a, b) => b.surface - a.surface);


    let tableDataReceived = Object.groupBy(expropriationStats, v => v.owner_name);
    tableDataReceived = Object.entries(tableDataReceived).map(([key, value]) => {
        let totalSurface = value.reduce((acc, curr) => acc + curr.surface, 0);
        return {
            name: key,
            surface: totalSurface
        };
    });
    tableDataReceived = tableDataReceived.sort((a, b) => b.surface - a.surface);

    let geoJsonLayer = L.geoJSON(parcelData, {onEachFeature: onEachFeature}).addTo(map);    
    for (const [key, value] of Object.entries(mapLayerGroups).sort((a, b) => a[0].localeCompare(b[0]))) {
        layerControl.addOverlay(value, key);
    }

    // Return the the map instance, the layer group, and the mapping
    return { map, layerControl, geoJsonLayer, tableDataStolen, tableDataReceived, tableGroupStolen, geometryIdFeatureMap }
}
