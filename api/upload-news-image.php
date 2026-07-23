<?php
/**
 * Shalom Science & Technology Basic Academy — Admin image upload endpoint
 *
 * POST /api/upload-news-image.php
 * Form field: image
 */

require_once __DIR__ . '/helpers.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

verify_csrf();

if (empty($_FILES['image']) || !is_uploaded_file($_FILES['image']['tmp_name'])) {
    json_response(['success' => false, 'message' => 'Choose an image to upload.'], 400);
}

$file = $_FILES['image'];
if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
    json_response(['success' => false, 'message' => 'Upload failed. Try again.'], 400);
}

if (($file['size'] ?? 0) > 3 * 1024 * 1024) {
    json_response(['success' => false, 'message' => 'Image must be 3 MB or smaller.'], 422);
}

$info = @getimagesize($file['tmp_name']);
if ($info === false) {
    json_response(['success' => false, 'message' => 'The uploaded file is not a valid image.'], 422);
}

$mimeMap = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
];

$mime = $info['mime'] ?? '';
if (!isset($mimeMap[$mime])) {
    json_response(['success' => false, 'message' => 'Use a JPG, PNG, WebP, or GIF image.'], 422);
}

if (!is_dir(UPLOAD_DIR)) {
    @mkdir(UPLOAD_DIR, 0755, true);
}

$name = bin2hex(random_bytes(12)) . '.' . $mimeMap[$mime];
$target = UPLOAD_DIR . '/' . $name;

if (!move_uploaded_file($file['tmp_name'], $target)) {
    json_response(['success' => false, 'message' => 'Could not save the uploaded image.'], 500);
}

json_response([
    'success' => true,
    'image' => UPLOAD_PUBLIC_PATH . '/' . $name,
]);
