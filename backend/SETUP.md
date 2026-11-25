# Turning on sign-in for Research mentors (one time, about 10 minutes)

1. **Create a Google sign-in client ID**
   - Open https://console.cloud.google.com/ with the Google account that owns the Medinsider sheet.
   - Create a project called "Medinsider" (top bar > project picker > New project).
   - Go to APIs & Services > OAuth consent screen: choose External, app name "Medinsider", your email, Save. Publish the app.
   - Go to APIs & Services > Credentials > Create credentials > OAuth client ID > Web application.
   - Under "Authorised JavaScript origins" add `https://medinsiders.github.io` and `http://localhost:8765`.
   - Create, then copy the Client ID (ends in `.apps.googleusercontent.com`).

2. **Put the client ID in two places**
   - Send it to Claude, who puts it in `data.js` (`window.GOOGLE_CLIENT_ID`).
   - In the Apps Script editor: Project Settings (gear) > Script properties > Add `CLIENT_ID` = the same value.

3. **Update the script**
   - Paste the new `backend/Code.gs` over the old code in the Apps Script editor and Save.
   - Pick `setup` in the function menu and Run once (allow the new Drive and external-request permissions).
     This adds the Users, Reviews and Mentors tabs and an hourly job that deletes ID photos after you check them.
   - Deploy > Manage deployments > pencil > Version: New version > Deploy (the web-app link stays the same).

# Daily use
- **Users tab:** open the ID card link, then set Status to Verified or Rejected. The photo is deleted within the hour.
  Students who sign in with an institute email (.edu, .ac.in, .edu.in ...) are verified automatically.
- **Reviews tab:** set Approved to publish a review. Nothing shows until you do.
- **Mentors tab:** check the LinkedIn, Scholar and PubMed links, then set Approved to list the group.

# Team applications (built into the website)
- The "Apply" button on the home page stays "Apply by email" until the new `Code.gs` is deployed (step 3 above). After that it opens the website's own form.
- **Applications tab:** each application is a row with a link to the CV, saved in the Drive folder "Medinsider applications (private)". Set Status to Selected or Rejected for your own tracking.
- You get an email for every application.
