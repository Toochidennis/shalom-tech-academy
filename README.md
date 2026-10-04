# SSTBAC website

A new React/Vite website with a small PHP API and one-administrator publishing area for Shalom Science & Technology Basic Academy.

## First release

- Public school pages with real campus photographs
- Admin sign-in, one-time generated setup password, and mandatory password change
- News and notice drafts, publishing, editing, deletion, and JPEG/PNG/WebP featured-image uploads
- Editable admissions session, open/closed status, programmes, and public announcement
- Published news and admissions status served from the PHP API
- Private JSON files for application data; no database or CSV dependency

Long-form school copy and contact information remain in src/data/siteContent.js for this release.

## Local development

Install dependencies, create a writable temporary directory, and start the PHP API in one terminal:

~~~powershell
npm.cmd install
New-Item -ItemType Directory -Force .dev-php-tmp | Out-Null
php -d session.save_path=.dev-php-tmp -d upload_tmp_dir=.dev-php-tmp -S 127.0.0.1:8000 api/dev-router.php
~~~

Start Vite in another terminal:

~~~powershell
npm.cmd run dev
~~~

The Vite development server proxies /api to PHP. Local uploaded images are served from public/uploads/news.

## Create the first admin account

Run this once from the project root:

~~~powershell
php api/setup-admin.php admin
~~~

The command prints a random, one-time temporary password. Save it securely, sign in at /admin, and replace it immediately. The setup command refuses to overwrite an existing account. Do not put the temporary password in source control, chat, or deployment logs.

## Production build and hosting

~~~powershell
npm.cmd run build
~~~

Deploy dist/ to a host that runs PHP 8.2+ and can execute PHP files. This is not a static-only deployment: Vite copies api/ and the storage access rules into dist/. Apache needs mod_rewrite and the included .htaccess files. PHP needs fileinfo, mbstring, sessions, and a writable application-data directory. Set PHP upload limits (upload_max_filesize and post_max_size) to at least 6 MB to allow the validated 5 MB image limit.

The default build targets the domain root. For a site hosted below a path such as https://example.com/school/, set VITE_BASE_PATH=/school/ before building; the admin and API links also account for that deployment prefix.

The default dist/storage location is denied over HTTP by .htaccess. The build copies only the storage access rule, never local runtime data. For Nginx or another server that does not honor .htaccess, set SSTBAC_STORAGE_PATH to a writable directory outside the document root, ensure PHP's session.save_path and upload_tmp_dir are writable, and add server rules that route /api/* to api/index.php and deny direct access to api/ support scripts. Keep uploaded images public under uploads/news/; executable script extensions are denied by the included Apache rule. Back up the private JSON files and uploaded images together.

For local production-like checks, run PHP with dist as the document root after building. Configure the host's document root to dist/, not the repository root.

## Data and API

Runtime files are created on first use in storage/ (admin.json, news.json, admissions.json, and lock files). They are intentionally not committed. News content is plain text rendered through React's normal escaping; HTML is not accepted. Public endpoints are GET /api/news and GET /api/admissions. Admin endpoints are under /api/admin/ and require a session; state-changing requests also require the session CSRF token.

For production, initialize the admin once from the deployed app directory (for example, run php api/setup-admin.php admin with the deployed API files and the same SSTBAC_STORAGE_PATH configuration as the web server). The command prints a random one-time password; change it immediately at /admin.

Before public launch, configure HTTPS, confirm storage is outside the webroot if the server is not Apache, restrict server filesystem permissions, and take a restorable backup.
