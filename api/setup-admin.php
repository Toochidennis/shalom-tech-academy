<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$username = $argv[1] ?? 'admin';
if (!preg_match('/^[A-Za-z0-9._-]{3,40}$/', $username)) {
    fwrite(STDERR, "Username must be 3–40 letters, numbers, dots, underscores or hyphens.\n");
    exit(1);
}
if (is_file(store_path('admin'))) {
    fwrite(STDERR, "An admin account already exists. Use the admin password-change screen; do not rerun setup.\n");
    exit(1);
}

$temporaryPassword = rtrim(strtr(base64_encode(random_bytes(18)), '+/', '-_'), '=');
store_write('admin', [
    'username' => $username,
    'password_hash' => password_hash($temporaryPassword, PASSWORD_DEFAULT),
    'must_change_password' => true,
    'created_at' => gmdate('c'),
    'updated_at' => gmdate('c'),
]);

fwrite(STDOUT, "Admin account created. Sign in once, then choose a new password immediately.\n");
fwrite(STDOUT, "Username: {$username}\nTemporary password (shown once): {$temporaryPassword}\n");
