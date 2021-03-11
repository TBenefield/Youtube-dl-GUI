// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var { spawn } = require('child_process');
const Storage = require('./storage.js');
const electron = require('electron').remote;
var child = require('child_process');
const fs = require('fs');
const func = require('./functions.js');

var elements = {
	startDownload: document.getElementById('startDownload')
};

//this is the data file for long-term storage
const storage = new Storage({
	configName: 'youtubedl-gui-local-data'
});

//hotkeys
//F5 = refresh
document.addEventListener("keydown", function(e) {
	if(e.code === 123) {
		electron.getCurrentWindow().toggleDevTools();
	} else if (e.code === 116) {
		location.reload();
	}
});

//set text of download directory
function initialize() {
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
}
func.initialize();

//This function allows the user to select the file they want to download the video to
function fileSelect() {
	var filePath = electron.dialog.showOpenDialogSync({
		properties:['openDirectory']
	});
	if(filePath){
		storage.set('dlDirectory', filePath[0]);
		document.getElementById('downloadDirectory').value = storage.get('dlDirectory');
	}
}

//Deletes user history
function deleteHistory() {
	var selection = electron.dialog.showMessageBoxSync({
		type: "question",
		buttons: ["Yes", "Cancel"],
		message: "Are you sure you want to delete your download history? This cannot be reversed",
		cancelId: 1
	});
	if(selection == 0)
		storage.set('history', new Array());
}


////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////Download function//////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

