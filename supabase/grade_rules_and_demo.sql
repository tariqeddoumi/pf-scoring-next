-- Seed: règles de grading + exemple minimal de critères/options

insert into public.app_settings(key, value) values
('grade_rules', jsonb_build_object(
  'buckets', jsonb_build_array(
    jsonb_build_object('min',0.85,'max',1.0 ,'grade','A','pd',0.0020),
    jsonb_build_object('min',0.75,'max',0.85,'grade','B','pd',0.0040),
    jsonb_build_object('min',0.65,'max',0.75,'grade','C','pd',0.0100),
    jsonb_build_object('min',0.55,'max',0.65,'grade','D','pd',0.0200),
    jsonb_build_object('min',0.00,'max',0.55,'grade','E','pd',0.0500)
  )
))
on conflict (key) do update set value = excluded.value, updated_at = now();

insert into public.score_domains(code,label,weight,order_idx) values
('D1','Fondamentaux du projet',1.0,1)
on conflict (code) do nothing;

insert into public.score_criteria(domain_id,code,label,weight,input_type,order_idx)
select d.id,'D1.C1','Maturité des études',0.6,'select',1 from public.score_domains d where d.code='D1'
union all
select d.id,'D1.C2','Contrats clés signés',0.4,'yesno',2 from public.score_domains d where d.code='D1';

insert into public.score_options(criterion_id,value_label,score,order_idx)
select c.id,'Études détaillées',1.00,1 from public.score_criteria c where c.code='D1.C1'
union all select c.id,'APS/AVP',0.70,2 from public.score_criteria c where c.code='D1.C1'
union all select c.id,'Pré-faisabilité',0.40,3 from public.score_criteria c where c.code='D1.C1';

insert into public.score_options(criterion_id,value_label,score,order_idx)
select c.id,'Oui',1.00,1 from public.score_criteria c where c.code='D1.C2'
union all select c.id,'Non',0.20,2 from public.score_criteria c where c.code='D1.C2';
