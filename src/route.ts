/// <reference path="./../../mvp/Bing-Maps-V8-TypeScript-Definitions/scripts/MicrosoftMaps/Microsoft.Maps.All.d.ts" />
/// <reference path="../jquery.d.ts" />

import { Credentials } from './Credentials';

enum RoutePoint {
    from,
    to
}

enum Border {
    hard,
    fuzzy
}

let route: Microsoft.Maps.Polyline;
let outerIsochrone: Microsoft.Maps.Polygon;
let innerIsochrone: Microsoft.Maps.Polygon;

export class Route {
    private from: Microsoft.Maps.Location;
    private to: Microsoft.Maps.Location;
    private hardBorder: Microsoft.Maps.Location;
    private fuzzyBorder: Microsoft.Maps.Location;
    private handlerId: Microsoft.Maps.IHandlerId;

    private route: Microsoft.Maps.Polyline;
    private outerIsochrone: Microsoft.Maps.Polygon;
    private innerIsochrone: Microsoft.Maps.Polygon;
    private differenceIsochrone: Microsoft.Maps.Polygon;

    constructor(private map: Microsoft.Maps.Map) {
        this.attachEvents();
    }

    private plotIsoChrone(from: Microsoft.Maps.Location, to: Microsoft.Maps.Location, color: Microsoft.Maps.Color, entity: Microsoft.Maps.Polygon): JQueryPromise<JQueryXHR> {
        const self = this;
        const distance = Microsoft.Maps.SpatialMath.getDistanceTo(from, to, Microsoft.Maps.SpatialMath.DistanceUnits.Meters, false);
        var params = {
            "culture": "sv-se",
            "maxDistance": distance * 1.60934 / 1000
        };
        return jQuery.ajax({
            url: "https://api.labs.cognitive.microsoft.com/Routes/IsoChrone?startPoint=" + from.latitude + "," + from.longitude + "&routeMode=driving&" + $.param(params),
            beforeSend: function (xhrObj) {
                xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", Credentials.NanjingKey);
            },
            type: "GET"
        }).done(function (data) {
            var locs = new Array();
            data.Polygons[0].forEach(function (coordinate) {
                var location = new Microsoft.Maps.Location(coordinate.Latitude, coordinate.Longitude);
                locs.push(location);
            });
            var polygon = new Microsoft.Maps.Polygon(locs, { strokeColor: "#FF0000", fillColor: color });
            self.map.entities.push(polygon);
            entity = polygon;
        });
    }


    private plotRoute(response: any) {
        const coordinates = response.resourceSets[0].resources[0].routePath.line.coordinates as Array<Array<number>>;

        const locations = coordinates.map((c: Array<number>) => {
            const location = new Microsoft.Maps.Location(c[0], c[1]);
            return location;
        });

        const options = {
            strokeColor: new Microsoft.Maps.Color(0.8, 0, 0, 255),
            strokeThickness: 4
        } as Microsoft.Maps.IPolygonOptions;

        const polyline = new Microsoft.Maps.Polyline(locations, options);
        this.route = polyline;

        this.map.entities.push(polyline);
    }

    private clearMapEvent(): void {
        Microsoft.Maps.Events.removeHandler(this.handlerId);
    }

    private setCursor(cursor = "auto"): void {
        (document.querySelector("#myMap") as HTMLDivElement).style.cursor = cursor;
    }

    private tryGetRoute(): JQueryPromise<JQueryXHR> {
        if (this.from && this.to) {
            const reqUrl = `http://dev.virtualearth.net/REST/V1/Routes?wp.0=${this.from.latitude},${this.from.longitude}&wp.1=${this.to.latitude},${this.to.longitude}&routeAttributes=routePath&key=${Credentials.BMCredentials}`;
            return jQuery.ajax({
                url: reqUrl,
                jsonp: "jsonp",
                dataType: "jsonp",
                success: (res) => {
                    this.plotRoute(res);
                }
            });
        }
    }

