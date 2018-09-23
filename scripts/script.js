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
    	getDatafromLocalStorage:function(){},
    	setDataToLocalStorage:function(){
    		localStorage.setItem('selectedBus', AppState.selectedBus);
  			localStorage.setItem('selectedBusStop', AppState.selectedBusStop);
  			localStorage.setItem('preferedTimePeriod', AppState.preferedTimePeriod);
    	}
    };

    AppMethods.fetchBusIdList();
    AppMethods.fetchStopIdList();

    $( "#periodSelector" ).change(function() {
 	 AppState.preferedTimePeriod = $(this).val();
	});

	$("#saveBtn").click(function(){
        AppMethods.setDataToLocalStorage();
        alert("Bus " + localStorage.getItem('selectedBus') + " for station " + localStorage.getItem('selectedBusStop') + " at period " + localStorage.getItem('preferedTimePeriod') + " saved permanently to your device");
    });


});