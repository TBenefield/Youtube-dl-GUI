module.exports = {
	//run at the start of the program
	initialize: function() {
		console.log("Initializing");
		//set download directory to default
		document.getElementById('downloadDirectory').value = storage.get('dlDirectory');
		
		var path = electron.app.getAppPath();
		console.log(path);
		console.log(path + '\\youtube-dl.exe');
		console.log(path.slice(0, path.length-13) + '\\youtube-dl.exe');
		/*fs.rename(path + '\\youtube-dl.exe',path.slice(0, path.length-13) + '\\youtube-dl.exe',
						function(err) { if(err) console.log('ERROR: ' + err) });
	*/
		//build history table
		var histList = document.getElementById('historyTable');
		histList.style.visibility = 'visible';
		let histContent = storage.get('history');
		histContent.reverse();
		if(histContent.length > 1) {
			for(var i = 0; i < histContent.length; i++) {
				let row = histList.insertRow(i+1);
				let title = row.insertCell(0);
				let time = row.insertCell(1);
				title.innerHTML = histContent[i].Title;
				time.innerHTML = histContent[i].Time;
			}
		}
		console.log('Done Initializing');
	},
	
	//creates elements for a downloading item
	createLoadingObjects: function(proc) {
		var loadingObjectE = document.createElement('DIV');
		loadingObjectE.id = 'loadingObject' + proc.pid;
		loadingObjectE.classList.add('loadingObject');
		loadingObjectE.classList.add('row');
		
		var loadingTitleE = document.createElement('STRONG');
		loadingTitleE.classList.add('loadingTitle');
		
		var loadingBarSVGE = document.createElement('SVG');
		loadingBarSVGE.classList.add('loadingBarSVG');
		
		//var groupE = document.createElement('g');
		
		var loadingBarE = document.createElement('RECT');
		loadingBarE.classList.add('loadingBar');
		loadingBarE.setAttribute('height', '100%');
		loadingBarE.setAttribute('width', '100%');
		
		var loadingPercentE = document.createElement('TEXT');
		loadingPercentE.classList.add('loadingPercent');
		loadingPercentE.setAttribute('x', "50%");
		loadingPercentE.setAttribute('y', "18");
		
		var spinnerE = document.createElement('IMG');
		spinnerE.src = "spinner.gif";
		spinnerE.classList.add('spinner');
		
		var loadingInfoE = document.createElement('P');
		loadingInfoE.classList.add('loadingInfo');
		
		loadingObjectE.appendChild(loadingTitleE);
		loadingObjectE.appendChild(loadingBarSVGE);
		/*
		loadingBarSVGE.appendChild(groupE);
		groupE.appendChild(loadingBarE);
		groupE.appendChild(loadingPercentE);
		*/
		loadingBarSVGE.appendChild(loadingBarE);
		loadingBarSVGE.appendChild(loadingPercentE);
		loadingObjectE.appendChild(spinnerE);
		loadingObjectE.appendChild(loadingInfoE);
		
		list = document.getElementById('loadingItems');
		list.insertBefore(loadingObjectE, list.childNodes[0]);
		
		return {
			loadingObject: loadingObjectE,
			loadingTitle: loadingTitleE,
			loadingBarSVG: loadingBarSVGE,
			loadingBar: loadingBarE,
			loadingPercent: loadingPercentE,
			spinner: spinnerE,
			loadingInfo: loadingInfoE
		}
		
		/*
		<div class="row loadingObject" id='loadingObjects'>
		  <strong class="loadingTitle" id="loadingTitle" fill="black">[ Magnetic ] - Risotto_Metallica's Theme - Golden Wind OST EXTENDED.mp4</strong>
		  <svg class="loadingBarSVG" width="50%" height="30" id="loadingBarContainer">
			<g>
			<rect class="loadingBar" id="loadingBar"/>
			<text class="loadingPercent" x="50%" y="18" id="loadingPercent">50%</text>
			</g>
			<img class="spinner" src="spinner.gif" id="spinner"/>
		  </svg>
		  <p class="loadingInfo" id="loadingInfo">[download] 50%</p>
		</div>
		*/
		
		//loadingObjectE.id = "loadingObject" + proc.pid;
		//loadingTitleE.id = "loadingTitle" + proc.pid;
		//loadingBarSVGE.id = "loadingBarSVG" + proc.pid;
		//groupE.id = "group" + proc.pid;
		//loadingBarE.id = "loadingBar" + proc.pid;
		//loadingPercentE.id = "loadingPercent" + proc.pid;
		//spinnerE.id = "spinner" + proc.pid;
		//loadingInfoE.id = "loadingInfo" + proc.pid;
	}
	
	
}