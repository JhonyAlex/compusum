-- Canonicalización de identidad telefónica + exclusividad de perfil default.
-- Migración idempotente, NO destructiva y apta para `prisma migrate deploy`.

-- ============================================================================
-- 1) Backfill de teléfono al formato canónico: '57' + número local de 10
--    dígitos (ver src/lib/phone.ts).
--    - Solo toca filas locales de 10 dígitos VÁLIDAS (móvil ^3..., fijo
--      ^60...), consistente con canonicalColombiaPhone(). Las cuentas creadas
--      por OTP ya tenían '57...' (12 dígitos) y no se tocan.
--    - OMITE (nunca fusiona) filas cuya forma canónica YA exista en otra
--      cuenta: la colisión se reporta en el log del deploy con RAISE WARNING
--      y ambas cuentas siguen operando gracias a la búsqueda por variantes
--      (`phoneStorageVariants`). La resolución de esos duplicados es MANUAL.
--    - Idempotente: una vez migrada, la fila ya no calza en el patrón.
--    - Números con otros formatos (datos parciales o extranjeros históricos)
--      quedan intactos; la app los resuelve por email u otros contactos.
-- ============================================================================
DO $$
DECLARE
  skipped_collisions int;
BEGIN
  UPDATE "User"
  SET "phone" = '57' || "phone"
  WHERE "phone" ~ '^(3|60)[0-9]{8}$'
    AND NOT EXISTS (
      SELECT 1 FROM "User" other
      WHERE other."phone" = '57' || "User"."phone"
    );

  SELECT count(*) INTO skipped_collisions
  FROM "User"
  WHERE "phone" ~ '^(3|60)[0-9]{8}$';

  IF skipped_collisions > 0 THEN
    RAISE WARNING '[phone-canonicalization] % cuenta(s) con telefono local de 10 digitos NO migrada(s) por colision con su formato canonico (57XXXXXXXXXX). No se fusionaron usuarios: resolver manualmente. La app resuelve ambas formas via phoneStorageVariants().', skipped_collisions;
  END IF;
END $$;

-- ============================================================================
-- 2) Exclusividad de "isDefault" a nivel de base de datos.
--    IMPORTANTE: desde esta fase isDefault NO participa en la resolución
--    automática de precios (cliente sin perfil => precio base); queda como
--    dato informativo para uso futuro. Aun así se garantiza que exista a lo
--    sumo UN perfil default, incluso bajo escrituras concurrentes.
-- ============================================================================
UPDATE "PriceProfile" p
SET "isDefault" = false
WHERE p."isDefault" = true
  AND p."id" <> (
    SELECT id FROM "PriceProfile"
    WHERE "isDefault" = true
    ORDER BY "createdAt" ASC, "id" ASC
    LIMIT 1
  );

CREATE UNIQUE INDEX IF NOT EXISTS "PriceProfile_isDefault_one_row"
  ON "PriceProfile" ("isDefault")
  WHERE "isDefault";
