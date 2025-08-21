---
title: Napoleonic Cadaster - property type
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
import {createMapAndLayers} from "./components/map-standard-types.js";
```

# Parcel's functions and standardised classes
_To toggle the parcel according to their types, use the layer control button on the top left corner of each map. For small amount of classes, all layers are enabled by default, while it is disabled when it is higher than 10._

## Type of Ownership – Map of Property Use in 1808 Venice

```js
const geojson = FileAttachment("./data/venice_1808_landregister_geometries.geojson").json();
const registre = FileAttachment("./data/venice_1808_landregister_textual_entries.json").json();
```

<div id="map-container-ownership-type" class="map-component"></div>

```js
const ownMapComponents = createMapAndLayers("map-container-ownership-type", geojson, registre, 'ownership_types_en', true);
```
This map visualizes the types of property use based on cadastral mentions recorded in the “**Quality**” field. Properties are classified into three categories:
* **Own use** – properties inhabited or used directly by their owner (identified through mentions such as “own use” or “owner’s dwelling”).
* **Rented/leased** – properties explicitly marked as “rented” or “leased”.
* **Public use** – including spaces like arcades or porticoes (sottoportici) designated for public circulation or collective functions.

A fourth category—**0 values**—highlights parcels where the available documentation does not allow for a reliable determination of how the property was used. These entries lack explicit mentions in the Quality field that would indicate either owner-occupation or tenancy, and are thus left indeterminate.

The resulting spatial pattern reveals a city where a significant portion of properties were already rented out, suggesting the widespread presence of a **rental housing economy** in early 19th-century Venice. The distinction between private, public, and leased usage allows us to better understand not only patterns of ownership, but also the ways in which urban space was inhabited and monetized.


## Map of Parcel Functions – Standardized Categories from 1808
<div id="map-container-func-type" class="map-component"></div>

```js
const funMapComponents = createMapAndLayers("map-container-func-type", geojson, registre, 'qualities_en', false);
```
This map displays the functional categories of cadastral parcels as recorded in the “**Quality**” field of the 1808 Venetian land register. All textual mentions have been transcribed, standardized, and translated into English to make the data accessible and comparable.

To preserve the historical and cultural specificity of the original language, certain terms with distinctly **Venetian meanings** have been retained in their original form. These include:
* _Calle_ (narrow street)
* _Campanile_ (bell tower)
* _Casino_ (small private residence or meeting house)
* _Casotto_ (small shed or kiosk)
* _Chiovere_ (space for textile drying or bleaching)
* _Fondamenta_ (street along a canal with a foundation wall)

These terms reflect the unique spatial vocabulary of Venice in the early 19th century and are part of the city’s historical urban fabric.

The classification allows users to filter and explore the city’s spatial organization by function, revealing not only places of residence and commerce, but also religious, civic, and infrastructural uses distributed across the urban landscape.


## Class of current (1808) Standardized Owner 
<div id="map-container-own-class" class="map-component"></div>

```js
const funMapComponents = createMapAndLayers("map-container-own-class", geojson, registre, 'owner_standardised_class', true);
```

This map visualizes land parcels in 1808 according to **standardized owner macroclasses**. It highlights the transformed landscape of property in post-Republican Venice following major expropriations carried out under Napoleonic rule.

While **religious institutions** and **Scuole Grandi** appear only marginally in the current 1808 ownership map, many of their former holdings—along with those of **convents** and **confraternities** (both large and small)—have been transferred to **public ownership**, represented here by the macroclass labeled “**Venezia entities**”. These include properties seized, repurposed, or reassigned by the Napoleonic administration.

This visualization captures the **present state of ownership as of 1808**, after many of these institutional properties had already been suppressed or confiscated. For a comparative view, users can consult the “**Old Owner Type**” map, which reconstructs ownership before the expropriations. There, the former extent of religious and charitable property can be appreciated more fully.

In the dedicated section on [Expropriations from Private Institutions](expropriation-map), further detail is available, including:

* A granular map of institutional suppressions
* Quantitative summaries
* Filters by ownership type and surface area

Together, these layers offer a powerful means to study the redistribution of urban property and the secularization of space in early 19th-century Venice.


## Type of Owner – Property Classification by Religious and Secular Affiliation
<div id="map-container-own-type" class="map-component"></div>

```js
const funMapComponents = createMapAndLayers("map-container-own-type", geojson, registre, 'owner_type', true);
```
This map visualizes cadastral parcels in 1808 according to the **typology of ownership**, categorized as **Religious**, **Secular**, or **Secular-Religious**. These categories reflect both the institutional affiliations and the intended function of each property.
* **Religious** parcels include churches, convents, and associated buildings that retained their religious function or were still owned by clergy or religious orders.
* **Secular** parcels include all other forms of ownership, encompassing both private individuals and public institutions. This broad category includes properties belonging to: the **municipality of Venice**, the **Crown**, newly established **ministerial bodies** introduced by the Napoleonic administration.
* The Secular-Religious category uniquely identifies properties administered by the **Congregazione di Carità** (Congregation of Charity), an institution created after 1806 to replace the extensive welfare system formerly managed by the Scuole Grandi, Scuole Piccole, and various religious and lay confraternities. While it operated under the authority of the Napoleonic state, its mission and assets inherited a deep-rooted charitable vocation from the pre-existing hybrid system of welfare. The mixed classification of the Congregazione di Carità recognizes both its **public administrative structure** and its **continuity with religious charitable traditions**, marking it as a product of transition between old regime and modern governance.

## Owner Right of Use – Typologies of Ecclesiastical and Institutional Property
<div id="map-container-own-ros" class="map-component"></div>

```js
const funMapComponents = createMapAndLayers("map-container-own-ros", geojson, registre, 'owner_right_of_use_en', false);
```
This map explores the various **types of rights of use** associated with land parcels in 1808 Venice, with particular attention to the **specific legal and hierarchical statuses** of religious ownership.

In the cadastral records, ecclesiastical owners rarely appear without qualification. Ownership is typically tied to a precise **form of right**—such as **benefice, prebend, commissary,** or **livellary**—and often associated with a specific **clerical rank**(e.g. “benefit of the second priest” or “parish priest’s prebend”). These distinctions provide valuable insights into the way religious property was structured and distributed.
This typology reflects a complex system of **ecclesiastical privileges and endowments**, where properties were not simply assigned to institutions, but linked to **offices, liturgical roles, or charitable responsibilities**. Such information can support **socio-economic and institutional research**, especially when examining how wealth and urban space were managed by religious actors under both the Republic and the Napoleonic administration.
In addition to religious categories, the map also includes **secular owner rights**, including private individuals, institutions, and public entities, allowing users to compare the **internal diversity of legal and administrative status** across the city’s property landscape.

## Religious types
<!-- ## old entity religious type -->
<div id="map-container-old-ent-reg-type" class="map-component"></div>

```js
const funMapComponents = createMapAndLayers("map-container-old-ent-reg-type", geojson, registre, 'old_religious_entity_type_en', true);
```
This map visualizes the **titles attributed to ecclesiastical owners** in the cadastral records, focusing on how religious institutions were labeled—specifically as **convents** or **monasteries**.

Historical analysis of the data reveals that the distinction between these terms was not applied consistently. In fact, the same institution is sometimes referred to in the records as both a **convent** and a **monastery**, without apparent concern for standardization.

Moreover, the use of these titles in 1808 does **not reflect a gendered division** as in modern usage. While today "convent" is typically associated with female religious orders and "monastery" with male ones, this distinction does not hold in the cadastral documentation from early 19th-century Venice. The inconsistency in terminology offers important insights into both the **linguistic habits** and the **administrative practices** of the time.


## Class of previous standardized Owner 
<div id="map-container-old-class-own" class="map-component"></div>

```js
const funMapComponents = createMapAndLayers("map-container-old-class-own", geojson, registre, 'old_entity_standardised_class', true);
```

