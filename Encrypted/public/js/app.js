// app.js - UI interactions for premium template

document.addEventListener('DOMContentLoaded', () => {
  // elements
  const loading = document.getElementById('loading-overlay');
  const themeToggle = document.getElementById('theme-toggle');
  const htmlRoot = document.documentElement;
  const discount = document.getElementById('discount-popup');
  const closePopup = document.getElementById('close-popup');
  const shopNow = document.getElementById('shop-now');
  const whatsappBtn = document.getElementById('whatsapp-btn');
  const loginModal = document.getElementById('login-modal');
  const openLogin = document.getElementById('open-login');
  const closeLogin = document.getElementById('close-login');
  const loginForm = document.getElementById('loginForm');
  const buyForm = document.getElementById('buy-form');
  const checkoutForm = document.getElementById('checkoutForm');
  const thumbs = document.querySelectorAll('.p-thumb, .thumb');

  // small util
  const showLoading = (show=true) => {
    if(show) loading.classList.add('show'); else loading.classList.remove('show');
  };

  // theme: persist in localStorage
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'dark') {
    htmlRoot.setAttribute('data-theme', 'dark');
  }

  themeToggle?.addEventListener('click', () => {
    const cur = htmlRoot.getAttribute('data-theme');
    if (cur === 'dark') {
      htmlRoot.removeAttribute('data-theme');
      localStorage.removeItem('theme');
    } else {
      htmlRoot.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
  });

  // discount popup: show once after 3s
  setTimeout(() => {
    if (!localStorage.getItem('seenDiscount')) {
      discount.style.display = 'block';
    }
  }, 3000);

  closePopup?.addEventListener('click', () => {
    discount.style.display = 'none';
    localStorage.setItem('seenDiscount','1');
  });
  shopNow?.addEventListener('click', () => {
    discount.style.display = 'none';
    location.href = '#product';
  });

  // WhatsApp button opens chat with prefilled message
  const phone = '+961XXXXXXXX'; // replace with your business number (E.164)
  whatsappBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const text = encodeURIComponent('Hello, I want to order the USB Electronic Lighter (22.99$).');
    const url = `https://wa.me/${phone.replace(/\D/g,'')}?text=${text}`;
    window.open(url,'_blank');
  });

  // login modal
  openLogin?.addEventListener('click', (e)=> {
    e.preventDefault();
    loginModal.setAttribute('aria-hidden','false');
  });
  closeLogin?.addEventListener('click', ()=> loginModal.setAttribute('aria-hidden','true'));
  loginForm?.addEventListener('submit', (e)=> {
    e.preventDefault();
    // simple client-side validation
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value.trim();
    if (!email || !password) return alert('Fill all fields');
    alert('Logged in (demo).');
    loginModal.setAttribute('aria-hidden','true');
    loginForm.reset();
  });

  // product thumbs -> swap main
  thumbs.forEach(t => t.addEventListener('click', (ev)=>{
    thumbs.forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const src = t.dataset.src || t.getAttribute('src');
    const main = document.getElementById('gallery-main');
    if (main && src) main.src = src;
  }));

  // reviews carousel
  const reviews = document.querySelectorAll('.reviews-wrapper .review');
  let rIndex = 0;
  const showReview = (i) => {
    reviews.forEach((r, idx)=> r.classList.toggle('active', idx === i));
  };
  document.getElementById('prev-review')?.addEventListener('click', ()=> { rIndex = (rIndex-1+reviews.length)%reviews.length; showReview(rIndex); });
  document.getElementById('next-review')?.addEventListener('click', ()=> { rIndex = (rIndex+1)%reviews.length; showReview(rIndex); });
  setInterval(()=> { rIndex=(rIndex+1)%reviews.length; showReview(rIndex); }, 6000);

  // buy form submit -> call backend /api/create-payment
  buyForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(buyForm);
    const payload = {
      name: data.get('name'),
      phone: data.get('phone'),
      email: data.get('email'),
      address: data.get('address'),
      paymentMethod: data.get('payment')
    };
    if (!payload.name || !payload.email || !payload.phone) return alert('Please fill name, email, phone.');

    try {
      showLoading(true);
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const body = await res.json();
      showLoading(false);
      if (!res.ok) return alert('Payment initialization failed: ' + (body.error || JSON.stringify(body)));
      if (payload.paymentMethod === 'cod') {
        alert('Order placed (COD). Order ID: ' + body.orderId);
        location.href = '/thankyou.html';
        return;
      }
      if (payload.paymentMethod === 'omt') {
        alert('OMT Instructions:\n' + JSON.stringify(body.omtInstructions,null,2));
        location.href = '/thankyou.html';
        return;
      }
      if (body.redirect_url) {
        // redirect to hosted payment page
        window.location.href = body.redirect_url;
      } else {
        alert('No redirect url received. Order ID: ' + body.orderId);
        location.href = '/thankyou.html';
      }
    } catch (err) {
      showLoading(false);
      console.error(err);
      alert('Network error, try again.');
    }
  });

  // checkout page submit hooking (if on checkout.html)
  const cForm = document.getElementById('checkoutForm');
  if (cForm) {
    cForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(cForm);
      const payload = {
        name: data.get('name'),
        phone: data.get('phone'),
        email: data.get('email'),
        address: data.get('address'),
        paymentMethod: data.get('payment')
      };
      // reuse buy flow
      try {
        showLoading(true);
        const res = await fetch('/api/create-payment', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        const body = await res.json();
        showLoading(false);
        if (!res.ok) return alert('Error: ' + (body.error || 'server error'));
        if (body.redirect_url) window.location.href = body.redirect_url;
        else location.href = '/thankyou.html';
      } catch (err) {
        showLoading(false);
        alert('Network error');
      }
    });
  }

  // small UX: hide loading after content
  setTimeout(()=> showLoading(false), 500);
});

// Page Loader - smooth fade out
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.opacity = "0";
    setTimeout(() => loader.style.display = "none", 700);
  }
});

// Login Validation
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();

    if (!email.includes("@") || !email.includes(".")) {
      alert("Please enter a valid email.");
      return;
    }

    if (pass.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    window.location.href = "index.html"; // Redirect after login
  });
}
// Register Validation
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const fullname = document.getElementById("fullname").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const pass = document.getElementById("regPassword").value.trim();
    const pass2 = document.getElementById("regPassword2").value.trim();

    if (fullname.length < 3) {
      alert("Please enter your full name.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      alert("Please enter a valid email address.");
      return;
    }

    if (pass.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (pass !== pass2) {
      alert("Passwords do not match!");
      return;
    }

    alert("Account created successfully!");
    window.location.href = "login.html";
  });
}
