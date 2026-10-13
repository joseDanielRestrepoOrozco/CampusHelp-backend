-- Datos Semilla (Seed) para CampusHelp
-- Base de datos: PostgreSQL

-- 1. Áreas iniciales
INSERT INTO area (id, nombre, descripcion, activa) VALUES
(1, 'Hardware', 'Equipos físicos y periféricos', true),
(2, 'Software', 'Sistemas operativos y programas institucionales', true),
(3, 'Red y conectividad', 'Conectividad cableada e inalámbrica', true),
(4, 'Cuentas y acceso', 'Gestión de cuentas institucionales y permisos', true),
(5, 'Plataformas académicas', 'Sistemas de apoyo a la docencia y gestión académica', true)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  activa = EXCLUDED.activa;

-- 2. Categorías iniciales por área
INSERT INTO categoria (id, area_id, nombre, descripcion, activa) VALUES
(1, 1, 'Computador', 'Problemas con torre, portátil o todo en uno', true),
(2, 1, 'Periférico', 'Teclado, mouse u otros dispositivos', true),
(3, 1, 'Proyector', 'Fallas de video o audio en salas', true),
(4, 1, 'Impresora', 'Impresoras institucionales y atascos', true),
(5, 2, 'Instalación', 'Instalación de software institucional autorizado', true),
(6, 2, 'Error de aplicación', 'Errores en ejecución o fallas de programas', true),
(7, 2, 'Actualización', 'Actualizaciones de paquetes y programas', true),
(8, 3, 'Wi-Fi', 'Red inalámbrica institucional', true),
(9, 3, 'Internet', 'Salida general a Internet y navegación', true),
(10, 3, 'Red cableada', 'Tomas de red y puertos Ethernet', true),
(11, 4, 'Contraseña', 'Restablecimiento y cambio de clave institucional', true),
(12, 4, 'Bloqueo de cuenta', 'Desbloqueo de cuentas por intentos fallidos', true),
(13, 4, 'Correo institucional', 'Buzón institucional y envío/recepción', true),
(14, 4, 'Permisos', 'Asignación de roles y permisos a recursos', true),
(15, 5, 'Campus virtual', 'Plataforma Moodle o campus en línea', true),
(16, 5, 'Sistema académico', 'Portal de notas, matrículas y registros', true)
ON CONFLICT (id) DO UPDATE SET
  area_id = EXCLUDED.area_id,
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  activa = EXCLUDED.activa;

-- 3. Usuarios de prueba
INSERT INTO usuario (id, nombre, correo, rol, activo) VALUES
(1, 'Laura Méndez', 'laura.mendez@campushelp.test', 'SOLICITANTE', true),
(2, 'Carlos Ruiz', 'carlos.ruiz@campushelp.test', 'SOLICITANTE', true),
(3, 'Andrés Pérez', 'andres.perez@campushelp.test', 'AGENTE', true),
(4, 'Marta Gómez', 'marta.gomez@campushelp.test', 'AGENTE', true),
(5, 'Sofía Rojas', 'sofia.rojas@campushelp.test', 'VALIDADOR', true),
(6, 'Admin TI', 'admin@campushelp.test', 'ADMINISTRADOR', true),
(7, 'Pedro Salas', 'pedro.salas@campushelp.test', 'AGENTE', false)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  correo = EXCLUDED.correo,
  rol = EXCLUDED.rol,
  activo = EXCLUDED.activo;

-- 4. Ajuste de secuencias para evitar colisiones con inserciones posteriores
SELECT setval(pg_get_serial_sequence('area', 'id'), COALESCE((SELECT MAX(id) FROM area), 1));
SELECT setval(pg_get_serial_sequence('categoria', 'id'), COALESCE((SELECT MAX(id) FROM categoria), 1));
SELECT setval(pg_get_serial_sequence('usuario', 'id'), COALESCE((SELECT MAX(id) FROM usuario), 1));
