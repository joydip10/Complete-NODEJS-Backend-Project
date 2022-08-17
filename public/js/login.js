const hideAlert=()=>{
    const el=document.querySelector('.alert');
    if(el){
        el.parentElement.removeChild(el);
    }
};

const showAlert=(type,message)=>{
    hideAlert();
    const markup=`<div class="alert alert--${type}">${message}</div>`;
    document.querySelector('body').insertAdjacentHTML('afterBegin',markup);
    window.setTimeout(hideAlert,5000);
}

const loginAlert=async (email,password)=>{
    try{
        const res=await axios({
            method:'POST',
            url:'http://localhost:3000/api/v1/users/login',
            data:{
                email,
                password
            }
        });
        if(res.data.status==='success'){
            showAlert('success','Logged in Successfully');
            window.setTimeout(()=>{
                location.assign('/')
            },1500)
        }
        
    } catch(err){
        showAlert('error',err.response.data.message);
    }
}

const logoutAlert=async () => {
    console.log('Entered!')
    try {
      var res = await axios({
        method: 'GET',
        url: 'http://localhost:3000/api/v1/users/logout'
      });

      if (res.data.status = 'success') {
        //location.reload(true);
        window.setTimeout(()=>{
            location.assign('/')
        },500)
      }
    } catch (err) {
      console.log(err.response);
      showAlert('error', 'Error logging out! Try again.');
    }
  };

console.log('login js connected!')

if(document.getElementById('login')){
    document.getElementById('login').addEventListener('submit',(e)=>{
        e.preventDefault();
        const email=document.getElementById('email').value;
        const password=document.getElementById('password').value;
        loginAlert(email,password);
    })
}


if(document.querySelector('.nav__el--logout')){
    document.querySelector('.nav__el--logout').addEventListener('click',logoutAlert);
}