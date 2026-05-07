-- Allow multiple tax rules per category (remove old single-rule constraint)
-- Change PK from (category_id, business_id) to (category_id, business_id, tax_rule_id)

ALTER TABLE category_tax_mapping DROP CONSTRAINT IF EXISTS category_tax_mapping_pkey;

ALTER TABLE category_tax_mapping 
    ADD CONSTRAINT category_tax_mapping_pkey 
    PRIMARY KEY (category_id, business_id, tax_rule_id);
