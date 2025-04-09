const userApiBaseUrl = 'https://localhost:7256/api/Users';

document.addEventListener('DOMContentLoaded', function () {
    // Load users
    if (document.getElementById('usersTable')) {
        fetch(userApiBaseUrl)
            .then(response => response.json())
            .then(data => {
                const tableBody = document.querySelector('#usersTable tbody');
                data.forEach(user => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${user.id}</td>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>${user.fullName}</td>
                        <td>${user.createdAt}</td>
                        <td>
                            <a href="Users/UserDetails.html?id=${user.id}">Details</a>
                            <a href="Users/EditUser.html?id=${user.id}">Edit</a>
                            <a href="Users/DeleteUser.html?id=${user.id}">Delete</a>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            });
    }

    // Create user
    if (document.getElementById('createUserForm')) {
        document.getElementById('createUserForm').addEventListener('submit', function (event) {
            event.preventDefault();
            const userData = {
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                fullName: document.getElementById('fullName').value,
                password: document.getElementById('password').value
            };
            fetch(userApiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            })
                .then(response => response.json())
                .then(() => window.location.href = '../Users.html');
        });
    }

    // Load user details for edit
    if (document.getElementById('editUserForm')) {
        const userId = new URLSearchParams(window.location.search).get('id');
        fetch(`${userApiBaseUrl}/${userId}`)
            .then(response => response.json())
            .then(user => {
                document.getElementById('userId').value = user.id;
                document.getElementById('username').value = user.username;
                document.getElementById('email').value = user.email;
                document.getElementById('fullName').value = user.fullName;
            });

        document.getElementById('editUserForm').addEventListener('submit', function (event) {
            event.preventDefault();
            const userData = {
                id: document.getElementById('userId').value,
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                fullName: document.getElementById('fullName').value
            };
            fetch(`${userApiBaseUrl}/${userData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            })
                .then(response => response.json())
                .then(() => window.location.href = '../Users.html');
        });
    }

    // Delete user
    if (document.getElementById('deleteUserForm')) {
        const userId = new URLSearchParams(window.location.search).get('id');
        document.getElementById('userId').value = userId;

        document.getElementById('deleteUserForm').addEventListener('submit', function (event) {
            event.preventDefault();
            fetch(`${userApiBaseUrl}/${userId}`, {
                method: 'DELETE'
            })
                .then(() => window.location.href = '../Users.html');
        });
    }

    // Load user details for view
    if (document.getElementById('userDetails')) {
        const userId = new URLSearchParams(window.location.search).get('id');
        fetch(`${userApiBaseUrl}/${userId}`)
            .then(response => response.json())
            .then(user => {
                const detailsDiv = document.getElementById('userDetails');
                detailsDiv.innerHTML = `
                    <p><strong>Id:</strong> ${user.id}</p>
                    <p><strong>Username:</strong> ${user.username}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Full Name:</strong> ${user.fullName}</p>
                    <p><strong>Created At:</strong> ${user.createdAt}</p>
                `;
                document.getElementById('editLink').href = `EditUser.html?id=${user.id}`;
                document.getElementById('deleteLink').href = `DeleteUser.html?id=${user.id}`;
            });
    }
});