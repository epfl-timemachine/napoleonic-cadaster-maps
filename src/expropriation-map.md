---
title: Napoleonic Cadaster - Expropriation Map
toc: false
style: components/custom-style.css
---

```js
// Explicit import of leaflet to avoid issues with the Leaflet.heat plugin
import L from "npm:leaflet";
```

```js
// Wait for L to be defined before importing the Leaflet.heat plugin
// This is necessary because Leaflet.heat depends on the L variable being defined
if (L === undefined) console.error("L is undefined");

// Leaflet.heat: https://github.com/Leaflet/Leaflet.heat/
import "./plugins/leaflet-heat.js";
import {createExpropriationParcelMap, createExpropriationParishMap, formatNameGeometryIdStringIntoHref, returnBoundExtentOfGeometryList} from "./components/map-expropriation.js";
```

# Expropriations of private properties



_Clicking on each parcel reveal from which institution the parcel used to belong, and to which state-controlled institution it was transferred. The control on the top right allows to select layer according to which group of type of institution has been expropriated. Red parcels are parcels for which an expropriation happened, but the register lacked information of the previous owner._

```js
const parcelData = FileAttachment("./data/venice_1808_landregister_geometries.geojson").json();
const registre = FileAttachment("./data/venice_1808_landregister_textual_entries.json").json();
const parishData = FileAttachment("./data/1740_redrawn_parishes_cleaned_wikidata_standardised.geojson").json();
```

<!-- Create the map container -->
<div id="map-container-expropriations" class="map-component" style="height: 750px;"></div>

```js
// Call the creation function and store the results
const expropriationMap = createExpropriationParcelMap("map-container-expropriations", parcelData, registre);

// affecting values to the window is the easiest way to break the observable sandbox and make code available in the plain JS context of the webpage.
window.highlightExpropriationFeatures = (geometryIdList) => {
    expropriationMap.geoJsonLayer.resetStyle();
    expropriationMap.map.flyTo(returnBoundExtentOfGeometryList(geometryIdList.map(a => expropriationMap.geometryIdFeatureMap.get(String(a)))), 15.4); 
    for (const id of geometryIdList) {
        expropriationMap.geometryIdFeatureMap.get(String(id)).setStyle({
            weight: 5,
            color: '#FF0000',
            dashArray: '',
            fillOpacity: 0.7
        });
    }
};

window.geometryIdFeatureMap = expropriationMap.geometryIdFeatureMap;
```

### Most expropriated institutions

<!-- Create the table container -->

<div class="block-container">
<div id="table-container-expropriation-ranking"></div>
</div>

```js
const table = Inputs.table(expropriationMap.tableDataStolen, {
    header: {
        name: "Expropriated instituion name",
        surface: "Expropriation size (m2)"
    },
    format: {
       surface: x => x.toFixed(1),
       name: y => formatNameGeometryIdStringIntoHref(y)
    }, 
    select: false
});
document.getElementById("table-container-expropriation-ranking").append(table)
```


<!-- Create the tanble container -->
<div class="block-container">
<div id="barchart-container-expropriation-ranking" style="width: 1000px; margin: 1em 0 2em 0;"></div>
</div>

```js
const chart = Plot.barY(expropriationMap.tableGroupStolen, {x: "name", y: "surface"}, Plot.axisX({label: null, lineWidth: 8, marginBottom: 40})).plot({marginLeft: 160, width:1000});
document.getElementById("barchart-container-expropriation-ranking").append(chart);
```
The cadastral records of 1808 offer a unique snapshot of Venice in the midst of profound institutional transformation. One of the most striking features visible through the parcel-level data is the **effect of Napoleonic expropriations**, especially the secularization of religious properties.

During the early 19th century, under Napoleonic rule, a vast program of **suppression of religious orders and confraternities** was implemented across the former Venetian Republic. As a result, large tracts of land, buildings, convents, churches, and charitable institutions were **confiscated and transferred** to the public domain. These now appear in the dataset as properties owned by "**Venezia entities**", representing the city’s administration, or by other **state-aligned bodies**, such as newly established ministries or public welfare institutions.

The **visible outcome** of these expropriations in the 1808 dataset is a **marked reduction in religious ownership**, and the **emergence of hybrid or transitional forms** of ownership. Notably, some institutions like the *Congregazione di Carità* were created to inherit the social functions of suppressed religious bodies under public oversight—reflecting a shift from spiritual to state-managed charity.

Through spatial analysis, we observe:
* The **concentration of expropriated properties** in central parishes, where major convents and Scuole Grandi were located.
* The **redistribution of land** into fewer, larger parcels under secular management.
* The persistence of **ecclesiastical titles** on properties that no longer served a religious community, revealing how the **vocabulary of ownership lagged behind institutional change**.

These transformations, driven by both ideology and financial necessity, reshaped the city’s urban fabric and laid the groundwork for **modern public administration** and real estate patterns that continued well into the 19th century.

