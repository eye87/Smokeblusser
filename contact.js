const requestForm = document.querySelector('#request-form');
requestForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = new FormData(requestForm);
  const body = [...fields].map(([label, value]) => `${label}: ${value || 'Nog niet bekend'}`).join('\n');
  window.location.href = `mailto:info@smokeblusser.nl?subject=${encodeURIComponent('Aanvraag Smokeblusser — ' + (fields.get('Datum') || 'datum in overleg'))}&body=${encodeURIComponent(body)}`;
  document.querySelector('#request-status').textContent = 'Je aanvraag is klaargezet voor je e-mailapp, maar nog niet verstuurd. Verstuur de e-mail daar zelf of mail ons rechtstreeks. Je ingevulde gegevens blijven hier staan.';
});
