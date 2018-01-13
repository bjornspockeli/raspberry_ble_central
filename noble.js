var express = require('express');
const app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var events = require('events');
var noble = require('noble');
var mysql = require('mysql');
var util = require('util');

var path = require('path')


// Mysql variables
var connection = mysql.createConnection({
	host 		: 'localhost',
	user 		: 'pi',
	password	: 'raspberry',
	database 	: 'Sensor_DB'
});

// Start Server
server.listen(3000,function(){
	console.log('Server Started at port 3000...');
});

app.use(express.static(__dirname + '/node_modules')); 


// Set routes and paths
/*
app.listen(3000, function(){
	console.log('Server Started at port 3000...');
});
*/
app.use("/javascripts", express.static(__dirname + '/javascripts'));

app.set('views',path.join(__dirname, 'views'));
app.set('view engine','pug');

app.get('/', function(req,res){
	res.render('index', {
		title:'Node.js + Express App'
	});
});

app.get('/temperature',function(req,res){
	res.render('temperature', {
		title: 'Temperatures'
	});
});



// Resume the stdin process to listen for key inputs 
process.stdin.resume();
process.stdin.setEncoding('utf8');

io.on('connection', function(client){
	console.log('Client connected...');

	// Retrieve data stored in database on connection.
	connection.query("SELECT UNIX_TIMESTAMP( CONVERT_TZ(date,'+00:00', @@global.time_zone) ) as timestamp, temp FROM Office_Temp_Data WHERE date >= DATE_SUB(NOW(),INTERVAL 12 HOUR)", function(error, results, fields){
		if(error){
			throw error;
		}
		//console.log(results);
		setTimeout(function(){
				client.emit('office_data', results)
			}, 100);
		client.on('join',function(data){
			//console.log(data);
			
			
		})
	});

	connection.query("SELECT UNIX_TIMESTAMP(CONVERT_TZ(date,'+00:00', @@global.time_zone)) as timestamp, temp FROM Bedroom_Temp_Data WHERE date >= DATE_SUB(NOW(),INTERVAL 12 HOUR)", function(error, results, fields){
		if(error){
			throw error;
		}
		//console.log(results);

		client.on('join',function(data){
			//console.log(data);
			setTimeout(function(){
				client.emit('bedroom_data', results)
			}, 100);
			
		})
	});

	connection.query("SELECT UNIX_TIMESTAMP(CONVERT_TZ(date,'+00:00', @@global.time_zone)) as timestamp, temp FROM Livingroom_Temp_Data WHERE date >= DATE_SUB(NOW(),INTERVAL 12 HOUR)", function(error, results, fields){
		if(error){
			throw error;
		}
		//console.log(results);

		client.on('join',function(data){
			//console.log(data);
			setTimeout(function(){
				client.emit('livingroom_data', results)
			}, 100);
			
		})
	});
});

/*

// Truncate Tables
connection.query('TRUNCATE TABLE Office_Temp_Data;', function(error, results, fields){
	if (error) throw error;
	//console.log('The solution is: ', results);
});
connection.query('TRUNCATE TABLE Bedroom_Temp_Data;', function(error, results, fields){
	if (error) throw error;
	//console.log('The solution is: ', results);
});
connection.query('TRUNCATE TABLE Livingroom_Temp_Data;', function(error, results, fields){
	if (error) throw error;
	//console.log('The solution is: ', results);
});
*/


// Custom UUIDs
var customServiceUUID 					= 'f364140000b04240ba5005ca45bf8abc';
var customCharacteristicUUID 			= 'f364140100b04240ba5005ca45bf8abc';
var batteryVoltageCharacteristicUUID 	= 'f364140300b04240ba5005ca45bf8abc';


