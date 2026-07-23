<?php
/**
 * Shalom Science & Technology Basic Academy — Admin login endpoint
 *
 * POST /api/admin-login.php
 * Body: { "username": "...", "password": "..." }
 */

require_once __DIR__ . '/helpers.php';

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$body = json_decode(file_get_contents('php://input'), true);
$username = trim($body['username'] ?? '');
$password = $body['password'] ?? '';

if (empty($username) || empty($password)) {
    json_response(['success' => false, 'message' => 'Username and password are required.'], 400);
}

// Verify credentials
if (ADMIN_PASSWORD_HASH === 'CHANGE_THIS_PASSWORD_HASH' || $username !== ADMIN_USERNAME || !password_verify($password, ADMIN_PASSWORD_HASH)) {
    json_response(['success' => false, 'message' => 'Invalid admin credentials.'], 401);
}

// Regenerate session on login
session_regenerate_id(true);
$_SESSION['admin_logged_in'] = true;
$_SESSION['admin_username']  = $username;
$_SESSION['csrf_token']      = bin2hex(random_bytes(32));

json_response([
    'success' => true,
    'admin'   => [
        'username' => $username,
    ],
]);
