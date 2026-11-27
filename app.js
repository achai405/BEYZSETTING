
(() => {
'use strict';

const $ = id => document.getElementById(id);

const demoProducts = [
 {
  id:'demo-a',
  name:'Product A',
  desc:'Contoh penerangan produk. Owner boleh edit description, gambar dan pakej dalam dashboard.',
  symbol:'A',
  image:'',
  prices:[
   {label:'7 Hari',price:5},
   {label:'30 Hari',price:15}
  ],
  active:true
 },
 {
  id:'demo-b',
  name:'Product B',
  desc:'Contoh produk kedua. Tukar kandungan ini melalui Admin Dashboard.',
  symbol:'B',
  image:'',
  prices:[
   {label:'7 Hari',price:8},
   {label:'30 Hari',price:20}
  ],
  active:true
 }
];

let db = null;
let auth = null;
let currentUser = null;
let currentRole = null;
let products = [];
let settings = {};
let payments = {};
let selectedProduct = null;
let selectedPackage = null;
let unsubscribers = [];

const config = window.BEYZ_FIREBASE_CONFIG || {};

const firebaseReady = !!(
 window.firebase &&
 config.apiKey &&
 config.apiKey !== 'PASTE_API_KEY_HERE' &&
 config.projectId &&
 config.projectId !== 'YOUR_PROJECT_ID'
);

if (firebaseReady) {
 try {
  if (!firebase.apps.length) {
   firebase.initializeApp(config);
  }

  auth = firebase.auth();
  db = firebase.firestore();

 } catch (e) {
  console.error(e);
 }
}

const defaultSettings = {
 name:'BEYZ',
 desc:'Explore produk pilihan, pilih pakej dan buat pesanan dengan mudah.',
 tagline:'BEYZ STORE',
 letter:'B',
 banner:'',
 accent:'#9b8cff',
 bg:'#0b1020',
 founder:'Belum ditetapkan',
 owner:'Belum ditetapkan',
 whatsapp:'',
 telegram:''
};

function toast(msg) {
 const t = $('toast');
 if (!t) return;

 t.textContent = msg;
 t.classList.add('show');

 setTimeout(() => {
  t.classList.remove('show');
 }, 3200);
}

function esc(v = '') {
 return String(v).replace(/[&<>"']/g, c => ({
  '&':'&amp;',
  '<':'&lt;',
  '>':'&gt;',
  '"':'&quot;',
  "'":'&#39;'
 }[c]));
}

function money(v) {
 return 'RM ' + Number(v || 0).toFixed(2);
}

function safeUrl(v) {
 try {
  const u = new URL(v);

  return ['https:'].includes(u.protocol)
   ? u.href
   : '#';

 } catch {
  return '#';
 }
}

function showDialog(id) {
 $(id).showModal();
}

function closeDialog(id) {
 if ($(id).open) {
  $(id).close();
 }
}

function applySettings(s = {}) {
 settings = {
  ...defaultSettings,
  ...s
 };

 document.title = settings.name + ' STORE';

 $('brandName').textContent = settings.name;
 $('footerName').textContent = settings.name;
 $('footerName2').textContent = settings.name + ' STORE';

 $('brandMark').textContent =
  settings.letter || settings.name.charAt(0) || 'B';

 $('bannerLetter').textContent = settings.letter || 'B';
 $('bannerTag').textContent = settings.tagline || settings.name + ' STORE';

 $('heroEyebrow').textContent =
  'WELCOME TO ' + settings.name.toUpperCase();

 $('heroDesc').textContent = settings.desc;

 $('ownerInfo').innerHTML =
  'Founder: <strong>' + esc(settings.founder) +
  '</strong><br>Owner: <strong>' +
  esc(settings.owner) + '</strong>';

 $('waLink').href = settings.whatsapp
  ? 'https://wa.me/' + settings.whatsapp.replace(/\D/g, '')
  : '#';

 $('tgLink').href = safeUrl(settings.telegram);

 document.documentElement.style.setProperty(
  '--accent',
  settings.accent
 );

 document.documentElement.style.setProperty(
  '--bg',
  settings.bg
 );

 if (settings.banner) {
  $('heroBanner').style.backgroundImage =
   `linear-gradient(#10172b66,#10172b66),url("${safeUrl(settings.banner)}")`;

  $('heroBanner').style.backgroundSize = 'cover';
  $('heroBanner').style.backgroundPosition = 'center';

  $('heroBanner')
   .querySelectorAll('.orb,.hero-b')
   .forEach(x => x.style.display = 'none');

 } else {
  $('heroBanner').style.backgroundImage = '';

  $('heroBanner')
   .querySelectorAll('.orb,.hero-b')
   .forEach(x => x.style.display = '');
 }
}

function renderProducts() {
 const list = products.filter(p => p.active !== false);

 $('catalogGrid').innerHTML = list.length
  ? list.map(p => `
   <article class="product-card" data-id="${esc(p.id)}">
    <div class="product-image">
     ${
      p.image
       ? `<img src="${esc(safeUrl(p.image))}" alt="${esc(p.name)}">`
       : esc(p.symbol || 'B')
     }
    </div>

    <div class="product-body">
     <h3>${esc(p.name)}</h3>
     <p>${esc(p.desc)}</p>
     <span class="price">
      Dari ${money(p.prices?.[0]?.price)}
     </span>
    </div>
   </article>
  `).join('')
  : '<p class="muted">Belum ada produk aktif.</p>';

 $('catalogGrid')
  .querySelectorAll('.product-card')
  .forEach(el => {
   el.onclick = () => openProduct(el.dataset.id);
  });
}

function openProduct(id) {
 selectedProduct = products.find(p => p.id === id);

 if (!selectedProduct) return;

 $('productDetails').innerHTML = `
  <span class="eyebrow">PRODUCT DETAILS</span>

  <div class="modal-product-art">
   ${
    selectedProduct.image
     ? `<img src="${esc(safeUrl(selectedProduct.image))}" alt="">`
     : esc(selectedProduct.symbol || 'B')
   }
  </div>

  <h2>${esc(selectedProduct.name)}</h2>
  <p>${esc(selectedProduct.desc)}</p>

  <h3>Pilih pakej</h3>

  <div class="price-list">
   ${(selectedProduct.prices || []).map((p, i) => `
    <label class="price-option">
     <span>
      <input
       type="radio"
       name="package"
       value="${i}"
       ${i === 0 ? 'checked' : ''}
      >
      ${esc(p.label)}
     </span>

     <strong class="price">${money(p.price)}</strong>
    </label>
   `).join('')}
  </div>

  <button class="primary-btn full" id="buyNow">
   Teruskan pembelian →
  </button>
 `;

 showDialog('productDialog');

 $('buyNow').onclick = () => {
  const i = Number(
   document.querySelector('input[name="package"]:checked')?.value || 0
  );

  selectedPackage = selectedProduct.prices[i];

  if (!selectedPackage) return;

  $('orderSummary').textContent =
   selectedProduct.name + ' — ' +
   selectedPackage.label + ' (' +
   money(selectedPackage.price) + ')';

  renderPaymentInfo();

  closeDialog('productDialog');
  showDialog('orderDialog');
 };
}

function renderPaymentInfo() {
 const method = $('paymentMethod').value;

 const url = method === 'Touch \'n Go'
  ? payments.tngQr
  : payments.bankQr;

 $('paymentInfo').innerHTML = `
  <div class="payment-card">
   <strong>${esc(method)}</strong>

   ${
    url
     ? `<img class="payment-qr" src="${esc(safeUrl(url))}" alt="QR ${esc(method)}">`
     : ''
   }

   <p>
    ${esc(payments.payName || '')}
    ${
     method === 'Bank Transfer'
      ? '<br>' + esc(payments.payBank || '') +
        '<br>' + esc(payments.payAccount || '')
      : ''
    }
   </p>

   <small>
    Bayar kepada penerima yang tertera.
    Pesanan akan disemak secara manual.
   </small>
  </div>
 `;
}

async function loadPublic() {
 if (!firebaseReady) {
  products = demoProducts;
  applySettings(defaultSettings);
  renderProducts();
  return;
 }

 try {
  const [s, p, m] = await Promise.all([
   db.collection('public').doc('settings').get(),
   db.collection('products').where('active', '==', true).get(),
   db.collection('public').doc('payments').get()
  ]);

  applySettings(s.exists ? s.data() : defaultSettings);

  payments = m.exists ? m.data() : {};

  products = p.docs.map(d => ({
   id:d.id,
   ...d.data()
  }));

  renderProducts();

 } catch (e) {
  console.error(e);

  products = demoProducts;
  applySettings(defaultSettings);
  renderProducts();

  toast('Data belum tersedia. Semak tetapan Firebase.');
 }
}

function clearSubs() {
 unsubscribers.forEach(fn => fn());
 unsubscribers = [];
}

/* OWNER DAN ADMIN GUNA KOLEKSI USERS */

async function roleFor(uid) {
 const snap = await db.collection('users').doc(uid).get();

 return snap.exists
  ? snap.data().role
  : null;
}

function setAdminTab(tab) {
 document.querySelectorAll('.tab').forEach(b => {
  b.classList.toggle('active', b.dataset.tab === tab);
 });

 document.querySelectorAll('.admin-panel').forEach(p => {
  p.classList.toggle('hidden', p.id !== 'panel-' + tab);
 });
}

function showAdmin(role) {
 currentRole = role;

 $('storeView').classList.add('hidden');
 $('adminView').classList.remove('hidden');

 document.querySelectorAll('.owner-only').forEach(x => {
  x.classList.toggle('hidden', role !== 'owner');
 });

 $('adminWelcome').textContent =
  (currentUser.email || '') + ' · ' +
  (role === 'owner' ? 'OWNER' : 'ADMIN');

 setAdminTab('products');

 startDashboard();
}

function showStore() {
 $('adminView').classList.add('hidden');
 $('storeView').classList.remove('hidden');

 clearSubs();
}

function startDashboard() {
 clearSubs();

 /* PRODUK */

 const prodSub = db.collection('products').onSnapshot(s => {
  const all = s.docs.map(d => ({
   id:d.id,
   ...d.data()
  }));

  $('statProducts').textContent = all.length;

  $('adminProducts').innerHTML = all.map(p => `
   <div class="admin-item">
    <div>
     <strong>${esc(p.name)}</strong>
     <small>${esc(p.desc || '')}</small>
    </div>

    <div class="item-actions">
     <button class="secondary-btn" data-edit="${esc(p.id)}">
      Edit
     </button>

     <button class="danger-btn" data-delete="${esc(p.id)}">
      Padam
     </button>
    </div>
   </div>
  `).join('') || '<p class="muted">Tiada produk.</p>';

  products = all;

  renderProducts();

  $('adminProducts')
   .querySelectorAll('[data-edit]')
   .forEach(b => {
    b.onclick = () => editProduct(b.dataset.edit);
   });

  $('adminProducts')
   .querySelectorAll('[data-delete]')
   .forEach(b => {
    b.onclick = () => deleteProduct(b.dataset.delete);
   });

 }, e => {
  console.error(e);
  toast('Gagal memuatkan produk: ' + e.message);
 });

 unsubscribers.push(prodSub);

 /* PESANAN */

 const orderSub = db.collection('orders')
  .orderBy('createdAt', 'desc')
  .limit(100)
  .onSnapshot(s => {

   const rows = s.docs.map(d => ({
    id:d.id,
    ...d.data()
   }));

   $('statOrders').textContent = rows.length;

   $('statPending').textContent =
    rows.filter(x => x.status === 'pending').length;

   $('adminOrders').innerHTML = rows.map(o => `
    <div class="admin-item order-item">
     <div>
      <strong>
       ${esc(o.productName)} — ${esc(o.packageLabel)}
      </strong>

      <small>
       ${esc(o.buyerName)} ·
       ${esc(o.contact)} ·
       ${money(o.amount)} ·
       ${esc(o.paymentMethod)} ·
       ${esc(o.status)}
      </small>

      ${
       o.proofUrl
        ? `<a target="_blank" rel="noopener" href="${esc(safeUrl(o.proofUrl))}">Lihat bukti bayaran</a>`
        : ''
      }
     </div>

     <div class="item-actions">
      <select data-status="${esc(o.id)}">
       <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
       <option value="paid" ${o.status === 'paid' ? 'selected' : ''}>Paid</option>
       <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
       <option value="rejected" ${o.status === 'rejected' ? 'selected' : ''}>Rejected</option>
      </select>

      <button class="secondary-btn" data-saveorder="${esc(o.id)}">
       Simpan
      </button>
     </div>
    </div>
   `).join('') || '<p class="muted">Belum ada pesanan.</p>';

   $('adminOrders')
    .querySelectorAll('[data-saveorder]')
    .forEach(b => {
     b.onclick = async () => {
      const id = b.dataset.saveorder;

      const status = $('adminOrders')
       .querySelector(`[data-status="${id}"]`).value;

      try {
       await db.collection('orders').doc(id).update({
        status,
        updatedAt:firebase.firestore.FieldValue.serverTimestamp(),
        reviewedBy:currentUser.uid
       });

       toast('Status pesanan dikemas kini.');

      } catch (e) {
       toast(e.message);
      }
     };
    });

  }, e => {
   console.error(e);
   toast('Gagal memuatkan pesanan: ' + e.message);
  });

 unsubscribers.push(orderSub);

 /* REDEEM */

 const redSub = db.collection('redeems').onSnapshot(s => {
  const a = s.docs.map(d => ({
   id:d.id,
   ...d.data()
  }));

  $('statRedeems').textContent =
   a.filter(x => x.active !== false).length;

  $('adminRedeems').innerHTML = a.map(r => `
   <div class="admin-item">
    <div>
     <strong>${esc(r.code)}</strong>
     <small>
      ${esc(r.reward)} ·
      ${Number(r.used || 0)}/${Number(r.limit || 0) || '∞'} digunakan
     </small>
    </div>

    <button class="danger-btn" data-delredeem="${esc(r.id)}">
     Padam
    </button>
   </div>
  `).join('') || '<p class="muted">Belum ada kod.</p>';

  $('adminRedeems')
   .querySelectorAll('[data-delredeem]')
   .forEach(b => {
    b.onclick = () => {
     if (!confirm('Padam kod redeem ini?')) return;

     db.collection('redeems')
      .doc(b.dataset.delredeem)
      .delete()
      .then(() => toast('Kod dipadam.'))
      .catch(e => toast(e.message));
    };
   });

 }, e => {
  console.error(e);
  toast('Gagal memuatkan redeem: ' + e.message);
 });

 unsubscribers.push(redSub);

 loadAdminForms();

 /* SENARAI ADMIN - OWNER SAHAJA */

 if (currentRole === 'owner') {
  const aSub = db.collection('users')
   .where('role', '==', 'admin')
   .onSnapshot(s => {

    $('adminUsers').innerHTML = s.docs.map(d => `
     <div class="admin-item">
      <div>
       <strong>${esc(d.data().email || d.id)}</strong>
       <small>ADMIN</small>
      </div>

      <button class="danger-btn" data-removeadmin="${esc(d.id)}">
       Buang akses
      </button>
     </div>
    `).join('') || '<p class="muted">Belum ada Admin.</p>';

    $('adminUsers')
     .querySelectorAll('[data-removeadmin]')
     .forEach(b => {
      b.onclick = async () => {
       if (!confirm('Buang akses Admin ini?')) return;

       try {
        await db.collection('users')
         .doc(b.dataset.removeadmin)
         .delete();

        toast('Akses Admin dibuang.');

       } catch (e) {
        toast(e.message);
       }
      };
     });

   }, e => {
    console.error(e);
    toast('Gagal memuatkan senarai Admin: ' + e.message);
   });

  unsubscribers.push(aSub);
 }
}

async function loadAdminForms() {
 try {
  const [s, m] = await Promise.all([
   db.collection('public').doc('settings').get(),
   db.collection('public').doc('payments').get()
  ]);

  const v = s.exists ? s.data() : defaultSettings;

  [
   'name',
   'desc',
   'tagline',
   'letter',
   'banner',
   'accent',
   'bg',
   'founder',
   'owner',
   'whatsapp',
   'telegram'
  ].forEach(k => {
   const el = $('s' + k.charAt(0).toUpperCase() + k.slice(1));

   if (el) {
    el.value = v[k] || '';
   }
  });

  payments = m.exists ? m.data() : {};

  [
   'payName',
   'payBank',
   'payAccount',
   'payTngQr',
   'payBankQr'
  ].forEach((id, i) => {
   $(id).value = [
    payments.payName,
    payments.payBank,
    payments.payAccount,
    payments.tngQr,
    payments.bankQr
   ][i] || '';
  });

 } catch (e) {
  console.error(e);
 }
}

function editProduct(id) {
 const p = products.find(x => x.id === id);

 if (!p) return;

 $('productId').value = p.id;
 $('pName').value = p.name;
 $('pDesc').value = p.desc || '';
 $('pImage').value = p.image || '';
 $('pSymbol').value = p.symbol || 'B';

 $('pPrices').value = (p.prices || [])
  .map(x => `${x.label} | ${x.price}`)
  .join('\n');

 $('productFormTitle').textContent = 'Edit produk';

 $('productForm').classList.remove('hidden');

 $('productForm').scrollIntoView({
  behavior:'smooth'
 });
}

async function deleteProduct(id) {
 if (!confirm('Padam produk ini?')) return;

 try {
  await db.collection('products').doc(id).delete();
  toast('Produk dipadam.');

 } catch (e) {
  toast(e.message);
 }
}

/* MENU */

$('menuBtn').onclick = () => {
 $('drawer').classList.add('open');
 $('scrim').classList.add('show');
};

function closeMenu() {
 $('drawer').classList.remove('open');
 $('scrim').classList.remove('show');
}

$('closeMenu').onclick = closeMenu;
$('scrim').onclick = closeMenu;

document.querySelectorAll('.drawer a').forEach(a => {
 a.onclick = closeMenu;
});

/* LOGIN */

$('openLogin').onclick = () => {
 if (!firebaseReady) {
  toast('Firebase belum disediakan. Ikut FIREBASE_SETUP.txt dahulu.');
  return;
 }

 showDialog('loginDialog');
};

$('closeLogin').onclick = () => closeDialog('loginDialog');
$('closeProduct').onclick = () => closeDialog('productDialog');
$('closeOrder').onclick = () => closeDialog('orderDialog');

$('loginForm').onsubmit = async e => {
 e.preventDefault();

 if (!firebaseReady) return;

 try {
  const cred = await auth.signInWithEmailAndPassword(
   $('loginEmail').value.trim(),
   $('loginPassword').value
  );

  const role = await roleFor(cred.user.uid);

  if (!['owner', 'admin'].includes(role)) {
   await auth.signOut();

   toast('Akaun ini belum diberi akses Owner/Admin.');
   return;
  }

  currentUser = cred.user;

  closeDialog('loginDialog');
  showAdmin(role);

 } catch (err) {
  toast('Login gagal: ' + err.message);
 }
};

/* LOGOUT */

$('logoutBtn').onclick = async () => {
 clearSubs();

 await auth.signOut();

 currentUser = null;
 currentRole = null;

 showStore();

 location.hash = 'home';

 toast('Anda telah log keluar.');
};

/* TAB DASHBOARD */

$('adminTabs').onclick = e => {
 const b = e.target.closest('[data-tab]');

 if (b) {
  setAdminTab(b.dataset.tab);
 }
};

/* PRODUK BARU */

$('newProduct').onclick = () => {
 $('productForm').reset();

 $('productId').value = '';
 $('productFormTitle').textContent = 'Tambah produk';

 $('productForm').classList.remove('hidden');
};

$('cancelProduct').onclick = () => {
 $('productForm').classList.add('hidden');
};

$('productForm').onsubmit = async e => {
 e.preventDefault();

 const prices = $('pPrices').value
  .split('\n')
  .map(x => x.split('|'))
  .filter(x => x.length >= 2 && x[0].trim())
  .map(x => ({
   label:x[0].trim(),
   price:Number(x[1].replace(/[^0-9.]/g, ''))
  }));

 if (!prices.length || prices.some(x => !Number.isFinite(x.price))) {
  toast('Format pakej tidak sah. Contoh: 7 Hari | 5.00');
  return;
 }

 const data = {
  name:$('pName').value.trim(),
  desc:$('pDesc').value.trim(),
  image:$('pImage').value.trim(),
  symbol:$('pSymbol').value.trim() || 'B',
  prices,
  active:true,
  updatedAt:firebase.firestore.FieldValue.serverTimestamp()
 };

 try {
  const id = $('productId').value;

  if (id) {
   await db.collection('products').doc(id).update(data);

  } else {
   await db.collection('products').add({
    ...data,
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
   });
  }

  $('productForm').classList.add('hidden');

  toast('Produk berjaya disimpan.');

 } catch (err) {
  toast(err.message);
 }
};

/* TETAPAN WEBSITE */

$('settingsForm').onsubmit = async e => {
 e.preventDefault();

 const v = {
  name:$('sName').value.trim(),
  desc:$('sDesc').value.trim(),
  tagline:$('sTag').value.trim(),
  letter:$('sLetter').value.trim(),
  banner:$('sBanner').value.trim(),
  accent:$('sAccent').value.trim() || defaultSettings.accent,
  bg:$('sBg').value.trim() || defaultSettings.bg,
  founder:$('sFounder').value.trim(),
  owner:$('sOwner').value.trim(),
  whatsapp:$('sWhatsApp').value.trim(),
  telegram:$('sTelegram').value.trim()
 };

 try {
  await db.collection('public')
   .doc('settings')
   .set(v, {merge:true});

  applySettings(v);

  toast('Tetapan website disimpan.');

 } catch (err) {
  toast(err.message);
 }
};

/* TETAPAN PEMBAYARAN */

$('paymentForm').onsubmit = async e => {
 e.preventDefault();

 payments = {
  payName:$('payName').value.trim(),
  payBank:$('payBank').value.trim(),
  payAccount:$('payAccount').value.trim(),
  tngQr:$('payTngQr').value.trim(),
  bankQr:$('payBankQr').value.trim()
 };

 try {
  await db.collection('public')
   .doc('payments')
   .set(payments);

  toast('Tetapan pembayaran disimpan.');

 } catch (err) {
  toast(err.message);
 }
};

/* TAMBAH REDEEM */

$('redeemAdminForm').onsubmit = async e => {
 e.preventDefault();

 const code = $('rCode').value.trim().toUpperCase();

 if (!code) {
  toast('Masukkan kod redeem.');
  return;
 }

 try {
  await db.collection('redeems')
   .doc(code)
   .set({
    code,
    reward:$('rReward').value.trim(),
    limit:Number($('rLimit').value) || 0,
    used:0,
    active:true,
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
   });

  $('redeemAdminForm').reset();

  toast('Redeem code berjaya dicipta.');

 } catch (err) {
  toast(err.message);
 }
};

/* TAMBAH ADMIN - OWNER SAHAJA */

$('adminAddForm').onsubmit = async e => {
 e.preventDefault();

 if (currentRole !== 'owner') {
  toast('Hanya Owner boleh tambah Admin.');
  return;
 }

 const uid = $('newAdminUid').value.trim();

 if (!uid) {
  toast('Masukkan UID Admin.');
  return;
 }

 try {
  await db.collection('users').doc(uid).set({
   role:'admin',
   createdAt:firebase.firestore.FieldValue.serverTimestamp()
  });

  $('newAdminUid').value = '';

  toast('Akses Admin diberikan.');

 } catch (err) {
  toast('Gagal beri akses: ' + err.message);
 }
};

/* PEMBAYARAN */

$('paymentMethod').onchange = renderPaymentInfo;

/* HANTAR PESANAN */

$('orderForm').onsubmit = async e => {
 e.preventDefault();

 if (!firebaseReady) {
  toast('Pesanan belum boleh disimpan sehingga Firebase disambungkan.');
  return;
 }

 if (!selectedProduct || !selectedPackage) return;

 const order = {
  productId:selectedProduct.id,
  productName:selectedProduct.name,
  packageLabel:selectedPackage.label,
  amount:Number(selectedPackage.price),
  buyerName:$('buyerName').value.trim(),
  contact:$('buyerContact').value.trim(),
  paymentMethod:$('paymentMethod').value,
  proofUrl:$('proofUrl').value.trim(),
  status:'pending',
  createdAt:firebase.firestore.FieldValue.serverTimestamp()
 };

 try {
  await db.collection('orders').add(order);

  closeDialog('orderDialog');

  $('orderForm').reset();

  toast('Pesanan dihantar. Owner/Admin akan semak secara manual.');

 } catch (err) {
  toast('Pesanan gagal dihantar: ' + err.message);
 }
};

/* REDEEM PELANGGAN */

$('redeemForm').onsubmit = async e => {
 e.preventDefault();

 if (!firebaseReady) {
  toast('Redeem akan aktif selepas Firebase disambungkan.');
  return;
 }

 const code = $('redeemCode').value.trim().toUpperCase();

 try {
  await db.collection('redeemClaims').add({
   code,
   buyerContact:'',
   createdAt:firebase.firestore.FieldValue.serverTimestamp(),
   status:'pending'
  });

  toast('Permintaan redeem dihantar. Hubungi owner untuk pengesahan kod.');

  $('redeemCode').value = '';

 } catch (err) {
  toast(err.message);
 }
};

/* TAHUN FOOTER */

$('year').textContent = new Date().getFullYear();

applySettings(defaultSettings);
loadPublic();

/* SEMAK LOGIN YANG MASIH AKTIF */

if (firebaseReady) {
 auth.onAuthStateChanged(async user => {
  if (!user) return;

  try {
   const role = await roleFor(user.uid);

   if (['owner', 'admin'].includes(role)) {
    currentUser = user;
    showAdmin(role);

   } else {
    await auth.signOut();
    toast('Akaun ini belum diberi akses Owner/Admin.');
   }

  } catch (e) {
   console.error(e);
   toast('Gagal menyemak akses akaun.');
  }
 });
}

})();
