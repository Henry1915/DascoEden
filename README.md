# Dasco Eden International School: Netlify version

A static site (`public/`) plus one Netlify Function (`netlify/functions/api.mjs`) that stores data in Netlify Blobs.

## Features
- Public pages: Home, About, Academics, Campus Life, Staff, News & Events, Admissions (online application with document upload, plus a WhatsApp enquiry), Contact
- Admin dashboard: the **Staff Login** button in the top menu (also in the footer, or add `#/admin` to the site address): overview, parents & students (attendance, fees, grades, notes), applications pipeline, announcements, events, staff, settings
- Parent portal (`#/parent`): each parent signs in with an access code and sees only their own children
- Optional "Ask AI" chat (needs an Anthropic API key)

## Deploy
Use Git or the Netlify CLI. Drag-and-drop deploys do not install the function's dependency.

### Option A: Git
1. Push this folder to a GitHub repository.
2. In Netlify: Add new site > Import from Git. Netlify reads `netlify.toml` (publish `public`, functions `netlify/functions`).
3. Add environment variables (below), then trigger a deploy.

### Option B: CLI
```
npm install -g netlify-cli
npm install
netlify login
netlify init            # or: netlify link
netlify env:set ADMIN_PASSWORD "your-long-password"
netlify env:set SESSION_SECRET "any-long-random-string"
netlify deploy --prod
```

### Test locally
Copy `.env.example` to `.env`, fill it in, then run `netlify dev`.

## Environment variables
| Name | Required | Purpose |
|---|---|---|
| ADMIN_PASSWORD | yes | Password for the admin dashboard |
| ADMIN_TOTP_SECRET | recommended | Turns on 2-step sign-in with an authenticator app (see below) |
| SESSION_SECRET | recommended | Signs login tokens and hashes parent codes. Changing it logs everyone out and invalidates all parent codes |
| ANTHROPIC_API_KEY | optional | Enables the "Ask AI" chat |
| ANTHROPIC_MODEL | optional | Defaults to `claude-haiku-5-5` (fast and low cost). Set e.g. `claude-sonnet-5-5` for a more capable model |

