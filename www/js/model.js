/* Dual licensed APL2.0 & GPL3.0.
 *
 * Author: Pablo Duboue <pablo.duboue@gmail.com>
 */

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

var wrModel = {
    categories: [ "Conferences","Exhibitions","Lectures","Parades","Protests" ],
    questions: {}, // from category to loaded YaML
    templates: {}, // from category to list of template table
    current: { category: nil,
	       data: {}, // from the questions[current.category] to the values filled
	       text: "" // any text generated or edit so far
	     },
    loaded: false,
    loadedCallback: nil,
    _currentTemplateLoading: 0,
    _currentInterviewLoading: 0,
    _doneLoading: function() {
	if(!this.loaded){
	    this.loaded = true;
	    if(this.loadedCallback){
		loadedCallback();
	    }
	}
    },
    load: function() {
	this._currentTemplateLoading = 0;
	this._currentInterviewLoading = 0;

	var templatesFetcher = new XMLHttpRequest();
	templatesFetcher.onreadystatechange = function(){
	    if (templatesFetcher.readyState == 4 && templatesFetcher.status == 200) {
		var templates = templatesFetcher.responseText;
		wrModel.templates[wrModel.categories[wrModel._currentTemplateLoading]] = parseTemplates(templates);
		wrModel._currentTemplateLoading++;
		if (wrModel._currentTemplateLoading == wrModel.categories.length){
		    if (wrModel._currentInterviewLoading == wrModel.categories.length){
			wrModel._doneLoading();
		    }
		}else{
		    templatesFetcher.open("GET", "data/" + wrModel.categories[wrModel._currentTemplateLoading] + ".txt");
		    templatesFetcher.send();
		}	
	    }
	};
	templatesFetcher.open("GET", "data/" + wrModel.categories[wrModel._currentTemplateLoading] + ".txt");
        templatesFetcher.send();

	var interviewFetcher = new XMLHttpRequest();
	interviewFetcher.onreadystatechange = function(){
	    if (interviewFetcher.readyState == 4 && interviewFetcher.status == 200) {

		var interview = jsyaml.load(interviewFetcher.responseText);
		
		wrModel.interviews[wrModel.categories[wrModel._currentInterviewLoading]] = numerateAndFix(interview);
		wrModel._currentInterviewLoading++;
		if (wrModel._currentInterviewLoading == wrModel.categories.length){
		    if (wrModel._currentTemplateLoading == wrModel.categories.length){
			wrModel._doneLoading();
		    }
		}else{
		    interviewFetcher.open("GET", "data/" + wrModel.categories[wrModel._currentInterviewLoading] + ".yaml");
		    interviewFetcher.send();
		}	
	    }
	};
	
	templatesFetcher.open("GET", "data/" + wrModel.categories[wrModel._currentTemplateLoading] + ".txt");
        templatesFetcher.send();
    }
};

