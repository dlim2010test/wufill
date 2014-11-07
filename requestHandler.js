var wunode = require("./wunode");
var wuform = require("./wuform");
var querystring = require('querystring');
var url = require('url');

function start(request, response){
	console.log("Request handler for 'start' ");

	var body =	'<!DOCTYPE html>'+
				'<html>'+
					'<head>'+
						'<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'+
					'</head>'+
					'<body>'+
						'<form enctype="application/x-www-form-urlencoded" action="/rebuild" method="post">'+
						'<label for="formID">Form ID:</label>'+
						'<input type="text" name ="formID"/>'+
						'<label for="apiKey">API Key:</label>'+
						'<input type="text" name ="apiKey"/>'+
						'<input type="submit" value="Submit" />'+
						'</form>'+
					'</body>'+
				'</html>';

	response.writeHead(200, {"Content-Type": "text/html"});
	response.write(body);
	response.end();
}

function rebuild(request, response){
	console.log("Request handler for 'rebuild' ");
	var rawBody = "";
	if(request.method === "POST"){
		console.log("Handling POST");
		

		request.on("data", function(chunk){
			rawBody += chunk.toString();
		});

		request.on("end", function(){
			
			var decodedBody = querystring.parse(rawBody);
			//console.log(decodedBody);

			var subdomain = wunode.parseSubdomain(decodedBody.formID);
			var formID = wunode.parseFormURL(decodedBody.formID);
			var apiKey = decodedBody.apiKey;

			wunode.setSubdomain(subdomain);
			wunode.setApiKey(apiKey);
			wunode.setFormID(formID);

			var fields;
			wunode.getFields(formID, false, false, function(result){
				//console.log(result);
				var redirectBody = "";
				if(result === "ERROR"){
					console.log("ERROR");
				}
				else{
					fields = result.Fields;
					redirectBody = "<!DOCTYPE html>"+
										"<html>"+
											"<head>"+
											"</head>"+
											"<body>"+
												"<form 'application/x-www-form-urlencoded' action='/results' method='get'>"+
													"<input type='hidden' name=subdomain value="+subdomain+">"+
													"<input type='hidden' name=formID value="+formID+">";

					redirectBody += wuform.buildForm(fields);
					redirectBody +=					"<input type='submit' value='Submit' />"+
												"</form>"+
											"</body>"+
										"</html>";
					response.writeHead(200, "OK", {'Content-Type': 'text/html'});
					response.write(redirectBody);
					response.end();
				}
			});

			
			
		});
	}
	else if(request.method === "GET"){
		
		var url_parts = url.parse(request.url, true);
		var query = url_parts.query;
		console.log("Handling GET for "+request.url);


		rawBody = query;
		console.log(rawBody);

		var decodedBody = rawBody;
		var formID = wunode.parseFormURL(decodedBody.formID);
		var entryID = decodedBody.entryID;
		// console.log("FormID "+formID);
		// console.log("EntryID "+entryID);

		var recoveredURL;
		wunode.refillEntry(formID, entryID, function(result){
			var redirectBody = "";
			if(result === "ERROR"){
				console.log("Error, try again");
				recoveredURL = result;
				redirectBody =	'<!DOCTYPE html>'+
				'<html>'+
					'<head>'+
					'</head>'+
					'<body>'+
						'<script>alert("No entry found"); console.log("Test"); window.location.href = "https://michaellimsm.wufoo.com/forms/wucovery/";</script>'+
					'</body>'+
				'</html>';
				response.writeHead(200, "OK", {'Content-Type': 'text/html'});
				response.write(redirectBody);
			
				response.end();
			}
			else{
				recoveredURL = result;
				redirectBody =	'<!DOCTYPE html>'+
				'<html>'+
					'<head>'+
					'</head>'+
					'<body>'+
						'<script>console.log("Test"); window.location.href = "'+recoveredURL+'";</script>'+
					'</body>'+
				'</html>';
				response.writeHead(200, "OK", {'Content-Type': 'text/html'});
				response.write(redirectBody);
			
				response.end();
			}
		});
	}
	else{
		response.writeHead(405, "Method not supported", {"Content-Type": "text/plain"});
		response.write("405-Method not supported");
		response.end();
	}
	
}

function results(request, response){
	console.log("Request handler for 'results' ");
	if(request.method === "POST"){
		console.log("Handling POST");
		
	}
	else if(request.method === "GET"){
		
		var url_parts = url.parse(request.url, true);
		var query = url_parts.query;
		console.log(query);
		console.log("Handling GET for "+request.url);

		var subdomain = query.subdomain;
		var formID = query.formID;
		var rawBody = "";
		for (var property in query) {
			if(property.indexOf("Field") > -1){
				rawBody += property+"="+encodeURIComponent(query[property])+"&";
			}
		}
		//Remove the last &
		rawBody = rawBody.slice(0, -1);

		//rawBody = request.url.substring(9);
		var fullBody = "https://"+subdomain+".wufoo.com/forms/"+formID+"/def/"+rawBody;
		console.log(rawBody);


		// console.log("FormID "+formID);
		// console.log("EntryID "+entryID);

		var recoveredURL;
		var redirectBody =	'<!DOCTYPE html>'+
				'<html>'+
					'<head>'+
					'</head>'+
					'<body>'+
						fullBody+'</br>'+
						'<a href='+fullBody+' target="_blank">Refill</a>'+
					'</body>'+
				'</html>';
		response.writeHead(200, "OK", {'Content-Type': 'text/html'});
		response.write(redirectBody);
			
		response.end();
	}
	else{
		response.writeHead(405, "Method not supported", {"Content-Type": "text/plain"});
		response.write("405-Method not supported");
		response.end();
	}
	
}

exports.start = start;
exports.rebuild = rebuild;
exports.results = results;