import {identity,expire,getState,reply,fail} from '../../../lib/server';
export const dynamic='force-dynamic';
export async function GET(){try{const who=await identity();if(!who)return fail('Entre com seu código',401);await expire();return reply(await getState(who))}catch(e){return fail(e.message,500)}}
