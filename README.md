# Thanksgiving Food Reservation — Peas & Grace Pantry

A bilingual (English / Spanish) reservation form that people can fill out online **or** print and fill out by hand. Online reservations go to a Google Sheet, which you can download as an Excel file at any time.

- `site/` — the web page (plain HTML/CSS/JS, no build step). This folder is what gets published.
- `apps-script/Code.gs` — the small Google Apps Script that writes each reservation into your Google Sheet.
- `.github/workflows/pages.yml` — publishes `site/` to GitHub Pages on every push to `main`.
- `project/` — the original Claude Design files and chat the page was built from (for reference only).

Distribution: **Saturday, November 21st, 9 a.m. – 11 a.m.**, Marshall United Methodist Church, 8405 W. Main St., Marshall, VA 20115.

---

## 1. Connect the Google Sheet (about 5 minutes)

1. Go to <https://sheets.new> and name the sheet, e.g. **Thanksgiving Reservations 2026**.
2. In the sheet, open **Extensions → Apps Script**.
3. Delete what's in the editor, paste in everything from [`apps-script/Code.gs`](apps-script/Code.gs), and click **Save** (💾).
4. Click **Deploy → New deployment**. Click the gear ⚙ next to "Select type" and choose **Web app**.
   - **Description:** Reservation form
   - **Execute as:** Me
   - **Who has access:** Anyone
5. Click **Deploy**, then **Authorize access** and allow it with your Google account. (Google may show "Google hasn't verified this app": click **Advanced → Go to … (unsafe)**. It's your own script.)
6. Copy the **Web app URL** (it ends in `/exec`).
7. Open [`site/config.js`](site/config.js) and paste the URL between the quotes:
   ```js
   window.RESERVATION_ENDPOINT = 'https://script.google.com/macros/s/AKfy.../exec';
   ```
8. Commit and push. The site redeploys automatically.

A **Reservations** tab is created on the first submission with these columns:

| Submitted | First Name | Last Name | Adults | Children | Total People | Phone | Email | Browser Language | Reservation ID | Last Updated |
|---|---|---|---|---|---|---|---|---|---|---|

If someone presses **Edit** after submitting and sends the form again, their existing row is updated rather than duplicated.

**To get an Excel file:** in the sheet, choose **File → Download → Microsoft Excel (.xlsx)**. (Or **Comma-separated values (.csv)**.)

> If you later change `Code.gs`, use **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy** so the URL stays the same.

## 2. Publish on GitHub Pages

1. Push this repository to GitHub.
2. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The *Deploy form to GitHub Pages* workflow runs on each push to `main` (or run it from the **Actions** tab). The page appears at `https://<your-username>.github.io/<repo-name>/`.

The `site/` folder is fully static, so it also works on Netlify, Cloudflare Pages, or any web host. Just upload the folder.

## Testing locally

```sh
cd site && python3 -m http.server 8000
# open http://localhost:8000
```

Until `config.js` has a URL, pressing Submit shows a bilingual message asking people to print the form instead, so no reservation is silently lost.

## Accessibility & responsiveness

- Works from small phones (320px) up to desktop. On phones the fields stack into one column and the buttons go full width.
- Every field has a real `<label>` in both languages (Spanish text is marked `lang="es"` so screen readers pronounce it correctly). Adults/Children are grouped in a `<fieldset>`.
- Errors are shown as text below each field in both languages, linked with `aria-describedby`/`aria-invalid`, and focus moves to the first problem. The thank-you message receives focus, and send errors are announced (`role="alert"`).
- Text and form-control colors meet WCAG 2.1 AA contrast. Compared with the design, the input borders and the small gold text on green were darkened or lightened slightly to pass.
- There is a "Skip to form" link, a visible focus ring, 44px+ touch targets, and support for Windows high-contrast mode. The page passes an automated axe-core scan with no violations.
- **Print:** the Print button (or the browser's Print) hides the buttons and messages and prints one US Letter page with empty boxes to write in.

## Notes

- The Spanish translations were machine-written in the design phase. Please have a native speaker review them.
- A hidden "website" field catches simple spam bots. Their submissions are quietly dropped.
