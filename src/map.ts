/// <reference path="./../../mvp/Bing-Maps-V8-TypeScript-Definitions/scripts/MicrosoftMaps/Microsoft.Maps.All.d.ts" />
// import Route from "./Route";
import {Route} from './Route';
import {Credentials} from './Credentials';



export default new function LoadMap(): void {

    let map = new Microsoft.Maps.Map(document.getElementById('myMap'), {
        credentials: Credentials.BMCredentials,
        center: new Microsoft.Maps.Location(62.3, 17.3),
        zoom: 8
    });

    Microsoft.Maps.loadModule('Microsoft.Maps.SpatialMath');
    Microsoft.Maps.loadModule('Microsoft.Maps.GeoJson');

    new Route(map);
}();
