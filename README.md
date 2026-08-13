# ITI ID Card System — Final V4

## Main goal

Search a trainee by **Name or Enrollment Number → upload photo once → photo is saved in the browser → generate final ID card → print / save PDF**.

The master Excel is converted into `data.js`, so the 159 current students are already available when GitHub Pages opens.

## Simple daily process

1. Open the website.
2. Search student name or enrollment number.
3. Select the student.
4. Click **Upload / Change Photo**.
5. Select the trainee photo.
6. Photo is saved in the browser against that enrollment number.
7. Click **Generate ID Card**.
8. Click **Print ID Card** or **Save ID Card PDF**.

You do not need to upload the photo again on the same browser/device for that enrollment number.

## Important photo storage rule

Photos are stored in the browser's IndexedDB. They are NOT uploaded to GitHub and are NOT publicly exposed.

If browser data is cleared, the saved photos may be removed.

For a permanent cross-device photo database, a private server/database or controlled storage service is required.

## Updating student data

### Permanent GitHub update

1. Open the website.
2. Go to **Update Student Data**.
3. Choose the new Excel.
4. The website imports the new student data.
5. Click **Export Updated data.js**.
6. Download `data.js`.
7. Replace the repository's `data.js` with the downloaded file.
8. Commit the change to GitHub.
9. Wait for GitHub Pages to redeploy.

### Local-only update

Importing Excel without replacing GitHub's `data.js` updates the current browser only.

## Excel columns

The importer recognizes common headers:
- EnrolmentNo / EnrollmentNo / Enrollment Number
- Student Name / Name
- Session
- Trade
- Batch
- Date of Birth / DOB
- Address

Mobile number is not used by this ID-card system.

## Current master data check

- 159 student records imported from the supplied master workbook.
- No duplicate enrollment numbers detected.
- Current trade counts: Fitter 40, Electrician 20, Wireman 40, COPA 48, PPO 11.
