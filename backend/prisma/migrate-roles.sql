UPDATE `User` SET `role` = 'docente' WHERE `role` IN ('tutor', 'psicologo', 'apoderado');
UPDATE `ChatMessage` SET `senderRole` = 'docente' WHERE `senderRole` IN ('tutor', 'psicologo', 'apoderado');
UPDATE `Alert` SET `status` = 'nueva' WHERE `status` = 'abierta';
DELETE FROM `RolePermission` WHERE `roleId` IN (SELECT `id` FROM `Role` WHERE `codigo` IN ('tutor', 'psicologo', 'apoderado'));
DELETE FROM `Role` WHERE `codigo` IN ('tutor', 'psicologo', 'apoderado');
