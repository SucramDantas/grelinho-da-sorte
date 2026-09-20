-- Executar UMA VEZ no SQL Editor. Não altera códigos já cadastrados.
CREATE OR REPLACE FUNCTION public.verificar_codigo_participante(p_codigo text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id uuid;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Acesso negado'; END IF;
 SELECT a.participante_id INTO v_id FROM public.acessos_participantes a
 WHERE a.ativo AND a.codigo_hash = extensions.crypt(p_codigo,a.codigo_hash) LIMIT 1;
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.verificar_codigo_participante(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.verificar_codigo_participante(text) TO service_role;
-- Finalização corrigida: somente desafio ativo e dentro do prazo pode ser cumprido.
CREATE OR REPLACE FUNCTION public.finalizar_rodada_servidor(p_rodada_id uuid,p_cumprido boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE r record; result text;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Acesso negado'; END IF;
 PERFORM pg_advisory_xact_lock(6969);
 SELECT * INTO r FROM public.rodadas WHERE id=p_rodada_id FOR UPDATE;
 IF NOT FOUND OR r.estado <> 'em_andamento' OR r.desafio_id IS NULL THEN RAISE EXCEPTION 'Rodada sem desafio ativo'; END IF;
 result:=CASE WHEN now()>=r.prazo_desafio THEN 'expirado' WHEN p_cumprido THEN 'cumprido' ELSE 'nao_cumprido' END;
 UPDATE public.rodadas SET estado=result WHERE id=r.id;
 UPDATE public.premios SET estado=CASE WHEN result='cumprido' THEN 'conquistado' ELSE 'disponivel' END,
 vencedor_id=CASE WHEN result='cumprido' THEN r.participante_id ELSE NULL END WHERE id=r.premio_id;
 INSERT INTO public.historico(rodada_id,participante_id,premio_id,desafio_id,resultado)
 VALUES(r.id,r.participante_id,r.premio_id,r.desafio_id,result);
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.finalizar_rodada_servidor(uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finalizar_rodada_servidor(uuid,boolean) TO service_role;
