/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
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

function numerateAndFix(top){
    // top is array of objects
    var count = 0;
    var table = {};
    var previous = null;
    for(var idx = 0; idx < top.length; idx++){
	var node = top[idx];
	node["id"] = count;
	table[count] = node;
	if(previous){
	    previous["next"] = count;
	}
	previous = node;
	count += 1;
	// for the only key other than "id", numerate all the options
	var label;
	for(var key in node){
	    if(key != "id"){
		label = key;
		for(var idx2=0; idx2 < node[key].length; idx2++){
		    var node2 = node[key][idx2];
		    node2["id"] = count;
		    node2["level"] = 1;
		    table[count] = node2;
		    count += 1;
		}
	    }
	}
	node["label"] = label;
	node["level"] = 0;
    }
    return table;
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

function generate(){
    var harvested = harvest(app.interview);
    var data = harvested[0];
    var templates = harvested[1];
    var order = harvested[2];

    var text;
    if(order.length == 0){
	text = "Please select some items.";
    }else{
	text = "";

	for(var idx=0; idx<order.length; idx++){
	    var name = order[idx];
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
	    }else{
		var txt = txts[0];
		for(var idx2=1; idx2 < txts.length-1; idx++){
		    txt += ", " + txts[idx2];
		}
		if(txts.length > 1){
		    txt += " and " + txts[txts.length-1];
		}
		text += templates[name].replace(/\$[a-zA-Z]+/, txt);
	    }
	}
    }

    text += "\n\n<!-- " + JSON.stringify(data) + " -->";
    document.getElementById("txt_output").innerHTML = text;

    // set link to https://en.wikinews.org/w/index.php?action=edit&preload=Wikinews%3AWikiReporter%2Fdraft&editintro=Wikinews%3AWikiReporter%2Fintro&title=<eventname>
}

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
	var current = "main";
	this.setPane = function(pane){
	    document.getElementById(current).style.visibility="hidden";
	    document.getElementById(current).style.display="none";
	    current = pane;
	    document.getElementById(current).style.visibility="visible";
	    document.getElementById(current).style.display="block";
	};
	var button_generate = true;
	this.toggleButtons = function(){
	    if(button_generate){
		button_generate = false;
		document.getElementById("btn_generate").style.visibility="hidden";
		document.getElementById("btn_generate").style.display="none";
		document.getElementById("btn_back").style.visibility="visible";
		document.getElementById("btn_back").style.display="block";
	    }else{
		button_generate = true;
		document.getElementById("btn_back").style.visibility="hidden";
		document.getElementById("btn_back").style.display="none";
		document.getElementById("btn_generate").style.visibility="visible";
		document.getElementById("btn_generate").style.display="block";
	    }
	};
	this.doneButton = function(btnId) {
	    var btn = document.getElementById(btnId);
	    btn.className = "btn btn-success btn-xs";
	};
	this.diveNode = function(nodeId){
	    this.current.push(nodeId);
	    this.render(nodeId);
	};
	this.render = function() {
	    var html = "";
	    var node = this.interviewTable[app.current[app.current.length-1]];
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
	this.gather = function() {
	    // invariant: current[-1].level == 1
	    var node = this.interviewTable[app.current[app.current.length-1]];
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
	this.generate = function() { generate() };
	this.interview = null; //[ "loading?" : [ { "is loading?" : { "options" : [ "yes" ] } } ] ];
	var interviewFetcher = new XMLHttpRequest();
	interviewFetcher.onreadystatechange = function(){
	    if (interviewFetcher.readyState == 4 && interviewFetcher.status == 200) {
		app.interview = jsyaml.load(interviewFetcher.responseText);
		app.interviewTable = numerateAndFix(app.interview);
		//alert(JSON.stringify(app.interview));
		console.log(JSON.stringify(app.interview));
		app.current = [ 0 ];
		app.render();
	    }
	};
	interviewFetcher.open("GET", "/data/interview.yaml");
	interviewFetcher.send();
    }
};

app.initialize();
if(!window.cordova){
    app.onDeviceReady();
}