var downloadingVideos = {};
function youtubeDlDownload() {
	
	//check if the selected download directory actually exists
	if(!fs.existsSync(storage.get('dlDirectory'))) {
		electron.dialog.showMessageBoxSync({
			type:'error',
			message:'Download directory does not exist'
		});
		return 0;
	}
	
	
	
	//Get type of download (full video, audio only, etc.)
	var formatName = "";
	var formatOptions = "";
	var ext = '.%(ext)s';
	if(document.getElementById('downloadType').value == 'Audio Only')
		ext = '.wav';
	else if(document.getElementById('downloadType').value == 'Video & Audio (Separate)') {
		formatOptions = "-f \"bestvideo,bestaudio\" ";
		formatName = '.f%(format_id)s';
	}
	
	
	//This part is about getting getting the name of the file the video should be downloaded as
	dlPath = ' -o \"';
	//This runs if the box for default file name is selected
	if(document.getElementById('defaultCheck').checked)
		dlPath = dlPath + storage.get('dlDirectory') + '\\\%(title)s';
	//This runs if the user has given their own name for the video
	else {
		var fileName = document.getElementById('fileName').value;
		var reg = new RegExp('[^\\s\\-a-zA-Z0-9\\_\\$\\#\\~\\!\\@\\%\\^\\&\\(\\)\\\']');
		if(fileName.match(reg)) {
			electron.dialog.showMessageBoxSync({
				type:'error',
				message:fileName + ' is not a valid file name.'
		});
			return;
		}
		dlPath = dlPath + storage.get('dlDirectory') + '\\' + document.getElementById('fileName').value;
	}
	dlPath = dlPath + formatName + ext + '\" ';
	
	//Get path to bat file for youtube-dl
	var batPath = electron.app.getAppPath() + '\\runYoutubeDl.bat ';
	
	//Get the url and set it to the current title of the download
	var url = document.getElementById('videoInput').value;
	var title = url;
	
	//Start video download, set the default values for the process
	var proc = child.spawn('cmd.exe', ['/c', batPath + formatOptions  + dlPath + ' \"' + url + '\"'], {shell: true});
	downloadingVideos[proc.pid] = {
		dlTitle: title,
		dlInfo: "",
		dlPercent: 0
	}

	//Create the html for the downloading video
	var loadingObjects = func.createLoadingObjects(proc);
	loadingObjects.loadingTitle.innerHTML = url;
	loadingObjects.loadingPercent.innerHTML = '0%';

	//////child events//////

	//Youtube-dl will not download a video if it detects that it has already been downloaded, so we have to keep track of whether or not its a new download and let the user know if it isn't.
	var newDownload = true;
	
	//This is an event listener for when youtube-dl gives some kind of output.  We use this to update the information displayed to the user
	proc.stdout.on('data', (data) => {
		console.log("DATA: " + data);
		downloadingVideos[proc.pid].dlInfo = data.toString();
		loadingObjects.loadingInfo.innerHTML = data.toString();

		//Get title of Youtube video by finding and manipulating the output
		if(data.toString().match(/\[download\] Destination:/)) {
			title = data.toString().slice(25 + storage.get('dlDirectory').length, data.toString().length-1);
			downloadingVideos[proc.pid].dlTitle = title;
			loadingObjects.loadingTitle.innerHTML = title;
		}
		//Checks if the video has already been downloaded.
		if(data.toString().match(/has already been downloaded/))
			newDownload = false;

		//Find and display the percentage completion for the video download
	    var regex = new RegExp(']\\s+[0-9]+\.?[0-9]+');	//regular expression for getting percentage done
		var dlpercent = data.toString().match(regex);			//get percentage done
		if(dlpercent) {
			dlpercent = dlpercent[dlpercent.length-1];				
			dlpercent = dlpercent.slice(2, dlpercent.length);		
			dlpercent = parseFloat(dlpercent);													//change from string to float
			downloadingVideos[proc.pid].dlPercent = dlpercent;
			loadingObjects.loadingBar.width = dlpercent + '%';							//update loading bar
			loadingObjects.loadingPercent.innerHTML = dlpercent + '%';
		}
	});
	
	//This is an event listener for when youtube-dl gives an error output
	proc.stderr.on('data', (data) => {
		console.log(data.toString());
		document.getElementById('startDownload').disabled = false;
		//Display error message to user
		electron.dialog.showMessageBoxSync({
			type:'error',
			message:data.toString()
		});
	});

	//Closes the download
	proc.on('exit', (code) => {
		document.getElementById('startDownload').disabled = false;
		
		//Color the loading object.  If the exit code is 0, the download was successful and the object is colored green.
		//		Otherwise, the download failed and the object is colored red
		if(code)
			loadingObjects.loadingObject.style.backgroundColor = '#ff9999';
		else
			loadingObjects.loadingObject.style.backgroundColor = '#ccffcc';
		
		//Remove the spinner from the loading object
		loadingObjects.spinner.style.visibility = 'hidden';
		
		//This part checks if the video is a new download and then checks if it downloaded successfully
		//	If all went well, the video is added to the history file and table
		//	If not, the user is given a message informing them of what went wrong
		if(newDownload){
			if(code == 0) {
				//Create the history object
				historyObject = {
					Title:title,
					Location:dlPath.slice(0, dlPath.length-13) + title,
					Time:new Date().toLocaleString()
				};
				console.log(historyObject);
				let his = storage.get('history');              			     //get history array from storage file
				his.push(historyObject);                                	 //push the url on the history array
				storage.set('history', his);
				console.log("Finished Downloading");
				
				//Add the newly downloaded video to the history table
				var histTable = document.getElementById('historyTable');
				let row = histTable.insertRow(1);
				let titleRow = row.insertCell(0);
				let time = row.insertCell(1);
				titleRow.innerHTML = title;
				time.innerHTML = new Date().toLocaleString();
				document.getElementById('loadingObject'+proc.pid).style.backgroundColor = '#ccffcc';
			}
			//Gives the user a message informing them of the error
			else {
				electron.dialog.showMessageBoxSync({
					type:'error',
					message:data.toString()
				});
				document.getElementById('loadingObject'+proc.pid).style.backgroundColor = '#ff9999';
			}
		}
		//Gives the user a message informing them that the video has already been downloaded
		else {
			electron.dialog.showMessageBoxSync({
			type:'info',
			message:data.toString()
			});
			document.getElementById('loadingObject'+proc.pid).style.backgroundColor = '#ff9999';
		}
	});
}
