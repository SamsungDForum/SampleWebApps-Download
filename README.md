# Download Application

This application demonstrates the usage of Download API.
With this API it is possible to manage downloading files to device in application.

Making advantage of this feature, it is possible to measure internet download speed on the device.


## How to use the application

Use TV remote controller to navigate. By pressing the buttons user can see
the output from the following methods of the Download API:

- **Start/Retake** - `tizen.download.start(downloadRequest, listener)`:
  This method starts download on given request and sets listener which defines
download behaviour in certain states. Method returns an integer which is download id.

- **Pause** - `tizen.download.pause(downloadId)`:
  This method pauses download on given download id and invokes listener's onpaused.

- **Resume** - `tizen.download.resume(downloadId)`:
  This method resumes paused downloading on given downloadId.

- **Cancel** - `tizen.download.cancel(downloadId)`:
  This method cancels downloading on given downloadId.


## Supported platforms

2015 and newer


### Privileges and metadata

In order to use Download API the following privileges must be included in `config.xml`:

```xml
<tizen:privilege name="http://tizen.org/privilege/download" />
```

Furthermore Filesystem API is used in the application for deleting the downloaded files
in order to free used space, so the following privileges are also needed:

```xml
<tizen:privilege name="http://tizen.org/privilege/filesystem.read" />
<tizen:privilege name="http://tizen.org/privilege/filesystem.write" />
```

### File structure

```
Download/ - Download sample app root folder
│
├── assets/ - resources used by this app
│   │
│   └── JosefinSans-Light.ttf - font used in application
│
├── css/ - styles used in the application
│   │
│   ├── main.css - styles specific for the application
│   └── style.css - style for application's template
│
├── js/ - scripts used in the application
│   │
│   ├── init.js- script that runs before any other for setup purpose
│   ├── keyhandler.js - module responsible for handling keydown events
│   ├── logger.js - module allowing user to register logger instances
│   ├── main.js - main application script
│   ├── navigation.js - module responsible for handling in-app focus and navigation
│   └── utils.js - module with useful tools used through application
│
├── CHANGELOG.md - changes for each version of application
├── config.xml - application's configuration file
├── icon.png - application's icon
├── index.html - main document
└── README.md - this file
```

## Other resources

*  **Download API**  
  https://developer.samsung.com/tv/develop/api-references/samsung-product-api-references/download-api

*  **Filesystem API**  
  https://developer.samsung.com/tv/develop/api-references/tizen-web-device-api-references/filesystem-api


## Copyright and License

**Copyright 2019 Samsung Electronics, Inc.**

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
