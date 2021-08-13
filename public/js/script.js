const loggedIn = document.querySelectorAll('.loggedIn');

if(loggedIn.length > 0){
    const li = document.querySelector('.instructions');
    li.insertAdjacentHTML('afterend', `
        <li class="nav-item">
            <a class="nav-link" href="/add">Add</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="/logout">Logout</a>
        </li>
    `);
}
else{
    const li = document.querySelector('.instructions');
    li.insertAdjacentHTML('afterend', `
        <li class="nav-item">
            <a class="nav-link" href="/register">Register</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="/login">Login</a>
        </li>
    `);
}