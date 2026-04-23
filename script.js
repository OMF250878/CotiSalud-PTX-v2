// ─── Contadores dinámicos ────────────────────────────────────
var hijoCounter = 0;

// ─── Utilidades ──────────────────────────────────────────────
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function fmt(n) {
  return Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso) {
  var d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Radio pills ──────────────────────────────────────────────
function setupPills(name, ids) {
  var inputs = document.querySelectorAll('input[name="' + name + '"]');
  inputs.forEach(function(inp) {
    inp.addEventListener('change', function() {
      ids.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.classList.remove('selected');
      });
      inp.closest('.rpill').classList.add('selected');
    });
  });
}

// ─── Navegación entre vistas ──────────────────────────────────
function showForm() {
  document.getElementById('page-form').classList.add('active');
  document.getElementById('page-results').classList.remove('active');
  window.scrollTo(0, 0);
}

function showResults() {
  document.getElementById('page-form').classList.remove('active');
  document.getElementById('page-results').classList.add('active');
  window.scrollTo(0, 0);
}

// ─── Tarjetas dinámicas ───────────────────────────────────────
function createConyugeCard() {
  var d = document.createElement('div');
  d.className = 'mcard';
  d.id = 'conyugeCard';
  var id1 = 'cony-h-' + Date.now();
  var id2 = 'cony-m-' + Date.now();
  d.innerHTML =
    '<div class="mcard__header">' +
      '<span class="mcard__title">Cónyuge</span>' +
      '<button type="button" class="btn-remove-m" onclick="removeConyuge(this)">Eliminar</button>' +
    '</div>' +
    '<div class="g2">' +
      '<div class="fg"><label>Edad</label><input type="number" name="conyuge-edad" min="18" max="100" placeholder="Edad" required/></div>' +
      '<div class="fg"><label>Sexo</label><div class="radio-row">' +
        '<label class="rpill selected" id="' + id1 + '"><input type="radio" name="conyuge-sexo" value="HOMBRE" checked required/>Hombre</label>' +
        '<label class="rpill" id="' + id2 + '"><input type="radio" name="conyuge-sexo" value="MUJER" required/>Mujer</label>' +
      '</div></div>' +
    '</div>';
  setTimeout(function() { setupPills('conyuge-sexo', [id1, id2]); }, 0);
  return d;
}

function createHijoCard(num) {
  var d = document.createElement('div');
  d.className = 'mcard';
  var id1 = 'hijo-h-' + num;
  var id2 = 'hijo-m-' + num;
  d.innerHTML =
    '<div class="mcard__header">' +
      '<span class="mcard__title">Hijo ' + num + '</span>' +
      '<button type="button" class="btn-remove-m" onclick="this.closest(\'.mcard\').remove()">Eliminar</button>' +
    '</div>' +
    '<div class="g2">' +
      '<div class="fg"><label>Edad</label><input type="number" name="hijo-edad-' + num + '" min="0" max="25" placeholder="Edad" required/></div>' +
      '<div class="fg"><label>Sexo</label><div class="radio-row">' +
        '<label class="rpill selected" id="' + id1 + '"><input type="radio" name="hijo-sexo-' + num + '" value="HOMBRE" checked required/>Hombre</label>' +
        '<label class="rpill" id="' + id2 + '"><input type="radio" name="hijo-sexo-' + num + '" value="MUJER" required/>Mujer</label>' +
      '</div></div>' +
    '</div>';
  setTimeout(function() { setupPills('hijo-sexo-' + num, [id1, id2]); }, 0);
  return d;
}

function removeConyuge(btn) {
  btn.closest('.mcard').remove();
  var b = document.getElementById('addConyuge');
  b.disabled = false;
  b.textContent = '+ Cónyuge';
}

