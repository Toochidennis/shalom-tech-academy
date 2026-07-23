<?php
/**
 * Shalom Science & Technology Basic Academy — Admin news CRUD endpoint
 *
 * GET    /api/admin-news.php                        — all news (draft + published)
 * GET    /api/admin-news.php?id=<id>                — single post
 * POST   /api/admin-news.php                        — create
 * PUT    /api/admin-news.php?id=<id>                — update
 * DELETE /api/admin-news.php?id=<id>                — delete
 * POST   /api/admin-news.php?action=publish&id=<id> — publish
 * POST   /api/admin-news.php?action=unpublish&id=<id> — unpublish
 */

require_once __DIR__ . '/helpers.php';

require_admin();

$method = $_SERVER['REQUEST_METHOD'];
$action = trim($_GET['action'] ?? '');
$id     = trim($_GET['id'] ?? '');
$slug   = trim($_GET['slug'] ?? '');

// -------------------------------------------------------
// GET — list all or single
// -------------------------------------------------------
if ($method === 'GET') {
    if ($slug !== '') {
        $posts = read_news();
        foreach ($posts as $post) {
            if (($post['slug'] ?? '') === $slug) {
                json_response(['success' => true, 'post' => $post]);
            }
        }
        json_response(['success' => false, 'message' => 'News post not found.'], 404);
    }

    if ($id !== '') {
        $posts = read_news();
        foreach ($posts as $post) {
            if (($post['id'] ?? '') === $id) {
                json_response(['success' => true, 'post' => $post]);
            }
        }
        json_response(['success' => false, 'message' => 'News post not found.'], 404);
    }

    $posts = read_news();
    usort($posts, function ($a, $b) {
        $ta = strtotime($a['updatedAt'] ?? $a['createdAt'] ?? '');
        $tb = strtotime($b['updatedAt'] ?? $b['createdAt'] ?? '');
        return $tb - $ta;
    });
    json_response(['success' => true, 'news' => $posts]);
}

// -------------------------------------------------------
// POST — create
// -------------------------------------------------------
if ($method === 'POST' && $action === '') {
    verify_csrf();

    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        json_response(['success' => false, 'message' => 'Invalid JSON body.'], 400);
    }

    $clean = sanitize_post($body);
    $errors = validate_post($clean);
    if (!empty($errors)) {
        json_response(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors], 422);
    }

    $posts = read_news();

    $clean['slug'] = unique_slug($clean['slug'] ?: slugify($clean['title']), $posts);

    $now = date('c');
    $post = [
        'id'        => new_news_id(),
        'title'     => $clean['title'],
        'slug'      => $clean['slug'],
        'category'  => $clean['category'],
        'summary'   => $clean['summary'],
        'content'   => $clean['content'],
        'image'     => $clean['image'],
        'status'    => $clean['status'],
        'createdAt' => $now,
        'updatedAt' => $now,
    ];

    $posts[] = $post;
    write_news($posts);

    json_response(['success' => true, 'post' => $post], 201);
}

// -------------------------------------------------------
// PUT — update
// -------------------------------------------------------
if ($method === 'PUT' && $action === '') {
    verify_csrf();

    if ($id === '') {
        json_response(['success' => false, 'message' => 'Missing post id.'], 400);
    }

    $posts = read_news();
    $index = null;
    foreach ($posts as $i => $post) {
        if (($post['id'] ?? '') === $id) {
            $index = $i;
            break;
        }
    }
    if ($index === null) {
        json_response(['success' => false, 'message' => 'News post not found.'], 404);
    }

    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        json_response(['success' => false, 'message' => 'Invalid JSON body.'], 400);
    }

    $clean = sanitize_post($body);
    $errors = validate_post($clean);
    if (!empty($errors)) {
        json_response(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors], 422);
    }

    $existing = $posts[$index];
    $clean['slug'] = unique_slug($clean['slug'] ?: slugify($clean['title']), $posts, $id);

    $posts[$index] = [
        'id'        => $existing['id'],
        'title'     => $clean['title'],
        'slug'      => $clean['slug'],
        'category'  => $clean['category'],
        'summary'   => $clean['summary'],
        'content'   => $clean['content'],
        'image'     => $clean['image'],
        'status'    => $clean['status'],
        'createdAt' => $existing['createdAt'] ?? date('c'),
        'updatedAt' => date('c'),
    ];

    write_news($posts);

    json_response(['success' => true, 'post' => $posts[$index]]);
}

// -------------------------------------------------------
// DELETE
// -------------------------------------------------------
if ($method === 'DELETE') {
    verify_csrf();

    if ($id === '') {
        json_response(['success' => false, 'message' => 'Missing post id.'], 400);
    }

    $posts = read_news();
    $filtered = array_values(array_filter($posts, function ($post) use ($id) {
        return ($post['id'] ?? '') !== $id;
    }));

    if (count($filtered) === count($posts)) {
        json_response(['success' => false, 'message' => 'News post not found.'], 404);
    }

    write_news($filtered);
    json_response(['success' => true]);
}

// -------------------------------------------------------
// POST actions — publish / unpublish
// -------------------------------------------------------
if ($method === 'POST' && in_array($action, ['publish', 'unpublish'], true)) {
    verify_csrf();

    if ($id === '') {
        json_response(['success' => false, 'message' => 'Missing post id.'], 400);
    }

    $posts = read_news();
    $index = null;
    foreach ($posts as $i => $post) {
        if (($post['id'] ?? '') === $id) {
            $index = $i;
            break;
        }
    }
    if ($index === null) {
        json_response(['success' => false, 'message' => 'News post not found.'], 404);
    }

    $newStatus = $action === 'publish' ? 'published' : 'draft';
    $posts[$index]['status'] = $newStatus;
    $posts[$index]['updatedAt'] = date('c');

    write_news($posts);

    json_response(['success' => true, 'post' => $posts[$index]]);
}

json_response(['success' => false, 'message' => 'Unknown action.'], 400);