    private setFromToLocation(routePoint: RoutePoint): void {
        this.setCursor("crosshair");
        this.handlerId = Microsoft.Maps.Events.addHandler(this.map, "click", (evt: Microsoft.Maps.IMouseEventArgs) => {
            console.log(`${evt.location.latitude}, ${evt.location.longitude}`);
            routePoint === RoutePoint.from ? this.from = evt.location : this.to = evt.location;
            this.setCursor();
            this.clearMapEvent();
            this.tryGetRoute();
        });
    }

    private setBorder(border: Border) {
        this.handlerId = Microsoft.Maps.Events.addHandler(this.map, "click", (evt: Microsoft.Maps.IMouseEventArgs) => {
            border === Border.hard ? this.hardBorder = evt.location : this.fuzzyBorder = evt.location;
            const opacity = 0.5 / (border === Border.hard ? 2 : 1);
            const color = new Microsoft.Maps.Color(opacity, 255, 0, 0);
            let isochrone = border === Border.hard ? this.outerIsochrone : this.innerIsochrone;
            this.plotIsoChrone(this.from, evt.location, color, isochrone);
        });
        Microsoft.Maps.Events.removeHandler(this.handlerId);
    }

    private wait(ms: number): void{
        let now = new Date().getTime();
        let end = now + ms;

        while (now < end){
            now = new Date().getTime();
        }

        return void 0;
    }

    private attachEvents(): void {
        (document.querySelector("#test1") as HTMLButtonElement).addEventListener("click", () => {
            const self = this;
            this.from = new Microsoft.Maps.Location(62.38874163740624, 17.30223655700682);
            this.to = new Microsoft.Maps.Location(63.825039132963255, 20.26511192321776);

            this.tryGetRoute().done(() => {
                this.plotIsoChrone(this.from, new Microsoft.Maps.Location(62.756159971491314, 17.901799791223617), new Microsoft.Maps.Color(0.5, 255, 0, 0), self.outerIsochrone)
                    .done((res) => {
                        this.plotIsoChrone(this.from, new Microsoft.Maps.Location(62.59225420845825, 17.789189927942367), new Microsoft.Maps.Color(0.5, 0, 255, 0), self.innerIsochrone)
                            .done((res) => {
                                let difference = Microsoft.Maps.SpatialMath.Geometry.difference(self.map.entities.get(1), self.map.entities.get(2)) as Array<Microsoft.Maps.IPrimitive>;
                                if (difference) {
                                    if (difference.length !== undefined) {
                                        for (let i = 0; i < difference.length; i++) {
                                            (difference[i] as Microsoft.Maps.Polygon).setOptions({ strokeColor: 'red', fillColor: new Microsoft.Maps.Color(0.5, 0 , 0, 255), strokeThickness: 1 });
                                        }
                                    }
                                    const buffer = Microsoft.Maps.SpatialMath.Geometry.buffer(this.route, 1, Microsoft.Maps.SpatialMath.DistanceUnits.Kilometers) as Microsoft.Maps.Polygon;
                                    buffer.setOptions({fillColor: new Microsoft.Maps.Color(0.7, 0, 255, 0), strokeThickness: 2, strokeColor: new Microsoft.Maps.Color(0.8, 0, 255, 100)});
                                    self.map.entities.push(difference);
                                    self.map.entities.push(buffer);

                                    let intersection =  Microsoft.Maps.SpatialMath.Geometry.intersection(difference, buffer) as Microsoft.Maps.Polygon;
                                    setTimeout( () =>{
                                        self.map.entities.clear();
                                        self.map.entities.push(intersection);
                                    }, 1000);
                                }
                            });
                    });
            });
        });

        (document.querySelector("#difference-area") as HTMLButtonElement).addEventListener("click", () => {
            // this.plotDifferentArea();
        });

        (document.querySelector("#hard-border") as HTMLButtonElement).addEventListener("click", () => {
            this.setBorder(Border.hard);
        });

        (document.querySelector("#soft-border") as HTMLButtonElement).addEventListener("click", () => {
            this.setBorder(Border.fuzzy);
        });

        (document.querySelector("#route-from") as HTMLButtonElement).addEventListener("click", () => {
            this.setFromToLocation(RoutePoint.from);
        });

        (document.querySelector("#route-to") as HTMLButtonElement).addEventListener("click", () => {
            this.setFromToLocation(RoutePoint.to);
        });

    }
}
