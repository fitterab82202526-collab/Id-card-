# Permanent ITI ID Card System V3

This package embeds the 159 records from `ITI_ID_Master_Excel_2026(1).xlsx` into `data.js`.

Permanent GitHub data fields:
- Enrollment No.
- Session
- Trade
- Batch
- Student Name
- DOB
- Address
- Photo status/data status are not needed by the ID card UI.

Mobile number is intentionally NOT embedded in `data.js`.

The website also accepts a future Excel update. Imported Excel data is saved in the browser with localStorage, so the same device/browser will retain the update.

IMPORTANT: To make a new Excel update permanent for every user/device, regenerate `data.js` and commit the new file to GitHub. GitHub Pages itself is not a writable database.

Photo files can be selected locally and are matched by enrollment, name, or roll number in the filename.
