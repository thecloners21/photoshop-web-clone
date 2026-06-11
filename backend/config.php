<?php
// Photoshop Web Clone — backend config
declare(strict_types=1);

define('PSWC_VERSION', '1.0.0');
define('PSWC_DATA_DIR', __DIR__ . '/data');
define('PSWC_DB_PATH', PSWC_DATA_DIR . '/pswc.sqlite');
define('PSWC_PROJECTS_DIR', PSWC_DATA_DIR . '/projects');
define('PSWC_ASSETS_DIR', PSWC_DATA_DIR . '/assets');
define('PSWC_SESSION_NAME', 'pswc_session');

if (!is_dir(PSWC_DATA_DIR)) @mkdir(PSWC_DATA_DIR, 0775, true);
if (!is_dir(PSWC_PROJECTS_DIR)) @mkdir(PSWC_PROJECTS_DIR, 0775, true);
if (!is_dir(PSWC_ASSETS_DIR)) @mkdir(PSWC_ASSETS_DIR, 0775, true);

function pswc_json(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function pswc_input(): array {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $raw = file_get_contents('php://input');
        if ($raw) {
            $j = json_decode($raw, true);
            if (is_array($j)) return $j;
        }
        return $_POST;
    }
    return $_GET;
}

function pswc_session_start(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_name(PSWC_SESSION_NAME);
        session_start();
    }
}

function pswc_current_user(): ?array {
    pswc_session_start();
    if (empty($_SESSION['user_id'])) return null;
    $db = pswc_db();
    $st = $db->prepare('SELECT id, username, email, created_at FROM users WHERE id = ?');
    $st->execute([$_SESSION['user_id']]);
    $u = $st->fetch(PDO::FETCH_ASSOC);
    return $u ?: null;
}

function pswc_require_user(): array {
    $u = pswc_current_user();
    if (!$u) pswc_json(['ok' => false, 'error' => 'auth_required'], 401);
    return $u;
}
