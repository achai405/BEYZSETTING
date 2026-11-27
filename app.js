const products = [
  {id:1,name:"Product A",desc:"Contoh penerangan produk. Owner boleh ubah gambar, description dan harga melalui admin nanti.",symbol:"A",prices:[{label:"7 Hari",price:"RM5.00"},{label:"30 Hari",price:"RM15.00"}]},
  {id:2,name:"Product B",desc:"Contoh produk kedua. Tekan kad untuk lihat pilihan pakej dan harga.",symbol:"B",prices:[{label:"7 Hari",price:"RM8.00"},{label:"30 Hari",price:"RM20.00"}]},
  {id:3,name:"Product C",desc:"Contoh produk ketiga. Semua maklumat ini ialah data contoh sementara.",symbol:"C",prices:[{label:"Lifetime",price:"RM30.00"}]}
];
const grid=document.getElementById("catalogGrid"), productDialog=document.getElementById("productDialog"), orderDialog=document.getElementById("orderDialog");
let selectedProduct=null, selectedPrice=null;
function renderProducts(){grid.innerHTML=products.map(p=>`<article class="product-card" data-id="${p.id}"><div class="product-image">${p.symbol}</div><div class="product-body"><h3>${p.name}</h3><p>${p.desc}</p><span class="price">Dari ${p.prices[0].price}</span></div></article>`).join("");grid.querySelectorAll(".product-card").forEach(card=>card.addEventListener("click",()=>openProduct(+card.dataset.id)));}
function openProduct(id){selectedProduct=products.find(p=>p.id===id);document.getElementById("productDetails").innerHTML=`<span class="eyebrow">PRODUCT DETAILS</span><div class="modal-product-art">${selectedProduct.symbol}</div><h2>${selectedProduct.name}</h2><p>${selectedProduct.desc}</p><h3>Pilih pakej</h3><div class="price-list">${selectedProduct.prices.map((p,i)=>`<label class="price-option"><span><input type="radio" name="package" value="${i}" ${i===0?"checked":""}> ${p.label}</span><strong class="price">${p.price}</strong></label>`).join("")}</div><button class="primary-btn full" id="buyNow">Teruskan pembelian →</button>`;productDialog.showModal();document.getElementById("buyNow").addEventListener("click",()=>{const index=Number(document.querySelector('input[name="package"]:checked').value);selectedPrice=selectedProduct.prices[index];productDialog.close();orderDialog.showModal();});}
function closeDialog(d){if(d.open)d.close();}
document.getElementById("closeProduct").onclick=()=>closeDialog(productDialog);
document.getElementById("closeOrder").onclick=()=>closeDialog(orderDialog);
document.getElementById("menuBtn").onclick=()=>{document.getElementById("drawer").classList.add("open");document.getElementById("scrim").classList.add("show");};
function closeMenu(){document.getElementById("drawer").classList.remove("open");document.getElementById("scrim").classList.remove("show");}
document.getElementById("closeMenu").onclick=closeMenu;document.getElementById("scrim").onclick=closeMenu;
document.querySelectorAll(".drawer a").forEach(a=>a.addEventListener("click",closeMenu));
document.getElementById("redeemForm").addEventListener("submit",e=>{e.preventDefault();showToast("Sistem redeem akan aktif selepas Firebase disambungkan.");});
document.getElementById("placeOrder").onclick=()=>{const name=document.getElementById("buyerName").value.trim(),contact=document.getElementById("buyerContact").value.trim();if(!name||!contact){showToast("Sila isi nama dan nombor untuk dihubungi.");return;}const method=document.querySelector('input[name="payment"]:checked').value;showToast("Paparan prototaip sahaja. Sistem pesanan belum disambungkan.");};
document.getElementById("adminInfo").onclick=()=>showToast("Admin login akan dibina selepas sambungan Firebase Authentication.");
function showToast(message){const t=document.getElementById("toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),3000);}
document.getElementById("year").textContent=new Date().getFullYear();
renderProducts();