const stripe =Stripe('pk_test_51LVhYZDA0nGrAkOE5GVnuWLhnBw4Ijrfb8sJSY7PuOt15HP0UkGuJHBFv9PfgVCSY7CLpBWqvD8RI0feVJ0MKVFy002cah2bGd');
const btn=document.getElementById('book-tour');

const hideStripeAlert=()=>{
    const el=document.querySelector('.alert');
    if(el){
        el.parentElement.removeChild(el);
    }
};

const showStripeAlert=(type,message)=>{
    hideStripeAlert();
    const markup=`<div class="alert alert--${type}">${message}</div>`;
    document.querySelector('body').insertAdjacentHTML('afterBegin',markup);
    window.setTimeout(hideStripeAlert,5000);
}


const bookTour=async (tourId)=>{
    //(1) GET Checkout Session
    try{
        const session=await axios({
            method:'GET',
            url:`http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`
        });

        console.log(session);

         //(2)Create Checkout form + charge credit card
        if(session.data.status==='success'){
            await stripe.redirectToCheckout({
                sessionId: session.data.session.id
            })
            showStripeAlert('success','Successfully payment done!');
        }
    }catch(err){
        console.log(err);
        showStripeAlert('error',err.response.data.message);
    }
}
console.log('Stripe Js connected!');
if(btn){
    btn.addEventListener('click',(e)=>{
        e.preventDefault();
        const {tourId}= e.target.dataset;
        bookTour(tourId);
    });
}