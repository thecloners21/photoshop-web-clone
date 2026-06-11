<?php
declare(strict_types=1);
require_once __DIR__ . '/../config.php';

pswc_json([
    'ok' => true,
    'name' => 'Photoshop Web Clone',
    'version' => PSWC_VERSION,
    'php' => PHP_VERSION,
    'time' => date('c'),
    'features' => [
        'sqlite' => extension_loaded('pdo_sqlite'),
        'gd' => extension_loaded('gd'),
        'mbstring' => extension_loaded('mbstring'),
    ],
]);
