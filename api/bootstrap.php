<?php
declare(strict_types=1);

const SSTBAC_ROOT = __DIR__ . '/..';
define('SSTBAC_STORAGE', getenv('SSTBAC_STORAGE_PATH') ?: SSTBAC_ROOT . '/storage');

function news_upload_dir(): string
{
    return SSTBAC_ROOT . (is_dir(SSTBAC_ROOT . '/public') ? '/public' : '') . '/uploads/news';
}

function campus_upload_dir(): string
{
    return SSTBAC_ROOT . (is_dir(SSTBAC_ROOT . '/public') ? '/public' : '') . '/uploads/campus';
}

function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $message, int $status = 400): never
{
    json_response(['error' => $message], $status);
}

function ensure_storage(): void
{
    if (!is_dir(SSTBAC_STORAGE) && !mkdir(SSTBAC_STORAGE, 0750, true) && !is_dir(SSTBAC_STORAGE)) {
        throw new RuntimeException('Cannot create private storage directory.');
    }
    if (!is_writable(SSTBAC_STORAGE)) {
        throw new RuntimeException('Private storage directory is not writable.');
    }
}

function store_path(string $name): string
{
    if (!preg_match('/^[a-z-]+$/', $name)) {
        throw new InvalidArgumentException('Invalid store name.');
    }
    ensure_storage();
    return SSTBAC_STORAGE . '/' . $name . '.json';
}

function decode_store(string $path, mixed $default): mixed
{
    if (!is_file($path)) {
        return $default;
    }
    $contents = file_get_contents($path);
    if ($contents === false) {
        throw new RuntimeException('Cannot read data store.');
    }
    return json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
}

function with_store_lock(string $name, int $lockType, callable $callback): mixed
{
    $path = store_path($name);
    $lock = fopen($path . '.lock', 'c');
    if ($lock === false) {
        throw new RuntimeException('Cannot open data store lock.');
    }
    try {
        if (!flock($lock, $lockType)) {
            throw new RuntimeException('Cannot lock data store.');
        }
        return $callback($path);
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

function store_read(string $name, mixed $default = []): mixed
{
    return with_store_lock($name, LOCK_SH, static fn(string $path): mixed => decode_store($path, $default));
}

function write_store_file(string $path, mixed $value): void
{
    $encoded = json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $temporary = tempnam(SSTBAC_STORAGE, '.sstbac-');
    if ($temporary === false) {
        throw new RuntimeException('Cannot create temporary data file.');
    }
    try {
        if (file_put_contents($temporary, $encoded, LOCK_EX) !== strlen($encoded)) {
            throw new RuntimeException('Could not write the complete data file.');
        }
        @chmod($temporary, 0640);
        if (!@rename($temporary, $path)) {
            // Windows does not consistently replace an existing file via rename.
            if (is_file($path) && !unlink($path)) {
                throw new RuntimeException('Cannot replace data file.');
            }
            if (!rename($temporary, $path)) {
                throw new RuntimeException('Cannot install data file.');
            }
        }
    } finally {
        if (is_file($temporary)) {
            @unlink($temporary);
        }
    }
}

function store_write(string $name, mixed $value): void
{
    with_store_lock($name, LOCK_EX, static fn(string $path) => write_store_file($path, $value));
}

function store_change(string $name, mixed $default, callable $change): mixed
{
    return with_store_lock($name, LOCK_EX, static function (string $path) use ($default, $change): mixed {
        $current = decode_store($path, $default);
        [$next, $result] = $change($current);
        write_store_file($path, $next);
        return $result;
    });
}

function json_input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $value = json_decode($raw, true);
    if (!is_array($value)) {
        fail('Send a valid JSON object.');
    }
    return $value;
}

function start_admin_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    ensure_storage();
    $configuredSessionPath = getenv('SSTBAC_SESSION_PATH');
    $sessionDirectory = is_string($configuredSessionPath) && trim($configuredSessionPath) !== ''
        ? trim($configuredSessionPath)
        : SSTBAC_STORAGE . '/sessions';
    if (!is_dir($sessionDirectory) && !@mkdir($sessionDirectory, 0700, true) && !is_dir($sessionDirectory)) {
        throw new RuntimeException('Cannot create the private admin session directory.');
    }
    if (!is_writable($sessionDirectory)) {
        throw new RuntimeException('The private admin session directory is not writable.');
    }
    if (session_save_path($sessionDirectory) === false) {
        throw new RuntimeException('Cannot configure the private admin session directory.');
    }
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    $https = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== '' && strtolower((string)$_SERVER['HTTPS']) !== 'off';
    session_name('sstbac_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $https,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    set_error_handler(static function (int $severity, string $message, string $file, int $line): never {
        throw new ErrorException($message, 0, $severity, $file, $line);
    });
    try {
        if (!session_start()) {
            throw new RuntimeException('Cannot start the admin session.');
        }
    } finally {
        restore_error_handler();
    }
}

