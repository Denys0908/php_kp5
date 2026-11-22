-- Встановлюємо кодування клієнта для коректного збереження кирилиці
SET NAMES utf8mb4;

-- Створюємо окрему базу даних для КП-5 із підтримкою повного UTF-8
CREATE DATABASE IF NOT EXISTS practicum5
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE practicum5;

-- Перестворюємо таблицю при повторному запуску скрипта, щоб уникнути дублікатів
DROP TABLE IF EXISTS students;

-- Таблиця students за варіантом №11 (id, name, group_name, average_grade)
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    group_name VARCHAR(30) NOT NULL,
    average_grade DECIMAL(5, 2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Початкові тестові записи (у шифрах груп використано кириличну літеру "І")
INSERT INTO students (name, group_name, average_grade) VALUES
    ('Петренко Петро', 'ІК-44', 94.50),
    ('Мельник Анна', 'ІК-44', 86.00),
    ('Ткаченко Софія', 'ІК-44', 74.75),
    ('Коваленко Олена', 'ІК-42', 97.00),
    ('Бондаренко Максим', 'ІК-42', 90.00),
    ('Шевчук Дмитро', 'ІК-41', 61.25);