// State Change Callback
noble.on('stateChange', function(state) {
	switch(state){
		case 'unknown':
			console.log('State: Unknown');
			break;
		case 'resetting':
			console.log('State: Resetting');
			break;
		case 'unsupported':
			console.log('State: Unsupported');
			break;
		case 'unauthorized':
			console.log('State: Unauthorized');
			break;
		case 'poweredOn':
			console.log('State: PoweredOn');
			console.log('Starting Scanning...');
			noble.startScanning([customServiceUUID]); // any service UUID, no duplicates

			console.log('max event listeners = ' + events.EventEmitter.defaultMaxListeners);
			break;
		case 'poweredOff':
			console.log('State: PoweredOff');
			// Do nothing
			break;
		default:
			noble.stopScanning();
			break;
	}
})

var current_peripheral 			= null;
var current_service 			= null;
var current_characteristic 		= null;
var current_descriptor 			= null;


var office_node 				= null;
var bedroom_node 				= null;
var livingroom_node 			= null;

var office_temp_char 			= null;
var bedroom_temp_char 			= null;
var livingroom_temp_char 		= null;

var office_batt_vtg_char 			= null;
var bedroom_batt_vtg_char 			= null;
var livingroom_batt_vtg_char 		= null;

var peripheral_dev 				= null;
var customValueService			= null;
var customValueCharacteristic	= null;


