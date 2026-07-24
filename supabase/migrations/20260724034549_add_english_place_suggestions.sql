alter table public.place_suggestions
  add column name_en varchar(150),
  add column description_en varchar(1500);

alter table public.place_suggestions
  add constraint place_suggestions_name_en_length_check
    check (
      name_en is null
      or char_length(btrim(name_en)) between 2 and 150
    ),
  add constraint place_suggestions_description_en_length_check
    check (
      description_en is null
      or char_length(btrim(description_en)) between 20 and 1500
    );

comment on column public.place_suggestions.name_en is
  'Optional English name supplied by the user; approval falls back to the Spanish name.';

comment on column public.place_suggestions.description_en is
  'Optional English description supplied by the user; approval falls back to the Spanish description.';
