/* Dual licensed APL2.0 & GPL3.0.
 *
 * Author: Pablo Duboue <pablo.duboue@gmail.com>
 */

var wrGenerator = {
    parseTemplates: function(templateString){
	var table=[];
	var templateList = templateString.split("\n");
	for(var idx=0;idx<templateList.length; idx++){
	    var vars={};
	    var entries = [];
	    var str = templateList[idx];
	    var parts = str.split(/\$/);
	    entries.push( {"type":"txt", "value":parts[0] } );
	    for(var idx2=1; idx2<parts.length; idx2++){
		var part = parts[idx2];
		var match =/[^a-zA-Z]/.exec(part);
		var theVar;
		if(match){
		    theVar = part.substr(0,match.index);
		}else{
		    theVar = part;
		}
		vars[theVar] = parts.length;
		entries.push( {"type":"var", "value":theVar} );
		if(match){
		    entries.push( {"type":"txt", "value":part.substr(match.index)} );
		}
	    }
	    table.push({"vars":vars,"entries":entries});
	}
	return table;
    },
    generate: function() {
	var harvested = harvest(app.interview);
	var data = harvested[0];
	var templates = harvested[1];
	var order = harvested[2];
	var available = {};
	var rendered = {};
    
	var text;
	if(order.length == 0){
	    text = "Please select some items.";
	}else{
	    text = "";

	    for(var idx=0; idx<order.length; idx++){
		var name = order[idx];
		available[name] = true;
		var txts = [];
		
		for(var key in data[name]){
		    if(data[name][key] instanceof Object){
			if('head' in data[name][key]){
			    txts.push(data[name][key].head);
			}else{
			    txts.push(JSON.stringify(data[name][key]));
			}
		    } else {
			txts.push(data[name][key]);
		    }
		}
		if(txts.length == 0){
		    // ignore
		    available[name] = false;
		}else{
		    var txt = txts[0];
		    for(var idx2=1; idx2 < txts.length-1; idx++){
			txt += ", " + txts[idx2];
		    }
		    if(txts.length > 1){
			txt += " and " + txts[txts.length-1];
		    }
		    rendered[name] = txt;
		}
	    }
	    
	    for(var idx=0; idx<order.length; idx++){
		var name = order[idx];
		if(available[name]){
		    // look for templates that include name
		    var relatedTemplates = [];
		    var winningTemplate = null;
		    for(var idx2=0; idx2<app.templateTable.length; idx2++){
			var template = app.templateTable[idx2];
			if(name in template.vars) {
			    // check whether the rest of the data is available
			    var allAvailable = true;
			    for(var other in template.vars){
				if(!(other in available && available[other])){
				    allAvailable = false;
				}
				if(allAvailable){
				    relatedTemplates.push(template);
				    if(!winningTemplate || winningTemplate.entries.length < template.entries.length){
					winningTemplate = template;
				    }
				}
			    }
			}
		    }
		    if(winningTemplate){
			for(var idx2=0;idx2<winningTemplate.entries.length; idx2++){
			    var entry = winningTemplate.entries[idx2];
			    if(entry.type == "var"){
				text += rendered[entry.value];
				available[entry.value] = false;
			    }else{
				text += entry.value;
			    }
			}
		    }else{
			text += templates[name].replace(/\$[a-zA-Z]+/, rendered[name]) + " ";
			available[name] = false;
		    }
		}
	    }
	}

	text += "\n\n<!-- " + JSON.stringify(data) + " -->";
	var eventname = "unknownevent";
	if('eventname' in data && 'txt' in data.eventname){
	    eventname = data.eventname.txt;
	}
	
	return {
	    text: text,
	    eventname: eventname
	};
    }
};

