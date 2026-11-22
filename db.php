<?php

// Параметри підключення до MySQL (конфігураційний блок)
$dbHost = '127.0.0.1';
$dbPort = '3306';
$dbName = 'practicum5';
$dbUser = 'root';
$dbPass = '';
$dbCharset = 'utf8mb4';

// Формування рядка підключення (DSN)
$dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset={$dbCharset}";

// Опції PDO: винятки при помилках і повернення асоціативних масивів
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

// Створення з'єднання з поверненням JSON-відповіді у разі збою
try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(
        ['error' => 'Помилка підключення до бази даних.'],
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

return $pdo;
