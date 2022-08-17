const hideUpdateAlert = () => {
    const el = document.querySelector('.alert');
    if (el) {
        el.parentElement.removeChild(el);
    }
};

const showUpdateAlert = (type, message) => {
    hideUpdateAlert();
    const markup = `<div class="alert alert--${type}">${message}</div>`;
    document.querySelector('body').insertAdjacentHTML('afterBegin', markup);
    window.setTimeout(hideUpdateAlert, 5000);
}

console.log('Update Account is connected!');

//the updateData can update both password and user
const updateData = async (data, type) => {
    try {
        let url = (type === 'password' ? 'http://localhost:3000/api/v1/users/updatePassword' : 'http://localhost:3000/api/v1/users/updateMe');

        const res = await axios({
            method: 'PATCH',
            url: url,
            data
        })

        if (res.data.status === 'success') {
            showUpdateAlert('success', `Successfully updated User's ${type}`);
            location.reload(true);
        }
    } catch (err) {
        showUpdateAlert('error', err.response.data.message);
    }
}

if (document.querySelector('.form-user-data')) {
    document.querySelector('.form-user-data').addEventListener('submit', (e) => {
        e.preventDefault();

        const form = new FormData();
        form.append('name', document.querySelector('#name').value);
        form.append('email', document.querySelector('#email').value);
        form.append('photo', document.getElementById('photo').files[0]);

        updateData(form, 'name, email & photo');
    })
}

if (document.querySelector('.form-user-password')) {
    document.querySelector('.form-user-password').addEventListener('submit', async (e) => {
        e.preventDefault();

        document.querySelector('.btn--save-password').textContent = 'Updating';

        let passwordCurrent = document.querySelector('#password-current').value;
        let passwordConfirm = document.querySelector('#password-confirm').value;
        let password = document.querySelector('#password').value;

        await updateData({ passwordCurrent, password, passwordConfirm }, 'password');
        document.querySelector('.btn--save-password').textContent = 'SAVE PASSWORD';

        document.querySelector('#password-current').value = "";
        document.querySelector('#password-confirm').value = "";
        document.querySelector('#password').value = "";
    })
}
