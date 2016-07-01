/* Dual licensed APL2.0 & GPL3.0.
 *
 * Author: Pablo Duboue <pablo.duboue@gmail.com>
 */

function getSelectValues(select) {
  var result = [];
  var options = select && select.options;
  var opt;

  for (var i=0, iLen=options.length; i<iLen; i++) {
    opt = options[i];

    if (opt.selected) {
      result.push(opt.value || opt.text);
    }
  }
  return result;
}

function harvest(top){
    var result = {};
    var templates = {};
    var order = [];
    for(var idx = 0; idx < top.length; idx++){
	var node = top[idx];
	for(var idx2=0; idx2 < node[node.label].length; idx2++){
	    var node2 = node[node.label][idx2];
	    if('gathered' in node2) {
		order.push(node2.name);
		result[node2.name] = node2.gathered;
		templates[node2.name] = node2.template;
	    }
	}
    }
    return [ result, templates, order ];
}

function setVisibility(id, visible){
    var elem = document.getElementById(id);
    if(visible){
	elem.style.visibility="visible";
	    elem.style.display="block";
    }else{
	elem.style.visibility="hidden";
	elem.style.display="none";
    }
}

var app = {
    start: function() {
	var current = "main";
	app.setPane = function(pane){
	    setVisibility(current, false);
	    current = pane;
	    setVisibility(current, true);
	};
	var button_generate = true;
	app.toggleButtons = function(){
	    button_generate = !button_generate;
	    setVisibility("btn_generate", button_generate);
	    setVisibility("btn_back", !button_generate);
	};
	app.doneButton = function(btnId) {
	    var btn = document.getElementById(btnId);
	    btn.className = "btn btn-success btn-xs";
	};
	app.diveNode = function(nodeId){
	    app.current.push(nodeId);
	    app.render(nodeId);
	};
	app.render = function() {
	    var html = "";
	    var node = app.interviewTable[app.current[app.current.length-1]];
	    if(node.level == 1){
		html += "<h2>" + node.label + "</h2>";
		if(node.inputType == "options" || node.inputType == "freeOptions"){
		    html += "<select id='sel' multiple>";
		    for(var idx=0; idx<node.options.length; idx++){	
			var opt = node.options[idx];
			html += "<option value='" + idx + "'";
			if('gathered' in node && (""+idx) in node.gathered){
			    html += " selected";
			}
			html += ">" +  opt.label + "</option>";
		    }
		    html += "</select><br>";
		}
		if(node.inputType == "freeOptions" || node.inputType == "freeText" || node.inputType == "number"){
		    html += "<input type='text' id='txt'";
		    if('gathered' in node && "txt" in node.gathered){
			html += " value='" + node.gathered.txt + "'";
		    }
		    html += "></input>";
		}
		if(node.inputType == "freeList"){
		    // todo
		    html += "<input type='text' id='txt'>";
		    if('gathered' in node && "txt" in node.gathered){
			html += node.gathered.txt;
		    }
		    html += "</input>";
		}
		html += '<br><a href="javascript:void(0)" onclick="app.gather();" class="btn btn-success btn-xs">done here</a>';
	    }else{
		// top level
		html += "<ul>";
		for(var idx=0; idx<node[node.label].length; idx++) {
		    var opt = node[node.label][idx];
		    html += "<li> <a id='btn_" + opt.name + "' href='javascript:void(0)' onclick='app.diveNode(" + opt.id + ");' class='btn  btn-xs " + ('gathered' in opt ? "btn-success" : "btn-danger") + "'>" + opt.label + "</a> </li>";
		}
		html += "</ul>";
		if("next" in node){
		    html += "<p><a href='javascript:void(0)' id='btn_next' onclick='app.current = [" + node.next + "]; app.render();' class='btn btn-success btn'>Next Set</a></p>";
		}
	    }
	    html += "";
	    document.getElementById("main").innerHTML = html;
	};
	app.gather = function() {
	    // invariant: current[-1].level == 1
	    var node = app.interviewTable[app.current[app.current.length-1]];
	    node.gathered = {};
	    if(node.inputType == "options" || node.inputType == "freeOptions"){
		var selVal = getSelectValues(document.getElementById('sel'));
		for(var idx=0; idx<selVal.length; idx++){
		    node.gathered[selVal[idx]] = node.options[selVal[idx]].semantics;
		}
	    }
	    if(node.inputType == "freeOptions" || node.inputType == "freeText" || node.inputType == "number"){
		node.gathered["txt"] = document.getElementById('txt').value;
	    }
	    if(node.inputType == "freeList"){
		//todo
		node.gathered["txt"] = document.getElementById('txt').value;
	    }
	    app.current.pop();
	    app.render();
	};
	app.generate = function() {
	    var gen = wrGenerator.generate();
	    
	    document.getElementById("txt_output").innerHTML = gen.text;
	    document.getElementById("wiki_link").href =
		'https://en.wikinews.org/w/index.php?'+
		'action=edit&preload=Wikinews%3AWikiReporter%2Fdraft&'+
		'editintro=Wikinews%3AWikiReporter%2Fintro&title='+gen.eventname;
	    document.getElementById("photo_link").href =
		'https://commons.wikimedia.org/w/index.php?' + 
		'title=Special:UploadWizard&campaign=WikiReporter&categories=' + gen.eventname +
		'|WikiReporter&description=' + gen.eventname;
	};
    }
};

app.start();
