<?php
/**
 * Shalom Science & Technology Basic Academy — Public news endpoint
 *
 * GET /api/news.php              — all published news, newest first
 * GET /api/news.php?slug=<slug>  — single published post
 */

require_once __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$posts = read_news();

// Only published posts
$published = array_values(array_filter($posts, function ($post) {
    return ($post['status'] ?? '') === 'published';
}));

// Sort newest first by updatedAt
usort($published, function ($a, $b) {
    $ta = strtotime($a['updatedAt'] ?? $a['createdAt'] ?? '');
    $tb = strtotime($b['updatedAt'] ?? $b['createdAt'] ?? '');
    return $tb - $ta;
});

// Single post lookup
$slug = trim($_GET['slug'] ?? '');
if ($slug !== '') {
    foreach ($published as $post) {
        if (($post['slug'] ?? '') === $slug) {
            json_response(['success' => true, 'post' => $post]);
        }
    }
    json_response(['success' => false, 'message' => 'News post not found.'], 404);
}

json_response(['success' => true, 'news' => $published]);