This map visualizes the properties of religious and secular moral institutions that were affected by the Napoleonic **expropriations** in early 19th-century Venice. Accompanying statistics identify the institutions most impacted, ranked by the total surface area of confiscated parcels (in square meters).

Among the notable findings is the case of the **Monastery of San Girolamo**, which emerges as the largest single institution affected in terms of expropriated area. This result sheds new light on previously understudied conventual and monastic complexes, revealing the breadth and fragmentation of their real estate holdings. Many of these properties extended well beyond the immediate surroundings of the religious site and were scattered across various parts of the city—what might be described as a **“satellite” ownership model**.

This spatial logic also applies to several major charitable institutions, such as the **Scuole Grandi**, whose urban footprint was significantly reconfigured during this period. Traditionally tied to trade guilds and confraternal networks, these institutions were major actors in the moral and social infrastructure of the Republic. Their transformation under Napoleonic policy marked not only the suppression of religious orders, but also a **systematic dismantling of the Republic’s model of moral ownership**.

The data point to a **radical shift in Venice’s urban property regime**: a decimation of ecclesiastical and confraternal landholdings, replaced by a growing presence of **public institutions and secular authorities**. In this sense, the expropriations did not merely represent a legal or administrative reform—they enacted a **revolution in the urban fabric**, remapping the city’s material and institutional landscape.

### Ranking of the institution receiving the most surface

<!-- Create the tanble container -->
<div class="block-container">
<div id="table-container-receive-ranking" style="width: 700px; margin: 1em 0 2em 0;"></div>
</div>

```js
const table = Inputs.table(expropriationMap.tableDataReceived, {
    header: {
        name: "Receiving instituion name",
        surface: "Received area size (m2)"
    },
    format: {
       surface: x => x.toFixed(1)
    }, 
    select: false
});
document.getElementById("table-container-receive-ranking").append(table);
```


<!-- Create the tanble container -->
<div class="block-container">
<div id="barchart-container-received-propriety"></div>
</div>

```js
const chartReceived = Plot.barX(expropriationMap.tableDataReceived, {y: "name", x: "surface"}, Plot.axisY({label: null})).plot({marginLeft: 230, width:1000});
document.getElementById("barchart-container-received-propriety").append(chartReceived);
```
This analysis is further enriched by data identifying the **institutions that received the expropriated properties**. The table shown provides a representative sample of the receiving entities and the corresponding surface area in square meters.

As the data indicates, the principal beneficiary was the “**Città di Venezia**”, which alone received over 314,000 m² of former ecclesiastical and confraternal property. This was followed by central administrative bodies of the Napoleonic and post-Napoleonic state, including the **Ministero della Guerra**, the **Comune di Venezia**, and various **branches of the national demanio** (state property administration). The **Prefettura di Venezia** and ministries of interior and finance also appear as minor recipients.

One striking aspect of this redistribution is the emergence of **public and military authorities as dominant new property holders** in the urban landscape. The diversity of institutional categories (municipal, military, fiscal) illustrates how the expropriations served not only to dismantle the previous moral infrastructure but to construct a **new administrative and political geography**.

# Percentage of expropriated surface per parish delimitations:


<div id="map-container-parish-expropriation-size-hm" class="map-component"></div>

```js
// Call the creation function and store the results
const parishMapComponents = createExpropriationParishMap("map-container-parish-expropriation-size-hm", parcelData, registre, parishData);

// affecting values to the window is the easiest way to break the observable sandbox and make code available in the plain JS context of the webpage.
window.highlightFeature = (name) => {
    parishMapComponents.geoJsonLayerParish.resetStyle();
    // for some reason, observable does not let me set intermediat variable, so all action on layer has to call the layer from the hashMap again.
    parishMapComponents.map.flyTo(parishMapComponents.parishNameLayerMap.get(name).getBounds().getCenter(), 15.4);
    parishMapComponents.parishNameLayerMap.get(name).setStyle({
        weight: 5,
        color: '#FFF',
        dashArray: '',
        fillOpacity: 0.7
    });
    parishMapComponents.parishNameLayerMap.get(name).bringToFront();
    parishMapComponents.parishNameLayerMap.get(name).openPopup();
};
```
<!-- Create the tanble container -->
<div class="block-container">
<div id="table-container-parish-expropriation-surface-ranking"></div>
</div>

```js
const table = Inputs.table(parishMapComponents.tableData, {
    header: {
        name: "Parish Name",
        expropriation_percentage: "Percentage of expropriated surface",
    },
    format: {
        name: id => htl.html`<a class="hover-line table-row-padding" onclick=window.highlightFeature("${id}");>${id}</a>`,
       expropriation_percentage: x => String((x*100.0).toFixed(2))+'%'
    }, 
    select: false
});
document.getElementById("table-container-parish-expropriation-surface-ranking").append(table)
```