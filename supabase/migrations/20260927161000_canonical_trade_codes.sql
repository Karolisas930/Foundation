-- Canonical trade codes: language-independent matching for jobs and contractor profiles.
CREATE TABLE IF NOT EXISTS public.trade_code_aliases (
  alias text PRIMARY KEY,
  code text NOT NULL
);
GRANT SELECT ON public.trade_code_aliases TO anon, authenticated;
GRANT ALL ON public.trade_code_aliases TO service_role;
ALTER TABLE public.trade_code_aliases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trade aliases are readable by everyone" ON public.trade_code_aliases;
CREATE POLICY "Trade aliases are readable by everyone" ON public.trade_code_aliases FOR SELECT USING (true);

INSERT INTO public.trade_code_aliases (alias, code) VALUES
  ('electrical', 'electrical_systems_smart_home'),
  ('electrical engineering', 'electrical_systems_smart_home'),
  ('elektro', 'electrical_systems_smart_home'),
  ('elektrik', 'electrical_systems_smart_home'),
  ('elektriker', 'electrical_systems_smart_home'),
  ('elektrotechnik', 'electrical_systems_smart_home'),
  ('plumbing', 'plumbing_heating_hvac'),
  ('plumbing & heating', 'plumbing_heating_hvac'),
  ('sanitär', 'plumbing_heating_hvac'),
  ('heizung', 'plumbing_heating_hvac'),
  ('shk', 'plumbing_heating_hvac'),
  ('fundamente', 'basement_foundation_construction'),
  ('fundament', 'basement_foundation_construction'),
  ('mauerwerk', 'structural_building_masonry'),
  ('maurer', 'bricklaying_concrete'),
  ('beton', 'bricklaying_concrete'),
  ('sanierung', 'facade_exterior_renovation'),
  ('renovation', 'interior_finishing_fit_out'),
  ('roofing', 'roofing_waterproofing'),
  ('dach', 'roofing_waterproofing'),
  ('dachdecker', 'roofing_waterproofing'),
  ('carpentry', 'carpentry_timber_framing'),
  ('zimmerei', 'carpentry_timber_framing'),
  ('tischler', 'joinery_custom_cabinetry_doors'),
  ('schreiner', 'joinery_custom_cabinetry_doors'),
  ('painting', 'painting_decorating_facades'),
  ('painting & decorating', 'painting_decorating_facades'),
  ('maler', 'painting_decorating_facades'),
  ('tiling', 'tiling_mosaics_natural_stone'),
  ('tiling & stone', 'tiling_mosaics_natural_stone'),
  ('fliesen', 'tiling_mosaics_natural_stone'),
  ('landscaping', 'landscaping_patios_gardening'),
  ('garten', 'landscaping_patios_gardening'),
  ('solar', 'solar_photovoltaic_installation'),
  ('photovoltaik', 'solar_photovoltaic_installation'),
  ('trockenbau', 'drywall_insulation_plastering'),
  ('ev charging station & heat pump power hookups', 'ev_charging_station_heat_pump_power_hookups'),
  ('elektrotechnik & smart home', 'electrical_systems_smart_home'),
  ('sanitär, heizung & klima', 'plumbing_heating_hvac'),
  ('gas- & wasserinstallation', 'gas_water_installation'),
  ('kälte- & klimatechnik', 'refrigeration_air_conditioning_cooling_systems'),
  ('wallbox & wärmepumpen-installation', 'ev_charging_station_heat_pump_installation'),
  ('schornsteinfeger & energieberatung', 'chimney_sweeping_energy_auditing'),
  ('smart home & gebäudeautomation', 'smart_home_building_automation'),
  ('solar & photovoltaik', 'solar_photovoltaic_installation'),
  ('hochbau & mauerwerk', 'structural_building_masonry'),
  ('maurer- & betonarbeiten', 'bricklaying_concrete'),
  ('zimmerei & holzbau', 'carpentry_timber_framing'),
  ('dachdecker & abdichtung', 'roofing_waterproofing'),
  ('gerüstbau', 'scaffolding_services'),
  ('abbruch, aushub & erdarbeiten', 'demolition_excavation_groundworks'),
  ('keller- & fundamentbau', 'basement_foundation_construction'),
  ('dachausbau', 'loft_conversion_attic_renovation'),
  ('neubau & anbau', 'new_build_extension_specialist'),
  ('fassadensanierung', 'facade_exterior_renovation'),
  ('metallbau, tore & zäune', 'metalworking_gates_fencing'),
  ('wasser-, brand- & schimmelsanierung', 'water_fire_mold_damage_restoration'),
  ('glaserei & fensterbau', 'glazing_window_engineering'),
  ('fliesen, mosaik & naturstein', 'tiling_mosaics_natural_stone'),
  ('trockenbau, dämmung & putz', 'drywall_insulation_plastering'),
  ('maler & lackierer', 'painting_decorating_facades'),
  ('bodenbeläge & parkett', 'flooring_parquet_carpeting'),
  ('tischlerei & türen', 'joinery_custom_cabinetry_doors'),
  ('innenausbau', 'interior_finishing_fit_out'),
  ('gebäudereinigung', 'building_cleaning_property_services'),
  ('garten- & landschaftsbau', 'landscaping_patios_gardening'),
  ('hausmeister- & montageservice', 'general_handyman_assembly_services'),
  ('steinmetz & denkmalpflege', 'stonemasonry_monument_restoration'),
  ('klempnerei & dachentwässerung', 'sheet_metal_work_exterior_roof_drainage'),
  ('wärme-, kälte- & schallschutz', 'thermal_cold_sound_insulation'),
  ('bauwerksabdichtung & trocknung', 'building_waterproofing_structural_drying'),
  ('ofen- & kaminbau', 'tile_stove_fireplace_construction'),
  ('brunnenbau & geothermie', 'well_drilling_geothermal_exploration'),
  ('estricharbeiten', 'screed_floor_substrate_laying'),
  ('schlüsseldienst & sicherheitstechnik', 'locksmith_services_home_security_systems'),
  ('asbest- & schadstoffsanierung', 'asbestos_hazardous_material_remediation'),
  ('electrical systems & smart home', 'electrical_systems_smart_home'),
  ('electrical_systems_smart_home', 'electrical_systems_smart_home'),
  ('plumbing, heating & hvac', 'plumbing_heating_hvac'),
  ('plumbing_heating_hvac', 'plumbing_heating_hvac'),
  ('gas & water installation', 'gas_water_installation'),
  ('gas_water_installation', 'gas_water_installation'),
  ('refrigeration, air conditioning & cooling systems', 'refrigeration_air_conditioning_cooling_systems'),
  ('refrigeration_air_conditioning_cooling_systems', 'refrigeration_air_conditioning_cooling_systems'),
  ('ev charging station & heat pump installation', 'ev_charging_station_heat_pump_installation'),
  ('ev_charging_station_heat_pump_installation', 'ev_charging_station_heat_pump_installation'),
  ('chimney sweeping & energy auditing', 'chimney_sweeping_energy_auditing'),
  ('chimney_sweeping_energy_auditing', 'chimney_sweeping_energy_auditing'),
  ('smart home & building automation', 'smart_home_building_automation'),
  ('smart_home_building_automation', 'smart_home_building_automation'),
  ('solar & photovoltaic (pv) installation', 'solar_photovoltaic_installation'),
  ('solar_photovoltaic_installation', 'solar_photovoltaic_installation'),
  ('structural building & masonry', 'structural_building_masonry'),
  ('structural_building_masonry', 'structural_building_masonry'),
  ('bricklaying & concrete', 'bricklaying_concrete'),
  ('bricklaying_concrete', 'bricklaying_concrete'),
  ('carpentry & timber framing', 'carpentry_timber_framing'),
  ('carpentry_timber_framing', 'carpentry_timber_framing'),
  ('roofing & waterproofing', 'roofing_waterproofing'),
  ('roofing_waterproofing', 'roofing_waterproofing'),
  ('scaffolding services', 'scaffolding_services'),
  ('scaffolding_services', 'scaffolding_services'),
  ('demolition, excavation & groundworks', 'demolition_excavation_groundworks'),
  ('demolition_excavation_groundworks', 'demolition_excavation_groundworks'),
  ('basement & foundation construction', 'basement_foundation_construction'),
  ('basement_foundation_construction', 'basement_foundation_construction'),
  ('loft conversion & attic renovation', 'loft_conversion_attic_renovation'),
  ('loft_conversion_attic_renovation', 'loft_conversion_attic_renovation'),
  ('new build & extension specialist', 'new_build_extension_specialist'),
  ('new_build_extension_specialist', 'new_build_extension_specialist'),
  ('facade & exterior renovation', 'facade_exterior_renovation'),
  ('facade_exterior_renovation', 'facade_exterior_renovation'),
  ('metalworking, gates & fencing', 'metalworking_gates_fencing'),
  ('metalworking_gates_fencing', 'metalworking_gates_fencing'),
  ('water, fire & mold damage restoration', 'water_fire_mold_damage_restoration'),
  ('water_fire_mold_damage_restoration', 'water_fire_mold_damage_restoration'),
  ('glazing & window engineering', 'glazing_window_engineering'),
  ('glazing_window_engineering', 'glazing_window_engineering'),
  ('tiling, mosaics & natural stone', 'tiling_mosaics_natural_stone'),
  ('tiling_mosaics_natural_stone', 'tiling_mosaics_natural_stone'),
  ('drywall, insulation & plastering', 'drywall_insulation_plastering'),
  ('drywall_insulation_plastering', 'drywall_insulation_plastering'),
  ('painting, decorating & facades', 'painting_decorating_facades'),
  ('painting_decorating_facades', 'painting_decorating_facades'),
  ('flooring, parquet & carpeting', 'flooring_parquet_carpeting'),
  ('flooring_parquet_carpeting', 'flooring_parquet_carpeting'),
  ('joinery, custom cabinetry & doors', 'joinery_custom_cabinetry_doors'),
  ('joinery_custom_cabinetry_doors', 'joinery_custom_cabinetry_doors'),
  ('interior finishing & fit-out', 'interior_finishing_fit_out'),
  ('interior_finishing_fit_out', 'interior_finishing_fit_out'),
  ('building cleaning & property services', 'building_cleaning_property_services'),
  ('building_cleaning_property_services', 'building_cleaning_property_services'),
  ('landscaping, patios & gardening', 'landscaping_patios_gardening'),
  ('landscaping_patios_gardening', 'landscaping_patios_gardening'),
  ('general handyman & assembly services', 'general_handyman_assembly_services'),
  ('general_handyman_assembly_services', 'general_handyman_assembly_services'),
  ('stonemasonry & monument restoration', 'stonemasonry_monument_restoration'),
  ('stonemasonry_monument_restoration', 'stonemasonry_monument_restoration'),
  ('ev_charging_station_heat_pump_power_hookups', 'ev_charging_station_heat_pump_power_hookups'),
  ('sheet metal work & exterior roof drainage', 'sheet_metal_work_exterior_roof_drainage'),
  ('sheet_metal_work_exterior_roof_drainage', 'sheet_metal_work_exterior_roof_drainage'),
  ('thermal, cold & sound insulation', 'thermal_cold_sound_insulation'),
  ('thermal_cold_sound_insulation', 'thermal_cold_sound_insulation'),
  ('building waterproofing & structural drying', 'building_waterproofing_structural_drying'),
  ('building_waterproofing_structural_drying', 'building_waterproofing_structural_drying'),
  ('tile stove & fireplace construction', 'tile_stove_fireplace_construction'),
  ('tile_stove_fireplace_construction', 'tile_stove_fireplace_construction'),
  ('well drilling & geothermal exploration', 'well_drilling_geothermal_exploration'),
  ('well_drilling_geothermal_exploration', 'well_drilling_geothermal_exploration'),
  ('green roof & sustainable construction', 'green_roof_sustainable_construction'),
  ('green_roof_sustainable_construction', 'green_roof_sustainable_construction'),
  ('energy efficiency consulting', 'energy_efficiency_consulting'),
  ('energy_efficiency_consulting', 'energy_efficiency_consulting'),
  ('screed & floor substrate laying', 'screed_floor_substrate_laying'),
  ('screed_floor_substrate_laying', 'screed_floor_substrate_laying'),
  ('concrete core drilling & structural cutting', 'concrete_core_drilling_structural_cutting'),
  ('concrete_core_drilling_structural_cutting', 'concrete_core_drilling_structural_cutting'),
  ('locksmith services & home security systems', 'locksmith_services_home_security_systems'),
  ('locksmith_services_home_security_systems', 'locksmith_services_home_security_systems'),
  ('asbestos & hazardous material remediation', 'asbestos_hazardous_material_remediation'),
  ('asbestos_hazardous_material_remediation', 'asbestos_hazardous_material_remediation'),
  ('facility management & maintenance', 'facility_management_maintenance'),
  ('facility_management_maintenance', 'facility_management_maintenance'),
  ('construction logistics & material supply', 'construction_logistics_material_supply'),
  ('construction_logistics_material_supply', 'construction_logistics_material_supply')