function csrf_token(): string
{
    start_admin_session();
    if (!isset($_SESSION['csrf']) || !is_string($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function require_csrf(): void
{
    $expected = csrf_token();
    $received = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($received) || $received === '' || !hash_equals($expected, $received)) {
        fail('Your session has expired. Refresh and try again.', 403);
    }
}

function current_admin(): array
{
    start_admin_session();
    $account = store_read('admin', null);
    if (!is_array($account) || empty($_SESSION['admin_user']) || !hash_equals((string)($account['username'] ?? ''), (string)$_SESSION['admin_user'])) {
        fail('Please sign in to continue.', 401);
    }
    return $account;
}

function require_changed_password(array $account): void
{
    if (!empty($account['must_change_password'])) {
        fail('Change the temporary password before using the admin area.', 403);
    }
}

function request_path(): string
{
    $uriPath = parse_url((string)($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';
    $position = strpos($uriPath, '/api');
    if ($position !== false) {
        $path = substr($uriPath, $position + 4);
        if ($path === '' || $path === '/index.php') {
            return '/';
        }
        if (str_starts_with($path, '/index.php/')) {
            return substr($path, strlen('/index.php'));
        }
        return $path;
    }
    return '/';
}

function validate_text(mixed $value, string $label, int $max, bool $required = true): string
{
    if (!is_string($value)) {
        $value = '';
    }
    $value = trim($value);
    if ($required && $value === '') {
        fail($label . ' is required.');
    }
    if (mb_strlen($value, 'UTF-8') > $max) {
        fail($label . ' must be ' . $max . ' characters or fewer.');
    }
    return $value;
}

function normalize_news(array $input, ?array $existing = null): array
{
    $title = validate_text($input['title'] ?? '', 'Title', 140);
    $category = validate_text($input['category'] ?? '', 'Category', 50);
    $summary = validate_text($input['summary'] ?? '', 'Summary', 280);
    $body = validate_text($input['body'] ?? '', 'Article text', 12000, false);
    $publishedValue = $input['published'] ?? 'false';
    $published = $publishedValue === true || $publishedValue === 1 || $publishedValue === '1' || $publishedValue === 'true';
    if ($published && news_has_sensitive_looking_text([
        'title' => $title,
        'category' => $category,
        'summary' => $summary,
        'body' => $body,
    ])) {
        fail('This update contains a long unbroken value or credential-like text. Remove it before publishing.');
    }
    return [
        'title' => $title,
        'category' => $category,
        'summary' => $summary,
        'body' => $body,
        'published' => $published,
        'image' => $existing['image'] ?? null,
    ];
}

function news_has_sensitive_looking_text(array $post): bool
{
    $text = implode("\n", array_map(
        static fn(string $field): string => is_string($post[$field] ?? null) ? $post[$field] : '',
        ['title', 'category', 'summary', 'body'],
    ));

    return preg_match('/(?<![\pL\pN])[A-Za-z0-9_-]{40,}(?![\pL\pN])/u', $text) === 1
        || preg_match('/\b(?:password|passcode|secret|api[_ -]?key|access[_ -]?token)\s*[:=]\s*\S+/iu', $text) === 1;
}

function public_news_card(array $post): array
{
    return [
        'id' => (string)($post['id'] ?? ''),
        'title' => (string)($post['title'] ?? ''),
        'category' => (string)($post['category'] ?? ''),
        'summary' => (string)($post['summary'] ?? ''),
        'image' => $post['image'] ?? null,
        'published_at' => $post['published_at'] ?? null,
    ];
}

function public_news_article(array $post): array
{
    return public_news_card($post) + ['body' => (string)($post['body'] ?? '')];
}

function accept_news_image(): ?string
{
    if (!isset($_FILES['image']) || !is_array($_FILES['image']) || ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    $file = $_FILES['image'];
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK || !is_uploaded_file((string)($file['tmp_name'] ?? ''))) {
        fail('The image could not be uploaded. Please choose it again.');
    }
    if ((int)($file['size'] ?? 0) < 1 || (int)$file['size'] > 5 * 1024 * 1024) {
        fail('Images must be 5 MB or smaller.');
    }
    $temporary = (string)$file['tmp_name'];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($temporary);
    $types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $dimensions = @getimagesize($temporary);
    if (!isset($types[$mime]) || $dimensions === false || $dimensions[0] < 1 || $dimensions[1] < 1 || $dimensions[0] > 6000 || $dimensions[1] > 6000) {
        fail('Use a valid JPEG, PNG or WebP image no larger than 6000 × 6000 pixels.');
    }
    $uploadDirectory = news_upload_dir();
    if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0750, true) && !is_dir($uploadDirectory)) {
        throw new RuntimeException('Cannot create image upload directory.');
    }
    $filename = bin2hex(random_bytes(16)) . '.' . $types[$mime];
    if (!move_uploaded_file($temporary, $uploadDirectory . '/' . $filename)) {
        throw new RuntimeException('Cannot save uploaded image.');
    }
    return 'uploads/news/' . $filename;
}

function remove_news_image(mixed $image): void
{
    if (is_string($image) && preg_match('~^uploads/news/[a-f0-9]{32}\.(?:jpg|png|webp)$~', $image)) {
        $file = news_upload_dir() . '/' . basename($image);
        if (is_file($file)) {
            @unlink($file);
        }
    }
}

function normalize_campus_story(array $input, ?array $existing = null): array
{
    $publishedValue = $input['published'] ?? ($existing['published'] ?? false);
    $published = $publishedValue === true || $publishedValue === 1 || $publishedValue === '1' || $publishedValue === 'true';
    $size = (string)($input['size'] ?? ($existing['size'] ?? 'standard'));
    if (!in_array($size, ['standard', 'tall', 'wide', 'feature'], true)) {
        fail('Choose a valid campus tile layout.');
    }
    return [
        'eyebrow' => validate_text($input['eyebrow'] ?? ($existing['eyebrow'] ?? 'Campus life'), 'Caption label', 40),
        'title' => validate_text($input['title'] ?? '', 'Caption heading', 110),
        'description' => validate_text($input['description'] ?? '', 'Caption description', 500),
        'alt_text' => validate_text($input['alt_text'] ?? '', 'Image description', 250),
        'size' => $size,
        'published' => $published,
        'sort_order' => max(0, (int)($input['sort_order'] ?? ($existing['sort_order'] ?? 0))),
        'image' => $existing['image'] ?? null,
    ];
}

function accept_campus_image(): ?string
{
    if (!isset($_FILES['image']) || !is_array($_FILES['image']) || ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    $file = $_FILES['image'];
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK || !is_uploaded_file((string)($file['tmp_name'] ?? ''))) {
        fail('The image could not be uploaded. Please choose it again.');
    }
    if ((int)($file['size'] ?? 0) < 1 || (int)$file['size'] > 5 * 1024 * 1024) {
        fail('Images must be 5 MB or smaller.');
    }
    $temporary = (string)$file['tmp_name'];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($temporary);
    $types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $dimensions = @getimagesize($temporary);
    if (!isset($types[$mime]) || $dimensions === false || $dimensions[0] < 1 || $dimensions[1] < 1 || $dimensions[0] > 6000 || $dimensions[1] > 6000) {
        fail('Use a valid JPEG, PNG or WebP image no larger than 6000 × 6000 pixels.');
    }
    $uploadDirectory = campus_upload_dir();
    if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0750, true) && !is_dir($uploadDirectory)) {
        throw new RuntimeException('Cannot create image upload directory.');
    }
    $filename = bin2hex(random_bytes(16)) . '.' . $types[$mime];
    if (!move_uploaded_file($temporary, $uploadDirectory . '/' . $filename)) {
        throw new RuntimeException('Cannot save uploaded image.');
    }
    return 'uploads/campus/' . $filename;
}

