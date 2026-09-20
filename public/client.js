const $=id=>document.getElementById(id);let state=null,busy=false;const show=(id,on)=>$(id).classList.toggle('hidden',!on);const msg=t=>{$('message').textContent=t||''};
async function api(path,body){const r=await fetch('/api/'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store'});const x=await r.json();if(!r.ok)throw Error(x.error||'Erro de conexão');return x}
function wheel(id){const el=$(id);el.innerHTML='';for(let i=0;i<8;i++){const t=document.createElement('span');t.className='slice-label';t.textContent='✦';t.style.transform=`rotate(${i*45-67.5}deg) translateX(8px)`;el.append(t)}}
async function spin(id,task){if(busy)return;busy=true;msg('');const el=$(id);try{const result=await task();el.style.transition='none';el.style.transform='rotate(0deg)';void el.offsetWidth;el.style.transition='transform 3.5s cubic-bezier(.12,.72,.12,1)';el.style.transform='rotate('+(2160+Math.floor(Math.random()*360))+'deg)';await new Promise(r=>setTimeout(r,3700));state=result.state;render()}catch(e){msg(e.message)}finally{busy=false}}
async function refresh(){if(busy)return;try{state=await api('state');render()}catch(e){state=null;show('login',true);show('main',false);msg(e.message)}}
function render(){if(!state)return;show('login',false);show('main',true);$('greeting').textContent=state.nome;$('prizeCount').textContent=state.prizesAvailable+' prêmios disponíveis';$('dareCount').textContent=state.daresAvailable+' desafios inéditos restantes';const a=state.active,admin=state.role==='admin';show('prizeStep',!admin&&!a&&!state.won&&state.prizesAvailable>0);show('prizeReveal',!!a);show('dareStep',!!a&&a.estado==='aguardando_desafio'&&!admin);show('challenge',!!a&&a.estado==='em_andamento');show('admin',admin);show('waiting',admin&&!a);show('won',!admin&&state.won&&!a);show('noActive',!admin&&!a&&!state.won&&state.prizesAvailable===0);
$('success').disabled = !a;
$('fail').disabled = !a;
$('rerollDare').disabled = !a;$('prizeName').textContent=a.premio?.nome||'Prêmio';$('dareTitle').textContent=a.desafio?.titulo||'';$('dareText').textContent=a.desafio?.bonus?'O grupo escolhe a tarefa verbalmente.':a.desafio?.descricao||'';$('adminName').textContent=admin?'Rodada em andamento':'';$('success').disabled=!a.desafio||Date.now()>=Date.parse(a.prazo||0);$('rerollDare').disabled=!a.desafio||Date.now()>=Date.parse(a.prazo||0)}tick()}
function tick(){const a=state?.active;if(!a?.prazo||a.estado!=='em_andamento')return;const left=Math.max(0,Math.ceil((Date.parse(a.prazo)-Date.now())/1000));$('time').textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');if(left===0&&state.role==='admin')$('success').disabled=true}
$('loginButton').onclick=async()=>{try{await api('login',{role:$('role').value,code:$('code').value});$('code').value='';msg('');await refresh()}catch(e){msg(e.message)}};
$('logout').onclick=async()=>{await api('logout',{});state=null;show('login',true);show('main',false)};
$('spinPrize').onclick=()=>spin('prizeWheel',()=>api('action',{action:'prize'}));
$('spinDare').onclick=()=>spin('dareWheel',()=>api('action',{action:'dare',roundId:state.active.id}));
for(const [id,action] of [['success','success'],['fail','fail'],['rerollDare','reroll']])$(id).onclick=async()=>{if(busy||!state?.active)return;if(action==='reroll'&&!confirm('Descartar este desafio e sortear outro? O desafio anterior não volta à roleta.'))return;busy=true;try{const result=await api('action',{action,roundId:state.active.id});state=result.state;msg('');render()}catch(e){msg(e.message)}finally{busy=false}};
$('role').onchange=()=>{$('codeLabel').textContent=$('role').value==='admin'?'PIN da organizadora':'Código individual'};
wheel('prizeWheel');wheel('dareWheel');refresh();setInterval(()=>{tick();refresh()},5000);

/* REINICIAR JOGO - SOMENTE ORGANIZADORA */

$('resetGame').onclick = async () => {

  if (busy || state?.role !== 'admin') return;

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

  if (!confirm(
    'Última confirmação!\n\n' +
    'Deseja realmente apagar o progresso de todas ' +
    'as participantes e reiniciar o jogo?'
  )) return;

  busy = true;
  $('resetGame').disabled = true;

  try {

    const result = await api('reiniciar', {
      confirmacao: 'REINICIAR'
    });

    if (!result.ok) {
      throw new Error('Não foi possível reiniciar o jogo.');
    }

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
