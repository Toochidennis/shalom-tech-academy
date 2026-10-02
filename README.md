# SSTBAC website

A brand-new frontend for Shalom Science & Technology Basic Academy (SSTBAC), built with React and Vite.

## What is included

- A responsive, admissions-first school website
- Pages for the school, learning, campus life, admissions, news, and contact
- Real SSTBAC campus, mural, and learning-space photographs supplied for the project
- Static front-end content designed so a future CMS or API can replace the news data without changing the page structure

## Run locally

~~~bash
npm install
npm run dev
~~~

## Production build

~~~bash
npm run build
~~~

Deploy the generated dist folder to any static host. For Apache deployments, the included .htaccess provides SPA route fallback.

## Content source

School contact information and admissions facts are maintained in src/data/siteContent.js. Replace the placeholder news items in src/App.jsx with a CMS/API feed when backend publishing is introduced.