// Peripheral Discovery Callback
noble.on('discover', function(peripheral) {
	console.log('\n');
	console.log('Found Peripheral with address:', peripheral.address);
		
	noble.stopScanning();

	peripheral.connect( function(err) {
		if(err) {
			console.log('Connect Error:', err);	
		}
		else
		{
			peripheral_dev = peripheral;
		}	
	})

	/* ### Local Callback Functions ### */

	// Disconnect Callback
	peripheral.once('disconnect', function(){
		console.log('Disconnected from peripheral:', peripheral_dev.localName);
		//setTimeout(function(){noble.startScanning([customServiceUUID])}, 2000);
		
	});

	// Connect Callback
	peripheral.once('connect', function(){
		
		console.log('Connected to peripheral:', peripheral.localName);
		peripheral.updateRssi(function(error, rssi){
			console.log('Peripheral RSSI:', rssi);
		});

		peripheral.discoverServices([customServiceUUID], function(err, services) {
			if(err){
				console.log('Error while Discovering Services.')
			}
		})	
	});

	// Peripheral Service Discovery Callback
	peripheral.once('servicesDiscover', function(services){
		
		console.log('Services discovered:', services);

		//Loop through each service 
		services.forEach(function(service) {
   
			console.log('Found service:', service.uuid);
			// Assign service to a holder variable
			current_service = service;			

			//Discover characteristics
			service.discoverCharacteristics([customCharacteristicUUID, batteryVoltageCharacteristicUUID], function(err, characteristics) {
				if(err){
					console.log('Error discovering Characteristics.')
				}
			});

			// Service Characteristic Discovery callback
			service.once('characteristicsDiscover', function(characteristics){ 
				characteristics.forEach(function(characteristic) {
					console.log('Found Characteristic with UUID:',characteristic.uuid);
					console.log('Characteristic properties:',characteristic.properties);
								
					// Assign characteristic to variable
					//office_temp_char = characteristic;

					// Discover descriptors
					characteristic.discoverDescriptors(function(err, descriptors) {
					});

					// Characteristic Descriptor Discovery Callback
					characteristic.once('descriptorsDiscover', function(descriptors){ 
						descriptors.forEach( function(descriptor){

							console.log('Found descriptor:', descriptor.uuid);
						/*	if(descriptor.uuid == 2902){
								characteristic.properties.forEach(function(property){
									if(property == 'notify'){
										console.log('Client Characteristic Configuration Descriptor');
										customValueDescriptor=descriptor;
											
										var buf = Buffer.from([0x01,0x00]);
										console.log('Buffer Values', buf[0], buf[1]);

										// Write to CCCD to enable notifications.
										customValueDescriptor.writeValue(buf, function(err) {
										});	
										
										console.log('Subscribing to Custom Value Notifications.');
										customValueCharacteristic.subscribe( function(err) {
											if(err) {
												console.log('Subscribe Error.');	
											}
										});
									}
								})	
							}
							*/
							if(descriptor.uuid == 2901){
								console.log('User Description Descriptor');
								descriptor.readValue(function(error,data){
									//console.log('User Description Data:',data.toString('ascii' ));
									if(data.toString('ascii' ) == 'OfficeTemp' && office_temp_char == null){
										console.log('This is peripheral is the Office Node.')
										office_node = peripheral;
										office_temp_char = characteristic;

										enableOfficeNotif(office_temp_char);
									}
									else if(data.toString('ascii' ) == 'LivingroomTemp' && livingroom_temp_char == null)
									{
										livingroom_node = peripheral;
										livingroom_temp_char = characteristic;
										enableLivingroomNotif(livingroom_temp_char);
									}
									else if(data.toString('ascii' ) == 'BedroomTemp' && bedroom_temp_char == null)
									{
										bedroom_node = peripheral;
										bedroom_temp_char = characteristic;
										enableBedroomNotif(bedroom_temp_char);
									}
									else if(data.toString('ascii' ) == 'OfficeBattLevel' )
									{
										//bedroom_node = peripheral;
										office_batt_vtg_char = characteristic;
										office_batt_vtg_char.subscribe( function(err) {
											if(err) {
												console.log('Subscribe Error.');	
											}
										});
										// Setup notif callback
										office_batt_vtg_char.on('data',function(data, isNotification) {
											if(isNotification)
											{
												console.log('Office Battery Voltage Notification received:', data);
												console.log('Emiting Office Battery Voltage to client:', data);
												var batt_voltage = data.toString('ascii');
												io.sockets.emit('office_voltage', batt_voltage);
											}
										});
										
									}
									else if(data.toString('ascii' ) == 'BedroomBattLevel' )
									{
										//bedroom_node = peripheral;
										bedroom_batt_vtg_char = characteristic;
										bedroom_batt_vtg_char.subscribe( function(err) {
											if(err) {
												console.log('Subscribe Error.');	
											}
										});
										// Setup notif callback
										bedroom_batt_vtg_char.on('data',function(data, isNotification) {
											if(isNotification)
											{
												console.log('Bedroom Battery Voltage Notification received:', data);
												console.log('Emiting Bedroom Battery Voltage to client:', data);
												var batt_voltage = data.toString('ascii');
												io.sockets.emit('bedroom_voltage', batt_voltage);
											}
										});
										
									}
									else if(data.toString('ascii' ) == 'LivingroomBattLevel' )
									{
										//bedroom_node = peripheral;
										livingroom_batt_vtg_char = characteristic;
										livingroom_batt_vtg_char.subscribe( function(err) {
											if(err) {
												console.log('Subscribe Error.');	
											}
										});
										// Setup notif callback
										livingroom_batt_vtg_char.on('data',function(data, isNotification) {
											if(isNotification)
											{
												console.log('Livingroom Battery Voltage Notification received:', data);
												console.log('Emiting Livingroom Battery Voltage to client:', data);
												var batt_voltage = data.toString('ascii');
												io.sockets.emit('livingroom_voltage', batt_voltage);
											}
										});
										
									}

									if(bedroom_temp_char && livingroom_temp_char && office_temp_char)
									{
										// All devices has been found.
									}
									else
									{
										noble.startScanning([customServiceUUID]); // any service UUID, no duplicates
									}
								})
							}
						})
					});
				});
			});
		});
	});	
});




function enableOfficeNotif(characteristic)
{
	// Enable notifications
	characteristic.subscribe( function(err) {
		if(err) {
			console.log('Subscribe Error.');	
		}
	});

	// Set up data callback to process notifications
	characteristic.on('data', function(data, isNotification) {
							
		if(isNotification)
		{
			//Characteristic has been notified.
			//console.log('Notification received:', data);
			
			console.log('Office Temperature Notification received:', data.toString('ascii'));
			office_node.updateRssi(function(err,rssi){
				console.log('Office Node RSSI: ',rssi)
				io.sockets.emit('office_rssi', rssi);
			});

			connection.query('INSERT INTO Office_Temp_Data(date, temp) VALUES( NOW(), ? );',[data.toString('ascii')], function(error, results, fields){
				if(error){
					throw error;
				} 

			});
			connection.query("SELECT UNIX_TIMESTAMP(CONVERT_TZ(date,'+00:00', @@global.time_zone)) as timestamp, temp FROM Office_Temp_Data ORDER BY id DESC LIMIT 1", function(error, results, fields){
				if(error){
					throw error;
				}
				console.log('Emiting Office data to client:', results);
				io.sockets.emit('office_data_point', results);
		
			});
		}
		else
		{
			//Characteristic has been read.
		}
	});
}

