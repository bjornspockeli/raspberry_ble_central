var socket = io.connect();

var office_data = [];
var bedroom_data = [];
var livingroom_data = [];

var graph_data = null;

socket.on('connect',function(data){
    socket.emit('join','Hello World from Client')
});

var temp_chart = new Highcharts.chart('container', {
    chart: {
        type: 'spline',
        zoomType: 'xy',
        events:{
            load: function(){
                socket.on('office_data', function(data){
                    console.log('Stored Office data received',data);
                    console.log('Series:',temp_chart.series)
                    var series = [];
                    data.forEach(function(element) {
                        var obj = [element.timestamp*1000,element.temp];                       
                        series.push(obj)
                    });
                     //office_data = series;
                     //console.log('Series:',office_data)
                     temp_chart.series[0].setData(series);
                  /*  temp_chart.addSeries({
                        name: 'Office Temperature',
                        data: series
                    });*/
                    
                });
                socket.on('office_data_point', function(data){
                    console.log('New Office data received',data);

                    var obj = [data[0].timestamp*1000,data[0].temp];
                    temp_chart.series[0].addPoint(obj);

                });
                socket.on('bedroom_data', function(data){
                    console.log('Stored Bedroom data received',data);
                    var series = [];
                    data.forEach(function(element) {
                        var obj = [element.timestamp*1000,element.temp];
                        series.push(obj)
                    });
                    //bedroom_data = series;
                    temp_chart.series[1].setData(series);
                   /* temp_chart.addSeries({
                        name: 'Bedroom Temperature',
                        data: series
                    });*/
                    
                });
                 socket.on('bedroom_data_point', function(data){
                    console.log('New Bedroom data received',data);
                     var obj = [data[0].timestamp*1000,data[0].temp];
                    temp_chart.series[1].addPoint(obj);
                });
                socket.on('livingroom_data', function(data){
                    console.log('Stored Livingroom data received',data);
                    var series = [];
                    data.forEach(function(element) {
                        var obj = [element.timestamp*1000,element.temp];
                        series.push(obj)
                    });
                    //livingroom_data = series;
                    temp_chart.series[2].setData(series);
                   /* temp_chart.addSeries({
                        name: 'Livingroom Temperature',
                        data: series
                    }); */
                    
                });
                 socket.on('livingroom_data_point', function(data){
                    console.log('New Livingroom data received',data);
                     var obj = [data[0].timestamp*1000,data[0].temp];
                    temp_chart.series[2].addPoint(obj);
                });
            }
        }
    },
    title: {
        text: 'Temperature'
    },
    subtitle: {
        text: 'Temperature in the different rooms in Holstveita 4A'
    },
    xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: { // don't display the dummy year
            second: '%H:%M:%S',
	        minute: '%H:%M',
            hour: '%H:%M',
	        day: '%e. %b',
            month: '%e. %b',
            year: '%Y'
        },
        title: {
            text: 'Date'
        }
    },
    yAxis: {
        title: {
            text: 'Temperature (deg)'
        }//,
        //min: 15
    },
    tooltip: {
        headerFormat: '<b>{series.name}</b><br>',
        pointFormat: '{point.x:%e. %b %H:%M:%S}: {point.y:.2f} deg'
    },

    plotOptions: {
        spline: {
            marker: {
                enabled: true
            }
        }
    },

    series: [{
         name: 'Office Temperature',
         data: office_data
        
    },{
         name: 'Bedroom Temperature',
         data: bedroom_data
    },{
         name: 'Livingroom Temperature',
         data: livingroom_data
    }]
    
});


var rssi_chart = new Highcharts.chart( {
    chart: {
        renderTo: 'container2',
        type: 'spline',
        zoomType: 'xy',
        events:{
            load: function(){
                socket.on('office_rssi', function(rssi){
                    console.log('Office RSSI data received',rssi);
                    var date = new Date().getTime();
                    var obj = [date,rssi];
                    rssi_chart.series[0].addPoint(obj);

                });
                    socket.on('bedroom_rssi', function(rssi){
                    console.log('Bedroom RSSI data received',rssi);
                    var date = new Date().getTime();
                    var obj = [date, rssi];
                    rssi_chart.series[1].addPoint(obj);

                });
                    socket.on('livingroom_rssi', function(rssi){
                    console.log('Livingroom RSSI data received',rssi);
                    var date = new Date().getTime();
                    var obj = [date, rssi];
                    rssi_chart.series[2].addPoint(obj);

                });
            }
        }
    },
    title: {
        text: 'RSSI'
    },
    subtitle: {
        text: 'RSSI of the BLE nodes in Holstveita 4A'
    },
    xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: { // don't display the dummy year
            month: '%e. %b',
            year: '%b'
        },
        title: {
            text: 'Date'
        }
    },
    yAxis: {
        title: {
            text: 'RSSI'
        }//,
        //min: 0
    },
    tooltip: {
        headerFormat: '<b>{series.name}</b><br>',
        pointFormat: '{point.x:%e. %b}: {point.y:.2f}'
    },

    plotOptions: {
        spline: {
            marker: {
                enabled: true
            }
        }
    },

    series: [{
         name: 'Office Node RSSI',
         data: []
        
    },{
         name: 'Bedroom Node RSSI',
         data: []
    },{
         name: 'Livingroom Node RSSI',
         data: []
    }]
    
});

var battery_voltage_chart = new Highcharts.chart( {
    chart: {
        renderTo: 'container3',
        type: 'spline',
        zoomType: 'xy',
        events:{
            load: function(){
                socket.on('office_voltage', function(batt_voltage){
                    console.log('Office Battery data received',batt_voltage);
                    var date = new Date().getTime();
                    var obj = [date,parseFloat(batt_voltage)];
                    battery_voltage_chart.series[0].addPoint(obj);

                });
                    socket.on('bedroom_voltage', function(batt_voltage){
                    console.log('Bedroom Battery data received',batt_voltage);
                    var date = new Date().getTime();
                    var obj = [date, parseFloat(batt_voltage)];
                    battery_voltage_chart.series[1].addPoint(obj);

                });
                    socket.on('livingroom_voltage', function(batt_voltage){
                    console.log('Livingroom Voltage data received',batt_voltage);
                    var date = new Date().getTime();
                    var obj = [date, parseFloat(batt_voltage)];
                    battery_voltage_chart.series[2].addPoint(obj);

                });
            }
        }
    },
    title: {
        text: 'Battery Voltage'
    },
    subtitle: {
        text: 'Battery voltage of the BLE nodes in Holstveita 4A'
    },
    xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: { // don't display the dummy year
            month: '%e. %b',
            year: '%b'
        },
        title: {
            text: 'Battery Voltage'
        }
    },
    yAxis: {
        title: {
            text: 'Voltage'
        }//,
        //min: 0
    },
    tooltip: {
        headerFormat: '<b>{series.name}</b><br>',
        pointFormat: '{point.x:%e. %b}: {point.y:.2f} V'
    },

    plotOptions: {
        spline: {
            marker: {
                enabled: true
            }
        }
    },

    series: [{
         name: 'Office Node Battery Voltage',
         data: []
        
    },{
         name: 'Bedroom Node Battery Voltage',
         data: []
    },{
         name: 'Livingroom Node Battery Voltage',
         data: []
    }]
    
});