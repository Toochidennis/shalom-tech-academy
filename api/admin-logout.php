<?php
/**
 * Shalom Science & Technology Basic Academy — Admin logout endpoint
 *
 * POST /api/admin-logout.php
 */

require_once __DIR__ . '/helpers.php';

$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 86400,
        $params['path'], $params['domain'],
        $params['secure'], $params['httponly']
    );
}

session_destroy();

json_response(['success' => true]);
