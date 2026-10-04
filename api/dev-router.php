<?php
declare(strict_types=1);

$path = parse_url((string)($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';
if (preg_match('~(?:^|/)api(?:/.*)?$~', $path)) {
    $position = strpos($path, '/api');
    $_SERVER['PATH_INFO'] = $position === false ? '/' : substr($path, $position + 4);
    require __DIR__ . '/index.php';
    return true;
}
return false;
