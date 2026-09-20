import {cookies} from 'next/headers';import {reply} from '../../../lib/server';
export async function POST(){(await cookies()).delete('grelinho_session');return reply({ok:true})}
