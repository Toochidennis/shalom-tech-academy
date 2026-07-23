<?php
/**
 * Shalom Science & Technology Basic Academy — API Configuration
 *
 * Change the admin credentials before production.
 */

// -------------------------------------------------------
// Admin account
// -------------------------------------------------------
// Set a real bcrypt hash before production:
// php -r "echo password_hash('your_password', PASSWORD_BCRYPT);"
define('ADMIN_USERNAME', 'admin');
define('ADMIN_PASSWORD_HASH', 'CHANGE_THIS_PASSWORD_HASH');

// -------------------------------------------------------
// Data file paths
// -------------------------------------------------------
define('DATA_DIR', __DIR__ . '/../data');
define('NEWS_FILE', DATA_DIR . '/news.json');
define('SESSION_DIR', DATA_DIR . '/sessions');
define('UPLOAD_DIR', __DIR__ . '/../uploads/news');
define('UPLOAD_PUBLIC_PATH', 'uploads/news');

// -------------------------------------------------------
// CORS / session
// -------------------------------------------------------
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.cookie_httponly', '1');
if (!is_dir(SESSION_DIR)) {
    @mkdir(SESSION_DIR, 0755, true);
}
ini_set('session.save_path', SESSION_DIR);
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