function remove_campus_image(mixed $image): void
{
    if (is_string($image) && preg_match('~^uploads/campus/[a-f0-9]{32}\.(?:jpg|png|webp)$~', $image)) {
        $file = campus_upload_dir() . '/' . basename($image);
        if (is_file($file)) {
            @unlink($file);
        }
    }
}

function public_campus_story(array $story): array
{
    return [
        'id' => (string)($story['id'] ?? ''),
        'eyebrow' => (string)($story['eyebrow'] ?? 'Campus life'),
        'title' => (string)($story['title'] ?? ''),
        'description' => (string)($story['description'] ?? ''),
        'alt_text' => (string)($story['alt_text'] ?? ''),
        'image' => $story['image'] ?? null,
        'size' => (string)($story['size'] ?? 'standard'),
        'sort_order' => (int)($story['sort_order'] ?? 0),
    ];
}

function default_campus_life(): array
{
    $seed = decode_store(__DIR__ . '/campus-life.seed.json', []);
    return is_array($seed) ? $seed : [];
}

function default_admissions(): array
{
    return [
        'session' => '2026/2027',
        'open' => true,
        'programmes' => 'Nursery & Primary',
        'banner_message' => 'Admissions are open. Speak with our school office to get started.',
    ];
}

function normalize_admissions(array $input): array
{
    $openValue = $input['open'] ?? null;
    if (!is_bool($openValue)) {
        fail('Choose whether admissions are open or closed.');
    }
    return [
        'session' => validate_text($input['session'] ?? '', 'Session', 20),
        'open' => $openValue,
        'programmes' => validate_text($input['programmes'] ?? '', 'Programmes', 100),
        'banner_message' => validate_text($input['banner_message'] ?? '', 'Banner message', 180),
    ];
}
