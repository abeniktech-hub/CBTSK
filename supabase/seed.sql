insert into public.campuses(code,name) values
  ('KUM','CBTS Kumba Campus'),
  ('NDU','CBTS Ndu Campus')
on conflict (code) do nothing;

insert into public.programmes(level,name,department) values
  ('Diploma','Diploma in Theology','Theology'),
  ('B.A.','Bachelor of Arts','Theology'),
  ('M.A.','Master of Arts','Theology')
on conflict (level,name,department) do nothing;

insert into public.admission_cycles(year,label,active) values
  (2026,'2026/2027',true),
  (2027,'2027/2028',true)
on conflict (year) do nothing;

insert into public.fees(programme_level,amount,currency) values
  ('Diploma',12000,'CFA'),
  ('B.A.',15000,'CFA'),
  ('M.A.',20000,'CFA')
on conflict (programme_level) do nothing;

insert into public.ministry_areas(name) values
  ('Pastoral ministry'),
  ('Teaching'),
  ('Chaplaincy'),
  ('Missions'),
  ('Administration')
on conflict (name) do nothing;

insert into public.quotes(text,author,source,translation,category,lang,rights_note,status)
values
  ('Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.',null,'Proverbs 3:5-6','KJV','biblical','en','King James Version; public domain','APPROVED'),
  ('Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.',null,'2 Timothy 2:15','KJV','biblical','en','King James Version; public domain','APPROVED'),
  ('Thy word is a lamp unto my feet, and a light unto my path.',null,'Psalm 119:105','KJV','biblical','en','King James Version; public domain','APPROVED'),
  ('And whatsoever ye do, do it heartily, as to the Lord, and not unto men;',null,'Colossians 3:23','KJV','biblical','en','King James Version; public domain','APPROVED'),
  ('I can do all things through Christ which strengtheneth me.',null,'Philippians 4:13','KJV','biblical','en','King James Version; public domain','APPROVED'),
  ('Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.',null,'Joshua 1:9','KJV','biblical','en','King James Version; public domain','APPROVED'),
  ('But watch thou in all things, endure afflictions, do the work of an evangelist, make full proof of thy ministry.',null,'2 Timothy 4:5','KJV','biblical','en','King James Version; public domain','APPROVED');
