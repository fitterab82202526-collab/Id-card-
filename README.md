# ITI ID Card Generator

Simple GitHub Pages website for SHREE S K PATEL ITI KADI (GIA-509).

## Use
1. Open the website.
2. Upload the master Excel file.
3. Search/select a student.
4. Check the centered photo + details.
5. Click **Print ID Card** and choose **Save as PDF** if required.

## GitHub Pages
Upload `index.html`, `style.css`, and `script.js` to a GitHub repository.
Then go to **Settings → Pages → Deploy from branch → main → /root**.

The Excel file is processed in the browser; it is not uploaded to a server by this website.

## Excel headers
The script recognizes common headers such as:
- Student Name
- Enrollment No.
- Roll No.
- Trade
- Batch / Session
- DOB
- Address
- Mobile
- Photo / Photo URL

For local photo files, a later version can add a photo-folder mapping system.
