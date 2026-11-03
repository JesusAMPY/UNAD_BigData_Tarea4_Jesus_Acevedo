# Instalación de MongoDB 7.0 en Ubuntu Server 22.04 (desde PuTTY)

Copia y pega **una línea a la vez** en PuTTY (clic derecho pega). Cuando pida contraseña, es la del usuario `vboxuser`.

```bash
sudo apt-get install -y gnupg curl git
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod --no-pager
mongosh --quiet --eval "db.version()"
```

`status` debe mostrar `active (running)` y el último comando la versión (7.0.x).

## Ejecutar los scripts

```bash
cd ~
git clone https://github.com/JesusAMPY/UNAD_BigData_Tarea4_Jesus_Acevedo.git
cd UNAD_BigData_Tarea4_Jesus_Acevedo
mongosh --quiet scripts/01_crear_bd_e_insertar.js
mongosh --quiet scripts/02_consultas_crud.js
mongosh --quiet scripts/03_filtros_operadores_join.js
mongosh --quiet scripts/04_agregaciones.js
```

Para ver la salida por partes (y tomar pantallazos más fáciles) se puede agregar `| less` al final de cada comando.

## Si `mongod` no arranca en VirtualBox

MongoDB 5.0 o superior necesita que el procesador tenga instrucciones **AVX**. Algunas máquinas virtuales de VirtualBox no las exponen y el servicio falla con `Illegal instruction` o `status=4/ILL`.

Opciones:

1. En Windows (PowerShell como administrador) ejecutar `bcdedit /set hypervisorlaunchtype off`, reiniciar el equipo y volver a probar.
2. Usar **MongoDB Atlas** (clúster gratuito M0) y conectarse desde la VM: `mongosh "mongodb+srv://<cluster>.mongodb.net/calidad_aire_aburra" --username <usuario> scripts/01_crear_bd_e_insertar.js`.
