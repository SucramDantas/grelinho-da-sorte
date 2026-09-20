
/* =========================================
   GRELINHO DA SORTE
   Controle principal do jogo
========================================= */

// ELEMENTOS E ESTADO DO JOGO

const $ = id => document.getElementById(id);

let state = null;
let busy = false;

const show = (id, on) => {
  $(id).classList.toggle('hidden', !on);
};

const msg = text => {
  $('message').textContent = text || '';
};


// COMUNICAÇÃO COM O SERVIDOR

async function api(path, body) {
  const response = await fetch('/api/' + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store'
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Erro de conexão');
  }

  return result;
}


// CONFIGURAÇÃO DAS ROLETAS

function wheel(id) {
  const element = $(id);

  element.innerHTML = '';

  for (let i = 0; i < 8; i++) {
    const label = document.createElement('span');

    label.className = 'slice-label';
    label.textContent = '✦';

    label.style.transform =
      `rotate(${i * 45 - 67.5}deg) translateX(8px)`;

    element.append(label);
  }
}


// ANIMAÇÃO DOS SORTEIOS

async function spin(id, task) {
  if (busy) return;

  busy = true;
  msg('');

  const element = $(id);

  try {
    const result = await task();

    element.style.transition = 'none';
    element.style.transform = 'rotate(0deg)';

    void element.offsetWidth;

    element.style.transition =
      'transform 3.5s cubic-bezier(.12,.72,.12,1)';

    element.style.transform =
      'rotate(' +
      (2160 + Math.floor(Math.random() * 360)) +
      'deg)';

    await new Promise(resolve => {
      setTimeout(resolve, 3700);
    });

    state = result.state;

    render();

  } catch (error) {
    msg(error.message);

  } finally {
    busy = false;
  }
}


// ATUALIZAÇÃO DO JOGO

async function refresh() {
  if (busy) return;

  try {
    state = await api('state');

    render();

  } catch (error) {
    state = null;

    show('login', true);
    show('main', false);

    msg(error.message);
  }
}


// EXIBIÇÃO DO JOGO

function render() {
  if (!state) return;

  show('login', false);
  show('main', true);

  $('greeting').textContent = state.nome;

  $('prizeCount').textContent =
    state.prizesAvailable + ' prêmios disponíveis';

  $('dareCount').textContent =
    state.daresAvailable + ' desafios inéditos restantes';

  const a = state.active;
  const admin = state.role === 'admin';


  // PAINEL DAS PARTICIPANTES

  show(
    'prizeStep',
    !admin &&
    !a &&
    !state.won &&
    state.prizesAvailable > 0
  );

  show('prizeReveal', !!a);

  show(
    'dareStep',
    !!a &&
    a.estado === 'aguardando_desafio' &&
    !admin
  );

  show(
    'challenge',
    !!a && a.estado === 'em_andamento'
  );


  // PAINEL DA ORGANIZADORA

  // Permanece visível mesmo sem rodada ativa.

  show('admin', admin);

  show('waiting', admin && !a);

  show(
    'won',
    !admin && state.won && !a
  );

  show(
    'noActive',
    !admin &&
    !a &&
    !state.won &&
    state.prizesAvailable === 0
  );


  // CONTROLES ADMINISTRATIVOS

  $('success').disabled = !a;
  $('fail').disabled = !a;
  $('rerollDare').disabled = !a;

  if ($('resetGame')) {
    $('resetGame').disabled = !admin || busy;
  }


  // INFORMAÇÕES DA RODADA ATIVA

  if (a) {
    $('prizeImg').src =
      a.premio?.imagem_url || '';

    $('prizeName').textContent =
      a.premio?.nome || 'Prêmio';

    $('dareTitle').textContent =
      a.desafio?.titulo || '';

    $('dareText').textContent =
      a.desafio?.bonus
        ? 'O grupo escolhe a tarefa verbalmente.'
        : a.desafio?.descricao || '';

    $('adminName').textContent =
      admin ? 'Rodada em andamento' : '';


    // VERIFICAR PRAZO DO DESAFIO

    const prazoExpirado =
      Date.now() >= Date.parse(a.prazo || 0);

    $('success').disabled =
      !a.desafio || prazoExpirado;

    $('rerollDare').disabled =
      !a.desafio || prazoExpirado;

  } else {
    $('adminName').textContent = '';
  }

  tick();
}


// CRONÔMETRO DO DESAFIO

