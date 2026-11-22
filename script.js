// Отримуємо основні елементи DOM зі сторінки index.html
const addForm = document.getElementById('addForm');
const nameInput = document.getElementById('name');
const groupInput = document.getElementById('group_name');
const gradeInput = document.getElementById('average_grade');
const formMessage = document.getElementById('formMessage');

const searchInput = document.getElementById('search');
const resultsBody = document.getElementById('resultsBody');
const resultsMessage = document.getElementById('resultsMessage');
const totalCount = document.getElementById('totalCount');

// Допоміжна функція показу повідомлення (успіх або помилка)
function showAlert(box, text, type) {
    box.className = 'alert ' + (type === 'error' ? 'alert-error' : 'alert-success');
    box.textContent = text;
    box.hidden = false;
}

// Допоміжна функція приховування повідомлення
function hideAlert(box) {
    box.hidden = true;
    box.textContent = '';
}

// Безпечне зчитування тексту помилки з відповіді сервера
async function getErrorMessage(response) {
    try {
        const data = await response.json();
        if (data && data.error) {
            return data.error;
        }
    } catch (e) {
        // Якщо відповідь сервера не є JSON (наприклад, 404/500 HTML)
    }
    return 'Сервер повернув помилку (код ' + response.status + ').';
}

// Виведення службового повідомлення або помилки прямо всередині таблиці #results
function renderTableMessage(text, isError) {
    resultsBody.textContent = '';

    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.className = isError ? 'status-cell status-cell-error' : 'status-cell';
    cell.textContent = text;

    row.appendChild(cell);
    resultsBody.appendChild(row);
    totalCount.textContent = '0';
}

// Створення кнопки «Редагувати бал» для рядка таблиці
function createEditButton(student, tdGrade, tdActions) {
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-edit';
    editBtn.textContent = 'Редагувати бал';

    editBtn.addEventListener('click', function () {
        startGradeEdit(student, tdGrade, tdActions);
    });

    return editBtn;
}

// Варіант 11: увімкнення редагування середнього балу безпосередньо в клітинці рядка
function startGradeEdit(student, tdGrade, tdActions) {
    hideAlert(resultsMessage);

    const currentGrade = Number(student.average_grade).toFixed(2);

    // Замінюємо текст балу на числове поле введення
    tdGrade.textContent = '';
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'grade-input';
    input.min = '0';
    input.max = '100';
    input.step = '0.01';
    input.value = currentGrade;
    tdGrade.appendChild(input);

    // Створюємо кнопки «Зберегти» та «Скасувати»
    tdActions.textContent = '';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn btn-save';
    saveBtn.textContent = 'Зберегти';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-cancel';
    cancelBtn.textContent = 'Скасувати';

    // Повернення клітинки у звичайний режим без змін
    function restoreCell() {
        tdGrade.textContent = Number(student.average_grade).toFixed(2);
        tdActions.textContent = '';
        tdActions.appendChild(createEditButton(student, tdGrade, tdActions));
    }

    // Збереження нового балу через AJAX (POST api_update.php)
    async function saveGrade() {
        hideAlert(resultsMessage);

        const rawValue = input.value.trim().replace(',', '.');
        const numericValue = Number(rawValue);

        if (rawValue === '' || Number.isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
            showAlert(resultsMessage, 'Середній бал має бути числом від 0 до 100.', 'error');
            input.focus();
            return;
        }

        saveBtn.disabled = true;

        try {
            const response = await fetch('api_update.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: student.id,
                    average_grade: numericValue,
                }),
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            const updatedStudent = await response.json();

            // Оновлюємо значення балу прямо в клітинці рядка без перезавантаження
            student.average_grade = updatedStudent.average_grade;
            restoreCell();

            // Коротке візуальне підсвічування оновленої клітинки
            tdGrade.classList.add('grade-updated');
            setTimeout(function () {
                tdGrade.classList.remove('grade-updated');
            }, 1200);

            showAlert(
                resultsMessage,
                'Середній бал для «' + student.name + '» оновлено до ' + Number(student.average_grade).toFixed(2) + '.',
                'success'
            );
        } catch (error) {
            showAlert(resultsMessage, 'Помилка оновлення балу: ' + error.message, 'error');
            saveBtn.disabled = false;
        }
    }

    saveBtn.addEventListener('click', saveGrade);
    cancelBtn.addEventListener('click', function () {
        hideAlert(resultsMessage);
        restoreCell();
    });

    // Збереження по Enter та скасування по Escape
    input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            saveGrade();
        } else if (event.key === 'Escape') {
            hideAlert(resultsMessage);
            restoreCell();
        }
    });

    tdActions.appendChild(saveBtn);
    tdActions.appendChild(cancelBtn);
    input.focus();
    input.select();
}

