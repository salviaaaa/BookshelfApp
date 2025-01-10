const books = [];
const RENDER_EVENT = 'render-book';
const SAVED_EVENT = 'saved-book';
const STORAGE_KEY = 'BOOKSHELF_APPS';

let bookToDelete = null;
let bookToEdit = null;
let deleteModal = null;
let editModal = null;
let successToast = null;

document.addEventListener('DOMContentLoaded', function () {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize toast
    successToast = new bootstrap.Toast(document.getElementById('successToast'));

    const submitForm = document.getElementById('inputBook');
    submitForm.addEventListener('submit', function (event) {
        event.preventDefault();
        addBook();
        // Close modal after adding book
        const modal = bootstrap.Modal.getInstance(document.getElementById('addBookModal'));
        modal.hide();
    });

    // Add search functionality
    document.getElementById('searchReading').addEventListener('input', function(e) {
        searchBooks(e.target.value, false);
    });

    document.getElementById('searchCompleted').addEventListener('input', function(e) {
        searchBooks(e.target.value, true);
    });

    if (isStorageExist()) {
        loadDataFromStorage();
    }

    // Initialize Bootstrap modals
    deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    editModal = new bootstrap.Modal(document.getElementById('editBookModal'));

    // Setup delete confirmation
    document.getElementById('confirmDelete').addEventListener('click', function() {
        if (bookToDelete) {
            removeBook(bookToDelete);
            bookToDelete = null;
            deleteModal.hide();
        }
    });

    // Setup edit form
    document.getElementById('editBookForm').addEventListener('submit', function(event) {
        event.preventDefault();
        if (bookToEdit) {
            updateBook(bookToEdit);
            bookToEdit = null;
            editModal.hide();
        }
    });

    // Handle cancel buttons
    document.querySelectorAll('[data-bs-dismiss="modal"]').forEach(button => {
        button.addEventListener('click', function() {
            showNotification('Operation cancelled', 'warning');
        });
    });
});

function addBook() {
    const bookTitle = document.getElementById('inputBookTitle').value;
    const bookAuthor = document.getElementById('inputBookAuthor').value;
    const bookYear = parseInt(document.getElementById('inputBookYear').value);
    const isComplete = document.getElementById('inputBookIsComplete').checked;

    const generatedID = generateId();
    const bookObject = generateBookObject(generatedID, bookTitle, bookAuthor, bookYear, isComplete);
    books.push(bookObject);

    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
    
    // Reset form
    document.getElementById('inputBook').reset();
    resetGenreCheckboxes();
    if (isComplete) {
        showNotification('Book added to Completed List!', 'success');
    } else {
        showNotification('Book added to Reading List!', 'info');
    }
}

function generateId() {
    return +new Date();
}

function generateBookObject(id, title, author, year, isComplete) {
    const selectedGenres = [];
    document.querySelectorAll('input[name="genre"]:checked').forEach(checkbox => {
        selectedGenres.push(checkbox.value);
    });
    const genre = selectedGenres.join(', ');
    return {
        id,
        title,
        author,
        year,
        genre,
        isComplete
    }
}

document.addEventListener(RENDER_EVENT, function () {
    const incompleteBookshelfList = document.getElementById('incompleteBookshelfList');
    const completeBookshelfList = document.getElementById('completeBookshelfList');

    // clearing list
    incompleteBookshelfList.innerHTML = '';
    completeBookshelfList.innerHTML = '';

    for (const bookItem of books) {
        const bookElement = makeBookElement(bookItem);
        if (!bookItem.isComplete)
            incompleteBookshelfList.append(bookElement);
        else
            completeBookshelfList.append(bookElement);
    }
});

function makeBookElement(bookObject) {
    const {id, title, author, year, genre, isComplete} = bookObject;

    const bookItem = document.createElement('div');
    bookItem.classList.add('book-item');
    
    const bookIcon = document.createElement('img');
    bookIcon.classList.add('book-icon');
    bookIcon.src = isComplete ? 'assets/img/completed.png' : 'assets/img/reading.png';
    bookIcon.alt = isComplete ? 'Completed' : 'Reading';

    const bookDetails = document.createElement('div');
    bookDetails.classList.add('book-details');
    
    const bookTitle = document.createElement('h3');
    bookTitle.innerText = title;
    
    const bookAuthor = document.createElement('p');
    bookAuthor.innerText = `Author: ${author}`;
    
    const bookYear = document.createElement('p');
    bookYear.innerText = `Published Book: ${year}`;
    
    const bookGenre = document.createElement('p');
    bookGenre.innerText = `Genre: ${genre}`;

    bookDetails.append(bookTitle, bookAuthor, bookYear, bookGenre);
    
    const actionButtons = document.createElement('div');
    actionButtons.classList.add('action-buttons');

    if (isComplete) {
        const undoButton = document.createElement('button');
        undoButton.classList.add('btn', 'btn-warning', 'btn-sm');
        undoButton.innerHTML = '<i class="bi bi-arrow-counterclockwise"></i> Not Finished';
        
        undoButton.addEventListener('click', function() {
            undoBookFromCompleted(id);
        });
        
        actionButtons.append(undoButton);
    } else {
        const checkButton = document.createElement('button');
        checkButton.classList.add('btn', 'btn-success', 'btn-sm');
        checkButton.innerHTML = '<i class="bi bi-check-lg"></i> Finished';
        
        checkButton.addEventListener('click', function() {
            addBookToCompleted(id);
        });
        
        actionButtons.append(checkButton);
    }

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('btn', 'btn-danger', 'btn-sm');
    deleteButton.innerHTML = '<i class="bi bi-trash"></i> Delete';

    deleteButton.addEventListener('click', function() {
        bookToDelete = id;
        deleteModal.show();
    });

    const editButton = document.createElement('button');
    editButton.classList.add('btn', 'btn-info', 'btn-sm');
    editButton.innerHTML = '<i class="bi bi-pencil"></i> Edit';
    editButton.addEventListener('click', function() {
        openEditModal(id);
    });

    actionButtons.append(editButton);
    actionButtons.append(deleteButton);
    
    bookItem.append(bookIcon, bookDetails, actionButtons);
    return bookItem;
}