function tick() {
  const a = state?.active;

  if (
    !a?.prazo ||
    a.estado !== 'em_andamento'
  ) {
    return;
  }

  const left = Math.max(
    0,
    Math.ceil(
      (Date.parse(a.prazo) - Date.now()) / 1000
    )
  );

  const minutes =
    String(Math.floor(left / 60)).padStart(2, '0');

  const seconds =
    String(left % 60).padStart(2, '0');

  $('time').textContent =
    minutes + ':' + seconds;

  if (left === 0 && state.role === 'admin') {
    $('success').disabled = true;
  }
}


// LOGIN

$('loginButton').onclick = async () => {
  try {
    await api('login', {
      role: $('role').value,
      code: $('code').value
    });

    $('code').value = '';

    msg('');

    await refresh();

  } catch (error) {
    msg(error.message);
  }
};


// LOGOUT

$('logout').onclick = async () => {
  try {
    await api('logout', {});

    state = null;

    show('login', true);
    show('main', false);

    msg('');

  } catch (error) {
    msg(error.message);
  }
};


// SORTEAR PRÊMIO

$('spinPrize').onclick = () => {
  spin(
    'prizeWheel',
    () => api('action', {
      action: 'prize'
    })
  );
};


// SORTEAR DESAFIO

$('spinDare').onclick = () => {
  if (!state?.active) return;

  spin(
    'dareWheel',
    () => api('action', {
      action: 'dare',
      roundId: state.active.id
    })
  );
};


// COMANDOS DA ORGANIZADORA

for (const [id, action] of [
  ['success', 'success'],
  ['fail', 'fail'],
  ['rerollDare', 'reroll']
]) {

  $(id).onclick = async () => {

    if (busy || !state?.active) return;

    if (
      action === 'reroll' &&
      !confirm(
        'Descartar este desafio e sortear outro? ' +
        'O desafio anterior não volta à roleta.'
      )
    ) {
      return;
    }

    busy = true;

    try {
      const result = await api('action', {
        action,
        roundId: state.active.id
      });

      state = result.state;

      msg('');

      render();

    } catch (error) {
      msg(error.message);

    } finally {
      busy = false;
    }
  };
}


// ALTERAR TIPO DE ACESSO

$('role').onchange = () => {

  $('codeLabel').textContent =
    $('role').value === 'admin'
      ? 'PIN da organizadora'
      : 'Código individual';

};


// =========================================
// REINICIAR JOGO
// EXCLUSIVO DA ORGANIZADORA
// =========================================

$('resetGame').onclick = async () => {

  // Impedir execução durante outra operação.

  if (busy || state?.role !== 'admin') {
    return;
  }


  // PRIMEIRA CONFIRMAÇÃO

  const confirmacao = prompt(
    'ATENÇÃO!\n\n' +
    'Esta ação irá reiniciar todos os sorteios, ' +
    'devolver os prémios à roleta e disponibilizar ' +
    'novamente todos os desafios.\n\n' +
    'Os códigos das participantes, fotografias ' +
    'e cadastros serão preservados.\n\n' +
    'Digite REINICIAR para confirmar:'
  );

  if (confirmacao !== 'REINICIAR') {

    if (confirmacao !== null) {
      msg('Reinicialização cancelada.');
    }

    return;
  }


  // SEGUNDA CONFIRMAÇÃO

  const confirmar = confirm(
    'ÚLTIMA CONFIRMAÇÃO!\n\n' +
    'Deseja realmente apagar o progresso de todas ' +
    'as participantes e reiniciar o jogo?\n\n' +
    'Esta ação não poderá ser desfeita.'
  );

  if (!confirmar) return;


  // EXECUTAR REINICIALIZAÇÃO

  busy = true;

  $('resetGame').disabled = true;

  try {

    const result = await api('reiniciar', {
      confirmacao: 'REINICIAR'
    });

    if (!result.ok) {
      throw new Error(
        'Não foi possível reiniciar o jogo.'
      );
    }


    // ATUALIZAR O ESTADO DO JOGO

    state = await api('state');

    render();

    msg('Jogo reiniciado com sucesso! 💗');

  } catch (error) {

    msg(error.message);

  } finally {

    busy = false;

    $('resetGame').disabled = false;

  }

};


// =========================================
// INICIALIZAÇÃO
// =========================================

// Preparar as roletas.

wheel('prizeWheel');
wheel('dareWheel');

// Carregar o estado inicial.

refresh();

// Sincronizar o jogo a cada 5 segundos.

setInterval(() => {
  tick();
  refresh();
}, 5000);
