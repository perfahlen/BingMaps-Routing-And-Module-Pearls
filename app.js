define("Credentials", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Credentials = (function () {
        function Credentials() {
        }
        Object.defineProperty(Credentials, "BMCredentials", {
            get: function () {
                return "AsXOzwxphj5MnBu0JvpoF7joDb6BdaAa8NHUjUbHj-S9n-_1DzS3vTHfSVmVyXnn";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Credentials, "NanjingKey", {
            get: function () {
                return "bc020229cdde4f47a513d47993018571";
            },
            enumerable: true,
            configurable: true
        });
        return Credentials;
    }());
    exports.Credentials = Credentials;
});
define("Route", ["require", "exports", "Credentials"], function (require, exports, Credentials_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RoutePoint;
    (function (RoutePoint) {
        RoutePoint[RoutePoint["from"] = 0] = "from";
        RoutePoint[RoutePoint["to"] = 1] = "to";
    })(RoutePoint || (RoutePoint = {}));
    var Border;
    (function (Border) {
        Border[Border["hard"] = 0] = "hard";
        Border[Border["fuzzy"] = 1] = "fuzzy";
    })(Border || (Border = {}));
    var route;
    var outerIsochrone;
    var innerIsochrone;
    var Route = (function () {
        function Route(map) {
            this.map = map;
            this.attachEvents();
        }
        Route.prototype.plotIsoChrone = function (from, to, color, entity) {
            var self = this;
            var distance = Microsoft.Maps.SpatialMath.getDistanceTo(from, to, Microsoft.Maps.SpatialMath.DistanceUnits.Meters, false);
            var params = {
                "culture": "sv-se",
                "maxDistance": distance * 1.60934 / 1000
            };
            return jQuery.ajax({
                url: "https://api.labs.cognitive.microsoft.com/Routes/IsoChrone?startPoint=" + from.latitude + "," + from.longitude + "&routeMode=driving&" + $.param(params),
                beforeSend: function (xhrObj) {
                    xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", Credentials_1.Credentials.NanjingKey);
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
        };
        Route.prototype.plotRoute = function (response) {
            var coordinates = response.resourceSets[0].resources[0].routePath.line.coordinates;
            var locations = coordinates.map(function (c) {
                var location = new Microsoft.Maps.Location(c[0], c[1]);
                return location;
            });
            var options = {
                strokeColor: new Microsoft.Maps.Color(0.8, 0, 0, 255),
                strokeThickness: 4
            };
            var polyline = new Microsoft.Maps.Polyline(locations, options);
            this.route = polyline;
            this.map.entities.push(polyline);
        };
        Route.prototype.clearMapEvent = function () {
            Microsoft.Maps.Events.removeHandler(this.handlerId);
        };
        Route.prototype.setCursor = function (cursor) {
            if (cursor === void 0) { cursor = "auto"; }
            document.querySelector("#myMap").style.cursor = cursor;
        };
        Route.prototype.tryGetRoute = function () {
            var _this = this;
            if (this.from && this.to) {
                var reqUrl = "http://dev.virtualearth.net/REST/V1/Routes?wp.0=" + this.from.latitude + "," + this.from.longitude + "&wp.1=" + this.to.latitude + "," + this.to.longitude + "&routeAttributes=routePath&key=" + Credentials_1.Credentials.BMCredentials;
                return jQuery.ajax({
                    url: reqUrl,
                    jsonp: "jsonp",
                    dataType: "jsonp",
                    success: function (res) {
                        _this.plotRoute(res);
                    }
                });
            }
        };
        Route.prototype.setFromToLocation = function (routePoint) {
            var _this = this;
            this.setCursor("crosshair");
            this.handlerId = Microsoft.Maps.Events.addHandler(this.map, "click", function (evt) {
                console.log(evt.location.latitude + ", " + evt.location.longitude);
                routePoint === RoutePoint.from ? _this.from = evt.location : _this.to = evt.location;
                _this.setCursor();
                _this.clearMapEvent();
                _this.tryGetRoute();
            });
        };
        Route.prototype.setBorder = function (border) {
            var _this = this;
            this.handlerId = Microsoft.Maps.Events.addHandler(this.map, "click", function (evt) {
                border === Border.hard ? _this.hardBorder = evt.location : _this.fuzzyBorder = evt.location;
                var opacity = 0.5 / (border === Border.hard ? 2 : 1);
                var color = new Microsoft.Maps.Color(opacity, 255, 0, 0);
                var isochrone = border === Border.hard ? _this.outerIsochrone : _this.innerIsochrone;
                _this.plotIsoChrone(_this.from, evt.location, color, isochrone);
            });
            Microsoft.Maps.Events.removeHandler(this.handlerId);
        };
        Route.prototype.wait = function (ms) {
            var now = new Date().getTime();
            var end = now + ms;
            while (now < end) {
                now = new Date().getTime();
            }
            return void 0;
        };
        Route.prototype.attachEvents = function () {
            var _this = this;
            document.querySelector("#test1").addEventListener("click", function () {
                var self = _this;
                _this.from = new Microsoft.Maps.Location(62.38874163740624, 17.30223655700682);
                _this.to = new Microsoft.Maps.Location(63.825039132963255, 20.26511192321776);
                _this.tryGetRoute().done(function () {
                    _this.plotIsoChrone(_this.from, new Microsoft.Maps.Location(62.756159971491314, 17.901799791223617), new Microsoft.Maps.Color(0.5, 255, 0, 0), self.outerIsochrone)
                        .done(function (res) {
                        _this.plotIsoChrone(_this.from, new Microsoft.Maps.Location(62.59225420845825, 17.789189927942367), new Microsoft.Maps.Color(0.5, 0, 255, 0), self.innerIsochrone)
                            .done(function (res) {
                            var difference = Microsoft.Maps.SpatialMath.Geometry.difference(self.map.entities.get(1), self.map.entities.get(2));
                            if (difference) {
                                if (difference.length !== undefined) {
                                    for (var i = 0; i < difference.length; i++) {
                                        difference[i].setOptions({ strokeColor: 'red', fillColor: new Microsoft.Maps.Color(0.5, 0, 0, 255), strokeThickness: 1 });
                                    }
                                }
                                var buffer = Microsoft.Maps.SpatialMath.Geometry.buffer(_this.route, 1, Microsoft.Maps.SpatialMath.DistanceUnits.Kilometers);
                                buffer.setOptions({ fillColor: new Microsoft.Maps.Color(0.7, 0, 255, 0), strokeThickness: 2, strokeColor: new Microsoft.Maps.Color(0.8, 0, 255, 100) });
                                self.map.entities.push(difference);
                                self.map.entities.push(buffer);
                                var intersection_1 = Microsoft.Maps.SpatialMath.Geometry.intersection(difference, buffer);
                                setTimeout(function () {
                                    self.map.entities.clear();
                                    self.map.entities.push(intersection_1);
                                }, 1000);
                            }
                        });
                    });
                });
            });
            document.querySelector("#difference-area").addEventListener("click", function () {
            });
            document.querySelector("#hard-border").addEventListener("click", function () {
                _this.setBorder(Border.hard);
            });
            document.querySelector("#soft-border").addEventListener("click", function () {
                _this.setBorder(Border.fuzzy);
            });
            document.querySelector("#route-from").addEventListener("click", function () {
                _this.setFromToLocation(RoutePoint.from);
            });
            document.querySelector("#route-to").addEventListener("click", function () {
                _this.setFromToLocation(RoutePoint.to);
            });
        };
        return Route;
    }());
    exports.Route = Route;
});
define("map", ["require", "exports", "Route", "Credentials"], function (require, exports, Route_1, Credentials_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = new function LoadMap() {
        var map = new Microsoft.Maps.Map(document.getElementById('myMap'), {
            credentials: Credentials_2.Credentials.BMCredentials,
            center: new Microsoft.Maps.Location(62.3, 17.3),
            zoom: 8
        });
        Microsoft.Maps.loadModule('Microsoft.Maps.SpatialMath');
        Microsoft.Maps.loadModule('Microsoft.Maps.GeoJson');
        new Route_1.Route(map);
    }();
});
//# sourceMappingURL=app.js.map