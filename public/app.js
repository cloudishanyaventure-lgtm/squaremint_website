import { assets } from './assets.js';
import { properties, calculateShares, filterProperties } from './model.js';

const paths = {
  'arrow-up-right': '<path d="M6 18 18 6M6 6h12v12"/>', 'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>', 'arrow-down': '<path d="M12 4v16m-6-6 6 6 6-6"/>',
  house: '<path d="m3 10 9-7 9 7v10H3Zm6 10v-7h6v7"/>', heart: '<path d="M20.5 4.9a5.5 5.5 0 0 0-7.8 0l-.7.7-.7-.7a5.5 5.5 0 0 0-7.8 7.8L12 21l8.5-8.3a5.5 5.5 0 0 0 0-7.8Z"/>',
  pin: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', x: '<path d="m6 6 12 12M6 18 18 6"/>', plus: '<path d="M5 12h14M12 5v14"/>', 'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  play: '<path d="m9 5 10 7-10 7Z"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  pie: '<path d="M21 12h-9V3a9 9 0 1 0 9 9Z"/><path d="M16 3v5h5a7 7 0 0 0-5-5Z"/>', key: '<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-5-5 3-3m0 6 3-3"/>',
  chart: '<path d="M4 3v17h17M8 15l4-5 4 2 5-7"/>', file: '<path d="M14 3H5v18h14V8Zm0 0v5h5M8 12h8m-8 4h6"/>', calculator: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h1m6 0h1m-8 4h1m6 0h1m-8 4h1m6 0h1"/>',
  bed: '<path d="M3 18V8m18 10V8M3 15h18M3 10h18M6 10V6h12v4"/>', area: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h3M8 8v3m8 5h-3m3 0v-3"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5Z"/>', search: '<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>', message: '<path d="M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z"/><path d="M8 10h8m-8 4h5"/>', 'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>', download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>'
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.house}</svg>`;
function hydrateIcons(root = document) { root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }
hydrateIcons();
document.querySelector('#year').textContent = new Date().getFullYear();

let saved = new Set();
try { const stored = JSON.parse(localStorage.getItem('nextnest-saved') || '[]'); if (Array.isArray(stored)) saved = new Set(stored.filter(id => properties.some(p => p.id === id))); } catch { /* Storage can be unavailable in private browsing. */ }
let activeFilter = 'all';
let expanded = false;
let toastTimeout;
const grid = document.querySelector('#property-grid');
const dialog = document.querySelector('#detail-dialog');
const dialogContent = document.querySelector('#dialog-content');
const formatMoney = number => '₹' + number.toLocaleString('en-IN');
function toast(message) {
  const element = document.querySelector('#toast');
  clearTimeout(toastTimeout); element.textContent = message; element.hidden = false;
  toastTimeout = setTimeout(() => { element.hidden = true; }, 3500);
}
function updateSaved() {
  const count = document.querySelector('.saved-count'); count.textContent = saved.size; count.hidden = !saved.size;
  document.querySelector('.saved-trigger').setAttribute('aria-label', `View saved properties (${saved.size})`);
  document.querySelectorAll('[data-save]').forEach(button => {
    const property = properties.find(p => p.id === button.dataset.save);
    const isSaved = saved.has(property.id);
    button.setAttribute('aria-pressed', String(isSaved));
    button.setAttribute('aria-label', `${isSaved ? 'Unsave' : 'Save'} ${property.name}`);
  });
}
function propertyCard(property) {
  return `<article class="property-card"><div class="property-photo"><button class="property-image-button" data-property="${property.id}" aria-label="View ${property.name}"><img src="${assets[property.image]}" alt="${property.name}, ${property.location}" loading="lazy" width="600" height="400"></button><span class="property-badge ${property.type}">${property.badge}</span><button class="save-button" data-save="${property.id}" aria-pressed="${saved.has(property.id)}" aria-label="Save ${property.name}">${icon('heart')}</button></div><div class="property-info"><div class="property-location">${icon('pin')} ${property.location}, ${property.city}</div><h3><button class="property-title" data-property="${property.id}">${property.name}</button></h3><div class="property-specs"><span>${icon(property.type === 'fractional' ? 'pie' : 'bed')}${property.specs[0]}</span><span>${icon('area')}${property.specs[1]}</span></div><div class="property-bottom"><span class="property-price">${property.price}<small>${property.unit}</small></span><button class="property-detail-link" data-property="${property.id}" aria-label="View details for ${property.name}">${icon('arrow-up-right')}</button></div></div></article>`;
}
function renderProperties() {
  const matches = filterProperties(activeFilter, document.querySelector('#city-filter').value);
  const shown = expanded ? matches : matches.slice(0, 3);
  grid.innerHTML = shown.length ? shown.map(propertyCard).join('') : '<div class="empty-state"><h3>A fresh start?</h3><p>No properties match this pathway and location. Try exploring the full collection.</p><button class="button button-small" data-reset-filters>Show all properties</button></div>';
  document.querySelector('#results-count').textContent = `Showing ${shown.length} of ${matches.length} illustrative properties`;
  const showMore = document.querySelector('#show-more'); showMore.hidden = matches.length <= 3;
  showMore.innerHTML = `${expanded ? 'Show fewer properties' : 'View the full collection'} ${icon('arrow-right')}`;
  grid.setAttribute('aria-labelledby', `tab-${activeFilter}`);
  updateSaved();
}
function setFilter(type) {
  activeFilter = type; expanded = false;
  document.querySelectorAll('[data-filter]').forEach(button => {
    const selected = button.dataset.filter === type;
    button.setAttribute('aria-selected', selected); button.tabIndex = selected ? 0 : -1;
  });
  renderProperties();
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
document.querySelector('[role=tablist]').addEventListener('keydown', event => {
  const buttons = [...document.querySelectorAll('[data-filter]')];
  let next = buttons.indexOf(document.activeElement);
  if (next < 0) return;
  if (event.key === 'ArrowRight') next = (next + 1) % buttons.length;
  else if (event.key === 'ArrowLeft') next = (next + buttons.length - 1) % buttons.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = buttons.length - 1;
  else return;
  event.preventDefault(); buttons[next].focus(); setFilter(buttons[next].dataset.filter);
});
document.querySelector('#city-filter').addEventListener('change', () => { expanded = false; renderProperties(); });
document.querySelector('#show-more').addEventListener('click', () => { expanded = !expanded; renderProperties(); });
let dialogOpener;
function openDialog(content) {
  if (!dialog.open) dialogOpener = document.activeElement;
  closeMenu();
  dialogContent.innerHTML = content;
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0; document.documentElement.classList.add('modal-open'); document.body.classList.add('modal-open');
}
dialog.addEventListener('close', () => {
  document.documentElement.classList.remove('modal-open');
  document.body.classList.remove('modal-open');
  // Do not steal focus from the enquiry form after a dialog handoff.
  if (document.activeElement === document.body || dialog.contains(document.activeElement)) {
    dialogOpener?.focus({ preventScroll: true });
  }
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
function openProperty(id) {
  const property = properties.find(item => item.id === id);
  if (!property) return;
  openDialog(`<img class="dialog-image" src="${assets[property.image]}" alt="${property.name}"><div class="dialog-body"><div class="eyebrow">${property.badge} · ${property.city}</div><h2 id="dialog-title">${property.name}</h2><p>${property.description}</p><div class="dialog-facts">${property.facts.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div><div class="property-price">${property.price}<small>${property.unit}</small></div><p class="dialog-notice">Illustrative listing. Availability, documentation, and pricing have not been verified. No booking or payment is taken on this website.</p><div class="dialog-actions"><button class="button" data-enquire="${id}">Ask about this property ${icon('arrow-up-right')}</button><button class="text-link" data-download="${id}">Save overview ${icon('download')}</button></div></div>`);
}
function downloadText(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
document.addEventListener('click', event => {
  const propertyButton = event.target.closest('[data-property]');
  if (propertyButton) openProperty(propertyButton.dataset.property);
  const saveButton = event.target.closest('[data-save]');
  if (saveButton) {
    const id = saveButton.dataset.save; saved.has(id) ? saved.delete(id) : saved.add(id);
    let persisted = true; try { localStorage.setItem('nextnest-saved', JSON.stringify([...saved])); } catch { persisted = false; }
    updateSaved(); toast(saved.has(id) ? (persisted ? 'Added to your saved properties' : 'Saved for this visit') : 'Removed from saved properties');
  }
  const pathway = event.target.closest('[data-pathway]');
  if (pathway) { document.querySelector('#city-filter').value = 'all'; setFilter(pathway.dataset.pathway); }
  const reset = event.target.closest('[data-reset-filters]');
  if (reset) { document.querySelector('#city-filter').value = 'all'; setFilter('all'); document.querySelector('#tab-all').focus(); }
  const enquiry = event.target.closest('[data-enquire]');
  if (enquiry) {
    const property = properties.find(p => p.id === enquiry.dataset.enquire);
    document.querySelector('#enquiry-property').value = property.name;
    document.querySelector(`#enquiry-form input[value="${property.type}"]`).checked = true;
    document.querySelector('#city').value = property.city;
    dialog.close(); document.querySelector('#contact').scrollIntoView({ behavior: 'auto' });
    document.querySelector('#name').focus({ preventScroll: true });
  }
  const interest = event.target.closest('[data-interest]');
  if (interest) document.querySelector(`#enquiry-form input[value="${interest.dataset.interest}"]`).checked = true;
  const download = event.target.closest('[data-download]');
  if (download) {
    const property = properties.find(p => p.id === download.dataset.download);
    downloadText(`squaremint-${property.id}.txt`, `SQUAREMINT — ILLUSTRATIVE PROPERTY OVERVIEW\n\n${property.name}\n${property.location}, ${property.city}\n${property.badge}\n${property.price} ${property.unit}\n\n${property.description}\n\n${property.facts.map(([key, value]) => `${key}: ${value}`).join('\n')}\n\nThis is a concept listing, not a verified offer, title report, or investment document. Confirm pricing, availability, fees, legal documentation, and terms before making a decision.`);
  }
});
document.querySelector('.saved-trigger').addEventListener('click', () => {
  const items = properties.filter(property => saved.has(property.id));
  openDialog(`<div class="dialog-body policy-body"><div class="eyebrow">A LITTLE INSPIRATION, KEPT CLOSE.</div><h2 id="dialog-title">Your saved places.</h2><p>${items.length ? 'Your shortlist is stored in this browser. Take another look.' : 'A good place to start. Tap the heart on any property to keep it here.'}</p><div class="saved-list">${items.map(property => `<button class="saved-item" data-property="${property.id}"><img src="${assets[property.image]}" alt=""><div><strong>${property.name}</strong><span>${property.location} · ${property.price} ${property.unit}</span></div></button>`).join('')}</div></div>`);
});
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() { mobileNav.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); menuButton.innerHTML = icon('menu'); }
menuButton.addEventListener('click', () => { const isOpen = menuButton.getAttribute('aria-expanded') === 'true'; if (isOpen) closeMenu(); else { mobileNav.hidden = false; menuButton.setAttribute('aria-expanded', 'true'); menuButton.setAttribute('aria-label', 'Close navigation'); menuButton.innerHTML = icon('x'); } });
mobileNav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('click', event => {
  if (!mobileNav.hidden && !event.target.closest('.site-header')) closeMenu();
});
document.addEventListener('focusin', event => {
  if (!mobileNav.hidden && !event.target.closest('.site-header')) closeMenu();
});
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuButton.focus(); } });
window.matchMedia('(min-width: 1051px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

const slider = document.querySelector('#shares');
const shareVisual = document.querySelector('#share-visual');
shareVisual.innerHTML = '<span></span>'.repeat(100);
function updateCalculator(value) {
  const result = calculateShares(value); slider.value = result.shares;
  document.querySelector('#share-count').textContent = result.shares;
  document.querySelector('#investment').textContent = formatMoney(result.investment);
  document.querySelector('#ownership').textContent = result.ownership + '%';
  document.querySelector('#income').textContent = formatMoney(result.quarterlyIncome);
  document.querySelector('#shares-minus').disabled = result.shares === 1;
  document.querySelector('#shares-plus').disabled = result.shares === 100;
  slider.setAttribute('aria-valuetext', `${result.shares} shares, ${formatMoney(result.investment)} investment`);
  [...shareVisual.children].forEach((cell, index) => cell.classList.toggle('owned', index < result.shares));
}
slider.addEventListener('input', () => updateCalculator(slider.value));
document.querySelector('#shares-minus').addEventListener('click', () => updateCalculator(Number(slider.value) - 1));
document.querySelector('#shares-plus').addEventListener('click', () => updateCalculator(Number(slider.value) + 1));
updateCalculator(slider.value);
renderProperties();

const policies = {
  privacy: '<h3>Your information</h3><p>The enquiry form requests your name, email, preferred city, and property interest. If email delivery is configured, submitting sends those details to the site operator via Resend for a response to your enquiry. This site does not create an account.</p><h3>On your device</h3><p>Saved properties stay in your browser’s local storage. Use the heart button to remove them or clear site data in your browser. Downloaded enquiries and overviews stay on your device; the download does not send a message.</p><h3>External services</h3><p>Fonts are loaded from Google Fonts and property imagery from Google-hosted URLs supplied with the design. These providers receive the network information required to serve their assets. Cloudflare processes requests when this website is deployed on its platform.</p><h3>Before public launch</h3><p>This is a concept website. The operator must publish its identity, contact details, applicable retention periods, and a process for privacy requests before collecting real enquiries.</p>',
  terms: '<h3>An illustrative experience</h3><p>The listings, prices, ownership structures, and financial examples on this website are illustrative design content. They do not constitute verified property offers, legal advice, or investment recommendations.</p><h3>No online transaction</h3><p>This website does not accept deposits, sell shares, or enter into rental or purchase agreements. Sending an enquiry does not reserve a property or create a commitment.</p><h3>Review before deciding</h3><p>Actual opportunities depend on availability, verification, eligibility, and signed agreements. Investment values and income can fall. Exits are not guaranteed, and fees and taxes can affect outcomes.</p>'
};
document.querySelectorAll('[data-policy]').forEach(button => button.addEventListener('click', () => openDialog(`<div class="dialog-body policy-body"><div class="eyebrow">THE DETAILS MATTER.</div><h2 id="dialog-title">${button.dataset.policy === 'privacy' ? 'Your privacy.' : 'A few things to know.'}</h2>${policies[button.dataset.policy]}</div>`)));
const form = document.querySelector('#enquiry-form');
const status = document.querySelector('#form-status');
const submit = document.querySelector('#submit-enquiry');
function enquiryData() { return Object.fromEntries(new FormData(form)); }
form.addEventListener('submit', async event => {
  event.preventDefault(); if (!form.reportValidity()) return;
  submit.disabled = true; submit.textContent = 'Sending your enquiry…'; status.hidden = true; document.querySelector('#download-enquiry').hidden = true;
  try {
    const response = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(enquiryData()), signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Your enquiry could not be sent. Please try again.');
    status.classList.remove('error'); status.textContent = 'Your enquiry has been sent. Thank you for sharing your next chapter with us.'; status.hidden = false;
    form.reset(); document.querySelector('#enquiry-property').value = '';
  } catch (error) {
    status.classList.add('error'); status.textContent = error.name === 'TimeoutError' ? 'The request timed out. Delivery could not be confirmed. You can download your enquiry below.' : (error instanceof SyntaxError || error instanceof TypeError ? 'Enquiry delivery is unavailable. You can download your enquiry below.' : error.message);
    status.hidden = false; document.querySelector('#download-enquiry').hidden = false;
  } finally { submit.disabled = false; submit.innerHTML = `Let’s find my next chapter ${icon('arrow-up-right')}`; }
});
document.querySelector('#download-enquiry').addEventListener('click', () => {
  const data = enquiryData();
  downloadText('squaremint-enquiry.txt', `SQUAREMINT — YOUR ENQUIRY\n\nName: ${data.name}\nEmail: ${data.email}\nPreferred city: ${data.city}\nInterest: ${{buy: 'Buying a home', fractional: 'Fractional ownership', rto: 'Rent-to-own'}[data.interest]}\n${data.property ? `Property: ${data.property}\n` : ''}\nThis file is a local copy. Downloading it does not submit the enquiry.`);
});
