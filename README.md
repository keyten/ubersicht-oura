# ubersicht-oura
Übersicht widget for tracking oura sleep. Shows you the last 15 days + the sleep debt if you've slept less than 8.5 hours last night.

You will need to sync the oura ring with your app every day, so that Oura cloud gets your data, and your desktop can fetch them.

<img width="903" alt="image" src="https://github.com/keyten/ubersicht-oura/assets/1017222/2c4c7502-cf86-4768-8255-e6b9a7692a1d">

# Installation
1. Put oura.jsx to the widgets directory.
2. Open https://cloud.ouraring.com/ and login.
3. Open developer console and find cookie in the very first request.
![image](https://github.com/keyten/ubersicht-oura/assets/1017222/68208aa8-8990-4969-a9e2-d294ac9de35a)
4. Open oura.jsx and insert instead of `YOUR_COOKIE_VALUE`. Save.