ON CONFLICT (alias) DO UPDATE SET code = EXCLUDED.code;

-- Map any stored value to its code; unmapped values fall back to lowercased text.
CREATE OR REPLACE FUNCTION public.to_trade_code(_value text)
RETURNS text LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT CASE WHEN _value IS NULL OR btrim(_value) = '' THEN NULL ELSE
    COALESCE((SELECT code FROM public.trade_code_aliases WHERE alias = lower(btrim(_value))), lower(btrim(_value)))
  END
$$;

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS trade_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trade_codes text[];
CREATE INDEX IF NOT EXISTS idx_jobs_trade_code ON public.jobs (trade_code);
CREATE INDEX IF NOT EXISTS idx_profiles_trade_codes ON public.profiles USING gin (trade_codes);

CREATE OR REPLACE FUNCTION public.jobs_set_trade_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.trade_code := public.to_trade_code(NEW.trade);
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.profiles_set_trade_codes()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.trade_codes := CASE WHEN NEW.trades IS NULL THEN NULL ELSE
    ARRAY(SELECT DISTINCT public.to_trade_code(t) FROM unnest(NEW.trades) t WHERE btrim(coalesce(t,'')) <> '') END;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_jobs_set_trade_code ON public.jobs;
CREATE TRIGGER trg_jobs_set_trade_code BEFORE INSERT OR UPDATE OF trade ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.jobs_set_trade_code();
DROP TRIGGER IF EXISTS trg_profiles_set_trade_codes ON public.profiles;
CREATE TRIGGER trg_profiles_set_trade_codes BEFORE INSERT OR UPDATE OF trades ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_set_trade_codes();

-- Backfill existing rows.
UPDATE public.jobs SET trade_code = public.to_trade_code(trade) WHERE trade IS NOT NULL;
UPDATE public.profiles SET trade_codes = ARRAY(SELECT DISTINCT public.to_trade_code(t) FROM unnest(trades) t WHERE btrim(coalesce(t,'')) <> '') WHERE trades IS NOT NULL;
