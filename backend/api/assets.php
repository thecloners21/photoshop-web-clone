<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';

$action = $_GET['action'] ?? '';
$db = pswc_db();
pswc_session_start();
$userId = $_SESSION['user_id'] ?? null;

switch ($action) {
    case 'list':
        $st = $db->prepare(
            $userId
            ? 'SELECT id, filename, mime, size_bytes, created_at FROM assets WHERE user_id = ? ORDER BY created_at DESC'
            : 'SELECT id, filename, mime, size_bytes, created_at FROM assets WHERE user_id IS NULL ORDER BY created_at DESC'
        );
        $st->execute($userId ? [$userId] : []);
        pswc_json(['ok' => true, 'assets' => $st->fetchAll()]);
        break;

    case 'upload':
        if (empty($_FILES['file'])) pswc_json(['ok' => false, 'error' => 'no_file'], 400);
        $f = $_FILES['file'];
        if ($f['error'] !== UPLOAD_ERR_OK) pswc_json(['ok' => false, 'error' => 'upload_failed'], 400);
        $mime = mime_content_type($f['tmp_name']);
        if (!preg_match('#^image/(png|jpeg|webp|gif|svg\+xml)$#', $mime)) {
            pswc_json(['ok' => false, 'error' => 'unsupported_type'], 400);
        }
        $ext = explode('/', $mime)[1];
        if ($ext === 'svg+xml') $ext = 'svg';
        if ($ext === 'jpeg') $ext = 'jpg';
        $name = preg_replace('/[^a-zA-Z0-9._-]/', '_', $f['name']);
        $stored = PSWC_ASSETS_DIR . '/' . uniqid('a_', true) . '.' . $ext;
        move_uploaded_file($f['tmp_name'], $stored);
        $st = $db->prepare('INSERT INTO assets (user_id, filename, mime, size_bytes, path) VALUES (?, ?, ?, ?, ?)');
        $st->execute([$userId, $name, $mime, filesize($stored), $stored]);
        pswc_json(['ok' => true, 'id' => (int)$db->lastInsertId(), 'mime' => $mime]);
        break;

    case 'get':
        $id = (int)($_GET['id'] ?? 0);
        $st = $db->prepare('SELECT * FROM assets WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row) pswc_json(['ok' => false, 'error' => 'not_found'], 404);
        header('Content-Type: ' . $row['mime']);
        header('Cache-Control: max-age=3600');
        readfile($row['path']);
        break;

    case 'delete':
        $input = pswc_input();
        $id = (int)($input['id'] ?? 0);
        $st = $db->prepare('SELECT * FROM assets WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row) pswc_json(['ok' => false, 'error' => 'not_found'], 404);
        @unlink($row['path']);
        $db->prepare('DELETE FROM assets WHERE id = ?')->execute([$id]);
        pswc_json(['ok' => true]);
        break;

    default:
        pswc_json(['ok' => false, 'error' => 'unknown_action'], 400);
}
