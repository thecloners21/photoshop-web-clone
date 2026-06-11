<?php
// Router file for `php -S localhost:8000 backend/router.php`
// (Optional — the simple `php -S localhost:8000` already serves index.html
// and PHP files correctly because the doc root is the project root.)

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$file = __DIR__ . '/..' . $uri;

if ($uri !== '/' && file_exists($file) && !is_dir($file)) {
    return false; // let PHP server handle static files
}
if ($uri === '/' || $uri === '/index.html') {
    require __DIR__ . '/../index.html';
    return true;
}
http_response_code(404);
echo 'Not found';
