<?php
/**
 * Shalom Science & Technology Basic Academy — Admin me endpoint
 *
 * GET /api/admin-me.php
 * Returns the currently logged-in admin, or 401.
 */

require_once __DIR__ . '/helpers.php';

if (empty($_SESSION['admin_logged_in'])) {
    json_response(['success' => false, 'message' => 'Not authenticated.'], 401);
}

json_response([
    'success' => true,
    'admin'   => [
        'username' => $_SESSION['admin_username'] ?? 'admin',
    ],
]);
