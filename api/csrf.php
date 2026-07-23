<?php
/**
 * Shalom Science & Technology Basic Academy — CSRF token endpoint
 *
 * GET /api/csrf.php
 * Returns a CSRF token for the authenticated admin.
 */

require_once __DIR__ . '/helpers.php';

require_admin();

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

json_response([
    'success'   => true,
    'csrfToken' => $_SESSION['csrf_token'],
]);