function enableLivingroomNotif(characteristic)
{
	// Enable notifications
	characteristic.subscribe( function(err) {
		if(err) {
			console.log('Subscribe Error.');	
		}
	});

	// Set up data callback to process notifications
	characteristic.on('data', function(data, isNotification) {
							
		if(isNotification)
		{
			//Characteristic has been notified.
			//console.log('Notification received:', data);
			console.log('Livingroom Temperature Notification received:', data.toString('ascii'));
			livingroom_node.updateRssi(function(err,rssi){
				console.log('Livingroom Node RSSI: ',rssi)
				io.sockets.emit('livingroom_rssi', rssi);
			});
			
			connection.query('INSERT INTO Livingroom_Temp_Data(date, temp) VALUES( NOW(), ? );',[data.toString('ascii')], function(error, results, fields){
				if(error){
					throw error;
				} 

			});
			connection.query("SELECT UNIX_TIMESTAMP(CONVERT_TZ(date,'+00:00', @@global.time_zone)) as timestamp, temp FROM Livingroom_Temp_Data ORDER BY id DESC LIMIT 1", function(error, results, fields){
				if(error){
					throw error;
				}
				console.log('Emiting Livingroom data to client:', results);
				io.sockets.emit('livingroom_data_point', results);
		
			});
		}
		else
		{
			//Characteristic has been read.
		}
	});
}

function enableBedroomNotif(characteristic)
{
	// Enable notifications
	characteristic.subscribe( function(err) {
		if(err) {
			console.log('Subscribe Error.');	
		}
	});

	// Set up data callback to process notifications
	characteristic.on('data', function(data, isNotification) {
							
		if(isNotification)
		{
			//Characteristic has been notified.
			//console.log('Notification received:', data);
			console.log('Bedroom Temperature Notification received:', data.toString('ascii'));
			bedroom_node.updateRssi(function(err,rssi){
				console.log('Bedroom Node RSSI: ',rssi)
				io.sockets.emit('bedroom_rssi', rssi);
			});
			
			connection.query('INSERT INTO Bedroom_Temp_Data(date, temp) VALUES( NOW(), ? );',[data.toString('ascii')], function(error, results, fields){
				if(error){
					throw error;
				} 

			});
			connection.query("SELECT UNIX_TIMESTAMP(CONVERT_TZ(date,'+00:00', @@global.time_zone)) as timestamp, temp FROM Bedroom_Temp_Data ORDER BY id DESC LIMIT 1", function(error, results, fields){
				if(error){
					throw error;
				}
				console.log('Emiting Bedroomdata to client:', results);
				io.sockets.emit('bedroom_data_point', results);
		
			});
			
		}
		else
		{
			//Characteristic has been read.
		}
	});
}


function disconnectPeripheral()
{
	unsubscribeCustomValueNotif();
	console.log( 'Central Disconnecting from Peripheral...');
	if(office_node != null){
		office_node.disconnect();
	}
	if(office_node != null){
		bedroom_node.disconnect();
	}
	if(office_node != null){
		livingroom_node.disconnect();
	}
}

function unsubscribeCustomValueNotif()
{
	console.log( 'Unsubscribing to Notifications...');
	office_temp_char.unsubscribe( function(err) {
		if(err) 
		{
			console.log('Unsubscribe Error.');	
		}
	});
}

// Process stdin callback
process.stdin.on('data', function (text) {
	console.log('received data:', util.inspect(text));
	if (text === 'd\n') {
		disconnectPeripheral();
	}
	if (text === 's\n') {
		noble.startScanning([customServiceUUID]);
	}
});

