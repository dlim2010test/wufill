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
						'<script>'+
							  '(function(i,s,o,g,r,a,m){i["GoogleAnalyticsObject"]=r;i[r]=i[r]||function(){'+
							  '(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),'+
							  'm=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)'+
							  '})(window,document,"script","//www.google-analytics.com/analytics.js","ga");'+

							  'ga("create", "UA-56543903-1", "auto");'+
							  'ga("send", "pageview");'+

						'</script>'+
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
			console.log("SUB "+subdomain);
			var formID = wunode.parseFormURL(decodedBody.formID);
			var apiKey = decodedBody.apiKey;

			wunode.setSubdomain(subdomain);
			wunode.setApiKey(apiKey);

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
												'<script>'+
													  '(function(i,s,o,g,r,a,m){i["GoogleAnalyticsObject"]=r;i[r]=i[r]||function(){'+
													  '(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),'+
													  'm=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)'+
													  '})(window,document,"script","//www.google-analytics.com/analytics.js","ga");'+

													  'ga("create", "UA-56543903-1", "auto");'+
													  'ga("send", "pageview");'+

												'</script>'+
											"</head>"+
											"<body>"+

												"<form 'application/x-www-form-urlencoded' action='/results' method='post'>"+
													"<input type='hidden' name=subdomain value="+subdomain+">"+
													"<input type='hidden' name=formID value="+formID+">";

					redirectBody += wuform.buildForm(fields);
					console.log("SUB "+subdomain);
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
		

		request.on("data", function(chunk){
			rawBody += chunk.toString();
		});

		request.on("end", function(){
			//TEMP FIX //TODO
			rawBody = rawBody.substring(9);
			//Get POST values //TODO
			console.log(rawBody);
			var decodedBody = querystring.parse(rawBody);
			//console.log(decodedBody);

			//Extract Subdomain and formID from POST //TODO
			var subdomain = decodedBody.subdomain;
			var formID = decodedBody.formID;

			//Loop through POST values and parse into key/value pairs //TODO
			var parsedBody;
			for (var property in decodedBody) { //Need to get POST values into object format, iterate
				if(property.indexOf("Field") > -1){
					console.log("Property: "+property+" and value: "+decodedBody[property]);
					parsedBody += property+"="+encodeURIComponent(decodedBody[property])+"&";
				}
			}
			//Remove the last &
			parsedBody = parsedBody.slice(0, -1);
			//TEMP FIX //TODO
			parsedBody = parsedBody.substring(9);
			//Use parsedBody instead
			var fullBody = "https://"+subdomain+".wufoo.com/forms/"+formID+"/def/"+parsedBody;
			//console.log(rawBody);

			var redirectBody =	'<!DOCTYPE html>'+
					'<html>'+
						'<head>'+
							'<script>'+
								  '(function(i,s,o,g,r,a,m){i["GoogleAnalyticsObject"]=r;i[r]=i[r]||function(){'+
								  '(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),'+
								  'm=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)'+
								  '})(window,document,"script","//www.google-analytics.com/analytics.js","ga");'+

								  'ga("create", "UA-56543903-1", "auto");'+
								  'ga("send", "pageview");'+

							'</script>'+
						'</head>'+
						'<body>'+
							
							"<label for=moddedURL>Modified URL for Prefilling</label>"+
							"<textarea name=moddedURL>"+fullBody+"</textarea>"+
							'</br>'+
							'<a href='+fullBody+' target="_blank">Refill</a>'+
						'</body>'+
					'</html>';
			response.writeHead(200, "OK", {'Content-Type': 'text/html'});
			response.write(redirectBody);
				
			response.end();

			
			
		});
		
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

		var redirectBody =	'<!DOCTYPE html>'+
				'<html>'+
					'<head>'+
					'</head>'+
					'<body>'+
						"<label for=moddedURL>Modified URL for Prefilling</label>"+
						"<textarea name=moddedURL>"+fullBody+"</textarea>"+
						'</br>'+
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