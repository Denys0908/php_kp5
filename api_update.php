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

$id = (int) ($input['id'] ?? 0);
$gradeRaw = trim((string) ($input['average_grade'] ?? ''));
$normalizedGrade = str_replace(',', '.', $gradeRaw);

// Серверна валідація id та нового середнього балу
$errors = [];

if ($id <= 0) {
    $errors[] = 'Некоректний ID студента.';
}

if ($normalizedGrade === '' || !is_numeric($normalizedGrade)) {
    $errors[] = 'Середній бал має бути числом (від 0 до 100).';
} else {
    $gradeValue = (float) $normalizedGrade;
    if ($gradeValue < 0 || $gradeValue > 100) {
        $errors[] = 'Середній бал має бути в межах від 0 до 100.';
    }
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(
        ['error' => implode(' ', $errors), 'errors' => $errors],
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

try {
    // Перевіряємо, чи існує студент із переданим id
    $checkStmt = $pdo->prepare('SELECT id FROM students WHERE id = :id');
    $checkStmt->execute([':id' => $id]);

    if ($checkStmt->fetch() === false) {
        http_response_code(404);
        echo json_encode(
            ['error' => 'Студента з таким ID не знайдено.'],
            JSON_UNESCAPED_UNICODE
        );
        exit;
    }

    // Оновлюємо середній бал через підготовлений запит PDO (Варіант 11)
    $stmt = $pdo->prepare(
        'UPDATE students SET average_grade = :average_grade WHERE id = :id'
    );
    $stmt->execute([
        ':average_grade' => (float) $normalizedGrade,
        ':id' => $id,
    ]);

    // Повертаємо оновлений запис у форматі JSON
    $selectStmt = $pdo->prepare(
        'SELECT id, name, group_name, average_grade FROM students WHERE id = :id'
    );
    $selectStmt->execute([':id' => $id]);
    $updatedStudent = $selectStmt->fetch();

    http_response_code(200);
    echo json_encode($updatedStudent, JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(
        ['error' => 'Помилка оновлення середнього балу в базі даних.'],
        JSON_UNESCAPED_UNICODE
    );
}
