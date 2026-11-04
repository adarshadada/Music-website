# wave.radio Android app

A thin native shell around the website, built by GitHub (no computer needed). It adds real Android push alerts.

1. google-services.json (Firebase config for package com.waveradio.app) is already in this folder.
   It is public app configuration, not a password. You can also override it with a GOOGLE_SERVICES_JSON repository secret.
2. Create .github/workflows/android.yml (the file is in the chat) and run: Actions > Build Android app > Run workflow.
3. When it turns green: Releases > latest > download app-debug.apk and install it.

The app loads https://adarshadada.github.io/Wave.Radio/, so website updates reach the app without rebuilding.
