const books = [];
const RENDER_EVENT = 'render-book';
const SAVED_EVENT = 'saved-book';
const STORAGE_KEY = 'BOOKSHELF_APPS';

document.addEventListener('DOMContentLoaded', function () {
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
}

function generateId() {
    return +new Date();
}

function generateBookObject(id, title, author, year, isComplete) {
    return {
        id,
        title,
        author,
        year,
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
    const {id, title, author, year, isComplete} = bookObject;

    const bookItem = document.createElement('div');
    bookItem.classList.add('book-item');
    
    const bookTitle = document.createElement('h3');
    bookTitle.innerText = title;
    
    const bookAuthor = document.createElement('p');
    bookAuthor.innerText = `Author: ${author}`;
    
    const bookYear = document.createElement('p');
    bookYear.innerText = `Year: ${year}`;
    
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
        if(confirm('Are you sure you want to delete this book?')) {
            removeBook(id);
        }
    });

    actionButtons.append(deleteButton);
    
    bookItem.append(bookTitle, bookAuthor, bookYear, actionButtons);
    return bookItem;
}

function addBookToCompleted(bookId) {
    const bookTarget = findBook(bookId);
    if (bookTarget == null) return;

    bookTarget.isComplete = true;
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
}

function undoBookFromCompleted(bookId) {
    const bookTarget = findBook(bookId);
    if (bookTarget == null) return;

    bookTarget.isComplete = false;
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
}

function removeBook(bookId) {
    const bookTarget = findBookIndex(bookId);
    if (bookTarget === -1) return;

    books.splice(bookTarget, 1);
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
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