function addBookToCompleted(bookId) {
    const bookTarget = findBook(bookId);
    if (bookTarget == null) return;

    bookTarget.isComplete = true;
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
    showNotification('Book marked as finished reading!', 'success');
}

function undoBookFromCompleted(bookId) {
    const bookTarget = findBook(bookId);
    if (bookTarget == null) return;

    bookTarget.isComplete = false;
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
    showNotification('Book moved back to reading list!', 'info');
}

function removeBook(bookId) {
    const bookTarget = findBookIndex(bookId);
    if (bookTarget === -1) return;

    books.splice(bookTarget, 1);
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
    showNotification('Book has been deleted!', 'danger');
}

function findBook(bookId) {
    for (const bookItem of books) {
        if (bookItem.id === bookId) {
            return bookItem;
        }
    }
    return null;
}

function findBookIndex(bookId) {
    for (const index in books) {
        if (books[index].id === bookId) {
            return index;
        }
    }
    return -1;
}

function saveData() {
    if (isStorageExist()) {
        const parsed = JSON.stringify(books);
        localStorage.setItem(STORAGE_KEY, parsed);
        document.dispatchEvent(new Event(SAVED_EVENT));
    }
}

function isStorageExist() {
    if (typeof (Storage) === undefined) {
        alert('Your browser does not support local storage');
        return false;
    }
    return true;
}

function loadDataFromStorage() {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    let data = JSON.parse(serializedData);

    if (data !== null) {
        for (const book of data) {
            books.push(book);
        }
    }

    document.dispatchEvent(new Event(RENDER_EVENT));
}

function searchBooks(query, isComplete) {
    const filteredBooks = books.filter(book => {
        const matchesQuery = book.title.toLowerCase().includes(query.toLowerCase()) ||
                            book.author.toLowerCase().includes(query.toLowerCase());
        return matchesQuery && book.isComplete === isComplete;
    });

    const targetList = isComplete ? 'completeBookshelfList' : 'incompleteBookshelfList';
    const bookshelfList = document.getElementById(targetList);
    bookshelfList.innerHTML = '';

    for (const book of filteredBooks) {
        const bookElement = makeBookElement(book);
        bookshelfList.append(bookElement);
    }
}

function updateBook(bookId) {
    const bookTarget = findBook(bookId);
    if (bookTarget == null) return;

    bookTarget.title = document.getElementById('editBookTitle').value;
    bookTarget.author = document.getElementById('editBookAuthor').value;
    bookTarget.year = parseInt(document.getElementById('editBookYear').value);
    bookTarget.isComplete = document.getElementById('editBookIsComplete').checked;

    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
    showNotification('Book details have been updated!', 'success');
}

function openEditModal(bookId) {
    const book = findBook(bookId);
    if (book == null) return;

    bookToEdit = bookId;
    document.getElementById('editBookId').value = book.id;
    document.getElementById('editBookTitle').value = book.title;
    document.getElementById('editBookAuthor').value = book.author;
    document.getElementById('editBookYear').value = book.year;
    document.getElementById('editBookIsComplete').checked = book.isComplete;

    // Reset and set genre checkboxes
    resetGenreCheckboxes();
    const genres = book.genre.split(', ');
    genres.forEach(genre => {
        const checkbox = document.querySelector(`input[name="genre"][value="${genre}"]`);
        if (checkbox) checkbox.checked = true;
    });

    editModal.show();
}

function resetGenreCheckboxes() {
    document.querySelectorAll('input[name="genre"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

function showNotification(message, type = 'success') {
    const toast = document.getElementById('successToast');
    
    // Reset classes
    toast.classList.remove('bg-success', 'bg-info', 'bg-warning', 'bg-danger');
    
    // Add appropriate class based on type
    switch(type) {
        case 'success':
            toast.classList.add('bg-success');
            break;
        case 'info':
            toast.classList.add('bg-info');
            break;
        case 'warning':
            toast.classList.add('bg-warning');
            break;
        case 'danger':
            toast.classList.add('bg-danger');
            break;
    }

    document.getElementById('successToastMessage').textContent = message;
    successToast.show();
} 