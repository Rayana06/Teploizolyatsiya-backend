import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaterialCardDetails1795600000000 implements MigrationInterface {
  name = 'AddMaterialCardDetails1795600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE insulation_materials ADD COLUMN IF NOT EXISTS price_rub_m2 numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE insulation_materials ADD COLUMN IF NOT EXISTS brand varchar(100)`);
    await queryRunner.query(`ALTER TABLE insulation_materials ADD COLUMN IF NOT EXISTS application varchar(150)`);
    await queryRunner.query(`UPDATE insulation_materials SET price_rub_m2 = CASE insulation_material_id WHEN 1 THEN 281.60 WHEN 2 THEN 229.63 WHEN 3 THEN 322.22 WHEN 4 THEN 322.22 WHEN 5 THEN 1038.60 WHEN 6 THEN 1570.15 ELSE price_rub_m2 END WHERE insulation_material_id BETWEEN 1 AND 6`);
    await queryRunner.query(`UPDATE insulation_materials SET brand = CASE WHEN name ILIKE 'THERM%' THEN 'RAFINAD' ELSE 'ТЕХНОНИКОЛЬ' END WHERE brand IS NULL AND insulation_material_id BETWEEN 1 AND 6`);
    await queryRunner.query(`UPDATE insulation_materials SET application = CASE insulation_material_id WHEN 1 THEN 'Каркасные стены' WHEN 2 THEN 'Ненагружаемые конструкции' WHEN 3 THEN 'Полы и перекрытия' WHEN 4 THEN 'Фасады под штукатурку' WHEN 5 THEN 'Бани и сауны' WHEN 6 THEN 'Кровли и слоистые стены' END WHERE application IS NULL AND insulation_material_id BETWEEN 1 AND 6`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE insulation_materials DROP COLUMN IF EXISTS application`);
    await queryRunner.query(`ALTER TABLE insulation_materials DROP COLUMN IF EXISTS brand`);
    await queryRunner.query(`ALTER TABLE insulation_materials DROP COLUMN IF EXISTS price_rub_m2`);
  }
}
