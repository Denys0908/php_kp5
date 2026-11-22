<?php

// Вказуємо браузеру, що відповідь повертається у форматі JSON (UTF-8)
header('Content-Type: application/json; charset=utf-8');

// Підключаємо з'єднання PDO з базою даних practicum5
$pdo = require_once __DIR__ . '/db.php';

// Зчитуємо пошуковий запит із URL (?q=...)
$query = trim($_GET['q'] ?? '');

try {
    if ($query !== '') {
        // Фільтрація студентів за назвою групи через підготовлений запит (Варіант 11)
        $stmt = $pdo->prepare(
            'SELECT id, name, group_name, average_grade
             FROM students
             WHERE group_name LIKE :q
             ORDER BY id ASC'
        );
        $stmt->execute([':q' => '%' . $query . '%']);
    } else {
        // Вибірка всіх записів таблиці students
        $stmt = $pdo->query(
            'SELECT id, name, group_name, average_grade
             FROM students
             ORDER BY id ASC'
        );
    }

    $rows = $stmt->fetchAll();

    // Повертаємо JSON-масив зі збереженням кирилиці у читабельному вигляді
    echo json_encode($rows, JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(
        ['error' => 'Помилка отримання списку студентів.'],
        JSON_UNESCAPED_UNICODE
    );
}
