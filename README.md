# Shalom Science & Technology Basic Academy site

React + Vite frontend with a plain PHP, JSON-backed news admin.

## Source facts used

- Flyer: `shalomprimaryflyer.jpeg`
- Live logo/background reference: `https://www.sstac.sch.ng/`
- School name from flyer: Shalom Science & Technology Basic Academy (SSTABAC)
- Admission: 2026/2027 into Nursery & Primary
- Address: Plot 208, Emene Industrial/Residential Layout, Enugu East LGA, Enugu State
- Phones: +234 (0)909 925 6745, 0703 042 6997
- Motto: The Rock that Never Fails

## Local frontend

```bash
npm install
npm run dev
```

The Vite dev server previews the React pages. PHP endpoints do not run inside Vite.

## Build

```bash
npm run build
```

The build outputs `dist/` and copies `api/`, `data/`, and `uploads/` into it.

## Admin password

Set `ADMIN_PASSWORD_HASH` in `api/config.php` before using the admin.

```bash
php -r "echo password_hash('your_password', PASSWORD_BCRYPT);"
```

Keep the username or change `ADMIN_USERNAME` in the same file.

The admin dashboard is intentionally not linked from the public site. Open it directly at `/admin_login`.

## Apache/PHP deploy

Copy the contents of `dist/` to the target web folder. Ensure PHP is enabled and make the JSON store writable:

```bash
chmod 775 data
chmod 664 data/news.json
chmod 775 uploads/news
```

If the host still cannot write news, use the permissions required by that host's web server user.
