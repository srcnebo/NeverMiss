$(document).ready(function(){

    var AppState = {
        busIdList :null,
        stopIdList : null,
        selectedBus : null,
        selectedBusStop:null,
        preferedTimePeriod:null,
        get busNameList(){
            if(this.busIdList){
                return (this.busIdList.map(function(v){
                    return v.shortName;
                }));
            }
            return false;
        },
        get stopNameList(){
            if(this.stopIdList){
                return (this.stopIdList.map(function(v){
                    return v.name;
                }));
            }
            return false;
        }
    };

    var AppMethods = {
        handleBusInput:function(res){
            AppState.busIdList = res.data.routes;
            var aStopOption = AppState.busNameList;
            aStopOption && $(  "#busNumber" ).autocomplete({
                source: aStopOption,
                classes: {
                "ui-autocomplete": "uiOptions"
                },
                change: function( event, ui ) {
                    ui.item && (AppState.selectedBus = ui.item.value);
                }
            });
        },


        handleStationInput:function(res){
            AppState.stopIdList = res.data.stops;
            var aBusOption = AppState.stopNameList;
            aBusOption && $( "#stationId" ).autocomplete({
                source: function(request, response) {
                var results = $.ui.autocomplete.filter(aBusOption, request.term);
                response(results.slice(0, 10));
                },
                classes: {
                "ui-autocomplete": "uiOptions"
                },
                minLength:3,
                change: function( event, ui ) {
                    ui.item && (AppState.selectedBusStop = ui.item.value);
                }
            });
        },


        fetchBusIdList:function(){
            fetch('https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: `{
              routes{
                gtfsId
                shortName
                longName
                mode
              }
            }` }),
            })
              .then(res => res.json())
              .then(AppMethods.handleBusInput);
        },


        fetchStopIdList: function(){
            fetch('https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: `{
              stops{
                gtfsId
                name
              }
            }` }),
            })
              .then(res => res.json())
              .then(AppMethods.handleStationInput);
        },


        fetchAlertInformation:function(){
            fetch('https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: `{
              alerts {
                alertHeaderText
                alertHeaderTextTranslations {
                  text
                  language
                }
                alertDescriptionText
                alertDescriptionTextTranslations {
                  text
                  language
                }
                alertUrl
                effectiveStartDate
                effectiveEndDate
                agency {
                  gtfsId
                }
                route {
                  gtfsId
                }
                patterns {
                  code
                }
                trip {
                  gtfsId
                }
                stop {
                  gtfsId
                }
              }
            }` }),
            })
              .then(res => res.json())
              .then(AppMethods.cleanAlertData);
        },


        cleanAlertData:function(res){
            var arrayOfAlertText = res.data.alerts.map(function(v){
                    return (v.alertDescriptionTextTranslations[2].text);
                });
            // use the arrayOfAlertText to append to DOM
            return arrayOfAlertText;
        },


        getUserLocation:function(){
            var locationOptions = {
                  enableHighAccuracy: true,
                  timeout: 5000,
                  maximumAge: 0
                };

            var error = function(err) {
             console.warn(`ERROR(${err.code}): ${err.message}`)
            };


            if ("geolocation" in navigator) {
              /* geolocation is available */
              navigator.geolocation.getCurrentPosition(function(position) {
                var locationString = ('lat: ' + position.coords.latitude +',' + 'lon: ' + position.coords.longitude);
                  AppMethods.fetchNearestStations(locationString);
                },error,locationOptions);
            } else {}
        },

        fetchNearestStations:function(locationString){
            fetch('https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: `{
                nearest(${locationString}, maxDistance: 500, filterByPlaceTypes: DEPARTURE_ROW) {
                edges {
                  node {
                    place {
                      ...on DepartureRow {
                        stop {
                          lat
                          lon
                          name
                        }
                        stoptimes {
                          serviceDay
                          scheduledDeparture
                          realtimeDeparture
                          trip {
                            route {
                              shortName
                              longName
                            }
                          }
                          headsign
                        }
                      }
                    }
                    distance
                  }
                }
              }
            }` }),
            })
              .then(res => res.json())
              .then(AppMethods.handleNearestStationList);
        },


        handleNearestStationList:function(res){
            var listOfNearestStations = res.data.nearest.edges.map(function(v){
                var departureTime = v.node.place.stoptimes[0] ? (v.node.place.stoptimes[0].serviceDay + v.node.place.stoptimes[0].scheduledDeparture) : '';
                var timeInDateObject = new Date(new Date() + departureTime);
                var delay = v.node.place.stoptimes[0] ? (v.node.place.stoptimes[0].realtimeDeparture - v.node.place.stoptimes[0].scheduledDeparture)/1000000 : '';
                return {
                    shortName : v.node.place.stoptimes[0] ?  v.node.place.stoptimes[0].trip.route.shortName : '',
                    longName : v.node.place.stoptimes[0] ?  v.node.place.stoptimes[0].trip.route.longName : '',
                    delay:'' + Math.round(delay),
                    departureTime:(timeInDateObject.getHours() + ':' + timeInDateObject.getMinutes())
                };
            })
            console.table(listOfNearestStations);
            return listOfNearestStations;
        },


        fetchGeneralTransportNews:function(){
            fetch('https://cors-anywhere.herokuapp.com/' +'hsl.fi/en/newsApi/all')
                .then(res=>res.json())
                .then(AppMethods.handleGeneralTransportNews)
                .catch(err => console.log(err))
        },


        handleGeneralTransportNews:function(res){
            var listOfNews = res.nodes.map(function(v){
                    return v.node
                })
            console.table(listOfNews);
            return listOfNews;
        },


        getDatafromLocalStorage:function(){},


        setDataToLocalStorage:function(){
            localStorage.setItem('selectedBus', AppState.selectedBus);
            localStorage.setItem('selectedBusStop', AppState.selectedBusStop);
            localStorage.setItem('preferedTimePeriod', AppState.preferedTimePeriod);
        }
    };

    AppMethods.fetchBusIdList();
    AppMethods.fetchStopIdList();
    AppMethods.fetchAlertInformation();
    AppMethods.getUserLocation();
    AppMethods.fetchGeneralTransportNews();

    $( "#periodSelector" ).change(function() {
     AppState.preferedTimePeriod = $(this).val();
    });

    $("#saveBtn").click(function(){
        AppMethods.setDataToLocalStorage();
        alert("Bus " + localStorage.getItem('selectedBus') + " for station " + localStorage.getItem('selectedBusStop') + " at period " + localStorage.getItem('preferedTimePeriod') + " saved permanently to your device");
    });


});