## Page addresses, sitemap.xml and Google
Every page has its own address: `/` (home), `/about`, `/academics`, `/campus-life`, `/staff`, `/news-events`, `/admissions`, `/contact`, plus the sign-in pages `/parents`, `/teachers` and `/admin`. The redirects in `netlify.toml` serve the site for each of these paths, and old `#/page` links still work (they are converted to the new address).
- Each page sets its own title and description (see `SEO` in `public/js/main.js`). The sign-in pages are marked `noindex`, so Google won't list them.
- `public/sitemap.xml` lists the 8 public pages and `public/robots.txt` points to it. **They use `https://dascoeden.netlify.app`.** If you connect your own domain, replace that address in `sitemap.xml`, `robots.txt` and the `canonical` / `og:` lines in `public/index.html`, and redeploy.
- After deploying, open Google Search Console, add your site, then submit `/sitemap.xml` under Sitemaps. Google can take days or weeks to list the pages.
- To test locally use `netlify dev`. Double-clicking `public/index.html` also shows the design (pages switch, but the address bar doesn't change), but sign-in, applications, saving and the AI chat need the server and won't work that way.
- Update `lastmod` dates in `sitemap.xml` when you make big changes. The Staff page is thin until you add staff, so consider removing it from the sitemap until then.

## Admissions page and document uploads
Parents apply on the **Admissions** page: child's details, parent's details, notes, and up to 5 documents (birth certificate, passport photo, last school report, health card, other).
- Accepted files: JPG, PNG, WebP or PDF, up to 4 MB each (large phone photos are shrunk automatically in the browser). The file type is checked from the file's contents, not its name, so renamed or disguised files are refused.
- The application is saved first and the parent gets a reference number (like `DEIS-AB3K9X`). Files are then uploaded one by one; if one fails, the application is still saved and the parent can retry that file.
- Admin > **Applications**: every online application with the parent's phone (Call and WhatsApp buttons), email, notes and documents. **View** opens a document, **Download** saves it, **Delete** removes it. Change the status (New, Contacted, Visited, Offered, Enrolled, Declined), delete an application (its files are deleted too) or download all applications as CSV. You can also add an applicant by hand.
- Privacy: documents are never shown on the website. They are stored privately in Netlify Blobs and can only be opened by someone signed in as admin. Connections are limited to 8 applications and 40 uploads per hour to stop spam.
- The JSON backup contains each application's details and the list of documents, but not the document files themselves. Download important documents from the Applications tab.
- These are children's personal documents: tell parents how long you keep them, delete them when no longer needed, and check Ghana's Data Protection Act.

## Searching for students
- **Admin:** the **Overview** tab has a "Find a student" box that jumps to the results. **Parents & students** has a live search box (student name, class, parent name or phone number; several words narrow it down, for example "kofi year 4"; phone numbers match with or without spaces). Matching students are opened automatically. **Attendance** has a search box too, to find one learner quickly in a long register.
- **Teachers:** the Teacher portal has a "Search student" box that filters the attendance list and the grades list for the teacher's own classes. Marks already made for students hidden by the search are kept and saved with the register.
- Searching happens in the browser on data already loaded, so it is instant and nothing extra is sent to the server.

## Teacher accounts
- Admin > **Teachers**: add a teacher, list the classes they teach (for example "Year 4, Year 5") and get their access code (shown once; "Reset code" makes a new one).
- Teachers open **Teacher login** (footer, or `#/teacher`) and enter the code. They can take attendance (only for their classes and only the last 14 days) and record grades and notes. They never see fees, parent phone numbers or other classes.
- Class names must match the class typed on each student (for example "Year 4"). Capital letters and extra spaces do not matter.
- Teacher sessions end after 8 hours, when the tab is closed, or after 15 minutes of inactivity.

## Import, export and backup (Admin > Data & backup)
- **Import from Excel:** columns in this order: Student name, Class, Parent name, Parent phone, Fees total. Paste the rows, or save the sheet as CSV and choose the file. Students with the same parent phone are grouped under one parent, existing students are not duplicated, and a list of new parent access codes is offered as a CSV download (shown once).
- **Export:** download all students with fees and attendance as a CSV that opens in Excel.
- **Backup:** download a full backup (JSON) of everything. Make one every week and keep it safe; it contains private data.
- **Restore:** upload a backup file and type RESTORE to confirm. This replaces everything. The previous data is first copied to an internal "pre-restore" snapshot in Netlify Blobs in case of mistakes (it is not shown in the dashboard).

## "Ask AI" assistant
A floating **Ask AI** button appears on every page when the assistant is switched on. It answers visitors' questions about admissions, programs, clubs and events, using the school facts, the information you write in Admin > Settings, and your latest events and announcements. It does not see student or parent records.

Turn it on:
1. Create an account at console.anthropic.com, add a small amount of credit, and set a monthly spending limit.
2. Create an API key (Settings > API keys) and copy it. It starts with `sk-ant-`.
3. In Netlify > Project configuration > Environment variables, add `ANTHROPIC_API_KEY` with the key as the value (tick "Contains secret values", same value for all contexts).
4. Redeploy. Open Admin > Settings: the AI assistant panel should show **ON**.
5. Write fees, hours, admission requirements and rules in the "Extra information" box and click Save settings.

Safeguards built in: each visitor connection is limited to 20 questions per 10 minutes, questions and answers are short, and the key never reaches the browser. Cost depends on how many people use it; check Anthropic's pricing page and watch your usage. If the default model name is rejected, set `ANTHROPIC_MODEL` to a model listed in your Anthropic console.

## Campus videos (Campus Life page)
The Campus Life page has a video gallery of up to 20 videos.
- It ships with 6 of the school's videos, chosen and compressed to fit Netlify drag-and-drop (every file under 10 MB, about 27 MB in total; five are 1280 pixels wide and the longest is 960 pixels wide) in `public/assets/videos/video-01.mp4` to `video-06.mp4`, with preview pictures. Admin > Videos > "Load the 6 school videos to edit" lets you rename, remove or add to them. Once you save your own list, it replaces the built-in one.
- Admin > **Videos**: enter a title and a link, then **Add video**. Links can be YouTube, Facebook (public videos), Vimeo, or a direct `.mp4` / `.webm` link.
- Videos load only when tapped, so the page stays fast. YouTube links use the privacy-friendly player.
- To use your own file, place it in `public/assets/videos/` (see the README.txt there), redeploy, then add it with the link `assets/videos/yourfile.mp4`.
- Only `https://` links or `assets/videos/...` files are accepted.

## Attendance and notifications
1. Admin > **Attendance**: pick a date and class, mark each learner Present / Absent / Late, then **Save attendance**.
2. Saving updates each child's attendance totals automatically and creates a notification for the parent (absent and late by default; turn on "Also notify parents when their child is marked present" under Settings).
3. Parents see "Attendance today", the last 10 days and a Notifications list on the Parents page. The **Parents** menu item shows a count of new notices. The page checks for updates every minute, and parents can turn on browser alerts on their device (these work only while the site is open in a tab).
4. After saving, the admin gets a **WhatsApp** button for each parent to notify. It opens WhatsApp with the message typed; staff tap Send. Add each parent's phone number under Parents & students. Numbers starting with 0 are converted using country code 233 (change `CC` at the top of `public/js/main.js` if needed).
5. Fixing a mistake (for example Absent changed to Present) sends the parent a correction notice and corrects the totals. Saving the same marks twice does not send duplicates.

Automatic SMS or WhatsApp Business sending is not included. It needs a paid provider account; the place to add it is the `attendance-save` route in `netlify/functions/api.mjs` (the `notify` list it builds holds each parent's phone and message details).

## How parents get access
1. Admin > Parents & students > **Add a student**, choose "+ New parent", enter the parent's and the student's details. (Or use "Add a parent" lower down.) The access code appears once.
2. Give the parent the code (shown once). "Reset code" makes a new one.
3. Add students with **Add a student** at the top of Parents & students (choose an existing parent or create a new one), then record attendance, fees and grades. The parent signs in on the Parents page.

## Customise
- Text and contacts: `public/index.html`
- Staff, news and events: add them in the admin dashboard (Staff, Announcements, Events tabs). The site ships with none, and shows "coming soon" messages until you add some
- AI assistant knowledge: Admin > Settings > "Extra information the assistant should know" (no redeploy needed). Base facts are in `SCHOOL_FACTS` in `netlify/functions/api.mjs`
- Colors: CSS variables at the top of `public/css/style.css`
- Photos: replace the files in `public/assets/` (keep the names)

## Admin sign-in security
- **Lockout:** 5 wrong attempts from one connection locks admin sign-in for 15 minutes (parents: 10 attempts).
- **Short sessions:** admin sessions last 4 hours at most, end when the tab is closed, and end after 15 minutes of inactivity.
- **2-step sign-in (recommended):** run `npm run totp` once. It prints a key. Add it to Google Authenticator, Authy or Microsoft Authenticator ("Enter a setup key", time based), then add `ADMIN_TOTP_SECRET=<the key>` in Netlify environment variables and redeploy. Sign-in then needs your password and the 6-digit code.
- **Sign everyone out:** change `SESSION_SECRET` (this also cancels all parent access codes).
- Choose an `ADMIN_PASSWORD` of 12+ characters. Do not reuse it elsewhere.
- Security headers (no framing, no content sniffing) are set in `netlify.toml`.

## Security notes
- Admin login is a single shared password (plus the optional 2-step code). For several staff with their own logins, add a proper auth provider.
- Parent access codes are stored hashed; a lost code must be reset by an admin.
- Lockout is per connection address; a determined attacker using many addresses is only slowed, which is why 2-step sign-in is recommended.
- The AI endpoint is public and uses your API key. Set a spending limit on your Anthropic account.
- Student data is personal data. Check your local data-protection rules (for Ghana, the Data Protection Act, 2012) before storing real records.

## School details used on the site
Taken from the school's public Google listing and YouTube channel: location (Mamponteng, Kwabre East District, Kumasi), phone +233 24 255 4403, the map pin and the GES + Cambridge curricula. The default WhatsApp number is that same phone; change it in Admin > Settings if the school uses a different WhatsApp number. Email address, opening hours, fees, staff names, learner numbers and results were not found, so anything about those on the site is still sample text.
