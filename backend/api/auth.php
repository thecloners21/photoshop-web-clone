<?php
declare(strict_types=1);
require_once __DIR__ . '/../db.php';

$action = $_GET['action'] ?? '';
$input = pswc_input();
$db = pswc_db();

switch ($action) {
    case 'register':
        $u = trim($input['username'] ?? '');
        $e = trim($input['email'] ?? '');
        $p = (string)($input['password'] ?? '');
        if (strlen($u) < 3 || !filter_var($e, FILTER_VALIDATE_EMAIL) || strlen($p) < 6) {
            pswc_json(['ok' => false, 'error' => 'invalid_fields'], 400);
        }
        try {
            $st = $db->prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
            $st->execute([$u, $e, password_hash($p, PASSWORD_DEFAULT)]);
            $id = (int)$db->lastInsertId();
            pswc_session_start();
            $_SESSION['user_id'] = $id;
            pswc_json(['ok' => true, 'user' => ['id' => $id, 'username' => $u, 'email' => $e]]);
        } catch (PDOException $e) {
            pswc_json(['ok' => false, 'error' => 'duplicate'], 409);
        }
        break;

    case 'login':
        $iden = trim($input['username'] ?? $input['email'] ?? '');
        $p = (string)($input['password'] ?? '');
        $st = $db->prepare('SELECT * FROM users WHERE username = ? OR email = ?');
        $st->execute([$iden, $iden]);
        $user = $st->fetch();
        if (!$user || !password_verify($p, $user['password_hash'])) {
            pswc_json(['ok' => false, 'error' => 'invalid_credentials'], 401);
        }
        pswc_session_start();
        $_SESSION['user_id'] = (int)$user['id'];
        pswc_json(['ok' => true, 'user' => ['id' => $user['id'], 'username' => $user['username'], 'email' => $user['email']]]);
        break;

    case 'logout':
        pswc_session_start();
        $_SESSION = [];
        session_destroy();
        pswc_json(['ok' => true]);
        break;

    case 'me':
        $u = pswc_current_user();
        pswc_json(['ok' => true, 'user' => $u]);
        break;

    default:
        pswc_json(['ok' => false, 'error' => 'unknown_action'], 400);
}
