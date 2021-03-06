// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu, shell, electron} = require('electron')
const path = require('path')
const Storage = require('./storage.js')


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
var filePath = __dirname;

//This is the variable that determines what and where long term data is stored.
const storage = new Storage({
	configName: 'youtubedl-gui-local-data',
	defaults: {
		windowBounds: { width: 1000, height: 800},
		dlDirectory: app.getPath('videos'),
		history: new Array()
	}
});

function createWindow () {
  //get stored window height and width
  let{ width, height } = storage.get('windowBounds');
  
  const menutemplate = [
    {
      role: 'About',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://github.com/BCRevels/414-Project')
          }
        }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(menutemplate));
	
	//Creates the storage file. I don't know if there is a better way to do it but
	//	this is the best way to guarentee a storage file is made if there isn't one that already exists
	storage.set('initiate', 'on');
	
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
	  nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  
  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
  
  //when the window is resized, this data is saved. When the app is opened again it will start with the window 
  //	size it was closed on
  mainWindow.on('resize', () => {
		let { width, height } = mainWindow.getBounds();
		storage.set('windowBounds', { width, height });
  });
  //mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