// ─── Recolección del formulario ───────────────────────────────
function collectFormData() {
  var asegurados = [];

  asegurados.push({
    edad: parseInt(document.getElementById('titular-edad').value, 10),
    sexo: document.querySelector('input[name="titular-sexo"]:checked').value,
    perfil: 'TITULAR'
  });

  var cEdad = document.querySelector('input[name="conyuge-edad"]');
  if (cEdad && cEdad.value) {
    asegurados.push({
      edad: parseInt(cEdad.value, 10),
      sexo: document.querySelector('input[name="conyuge-sexo"]:checked').value,
      perfil: 'TITULAR'
    });
  }

  document.querySelectorAll('input[name^="hijo-edad-"]').forEach(function(input) {
    var idx = input.name.split('-')[2];
    var sexoEl = document.querySelector('input[name="hijo-sexo-' + idx + '"]:checked');
    if (input.value && sexoEl) {
      asegurados.push({ edad: parseInt(input.value, 10), sexo: sexoEl.value, perfil: 'DEPENDIENTE' });
    }
  });

  return {
    id: generateUUID(),
    continuidad: document.querySelector('input[name="continuidad"]:checked').value,
    internacional: document.querySelector('input[name="cobertura"]:checked').value === 'true',
    aseguradora: document.getElementById('aseguradora').value,
    nombre: document.getElementById('nombre').value.trim().toUpperCase(),
    apellidos: document.getElementById('apellidos').value.trim().toUpperCase(),
    email: document.getElementById('email').value.trim().toLowerCase(),
    asegurados: asegurados
  };
}

// ─── Render de resultados ─────────────────────────────────────
var currentResultsData = [];
var currentMeta = {};

function renderResults(meta, data) {
  currentMeta = meta;
  currentResultsData = data;

  document.getElementById('resultsMeta').innerHTML =
    '<strong>' + meta.nombre + ' ' + meta.apellidos + '</strong> &nbsp;·&nbsp; ' + meta.email +
    '<br>' + fmtDate(meta.fecha) + ' &nbsp;·&nbsp; ' + (meta.broker || 'Protexa Corredores de Seguros SAC');

  // Sidebar: checkboxes por aseguradora
  var uniqueIns = {};
  data.forEach(function(p) { uniqueIns[p.aseguradora] = true; });
  var insList = Object.keys(uniqueIns).sort();

  var fDiv = document.getElementById('filterIns');
  fDiv.innerHTML = '';
  insList.forEach(function(ins) {
    var lbl = document.createElement('label');
    lbl.className = 'f-item';
    lbl.innerHTML =
      '<input type="checkbox" value="' + ins + '" checked onchange="filterGrid()"> ' +
      '<span class="f-label">' + ins + '</span>';
    fDiv.appendChild(lbl);
  });

  filterGrid();
}

function filterGrid() {
  var allowed = [];
  document.querySelectorAll('#filterIns input:checked').forEach(function(cb) {
    allowed.push(cb.value);
  });

  var grid = document.getElementById('resultsGrid');
  grid.innerHTML = '';

  var grupos = {};
  currentResultsData.forEach(function(p) {
    if (allowed.indexOf(p.aseguradora) !== -1) {
      if (!grupos[p.aseguradora]) grupos[p.aseguradora] = [];
      grupos[p.aseguradora].push(p);
    }
  });

  if (Object.keys(grupos).length === 0) {
    grid.innerHTML = '<div style="color:var(--muted);font-size:.85rem;padding:2rem 0;">No hay resultados con los filtros actuales.</div>';
    return;
  }

  Object.keys(grupos).forEach(function(ins) {
    var planes = grupos[ins];
    planes.sort(function(a, b) { return (a.total_anual || 0) - (b.total_anual || 0); });

    var row = document.createElement('div');
    row.className = 'ins-row';
    row.innerHTML = '<div class="ins-label">' + ins + '</div><div class="ins-cards"></div>';
    var cards = row.querySelector('.ins-cards');

    planes.forEach(function(p) {
      var rows = '';
      if (Array.isArray(p.prima_por_asegurado)) {
        p.prima_por_asegurado.forEach(function(r, i) {
          rows += '<li><span class="pl-label">Asegurado ' + (i + 1) + ' · ' + r.edad + ' años</span><span class="pl-val">S/ ' + fmt(r.prima) + '</span></li>';
        });
      }
      var listHTML = '';
      if (rows !== '') {
        listHTML =
          '<div class="pcard__toggle" onclick="this.nextElementSibling.classList.toggle(\'visible\');this.textContent=this.nextElementSibling.classList.contains(\'visible\')?\'- Ocultar detalle\':\'+ Prima por persona\'">+ Prima por persona</div>' +
          '<ul class="pcard__list">' + rows + '</ul>';
      }

      var c = document.createElement('div');
      c.className = 'pcard';
      c.innerHTML =
        '<div class="pcard__name">' + p.plan + '</div>' +
        '<div class="pcard__price-wrap">' +
          '<div class="pcard__price">S/ ' + fmt(p.total_mensual) + '</div>' +
          '<div class="pcard__price-label">prima mensual estimada</div>' +
          '<div class="pcard__annual">S/ ' + fmt(p.total_anual) + ' al año</div>' +
        '</div>' +
        listHTML;
      cards.appendChild(c);
    });

    grid.appendChild(row);
  });
}

