<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

try {
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: same-origin');
    $path = request_path();
    $method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));

    if (preg_match('~^/news/([a-f0-9]{24})$~', $path, $match) && $method === 'GET') {
        foreach (store_read('news', []) as $post) {
            if (is_array($post)
                && !empty($post['published'])
                && hash_equals((string)($post['id'] ?? ''), $match[1])
                && !news_has_sensitive_looking_text($post)) {
                json_response(['item' => public_news_article($post)]);
            }
        }
        fail('This news update could not be found.', 404);
    }
    if ($path === '/news' && $method === 'GET') {
        $posts = array_values(array_filter(store_read('news', []), static fn($post): bool =>
            is_array($post) && !empty($post['published']) && !news_has_sensitive_looking_text($post)
        ));
        usort($posts, static fn(array $a, array $b): int => strcmp((string)($b['published_at'] ?? ''), (string)($a['published_at'] ?? '')));
        json_response(['items' => array_map('public_news_card', $posts)]);
    }
    if ($path === '/admissions' && $method === 'GET') {
        json_response(store_read('admissions', default_admissions()));
    }
    if ($path === '/campus-life' && $method === 'GET') {
        $stories = array_values(array_filter(store_read('campus-life', default_campus_life()), static fn($story): bool => is_array($story) && !empty($story['published'])));
        usort($stories, static fn(array $a, array $b): int => ((int)($a['sort_order'] ?? 0)) <=> ((int)($b['sort_order'] ?? 0)));
        json_response(['items' => array_map('public_campus_story', $stories)]);
    }

    if ($path === '/admin/session' && $method === 'GET') {
        start_admin_session();
        $account = store_read('admin', null);
        $authenticated = is_array($account) && !empty($_SESSION['admin_user']) && hash_equals((string)($account['username'] ?? ''), (string)$_SESSION['admin_user']);
        json_response([
            'authenticated' => $authenticated,
            'username' => $authenticated ? $account['username'] : null,
            'must_change_password' => $authenticated && !empty($account['must_change_password']),
            'csrf' => csrf_token(),
            'initialized' => is_array($account),
        ]);
    }

    if ($path === '/admin/login' && $method === 'POST') {
        require_csrf();
        $input = json_input();
        $username = trim((string)($input['username'] ?? ''));
        $remote = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
        $key = hash('sha256', $remote);
        $now = time();
        $throttled = store_change('login-attempts', [], static function (array $attempts) use ($key, $now): array {
            $recent = array_values(array_filter($attempts[$key] ?? [], static fn($at): bool => is_int($at) && $at > $now - 900));
            if (count($recent) >= 5) {
                return [$attempts, true];
            }
            $recent[] = $now;
            $attempts[$key] = $recent;
            return [$attempts, false];
        });
        if ($throttled) {
            fail('Too many sign-in attempts. Please wait 15 minutes and try again.', 429);
        }
        $account = store_read('admin', null);
        $password = (string)($input['password'] ?? '');
        $valid = is_array($account) && hash_equals((string)($account['username'] ?? ''), $username) && password_verify($password, (string)($account['password_hash'] ?? ''));
        if (!$valid) {
            fail('The username or password is incorrect.', 401);
        }
        store_change('login-attempts', [], static function (array $attempts) use ($key): array {
            unset($attempts[$key]);
            return [$attempts, null];
        });
        start_admin_session();
        session_regenerate_id(true);
        $_SESSION['admin_user'] = $account['username'];
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        if (password_needs_rehash($account['password_hash'], PASSWORD_DEFAULT)) {
            $account['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
            store_write('admin', $account);
        }
        json_response(['authenticated' => true, 'username' => $account['username'], 'must_change_password' => !empty($account['must_change_password']), 'csrf' => $_SESSION['csrf']]);
    }

    if ($path === '/admin/logout' && $method === 'POST') {
        require_csrf();
        start_admin_session();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', ['expires' => time() - 42000, 'path' => $params['path'], 'secure' => $params['secure'], 'httponly' => true, 'samesite' => 'Strict']);
        }
        session_destroy();
        json_response(['ok' => true]);
    }

    if ($path === '/admin/password' && $method === 'POST') {
        require_csrf();
        $account = current_admin();
        $input = json_input();
        $current = (string)($input['current_password'] ?? '');
        $new = (string)($input['new_password'] ?? '');
        if (!password_verify($current, (string)$account['password_hash'])) {
            fail('The current password is not correct.', 422);
        }
        if (mb_strlen($new, 'UTF-8') < 12 || mb_strlen($new, 'UTF-8') > 200) {
            fail('Choose a password between 12 and 200 characters.');
        }
        if (password_verify($new, (string)$account['password_hash'])) {
            fail('Choose a password you have not used before.');
        }
        $account['password_hash'] = password_hash($new, PASSWORD_DEFAULT);
        $account['must_change_password'] = false;
        $account['updated_at'] = gmdate('c');
        store_write('admin', $account);
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        json_response(['ok' => true, 'csrf' => $_SESSION['csrf'], 'must_change_password' => false]);
    }

    if (str_starts_with($path, '/admin/')) {
        $account = current_admin();
        if ($path !== '/admin/password') {
            require_changed_password($account);
        }
        if ($path === '/admin/news' && $method === 'GET') {
            $posts = store_read('news', []);
            usort($posts, static fn(array $a, array $b): int => strcmp((string)($b['updated_at'] ?? ''), (string)($a['updated_at'] ?? '')));
            json_response(['items' => array_values($posts)]);
        }
        if ($path === '/admin/news' && $method === 'POST') {
            require_csrf();
            $record = normalize_news($_POST);
            $image = accept_news_image();
            if ($image !== null) {
                $record['image'] = $image;
            }
            $now = gmdate('c');
            $record['id'] = bin2hex(random_bytes(12));
            $record['created_at'] = $now;
            $record['updated_at'] = $now;
            $record['published_at'] = $record['published'] ? $now : null;
            try {
                store_change('news', [], static function (array $posts) use ($record): array {
                    $posts[] = $record;
                    return [$posts, null];
                });
            } catch (Throwable $error) {
                remove_news_image($image);
                throw $error;
            }
            json_response(['item' => $record], 201);
        }
        if (preg_match('~^/admin/news/([a-f0-9]{24})$~', $path, $match) && $method === 'POST') {
            require_csrf();
            $input = $_POST;
            $image = accept_news_image();
            $oldImage = null;
            try {
                $record = store_change('news', [], static function (array $posts) use ($match, $input, $image, &$oldImage): array {
                    $index = array_search($match[1], array_column($posts, 'id'), true);
                    if ($index === false) {
                        fail('This news item could not be found.', 404);
                    }
                    $old = $posts[$index];
                    $oldImage = $old['image'] ?? null;
                    $record = array_merge($old, normalize_news($input, $old));
                    if ($image !== null) {
                        $record['image'] = $image;
                    }
                    $record['updated_at'] = gmdate('c');
                    $record['published_at'] = $record['published'] ? (($old['published_at'] ?? null) ?: gmdate('c')) : null;
                    $posts[$index] = $record;
                    return [array_values($posts), $record];
                });
            } catch (Throwable $error) {
                remove_news_image($image);
                throw $error;
            }
            if ($image !== null && $oldImage !== $image) {
                remove_news_image($oldImage);
            }
            json_response(['item' => $record]);
        }
        if (preg_match('~^/admin/news/([a-f0-9]{24})$~', $path, $match) && $method === 'DELETE') {
            require_csrf();
            $removed = store_change('news', [], static function (array $posts) use ($match): array {
                $index = array_search($match[1], array_column($posts, 'id'), true);
                if ($index === false) {
                    fail('This news item could not be found.', 404);
                }
                $removed = $posts[$index];
                array_splice($posts, $index, 1);
                return [array_values($posts), $removed];
            });
            remove_news_image($removed['image'] ?? null);
            json_response(['ok' => true]);
        }
        if ($path === '/admin/admissions' && $method === 'GET') {
            json_response(store_read('admissions', default_admissions()));
        }
        if ($path === '/admin/admissions' && $method === 'PUT') {
            require_csrf();
            $settings = normalize_admissions(json_input());
            store_write('admissions', $settings);
            json_response($settings);
        }
        if ($path === '/admin/campus-life' && $method === 'GET') {
            $stories = store_read('campus-life', default_campus_life());
            usort($stories, static fn(array $a, array $b): int => ((int)($a['sort_order'] ?? 0)) <=> ((int)($b['sort_order'] ?? 0)));
            json_response(['items' => array_values($stories)]);
        }
        if ($path === '/admin/campus-life/reorder' && $method === 'POST') {
            require_csrf();
            $ids = json_input()['ids'] ?? null;
            if (!is_array($ids) || count(array_filter($ids, static fn($id): bool => is_string($id) && preg_match('/^[a-f0-9]{24}$/', $id) === 1)) !== count($ids) || count(array_unique($ids)) !== count($ids)) {
                fail('Send a valid order for the campus tiles.');
            }
            store_change('campus-life', default_campus_life(), static function (array $stories) use ($ids): array {
                $byId = [];
                foreach ($stories as $story) {
                    $byId[(string)($story['id'] ?? '')] = $story;
                }
                if (count($ids) !== count($byId) || array_diff($ids, array_keys($byId))) {
                    fail('The campus tiles changed. Refresh and try again.', 409);
                }
                $ordered = [];
                foreach (array_values($ids) as $index => $id) {
                    $story = $byId[(string)$id];
                    $story['sort_order'] = $index;
                    $story['updated_at'] = gmdate('c');
                    $ordered[] = $story;
                }
                return [$ordered, null];
            });
            json_response(['ok' => true]);
        }
        if ($path === '/admin/campus-life' && $method === 'POST') {
            require_csrf();
            $record = normalize_campus_story($_POST);
            $image = accept_campus_image();
            if ($image === null) {
                fail('Choose an image for this campus tile.');
            }
            $record['image'] = $image;
            $now = gmdate('c');
            $record['id'] = bin2hex(random_bytes(12));
            $record['created_at'] = $now;
            $record['updated_at'] = $now;
            try {
                store_change('campus-life', default_campus_life(), static function (array $stories) use (&$record): array {
                    $orders = array_map(static fn(array $story): int => (int)($story['sort_order'] ?? -1), $stories);
                    $record['sort_order'] = $orders ? max($orders) + 1 : 0;
                    $stories[] = $record;
                    return [$stories, null];
                });
            } catch (Throwable $error) {
                remove_campus_image($image);
                throw $error;
            }
            json_response(['item' => $record], 201);
        }
        if (preg_match('~^/admin/campus-life/([a-f0-9]{24})$~', $path, $match) && $method === 'POST') {
            require_csrf();
            $input = $_POST;
            $image = accept_campus_image();
            $oldImage = null;
            try {
                $record = store_change('campus-life', default_campus_life(), static function (array $stories) use ($match, $input, $image, &$oldImage): array {
                    $index = array_search($match[1], array_column($stories, 'id'), true);
                    if ($index === false) {
                        fail('This campus tile could not be found.', 404);
                    }
                    $old = $stories[$index];
                    $oldImage = $old['image'] ?? null;
                    $record = array_merge($old, normalize_campus_story($input, $old));
                    if ($image !== null) {
                        $record['image'] = $image;
                    } elseif (($input['remove_image'] ?? '') === 'true') {
                        $record['image'] = null;
                    }
                    if (empty($record['image'])) {
                        fail('Choose an image for this campus tile.');
                    }
                    $record['updated_at'] = gmdate('c');
                    $stories[$index] = $record;
                    return [array_values($stories), $record];
                });
            } catch (Throwable $error) {
                remove_campus_image($image);
                throw $error;
            }
            if (($image !== null || ($input['remove_image'] ?? '') === 'true') && $oldImage !== ($record['image'] ?? null)) {
                remove_campus_image($oldImage);
            }
            json_response(['item' => $record]);
        }
        if (preg_match('~^/admin/campus-life/([a-f0-9]{24})$~', $path, $match) && $method === 'DELETE') {
            require_csrf();
            $removed = store_change('campus-life', default_campus_life(), static function (array $stories) use ($match): array {
                $index = array_search($match[1], array_column($stories, 'id'), true);
                if ($index === false) {
                    fail('This campus tile could not be found.', 404);
                }
                $removed = $stories[$index];
                array_splice($stories, $index, 1);
                return [array_values($stories), $removed];
            });
            remove_campus_image($removed['image'] ?? null);
            json_response(['ok' => true]);
        }
    }

    fail('Not found.', 404);
} catch (Throwable $error) {
    error_log('SSTBAC API error: ' . $error->getMessage());
    fail('The request could not be completed. Please try again.', 500);
}
