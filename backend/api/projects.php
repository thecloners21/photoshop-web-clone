<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';

$action = $_GET['action'] ?? '';
$input = pswc_input();
$db = pswc_db();

// In single-user/offline use the user is optional; null user_id means "guest"
pswc_session_start();
$userId = $_SESSION['user_id'] ?? null;

switch ($action) {
    case 'list':
        $st = $db->prepare(
            $userId
            ? 'SELECT id, name, width, height, resolution, color_mode, created_at, updated_at, preview_path FROM projects WHERE user_id = ? ORDER BY updated_at DESC'
            : 'SELECT id, name, width, height, resolution, color_mode, created_at, updated_at, preview_path FROM projects WHERE user_id IS NULL ORDER BY updated_at DESC'
        );
        $st->execute($userId ? [$userId] : []);
        pswc_json(['ok' => true, 'projects' => $st->fetchAll()]);
        break;

    case 'save':
        $name = trim($input['name'] ?? 'Senza titolo');
        $w = (int)($input['width'] ?? 0);
        $h = (int)($input['height'] ?? 0);
        $dpi = (int)($input['resolution'] ?? 72);
        $mode = (string)($input['colorMode'] ?? 'RGB/8');
        $layers = $input['layers'] ?? [];
        $preview = $input['preview'] ?? null;
        if ($w <= 0 || $h <= 0 || !is_array($layers)) {
            pswc_json(['ok' => false, 'error' => 'invalid'], 400);
        }
        $payload = [
            'name' => $name, 'width' => $w, 'height' => $h,
            'resolution' => $dpi, 'colorMode' => $mode,
            'layers' => $layers, 'version' => PSWC_VERSION,
            'saved_at' => date('c'),
        ];
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE);
        $hash = substr(sha1($json . microtime(true)), 0, 12);
        $file = PSWC_PROJECTS_DIR . '/proj_' . $hash . '.pswc.json';
        file_put_contents($file, $json);

        $previewPath = null;
        if ($preview && preg_match('/^data:image\/(png|jpeg|webp);base64,(.+)$/', $preview, $m)) {
            $bin = base64_decode($m[2]);
            $previewPath = PSWC_PROJECTS_DIR . '/proj_' . $hash . '.preview.' . ($m[1] === 'jpeg' ? 'jpg' : $m[1]);
            file_put_contents($previewPath, $bin);
        }
        $st = $db->prepare(
            'INSERT INTO projects (user_id, name, width, height, resolution, color_mode, data_path, preview_path, size_bytes, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))'
        );
        $st->execute([
            $userId, $name, $w, $h, $dpi, $mode,
            $file, $previewPath, strlen($json)
        ]);
        pswc_json(['ok' => true, 'id' => (int)$db->lastInsertId()]);
        break;

    case 'get':
        $id = (int)($_GET['id'] ?? 0);
        $st = $db->prepare('SELECT * FROM projects WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row) pswc_json(['ok' => false, 'error' => 'not_found'], 404);
        $data = json_decode(file_get_contents($row['data_path']), true);
        pswc_json(['ok' => true, 'project' => $data, 'meta' => $row]);
        break;

    case 'delete':
        $id = (int)($input['id'] ?? 0);
        $st = $db->prepare('SELECT * FROM projects WHERE id = ?');
        $st->execute([$id]);
        $row = $st->fetch();
        if (!$row) pswc_json(['ok' => false, 'error' => 'not_found'], 404);
        @unlink($row['data_path']);
        if ($row['preview_path']) @unlink($row['preview_path']);
        $db->prepare('DELETE FROM projects WHERE id = ?')->execute([$id]);
        pswc_json(['ok' => true]);
        break;

    case 'rename':
        $id = (int)($input['id'] ?? 0);
        $name = trim($input['name'] ?? '');
        if (!$id || !$name) pswc_json(['ok' => false, 'error' => 'invalid'], 400);
        $db->prepare('UPDATE projects SET name = ?, updated_at = datetime("now") WHERE id = ?')
           ->execute([$name, $id]);
        pswc_json(['ok' => true]);
        break;

    default:
        pswc_json(['ok' => false, 'error' => 'unknown_action'], 400);
}
