# ITI ID Card V5 — GitHub + Google Drive

## Main goal
Search student by Name or Enrollment Number. Select student. Upload photo once. Apps Script saves the photo in the private Google Drive folder using the Enrollment Number. On refresh/search, the website asks Apps Script for that enrollment photo and displays it automatically.

## Permanent data
Student Name, Enrollment No., Trade, Batch, Session, DOB and Address are embedded in `data.js` from the current master Excel.

## Photo sync
Google Drive folder is private. Apps Script is the bridge. The photo filename is `<EnrollmentNo>.jpg` (or png/webp).

## Setup
1. Replace `index.html`, `style.css`, `script.js`, and `data.js` in GitHub.
2. In Google Apps Script replace the project code with `apps_script.gs`.
3. Deploy as Web App: Execute as Me; Who has access: Anyone.
4. Use the deployed `/exec` URL in `script.js`.
5. Test one student: Search → Upload Photo → verify Drive → refresh → search again → photo should return automatically.

## Current master
159 records from ITI_ID_Master_Excel_2026(1).xlsx.
