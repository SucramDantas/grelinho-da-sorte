
import { db, identity, reply, fail } from '../../../lib/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // Verificar se existe uma sessão válida.
    const who = await identity();

    // Apenas a organizadora pode reiniciar o jogo.
    if (!who || who.role !== 'admin') {
      return fail('Acesso não autorizado', 403);
    }

    // Exigir confirmação explícita.
    const body = await req.json();

    if (body.confirmacao !== 'REINICIAR') {
      return fail('Confirmação inválida', 400);
    }

    // Executar a reinicialização no Supabase.
    const { error } = await db().rpc(
      'reiniciar_jogo_servidor'
    );

    if (error) {
      console.error('Erro ao reiniciar o jogo:', error.message);
      return fail('Não foi possível reiniciar o jogo', 500);
    }

    return reply({
      ok: true,
      mensagem: 'Jogo reiniciado com sucesso!'
    });

  } catch (error) {
    console.error('Erro na reinicialização:', error);
    return fail('Erro interno do servidor', 500);
  }
}