// Безпечна побудова одного рядка <tr> через createElement і textContent (захист від XSS)
function createStudentRow(student) {
    const tr = document.createElement('tr');
    tr.dataset.id = student.id;

    const tdId = document.createElement('td');
    tdId.textContent = student.id;

    const tdName = document.createElement('td');
    tdName.textContent = student.name;

    const tdGroup = document.createElement('td');
    tdGroup.textContent = student.group_name;

    const tdGrade = document.createElement('td');
    tdGrade.className = 'grade-cell';
    tdGrade.textContent = Number(student.average_grade).toFixed(2);

    const tdActions = document.createElement('td');
    tdActions.className = 'actions-cell';
    tdActions.appendChild(createEditButton(student, tdGrade, tdActions));

    tr.appendChild(tdId);
    tr.appendChild(tdName);
    tr.appendChild(tdGroup);
    tr.appendChild(tdGrade);
    tr.appendChild(tdActions);

    return tr;
}

// Виведення масиву студентів у контейнер таблиці #results
function renderStudents(students) {
    if (!Array.isArray(students) || students.length === 0) {
        renderTableMessage('Студентів за вашим запитом не знайдено.', false);
        return;
    }

    resultsBody.textContent = '';

    students.forEach(function (student) {
        resultsBody.appendChild(createStudentRow(student));
    });

    totalCount.textContent = String(students.length);
}

// Крок 3 і Крок 4 методички: завантаження списку та живий пошук через fetch()
async function loadStudents(searchTerm = '') {
    hideAlert(resultsMessage);

    const url = searchTerm !== ''
        ? 'api_list.php?q=' + encodeURIComponent(searchTerm)
        : 'api_list.php';

    try {
        const response = await fetch(url);

        // Крок 7 методички: перевірка HTTP-статусу відповіді
        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        const students = await response.json();
        renderStudents(students);
    } catch (error) {
        // Повідомлення про помилку виводиться в самому контейнері результатів
        renderTableMessage('Не вдалося завантажити список студентів: ' + error.message, true);
    }
}

// Крок 4 методички: живий пошук за group_name на подію input без перезавантаження
searchInput.addEventListener('input', function () {
    loadStudents(searchInput.value.trim());
});

// Крок 6 методички: додавання нового студента через AJAX (POST api_add.php)
addForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    hideAlert(formMessage);

    const payload = {
        name: nameInput.value.trim(),
        group_name: groupInput.value.trim(),
        average_grade: gradeInput.value.trim().replace(',', '.'),
    };

    try {
        const response = await fetch('api_add.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        const createdStudent = await response.json();

        // Повторно завантажуємо список із урахуванням поточного пошуку
        await loadStudents(searchInput.value.trim());

        showAlert(
            formMessage,
            'Студента «' + createdStudent.name + '» успішно додано (ID: ' + createdStudent.id + ').',
            'success'
        );

        addForm.reset();
    } catch (error) {
        showAlert(formMessage, 'Помилка додавання запису: ' + error.message, 'error');
    }
});

// Крок 3 методички: перше завантаження таблиці одразу після відкриття сторінки
loadStudents();