// ─── Email ────────────────────────────────────────────────────
var emailRetryCount = 0;
var MAX_RETRIES = 3;

async function sendEmail() {
  var btn = document.getElementById('emailBtn');
  var bar = document.getElementById('emailBar');

  if (!currentMeta || !currentMeta.email) {
    bar.style.display = 'block';
    bar.className = 'email-bar err';
    bar.textContent = 'No hay datos de cotización para enviar.';
    return;
  }

  var months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  var d = currentMeta.fecha ? new Date(currentMeta.fecha) : new Date();
  var quoteDate = d.getDate() + ' de ' + months[d.getMonth()] + ' de ' + d.getFullYear();

  var payload = {
    client_name: currentMeta.nombre || '',
    client_lastname: currentMeta.apellidos || '',
    client_email: currentMeta.email || '',
    lista_asegurados: currentResultsData || [],
    quote_date: quoteDate
  };

  btn.disabled = true;
  btn.textContent = 'Enviando...';
  bar.style.display = 'block';
  bar.className = 'email-bar';
  bar.textContent = 'Enviando cotización por correo...';

  try {
    var response = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Error ' + response.status);

    emailRetryCount = 0;
    btn.textContent = '✓ Enviado';
    bar.className = 'email-bar ok';
    bar.textContent = '✓ Cotización enviada exitosamente a ' + currentMeta.email;

  } catch (err) {
    emailRetryCount++;
    btn.disabled = false;
    btn.textContent = 'Enviar por email';
    bar.className = 'email-bar err';
    if (emailRetryCount < MAX_RETRIES) {
      bar.textContent = '✗ Error al enviar. Intento ' + emailRetryCount + '/' + MAX_RETRIES + '. Puedes reintentar.';
    } else {
      bar.textContent = '✗ No se pudo enviar después de varios intentos. Contacta a soporte.';
    }
  }
}

// ─── Submit del formulario ────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {

  setupPills('continuidad', ['rpill-si', 'rpill-no']);
  setupPills('cobertura', ['rpill-nac', 'rpill-int']);
  setupPills('titular-sexo', ['rpill-h', 'rpill-m']);

  document.getElementById('addConyuge').addEventListener('click', function() {
    if (document.getElementById('conyugeCard')) return;
    document.getElementById('conyugeContainer').appendChild(createConyugeCard());
    this.disabled = true;
    this.textContent = '✓ Cónyuge agregado';
  });

  document.getElementById('addHijo').addEventListener('click', function() {
    hijoCounter++;
    document.getElementById('hijosContainer').appendChild(createHijoCard(hijoCounter));
  });

  document.getElementById('cotizadorForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    var nombre = document.getElementById('nombre').value.trim();
    var apellidos = document.getElementById('apellidos').value.trim();
    var email = document.getElementById('email').value.trim();
    var titularEdad = document.getElementById('titular-edad').value;
    var titularSexo = document.querySelector('input[name="titular-sexo"]:checked');

    if (!nombre || !apellidos || !email || !titularEdad || !titularSexo) {
      alert('Completa todos los campos requeridos.');
      return;
    }

    var payload = collectFormData();

    var btn = document.getElementById('submitBtn');
    var statusBar = document.getElementById('statusBar');
    btn.disabled = true;
    btn.textContent = 'Procesando...';
    document.getElementById('loader').classList.add('visible');
    statusBar.style.display = 'none';

    try {
      var response = await fetch('/api/cotizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Error ' + response.status);

      var data = await response.json();

      var meta = {
        nombre: payload.nombre,
        apellidos: payload.apellidos,
        email: payload.email,
        fecha: new Date().toISOString(),
        broker: 'Protexa Corredores de Seguros SAC'
      };

      // Reset email state
      emailRetryCount = 0;
      var emailBtn = document.getElementById('emailBtn');
      emailBtn.disabled = false;
      emailBtn.textContent = 'Enviar por email';
      var emailBar = document.getElementById('emailBar');
      emailBar.style.display = 'none';

      renderResults(meta, Array.isArray(data) ? data : (data.data || []));
      showResults();

    } catch (err) {
      statusBar.style.display = 'block';
      statusBar.className = 'status-bar visible';
      statusBar.textContent = 'Error al obtener la cotización. Inténtalo nuevamente.';
    } finally {
      document.getElementById('loader').classList.remove('visible');
      btn.disabled = false;
      btn.textContent = 'Cotizar ahora →';
    }
  });
});
