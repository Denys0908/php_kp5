<?php

// Відповідь повертається у форматі JSON (UTF-8)
header('Content-Type: application/json; charset=utf-8');

// Дозволяємо лише POST-запити
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(
        ['error' => 'Метод не підтримується. Використовуйте POST.'],
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

// Підключаємо з'єднання PDO з базою даних
$pdo = require_once __DIR__ . '/db.php';

// Зчитуємо дані з JSON-тіла (php://input) або зі звичайного $_POST
$rawBody = file_get_contents('php://input');
$jsonData = json_decode($rawBody, true);
$input = is_array($jsonData) ? $jsonData : $_POST;

$name = trim((string) ($input['name'] ?? ''));
$groupName = trim((string) ($input['group_name'] ?? ''));
$gradeRaw = trim((string) ($input['average_grade'] ?? ''));
$normalizedGrade = str_replace(',', '.', $gradeRaw);

// Серверна валідація вхідних даних
$errors = [];

if ($name === '') {
    $errors[] = 'Введіть ПІБ студента.';
} elseif (mb_strlen($name, 'UTF-8') > 150) {
    $errors[] = 'ПІБ студента не може перевищувати 150 символів.';
}

if ($groupName === '') {
    $errors[] = 'Введіть назву групи.';
} elseif (mb_strlen($groupName, 'UTF-8') > 30) {
    $errors[] = 'Назва групи не може перевищувати 30 символів.';
}

if ($normalizedGrade === '' || !is_numeric($normalizedGrade)) {
    $errors[] = 'Середній бал має бути числом (від 0 до 100).';
} else {
    $gradeValue = (float) $normalizedGrade;
    if ($gradeValue < 0 || $gradeValue > 100) {
        $errors[] = 'Середній бал має бути в межах від 0 до 100.';
    }
}

// Якщо є помилки валідації — повертаємо HTTP-код 400
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(
        ['error' => implode(' ', $errors), 'errors' => $errors],
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

try {
    // Додавання запису через підготовлений запит PDO
    $stmt = $pdo->prepare(
        'INSERT INTO students (name, group_name, average_grade)
         VALUES (:name, :group_name, :average_grade)'
    );
    $stmt->execute([
        ':name' => $name,
        ':group_name' => $groupName,
        ':average_grade' => (float) $normalizedGrade,
    ]);

    $newId = (int) $pdo->lastInsertId();

    // Зчитуємо створений запис із БД для точного формату полів
    $selectStmt = $pdo->prepare(
        'SELECT id, name, group_name, average_grade FROM students WHERE id = :id'
    );
    $selectStmt->execute([':id' => $newId]);
    $createdStudent = $selectStmt->fetch();

    // Повертаємо доданий запис у JSON із кодом 201 Created
    http_response_code(201);
    echo json_encode($createdStudent, JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(
        ['error' => 'Помилка збереження студента в базі даних.'],
        JSON_UNESCAPED_UNICODE
    );
}
