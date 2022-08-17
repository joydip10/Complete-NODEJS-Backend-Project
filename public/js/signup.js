const hideAlertSignup=()=>{
    const el=document.querySelector('.alert');
    if(el){
        el.parentElement.removeChild(el);
    }
};

const showAlertSignup=(type,message)=>{
    hideAlertSignup();
    const markup=`<div class="alert alert--${type}">${message}</div>`;
    document.querySelector('body').insertAdjacentHTML('afterBegin',markup);
    window.setTimeout(hideAlertSignup,5000);
}

const signupAlert=async (name,email,password,passwordConfirm)=>{
    try{
        const res=await axios({
            method:'POST',
            url:'https://pacific-thicket-84974.herokuapp.com/api/v1/users/signup',
            data:{
                email,
                password,
                passwordConfirm,
                name
            }
        });
        if(res.data.status==='success'){
            showAlertSignup('success','Signed up Successfully');
            window.setTimeout(()=>{
                location.assign('/')
            },1500)
        }
        
    } catch(err){
        showAlertSignup('error',err.response.data.message);
    }
}

console.log('Sign Up Js Connected');

if(document.getElementById('signup')){
    document.getElementById('signup').addEventListener('submit',async (e)=>{
        e.preventDefault();
        document.getElementById('signup--btn').textContent = 'Saving....';
        document.getElementById('signup--btn').disabled = true;

        const email=document.getElementById('email').value;
        const password=document.getElementById('password').value;
        const name=document.getElementById('name').value;
        const passwordConfirm=document.getElementById('passwordConfirm').value;
        
        console.log(name,email,password,passwordConfirm);
        
        await signupAlert(name,email,password,passwordConfirm);

        document.getElementById('signup--btn').textContent = 'SIGN UP';
    })
}


